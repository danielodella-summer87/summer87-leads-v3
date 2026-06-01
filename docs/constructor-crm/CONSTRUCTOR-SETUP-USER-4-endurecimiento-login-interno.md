# CONSTRUCTOR-SETUP-USER-4 — Endurecimiento login interno (is_active / must_change_password)

> **Tipo:** Implementación mínima + selftests + documentación.
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-SETUP-USER-3` (commit `d7055ee`).
> **Alcance:** Endurecer `/api/proto/login` sin SQL, sin usuarios reales, sin UI de cambio de PIN. NO deploy/commit/push.

---

## A. Resumen ejecutivo

Se endureció el login prototipo username + PIN para que **no cree sesión** cuando el usuario está inactivo o debe cambiar PIN (`must_change_password=true`). La lógica vive en `lib/auth/internalLogin.ts` (pura, testeable) y la consume `app/api/proto/login/route.ts`.

**Dictamen:** `GO` — `setup/1234` con `must_change_password=true` ya no obtiene sesión silenciosa; debe rotar PIN vía script/SQL (USER-2/USER-3) o usar bypass de Constructor solo en dev documentado.

---

## B. Estado Git inicial

```
pwd:     /Users/danielodella/PROYECTOS/summer87-leads-v3
rama:    main @ d7055ee [origin/main]
working tree: limpio
```

---

## C. Diagnóstico del login actual (antes de USER-4)

| Paso | Comportamiento previo |
|------|------------------------|
| Buscar credencial | `app_credentials` por `username`; solo `user_id`, `password_hash` |
| Validar PIN | `verifyPassword` bcrypt |
| Cargar usuario | `app_users` + `roles.name`; **sin** `is_active` en select |
| `must_change_password` | **No leído ni aplicado** |
| Sesión | Siempre `createSession` + cookie `crm_session` |
| Middleware | Valida sesión + `is_active` en rutas `/admin/*` (post-login) |

**Riesgo:** usuario deshabilitado o con PIN temporal podía obtener cookie válida 7 días si conocía el PIN.

**No existe** columna `credencial activa` separada: la credencial se “deshabilita” eliminando fila o desactivando `app_users`.

---

## D. Cambios implementados

| Archivo | Cambio |
|---------|--------|
| `lib/auth/internalLogin.ts` | Helper puro `evaluateInternalLogin` con códigos de resultado |
| `lib/auth/internalLogin.selftest.ts` | Selftest de casos de rechazo y LOGIN_OK |
| `app/api/proto/login/route.ts` | Select `is_active`, `must_change_password`; evaluación antes de `createSession`; respuestas con `code` |

---

## E. Comportamiento de `is_active`

- Se lee `app_users.is_active` tras validar PIN.
- Si `is_active === false` → **403** `USER_INACTIVE`, sin sesión.
- Mensaje público: *"Este usuario no está habilitado."*
- Alineado con `middleware.ts` (que ya rechazaba sesiones de usuarios inactivos en rutas protegidas).

---

## F. Comportamiento de `must_change_password`

- Se lee `app_credentials.must_change_password`.
- Si `true` → **403**, sin `createSession`:
  - Rol distinto de `setup`: `PASSWORD_CHANGE_REQUIRED`
  - Rol `setup`: `SETUP_PASSWORD_CHANGE_REQUIRED`
- Mensaje setup menciona bootstrap / SETUP-USER-3.
- **No hay pantalla de cambio de PIN** en esta fase (pendiente fase futura).

---

## G. Impacto sobre `setup` / `1234`

| Situación | Resultado |
|-----------|-----------|
| `setup` + PIN correcto + `must_change_password=true` (bootstrap default) | Login **rechazado** con `SETUP_PASSWORD_CHANGE_REQUIRED` |
| `setup` + PIN rotado + `must_change_password=false` (SQL manual local) | Login OK; RBAC setup sigue allowlist |
| Instalación local sin login | Sigue disponible `CONSTRUCTOR_AUTH_BYPASS` en dev (documentado SECURITY-1), no sustituye exposición |

**Transición segura para instalación en clon:**

1. Bootstrap con `node scripts/bootstrap-setup-user.mjs` y PIN fuerte, **o**
2. Tras seed, `UPDATE app_credentials SET must_change_password = false WHERE username = 'setup'` **solo en LAN/clon**, luego USER-USER-3 antes de exposición, **o**
3. Constructor sin login vía bypass en dev.

---

## H. Impacto sobre usuarios existentes

- Usuarios con `must_change_password=true` (p. ej. seed `daniel` en migración 037) **no obtienen sesión** hasta rotar PIN o actualizar flag en DB.
- Comportamiento esperado de seguridad; si bloquea desarrollo, rotar hash con script y poner `must_change_password=false` en instancia local.
- Usuarios activos con `must_change_password=false` → sin cambio.

---

## I. Relación con RBAC setup

Sin cambios en `app/lib/rbac.ts`. El rol `setup` sigue limitado por allowlist. El endurecimiento es **previo** al RBAC (capa login).

---

## J. Relación con runbook SETUP-USER-3

USER-3 cubre baja/sesiones/SQL; USER-4 cierra el hueco de **login con PIN temporal**. Checklist pre-exposición: USER-3 (deshabilitar setup) + USER-4 (no sesión con `must_change_password`).

---

## K. Qué NO se implementó

- Pantalla de cambio de PIN.
- Endpoint de rotación de PIN.
- SQL / migraciones.
- Login productivo fuera de `/api/proto/login`.
- Cambios en middleware más allá del flujo existente.

---

## L. Validaciones realizadas

Registrar en reporte de entrega:

- `node --experimental-strip-types lib/auth/internalLogin.selftest.ts`
- `node --experimental-strip-types app/lib/rbac.setup.selftest.ts`
- Selftests Constructor (discovery, verticals, runtime, sidebar)
- `npm run build`
- `git diff --check`

---

## M. Riesgos pendientes

- `/api/proto/login` sigue siendo **prototipo** (ruta y contrato `{ cedula, pin }`).
- Sin UI de cambio de PIN, operadores deben usar script/SQL para transición.
- Timing attack / user enumeration: se mantienen mensajes distintos 404 vs 401 (aceptable en herramienta interna; endurecer en login productivo).

---

## N. Próximos pasos

1. **SETUP-USER-5** (sugerido) — endpoint + UI mínima de cambio de PIN post-login.
2. Sustituir `/api/proto/login` por login interno definitivo en exposición cliente.
3. Actualizar `app/login/page.tsx` para mostrar `code` específico (opcional, bajo impacto).

---

## O. Confirmaciones de alcance

| Ítem | Estado |
|------|--------|
| Login bloquea inactivo | ✅ |
| Login bloquea `must_change_password` | ✅ |
| Sin SQL ejecutado | ✅ |
| Sin usuarios reales creados | ✅ |
| Sin datos tocados | ✅ |
| Sin PIN/hash en repo | ✅ |
| Casa Limpia / Ecuador | ❌ No tocados |
| Commit / push / deploy | ❌ No |

---

## Códigos de respuesta API

| code | HTTP | Sesión |
|------|------|--------|
| `LOGIN_OK` | 200 | Sí |
| `USER_NOT_FOUND` | 404 | No |
| `INVALID_CREDENTIALS` | 401 | No |
| `USER_INACTIVE` | 403 | No |
| `PASSWORD_CHANGE_REQUIRED` | 403 | No |
| `SETUP_PASSWORD_CHANGE_REQUIRED` | 403 | No |
| `ROLE_MISSING` / `ORPHAN_CREDENTIAL` | 403 | No |
