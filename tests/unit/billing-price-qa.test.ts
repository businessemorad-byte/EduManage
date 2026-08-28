import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ db: {} }));

import { calculatePrice, calculateMonthlyPrice } from "@/lib/billing/plans";

describe("Billing QA - calculatePrice (yearly pricing semantics)", () => {
  // priceYearly is the TOTAL amount billed once per year (e.g. 6990 MAD
  // for a 699/month plan = two months free). It is NOT a per-month unit.
  const plan = { priceMonthly: 699, priceYearly: 6990 };

  it("returns priceMonthly for MONTHLY billing", () => {
    expect(calculatePrice(plan, "MONTHLY")).toBe(699);
  });

  it("returns priceYearly as-is for YEARLY billing (no *12 overcharge)", () => {
    expect(calculatePrice(plan, "YEARLY")).toBe(6990);
  });

  it("never multiplies the yearly total by 12", () => {
    expect(calculatePrice(plan, "YEARLY")).not.toBe(6990 * 12);
    expect(calculatePrice(plan, "YEARLY")).toBeLessThan(6990 * 12);
  });

  it("falls back to priceMonthly when priceYearly is null", () => {
    expect(calculatePrice({ priceMonthly: 499, priceYearly: null }, "YEARLY")).toBe(499);
  });

  it("returns 0 when no monthly price is set", () => {
    expect(calculatePrice({ priceMonthly: null, priceYearly: null }, "MONTHLY")).toBe(0);
  });

  it("keeps the monthly-equivalent helper consistent with the annual total", () => {
    // calculateMonthlyPrice shows what the yearly total means per month.
    expect(calculateMonthlyPrice(plan, "YEARLY")).toBeCloseTo(6990 / 12, 5);
    expect(calculateMonthlyPrice(plan, "MONTHLY")).toBe(699);
  });
});