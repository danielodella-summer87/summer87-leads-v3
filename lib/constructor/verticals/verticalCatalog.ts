/**
 * Catálogo reusable de verticales y módulos de negocio (CONSTRUCTOR-VERTICALS-1).
 *
 * Resuelve `vertical_key` → `businessModules` + `verticalRequiredFields` + campos
 * verticales por defecto, para alimentar `buildDiscoveryContextFromSetup` SIN
 * hardcodear Casa Limpia, Pickup 4x4 ni agencia como arquitectura base.
 *
 * CORRECCIÓN CONCEPTUAL VIGENTE:
 *   Costeo y cotización NO son universales. Solo el vertical `cleaning_services`
 *   incluye módulos pricing/costing/quotation por defecto. Los demás NO generan
 *   `quoting_blockers` salvo que el caller agregue explícitamente un módulo pricing.
 *
 * PUREZA: módulo de datos puro. No DB, red, fs, env ni React. No muta input.
 * Depende de DiscoveryContext SOLO por tipos (`import type`), por lo que en runtime
 * no hay dependencia (los type-imports se borran) y el selftest corre con
 * `node --experimental-strip-types` sin cadenas de import con extensión.
 */

import type {
  BusinessModuleInput,
  DiscoverySetupInput,
  DiscoveryVerticalFieldInput,
} from "../discovery/discoveryContext";

export const VERTICAL_CATALOG_SCHEMA_VERSION = "1.0.0";

export type VerticalKey =
  | "generic"
  | "cleaning_services"
  | "pickup_4x4"
  | "marketing_agency"
  | "education";

export type VerticalCategory =
  | "general"
  | "services"
  | "retail"
  | "agency"
  | "education";

/** Preset de módulo: compatible 1:1 con BusinessModuleInput de DiscoveryContext. */
export type BusinessModulePreset = BusinessModuleInput;

export type VerticalDefinition = {
  key: VerticalKey;
  label: string;
  description: string;
  category: VerticalCategory;
  business_modules: BusinessModulePreset[];
  vertical_required_fields: string[];
  default_fields?: DiscoveryVerticalFieldInput[];
  notes?: string;
};

// ── Catálogo ──────────────────────────────────────────────────────────────────
//
// Reglas:
//  - Solo `cleaning_services` trae módulos pricing/costing/quotation por defecto.
//  - Ningún otro vertical asume costeo, stock, compatibilidad vehicular ni
//    propuesta automática como pricing.
//  - `required_fields` referencian claves canónicas de DiscoveryContext o campos
//    verticales declarados en `default_fields`.

const GENERIC: VerticalDefinition = {
  key: "generic",
  label: "Genérico",
  description: "CRM comercial base sin supuestos de vertical. Captura, calificación y seguimiento.",
  category: "general",
  vertical_required_fields: ["products_or_services"],
  business_modules: [
    { key: "lead_capture", label: "Captura de leads", category: "commercial", required: true, required_fields: ["client_name", "pipeline_stages"] },
    { key: "lead_qualification", label: "Calificación de leads", category: "commercial", required: true, required_fields: ["sales_process", "customer_segments"] },
    { key: "follow_up", label: "Seguimiento", category: "commercial", required: true, required_fields: ["sales_process"] },
    { key: "basic_reporting", label: "Reportes básicos", category: "analytics", required: false, required_fields: ["pipeline_stages"] },
  ],
  notes: "Sin pricing/costing por defecto.",
};

