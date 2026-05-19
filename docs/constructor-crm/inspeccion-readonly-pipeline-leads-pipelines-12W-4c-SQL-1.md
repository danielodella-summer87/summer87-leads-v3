# Inspección Read-Only Pipeline leads_pipelines 12W-4c-SQL-1 — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-1 — paquete de queries SELECT para ejecución manual  
**Proyecto:** summer87-leads-v3  
**Base:** plan 12W-4c (`b40bfd9`), auditoría SCHEMA-1 (`9c989e0`), contrato Pickup (`pickup4x4.config.ts`)  
**Estado del documento:** queries listas para copiar; **ninguna query ejecutada** desde Cursor ni en la redacción de este archivo.

**Ejecutor:** Daniel (manual en Supabase SQL Editor o cliente equivalente).  
**Resultados:** pegar en §6 de este archivo **o** en `12W-4c-SQL-1-RESULTS` (documento de ejecución dedicado).

---

## 1. Propósito

Confirmar el **estado real** de Supabase (schema, catálogo `leads_pipelines`, valores en `leads.pipeline`, constraints y riesgos de tenant) **antes** de aprobar:

- DDL propuesto (`stage_key` u otros),
- seed de las 9 etapas Pickup,
- o migración de `leads.pipeline`.

El repo ya estableció (12W-4c-SCHEMA-1) que la app usa **`nombre` string** en operación y **`key`/`label`** en contrato. Esta inspección cierra la brecha **declaración vs datos vivos** sin modificar nada.

---

## 2. Reglas de seguridad

| Regla | Detalle |
|-------|---------|
| Solo **SELECT** | No ejecutar `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `TRUNCATE`, `CREATE`, ni funciones que escriban datos. |
| No desde Cursor | El agente/IDE **no** ejecuta estas queries; Daniel las corre en Supabase. |
| Entorno consciente | Verificar proyecto/branch Supabase antes del primer `SELECT`. |
| Evidencia | Guardar captura de pantalla o copiar salida completa (incl. row counts). |
| Si falla una query | **Detener**, pegar mensaje de error en §6; no “arreglar sobre la marcha” ni ejecutar DDL de emergencia. |
| Sin resultados inventados | Dejar “Pendiente” hasta tener salida real. |
| Backup antes de fases posteriores | Esta fase es read-only; si luego se avanza a DDL/seed, aplicar protocolo backup (11Q) **antes** de escribir. |

---

## 3. Checklist previo

| Ítem | Estado |
|------|--------|
| Confirmé el **entorno Supabase** correcto (URL/proyecto; p. ej. demo Pickup vs base madre) | ☐ Pendiente |
| Confirmé que es **demo/dev** o acepto riesgo si es producción con datos reales | ☐ Pendiente |
| Tengo **backup o snapshot** disponible si más adelante se aprueba DDL/seed | ☐ Pendiente |
| Solo ejecutaré **SELECT** (revisé cada bloque §5) | ☐ Pendiente |
| Pegaré resultados en §6 o en doc `12W-4c-SQL-1-RESULTS` | ☐ Pendiente |
| Leí plan 12W-4c y auditoría SCHEMA-1 | ☐ Pendiente |

**Entorno inspeccionado (completar Daniel):**

| Campo | Valor |
|-------|--------|
| Proyecto Supabase | _Pendiente_ |
| Fecha inspección | _Pendiente_ |
| Rama / deploy asociado (p. ej. Vercel demo) | _Pendiente_ |
| Ejecutor | _Pendiente_ |

---

## 4. Resumen de queries

| Q | Objetivo | Riesgo que responde | Resultado esperado (hipótesis repo) |
|---|----------|---------------------|-------------------------------------|
| **Q1** | Columnas reales de `leads_pipelines` | ¿Existe `stage_key`? ¿Columnas extra? | `id`, `nombre`, `posicion`, `orden`, `tipo`, `color`, timestamps; **sin** `stage_key` |
| **Q2** | Constraints e índices | Colisiones en seed; unicidad `nombre` | UNIQUE `lower(nombre)`; CHECK `tipo`; PK |
| **Q3** | Existencia/conteo `lead_pipelines` vs `leads_pipelines` | Confundir tablas homónimas | `leads_pipelines` con filas; `lead_pipelines` ausente o vacía |
| **Q4** | Inventario catálogo | Cuántas etapas legacy vs contrato (9) | Lista ordenada; posiblemente ≠ 9 filas Pickup |
| **Q5** | Conteo por `tipo` | Más de un `ganado`/`perdido` bloquea API POST | `ganado` n=1, `perdido` n=1 |
| **Q6** | Duplicados nombre normalizado | Violación unique al seed | 0 filas |
| **Q7** | Distribución `leads.pipeline` | Volumen y nombres legacy a mapear | `COUNT` total + grupos por valor |
| **Q8** | Leads huérfanos | Pipeline sin fila en catálogo | Ideal: 0 filas (demo); si hay, plan de mapeo |
| **Q9** | Filas catálogo sin leads | Candidatas a deprecar post-migración | Varias filas posibles en demo |
| **Q10** | Columnas tenant/client | Scope multi-instancia antes de `stage_key` | 0 filas (no evidenciado en repo) |
| **Q11** | Sanity cierre por nombre | Alineación con `leadStatusPolicy` | Posible `Ganado`/`Perdido` vs `Venta ganada`/`Venta perdida` |

**Referencia contrato Pickup (9 etapas — no ejecutar, solo comparar con Q4/Q7):**

| order | key | label | terminal |
|------:|-----|-------|----------|
| 1 | `nuevo_contacto` | Nuevo contacto | — |
| 2 | `consulta_calificada` | Consulta calificada | — |
| 3 | `vehiculo_identificado` | Vehículo identificado | — |
| 4 | `necesidad_detectada` | Necesidad detectada | — |
| 5 | `presupuesto_enviado` | Presupuesto enviado | — |
| 6 | `negociacion` | Negociación | — |
| 7 | `venta_ganada` | Venta ganada | won |
| 8 | `venta_perdida` | Venta perdida | lost |
| 9 | `postventa_seguimiento` | Postventa / seguimiento | — |

---

## 5. Queries read-only

Copiar **un bloque a la vez** en el SQL Editor. Todas son **SELECT** (o lectura de catálogo `information_schema` / `pg_*`).

---

### Q1 — Columnas reales de `leads_pipelines`

```sql
-- Q1: Columnas (confirmar stage_key, activo, client_slug, etc.)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_pipelines'
ORDER BY ordinal_position;
```

---

### Q2 — Constraints e índices de `leads_pipelines`

```sql
-- Q2a: Constraints
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.leads_pipelines'::regclass
ORDER BY conname;

