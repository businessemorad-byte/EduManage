import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import {
  getPlatformConfig,
  updatePlatformConfig,
  AI_ENV,
} from "@/lib/billing/platform-config";
import { PROMOTION_CONFIG, CREDIT_PACKAGES, ANNUAL_BILLING_CONFIG } from "@/lib/billing-config";

// ─── Platform Billing Config (PLATFORM_OWNER only) ────────────
// Runtime-editable promotion flag + AI model selection.
// The AI API key is NEVER stored in or returned by this API —
// the owner sets it via the AI_API_KEY server environment variable.

export async function GET() {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  const config = await getPlatformConfig();

  const aiKeyConfigured = Boolean(process.env[AI_ENV.apiKey]);

  return NextResponse.json({
    promotion: {
      active: config.promoActive,
      firstMonthDiscountPct: PROMOTION_CONFIG.firstMonthDiscountPct,
      label: config.promoActive ? `-${PROMOTION_CONFIG.firstMonthDiscountPct}% sur le 1er mois` : "",
    },
    creditPackages: CREDIT_PACKAGES,
    annualBilledMonths: ANNUAL_BILLING_CONFIG.billedMonths,
    ai: {
      providerName: config.aiProviderName,
      modelId: config.aiModelId,
      modelDisplayName: config.aiModelDisplayName,
      baseUrl: config.aiBaseUrl,
      apiKeyConfigured: aiKeyConfigured,
      source: aiKeyConfigured ? "env" as const : "none" as const,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const data: Parameters<typeof updatePlatformConfig>[0] = {};

    if (body.promoActive !== undefined) data.promoActive = Boolean(body.promoActive);
    if (body.aiProviderName !== undefined && body.aiProviderName !== "") data.aiProviderName = String(body.aiProviderName);
    if (body.aiModelId !== undefined && body.aiModelId !== "") data.aiModelId = String(body.aiModelId);
    if (body.aiModelDisplayName !== undefined) data.aiModelDisplayName = String(body.aiModelDisplayName);
    if (body.aiBaseUrl !== undefined) data.aiBaseUrl = body.aiBaseUrl ? String(body.aiBaseUrl) : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await updatePlatformConfig(data);
    const config = await getPlatformConfig();
    return NextResponse.json({ config });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
