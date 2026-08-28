import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createStudent, listStudents } from "@/lib/students";
import { checkPaidAccess } from "@/lib/billing/enforcement";
import { checkUsageLimit } from "@/lib/entitlements";
import { FeatureKey } from "@/lib/constants";
import { db } from "@/lib/prisma";

async function getOrganizationSubscriptionSafe(organizationId: string) {
  try {
    const { getOrganizationSubscription } = await import("@/lib/billing/subscriptions");
    return await getOrganizationSubscription(organizationId);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listStudents({
      organizationId,
      branchId: searchParams.get("branchId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      grade: searchParams.get("grade") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_CREATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    const { firstName, lastName } = body;
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      );
    }

    // Server-side plan enforcement: subscription must be usable and the
    // student count must stay within the plan's MAX_STUDENTS limit.
    const access = await checkPaidAccess(organizationId);
    if (!access.ok) return NextResponse.json(access.payload, { status: access.status });

    const currentStudents = await db.student.count({ where: { organizationId } });
    const limit = await checkUsageLimit(organizationId, FeatureKey.MAX_STUDENTS, currentStudents);
    if (!limit.allowed) {
      const sub = await getOrganizationSubscriptionSafe(organizationId);
      const planName = sub?.plan?.displayName ?? sub?.plan?.name;
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${limit.limit} élèves du plan ${planName ?? "actuel"}. Passez à un plan supérieur pour en ajouter davantage.`,
          code: "PLAN_LIMIT_REACHED",
          limit: limit.limit,
        },
        { status: 402 }
      );
    }

    const student = await createStudent({
      organizationId,
      branchId: body.branchId,
      person: { ...body, organizationId },
      studentId: body.studentId,
      enrollmentDate: body.enrollmentDate,
      grade: body.grade,
      metadata: body.metadata,
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
