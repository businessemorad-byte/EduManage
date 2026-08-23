import { db } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";
export type NotificationCategory = "attendance" | "finance" | "academic" | "system" | "automation" | "communication";

export type CreateNotificationInput = {
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  category?: NotificationCategory;
  referenceType?: string;
  referenceId?: string;
  sourceEvent?: string;
  metadata?: Record<string, unknown>;
};

// ─── In-App Notifications ──────────────────────────────────────

export async function createNotification(data: CreateNotificationInput) {
  return db.notification.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type ?? "INFO",
      category: data.category,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      sourceEvent: data.sourceEvent,
      metadata: (data.metadata as never) ?? undefined,
    },
  });
}

export async function createBulkNotifications(inputs: CreateNotificationInput[]) {
  return db.notification.createMany({
    data: inputs.map((i) => ({
      organizationId: i.organizationId,
      userId: i.userId,
      title: i.title,
      body: i.body,
      type: i.type ?? "INFO",
      category: i.category,
      referenceType: i.referenceType,
      referenceId: i.referenceId,
      metadata: (i.metadata as never) ?? undefined,
    })),
  });
}

export async function getUserNotifications(userId: string, organizationId: string, unreadOnly = false) {
  return db.notification.findMany({
    where: {
      userId,
      organizationId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getUnreadCount(userId: string, organizationId: string) {
  return db.notification.count({
    where: { userId, organizationId, read: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string, organizationId: string) {
  return db.notification.updateMany({
    where: { userId, organizationId, read: false },
    data: { read: true, readAt: new Date() },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return db.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

// ─── Archive ───────────────────────────────────────────────────

export async function archiveNotification(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { archived: true },
  });
}

export async function unarchiveNotification(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { archived: false },
  });
}

export async function archiveAllNotifications(userId: string, organizationId: string) {
  return db.notification.updateMany({
    where: { userId, organizationId, archived: false },
    data: { archived: true },
  });
}

// ─── Filtering ─────────────────────────────────────────────────

export type NotificationFilters = {
  category?: string;
  type?: string;
  read?: boolean;
  archived?: boolean;
  search?: string;
};

export async function getFilteredNotifications(
  userId: string,
  organizationId: string,
  filters: NotificationFilters = {},
  page = 1,
  pageSize = 50
) {
  const where = {
    userId,
    organizationId,
    archived: filters.archived ?? false,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.read !== undefined ? { read: filters.read } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" as const } },
            { body: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.notification.count({ where }),
  ]);

  return { notifications, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getNotificationCounts(userId: string, organizationId: string) {
  const [total, unread, archived] = await Promise.all([
    db.notification.count({
      where: { userId, organizationId, archived: false },
    }),
    db.notification.count({
      where: { userId, organizationId, read: false, archived: false },
    }),
    db.notification.count({
      where: { userId, organizationId, archived: true },
    }),
  ]);

  return { total, unread, archived };
}

// ─── Provider Abstraction (future: email, sms, whatsapp, push) ─

export type NotificationProvider = {
  name: string;
  send(data: {
    to: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Promise<boolean>;
};

const providers: NotificationProvider[] = [];

export function registerProvider(provider: NotificationProvider) {
  providers.push(provider);
}

export async function sendExternalNotification(data: {
  to: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  let sent = false;
  for (const provider of providers) {
    try {
      const result = await provider.send(data);
      if (result) sent = true;
    } catch {
      // Provider failure doesn't break others
    }
  }
  return sent;
}
