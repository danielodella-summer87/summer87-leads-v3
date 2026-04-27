-- =============================================================================
-- BOOTSTRAP CONSOLIDADO — NUEVA INSTANCIA SUMMER87 LEADS
-- =============================================================================
--
-- Uso previsto:
--   1. Ejecutar primero estructura_base.sql.
--   2. Ejecutar este archivo en la nueva instancia país/cliente.
--
-- Alcance:
--   - Datos mínimos operativos: roles, permisos, config, rubros, servicios,
--     pipelines, picklists y usuario interno inicial.
--   - Alineación idempotente de columnas que el código actual espera en
--     public.leads y public.empresas.
--
-- Seguridad operativa:
--   - No hace DROP de tablas ni columnas.
--   - No borra datos.
--   - Los seeds usan WHERE NOT EXISTS / ON CONFLICT solo donde ya existe una
--     restricción estable del schema base.
--   - No ejecuta nada fuera de la base donde se corre manualmente.
--
-- Ajustes típicos por país antes de ejecutar:
--   - config.instance_country
--   - config.instance_label
--   - moneda/precios base de easy_services si aplica.
--
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Roles mínimos
-- -----------------------------------------------------------------------------

INSERT INTO public.roles (name, label, description, is_system)
SELECT v.name, v.label, v.description, v.is_system
FROM (
  VALUES
    ('admin', 'Administrador', 'Acceso total a la instancia.', true),
    ('comercial', 'Comercial', 'Operación comercial de leads, agenda e IA.', true),
    ('viewer', 'Viewer', 'Solo lectura para módulos principales.', true),
    ('tecnico', 'Técnico', 'Soporte técnico y operación de IA/configuración básica.', false),
    ('consultor', 'Consultor', 'Lectura comercial y uso consultivo de IA.', false)
) AS v(name, label, description, is_system)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r WHERE lower(trim(r.name)) = lower(trim(v.name))
);

-- -----------------------------------------------------------------------------
-- 2) Permisos mínimos
-- -----------------------------------------------------------------------------
-- estructura_base.sql define public.permissions como:
--   id uuid, key text unique, module text, action text, description text.
-- El código consulta permissions.key vía role_permissions.

INSERT INTO public.permissions (key, module, action, description)
SELECT v.key, v.module, v.action, v.description
FROM (
  VALUES
    ('agenda.read', 'agenda', 'read', 'Ver agenda'),
    ('agenda.write', 'agenda', 'write', 'Crear y editar agenda'),
    ('config.admin', 'config', 'admin', 'Administrar configuración, roles y permisos'),
    ('config.read', 'config', 'read', 'Ver configuración'),
    ('empresas.read', 'empresas', 'read', 'Ver empresas e iniciativas'),
    ('empresas.write', 'empresas', 'write', 'Crear y editar empresas e iniciativas'),
    ('empresas.delete', 'empresas', 'delete', 'Eliminar empresas'),
    ('ia.generate', 'ia', 'generate', 'Usar generación IA'),
    ('leads.read', 'leads', 'read', 'Ver leads'),
    ('leads.write', 'leads', 'write', 'Crear y editar leads'),
    ('leads.delete', 'leads', 'delete', 'Eliminar leads'),
    ('reportes.read', 'reportes', 'read', 'Ver reportes'),
    ('socios.read', 'socios', 'read', 'Ver socios'),
    ('socios.write', 'socios', 'write', 'Crear y editar socios')
) AS v(key, module, action, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions p WHERE p.key = v.key
);

-- -----------------------------------------------------------------------------
-- 3) Asignación de permisos por rol
-- -----------------------------------------------------------------------------

-- admin: todos los permisos existentes.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

-- comercial: operación diaria.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'agenda.read',
  'agenda.write',
  'empresas.read',
  'empresas.write',
  'ia.generate',
  'leads.read',
  'leads.write',
  'reportes.read',
  'socios.read',
  'socios.write'
)
WHERE r.name = 'comercial'
  AND NOT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

-- viewer: lectura.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'agenda.read',
  'config.read',
  'empresas.read',
  'leads.read',
  'reportes.read',
  'socios.read'
)
WHERE r.name = 'viewer'
  AND NOT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

