# Casa Limpia Ecuador plan técnico clon limpio CL-0d

## 1. Resumen ejecutivo

- `CL-0d` diseña el clon limpio futuro.
- No crea carpetas, no toca código, no toca Supabase ni Vercel.
- El proyecto objetivo futuro sería `~/proyectos/casalimpia-crm-inteligente`.
- El repo `summer87-leads-v3` sigue siendo Constructor madre.
- **Dictamen:** `GO` documental para preparar la fase previa al clon; `NO-GO` para crear el clon ahora.

## 2. Decisión técnica principal

- `summer87-leads-v3` queda como fábrica / base madre.
- `casalimpia-crm-inteligente` será proyecto cliente separado.
- No se debe usar la instancia actual como cliente real.
- No se debe mezclar Pickup, Constructor y Casa Limpia en una misma superficie cliente.

La estrategia correcta para Casa Limpia es:

- definir contrato (`CL-0c`);
- diseñar entorno y clon técnico (`CL-0d`);
- preparar seed / permisos / checklist (`CL-0e` y siguientes);
- recién después evaluar creación controlada del clon.

## 3. Proyecto objetivo futuro

| item | valor preliminar | observación |
|------|------------------|-------------|
| carpeta local sugerida | `~/proyectos/casalimpia-crm-inteligente` | no crear ahora |
| nombre repo sugerido | `casalimpia-crm-inteligente` | proyecto cliente separado |
| Vercel sugerido | `casalimpia-crm-inteligente` | proyecto dedicado |
| Supabase sugerido | nuevo proyecto separado | no reutilizar Pickup/demo |
| dominio/subdominio | pendiente | definir con cliente |
| `APP_MODE` recomendado | `client_crm` | superficie cliente, no Constructor |
| `CLIENT_SLUG` recomendado | `casalimpia-ecuador` | confirmar slug final en fase técnica |
| `CRM_MODE` recomendado si aplica | restringido / ocultando Constructor | decidir implementación exacta después |

## 4. Estrategia de clonación recomendada

### Opción A: copia manual asistida del repo madre

- Pros:
  - control total;
  - bajo riesgo de automatización prematura;
  - fácil de auditar;
  - consistente con `V1 manual assisted`.
- Contras:
  - más trabajo manual;
  - posibilidad de olvidar exclusiones si no hay checklist.
- Dictamen: `GO inicial`.

### Opción B: generador local futuro

- Pros:
  - más repetible;
  - prepara el camino a `V2`;
  - reduce errores humanos con checklist automatizable.
- Contras:
  - todavía no está implementado;
  - requiere estabilizar mejor exclusiones, flags y contrato.
- Dictamen: `GO futuro cercano`.

### Opción C: fork / repo nuevo

- Pros:
  - separación clara de historial futuro;
  - independiente del repo madre una vez creado.
- Contras:
  - si se hace demasiado temprano puede arrastrar basura del repo madre;
  - no resuelve por sí mismo qué excluir.
- Dictamen: `GO condicional` solo cuando el checklist pre-clon esté cerrado.

### Opción D: multi-tenant en mismo repo/base

- Pros:
  - aparente reutilización máxima.
- Contras:
  - complejidad prematura;
  - mezcla datos, permisos y branding;
  - contradice la estrategia de instancia limpia.
- Dictamen: `NO-GO`.

### Recomendación

- Para esta etapa: **V1 manual asistido / plan controlado**.
- No automatización completa todavía.

## 5. Qué copiar del repo madre

| elemento | copiar sí/no | motivo |
|----------|--------------|--------|
| app CRM operativo | Sí | base funcional validada |
| componentes compartidos | Sí | reutilización UI/controlada |
| `lib/crmPackage` | Sí | patrón de contrato CRM |
| APIs leads | Sí | base operativa del CRM |
| estilos/base UI | Sí | acelerar clon limpio |
| estructura auth actual | Sí | RBAC base reutilizable |
| knowledge/templates no visibles al cliente | Sí, como referencia interna | sirven al equipo, no al cliente |
| docs internas | No como superficie cliente | quedan en repo madre o como referencia interna |
| Constructor CRM | No como superficie cliente | debe quedar oculto/excluido del clon visible |
| assets reales Casa Limpia | No | ya fueron extraídos y no deben entrar al clon desde el repo madre |
| QA Pickup | No | contaminación cruzada de vertical |
| datos demo | No | no deben heredarse |

## 6. Qué excluir u ocultar

| elemento | excluir/ocultar | motivo | cómo tratarlo |
|----------|-----------------|--------|---------------|
| Constructor visible al cliente | Ocultar | contradice modelo de instancia limpia | feature flag / permisos / menú / routing futuro |
| rutas `/admin/constructor-crm` | Ocultar | internas de Summer87 | bloquear visibilidad y navegación |
| paquetes instalables internos | Ocultar | internos del Constructor | no exponer en clon |
| docs internas del Constructor | Excluir de superficie cliente | ruido interno | mantener fuera del proyecto cliente visible |
| filtros/badges vehículo | Ocultar o excluir | pertenecen a Pickup | resolver por vertical antes del clon |
| datos QA Pickup | Excluir | contaminación de datos | no migrar |
| activos reales Casa Limpia | Excluir | sensibles / fuera de Git | mantener fuera del clon base |
| scripts peligrosos | Excluir u ocultar | riesgo operativo | revisar antes de clonar |
| migraciones no revisadas | Excluir de ejecución automática | no equivalen a contrato aprobado | pasar por fase SQL manual |
| cualquier `.env` | Excluir | secretos y configuración local | recrear desde requerimientos |
| backups | Excluir | no forman parte del proyecto cliente | mantener fuera del clon |

