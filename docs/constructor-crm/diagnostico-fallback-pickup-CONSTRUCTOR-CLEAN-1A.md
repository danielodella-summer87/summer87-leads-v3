# Diagnostico fallback Pickup CONSTRUCTOR-CLEAN-1A

**Fase:** CONSTRUCTOR-CLEAN-1A  
**Proyecto:** summer87-leads-v3  
**Tipo:** diagnostico tecnico de fallback / preset Pickup  
**Alcance:** solo documentacion y lectura

---

## 1. Resumen ejecutivo

- Pickup aparece en el repo en mas de una capa, pero no todas tienen la misma gravedad.
- El acople **critico de core** hoy esta en dos lugares:
  - `lib/crmPackage/getActiveCrmPackageConfig.ts`, donde `client_crm` sin `CLIENT_SLUG` cae automaticamente a `pickup4x4`;
  - `lib/crmPackage/adapters/leadFieldPersistence.ts`, donde la persistencia de `contract_fields_json` cae automaticamente a la whitelist de Pickup.
- Tambien existe Pickup como:
  - preset reusable controlado;
  - mock del asistente;
  - hardcode UI de vehiculo;
  - hardcode fuerte en la pantalla de paquetes del Constructor.
- `CLEAN-1A` solo diagnostica.
- El objetivo de `CLEAN-1B` debe ser **quitar el fallback automatico del core**, no borrar el conocimiento Pickup ni reescribir toda la UI.
- **Dictamen:** `GO` para implementar `CLEAN-1B` si el alcance se acota a loader de contrato + persistencia/merge de `contract_fields_json`.

---

## 2. Hallazgos tecnicos

