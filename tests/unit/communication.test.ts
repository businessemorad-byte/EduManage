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
      announcement: model(),
      message: model(),
      notification: model(),
      communicationTemplate: model(),
      communicationLog: model(),
      communicationCampaign: model(),
      campaignDelivery: model(),
      contactRequest: model(),
      communicationSetting: model(),
      communicationProvider: model(),
      userPreference: model(),
      organization: model(),
      staff: model(),
      person: model(),
    },
  };
});

vi.mock("@/lib/events", () => ({
  emitEvent: vi.fn(),
  EVENT_TYPES: {
    ANNOUNCEMENT_PUBLISHED: "ANNOUNCEMENT_PUBLISHED",
    NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
    MESSAGE_SENT: "MESSAGE_SENT",
  },
}));

vi.mock("@/lib/template-engine", () => ({
  resolveTemplateFull: vi.fn((subject: string, body: string) => ({ subject, body })),
  getTemplateByCode: vi.fn().mockResolvedValue(null),
}));

import { db } from "@/lib/prisma";
import { emitEvent } from "@/lib/events";
import {
  createAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
} from "@/lib/announcements";
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Announcements ───────────────────────────────────────────

describe("Communication - Announcements", () => {
  it("should create an announcement", async () => {
    vi.mocked(db.announcement.create).mockResolvedValue({
      id: "ann1",
      title: "School Holiday",
      content: "School will be closed next Monday.",
      audience: "ALL_STUDENTS",
      status: "DRAFT",
    } as never);

    const result = await createAnnouncement({
      organizationId: "org1",
      title: "School Holiday",
      content: "School will be closed next Monday.",
      audience: "ALL_STUDENTS",
    });

    expect(db.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "School Holiday",
          audience: "ALL_STUDENTS",
          organizationId: "org1",
        }),
      })
    );
    expect(result.title).toBe("School Holiday");
  });

  it("should list announcements", async () => {
    vi.mocked(db.announcement.findMany).mockResolvedValue([
      { id: "ann1", title: "Announcement 1" },
      { id: "ann2", title: "Announcement 2" },
    ] as never);
    vi.mocked(db.announcement.count).mockResolvedValue(2);

    const result = await listAnnouncements("org1");

    expect(result.announcements).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("should publish an announcement", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      id: "ann1",
      title: "Test",
    } as never);
    vi.mocked(db.announcement.update).mockResolvedValue({
      id: "ann1",
      status: "PUBLISHED",
    } as never);

    const result = await publishAnnouncement("ann1", "org1");

    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ANNOUNCEMENT_PUBLISHED",
      })
    );
    expect(result.status).toBe("PUBLISHED");
  });

  it("should archive an announcement", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      id: "ann1",
      title: "Old",
    } as never);
    vi.mocked(db.announcement.update).mockResolvedValue({ id: "ann1", status: "ARCHIVED" } as never);

    await archiveAnnouncement("ann1", "org1");

    expect(db.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ann1" },
        data: { status: "ARCHIVED" },
      })
    );
  });

  it("should delete an announcement", async () => {
    vi.mocked(db.announcement.delete).mockResolvedValue({ id: "ann1" } as never);

    await deleteAnnouncement("ann1", "org1");

    expect(db.announcement.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ann1", organizationId: "org1" } })
    );
  });

  it("should get a single announcement", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      id: "ann1",
      title: "Test",
      branch: { name: "Main" },
      group: null,
    } as never);

    const result = await getAnnouncement("ann1", "org1");

    expect(result?.title).toBe("Test");
  });
});

// ─── Notifications ────────────────────────────────────────────

describe("Communication - Notifications", () => {
  it("should create a notification", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({
      id: "n1",
      title: "Payment Due",
      body: "Invoice #1001 is overdue.",
      type: "WARNING",
      category: "finance",
    } as never);

    const result = await createNotification({
      organizationId: "org1",
      userId: "user1",
      title: "Payment Due",
      body: "Invoice #1001 is overdue.",
      type: "WARNING",
      category: "finance",
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Payment Due",
          type: "WARNING",
          category: "finance",
        }),
      })
    );
    expect(result.title).toBe("Payment Due");
  });

  it("should get user notifications", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([
      { id: "n1", title: "Notification 1", read: false },
      { id: "n2", title: "Notification 2", read: true },
    ] as never);

    const result = await getUserNotifications("user1", "org1");

    expect(result).toHaveLength(2);
  });

  it("should count unread notifications", async () => {
    vi.mocked(db.notification.count).mockResolvedValue(5);

    const result = await getUnreadCount("user1", "org1");

    expect(result).toBe(5);
  });

  it("should mark notification as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 1 } as never);

    await markAsRead("n1", "user1");

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "n1", userId: "user1" },
        data: { read: true },
      })
    );
  });

  it("should mark all notifications as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 10 } as never);

    await markAllAsRead("user1", "org1");

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user1", organizationId: "org1", read: false },
        data: { read: true, readAt: expect.any(Date) },
      })
    );
  });

  it("should delete a notification", async () => {
    vi.mocked(db.notification.deleteMany).mockResolvedValue({ count: 1 } as never);

    await deleteNotification("n1", "user1");

    expect(db.notification.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "n1", userId: "user1" },
      })
    );
  });
});

// ─── RBAC Enforcement ────────────────────────────────────────

describe("Communication - RBAC", () => {
  it("should have COMMUNICATION_READ permission", async () => {
    const mod = await import("@/lib/rbac");
    expect(mod.PERMISSIONS.COMMUNICATION_READ).toBe("COMMUNICATION_READ");
  });

  it("should have COMMUNICATION_MANAGE permission", async () => {
    const mod = await import("@/lib/rbac");
    expect(mod.PERMISSIONS.COMMUNICATION_MANAGE).toBe("COMMUNICATION_MANAGE");
  });

  it("should have ANNOUNCEMENTS_READ permission", async () => {
    const mod = await import("@/lib/rbac");
    expect(mod.PERMISSIONS.ANNOUNCEMENTS_READ).toBe("ANNOUNCEMENTS_READ");
  });

  it("should have ANNOUNCEMENTS_MANAGE permission", async () => {
    const mod = await import("@/lib/rbac");
    expect(mod.PERMISSIONS.ANNOUNCEMENTS_MANAGE).toBe("ANNOUNCEMENTS_MANAGE");
  });
});

// ─── Tenant Isolation ────────────────────────────────────────

describe("Communication - Tenant Isolation", () => {
  it("should scope announcements by organizationId", async () => {
    vi.mocked(db.announcement.findMany).mockResolvedValue([] as never);
    vi.mocked(db.announcement.count).mockResolvedValue(0);

    await listAnnouncements("org1", { status: "PUBLISHED" });

    expect(db.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org1" }),
      })
    );
  });

  it("should scope notifications by userId and organizationId", async () => {
    vi.mocked(db.notification.count).mockResolvedValue(0);

    await getUnreadCount("user1", "org1");

    expect(db.notification.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user1", organizationId: "org1" }),
      })
    );
  });

  it("should verify announcement ownership before publish", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue(null);

    await expect(publishAnnouncement("ann1", "org1")).rejects.toThrow("Announcement not found");
  });

  it("should verify announcement ownership before archive", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue(null);

    await expect(archiveAnnouncement("ann1", "org1")).rejects.toThrow("Announcement not found");
  });
});
