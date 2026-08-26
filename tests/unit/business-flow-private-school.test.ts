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

  const models: Record<string, unknown> = {
    person: model(),
      student: model(),
      staff: model(),
      teacher: model(),
      trainer: model(),
      parent: model(),
      studentGuardian: model(),
      feePlan: model(),
      discount: model(),
      invoice: model(),
      payment: model(),
      refund: model(),
      financialTransaction: model(),
      attendanceRecord: model(),
      assessment: model(),
      grade: model(),
      homework: model(),
      homeworkSubmission: model(),
      reportCard: model(),
      reportCardItem: model(),
      gradingConfig: model(),
      promotion: model(),
      auditLog: model(),
      notification: model(),
      program: model(),
      group: model(),
      enrollment: model(),
      schedule: model(),
      classSession: model(),
      room: model(),
      certificate: model(),
      corporateClient: model(),
      corporateLearner: model(),
      corporateContract: model(),
      communicationLog: model(),
      communicationTemplate: model(),
      communicationCampaign: model(),
      communicationSetting: model(),
      communicationProvider: model(),
      organizationMember: model(),
      contactRequest: model(),
      message: model(),
      userPreference: model(),
      subscription: model(),
      plan: model(),
      planFeature: model(),
      feature: model(),
      coupon: model(),
      couponUsage: model(),
      billingInvoice: model(),
      billingInvoiceItem: model(),
      billingPayment: model(),
      organization: model(),
  };
  // The tx handle exposes all models (mirrors real Prisma behaviour).
  (models as Record<string, unknown>).$transaction = vi.fn(
    async (fn: (tx: unknown) => unknown) => fn(models)
  );
  return { db: models };
});

import { db } from "@/lib/prisma";
import { createPerson } from "@/lib/people";
import { createStudent } from "@/lib/students";
import { createTeacher } from "@/lib/staff";
import { createFeePlan, createInvoice, createPayment, createRefund } from "@/lib/finance";
import { markAttendance, getAttendanceSummary } from "@/lib/attendance";
import { createAssessment, recordGrade } from "@/lib/assessment";
import { createHomework, submitHomework, gradeSubmission } from "@/lib/homework";
import { Decimal } from "@prisma/client/runtime/client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Person & Student Creation ────────────────────────────────

describe("Private School - Person & Student Creation", () => {
  it("should create a person with correct data", async () => {
    vi.mocked(db.person.create).mockResolvedValue({
      id: "p1",
      firstName: "Ahmed",
      lastName: "Ali",
    } as never);

    const result = await createPerson({
      organizationId: "org1",
      firstName: "Ahmed",
      lastName: "Ali",
    });

    expect(db.person.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org1",
          firstName: "Ahmed",
          lastName: "Ali",
        }),
      })
    );
    expect(result.id).toBe("p1");
  });

  it("should create a student with person record", async () => {
    vi.mocked(db.person.create).mockResolvedValue({ id: "p1", firstName: "Sara" } as never);
    vi.mocked(db.student.create).mockResolvedValue({
      id: "s1",
      personId: "p1",
      organizationId: "org1",
      status: "ACTIVE",
      person: { id: "p1", firstName: "Sara" },
      guardians: [],
    } as never);

    const result = await createStudent({
      organizationId: "org1",
      person: { firstName: "Sara", lastName: "Ben", organizationId: "org1" },
    });

    expect(db.person.create).toHaveBeenCalledTimes(1);
    expect(db.student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          personId: "p1",
          organizationId: "org1",
          status: "ACTIVE",
        }),
      })
    );
    expect(result.id).toBe("s1");
  });

  it("should create a teacher via staff chain", async () => {
    vi.mocked(db.person.create).mockResolvedValue({ id: "p1", firstName: "Mr" } as never);
    vi.mocked(db.staff.create).mockResolvedValue({
      id: "st1",
      personId: "p1",
      organizationId: "org1",
    } as never);
    vi.mocked(db.teacher.create).mockResolvedValue({
      id: "t1",
      staffId: "st1",
      organizationId: "org1",
      staff: { id: "st1", person: { id: "p1", firstName: "Mr" } },
    } as never);

    const result = await createTeacher({
      organizationId: "org1",
      person: { firstName: "Mr", lastName: "Smith" },
      subjects: ["Math"],
    });

    expect(db.person.create).toHaveBeenCalledTimes(1);
    expect(db.staff.create).toHaveBeenCalledTimes(1);
    expect(db.teacher.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("t1");
  });
});

// ─── Invoice & Payment Flow ───────────────────────────────────

