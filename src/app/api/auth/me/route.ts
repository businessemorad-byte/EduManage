import { NextResponse } from "next/server";
import { getUserWithOrganizations } from "@/lib/session";

export async function GET() {
  try {
    const { user, organizations } = await getUserWithOrganizations();
    return NextResponse.json({ user, organizations });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
