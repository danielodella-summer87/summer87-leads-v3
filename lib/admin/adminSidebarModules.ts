/**
 * Menú lateral del admin: definición por defecto + merge con overrides en `portal_config.sidebar_modules`.
 *
 * --- Auditoría: fuente efectiva del sidebar visible ---
 *
 * 1) Defaults de código: `DEFAULT_ADMIN_SIDEBAR_MODULES` (incluye nombres desde `APP_SUITE_CONFIG`).
 * 2) Tras el primer paint, el cliente (`AdminShell`) hace `GET /api/admin/config/portal` y vuelve a
 *    aplicar `mergeAdminSidebarModules(json.data.sidebar_modules)`.
 * 3) Persistencia: tabla Supabase `config`, fila `key = 'portal_config'`, campo JSON `sidebar_modules`
 *    (array de `{ key, label?, icon?, status? }`). Ver `app/api/admin/config/portal/route.ts`.
 * 4) Regla de merge: si existe `label` persistido para una `key`, **gana sobre el default**, salvo
 *    excepciones: `entidades`→"Entidades", `leads87`→leads87/LEADS87. Cualquier otro
 *    texto guardado (p. ej. "LEADS87 · …", emoji, "EASY …") **sigue mostrándose** y pisa
 *    "Summer87 Leads".
 * 5) Claves en `HIDDEN_SIDEBAR_MODULE_KEYS` se filtran del resultado final (p. ej. copilot hasta
 *    que el producto esté listo, u otras entradas legadas).
 * 6) Claves en `HIDDEN_SIDEBAR_MODULE_KEYS` no se listan nunca (filtro final tras el merge); tampoco
 *    se re-graban vía `sanitizeSidebarModulesForPersist` si reaparecieran en un PATCH.
 * 7) Logo del sidebar: **no** sale de `portal_config`. `AdminShell` usa fijo `src="/licencia.png"`
 *    (archivo en `public/`). `logo_url` en portal no altera ese `<img>` hoy.
 * 8) `menuCategory` + `filterAdminSidebarModulesByMode` filtran por APP_MODE (solo menú; no guard de rutas/API).
 *    Filas persistidas sin categoría se infieren con `getAdminSidebarModuleCategory`.
 * 9) Sin APP_MODE en env → constructor_base; con defaults de flags el menú coincide con el histórico.
 */

import { APP_SUITE_CONFIG } from "@/lib/config/appSuiteConfig";
import type { AppMode } from "@/lib/config/appMode";
import {
  getAppMode,
  getClientVisibleModules,
  isBcrEnabled,
  isConstructorEnabled,
  isInstallerEnabled,
  shouldShowInternalMenus,
} from "@/lib/config/appMode";

export type SidebarModuleStatus = "activo" | "en_preparacion" | "oculto";

/** Categoría conceptual para filtrado por APP_MODE (12B). */
export type AdminSidebarMenuCategory =
  | "internal_constructor"
  | "internal_installer"
  | "internal_bcr"
  | "operational_crm"
  | "operational_reports"
  | "operational_config"
  | "support"
  | "system_danger";

const ADMIN_SIDEBAR_MENU_CATEGORIES: readonly AdminSidebarMenuCategory[] = [
  "internal_constructor",
  "internal_installer",
  "internal_bcr",
  "operational_crm",
  "operational_reports",
  "operational_config",
  "support",
  "system_danger",
] as const;

function isAdminSidebarMenuCategory(
  value: unknown
): value is AdminSidebarMenuCategory {
  return (
    typeof value === "string" &&
    (ADMIN_SIDEBAR_MENU_CATEGORIES as readonly string[]).includes(value)
  );
}

export type AdminSidebarModule = {
  key: string;
  label: string;
  href: string;
  icon: string;
  status: SidebarModuleStatus;
  /** Categoría para filtrado futuro por modo; opcional en datos persistidos (se infiere). */
  menuCategory?: AdminSidebarMenuCategory;
  /** Si true, el texto visible usa `label_member_plural` (Personalización), no `label` guardado. */
  useMemberPluralLabel?: boolean;
  /** `footer`: bloque inferior del sidebar (p. ej. personalización / configuración). */
  navGroup?: "main" | "footer";
};

