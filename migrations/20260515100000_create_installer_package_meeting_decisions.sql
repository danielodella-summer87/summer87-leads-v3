-- ============================================================================
-- installer_package_meeting_decisions — acta / decisión post-reunión (auditoría)
-- ============================================================================
-- Registra decisiones de reunión asociadas a un draft. No instala CRM, no
-- modifica installer_package_drafts, no ejecuta acciones externas.
-- Aplicar manualmente en Supabase (SQL Editor o CLI).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.installer_package_meeting_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.installer_package_drafts (id) ON DELETE CASCADE,
  decision text NOT NULL,
  decision_label text NOT NULL,
  decision_reason text NULL,
  meeting_notes text NULL,
  pending_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  decided_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_package_meeting_decisions_decision_check CHECK (
    decision IN (
      'advance_manual_preparation',
      'wait_kore_technical_info',
      'adjust_scope',
      'pause_project'
    )
  ),
  CONSTRAINT installer_package_meeting_decisions_pending_items_array_check CHECK (
    jsonb_typeof(pending_items) = 'array'
  )
);

COMMENT ON TABLE public.installer_package_meeting_decisions IS
  'Decisiones de reunión de validación; evidencia auditable. Sin instalación ni mutación de drafts.';

CREATE INDEX IF NOT EXISTS idx_installer_package_meeting_decisions_draft_id
  ON public.installer_package_meeting_decisions (draft_id);

CREATE INDEX IF NOT EXISTS idx_installer_package_meeting_decisions_created_at
  ON public.installer_package_meeting_decisions (created_at DESC);

ALTER TABLE public.installer_package_meeting_decisions ENABLE ROW LEVEL SECURITY;

COMMIT;
