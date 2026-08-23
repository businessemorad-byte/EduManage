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
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const subscription = await db.monthlySubscription.findFirst({
      where: { id, organizationId },
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        feePlan: { select: { name: true, amount: true } },
        enrollment: true,
      },
    });
    if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ subscription });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
