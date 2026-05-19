# Auditoría Schema Pipeline leads_pipelines 12W-4c-SCHEMA-1 — Constructor CRM Summer87

**Versión:** 12W-4c-SCHEMA-1 — auditoría documental repo-only  
**Proyecto:** summer87-leads-v3  
**Base:** plan 12W-4c (`b40bfd9`), adapter 12W-4 (`886c172`), wiring 12W-4b (`b136337`, validación DOM `7a321ef`)  
**Estado:** auditoría completada en repo. **Sin** consulta a Supabase en vivo.

---

## 1. Resumen ejecutivo

- El CRM operativo usa **`public.leads_pipelines`** (catálogo) y **`public.leads.pipeline`** (texto = `nombre` de etapa). El contrato Pickup usa **`key` / `label` / `order` / `terminal`** en `crm_package_config.pipeline.stages[]` — sin columna puente en BD hoy.
- En el repo **no hay evidencia** de `stage_key`, `client_slug`, `activo` ni `contract_id` en `leads_pipelines`. Existe otra tabla **`lead_pipelines`** (inglés, `name`) que **no** consume la app de leads; riesgo de confusión al escribir SQL manual.
- Toda la UI crítica (Nuevo Lead, Kanban, ficha, lista, config pipelines, bulk) depende de **`GET /api/admin/leads/pipelines`** y persiste **`pipeline` como string**; Kanban agrupa por **igualdad normalizada de `nombre`**, no por UUID ni `key`.
- **`leadStatusPolicy`** cierra/gana leads por **nombre normalizado** (`ganado`, `perdido`, …), no por `tipo` de catálogo ni por `terminal` del contrato — materializar `Venta ganada` sin ajustar política **no** equivale a “ganado” operativo.
- Antes de seed o DDL: Daniel debe ejecutar **inspección read-only en Supabase** (checklist §8); los resultados se pegarán en un doc de ejecución **12W-4c-SQL-1**. Esta fase **no** ejecuta SQL.

---

## 2. Alcance

| Incluido | Excluido |
|----------|----------|
| Lectura de `estructura_base.sql`, `migrations/*`, `supabase/migrations/*`, `supabase/scripts/*` | Ejecutar SQL |
| Lectura de APIs y pantallas listadas en el brief | Conectar a Supabase |
| Grep de dependencias en `app/`, `lib/`, `migrations/`, `supabase/`, `docs/` | Crear migraciones |
| Diseño de checklist de inspección manual posterior | Modificar código, APIs, middleware, `.env` |
| Alineación con `plan-materializacion-pipeline-contrato-leads-pipelines-12W-4c.md` | Build, Vercel, commit |

**Directorios:** `sql/` en raíz del repo **no existe** como carpeta de migraciones (solo `docs/sql/` con scripts puntuales). Migraciones relevantes: `migrations/`, `supabase/migrations/`, `supabase/scripts/`.

---

## 3. Evidencia encontrada en repo

