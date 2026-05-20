# Diseño Seed Pipeline Pickup stage_key 12W-4c-SQL-3 — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-3 — diseño documental seed idempotente (sin ejecución)  
**Proyecto:** summer87-leads-v3  
**Base:** SQL-2 (`8c484e0`), SQL-2-EXEC (`be87f63`), SQL-1-RESULTS (`c202227`), `pickup4x4.config.ts`, `pipelineStages.ts`  
**Estado:** script propuesto para revisión; **no ejecutado** en Supabase ni aplicado en `/migrations`.

**Ejecutor futuro (cuando se apruebe):** Daniel — manual en Supabase SQL Editor, con backup previo (protocolo 11Q).

---

## 1. Propósito

Diseñar el **seed idempotente** que puebla `public.leads_pipelines.stage_key` con las **9 keys** del contrato Pickup (`pickup4x4CrmPackageConfig.pipeline.stages`, adapter `packageToPipelineStages`), creando un puente estable **contrato → fila catálogo** sin alterar el modelo operativo por **`nombre`**.

Esta fase **solo documenta** estrategia, PRECHECK, SQL propuesto, POSTCHECK y ROLLBACK. **No** ejecuta SQL, **no** modifica `leads.pipeline`, **no** renombra filas, **no** depreca legacy, **no** cambia UI/API ni `leadStatusPolicy`.

---

## 2. Estado base post SQL-2

Fuente: `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md`, `resultados-inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1-RESULTS.md`.

| Dimensión | Valor confirmado |
|-----------|------------------|
| `stage_key` en `leads_pipelines` | **Existe** — `TEXT NULL` |
| Índice único parcial | `leads_pipelines_stage_key_uq` — `WHERE stage_key IS NOT NULL` |
| Filas catálogo | **18** — todas `stage_key` **NULL** |
| `leads.pipeline` | **12** leads, todos **`Nuevo lead`** |
| Huérfanos | **0** |
| Terminales | **1×** `Ganado` (`tipo=ganado`), **1×** `Perdido` (`tipo=perdido`) |
| `lead_pipelines` | **9** filas — **NO tocar** |
| Seed / UPDATE leads / DELETE legacy | **No** ejecutados |

---

## 3. Estrategia conservadora propuesta

### Principios

| Principio | Detalle |
|-----------|---------|
| Puente por `stage_key` | El contrato usa `key`; la app sigue usando `nombre` en `leads.pipeline` y selects. |
| Sin nuevas terminales | **No** crear filas `Venta ganada` / `Venta perdida` con `tipo=ganado`/`perdido` — colisionarían con la regla API (máx. 1 ganado + 1 perdido). |
| Terminales existentes | Asignar `venta_ganada` → fila **`Ganado`**; `venta_perdida` → fila **`Perdido`**. |
| Negociación existente | Asignar `negociacion` → fila **`Negociación`**. |
| Entrada operativa | Asignar `nuevo_contacto` → **`Nuevo lead`** (tiene los 12 leads) — **no** mover leads ni renombrar a «Nuevo contacto» en esta fase. |
| Etapas intermedias faltantes | **INSERT** solo las 5 filas cuyo `label` contrato no existe en catálogo. |
| Legacy sin mapeo | Las **14** filas restantes (18 − 4 mapeadas) permanecen `stage_key` NULL — sin DELETE. |

### Resultado esperado del seed conservador

| Métrica | Valor esperado |
|---------|----------------|
| Filas con `stage_key` NOT NULL | **9** (una por key contrato) |
| Filas catálogo total | **23** (18 + 5 INSERT) |
| `leads.pipeline` | Sin cambio — **12** en `Nuevo lead` |
| Terminales `tipo` | Sigue **1** ganado + **1** perdido |
| UPDATE en filas existentes | **4**: Nuevo lead, Negociación, Ganado, Perdido |
| INSERT nuevas | **5**: Consulta calificada, Vehículo identificado, Necesidad detectada, Presupuesto enviado, Postventa / seguimiento |

### Alternativa descartada en SQL-3

| Alternativa | Por qué NO en esta fase |
|-------------|-------------------------|
| Crear `Nuevo contacto` + migrar leads | Movería **12** leads — requiere SQL-4 y decisión producto. |
| Renombrar `Ganado` → `Venta ganada` | Rompe `leadStatusPolicy` y match por `nombre` hasta política explícita. |
| `ON CONFLICT (stage_key)` con índice parcial | Depende de versión/sintaxis PG; se prefiere **`INSERT … SELECT … WHERE NOT EXISTS`** (§6). |

