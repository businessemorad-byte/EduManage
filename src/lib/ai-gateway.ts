import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { calculateCredits, checkCredits, consumeCredits, refundCreditsIfFailed } from "@/lib/ai-credits";
import { emitEvent } from "@/lib/events";
import { getPlatformConfig, AI_ENV } from "@/lib/billing/platform-config";

// ─── Types ─────────────────────────────────────────────────────

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIRequestParams = {
  organizationId: string;
  userId?: string;
  modelId?: string;
  messages: AIMessage[];
  feature: string;
  maxTokens?: number;
  temperature?: number;
};

export type AIResponse = {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCost: number;
  creditsConsumed: number;
  usageId: string;
};

export type AIErrorResponse = {
  error: string;
  code: string;
  retryable: boolean;
};

// ─── Provider Interface ────────────────────────────────────────

export type AIProviderAdapter = {
  name: string;
  chat(params: {
    model: string;
    messages: AIMessage[];
    maxTokens?: number;
    temperature?: number;
    apiKey: string;
    baseUrl?: string;
  }): Promise<{
    content: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  }>;
};

const providers = new Map<string, AIProviderAdapter>();

export function registerAIProvider(adapter: AIProviderAdapter) {
  providers.set(adapter.name, adapter);
}

function getProvider(name: string): AIProviderAdapter {
  const adapter = providers.get(name);
  if (!adapter) throw new Error(`AI provider "${name}" not registered`);
  return adapter;
}

// ─── Model Router ──────────────────────────────────────────────

/**
 * Lazily provisions the platform-default provider/model rows for an
 * organization so usage records have a concrete model to reference.
 * The platform owner changes the default via platform billing config;
 * no AI feature code needs to change.
 */
async function ensurePlatformDefaultModel(organizationId: string) {
  const config = await getPlatformConfig();

  const apiKey = process.env[AI_ENV.apiKey] ?? "";

  const provider = await db.aIProvider.upsert({
    where: { organizationId_name: { organizationId, name: config.aiProviderName } },
    update: { baseUrl: config.aiBaseUrl ?? undefined },
    create: {
      organizationId,
      name: config.aiProviderName,
      displayName: `${config.aiProviderName} (platform)`,
      apiKey,
      baseUrl: config.aiBaseUrl,
    },
  });

  return db.aIModel.upsert({
    where: { organizationId_modelId: { organizationId, modelId: config.aiModelId } },
    update: { isActive: true },
    create: {
      organizationId,
      providerId: provider.id,
      modelId: config.aiModelId,
      displayName: config.aiModelDisplayName,
      capabilities: ["chat"],
      inputCostPer1K: new Prisma.Decimal(0),
      outputCostPer1K: new Prisma.Decimal(0),
      maxTokens: 4096,
      tier: "CORE",
      isDefault: true,
    },
    include: { provider: true },
  });
}

export async function resolveModel(organizationId: string, modelId?: string) {
  if (modelId) {
    const model = await db.aIModel.findFirst({
      where: { organizationId, modelId, isActive: true },
      include: { provider: true },
    });
    if (model) return model;
  }

  // Fallback: find default model for organization
  const model = await db.aIModel.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
    include: { provider: true },
  });

  if (model) return model;

  // Fallback: any active model
  const anyModel = await db.aIModel.findFirst({
    where: { organizationId, isActive: true },
    include: { provider: true },
    orderBy: { createdAt: "asc" },
  });

  if (anyModel) return anyModel;

  // Last resort: provision the platform-configured default model.
  try {
    return await ensurePlatformDefaultModel(organizationId);
  } catch {
    return null;
  }
}

function resolveApiKey(providerApiKey: string): string {
  // Prefer the per-provider stored key; fall back to the secure
  // server-side environment key. Never exposed to clients.
  return providerApiKey || process.env[AI_ENV.apiKey] || "";
}

// ─── Main Gateway ──────────────────────────────────────────────

