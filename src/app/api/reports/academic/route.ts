"use server";

import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";
import { getAcademicReport, parseDateRange } from "@/lib/reports";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, PERMISSIONS.REPORTS_READ);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const range = parseDateRange(sp);
    const data = await getAcademicReport(organizationId, range);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: "Unable to generate report. Please try again." }, { status });
  }
}
