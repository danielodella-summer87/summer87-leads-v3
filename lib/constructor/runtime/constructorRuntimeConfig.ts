/**
 * Constructor Runtime Config — helper puro READ-ONLY (CONSTRUCTOR-RUNTIME-1).
 *
 * Consolida la configuración que el CRM operativo PUEDE empezar a consumir,
 * derivada del cierre confirmado del Discovery (snapshot 8b) + vertical_key
 * confirmado (8d). Es la primera capa intermedia read-only del puente
 * Constructor → CRM operativo (ver CONSTRUCTOR-RUNTIME-1-PRE).
 *
 * GARANTÍAS (no romper):
 *  - READ-ONLY: no escribe nada; no toca package_payload ni installable_package.
 *  - No activa motores; no crea CRM operativo.
 *  - No accede a DB, red, fs ni process.env; no depende de React.
 *  - No muta el input; determinístico (generated_at lo provee el caller).
 *  - Fallback seguro: sin snapshot → `unavailable`; vertical fuera de catálogo →
 *    fallback + blocker explícito. No asume país, moneda, vertical, costeo,
 *    Casa Limpia ni Pickup.
 *
 * Módulo autocontenido: depende de discovery/verticals SOLO por tipos
 * (`import type`), por lo que en runtime no hay imports a resolver y el selftest
 * corre con `node --experimental-strip-types`.
 */

import type {
  DiscoverySubmission,
  DiscoveryStatus,
} from "../discovery/discoveryContext";
import type { VerticalKey } from "../verticals/verticalCatalog";

export const CONSTRUCTOR_RUNTIME_CONFIG_SCHEMA_VERSION = "1.0.0";

export type ConstructorRuntimeStatus =
  | "unavailable"
  | "draft"
  | "blocked"
  | "review_required"
  | "ready_readonly";

export type ConstructorRuntimeModule = {
  key: string;
  label: string;
  category: string;
  required: boolean;
  enabled: boolean;
  blocker_keys: string[];
};

export type ConstructorRuntimeConfig = {
  schema_version: string;
  status: ConstructorRuntimeStatus;

  vertical_key: string | null;
  vertical_label: string | null;
  vertical_in_catalog: boolean;

  discovery_status: DiscoveryStatus | null;
  discovery_completion_percent: number;
  human_review_required: boolean;

  modules: ConstructorRuntimeModule[];
  enabled_modules: string[];
  blocked_modules: string[];

  blockers: string[];
  missing_critical_fields: string[];
  engine_blockers: string[];
  vertical_blockers: string[];
  business_module_blockers: string[];
  /** Solo presente si el vertical declara módulo pricing/costing/quotation. */
  quoting_blockers?: string[];

  can_use_readonly_runtime: boolean;
  can_generate_package_payload: boolean;
  can_activate_engines: boolean;
  can_create_operational_crm: boolean;

  source: "constructor_discovery" | "none";
  generated_at: string | null;
};

export type BuildConstructorRuntimeConfigInput = {
  /** Snapshot persistido en crm_setup_config.meta.discovery_submission (8b). */
  discoverySubmission?: DiscoverySubmission | null;
  /** vertical_key confirmado en crm_setup_config.meta.vertical_key (8d). */
  verticalKey?: string | null;
  /** Timestamp provisto por el caller (mantiene la función pura). */
  generatedAt?: string | null;
};

// Labels de los verticales conocidos (espejo estable del catálogo VERTICALS-1).
const VERTICAL_LABELS: Record<VerticalKey, string> = {
  generic: "Genérico",
  cleaning_services: "Servicios de limpieza",
  pickup_4x4: "Vehículos / repuestos 4x4",
  marketing_agency: "Agencia de marketing",
  education: "Educación",
};
const KNOWN_VERTICAL_KEYS = new Set<string>(Object.keys(VERTICAL_LABELS));

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function unavailableConfig(
  verticalKey: string | null,
  generatedAt: string | null
): ConstructorRuntimeConfig {
  return {
    schema_version: CONSTRUCTOR_RUNTIME_CONFIG_SCHEMA_VERSION,
    status: "unavailable",
    vertical_key: verticalKey,
    vertical_label: verticalKey ? VERTICAL_LABELS[verticalKey as VerticalKey] ?? null : null,
    vertical_in_catalog: verticalKey ? KNOWN_VERTICAL_KEYS.has(verticalKey) : false,
    discovery_status: null,
    discovery_completion_percent: 0,
    human_review_required: false,
    modules: [],
    enabled_modules: [],
    blocked_modules: [],
    blockers: ["missing_discovery_submission"],
    missing_critical_fields: [],
    engine_blockers: [],
    vertical_blockers: [],
    business_module_blockers: [],
    can_use_readonly_runtime: false,
    can_generate_package_payload: false,
    can_activate_engines: false,
    can_create_operational_crm: false,
    source: "none",
    generated_at: generatedAt,
  };
}

