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
  });
  return { db: { group: model(), enrollment: model() } };
});

vi.mock("@/lib/org-context", () => ({
  requireOrgId: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  hasPermission: vi.fn(),
}));

import { db } from "@/lib/prisma";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { GET } from "@/app/(core)/api/groups/[id]/route";

const dbMock = db as unknown as {
  group: Record<string, ReturnType<typeof vi.fn>>;
  enrollment: Record<string, ReturnType<typeof vi.fn>>;
};
const requireOrgIdMock = vi.mocked(requireOrgId);
const hasPermissionMock = vi.mocked(hasPermission);

beforeEach(() => {
  vi.clearAllMocks();
  requireOrgIdMock.mockResolvedValue({ organizationId: "org1", user: { id: "u1" } } as never);
  hasPermissionMock.mockResolvedValue(true);
  dbMock.group.findFirst.mockResolvedValue({
    id: "g1",
    organizationId: "org1",
    name: "CM1",
  });
  dbMock.enrollment.findMany.mockResolvedValue([
    { id: "e1", groupId: "g1", organizationId: "org1", status: "ACTIVE" },
  ]);
});

function getCall() {
  return GET(new Request("http://localhost/api/groups/g1"), {
    params: Promise.resolve({ id: "g1" }),
  });
}

describe("QA - group enrollments are organization-scoped", () => {
  it("filters enrollments by the request organization as well as the group id", async () => {
    await getCall();

    expect(dbMock.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { groupId: "g1", organizationId: "org1", status: "ACTIVE" } })
    );
  });

  it("denies access without the ROOMS_READ permission", async () => {
    hasPermissionMock.mockResolvedValue(false);

    const resp = await getCall();

    expect(resp.status).toBe(403);
    expect(dbMock.enrollment.findMany).not.toHaveBeenCalled();
  });

  it("returns the org-scoped enrollments on the group payload", async () => {
    const resp = await getCall();

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.group.enrollments).toEqual([
      { id: "e1", groupId: "g1", organizationId: "org1", status: "ACTIVE" },
    ]);
  });
});