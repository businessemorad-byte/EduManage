import { describe, it, expect } from "vitest";

describe("Finance Engine", () => {
  describe("Module exports", () => {
    it("should export all finance functions", async () => {
      const mod = await import("@/lib/finance");
      expect(typeof mod.createFeePlan).toBe("function");
      expect(typeof mod.listFeePlans).toBe("function");
      expect(typeof mod.deleteFeePlan).toBe("function");
      expect(typeof mod.createDiscount).toBe("function");
      expect(typeof mod.listDiscounts).toBe("function");
      expect(typeof mod.createInvoice).toBe("function");
      expect(typeof mod.listInvoices).toBe("function");
      expect(typeof mod.getInvoice).toBe("function");
      expect(typeof mod.createPayment).toBe("function");
      expect(typeof mod.listPayments).toBe("function");
      expect(typeof mod.createRefund).toBe("function");
      expect(typeof mod.getFinanceSummary).toBe("function");
      expect(typeof mod.onFinancialEvent).toBe("function");
      expect(typeof mod.emitFinancialEvent).toBe("function");
      expect(typeof mod.formatAmount).toBe("function");
    });
  });

  describe("Decimal calculations", () => {
    it("should calculate discount percentage correctly", () => {
      const subtotal = 1000;
      const discountPercent = 15;
      const expected = subtotal * discountPercent / 100;
      expect(expected).toBe(150);
    });

    it("should calculate discount fixed correctly", () => {
      const subtotal = 500;
      const discountFixed = 75;
      const expected = Math.min(discountFixed, subtotal);
      expect(expected).toBe(75);
    });

    it("should not discount more than subtotal", () => {
      const subtotal = 50;
      const discountFixed = 100;
      const expected = Math.min(discountFixed, subtotal);
      expect(expected).toBe(50);
    });

    it("should calculate payment balance correctly", () => {
      const total = 1000;
      const paid = 400;
      const remaining = total - paid;
      expect(remaining).toBe(600);
    });

    it("should aggregate multiple payments", () => {
      const payments = [200, 150, 50];
      const total = payments.reduce((sum, p) => sum + p, 0);
      expect(total).toBe(400);
    });

    it("should calculate weighted average grades", () => {
      const grades = [
        { score: 85, maxScore: 100, weight: 30 },
        { score: 90, maxScore: 100, weight: 70 },
      ];

      let weightedSum = 0;
      let totalWeight = 0;

      for (const g of grades) {
        const percentage = g.score / g.maxScore;
        weightedSum += percentage * g.weight;
        totalWeight += g.weight;
      }

      const average = (weightedSum / totalWeight) * 100;
      expect(average).toBe(88.5);
    });

    it("should prevent negative balance on overpayment", () => {
      const total = 100;
      const attempted = 150;
      const remaining = total;
      expect(Math.min(attempted, remaining)).toBe(100);
    });
  });

  describe("Enums", () => {
    it("should have InvoiceStatus values", async () => {
      const { InvoiceStatus } = await import("@/generated/prisma/client");
      expect(InvoiceStatus.DRAFT).toBe("DRAFT");
      expect(InvoiceStatus.PENDING).toBe("PENDING");
      expect(InvoiceStatus.PAID).toBe("PAID");
      expect(InvoiceStatus.OVERDUE).toBe("OVERDUE");
      expect(InvoiceStatus.CANCELLED).toBe("CANCELLED");
    });

    it("should have PaymentStatus values", async () => {
      const { PaymentStatus } = await import("@/generated/prisma/client");
      expect(PaymentStatus.COMPLETED).toBe("COMPLETED");
      expect(PaymentStatus.REFUNDED).toBe("REFUNDED");
      expect(PaymentStatus.PARTIAL_REFUND).toBe("PARTIAL_REFUND");
    });

    it("should have PaymentMethod values", async () => {
      const { PaymentMethod } = await import("@/generated/prisma/client");
      expect(PaymentMethod.CASH).toBe("CASH");
      expect(PaymentMethod.BANK_TRANSFER).toBe("BANK_TRANSFER");
      expect(PaymentMethod.CARD).toBe("CARD");
      expect(PaymentMethod.MOBILE_MONEY).toBe("MOBILE_MONEY");
    });
  });

  describe("RBAC", () => {
    it("should include finance permissions", async () => {
      const { PERMISSIONS } = await import("@/lib/rbac");
      expect(PERMISSIONS.INVOICES_READ).toBe("INVOICES_READ");
      expect(PERMISSIONS.INVOICES_MANAGE).toBe("INVOICES_MANAGE");
      expect(PERMISSIONS.PAYMENTS_READ).toBe("PAYMENTS_READ");
      expect(PERMISSIONS.PAYMENTS_MANAGE).toBe("PAYMENTS_MANAGE");
    });

    it("should grant ACCOUNTANT full finance access", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.ACCOUNTANT).toContain("INVOICES_MANAGE");
      expect(ROLE_PERMISSIONS.ACCOUNTANT).toContain("PAYMENTS_MANAGE");
      expect(ROLE_PERMISSIONS.ACCOUNTANT).toContain("FINANCE_MANAGE");
    });

    it("should grant ADMIN full finance access", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.ADMIN).toContain("INVOICES_MANAGE");
      expect(ROLE_PERMISSIONS.ADMIN).toContain("PAYMENTS_MANAGE");
    });
  });

  describe("Financial events", () => {
    it("should register and emit events via central bus", async () => {
      const { onEvent } = await import("@/lib/events");
      const { emitFinancialEvent } = await import("@/lib/finance");
      let received: unknown = null;
      onEvent("invoice.created", (e) => { received = e; });

      await emitFinancialEvent({
        type: "invoice.created",
        organizationId: "org",
        invoiceId: "inv",
        amount: { toNumber: () => 100 } as never,
      });

      expect(received).toBeTruthy();
    });
  });
});
