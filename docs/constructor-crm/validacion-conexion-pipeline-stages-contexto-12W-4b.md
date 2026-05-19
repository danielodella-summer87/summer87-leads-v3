# Validación Conexión Pipeline Stages Contexto 12W-4b — Constructor CRM Summer87

**Versión:** 12W-4b — wiring contrato `pipeline.stages` → contexto leads + Nuevo Lead (fallback-safe, sin cambio de guardado)  
**Base:** 12W-4 adapter (`886c172`), patrón 12W-3b lead fields (`c56259f`)  
**Commit funcional validado:** `b136337` — Connect pipeline stages snapshot to leads context  
**Estado:** build local **OK** + validación visual Vercel **OK** + DOM técnico **OK** (2026-05-19).

---

## Validación visual y DOM Vercel — 2026-05-19

| Campo | Valor |
|-------|--------|
| **Entorno** | Pickup 4x4 CRM demo — Vercel production (`pickup4x4-crm-demo.vercel.app`) |
| **Ruta** | `/admin/leads/nuevo` |
| **Commit validado** | `b136337` |
| **Resultado** | **OK visual** + **OK DOM** |

Evidencia: captura de pantalla del formulario Nuevo lead + inspección del wrapper principal del formulario en deploy Vercel.

### Atributos DOM observados (wrapper principal)

```html
data-crm-package-lead-fields-source="contract"
data-crm-package-lead-fields-count="25"
data-crm-package-pipeline-source="contract"
data-crm-package-pipeline-count="9"
```

### Checks observados

| Criterio | Resultado |
|----------|-----------|
| Pantalla Nuevo lead carga | ✅ |
| Formulario se ve igual que antes | ✅ |
| Sin cambio visual agresivo | ✅ |
| Select Pipeline sigue **legacy** operativo (no reemplazado) | ✅ |
| Las 9 etapas Pickup **no** aparecen en el select | ✅ (esperado en 12W-4b) |
| `data-crm-package-pipeline-source` | ✅ `contract` |
| `data-crm-package-pipeline-count` | ✅ `9` |
| `data-crm-package-lead-fields-source` | ✅ `contract` (12W-3b; sin regresión) |
| `data-crm-package-lead-fields-count` | ✅ `25` (12W-3b; sin regresión) |
| Sin cambios en POST / API / Supabase (alcance) | ✅ Confirmado por alcance de fase |
| Sidebar (Summer87 Leads, Agenda, Reportes) | ✅ No afectado |
| Error visual evidente | ✅ Ninguno |
| Seguimiento inicial, Comercial, Datos operativos, Rubro, Dirección, Notas | ✅ Visibles sin cambio aparente |
| Guardar lead / redirección a ficha | ☐ No ejercido en esta pasada |
| Ficha lead / Kanban (regresión otras fases) | ☐ Fuera de alcance de esta validación |

### Notas de alcance (no son regresiones)

| Observación | Interpretación |
|-------------|----------------|
| Select Pipeline muestra pipeline **legacy** | **Esperado.** 12W-4b conecta el snapshot en contexto/DOM; **no** sustituye opciones del `<select>`. |
| No aparecen las 9 etapas Pickup en UI | **Esperado y requerido.** El contrato llega al cliente como snapshot (`count: 9`); el render del select sigue en fuente operativa hasta materialización DB + fase UI. |
| `lead_fields` en DOM: `contract` / `25` | **Esperado.** Confirma que 12W-3b sigue vigente en el mismo wrapper; no regresión. |
| `pipelineStages` en DOM: `contract` / `9` | **Objetivo 12W-4b cumplido.** El adapter y el wiring layout → contexto → hook exponen el contrato en cliente sin tocar el select. |

### Dictamen visual y DOM

**12W-4b queda GO visual y técnico:** Nuevo Lead carga correctamente; el formulario y el sidebar se comportan como antes; el select Pipeline permanece legacy; el snapshot `pipelineStages` del contrato llega al cliente (`source: contract`, 9 etapas en DOM). `lead_fields` también permanece validado en DOM. No hay evidencia de cambio en POST, API, Supabase ni datos en esta fase.