describe("Private School - Invoice & Payment Flow", () => {
  it("should create an invoice with items", async () => {
    vi.mocked(db.invoice.create).mockResolvedValue({
      id: "inv1",
      invoiceNumber: "INV-1",
      subtotal: new Decimal(500),
      discountAmount: new Decimal(0),
      totalAmount: new Decimal(500),
      items: [{ description: "Tuition", quantity: 1, unitPrice: new Decimal(500) }],
    } as never);

    const result = await createInvoice({
      organizationId: "org1",
      studentId: "s1",
      items: [{ description: "Tuition", quantity: 1, unitPrice: 500 }],
    });

    expect(db.invoice.create).toHaveBeenCalledTimes(1);
    expect(result.totalAmount).toEqual(new Decimal(500));
  });

  it("should reject invoice with empty items", async () => {
    await expect(
      createInvoice({ organizationId: "org1", studentId: "s1", items: [] })
    ).rejects.toThrow("At least one item is required");
  });

  it("should reject invoice with missing studentId", async () => {
    await expect(
      createInvoice({ organizationId: "org1", studentId: "", items: [{ description: "Test", quantity: 1, unitPrice: 100 }] })
    ).rejects.toThrow("studentId is required");
  });

  it("should reject invoice with zero quantity", async () => {
    await expect(
      createInvoice({
        organizationId: "org1",
        studentId: "s1",
        items: [{ description: "Test", quantity: 0, unitPrice: 100 }],
      })
    ).rejects.toThrow("Item quantity must be positive");
  });

  it("should reject invoice with negative unitPrice", async () => {
    await expect(
      createInvoice({
        organizationId: "org1",
        studentId: "s1",
        items: [{ description: "Test", quantity: 1, unitPrice: -50 }],
      })
    ).rejects.toThrow("Item unitPrice cannot be negative");
  });

  it("should create a payment for an invoice", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "PENDING",
      totalAmount: new Decimal(500),
      paidAmount: new Decimal(0),
      currency: "USD",
    } as never);
    vi.mocked(db.payment.create).mockResolvedValue({
      id: "pay1",
      amount: new Decimal(300),
    } as never);
    vi.mocked(db.invoice.update).mockResolvedValue({} as never);
    vi.mocked(db.financialTransaction.create).mockResolvedValue({} as never);

    const result = await createPayment({
      organizationId: "org1",
      invoiceId: "inv1",
      amount: 300,
      method: "CASH",
    });

    expect(db.payment.create).toHaveBeenCalledTimes(1);
    expect(db.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal(300),
          status: "PARTIAL",
        }),
      })
    );
    expect(result.id).toBe("pay1");
  });

  it("should reject payment exceeding remaining balance", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "PENDING",
      totalAmount: new Decimal(500),
      paidAmount: new Decimal(400),
      currency: "USD",
    } as never);

    await expect(
      createPayment({ organizationId: "org1", invoiceId: "inv1", amount: 200, method: "CASH" })
    ).rejects.toThrow("Payment exceeds remaining balance");
  });

  it("should reject payment with zero amount", async () => {
    await expect(
      createPayment({ organizationId: "org1", invoiceId: "inv1", amount: 0, method: "CASH" })
    ).rejects.toThrow("Payment amount must be positive");
  });

  it("should reject payment for cancelled invoice", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "CANCELLED",
      totalAmount: new Decimal(500),
      paidAmount: new Decimal(0),
      currency: "USD",
    } as never);

    await expect(
      createPayment({ organizationId: "org1", invoiceId: "inv1", amount: 100, method: "CASH" })
    ).rejects.toThrow("Cannot pay a cancelled invoice");
  });

  it("should mark invoice as PAID when full amount paid", async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      id: "inv1",
      status: "PARTIAL",
      totalAmount: new Decimal(500),
      paidAmount: new Decimal(300),
      currency: "USD",
    } as never);
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay2" } as never);
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

// ─── Refund Flow ──────────────────────────────────────────────

describe("Private School - Refund Flow", () => {
  it("should create a refund for a payment", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: "pay1",
      amount: new Decimal(500),
      status: "COMPLETED",
      invoiceId: "inv1",
      receiptNumber: "PAY-1",
      invoice: { id: "inv1", paidAmount: new Decimal(500), currency: "USD" },
    } as never);
    vi.mocked(db.refund.aggregate).mockResolvedValue({
      _sum: { amount: new Decimal(0) },
    } as never);
    vi.mocked(db.refund.create).mockResolvedValue({
      id: "ref1",
      amount: new Decimal(100),
    } as never);
    vi.mocked(db.invoice.update).mockResolvedValue({} as never);
    vi.mocked(db.payment.update).mockResolvedValue({} as never);
    vi.mocked(db.financialTransaction.create).mockResolvedValue({} as never);

    const result = await createRefund({
      organizationId: "org1",
      paymentId: "pay1",
      amount: 100,
      reason: "Overpayment",
    });

    expect(db.refund.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("ref1");
  });

  it("should reject refund exceeding available amount", async () => {
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: "pay1",
      amount: new Decimal(100),
      status: "COMPLETED",
      invoiceId: "inv1",
      receiptNumber: "PAY-1",
      invoice: { id: "inv1", paidAmount: new Decimal(100), currency: "USD" },
    } as never);
    vi.mocked(db.refund.aggregate).mockResolvedValue({
      _sum: { amount: new Decimal(50) },
    } as never);

    await expect(
      createRefund({ organizationId: "org1", paymentId: "pay1", amount: 100 })
    ).rejects.toThrow("Refund exceeds available amount");
  });

  it("should reject refund with zero amount", async () => {
    await expect(
      createRefund({ organizationId: "org1", paymentId: "pay1", amount: 0 })
    ).rejects.toThrow("Refund amount must be positive");
  });
});