| Archivo | Hallazgo | Riesgo / implicancia |
|---------|----------|----------------------|
| `estructura_base.sql` | `leads_pipelines`: `id`, `created_at`, `updated_at`, `nombre`, `posicion`, `color`, `tipo`, `orden`; CHECK `tipo` ∈ normal/ganado/perdido; índice único `leads_pipelines_nombre_uq` en `lower(nombre)`; índice `leads.pipeline` | Unicidad por **nombre** (case-insensitive). Seed debe respetar colisiones |
| `estructura_base.sql` | Tabla paralela `lead_pipelines` (`name`, `sort_order`, `is_active`) — distinta de `leads_pipelines` | **Confusión alta** si el SQL apunta a la tabla equivocada |
| `migrations/020_update_leads_pipelines_add_tipo.sql` | Añade `tipo`; UNIQUE `nombre`; inserta Nuevo/Ganado/Perdido; CHECK tipo | Puede coexistir con índice `lower(nombre)` del dump — **verificar en Supabase** cuál constraint está activo |
| `migrations/021_leads_pipelines_add_orden.sql` | Columna `orden` + backfill por `created_at` + índice | Orden Kanban/API usa `orden` |
| `migrations/070_create_crm_setup_config.sql` | Comentario: `proceso_pipeline` **no** sincroniza con `leads_pipelines` | Wizard Constructor ≠ catálogo operativo |
| `supabase/scripts/bootstrap_new_instance_consolidated.sql` | Seed 6 filas ejemplo (`Nuevo`, `En contacto`, …, `Ganado`, `Perdido`) en `leads_pipelines` | Instancias nuevas ≠ contrato Pickup 9 etapas |
| `supabase/migrations/20260428100000_casalimpia_fase1.sql` | INSERT en `leads_pipelines` (proyecto Casalimpia) | Evidencia de seeds ad hoc por cliente |
| `app/api/admin/leads/pipelines/route.ts` | GET auto-insert Nuevo/Ganado/Perdido; SELECT `id, nombre, posicion, tipo, color, orden`; POST valida un solo `ganado` y un solo `perdido` | Cualquier seed debe **reconciliar** terminales antes de insertar segundos ganado/perdido |
| `app/api/admin/leads/pipelines/[id]/route.ts` | GET/PATCH/DELETE por UUID sobre misma tabla/columnas | Materialización no requiere cambio API para listar |
| `app/api/admin/leads/route.ts` | POST default `pipeline = "Nuevo"`; GET filtra `.eq("pipeline", param)` exacto | Filtros sensibles a mayúsculas/espacios si no normalizados |
| `app/api/admin/leads/[id]/route.ts` | PATCH `pipeline`; bloqueo si `isLeadClosed`; `isLeadWon` → creación socio | Cambiar nombres de cierre rompe reglas y side-effects |
| `app/api/admin/leads/bulk/route.ts` | Bulk update `pipeline` string; rama especial si `isLeadWon(pipeline)` | Mismo riesgo en migración masiva |
| `app/api/admin/leads/import/route.ts` | Import default `pipeline` = `"Nuevo"` si vacío | Valores importados deben existir en catálogo o Kanban falla matching |
| `app/admin/leads/nuevo/page.tsx` | `pipelineOptions` ← `pipelinesRemote[].nombre`; POST `pipeline: norm(pipeline)`; fallback 6 nombres; 12W-4b DOM snapshot **no** alimenta select | Materializar solo catálogo cambia opciones cuando API devuelve filas nuevas |
| `app/admin/leads/kanban/page.tsx` | Columnas desde API; cards `norm(lead.pipeline) === norm(col.nombre)`; PATCH `{ pipeline: nombre }` | **Huérfanos** si `leads.pipeline` no coincide con ningún `nombre` |
| `app/admin/leads/[id]/page.tsx` | Selector etapas vía API; `isLeadClosed` en UI; guarda `draft.pipeline` como string | Igual que Kanban |
| `app/admin/leads/page.tsx` | Lista + bulk cambio pipeline + fetch pipelines | Operaciones masivas |
| `app/admin/configuracion/components/PipelinesTab.tsx` | CRUD UI sobre `/api/admin/leads/pipelines` | Admin puede crear filas que contradigan contrato |
| `app/admin/dashboard/page.tsx` | Métricas con `isLeadActive(l.pipeline)` y conteos por `pipeline` | Renombrar etapas altera dashboards |
| `app/admin/reportes/comercial/leads/page.tsx` | Filtro/agrupación por `leads.pipeline` (string) | Históricos partidos si se migran nombres |
| `lib/leads/leadStatusPolicy.ts` | Cierre por set fijo de nombres normalizados; `isLeadWon` solo si norm === `"ganado"` | **Venta ganada** ≠ **ganado** hasta extender política |
| `lib/crm/priorityEngine.ts`, `leadHealth.ts`, `metrics.ts`, `dashboardCommercialFlow.ts` | Importan `isLeadClosed` / `isLeadActive` | Efecto dominó al cambiar nombres |
| `lib/crmPackage/configs/pickup4x4.config.ts` | 9 `pipeline.stages` con keys y terminales won/lost | Fuente declarativa a materializar |
| `lib/crmPackage/adapters/pipelineStages.ts` | Normaliza contrato; sin I/O | Entrada lógica del seed futuro |
| `lib/leads/leadFlow.ts` | Flujo Lead→Datos→… (usado en lista/ficha) | **No** es `pipeline.stages` — no mezclar en SQL |
| `docs/constructor-crm/plan-materializacion-pipeline-contrato-leads-pipelines-12W-4c.md` | Recomienda D+B: `stage_key` + upsert + migración `leads.pipeline` | Este SCHEMA-1 valida premisas antes de SQL-1 |

**Grep (referencia):** decenas de archivos en `app/`, `lib/`, `docs/constructor-crm/` referencian `leads_pipelines`, `/api/admin/leads/pipelines`, `leadStatusPolicy` o `pipeline:` — coherente con superficie amplia.

