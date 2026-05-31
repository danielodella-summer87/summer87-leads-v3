/**
 * Selftest de la visibilidad sugerida del sidebar por runtime (CONSTRUCTOR-RUNTIME-3).
 *
 * Ejecutar:
 *   node --experimental-strip-types lib/constructor/runtime/runtimeSidebarVisibility.selftest.ts
 *
 * Construye runtimes reales con buildConstructorRuntimeConfig (sobre snapshots) y
 * valida las sugerencias. Imports runtime a módulos self-contained, con extensión.
 */

import {
  suggestRuntimeSidebarVisibility,
  type SidebarItemLite,
} from "./runtimeSidebarVisibility.ts";
import { buildConstructorRuntimeConfig } from "./constructorRuntimeConfig.ts";
import { buildDiscoverySubmission } from "../discovery/discoveryContext.ts";
import { buildDiscoveryContextInputForVertical } from "../verticals/verticalCatalog.ts";

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

const completeBase = {
  empresa: { nombreComercial: "Cliente", rubro: "Servicios", pais: "ARG", servicios: ["S1", "S2"] },
  cuestionario: { procesoActual: "Proceso en 4 etapas.", tiposClienteObj: ["Segmento A"] },
  proceso_pipeline: { etapas: ["Nuevo", "Calificado", "Propuesta", "Ganado"] },
};

function runtimeFor(verticalKey: string, base = completeBase, submitted = true) {
  const input = buildDiscoveryContextInputForVertical(base, verticalKey);
  const submission = buildDiscoverySubmission(input, submitted ? { submittedAt: "2026-05-31T12:00:00.000Z" } : {});
  return buildConstructorRuntimeConfig({ discoverySubmission: submission, verticalKey });
}

// Ítems base del sidebar (operativos/base) + algunos vertical-scoped y un interno.
const BASE_ITEMS: SidebarItemLite[] = [
  { key: "dashboard" },
  { key: "leads" },
  { key: "configuracion" },
  { key: "reportes" },
  { key: "constructor_manual_cliente", category: "internal_constructor" },
  { key: "unknown_module_xyz" },
];

function suggestionFor(results: { key: string; suggestion: string }[], key: string): string {
  return results.find((r) => r.key === key)?.suggestion ?? "(missing)";
}

// ── A. unavailable → no oculta nada ───────────────────────────────────────────
function caseUnavailable(): void {
  console.log("\n[A] runtime unavailable → todo keep");
  const rc = buildConstructorRuntimeConfig({});
  const res = suggestRuntimeSidebarVisibility(rc, BASE_ITEMS);
  check("todos keep", res.every((r) => r.suggestion === "keep"));
  check("razón runtime_not_ready", res.every((r) => r.reason === "runtime_not_ready"));
}

// ── B. blocked → no oculta nada ───────────────────────────────────────────────
function caseBlocked(): void {
  console.log("\n[B] runtime blocked → todo keep");
  const rc = runtimeFor("cleaning_services"); // sin currency/costos → blocked
  check("status blocked/review", rc.status === "blocked" || rc.status === "review_required", rc.status);
  const res = suggestRuntimeSidebarVisibility(rc, BASE_ITEMS);
  check("todos keep", res.every((r) => r.suggestion === "keep"));
}

// ── C. generic ready_readonly → no oculta por defecto ─────────────────────────
function caseGenericReady(): void {
  console.log("\n[C] generic ready_readonly → no oculta por defecto");
  const rc = runtimeFor("generic");
  check("status ready_readonly", rc.status === "ready_readonly", rc.status);
  const res = suggestRuntimeSidebarVisibility(rc, BASE_ITEMS);
  check("ningún suggest_hide", res.every((r) => r.suggestion !== "suggest_hide"));
  check("base keep", suggestionFor(res, "dashboard") === "keep" && suggestionFor(res, "leads") === "keep");
  check("interno → internal_only", suggestionFor(res, "constructor_manual_cliente") === "internal_only");
  check("desconocido → keep", suggestionFor(res, "unknown_module_xyz") === "keep");
}

// ── D. cleaning_services ready → costeo como módulo del vertical, no universal ─
function caseCleaningReady(): void {
  console.log("\n[D] cleaning_services ready → módulos del vertical sugeridos, sin quoting universal");
  // Forzamos ready_readonly: confirmamos currency/cost_inputs via verticalFields + servicios.
  const base = {
    empresa: { nombreComercial: "Limpieza SA", rubro: "Servicios de limpieza", pais: "Ecuador", moneda: "USD", servicios: ["Oficinas"] },
    cuestionario: { procesoActual: "Proceso.", tiposClienteObj: ["Empresas"], costos: ["fijo"] },
    proceso_pipeline: { etapas: ["A", "B"] },
  };
  // service_areas y demás pueden faltar → puede no ser ready; validamos comportamiento, no forzamos ready.
  const rc = runtimeFor("cleaning_services", base as typeof completeBase);
  const items: SidebarItemLite[] = [
    ...BASE_ITEMS,
    { key: "costing", vertical: "cleaning_services" },
    { key: "site_survey", vertical: "cleaning_services" },
  ];
  const res = suggestRuntimeSidebarVisibility(rc, items);
  if (rc.status === "ready_readonly") {
    check("costing del vertical → vertical_specific", suggestionFor(res, "costing") === "vertical_specific");
  } else {
    check("no-ready → todo keep (fail-open)", res.every((r) => r.suggestion === "keep"));
  }
  // En ningún caso un ítem base operativo se marca suggest_hide.
  check("leads nunca suggest_hide", suggestionFor(res, "leads") !== "suggest_hide");
}

