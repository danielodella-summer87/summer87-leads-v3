# Diseño DDL contract_fields_json 12W-5d-SQL-1 — Constructor CRM Summer87

**Versión:** 12W-5d-SQL-1 — diseño documental DDL (sin ejecución)  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento | Commit / rol |
|-----------|----------------|
| `diseno-persistencia-campos-dinamicos-pickup-12W-5d.md` | Decisión JSONB `contract_fields_json` (`e7a7cae`) |
| `diseno-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1.md` | Queries SELECT SCHEMA-1 (`3343468`) |
| `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md` | Evidencia Supabase (`eb8823d`) |
| `diseno-ddl-stage-key-leads-pipelines-12W-4c-SQL-2.md` | Plantilla PRECHECK/DDL/POSTCHECK/rollback |
| `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md` | Formato EXEC esperado SQL-2 |
| `app/api/admin/leads/route.ts` | `LeadCreateInput`, `SELECT_WITH_SNAPSHOT` |
| `app/admin/leads/nuevo/page.tsx` | `LeadCreatePayload` UI |

**Estado:** script propuesto para revisión; **no ejecutado** en Supabase ni aplicado en `/migrations`.

**Ejecutor futuro (cuando se apruebe):** Daniel — manual en Supabase SQL Editor, con backup previo (protocolo 11Q).

---

## 1. Resumen ejecutivo

- **12W-5d-SCHEMA-1-RESULTS** confirmó que `public.leads` existe, que **`contract_fields_json` no existe** y que no hay columnas equivalentes (`custom_fields`, `lead_fields`, `dynamic_fields`, `extra_fields`).
- Los **cinco JSONB legacy** (`objetivos`, `audiencia`, `commercial_strategy_json`, `installation_details_json`, `visita_relevamiento_json`) tienen **semántica distinta** al contrato Pickup; no se reutilizan.
- Esta fase (**12W-5d-SQL-1**) diseña un DDL **mínimo y reversible**: `ADD COLUMN contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb` + `COMMENT ON COLUMN`.
- **No se ejecuta SQL** en SQL-1. **Cursor no ejecuta SQL.** Daniel ejecutará manualmente solo en **12W-5d-SQL-2** si aprueba.
- **Dictamen documental:** **GO** para preparar ejecución SQL-2; **NO-GO** para DDL directo en esta fase.

---

## 2. Base de evidencia

Fuente: `resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md` (inspección Daniel, 2026-05-21, proyecto **summer87-leads-v3**, main/PRODUCTION).

| Dimensión | Valor confirmado |
|-----------|------------------|
| Tabla `public.leads` | **Existe** |
| `contract_fields_json` | **Ausente** |
| `custom_fields` / `lead_fields` / `dynamic_fields` / `extra_fields` | **Ausentes** |
| JSONB legacy (no equivalentes) | `objetivos`, `audiencia`, `commercial_strategy_json`, `installation_details_json`, `visita_relevamiento_json` |
| Total leads | **12** |
| Pipeline | **`Nuevo lead` = 12** |
| RLS | `rls_enabled = true`, `rls_forced = false` |
| `pg_policies` sobre `leads` | **0 filas** |
| Trigger | `trg_leads_updated_at` — BEFORE UPDATE — `set_updated_at()` |
| Índices actuales (sin cambio en SQL-2) | `idx_leads_empresa_id`, `idx_leads_is_member`, `idx_leads_rubro_id`, `idx_leads_socio_id`, `leads_created_at_idx`, `leads_pipeline_idx`, `leads_pkey` |
| Dictamen SCHEMA-1 | **GO** SQL-1; **NO-GO** DDL directo |

---

## 3. Decisión de diseño

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Nombre columna | `contract_fields_json` | Alineado con **12W-5d** y convención `*_json` en `leads` |
| Tipo | `jsonb` | Consultas `->>` / `?`; patrón existente (`installation_details_json`, …) |
| Default | `'{}'::jsonb` | Filas existentes y nuevos inserts sin valor explícito reciben objeto vacío |
| Nullability | **`NOT NULL`** | Evita ambigüedad `NULL` vs «sin campos»; vacío = `{}` |
| Comentario columna | **Sí** (`COMMENT ON COLUMN`) | Documenta propósito en catálogo Postgres |
| Índice GIN global | **No** en SQL-2 | Volumen bajo (12 filas); sin reportes que lo exijan aún |
| Índice por `marca` (`->>'marca'`) | **No** en SQL-2 | Documentado como **fase futura** si reporting Pickup lo requiere (ver §12) |
| CHECK `jsonb_typeof = 'object'` | **No en v1** (recomendado) | Ver §3.1 |
| Reutilizar JSONB legacy | **No** | RESULTS + diseño 5d |
| Trigger `updated_at` | **Sin cambio** | `ADD COLUMN` no altera trigger existente |
| Validación de claves/tipos | **API 12W-5e** | Whitelist `packageToLeadFields()`; no en DDL |

