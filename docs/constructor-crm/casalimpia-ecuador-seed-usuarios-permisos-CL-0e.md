# Casa Limpia Ecuador seed usuarios permisos CL-0e

## 1. Resumen ejecutivo

- `CL-0e` diseña el seed mínimo futuro.
- No crea usuarios, datos, SQL ni Supabase.
- Define usuarios, roles, módulos, pipeline y QA mínimo.
- Sirve como insumo para `CL-0f` / checklist Go-No Go pre-clon.
- **Dictamen:** `GO` documental para diseñar seed y acceso; `NO-GO` para crear usuarios o datos ahora.

## 2. Principios del seed mínimo

- mínimo necesario para validar el clon;
- sin datos reales sin autorización;
- sin activos reales binarios;
- sin QA Pickup;
- sin Constructor visible al cliente;
- trazabilidad de qué es QA;
- prefijo `qa_cl_`;
- posibilidad de borrar/recrear el seed.

### Regla operativa adicional

Siguiendo el aprendizaje de `docs/seed-minimo-nuevo-entorno-easy.md`, un entorno nuevo no debe considerarse válido solo con usuarios: el seed futuro debe contemplar al menos roles, permisos, asignación de permisos por rol y settings mínimos coherentes con la UI y el RBAC.

## 3. Usuarios propuestos

| usuario conceptual | rol | email real o placeholder | requerido primera versión | observación |
|--------------------|-----|--------------------------|---------------------------|-------------|
| Daniel / Summer87 admin | `summer87_admin` | placeholder | Sí | gobierno técnico y soporte |
| gerente Casa Limpia | `client_owner` | placeholder | Sí | dueño funcional del CRM |
| comercial/coordinador Casa Limpia | `client_manager` | placeholder | Sí | operación comercial diaria |
| operador futuro | `client_operator` | placeholder | No | puede entrar en fase posterior |
| usuario QA interno | `qa_internal` | placeholder | Sí | validación controlada del entorno |

### Aclaraciones

- no crear usuarios reales todavía;
- los emails finales requieren confirmación;
- los usuarios reales quedan para fase posterior.

## 4. Roles propuestos

| rol | descripción | permisos principales | restricciones | visible cliente sí/no |
|-----|-------------|----------------------|---------------|-----------------------|
| `summer87_admin` | control técnico y funcional del clon | acceso amplio a módulos, revisión de configuración, QA, soporte | no debe confundirse con usuario operativo del cliente | No |
| `installer_admin` | rol temporal de instalación / configuración inicial | setup, validación de entorno, revisión de flags y módulos | no debe permanecer como rol visible al cliente final | No |
| `client_owner` | dueño / gerente Casa Limpia | ver y editar CRM operativo, revisar reportes, gestionar pipeline/usuarios según alcance | no accede al Constructor | Sí |
| `client_manager` | comercial/coordinador | gestionar leads, agenda, kanban, fichas y documentos comerciales | acceso restringido a configuración sensible | Sí |
| `client_operator` | apoyo operativo / relevamiento | ver, actualizar ciertos campos y seguimiento | sin acceso a configuración ni cambios globales | Sí |
| `qa_internal` | usuario de prueba controlado | recorrer módulos y validar comportamientos | no debe operar como usuario final real | No |

### Regla central

- cliente no accede al Constructor.
- Summer87/instalador sí puede acceder al Constructor en repo madre, pero no en superficie cliente.

## 5. Permisos mínimos por módulo

| módulo | summer87_admin | client_owner | client_manager | client_operator | qa_internal |
|--------|----------------|--------------|----------------|-----------------|-------------|
| Leads | editar | editar | editar | crear | editar |
| Ficha | editar | editar | editar | limitado | editar |
| Lista | editar | ver | ver | ver | ver |
| Kanban | editar | editar | editar | limitado | editar |
| Agenda | editar | editar | editar | limitado | editar |
| Reportes | editar | ver | limitado | no | ver |
| IA asistida | editar | limitado | limitado | no | limitado |
| Configuración | editar | limitado | no | no | no |
| Constructor | editar | no | no | no | no |
| Mesa de ayuda | editar | limitado | limitado | no | ver |
| Documentos/cotizaciones | editar | editar | editar | limitado | ver |

