import { db } from "@/lib/prisma";
import { emitEvent } from "@/lib/events";
import { createNotification } from "@/lib/notifications";
import { resolveTemplateFull, getTemplateByCode } from "@/lib/template-engine";

// ─── Types ─────────────────────────────────────────────────────

export type CommunicationChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";

export type SendInput = {
  organizationId: string;
  senderId?: string;
  recipientType: string;
  recipientId?: string;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  templateCode?: string;
  templateVariables?: Record<string, unknown>;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
};

export type BulkSendInput = {
  organizationId: string;
  senderId?: string;
  recipients: { type: string; id: string }[];
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  templateCode?: string;
  templateVariables?: Record<string, unknown>;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
};

// ─── Core Send ─────────────────────────────────────────────────

export async function sendCommunication(input: SendInput) {
  const idempotencyKey = `${input.organizationId}:${input.channel}:${input.templateCode ?? "adhoc"}:${input.recipientType}:${input.recipientId ?? "all"}:${Date.now()}`;

  if (input.templateCode) {
    const template = await getTemplateByCode(
      input.templateCode,
      input.channel,
      input.organizationId
    );
    if (template) {
      const resolved = resolveTemplateFull(
        template.subject,
        template.body,
        input.templateVariables ?? {}
      );
      input.body = resolved.body;
      if (resolved.subject) input.subject = resolved.subject;
    }
  }

  const log = await db.communicationLog.create({
    data: {
      organizationId: input.organizationId,
      senderId: input.senderId,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      channel: input.channel,
      subject: input.subject,
      content: input.body,
      status: "QUEUED",
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      campaignId: input.campaignId,
      templateId: input.templateCode ?? null,
      idempotencyKey,
      metadata: (input.metadata as never) ?? undefined,
    },
  });

  if (input.channel === "IN_APP") {
    await sendInAppNotification(input, log.id);
  } else if (input.channel === "EMAIL") {
    await sendEmail(input, log.id);
  } else if (input.channel === "SMS") {
    await sendSms(input, log.id);
  } else if (input.channel === "WHATSAPP") {
    await sendWhatsApp(input, log.id);
  }

  return log;
}

export async function sendBulkCommunication(input: BulkSendInput) {
  const results = [];
  for (const recipient of input.recipients) {
    const result = await sendCommunication({
      ...input,
      recipientType: recipient.type,
      recipientId: recipient.id,
      senderId: input.senderId,
    });
    results.push(result);
  }
  return results;
}

// ─── Channel Implementations ───────────────────────────────────

async function sendInAppNotification(input: SendInput, logId: string) {
  try {
    const targetUserId = input.recipientId;

    if (!targetUserId && input.recipientType === "ORGANIZATION") {
      const members = await db.organizationMember.findMany({
        where: { organizationId: input.organizationId, isActive: true },
        select: { userId: true },
      });
      for (const member of members) {
        await createNotification({
          organizationId: input.organizationId,
          userId: member.userId,
          title: input.subject ?? "Notification",
          body: input.body,
          type: "INFO",
          category: "communication",
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          sourceEvent: input.templateCode,
        });
      }
    } else if (targetUserId) {
      await createNotification({
        organizationId: input.organizationId,
        userId: targetUserId,
        title: input.subject ?? "Notification",
        body: input.body,
        type: "INFO",
        category: "communication",
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        sourceEvent: input.templateCode,
      });
    }

    await updateLogStatus(logId, "DELIVERED");
    await emitEvent({
      type: "notification.sent",
      organizationId: input.organizationId,
      payload: { logId, channel: "IN_APP", recipientType: input.recipientType },
    });
  } catch (err) {
    await updateLogStatus(logId, "FAILED", String(err));
  }
}

async function sendEmail(input: SendInput, logId: string) {
  try {
    const provider = await db.communicationProvider.findFirst({
      where: {
        organizationId: input.organizationId,
        channel: "EMAIL",
        enabled: true,
        status: "ACTIVE",
      },
    });

    if (!provider) {
      await updateLogStatus(logId, "FAILED", "No active email provider configured");
      return;
    }

    await db.communicationLog.update({
      where: { id: logId },
      data: {
        provider: provider.provider,
        status: "SENDING",
        sentAt: new Date(),
      },
    });

    await emitEvent({
      type: "email.sent",
      organizationId: input.organizationId,
      payload: { logId, provider: provider.provider, recipientType: input.recipientType },
    });

    await updateLogStatus(logId, "SENT");
  } catch (err) {
    await updateLogStatus(logId, "FAILED", String(err));
  }
}

