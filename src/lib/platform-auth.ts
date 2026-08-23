import { getCurrentUser, getAuthenticatedUser, type AuthenticatedUser } from "@/lib/session";
import { PlatformRole } from "@/lib/constants";
import { NextResponse } from "next/server";

export function isPlatformUser(user: AuthenticatedUser): boolean {
  return user.role === PlatformRole.PLATFORM_OWNER;
}

export async function requirePlatformAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Not authenticated");
  if (!isPlatformUser(user)) throw new Error("Forbidden");
  return user;
}

export async function requirePlatformAuthResponse(): Promise<
  { user: AuthenticatedUser } | { response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (!isPlatformUser(user)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
