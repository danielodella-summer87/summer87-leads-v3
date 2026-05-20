# Diseño Filtro Pipeline stage_key 12W-4d-FILTER-DESIGN — Constructor CRM Summer87

**Versión:** 12W-4d-FILTER-DESIGN — diseño técnico de filtro operativo por `stage_key`  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento / código | Rol |
|--------------------|-----|
| `decision-catalogo-pipeline-post-seed-12W-4d-DECISION.md` | Decisión producto (commit `6136fac`) |
| `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md` | QA Vercel GO post seed |
| `ejecucion-seed-pipeline-pickup-stage-key-12W-4c-SQL-3-EXEC.md` | Estado BD |
| `diseno-seed-pipeline-pickup-stage-key-12W-4c-SQL-3.md` | Mapeos `nombre` ↔ `stage_key` |
| `app/api/admin/leads/pipelines/route.ts` | API catálogo (sin `stage_key` hoy) |
| `app/admin/leads/nuevo/page.tsx` | Select Pipeline + `useLeadsClientCrmMode()` |
| `app/admin/leads/kanban/page.tsx` | Columnas por `leads_pipelines` + agrupación por `lead.pipeline` |
| `app/admin/leads/[id]/page.tsx` | Ficha — `fetchEtapas()` |
| `app/admin/leads/page.tsx` | Lista + filtros + bulk |
| `app/admin/configuracion/components/PipelinesTab.tsx` | Admin catálogo completo |
| `lib/config/appMode.ts` | `APP_MODE` / `client_crm` |
| `app/admin/leads/LeadsClientCrmContext.tsx` | `isClientCrm` + snapshot `pipelineStages` |
| `lib/crmPackage/adapters/pipelineStages.ts` | Contrato 9 etapas (referencia, no fuente BD) |

**Estado:** **diseño listo para implementación** — **no** implica código ejecutado ni filtro aplicado en runtime.

**Decisión de trabajo asumida (desde 12W-4d-DECISION):** en superficies **operativas** bajo `client_crm`, mostrar solo las **9** filas con `stage_key IS NOT NULL`, con fallbacks que preserven leads legacy y administración en modos internos.

---

## 1. Propósito

Definir **cómo** implementar un filtro seguro del catálogo `leads_pipelines` para que el CRM Pickup / `APP_MODE=client_crm` muestre únicamente las etapas contractuales (`stage_key` poblado), **sin**:

- migrar `leads.pipeline` (sigue siendo `string` por **nombre**),
- borrar filas legacy,
- tocar `lead_pipelines`,
- cambiar `leadStatusPolicy` ni payload POST,
- romper ficha/Kanban cuando un lead tenga un `pipeline` legacy,
- limitar la vista admin de catálogo en instancias **constructor_base** / `installation_prep`.

El filtro es una **capa de presentación y contrato API**, no una migración de datos.

---

## 2. Estado actual

| Campo | Valor confirmado |
|-------|------------------|
| `leads_pipelines` total | **23** |
| `stage_key` set | **9** (contrato Pickup) |
| `stage_key` NULL (legacy) | **14** |
| Leads en **Nuevo lead** | **12** |
| Huérfanos (`leads.pipeline` sin match en `nombre`) | **0** |
| API `GET /api/admin/leads/pipelines` | `SELECT` sin `stage_key`; sin query params |
| UI operativa | Usa `nombre` en select, columnas Kanban, PATCH `pipeline: nombre` |
| `LeadsClientCrmContext` | Expone `isClientCrm` + snapshot contrato (`pipelineStages`) — **no** sustituye fetch BD hoy |
| QA 12W-4c-QA | **GO** (catálogo completo visible) |
| Columna `activo` | **No** existe |
| `/admin/configuracion` en `client_crm` | **403** (`configuracion/layout.tsx` redirige) — PipelinesTab **no** accesible en demo Pickup |

### Las 9 etapas contractuales (referencia)

