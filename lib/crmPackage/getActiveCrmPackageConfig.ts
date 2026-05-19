/**
 * Loader server-side del contrato activo (12W-1).
 * Opción C: config local en repo; sin Supabase ni lectura dinámica de archivos.
 * No conectar a pantallas hasta adapters 12W-2+.
 */

import { pickup4x4CrmPackageConfig } from "./configs/pickup4x4.config";
import type { CrmPackageConfig } from "./types";
import { validateCrmPackageConfigShape } from "./validate";
import { getAppModeSnapshot, getClientSlug } from "@/lib/config/appMode";

const PICKUP4X4_CLIENT_SLUG = "pickup4x4";
const CLIENT_CRM_APP_MODE = "client_crm";

export type GetActiveCrmPackageConfigOptions = {
  appMode?: string | null;
  clientSlug?: string | null;
  /** Por defecto true; `false` fuerza fallback sin contrato. */
  enabled?: boolean;
};

export type ActiveCrmPackageConfigSource = "local_demo_config" | "none";

export type ActiveCrmPackageConfigResult = {
  ok: boolean;
  config: CrmPackageConfig | null;
  source: ActiveCrmPackageConfigSource;
  reason?: string;
  errors: string[];
};

/**
 * Resuelve el contrato activo según opciones explícitas (testeable, sin request/DB).
 * Nunca lanza: contrato inválido → `ok: false` y `errors`.
 */
export function getActiveCrmPackageConfig(
  options?: GetActiveCrmPackageConfigOptions
): ActiveCrmPackageConfigResult {
  const emptyOk = (
    reason: string
  ): ActiveCrmPackageConfigResult => ({
    ok: true,
    config: null,
    source: "none",
    reason,
    errors: [],
  });

  if (options?.enabled === false) {
    return emptyOk("disabled");
  }

  const appMode = options?.appMode ?? null;
  if (appMode != null && appMode !== CLIENT_CRM_APP_MODE) {
    return emptyOk("unsupported_app_mode");
  }

  const clientSlug = options?.clientSlug ?? null;
  if (clientSlug !== PICKUP4X4_CLIENT_SLUG) {
    return emptyOk("no_matching_local_config");
  }

  const validation = validateCrmPackageConfigShape(pickup4x4CrmPackageConfig);
  if (!validation.ok) {
    return {
      ok: false,
      config: null,
      source: "local_demo_config",
      reason: "validation_failed",
      errors: validation.errors,
    };
  }

  return {
    ok: true,
    config: pickup4x4CrmPackageConfig,
    source: "local_demo_config",
    errors: [],
  };
}

/**
 * Atajo server-side: lee APP_MODE y CLIENT_SLUG desde env vía appMode helpers.
 * Fallback demo: si `client_crm` y no hay CLIENT_SLUG en env → asume `pickup4x4`
 * (solo para instancia demo; documentado en 12W-1V).
 */
export function getActiveCrmPackageConfigFromEnvironment(
  overrides?: Partial<GetActiveCrmPackageConfigOptions>
): ActiveCrmPackageConfigResult {
  const snap = getAppModeSnapshot();
  const envSlug = getClientSlug();

  let clientSlug: string | null;
  if (overrides && "clientSlug" in overrides) {
    clientSlug = overrides.clientSlug ?? null;
  } else if (envSlug) {
    clientSlug = envSlug;
  } else if (snap.isClientCrm) {
    clientSlug = PICKUP4X4_CLIENT_SLUG;
  } else {
    clientSlug = null;
  }

  return getActiveCrmPackageConfig({
    enabled: overrides?.enabled,
    appMode: overrides?.appMode ?? snap.appMode,
    clientSlug,
  });
}
