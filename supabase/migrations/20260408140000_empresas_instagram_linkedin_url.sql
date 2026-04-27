-- URLs comerciales explícitas (además de instagram / linkedin_empresa si aplica)
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text;
