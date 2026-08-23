import { hasEntitlement } from "@/lib/entitlements";
import { FeatureKey } from "@/lib/constants";
import { checkCredits } from "@/lib/ai-credits";
import { hasPermission, type PermissionKey } from "@/lib/rbac";

// ─── AI Request Protection ────────────────────────────────────
// Quota checks BEFORE any AI call. Permission enforcement.

export type ProtectionCheckResult = {
  allowed: boolean;
  error?: string;
  code?: string;
};

export async function checkAIProtection(organizationId: string, userId: string, requiredPermission?: PermissionKey): Promise<ProtectionCheckResult> {
  // 1. Entitlement check
  const aiEnabled = await hasEntitlement(organizationId, FeatureKey.AI_ENABLED);
  if (!aiEnabled) {
    return { allowed: false, error: "AI not available on your plan", code: "AI_DISABLED" };
  }

  // 2. Credit check
  const creditCheck = await checkCredits(organizationId);
  if (!creditCheck.allowed) {
    return {
      allowed: false,
      error: "Vos crédits IA sont épuisés.",
      code: "CREDITS_EXHAUSTED",
    };
  }

  // 3. Permission check
  if (requiredPermission) {
    const has = await hasPermission(userId, organizationId, requiredPermission);
    if (!has) {
      return {
        allowed: false,
        error: `Missing required permission: ${requiredPermission}`,
        code: "FORBIDDEN",
      };
    }
  }

  return { allowed: true };
}

export async function checkAICreditWarning(organizationId: string): Promise<{ warning: boolean; usagePct: number; remaining: number }> {
  const creditCheck = await checkCredits(organizationId);
  return {
    warning: creditCheck.softWarning,
    usagePct: creditCheck.usagePct,
    remaining: creditCheck.remaining,
  };
}
