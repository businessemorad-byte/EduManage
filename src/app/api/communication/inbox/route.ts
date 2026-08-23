import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import {
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  unarchiveNotification,
  archiveAllNotifications,
  getFilteredNotifications,
  getNotificationCounts,
} from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action") === "counts") {
      const counts = await getNotificationCounts(user.id, organizationId);
      return NextResponse.json(counts);
    }

    if (searchParams.get("action") === "unread_count") {
      const count = await getUnreadCount(user.id, organizationId);
      return NextResponse.json({ count });
    }

    const result = await getFilteredNotifications(user.id, organizationId, {
      category: searchParams.get("category") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      read: searchParams.get("read") !== null ? searchParams.get("read") === "true" : undefined,
      archived: searchParams.get("archived") === "true",
      search: searchParams.get("search") ?? undefined,
    },
      searchParams.get("page") ? Number(searchParams.get("page")) : 1
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const body = await request.json();

    if (body.action === "mark_read") {
      if (!body.notificationId) {
        return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
      }
      await markAsRead(body.notificationId, user.id);
      return NextResponse.json({ success: true });
    }

    if (body.action === "mark_all_read") {
      await markAllAsRead(user.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (body.action === "archive") {
      if (!body.notificationId) {
        return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
      }
      await archiveNotification(body.notificationId, user.id);
      return NextResponse.json({ success: true });
    }

    if (body.action === "unarchive") {
      if (!body.notificationId) {
        return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
      }
      await unarchiveNotification(body.notificationId, user.id);
      return NextResponse.json({ success: true });
    }

    if (body.action === "archive_all") {
      await archiveAllNotifications(user.id, organizationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