/** Fragmento persistido en JSON (solo deltas sobre el default). Sin `menuCategory` obligatorio. */
export type SidebarModulePersisted = {
  key: string;
  label?: string;
  icon?: string;
  status?: SidebarModuleStatus;
};

export const DEFAULT_ADMIN_SIDEBAR_MODULES: AdminSidebarModule[] = [
  {
    key: "dashboard_comercial",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "📈",
    status: "activo",
    menuCategory: "operational_crm",
  },
  {
    key: "leads87",
    label: APP_SUITE_CONFIG.modules.leads.name,
    href: APP_SUITE_CONFIG.modules.leads.href,
    icon: "🎯",
    status: APP_SUITE_CONFIG.modules.leads.enabled ? "activo" : "en_preparacion",
    menuCategory: "operational_crm",
  },
  {
    key: "entidades",
    label: "Iniciativas",
    href: "/admin/empresas",
    icon: "🏢",
    status: "activo",
    menuCategory: "operational_crm",
  },
  {
    key: "socios",
    label: "Clientes",
    href: "/admin/socios",
    icon: "👥",
    status: "activo",
    menuCategory: "operational_crm",
  },
  {
    key: "agenda",
    label: "Agenda",
    href: "/admin/agenda",
    icon: "📅",
    status: "activo",
    menuCategory: "operational_crm",
  },
  {
    key: "reportes",
    label: "Reportes",
    href: "/admin/reportes",
    icon: "📊",
    status: "activo",
    menuCategory: "operational_reports",
  },
  {
    key: "ia",
    label: "IA",
    href: "/admin/ia",
    icon: "🧠",
    status: "activo",
    menuCategory: "operational_config",
  },
  {
    key: "mesa_ayuda",
    label: "Mesa de ayuda",
    href: "/admin/mesa-de-ayuda",
    icon: "🆘",
    status: "activo",
    menuCategory: "support",
  },
  {
    key: "neuroventas",
    label: "Manual de neuroventas",
    href: "/admin/neuroventas",
    icon: "📘",
    status: "activo",
    navGroup: "footer",
    menuCategory: "support",
  },
  {
    key: "personalizacion",
    label: "Personalización",
    href: "/admin/personalizacion",
    icon: "🎨",
    status: "activo",
    navGroup: "footer",
    menuCategory: "operational_config",
  },
  {
    key: "configuracion",
    label: "Configuración",
    href: "/admin/configuracion",
    icon: "🛠️",
    status: "activo",
    navGroup: "footer",
    menuCategory: "operational_config",
  },
  {
    key: "constructor_manual_cliente",
    label: "Manual cliente",
    href: "/admin/constructor-crm/manual-cliente",
    icon: "📘",
    status: "activo",
    menuCategory: "internal_constructor",
  },
];

function hrefStartsWith(href: string, prefix: string): boolean {
  return href === prefix || href.startsWith(`${prefix}/`);
}

/**
 * Resuelve la categoría de un ítem del sidebar (explícita o inferida).
 * Prepara filtrado por APP_MODE; no oculta módulos. Guards de rutas/APIs: fase posterior.
 */
