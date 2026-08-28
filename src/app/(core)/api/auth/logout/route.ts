import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST(request: Request) {
  // Derive the app origin from the actual request host. NEXT_PUBLIC_APP_URL
  // is not guaranteed to be present at runtime, and hardcoding a fallback
  // breaks production logouts (open redirect to localhost).
  const origin = new URL(request.url).origin;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", origin));
  }
}