| `stage_key` | `nombre` operativo (valor en `leads.pipeline`) |
|-------------|-----------------------------------------------|
| `nuevo_contacto` | Nuevo lead |
| `consulta_calificada` | Consulta calificada |
| `vehiculo_identificado` | Vehículo identificado |
| `necesidad_detectada` | Necesidad detectada |
| `presupuesto_enviado` | Presupuesto enviado |
| `negociacion` | Negociación |
| `venta_ganada` | Ganado |
| `venta_perdida` | Perdido |
| `postventa_seguimiento` | Postventa / seguimiento |

---

## 3. Problema a resolver

| Síntoma | Causa |
|---------|--------|
| Select Pipeline con ~23 opciones | API devuelve catálogo completo |
| Kanban con scroll largo y columnas legacy vacías | Misma fuente |
| Desalineación percepción Pickup vs BD | Contrato en config/adapter (9) vs UI (23) |
| Riesgo si se filtra a ciegas | Lead con `pipeline` = nombre legacy **no** aparecería en columna Kanban ni en select ficha |
| Admin necesita catálogo completo | En `client_crm` hoy no hay PipelinesTab; en modos internos sí — no aplicar filtro global en API sin opt-in |
| Reportes | Agrupan por `leads.pipeline` (nombre); no dependen del listado API en primera iteración |

**Objetivo del filtro:** reducir ruido en **flujo comercial** (`client_crm`) manteniendo **verdad operativa** de cada lead (`leads.pipeline` actual siempre visible y guardable).

---

## 4. Principios de diseño

| Principio | Descripción |
|-----------|-------------|
| **legacy_first / fallback seguro** | Nunca perder el valor actual del lead aunque no esté en el catálogo filtrado. |
| **No cambiar `leads.pipeline` todavía** | POST/PATCH siguen enviando **nombre**; sin backfill masivo. |
| **No ocultar valor actual del lead** | Ficha y Kanban deben reflejar la etapa real del registro. |
| **Operativo `client_crm` → contrato** | Fetch con `contractOnly=1` cuando `useLeadsClientCrmMode()` es true. |
| **Admin / modos internos → catálogo completo** | Sin `contractOnly` (o `contractOnly=0`). |
| **API expone `stage_key` antes del filtro UI confiable** | El cliente no debe inferir contrato solo por ausencia de filas legacy. |
| **No hardcodear Pickup en componentes** | Usar `isClientCrm` / query param, no lista fija de 9 nombres en TSX. |
| **Fuente única de filtro en servidor** | Query param en API; frontend solo elige cuándo pedirlo + merge legacy puntual. |
| **Compatibilidad hacia atrás** | Sin `contractOnly`, respuesta igual que hoy + campo opcional `stage_key`. |
| **No tocar `leadStatusPolicy`** | Terminales siguen por nombre **Ganado** / **Perdido**. |

---

## 5. Alternativas técnicas

### A — Filtrar en API por query param `?contractOnly=1`

| Pros | Contras |
|------|---------|
| Explícito, testeable, una regla en servidor | Cada consumidor debe pasar el param correcto |
| Admin y operativo pueden coexistir | Riesgo de olvidar param en una pantalla |
| Compatible con cache `no-store` actual | — |

**Veredicto:** **preferida** (parte del diseño recomendado).

---

### B — Filtrar automáticamente en API si `APP_MODE=client_crm`

| Pros | Contras |
|------|---------|
| Cero cambios en URLs de fetch en UI | Comportamiento distinto por deploy sin que el cliente lo vea |
| — | PipelinesTab / scripts / integraciones que esperan 23 filas en Vercel Pickup fallan |
| — | Difícil depurar (“¿por qué devuelve 9?”) |
| — | Mezcla política de producto con variable de entorno en route handler |

**Veredicto:** **rechazada** como comportamiento por defecto; opcional documentar solo como nota de **no** implementar salvo flag explícito distinto.

---

### C — Filtrar solo en frontend tras recibir `stage_key`

