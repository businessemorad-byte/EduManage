import { describe, it, expect } from "vitest";
import { FeatureKey } from "@/lib/constants";

describe("Entitlements", () => {
  describe("FeatureKey enum", () => {
    it("should have all required features", () => {
      expect(FeatureKey.AI_ENABLED).toBe("AI_ENABLED");
      expect(FeatureKey.AI_CREDITS_MONTHLY).toBe("AI_CREDITS_MONTHLY");
      expect(FeatureKey.MAX_STUDENTS).toBe("MAX_STUDENTS");
      expect(FeatureKey.MAX_BRANCHES).toBe("MAX_BRANCHES");
      expect(FeatureKey.ADVANCED_ANALYTICS).toBe("ADVANCED_ANALYTICS");
      expect(FeatureKey.AI_EXECUTIVE).toBe("AI_EXECUTIVE");
      expect(FeatureKey.AUTOMATION).toBe("AUTOMATION");
    });
  });
});
