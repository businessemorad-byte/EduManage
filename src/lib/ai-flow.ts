import { hasEntitlement } from "@/lib/entitlements";
import { FeatureKey } from "@/lib/constants";
import { checkCredits } from "@/lib/ai-credits";
import { aiRequest, registerAIProvider, type AIRequestParams, type AIResponse } from "@/lib/ai-gateway";
import { OpenRouterProvider } from "@/lib/providers/openrouter";
import { audit } from "@/lib/events";

// Register providers once
registerAIProvider(OpenRouterProvider);

export type AIExecutionResult = {
  success: boolean;
  response?: AIResponse;
  error?: string;
  code?: string;
};

// ─── Full AI Request Flow ──────────────────────────────────────

export async function executeAIRequest(
  params: AIRequestParams
): Promise<AIExecutionResult> {
  // 1. Plan entitlement check
  const aiEnabled = await hasEntitlement(params.organizationId, FeatureKey.AI_ENABLED);
  if (!aiEnabled) {
    return { success: false, error: "AI not available on your plan", code: "AI_DISABLED" };
  }

  // 2. Credit check
  const creditCheck = await checkCredits(params.organizationId);
  if (!creditCheck.allowed) {
    return {
      success: false,
      error: "Vos crédits IA sont épuisés. Achetez des crédits supplémentaires ou attendez le renouvellement mensuel.",
      code: "CREDITS_EXHAUSTED",
    };
  }

  // 3. Execute through gateway (the gateway checks credits again
  //    server-side and consumes them itself after a successful call —
  //    consumption happens exactly once, inside the gateway).
  const result = await aiRequest(params);

  // 4. Handle provider error
  if ("error" in result) {
    await audit({
      organizationId: params.organizationId,
      userId: params.userId,
      action: "ai.request.failed",
      resource: "AIUsage",
      metadata: { feature: params.feature, error: result.error, code: result.code },
    });
    return { success: false, error: result.error, code: result.code };
  }

  // 5. Audit (credits already consumed exactly once by the gateway)
  await audit({
    organizationId: params.organizationId,
    userId: params.userId,
    action: "ai.request.completed",
    resource: "AIUsage",
    resourceId: result.usageId,
    metadata: {
      model: result.model,
      provider: result.provider,
      feature: params.feature,
      credits: result.creditsConsumed,
      cost: result.estimatedCost,
    },
  });

  return { success: true, response: result };
}
