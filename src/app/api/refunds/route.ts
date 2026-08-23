import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createRefund } from "@/lib/finance";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PAYMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const refunds = await db.refund.findMany({
      where: { organizationId },
      include: {
        payment: { select: { receiptNumber: true, amount: true, method: true } },
        invoice: {
          select: {
            invoiceNumber: true,
            student: { include: { person: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { refundedAt: "desc" },
    });

    return NextResponse.json({
      refunds: refunds.map((r) => ({
        id: r.id,
        amount: r.amount.toString(),
        reason: r.reason,
        refundedAt: r.refundedAt.toISOString(),
        payment: {
          receiptNumber: r.payment.receiptNumber,
          amount: r.payment.amount.toString(),
          method: r.payment.method,
        },
        invoice: {
          invoiceNumber: r.invoice.invoiceNumber,
          studentName: `${r.invoice.student.person.firstName} ${r.invoice.student.person.lastName}`,
        },
      })),
    });
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

    if (!body.paymentId || !body.amount) {
      return NextResponse.json({ error: "paymentId and amount are required" }, { status: 400 });
    }
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const refund = await createRefund({
      organizationId,
      paymentId: body.paymentId,
      amount: Number(body.amount),
      reason: body.reason,
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
