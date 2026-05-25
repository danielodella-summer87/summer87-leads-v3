# Diseno paquete instalable contrato de salida CONSTRUCTOR-CLOSE-2 - Constructor CRM Summer87

**Version:** CONSTRUCTOR-CLOSE-2 - diseno del contrato de salida  
**Proyecto:** summer87-leads-v3  
**Estado:** definicion estrategica y tecnica del paquete instalable  
**Alcance:** solo documentacion; sin codigo, sin SQL, sin Supabase, sin Vercel, sin carpetas cliente, sin datos

---

## 1. Resumen ejecutivo

- El paquete instalable sera el **contrato de salida** del Constructor CRM.
- Debe describir todo lo necesario para crear un CRM cliente separado.
- Debe permitir **V1 manual asistido** y preparar **V2 semi-automatico**.
- No ejecuta acciones destructivas por si mismo.
- **Dictamen:** **GO documental** para estandarizar la salida del Constructor.

---

## 2. Por que necesitamos un paquete instalable

- Evita clonar clientes "a mano" sin estructura comun.
- Separa el diseno del CRM de la ejecucion tecnica.
- Permite QA trazable y repetible.
- Reduce el riesgo de mezclar clientes, verticales y branding.
- Permite repetir el proceso para Casa Limpia, Pickup, Amor Perfecto y futuros clientes.
- Funciona como puente entre el Constructor y el proyecto cliente.

---

## 3. Definicion

**Paquete instalable** = archivo u objeto estructurado generado por el Constructor que contiene identidad del cliente, contrato CRM, campos, modulos, permisos, branding, seed, plan de deployment, plan de QA y bloqueos de seguridad necesarios para crear un CRM operativo separado.

---

## 4. Principios

- Legible por humanos.
- Versionado.
- Trazable.
- Sin secretos.
- Sin credenciales reales.
- Sin ejecutar por defecto.
- Requiere confirmacion humana.
- Compatible con V1 manual asistido.
- Preparado para V2 semi-automatico.
- El cliente final no ve el paquete.
- Summer87 / instalador si lo usa.

---

## 5. Estructura raiz del paquete

Diseno conceptual JSON:

```json
{
  "packageVersion": "client-crm-package-v1",
  "generatedAt": "2026-05-25T00:00:00.000Z",
  "generatedBy": "summer87-leads-v3",
  "status": "draft",
  "requiresHumanConfirmation": true,
  "clientIdentity": {},
  "projectTarget": {},
  "crmContract": {},
  "leadFields": {},
  "pipelineConfig": {},
  "modulesConfig": {},
  "permissionsConfig": {},
  "brandingConfig": {},
  "aiRules": {},
  "seedPlan": {},
  "deploymentPlan": {},
  "qaPlan": {},
  "blockedActions": [],
  "auditTrail": []
}
```

**Nota:** esto es diseno, no implementacion final obligatoria.

---

## 6. `clientIdentity`

Campos recomendados:

- `clientId` interno
- nombre comercial
- nombre legal
- pais
- ciudad
- rubro
- contacto principal
- email contacto
- telefono
- sitio web
- redes
- notas comerciales

---

## 7. `projectTarget`

Campos recomendados:

- `projectSlug`
- `targetProjectFolder`
- `suggestedRepoName`
- `suggestedVercelProject`
- `suggestedSupabaseProject`
- `environmentName`
- `deploymentMode`: `manual_assisted` | `semi_automatic` | `automatic_future`
- `sourceBaseRepo`: `summer87-leads-v3`
- `constructorVisibility`: `hidden_for_client`

### Ejemplos

- `casalimpia-crm-inteligente`
- `4x4-crm-inteligente`
- `amorperfecto-crm-inteligente`

---

## 8. `crmContract`

Debe contener:

- `vertical`
- objetivo del CRM
- modulos permitidos
- modulos ocultos
- entidades principales
- definicion de lead
- definicion de oportunidad
- reglas comerciales
- reglas de visibilidad
- reglas de campos obligatorios
- reglas de auditoria
- reglas de datos sensibles

---

## 9. `leadFields`

Debe separar:

- `coreFields`
- `contractFields`
- `hiddenFields`
- `requiredFields`
- `optionalFields`
- `readOnlyFields`
- `computedFields`

### Regla clave

- `coreFields` van a columnas comunes.
- `contractFields` van a `contract_fields_json`.
- No usar `notas` u `oferta` como parche.
- No crear columnas dedicadas por vertical salvo decision explicita posterior.

---

## 10. `pipelineConfig`

Debe definir:

- `stages`
- `defaultStage`
- `wonStages`
- `lostStages`
- `stageLabels`
- `stageColors`
- `allowedTransitions`
- `recommendedActivitiesByStage`
- `qaRules`

---

## 11. `modulesConfig`

Modulos sugeridos:

- `leads`
- `ficha`
- `lista`
- `kanban`
- `agenda`
- `reportes`
- `ia`
- `mesa_de_ayuda`
- `constructor`
- `configuracion`

Cada modulo debe tener:

- `enabled`
- `visibleForClient`
- `visibleForSummer87`
- `route`
- `notes`

### Regla

`constructor.visibleForClient = false`

---

## 12. `permissionsConfig`

Roles minimos sugeridos:

- `summer87_superadmin`
- `installer`
- `client_owner`
- `client_manager`
- `client_operator`

Cada rol debe tener:

- `canView`
- `canCreate`
- `canEdit`
- `canDelete`
- `canExport`
- `canConfigure`
- `canAccessConstructor`

### Regla

Los roles de cliente no pueden acceder al Constructor.

