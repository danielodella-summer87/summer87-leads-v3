# Validación Conexión Pipeline Stages Contexto 12W-4b — Constructor CRM Summer87

**Versión:** 12W-4b — wiring contrato `pipeline.stages` → contexto leads + Nuevo Lead (fallback-safe, sin cambio de guardado)  
**Base:** 12W-4 adapter (`886c172`), patrón 12W-3b lead fields (`c56259f`)  
**Estado:** implementado en repo; build local **OK** (2026-05-19).

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

| Verificación | Esperado |
|--------------|----------|
| DOM `data-crm-package-pipeline-source` | `contract` |
| DOM `data-crm-package-pipeline-count` | `9` |
| UI select Pipeline | Etapas **legacy** de API/Supabase (sin regresión visual) |
| POST al guardar | Mismo JSON legacy (`pipeline: nombre`) |

Etapas contrato Pickup (referencia): `nuevo_contacto` … `postventa_seguimiento` (9 filas ordenadas; terminales `venta_ganada` / `venta_perdida`).

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

## 9. Inspección rápida (opcional)

En `/admin/leads/nuevo`, inspeccionar el `motion.div` / wrapper con clase `rounded-2xl border bg-white p-6`:

```html
data-crm-package-pipeline-source="contract"
data-crm-package-pipeline-count="9"
```

Coexisten con atributos 12W-3b (`data-crm-package-lead-fields-*`).

---

## 10. Confirmación de alcance

| Restricción | Cumplido |
|-------------|----------|
| Sin cambio select Pipeline | Sí |
| Sin cambio POST / handleSubmit | Sí |
| Sin API / Supabase / SQL | Sí |
| Sin ficha / kanban / sidebar / agenda / dashboard / reportes | Sí |
| Snapshot fallback-safe (`LEGACY_PIPELINE_STAGES`) | Sí |
| Solo `data-*` no visuales en Nuevo Lead | Sí |

**Próximo paso:** materialización controlada en `leads_pipelines` + fase UI/POST cuando producto defina mapeo `key` ↔ operativo.
