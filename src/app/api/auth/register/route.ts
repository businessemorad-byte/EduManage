import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/constants";
import { logger, prismaErrorCode } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const REGISTER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 5 };

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for")!;
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

    const rateLimit = checkRateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { email, name, passwordHash },
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
    logger.error("Register failed", error, {
      prismaCode: prismaErrorCode(error),
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      nodeEnv: process.env.NODE_ENV,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
