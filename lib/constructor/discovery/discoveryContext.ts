/**
 * DiscoveryContext universal — helper puro (CONSTRUCTOR-DISCOVERY-8a).
 *
 * Construye un DiscoveryContext a partir del setup actual del Constructor
 * (columnas JSONB por paso de `crm_setup_config`) + módulos por vertical
 * declarados por el caller. Es la fuente de verdad derivada que precede a
 * motores, módulos sensibles (incluido costeo/cotización) y al package_payload.
 *
 * CORRECCIÓN CONCEPTUAL (8a):
 *   Costeo y cotización NO son capacidades universales. Son MÓDULOS DE NEGOCIO
 *   opcionales que aplican solo a ciertos verticales. Por eso `quoting_blockers`
 *   solo se completa si el vertical declara un módulo de tipo pricing/costing/
 *   quotation; en caso contrario queda `undefined` (no aplica).
 *
 * GARANTÍAS DE PUREZA (no romper):
 *  - No accede a DB, red, filesystem ni process.env.
 *  - No depende de React ni de Next.
 *  - No muta el input.
 *  - Determinístico: no usa Date.now()/Math.random(); `generated_at` lo provee el caller.
 *  - Acepta setup parcial: ausencia de datos => `pending`/blockers, nunca inventa valores.
 *  - Agnóstico de cliente y de vertical: NO asume país, moneda, vertical, módulos,
 *    Pickup ni Casa Limpia.
 *
 * Módulo autocontenido a propósito (sin imports internos) para poder ejecutarse
 * directamente con `node --experimental-strip-types` en el selftest.
 */

export const DISCOVERY_CONTEXT_SCHEMA_VERSION = "1.1.0";

// ── Estados de dato ───────────────────────────────────────────────────────────
export type DiscoveryDataState =
  | "confirmed"
  | "pending"
  | "estimated"
  | "not_applicable"
  | "requires_human_decision";

export type DiscoveryFieldSource =
  | "empresa"
  | "cuestionario"
  | "diagnostico"
  | "proceso_pipeline"
  | "motores_ia"
  | "reportes"
  | "documentos"
  | "caller"
  | "vertical"
  | "derived"
  | "none";

export type DiscoveryField<T = unknown> = {
  key: string;
  label: string;
  value: T | null;
  state: DiscoveryDataState;
  source: DiscoveryFieldSource;
  critical: boolean;
  module_key?: string;
  note?: string;
};

export type DiscoveryStatus = "draft" | "in_review" | "confirmed" | "needs_rework";

export type DiscoverySourceRef = { step: string; field: string };

// ── Módulos de negocio por vertical ───────────────────────────────────────────
export type BusinessModuleCategory =
  | "commercial"
  | "operational"
  | "pricing"
  | "product"
  | "analytics"
  | "compliance"
  | "other";

/** Módulo declarado por el vertical (input). El helper NO inventa módulos. */
export type BusinessModuleInput = {
  key: string;
  label?: string;
  category?: BusinessModuleCategory;
  /** Si el vertical considera este módulo imprescindible. */
  required?: boolean;
  /** Claves de campos (canónicos o verticales) que el módulo necesita confirmados. */
  required_fields?: string[];
  optional_fields?: string[];
};

export type BusinessModule = {
  key: string;
  label: string;
  category: BusinessModuleCategory;
  required: boolean;
  enabled: boolean;
  blocker_keys: string[];
  required_fields: string[];
  optional_fields: string[];
  human_review_required: boolean;
};

/** Campo vertical específico declarado por el caller (no se infiere ni inventa). */
export type DiscoveryVerticalFieldInput = {
  key: string;
  label?: string;
  value?: unknown;
  state?: DiscoveryDataState;
  source?: DiscoveryFieldSource;
  critical?: boolean;
  module_key?: string;
  note?: string;
};

// ── Input: el setup actual (JSONB por paso) + declaraciones del caller ────────
export type DiscoverySetupStep = Record<string, unknown>;