| Pros | Contras |
|------|---------|
| API cambia poco (solo agregar columna) | Sigue descargando 23 filas |
| — | Duplicación si otra pantalla olvida filtrar |
| — | Kanban/lista deben repetir merge legacy |

**Veredicto:** **complemento local** (merge columnas/orphans), **no** sustituto del filtro API.

---

### D — Endpoint nuevo `/api/admin/leads/pipelines/contract`

| Pros | Contras |
|------|---------|
| Separación clara de contratos | Dos endpoints a mantener; POST/PATCH/reorder siguen en el principal |
| — | Más superficie de documentación y QA |

**Veredicto:** **rechazada** en v1; query param es suficiente.

---

### E — No filtrar; badges / agrupación visual

| Pros | Contras |
|------|---------|
| Sin riesgo de ocultar leads | No resuelve select/Kanban cargados |
| — | Sigue confusión producto Pickup |

**Veredicto:** **rechazada** como solución principal; posible mejora UX futura.

---

### Recomendación consolidada

1. **Extender** `GET /api/admin/leads/pipelines` con `stage_key` en `SELECT` y respuesta.
2. **Agregar** query param explícito `contractOnly=1` → filtro `stage_key IS NOT NULL`.
3. **Superficies operativas** con `isClientCrmUi`: `fetch(".../pipelines?contractOnly=1")`.
4. **Superficies admin / modos internos**: fetch sin param (23 filas).
5. **Fallbacks** en UI: error API → hardcoded actual; lead fuera de lista → inyectar opción/columna; Kanban → columnas extra por leads cargados.

---

## 6. Superficies y comportamiento propuesto

| Superficie | Actual | Propuesta | Riesgo | Decisión |
|------------|--------|-----------|--------|----------|
| **Nuevo Lead** | `fetch("/api/admin/leads/pipelines")` sin filtro; default primer ítem ordenado | Si `isClientCrmUi`: `?contractOnly=1`; default **Nuevo lead** (sigue siendo primera etapa contract con `orden` 10) | Default incorrecto si orden cambia | **Implementar** en FILTER-2 |
| **Kanban** | Columnas = todas las filas API; cards por `norm(lead.pipeline) === norm(col.nombre)` | `contractOnly=1` + **merge columnas legacy** derivadas de `leads[]` cuyo `pipeline` no está en catálogo contract | Leads invisibles si solo 9 columnas | **Implementar** FILTER-3 con merge obligatorio |
| **Ficha lead** | `fetchEtapas()` lista todos los `nombre` | `contractOnly=1` si `isClientCrmUi`; si `lead.pipeline` ∉ lista → prepend `"Actual: {nombre}"` o incluir nombre sin duplicar | Usuario no puede re-seleccionar etapa legacy al editar | Aceptable v1; opción actual permite ver/guardar |
| **Lista leads** | `pipelines` para filtros y bulk; **no** usa `isClientCrmUi` hoy | **v1 sin cambio** en filtros dropdown; opcional FILTER-5: `contractOnly` solo en bulk destino | Filtro legacy sigue en lista completa | **No cambiar** filtros en primera implementación |
| **Bulk change** | Opciones = todos `pipelines.nombre` | Mismo criterio que operativo si se alinea lista en fase posterior; v1: **igual que lista** o contractOnly si bulk se considera operativo | Mover lead a etapa no listada | FILTER-5 opcional; v1 recomendar **contractOnly** si bulk es acción comercial |
| **Dashboard / reportes** | `pipeline` desde datos de leads (`uniq`) | **No tocar** en v1 | Cambiar agrupación rompe histórico | **NO-GO** primera implementación |
| **PipelinesTab** | `fetch` sin filtro; solo accesible si no `client_crm` | Sin `contractOnly` | N/A en Pickup demo | **Catálogo completo** siempre |
| **API pipelines** | GET sin `stage_key` | GET + `stage_key` + `contractOnly` | Sintaxis Supabase null filter | FILTER-1 |
| **LeadsClientCrmContext** | Snapshot contrato para DOM/debug | **No** reemplaza fetch; opcional helper futuro `pipelinesUrl()` | Dos fuentes de verdad | Mantener BD como fuente select/Kanban; snapshot para validación cruzada QA |