### 3.1 CHECK constraint — evaluación

**Opción evaluada:**

```sql
ALTER TABLE public.leads
  ADD CONSTRAINT leads_contract_fields_json_object_check
  CHECK (jsonb_typeof(contract_fields_json) = 'object');
```

| Aspecto | Con CHECK | Sin CHECK (v1 recomendado) |
|---------|-----------|----------------------------|
| Filas tras `ADD COLUMN` con default `{}` | **Cumple** (object) | Cumple |
| Escritura directa SQL/array escalar | **Rechazada** en BD | Permitida (riesgo operativo) |
| Idempotencia re-ejecución | `ADD CONSTRAINT` **falla** si ya existe; requiere bloque `DO $$ … IF NOT EXISTS …` | Solo `ADD COLUMN IF NOT EXISTS` |
| Alineación 5e | API validará whitelist; CHECK es defensa en profundidad | Validación principal en app |

**Recomendación conservadora (SQL-2):** **no incluir CHECK en v1.** El default `'{}'` y la validación en **12W-5e** cubren el piloto. Si más adelante se requiere defensa en BD, agregar el constraint en una fase SQL dedicada con script idempotente:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_contract_fields_json_object_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_contract_fields_json_object_check
      CHECK (jsonb_typeof(contract_fields_json) = 'object');
  END IF;
END $$;
```

---

## 4. PRECHECK SQL — NO ejecutar hasta SQL-2

> **Solo SELECT.** Ejecutar **antes** del DDL (§5). Si alguna comprobación falla, **no** ejecutar el DDL.

Debe quedar claro:

1. Proyecto Supabase correcto (**summer87-leads-v3** / demo Pickup esperado).
2. **`contract_fields_json` aún no existe** (evitar `ADD COLUMN` con tipo distinto ya presente).
3. Estado coherente con RESULTS (`eb8823d`) o documentar divergencia en EXEC.
4. JSONB legacy **siguen existiendo** (no se eliminan en este DDL).

```sql
-- PRECHECK-0: Metadatos de sesión (opcional, copiar resultado)
SELECT current_database() AS db, current_user AS usr, now() AS ts;
```

```sql
-- PRECHECK-1: Tabla leads existe (esperado: 1 fila)
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'leads';
```

```sql
-- PRECHECK-2: contract_fields_json NO debe existir (esperado: 0 filas)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'contract_fields_json';
```

```sql
-- PRECHECK-3: Candidatas equivalentes NO deben existir (esperado: 0 filas)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN (
    'contract_fields_json',
    'custom_fields',
    'lead_fields',
    'dynamic_fields',
    'extra_fields'
  )
ORDER BY column_name;
```

```sql
-- PRECHECK-4: JSONB legacy siguen presentes (esperado: 5 filas jsonb)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN (
    'objetivos',
    'audiencia',
    'commercial_strategy_json',
    'installation_details_json',
    'visita_relevamiento_json'
  )
ORDER BY column_name;
```

```sql
-- PRECHECK-5: Volumen leads (esperado RESULTS: total = 12)
SELECT COUNT(*) AS total_leads FROM public.leads;

SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline
ORDER BY n DESC;
```

```sql
-- PRECHECK-6: RLS y policies
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'leads';

SELECT COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'leads';
-- Esperado RESULTS: rls_enabled true, policy_count 0 (o documentar divergencia)
```

```sql
-- PRECHECK-7: Trigger updated_at intacto (esperado: trg_leads_updated_at)
SELECT tgname, pg_get_triggerdef(oid) AS trigger_def
FROM pg_trigger
WHERE tgrelid = 'public.leads'::regclass
  AND NOT tgisinternal
  AND tgname = 'trg_leads_updated_at';
```

```sql
-- PRECHECK-8: Índice contract_fields_json NO debe existir (esperado: 0 filas)
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads'
  AND indexdef ILIKE '%contract_fields_json%';
