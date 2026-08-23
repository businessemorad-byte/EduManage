const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const part4 = `
// ─── Finance ─────────────────────────────────────────────────────

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

// ─── Admissions ──────────────────────────────────────────────────

export async function getAdmissionsReport(organizationId: string, range: DateRange) {
  const [leads, admissions, trials] = await Promise.all([
    db.lead.findMany({ where: { organizationId } }),
    db.admission.findMany({ where: { organizationId } }),
    db.trial.findMany({ where: { organizationId } }),
  ]);

  const leadsByStatus: Record<string, number> = {};
  for (const l of leads) { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1; }

  const admissionsByStatus: Record<string, number> = {};
  for (const a of admissions) { admissionsByStatus[a.status] = (admissionsByStatus[a.status] || 0) + 1; }

  const converted = leads.filter(l => l.status === "CONVERTED").length;
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const newLeads = range.startDate ? leads.filter(l => new Date(l.createdAt) >= new Date(range.startDate)).length : totalLeads;

  const trialsCompleted = trials.filter(t => t.status === "COMPLETED").length;
  const trialsEnrolled = trials.filter(t => t.status === "ENROLLED").length;
  const trialConversion = trialsCompleted > 0 ? Math.round((trialsEnrolled / trialsCompleted) * 100) : 0;

  return {
    totalLeads, newLeads, totalAdmissions, converted, conversionRate,
    leadsByStatus: Object.entries(leadsByStatus).map(([status, count]) => ({ status, count })),
    admissionsByStatus: Object.entries(admissionsByStatus).map(([status, count]) => ({ status, count })),
    totalTrials: trials.length, trialsCompleted, trialConversion,
  };
}

// ─── Scheduling ──────────────────────────────────────────────────

export async function getSchedulingReport(organizationId: string, range: DateRange) {
  const sessionsWhere: Record<string, unknown> = { organizationId };
  const sdf = dateBetween("createdAt", range);
  if (sdf) Object.assign(sessionsWhere, sdf);

  const [sessions, rooms, schedules] = await Promise.all([
    db.classSession.findMany({ where: sessionsWhere, include: { group: { select: { name: true } }, teacher: { include: { person: { select: { firstName: true, lastName: true } } } }, room: { select: { name: true } }, subject: { select: { name: true } } } }),
    db.room.findMany({ where: { organizationId }, select: { id: true, name: true } }),
    db.schedule.findMany({ where: { organizationId } }),
  ]);

  const byDay: Record<string, number> = {};
  for (const s of sessions) { byDay[s.dayOfWeek] = (byDay[s.dayOfWeek] || 0) + 1; }

  const byTeacher: Record<string, number> = {};
  for (const s of sessions) {
    const name = s.teacher ? s.teacher.person.firstName + " " + s.teacher.person.lastName : "Unassigned";
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
`;

fs.appendFileSync(path.join(base, 'src/lib/reports.ts'), part4);
console.log('Part 4 done - reports.ts complete');
