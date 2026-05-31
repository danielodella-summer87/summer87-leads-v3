#!/usr/bin/env node
/**
 * bootstrap-setup-user.mjs — generador MANUAL del usuario de instalación `setup`
 * (CONSTRUCTOR-SETUP-USER-2).
 *
 * QUÉ HACE:
 *   - Genera un hash bcrypt del PIN (default "1234", o env SETUP_PIN / arg --pin).
 *   - Imprime por stdout el SQL listo para REVISAR y aplicar MANUALMENTE.
 *
 * QUÉ NO HACE (a propósito):
 *   - NO se conecta a Supabase ni ejecuta SQL.
 *   - NO crea usuarios ni toca datos.
 *   - NO corre en build. NO guarda nada en disco.
 *   - NO imprime el PIN en plano dentro del SQL (solo el hash bcrypt).
 *
 * USO:
 *   node scripts/bootstrap-setup-user.mjs                 # PIN 1234 (local/instalación)
 *   SETUP_PIN=XXXX node scripts/bootstrap-setup-user.mjs  # PIN custom
 *   node scripts/bootstrap-setup-user.mjs --pin XXXX
 *
 * Luego: revisar el SQL, aplicarlo manualmente en la instancia clonada, y
 * DESHABILITAR/REEMPLAZAR el usuario antes de exponer el CRM (must_change_password=true).
 */

import bcrypt from "bcryptjs";

function readPin() {
  const argIdx = process.argv.indexOf("--pin");
  if (argIdx !== -1 && process.argv[argIdx + 1]) return String(process.argv[argIdx + 1]);
  if (process.env.SETUP_PIN && process.env.SETUP_PIN.trim()) return process.env.SETUP_PIN.trim();
  return "1234";
}

const USERNAME = "setup";
const ROLE_NAME = "setup";
const pin = readPin();

if (pin === "1234") {
  console.error(
    "[bootstrap-setup-user] AVISO: usando PIN por defecto 1234 (solo local/instalación). " +
      "Cambialo o deshabilitá el usuario antes de exponer la instancia.\n"
  );
}

// bcrypt rounds 10, igual que lib/auth/internalAuth.hashPassword.
const hash = bcrypt.hashSync(pin, 10);

const sql = `-- ============================================================================
-- SEED MANUAL — Usuario de instalación "setup" (CONSTRUCTOR-SETUP-USER-2)
-- GENERADO POR scripts/bootstrap-setup-user.mjs — NO EJECUTADO.
-- Revisar y aplicar MANUALMENTE en la instancia clonada. NO commitear este hash.
--
-- Reglas:
--   * Temporal / de instalación. NO es usuario operativo final.
--   * must_change_password = true (forzar cambio en primer uso real).
--   * Rol "setup": acceso acotado a Constructor/Discovery (ver app/lib/rbac.ts).
--   * DESHABILITAR (is_active=false) o REEMPLAZAR antes de exponer el CRM.
-- ============================================================================
BEGIN;

-- 1) Rol de instalación (idempotente).
INSERT INTO public.roles (name, label, description, is_system)
VALUES ('${ROLE_NAME}', 'Setup (instalación)', 'Rol temporal de instalación: solo Constructor/Discovery', true)
ON CONFLICT (name) DO NOTHING;

-- 2) Usuario + credencial (username + PIN como hash bcrypt; NUNCA PIN en texto).
DO $$
DECLARE
  v_role_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = '${ROLE_NAME}';

  -- Reutiliza el usuario si ya existe esa credencial (idempotente por username).
  SELECT user_id INTO v_user_id FROM public.app_credentials WHERE username = '${USERNAME}';

  IF v_user_id IS NULL THEN
    INSERT INTO public.app_users (is_active, role_id)
    VALUES (true, v_role_id)
    RETURNING id INTO v_user_id;

    INSERT INTO public.app_credentials (user_id, username, password_hash, must_change_password)
    VALUES (v_user_id, '${USERNAME}', '${hash}', true);
  ELSE
    -- Si ya existe, solo actualiza hash/rol y fuerza cambio (no duplica).
    UPDATE public.app_users SET is_active = true, role_id = v_role_id WHERE id = v_user_id;
    UPDATE public.app_credentials
      SET password_hash = '${hash}', must_change_password = true
      WHERE user_id = v_user_id;
  END IF;
END $$;

COMMIT;

-- ── Baja / deshabilitación (ejecutar antes de exponer el CRM) ────────────────
-- UPDATE public.app_users SET is_active = false
--   WHERE id = (SELECT user_id FROM public.app_credentials WHERE username = '${USERNAME}');
-- -- o eliminar credencial:
-- DELETE FROM public.app_credentials WHERE username = '${USERNAME}';
-- ============================================================================
`;

console.log(sql);
