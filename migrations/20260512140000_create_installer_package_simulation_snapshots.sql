-- ============================================================================
-- installer_package_simulation_snapshots — evidencia auditable de simulación
-- ============================================================================
-- Persiste un snapshot del contrato técnico de preinstalación y el payload
-- de simulación recibido. No instala CRM, no crea tenant/usuarios, no escribe
-- en Zeta ni llama servicios externos. Aplicar manualmente en Supabase.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.installer_package_simulation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.installer_package_drafts (id) ON DELETE CASCADE,
  snapshot_type text NOT NULL DEFAULT 'preinstall_contract',
  contract_version text NOT NULL,
  simulation_status text NOT NULL,
  readiness_score integer NULL,
  final_go_no_go text NULL,
  risk_level text NULL,
  can_proceed_to_pilot_preparation boolean NOT NULL DEFAULT false,
  technical_preinstall_contract jsonb NOT NULL,
  simulation_payload jsonb NOT NULL,
  created_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_package_simulation_snapshots_technical_contract_object_check CHECK (
    jsonb_typeof(technical_preinstall_contract) = 'object'
  ),
  CONSTRAINT installer_package_simulation_snapshots_simulation_payload_object_check CHECK (
    jsonb_typeof(simulation_payload) = 'object'
  )
);

COMMENT ON TABLE public.installer_package_simulation_snapshots IS
  'Snapshots de simulación de preinstalación para auditoría; sin ejecución de instalación.';

CREATE INDEX IF NOT EXISTS idx_installer_package_simulation_snapshots_draft_id
  ON public.installer_package_simulation_snapshots (draft_id);

CREATE INDEX IF NOT EXISTS idx_installer_package_simulation_snapshots_created_at
  ON public.installer_package_simulation_snapshots (created_at DESC);

ALTER TABLE public.installer_package_simulation_snapshots ENABLE ROW LEVEL SECURITY;

COMMIT;
