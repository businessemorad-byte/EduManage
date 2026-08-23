import { db } from "@/lib/prisma";

export async function getRetentionMetrics(organizationId: string, params?: { branchId?: string; academicYearId?: string }) {
  const where: Record<string, unknown> = { organizationId };
  if (params?.branchId) where.branchId = params.branchId;
  if (params?.academicYearId) where.academicYearId = params.academicYearId;

  const enrollments = await db.enrollment.findMany({ where, select: { status: true, startDate: true, endDate: true } });

  const total = enrollments.length;
  const active = enrollments.filter((e) => e.status === "ACTIVE").length;
  const paused = enrollments.filter((e) => e.status === "WITHDRAWN").length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newEnrollments = await db.enrollment.count({
    where: { ...where, startDate: { gte: startOfMonth } },
  });

  const retentionRate = total > 0 ? Math.round((active / total) * 100) : 0;

  return {
    total,
    active,
    paused,
    completed,
    dropped: paused,
    newEnrollments,
    reactivations: 0,
    retentionRate,
  };
}

export async function getStudentRetentionDetail(organizationId: string, studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { organizationId, studentId },
    include: {
      academicYear: { select: { name: true } },
      group: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  const attendanceCount = await db.attendanceRecord.count({ where: { organizationId, studentId } });
  const presentCount = await db.attendanceRecord.count({ where: { organizationId, studentId, status: "PRESENT" } });

  return {
    enrollments,
    attendanceRate: attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0,
    totalSessions: attendanceCount,
  };
}
