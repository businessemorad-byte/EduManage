import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createAnnouncement(data: {
  organizationId: string;
  branchId?: string;
  groupId?: string;
  title: string;
  content: string;
  audience?: string;
  expiresAt?: string;
}) {
  return db.announcement.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId ?? null,
      groupId: data.groupId ?? null,
      title: data.title,
      content: data.content,
      audience: (data.audience as "ALL_STUDENTS" | "ALL_PARENTS" | "ALL_TEACHERS" | "ALL_STAFF" | "SPECIFIC_CLASS" | "SPECIFIC_BRANCH") ?? "ALL_STUDENTS",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function listAnnouncements(organizationId: string, params?: { status?: string; audience?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.audience) where.audience = params.audience;

  const [announcements, total] = await Promise.all([
    db.announcement.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.announcement.count({ where }),
  ]);

  return { announcements, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function publishAnnouncement(id: string, organizationId: string) {
  const announcement = await db.announcement.findFirst({ where: { id, organizationId } });
  if (!announcement) throw new Error("Announcement not found");

  const updated = await db.announcement.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await emitEvent({
    type: EVENT_TYPES.ANNOUNCEMENT_PUBLISHED,
    organizationId,
    payload: { id: updated.id, title: updated.title, audience: updated.audience },
  });

  return updated;
}

export async function archiveAnnouncement(id: string, organizationId: string) {
  const announcement = await db.announcement.findFirst({ where: { id, organizationId } });
  if (!announcement) throw new Error("Announcement not found");
  return db.announcement.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function deleteAnnouncement(id: string, organizationId: string) {
  return db.announcement.delete({ where: { id, organizationId } });
}

export async function getAnnouncement(id: string, organizationId: string) {
  return db.announcement.findFirst({
    where: { id, organizationId },
    include: {
      branch: { select: { name: true } },
      group: { select: { name: true } },
    },
  });
}