-- tecnico: soporte de leads/IA/configuración visible.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'config.read',
  'ia.generate',
  'leads.read',
  'leads.write'
)
WHERE r.name = 'tecnico'
  AND NOT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

-- consultor: lectura + IA.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN (
  'empresas.read',
  'ia.generate',
  'leads.read',
  'reportes.read',
  'socios.read'
)
WHERE r.name = 'consultor'
  AND NOT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

-- -----------------------------------------------------------------------------
-- 4) Configuración mínima
-- -----------------------------------------------------------------------------

INSERT INTO public.config (key, value, updated_at)
SELECT v.key, v.value, now()
FROM (
  VALUES
    ('site_name', 'Summer87 Intelligence'),
    ('primary_module', 'Summer87 Leads'),
    ('instance_country', 'BASE'),
    ('instance_label', 'Nueva instancia'),
    ('ia_enabled', 'true'),
    ('crm_enabled', 'true'),
    ('helpdesk_enabled', 'true'),
    ('allow_multiple_leads_per_initiative', 'false')
) AS v(key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM public.config c WHERE c.key = v.key
);

-- -----------------------------------------------------------------------------
-- 5) Rubros base
-- -----------------------------------------------------------------------------

INSERT INTO public.rubros (nombre, activo)
SELECT v.nombre, true
FROM (
  VALUES
    ('Tecnología'),
    ('Educación'),
    ('Salud'),
    ('Servicios profesionales'),
    ('Comercio'),
    ('Industria'),
    ('Construcción'),
    ('Turismo'),
    ('Gastronomía'),
    ('Inmobiliaria')
) AS v(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM public.rubros r WHERE lower(trim(r.nombre)) = lower(trim(v.nombre))
);

-- -----------------------------------------------------------------------------
-- 6) Servicios EASY corregidos
-- -----------------------------------------------------------------------------
-- easy_services exige codigo y billing_type. billing_type acepta:
--   one_time | monthly

INSERT INTO public.easy_services (
  codigo,
  nombre,
  categoria,
  descripcion_corta,
  alcance_base,
  billing_type,
  precio_base,
  moneda,
  activo,
  orden,
  recommended_for
)
SELECT
  v.codigo,
  v.nombre,
  v.categoria,
  v.descripcion_corta,
  v.alcance_base,
  v.billing_type,
  v.precio_base,
  v.moneda,
  true,
  v.orden,
  v.recommended_for
FROM (
  VALUES
    ('STRAT01', 'Diagnóstico estratégico', 'Estrategia', 'Análisis inicial y hoja de ruta comercial.', 'Diagnóstico, oportunidades y plan de acción inicial.', 'one_time', 250::numeric, 'USD', 10, ARRAY['startup', 'empresa']::text[]),
    ('STRAT02', 'Consultoría comercial', 'Estrategia', 'Acompañamiento comercial mensual.', 'Sesiones de seguimiento, priorización y soporte comercial.', 'monthly', 450::numeric, 'USD', 20, ARRAY['empresa']::text[]),
    ('AUTO01', 'Automatización', 'Automatización', 'Automatización simple de procesos comerciales.', 'Flujos, formularios y automatizaciones operativas iniciales.', 'one_time', 350::numeric, 'USD', 30, ARRAY['empresa']::text[]),
    ('WEB01', 'Landing page', 'Web', 'Landing comercial para captación.', 'Diseño e implementación de landing page base.', 'one_time', 300::numeric, 'USD', 40, ARRAY['startup', 'empresa']::text[]),
    ('SOC01', 'Gestión de redes', 'Marketing', 'Gestión mensual de contenido en redes.', 'Planificación, copies y piezas base para redes sociales.', 'monthly', 250::numeric, 'USD', 50, ARRAY['empresa']::text[]),
    ('ADS01', 'Pauta digital', 'Marketing', 'Gestión de campañas de pauta digital.', 'Configuración, seguimiento y optimización de campañas.', 'monthly', 150::numeric, 'USD', 60, ARRAY['startup', 'empresa']::text[]),
    ('AI01', 'Motor de inteligencia', 'IA', 'Configuración de inteligencia comercial asistida por IA.', 'Prompts, reportes y flujo de análisis comercial.', 'one_time', 500::numeric, 'USD', 70, ARRAY['empresa']::text[]),
    ('CRM01', 'CRM / Implementación', 'CRM', 'Implementación operativa de CRM comercial.', 'Configuración inicial de pipeline, campos y operación.', 'one_time', 400::numeric, 'USD', 80, ARRAY['empresa']::text[])
) AS v(codigo, nombre, categoria, descripcion_corta, alcance_base, billing_type, precio_base, moneda, orden, recommended_for)
WHERE NOT EXISTS (
  SELECT 1 FROM public.easy_services s WHERE s.codigo = v.codigo
);

