import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { addDocument, listDocuments } from "@/lib/ai/knowledge";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const documents = await listDocuments(organizationId, id);
    return NextResponse.json(documents);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, organizationId } = await requireOrgId();
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

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
