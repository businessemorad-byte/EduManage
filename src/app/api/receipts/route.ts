import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PAYMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const payments = await db.payment.findMany({
      where: { organizationId, status: "COMPLETED" },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            student: { include: { person: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const receipts = payments.map((payment) => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      invoiceNumber: payment.invoice.invoiceNumber,
      studentName: `${payment.invoice.student.person.firstName} ${payment.invoice.student.person.lastName}`.trim(),
    }));

    return NextResponse.json({ receipts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