export function getAdminSidebarModuleCategory(
  module: AdminSidebarModule
): AdminSidebarMenuCategory {
  if (isAdminSidebarMenuCategory(module.menuCategory)) {
    return module.menuCategory;
  }

  const key = module.key.trim().toLowerCase();
  const href = module.href.trim().toLowerCase();

  if (
    key.includes("reset") ||
    key.includes("danger") ||
    key.includes("destructive") ||
    key.includes("system_danger") ||
    href.includes("reset-db") ||
    href.includes("/danger") ||
    href.includes("/destructive")
  ) {
    return "system_danger";
  }

  if (
    key.includes("constructor") ||
    hrefStartsWith(href, "/admin/constructor-crm") ||
    hrefStartsWith(href, "/admin/constructor")
  ) {
    return "internal_constructor";
  }

  if (
    key.includes("paquete") ||
    key.includes("installer") ||
    key.includes("installable") ||
    href.includes("/paquetes")
  ) {
    return "internal_installer";
  }

  if (
    key.includes("bcr") ||
    key.includes("conocimiento") ||
    key.includes("base_conocimiento") ||
    href.includes("base-conocimiento") ||
    href.includes("conocimiento-rubro")
  ) {
    return "internal_bcr";
  }

  if (key === "reportes" || hrefStartsWith(href, "/admin/reportes")) {
    return "operational_reports";
  }

  if (
    key === "configuracion" ||
    key === "personalizacion" ||
    key === "rubros" ||
    key === "roles" ||
    key === "usuarios" ||
    key === "servicios" ||
    key === "pipelines" ||
    key === "ia" ||
    hrefStartsWith(href, "/admin/configuracion") ||
    hrefStartsWith(href, "/admin/personalizacion")
  ) {
    return "operational_config";
  }

  if (
    key === "mesa_ayuda" ||
    key.includes("helpdesk") ||
    key.includes("support") ||
    key === "neuroventas" ||
    hrefStartsWith(href, "/admin/mesa-de-ayuda") ||
    hrefStartsWith(href, "/admin/neuroventas")
  ) {
    return "support";
  }

  if (
    key.includes("lead") ||
    key === "dashboard" ||
    key === "dashboard_comercial" ||
    key === "entidades" ||
    key === "socios" ||
    key === "clientes" ||
    key === "empresas" ||
    key === "oportunidades" ||
    key === "agenda" ||
    key === "eventos" ||
    key === "reuniones" ||
    key === "operaciones" ||
    key === "copilot" ||
    hrefStartsWith(href, "/admin/leads") ||
    hrefStartsWith(href, "/admin/dashboard") ||
    hrefStartsWith(href, "/admin/empresas") ||
    hrefStartsWith(href, "/admin/socios") ||
    hrefStartsWith(href, "/admin/clientes") ||
    hrefStartsWith(href, "/admin/oportunidades") ||
    hrefStartsWith(href, "/admin/agenda")
  ) {
    return "operational_crm";
  }

  return "operational_crm";
}

export type AdminSidebarModeFilterOptions = {
  appMode?: AppMode;
  constructorEnabled?: boolean;
  installerEnabled?: boolean;
  bcrEnabled?: boolean;
  showInternalMenus?: boolean;
  clientVisibleModules?: string[];
};

type ResolvedAdminSidebarModeFilter = {
  appMode: AppMode;
  constructorEnabled: boolean;
  installerEnabled: boolean;
  bcrEnabled: boolean;
  showInternalMenus: boolean;
  clientVisibleModules: string[];
};

const CLIENT_CRM_ALLOWLIST_CATEGORIES: readonly AdminSidebarMenuCategory[] = [
  "operational_crm",
  "operational_reports",
  "operational_config",
  "support",
];

function resolveAdminSidebarModeFilter(
  options?: AdminSidebarModeFilterOptions
): ResolvedAdminSidebarModeFilter {
  return {
    appMode: options?.appMode ?? getAppMode(),
    constructorEnabled: options?.constructorEnabled ?? isConstructorEnabled(),
    installerEnabled: options?.installerEnabled ?? isInstallerEnabled(),
    bcrEnabled: options?.bcrEnabled ?? isBcrEnabled(),
    showInternalMenus: options?.showInternalMenus ?? shouldShowInternalMenus(),
    clientVisibleModules:
      options?.clientVisibleModules ?? getClientVisibleModules(),
  };
}

function passesClientVisibleModulesAllowlist(
  module: AdminSidebarModule,
  category: AdminSidebarMenuCategory,
  allowlist: string[]
): boolean {
  if (allowlist.length === 0) {
    return true;
  }
  if (
    !(CLIENT_CRM_ALLOWLIST_CATEGORIES as readonly string[]).includes(category)
  ) {
    return true;
  }
  return allowlist.includes(module.key);
}

