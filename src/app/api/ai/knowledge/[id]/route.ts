import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from "@/lib/ai/knowledge";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const kb = await getKnowledgeBase(organizationId, id);
    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }
    return NextResponse.json(kb);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const canManage = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!canManage) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    await updateKnowledgeBase(organizationId, id, body);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const canManage = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!canManage) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    await deleteKnowledgeBase(organizationId, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
