/**
 * Selftest — evaluateInternalLogin (CONSTRUCTOR-SETUP-USER-4)
 * Ejecutar: node --experimental-strip-types lib/auth/internalLogin.selftest.ts
 */

import {
  evaluateInternalLogin,
  type InternalLoginEvaluateInput,
} from "./internalLogin.ts";

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

function base(overrides: Partial<InternalLoginEvaluateInput> = {}): InternalLoginEvaluateInput {
  return {
    credentialFound: true,
    passwordValid: true,
    userFound: true,
    isActive: true,
    mustChangePassword: false,
    roleName: "admin",
    ...overrides,
  };
}

console.log("\n=== internalLogin selftest (SETUP-USER-4) ===\n");

console.log("[A] Rechazos");
{
  const r1 = evaluateInternalLogin(base({ credentialFound: false }));
  assert("USER_NOT_FOUND", !r1.ok && r1.code === "USER_NOT_FOUND" && r1.httpStatus === 404);

  const r2 = evaluateInternalLogin(base({ passwordValid: false }));
  assert("INVALID_CREDENTIALS", !r2.ok && r2.code === "INVALID_CREDENTIALS" && r2.httpStatus === 401);

  const r3 = evaluateInternalLogin(base({ isActive: false }));
  assert("USER_INACTIVE", !r3.ok && r3.code === "USER_INACTIVE" && r3.httpStatus === 403);

  const r4 = evaluateInternalLogin(base({ mustChangePassword: true, roleName: "admin" }));
  assert(
    "PASSWORD_CHANGE_REQUIRED",
    !r4.ok && r4.code === "PASSWORD_CHANGE_REQUIRED" && r4.httpStatus === 403
  );

  const r5 = evaluateInternalLogin(base({ mustChangePassword: true, roleName: "setup" }));
  assert(
    "SETUP_PASSWORD_CHANGE_REQUIRED",
    !r5.ok && r5.code === "SETUP_PASSWORD_CHANGE_REQUIRED" && r5.httpStatus === 403
  );
}

console.log("\n[B] LOGIN_OK");
{
  const ok = evaluateInternalLogin(base());
  assert("activo + must_change false", ok.ok && ok.code === "LOGIN_OK");

  const setupOk = evaluateInternalLogin(
    base({ roleName: "setup", mustChangePassword: false })
  );
  assert("setup con PIN rotado (must_change false)", setupOk.ok && setupOk.code === "LOGIN_OK");
}

console.log("\n=== SUMMARY ===");
console.log(`total:  ${passed + failed}`);
console.log(`passed: ${passed}`);
console.log(`failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
console.log("\nALL TESTS PASSED ✓\n");
