import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  canAssignMemberRoles,
  canManageRole,
  canRemoveMember,
  getFullName,
  getInitials,
  hasPermission,
  wouldCauseManageRolesLockout,
} from "./permissions";
import type { ActorDto, RoleDto } from "./schemas";

const adminRole: RoleDto = {
  id: "role-admin",
  name: "Admin",
  position: 1,
  permissions: [PERMISSIONS.IAM_MANAGE_ROLES, PERMISSIONS.IAM_MANAGE_USERS],
};

const staffRole: RoleDto = {
  id: "role-staff",
  name: "Staff",
  position: 2,
  permissions: [PERMISSIONS.CALENDAR_MANAGE, PERMISSIONS.SCHEDULING_APPEAR],
};

const ownerActor: ActorDto = {
  id: "user-owner",
  email: "owner@takodu.test",
  first_name: "Lucia",
  last_name: "Mendez",
  type: "owner",
  level: 0,
  roles: [],
  effective_permissions: [],
};

const managerActor: ActorDto = {
  id: "user-manager",
  email: "manager@takodu.test",
  first_name: "Mateo",
  last_name: "Rios",
  type: "user",
  level: 1,
  roles: [adminRole],
  effective_permissions: [
    PERMISSIONS.IAM_MANAGE_ROLES,
    PERMISSIONS.IAM_MANAGE_USERS,
    PERMISSIONS.SCHEDULING_APPEAR,
  ],
};

const staffActor: ActorDto = {
  id: "user-staff",
  email: "staff@takodu.test",
  first_name: "Valeria",
  last_name: "Cruz",
  type: "user",
  level: 2,
  roles: [staffRole],
  effective_permissions: [
    PERMISSIONS.CALENDAR_MANAGE,
    PERMISSIONS.SCHEDULING_APPEAR,
  ],
};

describe("IAM permissions & hierarchy helpers", () => {
  it("grants Owner all functional permissions except scheduling.appear unless enabled", () => {
    expect(hasPermission(ownerActor, PERMISSIONS.CATALOG_MANAGE)).toBe(true);
    expect(hasPermission(ownerActor, PERMISSIONS.IAM_MANAGE_ROLES)).toBe(true);
    expect(hasPermission(ownerActor, PERMISSIONS.SCHEDULING_APPEAR)).toBe(false);
  });

  it("enforces hierarchy and owner protection for member management", () => {
    expect(canRemoveMember(managerActor, ownerActor)).toBe(false);
    expect(canRemoveMember(managerActor, managerActor)).toBe(false);
    expect(canRemoveMember(managerActor, staffActor)).toBe(true);
    expect(canRemoveMember(ownerActor, managerActor)).toBe(true);
  });

  it("enforces hierarchy and no self-edit for non-owner role assignment", () => {
    expect(canAssignMemberRoles(managerActor, ownerActor)).toBe(false);
    expect(canAssignMemberRoles(managerActor, managerActor)).toBe(false);
    expect(canAssignMemberRoles(managerActor, staffActor)).toBe(true);
    expect(canAssignMemberRoles(ownerActor, managerActor)).toBe(true);
  });

  it("enforces role hierarchy and anti-lockout protection", () => {
    expect(canManageRole(managerActor, adminRole)).toBe(false);
    expect(canManageRole(managerActor, staffRole)).toBe(true);
    expect(canManageRole(ownerActor, adminRole)).toBe(true);

    expect(
      wouldCauseManageRolesLockout(managerActor, adminRole.id, [
        PERMISSIONS.CALENDAR_MANAGE,
      ]),
    ).toBe(true);
    expect(
      wouldCauseManageRolesLockout(managerActor, adminRole.id, [
        PERMISSIONS.IAM_MANAGE_ROLES,
      ]),
    ).toBe(false);
    expect(
      wouldCauseManageRolesLockout(ownerActor, adminRole.id, []),
    ).toBe(false);
  });

  it("formats initials and full names", () => {
    expect(getInitials("Lucia", "Mendez", "l@t.co")).toBe("LM");
    expect(getInitials("", "", "ana@t.co")).toBe("AN");
    expect(getFullName(ownerActor)).toBe("Lucia Mendez");
  });
});
