-- ============================================================================
-- CONSTRUCTOR-SETUP-USER-3 — Baja, rotación o deshabilitación del usuario setup
--
-- ESTE ARCHIVO NO SE EJECUTA AUTOMÁTICAMENTE.
--   * Plantilla revisable para operadores humanos.
--   * Aplicar SOLO en la instancia clonada, ANTES de exposición real al cliente.
--   * NO contiene PIN en texto plano.
--   * NO contiene hash bcrypt real (usar placeholder o generar con:
--         node scripts/bootstrap-setup-user.mjs
--     y pegar en <<NEW_SETUP_PIN_BCRYPT_HASH>>).
--
-- Usuario objetivo: username = 'setup' (rol roles.name = 'setup').
-- Credencial temporal típica: PIN inicial 1234 (solo instalación local).
--
-- Orden recomendado antes de exposición:
--   1) Auditar sesiones activas (sección D).
--   2) Invalidar sesiones setup (sección D).
--   3) Deshabilitar o rotar credencial (secciones A / B).
--   4) Opcional: reemplazar por usuario real del cliente (sección C).
--   5) Re-auditar que no queden sesiones ni login posible con setup.
-- ============================================================================

-- ── 0) Consultas de diagnóstico (solo lectura) ─────────────────────────────

-- Usuario setup (app_users + rol)
SELECT
  u.id AS user_id,
  u.is_active,
  u.role_id,
  r.name AS role_name,
  u.created_at,
  u.updated_at
FROM public.app_users u
JOIN public.app_credentials c ON c.user_id = u.id
LEFT JOIN public.roles r ON r.id = u.role_id
WHERE c.username = 'setup';

-- Credencial setup (sin exponer password_hash completo en logs de prod)
SELECT
  user_id,
  username,
  must_change_password,
  left(password_hash, 7) || '…' AS password_hash_prefix,
  created_at
FROM public.app_credentials
WHERE username = 'setup';

-- Sesiones activas del usuario setup (no expiradas)
SELECT
  s.id AS session_id,
  s.user_id,
  s.expires_at,
  s.created_at
FROM public.app_sessions s
WHERE s.user_id = (
  SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
)
  AND s.expires_at > now()
ORDER BY s.created_at DESC;

-- Conteo rápido de sesiones setup (activas vs total)
SELECT
  count(*) FILTER (WHERE expires_at > now()) AS active_sessions,
  count(*) AS total_sessions
FROM public.app_sessions
WHERE user_id = (
  SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
);


-- ── A) Escenario A — Deshabilitar setup antes de exposición ─────────────────
-- Ejecutar en transacción tras revisar diagnóstico. Descomentar bloque deseado.

-- BEGIN;

-- A.1) Invalidar sesiones primero (recomendado)
-- DELETE FROM public.app_sessions
-- WHERE user_id = (
--   SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
-- );

-- A.2) Deshabilitar usuario (mantiene fila para auditoría)
-- UPDATE public.app_users
-- SET is_active = false, updated_at = now()
-- WHERE id = (
--   SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
-- );

-- A.3) Opcional: eliminar credencial (impide login username+PIN)
-- DELETE FROM public.app_credentials WHERE username = 'setup';

-- A.4) Opcional: renombrar username para evitar re-seed accidental
-- UPDATE public.app_credentials
-- SET username = 'setup_disabled'
-- WHERE username = 'setup';

-- COMMIT;

-- Rollback manual A (si se deshabilitó por error ANTES de exposición):
-- BEGIN;
-- UPDATE public.app_users SET is_active = true
--   WHERE id = (SELECT user_id FROM public.app_credentials WHERE username IN ('setup','setup_disabled') LIMIT 1);
-- -- Restaurar username si se renombró:
-- UPDATE public.app_credentials SET username = 'setup' WHERE username = 'setup_disabled';
-- COMMIT;


-- ── B) Escenario B — Cambiar PIN/hash (rotación) ───────────────────────────
-- Generar hash: node scripts/bootstrap-setup-user.mjs  (o SETUP_PIN=…)
-- Reemplazar <<NEW_SETUP_PIN_BCRYPT_HASH>>. NO commitear el hash generado.

-- BEGIN;

