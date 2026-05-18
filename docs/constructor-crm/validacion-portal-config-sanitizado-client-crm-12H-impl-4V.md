# Validación Portal Config Sanitizado Client CRM 12H-impl-4V — Constructor CRM Summer87

**Versión:** Fase 12H-impl-4V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `docs/constructor-crm/checklist-env-clon-client-crm-12G.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `lib/admin/adminSidebarModules.ts`, `app/api/admin/config/portal/route.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye PATCH manual contra `portal_config` en base madre.

**Commit de implementación:** `c73cd83` — *Sanitize portal sidebar modules in client CRM mode*

---

## 2. Resumen ejecutivo

Se implementó y validó — mediante **revisión de diff**, lectura de helpers y **`npm run build` exitoso** — la **sanitización server-side** de `sidebar_modules` en **`PATCH /api/admin/config/portal`** cuando **`APP_MODE=client_crm`**.

Complementa el filtrado de menú en runtime (12D) y los bloqueos system_danger en APIs (12H-impl-1V a 3V): evita que un PATCH a `portal_config` **persista** módulos internos, destructivos o rutas Constructor aunque el cliente intente reintroducirlos en JSON.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Endpoint** | `PATCH /api/admin/config/portal` |
| **Helper** | `sanitizeSidebarModulesForClientCrmPersist()` |
| **Archivo helper** | `lib/admin/adminSidebarModules.ts` |
| **Integración** | `app/api/admin/config/portal/route.ts` — `isClientCrmMode()` |
| **Modo afectado** | `client_crm` únicamente |
| **Commit** | `c73cd83` |
| **Build** | ✅ OK |

---

## 4. Qué hace la sanitización

En **`client_crm`**, si el body del PATCH incluye **`sidebar_modules`**, el array se **limpia antes de persistir** en `public.config` (`key = portal_config`).

### Pipeline

1. `sanitizeSidebarModulesForPersist()` — keys conocidas, campos acotados (igual que antes).
2. `sanitizeSidebarModulesForClientCrmPersist()` — filtro adicional solo en `client_crm`.

### Categorías descartadas (`getAdminSidebarModuleCategory`)

| Categoría | Acción |
|-----------|--------|
| `internal_constructor` | Descartar |
| `internal_installer` | Descartar |
| `internal_bcr` | Descartar |
| `system_danger` | Descartar |

### Patrones key/href descartados (conservador)

| Patrón | Ejemplos |
|--------|----------|
| Constructor | `constructor`, `/admin/constructor-crm`, `/admin/constructor` |
| Instalador / paquetes | `installer`, `installable`, `paquete`, `/paquetes` |
| BCR | `bcr`, `conocimiento`, `base-conocimiento` |
| Peligro | `reset`, `reset-db`, `danger`, `destructive`, `system_danger` |

### Categorías conservadas

- `operational_crm`
- `operational_reports`
- `operational_config`
- `support`

Si hay **duda**, el módulo se **descarta** en `client_crm`.

### Respuesta PATCH opcional

Si se eliminan módulos respecto al sanitize base, la respuesta puede incluir **`clientCrmSanitized: true`** (junto a `data`), sin romper el contrato principal.

---

## 5. Qué NO cambia

| Área | Comportamiento |
|------|----------------|
| **GET** `/api/admin/config/portal` | Sin cambio de política en esta fase |
| **constructor_base** | Solo `sanitizeSidebarModulesForPersist()` |
| **AdminShell** | Sin cambios |
| **UI** `/admin/configuracion/modulos-menu` | Sin cambios |
| **Middleware / proxy** | Sin cambios |
| **API portal completa** | No bloqueada; solo sanitiza escritura de `sidebar_modules` en `client_crm` |
| **RBAC / roles** | Sin sustitución |
| **Datos en BD** | No se alteran hasta que alguien ejecute un PATCH |

---

## 6. Revisión de constructor_base

| Condición | Comportamiento |
|-----------|----------------|
| Sin `APP_MODE` en env | `getAppMode()` → **`constructor_base`** |
| PATCH con `sidebar_modules` | `sanitizeSidebarModulesForPersist()` únicamente |
| Sanitize client_crm | **No** se aplica |