export type DiscoverySetupInput = {
  empresa?: DiscoverySetupStep | null;
  cuestionario?: DiscoverySetupStep | null;
  documentos?: DiscoverySetupStep | null;
  diagnostico?: DiscoverySetupStep | null;
  proceso_pipeline?: DiscoverySetupStep | null;
  motores_ia?: DiscoverySetupStep | null;
  reportes?: DiscoverySetupStep | null;
  auditoria?: DiscoverySetupStep | null;
  meta?: DiscoverySetupStep | null;

  /** Identificadores que define el caller al crear el proyecto (no se inventan). */
  clientKey?: string | null;
  projectKey?: string | null;
  verticalKey?: string | null;

  /** Campos que el vertical declara como críticos (canónicos o verticales). */
  verticalRequiredFields?: string[];
  /** Campos verticales específicos con estado explícito (caller los declara). */
  verticalFields?: DiscoveryVerticalFieldInput[];
  /** Módulos de negocio del vertical (incluye, si aplica, pricing/costing). */
  businessModules?: BusinessModuleInput[];

  /** Timestamp provisto por el caller; mantiene la función pura/determinística. */
  generatedAt?: string | null;
  /** Si el Discovery fue sellado por el botón "Terminé" (fase 8b). */
  submittedAt?: string | null;
};

export type DiscoveryContext = {
  schema_version: string;

  // Identidad
  client_key: DiscoveryField<string>;
  vertical_key: DiscoveryField<string>;
  project_key: DiscoveryField<string>;
  client_name: DiscoveryField<string>;
  business_type: DiscoveryField<string>;

  // Localización y economía
  country: DiscoveryField<string>;
  currency: DiscoveryField<string>;
  timezone: DiscoveryField<string>;
  language: DiscoveryField<string>;
  cities: DiscoveryField<string[]>;
  service_areas: DiscoveryField<string[]>;

  // Oferta y demanda
  products_or_services: DiscoveryField<string[]>;
  customer_segments: DiscoveryField<string[]>;

  // Proceso
  sales_process: DiscoveryField<string>;
  operational_process: DiscoveryField<string>;
  lead_fields: DiscoveryField<string[]>;
  account_fields: DiscoveryField<string[]>;
  contact_fields: DiscoveryField<string[]>;
  pipeline_stages: DiscoveryField<string[]>;
  modules_enabled: DiscoveryField<string[]>;

  // Campos verticales específicos
  vertical_fields: DiscoveryField[];

  // Módulos de negocio del vertical
  business_modules: BusinessModule[];

  // Motores
  allowed_engines: string[];
  blocked_engines: string[];

  // Particiones por estado
  confirmed_fields: string[];
  pending_fields: string[];
  estimated_fields: string[];
  not_applicable_fields: string[];
  human_decision_fields: string[];

  // Derivados de gobierno
  missing_critical_fields: string[];
  engine_blockers: string[];
  vertical_blockers: string[];
  business_module_blockers: string[];
  /** Solo presente si el vertical declara un módulo pricing/costing/quotation. */
  quoting_blockers?: string[];

  // Cualitativo
  assumptions: string[];
  risks: string[];
  sources: DiscoverySourceRef[];

  // Estado global
  status: DiscoveryStatus;
  completion_percent: number;
  human_review_required: boolean;
  created_from: string;
  generated_at: string | null;
};

// ── Registro de motores (genérico, agnóstico de vertical) ─────────────────────
export const READ_ONLY_ENGINES = [
  "field_assistant",
  "document_reader",
  "risk_detector",
  "report_generator",
] as const;

/** Motores que toman decisiones/escriben → requieren contexto confirmado. */
export const SENSITIVE_ENGINES = [
  "auto_proposal",
  "auto_messaging",
  "external_writer",
] as const;

/** Categorías/keys que identifican un módulo de costeo/cotización. */
const PRICING_MODULE_PATTERN = /(quot|cost|pricing|price|quotation|costing|cotiz|costeo)/i;

function isPricingModule(m: BusinessModule): boolean {
  return m.category === "pricing" || PRICING_MODULE_PATTERN.test(m.key);
}

// ── Utilidades puras de lectura defensiva ─────────────────────────────────────
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function step(input: DiscoverySetupInput, key: keyof DiscoverySetupInput): Record<string, unknown> {
  const v = input[key];
  return isRecord(v) ? v : {};
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function asStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    } else if (isRecord(item)) {
      const label =
        asString(item.nombre) ??
        asString(item.label) ??
        asString(item.name) ??
        asString(item.key) ??
        asString(item.titulo);
      if (label) out.push(label);
    }
  }
  return out.length > 0 ? out : null;
}

