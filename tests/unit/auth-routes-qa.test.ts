import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const model = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn(),
  });
  const db: Record<string, unknown> = {
    user: model(),
    role: model(),
    organization: model(),
    organizationMember: model(),
    plan: model(),
    subscription: model(),
  };
  (db as Record<string, unknown>).$transaction = vi.fn(
    async (fn: (tx: unknown) => unknown) => fn(db)
  );
  return { db };
});

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(async () => true),
  createSession: vi.fn(async (userId: string) => ({
    token: "qa-token",
    expiresAt: new Date(Date.now() + 604800000),
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  prismaErrorCode: vi.fn(() => "unknown"),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { db } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { POST as registerPOST } from "@/app/(core)/api/auth/register/route";
import { POST as loginPOST } from "@/app/(core)/api/auth/login/route";
import { POST as signupPOST } from "@/app/(core)/api/auth/signup/route";

const mockedDb = db as unknown as {
  $transaction: { mockImplementation: (fn: (tx: unknown) => unknown) => void };
  user: Record<string, ReturnType<typeof vi.fn>>;
  role: Record<string, ReturnType<typeof vi.fn>>;
  organization: Record<string, ReturnType<typeof vi.fn>>;
  organizationMember: Record<string, ReturnType<typeof vi.fn>>;
  plan: Record<string, ReturnType<typeof vi.fn>>;
  subscription: Record<string, ReturnType<typeof vi.fn>>;
};

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(cookies).mockResolvedValue({
    get: () => undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  (
    db as unknown as {
      $transaction: { mockImplementation: (fn: (tx: unknown) => unknown) => void };
    }
  ).$transaction.mockImplementation(
    ((fn: (tx: unknown) => unknown) => fn(db)) as unknown as (tx: unknown) => unknown
  );
});

describe("QA - register email normalization", () => {
  it("trims and lowercases the email before lookup and insert", async () => {
    mockedDb.user.findUnique.mockResolvedValue(null);
    mockedDb.user.create.mockResolvedValue({
      id: "u1",
      email: "qa.case@example.com",
      name: "QA",
      role: "USER",
    });

    const resp = await registerPOST(
      jsonRequest("/api/auth/register", {
        email: "  Qa.Case@Example.COM  ",
        name: "QA",
        password: "Qwerty123",
      })
    );

    expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "qa.case@example.com" },
    });
    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: { email: "qa.case@example.com", name: "QA", passwordHash: "hashed:Qwerty123" },
    });
    expect(resp.status).toBe(200);
  });

  it("returns 409 for an existing case-variant of the same email", async () => {
    mockedDb.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "qa.case@example.com",
      name: "QA",
      passwordHash: "hashed:Qwerty123",
    });

    const resp = await registerPOST(
      jsonRequest("/api/auth/register", {
        email: "QA.CASE@EXAMPLE.COM",
        name: "QA Two",
        password: "Qwerty123",
      })
    );

    expect(resp.status).toBe(409);
    expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "qa.case@example.com" },
    });
    expect(mockedDb.user.create).not.toHaveBeenCalled();
  });
});

describe("QA - login email normalization", () => {
  const activeUser = {
    id: "u1",
    email: "qa.case@example.com",
    name: "QA",
    passwordHash: "hashed:Qwerty123",
    role: "USER",
    isActive: true,
  };

  it("lowercases the email before the user lookup (case-variant login works)", async () => {
    mockedDb.user.findUnique.mockResolvedValue(activeUser);
    mockedDb.user.update.mockResolvedValue({ id: "u1" });

    const resp = await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "QA.CASE@EXAMPLE.COM",
        password: "Qwerty123",
      })
    );

    expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "qa.case@example.com" },
    });
    expect(resp.status).toBe(200);
  });

  it("returns a generic 401 for an unknown email without touching the password", async () => {
    mockedDb.user.findUnique.mockResolvedValue(null);

    const resp = await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "nobody@example.com",
        password: "Qwerty123",
      })
    );

    expect(resp.status).toBe(401);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("returns a generic 401 for a wrong password (no account enumeration)", async () => {
    mockedDb.user.findUnique.mockResolvedValue(activeUser);
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const resp = await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "qa.case@example.com",
        password: "WrongPw123",
      })
    );

    expect(resp.status).toBe(401);
  });

  it("returns 403 for a deactivated account before verifying the password", async () => {
    mockedDb.user.findUnique.mockResolvedValue({ ...activeUser, isActive: false });

    const resp = await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "qa.case@example.com",
        password: "Qwerty123",
      })
    );

    expect(resp.status).toBe(403);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("includes the primary organization type in the login response", async () => {
    mockedDb.user.findUnique.mockResolvedValue(activeUser);
    mockedDb.user.update.mockResolvedValue({ id: "u1" });
    mockedDb.organizationMember.findFirst.mockResolvedValue({
      organization: { id: "org1", name: "Academy", slug: "academy", type: "TRAINING_CENTER" },
    });

    const resp = await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "qa.case@example.com",
        password: "Qwerty123",
      })
    );

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.organization).toEqual({
      id: "org1",
      name: "Academy",
      slug: "academy",
      type: "TRAINING_CENTER",
    });
  });

  it("prefers the membership matching the current_organization_id cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ name: "current_organization_id", value: "org2" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedDb.user.findUnique.mockResolvedValue(activeUser);
    mockedDb.user.update.mockResolvedValue({ id: "u1" });
    mockedDb.organizationMember.findFirst.mockResolvedValue({
      organization: { id: "org2", name: "Branch", slug: "branch", type: "SUPPORT_CENTER" },
    });

    await loginPOST(
      jsonRequest("/api/auth/login", {
        email: "qa.case@example.com",
        password: "Qwerty123",
      })
    );

    expect(mockedDb.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org2" }),
      })
    );
  });
});

describe("QA - signup email normalization", () => {
  it("stores the normalized lowercase email for a mixed-case input", async () => {
    mockedDb.user.findUnique.mockResolvedValue(null);
    mockedDb.organization.findUnique.mockResolvedValue(null);
    mockedDb.plan.findUnique.mockResolvedValue(null);
    mockedDb.plan.create.mockResolvedValue({ id: "plan1", code: "STANDARD" });
    mockedDb.role.findUnique.mockResolvedValue({ id: "role-owner", name: "OWNER" });
    mockedDb.user.create.mockResolvedValue({
      id: "u1",
      email: "owner@example.com",
      name: "Owner",
      role: "USER",
    });
    mockedDb.organization.create.mockResolvedValue({
      id: "org1",
      name: "Ecole",
      slug: "ecole",
      type: "PRIVATE_SCHOOL",
    });
    mockedDb.subscription.create.mockResolvedValue({
      id: "sub1",
      status: "TRIAL",
    });

    const resp = await signupPOST(
      jsonRequest("/api/auth/signup", {
        name: "Owner",
        email: "  Owner@Example.COM ",
        password: "Qwerty123",
        orgType: "private_school",
        planSlug: "standard",
        orgName: "Ecole de Test",
      })
    );

    expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "owner@example.com" },
    });
    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "owner@example.com" }),
    });
    expect(resp.status).toBe(200);
  });
});