---

## 4. Mapeo contrato → operación propuesto

Contrato: `lib/crmPackage/configs/pickup4x4.config.ts` líneas 78–89; normalización: `lib/crmPackage/adapters/pipelineStages.ts`.

| key contrato | label contrato | acción SQL-3 | fila operativa (`nombre`) | razón |
|--------------|----------------|--------------|---------------------------|-------|
| `nuevo_contacto` | Nuevo contacto | **UPDATE** existente | **Nuevo lead** | Evita mover **12** leads; entrada operativa actual |
| `consulta_calificada` | Consulta calificada | **INSERT** nueva | Consulta calificada | No existe en Q4 |
| `vehiculo_identificado` | Vehículo identificado | **INSERT** nueva | Vehículo identificado | No existe en Q4 |
| `necesidad_detectada` | Necesidad detectada | **INSERT** nueva | Necesidad detectada | No existe en Q4 |
| `presupuesto_enviado` | Presupuesto enviado | **INSERT** nueva | Presupuesto enviado | No existe equivalente único (hay Cotización / Propuesta enviada legacy) |
| `negociacion` | Negociación | **UPDATE** existente | **Negociación** | Coincide nombre; sin leads hoy |
| `venta_ganada` | Venta ganada | **UPDATE** existente | **Ganado** | Conserva `tipo=ganado` y policy por nombre legacy |
| `venta_perdida` | Venta perdida | **UPDATE** existente | **Perdido** | Conserva `tipo=perdido` y policy por nombre legacy |
| `postventa_seguimiento` | Postventa / seguimiento | **INSERT** nueva | Postventa / seguimiento | No existe en Q4 |

**Keys sin fila dedicada en SQL-3:** ninguna — las 9 keys quedan cubiertas.  
**Filas legacy sin `stage_key` tras seed (14):** Nuevo, Visita, Investigación inicial, Evaluación, Diagnóstico comercial, Servicios, Contacto iniciado, Costeo, Reunión agendada, Cotización, Propuesta enviada, Propuesta, Presentación, Contrato — pendientes de deprecación en fases posteriores.

---

## 5. PRECHECK SQL

> **SELECT-only.** Ejecutar **antes** del seed. **NO** ejecutar desde Cursor sin aprobación de Daniel.

```sql
-- PRECHECK-1: Columna stage_key existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
  AND column_name = 'stage_key';
-- Esperado: 1 fila, text, YES
```

```sql
-- PRECHECK-2: Ningún stage_key asignado aún (o solo keys esperadas si re-ejecución parcial)
SELECT
  COUNT(*) FILTER (WHERE stage_key IS NOT NULL) AS con_stage_key_set,
  array_agg(DISTINCT stage_key) FILTER (WHERE stage_key IS NOT NULL) AS keys_existentes
FROM public.leads_pipelines;
-- GO limpio: con_stage_key_set = 0, keys_existentes NULL
```

```sql
-- PRECHECK-3: Filas operativas para UPDATE existen (exactamente 1 cada una)
SELECT nombre, tipo, stage_key
FROM public.leads_pipelines
WHERE lower(trim(nombre)) IN (
  lower('Nuevo lead'),
  lower('Negociación'),
  lower('Ganado'),
  lower('Perdido')
)
ORDER BY nombre;
-- Esperado: 4 filas; Ganado tipo=ganado, Perdido tipo=perdido
```

```sql
-- PRECHECK-4: Las 5 filas nuevas NO existen por nombre
SELECT nombre
FROM public.leads_pipelines
WHERE lower(trim(nombre)) IN (
  lower('Consulta calificada'),
  lower('Vehículo identificado'),
  lower('Necesidad detectada'),
  lower('Presupuesto enviado'),
  lower('Postventa / seguimiento')
);
-- GO: 0 filas
```

```sql
-- PRECHECK-5: Ningún stage_key objetivo ya ocupado
SELECT stage_key, nombre
FROM public.leads_pipelines
WHERE stage_key IN (
  'nuevo_contacto', 'consulta_calificada', 'vehiculo_identificado',
  'necesidad_detectada', 'presupuesto_enviado', 'negociacion',
  'venta_ganada', 'venta_perdida', 'postventa_seguimiento'
);
-- GO: 0 filas
```

```sql
-- PRECHECK-6: Leads en Nuevo lead = 12
SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline;
-- Esperado: Nuevo lead = 12
```

