/**
 * Selftest del catálogo de verticales (CONSTRUCTOR-VERTICALS-1).
 *
 * Ejecutar:
 *   node --experimental-strip-types lib/constructor/verticals/verticalCatalog.selftest.ts
 *
 * Valida que el catálogo resuelve vertical_key → módulos y que la corrección
 * conceptual se respeta: quoting_blockers SOLO aparece cuando el vertical incluye
 * un módulo pricing/costing/quotation (por defecto, solo cleaning_services), o
 * cuando el caller agrega uno explícitamente.
 *
 * Importa por separado el catálogo y buildDiscoveryContextFromSetup (ambos
 * self-contained en runtime) con extensión .ts.
 */

import {
  getVerticalDefinition,
  getBusinessModulesForVertical,
  getVerticalRequiredFields,
  buildDiscoveryContextInputForVertical,
  detectVerticalKey,
  VERTICAL_KEYS,
} from "./verticalCatalog.ts";
import {
  buildDiscoveryContextFromSetup,
  buildDiscoverySubmission,
} from "../discovery/discoveryContext.ts";

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

/** Setup base "razonable" para que solo los blockers del vertical se manifiesten. */
function baseSetup() {
  return {
    empresa: { nombreComercial: "Cliente Demo", rubro: "Demo", pais: "ARG", servicios: ["S1", "S2"] },
    cuestionario: { procesoActual: "Proceso definido.", tiposClienteObj: ["Segmento A"] },
    proceso_pipeline: { etapas: ["Nuevo", "Calificado", "Cierre"] },
  };
}

function ctxForVertical(verticalKey: string, extra?: Record<string, unknown>) {
  const input = buildDiscoveryContextInputForVertical({ ...baseSetup(), ...(extra ?? {}) }, verticalKey);
  return buildDiscoveryContextFromSetup(input);
}

// ── A. generic — sin pricing ──────────────────────────────────────────────────
function caseGeneric(): void {
  console.log("\n[A] generic — sin pricing");
  const def = getVerticalDefinition("generic");
  check("definición existe", def?.key === "generic");
  check("ningún módulo pricing", (def?.business_modules ?? []).every((m) => m.category !== "pricing"));
  const ctx = ctxForVertical("generic");
  check("quoting_blockers AUSENTE", ctx.quoting_blockers === undefined);
  check("módulos presentes en el contexto", ctx.business_modules.length === 4);
}

// ── B. cleaning_services — con pricing ────────────────────────────────────────
function caseCleaning(): void {
  console.log("\n[B] cleaning_services — con pricing (costing/quotation)");
  const mods = getBusinessModulesForVertical("cleaning_services");
  check("incluye módulo pricing", mods.some((m) => m.category === "pricing"));
  // Setup SIN currency ni cost_inputs → costing/quotation bloqueados.
  const ctx = ctxForVertical("cleaning_services");
  check("quoting_blockers PRESENTE", Array.isArray(ctx.quoting_blockers));
  check("quoting_blockers incluye costing:currency", (ctx.quoting_blockers ?? []).includes("costing:currency"));
  check("quoting_blockers incluye costing:cost_inputs", (ctx.quoting_blockers ?? []).includes("costing:cost_inputs"));
  check("vertical_blockers incluye service_areas", ctx.vertical_blockers.includes("service_areas"));
  check("vertical_blockers incluye country (ARG no es Ecuador pero está confirmado)", !ctx.vertical_blockers.includes("country"), ctx.vertical_blockers.join(","));
}

// ── C. pickup_4x4 — sin pricing ───────────────────────────────────────────────
function casePickup(): void {
  console.log("\n[C] pickup_4x4 — sin pricing");
  const mods = getBusinessModulesForVertical("pickup_4x4");
  check("ningún módulo pricing", mods.every((m) => m.category !== "pricing"));
  const ctx = ctxForVertical("pickup_4x4");
  check("quoting_blockers AUSENTE", ctx.quoting_blockers === undefined);
  check("business_module_blockers presentes (campos verticales pending)", ctx.business_module_blockers.length > 0);
  check("vehicle_fitment bloqueado por vehicle_compatibility", ctx.business_module_blockers.includes("vehicle_fitment:vehicle_compatibility"));
}

// ── D. marketing_agency — sin pricing ─────────────────────────────────────────
function caseAgency(): void {
  console.log("\n[D] marketing_agency — sin pricing (proposal_scope NO es cotización)");
  const def = getVerticalDefinition("marketing_agency");
  const proposalScope = def?.business_modules.find((m) => m.key === "proposal_scope");
  check("proposal_scope existe", Boolean(proposalScope));
  check("proposal_scope NO es pricing", proposalScope?.category === "commercial");
  const ctx = ctxForVertical("marketing_agency");
  check("quoting_blockers AUSENTE", ctx.quoting_blockers === undefined);
  check("blocker por campaign_planning:operational_team", ctx.business_module_blockers.includes("campaign_planning:operational_team"));
}

// ── E. education — sin pricing ────────────────────────────────────────────────
function caseEducation(): void {
  console.log("\n[E] education — sin pricing");
  const mods = getBusinessModulesForVertical("education");
  check("ningún módulo pricing", mods.every((m) => m.category !== "pricing"));
  const ctx = ctxForVertical("education");
  check("quoting_blockers AUSENTE", ctx.quoting_blockers === undefined);
  check("enrollment_pipeline habilitado (pipeline confirmado)", ctx.business_modules.find((m) => m.key === "enrollment_pipeline")?.enabled === true);
}