-- -----------------------------------------------------------------------------
-- 7) Pipelines corregidos
-- -----------------------------------------------------------------------------

-- lead_pipelines usa name y sort_order.
INSERT INTO public.lead_pipelines (name, sort_order, is_active, color)
SELECT v.name, v.sort_order, true, v.color
FROM (
  VALUES
    ('LEADS87', 10, '#0f172a')
) AS v(name, sort_order, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_pipelines lp WHERE lower(trim(lp.name)) = lower(trim(v.name))
);

-- leads_pipelines usa nombre, posicion, color, tipo y orden.
INSERT INTO public.leads_pipelines (nombre, posicion, color, tipo, orden)
SELECT v.nombre, v.posicion, v.color, v.tipo, v.orden
FROM (
  VALUES
    ('Nuevo', 0, '#f59e0b', 'normal', 10),
    ('En contacto', 10, '#3b82f6', 'normal', 20),
    ('En propuesta', 20, '#8b5cf6', 'normal', 30),
    ('En seguimiento', 30, '#06b6d4', 'normal', 40),
    ('Ganado', 1000, '#22c55e', 'ganado', 900),
    ('Perdido', 999, '#ef4444', 'perdido', 910)
) AS v(nombre, posicion, color, tipo, orden)
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads_pipelines lp WHERE lower(trim(lp.nombre)) = lower(trim(v.nombre))
);

-- -----------------------------------------------------------------------------
-- 8) Picklists
-- -----------------------------------------------------------------------------
-- El código actual de configuración lee group_key, label, sort, is_active.

INSERT INTO public.lead_picklist_items (group_key, label, sort, is_active)
SELECT v.group_key, v.label, v.sort, true
FROM (
  VALUES
    ('membership_goals', 'Networking', 10),
    ('membership_goals', 'Nuevos clientes', 20),
    ('membership_goals', 'Alianzas estratégicas', 30),
    ('membership_goals', 'Visibilidad de marca', 40),
    ('icp_targets', 'Pymes', 10),
    ('icp_targets', 'Startups', 20),
    ('icp_targets', 'Empresas medianas', 30),
    ('icp_targets', 'Instituciones', 40),
    ('company_size', '1-10', 10),
    ('company_size', '11-50', 20),
    ('company_size', '51-200', 30),
    ('company_size', '200+', 40)
) AS v(group_key, label, sort)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.lead_picklist_items lpi
  WHERE lpi.group_key = v.group_key
    AND lower(trim(lpi.label)) = lower(trim(v.label))
);

-- -----------------------------------------------------------------------------
-- 9) Alineación de columnas actuales en leads
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS commercial_strategy_json jsonb,
  ADD COLUMN IF NOT EXISTS strategy_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS estado_revision text DEFAULT 'nueva',
  ADD COLUMN IF NOT EXISTS fuente_remota text,
  ADD COLUMN IF NOT EXISTS score_preliminar smallint,
  ADD COLUMN IF NOT EXISTS converted_lead_id uuid,
  ADD COLUMN IF NOT EXISTS iniciativa_id uuid,
  ADD COLUMN IF NOT EXISTS linkedin_empresa text,
  ADD COLUMN IF NOT EXISTS linkedin_personal text,
  ADD COLUMN IF NOT EXISTS initiative_kind text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS project_description text,
  ADD COLUMN IF NOT EXISTS ai_generation_id text,
  ADD COLUMN IF NOT EXISTS ai_status text,
  ADD COLUMN IF NOT EXISTS ai_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_current_module text,
  ADD COLUMN IF NOT EXISTS ai_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_module_total integer;

