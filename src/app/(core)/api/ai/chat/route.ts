import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { sendChatMessage, createConversation, listConversations, getConversation, archiveConversation } from "@/lib/ai/chat";
import { checkAIProtection } from "@/lib/ai/protection";

export async function GET(request: Request) {
  try {
    const { user, organizationId } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_ASSISTANT");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId")!;

    if (conversationId) {
      const conversation = await getConversation(organizationId, user.id, conversationId);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const conversations = await listConversations(organizationId, user.id);
    return NextResponse.json(conversations);
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
    const { user, organizationId } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_ASSISTANT");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    // Protection check
    const protection = await checkAIProtection(organizationId, user.id);
    if (!protection.allowed) {
      return NextResponse.json({ error: protection.error, code: protection.code }, { status: 403 });
    }

    if (body.action === "create") {
      const conversation = await createConversation(organizationId, user.id, {
        title: body.title,
        feature: body.feature,
      });
      return NextResponse.json(conversation);
    }

    if (body.action === "archive") {
      if (!body.conversationId) {
        return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
      }
      await archiveConversation(organizationId, user.id, body.conversationId);
      return NextResponse.json({ success: true });
    }

    // Default: send message
    if (!body.conversationId || !body.message) {
      return NextResponse.json({ error: "conversationId and message are required" }, { status: 400 });
    }

    const result = await sendChatMessage(organizationId, user.id, body.conversationId, body.message);
    if ("error" in result) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