### Nota

`installer_admin` debe comportarse de forma similar a `summer87_admin` durante la instalación, pero como rol temporal y no visible al cliente.

## 6. Módulos habilitados primera versión

| módulo | habilitado sí/no | visible cliente | observación |
|--------|------------------|-----------------|-------------|
| Leads | Sí | Sí | módulo central |
| Ficha | Sí | Sí | incluye definición posterior del alcance facility |
| Lista | Sí | Sí | vista base comercial |
| Kanban | Sí | Sí | seguimiento de pipeline |
| Agenda | Sí | Sí | soporte de visitas y seguimiento |
| Reportes básicos | Sí | Sí, limitado | validar solo lo esencial |
| IA asistida | Sí | Sí, con límites | no autónoma |
| Constructor | Sí | No | oculto al cliente |
| Configuración | Sí | Restringido | acceso mínimo |
| Mesa de ayuda | No inicial / opcional | No o posterior | no prioritaria |
| Documentos/cotizaciones | Sí, básico | Sí | estado/proceso primero, generación completa posterior |

### Dictamen preliminar

- Leads/Ficha/Lista/Kanban/Agenda: sí.
- Reportes básicos: sí.
- IA asistida: sí con límites.
- Constructor: no visible cliente.
- Mesa de ayuda: opcional/posterior.
- Documentos/cotizaciones: estado/proceso primero, generación completa posterior.

## 7. Pipeline seed inicial

| orden | etapa | objetivo | acción esperada | cierre |
|------|-------|----------|-----------------|--------|
| 1 | `Nuevo lead` | registrar ingreso inicial | completar datos mínimos | No |
| 2 | `Contactado` | confirmar primer contacto | registrar llamada / mensaje / respuesta | No |
| 3 | `Calificado` | validar potencial real | confirmar interés, tipo de cliente y alcance inicial | No |
| 4 | `Relevamiento pendiente` | marcar necesidad de visita | preparar agenda y condiciones | No |
| 5 | `Visita agendada` | fijar fecha de visita | asignar seguimiento y fecha | No |
| 6 | `Visita realizada` | cerrar visita | cargar relevamiento y observaciones | No |
| 7 | `Cotización en preparación` | iniciar armado comercial | estructurar propuesta | No |
| 8 | `Cotización enviada` | dejar propuesta presentada | registrar envío y fecha | No |
| 9 | `Negociación` | seguimiento de objeciones/cambios | actualizar estado comercial | No |
| 10 | `Ganado` | cierre exitoso | confirmar acuerdo | Sí |
| 11 | `Perdido` | cierre no exitoso | registrar motivo de pérdida | Sí |

## 8. Estados / etiquetas iniciales

Etiquetas o estados sugeridos:

- `requiere_visita`
- `visita_agendada`
- `visita_realizada`
- `cotizacion_pendiente`
- `cotizacion_enviada`
- `alta_prioridad`
- `oportunidad_fria`
- `oportunidad_caliente`
- `qa_cl`

Aclaración:

- solo diseño, no creación.

## 9. Leads QA permitidos