// ── F. pickup_4x4 + módulo pricing explícito → sí quoting ─────────────────────
function casePickupPlusPricing(): void {
  console.log("\n[F] pickup_4x4 + módulo pricing explícito → quoting_blockers presente");
  const ctx = ctxForVertical("pickup_4x4", {
    businessModules: [
      { key: "custom_quote", category: "pricing", required: true, required_fields: ["currency", "cost_inputs"] },
    ],
  });
  check("quoting_blockers PRESENTE", Array.isArray(ctx.quoting_blockers) && (ctx.quoting_blockers ?? []).length > 0);
  check("quoting_blockers incluye custom_quote:currency", (ctx.quoting_blockers ?? []).includes("custom_quote:currency"));
}

// ── G. vertical desconocido → fallback seguro a generic ───────────────────────
function caseUnknownFallback(): void {
  console.log("\n[G] vertical desconocido → fallback seguro");
  check("getVerticalDefinition(unknown) === null (explícito)", getVerticalDefinition("no_existe") === null);
  const mods = getBusinessModulesForVertical("no_existe");
  check("fallback usa módulos de generic", mods.length === 4 && mods.every((m) => m.category !== "pricing"));
  check("getVerticalRequiredFields fallback a generic", JSON.stringify(getVerticalRequiredFields("no_existe")) === JSON.stringify(["products_or_services"]));
  const ctx = ctxForVertical("no_existe");
  check("fallback NO genera quoting_blockers", ctx.quoting_blockers === undefined);
  check("VERTICAL_KEYS tiene las 5 verticales", VERTICAL_KEYS.length === 5);
}

// ── H. no muta el baseInput ───────────────────────────────────────────────────
function caseNoMutation(): void {
  console.log("\n[H] no muta el input base");
  const base = baseSetup();
  const snapshot = JSON.stringify(base);
  buildDiscoveryContextInputForVertical(base, "cleaning_services");
  check("baseInput intacto tras build", JSON.stringify(base) === snapshot);
}

// ── I. Cableado end-to-end: rubro → detección → snapshot (DISCOVERY-8c) ───────
function snapshotForRubro(rubro: string, extra?: Record<string, unknown>) {
  const base: Record<string, unknown> = {
    empresa: { nombreComercial: "Cliente Demo", rubro, servicios: ["S1", "S2"] },
    cuestionario: { procesoActual: "Proceso definido.", tiposClienteObj: ["Segmento A"] },
    proceso_pipeline: { etapas: ["Nuevo", "Cierre"] },
    ...(extra ?? {}),
  };
  const vk = detectVerticalKey({
    empresa: base.empresa as Record<string, unknown>,
    meta: base.meta as Record<string, unknown> | undefined,
  });
  const input = buildDiscoveryContextInputForVertical(base, vk);
  return { vk, submission: buildDiscoverySubmission(input, {}) };
}

function caseCablingEndToEnd(): void {
  console.log("\n[I] Cableado: rubro → vertical → snapshot");

  const a = snapshotForRubro("Servicios de limpieza corporativa");
  check("A) rubro limpieza → cleaning_services", a.vk === "cleaning_services", a.vk);
  check("A) quoting_blockers PRESENTE (faltan moneda/costos)", Array.isArray(a.submission.quoting_blockers) && (a.submission.quoting_blockers ?? []).length > 0);

  const b = snapshotForRubro("Venta de pickups 4x4 y repuestos");
  check("B) rubro pickup/4x4 → pickup_4x4", b.vk === "pickup_4x4", b.vk);
  check("B) quoting_blockers UNDEFINED", b.submission.quoting_blockers === undefined);

  const c = snapshotForRubro("Agencia de marketing digital");
  check("C) rubro marketing → marketing_agency", c.vk === "marketing_agency", c.vk);
  check("C) quoting_blockers UNDEFINED", c.submission.quoting_blockers === undefined);

  const d = snapshotForRubro("Instituto de educación — inscripciones");
  check("D) rubro educación → education", d.vk === "education", d.vk);
  check("D) quoting_blockers UNDEFINED", d.submission.quoting_blockers === undefined);

  const e = snapshotForRubro("Software a medida");
  check("E) rubro desconocido → generic", e.vk === "generic", e.vk);
  check("E) quoting_blockers UNDEFINED", e.submission.quoting_blockers === undefined);

  const f = snapshotForRubro("Venta de pickups 4x4", {
    businessModules: [{ key: "custom_quote", category: "pricing", required: true, required_fields: ["currency"] }],
  });
  check("F) pickup + módulo pricing explícito → quoting PRESENTE", Array.isArray(f.submission.quoting_blockers) && (f.submission.quoting_blockers ?? []).length > 0);

  // G) empresa.vertical explícito gana sobre el rubro.
  const gVk = detectVerticalKey({ empresa: { vertical: "education", rubro: "Servicios de limpieza" } });
  check("G) empresa.vertical explícito gana sobre rubro", gVk === "education", gVk);

  // detección no muta el objeto empresa.
  const empresaObj = { rubro: "Servicios de limpieza", nombreComercial: "X" };
  const snap = JSON.stringify(empresaObj);
  detectVerticalKey({ empresa: empresaObj });
  check("detectVerticalKey no muta empresa", JSON.stringify(empresaObj) === snap);
}

function main(): void {
  console.log("=== VerticalCatalog selftest (CONSTRUCTOR-VERTICALS-1 / DISCOVERY-8c) ===");
  caseGeneric();
  caseCleaning();
  casePickup();
  caseAgency();
  caseEducation();
  casePickupPlusPricing();
  caseUnknownFallback();
  caseNoMutation();
  caseCablingEndToEnd();

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