const CLEANING_SERVICES: VerticalDefinition = {
  key: "cleaning_services",
  label: "Servicios de limpieza",
  description: "Servicios con relevamiento de sitio, alcance operativo y cotización (modelo tipo Casa Limpia).",
  category: "services",
  vertical_required_fields: ["country", "service_areas"],
  business_modules: [
    { key: "site_survey", label: "Relevamiento de sitio", category: "operational", required: true, required_fields: ["service_areas"] },
    { key: "service_recommendation", label: "Recomendación de servicios", category: "product", required: true, required_fields: ["products_or_services", "customer_segments"] },
    { key: "operational_scope", label: "Alcance operativo", category: "operational", required: true, required_fields: ["operational_process", "service_areas"] },
    { key: "costing", label: "Costeo", category: "pricing", required: true, required_fields: ["currency", "cost_inputs"] },
    { key: "quotation", label: "Cotización", category: "pricing", required: true, required_fields: ["currency", "pricing_model", "products_or_services"] },
    { key: "proposal_review", label: "Revisión de propuesta", category: "commercial", required: true, required_fields: ["sales_process"] },
  ],
  default_fields: [
    { key: "cost_inputs", label: "Insumos de costo", state: "pending", source: "vertical", critical: false },
  ],
  notes: "Único vertical con pricing/costing/quotation por defecto. Genera quoting_blockers si faltan currency/cost_inputs/pricing_model.",
};

const PICKUP_4X4: VerticalDefinition = {
  key: "pickup_4x4",
  label: "Vehículos / repuestos 4x4",
  description: "Venta de vehículos y repuestos con compatibilidad y recomendación de producto (modelo tipo Pickup 4x4).",
  category: "retail",
  vertical_required_fields: ["products_or_services"],
  business_modules: [
    { key: "vehicle_fitment", label: "Compatibilidad vehicular", category: "product", required: true, required_fields: ["products_or_services", "vehicle_compatibility"] },
    { key: "product_recommendation", label: "Recomendación de producto", category: "product", required: true, required_fields: ["products_or_services"] },
    { key: "purchase_history", label: "Historial de compra", category: "analytics", required: true, required_fields: ["purchase_history_data"] },
    { key: "opportunity_detection", label: "Detección de oportunidades", category: "analytics", required: false, required_fields: ["pipeline_stages"] },
    { key: "stock_interest", label: "Interés en stock", category: "analytics", required: false, required_fields: ["stock_data"] },
    { key: "customer_segmentation", label: "Segmentación de clientes", category: "commercial", required: true, required_fields: ["customer_segments"] },
  ],
  default_fields: [
    { key: "vehicle_compatibility", label: "Compatibilidad de vehículos", state: "pending", source: "vertical", critical: false },
    { key: "purchase_history_data", label: "Datos de historial de compra", state: "pending", source: "vertical", critical: false },
    { key: "stock_data", label: "Datos de stock", state: "pending", source: "vertical", critical: false },
  ],
  notes: "Sin pricing/costing/quotation por defecto. No genera quoting_blockers salvo módulo pricing explícito.",
};

const MARKETING_AGENCY: VerticalDefinition = {
  key: "marketing_agency",
  label: "Agencia de marketing",
  description: "Diagnóstico comercial, estrategia de canales y alcance de propuesta (proposal_scope NO es cotización).",
  category: "agency",
  vertical_required_fields: ["products_or_services"],
  business_modules: [
    { key: "commercial_diagnosis", label: "Diagnóstico comercial", category: "commercial", required: true, required_fields: ["sales_process"] },
    { key: "channel_strategy", label: "Estrategia de canales", category: "commercial", required: true, required_fields: ["products_or_services", "customer_segments"] },
    { key: "campaign_planning", label: "Planificación de campañas", category: "operational", required: true, required_fields: ["operational_team"] },
    { key: "proposal_scope", label: "Alcance de propuesta", category: "commercial", required: true, required_fields: ["products_or_services"] },
    { key: "client_follow_up", label: "Seguimiento de cliente", category: "commercial", required: false, required_fields: ["sales_process"] },
    { key: "performance_reporting", label: "Reportes de performance", category: "analytics", required: false, required_fields: ["pipeline_stages"] },
  ],
  default_fields: [
    { key: "operational_team", label: "Equipo operativo", state: "pending", source: "vertical", critical: false },
  ],
  notes: "Sin pricing/costing/quotation. proposal_scope es alcance comercial, NO cotización.",
};

