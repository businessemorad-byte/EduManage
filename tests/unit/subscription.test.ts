import { describe, it, expect } from "vitest";
import { canTransition, getValidTransitions } from "@/lib/subscription";
import { SubscriptionStatus } from "@/lib/constants";

describe("Subscription State Machine", () => {
  describe("canTransition", () => {
    it("TRIAL → ACTIVE should be allowed", () => {
      expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it("TRIAL → EXPIRED should be allowed", () => {
      expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.EXPIRED)).toBe(true);
    });

    it("TRIAL → CANCELLED should not be allowed", () => {
      expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.CANCELLED)).toBe(false);
    });

    it("ACTIVE → PAST_DUE should be allowed", () => {
      expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)).toBe(true);
    });

    it("ACTIVE → CANCELLED should be allowed", () => {
      expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED)).toBe(true);
    });

    it("ACTIVE → TRIAL should not be allowed", () => {
      expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL)).toBe(false);
    });

    it("PAST_DUE → ACTIVE should be allowed", () => {
      expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it("PAST_DUE → EXPIRED should be allowed", () => {
      expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.EXPIRED)).toBe(true);
    });

    it("PAST_DUE → CANCELLED should be allowed", () => {
      expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED)).toBe(true);
    });

    it("CANCELLED → ACTIVE should not be allowed", () => {
      expect(canTransition(SubscriptionStatus.CANCELLED, SubscriptionStatus.ACTIVE)).toBe(false);
    });

    it("EXPIRED → ACTIVE should be allowed (renewal after expiration)", () => {
      expect(canTransition(SubscriptionStatus.EXPIRED, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it("TRIALING → ACTIVE should be allowed", () => {
      expect(canTransition(SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it("TRIALING → EXPIRED should be allowed", () => {
      expect(canTransition(SubscriptionStatus.TRIALING, SubscriptionStatus.EXPIRED)).toBe(true);
    });
  });

  describe("getValidTransitions", () => {
    it("should return valid transitions for TRIAL", () => {
      const transitions = getValidTransitions(SubscriptionStatus.TRIAL);
      expect(transitions).toContain(SubscriptionStatus.ACTIVE);
      expect(transitions).toContain(SubscriptionStatus.EXPIRED);
      expect(transitions).not.toContain(SubscriptionStatus.CANCELLED);
    });

    it("should return valid transitions for ACTIVE", () => {
      const transitions = getValidTransitions(SubscriptionStatus.ACTIVE);
      expect(transitions).toContain(SubscriptionStatus.PAST_DUE);
      expect(transitions).toContain(SubscriptionStatus.CANCELLED);
      expect(transitions).not.toContain(SubscriptionStatus.TRIAL);
    });

    it("should return empty for CANCELLED", () => {
      expect(getValidTransitions(SubscriptionStatus.CANCELLED)).toEqual([]);
    });

    it("should only allow renewal (ACTIVE) from EXPIRED", () => {
      expect(getValidTransitions(SubscriptionStatus.EXPIRED)).toEqual([
        SubscriptionStatus.ACTIVE,
      ]);
    });
  });
});
