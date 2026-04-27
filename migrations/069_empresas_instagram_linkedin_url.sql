-- URLs comerciales explícitas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text;
