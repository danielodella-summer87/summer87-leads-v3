# Ejecución DDL contract_fields_json 12W-5d-SQL-2-EXEC — Constructor CRM Summer87

**Versión:** 12W-5d-SQL-2-EXEC — registro de ejecución manual DDL + POSTCHECK  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-ddl-contract-fields-json-12W-5d-SQL-1.md`, `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md`  
**Ejecutor:** Daniel — Supabase SQL Editor (DDL schema aprobado)  
**Estado:** DDL aplicado; POSTCHECK OK; **sin** cambios de código/API; **sin** carga de datos Pickup.

| Campo | Valor |
|-------|--------|
| Fecha ejecución | 2026-05-21 |
| Entorno Supabase | summer87-leads-v3 — main / PRODUCTION |
| Cursor ejecutó SQL | **No** |

---

## 1. Resumen ejecutivo

- Daniel ejecutó manualmente en Supabase el DDL aprobado de **12W-5d-SQL-1**: `ADD COLUMN contract_fields_json` + `COMMENT ON COLUMN` en `public.leads`.
- **Resultado Supabase:** `Success. No rows returned.`
- **POSTCHECK:** columna `jsonb NOT NULL DEFAULT '{}'`; **12** filas con `contract_fields_json = {}`; `jsonb_typeof` = **object** en las 12; core intacto (nombre, pipeline).
- **Sin** índice nuevo sobre `contract_fields_json`.
- **Dictamen:** **GO** SQL-2 EXEC; **GO** POSTCHECK; **GO técnico** para **12W-5e** (API POST/GET); **NO-GO** DDL adicional en esta ventana.
- **Próximo paso:** **12W-5e** — persistir/leer `contract_fields_json` desde API con whitelist de contrato.

---

## 2. Entorno

| Campo | Valor |
|-------|--------|
| Proyecto Supabase | summer87-leads-v3 |
| Rama / entorno visible | main / PRODUCTION |
| Tabla afectada | `public.leads` |
| Ejecutor | Daniel |
| Fecha | 2026-05-21 |
| Herramienta | Supabase SQL Editor |
| Cursor ejecutó SQL | **No** |

---

## 3. PRECHECK

Ejecutado **antes** del DDL. Resultados confirmados por Daniel:

| Check | Resultado | Estado |
|-------|-----------|--------|
| `public.leads` existe | Sí | OK |
| `contract_fields_json` ausente pre-DDL | Sí (no existía) | OK |
| `total_leads` | **12** | OK |
| `pipeline` = Nuevo lead | **12** | OK |
| RLS `enabled` | **true** | OK |
| RLS `forced` | **false** | OK |
| `policy_count` (`pg_policies`) | **0** | OK |
| Columnas equivalentes (`custom_fields`, `lead_fields`, `dynamic_fields`, `extra_fields`) | **Ausentes** | OK |
| JSONB legacy (`objetivos`, `audiencia`, …) | Presentes; semántica **distinta** al contrato Pickup | OK — no reutilizados |

**Dictamen PRECHECK:** **GO** para aplicar DDL §4.

---

## 4. DDL ejecutado

```sql
BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.leads.contract_fields_json IS
  'Valores de campos declarados en lead_fields del paquete CRM activo. Claves validadas por contrato/adapters; no reemplaza columnas core del lead.';

