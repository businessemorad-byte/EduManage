import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  deleteSession: vi.fn(async () => {}),
}));

import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";
import { POST } from "@/app/(core)/api/auth/logout/route";

const cookiesMock = vi.mocked(cookies);
const deleteSessionMock = vi.mocked(deleteSession);

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  deleteSessionMock.mockResolvedValue(undefined);
});

describe("QA - logout redirect origin", () => {
  it("redirects to the request origin, not a hardcoded localhost", async () => {
    const resp = await POST(new Request("https://app.example.com/api/auth/logout", { method: "POST" }));

    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toBe("https://app.example.com/");
  });

  it("uses the non-production host for a tenant-hosted request", async () => {
    const resp = await POST(new Request("https://acme.edumanage.test/api/auth/logout", { method: "POST" }));

    expect(resp.headers.get("location")).toBe("https://acme.edumanage.test/");
  });

  it("deletes the session before redirecting", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ name: "session_token", value: "tok-123" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    await POST(new Request("https://app.example.com/api/auth/logout", { method: "POST" }));

    expect(deleteSessionMock).toHaveBeenCalledWith("tok-123");
  });

  it("falls back to the origin /login route when cleanup throws", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ name: "session_token", value: "tok-123" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    deleteSessionMock.mockRejectedValue(new Error("boom"));

    const resp = await POST(new Request("https://app.example.com/api/auth/logout", { method: "POST" }));

    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toBe("https://app.example.com/login");
  });
});