```sql
-- PRECHECK-7: 0 huérfanos
SELECT COUNT(*) AS leads_huerfanos
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND l.pipeline <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.leads_pipelines p
    WHERE p.nombre = l.pipeline
  );
-- Esperado: 0
```

```sql
-- PRECHECK-8: Terminales 1/1 intactas
SELECT tipo, COUNT(*) AS n, array_agg(nombre) AS nombres
FROM public.leads_pipelines
WHERE tipo IN ('ganado', 'perdido')
GROUP BY tipo;
-- Esperado: ganado→[Ganado], perdido→[Perdido]
```

### Criterio GO PRECHECK

| Check | Esperado |
|-------|----------|
| PRECHECK-1 | `stage_key` presente |
| PRECHECK-2 | `con_stage_key_set = 0` |
| PRECHECK-3 | 4 filas UPDATE objetivo |
| PRECHECK-4 | 0 nombres nuevos duplicados |
| PRECHECK-5 | 0 `stage_key` objetivo preexistentes |
| PRECHECK-6 | `Nuevo lead` = 12 |
| PRECHECK-7 | huérfanos = 0 |
| PRECHECK-8 | 1 ganado + 1 perdido |

---

## 6. SQL propuesto — seed idempotente

> **ADVERTENCIA:** **NO ejecutar** hasta aprobación explícita de Daniel y backup (11Q).  
> Cursor **no** debe ejecutar este bloque.  
> Ejecutar en **una transacción** en Supabase SQL Editor.

### Nota sobre `ON CONFLICT` vs `NOT EXISTS`

El índice `leads_pipelines_stage_key_uq` es **único parcial** (`WHERE stage_key IS NOT NULL`). En PostgreSQL 15+ existe `ON CONFLICT (stage_key) WHERE (stage_key IS NOT NULL)`, pero:

- No hay **unique constraint** nombrado en `nombre` para conflict por label — solo índice `leads_pipelines_nombre_uq` sobre `lower(nombre)`.
- La sintaxis parcial de `ON CONFLICT` varía según versión y herramienta.

**Preferencia de este diseño:** `INSERT … SELECT … WHERE NOT EXISTS` por `stage_key` **y** por `lower(trim(nombre))` — máxima compatibilidad e idempotencia sin depender de `ON CONFLICT`.

Los `UPDATE` son idempotentes si incluyen `AND stage_key IS NULL` (re-ejecución no sobrescribe keys ya correctas salvo ampliación explícita).

```sql
-- =============================================================================
-- 12W-4c-SQL-3 — Seed idempotente stage_key Pickup en leads_pipelines
-- Ejecutor: Daniel | Backup: obligatorio (11Q) | Fecha: ___________
-- Estrategia: conservadora — 4 UPDATE + 5 INSERT | Sin UPDATE leads.pipeline
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) UPDATE filas existentes (solo si stage_key aún NULL)
-- -----------------------------------------------------------------------------

UPDATE public.leads_pipelines
SET stage_key = 'nuevo_contacto',
    updated_at = NOW()
WHERE lower(trim(nombre)) = lower(trim('Nuevo lead'))
  AND stage_key IS NULL;

UPDATE public.leads_pipelines
SET stage_key = 'negociacion',
    updated_at = NOW()
WHERE lower(trim(nombre)) = lower(trim('Negociación'))
  AND stage_key IS NULL;

UPDATE public.leads_pipelines
SET stage_key = 'venta_ganada',
    updated_at = NOW()
WHERE lower(trim(nombre)) = lower(trim('Ganado'))
  AND tipo = 'ganado'
  AND stage_key IS NULL;

UPDATE public.leads_pipelines
SET stage_key = 'venta_perdida',
    updated_at = NOW()
WHERE lower(trim(nombre)) = lower(trim('Perdido'))
  AND tipo = 'perdido'
  AND stage_key IS NULL;

-- -----------------------------------------------------------------------------
-- 2) INSERT filas nuevas (idempotente: NOT EXISTS por stage_key y por nombre)
-- -----------------------------------------------------------------------------

INSERT INTO public.leads_pipelines (nombre, posicion, orden, tipo, color, stage_key)
SELECT 'Consulta calificada', 11, 11, 'normal', NULL, 'consulta_calificada'
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines WHERE stage_key = 'consulta_calificada'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines
  WHERE lower(trim(nombre)) = lower(trim('Consulta calificada'))
);

INSERT INTO public.leads_pipelines (nombre, posicion, orden, tipo, color, stage_key)
SELECT 'Vehículo identificado', 12, 12, 'normal', NULL, 'vehiculo_identificado'
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines WHERE stage_key = 'vehiculo_identificado'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines
  WHERE lower(trim(nombre)) = lower(trim('Vehículo identificado'))
);

INSERT INTO public.leads_pipelines (nombre, posicion, orden, tipo, color, stage_key)
SELECT 'Necesidad detectada', 13, 13, 'normal', NULL, 'necesidad_detectada'
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines WHERE stage_key = 'necesidad_detectada'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines
  WHERE lower(trim(nombre)) = lower(trim('Necesidad detectada'))
);

INSERT INTO public.leads_pipelines (nombre, posicion, orden, tipo, color, stage_key)
SELECT 'Presupuesto enviado', 14, 14, 'normal', NULL, 'presupuesto_enviado'
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines WHERE stage_key = 'presupuesto_enviado'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines
  WHERE lower(trim(nombre)) = lower(trim('Presupuesto enviado'))
);

INSERT INTO public.leads_pipelines (nombre, posicion, orden, tipo, color, stage_key)
SELECT 'Postventa / seguimiento', 95, 95, 'normal', NULL, 'postventa_seguimiento'
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines WHERE stage_key = 'postventa_seguimiento'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines
  WHERE lower(trim(nombre)) = lower(trim('Postventa / seguimiento'))
);

COMMIT;
```

