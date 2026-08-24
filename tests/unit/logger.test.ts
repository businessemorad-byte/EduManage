import { describe, expect, it } from "vitest";
import {
  analyzeDbError,
  findDriverCode,
  prismaErrorCode,
  redactSecrets,
} from "@/lib/logger";

function prismaLikeError(code: string, message: string, cause?: Error) {
  const error = new Error(message, cause ? { cause } : undefined) as Error & {
    code: string;
  };
  error.code = code;
  return error;
}

describe("prismaErrorCode", () => {
  it("extracts P-codes", () => {
    expect(prismaErrorCode(prismaLikeError("P2010", "Raw query failed"))).toBe("P2010");
  });

  it("returns null for non-Prisma codes", () => {
    expect(prismaErrorCode(prismaLikeError("ECONNREFUSED", "connect"))).toBeNull();
    expect(prismaErrorCode(new Error("plain"))).toBeNull();
  });
});

describe("redactSecrets", () => {
  it("redacts connection strings including credentials", () => {
    const out = redactSecrets(
      "failed to connect to postgres://admin:s3cret@db.example.com:5432/prod"
    );
    expect(out).not.toContain("s3cret");
    expect(out).not.toContain("db.example.com");
    expect(out).toContain("[URL_REDACTED]");
  });

  it("redacts password key/value pairs", () => {
    const out = redactSecrets('auth failed with password=hunter2 and token="abc123"');
    expect(out).not.toContain("hunter2");
    expect(out).not.toContain("abc123");
    expect(out).toContain("password=[REDACTED]");
    expect(out).toContain("token=[REDACTED]");
  });
});

describe("findDriverCode", () => {
  it("finds a SQLSTATE on the top-level error", () => {
    expect(findDriverCode(prismaLikeError("28P01", "x"))).toBe("28P01");
  });

  it("walks the cause chain for system codes", () => {
    const root = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
    const wrapper = prismaLikeError("P2010", "Raw query failed", root);
    expect(findDriverCode(wrapper)).toBe("ECONNRESET");
  });

  it("returns null when no recognizable code exists", () => {
    expect(findDriverCode(new Error("nothing here"))).toBeNull();
  });
});

describe("analyzeDbError", () => {
  it("categorizes password authentication failures", () => {
    const analysis = analyzeDbError(
      prismaLikeError(
        "P2010",
        "Raw query failed. Code: `28P01`. Message: `password authentication failed for user \"app\"`"
      )
    );
    expect(analysis.prismaCode).toBe("P2010");
    expect(analysis.driverCode).toBe("28P01");
    expect(analysis.category).toBe("password_authentication_failed");
    expect(analysis.redactedMessage).not.toMatch(/postgres:\/\//);
  });

  it("uses embedded Code from P2010 message when cause chain has none", () => {
    const analysis = analyzeDbError(
      prismaLikeError("P2010", "Raw query failed. Code: `3D000`. Message: database \"x\" does not exist")
    );
    expect(analysis.driverCode).toBe("3D000");
    expect(analysis.category).toBe("database_does_not_exist");
  });

  it("detects SSL problems from message keywords", () => {
    const analysis = analyzeDbError(
      new Error("self signed certificate in certificate chain")
    );
    expect(analysis.category).toBe("ssl_tls_error");
  });

  it("detects pg_hba rejections", () => {
    const analysis = analyzeDbError(
      new Error('no pg_hba.conf entry for host "203.0.113.9", user "app", database "prod"')
    );
    expect(analysis.category).toBe("authorization_or_pg_hba_rejected");
  });

  it("falls back to unknown without leaking secrets", () => {
    const analysis = analyzeDbError(
      new Error("weird failure at postgresql://u:p@host/db?password=p")
    );
    expect(analysis.category).toBe("unknown");
    expect(analysis.redactedMessage).not.toContain("host");
  });
});
