import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: { token, userId, expiresAt },
  });

  return session;
}

export async function getSession(token: string) {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;

  return session;
}

export async function deleteSession(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function deleteAllUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