### Orden sugerido `posicion` / `orden`

| Fila nueva | `orden` | Nota |
|------------|---------|------|
| Consulta calificada | 11 | Tras etapas legacy bajas; alineado orden contrato 2 |
| Vehículo identificado | 12 | Contrato order 3 |
| Necesidad detectada | 13 | Contrato order 4 |
| Presupuesto enviado | 14 | Contrato order 5 |
| Postventa / seguimiento | 95 | Cerca de fin de tablero; no compite con Ganado/Perdido |

*Los valores no reordenan legacy existente; el select Pipeline ordena por `orden` — puede mezclar filas Pickup nuevas con legacy en UI.*

### Lo que este seed **no** hace

- No `UPDATE public.leads` ni `leads.pipeline`.
- No `DELETE` ni deprecación de las 14 filas legacy sin `stage_key`.
- No toca `lead_pipelines`.
- No renombra `Nuevo lead`, `Ganado`, `Perdido`.
- No cambia código, APIs ni `leadStatusPolicy`.

---

## 7. POSTCHECK SQL

> Ejecutar **después** del `COMMIT` del §6.

```sql
-- POSTCHECK-1: Exactamente 9 stage_key poblados
SELECT
  COUNT(*) FILTER (WHERE stage_key IS NOT NULL) AS con_stage_key_set,
  COUNT(*) FILTER (WHERE stage_key IS NULL) AS con_stage_key_null,
  COUNT(*) AS total
FROM public.leads_pipelines;
-- Esperado: con_stage_key_set = 9, total = 23, con_stage_key_null = 14
```

```sql
-- POSTCHECK-2: Las 9 keys contrato presentes
SELECT stage_key, nombre, tipo, orden
FROM public.leads_pipelines
WHERE stage_key IS NOT NULL
ORDER BY orden NULLS LAST, stage_key;
-- Esperado: 9 filas con keys listadas en §4
```

```sql
-- POSTCHECK-3: Mapeo crítico Nuevo lead / terminales
SELECT nombre, stage_key, tipo
FROM public.leads_pipelines
WHERE stage_key IN (
  'nuevo_contacto', 'negociacion', 'venta_ganada', 'venta_perdida'
)
ORDER BY stage_key;
-- Esperado: Nuevo lead→nuevo_contacto, Negociación→negociacion,
--           Ganado→venta_ganada, Perdido→venta_perdida
```

```sql
-- POSTCHECK-4: Leads sin cambio
SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline;
-- Esperado: Nuevo lead = 12
```

```sql
-- POSTCHECK-5: 0 huérfanos
SELECT COUNT(*) AS leads_huerfanos
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND l.pipeline <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.leads_pipelines p WHERE p.nombre = l.pipeline
  );
-- Esperado: 0
```

```sql
-- POSTCHECK-6: Terminales API intactas
SELECT tipo, COUNT(*) AS n, array_agg(nombre) AS nombres
FROM public.leads_pipelines
WHERE tipo IN ('ganado', 'perdido')
GROUP BY tipo;
-- Esperado: ganado→[Ganado], perdido→[Perdido] (nombres legacy, stage_key nuevos)
```