---

## 4. Schema esperado de `leads_pipelines`

### 4.1 Columnas con evidencia en repo

| Columna | Tipo (evidencia) | Nullable / default | Notas |
|---------|------------------|--------------------|-------|
| `id` | UUID PK | NOT NULL, `gen_random_uuid()` | No referenciado por FK desde `leads` |
| `created_at` | timestamptz | NOT NULL, default now | — |
| `updated_at` | timestamptz | NOT NULL, default now | Trigger `trg_leads_pipelines_updated_at` (estructura_base) |
| `nombre` | text | NOT NULL | Valor usado en UI y en `leads.pipeline` |
| `posicion` | integer | NOT NULL, default 0 | Reorder PATCH escribe índice |
| `color` | text | NULL | Opcional UI |
| `tipo` | text | NOT NULL, default `'normal'` | CHECK: `normal`, `ganado`, `perdido` |
| `orden` | integer | NOT NULL, default 9999 (estructura_base); migración 021 nullable al añadir | GET ordena por `orden`, luego `created_at` |

### 4.2 Constraints / índices evidenciados

| Objeto | Evidencia | Nota |
|--------|-----------|------|
| PK `leads_pipelines_pkey` | `estructura_base.sql` | — |
| UNIQUE `lower(nombre)` → `leads_pipelines_nombre_uq` | `estructura_base.sql` | Impide dos etiquetas iguales salvo diferencia de case *(ya normalizado a lower)* |
| UNIQUE `nombre` → `leads_pipelines_nombre_key` | `migrations/020_*` | **Pendiente confirmar en Supabase** si coexisten ambos o solo uno |
| CHECK `leads_pipelines_tipo_chk` | `estructura_base.sql` | — |
| INDEX `leads_pipelines_orden_idx`, `leads_pipelines_posicion_idx` | `estructura_base.sql` | — |

### 4.3 Columnas no evidenciadas en repo (marcar antes de asumir en DDL)

| Columna | Estado en repo |
|---------|----------------|
| `stage_key` | **No evidenciado** — propuesto en plan 12W-4c |
| `client_slug` / `tenant_id` / `company_id` | **No evidenciado** en `leads_pipelines` ni en `leads` (grep `estructura_base.sql` sin match) |
| `activo` / `is_active` | **No evidenciado** en `leads_pipelines` *(sí en tabla distinta `lead_pipelines`)* |
| `contract_id` | **No evidenciado** |
| FK desde `leads` → `leads_pipelines.id` | **No evidenciado** — relación lógica por string |

### 4.4 Tabla `leads.pipeline` (columna en `public.leads`)

| Columna | Evidencia | Uso |
|---------|-----------|-----|
| `pipeline` | `estructura_base.sql` línea ~687, APIs SELECT/INSERT | `text`, sin CHECK hacia catálogo; índice `leads_pipeline_idx` |

**Inferido:** no hay FK ni trigger en repo que valide que `leads.pipeline` exista en `leads_pipelines.nombre`.

### 4.5 `closed_at` / `closed_result` en leads

`leadStatusPolicy` acepta `closed_at` / `closed_result` en el tipo del lead, pero **no** aparecen en los SELECT principales de `app/api/admin/leads/route.ts` ni en el fragmento `leads` de `estructura_base.sql` inspeccionado.

| Campo | Estado |
|-------|--------|
| `leads.closed_at` | **No evidenciado** en `estructura_base.sql` (sí existe en `helpdesk_tickets`) — **pendiente Supabase** |
| `leads.closed_result` | **No evidenciado** en repo para tabla `leads` |

---

## 5. Uso actual de `leads.pipeline`

### 5.1 Creación

| Punto | Comportamiento evidenciado |
|-------|---------------------------|
| `POST /api/admin/leads` | `pipeline = cleanStr(body.pipeline) ?? "Nuevo"` |
| Nuevo Lead UI | Envía `pipeline: norm(pipeline)` donde `pipeline` state = **string seleccionado del select** (= `nombre`) |
| Import | `cleanStr(r?.pipeline) ?? "Nuevo"` |

### 5.2 Actualización

| Punto | Comportamiento |
|-------|----------------|
| `PATCH /api/admin/leads/[id]` | Acepta `body.pipeline` string |
| Kanban drag | `PATCH` con `pipeline: targetColumn.nombre` |
| Bulk | `PATCH` masivo con mismo string |
| Ficha | `draft.pipeline` → save con norm |

