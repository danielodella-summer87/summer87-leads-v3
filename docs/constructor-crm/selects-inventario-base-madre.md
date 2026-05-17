# SELECTs Seguros de Inventario — Base Madre Constructor CRM

**Versión:** Inventario-L1-queries (documental)  
**Relacionado con:** `docs/constructor-crm/checklist-limpieza-base-madre.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md`, `estructura_base.sql`

**Estado:** catálogo de consultas **solo lectura** para ejecución manual en Supabase. **No sustituye** el documento de resultados `inventario-datos-base-madre-L1.md` (fase posterior).

---

## 2. Resumen ejecutivo

Este documento reúne consultas **`SELECT`** para inventariar el estado actual de datos y evidencia en la base madre **antes** de cualquier limpieza o duplicación controlada hacia un CRM cliente.

Las consultas están alineadas al esquema definido en `estructura_base.sql` y a las migraciones del Instalador (`installer_package_*`, `crm_setup_config`). Algunas tablas pueden **no existir** en un entorno concreto (migración no aplicada); en ese caso el bloque fallará con error claro — anotar y continuar.

**No se ejecutan** en esta fase: solo se documentan para copiar al SQL Editor de Supabase, bloque por bloque.

---

## 3. Reglas de seguridad

1. Ejecutar **solo** en el **SQL Editor** de Supabase (o cliente read-only equivalente con credenciales controladas).
2. **Verificar el proyecto** (nombre, ref, organización) antes de la primera consulta.
3. **Preferir staging o snapshot** de lectura si existe; evitar production salvo inventario acordado y en horario controlado.
4. **Prohibido** en esta fase y en el mismo editor sin revisión: `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`.
5. No editar filas desde la UI de resultados como si fuera limpieza.
6. **Copiar resultados** a un archivo local o al futuro `inventario-datos-base-madre-L1.md` (sin subir PII a repos públicos).
7. Cualquier **limpieza posterior** requiere propuesta escrita, backup y aprobación explícita (ver checklist de limpieza).

---

## 4. Checklist previo

Antes de ejecutar cualquier bloque:

- [ ] Confirmé el **proyecto Supabase correcto** (no otro cliente ni otro entorno).
- [ ] Sé si el entorno es **local / staging / production**.
- [ ] El objetivo es **solo inventario**, no limpieza.
- [ ] Todas las consultas de este documento son **`SELECT`** (o CTEs que terminan en `SELECT`).
- [ ] No usaré **“Run all”** si mezcla dudas o scripts ajenos.
- [ ] Ejecutaré **por bloques**, anotando fecha, entorno y observaciones.
- [ ] Tengo autorización del responsable (ej. Daniel) si el entorno es production.

---

## 5. SELECTs de evidencia del Instalador

> Si la tabla no existe: anotar *“migración pendiente”* y seguir. Migraciones locales: `migrations/20260513000000_*`, `20260512140000_*`, `20260515100000_*`.

### 5.1 Contar borradores de paquete

```sql
-- Total de filas en installer_package_drafts
SELECT COUNT(*) AS total_drafts
FROM public.installer_package_drafts;
```

### 5.2 Agrupar drafts por estado y confirmación humana

```sql
SELECT
  status,
  human_confirmation_status,
  COUNT(*) AS cantidad
FROM public.installer_package_drafts
GROUP BY status, human_confirmation_status
ORDER BY cantidad DESC, status, human_confirmation_status;
```

### 5.3 Contar snapshots de simulación

```sql
SELECT COUNT(*) AS total_snapshots
FROM public.installer_package_simulation_snapshots;
```

### 5.4 Contar decisiones de reunión

```sql
SELECT COUNT(*) AS total_meeting_decisions
FROM public.installer_package_meeting_decisions;
```

### 5.5 Últimos drafts (resumen, sin package_payload completo)

