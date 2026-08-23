import { describe, it, expect } from "vitest";
import { PersonStatus, Gender, GuardianRelationship, PersonType, VERTICAL_LABELS, OrganizationType } from "@/lib/constants";

describe("People Domain Constants", () => {
  describe("PersonStatus", () => {
    it("should have all statuses", () => {
      expect(PersonStatus.ACTIVE).toBe("ACTIVE");
      expect(PersonStatus.INACTIVE).toBe("INACTIVE");
      expect(PersonStatus.ARCHIVED).toBe("ARCHIVED");
    });
  });

  describe("Gender", () => {
    it("should have all genders", () => {
      expect(Gender.MALE).toBe("MALE");
      expect(Gender.FEMALE).toBe("FEMALE");
      expect(Gender.OTHER).toBe("OTHER");
    });
  });

  describe("GuardianRelationship", () => {
    it("should have all relationships", () => {
      expect(GuardianRelationship.FATHER).toBe("FATHER");
      expect(GuardianRelationship.MOTHER).toBe("MOTHER");
      expect(GuardianRelationship.GUARDIAN).toBe("GUARDIAN");
      expect(GuardianRelationship.OTHER).toBe("OTHER");
    });
  });

  describe("PersonType", () => {
    it("should have all types", () => {
      expect(PersonType.STUDENT).toBe("STUDENT");
      expect(PersonType.TEACHER).toBe("TEACHER");
      expect(PersonType.TRAINER).toBe("TRAINER");
      expect(PersonType.PARENT).toBe("PARENT");
      expect(PersonType.STAFF).toBe("STAFF");
    });
  });

  describe("VERTICAL_LABELS", () => {
    it("should map school labels correctly", () => {
      const labels = VERTICAL_LABELS[OrganizationType.PRIVATE_SCHOOL];
      expect(labels[PersonType.STUDENT]).toBe("Student");
      expect(labels[PersonType.TEACHER]).toBe("Teacher");
      expect(labels[PersonType.PARENT]).toBe("Parent");
    });

    it("should map training center labels correctly", () => {
      const labels = VERTICAL_LABELS[OrganizationType.TRAINING_CENTER];
      expect(labels[PersonType.STUDENT]).toBe("Learner");
      expect(labels[PersonType.TEACHER]).toBe("Instructor");
      expect(labels[PersonType.TRAINER]).toBe("Trainer");
    });

    it("should map support center labels correctly", () => {
      const labels = VERTICAL_LABELS[OrganizationType.SUPPORT_CENTER];
      expect(labels[PersonType.STUDENT]).toBe("Student");
      expect(labels[PersonType.PARENT]).toBe("Guardian");
    });
  });
});
