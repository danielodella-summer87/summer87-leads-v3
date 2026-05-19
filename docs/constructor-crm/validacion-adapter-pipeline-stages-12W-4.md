# Validación Adapter Pipeline Stages 12W-4 — Constructor CRM Summer87

**Versión:** 12W-4 — adapter puro `pipeline.stages[]` → etapas normalizadas  
**Base:** 12V-1 plan (`1cb64e2`), 12V-2 tipos/demo (`696bdf5`), 12W-1 loader (`6cba550`), 12W-3b Nuevo Lead wiring (`c56259f`)  
**Estado:** adapter creado y exportado; **sin consumo en UI**; build local **OK** (2026-05-19).

---

## 1. Resumen del cambio

Se añade un **adapter puro** que traduce `pipeline.stages[]` del contrato `crm_package_config` en etapas ordenadas, claves deduplicadas y detección de terminales (`won` / `lost`).

| Qué | Detalle |
|-----|---------|
| Nuevo | `lib/crmPackage/adapters/pipelineStages.ts` |
| Barrel | `lib/crmPackage/index.ts` exporta funciones y tipos |
| UI / API / DB | **Sin cambios** |

El próximo paso **12W-4b** podrá pasar snapshot al contexto (como `leadFields` / `leadDetailVisibility`) **sin** materializar filas en Supabase. La **materialización** en `leads_pipelines` será una fase posterior con SQL/API controlada.

---

## 2. Relación con 12V-1, 12V-2, 12W-1 y 12W-3b

| Fase | Aporte para 12W-4 |
|------|-------------------|
| **12V-1** | Plan: `pipeline` como sección operativa del contrato |
| **12V-2** | Tipos `CrmPackagePipeline` / `CrmPackagePipelineStage` + demo Pickup 9 etapas |
| **12W-1** | Loader server-side con fallback legacy |
| **12W-3b** | Validó que Nuevo Lead sigue mostrando pipeline **legacy** de Supabase/fallback — **no regresión**; brecha documentada aquí |

12W-4 **no** reutiliza loader en el adapter; la conexión loader → adapter → provider será 12W-4b.

---

## 3. Estado actual del pipeline legacy

### 3.1 Nuevo Lead (`app/admin/leads/nuevo/page.tsx`)

| Fuente | Comportamiento |
|--------|----------------|
| **Primario** | `GET /api/admin/leads/pipelines` → tabla Supabase `leads_pipelines` (`nombre`, `posicion`, `tipo`, `orden`, …) |
| **Fallback hardcodeado** | Si falla el fetch o lista vacía: `FALLBACK_PIPELINE_NAMES` = Nuevo, Contactado, En seguimiento, Calificado, No interesado, Cerrado |
| **Valor guardado** | Campo `pipeline` en POST = **string `nombre`** de la etapa (no `key` del contrato) |
| **UI** | `<select>` con `pipelineOptions.map((nombre) => …)` |

### 3.2 Evidencia Vercel (post 12W-3b)

En demo Pickup, el select muestra etapas operativas legacy (ej. Nuevo lead, Investigación inicial, Visita, Diagnóstico comercial, …, Ganado, Perdido, Contrato) — provienen de **datos en `leads_pipelines`**, no del contrato.

### 3.3 `lib/leads/leadFlow.ts`

Define **flujo del proceso** comercial (Lead → Datos → Revisión → … → Presentación). **No** es el pipeline Kanban de etapas; no comparte tabla ni endpoint con `leads_pipelines`. **No tocar** en 12W-4.

### 3.4 Endpoint (referencia, sin modificar)

`app/api/admin/leads/pipelines/route.ts` — CRUD/listado sobre `leads_pipelines`. Fuera de alcance 12W-4.

---

## 4. Archivos creados / modificados

| Archivo | Cambio |
|---------|--------|
| `lib/crmPackage/adapters/pipelineStages.ts` | **Creado** — adapter + helpers |
| `lib/crmPackage/index.ts` | Export barrel |
| `docs/constructor-crm/validacion-adapter-pipeline-stages-12W-4.md` | Este documento |

**No modificado:** `nuevo/page.tsx`, ficha `[id]`, kanban, lista, `layout.tsx`, APIs pipelines, `pickup4x4.config.ts`, `leadFlow.ts`, agenda, dashboard, reportes, sidebar.

---

## 5. Qué hace el adapter

| Función / tipo | Rol |
|----------------|-----|
| `packageToPipelineStages(config)` | Entrada principal → `{ stages, stageKeys, source }` |
| `getPipelineStageKeys(config)` | Atajo: solo claves |
| `isPipelineStageEnabled(adapterConfig, stageKey)` | Etapa en contrato (`source: contract`) |
| `getPipelineStageByKey(adapterConfig, stageKey)` | Etapa por `key` |
| `getTerminalPipelineStages(adapterConfig)` | Subconjunto con `terminal: won \| lost` |

**Normalización:**

- `key` y `label` con `trim`; ignorar etapas sin key o sin label
- `order` debe ser número finito
- `terminal` solo `"won"` \| `"lost"`; otros valores se omiten
- Dedupe por `key` (primera aparición)
- Orden ascendente por `order`; empates estables por índice original
- `source: "contract"` si queda ≥1 etapa válida; si no → `legacy`

---

## 6. Qué NO hace todavía