### 5.3 Comparación / matching

| Consumidor | Mecanismo |
|------------|-----------|
| Kanban | `norm(lead.pipeline) === norm(column.nombre)` *(función `norm` local en página)* |
| GET list filter | `.eq("pipeline", pipelineParam.trim())` — **exacto**, sin normalizar en API |
| `leadStatusPolicy` | `normalizePipelineForPolicy` (lower + NFD sin acentos) |

### 5.4 ¿String `nombre` o `key`?

**Hoy: solo `nombre` (string).** No hay evidencia de persistir `stage_key` en `leads`.

### 5.5 Riesgos de cambiar a `key`

| Riesgo | Detalle |
|--------|---------|
| Rotura Kanban/ficha/lista | Comparan por `nombre`, no por `key` |
| Rotura reportes/filtros | Valores históricos en DB son nombres |
| Rotura `leadStatusPolicy` | Set hardcodeado de nombres, no keys |
| Rotura integraciones | `isLeadWon` → side-effect crear socio solo si norm === `"ganado"` |
| API sin cambio | POST/PATCH seguirían aceptando string hasta fase API dedicada |

**Conclusión:** materialización fase 1 debe mantener **`leads.pipeline` = `leads_pipelines.nombre`** (con `nombre` = `label` del contrato salvo mapeo explícito), no saltar a `key` en columna `leads` sin fase API.

---

## 6. Dependencias por superficie

| Superficie | Archivo(s) | Cómo usa pipeline | Riesgo si se materializa mal |
|------------|------------|-------------------|------------------------------|
| **Nuevo Lead** | `app/admin/leads/nuevo/page.tsx` | GET pipelines → `nombre` en select; POST string; snapshot 12W-4b solo DOM | Select duplicado o valores que no guardan; fallback 6 nombres si API vacía |
| **Kanban** | `app/admin/leads/kanban/page.tsx` | Columnas = filas API; cards por match `nombre`; PATCH string | Columnas vacías; cards huérfanos; drag a etapa inexistente |
| **Ficha lead** | `app/admin/leads/[id]/page.tsx` | Selector API; `isLeadClosed`; PATCH string | Bloqueos de edición incorrectos; socio auto si nombre parece ganado |
| **Lista leads** | `app/admin/leads/page.tsx` | Muestra `pipeline`; bulk change | Bulk masivo a etapa equivocada |
| **Config pipelines** | `PipelinesTab.tsx` | CRUD API | Usuario crea etapas fuera de contrato post-seed |
| **Dashboard** | `app/admin/dashboard/page.tsx` | `isLeadActive`, conteos por `pipeline` | Métricas activas/cerradas incorrectas |
| **Reportes comercial** | `app/admin/reportes/comercial/leads/page.tsx` | Filtro `l.pipeline` | Series históricas inconsistentes |
| **API pipelines** | `pipelines/route.ts`, `[id]/route.ts` | Fuente catálogo | Auto-seed Nuevo/Ganado/Perdido puede **recrear** legacy tras limpieza |
| **API leads** | `route.ts`, `[id]/route.ts`, `bulk`, `import` | Lee/escribe `leads.pipeline` | Defaults y filtros desalineados |
| **leadStatusPolicy** | `lib/leads/leadStatusPolicy.ts` | Cierra por nombre normalizado | **Venta ganada** no cierra como **ganado** sin cambio de política |
| **CRM helpers** | `priorityEngine`, `leadHealth`, `metrics` | Excluyen cerrados vía policy | Subcontaje/sobrecontaje |
| **leadFlow** | `lib/leads/leadFlow.ts` | Pasos de proceso en UI lista/ficha | Confundir con materialización pipeline |
| **Contrato / adapter** | `pickup4x4.config.ts`, `pipelineStages.ts` | 9 etapas declarativas; sin escritura DB | Ninguno directo; referencia del seed |
| **12W-4b contexto** | `LeadsClientCrmContext`, `layout.tsx` | Snapshot cliente | Desacoplado del select hasta fase UI |

---

## 7. Brechas confirmadas

