import { describe, it, expect } from "vitest";
import { WORKSPACE_CONFIG } from "@/lib/constants";

describe("Workspace Resolution", () => {
  describe("SUBDOMAIN_PATTERN", () => {
    it("should accept valid slugs", () => {
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("my-org")).toBe(true);
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("school123")).toBe(true);
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("a")).toBe(true);
    });

    it("should reject invalid slugs", () => {
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("-invalid")).toBe(false);
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("invalid-")).toBe(false);
      expect(WORKSPACE_CONFIG.SUBDOMAIN_PATTERN.test("UPPERCASE")).toBe(false);
    });
  });

  describe("ROOT_DOMAIN", () => {
    it("should have default domain", () => {
      expect(WORKSPACE_CONFIG.ROOT_DOMAIN).toBeDefined();
      expect(typeof WORKSPACE_CONFIG.ROOT_DOMAIN).toBe("string");
    });
  });
});
