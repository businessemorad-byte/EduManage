import { db } from "@/lib/prisma";
import { getEntitlementLimit, checkUsageLimit } from "@/lib/entitlements";
import type { FeatureKey } from "@/lib/constants";

// ─── Track Usage ──────────────────────────────────────────────

export async function recordUsage(organizationId: string, featureKey: string, quantity = 1) {
  return db.usageRecord.create({
    data: {
      organizationId,
      featureKey,
      quantity,
      periodStart: getCurrentPeriodStart(),
    },
  });
}

export async function getUsage(organizationId: string, featureKey: string): Promise<number> {
  const periodStart = getCurrentPeriodStart();
  const result = await db.usageRecord.aggregate({
    where: {
      organizationId,
      featureKey,
      periodStart: { gte: periodStart },
    },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function checkLimit(organizationId: string, featureKey: FeatureKey) {
  const currentUsage = await getUsage(organizationId, featureKey);
  return checkUsageLimit(organizationId, featureKey, currentUsage);
}

// ─── Usage Dashboard ──────────────────────────────────────────

export type UsageItem = {
  featureKey: string;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  percentage: number | null;
};

const USAGE_LABELS: Record<string, string> = {
  MAX_STUDENTS: "Students",
  MAX_TEACHERS: "Teachers",
  MAX_STAFF: "Staff",
  MAX_GROUPS: "Groups",
  MAX_BRANCHES: "Branches",
  MAX_STORAGE_MB: "Storage (MB)",
  MAX_EMAILS: "Emails",
  MAX_SMS: "SMS",
  MAX_WHATSAPP: "WhatsApp",
  AI_CREDITS_MONTHLY: "AI Credits",
};

export async function getUsageDashboard(organizationId: string): Promise<UsageItem[]> {
  const featureKeys = Object.keys(USAGE_LABELS);
  const items: UsageItem[] = [];

  for (const key of featureKeys) {
    const used = await getUsage(organizationId, key);
    const limit = await getEntitlementLimit(organizationId, key as FeatureKey);

    const remaining = limit !== null ? Math.max(0, limit - used) : null;
    const percentage = limit !== null ? Math.min(100, Math.round((used / limit) * 100)) : null;

    items.push({
      featureKey: key,
      label: USAGE_LABELS[key] ?? key,
      used,
      limit,
      remaining,
      percentage,
    });
  }

  return items;
}

// ─── Helpers ──────────────────────────────────────────────────

function getCurrentPeriodStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
