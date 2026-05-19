# Plan Materialización Pipeline Contrato → leads_pipelines — 12W-4c

**Versión:** 12W-4c — plan documental (sin ejecución)  
**Proyecto:** summer87-leads-v3 / Constructor CRM  
**Base cerrada:** 12W-4 adapter (`886c172`), 12W-4b wiring contexto + DOM (`b136337`, GO visual y técnico)  
**Estado del plan:** listo para revisión de producto/arquitectura. **No** incluye SQL ejecutable ni cambios en código.

---

## 1. Resumen ejecutivo

Hoy el **contrato** (`crm_package_config.pipeline.stages[]`) y la **operación** (`leads_pipelines` + `leads.pipeline` como texto) viven en paralelo: el adapter y el contexto ya exponen 9 etapas Pickup en cliente, pero Nuevo Lead, Kanban y ficha siguen leyendo y guardando **nombres** legacy desde Supabase.

La materialización 12W-4c debe **alinear el catálogo operativo** con el contrato **sin romper** leads existentes, informes que filtran por `leads.pipeline`, ni la política de cierre (`leadStatusPolicy`) que depende del **nombre normalizado**, no de `key`.

La estrategia recomendada es **faseada y conservadora**: (1) extender esquema con `stage_key` estable opcional, (2) **upsert idempotente** de filas desde contrato usando `label` → `nombre`, (3) **tabla de mapeo** explícita legacy → nuevo `nombre` antes de tocar filas de `leads`, (4) recién después conectar UI si hace falta (muchas pantallas ya consumen API), (5) nunca borrar etapas legacy con leads referenciados sin migración previa.

Este documento **no ejecuta** SQL ni migraciones. Cualquier script será entregado en fases posteriores y aplicado **manualmente por Daniel** en Supabase, con backup previo.

---

## 2. Estado actual

### 2.1 Contrato (12V-2 / Pickup demo)

Fuente: `lib/crmPackage/configs/pickup4x4.config.ts` → `pipeline.stages` (9 etapas).

| order | key | label | terminal |
|------:|-----|-------|----------|
| 1 | `nuevo_contacto` | Nuevo contacto | — |
| 2 | `consulta_calificada` | Consulta calificada | — |
| 3 | `vehiculo_identificado` | Vehículo identificado | — |
| 4 | `necesidad_detectada` | Necesidad detectada | — |
| 5 | `presupuesto_enviado` | Presupuesto enviado | — |
| 6 | `negociacion` | Negociación | — |
| 7 | `venta_ganada` | Venta ganada | `won` |
| 8 | `venta_perdida` | Venta perdida | `lost` |
| 9 | `postventa_seguimiento` | Postventa / seguimiento | — |

Adapter: `packageToPipelineStages` → snapshot en `LeadsClientCrmContext` (12W-4b). DOM validado: `data-crm-package-pipeline-source="contract"`, `count="9"`.

### 2.2 Tabla operativa `leads_pipelines`

Evidencia: `estructura_base.sql`, migraciones `020_*`, `021_*`, API `app/api/admin/leads/pipelines/route.ts`.

| Columna | Rol |
|---------|-----|
| `id` | UUID — identidad de fila; **no** usada en `leads.pipeline` |
| `nombre` | Texto mostrado en UI; **único** (`leads_pipelines_nombre_uq` sobre `lower(nombre)`) |
| `posicion` | Orden legacy (entero) |
| `orden` | Orden preferido en listados (Kanban, GET pipelines) |
| `tipo` | `normal` \| `ganado` \| `perdido` — máx. **una** fila `ganado` y **una** `perdido` (validado en API POST) |
| `color` | Opcional UI |

**No existe hoy** columna `stage_key`, `client_slug` ni vínculo FK contrato → fila.

### 2.3 Valor persistido en leads

| Campo | Tabla | Formato |
|-------|-------|---------|
| `pipeline` | `leads` | **string = `nombre`** de etapa (no UUID, no `key` contrato) |

Default en `POST /api/admin/leads`: `"Nuevo"` si no se envía pipeline.

