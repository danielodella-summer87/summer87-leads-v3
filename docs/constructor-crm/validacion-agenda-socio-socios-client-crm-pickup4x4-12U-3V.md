# Validación Agenda Socio/Socios Client CRM Pickup 4x4 12U-3V — Constructor CRM Summer87

**Versión:** 12U-3 — neutralizar etiquetas y opciones «Socio/Socios» en Agenda (`client_crm`)  
**Auditoría origen:** `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md`  
**Fases previas:** 12U-1 (Iniciativa), 12U-2 (tabs Técnico/Consultor + CTAs)  
**Commit funcional:** `8bbac17`

**Estado validación:** build local **OK**; validación visual Vercel **OK** para Agenda principal y modal crear actividad en `client_crm`.

---

## Validación visual Vercel — 2026-05-18

| Campo | Valor |
|-------|--------|
| **Entorno** | Pickup 4x4 CRM demo — Vercel production (`pickup4x4-crm-demo.vercel.app`) |
| **Commit funcional** | `8bbac17` |
| **Usuario** | Daniel (admin) |
| **URL** | https://pickup4x4-crm-demo.vercel.app/admin/agenda |
| **Resultado** | **OK** Agenda principal y modal **+ Agregar actividad** |

### Observaciones — Agenda principal

| Criterio | Resultado |
|----------|-----------|
| Agenda carga | ✅ |
| Subtítulo | ✅ «Acciones pendientes de leads y actividades comerciales…» |
| Filtro **Dueño** | ✅ «Todos» (y Leads); **no** aparece «Socios» |
| Texto «Socio» / «Socios» | ✅ No observado en pantalla principal |
| Actividades de leads | ✅ Visibles |
| Acciones en tarjetas | ✅ Abrir Lead / Editar / Marcar realizada visibles |
| Menú lateral | ✅ Summer87 Leads, Agenda, Reportes |
| Constructor / Configuración | ✅ No reabiertos |

### Validación modal + Agregar actividad

Modal: **+ Agregar actividad** · misma URL y commit `8bbac17`.

| Criterio | Resultado |
|----------|-----------|
| Selector **Dueño** Lead/Socio | ✅ **No visible** (solo flujo lead) |
| Campo dueño visible | ✅ **Lead \*** |
| Lead seleccionado (demo) | ✅ «Demo — Barra antivuelco Ranger» |
| Texto «Socio» / «Socios» | ✅ No aparece |
| Campos del formulario | ✅ Tipo, Fecha, Hora, Nota, Lugar, Comercial, Invitados visibles |
| Orientación del formulario | ✅ Actividad de lead (sin opción socio) |

### Pendiente en esta sesión

| Ítem | Motivo |
|------|--------|
| Chips vencidas / hoy / próximas | No validados explícitamente en captura (checklist §10 ítem 6) |
| Ficha lead 12U-1 / 12U-2 | No revisada en esta pasada Agenda (ítem 10; ver docs 12U-1V / 12U-2V) |

### Dictamen

**12U-3 queda visualmente validado para Agenda principal y modal de creación de actividad en `client_crm`.**

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
| **12U-1** | Iniciativa en ficha lead | Sin solapamiento; ficha no revalidada en sesión Agenda 2026-05-18 |
| **12U-2** | Tabs Técnico/Consultor + CTAs Consultor | Sin solapamiento; idem |
| **12U-3** | Agenda — Socio/Socios | Solo `app/admin/agenda/*` — ✅ Agenda principal + modal crear (Vercel 2026-05-18) |

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
| Modal crear — dueño | Selector Lead + Socio (default Socio) | Solo campo **Lead \***; sin selector Dueño ni Socio |
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
| 12U-1 / 12U-2 (código) | ❌ No |
| `.env.local` | ❌ No |

---

## 8. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (commit funcional `8bbac17`) |

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

## 10. Checklist visual — Vercel

Entorno: `https://pickup4x4-crm-demo.vercel.app/admin/agenda` · usuario **admin** (Daniel) · commit `8bbac17`

Referencia detallada: [Validación visual Vercel — 2026-05-18](#validación-visual-vercel--2026-05-18).

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Agenda carga | ✅ § Vercel 2026-05-18 |
| 2 | Subtítulo dice «leads y actividades comerciales» | ✅ § Vercel 2026-05-18 |
| 3 | No aparece «Socio» | ✅ § Vercel 2026-05-18 |
| 4 | No aparece «Socios» | ✅ § Vercel 2026-05-18 |
| 5 | Actividades de leads siguen visibles | ✅ § Vercel 2026-05-18 |
| 6 | Filtros vencidas / hoy / próximas funcionan | ☐ Pendiente (no validados explícitamente en captura) |
| 7 | Crear actividad de lead no muestra «Socio» | ✅ § Vercel 2026-05-18 (modal + Agregar actividad) |
| 8 | Menú lateral: Summer87 Leads, Agenda, Reportes | ✅ § Vercel 2026-05-18 |
| 9 | No se reabren Constructor / Configuración | ✅ § Vercel 2026-05-18 |
| 10 | Ficha lead: sin Iniciativa, Técnico ni Consultor (12U-1 / 12U-2) | ☐ Pendiente (no revisada en esta pasada Agenda) |

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
| Código modificado en esta pasada (solo doc) | ❌ No |
| Commit desde esta pasada | ❌ No |

---

*Validación 12U-3V — Agenda principal y modal crear sin Socio/Socios en UI `client_crm` (Vercel OK, 2026-05-18, `8bbac17`); pendiente opcional: chips fecha (§10 ítem 6), revalidación ficha lead en pasada Agenda (ítem 10).*
