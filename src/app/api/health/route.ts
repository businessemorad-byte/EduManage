import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { prismaErrorCode } from "@/lib/logger";

// Public health probe. Reports booleans and Prisma error codes ONLY —
// never connection details, credentials or data.
export async function GET() {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);

  let databaseReachable = false;
  let databaseError: string | null = null;
  let authTablesPresent: boolean | null = null;

  if (databaseUrlConfigured) {
    try {
      // Cheap, side-effect-free connectivity + schema sanity check.
      const result = await db.$queryRaw<{ present: boolean }[]>`
        SELECT
          (COUNT(*) FILTER (WHERE c.relname IN ('User', 'Session')) = 2) AS present
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN ('User', 'Session')
      `;
      databaseReachable = true;
      authTablesPresent = result[0]?.present ?? false;
    } catch (error: unknown) {
      databaseError = prismaErrorCode(error) ?? "CONNECTION_FAILED";
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      nodeEnv: process.env.NODE_ENV ?? null,
      database: {
        configured: databaseUrlConfigured,
        reachable: databaseReachable,
        authTablesPresent,
        ...(databaseError ? { errorCode: databaseError } : {}),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