1. **Contrato** usa `key` + `label`; **operación** usa `nombre` string sin `stage_key` en catálogo.
2. **`leads.pipeline` no referencia UUID** del catálogo — solo texto libre con índice btree.
3. **No hay scope multi-cliente** evidenciado en `leads_pipelines` (catálogo global por instancia Supabase).
4. **Terminales:** contrato `won`/`lost` → columna `tipo` `ganado`/`perdido`; API permite **máximo una fila** por tipo.
5. **`leadStatusPolicy`** no lee `tipo`; usa nombres (`ganado`, `perdido`, `cerrado`, `no interesado`) — **desalineado** con labels Pickup `Venta ganada` / `Venta perdida`.
6. **Select Pipeline Nuevo Lead** sigue **API legacy**; snapshot contrato validado en DOM (12W-4b) no sustituye opciones.
7. **Dos tablas** `lead_pipelines` vs `leads_pipelines` en schema dump — solo la segunda es operativa en app.
8. **`crm_setup_config.proceso_pipeline`** no sincroniza con `leads_pipelines` (comentario migración 070).
9. **GET pipelines** puede insertar Nuevo/Ganado/Perdido en cada request si faltan — efecto en entornos “limpios”.
10. **Plan 12W-4c** ya advierte: seed sin inventario → huérfanos y duplicación de terminales.

---

## 8. Queries SQL de solo lectura para fase posterior

> **Estas consultas NO fueron ejecutadas en esta fase.**  
> Deben entregarse como SQL revisable en **12W-4c-SQL-1** y aplicarse **manualmente por Daniel** en Supabase (con backup según protocolo 11Q).  
> Salida esperada: pegar resultados en un documento de ejecución (p. ej. `ejecucion-inspeccion-pipeline-12W-4c-SQL-1.md`).

### 8.1 Schema y constraints

```sql
-- Q1: Columnas reales de leads_pipelines (confirmar stage_key, activo, etc.)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads_pipelines'
ORDER BY ordinal_position;

-- Q2: Constraints e índices en leads_pipelines
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.leads_pipelines'::regclass;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'leads_pipelines';

-- Q3: Confirmar si existe tabla lead_pipelines y si tiene datos
SELECT COUNT(*) AS filas_lead_pipelines FROM public.lead_pipelines;
SELECT COUNT(*) AS filas_leads_pipelines FROM public.leads_pipelines;
```

### 8.2 Catálogo actual

```sql
-- Q4: Inventario completo ordenado
SELECT id, nombre, posicion, orden, tipo, color, created_at
FROM public.leads_pipelines
ORDER BY orden NULLS LAST, posicion, created_at;

-- Q5: Conteo por tipo (detectar duplicados ganado/perdido)
SELECT tipo, COUNT(*) AS n, array_agg(nombre ORDER BY nombre) AS nombres
FROM public.leads_pipelines
GROUP BY tipo
ORDER BY tipo;

-- Q6: Posibles duplicados de nombre (case-insensitive)
SELECT lower(trim(nombre)) AS nombre_norm, COUNT(*) AS n, array_agg(nombre) AS variantes
FROM public.leads_pipelines
GROUP BY lower(trim(nombre))
HAVING COUNT(*) > 1;
```

### 8.3 Datos en leads

```sql
-- Q7: Valores distintos en leads.pipeline (volumen y muestra)
SELECT COUNT(*) AS total_leads FROM public.leads;
SELECT pipeline, COUNT(*) AS n
FROM public.leads
GROUP BY pipeline
ORDER BY n DESC NULLS LAST;

-- Q8: Leads cuyo pipeline NO matchea ningún nombre del catálogo (huérfanos)
SELECT l.id, l.pipeline, l.created_at
FROM public.leads l
WHERE l.pipeline IS NOT NULL
  AND trim(l.pipeline) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.leads_pipelines p
    WHERE lower(trim(p.nombre)) = lower(trim(l.pipeline))
  )
ORDER BY l.created_at DESC
LIMIT 200;

-- Q9: Filas de catálogo sin ningún lead (candidatas a deprecar)
SELECT p.id, p.nombre, p.tipo, p.orden
FROM public.leads_pipelines p
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads l
  WHERE lower(trim(l.pipeline)) = lower(trim(p.nombre))
);
```

### 8.4 Alineación con contrato Pickup (manual)

Comparar salida de Q4/Q7 con las 9 keys/labels del contrato (`pickup4x4.config.ts` / adapter). No hay query automática en repo sin tabla de mapeo.

### 8.5 Tenant / company (verificación negativa)

