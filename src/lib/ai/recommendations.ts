import { db } from "@/lib/prisma";

// ─── Recommendation Engine ────────────────────────────────────
// Deterministic recommendation generation.

export type Recommendation = {
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  suggestedAction: string;
  metadata?: Record<string, unknown>;
};

// ─── Attendance Recommendations ───────────────────────────────

export async function generateAttendanceRecommendations(organizationId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Students with consecutive absences
  const recentAbsences = await db.attendanceRecord.findMany({
    where: {
      organizationId,
      date: { gte: sevenDaysAgo },
      status: "ABSENT",
    },
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  const absenceCounts = new Map<string, { name: string; count: number; studentId: string }>();
  for (const r of recentAbsences) {
    const existing = absenceCounts.get(r.studentId);
    if (existing) {
      existing.count++;
    } else {
      absenceCounts.set(r.studentId, {
        name: `${r.student.person.firstName} ${r.student.person.lastName}`,
        count: 1,
        studentId: r.studentId,
      });
    }
  }

  for (const [, data] of absenceCounts) {
    if (data.count >= 3) {
      recs.push({
        type: "ATTENDANCE_FOLLOWUP",
        priority: data.count >= 5 ? "HIGH" : "MEDIUM",
        title: `Follow up on ${data.name}'s absences`,
        description: `${data.name} has been absent ${data.count} times in the last 7 days.`,
        entityType: "Student",
        entityId: data.studentId,
        suggestedAction: "Contact parent/guardian to discuss attendance pattern",
        metadata: { absenceCount: data.count },
      });
    }
  }

  return recs;
}

// ─── Financial Recommendations ────────────────────────────────

export async function generateFinancialRecommendations(organizationId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Invoices due soon
  const dueSoon = await db.invoice.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { gte: now, lte: sevenDaysFromNow },
    },
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (dueSoon.length > 0) {
    recs.push({
      type: "PAYMENT_REMINDER",
      priority: "MEDIUM",
      title: `${dueSoon.length} invoices due in the next 7 days`,
      description: `Total amount: ${dueSoon.reduce((sum, i) => sum + Number(i.totalAmount), 0).toLocaleString()}`,
      entityType: "Invoice",
      suggestedAction: "Send payment reminders to parents",
      metadata: { count: dueSoon.length },
    });
  }

  return recs;
}

// ─── Academic Recommendations ─────────────────────────────────

export async function generateAcademicRecommendations(organizationId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];

  // Students with declining grades
  const recentGrades = await db.grade.findMany({
    where: { organizationId },
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const studentGrades = new Map<string, { name: string; scores: number[]; studentId: string }>();
  for (const g of recentGrades) {
    const existing = studentGrades.get(g.studentId);
    const name = `${g.student.person.firstName} ${g.student.person.lastName}`;
    if (existing) {
      existing.scores.push(Number(g.score));
    } else {
      studentGrades.set(g.studentId, { name, scores: [Number(g.score)], studentId: g.studentId });
    }
  }

  for (const [, data] of studentGrades) {
    if (data.scores.length < 2) continue;
    const first = data.scores[0];
    const last = data.scores[data.scores.length - 1];
    if (last < first - 15) {
      recs.push({
        type: "GRADE_DECLINE",
        priority: "HIGH",
        title: `${data.name}'s grades are declining`,
        description: `Latest grade: ${last}, was: ${first}. Drop of ${first - last} points.`,
        entityType: "Student",
        entityId: data.studentId,
        suggestedAction: "Schedule meeting with teacher to discuss intervention strategies",
      });
    }
  }

  return recs;
}

// ─── Enrollment Recommendations ───────────────────────────────

export async function generateEnrollmentRecommendations(organizationId: string): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Leads that haven't been followed up
  const staleLeads = await db.lead.findMany({
    where: {
      organizationId,
      createdAt: { lte: thirtyDaysAgo },
    },
    take: 10,
  });

  if (staleLeads.length > 0) {
    recs.push({
      type: "STALE_LEADS",
      priority: "MEDIUM",
      title: `${staleLeads.length} leads need follow-up`,
      description: `${staleLeads.length} leads have been waiting for follow-up for over 30 days.`,
      entityType: "Lead",
      suggestedAction: "Assign staff to follow up with pending leads",
      metadata: { count: staleLeads.length },
    });
  }

  return recs;
}

// ─── Combined Recommendations ─────────────────────────────────

export async function generateAllRecommendations(organizationId: string): Promise<Recommendation[]> {
  const [attendance, financial, academic, enrollment] = await Promise.all([
    generateAttendanceRecommendations(organizationId),
    generateFinancialRecommendations(organizationId),
    generateAcademicRecommendations(organizationId),
    generateEnrollmentRecommendations(organizationId),
  ]);

  return [...attendance, ...financial, ...academic, ...enrollment].sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ─── Persist Recommendations ──────────────────────────────────

export async function saveRecommendations(organizationId: string, recommendations: Recommendation[]) {
  // Clear old pending recommendations
  await db.aIRecommendation.deleteMany({
    where: { organizationId, status: "PENDING" },
  });

  // Save new ones
  return db.aIRecommendation.createMany({
    data: recommendations.map((r) => ({
      organizationId,
      type: r.type,
      priority: r.priority,
      title: r.title,
      description: r.description,
      entityType: r.entityType,
      entityId: r.entityId,
      suggestedAction: r.suggestedAction,
      metadata: r.metadata as never,
      status: "PENDING",
    })),
  });
}

export async function listRecommendations(organizationId: string, status?: string) {
  return db.aIRecommendation.findMany({
    where: { organizationId, ...(status ? { status } : {}) },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function updateRecommendationStatus(organizationId: string, id: string, status: "ACCEPTED" | "DISMISSED") {
  return db.aIRecommendation.updateMany({
    where: { id, organizationId },
    data: { status },
  });
}
