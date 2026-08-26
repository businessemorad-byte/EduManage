import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { updateRoom, deleteRoom } from "@/lib/rooms";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    const room = await updateRoom(id, organizationId, {
      name: body.name,
      capacity: body.capacity,
      status: body.status,
      type: body.type,
      branchId: body.branchId,
    });

    return NextResponse.json({ room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await deleteRoom(id, organizationId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
