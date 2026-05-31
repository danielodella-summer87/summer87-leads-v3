/**
 * Selftest del helper DiscoveryContext (CONSTRUCTOR-DISCOVERY-8a).
 *
 * Ejecutar:
 *   node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts
 *
 * Script independiente (excluido del type-check del app vía tsconfig) que valida
 * el helper con fixtures CONCEPTUALES. Las fixtures NO son configuración real:
 * son ejemplos de entrada para verificar la derivación de estados, módulos por
 * vertical y blockers, SIN hardcode de cliente y SIN asumir costeo como universal.
 */

import {
  buildDiscoveryContextFromSetup,
  type DiscoverySetupInput,
} from "./discoveryContext.ts";

let total = 0;
let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  total += 1;
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(detail ? `${name} — ${detail}` : name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ── A. Casa Limpia conceptual — usa módulos costing/quotation ─────────────────
function caseCasaLimpiaConceptual(): void {
  console.log("\n[A] Casa Limpia conceptual (site_survey, service_recommendation, costing, quotation)");
  const input: DiscoverySetupInput = {
    empresa: {
      nombreComercial: "Cliente de limpieza (conceptual)",
      rubro: "Servicios de limpieza",
      pais: "Ecuador",
      ciudad: "Quito",
      servicios: ["Limpieza de oficinas", "Limpieza industrial"],
      // moneda y costos NO capturados → pending
    },
    cuestionario: {
      procesoActual: "Relevamiento, propuesta, visita y cierre.",
      tiposClienteObj: ["Empresas medianas", "Empresas grandes"],
    },
    proceso_pipeline: { etapas: ["Nuevo", "Relevamiento", "Propuesta", "Ganado"] },
    verticalRequiredFields: ["country", "service_areas"],
    businessModules: [
      { key: "site_survey", category: "operational", required: true, required_fields: ["service_areas"] },
      { key: "service_recommendation", category: "product", required: true, required_fields: ["products_or_services", "customer_segments"] },
      { key: "costing", category: "pricing", required: true, required_fields: ["currency", "cost_inputs"] },
      { key: "quotation", category: "pricing", required: true, required_fields: ["currency", "products_or_services"] },
    ],
    generatedAt: "2026-05-31T00:00:00.000Z",
  };
  const ctx = buildDiscoveryContextFromSetup(input);

  check("país confirmado", ctx.country.state === "confirmed", ctx.country.state);
  check("servicios confirmados", ctx.products_or_services.state === "confirmed");
  check("quoting_blockers PRESENTE (vertical declara pricing)", Array.isArray(ctx.quoting_blockers));
  check("quoting_blockers incluye costing:currency", (ctx.quoting_blockers ?? []).includes("costing:currency"));
  check("quoting_blockers incluye costing:cost_inputs", (ctx.quoting_blockers ?? []).includes("costing:cost_inputs"));
  check("business_module_blockers incluye site_survey:service_areas", ctx.business_module_blockers.includes("site_survey:service_areas"));
  check("service_recommendation habilitado", ctx.business_modules.find((m) => m.key === "service_recommendation")?.enabled === true);
  check("vertical_blockers incluye service_areas", ctx.vertical_blockers.includes("service_areas"));
  check("human_review_required", ctx.human_review_required === true);
  check("determinístico: generated_at", ctx.generated_at === "2026-05-31T00:00:00.000Z");
}

// ── B. Pickup 4x4 conceptual — SIN módulo pricing → sin quoting_blockers ───────
function casePickupConceptual(): void {
  console.log("\n[B] Pickup 4x4 conceptual (vehicle_fitment, product_recommendation, purchase_history, opportunity_detection)");
  const input: DiscoverySetupInput = {
    empresa: {
      nombreComercial: "Concesionario de vehículos (conceptual)",
      rubro: "Venta de vehículos y repuestos",
      pais: "Uruguay",
      productos: ["Pickups", "Repuestos", "Accesorios 4x4"],
    },
    cuestionario: {
      procesoActual: "Contacto, calificación, recomendación, cierre, postventa.",
      tiposClienteObj: ["Personas individuales", "Empresas pequeñas"],
    },
    proceso_pipeline: { etapas: [{ nombre: "Nuevo" }, { nombre: "Contactado" }, { nombre: "Cerrado" }] },
    verticalFields: [
      { key: "vehicle_compatibility", state: "confirmed", source: "vertical" },
      { key: "purchase_history_data", state: "pending" },
      { key: "kore_integration", state: "estimated", note: "Integración KORE futura, no confirmada" },
    ],
    businessModules: [
      { key: "vehicle_fitment", category: "product", required: true, required_fields: ["products_or_services", "vehicle_compatibility"] },
      { key: "product_recommendation", category: "product", required: true, required_fields: ["products_or_services"] },
      { key: "purchase_history", category: "analytics", required: true, required_fields: ["purchase_history_data"] },
      { key: "opportunity_detection", category: "analytics", required: false, required_fields: ["pipeline_stages"] },
    ],
    generatedAt: "2026-05-31T00:00:00.000Z",
  };
  const ctx = buildDiscoveryContextFromSetup(input);

  check("productos confirmados", ctx.products_or_services.state === "confirmed");
  check("etapas extraídas de objetos {nombre}", (ctx.pipeline_stages.value ?? []).length === 3);
  check("quoting_blockers AUSENTE (no hay módulo pricing)", ctx.quoting_blockers === undefined);
  check("vehicle_fitment habilitado (compatibilidad confirmada)", ctx.business_modules.find((m) => m.key === "vehicle_fitment")?.enabled === true);
  check("product_recommendation habilitado", ctx.business_modules.find((m) => m.key === "product_recommendation")?.enabled === true);
  check("business_module_blockers incluye purchase_history:purchase_history_data", ctx.business_module_blockers.includes("purchase_history:purchase_history_data"));
  check("KORE marcado estimated (no confirmado)", ctx.estimated_fields.includes("kore_integration"));
  check("sin hardcode 'pickup4x4' en el contexto", !JSON.stringify(ctx).toLowerCase().includes("pickup4x4"));
  check("sin missing_critical", ctx.missing_critical_fields.length === 0, ctx.missing_critical_fields.join(","));
}

// ── C. Agencia de marketing conceptual — sin quoting salvo módulo explícito ────
function caseAgencyConceptual(): void {
  console.log("\n[C] Agencia de marketing conceptual (commercial_diagnosis, channel_strategy, campaign_planning, proposal_scope)");
  const input: DiscoverySetupInput = {
    empresa: {
      nombreComercial: "Agencia (conceptual)",
      rubro: "Agencia de marketing",
      servicios: ["Gestión de redes", "Campañas paid", "Branding"],
    },
    cuestionario: {
      procesoActual: "Diagnóstico, propuesta de alcance, ejecución, seguimiento.",
      tiposClienteObj: ["Pymes", "Empresas medianas"],
    },
    proceso_pipeline: { etapas: ["Lead", "Diagnóstico", "Propuesta", "Cliente"] },
    verticalFields: [
      { key: "budget_estimation", state: "pending" },
      { key: "operational_team", state: "pending" },
    ],
    businessModules: [
      { key: "commercial_diagnosis", category: "commercial", required: true, required_fields: ["sales_process"] },
      { key: "channel_strategy", category: "commercial", required: true, required_fields: ["products_or_services", "customer_segments"] },
      { key: "campaign_planning", category: "operational", required: true, required_fields: ["operational_team"] },
      { key: "proposal_scope", category: "commercial", required: true, required_fields: ["budget_estimation"] },
    ],
    generatedAt: "2026-05-31T00:00:00.000Z",
  };
  const ctx = buildDiscoveryContextFromSetup(input);

  check("quoting_blockers AUSENTE (sin módulo pricing/costing)", ctx.quoting_blockers === undefined);
  check("commercial_diagnosis habilitado", ctx.business_modules.find((m) => m.key === "commercial_diagnosis")?.enabled === true);
  check("channel_strategy habilitado", ctx.business_modules.find((m) => m.key === "channel_strategy")?.enabled === true);
  check("blocker por campaign_planning:operational_team", ctx.business_module_blockers.includes("campaign_planning:operational_team"));
  check("blocker por proposal_scope:budget_estimation", ctx.business_module_blockers.includes("proposal_scope:budget_estimation"));
  check("human_review_required (módulos requeridos bloqueados)", ctx.human_review_required === true);
  check("sin missing_critical (identidad/servicios/proceso/pipeline OK)", ctx.missing_critical_fields.length === 0, ctx.missing_critical_fields.join(","));
}

// ── D. Cliente genérico (faltan país/servicios/módulos) ───────────────────────
function caseGenericMinimal(): void {
  console.log("\n[D] Cliente genérico (solo nombre y rubro; faltan servicios/pipeline; vertical declara país)");
  const input: DiscoverySetupInput = {
    empresa: { nombreComercial: "Empresa X", rubro: "Software/tecnología" },
    verticalRequiredFields: ["country", "products_or_services"],
    businessModules: [
      { key: "onboarding", category: "operational", required: true, required_fields: ["products_or_services", "pipeline_stages"] },
    ],
    generatedAt: "2026-05-31T00:00:00.000Z",
  };
  const ctx = buildDiscoveryContextFromSetup(input);

  check("identidad confirmada", ctx.client_name.state === "confirmed");
  check("missing_critical incluye products_or_services", ctx.missing_critical_fields.includes("products_or_services"));
  check("missing_critical incluye pipeline_stages", ctx.missing_critical_fields.includes("pipeline_stages"));
  check("missing_critical incluye sales_process", ctx.missing_critical_fields.includes("sales_process"));
  check("vertical_blockers incluye country", ctx.vertical_blockers.includes("country"));
  check("vertical_blockers incluye products_or_services", ctx.vertical_blockers.includes("products_or_services"));
  check("business_module_blockers presentes (onboarding)", ctx.business_module_blockers.some((b) => b.startsWith("onboarding:")));
  check("engine_blockers presentes", ctx.engine_blockers.length > 0, ctx.engine_blockers.join(","));
  check("quoting_blockers AUSENTE (no se declaró módulo pricing)", ctx.quoting_blockers === undefined);
  check("status draft", ctx.status === "draft", ctx.status);
  check("human_review_required", ctx.human_review_required === true);
}

// ── E. Completo mínimo (módulos críticos satisfechos + submitted) ─────────────
function caseCompleteMinimal(): void {
  console.log("\n[E] Completo mínimo (identidad/servicios/pipeline/módulos críticos confirmados + submitted)");
  const input: DiscoverySetupInput = {
    empresa: {
      nombreComercial: "Cliente Completo SA",
      rubro: "Servicios",
      pais: "Argentina",
      servicios: ["Servicio A", "Servicio B"],
    },
    cuestionario: {
      procesoActual: "Proceso comercial definido en 4 etapas.",
      tiposClienteObj: ["Empresas medianas"],
    },
    proceso_pipeline: { etapas: ["Nuevo", "Calificado", "Propuesta", "Ganado"] },
    verticalRequiredFields: ["country", "products_or_services"],
    businessModules: [
      { key: "lead_qualification", category: "commercial", required: true, required_fields: ["products_or_services", "pipeline_stages", "customer_segments"] },
    ],
    clientKey: "cliente-completo",
    projectKey: "cliente-completo-2026",
    submittedAt: "2026-05-31T12:00:00.000Z",
    generatedAt: "2026-05-31T12:00:00.000Z",
  };
  const ctx = buildDiscoveryContextFromSetup(input);

  check("sin missing_critical", ctx.missing_critical_fields.length === 0, ctx.missing_critical_fields.join(","));
  check("sin engine_blockers", ctx.engine_blockers.length === 0, ctx.engine_blockers.join(","));
  check("sin vertical_blockers", ctx.vertical_blockers.length === 0, ctx.vertical_blockers.join(","));
  check("sin business_module_blockers", ctx.business_module_blockers.length === 0, ctx.business_module_blockers.join(","));
  check("lead_qualification habilitado", ctx.business_modules.find((m) => m.key === "lead_qualification")?.enabled === true);
  check("quoting_blockers AUSENTE (sin módulo pricing)", ctx.quoting_blockers === undefined);
  check("status confirmed (submitted + sin blockers)", ctx.status === "confirmed", ctx.status);
  check("human_review_required false", ctx.human_review_required === false);
  check("completion_percent razonable (campos críticos OK; opcionales pendientes)", ctx.completion_percent >= 40, String(ctx.completion_percent));
}

// ── F. Robustez: input vacío ───────────────────────────────────────────────────
function caseEmpty(): void {
  console.log("\n[F] Input vacío (robustez)");
  const ctx = buildDiscoveryContextFromSetup();
  check("no lanza y devuelve contexto", typeof ctx.schema_version === "string");
  check("todo crítico marcado missing", ctx.missing_critical_fields.length >= 3, ctx.missing_critical_fields.join(","));
  check("status draft", ctx.status === "draft", ctx.status);
  check("quoting_blockers AUSENTE", ctx.quoting_blockers === undefined);
  check("generated_at null sin input", ctx.generated_at === null);
  check("determinístico: dos llamadas idénticas", JSON.stringify(ctx) === JSON.stringify(buildDiscoveryContextFromSetup()));
}

function main(): void {
  console.log("=== DiscoveryContext selftest (CONSTRUCTOR-DISCOVERY-8a) ===");
  caseCasaLimpiaConceptual();
  casePickupConceptual();
  caseAgencyConceptual();
  caseGenericMinimal();
  caseCompleteMinimal();
  caseEmpty();

  console.log("\n=== SUMMARY ===");
  console.log(`total:  ${total}`);
  console.log(`passed: ${passed}`);
  console.log(`failed: ${total - passed}`);
  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log("\nALL TESTS PASSED ✓");
  }
}

main();