| ID | Archivo / ruta | Linea o zona aproximada | Referencia encontrada | Tipo de acople | Riesgo | Accion sugerida | Prioridad |
|----|----------------|-------------------------|-----------------------|----------------|--------|-----------------|-----------|
| H1 | `lib/crmPackage/getActiveCrmPackageConfig.ts` | 82-109 | `Fallback demo: si client_crm y no hay CLIENT_SLUG ... asume pickup4x4` y `clientSlug = PICKUP4X4_CLIENT_SLUG` | fallback core critico | Un clon `client_crm` sin slug explicito cae a Pickup por defecto | En `CLEAN-1B`, devolver fallback neutro / `null` si no hay slug explicito | Critica |
| H2 | `lib/crmPackage/adapters/leadFieldPersistence.ts` | 199-219 | `resolveLeadFieldsAdapterForPersistence()` devuelve `packageToLeadFields(pickup4x4CrmPackageConfig)` si no hay contrato usable | fallback core critico | La whitelist JSONB queda sesgada a Pickup aunque el contrato no exista | En `CLEAN-1B`, eliminar fallback Pickup en adapter/whitelist | Critica |
| H3 | `lib/crmPackage/adapters/leadFieldPersistence.ts` | 231-312 | `mergeContractFieldsPatch()` usa `resolveContractFieldWhitelist(undefined)` por defecto | fallback core critico / riesgo de implementacion | Si se neutraliza la whitelist sin adaptar este merge, un PATCH podria vaciar o bloquear `contract_fields_json` | En `CLEAN-1B`, hacer que merge soporte whitelist vacia o nula sin romper persistencia | Critica |
| H4 | `app/api/admin/leads/route.ts` | 281-284 y 724 | `getActiveCrmPackageConfigFromEnvironment()` + `resolveContractFieldWhitelist(pkg.config)` en create | consumidor core | Si el helper cambia y no conserva modo neutro seguro, create lead puede dejar de persistir campos dinamicos | No tocar primero; validar create via helpers revisados | Alta |
| H5 | `app/api/admin/leads/[id]/route.ts` | 451-455 | `resolveContractFieldWhitelist(pkg.config)` + `mergeContractFieldsPatch(...)` en patch | consumidor core | PATCH es el punto mas delicado: si la whitelist queda vacia y merge no se adapta, se puede perder persistencia | No tocar primero; asegurar merge neutro en helper | Alta |
| H6 | `lib/crmPackage/configs/pickup4x4.config.ts` | 9-223 | `pickup4x4CrmPackageConfig` con contrato demo completo | preset reusable | Ninguno si se mantiene como preset explicito | Mantener como referencia reusable; no usar como fallback | Media |
| H7 | `lib/admin/installablePackagePickup4x4Preset.ts` | 6-181 | `PICKUP_4X4_PRESET_KEY`, `mergePickup4x4IntoPackagePayload()` | preset reusable | Puede parecer dominante, pero no es fallback automatico por si solo | Mantener como preset explicito; no tocar en `CLEAN-1B` | Media |
| H8 | `app/api/admin/constructor/installable-package/generate/route.ts` | 228-264 | `isPickup4x4Preset(presetRaw)` y `if (usePickup4x4Preset)` | preset reusable | Hoy solo soporta `pickup_4x4`, pero requiere seleccion explicita | No tocar en `CLEAN-1B`; diagnosticar mas adelante como generalizacion de presets | Media |
| H9 | `app/api/admin/constructor/assist/route.ts` | 161-208 | `mock-empresa-rubro-automotriz-4x4` disparado por keywords automotrices | mock / fixture | Sesga sugerencias del asistente hacia 4x4 | Dejar fuera de `CLEAN-1B`; tratar luego como fixture parametrizable | Media |
| H10 | `app/admin/leads/nuevo/page.tsx` | 114-137, 209-213, 343-352, 444-495 | `buildPickupContractFields(...)`, estado `vehiculo*`, bloque `Vehículo` | hardcode UI | La UI `client_crm` asume vehiculo y campos Pickup | No tocar en `CLEAN-1B`; dejar para una fase UI posterior | Alta |
| H11 | `app/admin/leads/[id]/page.tsx` | 930-979, 1000-1008, 3513-3549, 4183-4337 | `VehicleContractDraft`, `buildVehicleContractPatchPayload`, bloque `Vehículo` | hardcode UI | Ficha de lead acoplada a semantica automotriz | No tocar en `CLEAN-1B` | Alta |
| H12 | `app/admin/leads/page.tsx` | 69-239, 522-725, 1025-1087, 1188-1249 | `VEHICLE_FIELD_KEYS`, filtros y badges de vehiculo | hardcode UI | Lista de leads con filtros/badges automotrices | No tocar en `CLEAN-1B` | Alta |
| H13 | `app/admin/constructor-crm/paquetes/[id]/page.tsx` | 408-610, 720+, 5400+ | helpers `buildPickup4x4*`, copy comercial y checklist Pickup | hardcode UI / flujo operativo | Pantalla del Constructor muy orientada a Pickup | No tocar en `CLEAN-1B`; fase posterior separada | Alta |
| H14 | `docs/constructor-crm/*` y `knowledge/templates` | varias | docs ya distinguen Pickup como aprendizaje/preset, no fallback | documentacion o conocimiento | Bajo | Mantener como conocimiento reusable | Baja |

---

## 3. Mapa de capas

### Config core

- `lib/crmPackage/getActiveCrmPackageConfig.ts`
  - problema central: resuelve Pickup por defecto cuando `APP_MODE=client_crm` y no hay `CLIENT_SLUG`.

### Persistencia `contract_fields_json`

- `lib/crmPackage/adapters/leadFieldPersistence.ts`
  - problema central: fallback a `pickup4x4CrmPackageConfig` para construir lead fields / whitelist.
  - riesgo secundario: `mergeContractFieldsPatch()` depende de la whitelist y debe soportar modo neutro.
- consumidores:
  - `app/api/admin/leads/route.ts`
  - `app/api/admin/leads/[id]/route.ts`

### Preset instalable

