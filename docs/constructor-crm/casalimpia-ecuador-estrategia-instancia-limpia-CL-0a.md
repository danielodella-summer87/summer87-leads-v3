# Casa Limpia Ecuador estrategia instancia limpia CL-0a - Constructor CRM Summer87

**Versión:** CL-0a - estrategia de clonación / instancia limpia  
**Proyecto:** summer87-leads-v3  
**Estado:** diseño estratégico y operativo, sin implementación  
**Alcance:** solo documentación; sin código, sin SQL, sin Supabase, sin Vercel, sin datos

---

## 1. Resumen ejecutivo

- Se propone preparar **Casa Limpia Ecuador** sobre una **instancia limpia**.
- No se recomienda usar la instancia actual de Pickup / demo como cliente real.
- El repo `summer87-leads-v3` puede reutilizarse como base técnica.
- `contract_fields_json` y la lógica de verticales ya validada sirven como patrón reutilizable.
- **Dictamen:** **GO documental** para diseñar instancia limpia Casa Limpia Ecuador.

---

## 2. Decisión principal

| Opción | Descripción | Pros | Contras | Dictamen |
|--------|-------------|------|---------|----------|
| A. Instancia limpia nueva para Casa Limpia Ecuador | Nuevo entorno operativo separado para el cliente | Menor riesgo, separación clara, no arrastra QA/demo, más fácil revertir o rehacer | Requiere preparación inicial ordenada | **GO recomendado** |
| B. Reutilizar instancia actual con cleanup | Limpiar la base Pickup/demo y reaprovecharla | Menor fricción inicial aparente | Alto riesgo de contaminación, cleanup frágil, mezcla de branding y QA | **NO-GO recomendado** |
| C. Multi-tenant en la misma base | Compartir base/instancia con separación lógica | Potencial de reutilización futura | Complejidad temprana innecesaria, mayor riesgo operativo y de permisos | **NO-GO ahora** |

### Recomendación

Se recomienda **A. Instancia limpia nueva para Casa Limpia Ecuador** porque:

- minimiza riesgo operativo;
- no arrastra QA/demo Pickup;
- da una base más clara para cliente real;
- mejora la separación entre Summer87, Pickup y Casa Limpia;
- facilita rollback o rehacer la instalación si algo sale mal;
- evita mezclar Constructor, demo y CRM operativo en una misma superficie visible al cliente.

---

## 3. Qué significa "instancia limpia"

Una instancia limpia para Casa Limpia Ecuador implica:

- nuevo proyecto Supabase o base claramente separada;
- nuevo deployment Vercel o entorno separado;
- variables de entorno propias;
- sin datos QA Pickup;
- sin leads demo heredados;
- sin usuarios innecesarios;
- Constructor oculto para cliente final;
- CRM operativo visible para cliente;
- seed mínimo controlado y documentado.

---

## 4. Componentes a clonar / reutilizar

| Componente | Decisión | Notas |
|------------|----------|-------|
| Repo Next.js | Reutilizar | Base técnica validada |
| Arquitectura auth / RBAC | Reutilizar con revisión | Confirmar permisos mínimos para cliente |
| Constructor CRM | Mantener solo para Summer87 / instalador | No visible para cliente final |
| CRM operativo Leads / Ficha / Lista / Kanban | Reutilizar | Adaptando vertical y visibilidad |
| `contract_fields_json` | Reutilizar como patrón | Patrón validado end-to-end |
| Config Pickup | No reutilizar directamente | Solo como referencia de vertical |
| Datos Pickup QA | No migrar | Deben quedar fuera de Casa Limpia |
| Documentación Pickup | Usar como referencia | No como configuración cliente |

---

## 5. Componentes a crear para Casa Limpia Ecuador

- Contrato CRM Casa Limpia Ecuador.
- Campos específicos Casa Limpia.
- Pipeline comercial Casa Limpia.
- Textos de ayuda / capacitación.
- Módulos visibles para el cliente.
- Usuarios y permisos mínimos.
- Branding, nombre y textos propios.
- QA interno de vertical.
- Documento de entrega / piloto Casa Limpia.

---

## 6. Datos y limpieza

### Criterio propuesto

- No copiar leads Pickup.
- No copiar QA `12W`.
- No copiar usuarios demo innecesarios.
- No copiar configuraciones específicas de Pickup.
- Mantener solo seed mínimo técnico si corresponde.
- Crear datos QA nuevos de Casa Limpia claramente identificados con origen `qa_cl_`.

---

## 7. Supabase

| Opción | Descripción | Dictamen |
|--------|-------------|----------|
| A. Nuevo proyecto Supabase para Casa Limpia | Separación total de datos e infraestructura | **GO recomendado** |
| B. Nueva base / schema dentro del proyecto actual | Aislamiento parcial | Riesgo medio, revisar solo si hubiera restricción fuerte |
| C. Misma base con tenant | Separación lógica en mismo proyecto | **NO-GO ahora** |