```sql
SELECT
  id,
  status,
  human_confirmation_status,
  package_version,
  target_client_id,
  constructor_id,
  generated_at,
  created_at,
  updated_at,
  approved_at,
  rejected_at,
  LEFT(rejection_reason, 120) AS rejection_reason_preview
FROM public.installer_package_drafts
ORDER BY COALESCE(generated_at, created_at) DESC
LIMIT 30;
```

### 5.6 Drafts relacionados con Pickup / preset pickup_4x4

```sql
SELECT
  id,
  status,
  human_confirmation_status,
  generated_at,
  package_payload->'installation_manifest'->>'preset' AS preset,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name,
  package_payload->'client_identity'->>'clientName' AS client_name,
  package_payload->'client_identity'->>'businessType' AS business_type
FROM public.installer_package_drafts
WHERE package_payload::text ILIKE '%pickup%'
   OR package_payload->'installation_manifest'->>'preset' = 'pickup_4x4'
ORDER BY generated_at DESC NULLS LAST;
```

### 5.7 Snapshots por draft

```sql
SELECT
  d.id AS draft_id,
  d.status AS draft_status,
  COUNT(s.id) AS snapshot_count,
  MAX(s.created_at) AS last_snapshot_at
FROM public.installer_package_drafts d
LEFT JOIN public.installer_package_simulation_snapshots s
  ON s.draft_id = d.id
GROUP BY d.id, d.status
ORDER BY snapshot_count DESC, last_snapshot_at DESC NULLS LAST;
```

### 5.8 Últimos snapshots (resumen)

```sql
SELECT
  s.id,
  s.draft_id,
  s.snapshot_type,
  s.simulation_status,
  s.readiness_score,
  s.final_go_no_go,
  s.risk_level,
  s.can_proceed_to_pilot_preparation,
  s.created_at
FROM public.installer_package_simulation_snapshots s
ORDER BY s.created_at DESC
LIMIT 30;
```

### 5.9 Últimas decisiones de reunión

```sql
SELECT
  m.id,
  m.draft_id,
  m.decision,
  m.decision_label,
  LEFT(m.decision_reason, 120) AS decision_reason_preview,
  LEFT(m.meeting_notes, 200) AS meeting_notes_preview,
  m.decided_by,
  m.created_at
FROM public.installer_package_meeting_decisions m
ORDER BY m.created_at DESC
LIMIT 30;
```

### 5.10 Detectar motivos / notas sospechosas (test, asdf, prueba)

```sql
-- Rejection en drafts
SELECT id, status, rejection_reason, generated_at
FROM public.installer_package_drafts
WHERE rejection_reason IS NOT NULL
  AND (
    rejection_reason ILIKE '%asdf%'
    OR rejection_reason ILIKE '%test%'
    OR rejection_reason ILIKE '%prueba%'
    OR rejection_reason ILIKE '%demo%'
  )
ORDER BY generated_at DESC;

-- Decisiones de reunión
SELECT id, draft_id, decision, decision_reason, meeting_notes, created_at
FROM public.installer_package_meeting_decisions
WHERE (
    COALESCE(decision_reason, '') ILIKE '%asdf%'
    OR COALESCE(decision_reason, '') ILIKE '%test%'
    OR COALESCE(decision_reason, '') ILIKE '%prueba%'
    OR COALESCE(meeting_notes, '') ILIKE '%asdf%'
    OR COALESCE(meeting_notes, '') ILIKE '%test%'
    OR COALESCE(meeting_notes, '') ILIKE '%prueba%'
  )
ORDER BY created_at DESC;
```

### 5.11 Verificar existencia de tablas del Instalador (meta-inventario)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'installer_package_drafts',
    'installer_package_simulation_snapshots',
    'installer_package_meeting_decisions',
    'crm_setup_config'
  )
ORDER BY table_name;
```

---

## 6. SELECTs de empresas / leads

### 6.1 Contar empresas

```sql
SELECT COUNT(*) AS total_empresas
FROM public.empresas;
```

### 6.2 Últimas empresas (sin columnas extensas)

```sql
SELECT
  id,
  nombre,
  rubro_id,
  estado,
  tipo,
  import_batch_id,
  created_at,
  updated_at
