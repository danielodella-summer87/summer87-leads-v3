-- ============================================================================
-- 070_create_crm_setup_config.sql
-- Fase 2B — Persistencia del Constructor CRM
--
-- Propósito:
--   Crear la tabla public.crm_setup_config para guardar la configuración del
--   Constructor CRM. Modelo: 1 fila por instancia Supabase, JSONB por paso.
--
-- Seguridad operativa:
--   - CREATE TABLE IF NOT EXISTS              → idempotente
--   - CREATE OR REPLACE FUNCTION              → idempotente
--   - DROP TRIGGER IF EXISTS antes de CREATE  → idempotente
--   - CREATE INDEX IF NOT EXISTS              → idempotente
--   - INSERT ... WHERE NOT EXISTS             → idempotente
--   - No toca tablas existentes
--   - No borra datos
--   - No sincroniza con leads_pipelines (Fase 2I)
--
-- Prerrequisito:
--   estructura_base.sql ya ejecutado en la instancia (define public.set_updated_at).
--   El CREATE OR REPLACE FUNCTION a continuación es una guardia idempotente
--   para instancias donde la función no esté aún disponible.
--
-- Rollback comentado al final del archivo.
-- ============================================================================

BEGIN;

-- ─── 1. Función compartida de updated_at (guardia idempotente) ────────────────
--
-- public.set_updated_at() está definida en estructura_base.sql y en las
-- instancias operativas. CREATE OR REPLACE garantiza que esté disponible
-- incluso en entornos de prueba sin estructura_base.
--
-- NO dropear esta función en rollback — es compartida con otras tablas.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── 2. Tabla principal ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_setup_config (

  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Control de versión del schema (permite evolución sin romper clientes)
  version          INTEGER     NOT NULL DEFAULT 1,

  -- Estado del CRM en esta instancia
  status           TEXT        NOT NULL DEFAULT 'setup',

  -- ── Pasos del Constructor (JSONB por columna) ──────────────────────────────
  -- Cada paso se actualiza independientemente con un PATCH de columna única.
  -- No usar GIN en estas columnas todavía — se agregarán en Fase 3 cuando
  -- los motores IA necesiten queries de path cross-instancia.

  empresa          JSONB       NOT NULL DEFAULT '{}'::JSONB,
  cuestionario     JSONB       NOT NULL DEFAULT '{}'::JSONB,
  documentos       JSONB       NOT NULL DEFAULT '{}'::JSONB,
  diagnostico      JSONB       NOT NULL DEFAULT '{}'::JSONB,
  proceso_pipeline JSONB       NOT NULL DEFAULT '{}'::JSONB,
  motores_ia       JSONB       NOT NULL DEFAULT '{}'::JSONB,
  reportes         JSONB       NOT NULL DEFAULT '{}'::JSONB,
  auditoria        JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- ── Metadatos escalares (filtrables directamente sin parsear JSON) ─────────
  meta             JSONB       NOT NULL DEFAULT '{}'::JSONB,
  readiness_score  INTEGER     NOT NULL DEFAULT 0,
  completed_steps  TEXT[]      NOT NULL DEFAULT '{}',
  current_step     TEXT        NOT NULL DEFAULT 'empresa',

  -- ── Timestamps ────────────────────────────────────────────────────────────
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────────────────────

  CONSTRAINT crm_setup_config_status_check
    CHECK (status IN ('setup', 'active', 'paused')),

  CONSTRAINT crm_setup_config_readiness_score_check
    CHECK (readiness_score BETWEEN 0 AND 100),

  CONSTRAINT crm_setup_config_current_step_check
    CHECK (current_step IN (
      'empresa',
      'cuestionario',
      'documentos',
      'diagnostico',
      'proceso-pipeline',
      'motores-ia',
      'reportes',
      'auditoria'
    ))

);

-- ─── 3. Índices ───────────────────────────────────────────────────────────────

-- Por status: permite filtrar instancias en 'setup' vs 'active' en analytics futuros.
CREATE INDEX IF NOT EXISTS crm_setup_config_status_idx
  ON public.crm_setup_config (status);

-- Por current_step: útil para queries cross-instancia del tipo
-- "cuántas instancias están atascadas en 'diagnostico'".
CREATE INDEX IF NOT EXISTS crm_setup_config_current_step_idx
  ON public.crm_setup_config (current_step);

-- GIN sobre meta: permite queries de containment como
-- meta @> '{"setup_phase": "fase_2b"}' o meta ? 'created_by'.
-- Justificado porque meta es el campo de trazabilidad y auditoría de la fila.
CREATE INDEX IF NOT EXISTS crm_setup_config_meta_gin_idx
  ON public.crm_setup_config USING GIN (meta);

-- ─── 4. Trigger updated_at ────────────────────────────────────────────────────

-- DROP IF EXISTS antes de CREATE para hacer la migración re-ejecutable.
DROP TRIGGER IF EXISTS trg_crm_setup_config_updated_at
  ON public.crm_setup_config;

CREATE TRIGGER trg_crm_setup_config_updated_at
  BEFORE UPDATE ON public.crm_setup_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. Comentarios ───────────────────────────────────────────────────────────

COMMENT ON TABLE public.crm_setup_config IS
  'Configuración del Constructor CRM. 1 fila por instancia Supabase. JSONB por paso del Constructor (pasos 1-8).';