-- Q2b: Índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads_pipelines'
ORDER BY indexname;
```

**Nota:** Si Q2a falla con `relation "public.leads_pipelines" does not exist`, la tabla no está en este proyecto — **NO-GO** hasta aclarar entorno; pegar error en §6.

---

### Q3 — Existencia y conteo: `lead_pipelines` vs `leads_pipelines`

```sql
-- Q3a: ¿Existen las tablas? (siempre seguro)
SELECT
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'existe' END AS estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('lead_pipelines', 'leads_pipelines')
ORDER BY table_name;
```

```sql
-- Q3b: Conteo leads_pipelines (tabla operativa)
SELECT COUNT(*) AS filas_leads_pipelines
FROM public.leads_pipelines;
```

```sql
-- Q3c: Conteo lead_pipelines (tabla distinta — puede no existir)
-- Si falla: copiar error completo en Resultado Q3. No crear tabla.
SELECT COUNT(*) AS filas_lead_pipelines
FROM public.lead_pipelines;
```

---

### Q4 — Inventario completo `leads_pipelines`

```sql
-- Q4: Todas las filas del catálogo operativo
SELECT
  id,
  nombre,
  posicion,
  orden,
  tipo,
  color,
  created_at,
  updated_at
FROM public.leads_pipelines
ORDER BY
  orden NULLS LAST,
  posicion,
  created_at;
```

---

### Q5 — Conteo por `tipo`

```sql
-- Q5: Detectar más de un ganado o más de un perdido
SELECT
  tipo,
  COUNT(*) AS n,
  array_agg(nombre ORDER BY nombre) AS nombres
FROM public.leads_pipelines
GROUP BY tipo
ORDER BY tipo;
```

---

### Q6 — Duplicados por nombre normalizado

```sql
-- Q6: Duplicados case-insensitive (debería devolver 0 filas)
SELECT
  lower(trim(nombre)) AS nombre_norm,
  COUNT(*) AS n,
  array_agg(nombre ORDER BY nombre) AS variantes
FROM public.leads_pipelines
GROUP BY lower(trim(nombre))
HAVING COUNT(*) > 1;
```

---

### Q7 — Valores distintos de `leads.pipeline`

```sql
-- Q7a: Total leads
SELECT COUNT(*) AS total_leads
FROM public.leads;

-- Q7b: Distribución por pipeline
SELECT
  pipeline,
  COUNT(*) AS n
