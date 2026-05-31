/**
 * Gobierno centralizado de los flags de prototipo del Constructor CRM.
 * (CONSTRUCTOR-SECURITY-1)
 *
 * Estos flags habilitan bypass de auth / modo prototipo SOLO para uso local/dev
 * controlado. Reglas invariantes:
 *  - Default sin env => false (seguro por defecto).
 *  - En production (NODE_ENV === "production") => SIEMPRE false, ignorando la env
 *    (doble llave: un error de configuración no puede reactivar un bypass en prod).
 *  - Solo se activan con valores explícitos: "true", "1" o "yes" (case-insensitive).
 *  - No lanzan si falta la env; no exponen secretos; no dependen del browser.
 *
 * Referencias estáticas a process.env.<NOMBRE>: necesarias para que el valor se
 * resuelva correctamente tanto en Edge runtime (middleware.ts) como en Node runtime
 * (route handlers). NO usar acceso dinámico process.env[clave] aquí.
 */

const EXPLICIT_TRUE_VALUES = ["true", "1", "yes"] as const;

/** true solo si el valor es una activación explícita reconocida. */
function isExplicitlyEnabled(value: string | undefined): boolean {
  if (typeof value !== "string") return false;
  return (EXPLICIT_TRUE_VALUES as readonly string[]).includes(
    value.trim().toLowerCase()
  );
}

/** En production cualquier bypass de prototipo queda forzado en false. */
function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * BYPASS de auth del Constructor en middleware.ts.
 * Env: CONSTRUCTOR_AUTH_BYPASS
 */
export function isConstructorAuthBypassEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return isExplicitlyEnabled(process.env.CONSTRUCTOR_AUTH_BYPASS);
}

/**
 * BYPASS de auth del endpoint assist (IA mock del Constructor).
 * Env: CONSTRUCTOR_ASSIST_AUTH_BYPASS
 */
export function isConstructorAssistAuthBypassEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return isExplicitlyEnabled(process.env.CONSTRUCTOR_ASSIST_AUTH_BYPASS);
}

/**
 * BYPASS de auth del endpoint assist/events (auditoría mock de sugerencias).
 * Env: CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS
 */
export function isConstructorAssistEventsAuthBypassEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return isExplicitlyEnabled(process.env.CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS);
}

/**
 * Modo prototipo del setup del Constructor: permite leer/guardar crm_setup_config
 * sin exigir el permiso real (config.update) mientras dura el diseño interno.
 * Env: CONSTRUCTOR_SETUP_PROTOTYPE_MODE
 */
export function isConstructorSetupPrototypeModeEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return isExplicitlyEnabled(process.env.CONSTRUCTOR_SETUP_PROTOTYPE_MODE);
}