const EDUCATION: VerticalDefinition = {
  key: "education",
  label: "Educación",
  description: "Pipeline de inscripción, checklist documental y estado de admisión.",
  category: "education",
  vertical_required_fields: ["pipeline_stages"],
  business_modules: [
    { key: "enrollment_pipeline", label: "Pipeline de inscripción", category: "operational", required: true, required_fields: ["pipeline_stages"] },
    { key: "documentation_checklist", label: "Checklist documental", category: "compliance", required: true, required_fields: ["lead_fields"] },
    { key: "admission_status", label: "Estado de admisión", category: "operational", required: true, required_fields: ["sales_process"] },
    { key: "capacity_tracking", label: "Seguimiento de cupos", category: "analytics", required: false, required_fields: ["capacity_data"] },
    { key: "family_follow_up", label: "Seguimiento a familias", category: "commercial", required: false, required_fields: ["customer_segments"] },
    { key: "reporting", label: "Reportes", category: "analytics", required: false, required_fields: ["pipeline_stages"] },
  ],
  default_fields: [
    { key: "capacity_data", label: "Datos de cupos", state: "pending", source: "vertical", critical: false },
  ],
  notes: "Sin pricing/costing/quotation por defecto.",
};

const CATALOG: Record<VerticalKey, VerticalDefinition> = {
  generic: GENERIC,
  cleaning_services: CLEANING_SERVICES,
  pickup_4x4: PICKUP_4X4,
  marketing_agency: MARKETING_AGENCY,
  education: EDUCATION,
};

export const VERTICAL_KEYS: readonly VerticalKey[] = [
  "generic",
  "cleaning_services",
  "pickup_4x4",
  "marketing_agency",
  "education",
];

export const FALLBACK_VERTICAL_KEY: VerticalKey = "generic";

function isVerticalKey(value: unknown): value is VerticalKey {
  return typeof value === "string" && (VERTICAL_KEYS as readonly string[]).includes(value);
}

// ── Helpers puros ─────────────────────────────────────────────────────────────

/** Devuelve la definición del vertical, o `null` si la key no existe (explícito). */
export function getVerticalDefinition(verticalKey: string | null | undefined): VerticalDefinition | null {
  return isVerticalKey(verticalKey) ? CATALOG[verticalKey] : null;
}

/**
 * Resuelve a una definición SIEMPRE válida: si la key no existe, cae a `generic`
 * (fallback seguro, sin pricing/costing). Usar en los builders.
 */
export function resolveVerticalDefinition(verticalKey: string | null | undefined): VerticalDefinition {
  return getVerticalDefinition(verticalKey) ?? CATALOG[FALLBACK_VERTICAL_KEY];
}

/** Módulos del vertical (copia nueva). Fallback seguro a generic si no existe. */
export function getBusinessModulesForVertical(verticalKey: string | null | undefined): BusinessModulePreset[] {
  return resolveVerticalDefinition(verticalKey).business_modules.map((m) => ({ ...m }));
}

/** Campos críticos declarados por el vertical (copia nueva). */
export function getVerticalRequiredFields(verticalKey: string | null | undefined): string[] {
  return [...resolveVerticalDefinition(verticalKey).vertical_required_fields];
}

// ── Detección de vertical_key desde el setup (CONSTRUCTOR-DISCOVERY-8c) ───────
//
// Mapeo conservador: usa señales explícitas primero; si no, intenta mapear el
// rubro/giro por palabras clave; si no hay match seguro → `generic`.
// NO asume país, moneda, Casa Limpia ni Pickup.

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (combining marks)
    .toLowerCase()
    .trim();
}