```

### Criterio GO PRECHECK

| Check | Esperado |
|-------|----------|
| PRECHECK-1 | 1 fila (`leads`) |
| PRECHECK-2 | 0 filas |
| PRECHECK-3 | 0 filas (ninguna candidata) |
| PRECHECK-4 | 5 filas jsonb legacy |
| PRECHECK-5 total | 12 (o documentar divergencia) |
| PRECHECK-6 | RLS on; policies 0 o documentadas |
| PRECHECK-8 | 0 filas |
| Backup 11Q | Confirmado antes de §5 |

---

## 5. DDL propuesto — NO ejecutar en SQL-1

> **NO ejecutado** en redacción de este documento.  
> Ejecutar en **una transacción** en Supabase SQL Editor. Revisar salida antes de `COMMIT`.

```sql
-- =============================================================================
-- 12W-5d-SQL-2 — DDL contract_fields_json en public.leads
-- Ejecutor: Daniel | Backup: obligatorio (11Q) | Fecha: ___________
-- =============================================================================

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.leads.contract_fields_json IS
  'Valores de campos declarados en lead_fields del paquete CRM activo. Claves validadas por contrato/adapters; no reemplaza columnas core del lead.';

COMMIT;
```

### Notas sobre `IF NOT EXISTS`

- `ADD COLUMN IF NOT EXISTS` permite re-ejecutar sin error si un intento previo falló a medias — **igual** verificar POSTCHECK.
- Si `contract_fields_json` ya existe con **tipo o nullability distintos**, **no** usar ciego `IF NOT EXISTS`; investigar y usar ROLLBACK (§7) o ajuste manual documentado.

### Lo que este DDL **no** hace

- No crea índice GIN ni índice por `marca`.
- No agrega CHECK constraint (decisión v1, §3.1).
- No modifica `objetivos`, `audiencia` ni otros JSONB.
- No altera RLS, policies, triggers ni columnas core.
- No escribe datos de contrato Pickup (vehículo, presupuesto, etc.) — solo inicializa `{}` en filas existentes vía default.

### Variante futura — índice por marca (NO en SQL-2)

Solo si reporting o filtros Kanban lo exigen, en fase posterior:

```sql
-- FUTURO — no ejecutar en 12W-5d-SQL-2 salvo diseño aparte
-- CREATE INDEX IF NOT EXISTS idx_leads_contract_fields_marca
--   ON public.leads ((contract_fields_json->>'marca'))
--   WHERE (contract_fields_json ? 'marca');
```

---

## 6. POSTCHECK SQL — después de ejecución SQL-2

> Ejecutar **después** del `COMMIT` del §5. Pegar resultados en `ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md`.

```sql
-- POSTCHECK-1: Columna existe, tipo jsonb, NOT NULL, default {}
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'contract_fields_json';
-- Esperado: jsonb, is_nullable = NO, default '{}'::jsonb (o equivalente)
```

```sql
-- POSTCHECK-2: Comentario de columna presente
SELECT
  col_description(
    (quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass::oid,
    ordinal_position
  ) AS column_comment
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'contract_fields_json';
-- Esperado: texto mencionando lead_fields / paquete CRM
```

```sql
-- POSTCHECK-3: Todas las filas con objeto vacío inicial
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE contract_fields_json = '{}'::jsonb) AS con_vacio,
  COUNT(*) FILTER (WHERE contract_fields_json <> '{}'::jsonb) AS con_datos,
  COUNT(*) FILTER (WHERE jsonb_typeof(contract_fields_json) = 'object') AS es_object
FROM public.leads;
-- Esperado post-DDL sin 5e: total=12, con_vacio=12, con_datos=0, es_object=12
```

```sql
-- POSTCHECK-4: Core sin cambio (sanity — ajustar si divergencia documentada)
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE nombre IS NOT NULL AND trim(nombre) <> '') AS con_nombre,
  COUNT(*) FILTER (WHERE pipeline = 'Nuevo lead') AS en_nuevo_lead
FROM public.leads;
-- Esperado: total=12, con_nombre=12, en_nuevo_lead=12
```

```sql
-- POSTCHECK-5: JSONB legacy intactos (conteo columnas)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN (
    'objetivos', 'audiencia', 'commercial_strategy_json',
    'installation_details_json', 'visita_relevamiento_json'
  )
ORDER BY column_name;
-- Esperado: 5 filas jsonb
```

```sql
-- POSTCHECK-6: Muestra segura (sin PII completa)
SELECT id, nombre, contract_fields_json
FROM public.leads
ORDER BY created_at DESC NULLS LAST
LIMIT 5;
-- Esperado: contract_fields_json = {} en cada fila
```

```sql
-- POSTCHECK-7: Sin índice nuevo sobre contract_fields_json (esperado: 0 filas)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leads'
  AND indexdef ILIKE '%contract_fields_json%';