Esto preserva el uso **interno Summer87** en base madre y entornos de fábrica.

---

## 7. Validación realizada

| Actividad | Resultado |
|-----------|-----------|
| Revisión **git diff** de `portal/route.ts` y `adminSidebarModules.ts` | ✅ Coherente con diseño 12H |
| Confirmación `isClientCrmMode()` en PATCH | ✅ |
| Confirmación descarte internal_* / system_danger | ✅ Por código |
| **`npm run build`** | ✅ Exitoso |
| **PATCH manual** a `portal_config` | ❌ No ejecutado (evitar escritura en base madre) |
| **SQL manual** | ❌ No ejecutado |
| **Supabase directo** | ❌ No tocado |
| **Cambios de datos** | ❌ Ninguno |

---

## 8. Validación manual pendiente

La prueba con **PATCH real** queda **pendiente** para **staging** o **clon `client_crm`**, porque en **summer87-leads-v3 (base madre)** un PATCH podría **modificar** `portal_config` en producción/desarrollo compartido.

### Escenario propuesto (staging)

**Entorno:**

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**PATCH de prueba (conceptual):**

```json
{
  "sidebar_modules": [
    {
      "key": "constructor",
      "label": "Constructor",
      "href": "/admin/constructor-crm",
      "icon": "🏗️",
      "status": "activo"
    },
    {
      "key": "leads87",
      "label": "Summer87 Leads",
      "href": "/admin/leads87",
      "icon": "🎯",
      "status": "activo"
    }
  ]
}
```

### Resultado esperado

| Verificación | Esperado |
|--------------|----------|
| `constructor` en respuesta persistida | **No** |
| `leads87` | **Sí** (si key permitida) |
| `clientCrmSanitized` | `true` si se descartó al menos un módulo |
| BD | Sin `internal_*` / `system_danger` reintroducidos por este PATCH |

**Nota:** `GET` posterior puede seguir devolviendo **legacy** en `sidebar_modules` hasta un PATCH que limpie o migración; esta fase no sanea lectura automáticamente.

---

## 9. Riesgos residuales

| Riesgo | Mitigación / fase |
|--------|-------------------|
| Sin PATCH real en staging aún | **12M** — validación staging |
| `portal_config` legacy con keys internas | Migración o PATCH controlado en prep |
| UI `modulos-menu` accesible por URL | Menú filtrado en runtime; guard al guardar en `client_crm` |
| Roles / permisos | **12I** |
| APIs usuarios / `set-role` | **12L** |
| Separación config operativa vs interna | Producto + **12J** |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| Constructor UI | ✅ Bloqueado en `client_crm` (12D) |
| Constructor API | ✅ Bloqueado (12F) |
| reset-db | ✅ Bloqueado (12H-impl-1V) |
| minimal-seed | ✅ Bloqueado (12H-impl-2V) |
| modules/initialize | ✅ Bloqueado (12H-impl-3V) |
| **portal_config.sidebar_modules** PATCH | ✅ Sanitizado en `client_crm` (c73cd83) |
| Menú runtime + allowlist | ✅ Validado (12D) |
| **Build** | ✅ OK |
| **Repo** | Limpio tras commit `c73cd83` |
| **Datos** | Sin cambios en esta validación documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I** | Roles cliente vs roles Summer87 |
| **12J** | Validación clon / staging real |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Auditoría APIs usuarios / roles |
| **12M** | Validación PATCH `portal_config` en staging |

---

## 12. Decisión actual

> **En 12H-impl-4V solo se documenta la validación por revisión de código y build.**  
> **No se ejecuta PATCH real contra `portal_config`.**

---

## 13. Confirmación de alcance (fase 12H-impl-4V documental)

- ✅ Validación por diff + build documentada  
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

*Documento 12H-impl-4V — Sanitización portal_config en client_crm. Política: 12H. Serie system_danger: 12H-impl-1V … 3V. Siguiente validación recomendada: 12M (PATCH en staging).*
