/**
 * Modo de instancia (APP_MODE) y flags relacionados — lectura desde process.env.
 * Helper server-side: usar en Server Components, route handlers y utilidades de servidor.
 *
 * No sustituye guards de menú, rutas ni APIs (fases 12B-impl, 12C, 12E).
 * En client_crm las funciones compuestas fuerzan superficies internas en false (fail safe).
 */

export type AppMode =
  | "constructor_base"
  | "installation_prep"
  | "client_crm";

export const APP_MODE_VALUES: readonly AppMode[] = [
  "constructor_base",
  "installation_prep",
  "client_crm",
] as const;

export const DEFAULT_APP_MODE: AppMode = "constructor_base";

const APP_MODE_ENV_KEYS = ["APP_MODE", "SUMMER87_APP_MODE"] as const;

const ENABLE_CONSTRUCTOR_ENV_KEYS = [
  "ENABLE_CONSTRUCTOR",
  "SUMMER87_ENABLE_CONSTRUCTOR",
] as const;

const ENABLE_INSTALLER_ENV_KEYS = [
  "ENABLE_INSTALLER",
  "SUMMER87_ENABLE_INSTALLER",
] as const;

const ENABLE_BCR_ENV_KEYS = ["ENABLE_BCR", "SUMMER87_ENABLE_BCR"] as const;

const SHOW_INTERNAL_MENUS_ENV_KEYS = [
  "SHOW_INTERNAL_MENUS",
  "SUMMER87_SHOW_INTERNAL_MENUS",
] as const;

const CLIENT_SLUG_ENV_KEYS = ["CLIENT_SLUG", "SUMMER87_CLIENT_SLUG"] as const;

const CLIENT_NAME_ENV_KEYS = ["CLIENT_NAME", "SUMMER87_CLIENT_NAME"] as const;

const CLIENT_VISIBLE_MODULES_ENV_KEYS = [
  "CLIENT_VISIBLE_MODULES",
  "SUMMER87_CLIENT_VISIBLE_MODULES",
] as const;

const INTERNAL_ADMIN_EMAILS_ENV_KEYS = [
  "INTERNAL_ADMIN_EMAILS",
  "SUMMER87_INTERNAL_ADMIN_EMAILS",
] as const;

function isAppMode(value: string): value is AppMode {
  return (APP_MODE_VALUES as readonly string[]).includes(value);
}

/**
 * Normaliza un valor a AppMode. Sin valor o inválido → constructor_base (base madre).
 */
export function normalizeAppMode(value: unknown): AppMode {
  if (typeof value !== "string") {
    return DEFAULT_APP_MODE;
  }
  const trimmed = value.trim();
  if (!trimmed || !isAppMode(trimmed)) {
    return DEFAULT_APP_MODE;
  }
  return trimmed;
}

function readFirstEnv(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const raw = process.env[key];
    if (raw !== undefined && raw !== "") {
      return raw;
    }
  }
  return undefined;
}

/** Modo actual: APP_MODE → SUMMER87_APP_MODE → constructor_base. */
export function getAppMode(): AppMode {
  return normalizeAppMode(readFirstEnv(APP_MODE_ENV_KEYS));
}

export function isConstructorBaseMode(): boolean {
  return getAppMode() === "constructor_base";
}

export function isInstallationPrepMode(): boolean {
  return getAppMode() === "installation_prep";
}

export function isClientCrmMode(): boolean {
  return getAppMode() === "client_crm";
}

/** Parsea booleanos de env; valores no reconocidos usan fallback. */
export function parseEnvBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "on"
  ) {
    return true;
  }
  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }
  return fallback;
}

type ModeFlagDefaults = {
  enableConstructor: boolean;
  enableInstaller: boolean;
  enableBcr: boolean;
  showInternalMenus: boolean;
};

function getModeFlagDefaults(mode: AppMode): ModeFlagDefaults {
  switch (mode) {
    case "constructor_base":
      return {
        enableConstructor: true,
        enableInstaller: true,
        enableBcr: true,
        showInternalMenus: true,
      };
    case "installation_prep":
      return {
        enableConstructor: true,
        enableInstaller: true,
        enableBcr: false,
        showInternalMenus: true,
      };
    case "client_crm":
      return {
        enableConstructor: false,
        enableInstaller: false,
        enableBcr: false,
        showInternalMenus: false,
      };
  }
}