export async function aiRequest(
  params: AIRequestParams
): Promise<AIResponse | AIErrorResponse> {
  // 0. Server-side credit gate: exhausted credits reject the request
  //    before any provider call, regardless of what the UI allows.
  const creditCheck = await checkCredits(params.organizationId);
  if (!creditCheck.allowed) {
    return {
      error: "Vos crédits IA sont épuisés.",
      code: "CREDITS_EXHAUSTED",
      retryable: false,
    };
  }

  // 1. Resolve model
  const model = await resolveModel(params.organizationId, params.modelId);
  if (!model) {
    return { error: "No AI model configured", code: "NO_MODEL", retryable: false };
  }

  const adapter = getProvider(model.provider.name);

  // 2. Estimate maximum credits based on model limits
  //    Input estimated from message content; output at model maxTokens.
  const estimatedInputTokens = Math.max(
    1,
    Math.ceil(params.messages.reduce((sum, m) => sum + m.content.length, 0) / 4)
  );
  const estimatedCredits = calculateCredits({
    inputTokens: Math.min(estimatedInputTokens, model.maxTokens),
    outputTokens: model.maxTokens,
    modelTier: model.tier,
    feature: params.feature,
  });

  // 3. Create usage record (pending)
  const usage = await db.aIUsage.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      modelId: model.id,
      feature: params.feature,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      creditsConsumed: 0,
      status: "PENDING",
    },
  });

  // 4. Pre-reserve credits BEFORE calling the provider.
  //    This prevents wasteful provider calls when credits are
  //    insufficient and eliminates the race condition where two
  //    concurrent requests both pass checkCredits().
  const reservation = await consumeCredits(
    params.organizationId,
    estimatedCredits,
    usage.id,
    `Reservation: AI ${params.feature} (${model.modelId})`
  );
  if (!reservation.success) {
    await db.aIUsage.update({
      where: { id: usage.id },
      data: { status: "RATE_LIMITED" },
    });
    return {
      error: "Vos crédits IA sont épuisés.",
      code: "CREDITS_EXHAUSTED",
      retryable: false,
    };
  }

  try {
    // 5. Call provider
    const result = await adapter.chat({
      model: model.modelId,
      messages: params.messages,
      maxTokens: params.maxTokens ?? model.maxTokens,
      temperature: params.temperature,
      apiKey: resolveApiKey(model.provider.apiKey),
      baseUrl: model.provider.baseUrl ?? undefined,
    });

    // 6. Calculate actual cost
    const cost = new Prisma.Decimal(result.inputTokens)
      .div(1000)
      .mul(model.inputCostPer1K)
      .add(new Prisma.Decimal(result.outputTokens).div(1000).mul(model.outputCostPer1K));

    // 7. Calculate actual credits
    const actualCredits = calculateCredits({
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      modelTier: model.tier,
      feature: params.feature,
    });

    // 8. Refund the delta if we over-estimated
    const delta = estimatedCredits - actualCredits;
    if (delta > 0) {
      await refundCreditsIfFailed(
        params.organizationId,
        delta,
        `${usage.id}-adjust`,
        `Credit adjustment: estimated ${estimatedCredits}, actual ${actualCredits}`
      );
    }

    // 9. Update usage record to reflect actual values
    await db.aIUsage.update({
      where: { id: usage.id },
      data: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cachedTokens: result.cachedTokens,
        estimatedCost: cost,
        creditsConsumed: actualCredits,
        status: "SUCCESS",
      },
    });

    await emitEvent({
      type: "ai.request.completed",
      organizationId: params.organizationId,
      userId: params.userId,
      payload: { usageId: usage.id, model: model.modelId, credits: actualCredits },
    });

    return {
      content: result.content,
      model: model.modelId,
      provider: model.provider.name,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedTokens: result.cachedTokens,
      estimatedCost: Number(cost),
      creditsConsumed: actualCredits,
      usageId: usage.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // 10. Refund the full pre-reserved amount on failure.
    //     This is idempotent: refundCreditsIfFailed checks for an
    //     existing REFUND transaction with the same referenceId.
    await refundCreditsIfFailed(
      params.organizationId,
      estimatedCredits,
      usage.id,
      `Refund: AI request failed (${errorMessage})`
    );

    await db.aIUsage.update({
      where: { id: usage.id },
      data: { status: "FAILED", errorMessage },
    });

    return {
      error: "Erreur du fournisseur IA. Les crédits ont été restaurés.",
      code: "PROVIDER_ERROR",
      retryable: true,
    };
  }
}

// ─── Provider Admin ────────────────────────────────────────────

export async function listProviders(organizationId: string) {
  return db.aIProvider.findMany({
    where: { organizationId },
    select: { id: true, name: true, displayName: true, baseUrl: true, isActive: true, organizationId: true, createdAt: true, updatedAt: true, models: true },
  });
}

export async function createProvider(data: {
  organizationId: string;
  name: string;
  displayName: string;
  apiKey: string;
  baseUrl?: string;
}) {
  return db.aIProvider.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      displayName: data.displayName,
      apiKey: data.apiKey,
      baseUrl: data.baseUrl,
    },
  });
}

export async function listModels(organizationId: string) {
  return db.aIModel.findMany({
    where: { organizationId },
    include: { provider: { select: { name: true, displayName: true } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function createModel(data: {
  organizationId: string;
  providerId: string;
  modelId: string;
  displayName: string;
  capabilities?: string[];
  inputCostPer1K: number;
  outputCostPer1K: number;
  maxTokens?: number;
  tier?: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await db.aIModel.updateMany({
      where: { organizationId: data.organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return db.aIModel.create({
    data: {
      organizationId: data.organizationId,
      providerId: data.providerId,
      modelId: data.modelId,
      displayName: data.displayName,
      capabilities: data.capabilities ?? ["chat"],
      inputCostPer1K: new Prisma.Decimal(data.inputCostPer1K),
      outputCostPer1K: new Prisma.Decimal(data.outputCostPer1K),
      maxTokens: data.maxTokens ?? 4096,
      tier: data.tier ?? "CORE",
      isDefault: data.isDefault ?? false,
    },
  });
}

export async function getUsageStats(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, byModel, byFeature] = await Promise.all([
    db.aIUsage.aggregate({
      where: { organizationId, createdAt: { gte: since } },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true, estimatedCost: true, creditsConsumed: true },
    }),
    db.aIUsage.groupBy({
      by: ["modelId"],
      where: { organizationId, createdAt: { gte: since } },
      _count: true,
      _sum: { estimatedCost: true, creditsConsumed: true },
    }),
    db.aIUsage.groupBy({
      by: ["feature"],
      where: { organizationId, createdAt: { gte: since } },
      _count: true,
      _sum: { estimatedCost: true, creditsConsumed: true },
    }),
  ]);

  return { total, byModel, byFeature };
}


