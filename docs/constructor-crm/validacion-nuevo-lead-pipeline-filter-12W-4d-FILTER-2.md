# Validación Nuevo Lead Pipeline filter 12W-4d-FILTER-2 — Constructor CRM Summer87

**Versión:** 12W-4d-FILTER-2 — Nuevo Lead consume `contractOnly=1` en `client_crm`  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md`, `validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md`, `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`

---

## 1. Resumen ejecutivo

- Nuevo Lead ahora usa `contractOnly=1` cuando `isClientCrmUi` (modo `client_crm` vía `useLeadsClientCrmMode()`).
- Modos internos (`constructor_base` / internos) siguen usando el catálogo completo sin query param.
- El payload POST sigue enviando `pipeline` como **nombre** (`norm(pipeline)`), no `stage_key`.
- El fallback legacy (`FALLBACK_PIPELINE_NAMES`) se mantiene si la API falla o devuelve lista vacía.
- Kanban, Ficha, Lista, PipelinesTab y la API no fueron modificados en esta fase.

---

## 2. Alcance

### Incluido

- `app/admin/leads/nuevo/page.tsx`
- URL condicional de pipelines (`getPipelinesUrl`)
- Default preferido **Nuevo lead** cuando existe en opciones
- Este documento de validación

### Excluido

- API (`app/api/admin/leads/pipelines/route.ts`)
- Kanban, Ficha, Lista, `PipelinesTab`
- POST create lead y tipo `LeadCreatePayload`
- SQL, Supabase, migraciones, datos, middleware, `.env`, Vercel

---

## 3. Cambio técnico

**Archivo modificado:** `app/admin/leads/nuevo/page.tsx`

| Elemento | Detalle |
|----------|---------|
| Helper URL | `getPipelinesUrl(isClientCrmUi)` → `?contractOnly=1` solo si `isClientCrmUi` |
| Modo | `const isClientCrmUi = useLeadsClientCrmMode()` (ya existía) |
| Fetch pipelines | `useEffect` depende de `[isClientCrmUi]`; resetea `appliedInitialPipeline` al cambiar modo |
| Lista vacía OK | Si `sorted.length === 0` → `pipelinesUseFallback = true` (mismo que error de red) |
| Default | `pickPreferredPipeline()` prioriza `"Nuevo lead"`; si no está, primer ítem ordenado |
| Sincronía select | Si `pipeline` vacío o no está en `pipelineOptions`, reaplica `pickPreferredPipeline` |
| Fallback | `FALLBACK_PIPELINE_NAMES` sin cambio (6 nombres legacy) |
| POST | `pipeline: norm(pipeline)` sin cambios |

---

## 4. Comportamiento esperado

| Modo | URL usada | Resultado esperado |
|------|-----------|-------------------|
| `client_crm` | `/api/admin/leads/pipelines?contractOnly=1` | ~9 etapas contract (`stage_key` poblado); default **Nuevo lead** si existe |
| `constructor_base` / interno | `/api/admin/leads/pipelines` | Catálogo completo (~23 filas post-seed); default **Nuevo lead** si existe, si no primer ítem |
| API falla o vacía | (cualquier modo) | `FALLBACK_PIPELINE_NAMES`; aviso ámbar en UI |

---

## 5. Validación local sugerida

1. Abrir `/admin/leads/nuevo` con `APP_MODE=client_crm` (o entorno operativo equivalente).
2. En DevTools → Network: confirmar `GET .../pipelines?contractOnly=1`.
3. Select **Pipeline** debe listar solo etapas contract (~9), con **Nuevo lead** seleccionado por defecto si está en la respuesta.
4. Repetir con modo interno: `GET .../pipelines` sin query param; catálogo completo.
5. Guardar lead: **no validado en esta fase** (QA posterior); verificar que POST sigue enviando `pipeline` como string nombre.
6. Simular API vacía/error: debe mostrarse fallback de 6 nombres y mensaje ámbar.

---

## 6. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `contractOnly=1` devuelve vacío (seed no aplicado) | Fallback `FALLBACK_PIPELINE_NAMES` + `pipelinesUseFallback` |
| **Nuevo lead** no existe en catálogo | Default = primer pipeline disponible (orden API) |
| UI sigue usando **nombre**, no `stage_key` | POST intacto; alineado con diseño FILTER-DESIGN |
| Kanban sigue mostrando catálogo completo | Esperado hasta **12W-4d-FILTER-3** |

---

## 7. Próximas fases

| Fase | Alcance |
|------|---------|
| **12W-4d-FILTER-3** | Kanban — `contractOnly=1` + merge columnas legacy |
| **12W-4d-FILTER-4** | Ficha lead — select etapas filtrado + opción actual legacy |
| **QA Vercel** | Validación en preview/producción post FILTER-3/4 |

---

## 8. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código funcional modificado | Sí — Nuevo Lead |
| API modificada | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| POST payload modificado | No |
| Kanban / Ficha / Lista modificados | No |
| Build ejecutado | Ver §9 |
| Commit | No (por instrucción de fase) |

---

## 9. Validación obligatoria (agente / CI local)

Comandos ejecutados en la sesión de implementación:

```bash
npm run build
rg 'contractOnly' --glob '*.{ts,tsx,md}'
git status
```

**Criterio grep:** `contractOnly` debe aparecer en `app/api/admin/leads/pipelines/route.ts`, `app/admin/leads/nuevo/page.tsx` y documentación; **no** en Kanban, Ficha ni Lista.

**SQL:** no ejecutado (por restricción de fase).