// ── E. pickup_4x4 ready → no quoting universal; otro-vertical item → suggest_hide
function casePickupReady(): void {
  console.log("\n[E] pickup_4x4 → sin quoting universal; ítem de otro vertical → suggest_hide");
  const rc = runtimeFor("pickup_4x4", {
    empresa: { nombreComercial: "Conces", rubro: "Vehículos", pais: "UY", productos: ["Pickups"] },
    cuestionario: { procesoActual: "Proceso.", tiposClienteObj: ["Particulares"] },
    proceso_pipeline: { etapas: ["A", "B"] },
  } as typeof completeBase);
  const items: SidebarItemLite[] = [
    ...BASE_ITEMS,
    { key: "costing", vertical: "cleaning_services" }, // pertenece a OTRO vertical
  ];
  const res = suggestRuntimeSidebarVisibility(rc, items);
  // costing es vertical-scoped a cleaning → si ready, suggest_hide; si no ready, keep.
  if (rc.status === "ready_readonly") {
    check("costing (otro vertical) → suggest_hide", suggestionFor(res, "costing") === "suggest_hide");
  } else {
    check("no-ready → costing keep", suggestionFor(res, "costing") === "keep");
  }
  check("ningún quoting universal forzado en base", suggestionFor(res, "reportes") === "keep");
}

// ── F. marketing_agency → sin quoting universal ───────────────────────────────
function caseAgencyReady(): void {
  console.log("\n[F] marketing_agency → sin quoting universal");
  const rc = runtimeFor("marketing_agency", {
    empresa: { nombreComercial: "Agencia", rubro: "Marketing", servicios: ["Campañas"] },
    cuestionario: { procesoActual: "Proceso.", tiposClienteObj: ["Pymes"] },
    proceso_pipeline: { etapas: ["A", "B"] },
  } as typeof completeBase);
  const res = suggestRuntimeSidebarVisibility(rc, BASE_ITEMS);
  check("base operativa keep", suggestionFor(res, "leads") === "keep" && suggestionFor(res, "reportes") === "keep");
  check("ningún suggest_hide en base", res.every((r) => r.suggestion !== "suggest_hide"));
}

// ── G. ítem desconocido → keep ────────────────────────────────────────────────
function caseUnknownItem(): void {
  console.log("\n[G] ítem desconocido → keep");
  const rc = runtimeFor("generic");
  const res = suggestRuntimeSidebarVisibility(rc, [{ key: "modulo_inexistente_123" }]);
  check("desconocido keep", res[0].suggestion === "keep");
}

// ── H. no mutación ────────────────────────────────────────────────────────────
function caseNoMutation(): void {
  console.log("\n[H] no muta input");
  const rc = runtimeFor("generic");
  const items: SidebarItemLite[] = [{ key: "leads" }, { key: "configuracion" }];
  const itemsSnap = JSON.stringify(items);
  const rcSnap = JSON.stringify(rc);
  suggestRuntimeSidebarVisibility(rc, items);
  check("items intactos", JSON.stringify(items) === itemsSnap);
  check("runtime intacto", JSON.stringify(rc) === rcSnap);
}

// ── I. ready_readonly + ítems vertical-scoped → match vs mismatch ─────────────
function caseVerticalScoped(): void {
  console.log("\n[I] ready (generic) + ítems vertical-scoped → vertical_specific vs suggest_hide");
  const rc = runtimeFor("generic"); // ready_readonly confirmado
  check("runtime ready", rc.status === "ready_readonly", rc.status);
  const items: SidebarItemLite[] = [
    { key: "leads" }, // base protegido
    { key: "mod_match", vertical: "generic" }, // coincide con vertical confirmado
    { key: "mod_other", vertical: "cleaning_services" }, // otro vertical
    { key: "configuracion", vertical: "cleaning_services" }, // protegido aunque vertical-scoped
  ];
  const res = suggestRuntimeSidebarVisibility(rc, items);
  check("mod_match → vertical_specific", suggestionFor(res, "mod_match") === "vertical_specific");
  check("mod_other → suggest_hide", suggestionFor(res, "mod_other") === "suggest_hide");
  check("leads → keep (protegido)", suggestionFor(res, "leads") === "keep");
  check("configuracion vertical-scoped pero protegido → keep", suggestionFor(res, "configuracion") === "keep");
}

function main(): void {
  console.log("=== runtimeSidebarVisibility selftest (CONSTRUCTOR-RUNTIME-3) ===");
  caseUnavailable();
  caseBlocked();
  caseGenericReady();
  caseCleaningReady();
  casePickupReady();
  caseAgencyReady();
  caseUnknownItem();
  caseNoMutation();
  caseVerticalScoped();

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