Kanban (`app/admin/leads/kanban/page.tsx`): agrupa cards con `norm(lead.pipeline) === norm(column.nombre)`.

Ficha (`app/admin/leads/[id]/page.tsx`): selector y PATCH usan **nombre** de filas devueltas por API.

### 2.4 API pipelines (comportamiento relevante)

- **GET** `/api/admin/leads/pipelines`: lista ordenada; en cada request **asegura** existencia de filas `Nuevo`, `Ganado`, `Perdido` si faltan.
- **POST** creación manual: rechaza segundo `tipo=ganado` o `tipo=perdido`.
- **PATCH** reorder: actualiza `posicion` y `orden` por array de UUIDs.

Nuevo Lead: `GET` pipelines + fallback hardcodeado de 6 nombres si API vacía (`FALLBACK_PIPELINE_NAMES`).

### 2.5 Demo Vercel (Pickup) — observación operativa

En capturas post-12W-4b el select muestra etapas **legacy** distintas al contrato (p. ej. nombres de consultoría/operación histórica). El snapshot contrato está en DOM pero **no** alimenta el select. Coherente con alcance 12W-4b.

Inventario histórico (11Z): instancias madre pueden tener **decenas** de filas en `leads_pipelines` mezclando lenguajes de negocio.

---

## 3. Fuentes de verdad actuales

| Capa | Fuente | Qué gobierna | Consumidores |
|------|--------|--------------|--------------|
| **Contrato** | `crm_package_config` (loader 12W-1) | Definición **deseada** de etapas (`key`, `label`, `order`, `terminal`) | Adapter, contexto, futuro activador |
| **Catálogo UI** | `leads_pipelines` (Supabase) | Opciones de select, columnas Kanban, orden visual | Nuevo Lead, ficha, Kanban, config pipelines |
| **Estado del lead** | `leads.pipeline` (texto) | Etapa **real** del negocio por registro | Kanban, listados, reportes, `leadStatusPolicy` |
| **Política cierre** | `lib/leads/leadStatusPolicy.ts` | Conjunto de **nombres** normalizados cerrados (`ganado`, `perdido`, `cerrado`, `no interesado`, …) | Kanban drag, ficha, métricas |
| **Setup Constructor** | `crm_setup_config.proceso_pipeline` (JSONB) | Wizard / simulación pre-instalación | Constructor; **no** sincronizado con `leads_pipelines` (comentario migración 070) |
| **Fallback UI** | Constantes en cliente | 6 nombres si API falla | Solo Nuevo Lead |

**Regla de convivencia hasta materializar:** el contrato es verdad **declarativa**; `leads_pipelines` + `leads.pipeline` son verdad **operativa**. No forzar una sola fuente sin migración.

---

## 4. Brecha principal

| Dimensión | Contrato | Operativo hoy |
|-----------|----------|---------------|
| Identificador estable | `key` (`nuevo_contacto`, …) | `id` UUID en catálogo; leads guardan **`nombre`** |
| Etiqueta humana | `label` | `nombre` en tabla (puede diferir del `label`) |
| Cardinalidad Pickup | 9 etapas 4x4 | 6–18+ filas según instancia/seed histórico |
| Terminales | `terminal: won \| lost` | `tipo: ganado \| perdido` (máx. 1 fila por tipo) |
| POST / Kanban | — | Comparan y persisten **string `nombre`** |
| Sincronización | Snapshot en contexto (12W-4b) | **Cero** escritura automática contrato → DB |

**Riesgo central:** materializar solo **insertando** 9 filas nuevas sin migrar `leads.pipeline` deja leads huérfanos (valores que no matchean columnas Kanban) o duplica semántica (`Ganado` vs `Venta ganada`).

**Riesgo secundario:** `UNIQUE (lower(nombre))` impide dos filas con el mismo label; renombrar filas legacy rompe joins por nombre si no se actualiza `leads.pipeline` en el mismo paso.

---

## 5. Opciones de materialización

### Opción A — Solo catálogo (upsert filas, sin tocar leads)

**Qué hace:** Inserta/actualiza 9 filas en `leads_pipelines` desde contrato (`nombre` = `label`, `orden` = `order`, `tipo` desde `terminal`). No modifica `leads.pipeline`.

