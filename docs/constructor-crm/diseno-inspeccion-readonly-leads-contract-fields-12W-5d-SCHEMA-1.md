# Diseño Inspección Read-only Leads contract_fields_json 12W-5d-SCHEMA-1 — Constructor CRM Summer87

**Versión:** 12W-5d-SCHEMA-1 — paquete de queries SELECT para ejecución manual  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento | Commit / rol |
|-----------|----------------|
| `diseno-persistencia-campos-dinamicos-pickup-12W-5d.md` | Decisión JSONB `contract_fields_json` (`e7a7cae`) |
| `diseno-mapping-nuevo-lead-pickup-payload-12W-5c.md` | Campos POST Nuevo Lead (`db9a736`) |
| `inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1.md` | Protocolo SCHEMA/SQL de referencia |
| `resultados-inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1-RESULTS.md` | Formato RESULTS esperado |
| `app/api/admin/leads/route.ts` | `LeadCreateInput`, `SELECT_WITH_SNAPSHOT` |
| `app/admin/leads/nuevo/page.tsx` | `LeadCreatePayload` UI |

**Estado del documento:** queries listas para copiar; **ninguna query ejecutada** desde Cursor ni en la redacción de este archivo.

**Ejecutor:** Daniel (manual en Supabase SQL Editor).  
**Resultados:** pegar en `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md` (documento dedicado post-ejecución; ver §11).

---

## 1. Resumen ejecutivo

- **12W-5d** recomendó persistencia dinámica en **`public.leads`** mediante columna **JSONB** `contract_fields_json`, con claves alineadas al contrato (`lead_fields`) y validación futura por whitelist de `packageToLeadFields()`.
- **Antes de diseñar el DDL** (fase **12W-5d-SQL-1**) hay que confirmar el **estado real** de `public.leads` en el entorno Supabase objetivo (demo Pickup u otro): columnas, JSONB existentes, índices, constraints, RLS, volumen y uso de campos del POST Nuevo Lead.
- **Esta fase (12W-5d-SCHEMA-1)** entrega únicamente **SQL SELECT-only** + checklist + plantilla de resultados.
- **No modifica la BD**, no crea migraciones, no toca API/UI/código.
- **Cursor no ejecuta SQL** — Daniel ejecuta manualmente en Supabase SQL Editor **si aprueba** la inspección.
- Tras RESULTS + **GO**, el siguiente paso es **12W-5d-SQL-1** (diseño DDL + rollback documental), no la implementación app (**12W-5e**).

---

## 2. Propósito

Cerrar la brecha **repo / diseño 5d ↔ datos vivos en Supabase** para responder, con evidencia:

| Pregunta | Query(s) |
|----------|----------|
| ¿Existe ya `contract_fields_json` u homónimo? | §5 (2.º SELECT), §9 |
| ¿Qué columnas JSONB hay y cómo se usan? | §5 (3.er SELECT), §7 |
| ¿El schema coincide con lo que consume `POST /api/admin/leads`? | §5, §7, §2.1 |
| ¿Hay índices/constraints que impacten `ADD COLUMN jsonb`? | §6 |
| ¿RLS o triggers bloquearían escritura futura? | §6 |
| ¿Cuántos leads hay y cómo están en `pipeline`? | §7 |
| ¿El entorno es el demo Pickup esperado? | PRECHECK §4.1, checklist §4.2 |

### 2.1 Columnas involucradas en POST Nuevo Lead (referencia repo)

**UI** (`LeadCreatePayload` en `nuevo/page.tsx`):  
`nombre`, `contacto`, `telefono`, `email`, `origen`, `pipeline`, `oferta`, `notas`, `next_activity_type`, `next_activity_at`, `comercial_id`, `rubro_id`, `cantidad_personal`, `superficie_m2`, `direccion`, `visita_scheduled_at`.

**API** (`LeadCreateInput` + insert en `route.ts`): las anteriores más campos legacy/consultivo que el body puede enviar pero Nuevo Lead Pickup no usa en UI (`website`, `instagram`, scores, instalación Casa Limpia, etc.).

**Contrato Pickup pendientes de JSONB** (12W-5d):  
`marca`, `modelo`, `año`, `matricula`, `tipo_uso`, `accesorios_interes`, `localidad`, `tipo_cliente`, `estado_comercial`, `presupuesto_estimado` (+ Kore solo lectura futura).

