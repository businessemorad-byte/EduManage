import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { generateMonthlySubscriptions, listMonthlySubscriptions, getOverdueSubscriptions } from "@/lib/monthly-subscriptions";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("action")! === "overdue") {
      const overdue = await getOverdueSubscriptions(organizationId);
      return NextResponse.json({ subscriptions: overdue });
    }

    const result = await listMonthlySubscriptions(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      month: searchParams.get("month") ? Number(searchParams.get("month")!) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")!) : undefined,
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
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.enrollmentId || !body.month || !body.year) {
      return NextResponse.json({ error: "enrollmentId, month, and year are required" }, { status: 400 });
    }

    const sub = await generateMonthlySubscriptions({ ...body, organizationId });
    return NextResponse.json({ subscription: sub }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
