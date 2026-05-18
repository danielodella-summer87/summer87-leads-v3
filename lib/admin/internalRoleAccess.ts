import { NextResponse } from "next/server";
import { isClientCrmMode } from "@/lib/config/appMode";

/** Guard por APP_MODE para edición de roles/permisos internos. No sustituye RBAC fino ni separación futura roles cliente/Summer87. */

export function isInternalRoleManagementBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function internalRoleManagementForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM",
      message: "Internal role management is not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 en client_crm; null si el handler puede continuar (p. ej. constructor_base). */
export function guardInternalRoleManagementByMode(): NextResponse | null {
  if (isInternalRoleManagementBlockedByMode()) {
    return internalRoleManagementForbiddenResponse();
  }
  return null;
}

/** Guard por APP_MODE para impersonación interna / soporte. No sustituye auditoría futura ni soporte L3 controlado. */

export function isInternalImpersonationBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function internalImpersonationForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM",
      message: "Internal impersonation is not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 en client_crm; null si el handler puede continuar (p. ej. constructor_base). */
export function guardInternalImpersonationByMode(): NextResponse | null {
  if (isInternalImpersonationBlockedByMode()) {
    return internalImpersonationForbiddenResponse();
  }
  return null;
}

/** Guard temporal por APP_MODE para bloquear mutaciones de usuarios en client_crm. No sustituye futura gestión de usuarios cliente por tenant/company_id. */

export function isClientUserManagementBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function clientUserManagementForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM",
      message: "Client user management is not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 en client_crm; null si el handler puede continuar (p. ej. constructor_base). */
export function guardClientUserManagementByMode(): NextResponse | null {
  if (isClientUserManagementBlockedByMode()) {
    return clientUserManagementForbiddenResponse();
  }
  return null;
}

/** Guard temporal por APP_MODE para bloquear lecturas internas en client_crm. No sustituye futura lectura acotada por tenant/company_id. */

export function isInternalSensitiveReadBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function internalSensitiveReadForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM",
      message: "Internal sensitive reads are not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 en client_crm; null si el handler puede continuar (p. ej. constructor_base). */
export function guardInternalSensitiveReadByMode(): NextResponse | null {
  if (isInternalSensitiveReadBlockedByMode()) {
    return internalSensitiveReadForbiddenResponse();
  }
  return null;
}

const BLOCKED_PERMISSION_KEYS_EXACT = new Set([
  "system.danger",
  "config.admin",
  "config.update",
  "config.read",
]);

const BLOCKED_PERMISSION_KEY_SUBSTRINGS = [
  "constructor",
  "installer",
  "bcr",
  "roles",
  "users",
  "permissions",
  "portal.internal",
  "support.act_as",
  "danger",
] as const;

/** True si la permission key no debe exponerse en permissions/me en client_crm. */
export function isInternalPermissionKeyForClientCrm(key: string): boolean {
  const k = key.trim().toLowerCase();
  if (!k) return true;
  if (BLOCKED_PERMISSION_KEYS_EXACT.has(k)) return true;
  return BLOCKED_PERMISSION_KEY_SUBSTRINGS.some((p) => k === p || k.includes(p));
}

/** Filtra keys internas del array de permisos efectivos (solo en client_crm). */
export function filterPermissionKeysForClientCrm(keys: string[]): string[] {
  if (!isClientCrmMode()) return keys;
  return keys.filter((k) => !isInternalPermissionKeyForClientCrm(k));
}

const CLIENT_ASSIGNABLE_ROLE_NAMES = new Set([
  "admin",
  "operador",
  "comercial",
  "viewer",
  "tecnico",
  "consultor",
]);

const INTERNAL_ROLE_NAME_PATTERNS = [
  "superadmin",
  "summer87",
  "factory",
  "fabrica",
  "internal",
  "soporte",
  "support",
  "tecnico_summer87",
  "system",
  "owner_internal",
  "admin_summer87",
] as const;

function normalizeRoleName(roleName: string | null | undefined): string {
  return (roleName ?? "").trim().toLowerCase();
}

/** Allowlist de roles.name asignables por cliente en client_crm (no implica que existan en BD). */
export function isClientAssignableRoleName(roleName: string | null | undefined): boolean {
  const name = normalizeRoleName(roleName);
  if (!name) return false;
  return CLIENT_ASSIGNABLE_ROLE_NAMES.has(name);
}

/** Nombres internos Summer87 / sistema; conservador si falta nombre. */
export function isInternalRoleNameForClientCrm(roleName: string | null | undefined): boolean {
  const name = normalizeRoleName(roleName);
  if (!name) return true;
  if (CLIENT_ASSIGNABLE_ROLE_NAMES.has(name)) return false;
  return INTERNAL_ROLE_NAME_PATTERNS.some((pattern) => name === pattern || name.includes(pattern));
}

export function isSystemRoleFlagBlockedInClientCrm(isSystem: unknown): boolean {
  return isSystem === true;
}

export function internalRoleAssignmentForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "INTERNAL_ROLE_ASSIGNMENT_DISABLED_IN_CLIENT_CRM",
      message: "Internal role assignment is not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

type RoleAssignmentTarget = {
  name: string | null | undefined;
  is_system?: unknown;
};

/**
 * En client_crm: bloquea asignación a rol de sistema, interno o fuera de allowlist.
 * En constructor_base: null (sin restricción por modo).
 */
export function guardClientCrmRoleAssignment(target: RoleAssignmentTarget): NextResponse | null {
  if (!isClientCrmMode()) return null;

  if (isSystemRoleFlagBlockedInClientCrm(target.is_system)) {
    return internalRoleAssignmentForbiddenResponse();
  }
  if (isInternalRoleNameForClientCrm(target.name)) {
    return internalRoleAssignmentForbiddenResponse();
  }
  if (!isClientAssignableRoleName(target.name)) {
    return internalRoleAssignmentForbiddenResponse();
  }

  return null;
}
