ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS visita_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS visita_relevamiento_json jsonb;
