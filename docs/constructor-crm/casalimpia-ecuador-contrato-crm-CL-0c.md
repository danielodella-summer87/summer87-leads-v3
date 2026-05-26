# Casa Limpia Ecuador contrato CRM CL-0c

## 1. Resumen ejecutivo

- Este documento define el contrato funcional preliminar Casa Limpia Ecuador.
- No implementa ni clona.
- Sirve como base para `CL-0d`.
- Define qué entra en primera versión y qué queda fuera.
- **Dictamen:** `GO` documental para pasar a diseño de entorno, seed mínimo y plan de implementación; `NO-GO` para clonar todavía.

## 2. Objetivo del CRM Casa Limpia

Casa Limpia Ecuador necesita un CRM comercial-operativo para gestionar:

- captura y seguimiento de leads;
- clasificación comercial;
- agenda de visitas;
- relevamientos técnicos/comerciales;
- preparación de cotizaciones;
- seguimiento hasta cierre.

Este CRM:

- **no** es ERP;
- **no** es sistema contable;
- **no** es un gestor completo de operaciones de limpieza todavía;
- **no** reemplaza la ejecución operativa diaria, nómina o facturación.

La primera versión queda orientada a:

- prospección comercial;
- diagnóstico inicial del cliente;
- visita y relevamiento;
- transición ordenada hacia cotización y negociación.

## 3. Alcance de primera versión

### Entra en primera versión

- Leads
- Lista de leads
- Ficha de lead
- Kanban comercial
- Agenda básica de seguimiento / visita
- Captura de campos core
- Captura de campos específicos Casa Limpia
- Registro de visita y relevamiento
- Sugerencias IA comerciales y de seguimiento

### Queda fuera de primera versión

- ERP / contabilidad
- planificación operativa completa de cuadrillas
- compras / inventario / logística avanzada
- contratos autoemitidos por IA
- automatizaciones autónomas con impacto comercial sin aprobación humana
- reportes avanzados multiárea
- mesa de ayuda como módulo prioritario

## 4. Principios de diseño

- Casa Limpia debe nacer como clon limpio, no como extensión de la base madre.
- El Constructor no debe ser visible al cliente final.
- El contrato CRM debe reutilizar conocimiento y patrones, no arrastrar QA ni branding de otros verticales.
- Las columnas legacy facility ya existentes se pueden aprovechar si ayudan, pero no deben forzar el diseño final.
- La UI facility actual sirve como referencia funcional, no como herencia obligatoria.

## 5. Campos core

| Campo | Obligatorio | Motivo |
|-------|-------------|--------|
| `nombre` | Sí | identificación principal del lead / cuenta |
| `contacto` | Sí | referente inicial |
| `telefono` | Sí | contacto comercial |
| `email` | Sí | seguimiento comercial |
| `origen` | Sí | atribución de lead |
| `pipeline` | Sí | etapa comercial |
| `notas` | No | contexto libre |
| `comercial_responsable` | Sí | ownership |
| `direccion` | No | ubicación del servicio / visita |

## 6. Campos específicos Casa Limpia

| Campo | Primera versión | Motivo |
|-------|-----------------|--------|
| `tipo_cliente` | Sí | segmentación comercial |
| `tipo_servicio` | Sí | define alcance del interés |
| `frecuencia` | Sí | condiciona cotización |
| `superficie_m2` | Sí | insumo principal del relevamiento |
| `cantidad_personal` | Sí | referencia operativa/comercial |
| `cantidad_pisos` | Sí | complejidad del servicio |
| `cantidad_banos` | Sí | dimensionamiento |
| `horario_operacion` | Sí | restricción operativa clave |
| `zonas_criticas` | Sí | complejidad / prioridad |
| `restricciones_acceso` | Sí | viabilidad del servicio |
| `requiere_visita` | Sí | habilita flujo de agenda |
| `visita_scheduled_at` | Sí | agenda de visita |
| `visita_completed_at` | Sí | cierre de visita |
| `visita_relevamiento_json` | Sí | detalle operativo flexible |
| `requerimientos_especiales` | Sí | condiciones fuera de estándar |
| `notas_instalacion` | No | observaciones técnicas |
| `servicios_especiales` | Sí | fumigación, jardinería, vidrios, etc. |

## 7. Decisión preliminar: columnas vs `contract_fields_json` vs `visita_relevamiento_json`

### Mantener en columnas existentes

Campos que ya existen en schema y tienen alta probabilidad de ser útiles desde el día 1:

- `superficie_m2`
- `cantidad_personal`
- `cantidad_pisos`
- `cantidad_banos`
- `horario_operacion`
- `restricciones_acceso`
- `zonas_criticas`
- `requerimientos_especiales`
- `notas_instalacion`
- `visita_scheduled_at`
- `visita_completed_at`

### Candidatos a `contract_fields_json`

