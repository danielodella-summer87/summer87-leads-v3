/**
 * Selftest del rol de instalación `setup` en el RBAC (CONSTRUCTOR-SETUP-USER-2).
 *
 * Ejecutar:
 *   node --experimental-strip-types app/lib/rbac.setup.selftest.ts
 *
 * Verifica que `setup` accede SOLO a Constructor/Discovery (allowlist, default-deny)
 * y que NO se altera el comportamiento de los roles existentes ni de admin.
 */

import { canAccessPath, getRole, hasPermission } from "./rbac.ts";

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

const setup = { role: "setup" };

// ── A. setup PUEDE Constructor/Discovery ──────────────────────────────────────
function caseSetupAllowed(): void {
  console.log("\n[A] setup → permitido en Constructor/Discovery");
  check("getRole('setup') === setup", getRole(setup) === "setup");
  check("/admin/constructor", canAccessPath(setup, "/admin/constructor") === true);
  check("/admin/constructor-crm", canAccessPath(setup, "/admin/constructor-crm") === true);
  check("/admin/constructor-crm/cuestionario", canAccessPath(setup, "/admin/constructor-crm/cuestionario") === true);
  check("/api/admin/constructor/setup", canAccessPath(setup, "/api/admin/constructor/setup") === true);
}

// ── B. setup NO puede rutas operativas ────────────────────────────────────────
function caseSetupBlocked(): void {
  console.log("\n[B] setup → bloqueado en operativo (default-deny)");
  check("/admin/leads bloqueado", canAccessPath(setup, "/admin/leads") === false);
  check("/admin/socios bloqueado", canAccessPath(setup, "/admin/socios") === false);
  check("/admin/agenda bloqueado", canAccessPath(setup, "/admin/agenda") === false);
  check("/admin/configuracion bloqueado", canAccessPath(setup, "/admin/configuracion") === false);
  check("/admin (dashboard) bloqueado", canAccessPath(setup, "/admin") === false);
  check("/admin/ia bloqueado", canAccessPath(setup, "/admin/ia") === false);
  check("/api/admin/leads bloqueado", canAccessPath(setup, "/api/admin/leads") === false);
  check("setup sin permisos operativos", hasPermission(setup, "leads.read") === false && hasPermission(setup, "leads.write") === false);
}

// ── C. Roles existentes NO cambian ────────────────────────────────────────────
function caseNoRegression(): void {
  console.log("\n[C] sin regresión en roles existentes");
  check("admin → todo (constructor)", canAccessPath({ role: "admin" }, "/admin/constructor") === true);
  check("admin → leads", canAccessPath({ role: "admin" }, "/admin/leads") === true);
  check("comercial → leads OK", canAccessPath({ role: "comercial" }, "/admin/leads") === true);
  check("comercial → constructor BLOQUEADO", canAccessPath({ role: "comercial" }, "/admin/constructor") === false);
  check("comercial → ruta sin regla permitida (default-allow)", canAccessPath({ role: "comercial" }, "/admin/clientes") === true);
  // viewer NO está en la allowlist de /admin/leads (comportamiento existente, sin cambios).
  check("viewer → leads denegado (existente)", canAccessPath({ role: "viewer" }, "/admin/leads") === false);
  check("viewer → ruta sin regla permitida (default-allow)", canAccessPath({ role: "viewer" }, "/admin/clientes") === true);
  check("sin rol → denegado", canAccessPath(null, "/admin/constructor") === false);
}

function main(): void {
  console.log("=== RBAC setup-role selftest (CONSTRUCTOR-SETUP-USER-2) ===");
  caseSetupAllowed();
  caseSetupBlocked();
  caseNoRegression();

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
