import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { createKnowledgeBase, listKnowledgeBases, searchKnowledge } from "@/lib/ai/knowledge";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query) {
      const results = await searchKnowledge(organizationId, query);
      return NextResponse.json(results);
    }

    const bases = await listKnowledgeBases(organizationId);
    return NextResponse.json(bases);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const canManage = await hasPermission(user.id, organizationId, "AI_KNOWLEDGE_MANAGE");
    if (!canManage) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const kb = await createKnowledgeBase({
      organizationId,
      name: body.name,
      description: body.description,
    });

    return NextResponse.json(kb);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
