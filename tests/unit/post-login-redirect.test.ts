import { describe, it, expect } from "vitest";
import { getPostLoginRedirect } from "@/lib/post-login-redirect";

describe("getPostLoginRedirect", () => {
  it("returns a safe in-app from parameter", () => {
    expect(getPostLoginRedirect("/students", "USER", "PRIVATE_SCHOOL")).toBe("/students");
    expect(getPostLoginRedirect("/platform/dashboard", "PLATFORM_OWNER", "TRAINING_CENTER")).toBe(
      "/platform/dashboard"
    );
    expect(getPostLoginRedirect("/login?from=%2Fstudents", "USER", null)).toBe(
      "/login?from=%2Fstudents"
    );
  });

  it("rejects open-redirect from values", () => {
    expect(getPostLoginRedirect("https://evil.com", "USER", "PRIVATE_SCHOOL")).toBe(
      "/school/dashboard"
    );
    expect(getPostLoginRedirect("//evil.com", "USER", "PRIVATE_SCHOOL")).toBe("/school/dashboard");
    expect(getPostLoginRedirect("javascript:alert(1)", "USER", "PRIVATE_SCHOOL")).toBe(
      "/school/dashboard"
    );
    expect(getPostLoginRedirect("https://evil.com", "PLATFORM_OWNER", null)).toBe(
      "/platform/dashboard"
    );
  });

  it("lands platform owners on the platform dashboard", () => {
    expect(getPostLoginRedirect(null, "PLATFORM_OWNER", null)).toBe("/platform/dashboard");
    expect(getPostLoginRedirect(undefined, "PLATFORM_OWNER", "TRAINING_CENTER")).toBe(
      "/platform/dashboard"
    );
  });

  it("lands training-center users on the training dashboard", () => {
    expect(getPostLoginRedirect(null, "USER", "TRAINING_CENTER")).toBe("/training-dashboard");
    expect(getPostLoginRedirect(null, "OWNER", "TRAINING_CENTER")).toBe("/training-dashboard");
  });

  it("falls back to the school dashboard for school/support/no org", () => {
    expect(getPostLoginRedirect(null, "USER", "PRIVATE_SCHOOL")).toBe("/school/dashboard");
    expect(getPostLoginRedirect(null, "USER", "SUPPORT_CENTER")).toBe("/school/dashboard");
    expect(getPostLoginRedirect(null, "USER", null)).toBe("/school/dashboard");
    expect(getPostLoginRedirect(undefined, undefined, undefined)).toBe("/school/dashboard");
  });
});