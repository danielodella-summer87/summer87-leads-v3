# Diseno generador local proyecto cliente CONSTRUCTOR-CLOSE-3 - Constructor CRM Summer87

**Version:** CONSTRUCTOR-CLOSE-3 - diseno del generador local de proyecto cliente  
**Proyecto:** summer87-leads-v3  
**Estado:** definicion tecnica y operativa, sin implementacion  
**Alcance:** solo documentacion; sin codigo, sin scripts, sin carpetas cliente, sin SQL, sin Supabase, sin Vercel

---

## 1. Resumen ejecutivo

- Se define el **generador local de proyecto cliente** como la capa que transforma un paquete instalable aprobado en una carpeta de proyecto cliente separada.
- Esta fase cubre la generacion **local** del proyecto, no la infraestructura.
- El objetivo es soportar **V1 manual asistido** y preparar **V2 semi-automatico**.
- No se deben tocar todavia Supabase, Vercel, dominios ni datos reales.
- **Dictamen:** **GO documental** para estandarizar la creacion local del proyecto cliente.

---

## 2. Por que necesitamos un generador local

- Evita clonar a mano sin criterio consistente.
- Reduce diferencias accidentales entre proyectos cliente.
- Asegura que branding, modulos, contrato y permisos nazcan alineados al paquete instalable.
- Separa claramente la etapa de **generacion local** de la etapa de **infraestructura**.
- Permite auditar y revisar el proyecto antes de tocar Supabase o Vercel.

---

## 3. Definicion

**Generador local de proyecto cliente** = proceso controlado que, a partir de un paquete instalable aprobado, crea una nueva carpeta local de proyecto cliente derivada de `summer87-leads-v3`, aplica configuracion inicial no destructiva y deja lista la base de trabajo para la etapa posterior de infraestructura y QA.

---

## 4. Ubicacion en el flujo general

Flujo propuesto:

1. Constructor CRM genera paquete instalable.
2. Daniel / Summer87 revisa y aprueba el paquete.
3. El generador local crea la carpeta del proyecto cliente.
4. Se revisa estructura local generada.
5. Recién después se avanza a Supabase / Vercel / env / seed.

### Regla clave

El generador local ocurre **antes** de cualquier accion sobre:

- Supabase
- Vercel
- DNS / dominio
- usuarios reales
- datos reales

---

## 5. Entradas del generador

El generador debe tomar como entrada:

- paquete instalable aprobado;
- ruta base del repo madre (`summer87-leads-v3`);
- ruta destino sugerida;
- modo de ejecucion (`manual_assisted` o `semi_automatic`);
- confirmacion humana explicita.

### Entradas minimas esperadas desde el paquete

- `clientIdentity`
- `projectTarget`
- `crmContract`
- `leadFields`
- `pipelineConfig`
- `modulesConfig`
- `permissionsConfig`
- `brandingConfig`
- `seedPlan`
- `deploymentPlan`

---

## 6. Salidas del generador

La salida esperada no es un deploy, sino un proyecto local listo para revision.

Debe dejar:

- carpeta cliente creada;
- base del proyecto copiada o derivada desde `summer87-leads-v3`;
- archivos de configuracion cliente iniciales;
- documentacion de instalacion local;
- checklist de pasos manuales pendientes;
- evidencia en audit trail de que el proyecto fue generado.

---

## 7. Ejemplos de destino

Ejemplos de carpetas objetivo:

```text
~/proyectos/casalimpia-crm-inteligente
~/proyectos/4x4-crm-inteligente
~/proyectos/amorperfecto-crm-inteligente
```

### Regla

El generador no debe escribir sobre:

```text
~/proyectos/summer87-leads-v3
```

El repo madre queda intacto como fabrica.

---

## 8. Que debe hacer el generador

### V1 manual asistido

