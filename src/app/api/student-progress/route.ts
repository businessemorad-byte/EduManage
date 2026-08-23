import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createProgressNote, listProgressNotes, deleteProgressNote } from "@/lib/student-progress";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PROGRESS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listProgressNotes(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      teacherId: searchParams.get("teacherId") ?? undefined,
      subjectId: searchParams.get("subjectId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PROGRESS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "delete" && body.id) {
      await deleteProgressNote(body.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.studentId || !body.content) {
      return NextResponse.json({ error: "studentId and content are required" }, { status: 400 });
    }

    const note = await createProgressNote({ ...body, organizationId });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
