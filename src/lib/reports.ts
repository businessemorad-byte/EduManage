import { db } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

export type DateRange = { startDate?: string; endDate?: string };

export function parseDateRange(sp: URLSearchParams): DateRange {
  return { startDate: sp.get("startDate") ?? undefined, endDate: sp.get("endDate") ?? undefined };
}

function createdAtFilter(range: DateRange) {
  if (!range.startDate && !range.endDate) return undefined;
  return {
    createdAt: {
      ...(range.startDate ? { gte: new Date(range.startDate) } : {}),
      ...(range.endDate ? { lte: new Date(range.endDate + "T23:59:59.999Z") } : {}),
    },
  };
}

function dateBetween(field: string, range: DateRange) {
  if (!range.startDate && !range.endDate) return undefined;
  return {
    [field]: {
      ...(range.startDate ? { gte: new Date(range.startDate) } : {}),
      ...(range.endDate ? { lte: new Date(range.endDate + "T23:59:59.999Z") } : {}),
    },
  };
}

function archivedFilter() {
  return { person: { status: { not: "ARCHIVED" as const } } };
}

// --- Overview ---

export async function getReportsOverview(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const af = archivedFilter();
  const [totalStudents, activeStudents, newStudentsThisMonth, totalStaff, totalGroups, totalSessions, totalLeads, totalAdmissions] = await Promise.all([
    db.student.count({ where: { organizationId, ...af } }),
    db.student.count({ where: { organizationId, status: "ACTIVE", ...af } }),
    db.student.count({ where: { organizationId, ...af, createdAt: { gte: startOfMonth } } }),
    db.staff.count({ where: { organizationId, ...af } }),
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

// --- People ---

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

// --- Academic ---

export async function getAcademicReport(organizationId: string, range: DateRange) {
  const assessmentWhere: Record<string, unknown> = { organizationId };
  const df = dateBetween("createdAt", range);
  if (df) Object.assign(assessmentWhere, df);

  const [assessments, grades] = await Promise.all([
    db.assessment.findMany({ where: assessmentWhere, include: { group: { select: { name: true } }, subject: { select: { name: true } } } }),
    db.grade.findMany({ where: { organizationId }, include: { assessment: { select: { maxScore: true, group: { select: { name: true } }, subject: { select: { name: true } } } } } }),
  ]);

  const totalAssessments = assessments.length;
  const totalGrades = grades.length;
  const overallAverage = totalGrades > 0 ? Math.round(grades.reduce((sum: number, g: { score: number; assessment: { maxScore: unknown } }) => sum + (g.score / Number(g.assessment.maxScore) * 100), 0) / totalGrades * 100) / 100 : null;

  const bySubject: Record<string, { total: number; sum: number }> = {};
  for (const g of grades) {
    const subj = g.assessment.subject?.name || "Unassigned";
    if (!bySubject[subj]) bySubject[subj] = { total: 0, sum: 0 };
    bySubject[subj].total++;
    bySubject[subj].sum += g.score / Number(g.assessment.maxScore) * 100;
  }

  const byGroup: Record<string, { total: number; sum: number }> = {};
  for (const g of grades) {
    const grp = g.assessment.group?.name || "Unassigned";
    if (!byGroup[grp]) byGroup[grp] = { total: 0, sum: 0 };
    byGroup[grp].total++;
    byGroup[grp].sum += g.score / Number(g.assessment.maxScore) * 100;
  }

  const byMonth: Record<string, { total: number; sum: number }> = {};
  for (const g of grades) {
    const m = new Date(g.createdAt).toISOString().slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { total: 0, sum: 0 };
    byMonth[m].total++;
    byMonth[m].sum += g.score / Number(g.assessment.maxScore) * 100;
  }

  return {
    totalAssessments, totalResults: totalGrades, overallAverage,
    bySubject: Object.entries(bySubject).map(([name, v]) => ({ name, average: Math.round(v.sum / v.total * 100) / 100, count: v.total })),
    byGroup: Object.entries(byGroup).map(([name, v]) => ({ name, average: Math.round(v.sum / v.total * 100) / 100, count: v.total })),
    byMonth: Object.entries(byMonth).sort().map(([month, v]) => ({ month, average: Math.round(v.sum / v.total * 100) / 100 })),
  };
}

// --- Attendance ---

export async function getAttendanceReport(organizationId: string, range: DateRange) {
  const where: Record<string, unknown> = { organizationId };
  const adf = dateBetween("date", range);
  if (adf) Object.assign(where, adf);

  const records = await db.attendanceRecord.findMany({ where, include: { student: { include: { person: { select: { firstName: true, lastName: true } } } }, group: { select: { name: true } } } });

  const total = records.length;
  const present = records.filter(r => r.status === "PRESENT").length;
  const absent = records.filter(r => r.status === "ABSENT").length;
  const late = records.filter(r => r.status === "LATE").length;
  const excused = records.filter(r => r.status === "EXCUSED").length;

  const byGroup: Record<string, { total: number; present: number }> = {};
  for (const r of records) {
    const grp = r.group?.name || "Unknown";
    if (!byGroup[grp]) byGroup[grp] = { total: 0, present: 0 };
    byGroup[grp].total++;
    if (r.status === "PRESENT") byGroup[grp].present++;
  }

  const byStudent: Record<string, { name: string; total: number; present: number; absent: number }> = {};
  for (const r of records) {
    const sid = r.studentId;
    if (!byStudent[sid]) byStudent[sid] = { name: r.student.person.firstName + " " + r.student.person.lastName, total: 0, present: 0, absent: 0 };
    byStudent[sid].total++;
    if (r.status === "PRESENT") byStudent[sid].present++;
    if (r.status === "ABSENT") byStudent[sid].absent++;
  }

  const frequentAbsences = Object.values(byStudent).filter(s => s.absent >= 3).sort((a, b) => b.absent - a.absent).slice(0, 20);

  const byDayMap: Record<string, { total: number; present: number }> = {};
  for (const r of records) {
    const day = new Date(r.date).toLocaleDateString("en-US", { weekday: "long" });
    if (!byDayMap[day]) byDayMap[day] = { total: 0, present: 0 };
    byDayMap[day].total++;
    if (r.status === "PRESENT") byDayMap[day].present++;
  }

  return {
    totalStudents: Object.keys(byStudent).length, totalRecords: total, presentCount: present, absentCount: absent, lateCount: late, excusedCount: excused,
    rate: total > 0 ? Math.round((present / total) * 100) : null,
    byGroup: Object.entries(byGroup).map(([name, v]) => ({ name, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : null, total: v.total })),
    byDay: Object.entries(byDayMap).map(([day, v]) => ({ day, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : null })),
    frequentAbsences,
  };
}

// --- Finance ---

export async function getFinanceReport(organizationId: string, range: DateRange) {
  const [invoices, payments, refunds] = await Promise.all([
    db.invoice.findMany({ where: { organizationId } }),
    db.payment.findMany({ where: { organizationId, status: "COMPLETED" } }),
    db.refund.findMany({ where: { organizationId } }),
  ]);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalRefunded = refunds.reduce((s, r) => s + Number(r.amount), 0);
  const totalOutstanding = invoices.filter(i => ["PENDING", "PARTIAL", "OVERDUE"].includes(i.status)).reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
  const overdue = invoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const byMethod: Record<string, number> = {};
  for (const p of payments) { byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount); }

  const byMonth: Record<string, { invoiced: number; paid: number }> = {};
  for (const i of invoices) { const m = new Date(i.createdAt).toISOString().slice(0, 7); if (!byMonth[m]) byMonth[m] = { invoiced: 0, paid: 0 }; byMonth[m].invoiced += Number(i.totalAmount); }
  for (const p of payments) { const m = new Date(p.createdAt).toISOString().slice(0, 7); if (!byMonth[m]) byMonth[m] = { invoiced: 0, paid: 0 }; byMonth[m].paid += Number(p.amount); }

  return {
    totalInvoiced, totalPaid, totalRefunded, totalOutstanding, overdue, collectionRate,
    byMethod: Object.entries(byMethod).map(([method, amount]) => ({ method, amount })),
    byMonth: Object.entries(byMonth).sort().map(([month, v]) => ({ month, ...v })),
  };
}

// --- Admissions ---

export async function getAdmissionsReport(organizationId: string, range: DateRange) {
  const [leads, admissions, trials] = await Promise.all([
    db.lead.findMany({ where: { organizationId } }),
    db.admission.findMany({ where: { organizationId } }),
    db.trialSession.findMany({ where: { organizationId } }),
  ]);

  const leadsByStatus: Record<string, number> = {};
  for (const l of leads) { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1; }

  const admissionsByStatus: Record<string, number> = {};
  for (const a of admissions) { admissionsByStatus[a.status] = (admissionsByStatus[a.status] || 0) + 1; }

  const converted = leads.filter(l => l.status === "ENROLLED").length;
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const newLeads = range.startDate ? leads.filter(l => new Date(l.createdAt) >= new Date(range.startDate!)).length : totalLeads;

  const trialsCompleted = trials.filter(t => t.status === "COMPLETED").length;
  const trialsEnrolled = trials.filter(t => t.status === "ATTENDED").length;
  const trialConversion = trialsCompleted > 0 ? Math.round((trialsEnrolled / trialsCompleted) * 100) : 0;

  return {
    totalLeads, newLeads, totalAdmissions: admissions.length, converted, conversionRate,
    leadsByStatus: Object.entries(leadsByStatus).map(([status, count]) => ({ status, count })),
    admissionsByStatus: Object.entries(admissionsByStatus).map(([status, count]) => ({ status, count })),
    totalTrials: trials.length, trialsCompleted, trialConversion,
  };
}

// --- Scheduling ---

export async function getSchedulingReport(organizationId: string, range: DateRange) {
  const sessionsWhere: Record<string, unknown> = { organizationId };
  const sdf = dateBetween("createdAt", range);
  if (sdf) Object.assign(sessionsWhere, sdf);

  const [sessions, rooms, schedules] = await Promise.all([
    db.classSession.findMany({
      where: sessionsWhere,
      include: {
        group: { select: { name: true } },
        teacher: { select: { id: true, staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
        room: { select: { name: true } },
        subject: { select: { name: true } },
      },
    }),
    db.room.findMany({ where: { organizationId }, select: { id: true, name: true } }),
    db.schedule.findMany({ where: { organizationId } }),
  ]);

  const byDay: Record<string, number> = {};
  for (const s of sessions) { byDay[s.dayOfWeek] = (byDay[s.dayOfWeek] || 0) + 1; }

  const byTeacher: Record<string, number> = {};
  for (const s of sessions) {
    const name = s.teacher ? s.teacher.staff.person.firstName + " " + s.teacher.staff.person.lastName : "Unassigned";
    byTeacher[name] = (byTeacher[name] || 0) + 1;
  }

  const byRoom: Record<string, number> = {};
  for (const s of sessions) { const name = s.room?.name || "Unknown"; byRoom[name] = (byRoom[name] || 0) + 1; }

  const roomIds = new Set(sessions.map(s => s.roomId).filter(Boolean));
  const totalRooms = rooms.length;
  const usedRooms = roomIds.size;
  const roomUtilization = totalRooms > 0 ? Math.round((usedRooms / totalRooms) * 100) : 0;

  return {
    totalSessions: sessions.length, totalRooms, usedRooms, roomUtilization, totalSchedules: schedules.length,
    byDay: Object.entries(byDay).map(([day, count]) => ({ day, count })),
    byTeacher: Object.entries(byTeacher).sort((a, b) => b[1] - a[1]).map(([teacher, count]) => ({ teacher, count })),
    byRoom: Object.entries(byRoom).map(([room, count]) => ({ room, count })),
  };
}