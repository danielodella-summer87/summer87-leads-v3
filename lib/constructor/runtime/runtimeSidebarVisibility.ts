/**
 * Visibilidad SUGERIDA de módulos del sidebar según el runtime/vertical
 * confirmado (CONSTRUCTOR-RUNTIME-3).
 *
 * Helper PURO y READ-ONLY que prepara el puente runtime → navegación. NO muta el
 * sidebar ni decide ocultamientos por sí solo: solo devuelve SUGERENCIAS para que
 * una capa superior (futura) las aplique con criterio humano.
 *
 * Reglas conservadoras (fail-open):
 *  - Si no hay runtime o el runtime no está `ready_readonly` → todo `keep`.
 *  - Nunca sugiere ocultar navegación base, configuración, seguridad o auth.
 *  - `suggest_hide` solo para ítems que el caller etiqueta con un vertical
 *    distinto al confirmado (vertical-scoped explícito). No infiere ocultamientos
 *    sobre módulos operativos genéricos.
 *
 * Módulo autocontenido: depende de RuntimeConfig SOLO por tipos (`import type`),
 * por lo que en runtime no hay imports a resolver y el selftest corre con
 * `node --experimental-strip-types`.
 */

import type { ConstructorRuntimeConfig } from "./constructorRuntimeConfig";

export type SidebarVisibilitySuggestion =
  | "keep"
  | "suggest_hide"
  | "internal_only"
  | "vertical_specific";

/** Ítem de sidebar simplificado (no acopla al tipo real del admin shell). */
export type SidebarItemLite = {
  key: string;
  href?: string;
  /** Categoría del item (p. ej. "internal_constructor", "operational"). */
  category?: string;
  /** Si el item pertenece a un vertical específico (vertical-scoped). */
  vertical?: string;
  /** Base/crítico/seguridad: nunca se sugiere ocultar. */
  protected?: boolean;
};

export type SidebarVisibilityResult = {
  key: string;
  suggestion: SidebarVisibilitySuggestion;
  reason: string;
};

// Claves de navegación base / crítica que NUNCA se sugiere ocultar en esta fase.
const PROTECTED_BASE_KEYS = new Set<string>([
  "dashboard",
  "leads",
  "leads87",
  "leadsok",
  "clientes",
  "socios",
  "empresas",
  "oportunidades",
  "agenda",
  "reuniones",
  "eventos",
  "operaciones",
  "reportes",
  "copilot",
  "neuroventas",
  "mesa-de-ayuda",
  "configuracion",
  "personalizacion",
  "usuarios",
  "roles",
  "permisos",
  "seguridad",
  "auth",
]);

function isProtectedKey(key: string): boolean {
  return PROTECTED_BASE_KEYS.has(key.trim().toLowerCase());
}

function isInternalCategory(category: string | undefined): boolean {
  if (!category) return false;
  const c = category.toLowerCase();
  return c.startsWith("internal_") || c.startsWith("system_");
}

function keyLooksInternal(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes("constructor") || k.includes("installer");
}

/**
 * Devuelve sugerencias de visibilidad por ítem. NO muta `items` ni `runtime`.
 * Fail-open: ante cualquier duda o runtime no listo → `keep`.
 */
export function suggestRuntimeSidebarVisibility(
  runtime: ConstructorRuntimeConfig | null | undefined,
  items: SidebarItemLite[] = []
): SidebarVisibilityResult[] {
  const ready = runtime?.status === "ready_readonly";
  const verticalKey = runtime?.vertical_key ?? null;
  const moduleKeys = new Set<string>((runtime?.modules ?? []).map((m) => m.key));

  return items.map((item) => {
    const key = item.key;

    // Fail-open: sin runtime listo no se sugiere ocultar nada.
    if (!ready) {
      return { key, suggestion: "keep", reason: "runtime_not_ready" };
    }

    // Navegación base / crítica / seguridad → siempre keep.
    if (item.protected || isProtectedKey(key)) {
      return { key, suggestion: "keep", reason: "protected_base" };
    }

    // Módulos internos del Constructor/instalador → informativo (no operativo).
    if (isInternalCategory(item.category) || keyLooksInternal(key)) {
      return { key, suggestion: "internal_only", reason: "internal_module" };
    }

    // Ítems vertical-scoped declarados explícitamente por el caller.
    if (item.vertical) {
      if (verticalKey && item.vertical === verticalKey) {
        return { key, suggestion: "vertical_specific", reason: "matches_confirmed_vertical" };
      }
      return { key, suggestion: "suggest_hide", reason: "belongs_to_other_vertical" };
    }

    // Ítem que coincide con un módulo del vertical confirmado.
    if (moduleKeys.has(key)) {
      return { key, suggestion: "vertical_specific", reason: "is_vertical_module" };
    }

    // Por defecto: mantener visible (conservador).
    return { key, suggestion: "keep", reason: "default_keep" };
  });
}

/** Conveniencia: solo las keys que el helper sugeriría ocultar (puede ser vacío). */
export function getSuggestedHiddenKeys(
  runtime: ConstructorRuntimeConfig | null | undefined,
  items: SidebarItemLite[] = []
): string[] {
  return suggestRuntimeSidebarVisibility(runtime, items)
    .filter((r) => r.suggestion === "suggest_hide")
    .map((r) => r.key);
}
