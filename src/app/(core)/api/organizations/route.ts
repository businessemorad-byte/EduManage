import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/session";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const memberships = await db.organizationMember.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      organizations: memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["PRIVATE_SCHOOL", "SUPPORT_CENTER", "TRAINING_CENTER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid organization type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    let slug = slugify(name);
    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const organization = await db.organization.create({
      data: {
        name,
        slug,
        type,
        members: {
          create: {
            userId: user.id,
            roleId: await getOwnerRoleId(),
            isActive: true,
          },
        },
        branches: {
          create: {
            name: "Main Branch",
            code: "MAIN",
            isMain: true,
          },
        },
      },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getOwnerRoleId(): Promise<string> {
  const ownerRole = await db.role.findUnique({ where: { name: "OWNER" } });
  if (!ownerRole) throw new Error("OWNER role not found. Run seed script.");
  return ownerRole.id;
}
