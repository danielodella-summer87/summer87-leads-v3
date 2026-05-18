import { NextResponse } from "next/server";
import { isClientCrmMode } from "@/lib/config/appMode";

/** Guard de aplicación por APP_MODE. No sustituye RBAC/RLS futuro. No toca Supabase. */

export function isConstructorApiBlockedByMode(): boolean {
  return isClientCrmMode();
}

export function constructorApiForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM",
      message: "Constructor APIs are not available in client CRM mode.",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/** Devuelve 403 si client_crm; null si el handler puede continuar. */
export function guardConstructorApiByMode(): NextResponse | null {
  if (isConstructorApiBlockedByMode()) {
    return constructorApiForbiddenResponse();
  }
  return null;
}