FROM public.empresas
ORDER BY created_at DESC
LIMIT 50;
```

### 6.3 Contar leads

```sql
SELECT COUNT(*) AS total_leads
FROM public.leads;
```

### 6.4 Últimos leads (resumen)

```sql
SELECT
  id,
  nombre,
  empresa_id,
  estado,
  pipeline,
  origen,
  comercial_id,
  created_at,
  updated_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 50;
```

### 6.5 Detectar nombres demo / test / prueba (empresas)

```sql
SELECT id, nombre, email, created_at
FROM public.empresas
WHERE nombre ILIKE '%demo%'
   OR nombre ILIKE '%test%'
   OR nombre ILIKE '%prueba%'
   OR nombre ILIKE '%asdf%'
   OR nombre ILIKE '%ficticio%'
   OR COALESCE(email, '') ILIKE '%@test.%'
   OR COALESCE(email, '') ILIKE '%example.com%'
ORDER BY created_at DESC;
```

### 6.6 Detectar nombres demo / test / prueba (leads)

```sql
SELECT id, nombre, email, contacto, origen, created_at
FROM public.leads
WHERE nombre ILIKE '%demo%'
   OR nombre ILIKE '%test%'
   OR nombre ILIKE '%prueba%'
   OR nombre ILIKE '%asdf%'
   OR COALESCE(email, '') ILIKE '%@test.%'
ORDER BY created_at DESC;
```

### 6.7 Empresas sin leads asociados (aproximación simple)

```sql
SELECT
  e.id,
  e.nombre,
  e.created_at,
  COUNT(l.id) AS lead_count
FROM public.empresas e
LEFT JOIN public.leads l ON l.empresa_id = e.id
GROUP BY e.id, e.nombre, e.created_at
HAVING COUNT(l.id) = 0
ORDER BY e.created_at DESC
LIMIT 100;
```

### 6.8 Contar socios (si aplica al inventario)

```sql
SELECT COUNT(*) AS total_socios
FROM public.socios;
```

---

## 7. SELECTs de rubros / pipelines / configuración

### 7.1 Listar rubros

```sql
SELECT id, nombre, activo, created_at
FROM public.rubros
ORDER BY nombre;
```

### 7.2 Rubros demo / test

```sql
SELECT id, nombre, activo, created_at
FROM public.rubros
WHERE nombre ILIKE '%demo%'
   OR nombre ILIKE '%test%'
   OR nombre ILIKE '%prueba%'
ORDER BY nombre;
```

### 7.3 Pipelines de leads (Kanban)

```sql
SELECT id, nombre, tipo, posicion, orden, color, created_at
FROM public.leads_pipelines
ORDER BY orden, posicion;
```

### 7.4 Pipelines alternativos (lead_pipelines)

```sql
SELECT id, name, sort_order, is_active, color, created_at
FROM public.lead_pipelines
ORDER BY sort_order, name;
```

### 7.5 Tabla config (clave-valor)

```sql
SELECT key, LEFT(value, 200) AS value_preview, updated_at
FROM public.config
ORDER BY key;
```

### 7.6 Constructor CRM — crm_setup_config (si existe)

```sql
SELECT
  id,
  version,
  status,
  current_step,
  readiness_score,
  completed_steps,
  array_length(completed_steps, 1) AS completed_steps_count,
  created_at,
  updated_at
FROM public.crm_setup_config
ORDER BY updated_at DESC;
```

### 7.7 Política iniciativas (config portal, si existe clave)

```sql
SELECT key, value, updated_at
FROM public.config
WHERE key ILIKE '%initiative%'
   OR key ILIKE '%iniciativa%'
