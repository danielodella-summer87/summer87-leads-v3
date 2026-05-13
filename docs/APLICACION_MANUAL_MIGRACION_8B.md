# Aplicación manual de migración 8B — installer_package_drafts

## 1. Contexto

Registro operativo: la migración **8B** fue **aplicada manualmente** en el proyecto **Supabase remoto** para crear la tabla **`public.installer_package_drafts`**. Este documento consolida el contexto y las validaciones realizadas tras esa ejecución; no sustituye el historial de auditoría del proveedor ni los logs del SQL Editor.

## 2. Proyecto Supabase

- **Project ref:** `hrhtowejorwhoqtexjxg`
- **Nombre visible del proyecto:** summer87-leads-v3
- **Organización visible:** Cámara Ciudad de la Costa
- **Entorno visible:** production
- **Rama visible:** main

## 3. Migración aplicada

- **Archivo local versionado:** `migrations/20260513000000_create_installer_package_drafts.sql`
- **Tabla creada:** `public.installer_package_drafts`
- **Resultado de ejecución en SQL Editor:** Success. No rows returned

## 4. Validaciones realizadas

Se validó lo siguiente (en el entorno remoto, tras aplicar el script):

- Tabla existente.
- RLS activo.
- Columnas y defaults.
- Constraints.
- Índices.
- Sin policies permisivas.
- Trigger `updated_at`.
- Inserción de prueba dentro de transacción.
- Rollback correcto.
- Tabla vacía después del rollback.

## 5. Resultado de validaciones

**Detalles:**

- `public.installer_package_drafts` **existe**.
- `rowsecurity` = **true**.
- Se observaron **22 columnas**.
- **Defaults esperados:**
  - `id`: `gen_random_uuid()`
  - `package_version`: `'8B-draft-v1'`
  - `status`: `'draft_generated'`
  - `package_payload`: `'{}'::jsonb`
  - `blocked_actions`: `'[]'::jsonb`
  - `warnings`: `'[]'::jsonb`
  - `requires_human_confirmation`: `true`
  - `human_confirmation_status`: `'pending'`
  - `generated_at` / `created_at` / `updated_at`: `now()`
- **Constraints validadas:**
  - primary key
  - status check
  - human_confirmation_status check
  - package_payload object check
  - blocked_actions array check
  - warnings array check
- **Índices validados:**
  - `constructor_id`
  - `target_client_id`
  - `status`
  - `requested_by`
  - `created_at`
  - `expires_at`
  - primary key
- **Policies:**
  - No rows returned en `pg_policies`.
  - Estado esperado: RLS habilitado sin policies permisivas.
- **Trigger:**
  - `installer_package_drafts_set_updated_at`
  - `BEFORE UPDATE`
  - `EXECUTE FUNCTION set_updated_at()`
- **Prueba de inserción:**
  - Insert dentro de `BEGIN` / `ROLLBACK` devolvió una fila.
  - Defaults devueltos correctamente.
  - Rollback ejecutado.
  - Count final de la tabla: **0**.

## 6. Alcance de seguridad

- La migración **no instala CRM**.
- **No** crea tenant.
- **No** crea usuarios.
- **No** escribe en Zeta.
- **No** inserta datos reales de negocio.
- **No** deja datos de prueba persistentes.
- **RLS** quedó **activo**.
- **No** existen policies permisivas para el cliente final.
- La tabla queda **cerrada por defecto** hasta definir policies o un uso **controlado desde servidor** (p. ej. service role encapsulado), según el contrato de persistencia **8C-doc**.

## 7. Estado final

- Migración aplicada manualmente: **sí**.
- SQL ejecutado en Supabase remoto: **sí** (fuera de este repositorio / IDE; registro operativo).
- Datos reales modificados: **no**, solo estructura.
- Datos insertados persistentes: **no**.
- Tabla final vacía: **sí**.
- **Próxima fase recomendada:** **8C** — implementación controlada de persistencia `draft` en el endpoint, usando la tabla ya creada y definiendo explícitamente RLS o acceso servidor.
