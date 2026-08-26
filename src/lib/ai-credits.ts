import { db } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────

export type CreditCheckResult = {
  allowed: boolean;
  remaining: number;
  softWarning: boolean;
  usagePct: number;
};

export type CreditConsumeResult = {
  success: boolean;
  remaining: number;
  transactionId?: string;
};

// ─── Credit Policy ─────────────────────────────────────────────

// Multiplier: how many credits per token based on model complexity
const TIER_MULTIPLIERS: Record<string, number> = {
  CORE: 1,
  ADVANCED: 3,
  ENTERPRISE: 5,
};

export function calculateCredits(params: {
  inputTokens: number;
  outputTokens: number;
  modelTier: string;
  feature: string;
}): number {
  const base = params.inputTokens + params.outputTokens * 2; // output weighted 2x
  const multiplier = TIER_MULTIPLIERS[params.modelTier] ?? 1;
  return Math.ceil((base / 1000) * multiplier);
}

// ─── Get or Create Balance ─────────────────────────────────────

export async function getBalance(organizationId: string) {
  let balance = await db.aICreditBalance.findUnique({
    where: { organizationId },
  });

  if (!balance) {
    balance = await db.aICreditBalance.create({
      data: { organizationId },
    });
  }

  // Auto-reset if period expired
  const now = new Date();
  if (balance.periodEnd && now > balance.periodEnd) {
    balance = await db.aICreditBalance.update({
      where: { id: balance.id },
      data: {
        usedThisMonth: 0,
        periodStart: now,
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      },
    });
  }

  return balance;
}

export async function getRemainingCredits(organizationId: string): Promise<number> {
  const balance = await getBalance(organizationId);
  return computeRemaining(balance);
}

/**
 * Remaining credits = unused included monthly allowance + purchased extras.
 */
export function computeRemaining(balance: {
  monthlyAllowance: number;
  usedThisMonth: number;
  extraCredits: number;
}): number {
  const availableMonthly = Math.max(0, balance.monthlyAllowance - balance.usedThisMonth);
  return Math.max(0, availableMonthly + balance.extraCredits);
}

// ─── Monthly Allocation ────────────────────────────────────────

/**
 * Allocates/resets the plan's included monthly credits at the start
 * of a new billing period. Purchased extra credits are NEVER reset.
 */
export async function allocateMonthlyCredits(params: {
  organizationId: string;
  monthlyAllowance: number;
  periodStart?: Date;
  periodEnd?: Date;
}) {
  const now = params.periodStart ?? new Date();
  const periodEnd =
    params.periodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let balance = await db.aICreditBalance.findUnique({
    where: { organizationId: params.organizationId },
  });

  if (!balance) {
    balance = await db.aICreditBalance.create({
      data: { organizationId: params.organizationId },
    });
  }

  return db.aICreditBalance.update({
    where: { id: balance.id },
    data: {
      monthlyAllowance: params.monthlyAllowance,
      usedThisMonth: 0,
      periodStart: now,
      periodEnd,
    },
  });
}

// ─── Check Credits ─────────────────────────────────────────────

export async function checkCredits(organizationId: string): Promise<CreditCheckResult> {
  const balance = await getBalance(organizationId);
  const total = balance.monthlyAllowance + balance.extraCredits;
  const remaining = computeRemaining(balance);

  if (total === 0 || remaining <= 0) {
    return { allowed: false, remaining: 0, softWarning: true, usagePct: 100 };
  }

  const usagePct = Math.min(100, Math.round(((total - remaining) / total) * 100));
  const softWarning = usagePct >= balance.softLimitPct;
  const blocked = usagePct >= balance.hardLimitPct;

  return {
    allowed: !blocked,
    remaining,
    softWarning,
    usagePct,
  };
}

// ─── Consume Credits ───────────────────────────────────────────

/**
 * Consumes credits from the included monthly pool first; any
 * overflow is taken from purchased extra credits (which are
 * therefore never restored by the monthly reset).
 */