### Detalle Kanban (crítico)

Hoy `cardsByColumn` solo itera `columns` desde API. Si API devuelve 9 filas y un lead tiene `pipeline = "Investigación inicial"`, **no aparece en ninguna columna**.

**Algoritmo propuesto (frontend, post-fetch):**

```
contractCols = pipelinesFromApi  // 9 filas
usedNames = Set(contractCols.map(nombre normalizado))
for each lead in leads:
  p = norm(lead.pipeline ?? "Nuevo")
  if p not in usedNames:
    append synthetic column { id: `legacy-${p}`, nombre: lead.pipeline, color: gris, synthetic: true }
    usedNames.add(p)
sort: contractCols por orden; synthetic al final o agrupadas "Legacy"
```

Drag & drop hacia columnas contract sigue usando `target.nombre` en PATCH (sin cambios).

### Detalle Ficha

En selector edición (`etapas`):

```
names = contractOnly response → map nombre
if editing && lead.pipeline && !names.includes(lead.pipeline):
  names = [lead.pipeline, ...names]  // o label "Actual: …"
```

POST guardar ficha: sin cambios (`pipeline: string` nombre).

### Nuevo Lead

- `isClientCrmUi === true` → URL con `contractOnly=1`.
- Inicialización: preferir **Nuevo lead** explícito si existe en lista (`find nombre === "Nuevo lead"`) en lugar de `pipelinesRemote[0]` genérico (mejora robustez si orden cambia).
- POST alta: **sin cambios** — envía `pipeline: "Nuevo lead"` (nombre).

### Lista (`page.tsx`)

Código actual ya fusiona nombres de `pipelines` + nombres presentes en `rows` (legado huérfano en filtro). **Mantener** en v1 para no romper filtro por etapas legacy en datos.

---

## 7. Diseño API propuesto

**Ruta:** `GET /api/admin/leads/pipelines`  
**Archivo:** `app/api/admin/leads/pipelines/route.ts`

### Cambios

| Aspecto | Detalle |
|---------|---------|
| `SELECT` | Agregar `stage_key` → `"id,created_at,updated_at,nombre,posicion,tipo,color,orden,stage_key"` |
| Tipo `PipelineRow` | `stage_key?: string \| null` |
| Query | `contractOnly` — activo solo si valor exacto `"1"` |
| Filtro | Si `contractOnly=1`: `stage_key IS NOT NULL` |
| Orden | Igual: `.order("orden")` luego `.order("created_at")` |
| Auto-seed | **No modificar** bloque que inserta Nuevo/Perdido/Ganado si faltan — corre **antes** del select; aplica a toda instancia |
| POST/PATCH/reorder | Sin cambios en v1 |
| Compatibilidad | Clientes antiguos ignoran `stage_key`; sin param reciben 23 filas |

### Pseudocódigo

```ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contractOnly = searchParams.get("contractOnly") === "1";

  // … existing requiredPipelines bootstrap (unchanged) …

  const SELECT =
    "id,created_at,updated_at,nombre,posicion,tipo,color,orden,stage_key";

  let query = supabase
    .from("leads_pipelines")
    .select(SELECT)
    .order("orden", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (contractOnly) {
    query = query.not("stage_key", "is", null);
    // Alternativa documentada si falla en QA:
    // query = query.filter("stage_key", "not.is", null);
  }

  const { data, error } = await query;
  // … mismo NextResponse.json({ data, error: null }) …
}
```

### Validación técnica pendiente (implementación)

| Tema | Acción en FILTER-1 |
|------|-------------------|
| Sintaxis Supabase `.not("stage_key", "is", null)` | Probar en dev; fallback `.filter("stage_key", "not.is", null)` |
| Entorno sin columna `stage_key` | Precondición: SQL-2-EXEC aplicado; si no, error SQL claro |
| `contractOnly=1` con 0 filas | No debería ocurrir post seed; UI → fallback catálogo completo + `console.warn` |