function isTruthyFlag(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    return t === "true" || t === "1" || t === "yes";
  }
  return false;
}

const VALID_STATES: readonly DiscoveryDataState[] = [
  "confirmed",
  "pending",
  "estimated",
  "not_applicable",
  "requires_human_decision",
];

function normalizeState(value: unknown, fallback: DiscoveryDataState): DiscoveryDataState {
  return typeof value === "string" && (VALID_STATES as readonly string[]).includes(value)
    ? (value as DiscoveryDataState)
    : fallback;
}

// ── Construcción del contexto ─────────────────────────────────────────────────
export function buildDiscoveryContextFromSetup(
  input: DiscoverySetupInput = {}
): DiscoveryContext {
  const empresa = step(input, "empresa");
  const cuestionario = step(input, "cuestionario");
  const diagnostico = step(input, "diagnostico");
  const proceso = step(input, "proceso_pipeline");
  const motores = step(input, "motores_ia");
  const reportes = step(input, "reportes");
  const meta = step(input, "meta");

  // ── Identidad ──────────────────────────────────────────────────────────────
  const clientNameValue = asString(empresa.nombreComercial) ?? asString(empresa.nombreLegal);
  const client_name: DiscoveryField<string> = {
    key: "client_name",
    label: "Nombre del cliente",
    value: clientNameValue,
    state: clientNameValue ? "confirmed" : "pending",
    source: clientNameValue ? "empresa" : "none",
    critical: true,
    note: clientNameValue ? undefined : "Falta el nombre comercial/legal del cliente.",
  };

  const businessTypeValue =
    asString(empresa.rubro) === "Otro"
      ? asString(empresa.rubroPersonalizado) ?? asString(empresa.rubro)
      : asString(empresa.rubro) ?? asString(empresa.rubroPersonalizado);
  const business_type: DiscoveryField<string> = {
    key: "business_type",
    label: "Rubro / tipo de negocio",
    value: businessTypeValue,
    state: businessTypeValue ? "confirmed" : "pending",
    source: businessTypeValue ? "empresa" : "none",
    critical: false,
  };

  const verticalValue =
    asString(input.verticalKey) ?? asString(empresa.vertical) ?? businessTypeValue ?? asString(empresa.giro);
  const verticalFromCaller = Boolean(asString(input.verticalKey));
  const verticalExplicit = verticalFromCaller || Boolean(asString(empresa.vertical));
  const vertical_key: DiscoveryField<string> = {
    key: "vertical_key",
    label: "Vertical",
    value: verticalValue,
    state: verticalValue ? (verticalExplicit ? "confirmed" : "estimated") : "pending",
    source: verticalFromCaller ? "caller" : verticalValue ? "empresa" : "none",
    critical: false,
    note: verticalValue && !verticalExplicit
      ? "Derivado del rubro/giro; confirmar la vertical explícita."
      : undefined,
  };

  const clientKeyValue = asString(input.clientKey);
  const client_key: DiscoveryField<string> = {
    key: "client_key",
    label: "Client key",
    value: clientKeyValue,
    state: clientKeyValue ? "confirmed" : "pending",
    source: clientKeyValue ? "caller" : "none",
    critical: false,
    note: clientKeyValue ? undefined : "Se define al crear el proyecto del cliente.",
  };

  const projectKeyValue = asString(input.projectKey);
  const project_key: DiscoveryField<string> = {
    key: "project_key",
    label: "Project key",
    value: projectKeyValue,
    state: projectKeyValue ? "confirmed" : "pending",
    source: projectKeyValue ? "caller" : "none",
    critical: false,
    note: projectKeyValue ? undefined : "Se define al crear el proyecto del cliente.",
  };

  // ── Localización y economía (NO universalmente críticos) ─────────────────────
  const countryValue = asString(empresa.pais);
  const geoConflict = isTruthyFlag(empresa.geoConflict);
  const country: DiscoveryField<string> = {
    key: "country",
    label: "País",
    value: countryValue,
    state: !countryValue ? "pending" : geoConflict ? "requires_human_decision" : "confirmed",
    source: countryValue ? "empresa" : "none",
    critical: false,
    note: geoConflict
      ? "Posible inversión país/ciudad; requiere revisión humana."
      : countryValue
        ? undefined
        : "País no capturado (no se asume por defecto).",
  };

  const currencyValue = asString(empresa.moneda) ?? asString(cuestionario.moneda);
  const currency: DiscoveryField<string> = {
    key: "currency",
    label: "Moneda",
    value: currencyValue,
    state: currencyValue ? "confirmed" : "pending",
    source: currencyValue ? "empresa" : "none",
    critical: false,
    note: currencyValue ? undefined : "Moneda no capturada (solo relevante si hay módulo de costeo/cotización).",
  };

  const timezoneValue = asString(empresa.timezone) ?? asString(empresa.zonaHoraria);
  const timezone: DiscoveryField<string> = {
    key: "timezone",
    label: "Zona horaria",
    value: timezoneValue,
    state: timezoneValue ? "confirmed" : "pending",
    source: timezoneValue ? "empresa" : "none",
    critical: false,
  };

  const languageValue = asString(empresa.idioma) ?? asString(empresa.language);
  const language: DiscoveryField<string> = {
    key: "language",
    label: "Idioma",
    value: languageValue,
    state: languageValue ? "confirmed" : "pending",
    source: languageValue ? "empresa" : "none",
    critical: false,
  };

  const citiesList = asStringList(empresa.ciudades);
  const singleCity = asString(empresa.ciudad);
  const citiesValue = citiesList ?? (singleCity ? [singleCity] : null);
  const cities: DiscoveryField<string[]> = {
    key: "cities",
    label: "Ciudades",
    value: citiesValue,
    state: citiesList ? "confirmed" : singleCity ? "estimated" : "pending",
    source: citiesValue ? "empresa" : "none",
    critical: false,
    note: !citiesList && singleCity
      ? "Derivado de una sola ciudad; confirmar el listado completo."
      : undefined,
  };

  const serviceAreasValue =
    asStringList(empresa.zonas) ?? asStringList(empresa.service_areas) ?? asStringList(cuestionario.zonas);
  const service_areas: DiscoveryField<string[]> = {
    key: "service_areas",
    label: "Zonas de servicio",
    value: serviceAreasValue,
    state: serviceAreasValue ? "confirmed" : "pending",
    source: serviceAreasValue ? "empresa" : "none",
    critical: false,
  };

  // ── Oferta y demanda ────────────────────────────────────────────────────────
  const servicesList =
    asStringList(empresa.servicios) ??
    asStringList(cuestionario.servicios) ??
    asStringList(empresa.productos) ??
    asStringList(cuestionario.productos);
  const servicesFreeText = asString(empresa.queVende) ?? asString(cuestionario.queVendeDetalle);
  const productsValue = servicesList ?? (servicesFreeText ? [servicesFreeText] : null);
  const products_or_services: DiscoveryField<string[]> = {
    key: "products_or_services",
    label: "Productos o servicios",
    value: productsValue,
    state: servicesList ? "confirmed" : servicesFreeText ? "estimated" : "pending",
    source: servicesList
      ? (asStringList(empresa.servicios) || asStringList(empresa.productos) ? "empresa" : "cuestionario")
      : servicesFreeText
        ? (asString(empresa.queVende) ? "empresa" : "cuestionario")
        : "none",
    critical: true,
    note: !servicesList && servicesFreeText
      ? "Derivado de texto libre; confirmar como lista estructurada."
      : !productsValue
        ? "Falta definir productos o servicios."
        : undefined,
  };

  const segmentsValue =
    asStringList(cuestionario.tiposClienteObj) ??
    asStringList(empresa.tiposCliente) ??
    asStringList(cuestionario.segmentosCustom);
  const customer_segments: DiscoveryField<string[]> = {
    key: "customer_segments",
    label: "Segmentos de cliente",
    value: segmentsValue,
    state: segmentsValue ? "confirmed" : "pending",
    source: segmentsValue ? (asStringList(cuestionario.tiposClienteObj) ? "cuestionario" : "empresa") : "none",
    critical: false,
  };

  // ── Proceso ─────────────────────────────────────────────────────────────────
  const salesProcessValue = asString(cuestionario.procesoActual);
  const sales_process: DiscoveryField<string> = {
    key: "sales_process",
    label: "Proceso comercial",
    value: salesProcessValue,
    state: salesProcessValue ? "confirmed" : "pending",
    source: salesProcessValue ? "cuestionario" : "none",
    critical: true,
    note: salesProcessValue ? undefined : "Falta describir el proceso comercial actual.",
  };

  const opProcessValue = asString(cuestionario.queBloquea) ?? asString(diagnostico.comoVende);
  const operational_process: DiscoveryField<string> = {
    key: "operational_process",
    label: "Proceso operativo",
    value: opProcessValue,
    state: opProcessValue ? "estimated" : "pending",
    source: opProcessValue ? "cuestionario" : "none",
    critical: false,
    note: opProcessValue ? "Derivado parcialmente; confirmar el proceso operativo." : undefined,
  };

  const leadFieldsValue = asStringList(cuestionario.infoPrePropuesta);
  const lead_fields: DiscoveryField<string[]> = {
    key: "lead_fields",
    label: "Campos de lead",
    value: leadFieldsValue,
    state: leadFieldsValue ? "estimated" : "pending",
    source: leadFieldsValue ? "cuestionario" : "none",
    critical: false,
    note: leadFieldsValue ? "Derivados de la info pre-propuesta; confirmar campos finales." : undefined,
  };

  const account_fields: DiscoveryField<string[]> = {
    key: "account_fields",
    label: "Campos de cuenta",
    value: null,
    state: "pending",
    source: "none",
    critical: false,
    note: "No capturado en el Discovery actual.",
  };

  const contact_fields: DiscoveryField<string[]> = {
    key: "contact_fields",
    label: "Campos de contacto",
    value: null,
    state: "pending",
    source: "none",
    critical: false,
    note: "No capturado en el Discovery actual.",
  };

  const stagesValue =
    asStringList(proceso.etapas) ?? asStringList(proceso.columnas) ?? asStringList(proceso.stages);
  const pipeline_stages: DiscoveryField<string[]> = {
    key: "pipeline_stages",
    label: "Etapas del pipeline",
    value: stagesValue,
    state: stagesValue ? "confirmed" : "pending",
    source: stagesValue ? "proceso_pipeline" : "none",
    critical: true,
    note: stagesValue ? undefined : "Falta definir las etapas del proceso/pipeline.",
  };

  const modulesValue = asStringList(motores.motores) ?? asStringList(reportes.reportes);
  const modules_enabled: DiscoveryField<string[]> = {
    key: "modules_enabled",
    label: "Módulos habilitados",
    value: modulesValue,
    state: modulesValue ? "estimated" : "pending",
    source: modulesValue ? (asStringList(motores.motores) ? "motores_ia" : "reportes") : "none",
    critical: false,
    note: modulesValue ? "Derivado de motores/reportes definidos; confirmar módulos." : undefined,
  };

  // ── Campos verticales específicos (declarados por el caller) ─────────────────
  const vertical_fields: DiscoveryField[] = [];
  for (const vf of input.verticalFields ?? []) {
    const key = asString(vf.key);
    if (!key) continue;
    const hasValue = vf.value !== undefined && vf.value !== null && vf.value !== "";
    const state = normalizeState(vf.state, hasValue ? "estimated" : "pending");
    vertical_fields.push({
      key,
      label: asString(vf.label) ?? key,
      value: vf.value ?? null,
      state,
      source: (vf.source as DiscoveryFieldSource) ?? "vertical",
      critical: Boolean(vf.critical),
      module_key: asString(vf.module_key) ?? undefined,
      note: asString(vf.note) ?? undefined,
    });
  }

  // ── Cualitativo: riesgos ──────────────────────────────────────────────────────
  const risks: string[] = [];
  const riesgosText = asString(diagnostico.riesgos);
  if (riesgosText) risks.push(riesgosText);
  for (const matrizKey of ["matrizProceso", "matrizDatos", "matrizEquipo", "matrizAutomatizacion"]) {
    const block = diagnostico[matrizKey];
    if (isRecord(block) && asString(block.estado) === "riesgo") {
      const nota = asString(block.nota);
      risks.push(nota ? `${matrizKey}: ${nota}` : `${matrizKey}: marcado como riesgo`);
    }
  }

  // ── Campos canónicos + verticales para particionar y evaluar módulos ─────────
  const canonicalFields: DiscoveryField[] = [
    client_key,
    vertical_key,
    project_key,
    client_name,
    business_type,
    country,
    currency,
    timezone,
    language,
    cities,
    service_areas,
    products_or_services,
    customer_segments,
    sales_process,
    operational_process,
    lead_fields,
    account_fields,
    contact_fields,
    pipeline_stages,
    modules_enabled,
  ];
  const allFields: DiscoveryField[] = [...canonicalFields, ...vertical_fields];

  const stateByKey = new Map<string, DiscoveryDataState>();
  for (const f of allFields) stateByKey.set(f.key, f.state);

  const confirmed_fields: string[] = [];
  const pending_fields: string[] = [];
  const estimated_fields: string[] = [];
  const not_applicable_fields: string[] = [];
  const human_decision_fields: string[] = [];
  const assumptions: string[] = [];
  const sources: DiscoverySourceRef[] = [];

  for (const f of allFields) {
    switch (f.state) {
      case "confirmed":
        confirmed_fields.push(f.key);
        break;
      case "pending":
        pending_fields.push(f.key);
        break;
      case "estimated":
        estimated_fields.push(f.key);
        if (f.note) assumptions.push(`${f.key}: ${f.note}`);
        break;
      case "not_applicable":
        not_applicable_fields.push(f.key);
        break;
      case "requires_human_decision":
        human_decision_fields.push(f.key);
        break;
    }
    if (f.source !== "none") sources.push({ step: f.source, field: f.key });
  }

  const puntosCiegos = asString(diagnostico.puntosCiegos);
  if (puntosCiegos) assumptions.push(`diagnostico.puntosCiegos: ${puntosCiegos}`);

  // ── Evaluación de módulos de negocio del vertical ────────────────────────────
  const business_modules: BusinessModule[] = [];
  for (const bm of input.businessModules ?? []) {
    const key = asString(bm.key);
    if (!key) continue;
    const required_fields = (bm.required_fields ?? []).filter((k) => typeof k === "string" && k.trim());
    const optional_fields = (bm.optional_fields ?? []).filter((k) => typeof k === "string" && k.trim());
    const required = Boolean(bm.required);

    const blocker_keys: string[] = [];
    let needsHuman = false;
    for (const fk of required_fields) {
      const st = stateByKey.get(fk) ?? "pending";
      if (st !== "confirmed" && st !== "not_applicable") blocker_keys.push(fk);
      if (st === "requires_human_decision") needsHuman = true;
    }

    business_modules.push({
      key,
      label: asString(bm.label) ?? key,
      category: bm.category ?? "other",
      required,
      enabled: blocker_keys.length === 0,
      blocker_keys,
      required_fields,
      optional_fields,
      human_review_required: needsHuman,
    });
  }

  // ── missing_critical_fields ──────────────────────────────────────────────────
  // Crítico y no resuelto = pending o requires_human_decision.
  const missing_critical_fields = allFields
    .filter((f) => f.critical && (f.state === "pending" || f.state === "requires_human_decision"))
    .map((f) => f.key);

  // ── engine_blockers (genéricos, agnósticos de vertical) ──────────────────────
  const engine_blockers: string[] = [];
  if (client_name.state !== "confirmed") engine_blockers.push("missing_client_identity");
  if (products_or_services.state === "pending") engine_blockers.push("missing_products_or_services");
  if (pipeline_stages.state !== "confirmed") engine_blockers.push("missing_pipeline_stages");
  if (sales_process.state === "pending") engine_blockers.push("missing_sales_process");
  if (country.state === "requires_human_decision") engine_blockers.push("country_requires_human_decision");

  // ── vertical_blockers (campos que el vertical declara críticos) ──────────────
  const vertical_blockers: string[] = [];
  for (const fk of input.verticalRequiredFields ?? []) {
    const st = stateByKey.get(fk) ?? "pending";
    if (st !== "confirmed" && st !== "not_applicable") vertical_blockers.push(fk);
  }

  // ── business_module_blockers (módulos REQUERIDOS no habilitados) ─────────────
  const business_module_blockers: string[] = [];
  for (const m of business_modules) {
    if (m.required && !m.enabled) {
      for (const bk of m.blocker_keys) business_module_blockers.push(`${m.key}:${bk}`);
    }
  }

  // ── quoting_blockers (SOLO si el vertical declara módulo pricing/costing) ─────
  const pricingModules = business_modules.filter(isPricingModule);
  let quoting_blockers: string[] | undefined;
  if (pricingModules.length > 0) {
    quoting_blockers = [];
    for (const m of pricingModules) {
      for (const bk of m.blocker_keys) quoting_blockers.push(`${m.key}:${bk}`);
    }
  }

  // ── Motores permitidos / bloqueados ──────────────────────────────────────────
  const hasAnyData = confirmed_fields.length > 0 || estimated_fields.length > 0;
  const allowed_engines: string[] = [];
  const blocked_engines: string[] = [];
  for (const eng of READ_ONLY_ENGINES) {
    if (hasAnyData) allowed_engines.push(eng);
    else blocked_engines.push(eng);
  }
  const sensitiveBlocked = engine_blockers.length > 0;
  for (const eng of SENSITIVE_ENGINES) {
    let blocked = sensitiveBlocked;
    if (eng === "external_writer") blocked = true; // siempre bloqueado en este helper
    if (blocked) blocked_engines.push(eng);
    else allowed_engines.push(eng);
  }

  // ── completion_percent ───────────────────────────────────────────────────────
  const weight = (s: DiscoveryDataState): number =>
    s === "confirmed" || s === "not_applicable" ? 1 : s === "estimated" ? 0.5 : 0;
  const rawPercent =
    allFields.length === 0
      ? 0
      : (allFields.reduce((sum, f) => sum + weight(f.state), 0) / allFields.length) * 100;
  const completion_percent = Math.round(Math.min(100, Math.max(0, rawPercent)));

  // ── human_review_required ────────────────────────────────────────────────────
  const human_review_required =
    human_decision_fields.length > 0 ||
    missing_critical_fields.length > 0 ||
    vertical_blockers.length > 0 ||
    business_module_blockers.length > 0 ||
    business_modules.some((m) => m.human_review_required);

  // ── status ───────────────────────────────────────────────────────────────────
  const submitted = Boolean(asString(input.submittedAt));
  const hardBlocked =
    engine_blockers.length > 0 ||
    vertical_blockers.length > 0 ||
    business_module_blockers.length > 0;
  let status: DiscoveryStatus;
  if (missing_critical_fields.length > 0) {
    status = submitted ? "needs_rework" : "draft";
  } else if (hardBlocked) {
    status = "in_review";
  } else {
    status = submitted ? "confirmed" : "in_review";
  }

  const created_from = asString(meta.source) ?? "crm_setup_config";

  const context: DiscoveryContext = {
    schema_version: DISCOVERY_CONTEXT_SCHEMA_VERSION,
    client_key,
    vertical_key,
    project_key,
    client_name,
    business_type,
    country,
    currency,
    timezone,
    language,
    cities,
    service_areas,
    products_or_services,
    customer_segments,
    sales_process,
    operational_process,
    lead_fields,
    account_fields,
    contact_fields,
    pipeline_stages,
    modules_enabled,
    vertical_fields,
    business_modules,
    allowed_engines,
    blocked_engines,
    confirmed_fields,
    pending_fields,
    estimated_fields,
    not_applicable_fields,
    human_decision_fields,
    missing_critical_fields,
    engine_blockers,
    vertical_blockers,
    business_module_blockers,
    assumptions,
    risks,
    sources,
    status,
    completion_percent,
    human_review_required,
    created_from,
    generated_at: asString(input.generatedAt) ?? null,
  };

  if (quoting_blockers !== undefined) {
    context.quoting_blockers = quoting_blockers;
  }

  return context;
}

