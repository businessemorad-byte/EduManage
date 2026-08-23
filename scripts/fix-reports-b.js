const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const part = `
// ─── Overview ────────────────────────────────────────────────────

export async function getReportsOverview(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalStudents, activeStudents, newStudentsThisMonth, totalStaff, totalGroups, totalSessions, totalLeads, totalAdmissions] = await Promise.all([
    db.student.count({ where: { organizationId, ...archivedFilter() } }),
    db.student.count({ where: { organizationId, status: "ACTIVE", ...archivedFilter() } }),
    db.student.count({ where: { organizationId, ...archivedFilter(), createdAt: { gte: startOfMonth } } }),
    db.staff.count({ where: { organizationId, ...archivedFilter() } }),
    db.group.count({ where: { organizationId } }),
    db.classSession.count({ where: { organizationId } }),
    db.lead.count({ where: { organizationId } }),
    db.admission.count({ where: { organizationId } }),
  ]);

  const attendanceRecords = await db.attendanceRecord.findMany({ where: { organizationId }, select: { status: true } });
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(r => r.status === "PRESENT").length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const [paidAgg, outstandingAgg] = await Promise.all([
    db.payment.aggregate({ where: { organizationId, status: "COMPLETED" }, _sum: { amount: true } }),
    db.invoice.aggregate({ where: { organizationId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, _sum: { totalAmount: true, paidAmount: true } }),
  ]);

  const totalPaid = paidAgg._sum.amount ?? new Decimal(0);
  const totalOutstanding = (outstandingAgg._sum.totalAmount ?? new Decimal(0)).minus(outstandingAgg._sum.paidAmount ?? new Decimal(0));

  return { totalStudents, activeStudents, newStudentsThisMonth, totalStaff, totalGroups, totalSessions, totalLeads, totalAdmissions, attendanceRate, totalRevenue: totalPaid.toNumber(), totalOutstanding: totalOutstanding.toNumber() };
}

// ─── People ──────────────────────────────────────────────────────

export async function getPeopleReport(organizationId: string, range: DateRange) {
  const af = archivedFilter();
  const [totalStudents, activeStudents, inactiveStudents, newRegistrations, byGroup, teachers, staffCount, trainerCount] = await Promise.all([
    db.student.count({ where: { organizationId, ...af } }),
    db.student.count({ where: { organizationId, status: "ACTIVE", ...af } }),
    db.student.count({ where: { organizationId, status: { in: ["INACTIVE", "GRADUATED", "DROPPED", "TRANSFERRED"] }, ...af } }),
    db.student.count({ where: { organizationId, ...af, ...createdAtFilter(range) } }),
    db.group.findMany({ where: { organizationId }, include: { _count: { select: { enrollments: true } }, level: { select: { name: true } } }, orderBy: { name: "asc" } }),
    db.teacher.findMany({ where: { organizationId, ...af }, include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } }, _count: { select: { classSessions: true } } } }),
    db.staff.count({ where: { organizationId, ...af } }),
    db.trainer.count({ where: { organizationId, ...af } }),
  ]);

  return {
    totalStudents, activeStudents, inactiveStudents, newRegistrations,
    byLevel: byGroup.reduce((acc: Record<string, number>, g) => { const name = g.level?.name || "Unassigned"; acc[name] = (acc[name] || 0) + g._count.enrollments; return acc; }, {}),
    byGroup: byGroup.map(g => ({ name: g.name, count: g._count.enrollments })),
    staffByType: [
      { type: "Teacher", count: teachers.length },
      { type: "Trainer", count: trainerCount },
      { type: "Staff Only", count: Math.max(0, staffCount - teachers.length - trainerCount) },
    ].filter(s => s.count > 0),
    teacherWorkload: teachers.map(t => ({ teacher: t.staff.person.firstName + " " + t.staff.person.lastName, sessions: t._count.classSessions })),
  };
}
`;

fs.appendFileSync(path.join(base, 'src/lib/reports.ts'), part);
console.log('Part B done - Overview + People');