```sql
-- POSTCHECK-7: Nombres nuevos existen (5)
SELECT nombre, stage_key
FROM public.leads_pipelines
WHERE lower(trim(nombre)) IN (
  lower('Consulta calificada'),
  lower('Vehículo identificado'),
  lower('Necesidad detectada'),
  lower('Presupuesto enviado'),
  lower('Postventa / seguimiento')
);
-- Esperado: 5 filas
```

```sql
-- POSTCHECK-8: lead_pipelines sin cambios (conteo referencia SQL-1)
SELECT COUNT(*) AS filas_lead_pipelines FROM public.lead_pipelines;
-- Esperado: 9 (mismo que Q3c RESULTS — no escribimos en esa tabla)
```

### Criterio GO POSTCHECK

| Check | Esperado |
|-------|----------|
| POSTCHECK-1 | 9 set / 14 null / 23 total |
| POSTCHECK-2 | 9 keys únicas |
| POSTCHECK-3 | 4 UPDATE correctos |
| POSTCHECK-4 | Nuevo lead = 12 |
| POSTCHECK-5 | huérfanos = 0 |
| POSTCHECK-6 | 1 ganado + 1 perdido por **nombre** |
| POSTCHECK-7 | 5 INSERT visibles |
| POSTCHECK-8 | `lead_pipelines` = 9 |

---

## 8. ROLLBACK

> **ADVERTENCIA:** **NO ejecutar** sin revisar conteos y backup. Solo revertir efectos del seed SQL-3, **no** el DDL SQL-2 (`DROP COLUMN stage_key` es rollback de SQL-2, no de este doc).

### Estrategia

| Acción | Alcance |
|--------|---------|
| DELETE | Solo las **5** filas insertadas por `stage_key` en lista nueva, **solo si** `COUNT(leads WHERE pipeline = nombre) = 0` |
| UPDATE | `stage_key = NULL` en **Nuevo lead**, **Negociación**, **Ganado**, **Perdido** |
| Preservar | `nombre`, `tipo`, filas legacy, `leads.pipeline`, DDL `stage_key` columna |

```sql
-- =============================================================================
-- 12W-4c-SQL-3 — ROLLBACK seed (NO ejecutar sin revisión)
-- =============================================================================

BEGIN;

-- 1) Quitar stage_key de filas existentes mapeadas
UPDATE public.leads_pipelines
SET stage_key = NULL, updated_at = NOW()
WHERE stage_key IN (
  'nuevo_contacto', 'negociacion', 'venta_ganada', 'venta_perdida'
);

-- 2) Borrar solo INSERT nuevas (sin leads asociados)
DELETE FROM public.leads_pipelines p
WHERE p.stage_key IN (
  'consulta_calificada',
  'vehiculo_identificado',
  'necesidad_detectada',
  'presupuesto_enviado',
  'postventa_seguimiento'
)
AND NOT EXISTS (
  SELECT 1 FROM public.leads l WHERE l.pipeline = p.nombre
);

COMMIT;
```

