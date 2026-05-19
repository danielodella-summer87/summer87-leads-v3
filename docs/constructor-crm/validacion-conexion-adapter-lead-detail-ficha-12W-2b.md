# Validación Conexión Adapter Lead Detail Ficha 12W-2b — Constructor CRM Summer87

**Versión:** 12W-2b — wiring contrato → ficha lead (fallback-safe)  
**Base:** 12W-1 loader (`6cba550`), 12W-2 adapter (`defcf26`), 12U-1/12U-2 validados Vercel  
**Commit funcional validado:** `eb63540` — Connect lead detail visibility adapter

**Estado:** build local **OK**; validación visual Vercel **OK** (ficha lead `client_crm`, 2026-05-19).

---

## Validación visual Vercel — 2026-05-19

| Campo | Valor |
|-------|--------|
| **Entorno** | Pickup 4x4 CRM demo — Vercel production (`pickup4x4-crm-demo.vercel.app`) |
| **Ruta** | https://pickup4x4-crm-demo.vercel.app/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df |
| **Lead** | Demo — Lona marítima Hilux |
| **Commit validado** | `eb63540` |
| **Resultado** | **OK** visual |

### Observaciones en captura

| Criterio | Resultado |
|----------|-----------|
| Ficha carga | ✅ |
| Tab **Técnico** | ✅ No visible |
| Tab **Consultor** | ✅ No visible |
| Cabecera **Propuesta comercial** | ✅ No visible |
| Alerta **Iniciativa** | ✅ No visible |
| Bloque **Datos de Iniciativa** | ✅ No visible |
| Tabs **Datos** y **Comercial** | ✅ Visibles |
| **Contactos** y **Acciones** (cabecera) | ✅ Visibles |
| **Flujo del proceso** | ✅ Visible |
| **Siguiente paso recomendado** | ✅ Visible |
| **Seguimiento piloto** | ✅ Visible |
| **Datos del lead** | ✅ Visible |
| Menú lateral | ✅ Summer87 Leads, Agenda, Reportes |
| Layout / sin regresión aparente | ✅ |

### Alcance fuera de captura

| Superficie | Nota |
|------------|------|
| **Agenda** | No modificada en 12W-2b; sin evidencia nueva en esta captura — **no afectada por código** de esta fase |
| **Dashboard** | Idem |
| Consola del navegador | No revisada en captura; ficha estable sin error visual |

### Dictamen

**12W-2b queda GO visual para ficha lead en `client_crm`.** El wiring contrato + fallback 12U mantiene el mismo resultado validado en 12U-1/12U-2; el adapter participa sin reabrir superficies ocultas.

---

## 1. Resumen del cambio

La ficha de lead **consume** el snapshot `leadDetailVisibility` calculado en server (`leads/layout.tsx`) vía contexto extendido. Las reglas **12U** (`isClientCrmUi`) se mantienen en **OR** con el contrato: nunca se muestra más que antes en `client_crm`.

| Capa | Rol |
|------|-----|
| `getActiveCrmPackageConfigFromEnvironment()` | Resuelve contrato en layout (server) |
| `packageToLeadDetailVisibility(config)` | Adapter → snapshot |
| `LeadsClientCrmProvider` | Pasa `leadDetailVisibility` al árbol leads |
| `useLeadDetailVisibility()` + helpers | Ficha (client) combina con 12U |

---

## 2. Relación con 12W-1 y 12W-2

| Fase | Aporte |
|------|--------|
| **12W-1** | Loader devuelve `pickup4x4CrmPackageConfig` en demo |
| **12W-2** | `packageToLeadDetailVisibility` |
| **12W-2b** | Primera **consumición** en UI (solo ficha leads) — ✅ Vercel 2026-05-19 |

---

## 3. Relación con 12U-1 y 12U-2

| Superficie | Lógica integrada |
|------------|------------------|
| Tabs Técnico/Consultor | `shouldHideLeadTab` = 12U (`isClientCrmUi`) **OR** `isLeadDetailTabHidden` |
| Iniciativa / Datos Iniciativa | `hideIniciativaSurfaces` = 12U **OR** bloque `iniciativa_link` |
| CTAs Consultor / Propuesta comercial | `hideConsultorSurfaces` (= ocultar tab consultor) |

