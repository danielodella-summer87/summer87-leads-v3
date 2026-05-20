# Diseño DDL stage_key leads_pipelines 12W-4c-SQL-2 — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-2 — diseño documental DDL (sin ejecución)  
**Proyecto:** summer87-leads-v3  
**Base:** plan 12W-4c (`b40bfd9`), SCHEMA-1 (`9c989e0`), SQL-1 (`8c3c38e`), RESULTS (`c202227`)  
**Estado:** script propuesto para revisión; **no ejecutado** en Supabase ni aplicado en `/migrations`.

**Ejecutor futuro (cuando se apruebe):** Daniel — manual en Supabase SQL Editor, con backup previo (protocolo 11Q).

---

## 1. Propósito

Definir el **DDL mínimo y reversible** para agregar `stage_key` a `public.leads_pipelines`, creando un puente estable entre:

- **Contrato:** `crm_package_config.pipeline.stages[].key` (adapter `packageToPipelineStages`, demo Pickup 9 keys).
- **Operación:** filas en `leads_pipelines` donde la UI/API siguen usando **`nombre`** y `leads.pipeline` guarda **string `nombre`**.

Esta fase **solo documenta** el diseño y el SQL en markdown. No materializa etapas Pickup, no modifica `leads`, no depreca legacy ni cambia código.

---

## 2. Estado real confirmado

Fuente: `resultados-inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1-RESULTS.md` (inspección Daniel, commit `c202227`).

| Dimensión | Valor confirmado |
|-----------|------------------|
| Tabla operativa CRM | `public.leads_pipelines` — **18 filas** |
| Tabla homónima (no operativa) | `public.lead_pipelines` — **9 filas** — **NO tocar** |
| Columnas actuales `leads_pipelines` | `id`, `created_at`, `updated_at`, `nombre`, `posicion`, `color`, `tipo`, `orden` |
| `stage_key` | **Ausente** |
| `client_slug` / `tenant_id` / `activo` / `contract_id` | **Ausentes** en catálogo |
| Índices actuales | `leads_pipelines_pkey`, `leads_pipelines_nombre_uq`, `leads_pipelines_orden_idx`, `leads_pipelines_posicion_idx` |
| `leads.pipeline` | **12** leads, todos **`Nuevo lead`** |
| Leads huérfanos | **0** |
| Filas catálogo sin leads | **17** (solo **Nuevo lead** tiene leads) |
| Terminales catálogo | **1×** `Ganado` (`tipo=ganado`), **1×** `Perdido` (`tipo=perdido`) |
| Duplicados `lower(nombre)` | **0** |
| Scope multi-cliente | **No** en `leads_pipelines`; `leads.company_size` es descriptivo, no tenant |
| Leads en etapas de cierre (Q11) | **0** |

**Dictamen RESULTS vigente:** GO diseñar DDL; NO-GO seed / UPDATE leads / DELETE legacy / tocar `lead_pipelines` / select por contrato.

---

## 3. Alcance de SQL-2

### Incluido

| Ítem | Detalle |
|------|---------|
| Diseño columna | `ALTER TABLE ... ADD COLUMN stage_key TEXT NULL` |
| Diseño índice | UNIQUE parcial `WHERE stage_key IS NOT NULL` |
| Comentario columna | `COMMENT ON COLUMN` (opcional, recomendado) |
| PRECHECK | SELECT-only antes de DDL |
| POSTCHECK | SELECT-only después de DDL |
| ROLLBACK | `DROP INDEX` + `DROP COLUMN` documentados |
| Checklist de ejecución | Backup + orden de pasos |

### Excluido (fases posteriores)

| Ítem | Fase sugerida |
|------|----------------|
| Seed 9 etapas Pickup | 12W-4c-SQL-3 |
| `UPDATE leads.pipeline` | 12W-4c-SQL-4 |
| DELETE / UPDATE catálogo legacy | SQL-4 / deprecación |
| Cambiar select Pipeline / APIs / código | 12W-4d+ |
| Tocar `lead_pipelines` | Fuera de línea Pickup operativo |
| Archivo en `migrations/` o `supabase/migrations/` | Cuando Daniel apruebe copiar script a repo |
| `NOT NULL` en `stage_key` | Post-seed, si alguna vez |
| `client_slug`, `activo`, FK a contrato | Diseños futuros |

