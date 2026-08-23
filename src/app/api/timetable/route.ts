import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getTimetable } from "@/lib/scheduling";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "SCHEDULES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const sessions = await getTimetable(organizationId, {
      groupId: searchParams.get("groupId") ?? undefined,
      teacherId: searchParams.get("teacherId") ?? undefined,
      roomId: searchParams.get("roomId") ?? undefined,
    });

    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