```

### Criterio GO POSTCHECK

| Check | Esperado |
|-------|----------|
| POSTCHECK-1 | Columna jsonb NOT NULL, default `{}` |
| POSTCHECK-2 | Comment no vacío |
| POSTCHECK-3 | `es_object` = total; `con_vacio` = total (sin escritura 5e) |
| POSTCHECK-4 | Core igual a RESULTS |
| POSTCHECK-7 | 0 índices nuevos |
| App smoke (manual) | Nuevo Lead / Kanban / lista leads cargan — **sin** cambio código hasta 5e |

---

## 7. Rollback SQL — NO ejecutar salvo aprobación

> Usar solo si hay que revertir **antes** de que **12W-5e** u otros procesos dependan de la columna.  
> **No** ejecutar rollback si ya hay datos útiles en `contract_fields_json` sin export/backup.

```sql
-- =============================================================================
-- ROLLBACK 12W-5d-SQL-2 — Revertir contract_fields_json
-- Ejecutor: Daniel | Motivo: ___________
-- =============================================================================

-- Paso 0 (SELECT): verificar que es seguro
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE contract_fields_json <> '{}'::jsonb) AS filas_con_datos
FROM public.leads;
-- Si filas_con_datos > 0: detener; exportar JSONB antes de DROP.

BEGIN;

ALTER TABLE public.leads
  DROP COLUMN IF EXISTS contract_fields_json;