```sql
-- Q10: Buscar columnas tenant en leads y leads_pipelines (esperado: 0 filas si no existen)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'leads_pipelines')
  AND column_name ILIKE ANY (ARRAY['%client%', '%tenant%', '%company%', '%slug%']);
```

### 8.6 Política de cierre (sanity check datos)

```sql
-- Q11: Leads en nombres que parecen cierre pero no están en set policy exacto
-- (revisión manual; policy en TS usa: ganado, perdido, cerrado, no interesado)
SELECT pipeline, COUNT(*) AS n
FROM public.leads
WHERE lower(trim(pipeline)) IN ('ganado','perdido','cerrado','no interesado',
  'venta ganada','venta perdida','ganada','perdida')
GROUP BY pipeline
ORDER BY n DESC;
```

---

## 9. Riesgos antes de escribir SQL

| Riesgo | Descripción |
|--------|-------------|
| Seed sin inventario | Insertar 9 etapas sin Q4/Q7 → catálogo inflado y leads huérfanos |
| Duplicar `ganado`/`perdido` | Viola regla API POST; estado inconsistente |
| Romper Kanban | `leads.pipeline` distinto de `leads_pipelines.nombre` → cards sin columna |
| Leads huérfanos | Valores históricos (“Nuevo lead”, “Visita”, …) sin columna |
| Confundir `lead_pipelines` con `leads_pipelines` | SQL en tabla equivocada |
| Confundir `leadFlow` con pipeline comercial | Cambios de proceso ≠ etapas CRM |
| Inventar `stage_key` sin Q1 | DDL falla o duplica índices |
| Renombrar `nombre` sin UPDATE leads | Rompe matching y reportes |
| Asumir `isLeadWon` con “Venta ganada” | No crea socio / no marca cerrado hasta cambio TS |
| GET auto-seed | Tras DELETE, API recrea Nuevo/Ganado/Perdido |
| Sin backup / rollback | Irreversible en producción demo |
| Mezclar `proceso_pipeline` JSON con seed | Dos fuentes de verdad Constructor |

---

## 10. Recomendación para 12W-4c-SQL-1

Orden propuesto para la **siguiente fase documental/ejecutiva** (Daniel manual):

| Paso | Acción | ¿Permitido en SQL-1? |
|------|--------|----------------------|
| 1 | Backup Supabase (protocolo 11Q) | Sí (operación manual) |
| 2 | Ejecutar **solo** Q1–Q11 (§8); guardar salida en doc de ejecución | **Sí — solo read-only** |
| 3 | Tabla de mapeo legacy → contrato firmada por producto | Documento, no SQL |
| 4 | Revisar duplicados `tipo=ganado/perdido` (Q5) | Decisión antes de DDL |
| 5 | **DDL `stage_key`** | Solo si Q1 confirma ausencia de columna y producto aprueba plan 12W-4c |
| 6 | Seed / UPSERT 9 etapas | **No en SQL-1** — fase **12W-4c-SQL-2** |
| 7 | `UPDATE leads.pipeline` | **No en SQL-1** — fase **12W-4c-SQL-3** |
| 8 | Verificación post-cambio (repetir Q8, Q9) | Después de SQL-2/3 |

**Reglas SQL-1:** inspección read-only únicamente; sin `INSERT`/`UPDATE`/`DELETE`/`ALTER` de materialización; sin tocar código ni Vercel.

---

## 11. Dictamen final

Antes de materializar las 9 etapas Pickup en `leads_pipelines`, la prioridad **no** es insertar filas sino **confirmar el modelo real de datos y dependencias** en el entorno Supabase de Daniel.

**12W-4c-SCHEMA-1** deja identificados:

- el schema **evidenciado** en repo (y lo **no** evidenciado),
- las superficies que romperían con un seed ingenuo,
- y el checklist Q1–Q11 para cerrar la brecha declaración (contrato) vs operación (nombre string).

Sin salida de Q4/Q5/Q7/Q8, **no** se debe aprobar DDL ni seed. El wiring 12W-4b permanece válido independientemente de la materialización.

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado | **No** |
| Supabase consultado | **No** |
| Datos modificados | **No** |
| APIs modificadas | **No** |
| Middleware modificado | **No** |
| Vercel | **No** |
| Build ejecutado | **No** |
| Commit | **No** |
| Solo documentación | **Sí** — este archivo |

**Próximo entregable sugerido:** `12W-4c-SQL-1` — script/markdown de inspección read-only + plantilla para pegar resultados de Q1–Q11.