// ── Snapshot confirmado del Discovery (CONSTRUCTOR-DISCOVERY-8b) ──────────────
//
// El "snapshot" es lo que persiste el botón "Terminé" en
// crm_setup_config.meta.discovery_submission. Incluye el DiscoveryContext
// completo (para revisión interna) + un resumen legible + los blockers.
// Se mantiene en este módulo autocontenido para que el selftest pueda ejecutarse
// con `node --experimental-strip-types` sin cadenas de import con extensión.

export const DISCOVERY_SUBMISSION_SCHEMA_VERSION = "1.0.0";

export type DiscoverySubmission = {
  schema_version: string;
  source: "constructor_discovery";
  submitted_at: string | null;
  status: DiscoveryStatus;
  completion_percent: number;
  human_review_required: boolean;
  missing_critical_fields: string[];
  engine_blockers: string[];
  vertical_blockers: string[];
  business_module_blockers: string[];
  /** Solo presente si el vertical declara un módulo pricing/costing/quotation. */
  quoting_blockers?: string[];
  summary: string;
  discovery_context: DiscoveryContext;
};

export type BuildDiscoverySubmissionOptions = {
  /** Timestamp de cierre provisto por el caller (mantiene el helper puro). */
  submittedAt?: string | null;
  /** Timestamp de generación provisto por el caller. */
  generatedAt?: string | null;
};

