# Validación post neutralización facility legacy CONSTRUCTOR-CLEAN-2C

## 1. Resumen ejecutivo

- `CLEAN-2C` valida el estado posterior a `CLEAN-2B`.
- Casa Limpia ya no aparece como naming de constante activa en APIs de leads.
- El bloque legacy queda nombrado como `FACILITY_LEGACY_LEAD_FIELDS`.
- No se cambiaron columnas ni comportamiento.
- UI facility sigue pendiente.
- **Dictamen:** `GO`.

## 2. Commit validado

- Commit validado: `8d2ea00`
- Mensaje: `Neutralize Casa Limpia naming in leads APIs`

### Comandos ejecutados

- `git log --oneline -5`
- `git show --stat --oneline 8d2ea00`
- `git show --name-only --oneline 8d2ea00`

### Resultado

- `8d2ea00` aparece como commit más reciente.
- El commit toca solo:
  - `app/api/admin/leads/route.ts`
  - `app/api/admin/leads/[id]/route.ts`
  - `docs/constructor-crm/validacion-neutralizacion-naming-casalimpia-facility-CONSTRUCTOR-CLEAN-2B.md`
- Confirmación de alcance acotado: `OK`.

## 3. Validación naming viejo

### Comando ejecutado

- `rg -n "CASALIMPIA_LEAD_FIELDS" app/api/admin/leads app/admin lib || true`

### Resultado

- Sin coincidencias en `app/api/admin/leads`, `app/admin` ni `lib`.

### Dictamen

- `GO`: el naming viejo salió del código activo relevado en esta fase.

## 4. Validación naming nuevo

### Comando ejecutado

- `rg -n "FACILITY_LEGACY_LEAD_FIELDS" app/api/admin/leads app/admin lib || true`

### Resultado

- Coincidencias solo en:
  - `app/api/admin/leads/route.ts`
  - `app/api/admin/leads/[id]/route.ts`

### Dictamen

- `GO`: el naming nuevo quedó acotado a las dos APIs esperadas.

## 5. Validación referencias facility amplias

### Comando ejecutado

- `rg -n "casalimpia|Casa Limpia|limpieza|facility|visita_relevamiento_json|visita_completed_at|superficie_m2|cantidad_personal" app/api/admin/leads app/admin/leads docs/constructor-crm --glob '!node_modules' --glob '!.next' || true`

### Clasificación

- **Válido**
  - `app/api/admin/leads/route.ts`: persisten tipos, payloads y columnas legacy (`cantidad_personal`, `superficie_m2`, etc.) por compatibilidad.
  - `app/api/admin/leads/[id]/route.ts`: persisten columnas legacy y campos de visita (`visita_completed_at`, `visita_relevamiento_json`) por compatibilidad.
  - `docs/constructor-crm/diagnostico-casalimpia-facility-legacy-CONSTRUCTOR-CLEAN-2A.md`: referencia histórica/diagnóstica correcta.
  - `docs/constructor-crm/validacion-neutralizacion-naming-casalimpia-facility-CONSTRUCTOR-CLEAN-2B.md`: referencia de validación previa correcta.
  - Otros documentos históricos en `docs/constructor-crm/` que mencionan `Casa Limpia`, `facility` o campos legacy como contexto, trazabilidad o diseño previo.

- **Pendiente**
  - `app/admin/leads/[id]/page.tsx`: la UI de ficha sigue exponiendo `visita_completed_at`, `visita_relevamiento_json`, `cantidad_personal`, `superficie_m2`, `notas_instalacion` y bloques/copy de relevamiento facility (`Parking`, `Subsuelo`, `Ascensores`, `Escaleras`, `Vidrios altos`, `Limpieza`, `Fumigación`, `Jardinería`).
  - `app/admin/leads/nuevo/page.tsx`: la UI de alta sigue incluyendo `cantidad_personal`, `superficie_m2` y `visita_scheduled_at`.

- **No válido**
  - No se detectaron referencias no válidas para esta fase dentro de las APIs activas de leads.
  - No reapareció `CASALIMPIA_LEAD_FIELDS`.
  - No se expandió `FACILITY_LEGACY_LEAD_FIELDS` fuera de las dos rutas API esperadas.

### Conclusión

- La UI facility / relevamiento sigue pendiente y queda fuera de `CLEAN-2C`.
- Este hallazgo no invalida `CLEAN-2B`; solo confirma que el próximo foco debe estar en UI / experiencia de leads y no en SQL o Supabase.

## 6. Validación build

### Comando ejecutado

- `npm run build`

### Resultado

- Resultado general: `OK`
- Build completado y compilación exitosa.

### Warnings no bloqueantes observados

- `Unknown env config "devdir"`
- `baseline-browser-mapping` desactualizado
- `middleware` file convention deprecated
- `module.register()` deprecated
- `OPENAI_API_KEY presente: false`

### Dictamen

- `GO`: build sigue saludable para el alcance de esta fase.

## 7. Alcance confirmado

| Item | Valor |
|------|-------|
| Código modificado en CLEAN-2C | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| UI modificada | No |
| Migraciones modificadas | No |
| Datos creados | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |

## 8. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Naming Casa Limpia fuera de APIs activas | GO |
| `FACILITY_LEGACY_LEAD_FIELDS` acotado | GO |
| Columnas legacy preservadas | GO |
| Build | GO |
| UI facility pendiente | pendiente |
| Tocar SQL/Supabase ahora | NO-GO |
| Clonar Casa Limpia ahora | NO-GO |
| Pasar a CLEAN-2D / diagnóstico UI facility | GO |

## 9. Dictamen final

- `CLEAN-2C`: `GO` porque build y búsquedas pasan.
- `CLEAN-2B` queda validado.
- Próximo paso recomendado:
  - `CONSTRUCTOR-CLEAN-2D — diagnóstico UI facility / relevamiento en Ficha/Nuevo Lead`
  - o `CL-0b` si se decide que la UI legacy no bloquea todavía el diseño del contrato Casa Limpia.