---

## 4. Decisión técnica propuesta

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Tipo | `TEXT` | Alineado con `key` string del contrato (`nuevo_contacto`, …) |
| Nullabilidad | **`NULL` permitido** | Las **18** filas legacy quedan con `stage_key IS NULL` sin romper INSERT/SELECT actuales |
| NOT NULL | **No** en SQL-2 | Imposible sin backfill; backfill = seed (SQL-3) |
| Unicidad | Índice **único parcial** | Múltiples NULL permitidos (PostgreSQL: NULLs no colisionan en UNIQUE estándar; el parcial aclara intención para keys no null) |
| Nombre índice | `leads_pipelines_stage_key_uq` | Convención `tabla_columna_uq` coherente con `leads_pipelines_nombre_uq` |
| FK | **No** | Contrato vive en código/env, no en tabla relacional hoy |
| `client_slug` | **No** | Q10: catálogo global por instancia |
| `activo` | **No** | No existe; deprecación legacy es fase aparte |
| Tabla `leads` | **No tocar** | Wire format sigue `pipeline` = `nombre` |
| Columna `nombre` | **No tocar** | API, Kanban, POST, unique existente |
| Tabla `lead_pipelines` | **No tocar** | No operativa para CRM actual |

### Formato recomendado de `stage_key`

- Solo cuando se asigne (SQL-3+): valor = `key` del contrato, **trim**, minúsculas con guiones bajos como en `pickup4x4.config.ts`.
- Validación en aplicación futura: regex sugerida `^[a-z][a-z0-9_]*$` — **no** enforced en DDL SQL-2.

### Convivencia con índice `leads_pipelines_nombre_uq`

- `stage_key` y `nombre` son ortogonales: una fila legacy puede tener `nombre='Nuevo lead'` y `stage_key NULL`; una fila Pickup futura puede tener `nombre='Nuevo contacto'` y `stage_key='nuevo_contacto'`.
- El seed **no** está en SQL-2; evitar colisiones de `nombre` sigue siendo responsabilidad de SQL-3.

---

## 5. SQL propuesto — PRECHECK

> **Solo SELECT.** Ejecutar **antes** del DDL. Si alguna comprobación falla, **no** ejecutar §6.

Debe quedar claro:

1. Estás en el **proyecto Supabase correcto** (demo Pickup vs otra instancia).
2. **`stage_key` aún no existe** (evitar `ADD COLUMN` duplicado).
3. El estado coincide con RESULTS (`c202227`) o se documenta la divergencia.
4. **`lead_pipelines` no se modifica** — estas queries solo leen o ignoran esa tabla.

```sql
-- PRECHECK-0: Metadatos de sesión (opcional, copiar resultado)
SELECT current_database() AS db, current_user AS usr, now() AS ts;
```

```sql
-- PRECHECK-1: stage_key NO debe existir (esperado: 0 filas)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
  AND column_name = 'stage_key';
```

```sql
-- PRECHECK-2: Columnas actuales (esperado: 8 columnas, sin stage_key)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
ORDER BY ordinal_position;
```

```sql
-- PRECHECK-3: Índices actuales (esperado: 4 índices, sin stage_key)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads_pipelines'
ORDER BY indexname;
```

```sql
-- PRECHECK-4: Conteo catálogo operativo (esperado: 18)
SELECT COUNT(*) AS filas_leads_pipelines
FROM public.leads_pipelines;
```

```sql
-- PRECHECK-5: Índice stage_key NO debe existir aún (esperado: 0 filas)
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads_pipelines'
  AND indexname = 'leads_pipelines_stage_key_uq';
```

