# Diagnostico Casalimpia facility legacy CONSTRUCTOR-CLEAN-2A

**Fase:** CONSTRUCTOR-CLEAN-2A  
**Proyecto:** summer87-leads-v3  
**Tipo:** diagnostico tecnico Casa Limpia / facility legacy en codigo activo  
**Alcance:** solo documentacion y lectura

---

## 1. Resumen ejecutivo

- El diagnostico confirma presencia de acoples Casa Limpia / facility en varias capas del sistema.
- La mayor contaminacion activa hoy no esta en templates o knowledge, sino en:
  - APIs de leads con `CASALIMPIA_LEAD_FIELDS`;
  - Ficha de Lead con bloque fuerte de relevamiento tecnico y servicios de limpieza;
  - migraciones/schema legacy que agregaron columnas y JSON de visita al modelo `leads`.
- Tambien existe conocimiento valido y bien ubicado:
  - `docs/casalimpia/README.md` como placeholder correcto;
  - `templates/verticales/casa-limpia-ecuador/README.md` como template placeholder correcto;
  - `knowledge/verticales/facility-servicios/README.md` como knowledge reusable correcto.
- El objetivo de una futura `CLEAN-2B` no debe ser borrar facility del sistema, sino **neutralizar el acople Casa Limpia/nombres legacy del core**, manteniendo compatibilidad con datos existentes.
- **Dictamen preliminar:** `GO` para preparar `CLEAN-2B` con alcance acotado.

---

## 2. Hallazgos tecnicos

