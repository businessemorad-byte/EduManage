import { db } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────

export type CouponCreate = {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  currency?: string;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
};

// ─── CRUD ──────────────────────────────────────────────────────

export async function createCoupon(data: CouponCreate) {
  return db.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency: data.currency ?? null,
      maxUses: data.maxUses ?? null,
      validFrom: data.validFrom ?? new Date(),
      validUntil: data.validUntil ?? null,
    },
  });
}

export async function getCoupon(code: string) {
  return db.coupon.findUnique({ where: { code: code.toUpperCase() } });
}

export async function listCoupons() {
  return db.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deactivateCoupon(id: string) {
  return db.coupon.update({ where: { id }, data: { isActive: false } });
}

// ─── Validation ───────────────────────────────────────────────

export type CouponValidation = {
  valid: boolean;
  error?: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
};

export async function validateCoupon(code: string, organizationId: string, _amount: number): Promise<CouponValidation> {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon) return { valid: false, error: "Coupon not found" };
  if (!coupon.isActive) return { valid: false, error: "Coupon is inactive" };

  const now = new Date();
  if (now < coupon.validFrom) return { valid: false, error: "Coupon is not yet valid" };
  if (coupon.validUntil && now > coupon.validUntil) return { valid: false, error: "Coupon has expired" };

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Coupon usage limit reached" };
  }

  if (coupon.currency) {
    const sub = await db.subscription.findFirst({ where: { organizationId } });
    const plan = sub ? await db.plan.findUnique({ where: { id: sub.planId } }) : null;
    if (plan && plan.currency !== coupon.currency) {
      return { valid: false, error: "Coupon is not valid for this currency" };
    }
  }

  const alreadyUsed = await db.couponUsage.findFirst({
    where: { couponId: coupon.id, organizationId },
  });
  if (alreadyUsed) return { valid: false, error: "Coupon already used by this organization" };

  return {
    valid: true,
    couponId: coupon.id,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
  };
}

// ─── Apply Discount ──────────────────────────────────────────

export function calculateDiscount(discountType: string, discountValue: number, subtotal: number): number {
  if (discountType === "PERCENTAGE") {
    return Math.round(subtotal * discountValue) / 100;
  }
  return Math.min(discountValue, subtotal);
}

export async function recordCouponUsage(couponId: string, organizationId: string, invoiceId?: string) {
  await db.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  return db.couponUsage.create({ data: { couponId, organizationId, invoiceId: invoiceId ?? null } });
}