| Pros | Contras |
|------|---------|
| Bajo riesgo inmediato en datos de leads | Select/Kanban muestran **más** etapas (legacy + nuevas) hasta limpieza |
| Permite validar catálogo en UI | Leads viejos siguen en nombres legacy — columnas Kanban vacías o mezcladas |
| Idempotente si se define clave de upsert | No cierra la brecha de negocio por sí sola |

### Opción B — Catálogo + migración de valores en `leads.pipeline`

**Qué hace:** A (catálogo) + `UPDATE leads SET pipeline = :nuevo WHERE pipeline = :legacy` según tabla de mapeo acordada.

| Pros | Contras |
|------|---------|
| Kanban y reportes coherentes post-migración | Requiere inventario SQL de valores distintos en `leads.pipeline` |
| Un solo idioma de etapas en operación | Errores de mapeo = leads mal clasificados |
| Alineado con POST existente (sigue siendo `nombre`) | Debe ejecutarse en ventana controlada con backup |

### Opción C — Reemplazo agresivo del catálogo (delete/rename legacy)

**Qué hace:** Elimina o renombra filas `leads_pipelines` que no estén en contrato; asume mapeo total.

| Pros | Contras |
|------|---------|
| Catálogo limpio rápido | **Alto riesgo** si hay leads o reportes históricos con nombres no mapeados |
| Menos ruido en select | Viola restricción API si quedan dos `tipo=ganado` tras merges mal hechos |

### Opción D — Extensión de esquema (`stage_key` + materialización)

**Qué hace:** Añade columna `stage_key` (nullable → obligatoria en instancias `client_crm`) en `leads_pipelines`; upsert por `stage_key`; `nombre` = `label` para UI/POST actual; opcionalmente `leads.pipeline_key` en fase muy posterior.

| Pros | Contras |
|------|---------|
| Trazabilidad contrato ↔ fila | Requiere migración DDL (fase SQL separada) |
| Permite renombrar `label` sin romper key | Más diseño; UI actual no lee `stage_key` |
| Base para multi-instancia futura | No desbloquea POST por `key` sin fase API |

### Opción E — Activador en Constructor (pre-instalación / simulate)

**Qué hace:** Endpoint o job del Constructor que materializa al aprobar paquete (`simulate-preinstall` / activación futura), scoped por `client_slug` cuando exista multi-tenant.

| Pros | Contras |
|------|---------|
| Alineado con plan 12V “activador escribe, adapter no” | Hoy `leads_pipelines` es **global por BD** (sin `client_slug`) |
| Repetible por cliente | Más alcance que Pickup demo puntual |

---

## 6. Recomendación

**Adoptar Opción D + B en subfases**, evitando C en instancias con datos reales:

1. **12W-4c-1 (diseño DDL — fase SQL posterior):** agregar `stage_key TEXT NULL` + índice único parcial `(stage_key) WHERE stage_key IS NOT NULL` en `leads_pipelines`. No tocar `leads` aún.
2. **12W-4c-2 (seed idempotente — fase SQL posterior):** upsert 9 filas Pickup desde contrato: `stage_key` = `key`, `nombre` = `label`, `orden`/`posicion` = `order`, `tipo` derivado de `terminal`.
3. **12W-4c-3 (inventario + mapeo — fase SQL posterior):** `SELECT DISTINCT pipeline FROM leads` + decisión producto fila a fila; `UPDATE leads.pipeline` solo donde haya mapeo 1:1 documentado.
4. **12W-4c-4 (deprecación catálogo legacy — opcional, SQL posterior):** desactivar/ocultar filas legacy **sin** DELETE si algún lead aún referencia el `nombre` (o migrar antes).
5. **12W-4d (código — fuera de este plan):** solo si hace falta: quitar fallback hardcodeado, feature flag `legacy_first`, o POST por `key` — **no** en la misma ventana que el primer seed.

**Por qué no A sola:** Pickup demo ya tiene filas legacy en `leads_pipelines`; A duplica etapas y confunde QA sin ganar coherencia en leads.

