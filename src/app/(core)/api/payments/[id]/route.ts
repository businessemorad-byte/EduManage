import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await requireOrgId();
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
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