---

## 3. Alcance

### Incluido

- SQL **SELECT-only** (incluye lectura de catálogo `information_schema`, `pg_indexes`, `pg_constraint`, `pg_policies`, `pg_trigger`).
- Conteos y agregados sin PII detallada.
- Muestras **limitadas** con enmascaramiento (§8).
- Checklist de entorno y criterios GO/NO-GO para **12W-5d-SQL-1**.

### Excluido

- `ALTER TABLE`, `CREATE INDEX`, `DROP`, `TRUNCATE`.
- `INSERT` / `UPDATE` / `DELETE`.
- Scripts DDL de `contract_fields_json` (fase **12W-5d-SQL-1**).
- Ejecución manual DDL (fase **12W-5d-SQL-2**).
- Cambios en API, UI, adapters, Supabase remoto desde Cursor.
- Integraciones **Zeta/Kore** (solo verificar si hay columnas `kore_*` en schema; no probar sync).
- Tocar `lead_pipelines` / `leads_pipelines` salvo join opcional Q10b para huérfanos pipeline.

---

## 4. Reglas de seguridad

| Regla | Detalle |
|-------|---------|
| Solo **SELECT** | No ejecutar DML ni DDL. |
| **Cursor no ejecuta** | Daniel corre cada bloque en Supabase SQL Editor. |
| Entorno consciente | Confirmar proyecto (demo Pickup vs base madre) antes de P0. |
| Evidencia | Copiar salida completa o captura; anotar row counts. |
| Error en una query | **Detener**, pegar mensaje en RESULTS (§11); no improvisar DDL. |
| Sin resultados inventados | Dejar «Pendiente» hasta salida real. |
| PII | Preferir agregados §7; muestra §8 con máscara; no exportar teléfonos/emails completos en RESULTS. |
| Backup | Esta fase es read-only; antes de **SQL-2** aplicar protocolo **11Q**. |

### 4.1 PRECHECK entorno (opcional, ejecutar primero)

```sql
SELECT current_database() AS db, current_user AS usr, now() AS ts;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'leads';
```

Si la segunda query devuelve **0 filas**: **NO-GO** — no continuar.

### 4.2 Checklist previo (Daniel)


| Ítem | Estado |
|------|--------|
| Confirmé **proyecto Supabase** correcto (p. ej. `pickup4x4-crm-demo`) | ☐ Pendiente |
| Acepto riesgo si no es demo / hay datos reales | ☐ Pendiente |
| Solo ejecutaré bloques **SELECT** de §5–§9 | ☐ Pendiente |
| Pegaré resultados en `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md` | ☐ Pendiente |
| Leí `diseno-persistencia-campos-dinamicos-pickup-12W-5d.md` | ☐ Pendiente |

| Campo | Valor |
|-------|--------|
| Proyecto Supabase | _Pendiente_ |
| Fecha inspección | _Pendiente_ |
| Deploy Vercel asociado | _Pendiente_ |
| Ejecutor | _Pendiente_ |

---

---

## 5. SQL propuesto — estructura tabla `leads`

Copiar **un bloque a la vez** en Supabase SQL Editor. Solo **SELECT**.

### 5.1 Estructura completa y `contract_fields_json`

```sql
-- 5.1a: Todas las columnas de public.leads
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
ORDER BY ordinal_position;
```

```sql
-- 5.1b: ¿Existe contract_fields_json? (esperado pre-DDL: 0 filas)
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'contract_fields_json';
```

```sql
-- 5.1c: Columnas json / jsonb actuales
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND udt_name IN ('json', 'jsonb')
ORDER BY ordinal_position;
```

### Explicación esperada (§5)

- Si **5.1b** devuelve **0 filas**, el DDL futuro (**12W-5d-SQL-1**) puede diseñarse como `ADD COLUMN contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb`.
- Si **5.1b** devuelve **≥ 1 fila**, **NO-GO** para crear columna nueva con el mismo nombre: investigar tipo, default, datos existentes y si 5e debe adaptarse a columna ya presente.
- Las columnas **json/jsonb** de **5.1c** ayudan a **no reutilizar** blobs con semántica incorrecta (`installation_details_json` ≠ campos de contrato CRM).

---

## 6. SQL propuesto — índices, constraints, triggers, policies

```sql
-- 6.1: Índices en public.leads
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads'
ORDER BY indexname;
```