---

## 13. `brandingConfig`

Debe definir:

- `crmName`
- `logoPath` placeholder
- `primaryColor`
- `accentColor`
- `favicon`
- `loginTitle`
- `loginSubtitle`
- `sidebarLabel`
- `emptyStatesTone`
- `helpTextsTone`

### Aclaracion

No incluir archivos reales de logo en el paquete si no existen; solo referencias o placeholders.

---

## 14. `aiRules`

Debe definir:

- `allowedRecommendations`
- `forbiddenActions`
- `tone`
- `humanConfirmationRequiredFor`
- `dataSourcesAllowed`
- `dataSourcesForbidden`
- `promptProfiles`
- `escalationRules`

### Regla

La IA no ejecuta acciones sensibles sin confirmacion humana.

---

## 15. `seedPlan`

Debe definir:

- `usersToCreate`
- `rolesToCreate`
- `pipelineToCreate`
- `modulesToEnable`
- `demoDataPolicy`
- `qaDataPolicy`
- `initialSettings`
- `forbiddenSeedData`

### Regla

- No migrar datos QA de Pickup.
- Para Casa Limpia, los datos QA deben usar origen `qa_cl_` si corresponde.

---

## 16. `deploymentPlan`

Debe definir:

- `localFolder`
- `repoStrategy`
- `envVarsRequired`
- `supabaseStrategy`
- `vercelStrategy`
- `domainStrategy`
- `backupRequirement`
- `manualSteps`
- `automatedStepsFuture`

### Aclaraciones

- No incluir valores secretos.
- No ejecutar nada en esta fase.

---

## 17. `qaPlan`

Checklist minimo sugerido:

- login
- permisos
- Constructor oculto
- crear lead
- editar lead
- lista
- kanban
- ficha
- agenda
- filtros
- reportes si aplica
- responsive basico
- datos QA separados
- no textos de otro vertical
- no datos de otro cliente

---

## 18. `blockedActions`

Acciones bloqueadas por defecto:

- ejecutar SQL
- crear Supabase
- crear Vercel
- crear usuarios reales
- enviar emails reales
- importar datos reales
- borrar datos
- tocar produccion
- exponer Constructor al cliente

Todas requieren confirmacion humana explicita.

---

## 19. `auditTrail`

Eventos sugeridos:

- `package_generated`
- `package_reviewed`
- `package_approved`
- `project_created`
- `supabase_configured`
- `vercel_configured`
- `seed_executed`
- `qa_completed`
- `client_demo_ready`
- `package_rejected`

---

## 20. Estados del paquete

- `draft`
- `reviewed`
- `approved`
- `installing`
- `installed`
- `qa_pending`
- `qa_passed`
- `rejected`
- `archived`

---

## 21. Ejemplo conceptual Casa Limpia Ecuador

Ejemplo no ejecutable:

```json
{
  "projectSlug": "casalimpia-crm-inteligente",
  "crmContract": {
    "vertical": "limpieza/facility"
  },
  "projectTarget": {
    "constructorVisibility": "hidden_for_client"
  },
  "leadFields": {
    "contractFields": [
      "tipo_cliente",
      "tipo_servicio",
      "frecuencia",
      "superficie_m2",
      "cantidad_pisos",
      "cantidad_banos",
      "horario_operacion",
      "zonas_criticas",
      "requiere_visita"
    ]
  },
  "seedPlan": {
    "demoDataPolicy": "no_pickup_data"
  }
}
```

**Nota:** no es implementacion final.

---

## 22. Relacion con V1 / V2 / V3

| Nivel | Uso del paquete |
|-------|------------------|
| V1 manual asistido | El paquete genera JSON, prompts y checklist |
| V2 semi-automatico | El paquete alimenta el generador local de carpeta / proyecto |
| V3 automatico | El paquete alimenta automatizacion completa de infraestructura |

### Dictamen

- V1: **GO ahora**
- V2: **GO despues de estabilizar**
- V3: **NO-GO ahora**

---

## 23. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Definir paquete estandar | GO |
| Usar paquete para Casa Limpia | GO despues de CL-0b / CL-0c |
| Ejecutar paquete automaticamente ahora | NO-GO |
| Incluir secretos | NO-GO |
| Cliente final ve paquete | NO-GO |
| Requiere aprobacion humana | GO obligatorio |
| Usar paquete como contrato de salida | GO |

---

## 24. Proxima fase recomendada

**CONSTRUCTOR-CLOSE-3 - diseno del generador local de proyecto cliente**

### Objetivo

Definir como, a partir del paquete instalable aprobado, se podria crear una carpeta local como:

```text
~/proyectos/casalimpia-crm-inteligente
```

sin todavia automatizar Supabase ni Vercel.

### Nota adicional

`CL-0b` puede correr en paralelo o despues como auditoria read-only del repo para Casa Limpia.

---

## 25. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| API modificada | No |
| Solo documentacion | Si |
| Commit | No |

---

## 26. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Paquete instalable como contrato de salida | GO |
| V1 manual asistido | GO |
| V2 semi-automatico | Futuro cercano |
| V3 automatico | NO-GO ahora |
| Casa Limpia como primer uso real | GO despues de auditoria y contrato |
| Pasar a CONSTRUCTOR-CLOSE-3 | GO |

---

## 27. Cierre

El paquete instalable queda definido como la pieza que conecta al Constructor CRM con el generador de proyecto cliente, la instalacion y la QA. Su funcion no es ejecutar por si mismo, sino encapsular de forma versionada, revisable y segura todo lo que un CRM cliente necesita para nacer como proyecto separado.