FROM public.leads
GROUP BY pipeline
ORDER BY n DESC NULLS LAST;
```

---

### Q8 — Leads cuyo `pipeline` no matchea catálogo (huérfanos)

```sql
-- Q8: Hasta 200 filas huérfanas (revisar count total en interpretación)
SELECT
  l.id,
  l.pipeline,
  l.created_at
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND trim(l.pipeline) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.leads_pipelines p
    WHERE lower(trim(p.nombre)) = lower(trim(l.pipeline))
  )
ORDER BY l.created_at DESC
LIMIT 200;
```

```sql
-- Q8b (opcional): Solo conteo de huérfanos
SELECT COUNT(*) AS leads_huerfanos
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND trim(l.pipeline) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.leads_pipelines p
    WHERE lower(trim(p.nombre)) = lower(trim(l.pipeline))
  );
```

---

### Q9 — Filas de catálogo sin ningún lead

```sql
-- Q9: Etapas en catálogo sin leads referenciando ese nombre
SELECT
  p.id,
  p.nombre,
  p.tipo,
  p.orden
FROM public.leads_pipelines p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.leads l
  WHERE lower(trim(l.pipeline)) = lower(trim(p.nombre))
)
ORDER BY p.orden NULLS LAST, p.nombre;
```

---

### Q10 — Columnas tenant / client / company / slug

```sql
-- Q10: ¿Hay scope multi-cliente en leads o leads_pipelines?
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'leads_pipelines')
  AND (
    column_name ILIKE '%client%'
    OR column_name ILIKE '%tenant%'
    OR column_name ILIKE '%company%'
    OR column_name ILIKE '%slug%'
  )
ORDER BY table_name, column_name;
```

---

### Q11 — Sanity check nombres de cierre

```sql
-- Q11: Valores que parecen cierre (comparar con leadStatusPolicy en repo)
-- Policy TS normaliza: ganado, perdido, cerrado, no interesado
SELECT
  pipeline,
  COUNT(*) AS n
