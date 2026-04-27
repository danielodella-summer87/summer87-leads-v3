-- Iniciativas (empresas): cargo del contacto, clasificación comercial, WhatsApp dedicado.

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS contacto_cargo text,
  ADD COLUMN IF NOT EXISTS clasificacion text,
  ADD COLUMN IF NOT EXISTS whatsapp text;