function joinOrNone(list: string[]): string {
  return list.length > 0 ? list.join(", ") : "ninguno";
}

/** Resumen legible para revisión interna. Determinístico (sin Date/random). */
export function buildDiscoverySubmissionSummary(ctx: DiscoveryContext): string {
  const lines: string[] = [];
  lines.push(
    `Discovery ${ctx.status} · completitud ${ctx.completion_percent}% · revisión humana: ${
      ctx.human_review_required ? "sí" : "no"
    }.`
  );
  lines.push(`Faltantes críticos: ${joinOrNone(ctx.missing_critical_fields)}.`);
  lines.push(`Engine blockers: ${joinOrNone(ctx.engine_blockers)}.`);
  lines.push(`Vertical blockers: ${joinOrNone(ctx.vertical_blockers)}.`);
  lines.push(`Módulos bloqueados: ${joinOrNone(ctx.business_module_blockers)}.`);
  if (ctx.quoting_blockers !== undefined) {
    lines.push(`Costeo/cotización (módulo del vertical): ${joinOrNone(ctx.quoting_blockers)}.`);
  }
  const enabledModules = ctx.business_modules.filter((m) => m.enabled).map((m) => m.key);
  if (ctx.business_modules.length > 0) {
    lines.push(`Módulos habilitados: ${joinOrNone(enabledModules)}.`);
  }
  lines.push("Snapshot interno: NO activa motores, NO genera paquete y NO crea el CRM operativo.");
  return lines.join("\n");
}

