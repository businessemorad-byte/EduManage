// Structured, secret-free logging for production observability
// (Netlify function logs). Never log credentials, tokens or URLs.

type Level = "debug" | "info" | "warn" | "error";

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    const out: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      ...(code ? { code } : {}),
      stack: error.stack,
    };
    // Driver adapters / engines often wrap the real cause (e.g. ECONNREFUSED).
    if (error.cause) {
      out.cause = serializeError(error.cause);
    }
    return out;
  }
  return { message: String(error) };
}

function emit(level: Level, msg: string, error?: unknown, meta?: object) {
  const entry = {
    level,
    msg,
    ...(error ? { error: serializeError(error) } : {}),
    ...meta,
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: object) => emit("debug", msg, undefined, meta),
  info: (msg: string, meta?: object) => emit("info", msg, undefined, meta),
  warn: (msg: string, meta?: object) => emit("warn", msg, undefined, meta),
  error: (msg: string, error?: unknown, meta?: object) => emit("error", msg, error, meta),
};

/** Extracts the Prisma error code (e.g. P2021, P2002) when present. */
export function prismaErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    /^P\d{4}$/.test((error as { code: string }).code)
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

/**
 * Removes anything credential-bearing from an error string before it can
 * reach logs or responses. URLs (which may embed user:password@host),
 * password-style key/value pairs and common secret header names are redacted.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"<>)\]]+/gi, "[URL_REDACTED]")
    .replace(/\b(password|passwd|pwd|secret|token|api[_-]?key)\b\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

function walkCauses(error: unknown, visit: (e: Record<string, unknown>) => void) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    visit(current as Record<string, unknown>);
    current = (current as { cause?: unknown }).cause;
  }
}

/**
 * Walks the error and its cause chain looking for a driver-level code:
 * Node system codes (ECONNREFUSED…), PostgreSQL SQLSTATEs (5 chars, e.g.
 * 28P01, 3D000) or libpq/OpenSSL style codes.
 */
export function findDriverCode(error: unknown): string | null {
  let found: string | null = null;
  walkCauses(error, (e) => {
    if (found) return;
    const code = e.code;
    // Skip Prisma's own P-codes (they wrap, not describe, the driver failure).
    if (
      typeof code === "string" &&
      !/^P\d{4}$/.test(code) &&
      (/^E[A-Z0-9]{3,}$/.test(code) || /^[0-9A-Z]{5}$/.test(code))
    ) {
      found = code;
    }
  });
  return found;
}

const CATEGORY_BY_DRIVER_CODE: Record<string, string> = {
  "28P01": "password_authentication_failed",
  "28000": "authorization_or_pg_hba_rejected",
  "28P02": "authorization_or_pg_hba_rejected",
  "3D000": "database_does_not_exist",
  "42501": "permission_denied",
  "42P01": "relation_missing",
  "08P01": "protocol_violation",
  "08006": "connection_failed_mid_session",
  "57P01": "database_shutting_down",
  "57P03": "database_starting_up",
  "53300": "too_many_connections",
  XX000: "database_internal_error",
  ENOTFOUND: "dns_resolution_failed",
  EAI_AGAIN: "dns_temporarily_unavailable",
  ECONNREFUSED: "connection_refused",
  ECONNRESET: "connection_reset",
  ETIMEDOUT: "network_timeout",
  EHOSTUNREACH: "network_unreachable",
  ENETUNREACH: "network_unreachable",
};

const CATEGORY_KEYWORD_PATTERNS: [RegExp, string][] = [
  [/no pg_hba\.conf entry/i, "authorization_or_pg_hba_rejected"],
  [/password authentication failed/i, "password_authentication_failed"],
  [/role ["']?\w+["']? does not exist/i, "unknown_database_role"],
  [/database ["'][^"']+["'] does not exist/i, "database_does_not_exist"],
  [/self[- ]signed certificate|certificate verify failed|ssl routines|handshake failure|wrong version number/i, "ssl_tls_error"],
  [/server requires (tls|ssl)|ssl(srv)?_mode|the server does not support ssl/i, "ssl_required_by_server"],
  [/too many connections/i, "too_many_connections"],
];

export interface DbFailureAnalysis {
  prismaCode: string | null;
  driverCode: string | null;
  category: string;
  /** Secret-redacted original message — safe for private server logs. */
  redactedMessage: string;
}

/**
 * Full, secret-free breakdown of a raw-query/database failure. The category
 * and codes are safe to expose publicly; redactedMessage stays in logs.
 */
export function analyzeDbError(error: unknown): DbFailureAnalysis {
  const prismaCode = prismaErrorCode(error);
  const driverCode = findDriverCode(error);

  let rawMessage = "";
  walkCauses(error, (e) => {
    if (!rawMessage && typeof e.message === "string") rawMessage = e.message;
  });
  if (!rawMessage && error instanceof Error) rawMessage = error.message;

  // P2010 embeds the real failure as "Code: `XXXXX`. Message: …"
  const embedded =
    typeof rawMessage === "string"
      ? /Code:\s*[`'"]?([A-Za-z0-9_.]+)[`'"]?/.exec(rawMessage)?.[1]
      : undefined;

  const effectiveDriverCode = driverCode ?? embedded ?? null;

  let category = "unknown";
  if (effectiveDriverCode && CATEGORY_BY_DRIVER_CODE[effectiveDriverCode]) {
    category = CATEGORY_BY_DRIVER_CODE[effectiveDriverCode];
  } else {
    const haystack = `${rawMessage}`;
    for (const [pattern, mapped] of CATEGORY_KEYWORD_PATTERNS) {
      if (pattern.test(haystack)) {
        category = mapped;
        break;
      }
    }
  }

  return {
    prismaCode,
    driverCode: effectiveDriverCode,
    category,
    redactedMessage: redactSecrets(rawMessage || String(error)),
  };
}
