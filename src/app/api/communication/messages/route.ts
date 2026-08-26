import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { sendMessage, getMessages, markMessageAsRead, getUnreadMessageCount } from "@/lib/communication";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "MESSAGES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "unread_count") {
      const count = await getUnreadMessageCount(user.id, organizationId);
      return NextResponse.json({ count });
    }

    const messages = await getMessages(organizationId, user.id, {
      unreadOnly: searchParams.get("unreadOnly")! === "true",
      sentOnly: searchParams.get("sentOnly")! === "true",
    });

    return NextResponse.json({ messages });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "MESSAGES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "mark_read") {
      if (!body.messageId) return NextResponse.json({ error: "messageId is required" }, { status: 400 });
      await markMessageAsRead(body.messageId, user.id);
      return NextResponse.json({ success: true });
    }

    if (!body.recipientId || !body.content) {
      return NextResponse.json({ error: "recipientId and content are required" }, { status: 400 });
    }

    const message = await sendMessage({
      organizationId,
      senderId: user.id,
      senderType: body.senderType ?? "STAFF",
      recipientId: body.recipientId,
      recipientType: body.recipientType ?? "STAFF",
      subject: body.subject,
      content: body.content,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
