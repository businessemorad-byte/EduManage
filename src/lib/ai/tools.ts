import { db } from "@/lib/prisma";

// ─── Structured Query Tools ───────────────────────────────────
// Read-only DB queries for AI to use as context.

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export async function queryStudents(organizationId: string, filters?: { status?: string; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 20;
  const students = await db.student.findMany({
    where: {
      organizationId,
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    include: {
      person: { select: { firstName: true, lastName: true, email: true } },
    },
    take: limit,
  });

  return {
    success: true,
    data: students.map((s) => ({
      id: s.id,
      name: `${s.person.firstName} ${s.person.lastName}`,
      email: s.person.email,
      status: s.status,
    })),
  };
}

export async function queryAttendance(organizationId: string, filters?: { date?: string; studentId?: string; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 50;
  const where: Record<string, unknown> = { organizationId };
  if (filters?.date) where.date = new Date(filters.date);
  if (filters?.studentId) where.studentId = filters.studentId;

  const records = await db.attendanceRecord.findMany({
    where,
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return {
    success: true,
    data: records.map((r) => ({
      student: `${r.student.person.firstName} ${r.student.person.lastName}`,
      date: r.date,
      status: r.status,
      notes: r.notes,
    })),
  };
}

export async function queryGrades(organizationId: string, filters?: { studentId?: string; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 50;
  const where: Record<string, unknown> = { organizationId };
  if (filters?.studentId) where.studentId = filters.studentId;

  const grades = await db.grade.findMany({
    where,
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
      assessment: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return {
    success: true,
    data: grades.map((g) => ({
      student: `${g.student.person.firstName} ${g.student.person.lastName}`,
      assessment: g.assessment.name,
      score: Number(g.score),
    })),
  };
}

export async function queryPayments(organizationId: string, filters?: { status?: string; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 50;
  const where: Record<string, unknown> = { organizationId };
  if (filters?.status) where.status = filters.status;

  const payments = await db.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          student: {
            include: { person: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return {
    success: true,
    data: payments.map((p) => ({
      id: p.id,
      student: `${p.invoice.student.person.firstName} ${p.invoice.student.person.lastName}`,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      date: p.createdAt,
    })),
  };
}

export async function queryLeads(organizationId: string, filters?: { status?: string; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 50;
  const where: Record<string, unknown> = { organizationId };
  if (filters?.status) where.status = filters.status;

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return {
    success: true,
    data: leads.map((l) => ({
      id: l.id,
      name: l.studentName,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
    })),
  };
}

export async function queryNotifications(organizationId: string, filters?: { unreadOnly?: boolean; limit?: number }): Promise<ToolResult> {
  const limit = filters?.limit ?? 20;
  const where: Record<string, unknown> = { organizationId };
  if (filters?.unreadOnly) where.isRead = false;

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return {
    success: true,
    data: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.body,
      type: n.type,
      isRead: n.read,
      createdAt: n.createdAt,
    })),
  };
}

// ─── Tool Registry ────────────────────────────────────────────

export const AI_TOOLS = {
  query_students: { name: "query_students", description: "Query students with optional status filter", fn: queryStudents },
  query_attendance: { name: "query_attendance", description: "Query attendance records by date or student", fn: queryAttendance },
  query_grades: { name: "query_grades", description: "Query grade records by student", fn: queryGrades },
  query_payments: { name: "query_payments", description: "Query payments with optional status filter", fn: queryPayments },
  query_leads: { name: "query_leads", description: "Query leads with optional status filter", fn: queryLeads },
  query_notifications: { name: "query_notifications", description: "Query notifications, optionally unread only", fn: queryNotifications },
} as const;

export type ToolName = keyof typeof AI_TOOLS;

export async function executeTool(organizationId: string, toolName: ToolName, filters?: Record<string, unknown>): Promise<ToolResult> {
  const tool = AI_TOOLS[toolName];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  return tool.fn(organizationId, filters);
}
