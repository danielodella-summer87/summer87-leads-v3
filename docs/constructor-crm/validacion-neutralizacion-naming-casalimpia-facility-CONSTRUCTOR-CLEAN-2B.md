# Validación neutralización naming Casa Limpia facility CONSTRUCTOR-CLEAN-2B

## 1. Resumen ejecutivo

- Se neutralizó el naming `CASALIMPIA_LEAD_FIELDS` en APIs de leads.
- Se reemplazó por `FACILITY_LEGACY_LEAD_FIELDS`.
- No se cambiaron columnas.
- No se cambió comportamiento.
- No se tocó SQL, Supabase, migraciones ni UI.
- **Dictamen:** `GO` si build pasa.

## 2. Archivos modificados

| archivo | cambio | comportamiento esperado |
|---------|--------|-------------------------|
| `app/api/admin/leads/route.ts` | renombre de constante a `FACILITY_LEGACY_LEAD_FIELDS` + comentario de compatibilidad | mismo `SELECT`, mismas columnas, mismo comportamiento |
| `app/api/admin/leads/[id]/route.ts` | renombre de constante a `FACILITY_LEGACY_LEAD_FIELDS` + comentario de compatibilidad | mismo `GET/PATCH`, mismas columnas, mismo comportamiento |

## 3. Cambio realizado

- Antes: la constante estaba nombrada como `CASALIMPIA_LEAD_FIELDS`.
- Después: la constante quedó como `FACILITY_LEGACY_LEAD_FIELDS`.
- Motivo: evitar que el core de leads quede semánticamente atado a un cliente real.

## 4. Columnas

- Las columnas se mantienen por compatibilidad.
- No se borraron.
- No se renombraron en DB.
- No se ejecutó SQL.
- Siguen siendo legacy facility / site survey.

## 5. Validaciones

### `npm run build`

- Resultado: `OK`
- Warnings no bloqueantes observados:
  - `baseline-browser-mapping` desactualizado
  - `middleware` file convention deprecated
  - `module.register` deprecation warning
  - `OPENAI_API_KEY presente: false` durante build

### `rg` de `CASALIMPIA_LEAD_FIELDS`

- En `app/api/admin/leads/**` ya no apareció `CASALIMPIA_LEAD_FIELDS`.
- Las coincidencias residuales quedaron en documentación diagnóstica/histórica.

### `rg` de `FACILITY_LEGACY_LEAD_FIELDS`

- Aparece en:
  - `app/api/admin/leads/route.ts`
  - `app/api/admin/leads/[id]/route.ts`

### `git diff` acotado

- El diff quedó limitado a:
  - `app/api/admin/leads/route.ts`
  - `app/api/admin/leads/[id]/route.ts`
  - este documento

### `git status`

- El working tree queda con solo estos dos archivos modificados y este documento nuevo.

## 6. Qué NO se hizo

- No se tocó UI.
- No se tocó SQL.
- No se tocó Supabase.
- No se tocaron migraciones.
- No se borraron columnas.
- No se creó Casa Limpia.
- No se tocó Pickup.

## 7. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Naming Casa Limpia neutralizado | GO |
| Comportamiento preservado | GO |
| Build | GO |
| SQL/Supabase | NO-GO |
| UI facility | pendiente |
| Clonar Casa Limpia ahora | NO-GO |

## 8. Próximo paso recomendado

Propuesta:

- `CONSTRUCTOR-CLEAN-2C — QA post neutralización facility legacy`
- Luego:
  - `CONSTRUCTOR-CLEAN-2D` o `CLEAN-3A — diagnóstico UI facility / relevamiento`

## 9. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | Sí |
| SQL ejecutado | No |
| Supabase modificado | No |
| UI modificada | No |
| Migraciones modificadas | No |
| Datos creados | No |
| Commit | No |
