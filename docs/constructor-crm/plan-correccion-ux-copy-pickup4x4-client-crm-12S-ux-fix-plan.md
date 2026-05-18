# Plan Corrección UX/Copy Pickup 4x4 Client CRM 12S-ux-fix-plan — Constructor CRM Summer87

**Versión:** 12S-ux-fix-plan — plan documental (sin implementación)  
**Base:** `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md`  
**Contexto cerrado:** 12O-run, 12N-impl-run, 12O-post-dataset-run, 12S-ux-audit

**Estado:** planificado. **No** constituye corrección implementada ni validación **12S-ux-fix-impl-1V**.

---

## 2. Resumen ejecutivo

| Afirmación | Detalle |
|------------|---------|
| Sistema técnico | **OK** — demo Vercel `client_crm`, dataset Demo, seguridad 403 post-dataset |
| Problema visible | Copy y campos heredados de **Casalimpia** / facility / limpieza y sesgo **LEADS87** consultivo |
| Este documento | Define **corrección mínima** antes de una **demo comercial** más pulida |
| Implementación | **Pendiente** — fase **12S-ux-fix-impl-1** |
| Enfoque acordado | **A)** renombre genérico global donde sea seguro + **B)** ocultar/colapsar bloques facility en `APP_MODE=client_crm` |
| Fuera de alcance ahora | `CLIENT_SLUG` hardcodeado, configuración Constructor, refactor grande, SQL/schema |

---

## 3. Objetivo

| # | Objetivo |
|---|----------|
| 1 | Reducir sensación de **plantilla reciclada** en demo Pickup 4x4 |
| 2 | Eliminar referencias visibles a **Casalimpia** |
| 3 | Evitar campos y narrativas **facility** en superficie `client_crm` |
| 4 | Mantener **compatibilidad** con Casalimpia u otros clientes que usen los mismos campos |
| 5 | **No** tocar datos en BD ni columnas de schema |

---

## 4. Alcance mínimo

| Área | Problema (12S-ux-audit) | Acción propuesta | Prioridad |
|------|-------------------------|------------------|-----------|
| **Nuevo lead** | «Datos Casalimpia», personal, superficie, helper visita/costeo | Renombre genérico + ocultar campos en `client_crm` | **P0** |
| **Ficha lead** | Relevamiento visita, servicios limpieza, tabs consultoría | Ocultar/colapsar en `client_crm`; copy en `leadFlow` | **P0** |
| **Lista / Kanban** | Pipeline (DEBUG), progreso 13% | Quitar DEBUG; progreso: mantener por ahora | **P1** / **P2** |
| **Dashboard** | Bloque «LEADS87», hint diagnóstico/estrategia | Fase posterior o renombre si demo comercial | **P2** |
| **Agenda** | «leads y socios» | Copy genérico en `client_crm` | **P1** |
| **Reportes** | «próximamente» | Sin cambio salvo copy menor opcional | **P3** |
| **Marca / sidebar** | Summer87 vs Pickup | **No tocar** en esta fase | **P3** |

---

## 5. Decisión de producto

| Opción | Descripción | Uso en este plan |
|--------|-------------|------------------|
| **A** | Renombre **genérico global** (strings neutros) | **Sí** — títulos, helpers, `leadFlow` donde no rompa Casalimpia |
| **B** | Ocultar/colapsar por **`APP_MODE=client_crm`** | **Sí** — bloques facility, campos personal/superficie, relevamiento |
| **C** | Condicionar por **`CLIENT_SLUG=pickup4x4`** | **No** por ahora — salvo necesidad puntual no cubierta por B |
| **D** | Configuración desde **Constructor** (campos por instancia) | **Futuro** — no en 12S-ux-fix-impl-1 |

**Recomendación:**

- Implementar **A + B mínima** en una sola fase acotada.
- **No C** salvo que A+B deje copy incorrecto para otro cliente en el mismo modo.
- **D** como evolución estructural (preset `pickup_4x4` ya existe en API Constructor; no visible en demo actual).

**Patrón técnico esperado:** `isClientCrmMode()` desde `lib/config/appMode.ts` (ya usado en hardening 12I).

---

## 6. Cambios propuestos — Nuevo lead

Archivo principal: `app/admin/leads/nuevo/page.tsx`

