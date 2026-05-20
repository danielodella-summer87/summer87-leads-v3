# Ejecución DDL stage_key leads_pipelines 12W-4c-SQL-2-EXEC — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-2-EXEC — registro de ejecución manual DDL + POSTCHECK  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-ddl-stage-key-leads-pipelines-12W-4c-SQL-2.md` (commit `8c484e0`), `resultados-inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1-RESULTS.md`  
**Ejecutor:** Daniel — Supabase SQL Editor (DDL schema aprobado)  
**Estado:** DDL aplicado; POSTCHECK OK; **sin** seed, **sin** UPDATE `leads.pipeline`, **sin** cambios de código.

| Campo | Valor |
|-------|--------|
| Fecha ejecución | _Completar si aplica_ |
| Entorno Supabase | _Completar proyecto/URL_ |
| Cursor ejecutó SQL | **No** |

---

## 1. Resumen ejecutivo

- Daniel ejecutó manualmente el DDL `stage_key` en Supabase.
- Se agregó `stage_key TEXT NULL` a `public.leads_pipelines`.
- Se creó el índice único parcial `leads_pipelines_stage_key_uq`.
- Las **18** filas quedaron con `stage_key` NULL.
- Los leads siguen igual: **12** en `Nuevo lead`; terminales `Ganado` / `Perdido` intactas.

---

## 2. Alcance

| Aspecto | Estado |
|---------|--------|
| SQL ejecutado por Daniel en Supabase | **Sí** |
| SQL ejecutado por Cursor | **No** |
| Escritura realizada | Solo **DDL schema** (`ALTER TABLE`, `COMMENT`, `CREATE UNIQUE INDEX`) |
| Seed Pickup / materialización 9 etapas | **No** |
| `UPDATE leads.pipeline` | **No** |
| `DELETE` / `UPDATE` catálogo legacy | **No** |
| Tocar `lead_pipelines` | **No** |
| Cambios de código funcional | **No** |
| Migraciones en repo | **No** (fase documental) |

Este documento registra únicamente la ejecución aprobada de **12W-4c-SQL-2** y los POSTCHECK observados.

---

## 3. DDL ejecutado

```sql
BEGIN;

ALTER TABLE public.leads_pipelines
  ADD COLUMN IF NOT EXISTS stage_key TEXT NULL;

COMMENT ON COLUMN public.leads_pipelines.stage_key IS
  'Clave estable del contrato crm_package_config.pipeline.stages[].key. NULL en filas legacy hasta seed/mapping. No sustituye leads.pipeline (nombre).';

CREATE UNIQUE INDEX IF NOT EXISTS leads_pipelines_stage_key_uq
  ON public.leads_pipelines (stage_key)
  WHERE stage_key IS NOT NULL;

COMMIT;
```

---

## 4. Resultado DDL

| Campo | Valor |
|-------|--------|
| Resultado Supabase | `Success. No rows returned.` |
| Interpretación | DDL aplicado sin error; transacción confirmada. |

---

## 5. POSTCHECK

| Check | Resultado | Interpretación |
|-------|-----------|----------------|
| **POSTCHECK-1** | `column_name = stage_key`, `data_type = text`, `is_nullable = YES`, `column_default = NULL` | Columna creada como TEXT nullable, sin default. Coherente con diseño SQL-2. |
| **POSTCHECK-2** | `indexname = leads_pipelines_stage_key_uq`, `indexdef = CREATE UNIQUE INDEX leads_pipelines_stage_key_uq ON public.leads_pipelines ... WHERE stage_key IS NOT NULL` | Índice único parcial presente; permite múltiples NULL y unicidad cuando `stage_key` está poblado. |
| **POSTCHECK-3** | `total = 18`, `con_stage_key_null = 18`, `con_stage_key_set = 0` | Catálogo legacy intacto en volumen; ninguna fila mapeada aún. Esperado post-DDL sin seed. |
| **POSTCHECK-5** | `pipeline = Nuevo lead`, `n = 12` | Distribución de leads sin cambio respecto a SQL-1-RESULTS. |
| **POSTCHECK-6** | `perdido = 1` → `["Perdido"]`, `ganado = 1` → `["Ganado"]` | Restricción API (un ganado, un perdido) preservada; terminales operativas sin alteración. |

