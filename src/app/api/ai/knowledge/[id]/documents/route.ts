import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { addDocument, listDocuments } from "@/lib/ai/knowledge";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const documents = await listDocuments(organizationId, id);
    return NextResponse.json(documents);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const canManage = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!canManage) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const doc = await addDocument({
      organizationId,
      knowledgeBaseId: id,
      title: body.title,
      content: body.content,
      source: body.source,
      tags: body.tags,
    });

    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