```sql
-- PRECHECK-6: Sanity leads (esperado: 12 en Nuevo lead, 0 huérfanos)
SELECT COUNT(*) AS total_leads FROM public.leads;

SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline
ORDER BY n DESC;

SELECT COUNT(*) AS leads_huerfanos
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND trim(l.pipeline) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.leads_pipelines p
    WHERE lower(trim(p.nombre)) = lower(trim(l.pipeline))
  );
```

```sql
-- PRECHECK-7: lead_pipelines — solo lectura de conteo (NO modificar)
-- Esperado: 9 filas. Si tabla no existe, copiar error y detener revisión de entorno.
SELECT COUNT(*) AS filas_lead_pipelines
FROM public.lead_pipelines;
```

### Criterio GO PRECHECK

| Check | Esperado |
|-------|----------|
| PRECHECK-1 | 0 filas |
| PRECHECK-4 | 18 (o documentar divergencia) |
| PRECHECK-5 | 0 filas |
| PRECHECK-6 huérfanos | 0 |
| Backup 11Q | Confirmado antes de §6 |

---

## 6. SQL propuesto — DDL (aplicación manual)

> **NO ejecutado** en redacción de este documento.  
> Ejecutar en **una transacción** en Supabase SQL Editor. Revisar salida antes de `COMMIT`.

```sql
-- =============================================================================
-- 12W-4c-SQL-2 — DDL stage_key en leads_pipelines
-- Ejecutor: Daniel | Backup: obligatorio (11Q) | Fecha: ___________
-- =============================================================================

BEGIN;

-- 6.1 Columna puente contrato → fila catálogo
ALTER TABLE public.leads_pipelines
  ADD COLUMN IF NOT EXISTS stage_key TEXT NULL;

-- 6.2 Documentación en catálogo PostgreSQL
COMMENT ON COLUMN public.leads_pipelines.stage_key IS
  'Clave estable del contrato crm_package_config.pipeline.stages[].key. NULL en filas legacy hasta seed/mapping. No sustituye leads.pipeline (nombre).';

-- 6.3 Unicidad solo para keys asignadas (varias filas legacy pueden tener stage_key NULL)
CREATE UNIQUE INDEX IF NOT EXISTS leads_pipelines_stage_key_uq
  ON public.leads_pipelines (stage_key)
  WHERE stage_key IS NOT NULL;

COMMIT;
```

### Notas sobre `IF NOT EXISTS`

- `ADD COLUMN IF NOT EXISTS` y `CREATE UNIQUE INDEX IF NOT EXISTS` permiten re-ejecutar sin error si un intento previo falló a medias — **igual** verificar POSTCHECK.
- Si `stage_key` ya existe con definición distinta, **no** usar ciego `IF NOT EXISTS`; investigar y usar ROLLBACK (§8) o ajuste manual.

### Lo que este DDL **no** hace

- No rellena `stage_key` en las 18 filas (todas quedan `NULL`).
- No cambia filas, `nombre`, `tipo`, `orden`, ni `leads`.
- No crea trigger ni FK.

---

## 7. SQL propuesto — POSTCHECK

> Ejecutar **después** del `COMMIT` del §6.

```sql
-- POSTCHECK-1: Columna stage_key existe, nullable
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
  AND column_name = 'stage_key';
-- Esperado: 1 fila, text, YES nullable, default NULL
```

```sql
-- POSTCHECK-2: Índice único parcial creado
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads_pipelines'
  AND indexname = 'leads_pipelines_stage_key_uq';
-- Esperado: 1 fila, definición contiene UNIQUE y WHERE (stage_key IS NOT NULL)
```

```sql
-- POSTCHECK-3: Filas legacy siguen intactas; stage_key todo NULL
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE stage_key IS NULL) AS con_stage_key_null,
  COUNT(*) FILTER (WHERE stage_key IS NOT NULL) AS con_stage_key_set
FROM public.leads_pipelines;
-- Esperado: total=18, con_stage_key_null=18, con_stage_key_set=0
```

