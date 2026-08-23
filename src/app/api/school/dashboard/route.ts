import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "REPORTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayDayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as
      | "MONDAY"
      | "TUESDAY"
      | "WEDNESDAY"
      | "THURSDAY"
      | "FRIDAY"
      | "SATURDAY"
      | "SUNDAY";

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalClasses,
      pendingAdmissions,
      attendanceThisMonth,
      totalAttendanceThisMonth,
      invoices,
      payments,
      todaySessions,
      totalSessions,
      availableRooms,
    ] = await Promise.all([
      db.student.count({ where: { organizationId } }),
      db.student.count({ where: { organizationId, status: "ACTIVE" } }),
      db.teacher.count({ where: { organizationId } }),
      db.group.count({ where: { organizationId, isActive: true } }),
      db.admission.count({ where: { organizationId, status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
      db.attendanceRecord.count({
        where: {
          organizationId,
          date: { gte: startOfMonth, lte: now },
          status: { in: ["PRESENT", "LATE"] },
        },
      }),
      db.attendanceRecord.count({
        where: { organizationId, date: { gte: startOfMonth, lte: now } },
      }),
      db.invoice.aggregate({
        where: { organizationId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      db.payment.aggregate({
        where: { organizationId, status: "COMPLETED", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.classSession.count({ where: { organizationId, isActive: true, dayOfWeek: todayDayOfWeek } }),
      db.classSession.count({ where: { organizationId, isActive: true } }),
      db.room.count({ where: { organizationId, status: "AVAILABLE", isActive: true } }),
    ]);

    const totalDue = (invoices._sum.totalAmount ?? new Decimal(0)) as Decimal;
    const totalPaid = (invoices._sum.paidAmount ?? new Decimal(0)) as Decimal;
    const outstanding = totalDue.sub(totalPaid);
    const attendanceRate = totalAttendanceThisMonth > 0 ? Math.round((attendanceThisMonth / totalAttendanceThisMonth) * 100) : 0;
    const collectionRate = totalDue.gt(0) ? Math.round(totalPaid.div(totalDue).mul(100).toNumber()) : 0;

    return NextResponse.json({
      students: { total: totalStudents, active: activeStudents },
      teachers: { total: totalTeachers },
      classes: { total: totalClasses },
      admissions: { pending: pendingAdmissions },
      attendance: { rate: attendanceRate, thisMonth: attendanceThisMonth },
      finance: {
        outstanding: outstanding.toNumber(),
        collectionRate,
        monthlyRevenue: (payments._sum.amount ?? new Decimal(0)).toNumber(),
      },
      scheduling: {
        todaySessions,
        totalSessions,
        availableRooms,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
