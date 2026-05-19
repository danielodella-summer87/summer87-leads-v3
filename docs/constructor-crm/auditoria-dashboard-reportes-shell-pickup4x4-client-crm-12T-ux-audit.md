# Auditoría Dashboard/Reportes/Shell Pickup 4x4 Client CRM 12T-ux-audit — Constructor CRM Summer87

**Versión:** 12T-ux-audit — auditoría documental (solo repo + documentos 12S)  
**Fecha:** 2026-05-18  
**Ámbito:** superficies visibles restantes en `client_crm` tras cierre **12S-ux-fix-impl-1** / **12S-ux-fix-impl-1V**

**Referencias base:**

| Documento | Uso |
|-----------|-----|
| `validacion-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-impl-1V.md` | Qué quedó cerrado y pendiente explícito |
| `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md` | Matriz original y clasificación A/B/C/D |
| `plan-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-plan.md` | UXFIX-10/12 y fases posteriores |

**Leyenda de evidencia:**

| Etiqueta | Significado |
|----------|-------------|
| **Repo** | String o componente localizado en código fuente |
| **Doc 12S-V** | Registrado en validación 12S (Vercel o checklist); no re-auditado visualmente en esta pasada salvo cita |
| **Inferido** | Conclusión por rol, menú o flujo; sin string UI directo |

**No se implementó ningún cambio.** No se modificó código funcional, datos, SQL ni Supabase.

---

## 2. Resumen ejecutivo

La fase **12S** dejó **limpias las superficies Leads principales** (nuevo lead, lista, ficha operativa) para la demo Pickup 4x4 en `client_crm`, con **GO visual** y **smoke 403** documentados en **12S-ux-fix-impl-1V**.

Esta auditoría **12T** inspecciona las **superficies visibles restantes** que el usuario puede alcanzar en piloto/demo:

- **Dashboard** (`/admin/dashboard`)
- **Reportes** (hub + reporte Comercial → Leads)
- **Agenda**
- **Shell** (sidebar, marca, breadcrumbs)
- **Ficha lead residual** (tabs Técnico/Consultor, Datos de Iniciativa)

| Conclusión | Detalle |
|------------|---------|
| Objetivo | Decidir si hace falta una fase acotada **12T-ux-fix** o si los hallazgos siguen como **deuda no bloqueante** |
| Hallazgo principal | El bloque **«Flujo comercial LEADS87»** en dashboard sigue con copy consultivo (**Diagnóstico, estrategia, servicios**; **CRM cerrado**) — **confirmado en repo**, pendiente desde UXFIX-10 |
| Impacto demo comercial | **Medio-alto** si el recorrido incluye dashboard; **bajo** si el guion se limita a Leads + Agenda + Reporte Leads |
| Leads / ficha | Tabs Técnico/Consultor e iniciativa **no corregidos en 12S**; visibilidad depende del **rol** y de si el usuario abre el acordeón «Datos del lead» |
| Recomendación mínima | Si se corrige algo: **renombre genérico del bloque LEADS87** (opción B del plan 12S), **sin** dashboard nuevo ni white-label |

---

## 3. Alcance inspeccionado

