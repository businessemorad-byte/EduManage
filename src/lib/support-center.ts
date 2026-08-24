import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function getSupportCenterDashboard(organizationId: string, params?: { branchId?: string; month?: number; year?: number }) {
  const now = new Date();
  const month = params?.month ?? now.getMonth() + 1;
  const year = params?.year ?? now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const orgFilter = { organizationId };
  const branchFilter = params?.branchId ? { branchId: params.branchId } : {};

  const [
    activeStudents,
    newStudents,
    totalLeads,
    activeGroups,
    totalTeachers,
    todaySessions,
    activeEnrollments,
    monthlyRevenue,
    outstandingBalance,
    recentLeads,
  ] = await Promise.all([
    db.student.count({ where: { ...orgFilter, status: "ACTIVE" } }),
    db.student.count({ where: { ...orgFilter, createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: orgFilter }),
    db.group.count({ where: { ...orgFilter, isActive: true, ...branchFilter } }),
    db.teacher.count({ where: { ...orgFilter, status: "ACTIVE" } }),
    db.classSession.count({
      where: {
        ...orgFilter,
        dayOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][now.getDay() === 0 ? 6 : now.getDay() - 1] as never,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: startOfDay } }],
      },
    }),
    db.enrollment.count({ where: { ...orgFilter, status: "ACTIVE" } }),
    db.payment.aggregate({
      where: { ...orgFilter, status: "COMPLETED", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: { ...orgFilter, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.lead.findMany({
      where: orgFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, studentName: true, status: true, source: true, createdAt: true },
    }),
  ]);

  const totalOutstanding = outstandingBalance._sum.totalAmount
    ? Number(outstandingBalance._sum.totalAmount) - Number(outstandingBalance._sum.paidAmount ?? 0)
    : 0;

  const conversionRate = totalLeads > 0 ? Math.round(((await db.lead.count({ where: { ...orgFilter, status: "ENROLLED" } })) / totalLeads) * 100) : 0;

  return {
    activeStudents,
    newStudents,
    totalLeads,
    conversionRate,
    activeGroups,
    totalTeachers,
    todaySessions,
    activeEnrollments,
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    outstandingBalance: totalOutstanding,
    recentLeads,
  };
}

export async function getGroupProfitability(organizationId: string, groupId: string, month: number, year: number) {
  const group = await db.group.findFirst({ where: { id: groupId, organizationId } });
  if (!group) throw new Error("Group not found");

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [enrollmentCount, revenue, teacherSessions] = await Promise.all([
    db.enrollment.count({ where: { organizationId, groupId, status: "ACTIVE" } }),
    db.invoice.aggregate({
      where: { organizationId, studentId: { in: (await db.enrollment.findMany({ where: { organizationId, groupId }, select: { studentId: true } })).map((e) => e.studentId) }, status: { in: ["PAID", "PARTIAL"] }, issuedAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { paidAmount: true },
    }),
    db.classSession.findMany({
      where: { organizationId, groupId, isActive: true, startDate: { lte: endOfMonth }, OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }] },
      include: { teacher: { select: { hourlyRate: true } } },
    }),
  ]);

  let teacherCost = 0;
  for (const s of teacherSessions) {
    if (s.teacher?.hourlyRate) {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      teacherCost += Number(s.teacher.hourlyRate) * hours;
    }
  }

  const totalRevenue = Number(revenue._sum.paidAmount ?? 0);
  const margin = totalRevenue - teacherCost;

  return {
    group: { id: group.id, name: group.name, capacity: group.capacity },
    studentCount: enrollmentCount,
    revenue: totalRevenue,
    teacherCost,
    estimatedMargin: margin,
    marginPercentage: totalRevenue > 0 ? Math.round((margin / totalRevenue) * 100) : 0,
  };
}

export async function getRoomUtilization(organizationId: string, params?: { branchId?: string; roomId?: string; startDate?: Date; endDate?: Date }) {
  const now = new Date();
  const start = params?.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const end = params?.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const rooms = await db.room.findMany({
    where: { organizationId, isActive: true, ...(params?.branchId ? { branchId: params.branchId } : {}), ...(params?.roomId ? { id: params.roomId } : {}) },
  });

  const results = [];
  for (const room of rooms) {
    const sessions = await db.classSession.count({
      where: {
        organizationId,
        roomId: room.id,
        isActive: true,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
    });

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const maxSlots = totalDays * 10;
    const utilization = maxSlots > 0 ? Math.round((sessions / maxSlots) * 100) : 0;

    results.push({
      room: { id: room.id, name: room.name, capacity: room.capacity, type: room.type },
      scheduledSessions: sessions,
      utilization,
    });
  }

  return results;
}


