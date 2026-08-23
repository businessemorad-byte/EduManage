import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/session";
import { db } from "@/lib/prisma";
import { PlatformRole } from "@/lib/constants";

export async function requireOrgContext() {
  const user = await getAuthenticatedUser();

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, type: true, slug: true } },
      role: { select: { name: true } },
    },
  });

  if (!membership) {
    throw new Error("No organization context");
  }

  return {
    user,
    organizationId: membership.organization.id,
    organization: membership.organization,
    role: membership.role.name,
    isPlatformOwner: user.role === PlatformRole.PLATFORM_OWNER,
  };
}