- No sustituye opciones del `<select>` en Nuevo Lead
- No sincroniza `leads_pipelines` en Supabase
- No modifica `GET/POST /api/admin/leads/pipelines`
- No cambia Kanban, ficha ni columnas visuales
- No mapea `key` contrato → `nombre` en DB
- No altera payload `pipeline` del POST (sigue siendo string legacy)
- No importa loader, React ni código server en pantallas

---

## 7. Casos de fallback

| Condición | `stages` | `stageKeys` | `source` |
|-----------|----------|-------------|----------|
| `config === null` / `undefined` | `[]` | `[]` | `legacy` |
| Sin `pipeline.stages` o array vacío | `[]` | `[]` | `legacy` |
| Solo etapas inválidas (sin key/label/order) | `[]` | `[]` | `legacy` |
| ≥1 etapa válida | normalizado y ordenado | keys en orden | `contract` |

---

## 8. Resultado esperado para `pickup4x4CrmPackageConfig`

`packageToPipelineStages(pickup4x4CrmPackageConfig)`:

| Campo | Valor esperado |
|-------|----------------|
| `source` | `"contract"` |
| `stages.length` | `9` |
| Orden por `order` | 1…9 |

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

`stageKeys` = las 9 keys en ese orden.  
`getTerminalPipelineStages(...)` → 2 etapas (`venta_ganada`, `venta_perdida`).

---

## 9. Brecha entre pipeline contrato vs pipeline actual

| Dimensión | Contrato Pickup (adapter) | Operativo hoy (Nuevo Lead / Kanban) |
|-----------|---------------------------|-------------------------------------|
| Identificador | `key` estable (`nuevo_contacto`, …) | `id` UUID + `nombre` string en UI/POST |
| Etiqueta | `label` del contrato | `nombre` en `leads_pipelines` |
| Cantidad | 9 etapas comerciales 4x4 | ~17+ nombres legacy en demo Vercel |
| Terminales | `won` / `lost` en contrato | `tipo` `ganado` / `perdido` en tabla |
| Origen datos | `crm_package_config` local/demo | Supabase `leads_pipelines` |
| Fallback UI | — (adapter vacío → legacy) | 6 nombres hardcodeados si API falla |

**Campos contrato sin equivalente 1:1 en DB (hoy):** todas las keys Pickup vs filas existentes en `leads_pipelines` (nombres distintos).

**Legacy que debe seguir hasta materialización:** listado API, fallback de 6 etapas, POST con `pipeline: nombre`.

**No confundir:** `leadFlow.ts` (pasos del proceso) ≠ `pipeline.stages` (embudo comercial).

---

## 10. Cómo se conectará en 12W-4b

Patrón previsto (análogo 12W-2b / 12W-3b):

1. **Server** (`leads/layout.tsx`): mismo `packageResult` → `packageToPipelineStages(config)`.
2. **Contexto:** `PipelineStagesSnapshot` en `LeadsClientCrmProvider`.
3. **Nuevo Lead / Kanban / ficha:** leer snapshot; si `source === "contract"`, **opcionalmente** mostrar labels del contrato en UI **solo cuando** exista estrategia acordada con DB (OR con legacy).
4. **Sin escribir Supabase** en 12W-4b si el alcance se mantiene conservador (solo snapshot + `data-*` o preparación).

Regla: `legacy_first` — nunca dejar de poder guardar con pipeline operativo actual.

---

## 11. Qué requerirá SQL más adelante y qué no

| Acción | ¿SQL / Supabase? |
|--------|------------------|
| Adapter 12W-4 (esta fase) | **No** |
| Snapshot en contexto 12W-4b | **No** (solo lectura contrato) |
| Materializar 9 etapas Pickup en `leads_pipelines` | **Sí** — INSERT/UPDATE controlado, migración o script de seed por cliente |
| Mapeo `key` ↔ fila existente | **Sí** — decisión de producto (renombrar vs nuevas filas vs tabla puente) |
| Cambiar POST a guardar `key` | **No** en 12W-4; posible fase API posterior |
| Adapter puro en repo | **No** |

---

## 12. Build local

```bash
npm run build
```

| Resultado | Detalle |
|-----------|---------|
| Exit code | `0` |
| TypeScript | OK |
| Next.js | 16.0.11 — compilación OK |

---

## 13. Riesgos / decisiones abiertas

| Tema | Nota |
|------|------|
| POST usa `nombre` no `key` | Conectar UI al contrato sin migración rompe informes/Kanban |
| Duplicar etapas al materializar | Idempotencia y `client_slug` en seed |
| `postventa_seguimiento` sin terminal | Coherente con contrato; Kanban puede tratarla como normal |
| Orders duplicados en contrato futuro | Adapter ordena estable; no falla |
| Kanban vs Nuevo Lead | Misma fuente API hoy; contrato unificará en fase posterior |

---

## 14. Confirmación de alcance

| Restricción | Cumplido |
|-------------|----------|
| Adapter puro, sin React / loader en adapter | Sí |
| Validado conceptualmente contra `pickup4x4CrmPackageConfig` | Sí (§8) |
| No conectar Nuevo Lead / ficha / kanban | Sí |
| No modificar endpoint `/api/admin/leads/pipelines` | Sí |
| No tabla `leads_pipelines` / SQL / datos | Sí |
| Sin cambios visibles en Vercel por esta fase | Sí |
| Ninguna pantalla importa `packageToPipelineStages` | Sí (solo `lib/crmPackage` + docs) |

**Próximo paso:** **12W-4b** — snapshot pipeline en contexto (fallback-safe, sin materializar DB). **Fase posterior:** seed SQL + API para alinear Supabase con contrato Pickup.
