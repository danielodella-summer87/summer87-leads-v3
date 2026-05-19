# Plan Corrección Dashboard Pickup 4x4 Client CRM 12T-ux-fix-plan — Constructor CRM Summer87

**Versión:** 12T-ux-fix-plan — plan documental (sin implementación)  
**Base:** `auditoria-dashboard-reportes-shell-pickup4x4-client-crm-12T-ux-audit.md`  
**Contexto cerrado:** 12S-ux-fix-impl-1, 12S-ux-fix-impl-1V, 12T-ux-audit

**Estado:** planificado. **No** constituye corrección implementada ni validación **12T-ux-fix-impl-1V**.

---

## 2. Resumen ejecutivo

| Afirmación | Detalle |
|------------|---------|
| Superficie Leads | **Cerrada** en 12S — nuevo lead, lista y ficha operativa alineadas a Pickup 4x4 en `client_crm` |
| Pendiente P1 visible | **Dashboard** (`/admin/dashboard`) — único bloque con copy **LEADS87** y sesgo consultivo confirmado en repo |
| Naturaleza del fix | **Solo copy** (strings visibles en JSX); **sin** cambiar buckets, KPIs, APIs ni cálculos |
| No se crea | Dashboard nuevo, dashboard específico `client_crm`, ni refactor de métricas |
| No se toca | White-label Pickup 4x4, logo, marca Summer87 en shell |
| Objetivo | Si el usuario abre el dashboard **por accidente** (enlace Agenda) o **por guion**, **no** vea «LEADS87», «Diagnóstico, estrategia, servicios» ni «CRM cerrado o flujo 100%» |
| Implementación | **Pendiente** — fase **12T-ux-fix-impl-1** |

---

## 3. Alcance mínimo

| ID | Área | Texto actual (repo) | Cambio propuesto | Archivo probable | Prioridad |
|----|------|---------------------|------------------|------------------|-----------|
| **12T-FIX-01** | Dashboard — título sección | «Flujo comercial LEADS87» | «Flujo comercial» | `components/crm/dashboard/CommercialFlowKpis.tsx` | **P0** |
| **12T-FIX-02** | Dashboard — hint KPI Activas | «Diagnóstico, estrategia, servicios» | «Seguimiento comercial, cotizaciones y oportunidades» | `components/crm/dashboard/CommercialFlowKpis.tsx` | **P0** |
| **12T-FIX-03** | Dashboard — hint KPI Cerradas | «CRM cerrado o flujo 100%» | «Ganado, perdido o proceso completo» | `components/crm/dashboard/CommercialFlowKpis.tsx` | **P0** |
| **12T-FIX-04** | Dashboard — párrafo intro bloque | «Misma fuente de verdad que la ficha y el listado LEADS87 (macro flow). Incluye leads con proceso completo al 100% aunque el pipeline CRM siga activo.» | «Alineado al progreso de la ficha y la lista de leads. Incluye leads con proceso completo al 100% aunque el pipeline CRM siga activo.» | `components/crm/dashboard/CommercialFlowKpis.tsx` | **P0** |
| **12T-FIX-05** | Dashboard — subtítulo Top oportunidades | «Por avance LEADS87, rating y actividad (máx. 5; sin proceso completo al 100%)» | «Por avance del proceso, rating y actividad (máx. 5; sin proceso completo al 100%)» | `components/crm/dashboard/TopOpportunities.tsx` | **P1** |
| **12T-FIX-06** | Dashboard — subtítulo Pipeline total | «El avance real LEADS87 está en las tarjetas de flujo arriba.» | «El avance real del proceso está en las tarjetas de flujo arriba.» | `components/crm/dashboard/PipelineSummary.tsx` | **P1** |

**Archivos a editar en impl-1:** 3 componentes, 6 sustituciones de texto.

**No incluido en este plan (deuda P2 de auditoría 12T):**

| Ítem | Motivo |
|------|--------|
| `StalledLeads.tsx` — campos `leads87StageLabel` en UI | Son datos derivados, no string «LEADS87» literal en subtítulo del bloque; evaluar en impl solo si queda texto visible con marca |
| Banner «Summer87 Intelligence» / «Summer87 Leads» en `dashboard/page.tsx` | Fuera de alcance — white-label fase posterior |
| `appSuiteConfig.ts` | No tocar marca plataforma |

---

## 4. Fuera de alcance

| Ítem | Nota |
|------|------|
| White-label Pickup 4x4 | Fase posterior |
| Cambiar logo (`/licencia.png`) o footer «panel admin» | Sin cambio |
| Ocultar dashboard o bloque KPI en `client_crm` | No — se neutraliza copy, no se quita funcionalidad |
| Crear dashboard `client_crm` dedicado | No |
| Lógica de KPIs / buckets / `summarizeCommercialFlowKpis` | Sin cambio |
| Props, types, interfaces de métricas | Sin cambio salvo necesidad accidental (no esperada) |
| APIs (`/api/admin/leads`, etc.) | Sin cambio |
| Middleware / hardening 403 | Sin cambio |
| **Reportes** (hub, CSV, tabs rol) | Sin cambio en 12T |
| **Agenda** (subtítulo, socio, tipos) | Sin cambio en 12T |
| **Ficha lead** (tabs Técnico/Consultor, Datos de Iniciativa) | Fase posterior (12T-UX-18/19 en auditoría) |
| SQL / schema / Supabase / datos demo | Sin cambio |
| `.env.local` / `CLIENT_SLUG` | Sin cambio |

