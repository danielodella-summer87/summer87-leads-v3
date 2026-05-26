# Diagnóstico UI facility relevamiento CONSTRUCTOR-CLEAN-2D

## 1. Resumen ejecutivo

- Se diagnostica la UI facility/relevamiento pendiente.
- La contaminación principal está en Ficha de Lead y en menor grado en Nuevo Lead.
- Lista de Leads no expone facility visible; el frente activo allí es vehículo/Pickup, que corresponde a otra línea de trabajo ya conocida.
- Esta fase no modifica código.
- **Dictamen preliminar:** no bloquea `CL-0b` si queda documentado como deuda, pero sí bloquea un clon limpio cliente si no se define qué parte de esta UI será contrato del vertical y qué parte debe parametrizarse.

## 2. Hallazgos UI por archivo

| ID | archivo/ruta | zona aproximada | referencia/campo/copy | tipo de acople | impacto | acción sugerida | prioridad | bloquea CL-0b |
|----|--------------|-----------------|------------------------|----------------|---------|-----------------|-----------|---------------|
| UI-1 | `app/admin/leads/[id]/page.tsx` | bloque `Relevamiento de visita` | título `Relevamiento de visita`, estado `Pendiente de relevamiento`, acciones `Guardar relevamiento` / `Marcar visita como realizada` | hardcode UI bloqueante | la ficha asume flujo operativo de visita técnica dentro del lead general | encapsular o parametrizar por vertical/modo en fase futura | Alta | No |
| UI-2 | `app/admin/leads/[id]/page.tsx` | `Datos generales del contrato` | `Nombre del contrato`, `Tipo de servicio`, `Forma de pago`, `Financiamiento`, `Incluir feriados`, `Requerimientos adicionales` | hardcode UI tolerable | mezcla CRM comercial con formulario operativo específico | revisar si estos campos forman parte del contrato Casa Limpia o si deben ocultarse por defecto | Alta | No |
| UI-3 | `app/admin/leads/[id]/page.tsx` | `Contexto operativo` | `Superficie o m²`, `Tipo de suelo`, `Puestos de trabajo`, `Cantidad de basureros`, `Área de cafetería`, `Material de escritorios`, `Parking`, `Subsuelo`, `Ascensores`, `Escaleras`, `Vidrios altos` | hardcode UI bloqueante | fuerte sesgo facility / relevamiento físico en la ficha estándar | mover a bloque parametrizable o mantener oculto fuera del vertical facility | Crítica | No |
| UI-4 | `app/admin/leads/[id]/page.tsx` | `Personal requerido` | `Días de servicio`, `Horarios`, `Número de operarios`, `Horas estimadas`, `Supervisión requerida` | hardcode UI tolerable | convierte la ficha en formulario operativo de servicio | definir luego si pertenece al contrato vertical o a una app operativa separada | Alta | No |
| UI-5 | `app/admin/leads/[id]/page.tsx` | `Insumos, EPP y maquinaria` | `Tipo de EPP`, `Certificados`, `Insumos requeridos`, `Montaje`, `Maquinaria necesaria` | hardcode UI bloqueante | muy específico de operación facility | no heredarlo a un clon limpio sin decisión de contrato | Alta | No |
| UI-6 | `app/admin/leads/[id]/page.tsx` | `Servicios especiales` | `Lavado de alfombras`, `Limpieza de paneles`, `Fumigación`, `Jardinería`, `Limpieza de vidrios`, etc. | hardcode UI bloqueante | copy y checklist muy específicos del vertical limpieza/facility | tratar como módulo vertical explícito, no como default del core | Crítica | No |
| UI-7 | `app/admin/leads/[id]/page.tsx` | tipos + persistencia | `visita_scheduled_at`, `visita_completed_at`, `visita_relevamiento_json`, `cantidad_personal`, `superficie_m2`, `notas_instalacion` y guardado del JSON de visita | dato operativo compatible | mantiene compatibilidad con schema legacy ya existente | conservar por ahora; documentar como infraestructura heredada | Media | No |
| UI-8 | `app/admin/leads/[id]/page.tsx` | gating UI | bloque de relevamiento visible solo con `!isClientCrmUi` | deuda no bloqueante | reduce exposición en modo `client_crm`, pero no neutraliza la UI base general | mantener como mitigación parcial hasta definir parametrización real | Media | No |
| UI-9 | `app/admin/leads/nuevo/page.tsx` | `Datos operativos opcionales` | `Rubro`, `Cantidad de personal`, `Superficie m²`, `Fecha de revisión o seguimiento` | campo legacy visible | contaminación visible pero acotada del formulario de alta | dejar como deuda documentada o esconderlo según modo/vertical en una fase corta | Media | No |
| UI-10 | `app/admin/leads/nuevo/page.tsx` | payload POST | `cantidad_personal`, `superficie_m2`, `visita_scheduled_at` enviados en `LeadCreatePayload` | dato operativo compatible | compatibilidad con API/schema legacy | no tocar ahora; decidir luego si estos campos salen del form o quedan ocultos | Media | No |
| UI-11 | `app/admin/leads/page.tsx` | lista/filtros/badges | sin referencias facility; sí hay filtros y badges de vehículo/Pickup | no aplica | confirma que facility no contamina la lista | no tocar en esta fase; mantener separado del frente facility | Baja | No |

