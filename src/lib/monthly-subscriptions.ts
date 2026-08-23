import { db } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function generateMonthlySubscriptions(data: {
  organizationId: string;
  enrollmentId: string;
  month: number;
  year: number;
}) {
  const enrollment = await db.enrollment.findFirst({
    where: { id: data.enrollmentId, organizationId: data.organizationId },
    include: { student: true, feePlan: true },
  });
  if (!enrollment) throw new Error("Enrollment not found");

  const amount = enrollment.monthlyFee ?? enrollment.feePlan?.amount ?? new Decimal(0);
  const dueDate = new Date(data.year, data.month, 5);

  const existing = await db.monthlySubscription.findUnique({
    where: { organizationId_enrollmentId_month_year: { organizationId: data.organizationId, enrollmentId: data.enrollmentId, month: data.month, year: data.year } },
  });
  if (existing) return existing;

  return db.monthlySubscription.create({
    data: {
      organizationId: data.organizationId,
      enrollmentId: data.enrollmentId,
      studentId: enrollment.studentId,
      feePlanId: enrollment.feePlanId,
      month: data.month,
      year: data.year,
      amount,
      dueDate,
      status: "PENDING",
    },
  });
}

export async function listMonthlySubscriptions(organizationId: string, params?: { studentId?: string; month?: number; year?: number; status?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.month) where.month = params.month;
  if (params?.year) where.year = params.year;
  if (params?.status) where.status = params.status;

  const [subscriptions, total] = await Promise.all([
    db.monthlySubscription.findMany({
      where,
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        enrollment: { include: { group: { select: { name: true } }, subject: { select: { name: true } } } },
        feePlan: { select: { name: true } },
        invoice: { select: { invoiceNumber: true, status: true, paidAmount: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take: limit,
    }),
    db.monthlySubscription.count({ where }),
  ]);

  return { subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOverdueSubscriptions(organizationId: string) {
  const now = new Date();
  return db.monthlySubscription.findMany({
    where: { organizationId, status: { in: ["PENDING", "PARTIALLY_PAID"] }, dueDate: { lt: now } },
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
      enrollment: { include: { group: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function markOverdueSubscriptions(organizationId: string) {
  const now = new Date();
  return db.monthlySubscription.updateMany({
    where: { organizationId, status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}