| ID | archivo/ruta | referencia encontrada | tipo | riesgo | acción sugerida | prioridad |
|----|--------------|-----------------------|------|--------|-----------------|-----------|
| H1 | `app/api/admin/leads/route.ts` | constante `CASALIMPIA_LEAD_FIELDS` con `cantidad_personal`, `superficie_m2`, `cantidad_pisos`, `cantidad_banos`, `tachos_residuos`, `tiene_parking`, `tiene_subsuelo`, `tiene_ascensores`, `tiene_escaleras`, `tiene_vidrios_altos`, `tipos_suelo`, `horario_operacion`, `restricciones_acceso`, `zonas_criticas`, `requerimientos_especiales`, `notas_instalacion`, `installation_details_json`, `visita_scheduled_at` | hardcode critico en API/core | El core de leads queda nombrado y estructurado desde Casa Limpia / facility | En `CLEAN-2B`, neutralizar el naming (`CASALIMPIA_*`) sin tocar SQL ni quitar columnas | Critica |
| H2 | `app/api/admin/leads/[id]/route.ts` | misma constante `CASALIMPIA_LEAD_FIELDS` ampliada con `visita_completed_at` y `visita_relevamiento_json` | hardcode critico en API/core | La lectura/escritura del lead individual queda acoplada a Casa Limpia por nombre y semantica | Neutralizar naming y encapsular mejor el bloque legacy | Critica |
| H3 | `app/admin/leads/[id]/page.tsx` | tipos `visita_scheduled_at`, `visita_completed_at`, `visita_relevamiento_json`, `cantidad_personal`, `superficie_m2`, `notas_instalacion` | campos legacy ya existentes | La ficha asume modelo de relevamiento fisico dentro del lead operativo general | No tocar en `CLEAN-2B` salvo renombre minimo si fuera indispensable; dejar refactor UI para otra fase | Alta |
| H4 | `app/admin/leads/[id]/page.tsx` | UI de relevamiento con `Parking`, `Subsuelo`, `Ascensores`, `Escaleras`, `Vidrios altos`, `Limpieza de paneles`, `Limpieza de vidrios`, `Fumigación`, `Jardinería`, etc. | copy/UI específico de facility | La ficha mezcla CRM general con formulario operativo muy sesgado a limpieza/facility | Dejar fuera de alcance inmediato; documentar como hardcode UI grande | Alta |
| H5 | `app/admin/leads/nuevo/page.tsx` | create payload incluye `cantidad_personal`, `superficie_m2`, `visita_scheduled_at` | campos legacy ya existentes | Nuevo lead no es neutro del todo; sigue exponiendo campos ligados a vertical de relevamiento | No tocar en `CLEAN-2B` si el objetivo es mantener alcance mínimo; revisar luego | Media |
| H6 | `app/api/admin/leads/bulk/route.ts` | sin referencias directas a Casa Limpia/facility | no tocar todavía | No hay acople directo según la lectura actual | No tocar | Baja |
| H7 | `app/admin/constructor-crm/empresa/page.tsx` | rubro `Empresa de limpieza` y placeholders como `limpieza de hospitales y laboratorios` | conocimiento/template válido | Es una opción/heurística de Constructor, no un acople directo del core operativo | Mantener; no es prioridad de limpieza técnica | Baja |
| H8 | `app/admin/constructor-crm/reportes/page.tsx` | heurística `esLimpieza` y `limpiezaReports` | conocimiento/template válido | Sugiere reportes de limpieza según contexto; no contamina API/core por sí solo | Mantener como conocimiento de vertical | Baja |
| H9 | `app/admin/constructor-crm/motores-ia/page.tsx` | heurística `esLimpieza` y `limpiezaMotors` | conocimiento/template válido | Sugiere motores IA para limpieza/facility; no bloquea limpieza del core | Mantener como conocimiento de vertical | Baja |
| H10 | `supabase/migrations/20260428100000_casalimpia_fase1.sql` | agrega columnas facility a `public.leads` y crea tablas `cleaning_service_categories`, `cleaning_services`, etc. | migración/schema legacy | Muestra acople real en schema; tocarlo ahora rompería trazabilidad | No tocar ahora; usarlo solo como referencia para separación futura | Critica |
| H11 | `supabase/migrations/20260428110000_casalimpia_visit_completion_fields.sql` | agrega `visita_completed_at` y `visita_relevamiento_json` | migración/schema legacy | Refuerza el acople de relevamiento técnico dentro de `leads` | No tocar ahora; mantener como referencia | Alta |
| H12 | `lib/crmPackage/adapters/leadFieldPersistence.ts` | `CORE_LEAD_COLUMN_KEYS` incluye `cantidad_personal`, `superficie_m2`, `visita_scheduled_at` | campos legacy ya existentes | Parte del legacy facility ya está absorbida por el tratamiento core | No tocar en `CLEAN-2B` salvo que haya un motivo muy acotado; puede afectar persistencia | Media |
| H13 | `docs/casalimpia/README.md` | placeholder no sensible tras extracción | placeholder correcto | Ninguno; cumple separación repo madre vs activos reales | Mantener donde está | Baja |
| H14 | `docs/constructor-crm/templates/verticales/casa-limpia-ecuador/README.md` | template placeholder para futura plantilla limpia | conocimiento/template válido | Ninguno si se mantiene vacío de activos reales | Mantener donde está | Baja |
| H15 | `docs/constructor-crm/knowledge/verticales/facility-servicios/README.md` | knowledge reusable del vertical facility | conocimiento/template válido | Ninguno; es el destino correcto del aprendizaje | Mantener donde está | Baja |

---

## 3. Mapa por capas

### APIs leads

- `app/api/admin/leads/route.ts`
- `app/api/admin/leads/[id]/route.ts`

Hallazgo:
- Ambos endpoints siguen usando `CASALIMPIA_LEAD_FIELDS` como nombre de bloque.
- El problema principal no es solo la existencia de las columnas, sino que el core quedó semánticamente nombrado desde Casa Limpia.

### UI Ficha / Nuevo Lead

- `app/admin/leads/[id]/page.tsx`
- `app/admin/leads/nuevo/page.tsx`

Hallazgo:
- `Lead Detail` tiene el acople UI más fuerte: relevamiento técnico, servicios especiales y checklist operativo de limpieza/facility.
- `Nuevo Lead` arrastra algunos campos legacy (`cantidad_personal`, `superficie_m2`, `visita_scheduled_at`) pero no el bloque completo.

