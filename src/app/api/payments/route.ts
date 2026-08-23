import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createPayment, listPayments } from "@/lib/finance";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PAYMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const payments = await listPayments(organizationId, {
      invoiceId: searchParams.get("invoiceId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
    });

    return NextResponse.json({ payments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PAYMENTS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.invoiceId || !body.amount || !body.method) {
      return NextResponse.json({ error: "invoiceId, amount, method are required" }, { status: 400 });
    }
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const payment = await createPayment({
      organizationId,
      invoiceId: body.invoiceId,
      amount: Number(body.amount),
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