| nombre | tipo_cliente | tipo_servicio | etapa inicial | campos mínimos | objetivo de prueba |
|--------|--------------|---------------|---------------|----------------|--------------------|
| `qa_cl_oficina_pequena` | oficina | limpieza recurrente | `Calificado` | nombre, contacto, origen, `superficie_m2`, `frecuencia`, `requiere_visita` | validar flujo comercial básico |
| `qa_cl_edificio_mediano` | edificio | limpieza facility | `Relevamiento pendiente` | nombre, dirección, `cantidad_pisos`, `zonas_criticas`, `visita_scheduled_at` | validar agenda y relevamiento |
| `qa_cl_servicio_domestico` | residencial/doméstico | servicio doméstico | `Contactado` | nombre, contacto, tipo_servicio, frecuencia, notas | validar segmentación distinta |
| `qa_cl_local_comercial` | local comercial | limpieza eventual | `Visita agendada` | nombre, dirección, `restricciones_acceso`, `visita_scheduled_at` | validar visita programada |
| `qa_cl_limpieza_eventual` | evento / puntual | limpieza eventual | `Cotización en preparación` | nombre, tipo_servicio, `requerimientos_especiales`, `servicios_especiales` | validar transición a cotización |

## 10. Datos prohibidos

- datos reales del cliente sin autorización;
- teléfonos reales;
- emails reales sin confirmación;
- contratos/cotizaciones reales;
- activos binarios reales;
- QA Pickup;
- datos de otros clientes;
- passwords o secretos;
- service role keys;
- tokens.

## 11. Seed técnico conceptual

Un seed futuro debería incluir:

- roles;
- usuarios placeholders;
- pipeline;
- módulos visibles;
- settings de branding mínimos;
- leads QA;
- permisos;
- configuración IA básica;
- flags para ocultar Constructor.

### Tablas / piezas conceptuales mínimas

- `roles`
- `permissions`
- `role_permissions`
- `app_users`
- `app_credentials` o mecanismo equivalente
- `config` o settings mínimos del portal

### Aclaración

- no SQL ahora;
- no JSON final ahora salvo estructura conceptual;
- seed real se diseña o ejecuta en fase posterior.

## 12. Reglas de IA para seed

- IA activada solo en modo asistido;
- no ejecutar acciones sensibles;
- puede sugerir siguiente acción;
- puede resumir relevamiento;
- puede ayudar a preparar borrador;
- no enviar cotizaciones;
- no borrar leads;
- no modificar datos sin confirmación.

## 13. Checklist de validación del seed

- login admin interno;
- login cliente owner;
- cliente no ve Constructor;
- cliente ve Leads/Ficha/Lista/Kanban/Agenda;
- pipeline cargado;
- leads QA con prefijo `qa_cl_`;
- no hay QA Pickup;
- no hay activos reales;
- IA no ejecuta acciones autónomas;
- reportes básicos no rompen;
- `git status` clean antes/después si aplica.

## 14. Relación con CL-0f

- `CL-0e` diseña el seed.
- `CL-0f` debe convertir esto en checklist Go/No-Go pre-clon.
- `CL-1a` recién podría crear carpeta clon si `CL-0f` da `GO`.

## 15. Riesgos

| riesgo | impacto | mitigación |
|--------|---------|------------|
| crear usuarios reales antes de tiempo | alto | usar placeholders hasta confirmación explícita |
| mezclar QA con datos reales | alto | prefijo `qa_cl_` y política de datos prohibidos |
| dejar Constructor visible | alto | flags + permisos + checklist de validación |
| usar emails no confirmados | medio/alto | no crear usuarios reales en esta fase |
| copiar QA Pickup | alto | seed Casa Limpia totalmente separado |
| sobredimensionar roles | medio | empezar con matriz mínima |
| confundir seed QA con operación real | alto | etiquetar todo QA y mantenerlo recreable |

## 16. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Diseño seed mínimo | GO |
| Crear usuarios ahora | NO-GO |
| Crear datos ahora | NO-GO |
| Ejecutar SQL ahora | NO-GO |
| Tocar Supabase ahora | NO-GO |
| Pasar a `CL-0f` | GO |
| Crear clon ahora | NO-GO |

## 17. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Usuarios creados | No |
| Carpetas cliente creadas | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |

## 18. Próximo paso recomendado

- `CL-0f — checklist Go/No-Go técnico pre-clon Casa Limpia`
- No crear clon todavía.