**Por qué no C:** incompatible con “no romper datos existentes” sin inventario previo exhaustivo.

**Por qué D:** el contrato ya está modelado en `key`; la operación hoy no tiene dónde guardarlo. `nombre` sigue siendo el wire format de UI/API hasta una fase POST explícita.

---

## 7. Diseño de mapping

### 7.1 Contrato → `leads_pipelines` (filas nuevas o upsert)

| Campo contrato | Columna destino | Regla |
|----------------|-----------------|-------|
| `key` | `stage_key` (nueva) | Identificador estable; único cuando no null |
| `label` | `nombre` | Lo que verán select, Kanban y POST |
| `order` | `orden`, `posicion` | Mismo entero en ambos al inicio (alineado con PATCH reorder) |
| `terminal: won` | `tipo = 'ganado'` | Solo una fila `ganado` en catálogo Pickup → `venta_ganada` |
| `terminal: lost` | `tipo = 'perdido'` | Solo una fila `perdido` → `venta_perdida` |
| sin terminal | `tipo = 'normal'` | Incluye `postventa_seguimiento` |

### 7.2 Terminales vs `leadStatusPolicy`

`leadStatusPolicy` cierra leads por **nombre normalizado**, no por `tipo` de catálogo.

| Contrato | `nombre` materializado | ¿Cierra lead? |
|----------|------------------------|---------------|
| `venta_ganada` | Venta ganada | Sí, si se agrega alias normalizado `"venta ganada"` **o** se mapea política a incluir ese nombre; hoy el set incluye `"ganado"`, no `"venta ganada"` |
| `venta_perdida` | Venta perdida | Ídem con `"venta perdida"` vs `"perdido"` |

**Decisión producto pendiente (bloqueante para 4c-3):**

- **P1 — Alias en política:** extender `CLOSED_LEAD_PIPELINES_NORMALIZED` con formas normalizadas de los labels Pickup.
- **P2 — Nombres materializados legacy-friendly:** materializar `nombre` = `Ganado` / `Perdido` para filas terminales pero conservar `stage_key` `venta_ganada` / `venta_perdida` (UI muestra label distinto — **rompe** igualdad label=nombre).
- **P3 — Mantener nombres cortos en `nombre`:** `Ganado`, `Perdido` como `nombre` operativo y `label` solo en UI futura — requiere cambio de contrato o display layer.

**Recomendación:** **P1** en fase código pequeña post-SQL + materializar `nombre` = `label` del contrato para coherencia Kanban/POST.

### 7.3 Mapeo legacy → contrato (plantilla, completar con inventario real)

Ejecutar en fase SQL posterior (solo como diseño):

| `leads.pipeline` / `leads_pipelines.nombre` legacy (ejemplos históricos) | Acción | `nombre` destino (contrato) | `stage_key` |
|--------------------------------------------------------------------------|--------|----------------------------|-------------|
| `Nuevo`, `Nuevo lead` | merge | Nuevo contacto | `nuevo_contacto` |
| `Ganado`, `Cerrado` | merge → terminal won | Venta ganada | `venta_ganada` |
| `Perdido`, `No interesado` | merge → terminal lost | Venta perdida | `venta_perdida` |
| Etapas consultoría sin equivalente (Visita, Diagnóstico comercial, …) | **sin auto-mapeo** | — | Requiere decisión manual o etapa “legacy” temporal |
| Filas catálogo huérfanas sin leads | deprecar fila | — | Ocultar de UI o `activo=false` si se agrega columna |

**Regla:** ningún `UPDATE leads.pipeline` sin fila previa en tabla de mapeo firmada por producto.

### 7.4 Compatibilidad API “un solo ganado / un solo perdido”

Antes del seed:

1. Inventariar filas existentes con `tipo IN ('ganado','perdido')`.
2. Si hay `Ganado` legacy y se insertará `Venta ganada` como `ganado`, **reclasificar o renombrar** la fila legacy en la misma transacción (no dos filas `tipo=ganado`).

---

## 8. Impacto por superficie

