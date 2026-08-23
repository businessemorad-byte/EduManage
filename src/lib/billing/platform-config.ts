import { db } from "@/lib/prisma";
import { PROMOTION_CONFIG } from "@/lib/billing-config";

// ─── Platform Config (singleton, editable by PLATFORM_OWNER) ──
// Defaults come from the centralized billing configuration; the
// platform owner can override the promotion flag and AI model at
// runtime without a deploy. The AI API key is NEVER stored here —
// it lives in server-side env variables only.

export type EffectivePlatformConfig = {
  promoActive: boolean;
  aiProviderName: string;
  aiModelId: string;
  aiModelDisplayName: string;
  aiBaseUrl: string | null;
};

export const AI_ENV = {
  providerName: "AI_PROVIDER_NAME",
  modelId: "AI_MODEL_ID",
  modelDisplayName: "AI_MODEL_DISPLAY_NAME",
  baseUrl: "AI_BASE_URL",
  apiKey: "AI_API_KEY",
} as const;

export async function getPlatformConfig(): Promise<EffectivePlatformConfig> {
  let record = null;
  try {
    record = await db.platformConfig.findUnique({ where: { id: "singleton" } });
  } catch {
    // Table may not exist yet in fresh environments; fall back to defaults.
  }

  return {
    promoActive: record?.promoActive ?? PROMOTION_CONFIG.active,
    aiProviderName:
      record?.aiProviderName ??
      process.env[AI_ENV.providerName] ??
      "openrouter",
    aiModelId:
      record?.aiModelId ??
      process.env[AI_ENV.modelId] ??
      "openrouter/auto",
    aiModelDisplayName:
      record?.aiModelDisplayName ??
      process.env[AI_ENV.modelDisplayName] ??
      "Default AI Model",
    aiBaseUrl:
      record?.aiBaseUrl ??
      process.env[AI_ENV.baseUrl] ??
      null,
  };
}

export type PlatformConfigUpdate = {
  promoActive?: boolean;
  aiProviderName?: string;
  aiModelId?: string;
  aiModelDisplayName?: string;
  aiBaseUrl?: string | null;
};

export async function updatePlatformConfig(data: PlatformConfigUpdate) {
  return db.platformConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
}
