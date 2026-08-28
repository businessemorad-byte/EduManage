import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";

export async function GET() {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const [
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      subsByStatus,
      subsByPlan,
      totalStudents,
      totalStaff,
      totalGroups,
      aiBalances,
      aiUsagesAgg,
      topOrgsByStudents,
    ] = await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.organization.count({ where: { isActive: true } }),
      db.subscription.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.subscription.findMany({
        where: { status: { in: ["ACTIVE", "TRIAL", "TRIALING", "PAST_DUE"] } },
        select: {
          status: true,
          plan: { select: { displayName: true, priceMonthly: true } },
        },
      }),
      db.student.count(),
      db.staff.count(),
      db.group.count(),
      db.aICreditBalance.aggregate({
        _sum: { monthlyAllowance: true, usedThisMonth: true, extraCredits: true },
        _count: { _all: true },
      }),
      db.aIUsage.aggregate({ _count: { _all: true } }),
      db.organization.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          _count: { select: { students: true, staff: true, groups: true } },
          subscriptions: {
            where: { status: { in: ["ACTIVE", "TRIAL", "TRIALING", "PAST_DUE"] } },
            select: {
              status: true,
              plan: { select: { displayName: true } },
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          aiCreditBalances: {
            take: 1,
            select: {
              monthlyAllowance: true,
              usedThisMonth: true,
              extraCredits: true,
            },
          },
        },
        orderBy: { students: { _count: "desc" } },
        take: 5,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of subsByStatus) {
      statusCounts[s.status] = s._count._all;
    }
    const activeSubscriptions =
      (statusCounts.ACTIVE ?? 0) + (statusCounts.TRIAL ?? 0) + (statusCounts.TRIALING ?? 0);

    // Plan distribution over live subscriptions.
    const planDistribution: Record<string, number> = {};
    let estimatedMrr = new Prisma.Decimal(0);
    for (const sub of subsByPlan) {
      const name = sub.plan.displayName;
      planDistribution[name] = (planDistribution[name] ?? 0) + 1;
      if (sub.status === "ACTIVE" && sub.plan.priceMonthly) {
        estimatedMrr = estimatedMrr.add(sub.plan.priceMonthly);
      }
    }

    const monthlyAllowance = aiBalances._sum.monthlyAllowance ?? 0;
    const extraCredits = aiBalances._sum.extraCredits ?? 0;
    const usedCredits = aiBalances._sum.usedThisMonth ?? 0;
    const totalAiCredits = monthlyAllowance + extraCredits;
    const remainingAiCredits = Math.max(0, totalAiCredits - usedCredits);

    const orgsWithUsage = topOrgsByStudents.map((org) => {
      const bal = org.aiCreditBalances[0];
      const allowance = bal?.monthlyAllowance ?? 0;
      const extras = bal?.extraCredits ?? 0;
      const used = bal?.usedThisMonth ?? 0;
      const total = allowance + extras;
      const sub = org.subscriptions[0];
      return {
        id: org.id,
        name: org.name,
        type: org.type,
        plan: sub?.plan.displayName ?? null,
        subscriptionStatus: sub?.status ?? null,
        students: org._count.students,
        staff: org._count.staff,
        groups: org._count.groups,
        aiCredits: {
          total,
          used,
          remaining: Math.max(0, total - used),
          usagePct: total > 0 ? Math.round((used / total) * 100) : null,
        },
      };
    });

    return NextResponse.json({
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      activeSubscriptions,
      subscriptionStatusCounts: statusCounts,
      trialOrganizations:
        (statusCounts.TRIAL ?? 0) + (statusCounts.TRIALING ?? 0),
      pastDueOrganizations: statusCounts.PAST_DUE ?? 0,
      planDistribution,
      estimatedMonthlyRecurringRevenue: estimatedMrr.toNumber(),
      totals: {
        students: totalStudents,
        staff: totalStaff,
        groups: totalGroups,
      },
      ai: {
        organizationsWithBalance: aiBalances._count._all,
        monthlyAllowance,
        extraCredits,
        usedThisMonth: usedCredits,
        remaining: remainingAiCredits,
        totalRequests: aiUsagesAgg._count._all,
      },
      topOrganizationsByStudents: orgsWithUsage,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


