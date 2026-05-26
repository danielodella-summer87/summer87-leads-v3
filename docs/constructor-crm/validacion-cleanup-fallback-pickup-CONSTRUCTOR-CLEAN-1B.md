# Validacion cleanup fallback Pickup CONSTRUCTOR-CLEAN-1B

## 1. Resumen ejecutivo

- Se quitó el fallback automático a Pickup del core.
- El loader de contrato ya no asume `pickup4x4` cuando falta `CLIENT_SLUG`.
- La persistencia y el merge de `contract_fields_json` ya no caen automáticamente a la whitelist de Pickup.
- Pickup sigue disponible como config/preset reusable cuando se solicita explícitamente.
- No se tocó UI de vehículo.
- No se tocó Casa Limpia.
- El build pasa.

## 2. Archivos modificados

- `lib/crmPackage/getActiveCrmPackageConfig.ts`
- `lib/crmPackage/adapters/leadFieldPersistence.ts`

## 3. Qué cambió

### `lib/crmPackage/getActiveCrmPackageConfig.ts`

- Se eliminó el comportamiento que forzaba `pickup4x4` cuando `APP_MODE=client_crm` y faltaba `CLIENT_SLUG`.
- En ese caso, ahora devuelve estado neutro con `config: null` y razón `missing_explicit_client_slug`.
- Pickup sigue resolviendo correctamente cuando el slug explícito es `pickup4x4`.

### `lib/crmPackage/adapters/leadFieldPersistence.ts`

- Se eliminó el fallback automático a `pickup4x4CrmPackageConfig`.
- `resolveContractFieldWhitelist()` ahora puede quedar vacía en modo neutro.
- `mergeContractFieldsPatch()` fue ajustado para funcionar sin whitelist activa:
  - preserva claves existentes no-core;
  - acepta nuevas claves no-core normalizadas;
  - elimina solo claves explícitamente vacías;
  - no vacía `contract_fields_json` solo por ausencia de contrato.

## 4. Qué NO cambió

- No se modificó UI de `Nuevo Lead`.
- No se modificó UI de `Lead Detail`.
- No se modificó UI de `Leads List`.
- No se modificó UI de `Constructor paquetes`.
- No se modificó `pickup4x4.config.ts`.
- No se modificó `installablePackagePickup4x4Preset.ts`.
- No se tocó Casa Limpia / facility.
- No se tocaron APIs de leads.

## 5. Confirmación de que Pickup sigue como preset reusable

- `pickup4x4CrmPackageConfig` sigue existiendo como contrato local reusable.
- `PICKUP4X4_CLIENT_SLUG` sigue vigente para selección explícita.
- `installablePackagePickup4x4Preset` no fue modificado.
- `app/api/admin/constructor/installable-package/generate/route.ts` sigue soportando el preset `pickup_4x4` de forma explícita.

## 6. Confirmación de alcance

- UI vehículo no se tocó.
- Casa Limpia no se tocó.
- SQL no se tocó.
- Supabase no se tocó.
- Solo se modificaron los dos helpers definidos en `CLEAN-1A`.

## 7. Riesgos

- El riesgo principal era romper `PATCH` de `contract_fields_json` al dejar whitelist vacía.
- Se mitigó dejando merge neutro cuando no hay contrato activo.
- Queda pendiente validar más adelante la parametrización UI, pero esa deuda ya no bloquea el fallback core.

## 8. Validaciones realizadas

### `npm run build`

- Resultado: **OK**
- Observaciones: aparecieron warnings/deprecations de entorno (`middleware` deprecado y `baseline-browser-mapping` desactualizado), pero no bloquearon la compilación.

### Búsqueda de referencias `pickup4x4|PICKUP4X4_CLIENT_SLUG|fallback`

Resultado relevante:

- En `lib/crmPackage/getActiveCrmPackageConfig.ts` quedan referencias explícitas al config Pickup y al slug `pickup4x4`.
- En `lib/crmPackage/adapters/leadFieldPersistence.ts` ya no quedó fallback automático a Pickup.
- En `app/api/admin/leads` no quedaron referencias a fallback Pickup del core; las coincidencias encontradas fueron:
  - `fallbackInsert` en `app/api/admin/leads/route.ts`, no relacionado al contrato CRM;
  - referencias de `fallback` no relacionadas en otras rutas auxiliares.

### `git diff`

- El diff quedó acotado a:
  - `lib/crmPackage/getActiveCrmPackageConfig.ts`
  - `lib/crmPackage/adapters/leadFieldPersistence.ts`
  - este documento de validación

### `git status`

- El working tree queda con los dos archivos modificados y este documento nuevo, sin otros cambios de alcance.

## 9. Dictamen

| Criterio | Dictamen |
|----------|----------|
| Cleanup del fallback Pickup | GO |
| Pickup sigue como preset reusable | GO |
| UI vehículo intacta | GO |
| Casa Limpia intacta | GO |
| Build passing | GO |
| Pasar a fase posterior de UI/refactor amplio | GO posterior |