---

## 1. Resumen del cambio

El árbol `/admin/leads/*` **recibe** el snapshot `pipelineStages` calculado en server (`leads/layout.tsx`) vía contexto extendido, igual que `leadFields` (12W-3b) y `leadDetailVisibility` (12W-2b).

| Capa | Rol |
|------|-----|
| `getActiveCrmPackageConfigFromEnvironment()` | Un solo `packageResult` en layout |
| `packageToPipelineStages(config)` | Adapter → snapshot serializable |
| `LeadsClientCrmProvider` | Pasa `pipelineStages` al árbol |
| `usePipelineStagesConfig()` | Nuevo Lead (client) lee snapshot |
| `data-crm-package-pipeline-*` | Atributos DOM para verificación sin texto visible |

**No** se modifican: select Pipeline, `handleSubmit`, payload POST, APIs, Supabase, SQL, endpoint `/api/admin/leads/pipelines`, ficha, kanban, dashboard, agenda, reportes ni sidebar.

---

## 2. Relación con 12W-4

| 12W-4 | 12W-4b |
|-------|--------|
| Adapter puro `packageToPipelineStages` | Primera **consumición** en UI (solo wiring) |
| Sin pantallas importando adapter | Layout server + contexto + hook en `nuevo/page.tsx` |
| Documento brecha contrato vs `leads_pipelines` | Este documento confirma que la brecha sigue vigente en guardado |

