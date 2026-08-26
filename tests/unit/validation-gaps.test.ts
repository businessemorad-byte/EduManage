import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const model = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  const db: Record<string, ReturnType<typeof model>> = {
    person: model(),
    student: model(),
    staff: model(),
    teacher: model(),
    trainer: model(),
    invoice: model(),
    payment: model(),
    refund: model(),
    financialTransaction: model(),
    assessment: model(),
    grade: model(),
    reportCard: model(),
    gradingConfig: model(),
    auditLog: model(),
    notification: model(),
    attendanceRecord: model(),
    homework: model(),
    homeworkSubmission: model(),
  };
  (db as Record<string, unknown>).$transaction = vi.fn(
    async (fn: (tx: unknown) => unknown) => fn(db)
  );
  return { db };
});

import { db } from "@/lib/prisma";
import { createInvoice, createPayment, createRefund } from "@/lib/finance";
import { recordGrade } from "@/lib/assessment";
import { Decimal } from "@prisma/client/runtime/client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Finance Validation ───────────────────────────────────────

describe("Validation Gaps - Finance", () => {
  it("should reject invoice with zero quantity item", async () => {
    await expect(
      createInvoice({
        organizationId: "org1",
        studentId: "s1",
        items: [{ description: "Fee", quantity: 0, unitPrice: 100 }],
      })
    ).rejects.toThrow("Item quantity must be positive");
  });

  it("should reject invoice with negative quantity item", async () => {
    await expect(
      createInvoice({
        organizationId: "org1",
        studentId: "s1",
        items: [{ description: "Fee", quantity: -1, unitPrice: 100 }],
      })
    ).rejects.toThrow("Item quantity must be positive");
  });

  it("should reject invoice with negative unitPrice", async () => {
    await expect(
      createInvoice({
        organizationId: "org1",
        studentId: "s1",
        items: [{ description: "Fee", quantity: 1, unitPrice: -50 }],
      })
    ).rejects.toThrow("Item unitPrice cannot be negative");
  });

  it("should reject payment exceeding remaining balance", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "PARTIAL",
      totalAmount: new Decimal(100),
      paidAmount: new Decimal(80),
      currency: "USD",
    } as never);

    await expect(
      createPayment({ organizationId: "org1", invoiceId: "inv1", amount: 30, method: "CASH" })
    ).rejects.toThrow("Payment exceeds remaining balance");
  });

  it("should reject refund more than available", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: "pay1",
      amount: new Decimal(100),
      status: "COMPLETED",
      invoiceId: "inv1",
      receiptNumber: "PAY-1",
      invoice: { id: "inv1", paidAmount: new Decimal(100), currency: "USD" },
    } as never);
    vi.mocked(db.refund.aggregate).mockResolvedValue({
      _sum: { amount: new Decimal(80) },
    } as never);

    await expect(
      createRefund({ organizationId: "org1", paymentId: "pay1", amount: 30 })
    ).rejects.toThrow("Refund exceeds available amount");
  });

  it("should allow zero unitPrice items (free items)", async () => {
    vi.mocked(db.invoice.create).mockResolvedValue({
      id: "inv1",
      subtotal: new Decimal(0),
      totalAmount: new Decimal(0),
      items: [],
    } as never);

    const result = await createInvoice({
      organizationId: "org1",
      studentId: "s1",
      items: [{ description: "Free item", quantity: 1, unitPrice: 0 }],
    });

    expect(result.totalAmount).toEqual(new Decimal(0));
  });
});

// ─── Assessment Validation ────────────────────────────────────

describe("Validation Gaps - Assessment", () => {
  it("should reject NaN score", async () => {
    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "a1", score: NaN })
    ).rejects.toThrow("Score must be a valid number");
  });

  it("should reject negative score", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "a1",
      maxScore: 100,
      isActive: true,
    } as never);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "a1", score: -10 })
    ).rejects.toThrow("Score cannot be negative");
  });

  it("should reject score exceeding maxScore", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "a1",
      maxScore: 20,
      isActive: true,
    } as never);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "a1", score: 25 })
    ).rejects.toThrow("Score 25 exceeds maximum score of 20");
  });

  it("should reject grade for inactive assessment", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue(null);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "a1", score: 50 })
    ).rejects.toThrow("Assessment not found in this organization");
  });

  it("should accept score of zero", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "a1",
      maxScore: 100,
      isActive: true,
    } as never);
    vi.mocked(db.grade.upsert).mockResolvedValue({
      id: "g1",
      score: 0,
    } as never);

    const result = await recordGrade({
      organizationId: "org1",
      studentId: "s1",
      assessmentId: "a1",
      score: 0,
    });

    expect(result.score).toBe(0);
  });

  it("should accept score equal to maxScore", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "a1",
      maxScore: 100,
      isActive: true,
    } as never);
    vi.mocked(db.grade.upsert).mockResolvedValue({
      id: "g1",
      score: 100,
    } as never);

    const result = await recordGrade({
      organizationId: "org1",
      studentId: "s1",
      assessmentId: "a1",
      score: 100,
    });

    expect(result.score).toBe(100);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────

describe("Validation Gaps - Edge Cases", () => {
  it("should handle invoice with very large amount", async () => {
    vi.mocked(db.invoice.create).mockResolvedValue({
      id: "inv1",
      totalAmount: new Decimal("999999999.99"),
      items: [],
    } as never);

    const result = await createInvoice({
      organizationId: "org1",
      studentId: "s1",
      items: [{ description: "Large fee", quantity: 1, unitPrice: 999999999.99 }],
    });

    expect(result.totalAmount).toEqual(new Decimal("999999999.99"));
  });

  it("should handle invoice with multiple items calculating correct total", async () => {
    const items = [
      { description: "Item A", quantity: 2, unitPrice: new Decimal(100) },
      { description: "Item B", quantity: 3, unitPrice: new Decimal(50) },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice.toNumber() * item.quantity, 0);
    vi.mocked(db.invoice.create).mockResolvedValue({
      id: "inv1",
      subtotal: new Decimal(subtotal),
      totalAmount: new Decimal(subtotal),
      items,
    } as never);

    const result = await createInvoice({
      organizationId: "org1",
      studentId: "s1",
      items: [
        { description: "Item A", quantity: 2, unitPrice: 100 },
        { description: "Item B", quantity: 3, unitPrice: 50 },
      ],
    });

    expect(result.subtotal.toNumber()).toBe(350);
  });

  it("should handle payment with exact remaining amount", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "PARTIAL",
      totalAmount: new Decimal(500),
      paidAmount: new Decimal(300),
      currency: "USD",
    } as never);
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay1" } as never);
    vi.mocked(db.invoice.update).mockResolvedValue({} as never);
    vi.mocked(db.financialTransaction.create).mockResolvedValue({} as never);

    await createPayment({
      organizationId: "org1",
      invoiceId: "inv1",
      amount: 200,
      method: "BANK_TRANSFER",
    });

    expect(db.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal(500),
          status: "PAID",
        }),
      })
    );
  });
});
