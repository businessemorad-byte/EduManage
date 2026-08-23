import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createLead(data: {
  organizationId: string;
  branchId?: string;
  studentName: string;
  parentName?: string;
  phone?: string;
  email?: string;
  desiredLevelId?: string;
  desiredSubjectId?: string;
  preferredSchedule?: string;
  source?: string;
  assignedToId?: string;
  notes?: string;
}) {
  const lead = await db.lead.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId ?? null,
      studentName: data.studentName,
      parentName: data.parentName ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      desiredLevelId: data.desiredLevelId ?? null,
      desiredSubjectId: data.desiredSubjectId ?? null,
      preferredSchedule: data.preferredSchedule ?? null,
      source: (data.source as never) ?? "WALK_IN",
      assignedToId: data.assignedToId ?? null,
      notes: data.notes ?? null,
      status: "LEAD",
    },
  });

  await emitEvent({ type: EVENT_TYPES.LEAD_CREATED, organizationId: data.organizationId, payload: { id: lead.id, studentName: data.studentName } });
  return lead;
}

export async function listLeads(organizationId: string, params?: { status?: string; source?: string; branchId?: string; assignedToId?: string; search?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.source) where.source = params.source;
  if (params?.branchId) where.branchId = params.branchId;
  if (params?.assignedToId) where.assignedToId = params.assignedToId;
  if (params?.search) {
    where.OR = [
      { studentName: { contains: params.search, mode: "insensitive" } },
      { parentName: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        desiredLevel: { select: { name: true } },
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        trialSessions: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.lead.count({ where }),
  ]);

  return { leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateLeadStatus(id: string, organizationId: string, status: string, notes?: string) {
  const lead = await db.lead.findFirst({ where: { id, organizationId } });
  if (!lead) throw new Error("Lead not found");

  const update: Record<string, unknown> = { status };
  if (notes !== undefined) update.notes = notes;

  const updated = await db.lead.update({ where: { id }, data: update });

  if (status === "LOST") {
    await emitEvent({ type: EVENT_TYPES.LEAD_LOST, organizationId, payload: { id, studentName: lead.studentName } });
  }

  return updated;
}

export async function convertLead(id: string, organizationId: string, studentId: string) {
  const lead = await db.lead.findFirst({ where: { id, organizationId } });
  if (!lead) throw new Error("Lead not found");

  const updated = await db.lead.update({
    where: { id },
    data: { status: "ENROLLED", studentId, convertedAt: new Date() },
  });

  await emitEvent({ type: EVENT_TYPES.LEAD_CONVERTED, organizationId, payload: { id, studentId, studentName: lead.studentName } });
  return updated;
}

export async function getLeadById(id: string, organizationId: string) {
  return db.lead.findFirst({
    where: { id, organizationId },
    include: {
      branch: { select: { id: true, name: true } },
      desiredLevel: { select: { id: true, name: true } },
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
      trialSessions: {
        include: {
          teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
          room: { select: { name: true } },
        },
        orderBy: { scheduledDate: "desc" },
      },
    },
  });
}

export async function getLeadStats(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, byStatus, thisMonth] = await Promise.all([
    db.lead.count({ where: { organizationId } }),
    db.lead.groupBy({ by: ["status"], where: { organizationId }, _count: true }),
    db.lead.count({ where: { organizationId, createdAt: { gte: startOfMonth } } }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const converted = statusMap["ENROLLED"] ?? 0;
  const lost = statusMap["LOST"] ?? 0;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return {
    total,
    newThisMonth: thisMonth,
    byStatus: statusMap,
    conversionRate,
    contacted: statusMap["CONTACTED"] ?? 0,
    interested: statusMap["INTERESTED"] ?? 0,
    trialScheduled: statusMap["TRIAL_SCHEDULED"] ?? 0,
    enrolled: converted,
    lost,
  };
}
