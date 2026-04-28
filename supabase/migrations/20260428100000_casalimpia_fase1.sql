-- =============================================================================
-- Casalimpia Ecuador - Fase 1
-- =============================================================================
-- Migración local idempotente para adaptar el CRM a limpieza/facility services.
-- No ejecuta cambios fuera de las tablas indicadas ni modifica datos existentes
-- salvo inserts idempotentes de catálogos base.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Leads: datos comerciales y técnicos de instalaciones
-- ---------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS rubro_id uuid REFERENCES public.rubros(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cantidad_personal integer,
  ADD COLUMN IF NOT EXISTS superficie_m2 numeric(10,2),
  ADD COLUMN IF NOT EXISTS cantidad_pisos integer,
  ADD COLUMN IF NOT EXISTS cantidad_banos integer,
  ADD COLUMN IF NOT EXISTS tachos_residuos integer,
  ADD COLUMN IF NOT EXISTS tiene_parking boolean,
  ADD COLUMN IF NOT EXISTS tiene_subsuelo boolean,
  ADD COLUMN IF NOT EXISTS tiene_ascensores boolean,
  ADD COLUMN IF NOT EXISTS tiene_escaleras boolean,
  ADD COLUMN IF NOT EXISTS tiene_vidrios_altos boolean,
  ADD COLUMN IF NOT EXISTS tipos_suelo text[],
  ADD COLUMN IF NOT EXISTS horario_operacion text,
  ADD COLUMN IF NOT EXISTS restricciones_acceso text,
  ADD COLUMN IF NOT EXISTS zonas_criticas text,
  ADD COLUMN IF NOT EXISTS requerimientos_especiales text,
  ADD COLUMN IF NOT EXISTS notas_instalacion text,
  ADD COLUMN IF NOT EXISTS installation_details_json jsonb,
  ADD COLUMN IF NOT EXISTS visita_scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_rubro_id
  ON public.leads(rubro_id);

-- ---------------------------------------------------------------------------
-- Rubros Casalimpia
-- ---------------------------------------------------------------------------

INSERT INTO public.rubros (nombre, activo)
SELECT v.nombre, true
FROM (
  VALUES
    ('Laboratorios'),
    ('Entidades Educativas'),
    ('Entidades Bancarias'),
    ('Centros Comerciales'),
    ('Hospitales'),
    ('Clínicas'),
    ('Oficinas en General'),
    ('Industria y Manufactura'),
    ('Aeropuertos y Terminales'),
    ('Hoteles y Hospitalidad')
) AS v(nombre)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.rubros r
  WHERE lower(trim(r.nombre)) = lower(trim(v.nombre))
);

-- ---------------------------------------------------------------------------
-- Categorías de servicios de limpieza
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cleaning_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  sort_order integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nombre)
);

DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trg_cleaning_service_categories_updated_at'
        AND tgrelid = 'public.cleaning_service_categories'::regclass
    )
  THEN
    EXECUTE '
      CREATE TRIGGER trg_cleaning_service_categories_updated_at
      BEFORE UPDATE ON public.cleaning_service_categories
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    ';
  END IF;
END $$;

INSERT INTO public.cleaning_service_categories (nombre, sort_order, activo)
SELECT v.nombre, v.sort_order, true
FROM (
  VALUES
    ('Limpieza General', 10),
    ('Limpieza Especializada', 20),
    ('Desinfección y Sanitización', 30),
    ('Mantenimiento de Exteriores', 40),
    ('Gestión de Residuos', 50),
    ('Servicios Adicionales', 60)
) AS v(nombre, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.cleaning_service_categories c
  WHERE lower(trim(c.nombre)) = lower(trim(v.nombre))
);

-- ---------------------------------------------------------------------------
-- Servicios base de limpieza
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cleaning_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.cleaning_service_categories(id) ON DELETE RESTRICT,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  unidad text NOT NULL DEFAULT 'mes',
  precio_referencia numeric(12,2),
  moneda text NOT NULL DEFAULT 'USD',
  notas_internas text,
  sort_order integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (unidad IN ('m2', 'hora', 'mes', 'evento', 'unidad'))
);