```sql
-- 6.2: Constraints
SELECT
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) AS constraint_def
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'leads'
ORDER BY c.conname;
```

```sql
-- 6.3: Triggers (information_schema)
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'leads'
ORDER BY trigger_name, event_manipulation;
```

```sql
-- 6.4: Policies / RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'leads'
ORDER BY policyname;
```

```sql
-- 6.5 (opcional): ¿RLS habilitado en la tabla?
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'leads';
```

### Explicación esperada (§6)

- **Índices actuales** definen si conviene sumar un **índice expresión** sobre `contract_fields_json->>'marca'` en SQL-1 (opcional, no obligatorio en piloto).
- **Constraints** y **triggers** ayudan a detectar side effects en `INSERT`/`UPDATE` cuando la API escriba JSONB.
- **Policies/RLS** son relevantes **antes** de permitir escritura de `contract_fields_json` desde `POST /api/admin/leads` (service role vs anon).

---

## 7. SQL propuesto — volumen y datos agregados

```sql
-- 7.1: Total de leads
SELECT COUNT(*) AS total_leads
FROM public.leads;
```

```sql
-- 7.2: Distribución pipeline
SELECT
  pipeline,
  COUNT(*) AS n
FROM public.leads
GROUP BY pipeline
ORDER BY n DESC, pipeline;
```

```sql
-- 7.3: Campos core del POST Nuevo Lead (conteos, sin PII)
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE nombre IS NOT NULL AND trim(nombre) <> '') AS con_nombre,
  COUNT(*) FILTER (WHERE contacto IS NOT NULL AND trim(contacto) <> '') AS con_contacto,
  COUNT(*) FILTER (WHERE telefono IS NOT NULL AND trim(telefono) <> '') AS con_telefono,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND trim(email) <> '') AS con_email,
  COUNT(*) FILTER (WHERE origen IS NOT NULL AND trim(origen) <> '') AS con_origen,
  COUNT(*) FILTER (WHERE oferta IS NOT NULL AND trim(oferta) <> '') AS con_oferta,
  COUNT(*) FILTER (WHERE notas IS NOT NULL AND trim(notas) <> '') AS con_notas,
  COUNT(*) FILTER (WHERE direccion IS NOT NULL AND trim(direccion) <> '') AS con_direccion,
  COUNT(*) FILTER (WHERE next_activity_type IS NOT NULL AND trim(next_activity_type) <> '') AS con_next_activity_type,
  COUNT(*) FILTER (WHERE next_activity_at IS NOT NULL) AS con_next_activity_at,
  COUNT(*) FILTER (WHERE comercial_id IS NOT NULL) AS con_comercial_id,
  COUNT(*) FILTER (WHERE rubro_id IS NOT NULL) AS con_rubro_id,
  COUNT(*) FILTER (WHERE visita_scheduled_at IS NOT NULL) AS con_visita_scheduled_at
FROM public.leads;
```

```sql
-- 7.4: Uso de JSONB existentes (objetivos, audiencia, installation_details_json, commercial_strategy_json)
-- NOTA: Si alguna columna no existe, copiar el error textual en RESULTS y documentar divergencia repo/BD.
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE objetivos IS NOT NULL AND objetivos::text <> '{}'::text) AS objetivos_no_vacio,
  COUNT(*) FILTER (WHERE audiencia IS NOT NULL AND audiencia::text <> '{}'::text) AS audiencia_no_vacia,
  COUNT(*) FILTER (
    WHERE installation_details_json IS NOT NULL
      AND installation_details_json::text <> '{}'::text
  ) AS installation_details_no_vacio,
  COUNT(*) FILTER (
    WHERE commercial_strategy_json IS NOT NULL
      AND commercial_strategy_json::text <> '{}'::text
  ) AS commercial_strategy_no_vacio
FROM public.leads;
```

### Explicación esperada (§7)

- Si **7.4** falla por columna inexistente, **no es necesariamente error de diseño**: documentar diferencia entre código/docs y BD real del entorno inspeccionado.
- El objetivo es saber si ya hay **blobs semánticamente parecidos** o si `contract_fields_json` debe ser **columna nueva** con semántica contractual (recomendación 12W-5d).

---

## 8. SQL propuesto — muestra segura limitada

