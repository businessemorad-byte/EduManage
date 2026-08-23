import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const model = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  });

  return {
    db: {
      communicationLog: model(),
      communicationTemplate: model(),
      communicationCampaign: model(),
      communicationSetting: model(),
      communicationProvider: model(),
      organizationMember: model(),
      contactRequest: model(),
      message: model(),
      notification: model(),
      userPreference: model(),
      auditLog: model(),
    },
  };
});

import { db } from "@/lib/prisma";
import {
  sendCommunication,
  sendBulkCommunication,
  createContactRequest,
  getContactRequests,
  resolveContactRequest,
  getCommunicationDashboard,
  createCampaign,
  listCampaigns,
  getDeliveryLogs,
  getDeliveryStats,
} from "@/lib/communication";
import { createTemplate, listTemplates } from "@/lib/template-engine";
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── In-App Communication ─────────────────────────────────────

describe("Communication - In-App Notifications", () => {
  it("should send an in-app message", async () => {
    vi.mocked(db.communicationLog.create).mockResolvedValue({
      id: "log1",
      channel: "IN_APP",
      status: "QUEUED",
    } as never);
    vi.mocked(db.notification.create).mockResolvedValue({
      id: "notif1",
    } as never);
    vi.mocked(db.communicationLog.update).mockResolvedValue({} as never);

    const result = await sendCommunication({
      organizationId: "org1",
      recipientType: "STUDENT",
      recipientId: "user1",
      channel: "IN_APP",
      subject: "Welcome",
      body: "Hello there!",
    });

    expect(db.communicationLog.create).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Welcome",
          body: "Hello there!",
          category: "communication",
        }),
      })
    );
    expect(result.channel).toBe("IN_APP");
  });

  it("should create and retrieve notifications", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({
      id: "notif1",
      userId: "user1",
      title: "Test",
      read: false,
    } as never);

    const notif = await createNotification({
      organizationId: "org1",
      userId: "user1",
      title: "Test",
      body: "Body",
    });

    vi.mocked(db.notification.findMany).mockResolvedValue([notif] as never);
    const list = await getUserNotifications("user1", "org1");

    expect(list).toHaveLength(1);
  });

  it("should count unread notifications", async () => {
    vi.mocked(db.notification.count).mockResolvedValue(5);

    const count = await getUnreadCount("user1", "org1");

    expect(count).toBe(5);
  });

  it("should mark notification as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 1 } as never);

    await markAsRead("notif1", "user1");

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "notif1", userId: "user1" },
        data: { read: true },
      })
    );
  });

  it("should mark all notifications as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 3 } as never);

    await markAllAsRead("user1", "org1");

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ read: true }),
      })
    );
  });
});

// ─── Email Delivery ───────────────────────────────────────────

describe("Communication - Email Channel", () => {
  it("should send email when provider is configured", async () => {
    vi.mocked(db.communicationLog.create).mockResolvedValue({
      id: "log1",
      channel: "EMAIL",
      status: "QUEUED",
    } as never);
    vi.mocked(db.communicationProvider.findFirst).mockResolvedValue({
      id: "prov1",
      provider: "sendgrid",
      channel: "EMAIL",
    } as never);
    vi.mocked(db.communicationLog.update).mockResolvedValue({} as never);

    const result = await sendCommunication({
      organizationId: "org1",
      recipientType: "STUDENT",
      recipientId: "user1",
      channel: "EMAIL",
      subject: "Report Card",
      body: "Your report card is ready.",
    });

    expect(db.communicationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: "sendgrid",
          status: "SENDING",
        }),
      })
    );
    expect(result.channel).toBe("EMAIL");
  });

  it("should fail email when no provider configured", async () => {
    vi.mocked(db.communicationLog.create).mockResolvedValue({
      id: "log1",
      channel: "EMAIL",
      status: "QUEUED",
    } as never);
    vi.mocked(db.communicationProvider.findFirst).mockResolvedValue(null);
    vi.mocked(db.communicationLog.update).mockResolvedValue({} as never);

    await sendCommunication({
      organizationId: "org1",
      recipientType: "STUDENT",
      recipientId: "user1",
      channel: "EMAIL",
      subject: "Test",
      body: "Body",
    });

    expect(db.communicationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "No active email provider configured",
        }),
      })
    );
  });
});

// ─── Contact Requests ─────────────────────────────────────────