| Superficie | Dependencia actual | Impacto si solo se materializa catálogo (D+B) | Cambio código en 12W-4c |
|------------|-------------------|-----------------------------------------------|-------------------------|
| **Nuevo Lead** | GET pipelines → `nombre`; POST `pipeline: nombre` | Select mostrará nuevas etiquetas cuando API las devuelva; fallback 6 nombres sigue si lista vacía | **Ninguno** en este plan |
| **Kanban** | Columnas = filas API; cards por `lead.pipeline` ≈ `nombre` | Columnas nuevas aparecen; cards viejas quedan en columnas legacy hasta migrar `leads` | **Ninguno** |
| **Ficha lead** | Igual que Kanban para selector etapa | Igual | **Ninguno** |
| **Listado leads** | Muestra `pipeline` texto | Valores viejos visibles hasta migración | **Ninguno** |
| **Reportes comercial** | Filtro/agrupación por `leads.pipeline` | Distribución partida legacy/nuevo hasta 4c-3 | **Ninguno** |
| **Config pipelines** | CRUD API | Admin ve catálogo ampliado; cuidado no crear 2º ganado/perdido | **Ninguno** |
| **leadStatusPolicy** | Nombres normalizados | Puede dejar de cerrar leads si nombres cambian sin P1 | **Fase código posterior** |
| **Contexto 12W-4b** | DOM `contract/9` | Coherente con DB tras seed; DOM ya válido | **Ninguno** |
| **Constructor simulate** | Valida `pipeline_config` no vacío | Alineación narrativa; no escribe `leads_pipelines` hoy | Activador futuro (12W-4e+) |

---

## 9. SQL requerido más adelante (sin SQL ejecutable)

Las siguientes **categorías** de trabajo SQL serán entregadas en documentos/fases posteriores. Daniel las aplicará manualmente con backup (protocolo 11Q).

| # | Categoría | Objetivo | Notas |
|---|-----------|----------|-------|
| S1 | **DDL** | `ALTER TABLE leads_pipelines ADD COLUMN stage_key TEXT NULL` + índice único condicional | Reversible; sin datos obligatorios al inicio |
| S2 | **Inventario** | Conteo `leads_pipelines`; `SELECT DISTINCT pipeline FROM leads`; filas `tipo` ganado/perdido | Solo lectura; output pegado en doc de ejecución |
| S3 | **Seed idempotente** | Upsert 9 etapas Pickup desde contrato | Por `stage_key`; set `nombre`, `orden`, `posicion`, `tipo` |
| S4 | **Reconciliación terminales** | A lo sumo 1 fila `ganado` y 1 `perdido` | Merge/rename de legacy antes de insert |
| S5 | **Migración leads** | `UPDATE leads SET pipeline = … WHERE pipeline = …` | Transacción por lotes; validar rowcount |
| S6 | **Deprecación catálogo** | Marcar legacy sin borrar (columna `activo` o delete solo sin referencias) | Opcional; después de S5 |
| S7 | **Verificación** | Queries de huérfanos: leads.pipeline sin match en `leads_pipelines.nombre` | Criterio de GO datos |

**Explícitamente fuera de 12W-4c SQL inicial:** `ALTER leads ADD pipeline_key`, cambios RLS, triggers, rewrite masivo de históricos sin mapeo.

---

## 10. Plan de fases recomendado

| Fase | ID | Entregable | Owner típico |
|------|-----|------------|--------------|
| Plan | **12W-4c** | Este documento | Arquitectura / QA |
| DDL + diseño ejecución | **12W-4c-SQL-1** | Markdown con SQL revisable + checklist backup | Daniel + dev |
| Seed catálogo Pickup | **12W-4c-SQL-2** | Script upsert 9 etapas + reconciliación ganado/perdido | Daniel manual |
| Inventario y mapeo leads | **12W-4c-SQL-3** | Tabla mapeo firmada + UPDATE leads | Producto + Daniel |
| Validación operativa | **12W-4c-QA** | Nuevo Lead / Kanban / ficha / 1 reporte en Vercel | QA |
| Política cierre | **12W-4c-POL** | Ajuste `leadStatusPolicy` si P1 | Dev (código mínimo) |
| Deprecación legacy | **12W-4c-SQL-4** | Opcional — limpieza filas sin referencias | Daniel manual |
| UI/POST por key | **12W-4d+** | Solo si producto lo exige; no bloqueante para demo Pickup | Dev |

