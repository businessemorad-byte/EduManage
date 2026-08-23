import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createRoom, listRooms } from "@/lib/rooms";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const rooms = await listRooms(organizationId, searchParams.get("branchId") ?? undefined);
    return NextResponse.json({ rooms });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const room = await createRoom({
      organizationId,
      branchId: body.branchId,
      name: body.name,
      capacity: body.capacity,
      status: body.status,
      type: body.type,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