function shouldIncludeSidebarModuleByMode(
  module: AdminSidebarModule,
  filter: ResolvedAdminSidebarModeFilter
): boolean {
  const category = getAdminSidebarModuleCategory(module);

  if (filter.appMode === "constructor_base") {
    if (!filter.showInternalMenus) {
      if (
        category === "internal_constructor" ||
        category === "internal_installer" ||
        category === "internal_bcr" ||
        category === "system_danger"
      ) {
        return false;
      }
    }
    if (category === "internal_constructor") {
      return filter.constructorEnabled;
    }
    if (category === "internal_installer") {
      return filter.installerEnabled;
    }
    if (category === "internal_bcr") {
      return filter.bcrEnabled;
    }
    return true;
  }

  if (filter.appMode === "installation_prep") {
    if (category === "internal_constructor") {
      return filter.constructorEnabled && filter.showInternalMenus;
    }
    if (category === "internal_installer") {
      return filter.installerEnabled && filter.showInternalMenus;
    }
    if (category === "internal_bcr") {
      return filter.bcrEnabled && filter.showInternalMenus;
    }
    if (category === "system_danger") {
      return filter.showInternalMenus;
    }
    return true;
  }

  if (
    category === "internal_constructor" ||
    category === "internal_installer" ||
    category === "internal_bcr" ||
    category === "system_danger"
  ) {
    return false;
  }

  return passesClientVisibleModulesAllowlist(
    module,
    category,
    filter.clientVisibleModules
  );
}

/**
 * Filtra ítems del sidebar por APP_MODE y flags. No muta el array de entrada.
 * Solo UX de menú; rutas/APIs se bloquean en fase posterior (12C/12E).
 */
export function filterAdminSidebarModulesByMode(
  modules: AdminSidebarModule[],
  options?: AdminSidebarModeFilterOptions
): AdminSidebarModule[] {
  const filter = resolveAdminSidebarModeFilter(options);
  return modules.filter((module) =>
    shouldIncludeSidebarModuleByMode(module, filter)
  );
}

const ALLOWED_KEYS = new Set(DEFAULT_ADMIN_SIDEBAR_MODULES.map((m) => m.key));

/** No se listan aunque existan en `sidebar_modules` en DB (legado o producto no listo). */
export const HIDDEN_SIDEBAR_MODULE_KEYS = [
  "dashboard",
  "copilot",
  "oportunidades",
  "eventos",
  "reuniones",
  "operaciones",
] as const;

const HIDDEN_SIDEBAR_KEY_SET = new Set<string>(HIDDEN_SIDEBAR_MODULE_KEYS);

export function mergeAdminSidebarModules(
  persisted: SidebarModulePersisted[] | null | undefined
): AdminSidebarModule[] {
  const byKey = new Map<string, SidebarModulePersisted>();
  for (const p of persisted ?? []) {
    if (p?.key && ALLOWED_KEYS.has(p.key)) byKey.set(p.key, p);
  }
  const merged = DEFAULT_ADMIN_SIDEBAR_MODULES.map((def) => {
    const o = byKey.get(def.key);
    const status: SidebarModuleStatus =
      o?.status === "activo" || o?.status === "en_preparacion" || o?.status === "oculto"
        ? o.status
        : def.status;
    const persistedLabel =
      typeof o?.label === "string" && o.label.trim() ? o.label.trim() : "";
    const label =
      def.key === "entidades" && /^entidades$/i.test(persistedLabel)
        ? def.label
        : def.key === "leads87" && /^(leads87|LEADS87)$/i.test(persistedLabel)
          ? def.label
          : persistedLabel || def.label;
    return {
      ...def,
      label,
      icon: typeof o?.icon === "string" && o.icon.trim() ? o.icon.trim() : def.icon,
      status,
    };
  });

  const visible = merged.filter((m) => !HIDDEN_SIDEBAR_KEY_SET.has(m.key));

  if (process.env.NODE_ENV === "development") {
    console.debug("[adminSidebarModules.merge]", {
      persistedRowCount: persisted?.length ?? 0,
      leads87Persisted: byKey.get("leads87"),
      leads87Merged: visible.find((m) => m.key === "leads87"),
      allLabels: visible.map((m) => ({ key: m.key, label: m.label, status: m.status })),
    });
  }

  return visible;
}