- `lib/admin/installablePackagePickup4x4Preset.ts`
- `app/api/admin/constructor/installable-package/generate/route.ts`

Diagnostico:
- Pickup aparece como preset reusable y controlado.
- No es el problema central de `CLEAN-1B` porque requiere seleccion explicita.

### Assist / mock

- `app/api/admin/constructor/assist/route.ts`

Diagnostico:
- Hay sesgo automotriz en las sugerencias mock.
- Es un problema real, pero no bloquea la correccion del fallback core.

### UI Nuevo Lead / Ficha / Lista

- `app/admin/leads/nuevo/page.tsx`
- `app/admin/leads/[id]/page.tsx`
- `app/admin/leads/page.tsx`

Diagnostico:
- La UI de `client_crm` sigue modelando explicitamente `Vehículo`, `marca`, `modelo`, `matricula`, `tipo_uso`.
- Es acople de vertical, pero no hace falta tocarlo para resolver el fallback automatico del core.

### UI Constructor paquetes

- `app/admin/constructor-crm/paquetes/[id]/page.tsx`

Diagnostico:
- Muy cargada de copy, checklist y reuniones Pickup.
- Fuera del alcance minimo de `CLEAN-1B`.

### Documentacion / conocimiento

- `docs/constructor-crm/`
- `docs/constructor-crm/knowledge/`
- `docs/constructor-crm/templates/`

Diagnostico:
- Pickup ya esta bien clasificado como aprendizaje/preset.
- No requiere limpieza en esta fase.

---

## 4. Cambio minimo recomendado para CLEAN-1B

### Archivos a tocar

- `lib/crmPackage/getActiveCrmPackageConfig.ts`
- `lib/crmPackage/adapters/leadFieldPersistence.ts`

### Archivos que idealmente NO tocar

- `lib/crmPackage/configs/pickup4x4.config.ts`
- `lib/admin/installablePackagePickup4x4Preset.ts`
- `app/api/admin/constructor/installable-package/generate/route.ts`
- `app/api/admin/constructor/assist/route.ts`
- `app/admin/leads/nuevo/page.tsx`
- `app/admin/leads/[id]/page.tsx`
- `app/admin/leads/page.tsx`
- `app/admin/constructor-crm/paquetes/[id]/page.tsx`
- cualquier archivo Casa Limpia / facility

### Comportamiento esperado despues de CLEAN-1B

- El Constructor madre debe tener fallback **neutro** o `null`.
- `getActiveCrmPackageConfigFromEnvironment()` no debe devolver Pickup automaticamente si falta `CLIENT_SLUG`.
- Pickup debe quedar disponible solo cuando se pida explicitamente por:
  - `clientSlug === "pickup4x4"`, o
  - preset instalable `pickup_4x4`.
- `leadFieldPersistence` no debe caer automaticamente a whitelist Pickup.
- La creacion y actualizacion de leads no debe perder `contract_fields_json` existentes.
- La lectura de leads existentes no debe romperse.
- La UI de vehiculo puede seguir igual por ahora, aunque siga siendo hardcode UI.

### Recomendacion tecnica minima

1. En `getActiveCrmPackageConfig.ts`
   - quitar el branch que, en `client_crm` sin slug, fuerza `pickup4x4`;
   - devolver `config: null`, `source: "none"` y una razon explicita.

2. En `leadFieldPersistence.ts`
   - eliminar el fallback a `pickup4x4CrmPackageConfig` en `resolveLeadFieldsAdapterForPersistence()`;
   - hacer que `resolveContractFieldWhitelist()` devuelva whitelist vacia o nula cuando no hay contrato activo.

3. En `leadFieldPersistence.ts`
   - adaptar `mergeContractFieldsPatch()` para que, si no hay whitelist de contrato, haga merge neutro:
     - preserve claves existentes no-core;
     - acepte nuevas claves no-core normalizadas;
     - elimine solo vacios explicitos;
     - no vacie el JSON por ausencia de contrato.