| Elemento actual | Problema | Cambio mínimo | Archivo probable | Riesgo |
|-----------------|----------|---------------|------------------|--------|
| **Datos Casalimpia** | Cliente hardcodeado | → **«Datos operativos del lead»** (global A) | `nuevo/page.tsx` | Bajo |
| Helper visita/evaluación/costeo | Facility | → *«Estos datos ayudan a entender la necesidad, preparar el seguimiento y avanzar hacia una cotización.»* (A) | `nuevo/page.tsx` | Bajo |
| **Cantidad de personal** | No aplica Pickup | **Ocultar** si `isClientCrmMode()` (B); en modo factory mantener label actual | `nuevo/page.tsx` | Medio — validar que Casalimpia no use solo `client_crm` |
| **Superficie m²** | No aplica Pickup | **Ocultar** en `client_crm` (B) | `nuevo/page.tsx` | Medio |
| **Fecha de visita** | Ambiguo | → **«Fecha de revisión / visita»** (A); mantener campo y envío API | `nuevo/page.tsx` | Bajo |
| **Dirección** | OK | Mantener | `nuevo/page.tsx` | — |
| **Rubro** | OK si catálogo sirve | Mantener | `nuevo/page.tsx` | Bajo |
| **Producto / servicio consultado** | Alineado Pickup | Mantener | `nuevo/page.tsx` | — |
| **Comercial** | OK | Mantener | `nuevo/page.tsx` | — |
| **Pipeline** | OK | Mantener | `nuevo/page.tsx` | — |

**Recomendación de etapa:** ocultar **personal** y **superficie** solo en `client_crm`; renombrar fecha; no eliminar campos del payload si el backend los acepta opcionales (valores vacíos/null).

**Nota:** revisar si existe `app/admin/leads/nueva/page.tsx` o alias de ruta; aplicar mismos cambios si comparte formulario.

---

## 7. Cambios propuestos — Ficha de lead

Archivos: `app/admin/leads/[id]/page.tsx`, `lib/leads/leadFlow.ts`

| Elemento | Cambio mínimo | Modo |
|----------|---------------|------|
| **Relevamiento de visita** (sección completa) | Colapsar por defecto u **ocultar** en `client_crm` (B) | No borrar datos existentes en BD |
| **Servicios especiales** (alfombras, fumigación, etc.) | **Ocultar** bloque en `client_crm` (B) | Casalimpia en modo no-client sigue viendo |
| Tabs **Técnico / Consultor / Comercial** | **Fase posterior** — ocultar solo si aparecen en recorrido demo y confunden | Evitar refactor amplio en impl-1 |
| *«servicios de limpieza»* en flujo | → **«productos o servicios a cotizar»** (A) | `leadFlow.ts` |
| Paso **«Visita»** | Label → **«Revisión»**; descripción neutra (A) | `leadFlow.ts` |
| Paso **«Costeo»** | Label → **«Cotización»** (A) | `leadFlow.ts` |
| **«Datos del prospecto»** | → **«Datos del lead»** (A) o mantener (aceptable B) | `leadFlow.ts` + ficha ~3968 |
| CTAs *superficie*, *instalación*, *limpieza* en `getLeadNextAction` | Reemplazar por copy neutro (A) | `leadFlow.ts` |
| Comentario `Casalimpia flow helpers` | Renombrar a `facility` / `operational` (A, cosmético) | `leadFlow.ts` |

**Compatibilidad Casalimpia:** lógica de progreso que usa `visita_relevamiento_json` puede seguir en servidor; solo se reduce **superficie visible** en `client_crm`.

---

## 8. Cambios propuestos — Lista / Kanban

Archivos: `app/admin/leads/page.tsx`, `app/admin/leads/kanban/page.tsx`

| Elemento | Acción | Prioridad |
|----------|--------|-----------|
| Progreso **13%** + paso «Datos del prospecto» | **Mantener** en impl-1; mejora copy en `leadFlow` reduce fricción | P2 |
| **Pipeline (DEBUG)** | **Ocultar** columna antes de demo externa (A o quitar thead) | P1 |
| **Nuevo lead**, **Mostrar ganados** | Mantener | — |
| Kanban columnas | Mantener | — |

---

## 9. Cambios propuestos — Dashboard

Archivos: `app/admin/dashboard/page.tsx`, `components/crm/dashboard/CommercialFlowKpis.tsx`

| Elemento | Acción | Prioridad |
|----------|--------|-----------|
| Sección **«Flujo comercial LEADS87»** | **Impl-1: no tocar** (UXFIX-10 posterior); demo interna tolerable | P2 |
| Hint *«Diagnóstico, estrategia, servicios»* | Si se cambia en fase 2: → *«Seguimiento comercial, cotizaciones y oportunidades»* | P2 |
| Salud pipeline, acciones vencidas, alertas, top oportunidades | **Mantener** | — |
| Badge suite Summer87 en cabecera | **Mantener** en esta fase | — |

