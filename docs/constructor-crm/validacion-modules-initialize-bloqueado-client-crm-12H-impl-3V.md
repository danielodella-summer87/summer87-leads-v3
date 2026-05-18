# Validación Modules Initialize Bloqueado Client CRM 12H-impl-3V — Constructor CRM Summer87

**Versión:** Fase 12H-impl-3V (validación manual — documental)  
**Relacionado con:** `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `docs/constructor-crm/validacion-reset-db-bloqueado-client-crm-12H-impl-1V.md`, `docs/constructor-crm/validacion-minimal-seed-bloqueado-client-crm-12H-impl-2V.md`, `lib/admin/systemDangerAccess.ts`, `app/api/admin/modules/initialize/route.ts`

**Estado:** validación manual registrada. **No** incluye ejecución de `initializeModule` real ni despliegue en producción.

**Commit de implementación:** `3669788` — *Block module initialize in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó que el endpoint **`POST /api/admin/modules/initialize`** queda **bloqueado por `APP_MODE=client_crm`**, devolviendo **403** con código `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` **antes** de leer el body, validar el campo `module`, comprobar permisos, crear cliente Supabase o llamar a `initializeModule()`.

Este es el **tercer bloqueo system_danger incremental** documentado, después de:

| Fase | Endpoint |
|------|----------|
| **12H-impl-1V** | `POST /api/admin/config/reset-db` |
| **12H-impl-2V** | `GET` / `POST` `/api/admin/setup/minimal-seed` |
| **12H-impl-3V** (esta) | `POST` `/api/admin/modules/initialize` |

Todos reutilizan `guardSystemDangerByMode()` en `lib/admin/systemDangerAccess.ts`.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper** | `lib/admin/systemDangerAccess.ts` |
| **Función** | `guardSystemDangerByMode()` |
| **Endpoint** | `POST /api/admin/modules/initialize` |
| **Commit** | `3669788` |
| **Error JSON** | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| **Status HTTP** | **403** |
| **Mensaje** | `System danger actions are not available in client CRM mode.` |

**Nota:** el route handler solo exporta **POST** (no hay GET en este archivo).

---

## 4. Validación con sesión en client_crm

### Entorno temporal

Variables de sesión (no se editó `.env.local`):

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**Menú:** reducido correctamente (Leads, Agenda, Reportes) — coherente con **12D**.

### Prueba desde consola del navegador (usuario logueado)

```javascript
fetch("/api/admin/modules/initialize", { method: "POST" })
  .then(async (r) => ({ status: r.status, body: await r.json() }))
  .then(console.log);
```

### Resultado observado

| Campo | Valor |
|-------|--------|
| **status** | `403` |
| **body.error** | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| **body.message** | `System danger actions are not available in client CRM mode.` |
| **Body `module`** | No procesado (guard previo) |
| **initializeModule()** | No ejecutado |
| **Supabase** | No tocado de forma observable desde la prueba |

---

## 5. Lectura técnica

Orden de ejecución en `app/api/admin/modules/initialize/route.ts` tras `3669788`:

1. `guardSystemDangerByMode()` → en `client_crm` retorna **403** y termina
2. `req.json()` — no alcanzado
3. `parseModule(body?.module)` — no alcanzado
4. `allowDevOrRequire()` / permisos — no alcanzados
5. `supabaseAdmin()` + `initializeModule(sb, moduleId, { seed })` — no alcanzados

**Conclusión:** no hubo **writes** ni inicialización de módulos; el endpoint queda protegido por **modo de instancia** en `client_crm`.

**Uso en constructor_base:** la UI (`/admin/ia`, detalle de lead, etc.) puede seguir llamando a este endpoint en desarrollo/madre cuando el guard devuelve `null`; no se revalidó en esta fase (ver §7).

---

## 6. Retorno a modo normal

| Paso | Resultado |
|------|-----------|
| `npm run dev` sin `APP_MODE` en sesión | ✅ |
| `/admin/dashboard` | Carga correctamente |
| Menú lateral | Completo restaurado |
| Modo efectivo | `constructor_base` (default) |

Comportamiento de **base madre** coherente con fases anteriores.

---

## 7. Qué NO se validó

- Ejecución de **initialize real** con `module` válido y `seed: true`.
- **POST** en **`constructor_base`** con permisos (regresión explícita).
- Variantes de body (`module` inválido vs válido) en `client_crm` (irrelevante tras 403 temprano).
- Usuario **cliente final** dedicado (prueba con sesión Summer87 en dev).
- Entorno de **producción** o clon/tenant productivo.
- Persistencia de variables en **`.env.local`** (solo sesión temporal).
- Otras APIs **system_danger** pendientes de política 12H (p. ej. `portal` PATCH).
- **Middleware / proxy** global.
- Endpoint hermano **`GET /api/admin/modules/readiness`** (fuera de alcance de este commit).

---

## 8. Riesgos residuales

| Riesgo | Estado |
|--------|--------|
| `PATCH /api/admin/config/portal` reintroduce keys internas | Pendiente **12H-impl-4** |
| `set-role`, `toggle-permission`, invites staff | Pendiente **12I** / **12L** |
| `modules/initialize` en **constructor_base** | Sigue disponible para inicialización **interna**; en dev puede bypass permisos vía `NODE_ENV !== "production"` |
| Runbook operaciones internas (reset, seed, initialize) | Pendiente **12K** |
| Llamada directa a API si URL conocida | Bloqueada en `client_crm`; menú no sustituye revisión de otras rutas |

---

## 9. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **modules/initialize** en `client_crm` | ✅ Bloqueado POST (403) — esta validación |
| **minimal-seed** en `client_crm` | ✅ Bloqueado (12H-impl-2V) |
| **reset-db** en `client_crm` | ✅ Bloqueado (12H-impl-1V) |
| Constructor UI | ✅ Bloqueado (12D) |
| Constructor API | ✅ Bloqueado (12F) |
| Menú `client_crm` + allowlist | ✅ Validado (12D) |
| **Repo** | Limpio tras commit `3669788` |
| **Datos / Supabase** | Sin cambios en esta fase documental |

---

## 10. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12H-impl-4** | Sanitizar `portal_config` — no reactivar internal / system_danger en `client_crm` |
| **12I** | Roles cliente vs Summer87 |
| **12J** | Validación en clon / staging real |
| **12K** | Runbook de instalación `client_crm` |
| **12L** | Revisión APIs usuarios / roles / permisos |

---

## 11. Decisión actual

> **En 12H-impl-3V solo se documenta la validación manual.**  
> **No se modifica código ni configuración persistente.**

---

## 12. Confirmación de alcance (fase 12H-impl-3V documental)

- ✅ Validación manual POST modules/initialize registrada  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12H-impl-3V — Validación modules/initialize en client_crm. Política: 12H. Serie: 12H-impl-1V (reset-db), 12H-impl-2V (minimal-seed). Siguiente: 12H-impl-4 (portal_config).*
