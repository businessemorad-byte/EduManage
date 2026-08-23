import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createTrialSession(data: {
  organizationId: string;
  leadId: string;
  subjectId?: string;
  groupId?: string;
  teacherId?: string;
  roomId?: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  const trial = await db.trialSession.create({
    data: {
      organizationId: data.organizationId,
      leadId: data.leadId,
      subjectId: data.subjectId ?? null,
      groupId: data.groupId ?? null,
      teacherId: data.teacherId ?? null,
      roomId: data.roomId ?? null,
      scheduledDate: data.scheduledDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: "SCHEDULED",
      notes: data.notes ?? null,
    },
    include: {
      lead: true,
      subject: { select: { name: true } },
      teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
      room: { select: { name: true } },
    },
  });

  await db.lead.update({ where: { id: data.leadId }, data: { status: "TRIAL_SCHEDULED" } });
  await emitEvent({ type: EVENT_TYPES.TRIAL_SCHEDULED, organizationId: data.organizationId, payload: { id: trial.id, leadId: data.leadId } });
  return trial;
}

export async function getTrialById(id: string, organizationId: string) {
  return db.trialSession.findFirst({
    where: { id, organizationId },
    include: {
      lead: true,
      subject: { select: { name: true } },
      teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
      room: { select: { name: true } },
      group: { select: { name: true } },
    },
  });
}

export async function listTrialSessions(organizationId: string, params?: { status?: string; leadId?: string; teacherId?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.leadId) where.leadId = params.leadId;
  if (params?.teacherId) where.teacherId = params.teacherId;

  const [trials, total] = await Promise.all([
    db.trialSession.findMany({
      where,
      include: {
        lead: { select: { studentName: true, parentName: true, phone: true } },
        subject: { select: { name: true } },
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
        room: { select: { name: true } },
      },
      orderBy: { scheduledDate: "desc" },
      skip,
      take: limit,
    }),
    db.trialSession.count({ where }),
  ]);

  return { trials, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateTrialStatus(id: string, organizationId: string, status: string, data?: { attended?: boolean; result?: string; notes?: string }) {
  const trial = await db.trialSession.findFirst({ where: { id, organizationId } });
  if (!trial) throw new Error("Trial session not found");

  const update: Record<string, unknown> = { status };
  if (data?.attended !== undefined) update.attended = data.attended;
  if (data?.result !== undefined) update.result = data.result;
  if (data?.notes !== undefined) update.notes = data.notes;

  const updated = await db.trialSession.update({ where: { id }, data: update });

  if (status === "ATTENDED") {
    await db.lead.update({ where: { id: trial.leadId }, data: { status: "TRIAL_ATTENDED" } });
  }

  if (status === "COMPLETED") {
    await emitEvent({ type: EVENT_TYPES.TRIAL_COMPLETED, organizationId, payload: { id, leadId: trial.leadId, result: data?.result } });
  }

  return updated;
}