Esta es la clave para no tener que tocar las APIs de leads en `CLEAN-1B`.

---

## 5. Riesgos de implementacion

- **Romper build TypeScript**:
  si se cambian tipos o retornos del loader sin mantener compatibilidad.

- **Romper create/update lead si la whitelist queda demasiado estricta**:
  especialmente en `PATCH`, donde hoy el merge depende de la whitelist.

- **Dejar sin persistencia `contract_fields_json`**:
  riesgo alto si la whitelist neutra termina comportandose como “bloquear todo”.

- **Romper demo Pickup**:
  si la demo dependia implicitamente de no definir `CLIENT_SLUG`.

- **Ampliar alcance hacia UI antes de tiempo**:
  tocar bloques `Vehículo` en Nuevo Lead/Ficha/Lista convertiria `CLEAN-1B` en un refactor mayor.

---

## 6. Alcance propuesto para CLEAN-1B

| Archivo | Cambio propuesto | Riesgo | Validacion |
|---------|------------------|--------|------------|
| `lib/crmPackage/getActiveCrmPackageConfig.ts` | Quitar fallback implicito a `pickup4x4` cuando falta `CLIENT_SLUG` | Medio | `npm run build` + prueba de que sin slug devuelve `null` |
| `lib/crmPackage/adapters/leadFieldPersistence.ts` | Quitar fallback Pickup en adapter/whitelist | Alto | `npm run build` + `rg` sobre fallback + prueba create/patch |
| `lib/crmPackage/adapters/leadFieldPersistence.ts` | Hacer merge neutro cuando no exista whitelist | Critico | prueba manual de que no se pierde `contract_fields_json` en `PATCH` |
| `app/api/admin/leads/route.ts` | Sin cambio esperado si helper queda bien | Medio | crear lead con `contract_fields` y verificar que no reviente |
| `app/api/admin/leads/[id]/route.ts` | Sin cambio esperado si helper queda bien | Alto | editar lead con `contract_fields` existentes y verificar merge |

---

## 7. Fuera de alcance para CLEAN-1B

- parametrizar toda la UI de vehiculo;
- mover `pickup4x4.config.ts` si eso amplia demasiado;
- reescribir `app/admin/constructor-crm/paquetes/[id]/page.tsx`;
- tocar Casa Limpia / facility;
- tocar SQL o Supabase;
- seguridad, auth o RLS;
- crear clon cliente.

---

## 8. Validaciones sugeridas para CLEAN-1B

- `npm run build`
- `rg -n "pickup4x4|PICKUP4X4_CLIENT_SLUG|fallback" lib/crmPackage app/api/admin/leads`
- prueba de que `getActiveCrmPackageConfigFromEnvironment()` **no** devuelve Pickup por defecto cuando `APP_MODE=client_crm` y no hay `CLIENT_SLUG`
- prueba de que Pickup sigue disponible si se solicita explicitamente por slug o preset
- prueba de create lead con `contract_fields`
- prueba de patch lead con `contract_fields_json` existente
- `git diff` acotado a los dos helpers principales
- `git status`

---

## 9. Confirmacion de alcance

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

## 10. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Diagnóstico fallback Pickup | GO |
| Implementar CLEAN-1B | GO si el alcance queda acotado |
| Borrar Pickup | NO-GO |
| Mantener Pickup como preset reusable | GO |
| Parametrizar UI vehículo ahora | NO-GO |
| Clonar Casa Limpia ahora | NO-GO |

---

## 11. Cierre

El problema de `CLEAN-1B` no es “Pickup existe”, sino que **el core lo asume sin seleccion explicita**. Si se corrige solo el loader de contrato y la resolucion/merge de `contract_fields_json`, el repo puede seguir conservando Pickup como preset reusable sin que el Constructor madre lo arrastre por defecto.
