import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
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
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