COMMIT;
```

**Alcance DDL:** solo `ADD COLUMN` + `COMMENT`. Sin índice, sin CHECK constraint, sin `UPDATE`/`INSERT`/`DELETE`.

---

## 5. Resultado Supabase

| Campo | Valor |
|-------|--------|
| Mensaje | **Success. No rows returned.** |
| Interpretación | DDL aplicado sin error; transacción confirmada (`COMMIT`). |

---

## 6. POSTCHECK columna

| Campo | Valor observado |
|-------|-----------------|
| `column_name` | `contract_fields_json` |
| `data_type` | `jsonb` |
| `is_nullable` | **NO** |
| `column_default` | `'{}'::jsonb` |

Coherente con diseño **12W-5d-SQL-1**.

---

## 7. POSTCHECK datos

| Métrica | Valor |
|---------|--------|
| `total` | **12** |
| `con_vacio` (`contract_fields_json = '{}'`) | **12** |
| `con_datos` (`<> '{}'`) | **0** |
| `es_object` (`jsonb_typeof = 'object'`) | **12** |

Las 12 filas existentes recibieron el default `{}` al agregar la columna; no hay datos de contrato Pickup cargados aún.

---

## 8. POSTCHECK core sanity

| Métrica | Valor |
|---------|--------|
| `total` | **12** |
| `con_nombre` | **12** |
| `en_nuevo_lead` (`pipeline = 'Nuevo lead'`) | **12** |

Sin cambio respecto a **12W-5d-SCHEMA-1-RESULTS**.

---

## 9. Muestra segura

Muestra de **5** leads (`contract_fields_json = {}`). Sin teléfonos, emails ni otra PII completa.

| nombre (observado) | `contract_fields_json` |
|--------------------|-------------------------|
| Demo — Consulta genérica accesorios | `{}` |
| Demo — Lona + estribos combo | `{}` |
| Demo — Snorkel + filtro | `{}` |
| Demo — Interior cuero sintético | `{}` |
| Demo — Enganche y luces | `{}` |

---

## 10. Índices

| Verificación | Resultado |
|--------------|-----------|
| Índice creado sobre `contract_fields_json` en este DDL | **No** |
| `pg_indexes` con `contract_fields_json` en definición | **0 filas** |

Coherente con SQL-1 (sin GIN ni índice por `marca` en esta fase).

---

## 11. Impacto

| Área | Resultado |
|------|-----------|
| `public.leads` | **+1** columna JSONB `contract_fields_json` |
| Leads existentes (12) | Valor inicial **`{}`** (default en ADD COLUMN) |
| API (`route.ts`) | **Sin cambios** — columna aún no en `LeadCreateInput` / `SELECT_WITH_SNAPSHOT` |
| UI Nuevo Lead (`nuevo/page.tsx`) | **Sin cambios** |
| Ficha / detalle | **Sin cambios** |
| Kanban | **Sin cambios** |
| JSONB legacy (`objetivos`, `audiencia`, …) | **Sin cambios** |
| RLS / policies | **Sin cambios** (enabled true, 0 policies) |
| Trigger `trg_leads_updated_at` | **Sin cambios** |
| Datos Pickup (vehículo, presupuesto, …) | **No cargados** |
| Zeta / Kore | **No tocados** |

---

## 12. Rollback

> **No ejecutado.** Documentado para referencia operativa.

```sql
-- ROLLBACK 12W-5d-SQL-2 — solo con aprobación explícita
-- Pre-check: SELECT COUNT(*) FILTER (WHERE contract_fields_json <> '{}'::jsonb) AS filas_con_datos;
-- Hoy: filas_con_datos = 0 → reversible sin pérdida de datos de contrato.

BEGIN;

ALTER TABLE public.leads
  DROP COLUMN IF EXISTS contract_fields_json;

COMMIT;
```

| Condición | Estado actual |
|-----------|---------------|
| `con_datos` > 0 | **No** (0 filas con JSON distinto de `{}`) |
| Rollback sin export | **Viable hoy** |
| Tras **12W-5e** con escritura real | Rollback requiere **export/backup** previo |

---

## 13. Dictamen

| Criterio | Veredicto |
|----------|-----------|
| **12W-5d-SQL-2 EXEC** | **GO** |
| **POSTCHECK** | **GO** |
| Pasar a **12W-5e** (API) | **GO técnico** — columna lista en schema |
| DDL adicional (índice, CHECK, seed JSONB) | **NO-GO** en esta ventana |
| Desplegar **5e** sin columna | **NO-GO** — riesgo ya mitigado (columna creada) |

---

## 14. Próximas fases

| Fase | Entregable |
|------|------------|
| **12W-5e** | API POST/GET: `contract_fields_json`, whitelist `packageToLeadFields()`, ampliar selects |
| **12W-5f** | UI editable bloque Vehículo + envío al POST |
| **12W-5-QA** | POST Vercel controlado; verificar persistencia JSONB |
| **Futuro (opcional)** | Índice `(contract_fields_json->>'marca')`; CHECK `jsonb_typeof = 'object'` |

---

## 15. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| API modificada | **No** |
| DDL ejecutado | **Sí** — `ADD COLUMN` + `COMMENT` |
| DML ejecutado (`UPDATE`/`INSERT`/`DELETE`) | **No** |
| Datos modificados | **No** — salvo default `{}` por nueva columna en filas existentes |
| Migraciones en repo (`/migrations`, `supabase/migrations/`) | **No** |
| Supabase modificado | **Sí** — schema `public.leads` |
| SQL ejecutado por Cursor | **No** |
| SQL ejecutado por Daniel | **Sí** |
| Commit | **No** (salvo pedido explícito) |
| Solo documentación en repo | **Sí** (este archivo) |

---

*Documento generado en fase 12W-5d-SQL-2-EXEC. Registra ejecución manual aprobada; no sustituye migración versionada en repo hasta decisión explícita de Daniel.*
