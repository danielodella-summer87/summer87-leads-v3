# Paquete instalable del CRM — Summer87 Leads v3

## 1. Propósito

Este documento define el contenido técnico y funcional mínimo del futuro paquete instalable que permitirá convertir una configuración validada del Constructor en un CRM operativo configurable.

La Fase 7W no ejecuta una instalación real. No crea instancias, no modifica bases de datos, no genera usuarios y no activa integraciones. Solo documenta la estructura que debería existir antes de implementar una exportación o instalación real.

## 2. Principio rector

“El paquete instalable no crea un CRM por sí solo; documenta, valida y estructura lo necesario para que un instalador humano pueda aprobar la activación.”

## 3. Qué es el paquete instalable

El paquete instalable es una representación estructurada del diseño aprobado del CRM, preparada para una futura instalación controlada.

Debe poder servir como:

- Resumen técnico.
- Manifiesto de instalación.
- Checklist operativo.
- Fuente para scripts futuros.
- Documentación de decisiones humanas.
- Registro de configuración aprobada.

## 4. Archivos conceptuales del paquete

| Archivo conceptual | Propósito | Fuente principal | Requiere validación humana |
|---|---|---|---|
| installation_manifest.json | Define identidad, versión y estado general del paquete. | Auditoría / Instalador | Sí |
| client_identity.json | Resume la identidad comercial del cliente. | Empresa / Cuestionario | Sí |
| crm_modules_config.json | Define módulos visibles en el CRM operativo. | Constructor / Preset sectorial | Sí |
| pipeline_config.json | Define etapas, columnas y reglas comerciales. | Proceso y pipeline | Sí |
| lead_fields_config.json | Define campos mínimos, sectoriales y restringidos. | Constructor / Preset | Sí |
| permissions_config.json | Define roles y accesos. | Instalador / Matriz de permisos | Sí |
| users_seed_plan.json | Documenta usuarios previstos sin crearlos. | Instalador humano | Sí |
| branding_config.json | Define nombre, logo, colores y textos base. | Empresa / Instalador | Sí |
| ai_rules_config.json | Define motores IA permitidos y bloqueados. | Motores IA / Auditoría | Sí |
| reports_config.json | Define reportes iniciales y KPIs visibles. | Reportes / Auditoría | Sí |
| integrations_config.json | Define integraciones activas, pendientes o bloqueadas. | Constructor / Integraciones | Sí |
| helpdesk_config.json | Define configuración inicial de mesa de ayuda. | Preset / Instalador | Sí |
| agenda_config.json | Define eventos, responsables y recordatorios. | Constructor / Agenda | Sí |
| legacy_cleanup_plan.json | Documenta limpieza futura sin borrar datos. | Auditoría / Datos heredados | Sí |
| installer_decisions.json | Registra decisiones humanas del instalador. | Instalador humano | Sí |
| activation_checklist.json | Consolida condiciones previas a activación. | Auditoría / Checklist 7V | Sí |

## 5. installation_manifest.json

Debe contener:

- packageVersion.
- generatedAt.
- generatedBy.
- sourceConstructorId.
- targetClientName.
- targetEnvironment.
- installationMode.
- requiresHumanConfirmation.
- blockedActions.
- validationStatus.

No debe contener claves secretas, tokens, credenciales, service role keys ni datos sensibles de infraestructura.

## 6. client_identity.json

Debe contener:

- Nombre comercial.
- Nombre legal.
- Rubro.
- Vertical.
- País.
- Ciudad.
- Sitio web.
- Contactos principales.
- Notas del instalador.

## 7. crm_modules_config.json

Debe definir los módulos visibles para el cliente final:

- Leads.
- Kanban.
- Agenda.
- Reportes.
- IA permitida.
- Mesa de ayuda.
- Neuroventas.
- Configuración limitada.
- Otros módulos según preset.

El Constructor y el Instalador quedan ocultos al cliente final. Solo Summer87, instalador o superadmin pueden acceder a esas zonas.

## 8. pipeline_config.json

Debe definir:

- Etapas.
- Columnas Kanban.
- Estados ganados/perdidos.
- Reglas mínimas de seguimiento.
- Próximas acciones.
- Campos obligatorios por etapa.
- Restricciones de edición.

## 9. lead_fields_config.json

Debe definir:

- Campos mínimos de lead.
- Campos comerciales.
- Campos sectoriales.
- Campos obligatorios.
- Campos opcionales.
- Campos ocultos.
- Campos de IA sugerida.
- Campos no editables por cliente.

## 10. permissions_config.json

Debe definir estos roles base:

- Superadmin Summer87.
- Instalador.
- Admin cliente.
- Comercial cliente.
- Lectura/reportes.
- Soporte.