Próximo paso sugerido: **materialización** — seed/upsert controlado en `leads_pipelines` + estrategia `key` ↔ `nombre`; luego UI del select alineada con POST acordado.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/LeadsClientCrmContext.tsx` | `PipelineStagesSnapshot`, `LEGACY_PIPELINE_STAGES`, `usePipelineStagesConfig()` |
| `app/admin/leads/layout.tsx` | `packageToPipelineStages` + prop al provider |
| `app/admin/leads/nuevo/page.tsx` | Hook + `data-crm-package-pipeline-*` en contenedor del formulario |
| `docs/constructor-crm/validacion-conexion-pipeline-stages-contexto-12W-4b.md` | Este documento |

**No modificado:** adapter source, ficha `[id]/page.tsx`, kanban, APIs pipelines, `leads_pipelines`, POST create lead, middleware, `.env`.

---

## 4. Qué consume ahora Nuevo Lead

- `const pipelineStages = usePipelineStagesConfig()` — `stages`, `stageKeys`, `source`.
- Atributos en el mismo wrapper del formulario (junto a lead fields):
  - `data-crm-package-pipeline-source` → `"contract"` | `"legacy"`
  - `data-crm-package-pipeline-count` → número de etapas del contrato (0 en legacy)

El snapshot **no** alimenta el `<select>` Pipeline ni altera `pipeline` en POST.

---

## 5. Qué NO cambia todavía

- Opciones del select Pipeline (`GET /api/admin/leads/pipelines` + `FALLBACK_PIPELINE_NAMES`)
- Valor guardado: string `nombre` de etapa operativa, no `key` del contrato
- Kanban, ficha, lista, reportes (siguen fuente Supabase/legacy)
- Materialización de 9 etapas Pickup en `leads_pipelines`
- Mapeo `terminal: won|lost` ↔ `tipo: ganado|perdido` en DB
- **Render** de labels del contrato en el select (validado: no deben aparecer en 12W-4b)

---

## 6. Fallback legacy

| Condición | `pipelineStages` en contexto |
|-----------|------------------------------|
| Loader sin contrato (`config: null`) | `source: legacy`, listas vacías |
| Adapter sin etapas válidas | Idem |
| Modo interno sin demo Pickup | Depende de env; sin contrato → legacy |
| Demo `client_crm` + Pickup activo | `source: contract`, 9 etapas, 9 `stageKeys` |

Con `source: legacy`, Nuevo Lead se comporta **igual** que antes de 12W-4b en select y POST.

---

## 7. Resultado esperado en `client_crm`

Con `pickup4x4CrmPackageConfig` activo (demo Vercel / env):

| Verificación | Esperado | Validación Vercel (`b136337`) |
|--------------|----------|-------------------------------|
| UI select Pipeline | Etapas **legacy** de API/Supabase | ✅ Legacy visible; select no reemplazado |
| UI: 9 etapas Pickup en select | **No** deben aparecer | ✅ No aparecen |
| Formulario / sidebar | Sin regresión | ✅ OK visual |
| DOM `data-crm-package-pipeline-source` | `contract` | ✅ Validado |
| DOM `data-crm-package-pipeline-count` | `9` | ✅ Validado |
| DOM `data-crm-package-lead-fields-source` | `contract` | ✅ Validado (12W-3b) |
| DOM `data-crm-package-lead-fields-count` | `25` | ✅ Validado (12W-3b) |
| POST al guardar | Mismo JSON legacy | ☐ No ejercido en esta pasada |

Etapas contrato Pickup (referencia, snapshot en contexto/DOM): `nuevo_contacto` … `postventa_seguimiento` (9 filas; terminales `venta_ganada` / `venta_perdida`).

---

## 8. Build local

```bash
npm run build
```

| Resultado | Detalle |
|-----------|---------|
| Exit code | `0` |
| TypeScript | OK |
| Next.js | 16.0.11 — compilación OK (~13s) |

---

## 9. Inspección DOM (validada)

En `/admin/leads/nuevo`, wrapper con clase `rounded-2xl border bg-white p-6` — **validado en Vercel** (`b136337`, 2026-05-19):

```html
data-crm-package-lead-fields-source="contract"
data-crm-package-lead-fields-count="25"
data-crm-package-pipeline-source="contract"
data-crm-package-pipeline-count="9"
```

| Atributo | Valor observado | Estado |
|----------|-----------------|--------|
| `data-crm-package-pipeline-source` | `contract` | ✅ Validado |
| `data-crm-package-pipeline-count` | `9` | ✅ Validado |
| `data-crm-package-lead-fields-source` | `contract` | ✅ Validado (regresión 12W-3b: no) |
| `data-crm-package-lead-fields-count` | `25` | ✅ Validado (regresión 12W-3b: no) |

---

## 10. Confirmación de alcance

| Restricción | Cumplido | Evidencia |
|-------------|----------|-----------|
| Sin cambio select Pipeline (opciones legacy) | Sí | ✅ Visual Vercel |
| Sin aparición de 9 etapas Pickup en select | Sí (requerido) | ✅ Visual Vercel |
| Snapshot `pipelineStages` en cliente | Sí | ✅ DOM `contract` / `9` |
| `lead_fields` snapshot sin regresión | Sí | ✅ DOM `contract` / `25` |
| Sin cambio POST / API / Supabase / datos | Sí (alcance fase) | ✅ Alcance + sin cambio visual/DOM agresivo |
| Sin ficha / kanban / sidebar / agenda / dashboard / reportes | Sí | ✅ Sidebar no afectado |
| Solo `data-*` no visuales en Nuevo Lead | Sí | ✅ DOM validado |
| Formulario sin regresión visual | Sí | ✅ Visual Vercel |

### Dictamen final

**12W-4b queda GO visual y técnico.** El contrato `pipelineStages` llega al cliente como snapshot (`source: contract`, `count: 9` en DOM), sin cambiar el select Pipeline, POST, API, Supabase ni datos. El select sigue mostrando pipeline legacy operativo; las 9 etapas Pickup no deben ni aparecen en UI en esta fase. `lead_fields` permanece validado en el mismo wrapper (`contract`, `25`). Cierre documental: build local OK + validación visual Vercel OK + DOM técnico OK.

**Próximo paso:** materialización controlada en `leads_pipelines` + fase UI/POST cuando producto defina mapeo `key` ↔ operativo.
