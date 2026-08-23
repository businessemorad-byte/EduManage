import { describe, it, expect } from "vitest";
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "@/lib/rbac";

describe("RBAC", () => {
  describe("Roles", () => {
    it("should have all required roles", () => {
      const requiredRoles = [
        "OWNER", "ADMIN", "DIRECTOR", "TEACHER", "TRAINER",
        "ACCOUNTANT", "RECEPTIONIST", "PARENT", "STUDENT",
      ];

      for (const role of requiredRoles) {
        expect(ROLES).toHaveProperty(role);
        expect(ROLE_PERMISSIONS).toHaveProperty(role);
      }
    });

    it("OWNER should have all permissions", () => {
      const allPermKeys = Object.values(PERMISSIONS);
      const ownerPerms = ROLE_PERMISSIONS.OWNER;

      for (const perm of allPermKeys) {
        expect(ownerPerms).toContain(perm);
      }
    });

    it("STUDENT should have read-only permissions", () => {
      expect(ROLE_PERMISSIONS.STUDENT).toEqual([
        "STUDENTS_READ", "GRADES_READ", "NOTIFICATIONS_READ",
        "HOMEWORK_READ", "REPORT_CARDS_READ", "ANNOUNCEMENTS_READ", "PROGRESS_READ",
        "MESSAGES_READ", "MESSAGES_MANAGE", "CONTACT_REQUESTS_READ", "CONTACT_REQUESTS_MANAGE",
        "AI_INSIGHTS_READ",
      ]);
    });

    it("PARENT should have read-only permissions", () => {
      expect(ROLE_PERMISSIONS.PARENT).toEqual([
        "STUDENTS_READ", "GRADES_READ", "NOTIFICATIONS_READ",
        "HOMEWORK_READ", "REPORT_CARDS_READ", "ANNOUNCEMENTS_READ", "DOCUMENTS_READ", "PROGRESS_READ",
        "MESSAGES_READ", "MESSAGES_MANAGE", "CONTACT_REQUESTS_READ", "CONTACT_REQUESTS_MANAGE",
        "AI_INSIGHTS_READ",
      ]);
    });
  });

  describe("Permissions", () => {
    it("should have student CRUD permissions", () => {
      expect(PERMISSIONS.STUDENTS_READ).toBeDefined();
      expect(PERMISSIONS.STUDENTS_CREATE).toBeDefined();
      expect(PERMISSIONS.STUDENTS_UPDATE).toBeDefined();
      expect(PERMISSIONS.STUDENTS_DELETE).toBeDefined();
    });

    it("should have teacher CRUD permissions", () => {
      expect(PERMISSIONS.TEACHERS_READ).toBeDefined();
      expect(PERMISSIONS.TEACHERS_CREATE).toBeDefined();
      expect(PERMISSIONS.TEACHERS_UPDATE).toBeDefined();
      expect(PERMISSIONS.TEACHERS_DELETE).toBeDefined();
    });

    it("should have finance permissions", () => {
      expect(PERMISSIONS.FINANCE_READ).toBeDefined();
      expect(PERMISSIONS.FINANCE_MANAGE).toBeDefined();
    });

    it("should have organization permissions", () => {
      expect(PERMISSIONS.ORG_SETTINGS).toBeDefined();
      expect(PERMISSIONS.ORG_MEMBERS).toBeDefined();
      expect(PERMISSIONS.ORG_BILLING).toBeDefined();
    });
  });
});