### Recomendación

Para cliente real o piloto controlado, se recomienda **A. Nuevo proyecto Supabase para Casa Limpia**.

### Restricción de fase

En **CL-0a**:

- no ejecutar SQL;
- no crear proyecto;
- no tocar Supabase.

Antes de cualquier SQL se requiere una fase **CL-0d / CL-SQL** con:

- PRECHECK,
- backup,
- aprobación manual,
- ejecución documentada.

---

## 8. Vercel / dominio

- Se recomienda **deployment separado**.
- Posibles dominios / subdominios:
  - `casalimpia-ecuador-crm.vercel.app`
  - `crm.casalimpia.ec`
  - `crm.casalimpia.com.ec`
- Variables propias por entorno.
- No mezclar con `pickup4x4-crm-demo`.
- Revisar branding antes de cualquier demo cliente.

---

## 9. Accesos y permisos

### Usuarios mínimos propuestos

- Daniel / Summer87 admin.
- Usuario dueño / gerente Casa Limpia.
- Usuario comercial / operativo Casa Limpia, si aplica.

### Reglas

- El cliente final **no** accede al Constructor.
- El cliente final accede solo al **CRM operativo**.
- El Constructor / Instalador queda para Summer87 / superadmin.

---

## 10. Contrato CRM Casa Limpia Ecuador

### Campos core

- `nombre`
- `contacto`
- `telefono`
- `email`
- `origen`
- `pipeline`
- `notas`
- comercial responsable

### Campos específicos posibles

- `tipo_cliente`
- `tipo_servicio`
- `frecuencia`
- `superficie_m2`
- `cantidad_pisos`
- `cantidad_banos`
- `horario_operacion`
- `zonas_criticas`
- `restricciones_acceso`
- `requiere_visita`
- `fecha_visita`
- `direccion_servicio`
- `ciudad`
- `barrio_zona`
- `urgencia`
- `presupuesto_estimado`
- `cantidad_personal_requerido`

### Aclaración

- Algunos de estos campos ya existen como columnas legacy / Casa Limpia en `leads`.
- En **CL-0b / CL-0c** debe decidirse qué queda en columnas existentes y qué va a `contract_fields_json`.

---

## 11. Criterios de separación Pickup vs Casa Limpia

- No mostrar campos de vehículo.
- No mostrar textos Pickup.
- No mostrar filtros / badges de vehículo salvo que sean ocultables por vertical.
- No arrastrar datos QA.
- No mezclar pipelines.
- No mezclar reportes.
- No mezclar branding.

---

## 12. Riesgos

- El repo tiene historial y módulos heredados.
- Puede haber pantallas con textos Pickup o Casa Limpia legacy mezclados.
- Si se usa la base actual, existe riesgo alto de datos contaminados.
- Multi-tenant temprano puede complejizar más de lo necesario.
- Ocultar Constructor al cliente final es obligatorio.
- Falta una auditoría real de las pantallas Casa Limpia actuales.

---

## 13. Plan de fases sugerido

| Fase | Alcance |
|------|---------|
| CL-0a | Estrategia de instancia limpia (este documento) |
| CL-0b | Auditoría read-only del repo para Casa Limpia |
| CL-0c | Contrato CRM Casa Limpia Ecuador |
| CL-0d | Diseño Supabase / Vercel / env |
| CL-0e | Seed mínimo y usuarios |
| CL-1a | Adaptar Nuevo Lead Casa Limpia |
| CL-1b | Adaptar Ficha Casa Limpia |
| CL-1c | Lista / Kanban Casa Limpia |
| CL-QA | Validación interna |
| CL-DEMO | Demo cliente |

---

## 14. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Avanzar con instancia limpia | GO |
| Usar repo como base | GO |
| Usar instancia actual como cliente real | NO-GO |
| Ejecutar SQL ahora | NO-GO |
| Crear datos ahora | NO-GO |
| Multi-tenant ahora | NO-GO |
| Ocultar Constructor al cliente | GO obligatorio |
| Auditar repo antes de adaptar UI | GO |

---

## 15. Próximo paso recomendado

**CL-0b - Auditoría read-only del repo para Casa Limpia Ecuador**

### Objetivo

Identificar qué archivos, rutas, módulos y textos existentes ya están vinculados a Casa Limpia / facility / limpieza, qué se puede reutilizar y qué debe ocultarse o eliminarse para una instancia limpia.

---

## 16. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Vercel modificado | No |
| API modificada | No |
| Solo documentación | Sí |
| Commit | No |

---

## 17. Cierre

La decisión correcta para Casa Limpia Ecuador no es reciclar la demo Pickup, sino **capitalizar la base técnica validada** y abrir una **instancia limpia**, separada y controlada. Lo ya construido valida el patrón de verticalización y reduce riesgo de implementación, pero el paso siguiente exige auditoría, contrato y entorno propios antes de cualquier adaptación visible al cliente.
