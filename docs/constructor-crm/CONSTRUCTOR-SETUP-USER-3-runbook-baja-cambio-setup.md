# CONSTRUCTOR-SETUP-USER-3 — Runbook de baja, cambio y deshabilitación del usuario setup

> **Tipo:** Runbook operativo + SQL manual revisable (sin ejecución automática).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-SETUP-USER-2` (commit `caded31`).
> **Alcance:** Documentar cómo retirar, rotar o reemplazar el usuario temporal `setup` antes de exponer una instancia clonada. NO se ejecutó SQL, no se crearon usuarios, no se tocaron datos, `.env.local`, `package_payload`, motores, Casa Limpia ni Ecuador. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El usuario `setup` (PIN inicial documentado `1234`, rol `setup`) existe para **instalación controlada** de instancias clonadas: Discovery, vertical, runtime read-only y cierre de snapshot. **No debe permanecer activo** cuando la instancia pase a exposición real.

Este runbook define cuatro escenarios operativos:

| Escenario | Objetivo |
|-----------|----------|
| **A** | Deshabilitar `setup` antes de exposición |
| **B** | Rotar PIN/hash (sustituir `1234` por credencial fuerte) |
| **C** | Reemplazar `setup` por usuario real del cliente |
| **D** | Auditar e invalidar sesiones activas de `setup` |

**SQL manual:** `docs/constructor-crm/sql/CONSTRUCTOR-SETUP-USER-3-disable-or-rotate-setup-user.sql` (solo plantilla; no ejecutada).

**Dictamen:** `GO` documental. Antes de `dev`/exposición en instancia clonada: aplicar escenario **A + D** como mínimo; preferir **C** cuando existan usuarios reales del cliente.

---

## B. Estado Git inicial

```
pwd:     /Users/danielodella/PROYECTOS/summer87-leads-v3
rama:    main @ caded31 [origin/main] feat(constructor): add SETUP-USER-2 manual setup user bootstrap
working tree: limpio (sin cambios previos a este documento)
```

Commits recientes relevantes:

```
caded31 feat(constructor): add SETUP-USER-2 manual setup user bootstrap
a8c7e7a docs(constructor): add SHELL-1 and SETUP-USER-1 planning docs
2db22cb docs(constructor): close RUNTIME-5 sidebar badge preview
```

---

## C. Diagnóstico del setup user actual

### C.1 Cómo se crea `setup` hoy

1. Ejecutar **manualmente** (fuera de build/CI):  
   `node scripts/bootstrap-setup-user.mjs`  
   (PIN por defecto `1234` o `SETUP_PIN` / `--pin`).
2. El script imprime SQL con hash bcrypt generado en runtime.
3. Alternativa: usar plantilla `docs/constructor-crm/sql/CONSTRUCTOR-SETUP-USER-2-seed-usuario-setup.sql` y reemplazar `<<SETUP_PIN_BCRYPT_HASH>>` con el hash del script.
4. Revisar y aplicar el SQL **a mano** en la base de la instancia clonada.

### C.2 Qué genera el script

- Rol `setup` en `public.roles` (idempotente).
- Fila en `public.app_users` (`is_active=true`, `role_id` → setup).
- Fila en `public.app_credentials` (`username='setup'`, `password_hash` bcrypt, `must_change_password=true`).

### C.3 Rol y RBAC

- Rol DB: `roles.name = 'setup'`.
- RBAC app: `app/lib/rbac.ts` — rol `setup` con **allowlist** `SETUP_ALLOWED_PREFIXES`:
  - `/admin/constructor`
  - `/admin/constructor-crm`
  - `/api/admin/constructor`
- **Default-deny** solo para `setup`; otros roles sin cambio.
- `PERMISSIONS_BY_ROLE.setup = []` → sin permisos operativos por clave.

### C.4 Login y sesiones

- Login prototipo: `POST /api/proto/login` (`cedula` = username, `pin`).
- Verificación: `verifyPassword` (bcrypt) contra `app_credentials.password_hash`.
- Sesión: `createSession` → `app_sessions.token_hash` + cookie `crm_session` (7 días).
- Middleware: valida cookie vía `getSessionUser` y **`is_active`** en `app_users`; aplica `canAccessPath`.

### C.5 `must_change_password`

- Columna en `app_credentials` (migración `036_internal_auth_tables.sql`, default `true`).
- El seed de SETUP-USER-2 fuerza `must_change_password=true`.
- **Brecha documentada:** `/api/proto/login` **no consulta** `must_change_password` ni bloquea login si sigue en `true`. La mitigación operativa es **deshabilitar/rotar/eliminar credencial** antes de exposición, no confiar solo en el flag.

### C.6 Cómo deshabilitar

| Mecanismo | Efecto |
|-----------|--------|
| `app_users.is_active = false` | Middleware redirige a `/403` |
| `DELETE` / renombrar `app_credentials` | Login falla (usuario no encontrado) |
| `DELETE` `app_sessions` del `user_id` | Cierra sesiones activas (cookie deja de validar) |
| Renombrar username a `setup_disabled` | Evita re-login accidental con `setup` |

### C.7 Cómo rotar PIN/hash

1. Generar nuevo hash: `SETUP_PIN='<fuerte>' node scripts/bootstrap-setup-user.mjs`.
2. Aplicar `UPDATE app_credentials` con placeholder `<<NEW_SETUP_PIN_BCRYPT_HASH>>` (ver SQL USER-3).
3. Invalidar sesiones (`DELETE FROM app_sessions` …).
4. Mantener `must_change_password=true` hasta política de login definitiva.

### C.8 Cómo reemplazar por usuario real

1. Crear `app_users` + `app_credentials` del administrador/gerente del cliente (rol distinto de `setup`, típicamente `admin` u operativo acordado).
2. Validar login y RBAC del usuario real en entorno de staging.
3. Ejecutar baja completa de `setup` (escenarios A + D).

### C.9 Riesgos si `setup` / `1234` sigue activo en exposición

- Credencial trivial conocida públicamente en documentación interna.
- Acceso a Constructor/Discovery y APIs asociadas (aunque no a leads operativos vía permisos).
- Sesiones de 7 días si no se invalidan.
- Bypass de Constructor en dev si `CONSTRUCTOR_AUTH_BYPASS` está mal configurado (ver `middleware.ts` + `constructorPrototypeFlags`).
- Confusión operativa: mezclar usuario de instalación con usuario cliente.

---

## D. Cuándo usar este runbook

| Momento | Acción |
|---------|--------|
| Tras completar Discovery + snapshot en instancia clonada | Preparar baja de `setup` |
| Antes de demo interna al cliente | Escenario **A + D** obligatorio |
| Antes de URL pública / producción | **A + D**; preferir **C** |
| Si se filtró que alguien usó `setup/1234` fuera de LAN | **B + D** inmediato, luego **A** |
| Tras crear usuarios reales del cliente | Escenario **C** |

---

## E. Escenario A — Deshabilitar setup

**Objetivo:** impedir cualquier login o sesión nueva de `setup` manteniendo trazabilidad en DB.

**Pasos operativos:**

1. Ejecutar consultas de diagnóstico (sección 0 del SQL USER-3).
2. Invalidar sesiones (`DELETE app_sessions` …) — escenario D.
3. `UPDATE app_users SET is_active = false` para el `user_id` de `setup`.
4. Opcional pero recomendado: `DELETE FROM app_credentials WHERE username = 'setup'` o renombrar a `setup_disabled`.
5. Verificación SQL final (sección E del SQL USER-3): 0 sesiones activas; sin credencial o `is_active=false`.

**No hacer:** dejar solo `must_change_password=true` sin baja de credencial/sesión.

---

## F. Escenario B — Cambiar PIN/hash

**Objetivo:** eliminar el PIN `1234` sin borrar aún el usuario (p. ej. ventana corta de soporte interno).

**Pasos:**

1. Generar hash con PIN fuerte vía `bootstrap-setup-user.mjs` (no commitear salida).
2. `UPDATE app_credentials` con `<<NEW_SETUP_PIN_BCRYPT_HASH>>`.
3. `must_change_password = true`.
4. Invalidar todas las sesiones de `setup`.
5. Registrar en runbook de instancia: fecha, operador, motivo.

**Antes de exposición real:** preferir escenario **A** o **C**; la rotación sola no sustituye la baja.

---

## G. Escenario C — Reemplazar por usuario real

**Objetivo:** transferir operación al cliente sin depender de `setup`.

**Pasos:**

1. Definir rol final (`admin`, `comercial`, etc.) según contrato de la instancia.
2. Insertar `app_users` + `app_credentials` del usuario real (placeholders en SQL USER-3; datos reales **fuera del repo**).
3. Probar login y rutas permitidas en staging (`APP_MODE` objetivo de la instancia).
4. Baja de `setup`: sesiones + `is_active=false` + eliminar/renombrar credencial.
5. Checklist post-exposición (sección K).

---

## H. Escenario D — Auditar sesiones activas

**Objetivo:** confirmar que ninguna cookie `crm_session` de `setup` sigue válida.

**Consultas:** ver SQL USER-3 sección D (listado + conteo).

**Invalidación:**

```sql
-- Plantilla (ejecutar manualmente en instancia; ver archivo SQL completo)
DELETE FROM public.app_sessions
WHERE user_id = (
  SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1
);
```

**Verificación:** `active_setup_sessions = 0`.

---

## I. SQL manual disponible

| Archivo | Uso |
|---------|-----|
| `sql/CONSTRUCTOR-SETUP-USER-2-seed-usuario-setup.sql` | Alta/idempotencia de `setup` (SETUP-USER-2) |
| `sql/CONSTRUCTOR-SETUP-USER-3-disable-or-rotate-setup-user.sql` | Baja, rotación, reemplazo, sesiones (este runbook) |

**Reglas:** sin PIN plano; sin hash real en repo; revisión humana; transacciones comentadas; rollback documentado en SQL.

---

## J. Checklist antes de exposición

- [ ] Discovery/snapshot cerrado o congelado según política de entrega.
- [ ] Usuarios reales del cliente creados y probados (si aplica escenario C).
- [ ] Consultas diagnóstico `setup` ejecutadas y archivadas (sin pegar hashes en tickets públicos).
- [ ] Sesiones activas de `setup` = 0.
- [ ] `setup` deshabilitado (`is_active=false`) y/o credencial eliminada/renombrada.
- [ ] PIN `1234` ya no válido (hash rotado o credencial borrada).
- [ ] `APP_MODE` / flags de instancia revisados (no `constructor_base` en cliente final si corresponde `client_crm`).
- [ ] `CONSTRUCTOR_AUTH_BYPASS` desactivado en entorno expuesto.
- [ ] Evidencia en runbook de instancia: quién ejecutó SQL, cuándo, en qué base.

---

## K. Checklist después de exposición

- [ ] Login con usuario real del cliente OK.
- [ ] Intento de login `setup` falla (404/401 o usuario inactivo).
- [ ] Rutas Constructor bloqueadas para roles cliente si aplica (`client_crm`).
- [ ] No hay sesiones `setup` en `app_sessions` (re-auditar a 24–48 h).
- [ ] Documentación de entrega al cliente **no** menciona `setup/1234`.
- [ ] Backup de instancia post-baja archivado.

---

## L. Riesgos de seguridad

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `setup/1234` activo en URL pública | Crítico | A + D antes de DNS |
| Sesiones de 7 días no invalidadas | Alto | Escenario D siempre con A |
| `must_change_password` no enforced en login | Medio | No confiar en el flag; baja credencial |
| SQL aplicado en base equivocada | Alto | Confirmar connection string / nombre proyecto |
| Hash generado commiteado por error | Alto | Solo stdout local; placeholder en plantillas |
| Re-seed accidental de `setup` | Medio | Renombrar a `setup_disabled`; checklist |

---

## M. Relación con clonación de nuevos CRM

Flujo recomendado instancia clonada:

1. Clonar repo/base → `SETUP-USER-2` (crear `setup` manual).
2. Configurar Discovery/vertical/runtime con `setup`.
3. **SETUP-USER-3** (este runbook) antes de entregar al cliente.
4. Operación diaria solo con usuarios reales.

---

## N. Relación con Discovery

`setup` es el actor esperado durante Discovery (8b/8d). Al cerrar snapshot y validar vertical, inicia la ventana de **baja de `setup`** — no prolongar más allá de staging interno.

---

## O. Relación con Runtime

`setup` puede ver paneles RUNTIME read-only; no activa motores ni escribe `package_payload`. La baja de `setup` no afecta la configuración runtime ya persistida en snapshot/DB de la instancia.

---

## P. Relación con package_payload

Sin relación operativa: `setup` no debe generar ni aprobar paquetes instalables. La baja de `setup` es independiente del ciclo `package_payload`.

---

## Q. Próximas fases

1. **SETUP-USER-4** (sugerido) — endurecer login: validar `is_active`, `must_change_password`, y retirar dependencia de `/api/proto/login` en exposición.
2. Integrar pasos A–D en runbook de clonación Casa Limpia / generador de instancias (sin tocar esos repos en esta fase).
3. Opcional: script `disable-setup-user.mjs` que solo imprima SQL de baja (simétrico al bootstrap); solo si el equipo lo pide — **no implementado en USER-3**.

---

## R. Confirmaciones de alcance

| Ítem | Estado |
|------|--------|
| Runbook baja/cambio/deshabilitación | ✅ Este documento |
| SQL manual revisable USER-3 | ✅ Creado, no ejecutado |
| Código de aplicación modificado | ❌ No |
| SQL ejecutado | ❌ No |
| Usuarios reales creados | ❌ No |
| Datos tocados | ❌ No |
| PIN/hash en repo | ❌ No (solo placeholders) |
| `.env.local` | ❌ No tocado |
| Casa Limpia CRM / Ecuador | ❌ No tocados |
| `package_payload` / motores / CRM operativo | ❌ No |
| Deploy / commit / push | ❌ No |

---

## Validaciones de esta fase (referencia)

Registrar en el reporte de entrega de USER-3 los resultados de:

- `node --experimental-strip-types app/lib/rbac.setup.selftest.ts`
- Selftests Constructor (discovery, verticals, runtime, sidebar)
- `npm run build` (EXIT)
- `git diff --check`
- `git status --short` final
