# Validación Corrección Dashboard Pickup 4x4 Client CRM 12T-ux-fix-impl-1V — Constructor CRM Summer87

**Versión:** 12T-ux-fix-impl-1 — implementación mínima (copy dashboard)  
**Plan origen:** `plan-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-plan.md`  
**Auditoría origen:** `auditoria-dashboard-reportes-shell-pickup4x4-client-crm-12T-ux-audit.md`

**Estado validación:** build local **OK**; validación visual Vercel **pendiente** (checklist §6).

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
| `docs/constructor-crm/validacion-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-impl-1V.md` | **Creado** — este documento |

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
| Middleware / hardening 403 `client_crm` | Sin cambio |
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

## 7. Confirmaciones de alcance

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase / datos modificados | ❌ No |
| Migraciones | ❌ No |
| APIs / middleware | ❌ No |
| Commit desde esta pasada | ❌ No (según restricción de tarea) |

---

## 8. Checklist pendiente — Vercel (`client_crm`)

Entorno esperado: `https://pickup4x4-crm-demo.vercel.app` · ruta `/admin/dashboard`

### Copy / Dashboard

- [ ] Dashboard **no** muestra «LEADS87»
- [ ] **No** aparece «Diagnóstico, estrategia, servicios» en hint Activas
- [ ] **No** aparece «CRM cerrado o flujo 100%» en hint Cerradas
- [ ] Título del bloque: **«Flujo comercial»**
- [ ] Tarjetas KPI (Nuevas, Activas, En propuesta, etc.) siguen visibles con números

### Regresión funcional

- [ ] Dashboard carga sin error
- [ ] **Leads** — 12 leads Demo visibles en lista
- [ ] **Reportes → Comercial → Leads** — 12/12 + export CSV

### Seguridad (opcional)

- [ ] Smoke 403 APIs críticas en `client_crm` (si se desea paridad 12S-1V)

---

## 9. Dictamen (pre-Vercel)

> **GO técnico impl-1** — build OK, diff acotado a copy, sin `LEADS87` en strings del directorio dashboard.  
> **GO visual** — pendiente completar checklist §8 en Vercel post-deploy.

---

*Validación 12T-ux-fix-impl-1V — copy dashboard neutralizado; verificación runtime en Vercel pendiente.*
