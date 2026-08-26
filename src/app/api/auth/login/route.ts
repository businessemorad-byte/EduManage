import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/constants";
import { logger, prismaErrorCode } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 10 };

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for")!;
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

    const rateLimit = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await createSession(user.id);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    // Server-side only: the real cause lands in function logs; the client
    // response stays generic so no internals are exposed.
    logger.error("Login failed", error, {
      prismaCode: prismaErrorCode(error),
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      nodeEnv: process.env.NODE_ENV,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