describe("Communication - Contact Requests", () => {
  it("should create a contact request", async () => {
    vi.mocked(db.contactRequest.create).mockResolvedValue({
      id: "cr1",
      senderName: "Parent Name",
      subject: "Question about fees",
      category: "GENERAL",
      status: "OPEN",
    } as never);

    const result = await createContactRequest({
      organizationId: "org1",
      senderName: "Parent Name",
      senderEmail: "parent@test.com",
      subject: "Question about fees",
      message: "When are fees due?",
    });

    expect(result.subject).toBe("Question about fees");
    expect(result.category).toBe("GENERAL");
  });

  it("should get contact requests with pagination", async () => {
    vi.mocked(db.contactRequest.findMany).mockResolvedValue([
      { id: "cr1", subject: "Q1" },
    ] as never);
    vi.mocked(db.contactRequest.count).mockResolvedValue(1);

    const result = await getContactRequests("org1", { status: "OPEN" }, 1, 20);

    expect(result.requests).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("should resolve a contact request", async () => {
    vi.mocked(db.contactRequest.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await resolveContactRequest("cr1", "org1", "admin1");

    expect(db.contactRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RESOLVED",
          assignedTo: "admin1",
        }),
      })
    );
    expect(result.count).toBe(1);
  });
});

// ─── Campaigns ────────────────────────────────────────────────

describe("Communication - Campaigns", () => {
  it("should create a campaign", async () => {
    vi.mocked(db.communicationCampaign.create).mockResolvedValue({
      id: "camp1",
      name: "Welcome Campaign",
      channels: ["EMAIL", "SMS"],
      status: "DRAFT",
    } as never);

    const result = await createCampaign({
      organizationId: "org1",
      name: "Welcome Campaign",
      channels: ["EMAIL", "SMS"],
      audience: { type: "ALL_STUDENTS" },
    });

    expect(result.name).toBe("Welcome Campaign");
    expect(result.channels).toEqual(["EMAIL", "SMS"]);
  });

  it("should list campaigns with pagination", async () => {
    vi.mocked(db.communicationCampaign.findMany).mockResolvedValue([
      { id: "camp1", name: "Campaign 1" },
    ] as never);
    vi.mocked(db.communicationCampaign.count).mockResolvedValue(1);

    const result = await listCampaigns("org1", {}, 1, 20);

    expect(result.campaigns).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

// ─── Delivery Logs & Stats ────────────────────────────────────

describe("Communication - Delivery Logs", () => {
  it("should get delivery logs with pagination", async () => {
    vi.mocked(db.communicationLog.findMany).mockResolvedValue([
      { id: "log1", channel: "EMAIL", status: "SENT" },
    ] as never);
    vi.mocked(db.communicationLog.count).mockResolvedValue(1);

    const result = await getDeliveryLogs("org1", { channel: "EMAIL" }, 1, 50);

    expect(result.logs).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });

  it("should get delivery stats", async () => {
    vi.mocked(db.communicationLog.count)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(8)   // sent
      .mockResolvedValueOnce(7)   // delivered
      .mockResolvedValueOnce(1);  // failed

    const result = await getDeliveryStats("org1");

    expect(result.total).toBe(10);
    expect(result.sent).toBe(8);
    expect(result.delivered).toBe(7);
    expect(result.failed).toBe(1);
  });
});

// ─── Dashboard ────────────────────────────────────────────────

describe("Communication - Dashboard", () => {
  it("should get communication dashboard stats", async () => {
    vi.mocked(db.communicationLog.count)
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(40) // sent
      .mockResolvedValueOnce(35) // delivered
      .mockResolvedValueOnce(3); // failed
    vi.mocked(db.communicationCampaign.count).mockResolvedValue(2);
    vi.mocked(db.communicationLog.findMany).mockResolvedValue([]);
    vi.mocked(db.communicationTemplate.count).mockResolvedValue(5);
    vi.mocked(db.contactRequest.count).mockResolvedValue(3);

    const result = await getCommunicationDashboard("org1");

    expect(result.activeCampaigns).toBe(2);
    expect(result.templates).toBe(5);
    expect(result.openContactRequests).toBe(3);
  });
});

// ─── Template Management ──────────────────────────────────────

describe("Communication - Templates", () => {
  it("should create a template", async () => {
    vi.mocked(db.communicationTemplate.create).mockResolvedValue({
      id: "tmpl1",
      name: "Welcome Email",
      code: "WELCOME",
      channel: "EMAIL",
      status: "ACTIVE",
    } as never);

    const result = await createTemplate({
      organizationId: "org1",
      name: "Welcome Email",
      code: "WELCOME",
      channel: "EMAIL",
      subject: "Welcome to {{organization_name}}",
      body: "Hello {{student_name}}, welcome!",
    });

    expect(result.code).toBe("WELCOME");
  });

  it("should list templates", async () => {
    vi.mocked(db.communicationTemplate.findMany).mockResolvedValue([
      { id: "tmpl1", name: "Welcome" },
      { id: "tmpl2", name: "Reminder" },
    ] as never);

    const result = await listTemplates("org1", { channel: "EMAIL" });

    expect(result).toHaveLength(2);
  });
});