-- B.1) Rotar hash y forzar cambio en próximo login (si el flujo lo exige)
-- UPDATE public.app_credentials
-- SET
--   password_hash = '<<NEW_SETUP_PIN_BCRYPT_HASH>>',
--   must_change_password = true
-- WHERE username = 'setup';

-- B.2) Invalidar sesiones existentes tras rotación
-- DELETE FROM public.app_sessions
-- WHERE user_id = (
--   SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
-- );

-- COMMIT;

-- Nota: /api/proto/login hoy NO valida must_change_password en código;
-- la rotación + invalidación de sesiones sigue siendo obligatoria antes de exposición.


-- ── C) Escenario C — Reemplazar setup por usuario real del cliente ─────────
-- NO usar placeholders de email reales del cliente en este repo.
-- Completar <<CLIENT_ADMIN_ROLE_ID>> y <<CLIENT_ADMIN_BCRYPT_HASH>> fuera de Git.

-- BEGIN;

-- C.1) Crear usuario real (ejemplo; ajustar nombre/email según instancia)
-- INSERT INTO public.app_users (nombre, email, is_active, role_id)
-- VALUES (
--   '<<CLIENT_ADMIN_DISPLAY_NAME>>',
--   '<<CLIENT_ADMIN_EMAIL>>',
--   true,
--   '<<CLIENT_ADMIN_ROLE_ID>>'  -- típicamente rol admin u operador del cliente
-- )
-- ON CONFLICT DO NOTHING
-- RETURNING id;
-- -- Guardar el UUID retornado como <<CLIENT_ADMIN_USER_ID>>

-- C.2) Credencial del usuario real
-- INSERT INTO public.app_credentials (user_id, username, password_hash, must_change_password)
-- VALUES (
--   '<<CLIENT_ADMIN_USER_ID>>',
--   '<<CLIENT_ADMIN_USERNAME>>',
--   '<<CLIENT_ADMIN_BCRYPT_HASH>>',
--   true
-- )
-- ON CONFLICT (user_id) DO UPDATE
-- SET password_hash = EXCLUDED.password_hash,
--     must_change_password = EXCLUDED.must_change_password;

-- C.3) Baja del usuario setup (tras validar que el admin real funciona)
-- DELETE FROM public.app_sessions
-- WHERE user_id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup');
-- UPDATE public.app_users SET is_active = false
--   WHERE id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup');
-- DELETE FROM public.app_credentials WHERE username = 'setup';

-- COMMIT;


-- ── D) Escenario D — Auditar / invalidar sesiones activas setup ─────────────

-- D.1) Listar sesiones activas (repetición operativa)
-- SELECT id, user_id, expires_at, created_at
-- FROM public.app_sessions
-- WHERE user_id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup')
--   AND expires_at > now();

-- D.2) Invalidar TODAS las sesiones del usuario setup
-- DELETE FROM public.app_sessions
-- WHERE user_id = (
--   SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
-- );

-- D.3) Verificación post-baja (debe devolver 0 filas activas)
-- SELECT count(*) AS active_setup_sessions
-- FROM public.app_sessions s
-- JOIN public.app_credentials c ON c.user_id = s.user_id
-- WHERE c.username = 'setup' AND s.expires_at > now();


-- ── E) Verificación final antes de exposición (checklist SQL) ───────────────

-- E.1) setup no debe poder autenticarse si se deshabilitó correctamente
-- SELECT
--   u.is_active,
--   c.username IS NOT NULL AS has_credential
-- FROM public.app_users u
-- LEFT JOIN public.app_credentials c ON c.user_id = u.id AND c.username = 'setup'
-- WHERE u.id = (SELECT user_id FROM public.app_credentials WHERE username IN ('setup','setup_disabled') LIMIT 1);
-- Esperado antes de exposición: is_active = false OR has_credential = false

-- E.2) No deben quedar sesiones activas de setup
-- SELECT count(*) FROM public.app_sessions s
-- JOIN public.app_credentials c ON c.user_id = s.user_id
-- WHERE c.username IN ('setup', 'setup_disabled') AND s.expires_at > now();
-- Esperado: 0

-- ============================================================================
-- FIN — CONSTRUCTOR-SETUP-USER-3
-- ============================================================================
