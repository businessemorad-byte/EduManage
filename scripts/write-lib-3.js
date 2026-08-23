const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

const part3 = `
// ─── Academic ────────────────────────────────────────────────────

export async function getAcademicReport(organizationId: string, range: DateRange) {
  const assessmentWhere: Record<string, unknown> = { organizationId };
  const df = dateBetween("createdAt", range);
  if (df) Object.assign(assessmentWhere, df);

  const [assessments, results] = await Promise.all([
    db.assessment.findMany({ where: assessmentWhere, include: { group: { select: { name: true } }, subject: { select: { name: true } } } }),
    db.assessmentResult.findMany({ where: { assessment: { organizationId } }, include: { assessment: { select: { maxScore: true, group: { select: { name: true } }, subject: { select: { name: true } } } } } }),
  ]);

  const totalAssessments = assessments.length;
  const totalResults = results.length;
  const avgScore = totalResults > 0 ? results.reduce((sum, r) => sum + (Number(r.score) / Number(r.assessment.maxScore) * 100), 0) / totalResults : 0;

  const bySubject: Record<string, { total: number; sum: number }> = {};
  for (const r of results) {
    const subj = r.assessment.subject?.name || "Unassigned";
    if (!bySubject[subj]) bySubject[subj] = { total: 0, sum: 0 };
    bySubject[subj].total++;
    bySubject[subj].sum += Number(r.score) / Number(r.assessment.maxScore) * 100;
  }

  const byGroup: Record<string, { total: number; sum: number }> = {};
  for (const r of results) {
    const grp = r.assessment.group?.name || "Unassigned";
    if (!byGroup[grp]) byGroup[grp] = { total: 0, sum: 0 };
    byGroup[grp].total++;
    byGroup[grp].sum += Number(r.score) / Number(r.assessment.maxScore) * 100;
  }

  return {
    totalAssessments, totalResults, averageScore: Math.round(avgScore * 100) / 100,
    bySubject: Object.entries(bySubject).map(([name, v]) => ({ name, average: Math.round(v.sum / v.total * 100) / 100, count: v.total })),
    byGroup: Object.entries(byGroup).map(([name, v]) => ({ name, average: Math.round(v.sum / v.total * 100) / 100, count: v.total })),
    strongPerformers: results.filter(r => (Number(r.score) / Number(r.assessment.maxScore)) >= 0.8).length,
    belowThreshold: results.filter(r => (Number(r.score) / Number(r.assessment.maxScore)) < 0.5).length,
  };
}

// ─── Attendance ──────────────────────────────────────────────────

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

  return {
    total, present, absent, late, excused,
    rate: total > 0 ? Math.round((present / total) * 100) : 0,
    absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
    byGroup: Object.entries(byGroup).map(([name, v]) => ({ name, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0, total: v.total })),
    frequentAbsences,
  };
}
`;

fs.appendFileSync(path.join(base, 'src/lib/reports.ts'), part3);
console.log('Part 3 done');
