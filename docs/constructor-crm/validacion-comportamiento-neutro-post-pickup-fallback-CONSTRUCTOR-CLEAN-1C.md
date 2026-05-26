# Validacion comportamiento neutro post Pickup fallback CONSTRUCTOR-CLEAN-1C

## 1. Resumen ejecutivo

- `CLEAN-1C` valida el comportamiento posterior a `CLEAN-1B`.
- Pickup ya no debe funcionar como fallback automático del core.
- Pickup sigue existiendo como config explícita cuando el slug es `pickup4x4`.
- `leadFieldPersistence` ya no cae a `pickup4x4CrmPackageConfig` como fallback.
- El build pasó correctamente.
- **Dictamen:** `GO`.

## 2. Commit validado

- Commit: `04cf100`
- Mensaje: `Remove implicit Pickup fallback from CRM package core`
- Archivos tocados por `CLEAN-1B`:
  - `lib/crmPackage/getActiveCrmPackageConfig.ts`
  - `lib/crmPackage/adapters/leadFieldPersistence.ts`
  - `docs/constructor-crm/validacion-cleanup-fallback-pickup-CONSTRUCTOR-CLEAN-1B.md`

## 3. Evidencia getActiveCrmPackageConfig

- El archivo todavía importa `pickup4x4CrmPackageConfig`.
- Eso es válido porque Pickup sigue disponible cuando `clientSlug === "pickup4x4"`.
- `getActiveCrmPackageConfigFromEnvironment()` ya no fuerza `pickup4x4` si falta `CLIENT_SLUG`.
- Si `APP_MODE=client_crm` y falta `CLIENT_SLUG`, devuelve estado neutro/null con `reason: "missing_explicit_client_slug"`.
- **Dictamen:** `GO`.

## 4. Evidencia leadFieldPersistence

- El archivo ya no importa `pickup4x4CrmPackageConfig`.
- `resolveLeadFieldsAdapterForPersistence(config)` delega en `packageToLeadFields(config)`.
- `resolveContractFieldWhitelist(config)` puede devolver whitelist neutra.
- `mergeContractFieldsPatch()` soporta ausencia de whitelist activa.
- **Dictamen:** `GO`.

## 5. Build

- Comando: `npm run build`
- Resultado: `OK`
- Warnings no bloqueantes observados:
  - `baseline-browser-mapping` desactualizado
  - `middleware` file convention deprecated
  - `module.register` deprecation warning
  - `OPENAI_API_KEY presente: false` durante build
- Ninguno bloqueó el build.
- **Dictamen:** `GO`.

## 6. Alcance confirmado

| Item | Valor |
|------|-------|
| Código modificado en CLEAN-1C | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| UI tocada | No |
| Casa Limpia tocada | No |
| Solo documentación | Sí |
| Commit | No |

## 7. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Core sin fallback Pickup automático | GO |
| Pickup como preset/config explícita | GO |
| `contract_fields_json` sin whitelist activa | GO documental |
| Build | GO |
| Clonar Casa Limpia ahora | NO-GO |
| Pasar a `CLEAN-2A` diagnóstico Casa Limpia / facility | GO |

## 8. Cierre

- `CLEAN-1` queda cerrado técnicamente.
- Pickup deja de ser fallback automático del core.
- Próximo paso recomendado: `CONSTRUCTOR-CLEAN-2A — diagnóstico Casa Limpia / facility legacy en código activo`.
