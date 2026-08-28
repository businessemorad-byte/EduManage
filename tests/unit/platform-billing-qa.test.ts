import { describe, it, expect } from "vitest";
import {
  serializePlatformPlan,
  parsePlatformPlanPatch,
  orgTypeKeyFromPlanCode,
  formatPlanAmount,
} from "@/lib/billing/platform-plans";
import { AI_CREDITS_MONTHLY } from "@/lib/billing-config";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    code: "STANDARD",
    displayName: "Standard",
    priceMonthly: 1499,
    priceYearly: 14990,
    isActive: true,
    sortOrder: 2,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("platform-plan DTO serialization", () => {
  it("derives aiCreditsMonthly for every tier plan code", () => {
    expect(serializePlatformPlan(row({ code: "STARTER" })).aiCreditsMonthly)
      .toBe(AI_CREDITS_MONTHLY.starter);
    expect(serializePlatformPlan(row({ code: "STANDARD" })).aiCreditsMonthly)
      .toBe(AI_CREDITS_MONTHLY.standard);
    expect(serializePlatformPlan(row({ code: "PRO" })).aiCreditsMonthly)
      .toBe(AI_CREDITS_MONTHLY.pro);
    expect(serializePlatformPlan(row({ code: "ULTIMATE" })).aiCreditsMonthly)
      .toBe(AI_CREDITS_MONTHLY.ultimate);
  });

  it("returns null aiCreditsMonthly for custom plans", () => {
    expect(serializePlatformPlan(row({ code: "CUSTOM" })).aiCreditsMonthly).toBeNull();
  });

  it("serializes null/undefined plan prices as null DTO fields", () => {
    const plan = serializePlatformPlan(
      row({ priceMonthly: null, priceYearly: undefined as unknown })
    );
    expect(plan.priceMonthlyMad).toBeNull();
    expect(plan.priceYearlyMad).toBeNull();
  });

  it("coerces Decimal/string prices to numbers", () => {
    const plan = serializePlatformPlan(
      row({ priceMonthly: "3500.00", priceYearly: 34990 })
    );
    expect(plan.priceMonthlyMad).toBe(3500);
    expect(plan.priceYearlyMad).toBe(34990);
  });

  it("derives orgTypeKey from code prefixes and null otherwise", () => {
    expect(orgTypeKeyFromPlanCode("PS_STARTER")).toBe("PRIVATE_SCHOOL");
    expect(orgTypeKeyFromPlanCode("SC_PRO")).toBe("SUPPORT_CENTER");
    expect(orgTypeKeyFromPlanCode("TC_ULTIMATE")).toBe("TRAINING_CENTER");
    expect(orgTypeKeyFromPlanCode("STANDARD")).toBeNull();
  });

  it("passes through identity fields", () => {
    const plan = serializePlatformPlan(row({ id: "abc", displayName: "Pro", isActive: false, sortOrder: 3, status: "ARCHIVED" }));
    expect(plan.id).toBe("abc");
    expect(plan.code).toBe("STANDARD");
    expect(plan.displayName).toBe("Pro");
    expect(plan.isActive).toBe(false);
    expect(plan.sortOrder).toBe(3);
    expect(plan.status).toBe("ARCHIVED");
  });
});

describe("parsePlatformPlanPatch", () => {
  it("requires planId", () => {
    expect(parsePlatformPlanPatch({}).ok).toBe(false);
    expect(parsePlatformPlanPatch(null).ok).toBe(false);
  });

  it("maps priceMonthlyMad/priceYearlyMad to DB fields", () => {
    const r = parsePlatformPlanPatch({ planId: "p1", priceMonthlyMad: 699, priceYearlyMad: 6990 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ priceMonthly: 699, priceYearly: 6990 });
  });

  it("lets null clear a price (sur devis)", () => {
    const r = parsePlatformPlanPatch({ planId: "p1", priceMonthlyMad: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.priceMonthly).toBeNull();
  });

  it("rejects negative or non-numeric prices", () => {
    expect(parsePlatformPlanPatch({ planId: "p1", priceMonthlyMad: -5 }).ok).toBe(false);
    expect(parsePlatformPlanPatch({ planId: "p1", priceMonthlyMad: "abc" }).ok).toBe(false);
    expect(parsePlatformPlanPatch({ planId: "p1", priceYearlyMad: -1 }).ok).toBe(false);
  });

  it("preserves isActive for archiving", () => {
    const r = parsePlatformPlanPatch({ planId: "p1", isActive: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.isActive).toBe(false);
  });

  it("rejects empty patch bodies", () => {
    const r = parsePlatformPlanPatch({ planId: "p1" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/No valid fields/);
  });
});

describe("formatPlanAmount", () => {
  it("renders dash for missing/null/non-finite values", () => {
    expect(formatPlanAmount(null)).toBe("—");
    expect(formatPlanAmount(undefined)).toBe("—");
    expect(formatPlanAmount(NaN)).toBe("—");
  });

  it("localizes numbers", () => {
    const strip = (s: string) => s.replace(/[\s\u00A0]/g, "");
    expect(strip(formatPlanAmount(100000))).toBe("100000");
    expect(strip(formatPlanAmount(1499.5))).toBe("1499,5");
  });
});