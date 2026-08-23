import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROLE_PERMISSIONS, ROLES } from "../src/lib/rbac";
import { hashPassword } from "../src/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding roles and permissions...");

  // Collect all unique permissions
  const allPermissions = new Set<string>();
  for (const perms of Object.values(ROLE_PERMISSIONS)) {
    for (const p of perms) allPermissions.add(p);
  }

  // Create permissions
  const permissionRecords: Record<string, { id: string }> = {};
  for (const key of allPermissions) {
    const mod = key.split("_")[0].toLowerCase();
    const record = await db.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        displayName: key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        module: mod,
      },
    });
    permissionRecords[key] = record;
  }
  console.log(`Created ${Object.keys(permissionRecords).length} permissions`);

  // Create roles
  const roleDescriptions: Record<string, string> = {
    OWNER: "Full system access. Organization owner.",
    ADMIN: "Administrative access to most features.",
    DIRECTOR: "Organizational oversight and reporting.",
    TEACHER: "Student management and attendance.",
    TRAINER: "Training session management.",
    ACCOUNTANT: "Financial management and reporting.",
    RECEPTIONIST: "Front desk operations and student intake.",
    PARENT: "View access to student information.",
    STUDENT: "Basic student access.",
  };

  const roleRecords: Record<string, { id: string }> = {};
  for (const roleName of Object.values(ROLES)) {
    const record = await db.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        displayName: roleName.charAt(0) + roleName.slice(1).toLowerCase(),
        description: roleDescriptions[roleName] || "",
        isSystem: true,
      },
    });
    roleRecords[roleName] = record;
  }
  console.log(`Created ${Object.keys(roleRecords).length} roles`);

  // Assign permissions to roles
  let assignmentCount = 0;
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleRecords[roleName];
    if (!role) continue;

    for (const permKey of permKeys) {
      const perm = permissionRecords[permKey];
      if (!perm) continue;

      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
      assignmentCount++;
    }
  }
  console.log(`Created ${assignmentCount} role-permission assignments`);

  // ─── Platform Owner ─────────────────────────────────────────────
  const platformEmail = process.env.PLATFORM_OWNER_EMAIL;
  const platformPassword = process.env.PLATFORM_OWNER_PASSWORD;

  if (platformEmail && platformPassword) {
    const passwordHash = await hashPassword(platformPassword);
    await db.user.upsert({
      where: { email: platformEmail },
      update: { role: "PLATFORM_OWNER", isActive: true },
      create: {
        email: platformEmail,
        name: process.env.PLATFORM_OWNER_NAME || "Platform Owner",
        passwordHash,
        role: "PLATFORM_OWNER",
        isActive: true,
      },
    });
    console.log(`Platform owner seeded: ${platformEmail}`);
  } else {
    console.log("Skipping platform owner (set PLATFORM_OWNER_EMAIL and PLATFORM_OWNER_PASSWORD)");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