## 3. Ficha de Lead

- La Ficha de Lead concentra el acople UI más fuerte de todo el frente facility.
- Aparece un bloque completo de `Relevamiento de visita` con:
  - estado de visita (`Pendiente de relevamiento` / `Visita realizada`);
  - agenda de visita (`visita_scheduled_at`, `visita_completed_at`);
  - formulario operativo estructurado;
  - persistencia directa de `visita_relevamiento_json`.
- Dentro de ese bloque aparecen secciones claramente sesgadas al vertical:
  - `Datos generales del contrato`;
  - `Contexto operativo`;
  - `Personal requerido`;
  - `Insumos, EPP y maquinaria`;
  - `Servicios especiales`;
  - `Observaciones finales`.

### Visibilidad

- El bloque está condicionado por `!isClientCrmUi`.
- Eso significa que no aparece en modo `client_crm`, pero sí sigue apareciendo en la UI base general de leads.
- La mitigación existe, pero no equivale a parametrización real por contrato.

### Riesgo para un futuro clon no facility

- Alto.
- Si se clona desde la UI actual sin decidir contrato/vertical, el clon hereda una ficha con lenguaje y formularios de relevamiento físico y operación facility.
- Esto contamina la percepción del producto y dificulta sostener un core realmente neutro.

### Riesgo para Casa Limpia

- Medio.
- La UI es utilizable como referencia para Casa Limpia porque refleja necesidades del vertical.
- Pero hoy no está formalizada como contrato del vertical: mezcla relevamiento, operación, checklists y servicios especiales sin una definición explícita de qué queda dentro del CRM cliente y qué debería vivir en un módulo parametrizable.

## 4. Nuevo Lead

- `Nuevo Lead` arrastra un acople menor y bastante más controlado que la ficha.
- Los campos facility visibles hoy son:
  - `Rubro`
  - `Cantidad de personal`
  - `Superficie m²`
  - `Fecha de revisión o seguimiento`
- Están agrupados dentro de `Datos operativos opcionales`.
- También están condicionados por `!isClientCrmUi`, o sea que no se muestran en modo `client_crm`.

### Interpretación

- Esto representa contaminación visible, pero acotada.
- No es un bloque facility completo como en la ficha.
- A la vez, el payload sigue enviando `cantidad_personal`, `superficie_m2` y `visita_scheduled_at`, por lo que la capa de compatibilidad sigue presente aunque la UI se esconda después.

### Qué hacer después

- No hace falta limpiarlo antes de `CL-0b`.
- Sí conviene decidir luego si:
  - estos campos quedan ocultos por defecto;
  - se muestran solo para vertical facility;
  - o migran a un esquema de contrato CRM parametrizado.

## 5. Lista de Leads

- No se detectó UI facility visible en `app/admin/leads/page.tsx`.
- No aparecen referencias a `cantidad_personal`, `superficie_m2`, `visita_scheduled_at`, `visita_completed_at` ni `visita_relevamiento_json`.
- El acople visible real en la lista hoy está en vehículo/Pickup:
  - `VEHICLE_FIELD_KEYS`
  - filtros por presencia de vehículo
  - badges `Vehículo parcial` / `Sin vehículo`

### Dictamen

- Para facility: `no aplica`.
- Para producto general: la lista no bloquea este frente.
- Si hay deuda en lista, pertenece a Pickup/vehículo y no a `CLEAN-2D`.

## 6. Clasificación de deuda

