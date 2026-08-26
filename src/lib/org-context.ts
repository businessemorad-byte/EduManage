import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/session";
import { db } from "@/lib/prisma";
import { PlatformRole } from "@/lib/constants";
import { cookies } from "next/headers";

export async function requireOrgContext() {
  const user = await getAuthenticatedUser();

  // Platform owners can operate without an org (for platform routes)
  const isPlatformOwner = user.role === PlatformRole.PLATFORM_OWNER;

  // Try to get organizationId from the X-Organization-Id header first,
  // then fall back to a cookie, then fall back to the most recent membership.
  let requestedOrgId: string | null = null;

  // Headers are accessed via the request in route handlers, not here.
  // So we check a cookie that the frontend sets when switching organizations.
  try {
    const cookieStore = await cookies();
    requestedOrgId = cookieStore.get("current_organization_id")?.value ?? null;
  } catch {
    // cookies() may fail outside of request context (e.g. in middleware)
  }

  let whereCondition: Record<string, unknown> = { userId: user.id, isActive: true };
  if (requestedOrgId) {
    whereCondition = { ...whereCondition, organizationId: requestedOrgId };
  }

  const membership = await db.organizationMember.findFirst({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, type: true, slug: true } },
      role: { select: { name: true } },
    },
  });

  if (!membership) {
    // Platform owners without org memberships should not be blocked
    // from platform-level routes
    if (isPlatformOwner) {
      return {
        user,
        organizationId: null,
        organization: null,
        role: null,
        isPlatformOwner: true,
      };
    }
    throw new Error("No organization context");
  }

  return {
    user,
    organizationId: membership.organization.id,
    organization: membership.organization,
    role: membership.role.name,
    isPlatformOwner,
  };
}

/**
 * Like `requireOrgContext` but guarantees `organizationId` is a non-null string.
 * Use in org-scoped route handlers (i.e. every route under `/api/...` that is NOT
 * under `/api/platform/...`).  Platform-owner routes that legitimately have no
 * org should call `requireOrgContext` directly.
 */
export async function requireOrgId() {
  const ctx = await requireOrgContext();
  if (!ctx.organizationId) {
    throw new Error("No organization context");
  }
  return ctx as {
    user: typeof ctx.user;
    organizationId: string;
    organization: NonNullable<typeof ctx.organization>;
    role: string;
    isPlatformOwner: boolean;
  };
}