- Validar que existe un paquete aprobado.
- Proponer carpeta destino.
- Proponer nombre de proyecto.
- Proponer branding base y modulos visibles.
- Generar checklist manual.
- Generar prompts / instrucciones para copiar base y preparar proyecto.

### V2 semi-automatico

- Crear carpeta local destino.
- Copiar la base madre a la carpeta cliente.
- Aplicar archivos de configuracion cliente.
- Dejar placeholders para `.env`, branding y seed.
- Generar resumen de diferencias respecto de la base madre.

---

## 9. Que NO debe hacer el generador en esta etapa

- No ejecutar SQL.
- No crear Supabase.
- No crear Vercel.
- No tocar dominios.
- No crear usuarios reales.
- No enviar emails.
- No importar datos reales.
- No crear datos demo automaticamente.
- No ocultar modulos via destruccion irreversible sin confirmacion.
- No tocar produccion.

---

## 10. Estrategias de base local

Opciones conceptuales:

| Opcion | Descripcion | Pros | Contras | Dictamen |
|--------|-------------|------|---------|----------|
| A. Copia derivada del repo madre | Copiar estructura base y luego adaptar | Simple, clara, controlable | Puede arrastrar cosas si no se filtra bien | **GO inicial** |
| B. Plantilla minimizada generada | Construir nuevo proyecto desde subset base | Más limpio a largo plazo | Más trabajo de definición inicial | GO futuro |
| C. Worktree / fork tecnico automatizado | Variante avanzada de derivación | Útil más adelante | Sobredimensionado para esta etapa | NO-GO ahora |

### Recomendación

Empezar por **A. Copia derivada del repo madre**, con reglas claras de qué se mantiene, qué se oculta y qué se reconfigura.

---

## 11. Componentes a copiar desde la base madre

| Componente | Accion |
|------------|--------|
| App Next.js base | Copiar |
| Auth / RBAC base | Copiar |
| Leads / Ficha / Lista / Kanban base | Copiar |
| Helpers y adapters compartidos | Copiar |
| Documentacion de referencia tecnica | Copiar o derivar segun necesidad |
| Arquitectura `contract_fields_json` | Copiar como patron |

---

## 12. Componentes a reconfigurar al crear el cliente

| Componente | Accion |
|------------|--------|
| Branding | Reconfigurar |
| Nombre del CRM | Reconfigurar |
| Modulos visibles | Reconfigurar |
| Pipeline | Reconfigurar |
| Contrato CRM | Reconfigurar |
| `leadFields` | Reconfigurar |
| Roles y permisos visibles para cliente | Reconfigurar |
| Textos de ayuda | Reconfigurar |
| Documentacion de entrega | Generar |

---

## 13. Componentes a ocultar o remover para cliente

| Componente | Accion recomendada |
|------------|--------------------|
| Constructor CRM | Ocultar al cliente |
| Instalador interno | Ocultar |
| Auditoria interna | Ocultar |
| Configs y docs de Pickup | No trasladar como config activa |
| Datos QA de otros verticales | No trasladar |
| Superadmin visible al cliente | No trasladar |

### Regla

La ocultacion al cliente debe ser parte del diseño del proyecto cliente, no una tarea olvidable posterior.

---

## 14. Validaciones previas antes de generar

Antes de crear la carpeta local, el generador deberia validar:

- que el paquete existe;
- que el paquete esta en estado `approved`;
- que `targetProjectFolder` no apunta al repo madre;
- que el `projectSlug` no este vacio;
- que no exista conflicto obvio con una carpeta cliente ya existente;
- que `constructorVisibility = hidden_for_client`;
- que el paquete no incluya secretos;
- que los modulos / branding / permisos tengan minima coherencia.

---

## 15. Salidas documentales del generador

Ademas de la carpeta local, deberia producir:

- resumen de proyecto generado;
- checklist de pasos pendientes;
- diferencias clave respecto del repo madre;
- modulos habilitados / ocultos;
- branding esperado;
- roles previstos;
- contrato CRM asociado;
- recordatorio de que falta infraestructura.

