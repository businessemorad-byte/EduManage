import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createSession, listSessions } from "@/lib/scheduling";
import type { ConflictError } from "@/lib/scheduling";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "SCHEDULES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const sessions = await listSessions(organizationId, {
      scheduleId: searchParams.get("scheduleId") ?? undefined,
      groupId: searchParams.get("groupId") ?? undefined,
      teacherId: searchParams.get("teacherId") ?? undefined,
      roomId: searchParams.get("roomId") ?? undefined,
      dayOfWeek: searchParams.get("dayOfWeek")! as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY" | undefined,
    });

    return NextResponse.json({ sessions });
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
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "SCHEDULES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.roomId || !body.dayOfWeek || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "roomId, dayOfWeek, startTime, endTime are required" },
        { status: 400 }
      );
    }

    try {
      const session = await createSession({
        organizationId,
        scheduleId: body.scheduleId,
        groupId: body.groupId,
        teacherId: body.teacherId,
        roomId: body.roomId,
        subjectId: body.subjectId,
        moduleId: body.moduleId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        startDate: body.startDate ?? new Date().toISOString(),
        endDate: body.endDate,
        isRecurring: body.isRecurring,
      });

      return NextResponse.json({ session }, { status: 201 });
    } catch (err: unknown) {
      if (err instanceof Error && "conflicts" in err) {
        const conflicts = (err as Error & { conflicts: ConflictError[] }).conflicts;
        return NextResponse.json({ error: err.message, conflicts }, { status: 409 });
      }
      throw err;
    }
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