export async function consumeCredits(
  organizationId: string,
  amount: number,
  usageId: string,
  description?: string
): Promise<CreditConsumeResult> {
  // Use a transaction to prevent race conditions from concurrent credit consumption
  return db.$transaction(async (tx) => {
    const balance = await tx.aICreditBalance.findUnique({
      where: { organizationId },
      select: { id: true, monthlyAllowance: true, usedThisMonth: true, extraCredits: true },
    });

    if (!balance) {
      return { success: false, remaining: 0 };
    }

    const availableMonthly = Math.max(0, balance.monthlyAllowance - balance.usedThisMonth);
    const totalAvailable = availableMonthly + balance.extraCredits;

    if (totalAvailable < amount) {
      return { success: false, remaining: Math.max(0, balance.extraCredits + availableMonthly) };
    }

    const fromMonthly = Math.min(amount, availableMonthly);
    const fromExtra = amount - fromMonthly;

    const updated = await tx.aICreditBalance.update({
      where: { id: balance.id },
      data: {
        usedThisMonth: { increment: fromMonthly },
        ...(fromExtra > 0 ? { extraCredits: { decrement: fromExtra } } : {}),
      },
    });

    const transaction = await tx.aICreditTransaction.create({
      data: {
        organizationId,
        balanceId: balance.id,
        type: "CONSUME",
        amount: -amount,
        description: description ?? `AI usage for ${usageId}`,
        referenceId: usageId,
      },
    });

    const remainingTotal = updated.monthlyAllowance + updated.extraCredits - updated.usedThisMonth;
    return { success: true, remaining: Math.max(0, remainingTotal), transactionId: transaction.id };
  });
}

// ─── Refund Credits (on failed request) ────────────────────────

export async function refundCreditsIfFailed(
  organizationId: string,
  amount: number,
  usageId: string,
  reason?: string
): Promise<CreditConsumeResult> {
  return db.$transaction(async (tx) => {
    // Idempotency guard: if a REFUND for this reference already exists,
    // skip to prevent double refunds.
    const existingRefund = await tx.aICreditTransaction.findFirst({
      where: { organizationId, referenceId: usageId, type: "REFUND" },
    });
    if (existingRefund) {
      const balance = await tx.aICreditBalance.findUnique({
        where: { organizationId },
        select: { monthlyAllowance: true, usedThisMonth: true, extraCredits: true },
      });
      if (!balance) return { success: false, remaining: 0 };
      return {
        success: true,
        remaining: Math.max(0, balance.monthlyAllowance + balance.extraCredits - balance.usedThisMonth),
        transactionId: existingRefund.id,
      };
    }

    const balance = await tx.aICreditBalance.findUnique({
      where: { organizationId },
      select: { id: true, monthlyAllowance: true, usedThisMonth: true, extraCredits: true },
    });

    if (!balance) {
      return { success: false, remaining: 0 };
    }

    // Refund back into the included monthly pool first, overflow to extras.
    const refundedToMonthly = Math.min(amount, Math.max(0, balance.usedThisMonth));
    const refundedToExtra = amount - refundedToMonthly;

    await tx.aICreditBalance.update({
      where: { id: balance.id },
      data: {
        usedThisMonth: { decrement: refundedToMonthly },
        ...(refundedToExtra > 0 ? { extraCredits: { increment: refundedToExtra } } : {}),
      },
    });

    const transaction = await tx.aICreditTransaction.create({
      data: {
        organizationId,
        balanceId: balance.id,
        type: "REFUND",
        amount,
        description: reason ?? `Refund for failed usage ${usageId}`,
        referenceId: usageId,
      },
    });

    const total = balance.monthlyAllowance + balance.extraCredits;
    return {
      success: true,
      remaining: Math.max(0, total - (balance.usedThisMonth - amount)),
      transactionId: transaction.id,
    };
  });
}

// ─── Grant Credits ─────────────────────────────────────────────

export async function grantCredits(
  organizationId: string,
  amount: number,
  description?: string
) {
  return db.$transaction(async (tx) => {
    const balance = await tx.aICreditBalance.findFirst({
      where: { organizationId },
    });

    if (!balance) throw new Error("Credit balance not found for organization");

    await tx.aICreditBalance.update({
      where: { id: balance.id },
      data: { extraCredits: { increment: amount } },
    });

    return tx.aICreditTransaction.create({
      data: {
        organizationId,
        balanceId: balance.id,
        type: "GRANT",
        amount,
        description: description ?? "Credits granted",
      },
    });
  });
}

// ─── Credit History ────────────────────────────────────────────

export async function getCreditHistory(organizationId: string, limit = 50) {
  return db.aICreditTransaction.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
