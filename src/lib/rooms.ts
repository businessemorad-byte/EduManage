import { db } from "@/lib/prisma";
import type { RoomStatus, RoomType } from "@/generated/prisma/client";

// ─── Room ─────────────────────────────────────────────────────────

export async function createRoom(data: {
  organizationId: string;
  branchId?: string;
  name: string;
  capacity?: number;
  status?: RoomStatus;
  type?: RoomType;
}) {
  return db.room.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId ?? null,
      name: data.name,
      capacity: data.capacity ?? 30,
      status: data.status ?? "AVAILABLE",
      type: data.type ?? "CLASSROOM",
    },
  });
}

export async function listRooms(organizationId: string, branchId?: string) {
  return db.room.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    include: { branch: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function updateRoom(
  id: string,
  organizationId: string,
  data: {
    name?: string;
    capacity?: number;
    status?: RoomStatus;
    type?: RoomType;
    branchId?: string;
  }
) {
  const room = await db.room.findFirst({ where: { id, organizationId } });
  if (!room) throw new Error("Room not found");
  return db.room.update({ where: { id }, data });
}

export async function deleteRoom(id: string, organizationId: string) {
  const room = await db.room.findFirst({ where: { id, organizationId } });
  if (!room) throw new Error("Room not found");
  return db.room.update({ where: { id }, data: { isActive: false } });
}