| Deuda | Tipo | Riesgo | Acción futura | Prioridad |
|-------|------|--------|---------------|-----------|
| Bloque `Relevamiento de visita` en ficha | UI facility hardcodeada en ficha | Alto | encapsular, ocultar por modo o parametrizar por contrato | Crítica |
| Secciones `Servicios especiales` / `Insumos, EPP y maquinaria` | UI facility hardcodeada en ficha | Alto | convertir en módulo vertical o extraer del default | Crítica |
| `Datos operativos opcionales` en Nuevo Lead | campo legacy visible | Medio | evaluar ocultamiento por modo/vertical | Media |
| `visita_relevamiento_json`, `visita_completed_at`, `visita_scheduled_at` | schema legacy como condicionante | Medio | mantener compatibilidad hasta definir contrato vertical | Alta |
| Gating por `!isClientCrmUi` sin parametrización real | deuda no bloqueante | Medio | reemplazar por contrato CRM o feature flag vertical | Alta |
| Parametrización por contrato CRM de bloques facility | eventual parametrización por contrato CRM | Alto | diseñar cuando exista definición de vertical/contrato | Alta |
| Ocultamiento por modo/vertical de campos visibles | eventual ocultamiento por modo/vertical | Medio | posible `CLEAN-2E` como corte corto | Media |

## 7. ¿Bloquea CL-0b?

- `CL-0b` es una auditoría read-only para Casa Limpia.
- La UI facility **no bloquea `CL-0b`** si queda documentada, porque la auditoría justamente necesita entender qué UI heredaría hoy un clon.
- Lo que sí bloquea es un **clon limpio cliente** si antes no se define:
  - si esta UI de relevamiento será parte del contrato Casa Limpia;
  - o si debe parametrizarse / ocultarse / dividirse.

### Dictamen recomendado

- `CL-0b`: `GO`.
- Clon limpio Casa Limpia: `NO-GO` hasta resolver la definición funcional de esta UI heredada.

## 8. Cambio mínimo futuro sugerido

### Opción A

- Documentar deuda y pasar a `CL-0b`.

### Opción B

- `CLEAN-2E`: ocultar/encapsular bloque facility en Ficha.

### Opción C

- Parametrizar facility desde contrato CRM en fase posterior.

### Opción D

- No tocar UI hasta tener contrato Casa Limpia `CL-0c`.

### Recomendación

- Recomendada: **Opción A** ahora.
- Secuencia sugerida:
  1. pasar a `CL-0b` con deuda documentada;
  2. usar `CL-0b` para decidir qué parte de la UI actual sirve de herencia real para Casa Limpia;
  3. recién después elegir entre `CLEAN-2E`, parametrización contractual o espera hasta `CL-0c`.

## 9. Fuera de alcance

- No tocar SQL.
- No borrar columnas.
- No reescribir Ficha completa.
- No crear Casa Limpia.
- No tocar Pickup.
- No tocar seguridad/auth.

## 10. Validaciones realizadas

- Búsqueda amplia equivalente a:
  - `rg -n "cantidad_personal|superficie_m2|cantidad_pisos|cantidad_banos|tachos_residuos|tiene_parking|tiene_subsuelo|tiene_ascensores|tiene_escaleras|tiene_vidrios_altos|tipos_suelo|horario_operacion|restricciones_acceso|zonas_criticas|requerimientos_especiales|notas_instalacion|installation_details_json|visita_scheduled_at|visita_completed_at|visita_relevamiento_json|limpieza|paneles|vidrios|fumigación|jardinería|relevamiento|facility" app/admin/leads docs/constructor-crm --glob '!node_modules' --glob '!.next' || true`
- Lectura dirigida de:
  - `app/admin/leads/[id]/page.tsx`
  - `app/admin/leads/nuevo/page.tsx`
  - `app/admin/leads/page.tsx`
  - `docs/constructor-crm/diagnostico-casalimpia-facility-legacy-CONSTRUCTOR-CLEAN-2A.md`
  - `docs/constructor-crm/validacion-post-neutralizacion-facility-legacy-CONSTRUCTOR-CLEAN-2C.md`
- `git status` revisado.
- Confirmación: no se modificó código en esta fase.

## 11. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Diagnóstico UI facility | GO |
| Limpiar UI ahora | NO-GO |
| Pasar a CL-0b | GO |
| Clonar Casa Limpia ahora | NO-GO |
| Tocar SQL/Supabase | NO-GO |

## 12. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| UI modificada | No |
| Datos creados | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |
