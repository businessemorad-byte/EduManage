import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { listReportCards, generateReportCard, finalizeReportCard } from "@/lib/reportcards";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "REPORT_CARDS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listReportCards(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
      groupId: searchParams.get("groupId") ?? undefined,
      term: searchParams.get("term") ?? undefined,
      status: searchParams.get("status") ?? undefined,
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
    const { user, organizationId } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "REPORT_CARDS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "finalize") {
      if (!body.id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      const reportCard = await finalizeReportCard(body.id, organizationId, user.id);
      return NextResponse.json({ reportCard });
    }

    if (!body.studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const result = await generateReportCard({
      organizationId,
      studentId: body.studentId,
      academicYearId: body.academicYearId,
      groupId: body.groupId,
      term: body.term,
      teacherRemarks: body.teacherRemarks,
      adminRemarks: body.adminRemarks,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
