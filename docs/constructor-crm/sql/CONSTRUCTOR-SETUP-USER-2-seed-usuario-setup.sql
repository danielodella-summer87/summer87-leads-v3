-- ============================================================================
-- CONSTRUCTOR-SETUP-USER-2 — Seed MANUAL del usuario de instalación "setup"
--
-- ESTE ARCHIVO NO SE EJECUTA. Es una plantilla revisable.
--   * NO ejecutado por Claude ni por ningún build/migración automática.
--   * Requiere REVISIÓN HUMANA y aplicación MANUAL en la instancia clonada.
--   * NO contiene PIN en texto plano. El hash bcrypt se genera aparte con:
--         node scripts/bootstrap-setup-user.mjs
--     y se pega en <<SETUP_PIN_BCRYPT_HASH>> (o usá directamente el SQL que
--     imprime ese script, que ya trae el hash).
--   * Temporal / de instalación. NO es usuario operativo final.
--   * DESHABILITAR (is_active=false) o REEMPLAZAR antes de exponer el CRM.
--
-- Rol "setup": acceso acotado SOLO a Constructor/Discovery (ver app/lib/rbac.ts:
--   SETUP_ALLOWED_PREFIXES). Sin permisos operativos (leads/clientes/datos).
-- ============================================================================

BEGIN;

-- 1) Rol de instalación (idempotente).
INSERT INTO public.roles (name, label, description, is_system)
VALUES ('setup', 'Setup (instalación)', 'Rol temporal de instalación: solo Constructor/Discovery', true)
ON CONFLICT (name) DO NOTHING;

-- 2) Usuario + credencial (username 'setup' + hash bcrypt del PIN).
--    Reemplazar <<SETUP_PIN_BCRYPT_HASH>> por el hash generado con el script.
DO $$
DECLARE
  v_role_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'setup';
  SELECT user_id INTO v_user_id FROM public.app_credentials WHERE username = 'setup';

  IF v_user_id IS NULL THEN
    INSERT INTO public.app_users (is_active, role_id)
    VALUES (true, v_role_id)
    RETURNING id INTO v_user_id;

    INSERT INTO public.app_credentials (user_id, username, password_hash, must_change_password)
    VALUES (v_user_id, 'setup', '<<SETUP_PIN_BCRYPT_HASH>>', true);
  ELSE
    UPDATE public.app_users SET is_active = true, role_id = v_role_id WHERE id = v_user_id;
    UPDATE public.app_credentials
      SET password_hash = '<<SETUP_PIN_BCRYPT_HASH>>', must_change_password = true
      WHERE user_id = v_user_id;
  END IF;
END $$;

COMMIT;

-- ── Baja / deshabilitación (ejecutar ANTES de exponer el CRM) ────────────────
-- UPDATE public.app_users SET is_active = false
--   WHERE id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup');
-- DELETE FROM public.app_credentials WHERE username = 'setup';
-- ============================================================================