/**
 * Construye la configuración runtime read-only desde el snapshot confirmado.
 * NUNCA habilita generación de paquete, motores ni creación de CRM en esta fase.
 */
export function buildConstructorRuntimeConfig(
  input: BuildConstructorRuntimeConfigInput = {}
): ConstructorRuntimeConfig {
  const generatedAt = asString(input.generatedAt) ?? null;
  const submission = input.discoverySubmission ?? null;

  // vertical_key: confirmado (caller) → el del snapshot → null.
  const ctxVerticalKey = submission
    ? asString(submission.discovery_context?.vertical_key?.value as unknown)
    : null;
  const verticalKey = asString(input.verticalKey) ?? ctxVerticalKey ?? null;

  if (!submission) {
    return unavailableConfig(verticalKey, generatedAt);
  }

  const vertical_in_catalog = verticalKey ? KNOWN_VERTICAL_KEYS.has(verticalKey) : false;
  const vertical_label = verticalKey
    ? VERTICAL_LABELS[verticalKey as VerticalKey] ?? VERTICAL_LABELS.generic
    : null;

  // Módulos: vienen ya evaluados dentro del snapshot (discovery_context).
  const ctxModules = submission.discovery_context?.business_modules ?? [];
  const modules: ConstructorRuntimeModule[] = ctxModules.map((m) => ({
    key: m.key,
    label: m.label,
    category: m.category,
    required: m.required,
    enabled: m.enabled,
    blocker_keys: [...m.blocker_keys],
  }));
  const enabled_modules = modules.filter((m) => m.enabled).map((m) => m.key);
  const blocked_modules = modules.filter((m) => !m.enabled).map((m) => m.key);

  const missing_critical_fields = [...submission.missing_critical_fields];
  const engine_blockers = [...submission.engine_blockers];
  const vertical_blockers = [...submission.vertical_blockers];
  const business_module_blockers = [...submission.business_module_blockers];
  const quoting_blockers =
    submission.quoting_blockers !== undefined ? [...submission.quoting_blockers] : undefined;

  // blockers consolidados (namespaced, únicos).
  const blockerSet = new Set<string>();
  for (const f of missing_critical_fields) blockerSet.add(`critical:${f}`);
  for (const b of engine_blockers) blockerSet.add(`engine:${b}`);
  for (const b of vertical_blockers) blockerSet.add(`vertical:${b}`);
  for (const b of business_module_blockers) blockerSet.add(`module:${b}`);
  if (quoting_blockers) for (const b of quoting_blockers) blockerSet.add(`quoting:${b}`);
  if (verticalKey && !vertical_in_catalog) blockerSet.add("vertical_not_in_catalog");
  const blockers = Array.from(blockerSet);

  const discovery_status = submission.status;
  const human_review_required = Boolean(submission.human_review_required);

  const hardBlocked =
    missing_critical_fields.length > 0 ||
    engine_blockers.length > 0 ||
    vertical_blockers.length > 0 ||
    business_module_blockers.length > 0 ||
    (quoting_blockers !== undefined && quoting_blockers.length > 0);

  // ── Estado runtime ──────────────────────────────────────────────────────────
  let status: ConstructorRuntimeStatus;
  if (discovery_status === "draft") {
    status = "draft";
  } else if (hardBlocked) {
    status = "blocked";
  } else if (
    human_review_required ||
    discovery_status === "in_review" ||
    discovery_status === "needs_rework"
  ) {
    status = "review_required";
  } else if (discovery_status === "confirmed") {
    status = "ready_readonly";
  } else {
    status = "review_required";
  }

  // Vertical fuera de catálogo: nunca quedar como ready; al menos revisión.
  if (status === "ready_readonly" && verticalKey && !vertical_in_catalog) {
    status = "review_required";
  }

  // Read-only consumible si el snapshot es usable (incluso con review/blocked),
  // pero no en draft ni unavailable.
  const can_use_readonly_runtime =
    status === "ready_readonly" || status === "review_required" || status === "blocked";

  return {
    schema_version: CONSTRUCTOR_RUNTIME_CONFIG_SCHEMA_VERSION,
    status,
    vertical_key: verticalKey,
    vertical_label,
    vertical_in_catalog,
    discovery_status,
    discovery_completion_percent: submission.completion_percent,
    human_review_required,
    modules,
    enabled_modules,
    blocked_modules,
    blockers,
    missing_critical_fields,
    engine_blockers,
    vertical_blockers,
    business_module_blockers,
    ...(quoting_blockers !== undefined ? { quoting_blockers } : {}),
    // Compuertas: TODAS bloqueadas en esta fase (read-only).
    can_use_readonly_runtime,
    can_generate_package_payload: false,
    can_activate_engines: false,
    can_create_operational_crm: false,
    source: "constructor_discovery",
    generated_at: generatedAt,
  };
}