ORDER BY key;
```

---

## 8. SELECTs de usuarios / app_users

> **No consultar** `app_credentials.password_hash` ni tokens completos de invitaciones.

### 8.1 Contar usuarios de aplicación

```sql
SELECT COUNT(*) AS total_app_users
FROM public.app_users;
```

### 8.2 Listar app_users (sin datos de credenciales)

```sql
SELECT
  u.id,
  u.email,
  u.nombre,
  u.is_active,
  u.invite_status,
  r.name AS role_name,
  u.created_at,
  u.updated_at
FROM public.app_users u
LEFT JOIN public.roles r ON r.id = u.role_id
ORDER BY u.created_at DESC;
```

### 8.3 Roles del sistema

```sql
SELECT id, name, description, created_at
FROM public.roles
ORDER BY name;
```

### 8.4 Invitaciones (sin exponer secretos; esta tabla no tiene token en esquema base)

```sql
SELECT
  id,
  email,
  role,
  created_at,
  used_at,
  invited_by,
  CASE WHEN used_at IS NULL THEN 'pendiente' ELSE 'usada' END AS invite_state
FROM public.app_user_invites
ORDER BY created_at DESC
LIMIT 50;
```

### 8.5 Comerciales vinculados

```sql
SELECT id, nombre, email, activo, app_user_id, created_at
FROM public.comerciales
ORDER BY created_at DESC;
```

### 8.6 Verificar que no se listan hashes (meta)

```sql
-- Solo confirma existencia de tabla; NO seleccionar password_hash
SELECT COUNT(*) AS credential_rows
FROM public.app_credentials;
```

---

## 9. SELECTs de imports / operaciones de carga

### 9.1 Contar batches de importación

```sql
SELECT COUNT(*) AS total_import_batches
FROM public.entity_import_batches;
```

### 9.2 Últimos batches

```sql
SELECT
  id,
  concepto,
  status,
  filename,
  total_rows,
  inserted_rows,
  error_rows,
  created_at,
  updated_at
FROM public.entity_import_batches
ORDER BY created_at DESC
LIMIT 30;
```

### 9.3 Filas por batch (conteo)

```sql
SELECT
  b.id AS batch_id,
  b.concepto,
  b.status,
  b.filename,
  COUNT(r.id) AS row_count
FROM public.entity_import_batches b
LEFT JOIN public.entity_import_rows r ON r.batch_id = b.id
GROUP BY b.id, b.concepto, b.status, b.filename
ORDER BY MAX(b.created_at) DESC;
```

### 9.4 Empresas ligadas a import (muestra)

```sql
SELECT
  e.id,
  e.nombre,
  e.import_batch_id,
  e.created_at
FROM public.empresas e
WHERE e.import_batch_id IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 50;
```

---

## 10. SELECTs opcionales — tablas legacy / proto / sectoriales

> **Pueden fallar** si la migración no está aplicada en este Supabase. Anotar error y continuar.

### 10.1 Inventario de tablas public (vista general)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 10.2 IA — categorías y prompts (migración 048+)

```sql
-- Opcional: falla si no existe
SELECT COUNT(*) AS ai_categories FROM public.ai_categories;
```

```sql
SELECT id, name, is_active, created_at
FROM public.ai_categories
WHERE name ILIKE '%demo%' OR name ILIKE '%test%'
ORDER BY name;
```

### 10.3 Servicios agencia (migración 064+)

```sql
SELECT COUNT(*) AS agency_services FROM public.agency_services;
```

```sql
SELECT id, name, category_id, created_at
FROM public.agency_services
WHERE name ILIKE '%demo%' OR name ILIKE '%SUMMER87%'
ORDER BY name
LIMIT 30;
```

### 10.4 Catálogo easy_services

```sql
SELECT COUNT(*) AS easy_services FROM public.easy_services;
```

```sql
SELECT id, codigo, nombre, billing_type, created_at
FROM public.easy_services
ORDER BY created_at DESC
LIMIT 30;
```

### 10.5 Helpdesk (tickets recientes)

```sql
SELECT COUNT(*) AS helpdesk_tickets FROM public.helpdesk_tickets;
```

```sql
SELECT id, title, status, priority, type, created_at
FROM public.helpdesk_tickets
ORDER BY created_at DESC
LIMIT 20;
```

### 10.6 Casa Limpia / cleaning (vertical legacy)

```sql
-- Opcional: solo si migración casalimpia aplicada
SELECT COUNT(*) AS cleaning_categories
FROM public.cleaning_service_categories;
```

### 10.7 RBAC legacy `usuarios` (migración 028)

```sql
SELECT COUNT(*) AS usuarios_legacy FROM public.usuarios;
```

### 10.8 Columnas iniciativa en empresas (si migración align aplicada)

```sql
SELECT
  COUNT(*) FILTER (WHERE initiative_kind IS NOT NULL) AS con_initiative_kind,
  COUNT(*) AS total
