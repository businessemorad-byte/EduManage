import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invoices = await db.invoice.findMany({
      where: { organizationId },
      select: {
        studentId: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
      },
    });

    type Balance = {
      studentId: string;
      studentName: string;
      totalFees: number;
      paid: number;
      outstanding: number;
      overdueCount: number;
    };

    const byStudent = new Map<string, Balance>();

    for (const invoice of invoices) {
      let balance = byStudent.get(invoice.studentId);
      if (!balance) {
        balance = {
          studentId: invoice.studentId,
          studentName:
            `${invoice.student.person.firstName} ${invoice.student.person.lastName}`.trim(),
          totalFees: 0,
          paid: 0,
          outstanding: 0,
          overdueCount: 0,
        };
        byStudent.set(invoice.studentId, balance);
      }

      const total = Number(invoice.totalAmount);
      const paid = Number(invoice.paidAmount);
      balance.totalFees += total;
      balance.paid += paid;

      const outstanding = total - paid;
      if (outstanding > 0 && invoice.dueDate && invoice.dueDate < new Date()) {
        balance.overdueCount++;
      }
    }

    const balances = Array.from(byStudent.values())
      .map((b) => ({ ...b, outstanding: b.totalFees - b.paid }))
      .filter((b) => b.outstanding > 0);

    return NextResponse.json({ balances });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
