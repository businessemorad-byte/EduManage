import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { setTeacherAvailability, getTeacherAvailability, listTeacherAvailabilities, deleteTeacherAvailability } from "@/lib/teacher-availability";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AVAILABILITY_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("teacherId")!) {
      const avail = await getTeacherAvailability(organizationId, searchParams.get("teacherId")!);
      return NextResponse.json({ availabilities: avail });
    }

    const result = await listTeacherAvailabilities(organizationId, {
      branchId: searchParams.get("branchId") ?? undefined,
      dayOfWeek: searchParams.get("dayOfWeek") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
    });
    return NextResponse.json(result);
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
    const allowed = await hasPermission(user.id, organizationId, "AVAILABILITY_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "delete" && body.id) {
      await deleteTeacherAvailability(body.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.teacherId || !body.dayOfWeek || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: "teacherId, dayOfWeek, startTime, and endTime are required" }, { status: 400 });
    }

    const avail = await setTeacherAvailability({ ...body, organizationId });
    return NextResponse.json({ availability: avail }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
