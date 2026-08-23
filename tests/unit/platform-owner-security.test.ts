import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindFirst, mockFindUnique, mockGetCurrentUser } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
  mockGetCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    organizationMember: {
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
  getAuthenticatedUser: (...args: any[]) => mockGetCurrentUser(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Platform Owner Security", () => {
  it("1. PLATFORM_OWNER can access platform billing via requirePlatformAuth", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-platform-1", email: "owner@edumanage.com", name: "Platform Owner",
      role: "PLATFORM_OWNER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user.role).toBe("PLATFORM_OWNER");
    }
  });

  it("2. PLATFORM_OWNER without org membership still gets platform auth", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-platform-1", email: "owner@edumanage.com", name: "Platform Owner",
      role: "PLATFORM_OWNER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user.role).toBe("PLATFORM_OWNER");
      expect(result.user.email).toBe("owner@edumanage.com");
    }
  });

  it("3. USER without organization cannot become platform owner", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-nobody", email: "nobody@test.com", name: "Nobody",
      role: "USER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("4. Organization OWNER cannot access platform billing", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-org-1", email: "admin@school.com", name: "Org Admin",
      role: "USER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("5. Organization ADMIN cannot access platform billing", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-admin-1", email: "admin@school.com", name: "Admin",
      role: "USER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("6. TEACHER cannot access platform billing", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-teacher-1", email: "teacher@school.com", name: "Teacher",
      role: "USER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("7. STUDENT cannot access platform billing", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-student-1", email: "student@school.com", name: "Student",
      role: "USER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
    }
  });

  it("8. PLATFORM_OWNER does not require OrganizationMember for platform routes", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-platform-1", email: "owner@edumanage.com", name: "Platform Owner",
      role: "PLATFORM_OWNER", isActive: true, sessionId: "sess-1",
    });

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user.id).toBe("u-platform-1");
    }
  });

  it("9. Normal USER without organization still requires org context", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-nobody", email: "nobody@test.com", name: "Nobody",
      role: "USER", isActive: true, sessionId: "sess-1",
    });
    mockFindFirst.mockResolvedValue(null);

    const { requireOrgContext } = await import("@/lib/org-context");
    await expect(requireOrgContext()).rejects.toThrow("No organization context");
  });

  it("10. PLATFORM_OWNER with org membership can access org routes", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u-platform-1", email: "owner@edumanage.com", name: "Platform Owner",
      role: "PLATFORM_OWNER", isActive: true, sessionId: "sess-1",
    });
    mockFindFirst.mockResolvedValue({
      id: "om-po", organizationId: "org-1", roleId: "role-owner", isActive: true,
      organization: { id: "org-1", name: "Test School", type: "PRIVATE_SCHOOL", slug: "test-school" },
      role: { name: "OWNER" },
    });

    const { requireOrgContext } = await import("@/lib/org-context");
    const ctx = await requireOrgContext();

    expect(ctx.organizationId).toBe("org-1");
    expect(ctx.isPlatformOwner).toBe(true);
    expect(ctx.role).toBe("OWNER");
  });

  it("11. isPlatformUser correctly identifies platform vs org users", async () => {
    const { isPlatformUser } = await import("@/lib/platform-auth");
    expect(isPlatformUser({ role: "PLATFORM_OWNER" } as any)).toBe(true);
    expect(isPlatformUser({ role: "USER" } as any)).toBe(false);
  });

  it("12. Unauthenticated user gets 401 on platform auth", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const { requirePlatformAuthResponse } = await import("@/lib/platform-auth");
    const result = await requirePlatformAuthResponse();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
    }
  });
});

describe("Existing RBAC & Tenant Isolation (Unchanged)", () => {
  it("hasPermission returns false for non-existent membership", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { hasPermission } = await import("@/lib/rbac");
    const result = await hasPermission("user-1", "org-1", "STUDENTS_READ");
    expect(result).toBe(false);
  });

  it("hasPermission returns true for valid membership with permission", async () => {
    mockFindUnique.mockResolvedValue({
      id: "om-1",
      isActive: true,
      role: {
        name: "OWNER",
        permissions: [{ permission: { key: "STUDENTS_READ" } }],
      },
    });

    const { hasPermission } = await import("@/lib/rbac");
    const result = await hasPermission("user-1", "org-1", "STUDENTS_READ");
    expect(result).toBe(true);
  });

  it("isOrganizationMember returns false for non-member", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { isOrganizationMember } = await import("@/lib/rbac");
    const result = await isOrganizationMember("user-1", "org-1");
    expect(result).toBe(false);
  });

  it("isOrganizationMember returns true for active member", async () => {
    mockFindUnique.mockResolvedValue({ id: "om-1", isActive: true });

    const { isOrganizationMember } = await import("@/lib/rbac");
    const result = await isOrganizationMember("user-1", "org-1");
    expect(result).toBe(true);
  });
});
