# Validación API Pipeline stage_key filter 12W-4d-FILTER-1 — Constructor CRM Summer87

**Versión:** 12W-4d-FILTER-1 — API GET expone `stage_key` + filtro `contractOnly=1`  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md`, `decision-catalogo-pipeline-post-seed-12W-4d-DECISION.md`, `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`, `ejecucion-seed-pipeline-pickup-stage-key-12W-4c-SQL-3-EXEC.md`

---

## 1. Resumen ejecutivo

- La API `GET /api/admin/leads/pipelines` ahora expone el campo `stage_key` en cada fila del catálogo.
- Las peticiones sin query param `contractOnly` mantienen el catálogo completo (23 filas en el entorno post-seed documentado).
- Las peticiones con `contractOnly=1` devuelven solo filas con `stage_key IS NOT NULL` (9 filas en el entorno post-seed documentado).
- Los handlers `POST`, `PATCH` (reorder) y la lógica de auto-seed Nuevo/Ganado/Perdido no fueron modificados en comportamiento ni en contrato de escritura.
- La UI operativa todavía no consume el filtro; la integración en Nuevo Lead, Kanban y Ficha corresponde a fases 12W-4d-FILTER-2 en adelante.

---

## 2. Alcance

### Incluido

- Handler `GET` en `app/api/admin/leads/pipelines/route.ts`.
- `stage_key` en el `SELECT` del listado GET.
- Query param `contractOnly=1` con filtro `stage_key IS NOT NULL`.
- Este documento de validación.

### Excluido

- UI (`app/admin/leads/*`, `PipelinesTab`, Kanban, Ficha, Lista, Nuevo Lead).
- SQL, migraciones y ejecución de seeds.
- Cambios en Supabase (proyecto, políticas, esquema).
- Modificación de datos en BD.
- `POST`, `PATCH`, `DELETE` del mismo route.
- Middleware, `.env`, Vercel.

---

## 3. Cambio técnico

**Archivo modificado:** `app/api/admin/leads/pipelines/route.ts`

| Elemento | Detalle |
|----------|---------|
| Constante | `SELECT_GET = SELECT + ",stage_key"` — solo usada en GET |
| Tipo | `PipelineRow` admite `stage_key?: string \| null` (campo adicional en respuesta GET) |
| Firma GET | `GET(request: Request)` — lectura de URL |
| Query param | `contractOnly === "1"` → filtro activo |
| Filtro Supabase | `query.not("stage_key", "is", null)` cuando `contractOnly` |
| Orden | Sin cambio: `orden` asc (`nullsFirst: false`), luego `created_at` asc |
| Auto-seed | Bloque Nuevo/Perdido/Ganado intacto; corre antes del listado en todos los GET |
| POST/PATCH | Siguen usando `SELECT` sin `stage_key` |

---

## 4. Comportamiento esperado

| Request | Resultado esperado |
|---------|-------------------|
| `GET /api/admin/leads/pipelines` | ~23 filas; cada objeto incluye `stage_key` (valor o `null`) |
| `GET /api/admin/leads/pipelines?contractOnly=1` | ~9 filas; todas con `stage_key` no null |
| `POST /api/admin/leads/pipelines` | Sin cambio (misma validación, mismo `SELECT` en respuesta) |
| `PATCH` reorder | Sin cambio |

---

## 5. Validación local sugerida

**Nota:** Daniel ejecuta estos comandos manualmente con el dev server en `http://localhost:3000`. No se ejecutan desde Cursor salvo que el servidor ya esté levantado.

```bash
# Catálogo completo + stage_key
curl -s http://localhost:3000/api/admin/leads/pipelines | jq '.data | length, [.data[] | .stage_key]'

# Solo contrato (stage_key poblado)
curl -s "http://localhost:3000/api/admin/leads/pipelines?contractOnly=1" | jq '.data | length, [.data[] | {nombre, stage_key}]'

# Verificar que ninguna fila del filtro tiene stage_key null
curl -s "http://localhost:3000/api/admin/leads/pipelines?contractOnly=1" | jq '[.data[] | select(.stage_key == null)] | length'
# Esperado: 0
```

---

## 6. Riesgos

| Riesgo | Mitigación / nota |
|--------|-------------------|
| Entorno sin columna `stage_key` | Fallaría el GET; requiere seed/migración 12W-4c ya aplicada en prod documentada |
| UI sigue mostrando 23 etapas | Esperado hasta FILTER-2+; no es regresión de API |
| `contractOnly=1` devuelve vacío si seed no aplicado | Documentar en QA de despliegue |
| Admin / `constructor_base` debe seguir sin param | Catálogo completo por defecto |

---

## 7. Próximas fases

| Fase | Alcance |
|------|---------|
| 12W-4d-FILTER-2 | Nuevo Lead — `client_crm` consume `contractOnly=1` |
| 12W-4d-FILTER-3 | Kanban |
| 12W-4d-FILTER-4 | Ficha |
| QA | Validación cruzada operativa + admin |

---

## 8. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | Sí — solo API GET |
| UI modificada | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos modificados | No |
| POST/PATCH/DELETE modificados | No |
| Build ejecutado | Sí — `npm run build` exit 0 (Next.js 16.0.11) |
| Commit | No (por instrucción de fase) |

---

## 9. Validación agente (build + grep + git)

### `npm run build`

- **Resultado:** exit **0** — compilación y TypeScript OK.

### Grep `contractOnly` en `*.ts` / `*.tsx`

- **Solo** `app/api/admin/leads/pipelines/route.ts` (GET).
- **UI:** sin referencias.

### Grep `stage_key` en `app/`

- `app/api/admin/leads/pipelines/route.ts` — cambio FILTER-1.
- `app/admin/constructor-crm/paquetes/[id]/page.tsx` — comentario `futureFields` preexistente; **no** modificado en esta fase.

### `git status`

```
modified:   app/api/admin/leads/pipelines/route.ts
untracked:  docs/constructor-crm/validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md
```

Sin commit (instrucción de fase).
