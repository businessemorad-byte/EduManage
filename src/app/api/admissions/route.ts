import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createAdmission, listAdmissions, updateAdmissionStatus } from "@/lib/admissions";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ADMISSIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listAdmissions(organizationId, {
      status: searchParams.get("status") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
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
    const { user, organizationId } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ADMISSIONS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateStatus" && body.admissionId && body.status) {
      const updated = await updateAdmissionStatus(body.admissionId, organizationId, body.status, user.id);
      return NextResponse.json({ admission: updated });
    }

    if (!body.applicantName) {
      return NextResponse.json({ error: "applicantName is required" }, { status: 400 });
    }

    const admission = await createAdmission({ ...body, organizationId });
    return NextResponse.json({ admission }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
