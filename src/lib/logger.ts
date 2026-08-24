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
