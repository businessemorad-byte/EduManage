import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/rbac";
import { cache } from "react";
import type { PlatformRole } from "@/lib/constants";

const SESSION_COOKIE_NAME = "session_token";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: PlatformRole;
  sessionId: string;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await getSession(token);
  if (!session) return null;

  const fullUser = await import("@/lib/prisma").then(({ db }) =>
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
  );

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.avatarUrl,
    isActive: session.user.isActive,
    role: (fullUser?.role ?? "USER") as PlatformRole,
    sessionId: session.id,
  };
});

export async function getAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function getUserWithOrganizations() {
  const user = await getAuthenticatedUser();
  const memberships = await getUserOrganizations(user.id);
  return {
    user,
    organizations: memberships.map((m) => ({
      ...m.organization,
      membershipId: m.id,
      role: m.role,
    })),
  };
}