---

## 5. Reglas técnicas (para 12T-ux-fix-impl-1)

| Regla | Detalle |
|-------|---------|
| Alcance de diff | **Solo strings** en JSX visibles al usuario (títulos, hints, párrafos) |
| Prohibido | Alterar fórmulas, filtros, `useMemo`, llamadas API, nombres de variables internas `leads87*` en lib |
| Props / types | No modificar salvo error de compilación indirecto (no previsto) |
| Modos | Cambios **globales** en componentes dashboard (afectan `constructor_base` y `client_crm` con el mismo copy neutro — aceptable: texto más genérico CRM) |
| Build | `npm run build` obligatorio antes de cerrar impl |
| Validación visual | Dashboard en Vercel demo `client_crm` (`pickup4x4-crm-demo` o equivalente) |
| Humo funcional | Dashboard carga; 12 leads Demo en lista; reporte Comercial → Leads 12/12 + export CSV |
| Seguridad | Smoke 403 **opcional** si no se tocaron rutas/APIs/middleware (recomendado muestreo rápido por paridad 12S) |

**Búsqueda post-impl (criterio de aceptación técnica en repo):**

En `components/crm/dashboard/` no debe quedar el literal `LEADS87` en strings de UI (grep case-sensitive).

---

## 6. Validación esperada

Checklist para **12T-ux-fix-impl-1V** (documento de validación futuro):

### Copy / Dashboard

- [ ] Dashboard **no** muestra el texto «LEADS87» en pantalla
- [ ] **No** aparece «Diagnóstico, estrategia, servicios» en hints del bloque flujo comercial
- [ ] **No** aparece «CRM cerrado o flujo 100%» en hint Cerradas
- [ ] Título del bloque principal dice **«Flujo comercial»** (u equivalente acordado)
- [ ] Subtítulos Top oportunidades y Pipeline total sin «LEADS87»

### Funcional / regresión

- [ ] Dashboard **carga** sin error (lista de bloques KPI visible)
- [ ] **Métricas conservadas** — mismos contadores/tarjetas (Nuevas, Activas, En propuesta, etc.); solo cambió copy
- [ ] **Leads** — lista 12 Demo OK (sin regresión 12S)
- [ ] **Agenda** — carga OK (sin cambio de código en 12T)
- [ ] **Reportes → Comercial → Leads** — 12/12 + CSV OK
- [ ] `npm run build` — OK

### Seguridad (opcional)

- [ ] APIs críticas siguen 403 en `client_crm` (si se ejecuta smoke)

---

## 7. Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Ruptura de build por typo en JSX | Baja | Diff mínimo; build obligatorio |
| Confusión en equipo que usaba nombre «LEADS87» en dashboard | Media | Copy genérico sigue describiendo mismo macro flow; documentar en 12T-impl-1V |
| Pérdida de trazabilidad interna producto LEADS87 | Baja | Rutas `/admin/leads87` y código lib sin renombrar; solo UI dashboard |
| Cambio global afecta modo `constructor_base` | Baja | Texto más neutro; beneficioso también fuera de Pickup |
| Expectativa de ocultar marca Summer87 | Media | Comunicar que 12T **no** es white-label |

---

## 8. Dictamen

> **GO** para **12T-ux-fix-impl-1** con alcance mínimo de **copy en dashboard** (12T-FIX-01 a 12T-FIX-06, tres archivos).  
> **NO-GO** para dashboard nuevo, white-label, ocultar dashboard, refactor de KPIs o ampliar alcance a Reportes/Agenda/ficha en la misma fase.

---

## 9. Próximo paso

Secuencia recomendada **12T-ux-fix-impl-1**:

| Paso | Acción |
|------|--------|
| 1 | Editar `components/crm/dashboard/CommercialFlowKpis.tsx` (12T-FIX-01 a 04) |
| 2 | Editar `components/crm/dashboard/TopOpportunities.tsx` (12T-FIX-05) |
| 3 | Editar `components/crm/dashboard/PipelineSummary.tsx` (12T-FIX-06) |
| 4 | `npm run build` |
| 5 | Grep: sin `LEADS87` en `components/crm/dashboard/*.tsx` |
| 6 | Desplegar a Vercel demo `client_crm` |
| 7 | Crear `validacion-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-impl-1V.md` con checklist §6 |
| 8 | Opcional: re-smoke 403 si se desea paridad con 12S-1V |

**Estimación:** 1 PR pequeño (&lt; 30 líneas útiles), sin dependencias de BD ni config.

---

## 10. Confirmación de alcance (este documento)

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No — solo plan |
| TypeScript creado o editado | ❌ No |
| SQL / Supabase / datos | ❌ No |
| `.env.local` | ❌ No |
| Implementación afirmada | ❌ No — pendiente 12T-ux-fix-impl-1 |
| Solo documentación de plan | ✅ Sí |

---

*Plan 12T-ux-fix — neutralización copy LEADS87 en Dashboard para demo Pickup 4x4 client_crm.*
