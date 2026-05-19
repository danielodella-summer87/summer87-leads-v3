# Validación Agenda Socio/Socios Client CRM Pickup 4x4 12U-3V — Constructor CRM Summer87

**Versión:** 12U-3 — neutralizar etiquetas y opciones «Socio/Socios» en Agenda (`client_crm`)  
**Auditoría origen:** `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md`  
**Fases previas:** 12U-1 (Iniciativa), 12U-2 (tabs Técnico/Consultor + CTAs)

**Estado validación:** build local **OK**; validación visual Vercel **pendiente** (checklist §10).

---

## 1. Resumen del cambio

En `APP_MODE=client_crm`, la Agenda deja de mostrar la terminología heredada **Socio/Socios** en la UI (selector de dueño al crear actividad, filtro «Dueño», badge de tipo en tarjetas).

| Estrategia | Detalle |
|------------|---------|
| **Detección modo** | `app/admin/agenda/layout.tsx` + `useLeadsClientCrmMode()` (mismo patrón que ficha leads) |
| **Crear actividad** | Solo opción **Lead**; se oculta `<option value="socio">` |
| **Filtro Dueño** | Solo **Todos** y **Leads**; se oculta filtro por socio |
| **Filas existentes** | Si `owner_type === "socio"`, badge **CLIENTE:** (no «SOCIO:»); `getOwnerLabel` → «Cliente» |
| **Datos / API** | Sin cambios: `owner_type`, `socio_id` y payloads intactos |

---

## 2. Relación con auditoría 12U

La auditoría 12U (§ Agenda, quick win **12U-3**) señalaba `OwnerType = "lead" | "socio"` y labels desde `usePersonalizacion()` con default **Socio/Socios**, desalineados con Pickup 4x4 (leads y actividades comerciales, sin módulo socios en demo).

---

## 3. Relación con 12U-1 y 12U-2

| Fase | Alcance | Interacción |
|------|---------|-------------|
| **12U-1** | Iniciativa en ficha lead | Sin solapamiento |
| **12U-2** | Tabs Técnico/Consultor + CTAs Consultor | Sin solapamiento |
| **12U-3** | Agenda — Socio/Socios | Solo `app/admin/agenda/*` |

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/agenda/layout.tsx` | **Nuevo:** `LeadsClientCrmProvider` con `getAppModeSnapshot().isClientCrm` |
| `app/admin/agenda/page.tsx` | `isClientCrmUi`: ocultar opciones socio; labels «Cliente» en badges/filas existentes; reset formulario/filtro si quedaba en socio |
| `docs/constructor-crm/validacion-agenda-socio-socios-client-crm-pickup4x4-12U-3V.md` | Este documento |

**No modificado:** `lib/personalizacion.ts`, APIs agenda/socios, schema, `AdminShell`, sidebar.

---

## 5. Qué se neutraliza en `client_crm`

| Superficie | Antes | Después (`client_crm`) |
|------------|-------|-------------------------|
| Modal crear — selector Dueño | Lead + label personalización (default Socio) | Solo **Lead** |
| Filtro Dueño | Todos / Leads / label plural (default Socios) | **Todos** / **Leads** |
| Badge en tarjeta | `SOCIO:` | `CLIENTE:` si `owner_type === "socio"` |
| `getOwnerLabel` (socio) | Socio / personalización | **Cliente** |

Subtítulo de página sin cambio: *«Acciones pendientes de leads y actividades comerciales…»*.

---

## 6. Qué se mantiene en modos internos

Cuando `isClientCrmUi === false`:

- Opciones **Lead** + **Socio** (labels desde `usePersonalizacion` / `portal_config`).
- Filtro con plural de personalización.
- Badge **SOCIO:** en tarjetas con `owner_type === "socio"`.
- Lógica de API, `socio_id`, enlaces a `/admin/socios/…` sin cambios.

---

## 7. Qué no se tocó

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Migraciones / schema | ❌ No |
| `owner_type` en BD | ❌ No |
| Constructor / Installer | ❌ No |
| Seguridad `client_crm` | ❌ No |
| 12U-1 / 12U-2 | ❌ No |
| `.env.local` | ❌ No |

---

## 8. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (ver salida de la pasada de implementación) |

---

## 9. Auditoría rápida (hallazgos previos al cambio)

| # | Hallazgo |
|---|----------|
| 1 | Labels **Socio/Socios** venían de `usePersonalizacion()` → defaults en `lib/personalizacion.ts` y/o `portal_config` |
| 2 | `resolveEntityName` en agenda alimentaba `labelSingularAgenda` / `labelPluralAgenda` |
| 3 | UI: `<option value="socio">` en modal crear (L~950) y filtro Dueño (L~1236) |
| 4 | Badge hardcode **SOCIO:** en lista (L~1405) |
| 5 | Payloads siguen usando `owner_type: "socio"` y `socio_id` — solo capa UI |

**Decisión:** **ocultar** opción Socio en selectores en `client_crm`; **renombrar** badge/label a **Cliente** solo para filas existentes con `owner_type=socio` (no romper listado si hubiera datos legacy).

---

## 10. Checklist visual pendiente — Vercel

Entorno: `https://pickup4x4-crm-demo.vercel.app` · usuario **admin** · **Agenda**

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Agenda carga | ☐ |
| 2 | Subtítulo dice «leads y actividades comerciales» | ☐ |
| 3 | No aparece «Socio» | ☐ |
| 4 | No aparece «Socios» | ☐ |
| 5 | Actividades de leads siguen visibles | ☐ |
| 6 | Filtros vencidas / hoy / próximas funcionan | ☐ |
| 7 | Crear actividad de lead no muestra «Socio» | ☐ |
| 8 | Menú lateral: Summer87 Leads, Agenda, Reportes | ☐ |
| 9 | No se reabren Constructor / Configuración | ☐ |
| 10 | Ficha lead: sin Iniciativa, Técnico ni Consultor (12U-1 / 12U-2) | ☐ |

---

## 11. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo | ❌ No |
| Datos modificados | ❌ No |
| APIs | ❌ No |
| Middleware | ❌ No |
| Migraciones | ❌ No |
| Constructor / Installer | ❌ No |
| Commit desde esta pasada | ❌ No |

---

*Validación 12U-3V — Agenda sin Socio/Socios en UI `client_crm`; verificación runtime Vercel pendiente.*