COMMENT ON COLUMN public.crm_setup_config.version IS
  'Versión del schema de la fila. Incrementar si cambia la estructura de un JSONB de paso.';

COMMENT ON COLUMN public.crm_setup_config.status IS
  'Estado del CRM: setup (configurando), active (CRM operativo), paused (suspendido).';

COMMENT ON COLUMN public.crm_setup_config.empresa IS
  'Paso 1: Identidad, rubro, giro, vertical y contexto IA de la empresa. Shape: EmpresaForm.';

COMMENT ON COLUMN public.crm_setup_config.cuestionario IS
  'Paso 2: Cuestionario comercial (modelo de venta, clientes, proceso, reportes, IA). Shape: CuestionarioForm.';

COMMENT ON COLUMN public.crm_setup_config.documentos IS
  'Paso 3: Tipos de documentos seleccionados y lista de documentos registrados. Shape: { tiposSeleccionados, lista[] }.';

COMMENT ON COLUMN public.crm_setup_config.diagnostico IS
  'Paso 4: Diagnóstico comercial (modelo, complejidad, matriz, hallazgos, preguntas). Shape: DiagnosticoForm.';

COMMENT ON COLUMN public.crm_setup_config.proceso_pipeline IS
  'Paso 5: Etapas del proceso comercial y columnas del pipeline Kanban. Shape: { etapas[], columnas[], reglasValidacion }.';

COMMENT ON COLUMN public.crm_setup_config.motores_ia IS
  'Paso 6: Motores IA por etapa con input/output y reglas de uso. Shape: { motores[], reglasUsoIA }.';

COMMENT ON COLUMN public.crm_setup_config.reportes IS
  'Paso 7: Reportes por tipo, audiencia y frecuencia. Shape: { reportes[], reglasReportes }.';

COMMENT ON COLUMN public.crm_setup_config.auditoria IS
  'Paso 8: Checklist, riesgos, score y dictamen de activación. Shape: { score, dictamen, checklist[], riesgos[] }.';

COMMENT ON COLUMN public.crm_setup_config.readiness_score IS
  'Score 0-100 de preparación. Calculado en servidor al guardar auditoría. Columna escalar para filtros SQL.';

COMMENT ON COLUMN public.crm_setup_config.completed_steps IS
  'IDs de pasos completados (ej: {empresa,cuestionario}). Sincronizado por la API en cada PATCH exitoso.';

COMMENT ON COLUMN public.crm_setup_config.current_step IS
  'Paso activo actual del Constructor. Actualizado por la API al navegar entre pasos.';

COMMENT ON COLUMN public.crm_setup_config.meta IS
  'Metadatos de trazabilidad: source, setup_phase, version_app, created_by, notas internas.';

-- ─── 6. Seed inicial — 1 fila por instancia ──────────────────────────────────
--
-- El modelo es 1 instancia = 1 proyecto Supabase.
-- Se inserta solo si la tabla está vacía.
-- Para instancias nuevas: esta fila es el punto de partida del Constructor.
-- Para instancias existentes: WHERE NOT EXISTS previene duplicados.

INSERT INTO public.crm_setup_config (
  version,
  status,
  empresa,
  cuestionario,
  documentos,
  diagnostico,
  proceso_pipeline,
  motores_ia,
  reportes,
  auditoria,
  meta,
  readiness_score,
  completed_steps,
  current_step
)
SELECT
  1,
  'setup',
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  '{}'::JSONB,
  jsonb_build_object(
    'source',          'migration',
    'setup_phase',     'fase_2b',
    'completed_steps', '[]'::JSONB,
    'created_by',      'system'
  ),
  0,
  '{}',
  'empresa'
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_setup_config
);

COMMIT;

-- ============================================================================
-- Rollback manual
-- Ejecutar SOLO si se necesita revertir esta migración.
-- NO ejecutar en producción sin confirmación explícita.
--
-- BEGIN;
--
-- DROP TRIGGER IF EXISTS trg_crm_setup_config_updated_at
--   ON public.crm_setup_config;
--
-- DROP INDEX IF EXISTS crm_setup_config_meta_gin_idx;
-- DROP INDEX IF EXISTS crm_setup_config_current_step_idx;
-- DROP INDEX IF EXISTS crm_setup_config_status_idx;
--
-- DROP TABLE IF EXISTS public.crm_setup_config;
--
-- -- IMPORTANTE: NO dropear public.set_updated_at()
-- -- Es una función compartida usada por otras tablas (agency_services,
-- -- empresas, easy_services, entity_import_batches, lead_contacts, etc.)
-- -- Dropearla rompería los triggers de esas tablas.
--
-- COMMIT;
-- ============================================================================

-- ============================================================================
-- TODO — bootstrap_new_instance_consolidated.sql (Fase 2B.1)
--
-- En una fase posterior, agregar al bootstrap el siguiente bloque después de
-- la sección "4) Configuración mínima":
--
--   -- 4b) Fila inicial de crm_setup_config
--   INSERT INTO public.crm_setup_config (meta)
--   SELECT jsonb_build_object(
--     'source',      'bootstrap',
--     'setup_phase', 'nueva_instancia',
--     'created_by',  'system'
--   )
--   WHERE NOT EXISTS (SELECT 1 FROM public.crm_setup_config);
--
-- Esto garantiza que toda nueva instancia bootstrapeada tenga la fila
-- inicial incluso si la migración 070 no se re-ejecuta en el bootstrap.
-- ============================================================================