```sql
-- POSTCHECK-4: nombre / tipo / orden sin cambio (muestra)
SELECT id, nombre, tipo, orden, stage_key
FROM public.leads_pipelines
ORDER BY orden NULLS LAST, nombre
LIMIT 25;
-- Esperado: mismos 18 nombres que Q4 RESULTS; stage_key NULL en todas
```

```sql
-- POSTCHECK-5: leads sin cambio
SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline;
-- Esperado: Nuevo lead = 12
```

```sql
-- POSTCHECK-6: API constraint terminales intacto
SELECT tipo, COUNT(*) AS n, array_agg(nombre) AS nombres
FROM public.leads_pipelines
WHERE tipo IN ('ganado', 'perdido')
GROUP BY tipo;
-- Esperado: ganado→[Ganado], perdido→[Perdido]
```

```sql
-- POSTCHECK-7: Probar unicidad parcial (opcional, en transacción de prueba)
-- NO dejar datos de prueba en producción demo sin limpiar.
-- BEGIN;
-- INSERT INTO public.leads_pipelines (nombre, posicion, tipo, orden, stage_key)
-- VALUES ('_test_stage_key_dup', 9998, 'normal', 9998, 'test_key');
-- INSERT ... misma stage_key 'test_key' → debe FALLAR unique violation;
-- ROLLBACK;
```

### Criterio GO POSTCHECK

| Check | Esperado |
|-------|----------|
| POSTCHECK-1 | Columna presente, nullable |
| POSTCHECK-2 | Índice `leads_pipelines_stage_key_uq` |
| POSTCHECK-3 | 18 filas, todas `stage_key` NULL |
| POSTCHECK-5 | Sin cambio en distribución leads |
| App smoke (manual) | Nuevo Lead / Kanban cargan pipelines — **sin** cambio código |

---

## 8. SQL propuesto — ROLLBACK

> Usar solo si hay que revertir **antes** de depender de `stage_key` en seed (SQL-3).  
> **No** ejecutar rollback si ya hay filas con `stage_key` poblado sin plan (perdería datos de mapeo).

```sql
-- =============================================================================
-- ROLLBACK 12W-4c-SQL-2 — Revertir stage_key
-- Ejecutor: Daniel | Motivo: ___________
-- =============================================================================

BEGIN;

-- Verificar que es seguro (esperado: 0 filas con stage_key no null)
SELECT COUNT(*) AS filas_con_stage_key
FROM public.leads_pipelines
WHERE stage_key IS NOT NULL;
-- Si > 0: detener y planificar migración de datos antes de DROP.

DROP INDEX IF EXISTS public.leads_pipelines_stage_key_uq;

ALTER TABLE public.leads_pipelines
  DROP COLUMN IF EXISTS stage_key;

COMMIT;
```

```sql
-- ROLLBACK-POSTCHECK: stage_key no debe existir
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
  AND column_name = 'stage_key';
-- Esperado: 0 filas
```

---

## 9. Checklist de ejecución (Daniel)

| Paso | Acción | ☐ |
|------|--------|---|
| 1 | Confirmar entorno Supabase (demo Pickup) | |
| 2 | Backup / snapshot (11Q) | |
| 3 | Ejecutar PRECHECK §5 completo | |
| 4 | Registrar resultados en doc de ejecución (p. ej. `ejecucion-ddl-stage-key-12W-4c-SQL-2.md`) | |
| 5 | Si GO PRECHECK → ejecutar DDL §6 en transacción | |
| 6 | Ejecutar POSTCHECK §7 | |
| 7 | Smoke manual: `/admin/leads/nuevo`, Kanban — select legacy igual | |
| 8 | **No** ejecutar seed ni UPDATE leads en la misma sesión | |

---

## 10. GO / NO-GO

### GO para **ejecutar** este DDL (acción manual futura)

| Criterio | Estado |
|----------|--------|
| RESULTS SQL-1 (`c202227`) aprobado | ✅ documentado |
| PRECHECK coincide con RESULTS | Pendiente en ejecución |
| Backup disponible | Pendiente Daniel |
| Alcance limitado a `stage_key` + índice | ✅ diseño |
| Rollback §8 entendido | ✅ |

