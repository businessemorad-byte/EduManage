import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createInvoice, listInvoices } from "@/lib/finance";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "INVOICES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const invoices = await listInvoices(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      status: searchParams.get("status") as "DRAFT" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | undefined,
    });

    return NextResponse.json({ invoices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "INVOICES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.studentId || !body.items?.length) {
      return NextResponse.json({ error: "studentId and items are required" }, { status: 400 });
    }

    const invoice = await createInvoice({
      organizationId,
      studentId: body.studentId,
      feePlanId: body.feePlanId,
      discountId: body.discountId,
      items: body.items,
      dueDate: body.dueDate,
      notes: body.notes,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