El cliente final no accede al Constructor ni al Instalador.

## 11. users_seed_plan.json

Este archivo no crea usuarios automáticamente.

Solo documenta:

- Usuarios previstos.
- Roles sugeridos.
- Invitaciones pendientes.
- Estado de aprobación humana.

## 12. branding_config.json

Debe definir:

- Nombre visible del CRM.
- Logo.
- Colores.
- Tono visual.
- Textos base.
- Nombre de menú.
- Favicon futuro si corresponde.

## 13. ai_rules_config.json

Debe definir:

- Motores IA habilitados.
- Motores IA en sugerencia.
- Límites de uso.
- Decisiones que requieren humano.
- Datos que no debe usar la IA.
- Prompts base.
- Tono de respuesta.
- Alertas de seguridad.

Toda IA sensible queda bloqueada hasta aprobación humana.

## 14. reports_config.json

Debe definir:

- Reportes iniciales.
- KPIs visibles.
- Reportes internos.
- Reportes del cliente.
- Frecuencia sugerida.
- Limitaciones de datos.

## 15. integrations_config.json

Debe definir:

- Integraciones previstas.
- Integraciones activas.
- Integraciones pendientes.
- Modo solo lectura.
- Dependencias externas.
- Credenciales no incluidas.

Zeta permanece solo lectura hasta nuevo aviso.

## 16. helpdesk_config.json

Debe definir:

- Categorías iniciales.
- Estados.
- Prioridades.
- Responsables.
- SLA sugerido.
- Visibilidad del cliente.

## 17. agenda_config.json

Debe definir:

- Tipos de eventos.
- Responsables.
- Recordatorios.
- Relación con oportunidades.
- Restricciones por rol.

## 18. legacy_cleanup_plan.json

Debe definir:

- Datos heredados detectados.
- Datos de prueba.
- Datos a conservar.
- Datos a revisar.
- Datos a eliminar en fase futura.

Este archivo no borra nada. Solo documenta limpieza pendiente.

## 19. installer_decisions.json

Debe registrar decisiones humanas:

- Supabase propio o compartido.
- Nombre final de instancia.
- Módulos activos.
- Preset aceptado.
- Reportes habilitados.
- IA permitida.
- Datos de ejemplo sí/no.
- Usuarios iniciales sí/no.
- Fecha de activación prevista.
- Responsable aprobador.

## 20. activation_checklist.json

Debe definir el checklist mínimo:

- Auditoría aprobada.
- Empresa identificada.
- Pipeline revisado.
- Campos revisados.
- Permisos definidos.
- Integraciones marcadas.
- IA revisada.
- Limpieza revisada.
- Confirmación humana.

## 21. Qué puede automatizarse en el futuro

En fases futuras se podría automatizar:

- Generación del paquete JSON.
- Validación de estructura.
- Comparación contra checklist.
- Detección de campos faltantes.
- Sugerencia de módulos.
- Sugerencia de pipeline.
- Sugerencia de reportes.
- Resumen para instalador.

## 22. Qué debe permanecer bloqueado

Debe permanecer bloqueado:

- Creación de Supabase real.
- Escritura en Zeta.
- Borrado de datos heredados.
- Invitación automática de usuarios.
- Activación de IA sensible.
- Exposición del Constructor al cliente final.
- Publicación en producción.
- Creación de CRM sin confirmación humana.

## 23. Flujo futuro de instalación

Flujo conceptual:

1. Constructor completo.
2. Auditoría final.
3. Checklist previo.
4. Generación de paquete instalable.
5. Revisión humana.
6. Correcciones del instalador.
7. Confirmación de activación.
8. Instalación controlada.
9. Validación post-instalación.
10. Entrega al cliente final.

## 24. Criterios de aceptación futura

- El paquete no contiene secretos.
- El paquete no ejecuta acciones por sí mismo.
- El cliente final no ve el Constructor.
- El instalador puede revisar cada decisión.
- El paquete distingue sugerencias de decisiones aprobadas.
- Toda integración externa queda marcada como activa, pendiente o bloqueada.
- Toda IA sensible requiere aprobación humana.
- Toda limpieza de datos requiere validación explícita.
- La ruta comercial canónica sigue siendo /admin/leads.

## 25. Relación con fases futuras

Fases sugeridas:

- 7X — Vista estática del manifiesto instalable en Auditoría.
- 7Y — Export JSON simulado descargable, sin instalación.
- 7Z — Validador local del paquete instalable.
- 8A — Endpoint interno para generar paquete instalable.
- 8B — Instalación controlada en entorno piloto.
- 8C — Activación real con permisos y logs.