/** Sanitiza el body PATCH: solo keys conocidas y campos acotados. */
export function sanitizeSidebarModulesForPersist(raw: unknown): SidebarModulePersisted[] {
  if (!Array.isArray(raw)) return [];
  const out: SidebarModulePersisted[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const key = typeof (x as { key?: string }).key === "string" ? (x as { key: string }).key.trim() : "";
    if (!key || !ALLOWED_KEYS.has(key) || HIDDEN_SIDEBAR_KEY_SET.has(key)) continue;
    const row: SidebarModulePersisted = { key };
    const label = (x as { label?: string }).label;
    if (typeof label === "string" && label.trim()) row.label = label.trim().slice(0, 120);
    const icon = (x as { icon?: string }).icon;
    if (typeof icon === "string") row.icon = icon.slice(0, 32);
    const st = (x as { status?: string }).status;
    if (st === "activo" || st === "en_preparacion" || st === "oculto") row.status = st;
    out.push(row);
  }
  return out;
}

function readOptionalHrefFromRawEntry(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const href = (raw as { href?: string }).href;
  return typeof href === "string" && href.trim() ? href.trim() : undefined;
}

/** Bloqueo conservador por key/href antes de inferir categoría (client_crm). */
function isSidebarBlockedKeyOrHrefInClientCrm(key: string, href: string): boolean {
  const k = key.trim().toLowerCase();
  const h = href.trim().toLowerCase();

  if (
    k.includes("constructor") ||
    k.includes("paquete") ||
    k.includes("installer") ||
    k.includes("installable") ||
    k.includes("bcr") ||
    k.includes("conocimiento") ||
    k.includes("reset") ||
    k.includes("danger") ||
    k.includes("destructive") ||
    k.includes("system_danger")
  ) {
    return true;
  }

  if (
    hrefStartsWith(h, "/admin/constructor-crm") ||
    hrefStartsWith(h, "/admin/constructor") ||
    h.includes("reset-db") ||
    h.includes("/danger") ||
    h.includes("/destructive") ||
    h.includes("/paquetes") ||
    h.includes("base-conocimiento") ||
    h.includes("conocimiento-rubro")
  ) {
    return true;
  }

  return false;
}

function persistedRowToModuleForCategory(
  row: SidebarModulePersisted,
  hrefOverride?: string
): AdminSidebarModule {
  const def = DEFAULT_ADMIN_SIDEBAR_MODULES.find((m) => m.key === row.key);
  const href = hrefOverride ?? def?.href ?? `/admin/${row.key}`;
  return {
    key: row.key,
    label: row.label ?? def?.label ?? row.key,
    href,
    icon: row.icon ?? def?.icon ?? "•",
    status: row.status ?? def?.status ?? "activo",
    menuCategory: def?.menuCategory,
  };
}

function isSidebarModuleAllowedInClientCrmPersist(
  row: SidebarModulePersisted,
  hrefOverride?: string
): boolean {
  const module = persistedRowToModuleForCategory(row, hrefOverride);
  if (isSidebarBlockedKeyOrHrefInClientCrm(module.key, module.href)) {
    return false;
  }
  const category = getAdminSidebarModuleCategory(module);
  return (CLIENT_CRM_ALLOWLIST_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Sanitiza sidebar_modules antes de persistir en portal_config (solo client_crm).
 * Descarta internal_* y system_danger; no muta el array de entrada.
 */
export function sanitizeSidebarModulesForClientCrmPersist(
  modules: SidebarModulePersisted[] | unknown
): SidebarModulePersisted[] {
  const base = sanitizeSidebarModulesForPersist(modules);
  if (!Array.isArray(modules)) {
    return base;
  }

  const hrefByKey = new Map<string, string>();
  for (const entry of modules) {
    if (!entry || typeof entry !== "object") continue;
    const key =
      typeof (entry as { key?: string }).key === "string"
        ? (entry as { key: string }).key.trim()
        : "";
    const href = readOptionalHrefFromRawEntry(entry);
    if (key && href) hrefByKey.set(key, href);
  }

  const out: SidebarModulePersisted[] = [];
  for (const row of base) {
    if (!isSidebarModuleAllowedInClientCrmPersist(row, hrefByKey.get(row.key))) {
      continue;
    }
    out.push({ ...row });
  }
  return out;
}
