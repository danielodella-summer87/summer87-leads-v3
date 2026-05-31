/**
 * Selftest del runtime read-only del Constructor (CONSTRUCTOR-RUNTIME-1).
 *
 * Ejecutar:
 *   node --experimental-strip-types lib/constructor/runtime/constructorRuntimeConfig.selftest.ts
 *
 * Arma snapshots reales con buildDiscoverySubmission (+ catálogo) y valida cómo
 * el runtime los consolida. Todos los imports runtime son a módulos self-contained.
 */

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

/** Snapshot confirmado (submitted) para un vertical, sobre un setup base. */
function snapshot(verticalKey: string, base: Record<string, unknown>, submitted = true) {
  const input = buildDiscoveryContextInputForVertical(base, verticalKey);
  return buildDiscoverySubmission(input, submitted ? { submittedAt: "2026-05-31T12:00:00.000Z" } : {});
}

const completeBase = {
  empresa: { nombreComercial: "Cliente Completo", rubro: "Servicios", pais: "ARG", servicios: ["S1", "S2"] },
  cuestionario: { procesoActual: "Proceso en 4 etapas.", tiposClienteObj: ["Segmento A"] },
  proceso_pipeline: { etapas: ["Nuevo", "Calificado", "Propuesta", "Ganado"] },
};

// ── A. Sin discovery_submission ───────────────────────────────────────────────
function caseUnavailable(): void {
  console.log("\n[A] Sin discovery_submission → unavailable");
  const cfg = buildConstructorRuntimeConfig({});
  check("status unavailable", cfg.status === "unavailable", cfg.status);
  check("can_use_readonly_runtime false", cfg.can_use_readonly_runtime === false);
  check("source none", cfg.source === "none");
  check("blockers incluye missing_discovery_submission", cfg.blockers.includes("missing_discovery_submission"));
  check("compuertas off", !cfg.can_generate_package_payload && !cfg.can_activate_engines && !cfg.can_create_operational_crm);
}

// ── B. generic confirmado ─────────────────────────────────────────────────────
function caseGenericReady(): void {
  console.log("\n[B] generic confirmado → ready_readonly, sin quoting");
  const sub = snapshot("generic", completeBase);
  const cfg = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "generic" });
  check("status ready_readonly", cfg.status === "ready_readonly", cfg.status);
  check("vertical_label presente", cfg.vertical_label === "Genérico");
  check("vertical_in_catalog", cfg.vertical_in_catalog === true);
  check("quoting_blockers undefined", cfg.quoting_blockers === undefined);
  check("can_use_readonly_runtime true", cfg.can_use_readonly_runtime === true);
  check("modules presentes", cfg.modules.length > 0);
  check("compuertas off", !cfg.can_generate_package_payload && !cfg.can_activate_engines && !cfg.can_create_operational_crm);
}

// ── C. cleaning_services con pricing blockers ─────────────────────────────────
function caseCleaningBlocked(): void {
  console.log("\n[C] cleaning_services → blocked/review, quoting_blockers presente");
  const sub = snapshot("cleaning_services", completeBase);
  const cfg = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "cleaning_services" });
  check("status blocked o review_required", cfg.status === "blocked" || cfg.status === "review_required", cfg.status);
  check("quoting_blockers presente", Array.isArray(cfg.quoting_blockers) && (cfg.quoting_blockers ?? []).length > 0);
  check("blockers incluye quoting:*", cfg.blockers.some((b) => b.startsWith("quoting:")));
  check("NO habilita package", cfg.can_generate_package_payload === false);
  check("NO activa motores", cfg.can_activate_engines === false);
  check("NO crea CRM operativo", cfg.can_create_operational_crm === false);
}

// ── D. pickup_4x4 confirmado ──────────────────────────────────────────────────
function casePickup(): void {
  console.log("\n[D] pickup_4x4 → sin quoting, módulos pickup presentes");
  const sub = snapshot("pickup_4x4", {
    empresa: { nombreComercial: "Concesionario", rubro: "Vehículos y repuestos", pais: "UY", productos: ["Pickups", "Repuestos"] },
    cuestionario: { procesoActual: "Proceso.", tiposClienteObj: ["Particulares"] },
    proceso_pipeline: { etapas: ["Nuevo", "Cerrado"] },
  });
  const cfg = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "pickup_4x4" });
  check("quoting_blockers undefined", cfg.quoting_blockers === undefined);
  check("módulos pickup presentes", cfg.modules.some((m) => m.key === "vehicle_fitment"));
  check("no activa motores", cfg.can_activate_engines === false);
  check("vertical_label pickup", cfg.vertical_label === "Vehículos / repuestos 4x4");
}

// ── E. marketing_agency confirmado ────────────────────────────────────────────
function caseAgency(): void {
  console.log("\n[E] marketing_agency → sin quoting, módulos marketing presentes");
  const sub = snapshot("marketing_agency", {
    empresa: { nombreComercial: "Agencia", rubro: "Marketing", servicios: ["Campañas"] },
    cuestionario: { procesoActual: "Proceso.", tiposClienteObj: ["Pymes"] },
    proceso_pipeline: { etapas: ["Lead", "Cliente"] },
  });
  const cfg = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "marketing_agency" });
  check("quoting_blockers undefined", cfg.quoting_blockers === undefined);
  check("módulos marketing presentes", cfg.modules.some((m) => m.key === "channel_strategy"));
}

// ── F. vertical_key desconocido → fallback + blocker ──────────────────────────
function caseUnknownVertical(): void {
  console.log("\n[F] vertical_key desconocido → fallback generic + blocker");
  const sub = snapshot("generic", completeBase); // snapshot generic confirmado
  const cfg = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "no_existe" });
  check("vertical_in_catalog false", cfg.vertical_in_catalog === false);
  check("blockers incluye vertical_not_in_catalog", cfg.blockers.includes("vertical_not_in_catalog"));
  check("no queda ready_readonly", cfg.status !== "ready_readonly", cfg.status);
  check("vertical_label fallback Genérico", cfg.vertical_label === "Genérico");
}

// ── G. No mutación ────────────────────────────────────────────────────────────
function caseNoMutation(): void {
  console.log("\n[G] no muta el input");
  const sub = snapshot("generic", completeBase);
  const snap = JSON.stringify(sub);
  buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "generic", generatedAt: "t" });
  check("submission intacto", JSON.stringify(sub) === snap);
  const c1 = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "generic", generatedAt: "t" });
  const c2 = buildConstructorRuntimeConfig({ discoverySubmission: sub, verticalKey: "generic", generatedAt: "t" });
  check("determinístico", JSON.stringify(c1) === JSON.stringify(c2));
  check("generated_at refleja input", c1.generated_at === "t");
}

function main(): void {
  console.log("=== ConstructorRuntimeConfig selftest (CONSTRUCTOR-RUNTIME-1) ===");
  caseUnavailable();
  caseGenericReady();
  caseCleaningBlocked();
  casePickup();
  caseAgency();
  caseUnknownVertical();
  caseNoMutation();

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
