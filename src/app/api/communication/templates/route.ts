import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createTemplate, listTemplates, updateTemplate, deleteTemplate } from "@/lib/template-engine";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEMPLATES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const templates = await listTemplates(organizationId, {
      channel: searchParams.get("channel") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEMPLATES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "update") {
      const { id, ...data } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await updateTemplate(id, organizationId, data);
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await deleteTemplate(id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.name || !body.code || !body.channel || !body.body) {
      return NextResponse.json({ error: "name, code, channel, and body are required" }, { status: 400 });
    }

    const template = await createTemplate({ ...body, organizationId });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