export function getEnableConstructorFlag(): boolean {
  const defaults = getModeFlagDefaults(getAppMode());
  return parseEnvBoolean(
    readFirstEnv(ENABLE_CONSTRUCTOR_ENV_KEYS),
    defaults.enableConstructor
  );
}

export function getEnableInstallerFlag(): boolean {
  const defaults = getModeFlagDefaults(getAppMode());
  return parseEnvBoolean(
    readFirstEnv(ENABLE_INSTALLER_ENV_KEYS),
    defaults.enableInstaller
  );
}

export function getEnableBcrFlag(): boolean {
  const defaults = getModeFlagDefaults(getAppMode());
  return parseEnvBoolean(readFirstEnv(ENABLE_BCR_ENV_KEYS), defaults.enableBcr);
}

export function getShowInternalMenusFlag(): boolean {
  const defaults = getModeFlagDefaults(getAppMode());
  return parseEnvBoolean(
    readFirstEnv(SHOW_INTERNAL_MENUS_ENV_KEYS),
    defaults.showInternalMenus
  );
}

/** Constructor habilitado según modo y flags; client_crm siempre false. */
export function isConstructorEnabled(): boolean {
  if (isClientCrmMode()) {
    return false;
  }
  return getEnableConstructorFlag();
}

/** Instalador habilitado según modo y flags; client_crm siempre false. */
export function isInstallerEnabled(): boolean {
  if (isClientCrmMode()) {
    return false;
  }
  return getEnableInstallerFlag();
}

/** BCR habilitado según modo y flags; client_crm siempre false. */
export function isBcrEnabled(): boolean {
  if (isClientCrmMode()) {
    return false;
  }
  return getEnableBcrFlag();
}

/** Menús internos; client_crm siempre false aunque el flag diga true. */
export function shouldShowInternalMenus(): boolean {
  if (isClientCrmMode()) {
    return false;
  }
  return getShowInternalMenusFlag();
}

function parseCommaSeparatedList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseOptionalTrimmedString(
  keys: readonly string[]
): string | null {
  const raw = readFirstEnv(keys);
  if (raw === undefined) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getClientSlug(): string | null {
  return parseOptionalTrimmedString(CLIENT_SLUG_ENV_KEYS);
}

export function getClientName(): string | null {
  return parseOptionalTrimmedString(CLIENT_NAME_ENV_KEYS);
}

export function getClientVisibleModules(): string[] {
  return parseCommaSeparatedList(
    readFirstEnv(CLIENT_VISIBLE_MODULES_ENV_KEYS)
  );
}

export function getInternalAdminEmails(): string[] {
  return parseCommaSeparatedList(
    readFirstEnv(INTERNAL_ADMIN_EMAILS_ENV_KEYS)
  ).map((email) => email.toLowerCase());
}

export type AppModeSnapshot = {
  appMode: AppMode;
  isConstructorBase: boolean;
  isInstallationPrep: boolean;
  isClientCrm: boolean;
  constructorEnabled: boolean;
  installerEnabled: boolean;
  bcrEnabled: boolean;
  showInternalMenus: boolean;
  clientSlug: string | null;
  clientName: string | null;
  clientVisibleModules: string[];
  internalAdminEmails: string[];
};

/** Snapshot para debug/diagnóstico futuro; no escribe logs. */
export function getAppModeSnapshot(): AppModeSnapshot {
  const appMode = getAppMode();
  return {
    appMode,
    isConstructorBase: appMode === "constructor_base",
    isInstallationPrep: appMode === "installation_prep",
    isClientCrm: appMode === "client_crm",
    constructorEnabled: isConstructorEnabled(),
    installerEnabled: isInstallerEnabled(),
    bcrEnabled: isBcrEnabled(),
    showInternalMenus: shouldShowInternalMenus(),
    clientSlug: getClientSlug(),
    clientName: getClientName(),
    clientVisibleModules: getClientVisibleModules(),
    internalAdminEmails: getInternalAdminEmails(),
  };
}