CREATE INDEX IF NOT EXISTS idx_cleaning_services_category_id
  ON public.cleaning_services(category_id);

CREATE INDEX IF NOT EXISTS idx_cleaning_services_activo
  ON public.cleaning_services(activo);

DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trg_cleaning_services_updated_at'
        AND tgrelid = 'public.cleaning_services'::regclass
    )
  THEN
    EXECUTE '
      CREATE TRIGGER trg_cleaning_services_updated_at
      BEFORE UPDATE ON public.cleaning_services
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at()
    ';
  END IF;
END $$;

WITH service_seed (codigo, nombre, category_nombre, sort_order) AS (
  VALUES
    ('LG01', 'Limpieza diaria de oficinas', 'Limpieza General', 10),
    ('LG02', 'Limpieza semanal profunda', 'Limpieza General', 20),
    ('LE01', 'Tratamiento de pisos especiales', 'Limpieza Especializada', 30),
    ('LE02', 'Limpieza de vidrios altos', 'Limpieza Especializada', 40),
    ('LE03', 'Limpieza de alfombras', 'Limpieza Especializada', 50),
    ('DS01', 'Desinfección de instalaciones', 'Desinfección y Sanitización', 60),
    ('DS02', 'Desinfección de baños y vestuarios', 'Desinfección y Sanitización', 70),
    ('ME01', 'Mantenimiento de estacionamientos', 'Mantenimiento de Exteriores', 80),
    ('GR01', 'Gestión de residuos comunes', 'Gestión de Residuos', 90),
    ('SA01', 'Servicio de limpieza para eventos', 'Servicios Adicionales', 100)
)
INSERT INTO public.cleaning_services (category_id, codigo, nombre, sort_order)
SELECT c.id, s.codigo, s.nombre, s.sort_order
FROM service_seed s
JOIN public.cleaning_service_categories c
  ON lower(trim(c.nombre)) = lower(trim(s.category_nombre))
WHERE NOT EXISTS (
  SELECT 1
  FROM public.cleaning_services cs
  WHERE lower(trim(cs.codigo)) = lower(trim(s.codigo))
);

-- ---------------------------------------------------------------------------
-- Relación servicios sugeridos por rubro
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cleaning_service_by_industry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro_id uuid NOT NULL REFERENCES public.rubros(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.cleaning_services(id) ON DELETE CASCADE,
  es_obligatorio boolean NOT NULL DEFAULT false,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rubro_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_service_by_industry_rubro
  ON public.cleaning_service_by_industry(rubro_id);

-- ---------------------------------------------------------------------------
-- Etapas Casalimpia en pipeline comercial
-- ---------------------------------------------------------------------------

INSERT INTO public.leads_pipelines (nombre, posicion, color, tipo, orden)
SELECT v.nombre, v.posicion, v.color, v.tipo, v.orden
FROM (
  VALUES
    ('Nuevo', 0, '#f59e0b', 'normal', 10),
    ('Visita', 10, '#3b82f6', 'normal', 20),
    ('Evaluación', 20, '#6366f1', 'normal', 30),
    ('Servicios', 30, '#8b5cf6', 'normal', 40),
    ('Costeo', 40, '#a855f7', 'normal', 50),
    ('Cotización', 50, '#06b6d4', 'normal', 60),
    ('Propuesta', 60, '#0ea5e9', 'normal', 70),
    ('Presentación', 70, '#14b8a6', 'normal', 80),
    ('Contrato', 80, '#84cc16', 'normal', 90),
    ('Ganado', 1000, '#22c55e', 'ganado', 900),
    ('Perdido', 999, '#ef4444', 'perdido', 910)
) AS v(nombre, posicion, color, tipo, orden)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.leads_pipelines lp
  WHERE lower(trim(lp.nombre)) = lower(trim(v.nombre))
);
