import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { analyzeDbError, type DbFailureAnalysis, logger } from "@/lib/logger";

// Public health probe. Reports booleans, error codes and coarse categories
// ONLY — never connection details, credentials or data.

interface UrlShape {
  scheme: string | null;
  hasHost: boolean;
  portSpecified: boolean;
  hasDatabase: boolean;
  hasUsername: boolean;
  hasPassword: boolean;
  sslModeParam: string | null;
  malformed: boolean;
}

function urlShape(raw: string | undefined): UrlShape | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const sslModeParam =
      url.searchParams.get("sslmode") ?? url.searchParams.get("ssl");
    return {
      scheme: url.protocol.replace(/:$/, "") || null,
      hasHost: Boolean(url.hostname),
      portSpecified: Boolean(url.port),
      hasDatabase: url.pathname.length > 1,
      hasUsername: Boolean(url.username),
      hasPassword: Boolean(url.password),
      sslModeParam,
      malformed: false,
    };
  } catch {
    return {
      scheme: null,
      hasHost: false,
      portSpecified: false,
      hasDatabase: false,
      hasUsername: false,
      hasPassword: false,
      sslModeParam: null,
      malformed: true,
    };
  }
}

function logProbeFailure(step: string, error: unknown) {
  const analysis = analyzeDbError(error);
  // Full redacted detail goes to private server logs only.
  logger.error("Health database probe failed", error, {
    step,
    prismaCode: analysis.prismaCode,
    driverCode: analysis.driverCode,
    category: analysis.category,
    message: analysis.redactedMessage,
  });
  return analysis;
}

function publicFailure(analysis: DbFailureAnalysis) {
  return {
    errorCode: analysis.prismaCode ?? analysis.driverCode ?? "UNKNOWN",
    driverCode: analysis.driverCode,
    category: analysis.category,
  };
}

export async function GET() {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);

  let selectOneOk = false;
  let usersTable: boolean | null = null;
  let sessionsTable: boolean | null = null;
  let failures: Record<string, ReturnType<typeof publicFailure>> | undefined;

  // Platform Owner account diagnostics: booleans only, never the email,
  // hash or any credential material.
  const ownerEmailConfigured = Boolean(process.env.PLATFORM_OWNER_EMAIL);
  let ownerAccount: {
    configured: boolean;
    exists: boolean | null;
    roleCorrect: boolean | null;
    active: boolean | null;
    passwordHashPresent: boolean | null;
  } | null = null;

  if (databaseUrlConfigured) {
    let firstAnalysis: DbFailureAnalysis | null = null;

    try {
      await db.$queryRaw`SELECT 1`;
      selectOneOk = true;
    } catch (error: unknown) {
      firstAnalysis = logProbeFailure("select_one", error);
    }

    if (selectOneOk) {
      try {
        const result = await db.$queryRaw<{ users: boolean; sessions: boolean }[]>`
          SELECT
            to_regclass('public."User"') IS NOT NULL AS users,
            to_regclass('public."Session"') IS NOT NULL AS sessions
        `;
        usersTable = Boolean(result[0]?.users);
        sessionsTable = Boolean(result[0]?.sessions);

        if (usersTable && ownerEmailConfigured && process.env.PLATFORM_OWNER_EMAIL) {
          const owners = await db.$queryRaw<
            { total: number; owners: number; active: number; with_hash: number }[]
          >`
            SELECT
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE role = 'PLATFORM_OWNER')::int AS owners,
              COUNT(*) FILTER (WHERE "isActive" = true)::int AS active,
              COUNT(*) FILTER (WHERE "passwordHash" IS NOT NULL AND length("passwordHash") > 0)::int AS with_hash
            FROM "User"
            WHERE email = ${process.env.PLATFORM_OWNER_EMAIL}
          `;
          const row = owners[0];
          ownerAccount = {
            configured: true,
            exists: Boolean(row && row.total > 0),
            roleCorrect: Boolean(row && row.owners > 0),
            active: Boolean(row && row.active > 0),
            passwordHashPresent: Boolean(row && row.with_hash > 0),
          };
        }
      } catch (error: unknown) {
        firstAnalysis = logProbeFailure("auth_tables", error);
      }
    }

    if (firstAnalysis || (ownerEmailConfigured && ownerAccount === null)) {
      failures = {};
      if (!selectOneOk) failures.selectOne = publicFailure(firstAnalysis!);
      else if (firstAnalysis) failures.authTables = publicFailure(firstAnalysis);
      else failures.ownerProbe = {
        errorCode: "SKIPPED",
        driverCode: null,
        category: "owner_probe_skipped",
      };
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
        reachable: selectOneOk,
        authTablesPresent:
          usersTable === null && sessionsTable === null ? null : Boolean(usersTable && sessionsTable),
        ...(usersTable !== null || sessionsTable !== null
          ? { usersTable, sessionsTable }
          : {}),
        ...(ownerAccount ? { platformOwner: ownerAccount } : {}),
        ...(failures ? { errorCode: Object.values(failures)[0]?.errorCode ?? null } : {}),
        ...(failures ? { failures } : {}),
        urlShape: urlShape(process.env.DATABASE_URL),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
