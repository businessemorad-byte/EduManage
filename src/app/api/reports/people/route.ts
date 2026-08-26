"use server";

import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";
import { getPeopleReport, parseDateRange } from "@/lib/reports";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, PERMISSIONS.REPORTS_READ);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const range = parseDateRange(sp);
    const data = await getPeopleReport(organizationId, range);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