`isClientCrmUi` **no eliminado**. Sin contrato activo (`source: legacy`), el OR deja el comportamiento 12U intacto.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/LeadsClientCrmContext.tsx` | `LeadDetailVisibilitySnapshot`, `useLeadDetailVisibility()` |
| `app/admin/leads/layout.tsx` | Loader + adapter → provider |
| `app/admin/leads/[id]/page.tsx` | `shouldHideLeadTab`, `hideIniciativaSurfaces`, `hideConsultorSurfaces` |
| `docs/constructor-crm/validacion-conexion-adapter-lead-detail-ficha-12W-2b.md` | Este documento |

**No modificado:** agenda, dashboard, reportes, sidebar (código), APIs, `pickup4x4.config.ts`.

---

## 5. Qué consume ahora la ficha

- Snapshot `leadDetailVisibility` desde contexto.
- Helpers puros `isLeadDetailTabHidden` / `isLeadDetailBlockHidden` (import directo adapter, sin loader en client).
- `visibleTabs` filtrado por `shouldHideLeadTab`.
- Bloques Iniciativa y CTAs Consultor según constantes anteriores.

---

## 6. Qué sigue en fallback legacy

| Condición | Comportamiento |
|-----------|----------------|
| Loader sin contrato (`config: null`) | `leadDetailVisibility` = listas vacías, `source: legacy` |
| Modo interno (`constructor_base`) | Sin contrato típico → solo reglas rol/12U (12U no aplica si no `client_crm`) |
| `ok: false` loader | `config: null` → legacy; sin error en UI |

---

## 7. Qué NO se conectó todavía

| Ítem | Estado |
|------|--------|
| `hide_blocks`: relevamiento_visita, servicios_especiales, next_step_easy | ❌ (solo iniciativa_link + tabs) |
| `nuevo/page.tsx` | ❌ |
| Sidebar `visibility_rules.sidebar` | ❌ |
| Dashboard / agenda / reportes (wiring contrato) | ❌ |
| Eliminar duplicación 12U | ❌ (fase posterior) |

---

## 8. Resultado esperado en `client_crm`

Confirmado en Vercel (`eb63540`, 2026-05-19):

- Sin tabs Técnico/Consultor.
- Sin Iniciativa / Datos de Iniciativa.
- Sin Propuesta comercial ni CTAs a Consultor.
- Datos, Comercial, Contactos, Acciones, flujo comercial, seguimiento piloto y datos del lead visibles.

---

## 9. Resultado esperado en modo interno

Sin cambio respecto a antes de 12W-2b: si no hay contrato activo, `hideIniciativaSurfaces` y `hideConsultorSurfaces` dependen solo de `isClientCrmUi` (false) → superficies internas visibles según rol. No revalidado en esta captura (solo demo `client_crm`).

---

## 10. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (commit `eb63540`) |

---

## 11. Checklist visual — Vercel

Ficha: **Demo — Lona marítima Hilux** · `client_crm` · commit `eb63540`

Referencia: [Validación visual Vercel — 2026-05-19](#validación-visual-vercel--2026-05-19).

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ficha carga | ✅ § Vercel 2026-05-19 |
| 2 | No tab Técnico | ✅ § Vercel 2026-05-19 |
| 3 | No tab Consultor | ✅ § Vercel 2026-05-19 |
| 4 | No Propuesta comercial (cabecera) | ✅ § Vercel 2026-05-19 |
| 5 | No Iniciativa / Datos de Iniciativa | ✅ § Vercel 2026-05-19 |
| 6 | Sí Datos / Comercial | ✅ § Vercel 2026-05-19 |
| 7 | Sí Contactos / Acciones | ✅ § Vercel 2026-05-19 |
| 8 | Sí Flujo comercial / Siguiente paso | ✅ § Vercel 2026-05-19 |
| 9 | Sin error consola evidente | — Sin evidencia en captura (ficha estable; sin consola abierta) |
| 10 | Agenda / Dashboard no afectados | — Sin evidencia nueva en captura; **no modificados en 12W-2b** |

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Dashboard / agenda / reportes / sidebar (código) | ❌ No |
| Cambio visual intencional distinto a 12U | ❌ No (mismo resultado validado) |
| `getActiveCrmPackageConfigFromEnvironment` en page client | ❌ No (solo layout server) |
| Commit desde esta pasada (solo doc) | ❌ No |

---

*Validación 12W-2b — GO visual ficha lead `client_crm` (Vercel 2026-05-19, `eb63540`).*
