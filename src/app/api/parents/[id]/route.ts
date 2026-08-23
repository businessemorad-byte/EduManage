import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getParentById, updateParent, archiveParent } from "@/lib/parents";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/parents/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const parent = await getParentById(id);
    if (!parent || parent.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ parent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/parents/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_UPDATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    const existing = await getParentById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parent = await updateParent(id, {
      person: body.person,
      occupation: body.occupation,
      workplace: body.workplace,
      metadata: body.metadata,
    });

    return NextResponse.json({ parent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/parents/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_DELETE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const existing = await getParentById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await archiveParent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
