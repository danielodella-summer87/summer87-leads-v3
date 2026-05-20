# Validación Kanban Pipeline filter 12W-4d-FILTER-3 — Constructor CRM Summer87

**Versión:** 12W-4d-FILTER-3 — Kanban consume `contractOnly=1` en `client_crm` + merge columnas legacy  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md`, `validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md`, `validacion-nuevo-lead-pipeline-filter-12W-4d-FILTER-2.md`, `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`

---

## 1. Resumen ejecutivo

- Kanban usa `GET .../pipelines?contractOnly=1` cuando `isClientCrmUi` (`useLeadsClientCrmMode()`).
- Modos internos siguen con catálogo completo (`/api/admin/leads/pipelines`).
- Leads con `pipeline` fuera de las 9 etapas contract reciben **columna sintética** al final (`legacy:{norm}`), sin duplicar por nombre normalizado.
- Drag & drop de cards sigue enviando `PATCH { pipeline: nombre }` — sin `stage_key`.
- Columnas legacy no participan en reorden horizontal ni en `PATCH` de orden de pipelines.
- Nuevo Lead, Ficha, Lista, API y Supabase no fueron modificados en esta fase.

---

## 2. Alcance

### Incluido

- `app/admin/leads/kanban/page.tsx`
- `getPipelinesUrl(isClientCrmUi)`
- `mergeLegacyPipelineRows(apiRows, leads)`
- `useEffect` de carga con dependencia `[isClientCrmUi]`
- Este documento

### Excluido

- API, Nuevo Lead, Ficha, Lista, `PipelinesTab`
- POST/PATCH de pipelines en servidor
- SQL, Supabase, migraciones, datos
- Middleware, `.env`, Vercel

---

## 3. Cambio técnico

**Archivo modificado:** `app/admin/leads/kanban/page.tsx`

| Elemento | Detalle |
|----------|---------|
| Modo | `const isClientCrmUi = useLeadsClientCrmMode()` |
| URL fetch | `getPipelinesUrl(isClientCrmUi)` en `fetchAll()` |
| Refetch | `useEffect(..., [isClientCrmUi])` |
| Merge | `displayPipelines = mergeLegacyPipelineRows(pipelines, leads)` → `columns` |
| Columna sintética | `id: legacy:{norm(nombre)}`, `nombre` = valor real del lead, color `#94a3b8`, al final |
| Agrupación cards | Sin cambio: `norm(lead.pipeline) === norm(col.nombre)` |
| PATCH card | `persistEtapa` / `persistLeadPipeline` → `{ pipeline: targetColumn.nombre }` |
| Reorden columnas | Solo IDs reales (UUID); `legacy:*` excluidos de `SortableContext` y `persistColumnOrder` |
| `norm()` | Helper existente reutilizado |

---

## 4. Comportamiento esperado

| Modo | URL pipelines | Columnas visibles |
|------|---------------|-------------------|
| `client_crm` | `?contractOnly=1` | ~9 contract + N columnas legacy (solo si hay leads con ese `pipeline`) |
| Interno | sin query param | Catálogo completo (~23) + legacy solo si algún lead no matchea por `norm` |
| Lead en etapa contract | — | Card en columna contract correspondiente |
| Lead en etapa legacy (ej. «Investigación inicial») | — | Card en columna sintética al final |
| Mover card a columna contract | — | PATCH con **nombre** destino (igual que antes) |

---

## 5. Validación local sugerida

1. Abrir `/admin/leads/kanban` en `client_crm`.
2. Network: `GET /api/admin/leads/pipelines?contractOnly=1` y `GET /api/admin/leads`.
3. Verificar ~9 columnas contract; si hay leads legacy, columnas extra al final (fondo gris claro, sin drag de columna).
4. Confirmar que cards en **Nuevo lead** siguen visibles.
5. Arrastrar una card a otra columna contract: request `PATCH` con `pipeline` string (nombre), no `stage_key`.
6. Repetir en modo interno: fetch sin `contractOnly`.
7. Modo interno: reorden de columnas reales sigue funcionando.

---

## 6. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Lead legacy invisible con solo 9 columnas | Merge obligatorio desde `leads[]` |
| Reorden API con id sintético | `legacy:*` excluidos de persistencia de orden |
| API contract vacía | Columnas solo desde leads legacy; sin borrar leads cargados |
| Kanban sigue usando nombre en PATCH | Alineado con diseño; sin migración de datos |

---

## 7. Próximas fases

| Fase | Alcance |
|------|---------|
| **12W-4d-FILTER-4** | Ficha — `fetchEtapas` + inject pipeline actual |
| **12W-4d-FILTER-5** (opcional) | Lista / bulk |
| **12W-4d-QA** | Vercel `client_crm` |

---

## 8. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código funcional modificado | Sí — Kanban |
| API modificada | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| POST/PATCH lead payload modificado | No (sigue `pipeline: nombre`) |
| Nuevo Lead / Ficha / Lista modificados | No |
| Build ejecutado | Ver §9 |
| Commit | No |

---

## 9. Validación obligatoria (agente / CI local)

```bash
npm run build
rg 'contractOnly' --glob '*.{ts,tsx,md}'
git status
```

**Criterio grep:** `contractOnly` en API, Nuevo Lead, **Kanban**, docs; **no** en Ficha ni Lista (`page.tsx` de leads lista).

**SQL:** no ejecutado.