/** Reglas de palabras clave → vertical. Orden estable, primera coincidencia gana. */
const VERTICAL_KEYWORD_RULES: ReadonlyArray<{ vertical: VerticalKey; keywords: readonly string[] }> = [
  { vertical: "cleaning_services", keywords: ["limpieza", "cleaning", "facility", "aseo", "higiene"] },
  { vertical: "pickup_4x4", keywords: ["pickup", "4x4", "vehiculo", "vehiculos", "repuesto", "repuestos", "automotriz", "autopart", "concesionario"] },
  { vertical: "marketing_agency", keywords: ["marketing", "agencia", "publicidad", "agency", "comunicacion", "branding"] },
  { vertical: "education", keywords: ["educacion", "colegio", "instituto", "universidad", "inscripcion", "inscripciones", "escuela", "academia", "education"] },
];

export type DetectVerticalInput = {
  verticalKey?: string | null;
  empresa?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Detecta el vertical desde el setup, de forma pura y conservadora:
 *  1) `verticalKey` explícito (caller) si es una key conocida.
 *  2) `empresa.vertical` o `meta.vertical_key` si son keys conocidas.
 *  3) Mapeo por palabras clave sobre empresa.vertical / rubro / giro.
 *  4) Fallback seguro a `generic` (sin pricing).
 */
export function detectVerticalKey(input: DetectVerticalInput = {}): VerticalKey {
  const empresa = input.empresa ?? {};
  const meta = input.meta ?? {};

  // 1) key explícita del caller
  if (isVerticalKey(input.verticalKey)) return input.verticalKey;

  // 2) key explícita en empresa.vertical o meta.vertical_key
  const empresaVerticalRaw = typeof empresa.vertical === "string" ? empresa.vertical.trim() : "";
  if (isVerticalKey(empresaVerticalRaw)) return empresaVerticalRaw;
  const metaVerticalRaw = typeof meta.vertical_key === "string" ? meta.vertical_key.trim() : "";
  if (isVerticalKey(metaVerticalRaw)) return metaVerticalRaw;

  // 3) mapeo por palabras clave sobre texto del rubro/giro/vertical
  const haystack = [
    normalizeText(empresa.vertical),
    normalizeText(empresa.rubro),
    normalizeText(empresa.rubroPersonalizado),
    normalizeText(empresa.giro),
  ].join(" ");
  for (const rule of VERTICAL_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.vertical;
  }

  // 4) fallback seguro
  return FALLBACK_VERTICAL_KEY;
}

/**
 * Combina un setup base con los presets del vertical para alimentar
 * `buildDiscoveryContextFromSetup`. No muta `baseInput`.
 * Lo declarado por el caller se concatena/gana sobre los presets:
 *  - `verticalKey`: el del caller si viene, si no el del vertical resuelto.
 *  - `businessModules`: presets del vertical + los del caller (permite agregar
 *    explícitamente, p. ej., un módulo pricing a un vertical que no lo trae).
 *  - `verticalRequiredFields` y `verticalFields`: unión preset + caller.
 */
export function buildDiscoveryContextInputForVertical(
  baseInput: DiscoverySetupInput = {},
  verticalKey: string | null | undefined
): DiscoverySetupInput {
  const def = resolveVerticalDefinition(verticalKey);

  const mergedModules: BusinessModuleInput[] = [
    ...def.business_modules.map((m) => ({ ...m })),
    ...(baseInput.businessModules ?? []),
  ];

  const mergedRequired = Array.from(
    new Set([...def.vertical_required_fields, ...(baseInput.verticalRequiredFields ?? [])])
  );

  const mergedVerticalFields: DiscoveryVerticalFieldInput[] = [
    ...(def.default_fields ?? []).map((f) => ({ ...f })),
    ...(baseInput.verticalFields ?? []),
  ];

  return {
    ...baseInput,
    verticalKey: baseInput.verticalKey ?? def.key,
    businessModules: mergedModules,
    verticalRequiredFields: mergedRequired,
    verticalFields: mergedVerticalFields,
  };
}