FROM public.empresas;
```

> Si `initiative_kind` no existe, omitir bloque y anotar migración `2026-align-empresas-schema` pendiente.

---

## 11. Cómo guardar resultados

1. Crear **`docs/constructor-crm/inventario-datos-base-madre-L1.md`** (fase siguiente) con:
   - Fecha y entorno (ref Supabase, staging/production).
   - Tabla resumen de conteos (drafts, snapshots, leads, empresas, app_users).
   - Lista de hallazgos (Pickup, demo, imports, vacío).
2. **No commitear** emails, RUT, teléfonos ni `package_payload` completos con datos personales.
3. Para documentación interna: **anonimizar** IDs y nombres (ej. `Pickup 4x4` → OK; personas reales → iniciales).
4. Export CSV desde Supabase solo a almacenamiento privado del equipo.
5. Los `package_payload` completos, si se archivan, van a carpeta privada fuera del repo git.

---

## 12. Interpretación inicial

| Observación | Interpretación probable |
|-------------|-------------------------|
| **0 filas** en `installer_package_*` | Tabla limpia, migración recién aplicada, o entorno equivocado. |
| **Muchas filas** en drafts/snapshots | Revisar cuáles son Pickup real vs. ensayos UI. |
| `preset = pickup_4x4` o texto Pickup en payload | **Caso semilla** — exportar a BCR antes de limpiar. |
| Rubro `Demo / Test` o nombres con demo/test | Candidato a limpieza **posterior** (tras backup). |
| Muchos `app_users` | Revisar cuáles son equipo Summer87 vs. prueba antes de duplicar. |
| `entity_import_batches` recientes | Imports pueden ser **temporales** — validar con responsable. |
| Empresas sin leads | Puede ser normal (iniciativas) o basura de import. |
| Tablas opcionales ausentes | Migraciones pendientes; no asumir esquema completo en clon. |
| Motivos `asdf` / `test` en drafts | **Basura segura** candidata — solo tras aprobación L3/L4. |
| Production con datos mezclados | **No duplicar** este Supabase al cliente; crear proyecto nuevo. |

---

## 13. Próxima fase

Después de ejecutar estos `SELECT` (manualmente, en entorno acordado):

1. Completar **`docs/constructor-crm/inventario-datos-base-madre-L1.md`** con resultados y clasificación (producto / demo / Pickup / pendiente / sensible).
2. Cruzar con **`checklist-limpieza-base-madre.md`** secciones 9–12 (clasificación A–E).
3. Decidir **Pickup 4x4** (semilla, clon, export BCR).
4. Solo entonces elaborar **propuesta de limpieza L3** (sin SQL destructivo en este documento).

---

## 14. Confirmación de alcance

Este documento:

- **No ejecuta SQL** por sí mismo.
- **No modifica ni borra datos**.
- **No crea endpoints ni scripts**.
- **No toca Supabase** (solo describe consultas para uso humano posterior).
- **No instala CRM**, tenants ni usuarios.
- **No escribe en Kore ni en Zeta**.

Únicamente cataloga consultas **`SELECT`** de inventario para la base madre del Constructor CRM.

---

*Última actualización: inventario-L1-queries — documentación inicial.*
