import { NextResponse } from "next/server";
import { isClientCrmMode } from "@/lib/config/appMode";

/** Guard por APP_MODE para acciones destructivas. No sustituye RBAC ni confirmaciones fuertes. */

export function isSystemDangerBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function systemDangerForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM",
      message: "System danger actions are not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 en client_crm; null si el handler puede continuar (p. ej. constructor_base). */
export function guardSystemDangerByMode(): NextResponse | null {
  if (isSystemDangerBlockedByMode()) {
    return systemDangerForbiddenResponse();
  }
  return null;
}