```sql
-- 8.1: Últimos 10 leads — teléfono/email enmascarados; previews cortos de oferta/notas
SELECT
  id,
  created_at,
  updated_at,
  nombre,
  pipeline,
  origen,
  CASE
    WHEN telefono IS NULL OR trim(telefono) = '' THEN NULL
    ELSE left(trim(telefono), 3) || '***'
  END AS telefono_masked,
  CASE
    WHEN email IS NULL OR trim(email) = '' THEN NULL
    ELSE left(trim(email), 2) || '***'
  END AS email_masked,
  left(coalesce(oferta, ''), 80) AS oferta_preview,
  left(coalesce(notas, ''), 80) AS notas_preview,
  next_activity_type,
  next_activity_at,
  comercial_id,
  rubro_id,
  direccion
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;
```

### Explicación esperada (§8)

- **No copiar** teléfonos ni emails completos en `…-SCHEMA-1-RESULTS.md`.
- La muestra sirve para verificar **tipos reales** y valores de `pipeline`, no para auditar personas.
- Si algún campo del SELECT no existe, copiar el **error** y documentar divergencia (no usar `ALTER` para “arreglar”).

---

## 9. SQL propuesto — compatibilidad futura `contract_fields_json`

```sql
-- 9.1: Columnas con nombre parecido (custom, contract, field, json)
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND (
    column_name ILIKE '%custom%'
    OR column_name ILIKE '%contract%'
    OR column_name ILIKE '%field%'
    OR column_name ILIKE '%json%'
  )
ORDER BY ordinal_position;
```

```sql
-- 9.2: Candidatas conocidas (repo + diseño 5d)
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN (
    'contract_fields_json',
    'custom_fields',
    'lead_fields',
    'dynamic_fields',
    'extra_fields',
    'installation_details_json',
    'commercial_strategy_json',
    'objetivos',
    'audiencia'
  )
ORDER BY ordinal_position;
```

### Explicación esperada (§9)

- Si existe **`custom_fields`** o equivalente reutilizable, **no** crear `contract_fields_json` sin evaluación explícita de producto.
- Si solo existen JSONB de **otros verticales** (facility, IA, consultivo), se mantiene la recomendación de **columna nueva** con semántica contractual.
- Si **`contract_fields_json` ya existe**, la fase **12W-5d-SQL-1** pasa de `ADD COLUMN` a **verificación + adapter API** (y posible ajuste de default/constraints).

---

## 10. Criterio GO/NO-GO para pasar a SQL-1

Completar **después** de pegar resultados reales en `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md`.

### Tabla GO

| Criterio | Esperado |
|----------|----------|
| `public.leads` existe | Sí |
| `contract_fields_json` | **Ausente** |
| Columna equivalente obvia (`custom_fields`, etc.) | **No** (o evaluada explícitamente) |
| JSONB existentes | **No** adecuados semánticamente para contrato CRM Pickup |
| Índices/constraints | Sin bloqueo para `ADD COLUMN jsonb DEFAULT '{}'::jsonb` |
| RLS/policies | Sin bloqueo o con plan documentado |
| Conteo filas | Documentado |
| `app/api/admin/leads/route.ts` vs tabla | Coherente (columnas POST presentes) |
| Datos sensibles | No expuestos completos en RESULTS |

**Dictamen GO SQL-1:** _Pendiente (solo con resultados reales §11)._

### Tabla NO-GO

| Condición |
|-----------|
| `contract_fields_json` **ya existe** |
| Existe `custom_fields` / `dynamic_fields` reutilizable y **no** evaluado |
| Constraints/triggers/policies inesperadas que puedan afectar escritura JSONB |
| Tabla real **no** coincide con `app/api/admin/leads/route.ts` |
| Inspección JSONB falla por columnas inexistentes **sin** documentar divergencia |
| Dudas de entorno Supabase (proyecto incorrecto) |
| No hay backup/protocolo definido para fase DDL posterior (**11Q**) |
| Se pretende mezclar SCHEMA-1 con `ALTER TABLE` |

**Dictamen NO-GO:** _Pendiente_

### Dictamen de esta fase (12W-5d-SCHEMA-1)

- **GO** únicamente para **diseñar 12W-5d-SQL-1** si los resultados reales en RESULTS acompañan la tabla GO.
- **NO-GO** para ejecutar DDL en SCHEMA-1 — el DDL es fase **12W-5d-SQL-2** manual, post SQL-1.

---