## 7. Variables/env preliminares

Categorías requeridas:

- `NEXT_PUBLIC_APP_NAME`
- `APP_MODE`
- `CRM_MODE`
- `CLIENT_SLUG`
- Supabase URL
- Supabase anon key
- Supabase service role
- variables IA si aplica
- variables de dominio
- feature flags para ocultar Constructor
- flags para módulos visibles

### Reglas

- no escribir secretos;
- no crear `.env`;
- `CL-0d` solo define requerimientos.

### Criterio técnico preliminar

- `APP_MODE` debe resolver superficie cliente.
- `CLIENT_SLUG` debe identificar Casa Limpia sin fallback.
- `CRM_MODE` o flags equivalentes deben ayudar a ocultar Constructor y módulos no permitidos.

## 8. Supabase

Recomendación:

- nuevo proyecto Supabase separado para Casa Limpia;
- no reutilizar base Pickup/demo;
- no ejecutar SQL ahora;
- preparar luego fase específica `CL-SQL-0` o `CL-0e`;
- revisar migraciones aplicables;
- decidir si se usan columnas legacy o `contract_fields_json` según `CL-0c`;
- hacer backup / precheck antes de cualquier SQL.

### Regla

Las migraciones legacy facility existentes sirven como referencia técnica, no como plan automático de clonación.

## 9. Vercel / dominio

- proyecto Vercel separado;
- variables propias;
- dominio/subdominio pendiente;
- no desplegar ahora;
- posible nombre temporal: `casalimpia-crm-inteligente.vercel.app`;
- dominio final a decidir.

## 10. Ocultamiento del Constructor

- cliente final no debe ver Constructor;
- rutas internas a ocultar:
  - `/admin/constructor-crm`
  - `/api/admin/constructor/*`
  - páginas de paquetes/drafts

### Mecanismo preliminar

- feature flag;
- `APP_MODE` / `CRM_MODE`;
- permisos / menú;
- middleware / routing futuro.

No implementar ahora.

## 11. Seed mínimo propuesto

Seed conceptual:

- usuario Daniel / Summer87 admin
- usuario gerente Casa Limpia
- comercial/coordinador opcional
- pipelines Casa Limpia
- módulos habilitados
- 3 leads QA con prefijo `qa_cl_`

Ejemplos QA:

- `qa_cl_oficina_pequena`
- `qa_cl_edificio_mediano`
- `qa_cl_servicio_domestico`

### Prohibido

- datos reales sin autorización
- activos reales binarios
- QA Pickup
- usuarios reales sin confirmación

## 12. Checklist QA previo a clon

- repo madre clean
- `git status` clean
- contrato `CL-0c` validado
- plan `CL-0d` validado
- Constructor ocultable
- UI Pickup/vehículo resuelta u ocultable
- UI facility decidida
- Supabase plan listo
- Vercel plan listo
- env plan listo
- seed plan listo
- no activos reales en repo
- no datos demo ajenos

## 13. Riesgos

| riesgo | impacto | mitigación |
|--------|---------|------------|
| clonar con Constructor visible | alto | feature flags + permisos + checklist |
| clonar con UI Pickup visible | alto | revisar y excluir antes del clon |
| clonar sin Supabase separado | alto | requisito obligatorio de instancia limpia |
| ejecutar SQL legacy sin revisión | alto | fase SQL manual con aprobación |
| incluir activos reales | crítico | mantener fuera de Git y del clon base |
| mezclar QA Pickup | alto | seed nuevo `qa_cl_` únicamente |
| confundir CRM con ERP operativo | medio/alto | limitar alcance de v1 |
| automatizar demasiado pronto | alto | mantener `V1 manual assisted` |

## 14. Fases siguientes sugeridas

- `CL-0e — diseño seed mínimo / usuarios / permisos`
- `CL-0f — checklist Go/No-Go técnico pre-clon`
- `CL-1a — creación controlada de carpeta local clon, si se aprueba`
- `CL-1b — configuración env local`
- `CL-1c — Supabase plan / SQL manual aprobado`
- `CL-QA — validación interna`

Los nombres pueden ajustarse, pero el clon no debe crearse hasta tener Go/No-Go.

## 15. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Plan técnico `CL-0d` | GO |
| Crear carpeta clon ahora | NO-GO |
| Crear Supabase ahora | NO-GO |
| Crear Vercel ahora | NO-GO |
| Ejecutar SQL ahora | NO-GO |
| Pasar a `CL-0e` | GO |
| Clonar después de checklist | GO condicional |

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

- `CL-0e — diseño seed mínimo, usuarios y permisos Casa Limpia`
- No crear clon todavía.
