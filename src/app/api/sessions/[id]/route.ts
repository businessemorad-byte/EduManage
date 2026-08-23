import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { updateSession, deleteSession } from "@/lib/scheduling";
import type { ConflictError } from "@/lib/scheduling";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "SCHEDULES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    try {
      const session = await updateSession(id, organizationId, {
        groupId: body.groupId,
        teacherId: body.teacherId,
        roomId: body.roomId,
        subjectId: body.subjectId,
        moduleId: body.moduleId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        startDate: body.startDate,
        endDate: body.endDate,
        isRecurring: body.isRecurring,
      });

      return NextResponse.json({ session });
    } catch (err: unknown) {
      if (err instanceof Error && "conflicts" in err) {
        const conflicts = (err as Error & { conflicts: ConflictError[] }).conflicts;
        return NextResponse.json({ error: err.message, conflicts }, { status: 409 });
      }
      throw err;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "SCHEDULES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await deleteSession(id, organizationId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
