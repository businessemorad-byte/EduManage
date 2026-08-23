const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const part2 = `
// ─── Overview ────────────────────────────────────────────────────

export async function getReportsOverview(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalStudents, activeStudents, newStudentsThisMonth, totalStaff, totalGroups, totalSessions, totalLeads, totalAdmissions] = await Promise.all([
    db.student.count({ where: { organizationId, person: { isArchived: false } } }),
    db.student.count({ where: { organizationId, status: "ACTIVE", person: { isArchived: false } } }),
    db.student.count({ where: { organizationId, person: { isArchived: false }, createdAt: { gte: startOfMonth } } }),
    db.staff.count({ where: { organizationId, person: { isArchived: false } } }),
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
  const [totalStudents, activeStudents, inactiveStudents, newRegistrations, byGroup, staffByType, teacherWorkload] = await Promise.all([
    db.student.count({ where: { organizationId, person: { isArchived: false } } }),
    db.student.count({ where: { organizationId, status: "ACTIVE", person: { isArchived: false } } }),
    db.student.count({ where: { organizationId, status: { in: ["INACTIVE", "GRADUATED", "DROPPED", "TRANSFERRED"] }, person: { isArchived: false } } }),
    db.student.count({ where: { organizationId, person: { isArchived: false }, ...createdAtFilter(range) } }),
    db.group.findMany({ where: { organizationId }, include: { _count: { select: { enrollments: true } }, level: { select: { name: true } } }, orderBy: { name: "asc" } }),
    db.staff.groupBy({ by: ["type"], where: { organizationId, person: { isArchived: false } }, _count: true }),
    db.classSession.groupBy({ by: ["teacherId"], where: { organizationId }, _count: true, orderBy: { _count: { id: "desc" } }, take: 20 }),
  ]);

  const teacherIds = teacherWorkload.map(t => t.teacherId).filter(Boolean) as string[];
  const teachers = teacherIds.length ? await db.teacher.findMany({ where: { id: { in: teacherIds } }, include: { person: { select: { firstName: true, lastName: true } } } }) : [];
  const teacherMap = new Map(teachers.map(t => [t.id, t.person.firstName + " " + t.person.lastName]));

  return {
    totalStudents, activeStudents, inactiveStudents, newRegistrations,
    byLevel: byGroup.reduce((acc: Record<string, number>, g) => { const name = g.level?.name || "Unassigned"; acc[name] = (acc[name] || 0) + g._count.enrollments; return acc; }, {}),
    byGroup: byGroup.map(g => ({ name: g.name, count: g._count.enrollments })),
    staffByType: staffByType.map(s => ({ type: s.type, count: s._count })),
    teacherWorkload: teacherWorkload.map(t => ({ teacher: teacherMap.get(t.teacherId || "") || "Unknown", sessions: t._count })),
  };
}
`;

fs.appendFileSync(path.join(base, 'src/lib/reports.ts'), part2);
console.log('Part 2 done');