| Área | Archivos inspeccionados | Qué se buscó | Resultado general |
|------|-------------------------|--------------|-------------------|
| **Dashboard** | `app/admin/dashboard/page.tsx`, `components/crm/dashboard/CommercialFlowKpis.tsx`, `LeadHealthSummary.tsx`, `PropuestasEsperandoRespuesta.tsx`, `PipelineSummary.tsx`, `CommercialPriorities.tsx`, `CommercialAlerts.tsx`, `ActivityStateSummary.tsx`, `StalledLeads.tsx`, `ConversionMetrics.tsx`, `TopOpportunities.tsx` | LEADS87, diagnóstico, consultoría, pipeline, propuestas | **Medio-alto** — bloque LEADS87 + menciones LEADS87 en subtítulos; resto mayormente genérico CRM |
| **Reportes** | `app/admin/reportes/ReportesClient.tsx`, `app/admin/reportes/comercial/leads/page.tsx`, `components/reports/RoleTabs.tsx`, `app/admin/reportes/comercial/pipeline/page.tsx` (existe) | próximamente, roles, CSV, LEADS87 | **Bajo** — hub con roadmap; **Leads + CSV OK**; sin LEADS87 en strings |
| **Agenda** | `app/admin/agenda/page.tsx` | subtítulo, socio, dueño, tipos | **Bajo-medio** — subtítulo 12S OK; **«Socio»** por personalización por defecto |
| **Shell / marca** | `app/admin/AdminShell.tsx`, `lib/config/appSuiteConfig.ts`, `lib/admin/adminSidebarModules.ts` | Summer87, panel admin, logo, menú `client_crm` | **Medio** — marca plataforma; menú piloto acotado por `CLIENT_VISIBLE_MODULES` (**Doc 12J**, no revalidado en Vercel aquí) |
| **Ficha residual** | `app/admin/leads/[id]/page.tsx`, `app/admin/leads/LeadsClientCrmContext.tsx` (contexto 12S) | tabs, iniciativa, EASY | **Medio** — sin cambio 12S; rol **comercial** no ve Técnico/Consultor (**Repo**); admin sí |

**Visibilidad menú `client_crm` (inferido desde docs 12J/12O):** allowlist típica `CLIENT_VISIBLE_MODULES=leads87,agenda,reportes` — **Dashboard** (`dashboard_comercial`) suele **no** estar en menú, pero la ruta `/admin/dashboard` **sigue existiendo** (enlace desde Agenda, smoke 403 en **Doc 12S-V** §11).

---

## 4. Hallazgos por área

### A. Dashboard

| Elemento observado | Archivo | Problema | Severidad | Recomendación |
|--------------------|---------|----------|-----------|---------------|
| **«Flujo comercial LEADS87»** (título de sección) | `CommercialFlowKpis.tsx` | Nombre de producto consultivo ajeno a narrativa Pickup 4x4 operativa | **Alto UX** (P1) | Renombrar a **«Flujo comercial»** o **«Resumen del proceso comercial»** |
| Hint tarjeta **Activas**: *«Diagnóstico, estrategia, servicios»* | `CommercialFlowKpis.tsx` | Lenguaje agencia/consultoría | **Alto UX** (P1) | → *«Seguimiento comercial, cotizaciones y oportunidades»* (sugerencia plan 12S) |
| Hint **Cerradas**: *«CRM cerrado o flujo 100%»* | `CommercialFlowKpis.tsx` | Mezcla producto LEADS87 + CRM; confuso en demo | **Medio** (P1) | → *«Ganado, perdido o proceso completo»* |
| Párrafo: *«Misma fuente de verdad que la ficha y el listado LEADS87 (macro flow)»* | `CommercialFlowKpis.tsx` | Marca LEADS87 visible al entrar al dashboard | **Medio** (P1) | Neutralizar: *«Alineado al progreso de la ficha y la lista de leads»* |
| **Pipeline total** — *«El avance real LEADS87 está en las tarjetas de flujo arriba»* | `PipelineSummary.tsx` | Referencia LEADS87 en bloque secundario | **Medio** (P2) | Quitar «LEADS87»; mantener distinción columna CRM vs progreso |
| **Top oportunidades** — *«Por avance LEADS87, rating y actividad»* | `TopOpportunities.tsx` | Idem | **Medio** (P2) | → *«Por avance del proceso, rating y actividad»* |
| **Leads estancados** — subtexto `leads87StageLabel` / `leads87Progress` | `StalledLeads.tsx` | Etiquetas técnicas en UI secundaria (prefijo macro) | **Bajo** (P2) | Opcional renombrar labels visibles; no bloquea |
| Banner **Suite: Summer87 Intelligence** · **Módulo: Summer87 Leads** | `dashboard/page.tsx` + `appSuiteConfig.ts` | Marca plataforma, no cliente | **Medio** (P2/P3) | Mantener en demo interna; white-label fase posterior |
| Título **«Dashboard comercial completo»** | `dashboard/page.tsx` | Genérico; aceptable | **Bajo** | Mantener |
| **Salud del pipeline** | `LeadHealthSummary.tsx` | Genérico CRM | — **OK** | Mantener |
| **Prioridades comerciales de hoy** | `CommercialPriorities.tsx` | Genérico | — **OK** | Mantener |
| **Alertas Comerciales Inteligentes** | `CommercialAlerts.tsx` | Genérico; título algo “marketing” pero tolerable | **Bajo** | Mantener o suavizar en fase posterior |
| **Estado de actividad** / **Acciones vencidas** | `ActivityStateSummary.tsx` | Genérico; enlaza a Agenda | — **OK** | Mantener |
| **Propuestas esperando respuesta** | `PropuestasEsperandoRespuesta.tsx` | Útil si hay propuesta enviada; genérico B2B | — **OK** | Mantener |
| **Conversión entre etapas** | `ConversionMetrics.tsx` | Genérico | — **OK** | Mantener |

