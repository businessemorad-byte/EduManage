import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/session";
import { isOrganizationMember } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/organizations/[id]/switch">
) {
  try {
    const user = await getAuthenticatedUser();
    const { id: organizationId } = await params;

    const member = await isOrganizationMember(user.id, organizationId);
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: user.id },
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, type: true },
        },
        role: {
          select: { id: true, name: true, displayName: true },
        },
      },
    });

    return NextResponse.json({
      organization: membership!.organization,
      role: membership!.role,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