COMMIT;
```

### Condiciones de rollback seguro

| Condición | Acción |
|-----------|--------|
| Todas las filas `contract_fields_json = '{}'` | Rollback §7 **viable** |
| Alguna fila con datos de contrato | **Exportar** (SELECT id, contract_fields_json) → luego DROP |
| 5e ya en producción escribiendo JSONB | **NO-GO** rollback sin plan de migración |

---

## 8. Impacto esperado

| Área | Impacto |
|------|---------|
| Tabla `leads` | **+1** columna `jsonb NOT NULL DEFAULT '{}'` |
| Leads existentes (12) | Reciben `{}` al aplicar DDL (default en ADD COLUMN) |
| API actual (`route.ts`) | **Sin cambio** hasta **12W-5e** — `LeadCreateInput` / `SELECT_WITH_SNAPSHOT` no incluyen la columna aún |
| Nuevo Lead (`nuevo/page.tsx`) | **Sin cambio** hasta **12W-5f** UI vehículo |
| Ficha / detalle lead | **Sin cambio** |
| Kanban | **Sin cambio** |
| RLS / policies | **Sin cambio** (0 policies observadas; RLS sigue enabled) |
| Trigger `trg_leads_updated_at` | **Sin cambio** — `ADD COLUMN` no dispara UPDATE |
| JSONB legacy | **Sin cambio** |
| Reportes / BI | **Sin cambio** hasta queries explícitas sobre nueva columna |
| Performance | **Mínimo** — sin índice nuevo; tabla pequeña |

---

## 9. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| DDL en **production** (main) | Alta | PRECHECK entorno; backup 11Q; ventana acordada; EXEC documentado |
| JSONB sin validación API → datos basura | Media | **NO-GO** escritura manual masiva; validación whitelist en **5e** |
| RLS enabled sin policies visibles | Media | Revisar rol Supabase en API (service role) antes de 5e |
| CHECK constraint no idempotente | Baja en v1 | **Excluido** en SQL-2 (§3.1) |
| Lock en `ALTER TABLE` en tablas grandes | Baja aquí | 12 filas; monitorear si entorno diverge |
| **5e desplegado antes de SQL-2** | Alta | INSERT/SELECT fallan por columna ausente — orden: SQL-2 → luego 5e |
| **SQL-2 en entorno equivocado** | Alta | PRECHECK-0 + confirmación Daniel |
| Confusión con JSONB legacy | Media | Documentación + nombres distintos; API no escribe en `objetivos` para Pickup |
| Rollback tras datos reales | Alta | PRECHECK filas_con_datos en §7 |

---

## 10. Criterio GO/NO-GO para SQL-2

### GO (habilitado ejecutar DDL manual)

| Criterio | Requerido |
|----------|-----------|
| Daniel confirma entorno Supabase correcto | Sí |
| Backup / protocolo **11Q** listo | Sí |
| PRECHECK §4 completo — OK | Sí |
| `contract_fields_json` ausente | Sí |
| Sin columna equivalente reutilizable sin evaluación | Sí |
| DDL §5 revisado y entendido | Sí |
| Rollback §7 entendido | Sí |
| Aprobación manual explícita de Daniel | Sí |

### NO-GO (detener ejecución)

| Criterio | Motivo |
|----------|--------|
| Entorno Supabase equivocado | Riesgo alterar instancia incorrecta |
| `contract_fields_json` ya existe con tipo distinto | Requiere migración, no `ADD COLUMN` ciego |
| Aparece `custom_fields` u homónimo usable | Reevaluar diseño 5d antes de duplicar |
| Policies RLS nuevas inesperadas | Impacto escritura 5e |
| Sin backup / protocolo 11Q | Riesgo operativo |
| Daniel no aprueba ejecución manual | Protocolo del proyecto |
| Intención de desplegar **5e** antes de SQL-2 | Orden incorrecto |

### Dictamen SQL-1 (esta fase)

| Acción | Veredicto |
|--------|-----------|
| Documentar DDL + PRECHECK + POSTCHECK + rollback | **GO** |
| Ejecutar DDL en SQL-1 | **NO-GO** |

---

## 11. Documento de ejecución esperado

Si Daniel aprueba y ejecuta el DDL en **12W-5d-SQL-2**, crear y completar:

**`docs/constructor-crm/ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md`**

Debe registrar (plantilla alineada con `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md`):

| Sección | Contenido |
|---------|-----------|
| Resumen | DDL aplicado / Success / fecha / entorno |
| DDL ejecutado | Copia exacta del script §5 (con fecha) |
| Resultado Supabase | Mensaje del editor |
| POSTCHECK | Resultados §6 pegados o tabulados |
| Dictamen | GO POSTCHECK / observaciones |
| Impacto | Confirmación app sin cambio |
| Alcance | Sin API, sin código, sin seed de vehículo |
| Rollback | Solo si aplica — motivo y resultado |

---

## 12. Próximas fases

| Fase | Entregable |
|------|------------|
| **12W-5d-SQL-2** | Ejecución manual DDL + `…-SQL-2-EXEC.md` |
| **12W-5e** | API POST/GET: merge `contract_fields_json`, whitelist `packageToLeadFields()`, ampliar `SELECT_WITH_SNAPSHOT` |
| **12W-5f** | UI editable bloque Vehículo + envío al POST |
| **12W-5-QA** | POST demo controlado en Vercel; verificar persistencia JSONB |
| **Futuro (opcional)** | Índice `(contract_fields_json->>'marca')` WHERE `? 'marca'`; CHECK object; `_meta` en JSON |

---

## 13. NO-GO explícitos

| Prohibido en SQL-1 / sin aprobación SQL-2 |
|-------------------------------------------|
| Ejecutar SQL (Cursor o Daniel en esta fase de diseño) |
| Modificar código (`route.ts`, `nuevo/page.tsx`, adapters) |
| Modificar API o desplegar **5e** antes de SQL-2 |
| Crear archivos en `migrations/` o `supabase/migrations/` ejecutables |
| Ejecutar rollback en producción sin revisión |
| `UPDATE` / `INSERT` de datos Pickup en `contract_fields_json` en SQL-2 |
| Tocar integraciones **Zeta/Kore** |
| Agregar índices GIN o por marca sin justificación de reportes |
| Reutilizar `objetivos` / `audiencia` / otros JSONB para campos de contrato |
| `DROP` / `ALTER` de columnas legacy |

---

## 14. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| API modificada | **No** |
| SQL ejecutado por Cursor | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Migraciones creadas | **No** |
| Solo documentación | **Sí** (este archivo) |
| Commit | **No** (salvo pedido explícito) |

---

## Anexo A — DDL recomendado (resumen operativo)

**Script mínimo para SQL-2:**

```sql
BEGIN;
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.leads.contract_fields_json IS
  'Valores de campos declarados en lead_fields del paquete CRM activo. Claves validadas por contrato/adapters; no reemplaza columnas core del lead.';
COMMIT;
```

**Sin:** índice, CHECK, seed de datos, cambios en JSONB legacy.

**Con:** PRECHECK §4 → DDL §5 → POSTCHECK §6 → EXEC §11.

---

*Documento de diseño 12W-5d-SQL-1. Ejecución manual pendiente de aprobación Daniel en 12W-5d-SQL-2.*
