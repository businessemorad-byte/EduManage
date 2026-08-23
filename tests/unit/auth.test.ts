import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateSessionToken } from "@/lib/auth";

describe("Auth", () => {
  describe("Password Hashing", () => {
    it("should hash and verify password", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]?\$/); // bcrypt hash format

      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });

    it("should reject wrong password", async () => {
      const hash = await hashPassword("correctpassword");
      const valid = await verifyPassword("wrongpassword", hash);
      expect(valid).toBe(false);
    });
  });

  describe("Session Token", () => {
    it("should generate unique tokens", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes hex
      expect(token2).toHaveLength(64);
    });
  });
});