### NO-GO (no ejecutar DDL si)

| Condición |
|-----------|
| PRECHECK-1 ya muestra `stage_key` (DDL ya aplicado o entorno distinto) |
| Conteo filas ≠ 18 sin explicación |
| Huérfanos > 0 sin plan |
| Sin backup |
| Intención de incluir seed/UPDATE legacy en la misma ventana |
| Confusión con tabla `lead_pipelines` |

**Dictamen diseño SQL-2:** **GO** para revisar y, tras PRECHECK + backup, **ejecutar manualmente** §6. **NO-GO** para mezclar seed o migración de leads en esta misma ventana.

---

## 11. Implicancias para próximas fases

| Fase | Contenido | Depende de SQL-2 ejecutado |
|------|-----------|----------------------------|
| **12W-4c-SQL-2-EXEC** (opcional) | Doc con salida PRECHECK/POSTCHECK pegada | — |
| **12W-4c-SQL-3** | Seed idempotente 9 etapas: `INSERT`/`ON CONFLICT` por `stage_key` | **Sí** |
| **12W-4c-SQL-4** | Mapeo `Nuevo lead` → decisión producto; `UPDATE leads.pipeline` | Tras SQL-3 + D1–D5 |
| **12W-4c-POL** | `leadStatusPolicy` si `nombre` = labels Pickup | Antes o con SQL-3 |
| **Migración repo** | Copiar DDL a `migrations/` o `supabase/migrations/` | Tras validación en Supabase |

---

## 12. Decisiones pendientes (no resueltas en SQL-2)

| ID | Tema | Nota |
|----|------|------|
| D1 | Terminales: `Ganado`/`Perdido` vs `Venta ganada`/`Venta perdida` como `nombre` | Bloquea SQL-3, no SQL-2 |
| D2 | Mapeo `Nuevo lead` → `nuevo_contacto` | SQL-4 |
| D3 | 17 filas sin leads — deprecación | Post seed |
| D4 | Columna `activo` | Fuera de SQL-2 |
| D5 | `leadStatusPolicy` timing | Antes de nombres Pickup en `nombre` |

---

## 13. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Ejecutar DDL en proyecto equivocado | PRECHECK-0 + checklist |
| `ADD COLUMN` duplicado | PRECHECK-1 |
| Confundir `lead_pipelines` / `leads_pipelines` | Solo `leads_pipelines` en §6 |
| Asumir que DDL = materialización | Comunicar: 18 filas siguen `stage_key` NULL |
| Rollback tras SQL-3 con keys pobladas | Verificar `COUNT(stage_key IS NOT NULL)` antes de DROP |
| App espera columnas fijas en SELECT API | API usa lista explícita — **no** incluye `stage_key` hasta cambio código futuro; **sin impacto** SQL-2 |
| Índice parcial mal nombrado | POSTCHECK-2 |

---

## 14. Dictamen final

El diseño **12W-4c-SQL-2** define el DDL **mínimo** acordado en plan 12W-4c y habilitado por RESULTS: columna nullable `stage_key` + índice único parcial, sin tocar `leads`, `nombre`, catálogo legacy ni `lead_pipelines`.

Los resultados de inspección confirman operación **estable** (12 leads, 0 huérfanos). Este DDL **no cambia comportamiento visible** del CRM; prepara el esquema para **12W-4c-SQL-3** (seed).

**Prioridad:** ejecutar §5 → backup → §6 → §7. **No** seed ni migración completa hasta fases siguientes y decisiones D1–D5.

---

## 15. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado por Cursor | **No** |
| SQL ejecutado por Daniel (este doc) | **No** — solo diseño |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Migraciones en repo (`/migrations`, `/supabase/migrations`) | **No** |
| APIs / middleware / Vercel / build | **No** |
| Commit | **No** |
| Solo documentación + SQL propuesto en markdown | **Sí** |

**Referencias:** `pickup4x4.config.ts` (9 keys), `pipelineStages.ts` (normalización contrato), plan 12W-4c §6 opción D.