UPDATE public.leads
SET initiative_kind = 'standard'
WHERE initiative_kind IS NULL;

-- Backfill canónico desde linkedin_director si existe en instancias antiguas.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'linkedin_director'
  ) THEN
    UPDATE public.leads
    SET linkedin_personal = linkedin_director
    WHERE (linkedin_personal IS NULL OR btrim(linkedin_personal) = '')
      AND linkedin_director IS NOT NULL
      AND btrim(linkedin_director) <> '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'leads'
      AND c.conname = 'leads_initiative_kind_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_initiative_kind_check
      CHECK (initiative_kind IS NULL OR initiative_kind IN ('standard', 'startup'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'leads'
      AND c.conname = 'leads_score_preliminar_range'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_score_preliminar_range
      CHECK (score_preliminar IS NULL OR (score_preliminar >= 0 AND score_preliminar <= 10));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'leads'
      AND c.conname = 'leads_estado_revision_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_estado_revision_check
      CHECK (
        estado_revision IS NULL
        OR estado_revision IN (
          'nueva',
          'importada',
          'en_revision',
          'validada',
          'descartada',
          'convertida_a_lead'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'leads'
      AND c.conname = 'leads_iniciativa_id_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_iniciativa_id_fkey
      FOREIGN KEY (iniciativa_id) REFERENCES public.empresas (id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 10) Alineación de columnas actuales en empresas
-- -----------------------------------------------------------------------------

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS estado_revision text DEFAULT 'nueva',
  ADD COLUMN IF NOT EXISTS fuente_remota text,
  ADD COLUMN IF NOT EXISTS score_preliminar smallint,
  ADD COLUMN IF NOT EXISTS converted_lead_id uuid,
  ADD COLUMN IF NOT EXISTS linkedin_empresa text,
  ADD COLUMN IF NOT EXISTS linkedin_personal text,
  ADD COLUMN IF NOT EXISTS initiative_kind text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS project_description text;

UPDATE public.empresas
SET initiative_kind = 'standard'
WHERE initiative_kind IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'empresas'
      AND c.conname = 'empresas_initiative_kind_check'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_initiative_kind_check
      CHECK (initiative_kind IS NULL OR initiative_kind IN ('standard', 'startup'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'empresas'
      AND c.conname = 'empresas_score_preliminar_range'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_score_preliminar_range
      CHECK (score_preliminar IS NULL OR (score_preliminar >= 0 AND score_preliminar <= 10));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'empresas'
      AND c.conname = 'empresas_estado_revision_check'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_estado_revision_check
      CHECK (
        estado_revision IS NULL
        OR estado_revision IN (
          'nueva',
          'importada',
          'en_revision',
          'validada',
          'descartada',
          'convertida_a_lead'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'empresas'
      AND c.conname = 'empresas_converted_lead_id_fkey'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_converted_lead_id_fkey
      FOREIGN KEY (converted_lead_id) REFERENCES public.leads (id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 11) Usuario admin inicial para login interno
-- -----------------------------------------------------------------------------
-- username: daniel
-- PIN: 1234
-- password_hash bcryptjs: se guarda el hash, no el PIN en claro.

INSERT INTO public.app_users (email, nombre, is_active, role_id)
SELECT
  'daniel@summer87.local',
  'Daniel Admin',
  true,
  r.id
FROM public.roles r
WHERE r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.app_users u
    WHERE lower(trim(u.email)) = 'daniel@summer87.local'
  )
LIMIT 1;

INSERT INTO public.app_credentials (user_id, username, password_hash, must_change_password)
SELECT
  u.id,
  'daniel',
  '$2b$10$u7JaTuizIkuBRs/laKCHHeT6DI7m/R6FyTXdmnR/soml90us.etDa',
  false
FROM public.app_users u
WHERE lower(trim(u.email)) = 'daniel@summer87.local'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  must_change_password = EXCLUDED.must_change_password;

-- -----------------------------------------------------------------------------
-- 12) Comentarios útiles
-- -----------------------------------------------------------------------------

COMMENT ON TABLE public.app_credentials IS 'Credenciales para login interno (username + password hash bcrypt).';
COMMENT ON COLUMN public.easy_services.codigo IS 'Código estable de catálogo EASY usado para identificación idempotente.';
COMMENT ON COLUMN public.easy_services.billing_type IS 'Modelo de facturación: one_time o monthly.';
COMMENT ON COLUMN public.lead_pipelines.name IS 'Nombre de pipeline macro; esta tabla usa name/sort_order.';
COMMENT ON COLUMN public.lead_pipelines.sort_order IS 'Orden visual del pipeline macro.';
COMMENT ON COLUMN public.leads_pipelines.nombre IS 'Estado del pipeline comercial de leads; esta tabla usa nombre/posicion/tipo/orden.';
COMMENT ON COLUMN public.lead_picklist_items.sort IS 'Orden visual de opciones en configuración de leads.';
COMMENT ON COLUMN public.leads.commercial_strategy_json IS 'Estado de estrategia comercial: generado/editado/inputs del usuario.';
COMMENT ON COLUMN public.leads.strategy_approved_at IS 'Fecha de aprobación explícita de la estrategia comercial.';
COMMENT ON COLUMN public.leads.estado_revision IS 'Estado de revisión preliminar cuando el lead nace desde ingesta/iniciativa.';
COMMENT ON COLUMN public.leads.fuente_remota IS 'Origen externo del lead si proviene de una integración o carga remota.';
COMMENT ON COLUMN public.leads.score_preliminar IS 'Score preliminar 0-10 antes del análisis comercial completo.';
COMMENT ON COLUMN public.leads.converted_lead_id IS 'Referencia auxiliar para flujos de conversión/idempotencia entre instancias.';
COMMENT ON COLUMN public.leads.iniciativa_id IS 'Empresa/iniciativa de origen al convertir a lead.';
COMMENT ON COLUMN public.leads.linkedin_empresa IS 'URL o perfil LinkedIn de la organización.';
COMMENT ON COLUMN public.leads.linkedin_personal IS 'URL o perfil LinkedIn del contacto (campo canónico).';
COMMENT ON COLUMN public.leads.initiative_kind IS 'Tipo de iniciativa: standard o startup.';
COMMENT ON COLUMN public.leads.project_description IS 'Descripción del proyecto/iniciativa para contexto comercial e IA.';
COMMENT ON COLUMN public.leads.ai_generation_id IS 'Identificador de corrida IA aceptada para polling de estado.';
COMMENT ON COLUMN public.leads.ai_status IS 'Estado de generación IA: pending, running, completed o error.';
COMMENT ON COLUMN public.leads.ai_progress IS 'Progreso de generación IA en porcentaje.';
COMMENT ON COLUMN public.leads.ai_current_module IS 'Módulo actual en generación IA.';
COMMENT ON COLUMN public.leads.ai_started_at IS 'Inicio de la generación IA.';
COMMENT ON COLUMN public.leads.ai_module_total IS 'Cantidad total de módulos esperados en la generación IA.';
COMMENT ON COLUMN public.empresas.estado_revision IS 'Ciclo de vida de la iniciativa antes de convertirse en lead comercial.';
COMMENT ON COLUMN public.empresas.fuente_remota IS 'Origen externo de la empresa/iniciativa.';
COMMENT ON COLUMN public.empresas.score_preliminar IS 'Score 0-10 antes de convertir a lead; nullable.';
COMMENT ON COLUMN public.empresas.converted_lead_id IS 'Lead creado por conversión explícita; idempotencia.';
COMMENT ON COLUMN public.empresas.linkedin_personal IS 'LinkedIn del contacto principal de la empresa/iniciativa.';
COMMENT ON COLUMN public.empresas.initiative_kind IS 'Tipo de iniciativa: standard o startup.';
COMMENT ON COLUMN public.empresas.project_description IS 'Descripción del proyecto/iniciativa.';

-- -----------------------------------------------------------------------------
-- 13) Recargar schema cache de PostgREST/Supabase
-- -----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

COMMIT;