---

## 16. Estados del proceso de generacion local

Estados sugeridos:

- `ready_for_generation`
- `generation_started`
- `local_project_created`
- `local_review_pending`
- `local_review_passed`
- `infra_pending`
- `generation_rejected`

---

## 17. Errores y bloqueos esperados

Ejemplos de bloqueos:

- paquete en estado no aprobado;
- `projectSlug` invalido;
- ruta destino conflictiva;
- paquete sin `crmContract`;
- paquete sin `leadFields`;
- paquete que deja Constructor visible al cliente;
- paquete con datos de otro cliente;
- paquete con referencias a Pickup no permitidas para Casa Limpia.

### Regla

Ante bloqueo, el generador debe **detenerse** y devolver explicacion clara, no improvisar.

---

## 18. Aplicacion a Casa Limpia Ecuador

Caso esperado:

```text
sourceBaseRepo: ~/proyectos/summer87-leads-v3
targetProjectFolder: ~/proyectos/casalimpia-crm-inteligente
deploymentMode: manual_assisted o semi_automatic
constructorVisibility: hidden_for_client
```

### Implicaciones

- Casa Limpia no se termina dentro del repo madre.
- Primero se audita y define contrato.
- Luego se genera el proyecto local separado.
- Recién despues se avanza con Supabase / Vercel / seed / QA.

---

## 19. Aplicacion a Pickup 4x4

Si Pickup pasara a cliente real:

```text
~/proyectos/4x4-crm-inteligente
```

El piloto 12W sirve como prueba funcional y documental, pero no como proyecto cliente final.

---

## 20. Relacion con V1 / V2 / V3

| Nivel | Rol del generador local |
|-------|--------------------------|
| V1 manual asistido | Define pasos y artefactos; Daniel ejecuta casi todo manualmente |
| V2 semi-automatico | Crea carpeta, copia base, aplica configuracion local y deja checklist |
| V3 automatico | Quedaria unido a infraestructura completa, fuera de alcance ahora |

### Dictamen

- V1: **GO ahora**
- V2: **GO despues de validar V1**
- V3: **NO-GO ahora**

---

## 21. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Definir generador local de proyecto cliente | GO |
| Generar carpeta local desde paquete aprobado | GO conceptual |
| Tocar Supabase ahora | NO-GO |
| Tocar Vercel ahora | NO-GO |
| Crear carpetas cliente en esta fase | NO-GO |
| Requerir paquete aprobado | GO obligatorio |
| Proteger repo madre de sobreescritura | GO obligatorio |

---

## 22. Proxima fase recomendada

**CL-0b - Auditoría read-only del repo para Casa Limpia Ecuador**

Objetivo:

Identificar exactamente que partes del repo madre ya sirven para Casa Limpia, cuales deben ocultarse y cuales necesitan adaptacion antes de generar el primer clon limpio real.

### Siguiente paso del bloque Constructor

Despues de estabilizar CL-0b / CL-0c, recien ahi podria plantearse una fase de implementacion del generador local.

---

## 23. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| Scripts creados | No |
| Carpetas cliente creadas | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| API modificada | No |
| Solo documentacion | Si |
| Commit | No |

---

## 24. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Generador local como paso intermedio | GO |
| V1 manual asistido | GO |
| V2 semi-automatico | Futuro cercano |
| V3 automatico | NO-GO ahora |
| Casa Limpia como primer caso de uso | GO despues de auditoria y contrato |
| Mantener infraestructura fuera de este paso | GO |

---

## 25. Cierre

El generador local queda definido como la capa que toma un paquete instalable aprobado y lo convierte en un proyecto cliente separado, sin cruzar aun a infraestructura. Su valor es dar repetibilidad, control y trazabilidad al nacimiento de cada CRM cliente, protegiendo al mismo tiempo al repo madre como fábrica.