// ─── Attendance Flow ──────────────────────────────────────────

describe("Private School - Attendance Flow", () => {
  it("should mark attendance (create or update)", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(db.attendanceRecord.findFirst).mockResolvedValue(null);
    vi.mocked(db.attendanceRecord.create).mockResolvedValue({
      id: "att1",
      status: "PRESENT",
    } as never);

    const result = await markAttendance({
      organizationId: "org1",
      studentId: "s1",
      date: "2025-01-15",
      status: "PRESENT",
    });

    expect(db.attendanceRecord.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("PRESENT");
  });

  it("should compute attendance summary by status", async () => {
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([
      { status: "PRESENT" },
      { status: "PRESENT" },
      { status: "ABSENT" },
      { status: "LATE" },
    ] as never);

    const result = await getAttendanceSummary({
      organizationId: "org1",
      studentId: "s1",
    });

    expect(result.PRESENT).toBe(2);
    expect(result.ABSENT).toBe(1);
    expect(result.LATE).toBe(1);
    expect(result.EXCUSED).toBe(0);
    expect(result.total).toBe(4);
  });

  it("should return zero totals for no records", async () => {
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([]);

    const result = await getAttendanceSummary({
      organizationId: "org1",
      studentId: "s1",
    });

    expect(result.PRESENT).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── Assessment & Grading Flow ────────────────────────────────

describe("Private School - Assessment & Grading", () => {
  it("should create an assessment", async () => {
    vi.mocked(db.assessment.create).mockResolvedValue({
      id: "assess1",
      name: "Midterm Exam",
      maxScore: 100,
    } as never);

    const result = await createAssessment({
      organizationId: "org1",
      name: "Midterm Exam",
      maxScore: 100,
    });

    expect(db.assessment.create).toHaveBeenCalledTimes(1);
    expect(result.name).toBe("Midterm Exam");
  });

  it("should record a grade for a valid score", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "assess1",
      maxScore: 100,
      isActive: true,
    } as never);
    vi.mocked(db.grade.upsert).mockResolvedValue({
      id: "g1",
      score: 85,
    } as never);

    const result = await recordGrade({
      organizationId: "org1",
      studentId: "s1",
      assessmentId: "assess1",
      score: 85,
    });

    expect(db.grade.upsert).toHaveBeenCalledTimes(1);
    expect(result.score).toBe(85);
  });

  it("should reject grade with negative score", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "assess1",
      maxScore: 100,
      isActive: true,
    } as never);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "assess1", score: -5 })
    ).rejects.toThrow("Score cannot be negative");
  });

  it("should reject grade exceeding max score", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({
      id: "assess1",
      maxScore: 100,
      isActive: true,
    } as never);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "assess1", score: 150 })
    ).rejects.toThrow("Score 150 exceeds maximum score of 100");
  });

  it("should reject grade with non-number score", async () => {
    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "assess1", score: NaN })
    ).rejects.toThrow("Score must be a valid number");
  });

  it("should reject grade for non-existent assessment", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue(null);

    await expect(
      recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "none", score: 50 })
    ).rejects.toThrow("Assessment not found in this organization");
  });
});

// ─── Homework Flow ────────────────────────────────────────────

describe("Private School - Homework Flow", () => {
  it("should create homework", async () => {
    vi.mocked(db.homework.create).mockResolvedValue({
      id: "hw1",
      title: "Math Worksheet",
      isPublished: false,
    } as never);

    const result = await createHomework({
      organizationId: "org1",
      title: "Math Worksheet",
    });

    expect(db.homework.create).toHaveBeenCalledTimes(1);
    expect(result.title).toBe("Math Worksheet");
  });

  it("should submit homework via upsert", async () => {
    vi.mocked(db.homeworkSubmission.upsert).mockResolvedValue({
      id: "sub1",
      status: "SUBMITTED",
    } as never);

    const result = await submitHomework({
      organizationId: "org1",
      homeworkId: "hw1",
      studentId: "s1",
    });

    expect(db.homeworkSubmission.upsert).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("SUBMITTED");
  });

  it("should grade a homework submission", async () => {
    vi.mocked(db.homeworkSubmission.update).mockResolvedValue({
      id: "sub1",
      score: 90,
      feedback: "Great work!",
    } as never);

    const result = await gradeSubmission("sub1", 90, "Great work!");

    expect(db.homeworkSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub1" },
        data: { score: 90, feedback: "Great work!" },
      })
    );
    expect(result.score).toBe(90);
  });
});
