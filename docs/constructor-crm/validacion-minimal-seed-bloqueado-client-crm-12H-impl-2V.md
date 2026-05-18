# Validación Minimal Seed Bloqueado Client CRM 12H-impl-2V — Constructor CRM Summer87

**Versión:** Fase 12H-impl-2V (validación manual — documental)  
**Relacionado con:** `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `docs/constructor-crm/validacion-reset-db-bloqueado-client-crm-12H-impl-1V.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `lib/admin/systemDangerAccess.ts`, `app/api/admin/setup/minimal-seed/route.ts`

**Estado:** validación manual registrada. **No** incluye ejecución de seed real ni despliegue en producción.

**Commit de implementación:** `75cee92` — *Block minimal seed in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó que el endpoint **`/api/admin/setup/minimal-seed`** (métodos **GET** y **POST**) queda **bloqueado por `APP_MODE=client_crm`**, devolviendo **403** con código `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` **antes** de crear cliente Supabase, autenticación, lecturas de `public_config` o cualquier insert/upsert de datos demo.

Esta validación es el **segundo ítem** de implementación de la política **12H** (system_danger), después de **reset-db** (**12H-impl-1V**), y reutiliza el mismo helper `guardSystemDangerByMode()`.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper** | `lib/admin/systemDangerAccess.ts` |
| **Función** | `guardSystemDangerByMode()` |
| **Endpoint** | `GET` y `POST` `/api/admin/setup/minimal-seed` |
| **Commit** | `75cee92` |
| **Error JSON** | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| **Status HTTP** | **403** |
| **Mensaje** | `System danger actions are not available in client CRM mode.` |

---

## 4. Validación con sesión en client_crm

### Entorno temporal

Variables de sesión (no se editó `.env.local`):

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**Menú:** reducido correctamente (Leads, Agenda, Reportes) — coherente con **12D**.

### Pruebas desde consola del navegador (usuario logueado)

**GET — estado setup (solo lectura en constructor_base):**

```javascript
fetch("/api/admin/setup/minimal-seed")
  .then(async (r) => ({ status: r.status, body: await r.json() }))
  .then(console.log);
```

**POST — ejecución de seed (destructivo en constructor_base):**

```javascript
fetch("/api/admin/setup/minimal-seed", { method: "POST" })
  .then(async (r) => ({ status: r.status, body: await r.json() }))
  .then(console.log);
```

### Resultado observado

| Prueba | status | body.error | Seed / BD |
|--------|--------|------------|-----------|
| **GET** | `403` | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | No ejecutado |
| **POST** | `403` | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | No ejecutado |

**Mensaje común:** `System danger actions are not available in client CRM mode.`

- No hubo **inserts** ni **upserts** en tablas demo (`rubros`, `ai_*`, `agency_*`, etc.).
- No se marcó `setup_completed` en `public_config`.
- No se tocó Supabase de forma observable desde la prueba (el handler terminó antes de `supabaseAdmin()`).

---

## 5. Lectura técnica

Orden de ejecución en `app/api/admin/setup/minimal-seed/route.ts` tras `75cee92` (GET y POST):

1. `guardSystemDangerByMode()` → en `client_crm` retorna **403** y termina
2. `supabaseAdmin()` — no alcanzado
3. `requireSetupAccess()` — no alcanzado
4. `loadSetupCompleted()` / `getOrCreate*` / `markSetupCompleted()` — no alcanzados

**Por qué bloquear también GET en client_crm:** evita exponer al cliente el flag `setup_completed` o indicios de inicialización interna; en clones productivos el setup mínimo demo no aplica.

**Conclusión:** el endpoint queda protegido por **modo de instancia** en `client_crm` para ambos verbos HTTP.

---

## 6. Retorno a modo normal

| Paso | Resultado |
|------|-----------|
| `npm run dev` sin `APP_MODE` en sesión | ✅ |
| `/admin/dashboard` | Carga correctamente |
| Menú lateral | Completo restaurado |
| Modo efectivo | `constructor_base` (default) |

Comportamiento de **base madre** coherente con fases anteriores. **No** se revalidó GET/POST minimal-seed en `constructor_base` en esta fase (ver §7).

---

## 7. Qué NO se validó

- Ejecución de **seed real** (POST con datos demo en BD).
- **POST** o **GET** minimal-seed en **`constructor_base`** con permisos (regresión explícita).
- Usuario **cliente final** dedicado (prueba con sesión Summer87 en dev).
- Entorno de **producción** o hosting desplegado.
- **Clon / tenant** productivo separado.
- Persistencia de variables en **`.env.local`** (solo sesión temporal).
- Otras APIs **system_danger** (`modules/initialize`, etc.).
- **Middleware / proxy** global.
- UI en `/admin/configuracion` que invoca minimal-seed (sigue visible en constructor_base; no probada en client_crm sin ítem menú).

---

## 8. Riesgos residuales

| Riesgo | Estado |
|--------|--------|
| `POST /api/admin/modules/initialize` | Pendiente **12H-impl-3** |
| `PATCH /api/admin/config/portal` con keys internas | Pendiente **12H-impl-4** |
| Roles / usuarios / `set-role` | Pendiente **12I** |
| minimal-seed en **constructor_base** | Sigue disponible para inicialización **interna**; requiere permisos `config.update` / `config.admin` |
| Runbook para seeds internos | Pendiente documentación operativa |
| Llamada desde UI si URL de config es conocida | Menú puede ocultar config en client_crm; API ya bloqueada |

---

## 9. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **minimal-seed** en `client_crm` | ✅ Bloqueado GET/POST (403) — esta validación |
| **reset-db** en `client_crm` | ✅ Bloqueado (12H-impl-1V) |
| Constructor UI | ✅ Bloqueado (12D) |
| Constructor API | ✅ Bloqueado (12F) |
| Menú `client_crm` + allowlist | ✅ Validado (12D) |
| **Repo** | Limpio tras commit `75cee92` |
| **Datos / Supabase** | Sin cambios en esta fase documental |

---

## 10. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12H-impl-3** | Revisar / bloquear `modules/initialize` en `client_crm` |
| **12H-impl-4** | Sanitizar `portal_config` — no reactivar internal / system_danger |
| **12I** | Roles cliente vs Summer87 |
| **12J** | Validación en clon / staging real |

---

## 11. Decisión actual

> **En 12H-impl-2V solo se documenta la validación manual.**  
> **No se modifica código ni configuración persistente.**

---

## 12. Confirmación de alcance (fase 12H-impl-2V documental)

- ✅ Validación manual GET/POST minimal-seed registrada  
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

*Documento 12H-impl-2V — Validación minimal-seed en client_crm. Política: 12H. Par: 12H-impl-1V (reset-db). Siguiente: 12H-impl-3 (modules/initialize).*