/**
 * Construye el snapshot confirmado del Discovery a partir del setup.
 * Puro y determinístico: el caller provee los timestamps.
 * NO escribe nada: solo arma el objeto que luego se persiste vía PATCH meta.
 */
export function buildDiscoverySubmission(
  input: DiscoverySetupInput = {},
  options: BuildDiscoverySubmissionOptions = {}
): DiscoverySubmission {
  const submittedAt = asString(options.submittedAt) ?? null;
  const ctx = buildDiscoveryContextFromSetup({
    ...input,
    submittedAt,
    generatedAt: options.generatedAt ?? input.generatedAt ?? null,
  });

  const submission: DiscoverySubmission = {
    schema_version: DISCOVERY_SUBMISSION_SCHEMA_VERSION,
    source: "constructor_discovery",
    submitted_at: submittedAt,
    status: ctx.status,
    completion_percent: ctx.completion_percent,
    human_review_required: ctx.human_review_required,
    missing_critical_fields: ctx.missing_critical_fields,
    engine_blockers: ctx.engine_blockers,
    vertical_blockers: ctx.vertical_blockers,
    business_module_blockers: ctx.business_module_blockers,
    summary: buildDiscoverySubmissionSummary(ctx),
    discovery_context: ctx,
  };

  if (ctx.quoting_blockers !== undefined) {
    submission.quoting_blockers = ctx.quoting_blockers;
  }

  return submission;
}