**Opción demo comercial (fase 2):** envolver `CommercialFlowKpis` con `!isClientCrmMode()` o título genérico «Flujo comercial».

---

## 10. Cambios propuestos — Agenda

Archivo: `app/admin/agenda/page.tsx`

| Elemento | Cambio mínimo |
|----------|---------------|
| Subtítulo *«Acciones pendientes de leads y socios…»* | En `client_crm`: *«Acciones pendientes de leads y actividades comerciales (últimos 30 días + próximos 14 días)»* (A+B) |
| Dueño Lead / Socio | **Mantener** funcionalidad en impl-1 |
| Tipos llamada / WhatsApp / email / reunión | **Mantener** |

**Futuro:** ocultar opción `socio` en selector cuando instancia sea solo leads.

---

## 11. Cambios propuestos — Reportes

Archivos: `app/admin/reportes/ReportesClient.tsx`, `comercial/leads/page.tsx`

| Elemento | Acción |
|----------|--------|
| Hub «Referencia» / «Próximamente» | **Aceptable** demo interna — sin cambio |
| Reporte Comercial → Leads (12/12) | **No tocar** |
| Tooltips «filtro próximamente» inconsistentes | Opcional copy menor — **P3** |

---

## 12. Cambios propuestos — Marca / sidebar

| Elemento | Acción |
|----------|--------|
| **Summer87 Intelligence** / **Summer87 Leads** | **Mantener** en impl-1 |
| White-label **Pickup 4x4** | Fase futura (ENV, `APP_SUITE_CONFIG`, o branding cliente) |
| `AdminShell.tsx` breadcrumb «panel admin» | Sin cambio |

---

## 13. Matriz de implementación mínima

| ID | Cambio | Archivo probable | Tipo | Prioridad | Complejidad | Riesgo | ¿Impl-1? |
|----|--------|------------------|------|-----------|-------------|--------|----------|
| UXFIX-01 | «Datos Casalimpia» → «Datos operativos del lead» | `nuevo/page.tsx` | Copy A | P0 | Baja | Bajo | **Sí** |
| UXFIX-02 | Helper genérico cotización/seguimiento | `nuevo/page.tsx` | Copy A | P0 | Baja | Bajo | **Sí** |
| UXFIX-03 | Ocultar personal + superficie en `client_crm` | `nuevo/page.tsx` | UI B | P0 | Media | Medio | **Sí** |
| UXFIX-04 | «Fecha de visita» → «Fecha de revisión / visita» | `nuevo/page.tsx` | Copy A | P1 | Baja | Bajo | **Sí** |
| UXFIX-05 | «servicios de limpieza» → «productos o servicios a cotizar» | `leadFlow.ts` | Copy A | P0 | Baja | Medio* | **Sí** |
| UXFIX-06 | Visita → Revisión; Costeo → Cotización (+ descripciones neutras) | `leadFlow.ts` | Copy A | P1 | Media | Medio* | **Sí** |
| UXFIX-07 | Ocultar «Servicios especiales» + opcional relevamiento en `client_crm` | `[id]/page.tsx` | UI B | P0 | Media | Medio | **Sí** |
| UXFIX-08 | Agenda subtitle leads/actividades comerciales | `agenda/page.tsx` | Copy B | P1 | Baja | Bajo | **Sí** |
| UXFIX-09 | Ocultar columna Pipeline (DEBUG) | `leads/page.tsx` | UI A | P1 | Baja | Bajo | **Sí** |
| UXFIX-10 | Dashboard LEADS87 — ocultar o renombrar | `CommercialFlowKpis.tsx` | UI A/B | P2 | Media | Medio | **No** (fase 2) |
| UXFIX-11 | «Datos del prospecto» → «Datos del lead» | `leadFlow.ts`, `[id]/page.tsx` | Copy A | P2 | Baja | Bajo | Opcional impl-1 |
| UXFIX-12 | Tabs Técnico/Consultor — ocultar en `client_crm` | `[id]/page.tsx` | UI B | P2 | Alta | Alto | **No** |

\* `leadFlow.ts` alimenta lista, ficha y tooltips — validar que Casalimpia en modo no-`client_crm` sigue entendiendo el flujo.

---

## 14. Reglas técnicas para implementación futura (12S-ux-fix-impl-1)