async function sendSms(input: SendInput, logId: string) {
  try {
    const provider = await db.communicationProvider.findFirst({
      where: {
        organizationId: input.organizationId,
        channel: "SMS",
        enabled: true,
        status: "ACTIVE",
      },
    });

    if (!provider) {
      await updateLogStatus(logId, "FAILED", "No active SMS provider configured");
      return;
    }

    await db.communicationLog.update({
      where: { id: logId },
      data: {
        provider: provider.provider,
        status: "SENDING",
        sentAt: new Date(),
      },
    });

    await emitEvent({
      type: "sms.sent",
      organizationId: input.organizationId,
      payload: { logId, provider: provider.provider, recipientType: input.recipientType },
    });

    await updateLogStatus(logId, "SENT");
  } catch (err) {
    await updateLogStatus(logId, "FAILED", String(err));
  }
}

async function sendWhatsApp(input: SendInput, logId: string) {
  try {
    const provider = await db.communicationProvider.findFirst({
      where: {
        organizationId: input.organizationId,
        channel: "WHATSAPP",
        enabled: true,
        status: "ACTIVE",
      },
    });

    if (!provider) {
      await updateLogStatus(logId, "FAILED", "No active WhatsApp provider configured");
      return;
    }

    await db.communicationLog.update({
      where: { id: logId },
      data: {
        provider: provider.provider,
        status: "SENDING",
        sentAt: new Date(),
      },
    });

    await emitEvent({
      type: "whatsapp.sent",
      organizationId: input.organizationId,
      payload: { logId, provider: provider.provider, recipientType: input.recipientType },
    });

    await updateLogStatus(logId, "SENT");
  } catch (err) {
    await updateLogStatus(logId, "FAILED", String(err));
  }
}

// ─── Log Status Updates ────────────────────────────────────────

async function updateLogStatus(
  logId: string,
  status: string,
  error?: string
) {
  const updateData: Record<string, unknown> = { status };
  if (status === "SENT") updateData.sentAt = new Date();
  if (status === "DELIVERED") updateData.deliveredAt = new Date();
  if (status === "FAILED") {
    updateData.failedAt = new Date();
    updateData.errorMessage = error;
    updateData.retryCount = { increment: 1 };
  }

  await db.communicationLog.update({
    where: { id: logId },
    data: updateData,
  });
}

// ─── Delivery Logs ─────────────────────────────────────────────

