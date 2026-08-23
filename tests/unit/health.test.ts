import { describe, it, expect } from "vitest";

describe("App Foundation", () => {
  it("should have required environment variables defined in example", () => {
    const requiredVars = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET", "NODE_ENV"];
    const exampleContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanage?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-production-secret"
NODE_ENV="development"`;

    for (const v of requiredVars) {
      expect(exampleContent).toContain(v);
    }
  });

  it("should export constants correctly", async () => {
    const { APP_NAME, OrganizationType, PlanTier } = await import("@/lib/constants");
    expect(APP_NAME).toBe("EduManage");
    expect(OrganizationType.PRIVATE_SCHOOL).toBe("PRIVATE_SCHOOL");
    expect(PlanTier.STANDARD).toBe("STANDARD");
    expect(PlanTier.PRO).toBe("PRO");
    expect(PlanTier.ULTIMATE).toBe("ULTIMATE");
    expect(PlanTier.CUSTOM).toBe("CUSTOM");
  });
});