FROM public.leads
WHERE lower(trim(pipeline)) IN (
  'ganado',
  'perdido',
  'cerrado',
  'no interesado',
  'venta ganada',
  'venta perdida',
  'ganada',
  'perdida'
)
GROUP BY pipeline
ORDER BY n DESC;
```

---

## 6. Plantilla para pegar resultados

> **Estado:** Pendiente de ejecución manual. No rellenar hasta tener salida real de Supabase.

### Resultado Q1

```
Pendiente.
```

### Resultado Q2

```
Pendiente.
```

### Resultado Q3

```
Pendiente.
(Q3c: si error "relation does not exist", pegar aquí.)
```

### Resultado Q4

```
Pendiente.
```

### Resultado Q5

```
Pendiente.
```

### Resultado Q6

```
Pendiente.
```

### Resultado Q7

```
Pendiente.
```

### Resultado Q8

```
Pendiente.
(Incluir Q8b count si se ejecutó.)
```

### Resultado Q9

```
Pendiente.
```

### Resultado Q10

```
Pendiente.
```

### Resultado Q11

```
Pendiente.
```

### Notas del ejecutor (opcional)

```
Pendiente.
```

---

## 7. Interpretación esperada

| Señal en resultados | Interpretación | Acción |
|---------------------|----------------|--------|
| Q1 incluye `stage_key` (u otra columna puente) | DDL de plan 12W-4c puede estar **parcialmente hecho** | No duplicar ALTER; documentar shape real |
| Q1 **no** incluye `stage_key` | Alineado con repo; DDL futuro viable si GO | Diseñar SQL-2 DDL |
| Q2 muestra UNIQUE en `lower(nombre)` o `nombre` | Seed debe usar `label` únicos o mapear colisiones | Tabla de mapeo antes de INSERT |
| Q3: `lead_pipelines` existe con filas | Riesgo de confusión al escribir SQL manual | Usar solo `leads_pipelines` en seed |
| Q3c error `relation does not exist` | Normal si tabla legacy no está desplegada | Anotar; seguir con `leads_pipelines` |
| Q4: muchas más de 9 filas, nombres ≠ contrato | Legacy operativo; seed additive sin DELETE | Plan reconciliación terminales |
| Q5: `ganado` o `perdido` con **n > 1** | **NO-GO seed** hasta reconciliar en transacción | SQL-2/SQL-3: merge/rename primero |
| Q6: filas devueltas | Inconsistencia datos/constraint | NO-GO hasta limpieza manual acordada |
| Q7: muchos valores distintos en `leads.pipeline` | Requiere **tabla de mapeo** legacy → `label` contrato | No UPDATE masivo sin inventario |
| Q8: count > 0 | Hay leads huérfanos **hoy** | Kanban puede tener cards sin columna; migración obligatoria o mapeo |
| Q9: muchas filas | Catálogo con etapas sin uso | Candidatas deprecación **después** de migrar leads |
| Q10: filas con `client_id` / `company_id` / etc. | Multi-tenant no modelado en plan actual | Revisar scope antes de `stage_key` global |
| Q10: 0 filas | Coherente con SCHEMA-1 | Catálogo global por instancia Supabase |
| Q11: `Venta ganada` pero no `Ganado` | `isLeadWon` / cierre pueden **no** aplicar | Plan 12W-4c-POL antes o junto con seed |
| Q11: solo `Ganado`/`Perdido` | Más alineado a policy actual | Mapeo contrato debe decidir nombres materializados |

**Comparación manual contrato vs Q4:** marcar cada `label` Pickup como presente/ausente/colisiona con nombre legacy distinto.

---

## 8. Criterios GO / NO-GO para próxima fase

Completar **después** de pegar resultados en §6.

### GO para diseñar DDL `stage_key` (fase 12W-4c-SQL-2, aún sin ejecutar)

Marcar todas las que apliquen:

| Criterio | ☐ |
|----------|---|
| Entorno Supabase identificado y es el esperado (demo Pickup o acordado) | |
| Q1 confirma que **`stage_key` no existe** (o plan explícito si ya existe) | |
| Q2 constraints entendidas y documentadas | |
| Q5: a lo sumo **1** fila `tipo=ganado` y **1** `tipo=perdido`, **o** plan de reconciliación escrito | |
| Q7/Q8: inventario de `leads.pipeline` entendido; huérfanos con plan si count > 0 | |
| Q10: sin columnas tenant inesperadas **o** scope acordado por producto | |
| Q6: sin duplicados de nombre | |
| Backup disponible para cuando se ejecute DDL (no necesario para esta inspección SELECT) | |
| Daniel aprueba pasar a diseño DDL | |

**Dictamen GO DDL:** _Pendiente_

### NO-GO (bloquear DDL/seed hasta resolver)

| Condición | ☐ Observado |
|-----------|-------------|
| Entorno incorrecto o desconocido | |
| Datos de producción real sin aprobación explícita | |
| Q1–Q11 no ejecutadas o incompletas | |
| Q5: múltiples `ganado`/`perdido` sin plan | |
| Q6: duplicados de nombre | |
| Q8: huérfanos masivos sin plan de mapeo | |
| Q2: constraints inesperadas no documentadas en SCHEMA-1 | |
| Q10: tenant/scope contradice plan “catálogo global” | |
| Sin backup planificado para fase de escritura | |
| Errores de permisos en Supabase sin resolver | |

**Dictamen NO-GO:** _Pendiente_

---

## 9. Próximas fases

| Fase | Entregable | Ejecuta SQL |
|------|------------|-------------|
| **12W-4c-SQL-1** (este doc) | Queries SELECT + checklist | Daniel — **solo lectura** |
| **12W-4c-SQL-1-RESULTS** | Resultados pegados de Q1–Q11 + dictamen GO/NO-GO | Daniel |
| **12W-4c-SQL-2** | Diseño DDL `stage_key` (+ índices); script revisable; **aún no ejecutar** sin GO | Daniel manual post-GO |
| **12W-4c-SQL-3** | Seed idempotente 9 etapas Pickup (`key` → fila) | Daniel manual post-DDL |
| **12W-4c-SQL-4** | Mapeo + `UPDATE leads.pipeline` si producto aprueba | Daniel manual |
| **12W-4c-POL** | Ajuste `leadStatusPolicy` si nombres materializados ≠ set actual | Código — fase aparte |
| **12W-4c-QA** | Nuevo Lead / Kanban / ficha / reportes en Vercel | QA |

**Secuencia:** SQL-1 (inspección) → RESULTS + GO → SQL-2 (diseño DDL) → ejecución DDL manual → SQL-3 seed → SQL-4 migración leads (opcional) → QA.

---

## 10. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado (desde Cursor o en redacción) | **No** |
| Supabase consultado | **No** |
| Datos modificados | **No** |
| APIs modificadas | **No** |
| Middleware modificado | **No** |
| Vercel | **No** |
| Build ejecutado | **No** |
| Commit | **No** |
| Solo documentación | **Sí** |

**Recordatorio:** las queries de §5 son **SELECT-only**. Cualquier escritura pertenece a fases posteriores, con script revisable y backup, ejecutadas **manualmente por Daniel**.