### Contrato de respuesta (ejemplo)

```json
{
  "data": [
    {
      "id": "…",
      "nombre": "Nuevo lead",
      "stage_key": "nuevo_contacto",
      "tipo": "normal",
      "orden": 10
    }
  ],
  "error": null
}
```

---

## 8. Diseño frontend propuesto

### Helper compartido (recomendado en implementación)

```ts
// lib/leads/pipelinesFetch.ts (nuevo en fase FILTER, no en este doc)
function pipelinesListUrl(isClientCrm: boolean): string {
  const base = "/api/admin/leads/pipelines";
  return isClientCrm ? `${base}?contractOnly=1` : base;
}
```

Evita repetir string en 4 pantallas y reduce errores.

### Por pantalla

| Pantalla | Hook modo | Fetch | Notas |
|----------|-----------|-------|-------|
| `nuevo/page.tsx` | `useLeadsClientCrmMode()` ✅ ya | `pipelinesListUrl(isClientCrmUi)` | Default explícito «Nuevo lead» |
| `kanban/page.tsx` | **Agregar** `useLeadsClientCrmMode()` | contract URL + `mergeLegacyColumns(pipelines, leads)` | No filtrar leads cargados |
| `[id]/page.tsx` | `useLeadsClientCrmMode()` ✅ ya | contract URL en `fetchEtapas` + inject current | — |
| `page.tsx` (lista) | **Agregar** opcional v1 | Sin param en v1 | Bulk: evaluar en FILTER-5 |
| `PipelinesTab.tsx` | N/A (`client_crm` → 403) | Sin `contractOnly` | Solo modos internos |

### Tipos cliente

```ts
type PipelineRow = {
  id: string;
  nombre: string;
  // …existentes…
  stage_key?: string | null;
};
```

### Payload POST (Nuevo Lead / PATCH lead)

**Sin cambios:** `{ pipeline: "Nuevo lead" }` (nombre).

### Snapshot `usePipelineStagesConfig()`

Permanece para alineación documental y futuras etiquetas; **no** reemplaza opciones del select hasta fase de labels (fuera de FILTER v1).

---

## 9. Fallbacks obligatorios

| Escenario | Comportamiento |
|-----------|----------------|
| API falla (network/500) | Mantener `FALLBACK_PIPELINE_NAMES` / `["Nuevo","Perdido","Ganado"]` actuales por pantalla |
| `contractOnly=1` devuelve `[]` | Degradar a fetch sin param **o** fallback hardcoded; registrar warning dev |
| `lead.pipeline` no está en opciones filtradas | Inyectar en ficha; en Kanban, columna sintética legacy |
| `APP_MODE` ≠ `client_crm` | Fetch sin param → 23 filas (comportamiento actual) |
| BD sin columna `stage_key` | GET falla → mismo fallback error actual; documentar precondición SQL-2 |
| Lead en etapa contract | Sin fallback extra — caso nominal |
| Usuario mueve card a columna contract | PATCH con `nombre` destino — igual que hoy |

---

## 10. QA requerido para implementación futura (12W-4d-QA)

Entorno: Vercel `APP_MODE=client_crm` post deploy FILTER-1..4.