### ROLLBACK-POSTCHECK

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE stage_key IS NOT NULL) AS con_stage_key_set
FROM public.leads_pipelines;
-- Esperado post-rollback seed: total=18, con_stage_key_set=0
-- (si no se insertaron filas antes del rollback parcial, ajustar total)
```

**No** borra `Ganado`, `Perdido`, `Nuevo lead`, `Negociación` ni las 13 legacy restantes.

---

## 9. GO / NO-GO

### GO

- SQL-2 ejecutado y POSTCHECK OK (`be87f63`).
- PRECHECK SQL-3 coincide con estado §2.
- Daniel aprueba estrategia conservadora (§3).
- `con_stage_key_set = 0` antes del seed.
- Sin colisión de nombres para las 5 INSERT (PRECHECK-4 = 0 filas).
- Backup disponible (11Q).

### NO-GO

- `stage_key` no existe (DDL SQL-2 no aplicado).
- `stage_key` ya tiene datos no esperados (keys fuera del set Pickup).
- Falta alguna de: **Nuevo lead**, **Negociación**, **Ganado**, **Perdido**.
- Ya existe fila con mismo `nombre` que INSERT propuesto pero sin `stage_key` coherente — resolver manualmente antes del seed.
- Hay huérfanos en `leads` (PRECHECK-7 > 0).
- Daniel prefiere materializar **Venta ganada** / **Venta perdida** como `nombre` operativo (opción B) — requiere rediseño + `leadStatusPolicy`.

---

## 10. Impacto esperado

| Área | Impacto esperado |
|------|------------------|
| **Select Pipeline** | Si la API lista todo `leads_pipelines`, aparecerán **5** opciones nuevas más las 18 legacy. |
| **Leads existentes** | Sin cambio — siguen en `Nuevo lead`. |
| **Kanban** | Posibles **columnas vacías** nuevas si el tablero renderiza todo el catálogo; las 12 tarjetas permanecen en `Nuevo lead`. |
| **API** | Sin cambio de contrato HTTP; respuestas incluyen más filas de catálogo si no hay filtro. |
| **`leads.pipeline`** | Sin cambio. |
| **Adapter 12W-4b / contexto DOM** | Sin cambio — sigue leyendo contrato TS; BD ahora refleja keys en `stage_key`. |
| **Reportes / filtros** | Más opciones en catálogo; datos de leads iguales. |
| **Trazabilidad** | 9 keys materializadas en BD para joins futuros por `stage_key`. |

---

## 11. Riesgos

| Riesgo | Mitigación / nota |
|--------|-------------------|
| Catálogo **18 → 23** filas | Confusión en select; futuro filtro por `stage_key IS NOT NULL` o `activo` (no en SQL-3). |
| `Nuevo lead` ≠ label «Nuevo contacto» | Documentado; UI sigue mostrando `nombre` legacy. |
| `Ganado`/`Perdido` ≠ «Venta ganada/perdida» | Policy y API por `nombre`; `stage_key` es puente silencioso. |
| Colisión `leads_pipelines_nombre_uq` | PRECHECK-4 + doble `NOT EXISTS` en INSERT. |
| Re-ejecución parcial | `UPDATE … AND stage_key IS NULL` + INSERT idempotente. |
| UI futura por `stage_key` | Debe tolerar `label` contrato ≠ `nombre` operativo. |
| Sin columna `activo` | No se puede ocultar legacy en BD sin código o SQL-4. |
| `orden` mezclado | Pickup nuevas (11–14, 95) intercaladas con legacy en listados. |

---

## 12. Decisiones pendientes posteriores

| Decisión | Estado SQL-3 |
|----------|--------------|
| ¿Renombrar `Nuevo lead` → `Nuevo contacto`? | **No** — SQL-4 / producto |
| ¿Renombrar `Ganado`/`Perdido` → labels contrato? | **No** — implica `leadStatusPolicy` |
| ¿Deprecar 14 legacy sin `stage_key`? | **No** — SQL-4 / política |
| ¿Columna `activo`? | **No** |
| ¿API filtra solo filas con `stage_key`? | **No** — 12W-4d+ |
| ¿Actualizar `leadStatusPolicy`? | **No** en esta fase; solo si se adoptan nombres «Venta ganada/perdida» |

---

## 13. Próximas fases

| Fase | Contenido |
|------|-----------|
| **12W-4c-SQL-3-EXEC** | Daniel ejecuta seed + pega POSTCHECK en doc EXEC |
| **12W-4c-QA** | Smoke: Nuevo Lead, Kanban, ficha — catálogo ampliado sin romper 12 leads |
| **12W-4c-SQL-4** | Migración `leads.pipeline` / deprecación legacy si producto aprueba |
| **12W-4d** | UI/POST por `stage_key` si producto lo exige |

---

## 14. Dictamen final

**SQL-3** propone un **seed conservador idempotente** que usa `stage_key` como puente entre el contrato Pickup (`pickup4x4.config.ts` / `packageToPipelineStages`) y `leads_pipelines`, **sin romper** el modelo operativo por `nombre` ni mover los **12** leads de `Nuevo lead`.

Habilita trazabilidad **contrato → catálogo** para nueve keys, mantiene **UI/API legacy**, preserva terminales **Ganado/Perdido** y deja **14** filas legacy sin mapear para decisiones futuras.

**No debe ejecutarse** hasta aprobación manual de Daniel, PRECHECK en verde y backup.

---

## 15. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado | **No** |
| Supabase consultado/modificado por Cursor | **No** |
| Datos modificados por Cursor | **No** |
| Migraciones en repo | **No** |
| APIs | **No** |
| Middleware | **No** |
| Vercel | **No** |
| Build | **No** |
| Commit | **No** |
| Solo documentación | **Sí** |

---

*Documento de diseño 12W-4c-SQL-3. No sustituye `12W-4c-SQL-3-EXEC` ni archivos en `/migrations` hasta aprobación de Daniel.*
