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
