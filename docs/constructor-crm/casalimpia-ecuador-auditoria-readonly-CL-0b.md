# Casa Limpia Ecuador auditoría read-only CL-0b

## 1. Resumen ejecutivo

- `CL-0b` audita Casa Limpia sin modificar nada.
- El repo ya fue parcialmente saneado.
- Hay conocimiento útil para Casa Limpia.
- Hay deuda UI facility documentada.
- El clon todavía es `NO-GO`.
- **Dictamen preliminar:** `GO` para pasar a `CL-0c` y definir el contrato CRM Casa Limpia; `NO-GO` para crear el clon ahora.

## 2. Estado heredado relevante

| elemento | estado actual | utilidad para Casa Limpia | riesgo | decisión preliminar |
|----------|---------------|---------------------------|--------|---------------------|
| `FACILITY_LEGACY_LEAD_FIELDS` | activo en `app/api/admin/leads/route.ts` y `app/api/admin/leads/[id]/route.ts` con naming neutral | sirve como inventario real de columnas legacy disponibles | puede confundirse con contrato definitivo si se toma tal cual | usar solo como base heredada; decisión final en `CL-0c` |
| Columnas facility en schema | presentes en migraciones `20260428100000` y `20260428110000` | dan una base ya materializada para visita, superficie y contexto operativo | arrastran decisiones legacy de schema no validadas aún como contrato | no tocarlas ahora; evaluarlas en `CL-0c` |
| UI `Relevamiento de visita` | fuerte en `app/admin/leads/[id]/page.tsx` | sirve como referencia funcional para Casa Limpia | está hardcodeada y mezcla CRM con operación facility | reutilizar solo como insumo de diseño, no como herencia automática |
| `Nuevo Lead` / `Datos operativos opcionales` | visible en `app/admin/leads/nuevo/page.tsx` fuera de `client_crm` | aporta campos mínimos operativos ya pensados | contamina el formulario general si se deja sin parametrizar | tratarlo como deuda menor y decidir su forma final en `CL-0c` |
| `docs/casalimpia/README.md` placeholder | presente y correcto | confirma separación repo madre vs activos reales | bajo | mantener tal como está |
| Knowledge facility | `docs/constructor-crm/knowledge/verticales/facility-servicios/README.md` | útil como base de vertical y vocabulario funcional | bajo | expandirlo luego con conocimiento reusable, no con activos reales |
| Template Casa Limpia placeholder | `docs/constructor-crm/templates/verticales/casa-limpia-ecuador/README.md` | define bien el destino futuro del template | bajo | poblarlo recién después de `CL-0c` |
| Activos reales extraídos | fuera del repo por `EXTRACT-1B` | ningún uso directo dentro del repo | crítico si regresan a Git | mantener fuera del repo |
| Pickup fallback removido | ya no existe fallback automático en core | evita contaminación técnica hacia Casa Limpia | bajo | mantener cerrado |
| UI vehículo/Pickup pendiente | visible sobre todo en `app/admin/leads/page.tsx` | no sirve para Casa Limpia | puede contaminar un clon si no se oculta por vertical | documentar como frente separado a revisar antes del clon |

## 3. Elementos reutilizables para Casa Limpia

| elemento | por qué sirve | cómo debería reutilizarse | fase sugerida |
|----------|---------------|---------------------------|---------------|
| Relevamiento de visita | refleja un flujo real de visita técnica comercial-operativa | convertirlo en referencia para contrato funcional, no copiarlo sin filtrar | `CL-0c` |
| Campos `superficie_m2`, `cantidad_personal`, `zonas_criticas`, `restricciones_acceso`, `requerimientos_especiales` | son típicos del vertical facility/limpieza | usar como candidatos a campos específicos del contrato | `CL-0c` |
| `visita_scheduled_at` / `visita_completed_at` | modelan bien la agenda y ejecución de visita | conservarlos como candidatos fuertes a primera versión | `CL-0c` |
| `visita_relevamiento_json` | permite capturar checklist/observaciones sin fijar todo en columnas | usarlo para detalle operativo flexible | `CL-0c` |
| Servicios especiales | muestran la lógica del vertical (vidrios, fumigación, jardinería, paneles) | traducirlos a catálogo o checklist parametrizable | `CL-0c` / posterior |
| Template facility | ya reserva el lugar correcto para la futura plantilla | poblarlo con config/example y guía del vertical, no con cliente real | posterior a `CL-0c` |
| Knowledge vertical facility | ya contiene reutilizaciones y campos típicos | fortalecerlo como base analítica del vertical | paralelo a `CL-0c` |
| Estrategia de instancia limpia `CL-0a` | fija separación de Supabase, Vercel, QA, Constructor y cliente | tomarla como restricción obligatoria del diseño Casa Limpia | vigente desde ahora |

## 4. Elementos que NO deben pasar al clon

| elemento | motivo | acción sugerida |
|----------|--------|-----------------|
| Activos reales binarios | son materiales reales/sensibles del cliente | mantenerlos fuera de Git y fuera del clon |
| Docs históricos del Constructor | mezclan auditorías, fases y decisiones internas | no exponerlos al cliente; dejar en repo madre |
| QA Pickup | pertenece a otro vertical y otra historia de validación | no migrar datos ni docs al clon |
| Filtros / badges de vehículo | son frente Pickup/automotriz, no Casa Limpia | ocultar o excluir del clon |
| Constructor visible al cliente | contradice la estrategia de instancia limpia | ocultarlo completamente en el clon |
| Datos demo | contaminan narrativa comercial y operación | crear QA propio de Casa Limpia con prefijo dedicado |
| SQL no revisado como contrato | las migraciones legacy no equivalen a diseño final | no ejecutar ni copiar sin pasar por `CL-0c` / fase SQL |
| Naming cliente en core | ya fue neutralizado y no debe reintroducirse | mantener naming técnico/genérico |

