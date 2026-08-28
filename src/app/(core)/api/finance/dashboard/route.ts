import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getFinanceSummary } from "@/lib/finance";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [summary, recentPayments, outstandingInvoices, collectionRate, monthlyRevenueRaw] = await Promise.all([
      getFinanceSummary(organizationId),
      db.payment.findMany({
        where: { organizationId },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              student: { include: { person: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
        orderBy: { paidAt: "desc" },
        take: 5,
      }),
      db.invoice.findMany({
        where: { organizationId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        include: {
          student: { include: { person: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.payment.aggregate({
        where: { organizationId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      db.payment.groupBy({
        by: ["paidAt"],
        where: {
          organizationId,
          status: "COMPLETED",
          paidAt: { gte: sixMonthsAgo },
        },
        _sum: { amount: true },
      }),
    ]);

    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, 0);
    }
    for (const entry of monthlyRevenueRaw) {
      const d = entry.paidAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(entry._sum.amount ?? 0));
      }
    }
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, amount]) => ({ month, amount }));

    const totalPaid = summary.totalPaid;
    const totalInvoiced = summary.totalInvoiced;
    const rate = totalInvoiced.gt(0)
      ? totalPaid.div(totalInvoiced).mul(100).toNumber()
      : 0;

    return NextResponse.json({
      summary: {
        ...summary,
        totalInvoiced: summary.totalInvoiced.toString(),
        totalPaid: summary.totalPaid.toString(),
        totalRefunded: summary.totalRefunded.toString(),
        totalOutstanding: summary.totalOutstanding.toString(),
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: p.amount.toString(),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt.toISOString(),
        invoice: {
          invoiceNumber: p.invoice.invoiceNumber,
          studentName: `${p.invoice.student.person.firstName} ${p.invoice.student.person.lastName}`,
        },
      })),
      outstanding: outstandingInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount.toString(),
        paidAmount: inv.paidAmount.toString(),
        outstanding: inv.totalAmount.sub(inv.paidAmount).toString(),
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        studentName: `${inv.student.person.firstName} ${inv.student.person.lastName}`,
      })),
      collectionRate: Math.round(rate * 100) / 100,
      monthlyRevenue,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