| # | Check | Criterio |
|---|-------|----------|
| 1 | Nuevo Lead — opciones | **9** etapas contract (+ no lista 14 legacy) |
| 2 | Nuevo Lead — guardar | Alta con default **Nuevo lead**; POST OK |
| 3 | Kanban — columnas | **9** columnas contract visibles |
| 4 | Kanban — 12 leads | Siguen en columna **Nuevo lead** |
| 5 | Kanban — columnas vacías nuevas | Consulta calificada, etc. vacías OK |
| 6 | Ficha — abrir/editar/cancelar | Etapa **Nuevo lead** visible; sin pérdida valor |
| 7 | Ficha — lead legacy (si existe test) | Columna/opción legacy visible si `pipeline` ∉ contract |
| 8 | Lista — filtros | Sin regresión (puede seguir mostrando nombres de leads) |
| 9 | Configuración PipelinesTab | Solo en modo interno: **23** filas |
| 10 | Reportes | Sin cambio comportamiento |
| 11 | Consola red | `GET ...?contractOnly=1` en operativo; respuesta incluye `stage_key` |
| 12 | Sin errores consola | 0 errores en rutas anteriores |

**No incluido en FILTER v1:** POST lead en etapa nueva distinta de Nuevo lead (opcional QA producto aparte).

---

## 11. NO-GO explícitos

| Ítem | Motivo |
|------|--------|
| DELETE / UPDATE legacy en BD | Fuera de alcance FILTER |
| `UPDATE leads.pipeline` masivo | SQL-4 / migración futura |
| POST/PATCH con `stage_key` en body | Rompe APIs y datos actuales |
| Cambiar `leadStatusPolicy` | Terminales por nombre |
| Ocultar valor actual de un lead en UI | Viola legacy_first |
| Filtrar `PipelinesTab` / config sin opt-out | Admin necesita 23 filas |
| `contractOnly` automático por `APP_MODE` en API | Ver §5-B |
| Aplicar filtro global en `constructor_base` sin evaluación | Solo `client_crm` UI |
| `lead_pipelines` | No tocar |
| SQL `activo` | Solo si FILTER insuficiente (SQL-4) |

---

## 12. Próximas fases

| Fase | Alcance | Entregable |
|------|---------|------------|
| **12W-4d-FILTER-1** | API: `stage_key` en SELECT + `contractOnly=1` | `route.ts` + tipos respuesta |
| **12W-4d-FILTER-2** | Nuevo Lead: URL condicional + default Nuevo lead | `nuevo/page.tsx` + helper URL |
| **12W-4d-FILTER-3** | Kanban: URL + merge columnas legacy | `kanban/page.tsx` |
| **12W-4d-FILTER-4** | Ficha: `fetchEtapas` + inject pipeline actual | `[id]/page.tsx` |
| **12W-4d-FILTER-5** (opcional) | Lista/bulk `contractOnly` si producto lo pide | `page.tsx` |
| **12W-4d-QA** | Vercel client_crm | Doc QA |
| **12W-4c-SQL-4** | `activo` / deprecación | Solo si sigue necesario post FILTER |

**Orden:** FILTER-1 → 2 → 3 → 4 → QA → (5 opcional).

---

## 13. Dictamen final

El filtro por `stage_key` debe implementarse como **capa de operación y contrato HTTP**, no como migración de datos.

**Diseño aprobado para implementación (técnico):**

- **API:** `stage_key` en respuesta + query param explícito `contractOnly=1`.
- **UI operativa:** consumo selectivo cuando `isClientCrm` (vía `useLeadsClientCrmMode()`), con merge/inject legacy en Kanban y ficha.
- **Admin / modos internos:** catálogo completo sin param.
- **Reportes y lista filtros v1:** sin cambio salvo decisión explícita posterior.

**No ejecutar código en esta fase** — este documento es la guía para 12W-4d-FILTER-1 en adelante.

---

## 14. Confirmación de alcance

| Ítem | Estado en 12W-4d-FILTER-DESIGN |
|------|--------------------------------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado | **No** |
| Supabase consultado/modificado | **No** |
| Datos modificados | **No** |
| APIs modificadas | **No** |
| Middleware | **No** |
| Vercel | **No** |
| Build | **No** |
| Commit | **No** |
| Solo documentación | **Sí** |

---

*Documento generado en fase 12W-4d-FILTER-DESIGN. Complementa `decision-catalogo-pipeline-post-seed-12W-4d-DECISION.md`; no sustituye implementación ni QA ejecutado.*
