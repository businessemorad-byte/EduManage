import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PAYMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const payment = await db.payment.findFirst({
      where: { id, organizationId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            student: { include: { person: { select: { firstName: true, lastName: true } } } },
          },
        },
        refund: true,
      },
    });
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ payment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
