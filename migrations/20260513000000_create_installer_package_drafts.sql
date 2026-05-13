-- ============================================================================
-- installer_package_drafts — borradores de paquete instalable (fase 8B)
-- ============================================================================
-- La tabla guarda borradores revisables; no instala CRM por sí sola.
-- package_payload no debe contener secretos ni service role keys.
-- Zeta permanece solo lectura; esta tabla no modela escrituras hacia Zeta.
-- El cliente final del CRM operativo no debe acceder a estos borradores.
-- La confirmación humana explícita es requisito antes de cualquier instalación.
-- ============================================================================

BEGIN;

-- ─── Función compartida updated_at (idempotente; alineada a migrations/070) ─

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── Tabla ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.installer_package_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constructor_id uuid NULL,
  target_client_id uuid NULL,
  package_version text NOT NULL DEFAULT '8B-draft-v1',
  status text NOT NULL DEFAULT 'draft_generated',
  package_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocked_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_human_confirmation boolean NOT NULL DEFAULT true,
  human_confirmation_status text NOT NULL DEFAULT 'pending',
  requested_by uuid NULL,
  reviewed_by uuid NULL,
  approved_by uuid NULL,
  rejected_by uuid NULL,
  rejection_reason text NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL,
  approved_at timestamptz NULL,
  rejected_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_package_drafts_status_check CHECK (
    status IN (
      'draft_generated',
      'under_review',
      'changes_requested',
      'approved_for_pilot',
      'rejected',
      'expired',
      'superseded',
      'archived'
    )
  ),
  CONSTRAINT installer_package_drafts_human_confirmation_status_check CHECK (
    human_confirmation_status IN ('pending', 'approved', 'rejected')
  ),
  CONSTRAINT installer_package_drafts_package_payload_object_check CHECK (
    jsonb_typeof(package_payload) = 'object'
  ),
  CONSTRAINT installer_package_drafts_blocked_actions_array_check CHECK (
    jsonb_typeof(blocked_actions) = 'array'
  ),
  CONSTRAINT installer_package_drafts_warnings_array_check CHECK (
    jsonb_typeof(warnings) = 'array'
  )
);

COMMENT ON TABLE public.installer_package_drafts IS
  'Borradores revisables del paquete instalable; no instala CRM. Sin secretos. Acceso solo interno/admin.';

COMMENT ON COLUMN public.installer_package_drafts.package_payload IS
  'JSONB objeto; no almacenar secretos ni service role keys.';

COMMENT ON COLUMN public.installer_package_drafts.requires_human_confirmation IS
  'Confirmación humana requerida antes de instalación u operaciones sensibles.';

-- ─── Índices ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS installer_package_drafts_constructor_id_idx
  ON public.installer_package_drafts (constructor_id);

CREATE INDEX IF NOT EXISTS installer_package_drafts_target_client_id_idx
  ON public.installer_package_drafts (target_client_id);

CREATE INDEX IF NOT EXISTS installer_package_drafts_status_idx
  ON public.installer_package_drafts (status);

CREATE INDEX IF NOT EXISTS installer_package_drafts_requested_by_idx
  ON public.installer_package_drafts (requested_by);

CREATE INDEX IF NOT EXISTS installer_package_drafts_created_at_idx
  ON public.installer_package_drafts (created_at);

CREATE INDEX IF NOT EXISTS installer_package_drafts_expires_at_idx
  ON public.installer_package_drafts (expires_at);

-- ─── Trigger updated_at ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS installer_package_drafts_set_updated_at ON public.installer_package_drafts;
CREATE TRIGGER installer_package_drafts_set_updated_at
  BEFORE UPDATE ON public.installer_package_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS (sin policies en esta fase; deny-by-default) ──────────────────────

ALTER TABLE public.installer_package_drafts ENABLE ROW LEVEL SECURITY;

-- RLS queda habilitado sin policies operativas en esta fase; comportamiento deny-by-default hasta definir permisos.

COMMIT;
