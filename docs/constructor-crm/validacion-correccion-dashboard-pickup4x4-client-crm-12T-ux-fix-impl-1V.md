# Validación Corrección Dashboard Pickup 4x4 Client CRM 12T-ux-fix-impl-1V — Constructor CRM Summer87

**Versión:** 12T-ux-fix-impl-1 — implementación mínima (copy dashboard)  
**Plan origen:** `plan-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-plan.md`  
**Auditoría origen:** `auditoria-dashboard-reportes-shell-pickup4x4-client-crm-12T-ux-audit.md`

**Estado validación:** build local **OK**; **validación visual final en Vercel OK** (§10, 2026-05-18).

**Commit funcional validado:** `729410d` — *Neutralize dashboard LEADS87 copy*

---

## 1. Resumen de cambios

Se aplicó **12T-ux-fix-impl-1**: neutralización del copy **LEADS87** y lenguaje consultivo en el **Dashboard** (`/admin/dashboard`), sin alterar cálculos, buckets, APIs ni datos.

| Estrategia | Detalle |
|------------|---------|
| **Solo strings UI** | Títulos, hints y párrafos en 3 componentes dashboard |
| **Sin lógica** | `summarizeCommercialFlowKpis`, `useMemo`, tipos y props intactos |
| **Alcance global** | Mismo copy neutro en todos los modos (`constructor_base` y `client_crm`) |

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `components/crm/dashboard/CommercialFlowKpis.tsx` | **Modificado** — 12T-FIX-01 a 04 |
| `components/crm/dashboard/TopOpportunities.tsx` | **Modificado** — 12T-FIX-05 |
| `components/crm/dashboard/PipelineSummary.tsx` | **Modificado** — 12T-FIX-06 |
| `docs/constructor-crm/validacion-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-impl-1V.md` | **Creado / actualizado** — este documento |

**No modificado:** `app/admin/dashboard/page.tsx`, libs de métricas, reportes, agenda, ficha lead, APIs, middleware, `.env.local`.

---

## 3. Strings cambiados (12T-FIX)

| ID | Antes | Después | Archivo |
|----|-------|---------|---------|
| 12T-FIX-01 | Flujo comercial LEADS87 | Flujo comercial | `CommercialFlowKpis.tsx` |
| 12T-FIX-02 | Diagnóstico, estrategia, servicios | Seguimiento comercial, cotizaciones y oportunidades | `CommercialFlowKpis.tsx` |
| 12T-FIX-03 | CRM cerrado o flujo 100% | Ganado, perdido o proceso completo | `CommercialFlowKpis.tsx` |
| 12T-FIX-04 | Misma fuente de verdad que la ficha y el listado LEADS87 (macro flow). Incluye leads… | Alineado al progreso de la ficha y la lista de leads. Incluye leads… | `CommercialFlowKpis.tsx` |
| 12T-FIX-05 | Por avance LEADS87, rating y actividad… | Por avance del proceso, rating y actividad… | `TopOpportunities.tsx` |
| 12T-FIX-06 | El avance real LEADS87 está en las tarjetas… | El avance real del proceso está en las tarjetas… | `PipelineSummary.tsx` |

---

## 4. Qué no se tocó

| Ítem | Nota |
|------|------|
| Lógica KPIs / `dashboardCommercialFlow` / `metrics` | Intacta |
| Variables internas `leads87Flow`, `leads87StageLabel`, `leads87Progress` | Sin renombrar (no son copy visible «LEADS87») |
| APIs `/api/admin/leads` | Sin cambio |
| Middleware / hardening 403 `client_crm` | Sin cambio en impl-1 |
| Reportes, Agenda, ficha lead | Fuera de alcance 12T |
| White-label / `appSuiteConfig` / logo | Sin cambio |
| SQL / Supabase / datos demo | Sin cambio |
| `.env.local` | Sin cambio |

---

## 5. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (Next.js 16.0.11, TypeScript sin error, compilación exitosa) |

---

## 6. Búsqueda «LEADS87» en dashboard UI

| Ámbito | Resultado |
|--------|-----------|
| `components/crm/dashboard/*.tsx` — literal `LEADS87` | ✅ **0 coincidencias** |
| Identificadores internos `leads87Flow`, `leads87StageLabel` | Permanecen en código; **no** renderizan el texto «LEADS87» |

---

## 7. Confirmaciones de alcance (impl-1)

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo / datos modificados | ❌ No |
| Migraciones | ❌ No |
| APIs / middleware | ❌ No |

---

## 8. Checklist Vercel — Dashboard (completado §10)

Los ítems de copy y carga del dashboard quedaron **validados en Vercel** (§10).

### Regresión funcional (pendiente o no revalidado en esta pasada)

- [ ] **Leads** — 12 leads Demo visibles en **lista** `/admin/leads` (no revalidado explícitamente post-729410d)
- [ ] **Reportes → Comercial → Leads** — 12/12 + export CSV (no revalidado en esta pasada)

### Seguridad (opcional)

- [ ] Smoke 403 APIs críticas en `client_crm` (paridad 12S-1V; opcional)

---

## 9. Dictamen

> **GO técnico impl-1** — build OK, diff acotado a copy, sin `LEADS87` en strings del directorio dashboard.  
> **GO visual para Dashboard post 12T-ux-fix-impl-1** — validación Vercel §10 (commit `729410d`, deploy Ready / Current).

---

## 10. Validación visual final en Vercel

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-05-18 |
| **Entorno** | Vercel production — `pickup4x4-crm-demo` |
| **Commit validado** | `729410d` — *Neutralize dashboard LEADS87 copy* |
| **Estado deploy** | Ready / Current |
| **URL validada** | https://pickup4x4-crm-demo.vercel.app/admin/dashboard |

### Checks visuales — Dashboard

| Criterio | Resultado |
|----------|-----------|
| Dashboard carga sin error | ✅ OK |
| Título bloque principal **«Flujo comercial»** | ✅ OK |
| **No** aparece «Flujo comercial LEADS87» | ✅ OK |
| **No** aparece «Diagnóstico, estrategia, servicios» | ✅ OK |
| **No** aparece «CRM cerrado o flujo 100%» | ✅ OK |
| Pipeline total — sin «avance real LEADS87»; copy **«avance real del proceso»** | ✅ OK |
| Top oportunidades — sin «avance LEADS87»; copy **«avance del proceso»** | ✅ OK |
| Métricas / tarjetas KPI visibles | ✅ OK |
| 12 leads activos visibles en dashboard | ✅ OK |

### Dictamen visual

**OK** — El dashboard en `client_crm` cumple el objetivo **12T-ux-fix-impl-1**: sin copy LEADS87 ni hints consultivos heredados en la superficie validada.

### Pendientes fuera de alcance (sin cambio en 12T)

| Ítem | Nota |
|------|------|
| White-label Pickup 4x4 | Fase posterior |
| Dashboard específico `client_crm` | No creado |
| Tabs Técnico / Consultor (ficha lead) | Fase posterior |
| Bloque **Datos de Iniciativa** (ficha lead) | Fase posterior |
| Reportes hub «próximamente» | Tolerable; sin cambio 12T |
| Smoke 403 post-deploy | Opcional; paridad 12S-1V |

### Confirmación de esta actualización documental

| Ítem | Estado |
|------|--------|
| Código funcional modificado en esta pasada | ❌ No — solo este `.md` |
| SQL / Supabase / datos | ❌ No |
| APIs / migraciones / middleware | ❌ No |
| Commit desde esta pasada | ❌ No |

---

*Validación 12T-ux-fix-impl-1V — copy dashboard neutralizado y verificado en Vercel production (`729410d`).*