Campos que conviene tratar como contrato funcional configurable y no atar todavía a schema fijo:

- `tipo_cliente`
- `tipo_servicio`
- `frecuencia`
- `requiere_visita`
- `servicios_especiales`
- cualquier taxonomía comercial propia de Casa Limpia que aún no esté estabilizada

### Mantener en `visita_relevamiento_json`

Campos de checklist operativo, observación y detalle flexible:

- listas/flags de condiciones del sitio;
- observaciones de relevamiento;
- necesidades de EPP, maquinaria o insumos;
- detalle de servicios especiales;
- cualquier dato de visita que todavía no merezca columna propia.

### Decisión pendiente

`CL-0c` fija esta propuesta preliminar, pero la decisión final de mapeo debe cerrarse antes de SQL en `CL-0d / CL-SQL`.

## 8. Pipeline preliminar

| Etapa | Objetivo |
|------|----------|
| `Nuevo lead` | ingreso inicial |
| `Contactado` | primer contacto realizado |
| `Relevamiento pendiente` | requiere diagnóstico/visita |
| `Visita agendada` | visita calendarizada |
| `Cotización en preparación` | relevamiento completo, propuesta en armado |
| `Cotización enviada` | propuesta enviada |
| `Negociación` | revisión comercial |
| `Ganado` | cierre exitoso |
| `Perdido` | cierre no exitoso |

Este pipeline es preliminar y debe validarse funcionalmente antes de implementación.

## 9. Módulos visibles / ocultos

| Módulo | Cliente | Summer87 | Decisión |
|--------|---------|----------|----------|
| Leads | Sí | Sí | visible |
| Ficha | Sí | Sí | visible |
| Lista | Sí | Sí | visible |
| Kanban | Sí | Sí | visible |
| Agenda | Sí | Sí | visible |
| Reportes | limitado | Sí | acotado en v1 |
| IA | Sí, con límites | Sí | visible asistida |
| Constructor | No | Sí | oculto |
| Configuración | restringida | Sí | acceso mínimo para cliente |
| Mesa de ayuda | opcional | Sí | fuera de prioridad inicial |

## 10. Roles mínimos

| Rol | Objetivo |
|-----|----------|
| `superadmin_summer87` | instalación, soporte, gobierno del clon |
| `admin_casalimpia` | dueño/gerencia del CRM |
| `comercial_casalimpia` | seguimiento comercial y gestión de leads |
| `operativo_casalimpia` | lectura/carga de visita y relevamiento, si aplica |

### Reglas mínimas

- El cliente no accede al Constructor.
- Summer87 conserva capacidad de administración técnica.
- El acceso operativo debe ser más acotado que el administrativo.

## 11. Reglas de IA

- IA puede sugerir próximos pasos comerciales.
- IA puede detectar leads con visita pendiente.
- IA puede sugerir checklist de relevamiento.
- IA puede resumir notas y contexto comercial.
- IA no debe enviar cotizaciones ni contratos sin aprobación humana.
- IA no debe modificar datos sensibles sin confirmación.
- IA no debe ejecutar automatizaciones críticas sin revisión.

## 12. Seed QA permitido

### Permitido

- leads sintéticos o internos identificados con origen `qa_cl_`;
- usuarios mínimos de prueba controlados;
- datos claramente no reales;
- ejemplos de servicios y escenarios comunes del vertical.

### Prohibido

- activos reales de Casa Limpia;
- contactos reales sin autorización;
- cotizaciones reales;
- contratos reales;
- datos mezclados de Pickup o de otros verticales;
- cualquier binario comercial del cliente dentro del repo madre.

## 13. Qué queda fuera o pendiente

- parametrización final de la UI facility actual;
- decisión final de columnas vs `contract_fields_json` vs `visita_relevamiento_json`;
- SQL/migraciones para el clon;
- Supabase y Vercel propios;
- ocultamiento final de UI Pickup/vehículo;
- seed definitivo y branding final.

## 14. Criterios para pasar a CL-0d

`CL-0d` puede comenzar cuando queden definidos:

- contrato CRM funcional aprobado;
- lista final de campos;
- mapeo preliminar de almacenamiento;
- pipeline validado;
- módulos visibles / ocultos;
- roles mínimos;
- seed QA permitido;
- criterio explícito sobre la UI facility heredada.

## 15. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Contrato CRM documental `CL-0c` | GO |
| Pasar a `CL-0d` | GO |
| Crear clon Casa Limpia ahora | NO-GO |
| Tocar SQL ahora | NO-GO |
| Tocar Supabase/Vercel ahora | NO-GO |
| Usar activos reales | NO-GO |
| Reutilizar knowledge facility | GO |

## 16. Confirmación de alcance

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

## 17. Próximo paso recomendado

- `CL-0d — diseño Supabase / Vercel / env Casa Limpia Ecuador`
- No crear clon todavía.
