import type { ActorDto, RoleDto } from "./schemas";

export const PERMISSIONS = {
  CALENDAR_MANAGE: "calendar.manage",
  SCHEDULING_APPEAR: "scheduling.appear",
  CRM_MANAGE: "crm.manage",
  CATALOG_MANAGE: "catalog.manage",
  ORGANIZATION_MANAGE: "organization.manage",
  IAM_MANAGE_USERS: "iam.manage_users",
  IAM_MANAGE_ROLES: "iam.manage_roles",
  IAM_ADMINISTRATOR: "iam.administrator",
} as const;

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroupDefinition {
  id: string;
  title: string;
  items: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroupDefinition[] = [
  {
    id: "calendar",
    title: "Calendar",
    items: [
      {
        key: PERMISSIONS.CALENDAR_MANAGE,
        label: "Manage calendar & appointments",
        description: "Access the business calendar, view, create, reschedule, and update appointments.",
      },
      {
        key: PERMISSIONS.SCHEDULING_APPEAR,
        label: "Appear in calendar",
        description: "Allow members with this role to appear as bookable specialists on the calendar.",
      },
    ],
  },
  {
    id: "crm",
    title: "Customers & Conversations",
    items: [
      {
        key: PERMISSIONS.CRM_MANAGE,
        label: "Manage customers & conversations",
        description: "Access customer directory, edit customers, and reply to WhatsApp conversations.",
      },
    ],
  },
  {
    id: "catalog",
    title: "Catalog",
    items: [
      {
        key: PERMISSIONS.CATALOG_MANAGE,
        label: "Manage catalog",
        description: "View, create, edit, delete, and reorder categories and services.",
      },
    ],
  },
  {
    id: "organization",
    title: "Organization & Team",
    items: [
      {
        key: PERMISSIONS.ORGANIZATION_MANAGE,
        label: "Manage business settings",
        description: "View and update business profile, hours, AI assistant, and WhatsApp.",
      },
      {
        key: PERMISSIONS.IAM_MANAGE_USERS,
        label: "Manage members & invitations",
        description: "Invite and remove workspace members.",
      },
      {
        key: PERMISSIONS.IAM_MANAGE_ROLES,
        label: "Manage roles & permissions",
        description: "Create, edit, reorder, and assign permission groups.",
      },
      {
        key: PERMISSIONS.IAM_ADMINISTRATOR,
        label: "Administrator",
        description: "Grants all functional permissions (subject to hierarchy).",
      },
    ],
  },
];

export function hasPermission(actor: ActorDto, permission: string): boolean {
  if (actor.type === "owner") {
    return permission !== PERMISSIONS.SCHEDULING_APPEAR
      ? true
      : actor.effective_permissions.includes(permission);
  }
  if (
    permission !== PERMISSIONS.SCHEDULING_APPEAR &&
    actor.effective_permissions.includes(PERMISSIONS.IAM_ADMINISTRATOR)
  ) {
    return true;
  }
  return actor.effective_permissions.includes(permission);
}

export function canAccessOrganizationTab(actor: ActorDto): boolean {
  return (
    hasPermission(actor, PERMISSIONS.ORGANIZATION_MANAGE) ||
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS) ||
    hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES)
  );
}

export function canRemoveMember(actor: ActorDto, target: ActorDto): boolean {
  if (target.type === "owner" || actor.id === target.id) return false;
  if (!hasPermission(actor, PERMISSIONS.IAM_MANAGE_USERS)) return false;
  return actor.type === "owner" || target.level > actor.level;
}

export function canAssignMemberRoles(actor: ActorDto, target: ActorDto): boolean {
  if (target.type === "owner") return false;
  if (!hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES)) return false;
  if (actor.type === "owner") return true;
  if (actor.id === target.id) return false;
  return target.level > actor.level;
}

export function canManageRole(actor: ActorDto, role: RoleDto): boolean {
  if (!hasPermission(actor, PERMISSIONS.IAM_MANAGE_ROLES)) return false;
  return actor.type === "owner" || role.position > actor.level;
}

export function actorHoldsPermission(actor: ActorDto, permission: string): boolean {
  if (actor.type === "owner") return true;
  if (
    permission !== PERMISSIONS.SCHEDULING_APPEAR &&
    actor.effective_permissions.includes(PERMISSIONS.IAM_ADMINISTRATOR)
  ) {
    return true;
  }
  return actor.effective_permissions.includes(permission);
}

export function isIncludedInAdministrator(permission: string): boolean {
  return (
    permission !== PERMISSIONS.IAM_ADMINISTRATOR &&
    permission !== PERMISSIONS.SCHEDULING_APPEAR
  );
}

export function wouldCauseManageRolesLockout(
  actor: ActorDto,
  roleId: string,
  nextPermissions: string[],
): boolean {
  if (actor.type === "owner") return false;
  const isMember = actor.roles.some((r) => r.id === roleId);
  if (!isMember) return false;

  const otherRolesGrantManage = actor.roles
    .filter((r) => r.id !== roleId)
    .some(
      (r) =>
        r.permissions.includes(PERMISSIONS.IAM_MANAGE_ROLES) ||
        r.permissions.includes(PERMISSIONS.IAM_ADMINISTRATOR),
    );
  if (otherRolesGrantManage) return false;

  return (
    !nextPermissions.includes(PERMISSIONS.IAM_MANAGE_ROLES) &&
    !nextPermissions.includes(PERMISSIONS.IAM_ADMINISTRATOR)
  );
}

export function getInitials(
  firstName: string,
  lastName: string,
  email?: string,
): string {
  const first = firstName.trim()[0] ?? "";
  const last = lastName.trim()[0] ?? "";
  const combined = `${first}${last}`.toUpperCase();
  if (combined.length > 0) return combined;
  return (email?.trim().slice(0, 2) || "TK").toUpperCase();
}

export function getFullName(actor: {
  first_name: string;
  last_name: string;
  email: string;
}): string {
  const full = `${actor.first_name} ${actor.last_name}`.trim();
  return full || actor.email;
}