## 11. Resultado esperado de Daniel

Daniel debe ejecutar manualmente los **SELECT** de §5–§9 (y PRECHECK §4.1) en **Supabase SQL Editor** y pegar resultados en:

`docs/constructor-crm/resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md`

Ese documento futuro debe contener:

| Ítem | Contenido |
|------|-----------|
| Fecha | Día de inspección |
| Entorno Supabase | Proyecto / URL |
| Resultados por bloque | §5, §6, §7, §8, §9 (salida copiada o resumen fiel) |
| Divergencias | Columnas en repo pero no en BD (o viceversa) |
| Dictamen | GO/NO-GO para **12W-5d-SQL-1** |
| Confirmación | **No** se ejecutó `ALTER` / `CREATE` / `UPDATE` / `DELETE` |

### Reglas para Daniel

- **Cursor no ejecuta SQL.**
- Si un SELECT falla porque una columna no existe, copiar el **error textual** (ej. `column "installation_details_json" does not exist`).
- **No** intentar arreglar con `ALTER TABLE`.
- **No** editar datos.
- **No** registrar teléfonos/emails completos en RESULTS si la muestra §8 se amplió por error.

### Plantilla mínima RESULTS (copiar al crear el archivo)

```markdown
# Resultados Inspección Read-only Leads contract_fields_json 12W-5d-SCHEMA-1-RESULTS

Fecha: _Pendiente_
Entorno Supabase: _Pendiente_

## §5 Estructura
Pendiente.

## §6 Índices / constraints / triggers / policies
Pendiente.

## §7 Volumen y agregados
Pendiente.
(Anotar errores 7.4 si columnas JSONB faltan.)

## §8 Muestra segura
Pendiente.

## §9 Compatibilidad contract_fields_json
Pendiente.

## Dictamen
GO SQL-1: Pendiente
NO-GO: Pendiente
Confirmación sin escritura: Sí / No
```

---

## 12. Próximas fases

| Fase | Alcance | SQL ejecutado | Entregable |
|------|---------|---------------|------------|
| **12W-5d-SCHEMA-1** | Diseño SELECT-only | **No** (Cursor) | Este documento |
| **12W-5d-SCHEMA-1-RESULTS** | Daniel pega resultados reales | Solo SELECT manual | `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md` |
| **12W-5d-SQL-1** | Diseño DDL `contract_fields_json` + PRECHECK/POSTCHECK/rollback | **No** | `diseno-ddl-contract-fields-json-12W-5d-SQL-1.md` |
| **12W-5d-SQL-2** | Ejecución manual DDL si Daniel aprueba | **Sí**, manual | `ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md` |
| **12W-5e** | API/UI `contract_fields` | **No DDL** | Implementación + validación |
| **12W-5-QA** | QA Vercel POST controlado | **No SQL** | Doc QA |

**Secuencia:** SCHEMA-1 → RESULTS + GO → SQL-1 → SQL-2-EXEC → 5e → 5-QA.

---

## 13. NO-GO explícitos

- No ejecutar `ALTER TABLE`.
- No ejecutar `CREATE INDEX`.
- No ejecutar `UPDATE`, `INSERT` ni `DELETE`.
- No tocar datos.
- No tocar Zeta/Kore (integración fuera de alcance).
- No mezclar con implementación **12W-5e** en esta fase.
- No asumir que columnas JSONB existen si el SELECT falla — documentar divergencia.
- No registrar teléfonos/emails completos innecesariamente en RESULTS.
- No diseñar DDL definitivo (**SQL-1**) sin resultados reales (**RESULTS**).
- No hacer commit automático desde Cursor.
- No modificar código ni API.

---

## 14. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código modificado | **No** |
| API modificada | **No** |
| SQL ejecutado por Cursor | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Migraciones creadas | **No** |
| Solo documentación | **Sí** |
| Commit | **No** |

---

## Referencias cruzadas

- Decisión JSONB: `diseno-persistencia-campos-dinamicos-pickup-12W-5d.md`
- POST actual: `diseno-mapping-nuevo-lead-pickup-payload-12W-5c.md`, `app/api/admin/leads/route.ts`, `app/admin/leads/nuevo/page.tsx`
- Protocolo inspección pipeline: `inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1.md`
- DDL pipeline (análogo): `diseno-ddl-stage-key-leads-pipelines-12W-4c-SQL-2.md`