| Regla | Detalle |
|-------|---------|
| Schema | **No** borrar columnas ni migraciones |
| APIs | **No** modificar salvo necesidad extrema; preferir solo UI |
| Modo | Usar `isClientCrmMode()` de `lib/config/appMode.ts` |
| Slug | **No** introducir `CLIENT_SLUG=pickup4x4` hardcodeado en componentes |
| Duplicación | Extraer constantes de copy en un solo archivo solo si reduce riesgo; evitar over-engineering |
| Casalimpia | Campos ocultos en UI **≠** eliminados del modelo; modo factory/internal puede seguir mostrándolos |
| Build | `npm run build` obligatorio antes de cerrar impl |
| Runtime | Validar `APP_MODE=client_crm` local y/o Vercel demo |
| UI | Mantener **un CTA verde principal** por pantalla si se toca layout |
| Seguridad | **No** reabrir rutas/APIs; smoke 403 post-fix opcional (12O-post corto) |
| Datos Demo | **No** borrar ni migrar registros existentes |

**Orden sugerido de edición:** `leadFlow.ts` (copy global) → `nuevo/page.tsx` → `[id]/page.tsx` (ocultar bloques) → `agenda/page.tsx` → `leads/page.tsx` (DEBUG).

---

## 15. Validación esperada después del fix

Marcar en **12S-ux-fix-impl-1V** (futuro):

### Copy / UI

- [ ] Nuevo lead **no** muestra «Datos Casalimpia»
- [ ] En `client_crm`, **no** aparecen Cantidad de personal ni Superficie m²
- [ ] **No** aparece texto «servicios de limpieza» en flujo visible
- [ ] Ficha en `client_crm` **no** muestra checklist de servicios facility (o está colapsado)
- [ ] Lista **sin** columna Pipeline (DEBUG)
- [ ] Agenda con subtítulo actualizado

### Funcional (regresión demo)

- [ ] 12 leads Demo siguen visibles (lista, kanban, reporte 12/12)
- [ ] Agenda: 8 actividades; crear/editar si se prueba
- [ ] Dashboard carga sin error
- [ ] Crear lead Demo sigue funcionando (campos visibles + comercial)

### Seguridad (smoke recomendado)

- [ ] Constructor / Configuración siguen **403**
- [ ] APIs críticas **8/8 → 403**
- [ ] `permissions/me` flags internas `false`

### Técnico

- [ ] `npm run build` OK

---

## 16. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Ocultar campos sin condicionar modo | Siempre envolver con `isClientCrmMode()` |
| Copy global afecta Casalimpia | Renombres **neutros**; facility solo oculto en B |
| `leadFlow` usado en múltiples pantallas | Probar lista + ficha + tooltips tras cambio |
| Demasiados cambios en ficha ([id] muy grande) | Solo ocultar secciones; no refactor tabs en impl-1 |
| Progreso 13% sigue confundiendo | Aceptado en impl-1; fase 2 simplificar pasos en `client_crm` |
| No sustituye Constructor configurable | Documentar como deuda **D** |

---

## 17. Dictamen

> **GO** para **planificar** corrección mínima **A + B** según esta matriz.  
> **NO-GO** para **implementar** sin revisar archivos concretos en Cursor y sin validar que la demo técnica ya funcional (**12N** + **12O-post**) **no regresa**.

---

## 18. Próximo paso recomendado

### Fase **12S-ux-fix-impl-1** (código — siguiente chat/tarea)

| Orden | Entregable |
|-------|------------|
| 1 | UXFIX-01, 02, 03, 04 en `nuevo/page.tsx` |
| 2 | UXFIX-05, 06 (y opcional 11) en `leadFlow.ts` |
| 3 | UXFIX-07 en `[id]/page.tsx` |
| 4 | UXFIX-08 en `agenda/page.tsx` |
| 5 | UXFIX-09 en `leads/page.tsx` |
| 6 | `npm run build` |
| 7 | Validación local y/o Vercel `client_crm` |
| 8 | Documento **`validacion-ux-copy-fix-pickup4x4-client-crm-12S-ux-fix-impl-1V.md`** |

### Después de impl-1

| Fase | Contenido |
|------|-----------|
| **12S-ux-fix-impl-2** (opcional) | UXFIX-10 dashboard LEADS87; UXFIX-12 tabs; simplificar progreso flujo |
| **12M** | Go/No-Go demo comercial con evidencia UX + técnica |

---

## 19. Confirmación de alcance (este documento)

| Ítem | Estado |
|------|--------|
| Código modificado | ❌ No |
| SQL / Supabase | ❌ No |
| Datos | ❌ No |
| Endpoints / APIs / middleware | ❌ No |
| Migraciones | ❌ No |
| Kore / Zeta | ❌ No |
| Commit | ❌ No |
| Implementación UX | ❌ Pendiente (**12S-ux-fix-impl-1**) |

---

*12S-ux-fix-plan — plan de corrección UX/copy Pickup 4x4. Auditoría origen: 12S-ux-audit.*
