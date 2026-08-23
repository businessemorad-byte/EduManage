import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      const count = await getUnreadCount(user.id, organizationId);
      return NextResponse.json({ count });
    }

    const notifications = await getUserNotifications(user.id, organizationId, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const body = await request.json();

    if (body.action === "markAllRead") {
      await markAllAsRead(user.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (body.notificationId) {
      await markAsRead(body.notificationId, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "notificationId or action required" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireOrgContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteNotification(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