**Confirmado en repo:** sí existen **«Flujo comercial LEADS87»**, **«Diagnóstico, estrategia, servicios»** y **«CRM cerrado o flujo 100%»** en el primer bloque del dashboard.

**No observado en repo (dashboard):** Casalimpia, limpieza, visita técnica facility en componentes dashboard inspeccionados.

**Doc 12S-V:** Dashboard LEADS87 listado como pendiente UXFIX-10; smoke seguridad usó URL `/admin/dashboard` sin validación visual de copy (§11).

---

### B. Reportes

| Elemento | Estado Pickup 4x4 | Severidad | Notas |
|----------|-------------------|-----------|-------|
| **Comercial → Leads (listado + filtros + CSV)** | **OK operativo** | — | Datos desde `/api/admin/leads`; export CSV funcional (**Repo** `comercial/leads/page.tsx`) |
| Filtros UI (buscar, origen, pipeline, estado, rating, fechas) | **Parcial** | **Bajo** (P2) | Controles con `disabled` / `title` *«próximamente»`*; filtrado en memoria existe en código pero inputs no editables |
| Hub **Reportes** — cards *«Próximamente»* | **Roadmap** | **Bajo** (P2/P3) | Mayoría `disabled: true`, tag `próximo` o `Referencia` (**Repo** `ReportesClient.tsx`) |
| Tabs rol: **Resumen, Dirección, Comercial, Marketing, Administración, Técnico** | **Visibles** | **Bajo** (P2) | No confunden si se explica como catálogo multi-rol; en demo Pickup solo **Comercial → Leads** aporta valor |
| Tab **Técnico** (*Tickets / Estado portal*) | Próximamente | **Bajo** | No implica soporte IT del cliente si no se abre |
| Tab **Marketing** | Próximamente | **Bajo** | Idem |
| **LEADS87** en strings reportes | **No encontrado** | — | Búsqueda en archivos reportes inspeccionados |
| Subtítulo hub | *«Catálogo de reportes… Elegí un rol»* | **Bajo** | Genérico; claro para demo interna |

**Clasificación:** **Comercial Leads = OK** para demo interna y export CSV. Hub y roles extra = **tolerables** con guion (“solo Leads está conectado hoy”).

---

### C. Agenda

| Elemento | Estado | Severidad | Notas |
|----------|--------|-----------|-------|
| Subtítulo | *«Acciones pendientes de **leads y actividades comerciales**…»* | — **OK** (12S) | **Repo** L833-835; ya no dice «socios» |
| Filtro **Dueño**: Leads / plural personalizado | Opción `socio` → label **`labelPluralAgenda`** | **Medio** (P2) | Default personalización: **«Socios»** (`lib/personalizacion.ts`); en modal dueño: **«Socio»** singular |
| Crear actividad — dueño **Lead** vs **Socio** | Misma lógica | **Medio** (P2) | Tolerable si personalización del portal dice «Cliente»; sin override sigue «Socio» |
| Lista — prefijo **SOCIO:** | Visible en ítems `owner_type === "socio"` | **Bajo** (P2) | Técnico; poco frecuente si demo solo usa leads |
| Tipos: **Llamada, WhatsApp, Email, Reunión** | — **OK** | — | Adecuados para CRM accesorios / seguimiento |
| Enlace **Dashboard comercial** | Lleva a `/admin/dashboard` | **Inferido** | Refuerza que dashboard es alcanzable aunque no esté en menú piloto |

**Doc 12S-V:** Agenda copy marcada como no revalidada en pasada visual §6; subtítulo corregido en código (**Repo**).

---

### D. Shell / marca

| Elemento | Estado | Severidad | Notas |
|----------|--------|-----------|-------|
| **Summer87 Intelligence** (`suiteName`) | Visible breadcrumb / footer | **Medio** (P2/P3) | `appSuiteConfig.ts` |
| **Summer87 Leads** (módulo menú `leads87`) | Label sidebar por defecto | **Medio** (P2/P3) | White-label Pickup = fase posterior |
| Footer sidebar: *«Summer87 Intelligence • panel admin»* | **Repo** `AdminShell.tsx` | **Bajo** (P2) | Demo interna OK |
| Logo **`/licencia.png`** | Fijo; no `CLIENT_SLUG` | **P3** | No marca Pickup 4x4 |
| Menú `client_crm` | Filtrado por modo + `CLIENT_VISIBLE_MODULES` | — | **Inferido** desde `adminSidebarModules.ts` + docs 12J: típicamente Leads, Agenda, Reportes; sin Iniciativas/Clientes en menú piloto |
| **Iniciativas** / **Clientes** en defaults | Ocultos del menú si no están en allowlist | — | Ruta `/admin/empresas` puede seguir existiendo; fuera de menú piloto |

---

### E. Ficha lead residual (solo auditoría; sin corrección)

| Elemento | Visible en `client_crm` | Severidad | Notas |
|----------|-------------------------|-----------|-------|
| Tabs **Técnico** / **Consultor** | **Depende del rol** | **Medio** (P2) | `getVisibleLeadTabs`: rol **comercial** → solo datos, comercial, contactos, acciones (**Repo**). Rol **admin** → todas las tabs incl. Técnico/Consultor |
| Copy **servicios EASY** / tab Consultor | Si se abre tab Consultor | **Medio** (P2) | Ej. pasos del proceso referencian Consultor; no oculto por `isClientCrmUi` |
| Bloque **«Datos de Iniciativa»** en acordeón datos | **Sí** (si se expande «Datos del lead») | **Medio** (P2) | No envuelto en `!isClientCrmUi`; campos empresa/iniciativa visibles |
| Aviso *«no está vinculado a una iniciativa»* | En tab datos sin `empresa_id` | **Medio** (P2) | Módulo iniciativas fuera de menú piloto; puede confundir en demo |
| **Relevamiento de visita** | **Oculto** en `client_crm` | — **OK** (12S) | `!isClientCrmUi` (**Doc 12S-V** + **Repo**) |

**¿Bloquean demo comercial?** **No**, si el guion evita abrir tabs Consultor/Técnico (usuario comercial) y no expande iniciativa. **Sí restan credibilidad** si un admin recorre la ficha completa.

---

## 5. Tabla consolidada de hallazgos

| ID | Área | Texto/bloque | Tipo | Severidad | Corregir ahora sí/no | Recomendación |
|----|------|--------------|------|-----------|----------------------|---------------|
| 12T-UX-01 | Dashboard | Título «Flujo comercial LEADS87» | Marca/producto | Alta (P1) | Recomendable | Renombrar a «Flujo comercial» |
| 12T-UX-02 | Dashboard | Hint «Diagnóstico, estrategia, servicios» | Copy consultivo | Alta (P1) | Recomendable | Copy genérico seguimiento/cotización |
| 12T-UX-03 | Dashboard | Hint «CRM cerrado o flujo 100%» | Copy mixto | Media (P1) | Recomendable | «Ganado, perdido o proceso completo» |
| 12T-UX-04 | Dashboard | Párrafo «listado LEADS87 (macro flow)» | Marca/producto | Media (P1) | Recomendable | Neutralizar referencia LEADS87 |
| 12T-UX-05 | Dashboard | «avance LEADS87» en Top oportunidades | Marca/producto | Media (P2) | Opcional | Misma línea que 12T-UX-04 |
| 12T-UX-06 | Dashboard | «avance real LEADS87» en Pipeline total | Marca/producto | Media (P2) | Opcional | Idem |
| 12T-UX-07 | Dashboard | Banner Summer87 Intelligence / Summer87 Leads | Marca plataforma | Media (P2) | No (fase 3) | White-label posterior |
| 12T-UX-08 | Dashboard | Bloques salud, prioridades, alertas, propuestas, conversión | Genérico CRM | — | No | Mantener |
| 12T-UX-09 | Reportes | Hub «Próximamente» / tags próximo | Roadmap | Baja (P2) | No | Explicar en guion demo |
| 12T-UX-10 | Reportes | Tabs Marketing / Técnico / Administración | Catálogo multi-rol | Baja (P2) | No | Mantener |
| 12T-UX-11 | Reportes | Comercial → Leads + CSV | Operativo | — | No | OK |
| 12T-UX-12 | Reportes | Filtros disabled «próximamente» | UX incompleta | Baja (P2) | No | No bloquea CSV/listado |
| 12T-UX-13 | Agenda | Subtítulo leads y actividades comerciales | Copy | — | No | OK (12S) |
| 12T-UX-14 | Agenda | Dueño «Socio» / «Socios» (default personalización) | Terminología | Media (P2) | Opcional | Ajustar personalización portal → «Cliente» |
| 12T-UX-15 | Agenda | Tipos llamada / WhatsApp / email / reunión | Operativo | — | No | OK |
| 12T-UX-16 | Shell | Summer87 Intelligence / Leads / panel admin | Marca | Media (P2/P3) | No (fase 3) | White-label |
| 12T-UX-17 | Shell | Logo licencia.png | Marca | Baja (P3) | No | Futuro |
| 12T-UX-18 | Ficha | Tabs Técnico / Consultor (rol admin) | Consultoría | Media (P2) | No en 12T mínimo | Ocultar por rol/modo en fase posterior |
| 12T-UX-19 | Ficha | Bloque «Datos de Iniciativa» + aviso sin vínculo | Módulo fuera piloto | Media (P2) | No en 12T mínimo | Ocultar en `client_crm` fase posterior |
| 12T-UX-20 | Ficha | Referencias EASY / Consultor en flujo | Consultoría | Media (P2) | No si no se abre tab | Guion demo |

---

## 6. Priorización

### P0 — corregir antes de demo comercial (solo si visible al entrar sin guion)

| ID | Criterio |
|----|----------|
| — | **Ninguno crítico nuevo** detectado en repo para Leads/Agenda/Reportes Leads ya corregidos en 12S |
| 12T-UX-01…04 | **Solo P0** si la demo **abre dashboard** como primera pantalla (enlace Agenda o URL directa): el bloque LEADS87 es lo primero bajo el banner |

### P1 — recomendable

- 12T-UX-01 a 12T-UX-04 (bloque y hints **CommercialFlowKpis**)

### P2 — tolerable con guion

- 12T-UX-05, 12T-UX-06 (menciones LEADS87 secundarias)
- 12T-UX-07, 12T-UX-09, 12T-UX-10, 12T-UX-12, 12T-UX-14, 12T-UX-16
- 12T-UX-18, 12T-UX-19, 12T-UX-20 (ficha si no se recorre)

### P3 — futuro

- White-label Pickup 4x4, logo, `CLIENT_NAME` en shell
- Dashboard específico por Constructor / configuración por instancia
- Ocultar catálogo reportes multi-rol en `client_crm`

---

## 7. Recomendación de enfoque

| Opción | Descripción | Valoración |
|--------|-------------|------------|
| **A** | No tocar por ahora | Válida si demo **no** pasa por dashboard |
| **B** | Renombrar copy Dashboard LEADS87 a genérico | **Recomendada (mínima)** — 1 archivo principal (`CommercialFlowKpis.tsx`) + 2 subtítulos opcionales |
| **C** | Ocultar bloque LEADS87 en `client_crm` | Riesgo: dashboard pierde narrativa de progreso macro |
| **D** | Dashboard específico `client_crm` | **Fuera de alcance** — sobre-ingeniería para esta fase |

**Enfoque mínimo sugerido (si 12T-ux-fix):**

1. `CommercialFlowKpis.tsx`: título **«Flujo comercial»**; hints neutros; párrafo sin «LEADS87».
2. Opcional mismo PR: `TopOpportunities.tsx`, `PipelineSummary.tsx` (quitar «LEADS87» en una línea cada uno).
3. **No** crear dashboard nuevo; **no** white-label; **no** tocar seguridad 403 ni APIs.

---

## 8. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Tocar dashboard altera narrativa ya usada en validaciones internas | Cambiar solo strings visibles; no lógica de buckets/KPIs |
| Ocultar demasiado deja dashboard “vacío” | Preferir renombre (B) frente a ocultar (C) |
| Cambiar marca Summer87 abre conversación comercial mayor | Dejar 12T-UX-07/16 para fase branding |
| Reportes «próximamente» pueden parecer producto incompleto | Guion: roadmap; destacar **Leads + CSV** |
| Tabs técnico/consultor útiles para otros CRMs / rol admin | No eliminar globalmente; evaluar `client_crm` + rol en fase posterior |
| Personalización «Socio» vs «Cliente» | Config portal, no código, si se desea |

---

## 9. Dictamen

| Afirmación | Estado |
|------------|--------|
| **GO técnico** (`client_crm`, dataset, APIs) | **Se mantiene** (sin cambios en esta auditoría) |
| **GO visual Leads principales** | **Cerrado en 12S** (**Doc 12S-V** §10) |
| **Dashboard / reportes / shell** | **Requieren decisión de producto** |
| ¿Fase **12T-ux-fix**? | **Opcional y acotada**: solo si la demo comercial incluye dashboard; entonces **P1** (opción B), no refactor |
| ¿Bloquea **12M Go/No-Go** demo interna? | **No**, con guion centrado en Leads + Agenda + Reporte Leads |

---

## 10. Próximo paso recomendado

1. **Producto:** confirmar si el guion de demo comercial pasa por **Dashboard** (`/admin/dashboard`).
2. **Si sí** → crear `plan-correccion-ux-copy-pickup4x4-client-crm-12T-ux-fix-plan.md` con alcance **UX-01…04** (+ opcional UX-05/06) y fase **12T-ux-fix-impl-1** (estimación: 1 PR pequeño, sin SQL).
3. **Si no** → avanzar a **12M Go/No-Go demo interna** manteniendo pendientes como deuda documentada (12T-UX-07…20, P2/P3).
4. Revalidación visual Vercel post-fix: dashboard + smoke 403 (patrón 12S-1V).

---

## 11. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| TypeScript / componentes editados | ❌ No |
| SQL ejecutado / creado | ❌ No |
| Supabase / datos tocados | ❌ No |
| `.env.local` | ❌ No |
| Commits | ❌ No |
| Solo auditoría documental | ✅ Sí |

---

*Auditoría 12T — superficies restantes post-12S para decisión de fase 12T-ux-fix mínima.*
