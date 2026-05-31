# CONSTRUCTOR-SETUP-USER-2 — Bootstrap manual del usuario setup + RBAC mínimo de instalación

> **Tipo:** Implementación controlada (script + SQL revisable + RBAC mínimo + selftest). Sin ejecutar SQL ni crear usuarios.
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-SETUP-USER-1-politica-usuario-setup-instancias-clonadas.md` (commit `a8c7e7a`).
> **Alcance:** Solución manual y reversible para preparar el usuario `setup` en instancias clonadas. NO se ejecutó SQL, no se crearon usuarios, no se tocaron datos, `.env.local`, `package_payload`, motores, Casa Limpia ni Ecuador. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó lo mínimo y seguro para que una instancia clonada pueda tener el usuario de instalación `setup` (PIN inicial `1234`), sin ejecutar SQL ni crear datos:

1. **Extensión RBAC mínima** (`app/lib/rbac.ts`): nuevo rol `setup` con **allowlist estricta** (default-deny) que solo permite Constructor/Discovery (`/admin/constructor*`, `/api/admin/constructor*`). Aditivo: los roles existentes no cambian.
2. **Script de bootstrap manual** (`scripts/bootstrap-setup-user.mjs`): genera el **hash bcrypt** del PIN e imprime el SQL listo para revisar/aplicar a mano. No se conecta a DB, no ejecuta nada, no escribe en disco.
3. **SQL template revisable** (`docs/constructor-crm/sql/...sql`): plantilla con placeholder `<<SETUP_PIN_BCRYPT_HASH>>` (sin hash ni PIN commiteados).
4. **Selftest** (`app/lib/rbac.setup.selftest.ts`): verifica el rol `setup` y la no-regresión de roles existentes.

`setup/1234` es **temporal/de instalación** (`must_change_password=true`), no usuario operativo final, y debe **deshabilitarse o reemplazarse antes de exponer** el CRM. Build EXIT 0; selftests: RBAC **21/21**, Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**.

---

## B. Diagnóstico auth/RBAC real

- **Tablas:** `app_users` (is_active, role_id→`roles.name`), `app_credentials` (036: username único, `password_hash` bcrypt, `must_change_password` default true), `app_sessions` (token_hash). RBAC: `roles`/`permissions`/`role_permissions` (028/029).
- **Validación username/PIN:** `/api/proto/login` (prototipo) → `verifyPassword(pin, cred.password_hash)` (bcrypt) → `createSession` (cookie `app_sessions`). Middleware valida la cookie (`getSessionUser`) + `canAccessPath(role, pathname)`.
- **Hash:** bcrypt rounds 10 (`lib/auth/internalAuth.hashPassword`).
- **Asignación de rol:** `app_users.role_id` → `roles.name`; `app/lib/rbac.ts` lo normaliza.
- **Quién entra a `/admin/constructor*` hoy:** solo `admin` (`PATH_ROLES`: `{ prefix:"/admin/constructor", allowed:["admin"] }`).
- **Rol setup/installer:** no existía.
- **Modelo de acceso:** `canAccessPath` es **default-allow** (sin regla → permite). Por eso un rol bloqueado requiere una rama **default-deny** propia (allowlist) — lo que se implementó para `setup`.

---

## C. Archivos creados/modificados

**Modificados:**
- `app/lib/rbac.ts` — rol `setup` + `SETUP_ALLOWED_PREFIXES` + rama allowlist en `canAccessPath` + labels/permisos vacíos.

**Creados:**
- `scripts/bootstrap-setup-user.mjs` — generador manual (hash + SQL por stdout).
- `docs/constructor-crm/sql/CONSTRUCTOR-SETUP-USER-2-seed-usuario-setup.sql` — SQL template revisable (placeholder, no ejecutado).
- `app/lib/rbac.setup.selftest.ts` — selftest del rol `setup` (excluido del build por `**/*.selftest.ts`).
- `docs/constructor-crm/CONSTRUCTOR-SETUP-USER-2-bootstrap-manual-usuario-setup.md` — este documento.

**No tocado:** `middleware.ts`, login/auth runtime, `.env.local`, datos, Supabase, `package_payload`, motores, UI operativa, Casa Limpia, Ecuador.

---

## D. Decisión implementada

Combinación de las opciones permitidas: **C (helper de hash) + A/B (script que imprime SQL) + B (SQL template revisable) + RBAC mínimo + D (documentación)**. No se eligió endpoint (nueva superficie de ataque) ni auto-seed en build (credencial persistente por defecto).

---

## E. Cómo se crea el usuario setup

1. `node scripts/bootstrap-setup-user.mjs` (PIN 1234 por defecto; o `SETUP_PIN=XXXX node scripts/bootstrap-setup-user.mjs`).
2. El script imprime el SQL con el **hash bcrypt** ya incrustado.
3. **Revisar** ese SQL y **aplicarlo manualmente** en la instancia clonada (psql / consola Supabase). Alternativa: usar la plantilla `docs/.../sql/...sql` y reemplazar `<<SETUP_PIN_BCRYPT_HASH>>` por el hash del script.
4. El usuario queda `is_active=true`, rol `setup`, `must_change_password=true`.

---

## F. Cómo se genera/usa el hash

`bcrypt.hashSync(pin, 10)` (mismo rounds que `internalAuth`). El hash es no determinístico (salt aleatorio): cada instancia obtiene el suyo. **Nunca** se commite el hash ni el PIN; el script lo genera en runtime y la plantilla usa placeholder.

---

## G. Qué permisos tiene

- Acceso por **ruta** (allowlist): `/admin/constructor`, `/admin/constructor-crm` (+ subrutas), `/api/admin/constructor` (+ subrutas).
- Funcionalmente: completar/revisar Discovery, confirmar `vertical_key`, ver paneles runtime read-only, cerrar el snapshot "Terminé".
- Por **permiso**: ninguno (`PERMISSIONS_BY_ROLE.setup = []`).

---

## H. Qué permisos NO tiene

- Cualquier ruta fuera de la allowlist → **denegada** (leads, clientes, socios, agenda, configuración, ia, dashboard, operaciones, APIs operativas).
- Sin permisos operativos (`hasPermission` → false para todo).
- No puede activar motores, generar `package_payload`, crear CRM operativo ni administrar usuarios finales.

---

## I. Cómo se aplica manualmente

Revisar el SQL generado y ejecutarlo a mano contra la base de la instancia clonada (NO desde este repo, NO automático). El SQL es idempotente (ON CONFLICT / DO block) y trae el bloque de baja comentado.

---

## J. Cómo se deshabilita o reemplaza

Antes de exponer el CRM (bloques comentados en el SQL):
- `UPDATE public.app_users SET is_active=false WHERE id = (SELECT user_id FROM public.app_credentials WHERE username='setup');`
- o `DELETE FROM public.app_credentials WHERE username='setup';`
- o reemplazar por usuarios reales del cliente (y quitar el rol `setup`).

---

## K. Riesgos de seguridad

- **PIN 1234** trivial → solo local/instalación; `must_change_password=true`; deshabilitar/reemplazar antes de exposición.
- `/api/proto/login` es prototipo → endurecer/reemplazar para producción (fase futura).
- El rol `setup` amplía el RBAC: la allowlist es estricta (default-deny) y cubierta por selftest, pero cualquier ampliación futura de `SETUP_ALLOWED_PREFIXES` debe revisarse.
- No commitear hashes/PIN; no auto-seed en build.

---

## L. Relación con clonación de nuevos CRM

Parte del runbook de clonación: tras copiar la base a `nuevo-crm-cliente`, se corre el script, se aplica el SQL manual, y el usuario `setup` permite la configuración inicial (Discovery → vertical → runtime → validación) antes de que existan usuarios reales.

## M. Relación con Discovery

El rol `setup` accede exactamente a la superficie del Discovery/Constructor; es quien completa y confirma el Discovery y cierra el snapshot.

## N. Relación con Runtime

Puede ver los paneles runtime read-only (RUNTIME-2/4/5); no activa nada (compuertas `can_*` siguen en `false`).

---

## O. Validaciones realizadas

- `node scripts/bootstrap-setup-user.mjs` → genera hash bcrypt + imprime SQL; no se conecta a DB.
- Selftests: RBAC setup **21/21**, Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**.
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.

---

## P. Próximos pasos

1. **CONSTRUCTOR-SETUP-USER-3** — runbook de baja/cambio del usuario setup antes de exponer (checklist de entrega) y endurecimiento del login (`/api/proto/login` → login interno definitivo).
2. Integrar el paso del script al runbook de clonación.

---

## Q. Confirmaciones de alcance

- ✅ Flujo manual seguro implementado (script + SQL revisable + RBAC mínimo); nada ejecutado contra DB.
- ✅ `setup/1234` temporal de instalación, no producción; sin PIN/hash commiteado.
- ✅ SQL queda como archivo/plantilla revisable, no ejecutado.
- ✅ RBAC mínimo y limitado (allowlist default-deny solo para `setup`); roles existentes sin cambios (selftest).
- ✅ NO se ejecutó SQL · NO se crearon usuarios reales · NO se tocaron datos.
- ✅ NO se tocó `.env.local` · NO se tocó `package_payload` · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador.
- ✅ Build OK · Selftests OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
