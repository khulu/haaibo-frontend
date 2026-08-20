export enum RoleId {
  SuperAdmin = 0,
  Admin = 1,
  Security = 2,
  Employee = 3,
}

const ROLE_NAME_TO_ID: Record<string, RoleId> = {
  superadmin: RoleId.SuperAdmin,
  admin: RoleId.Admin,
  security: RoleId.Security,
  employee: RoleId.Employee,
};

const VALID_ROLE_IDS = new Set<number>([
  RoleId.SuperAdmin,
  RoleId.Admin,
  RoleId.Security,
  RoleId.Employee,
]);

export function normalizeRole(role: unknown): RoleId | null {
  if (typeof role === "number" && Number.isInteger(role) && VALID_ROLE_IDS.has(role)) {
    return role as RoleId;
  }

  if (typeof role === "string") {
    const trimmed = role.trim();
    if (!trimmed) return null;

    const asNumber = Number(trimmed);
    if (Number.isInteger(asNumber) && VALID_ROLE_IDS.has(asNumber)) {
      return asNumber as RoleId;
    }

    const mapped = ROLE_NAME_TO_ID[trimmed.toLowerCase()];
    return mapped ?? null;
  }

  return null;
}

export function isSuperAdminRole(role: unknown): boolean {
  return normalizeRole(role) === RoleId.SuperAdmin;
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === RoleId.Admin;
}

export function isSecurityRole(role: unknown): boolean {
  return normalizeRole(role) === RoleId.Security;
}

export function isEmployeeRole(role: unknown): boolean {
  return normalizeRole(role) === RoleId.Employee;
}

export function isAdminLikeRole(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === RoleId.SuperAdmin || normalized === RoleId.Admin;
}

export function getNotificationScopeFromRole(role: unknown): "global" | "company" | "user" {
  const normalized = normalizeRole(role);
  if (normalized === RoleId.SuperAdmin) return "global";
  if (normalized === RoleId.Admin) return "company";
  return "user";
}

export function normalizeUserRole<T extends { role?: unknown }>(user: T): T & { role?: RoleId } {
  const normalized = normalizeRole(user?.role);
  return {
    ...user,
    role: normalized ?? undefined,
  };
}
