/**
 * Selftest — evaluateChangePin (CONSTRUCTOR-SETUP-USER-5)
 * Ejecutar: node --experimental-strip-types lib/auth/internalChangePin.selftest.ts
 */

import {
  evaluateChangePin,
  isWeakNewPin,
  type ChangePinEvaluateInput,
} from "./internalChangePin.ts";

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function base(overrides: Partial<ChangePinEvaluateInput> = {}): ChangePinEvaluateInput {
  return {
    credentialFound: true,
    userFound: true,
    isActive: true,
    currentPinValid: true,
    newPin: "5678",
    newPinEqualsCurrent: false,
    ...overrides,
  };
}

console.log("\n=== internalChangePin selftest (SETUP-USER-5) ===\n");

console.log("[A] Rechazos");
{
  const r1 = evaluateChangePin(base({ credentialFound: false }));
  assert("usuario inexistente → USER_NOT_FOUND/404", !r1.ok && r1.code === "USER_NOT_FOUND" && r1.httpStatus === 404);

  const r2 = evaluateChangePin(base({ userFound: false }));
  assert("credencial huérfana → ORPHAN_CREDENTIAL/403", !r2.ok && r2.code === "ORPHAN_CREDENTIAL" && r2.httpStatus === 403);

  const r3 = evaluateChangePin(base({ currentPinValid: false }));
  assert("PIN actual inválido → INVALID_CURRENT_PIN/401", !r3.ok && r3.code === "INVALID_CURRENT_PIN" && r3.httpStatus === 401);

  const r4 = evaluateChangePin(base({ isActive: false }));
  assert("usuario inactivo → USER_INACTIVE/403", !r4.ok && r4.code === "USER_INACTIVE" && r4.httpStatus === 403);

  const r5 = evaluateChangePin(base({ newPin: "12" }));
  assert("nuevo PIN débil (corto) → WEAK_NEW_PIN/400", !r5.ok && r5.code === "WEAK_NEW_PIN" && r5.httpStatus === 400);

  const r5b = evaluateChangePin(base({ newPin: "" }));
  assert("nuevo PIN vacío → WEAK_NEW_PIN/400", !r5b.ok && r5b.code === "WEAK_NEW_PIN" && r5b.httpStatus === 400);

  const r6 = evaluateChangePin(base({ newPin: "1234", newPinEqualsCurrent: true }));
  assert("nuevo PIN igual al actual → SAME_PIN/400", !r6.ok && r6.code === "SAME_PIN" && r6.httpStatus === 400);
}

console.log("\n[B] Orden: PIN actual inválido prevalece sobre estado inactivo");
{
  const r = evaluateChangePin(base({ currentPinValid: false, isActive: false }));
  assert("no filtra inactividad sin PIN válido", !r.ok && r.code === "INVALID_CURRENT_PIN");
}

console.log("\n[C] Cambio permitido");
{
  const ok = evaluateChangePin(base());
  assert("activo + PIN válido + nuevo PIN fuerte distinto → PIN_CHANGE_ALLOWED", ok.ok && ok.code === "PIN_CHANGE_ALLOWED");
}

console.log("\n[D] Setup con must_change_password=true puede cambiar PIN");
{
  // El helper no recibe must_change_password: el login lo bloquea, pero el cambio
  // de PIN está permitido para usuario setup activo con PIN actual válido.
  const setupChange = evaluateChangePin(
    base({ newPin: "9090", newPinEqualsCurrent: false })
  );
  assert("setup activo cambia PIN (sin sesión: la otorga el caller, no el helper)", setupChange.ok && setupChange.code === "PIN_CHANGE_ALLOWED");
}

console.log("\n[E] isWeakNewPin");
{
  assert("'' es débil", isWeakNewPin("") === true);
  assert("'123' es débil", isWeakNewPin("123") === true);
  assert("'1234' NO es débil", isWeakNewPin("1234") === false);
  assert("' 1234' (espacio) es débil", isWeakNewPin(" 1234") === true);
  assert("null es débil", isWeakNewPin(null) === true);
}

console.log("\n=== SUMMARY ===");
console.log(`total:  ${passed + failed}`);
console.log(`passed: ${passed}`);
console.log(`failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
console.log("\nALL TESTS PASSED ✓\n");