### Constructor empresa / reportes / motores IA

- `app/admin/constructor-crm/empresa/page.tsx`
- `app/admin/constructor-crm/reportes/page.tsx`
- `app/admin/constructor-crm/motores-ia/page.tsx`

Hallazgo:
- Aquí aparece principalmente conocimiento de vertical:
  - rubro “Empresa de limpieza”;
  - heurística `esLimpieza`;
  - sugerencias de reportes y motores de limpieza.
- Esto se parece más a conocimiento/template válido que a contaminación crítica del core.

### Migraciones / schema

- `supabase/migrations/20260428100000_casalimpia_fase1.sql`
- `supabase/migrations/20260428110000_casalimpia_visit_completion_fields.sql`

Hallazgo:
- El schema `leads` fue ampliado con columnas y JSON específicos de facility.
- También se crearon tablas de servicios de limpieza.
- Es legacy real de base de datos, pero fuera de alcance tocarlo ahora.

### Knowledge / templates / docs

- `docs/casalimpia/README.md`
- `docs/constructor-crm/templates/verticales/casa-limpia-ecuador/README.md`
- `docs/constructor-crm/knowledge/verticales/facility-servicios/README.md`

Hallazgo:
- Los tres están correctamente ubicados:
  - placeholder no sensible;
  - template placeholder;
  - knowledge reusable.

---

## 4. Cambio minimo recomendado para CLEAN-2B

### Tocar primero

- `app/api/admin/leads/route.ts`
- `app/api/admin/leads/[id]/route.ts`

### Objetivo del cambio minimo

- Neutralizar nombres `CASALIMPIA_*` si existen.
- Mantener columnas facility legacy sin borrarlas.
- Mantener compatibilidad con leads existentes.
- No tocar SQL ni migraciones.
- No intentar resolver todavía toda la UI de relevamiento.

### Estrategia recomendada

1. Renombrar la constante `CASALIMPIA_LEAD_FIELDS` a algo neutral, por ejemplo:
   - `FACILITY_LEGACY_LEAD_FIELDS`
   - `LEGACY_SITE_SURVEY_LEAD_FIELDS`
   - o similar.
2. Mantener el mismo contenido de columnas por ahora.
3. Evitar cualquier cambio de comportamiento en SELECTs y PATCHs que pueda romper lectura/escritura de leads existentes.
4. Dejar `Lead Detail` y `Nuevo Lead` fuera del primer corte de limpieza salvo ajustes mínimos de naming si fueran estrictamente necesarios.

---

## 5. Fuera de alcance para CLEAN-2B

- borrar columnas facility;
- ejecutar SQL;
- crear clon Casa Limpia;
- reescribir toda la UI;
- mover migraciones;
- tocar seguridad/auth;
- tocar Pickup.

---

## 6. Validaciones sugeridas para CLEAN-2B

- `npm run build`
- `rg -n "CASALIMPIA|casalimpia|limpieza|facility" app lib supabase docs`
- `git diff` acotado a los archivos tocados
- `git status`

---

## 7. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Archivos movidos | No |
| Datos creados | No |
| Solo documentación | Sí |
| Commit | No |

---

## 8. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Diagnóstico Casa Limpia/facility | GO |
| Implementar CLEAN-2B | GO si alcance acotado |
| Tocar SQL ahora | NO-GO |
| Borrar facility legacy ahora | NO-GO |
| Clonar Casa Limpia ahora | NO-GO |

---

## 9. Cierre

El acople Casa Limpia/facility más urgente no está en templates ni en docs, sino en el **naming y uso del bloque legacy dentro de las APIs de leads** y en una **ficha de lead fuertemente sesgada a relevamiento técnico**. El siguiente paso correcto es `CONSTRUCTOR-CLEAN-2B` con alcance mínimo: neutralizar el naming del core sin tocar schema ni reescribir todavía toda la UI.