**Orden estricto:** S2 inventario → S1 DDL → S4 reconciliación → S3 seed → S5 migración leads → S7 verificación → QA.

---

## 11. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Leads huérfanos post-seed (pipeline string sin columna) | Alta si no hay S5 | Kanban cards en columna incorrecta / vacía | Inventario + mapeo antes de seed; verificación S7 |
| Duplicar `tipo=ganado` o `perdido` | Media | API POST pipelines falla; inconsistencia | S4 en misma transacción que S3 |
| Romper reportes históricos | Media | Métricas comparables inválidas | No renombrar sin UPDATE leads; conservar nombres legacy en vista histórica si hace falta |
| `leadStatusPolicy` deja de cerrar leads Pickup | Alta si `nombre` = label sin P1 | Leads “ganados” siguen activos en reglas | P1 antes o en paralelo a migración |
| Select con 20+ etapas (legacy + contrato) | Alta si solo S3 sin S6 | UX confusa | Fase deprecación o filtro API por `stage_key IS NOT NULL` (código futuro) |
| GET pipelines auto-inserta `Nuevo`/`Ganado`/`Perdido` | Baja | Recrea legacy tras limpieza | Documentar orden: seed contrato después de reconciliar terminales |
| Instancia multi-cliente futura | Media | Mezcla catálogos | `client_slug` en DDL futuro; fuera de Pickup demo |
| Ejecutar SQL sin backup | — | Irreversible | Protocolo 11Q obligatorio |

---

## 12. Qué NO hacer

- **No** ejecutar DELETE masivo en `leads_pipelines` sin inventario de `leads.pipeline` referenciados.
- **No** cambiar `POST /api/admin/leads` a guardar `key` en la misma ventana que el primer seed SQL.
- **No** sustituir el select de Nuevo Lead por lectura directa del snapshot de contexto **sin** filas operativas equivalentes en `leads_pipelines`.
- **No** asumir que `label` contrato = `nombre` legacy existente sin tabla de mapeo (p. ej. `Ganado` ≠ `Venta ganada` para política de cierre).
- **No** insertar dos filas `tipo=ganado` o dos `tipo=perdido`.
- **No** materializar desde `crm_setup_config.proceso_pipeline` (wizard) en lugar del contrato `crm_package_config` — son fuentes distintas hoy.
- **No** mezclar `leadFlow.ts` (pasos de proceso) con `pipeline.stages` (embudo comercial).
- **No** incluir SQL ejecutable en este documento ni correr migraciones desde CI/agentes.
- **No** tocar Kanban drag, ficha, sidebar, agenda, dashboard en la fase documental 12W-4c.

---

## 13. Dictamen final

**12W-4c (plan) está listo para aprobación:** la brecha entre contrato y operación está acotada, las superficies afectadas identificadas, y la ruta **D + B faseada** minimiza regresión respecto a Nuevo Lead, Kanban, ficha y reportes.

La materialización **no es un solo INSERT**: exige DDL ligero (`stage_key`), seed idempotente, reconciliación de terminales, mapeo explícito de `leads.pipeline`, y probable ajuste de política de cierre para labels Pickup.

Hasta completar SQL posterior, **12W-4b permanece válido**: snapshot en cliente OK; UI operativa legacy OK; no regresión.

---

## 14. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Solo documentación (`plan-materializacion-pipeline-contrato-leads-pipelines-12W-4c.md`) | ✅ |
| Código funcional modificado | ❌ No |
| TypeScript nuevo | ❌ No |
| `npm run build` ejecutado | ❌ No (no solicitado) |
| SQL ejecutado | ❌ No |
| Supabase / datos tocados | ❌ No |
| APIs modificadas | ❌ No |
| Commit realizado | ❌ No |

**Aplicación SQL:** exclusivamente en fases **12W-4c-SQL-*** posteriores, scripts revisables, ejecución **manual por Daniel** con backup previo.
