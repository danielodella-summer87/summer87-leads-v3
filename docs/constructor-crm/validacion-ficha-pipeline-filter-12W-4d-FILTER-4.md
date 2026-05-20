# Validación Ficha Pipeline filter 12W-4d-FILTER-4 — Constructor CRM Summer87

**Versión:** 12W-4d-FILTER-4 — Ficha consume `contractOnly=1` en `client_crm` + opción actual legacy  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md`, `validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md`, `validacion-nuevo-lead-pipeline-filter-12W-4d-FILTER-2.md`, `validacion-kanban-pipeline-filter-12W-4d-FILTER-3.md`, `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`

---

## 1. Resumen ejecutivo

- Ficha ahora usa `contractOnly=1` cuando `isClientCrmUi` (`useLeadsClientCrmMode()`).
- Modos internos siguen usando catálogo completo (`/api/admin/leads/pipelines`).
- Se conserva la opción actual del lead si su `pipeline` no está en el catálogo filtrado (inyección por nombre normalizado, sin duplicar).
- El `<select>` de Etapa renderiza solo `etapasForSelect` (sin `<option value="Nuevo">` hardcodeado).
- PATCH/guardado sigue usando `pipeline` como **nombre**; sin `stage_key` en payload.
- Nuevo Lead, Kanban, Lista, API y Supabase no fueron modificados en esta fase.

---

## 2. Alcance

### Incluido

- `app/admin/leads/[id]/page.tsx`
- URL condicional pipelines (`getPipelinesUrl`)
- opción actual legacy (`mergeCurrentPipelineIntoEtapas`)
- `useEffect` de `fetchEtapas` con dependencia `[isClientCrmUi]`
- Este documento

### Excluido

- API (`app/api/admin/leads/pipelines/route.ts`)
- Nuevo Lead, Kanban, Lista, `PipelinesTab`
- SQL, Supabase, migraciones, datos
- Middleware, `.env`, Vercel
- Payload PATCH y `leadStatusPolicy`

---

## 3. Cambio técnico

**Archivo modificado:** `app/admin/leads/[id]/page.tsx`

| Elemento | Detalle |
|----------|---------|
| Modo | `const isClientCrmUi = useLeadsClientCrmMode()` (ya existía) |
| Helper URL | `getPipelinesUrl(isClientCrmUi)` → `?contractOnly=1` solo si `isClientCrmUi` |
| Fetch etapas | `fetchEtapas()` usa `getPipelinesUrl(isClientCrmUi)` |
| Refetch | `useEffect(() => fetchEtapas(), [isClientCrmUi])` |
| Opciones select | `etapasForSelect = mergeCurrentPipelineIntoEtapas(etapas, current)` donde `current` = `draft.pipeline` en edición o `lead.pipeline` en lectura |
| Select Etapa | Renderiza **solo** `etapasForSelect.map(...)` — sin `<option value="Nuevo">` hardcodeado ni `.filter((x) => x !== "Nuevo")` |
| Normalización | `normPipelineNombre()` — trim + lowercase para evitar duplicados |
| Inyección legacy | Si el nombre actual no matchea por `norm`, se agrega al final de la lista |
| Fallback error | Sin cambio: `["Nuevo", "Perdido", "Ganado"]` en catch; en OK se mantiene merge con fallback mínimo existente |
| PATCH | Sin cambios — sigue enviando `pipeline` como string nombre |

---

## 4. Comportamiento esperado

| Modo | URL usada | Opciones esperadas |
|------|-----------|-------------------|
| `client_crm` | `/api/admin/leads/pipelines?contractOnly=1` | ~9 etapas contract + opción actual si es legacy |
| `constructor_base` / interno | `/api/admin/leads/pipelines` | Catálogo completo (~23) + opción actual si no matchea por `norm` |

---

## 5. Opción actual legacy

**Por qué existe:** En `client_crm` el fetch filtrado puede devolver solo las 9 filas con `stage_key`. Un lead creado o migrado con un `pipeline` legacy (sin `stage_key` en catálogo) seguiría teniendo ese valor en BD. Sin inyección, el `<select>` no incluiría la opción y el valor visual se perdería o quedaría inconsistente.

**Cómo evita pérdida visual:** `mergeCurrentPipelineIntoEtapas` compara el `pipeline` actual (lead o draft) contra las opciones ya cargadas por nombre normalizado. Si no hay match, agrega el **nombre real** del lead como opción adicional (al final), sin duplicar si ya existe.

**Ejemplo:** Si `lead.pipeline = "Visita"` y «Visita» no está en `contractOnly=1`, el selector en edición debe listar «Visita» y mantener `value="Visita"` hasta que el usuario elija otra etapa contract.

**Estado Pickup actual:** Los 12 leads demo están en **Nuevo lead**, que sí está en contract — la inyección legacy probablemente no se activa, pero el fallback queda para seguridad futura.

---

## 6. Validación local sugerida

1. Abrir una ficha desde Kanban (`/admin/leads/[id]`).
2. En `client_crm`: DevTools → Network → confirmar `GET /api/admin/leads/pipelines?contractOnly=1` al cargar la ficha.
3. Pulsar **Editar** → pestaña/sección **Datos del lead**.
4. Campo **Etapa** debe mostrar el valor actual (ej. **Nuevo lead** para leads demo en Pickup).
5. Abrir el `<select>` de etapa: ~9 opciones contract (sin opción «Nuevo» hardcodeada paralela a «Nuevo lead»); no debe faltar la etapa actual del lead.
6. Repetir en modo interno: `GET .../pipelines` sin query param; catálogo completo.
7. Simular lead legacy (pipeline fuera de contract en BD): verificar que «Visita» (u otro nombre) aparece en el select aunque no venga del API filtrado.
8. Guardar cambios de etapa: **no validado en esta fase** (QA posterior); verificar que PATCH sigue enviando `pipeline` como nombre, no `stage_key`.

---

## 7. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Lead legacy sin opción en select | `mergeCurrentPipelineIntoEtapas` obligatorio |
| Refetch al cambiar modo | `useEffect` depende de `[isClientCrmUi]` |
| API contract vacía | Fallback `["Nuevo", "Perdido", "Ganado"]` en catch (comportamiento previo); «Nuevo» solo aparece vía fallback, no hardcodeado en JSX |
| Opción «Nuevo» duplicada vs «Nuevo lead» | Removido `<option value="Nuevo">` fijo; en `client_crm` el select refleja solo el catálogo API + inyección legacy |
| UI sigue usando nombre en PATCH | Payload intacto; alineado con diseño FILTER-DESIGN |

---

## 8. Próximas fases

| Fase | Alcance |
|------|---------|
| **12W-4d-FILTER-5** (opcional) | Lista / bulk |
| **12W-4d-QA** | Vercel `client_crm` end-to-end |

---

## 9. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código funcional modificado | Sí — Ficha (`[id]/page.tsx`) |
| API modificada | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| POST/PATCH lead payload modificado | No (sigue `pipeline: nombre`) |
| Nuevo Lead / Kanban / Lista modificados | No |
| `leadStatusPolicy` modificado | No |
| Commit | No (por instrucción de fase) |

---

## 10. Validación obligatoria (agente / CI local)

```bash
npm run build
```

Resultado esperado: build OK sin errores de TypeScript en `app/admin/leads/[id]/page.tsx`.