**Nota:** POSTCHECK-4 (muestra filas con `stage_key`) no se pegó en este registro; POSTCHECK-3 confirma que todas las filas mantienen `stage_key` NULL.

---

## 6. Impacto operativo

| Área | Impacto |
|------|---------|
| **Nuevo Lead** | Sin cambio — select sigue leyendo `nombre` legacy. |
| **Kanban** | Sin cambio — columnas por `nombre` / catálogo actual. |
| **Select Pipeline** | Sin cambio — no usa `stage_key` aún. |
| **API** | Sin cambio — contratos y respuestas iguales. |
| **`leads.pipeline`** | Sin cambio — sigue guardando string `nombre`. |
| **Adapter / contexto 12W-4b** | Sin cambio — contrato documentado, no materializado en filas. |
| **`stage_key` en BD** | Columna e índice listos para **12W-4c-SQL-3** (seed idempotente). |

---

## 7. GO / NO-GO actualizado

### GO

- GO para documentar esta ejecución (presente documento).
- GO para diseñar **12W-4c-SQL-3** — seed idempotente 9 etapas Pickup.
- GO para planificar estrategia de terminales (decisión D1) antes del seed.

### NO-GO

- NO-GO para ejecutar seed sin diseño SQL-3 aprobado.
- NO-GO para `UPDATE leads.pipeline` en esta fase.
- NO-GO para `DELETE` / deprecación masiva de filas legacy.
- NO-GO para tocar `lead_pipelines`.
- NO-GO para cambiar el select Pipeline por contrato directo todavía.

---

## 8. Riesgos restantes

- Las terminales **Ganado** / **Perdido** ocupan los slots `tipo=ganado` / `tipo=perdido`; insertar `Venta ganada` / `Venta perdida` como nuevas terminales del mismo tipo colisionaría con la API.
- **17** filas de catálogo legacy siguen sin leads asociados.
- Solo **Nuevo lead** tiene leads en uso real (**12**).
- `stage_key` existe en schema pero está **vacío** en las 18 filas — el puente contrato↔BD no está poblado.
- `leadStatusPolicy` sigue pendiente si se adoptan labels Pickup (`Venta ganada` / `Venta perdida`) como `nombre` operativo.
- No hay multi-tenant en `leads_pipelines`; catálogo global por instancia Supabase.

---

## 9. Próxima fase recomendada

**12W-4c-SQL-3** — Diseño seed idempotente 9 etapas Pickup (`crm_package_config.pipeline.stages[].key`).

Antes del seed, resolver **D1 — Terminales**:

| Opción | Descripción |
|--------|-------------|
| **A** | Conservar **Ganado** / **Perdido** como nombres operativos y asignar `stage_key` `venta_ganada` / `venta_perdida` a las filas existentes. |
| **B** | Materializar filas **Venta ganada** / **Venta perdida** (labels contrato) y ajustar `leadStatusPolicy` + reconciliar/reemplazar terminales actuales. |
| **C** | Estrategia híbrida (nuevas terminales + legacy) — **no recomendada** sin justificación explícita. |

**Recomendación conservadora:** para no romper `leadStatusPolicy` ni la UI/API que esperan un único `ganado`/`perdido`, estudiar primero la **opción A** (asignar `stage_key` a filas **Ganado** / **Perdido** existentes) en lugar de crear nuevas filas terminales duplicadas.

---

## 10. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado por Cursor | **No** |
| SQL ejecutado por Daniel | **Sí** — DDL schema aprobado |
| Supabase modificado | **Sí** — schema `leads_pipelines` (`stage_key` + índice) |
| Datos de `leads` modificados | **No** |
| Filas catálogo modificadas (UPDATE/DELETE) | **No** |
| Seed ejecutado | **No** |
| APIs | **No** |
| Middleware | **No** |
| Vercel | **No** |
| Build | **No** |
| Commit | **No** (solo documentación en repo) |
| Solo documentación en repo | **Sí** |

---

*Documento generado en fase 12W-4c-SQL-2-EXEC. No sustituye migración versionada en `/migrations` ni `supabase/migrations/` — pendiente cuando Daniel apruebe copiar script al repo.*