export async function getDeliveryLogs(
  organizationId: string,
  filters?: {
    channel?: string;
    status?: string;
    campaignId?: string;
    recipientType?: string;
    from?: Date;
    to?: Date;
  },
  page = 1,
  pageSize = 50
) {
  const where = {
    organizationId,
    ...(filters?.channel ? { channel: filters.channel } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters?.recipientType ? { recipientType: filters.recipientType } : {}),
    ...(filters?.from || filters?.to
      ? {
          createdAt: {
            ...(filters?.from ? { gte: filters.from } : {}),
            ...(filters?.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.communicationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.communicationLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getDeliveryStats(organizationId: string, from?: Date, to?: Date) {
  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {};

  const [total, sent, delivered, failed] = await Promise.all([
    db.communicationLog.count({ where: { organizationId, ...dateFilter } }),
    db.communicationLog.count({ where: { organizationId, status: "SENT", ...dateFilter } }),
    db.communicationLog.count({ where: { organizationId, status: "DELIVERED", ...dateFilter } }),
    db.communicationLog.count({ where: { organizationId, status: "FAILED", ...dateFilter } }),
  ]);

  return { total, sent, delivered, failed };
}

// ─── Messages (User-to-User) ───────────────────────────────────

export async function sendMessage(data: {
  organizationId: string;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  subject?: string;
  content: string;
}) {
  const message = await db.message.create({
    data: {
      organizationId: data.organizationId,
      senderId: data.senderId,
      senderType: data.senderType,
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      subject: data.subject,
      content: data.content,
    },
  });

  await emitEvent({
    type: "message.sent",
    organizationId: data.organizationId,
    payload: { messageId: message.id, senderId: data.senderId, recipientId: data.recipientId },
  });

  return message;
}

export async function getMessages(
  organizationId: string,
  userId: string,
  filters?: { unreadOnly?: boolean; sentOnly?: boolean }
) {
  return db.message.findMany({
    where: {
      organizationId,
      ...(filters?.sentOnly
        ? { senderId: userId }
        : { recipientId: userId }),
      ...(filters?.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markMessageAsRead(messageId: string, userId: string) {
  return db.message.updateMany({
    where: { id: messageId, recipientId: userId, read: false },
    data: { read: true, readAt: new Date() },
  });
}

export async function getUnreadMessageCount(userId: string, organizationId: string) {
  return db.message.count({
    where: { recipientId: userId, organizationId, read: false },
  });
}

// ─── Contact Requests ──────────────────────────────────────────

export async function createContactRequest(data: {
  organizationId: string;
  senderId?: string;
  senderType?: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  subject: string;
  message: string;
  category?: string;
}) {
  const request = await db.contactRequest.create({
    data: {
      organizationId: data.organizationId,
      senderId: data.senderId,
      senderType: data.senderType ?? "STUDENT",
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      senderPhone: data.senderPhone,
      subject: data.subject,
      message: data.message,
      category: data.category ?? "GENERAL",
    },
  });

  await emitEvent({
    type: "contact_request.created",
    organizationId: data.organizationId,
    payload: { contactRequestId: request.id, category: request.category },
  });

  return request;
}

export async function getContactRequests(
  organizationId: string,
  filters?: { status?: string; category?: string },
  page = 1,
  pageSize = 50
) {
  const where = {
    organizationId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.category ? { category: filters.category } : {}),
  };

  const [requests, total] = await Promise.all([
    db.contactRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.contactRequest.count({ where }),
  ]);

  return { requests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function resolveContactRequest(
  id: string,
  organizationId: string,
  assignedTo: string
) {
  return db.contactRequest.updateMany({
    where: { id, organizationId },
    data: { status: "RESOLVED", assignedTo, resolvedAt: new Date() },
  });
}

// ─── Communication Settings ────────────────────────────────────

export async function getCommunicationSettings(organizationId: string) {
  let settings = await db.communicationSetting.findUnique({
    where: { organizationId },
  });

  if (!settings) {
    settings = await db.communicationSetting.create({
      data: { organizationId },
    });
  }

  return settings;
}

export async function updateCommunicationSettings(
  organizationId: string,
  data: Partial<{
    senderName: string;
    senderEmail: string;
    replyToEmail: string;
    defaultLanguage: string;
    timezone: string;
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    pushEnabled: boolean;
  }>
) {
  return db.communicationSetting.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });
}

// ─── Providers ─────────────────────────────────────────────────

export async function listProviders(organizationId: string) {
  return db.communicationProvider.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function testProvider(id: string, organizationId: string) {
  const provider = await db.communicationProvider.findFirst({
    where: { id, organizationId },
  });

  if (!provider) throw new Error("Provider not found");

  try {
    await db.communicationProvider.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: "SUCCESS",
        lastTestError: null,
      },
    });

    await emitEvent({
      type: "provider.tested",
      organizationId,
      payload: { providerId: id, channel: provider.channel },
    });

    return { success: true };
  } catch (err) {
    await db.communicationProvider.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: "FAILED",
        lastTestError: String(err),
      },
    });

    await emitEvent({
      type: "provider.failed",
      organizationId,
      payload: { providerId: id, channel: provider.channel, error: String(err) },
    });

    return { success: false, error: String(err) };
  }
}

// ─── Campaigns ─────────────────────────────────────────────────

export async function createCampaign(data: {
  organizationId: string;
  name: string;
  description?: string;
  templateId?: string;
  channels: string[];
  audience: Record<string, unknown>;
  createdBy?: string;
}) {
  return db.communicationCampaign.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      templateId: data.templateId ?? null,
      channels: data.channels as string[],
      audience: data.audience as unknown as object,
      createdBy: data.createdBy,
    },
  });
}

export async function updateCampaign(
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    description: string;
    status: string;
    scheduledAt: Date;
  }>
) {
  return db.communicationCampaign.updateMany({
    where: { id, organizationId },
    data,
  });
}

export async function getCampaign(id: string, organizationId: string) {
  return db.communicationCampaign.findFirst({
    where: { id, organizationId },
    include: { deliveries: { take: 100 } },
  });
}

export async function listCampaigns(
  organizationId: string,
  filters?: { status?: string },
  page = 1,
  pageSize = 20
) {
  const where = {
    organizationId,
    ...(filters?.status ? { status: filters.status } : {}),
  };

  const [campaigns, total] = await Promise.all([
    db.communicationCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.communicationCampaign.count({ where }),
  ]);

  return { campaigns, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Dashboard Stats ───────────────────────────────────────────

export async function getCommunicationDashboard(organizationId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [deliveryStats, activeCampaigns, recentLogs, templates, openContactRequests] =
    await Promise.all([
      getDeliveryStats(organizationId, thirtyDaysAgo),
      db.communicationCampaign.count({
        where: { organizationId, status: { in: ["RUNNING", "SCHEDULED"] } },
      }),
      db.communicationLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.communicationTemplate.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      db.contactRequest.count({
        where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
    ]);

  return {
    deliveryStats,
    activeCampaigns,
    recentLogs,
    templates,
    openContactRequests,
  };
}

// ─── User Preferences ──────────────────────────────────────────

export async function getUserPreferences(userId: string, organizationId: string) {
  return db.userPreference.findMany({
    where: { userId, organizationId },
  });
}

export async function updateUserPreference(
  userId: string,
  organizationId: string,
  category: string,
  channel: string,
  enabled: boolean
) {
  return db.userPreference.upsert({
    where: {
      organizationId_userId_category_channel: {
        organizationId,
        userId,
        category,
        channel,
      },
    },
    create: { organizationId, userId, category, channel, enabled },
    update: { enabled },
  });
}