## 5. Deudas abiertas antes del clon

| deuda | riesgo | bloquea CL-0c | bloquea clon | acción recomendada |
|-------|--------|---------------|--------------|--------------------|
| UI facility hardcodeada en ficha | alto | No | Sí | decidir qué parte es contrato y qué parte es módulo parametrizable |
| Columnas legacy vs `contract_fields_json` | alto | Sí | Sí | resolver en `CL-0c` con criterio explícito |
| Pipeline Casa Limpia no definido | medio | Sí | Sí | definir pipeline comercial preliminar y luego validarlo |
| Roles / permisos mínimos | medio | Sí | Sí | definir perfil cliente vs Summer87 |
| Seed mínimo | medio | Sí | Sí | diseñar QA mínimo `qa_cl_` |
| Supabase / Vercel propios | alto | No | Sí | mantener como requisito de instancia limpia |
| Constructor oculto | alto | No | Sí | establecer regla obligatoria del clon |
| Datos QA Casa Limpia | medio | Sí | Sí | definir qué está permitido y qué no |
| UI Pickup / vehículo pendiente en lista | medio | No | Sí | revisar exclusión por vertical antes del clon |

## 6. Propuesta preliminar de contrato Casa Limpia

### Campos core

- `nombre`
- `contacto`
- `telefono`
- `email`
- `origen`
- `pipeline`
- `notas`
- `comercial_responsable`
- `direccion`

### Campos específicos sugeridos

- `tipo_cliente`
- `tipo_servicio`
- `frecuencia`
- `superficie_m2`
- `cantidad_personal`
- `cantidad_pisos`
- `cantidad_banos`
- `horario_operacion`
- `zonas_criticas`
- `restricciones_acceso`
- `requiere_visita`
- `visita_scheduled_at`
- `visita_completed_at`
- `visita_relevamiento_json`
- `requerimientos_especiales`
- `notas_instalacion`
- `servicios_especiales`

### Pendiente de decisión CL-0c

- cuáles van a columnas existentes;
- cuáles van a `contract_fields_json`;
- cuáles quedan solo en `visita_relevamiento_json`;
- cuáles se ocultan en primera versión.

### Criterio preliminar recomendado

- Mantener como candidatos fuertes a columna existente:
  - `superficie_m2`
  - `cantidad_personal`
  - `visita_scheduled_at`
  - `visita_completed_at`
- Mantener como candidatos a JSON / campos flexibles:
  - `zonas_criticas`
  - `restricciones_acceso`
  - `requerimientos_especiales`
  - `servicios_especiales`
- Mantener `visita_relevamiento_json` como contenedor operativo detallado.
- No cerrar esta decisión en `CL-0b`; dejarla explícitamente para `CL-0c`.

## 7. Pipeline preliminar sugerido

- `Nuevo lead`
- `Contactado`
- `Relevamiento pendiente`
- `Visita agendada`
- `Cotización en preparación`
- `Cotización enviada`
- `Negociación`
- `Ganado`
- `Perdido`

Este pipeline es preliminar y debe validarse en `CL-0c`.

## 8. Módulos visibles / ocultos

| módulo | visible cliente | visible Summer87 | decisión preliminar |
|--------|-----------------|------------------|---------------------|
| Leads | Sí | Sí | visible |
| Ficha | Sí | Sí | visible, pero requiere definición de alcance facility |
| Lista | Sí | Sí | visible |
| Kanban | Sí | Sí | visible |
| Agenda | Sí | Sí | visible si soporta seguimiento/visitas |
| Reportes | quizá luego | Sí | acotar en primera versión |
| IA | asistida, no autónoma | Sí | visible con límites |
| Constructor | No | Sí | oculto para cliente |
| Configuración | mínima o restringida | Sí | cliente con acceso restringido |
| Mesa de ayuda | opcional | Sí | no prioritaria para primera versión |

## 9. Reglas de IA / automatización preliminares

- IA puede sugerir próximos pasos comerciales.
- IA puede detectar leads con visita pendiente.
- IA puede sugerir checklist de relevamiento.
- IA no debe enviar cotizaciones ni contratos sin aprobación humana.
- IA no debe modificar datos sensibles sin confirmación.
- Todo esto queda preliminar.

## 10. Criterios para CL-0c

`CL-0c` debe resolver:

- contrato CRM definitivo;
- campos finales;
- decisión columnas vs `contract_fields_json`;
- pipeline final;
- módulos visibles;
- usuarios / roles mínimos;
- seed mínimo;
- criterios de QA;
- qué hacer con UI facility actual.

## 11. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| `CL-0b` auditoría read-only | GO |
| Pasar a `CL-0c` contrato Casa Limpia | GO |
| Crear clon Casa Limpia ahora | NO-GO |
| Tocar SQL ahora | NO-GO |
| Tocar UI ahora | NO-GO |
| Usar activos reales en repo | NO-GO |
| Usar knowledge facility | GO |

## 12. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |

## 13. Próximo paso recomendado

- `CL-0c — contrato CRM Casa Limpia Ecuador`
- No crear clon todavía.
