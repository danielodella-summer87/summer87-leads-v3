# Auditoría Schema Dataset Pickup 4x4 12N-schema-audit — Constructor CRM Summer87

**Versión:** 12N-schema-audit — inspección de código (repo only)  
**Relacionado con:** `dataset-ficticio-pickup4x4-12N-real.md`, `limpieza-semilla-datos-piloto-12N.md`

**Estado:** auditoría **documentada**. **No** se consultó Supabase, **no** se ejecutó SQL, **no** se modificaron datos.

---

## 2. Resumen ejecutivo

Se audita el **repositorio** para preparar una futura carga del dataset ficticio Pickup 4x4 (**12N-impl**), sin asumir columnas que no aparezcan en código o migraciones del repo.

| Aspecto | Detalle |
|---------|---------|
| Fuente de verdad en esta fase | Código TypeScript (API routes, UI, `migrations/*.sql`) |
| Supabase en vivo | **No** consultado — lo no verificable en BD queda **pendiente** |
| Objetivo | Decidir método de carga: UI manual, SQL revisable, seed o importación |
| Hallazgo clave | **Agenda ≠ tabla `agenda`** — las actividades viven en **`socio_acciones`** |
| Hallazgo clave | Leads usan columna **`pipeline`** (texto, nombre de etapa); catálogo en **`leads_pipelines`** |

---

## 3. Alcance inspeccionado

| Área | Archivos / rutas inspeccionados | Resultado |
|------|----------------------------------|-----------|
| **Leads UI** | `app/admin/leads/page.tsx`, `app/admin/leads/[id]/page.tsx`, `app/admin/leads/kanban/page.tsx`, `app/admin/leads/importar/page.tsx` | Listado/kanban vía `GET/POST /api/admin/leads`; `leads87` redirige a `/admin/leads` |
| **Leads API** | `app/api/admin/leads/route.ts`, `app/api/admin/leads/[id]/route.ts`, `app/api/admin/leads/pipelines/route.ts`, `app/api/admin/leads/bulk/route.ts`, `app/api/admin/leads/import/route.ts`, `app/api/admin/leads/unassigned/route.ts` | Tabla **`leads`**; POST con `nombre` obligatorio |
| **Agenda UI** | `app/admin/agenda/page.tsx` | Consume `GET/POST /api/admin/agenda`; owners vía `GET /api/admin/agenda/owners` |
| **Agenda API** | `app/api/admin/agenda/route.ts`, `app/api/admin/agenda/[id]/route.ts`, `app/api/admin/agenda/owners/route.ts` | Tabla **`socio_acciones`** |
| **Reportes** | `app/admin/reportes/ReportesClient.tsx`, `app/admin/reportes/comercial/leads/page.tsx`, `app/admin/reportes/comercial/pipeline/*` | Hub + reporte comercial leads (`GET /api/admin/leads`); muchas cards “próximamente” |
| **Pipeline / estados** | `app/api/admin/leads/pipelines/route.ts`, `lib/leads/leadStatusPolicy.ts`, `app/admin/leads/kanban/page.tsx` | Tabla **`leads_pipelines`**; lead usa **`leads.pipeline`** (string) |
| **Owners / usuarios** | `app/api/admin/agenda/owners/route.ts`, cookie `x-user-id`, tablas `app_users`, `comerciales` | Invitados: `invited_user_ids`; comercial: `comercial_id` → `comerciales` |
| **Migraciones** | `migrations/020_add_lead_id_to_socio_acciones.sql`, `migrations/030_add_invited_users_to_socio_acciones.sql`, `migrations/023_create_comerciales_table.sql`, `migrations/021_leads_pipelines_add_orden.sql`, etc. | Confirma FKs y columnas agenda/leads |

---

## 4. Hallazgos Leads

| Elemento | Evidencia en código | Tabla / campo inferido | Confirmado por código | Pendiente |
|----------|---------------------|------------------------|----------------------|-----------|
| Tabla principal | `supabase.from("leads")` en `app/api/admin/leads/route.ts` | **`public.leads`** | ✅ | Verificar RLS/policies en Supabase |
| Creación | `POST /api/admin/leads` | `insert` en `leads` | ✅ | — |
| Campo obligatorio | `if (!nombre)` → 400 | **`nombre`** (TEXT, no vacío) | ✅ | NOT NULL en BD |
| Etapa comercial (kanban/listados) | `pipeline` en `LeadRow`; default POST `"Nuevo"` | **`leads.pipeline`** (string) | ✅ | Valores válidos = nombres en `leads_pipelines` |
| Campo `estado` | En `SELECT` y `insert` | **`leads.estado`** (string, opcional) | ✅ | Uso en UI vs `pipeline` — verificar en pantalla |
| Origen demo | `origen: cleanStr(body.origen)` en POST | **`leads.origen`** | ✅ | — |
| Notas demo | `notas: cleanStr(body.notas)` | **`leads.notas`** | ✅ | — |
| Contacto | `contacto`, `telefono`, `email` | columnas en `leads` | ✅ | — |
| Comercial asignado | `comercial_id` UUID opcional | **`leads.comercial_id`** | ✅ | FK a **`comerciales`** (no `app_users`) — pendiente en BD |
| Empresa | `empresa_id` opcional; join `empresas` | **`leads.empresa_id`** → `empresas` | ✅ | Opcional para demo mínima |
| Rating / próxima actividad en lead | `rating`, `next_activity_type`, `next_activity_at` | columnas en `leads` | ✅ | No sustituyen `socio_acciones` para Agenda |
| Tags en lead | No en `insert` POST principal | **No hay `tags` en leads** en API | ✅ (ausencia) | `etiquetas` en join **`empresas`** solo |
| Prioridad explícita | `score`, `score_categoria` en SELECT | **`leads.score`**, **`score_categoria`** | ✅ | No equivale a “Prioridad” del doc 12N-real |
| Cierre / ganado-perdido | `lib/leads/leadStatusPolicy.ts` | Por **nombre** en `leads.pipeline` | ✅ | Mapear 12N a nombres reales, no IDs |
| `company_id` / tenant | No en APIs leads inspeccionadas | **No confirmado en repo** | ❌ en código app | Pendiente si existe en `estructura_base.sql` |
| Import masivo | `POST /api/admin/leads/import` | `leads` | ✅ | Fuera de alcance demo inicial |
| Permiso crear | `requirePermission(..., "leads.write")` | RBAC | ✅ | Usuario Daniel debe tener permiso |

**Riesgos Leads:** inventar valores de `pipeline` que no existan en `leads_pipelines`; confundir `estado` con `pipeline`; `comercial_id` inválido si no hay fila en `comerciales`.

---

## 5. Hallazgos Agenda

| Elemento | Evidencia en código | Tabla / campo inferido | Confirmado por código | Pendiente |
|----------|---------------------|------------------------|----------------------|-----------|
| Tabla principal | `.from("socio_acciones")` en `app/api/admin/agenda/route.ts` | **`public.socio_acciones`** | ✅ | — |
| No es tabla `agenda` | Sin `.from("agenda")` en API agenda | N/A | ✅ | — |
| Creación | `POST /api/admin/agenda` | `insert` en `socio_acciones` | ✅ | — |
| Tipo obligatorio | `if (!tipo) throw` | **`tipo`** (string) | ✅ | UI: `llamada`, `whatsapp`, `email`, `reunion` |
| Fecha obligatoria | `fecha_limite` YYYY-MM-DD | **`fecha_limite`** | ✅ | — |
| Hora | default `00:00` | **`hora`** | ✅ | — |
| Nota / lugar | opcionales | **`nota`**, **`lugar`** | ✅ | — |
| Vinculo lead | `owner_type=lead` + `lead_id` | **`lead_id`** (UUID); `socio_id` null | ✅ | FK `leads(id)` (migración 020) |
| Vinculo socio | `owner_type=socio` + `socio_id` | **`socio_id`** | ✅ | No requerido para demo Pickup centrada en leads |
| Comercial actividad | `comercial_id` opcional | **`comercial_id`** → join `comerciales` | ✅ | UUID válido en `comerciales` |
| Invitados | `invited_user_ids` array | **`invited_user_ids`** `uuid[]` (migración 030) | ✅ | Incluir **id `app_users`** de Daniel para vista “mine” |
| Pendiente vs hecha | GET filtra `.is("realizada_at", null)` | **`realizada_at`** NULL = pendiente | ✅ | Completar = set `realizada_at` (PATCH) |
| Scope “mine” | `contains("invited_user_ids", [currentAppUserId])` | Cookie **`x-user-id`** = `app_users.id` | ✅ | Sin invitación, actividad no aparece en “mine” |
| Listado owners | `GET /api/admin/agenda/owners` | `leads`, `socios`, `app_users` | ✅ | No usa `/api/admin/users` |
| Relación lead en UI | Tras insert, GET carga `leads` por `lead_id` | Join lógico en API | ✅ | — |

**Riesgos Agenda:** crear actividad sin `invited_user_ids` → no visible en filtro por defecto; `lead_id` inexistente → error FK; mezclar `socio_id` y `lead_id`.

---

## 6. Hallazgos Reportes

| Aspecto | Evidencia | Implicación para dataset 12N |
|---------|-----------|-------------------------------|
| Hub principal | `ReportesClient.tsx` — mayoría cards `disabled` / “Próximamente” | Demo no depende del hub |
| Reporte comercial leads | `app/admin/reportes/comercial/leads/page.tsx` → `fetch("/api/admin/leads")` | **Sí** consume filas `leads` reales |
| Filtros reporte leads | Querystring: `q`, `origen`, `pipeline`, `estado`, fechas | Métricas del doc 12N deben alinear **`pipeline`** / `origen` |
| Pipeline report | `comercial/pipeline` — cliente separado | Pendiente inspección profunda; probablemente derivado de leads |
| Dashboard | `app/admin/dashboard/page.tsx` → `fetch("/api/admin/leads")` | KPIs derivados de **mismos leads** + libs `lib/crm/dashboard*` |
| Agenda en reportes | No se encontró `app/api/admin/reportes` | Reportes **no** confirman métricas de agenda vía API dedicada |
| Métricas 12N “actividades vencidas” | `lib/crm/metrics.ts` menciona `socio_acciones` en contexto leads | Dashboard puede usar meta lead + agenda; **pendiente** trazado completo en UI |

**Pendiente:** confirmar si algún reporte agrega `GET /api/admin/agenda` (no visto en rutas `app/api/admin/reportes`).

**Resultado esperado demo:** con 10–12 `leads` y pipelines variados, **reporte comercial leads** y **dashboard** deberían mostrar datos; métricas puras de agenda pueden quedar **subrepresentadas** si solo se cargan leads.

---

## 7. Estados / pipeline

| Concepto | Evidencia | Cómo mapear dataset 12N-real | Pendiente |
|----------|-----------|------------------------------|-----------|
| Catálogo etapas | `TABLE = "leads_pipelines"` en `app/api/admin/leads/pipelines/route.ts` | Consultar `GET /api/admin/leads/pipelines` en entorno demo | Lista exacta en BD |
| Columnas pipeline | `id, nombre, posicion, tipo, color, orden` | `tipo`: `normal` \| `ganado` \| `perdido` | — |
| Seeds en GET pipelines | Inserta si faltan: **Nuevo**, **Perdido**, **Ganado** | Mínimo garantizado en runtime al listar pipelines | Otros nombres dependen de datos existentes |
| Valor en lead | `leads.pipeline` string; filtro `.eq("pipeline", ...)` | Usar **`nombre`** de fila en `leads_pipelines`, no UUID | Verificar nombres extra en Supabase |
| Estados 12N-real (Nuevo, Contactado, …) | No hay tabla `lead_status` en API | Mapear a **`pipeline`** existente o crear etapas vía UI/config (fuera de este doc) | **No** insertar IDs inventados |
| Política cierre | `leadStatusPolicy.ts` — cierra por nombre `ganado`, `perdido`, etc. | “Ganado” / “Perdido” alineados a nombres normalizados | Acentos/capitalización |
| Campo `estado` | Columna separada en `leads` | Opcional; uso en reporte filtros | Confirmar si UI operativa lo muestra |
| Kanban | `app/admin/leads/kanban/page.tsx` + pipelines API | Carga visual por `pipeline` | — |

**Riesgo crítico:** cargar `pipeline: "Cotización enviada"` sin fila en `leads_pipelines` puede funcionar en listado SQL pero **romper** kanban o coherencia de reportes — **pendiente verificación en Supabase y UI**.

---

## 8. Owners / responsables

| Concepto | Evidencia | Uso en dataset | Pendiente |
|----------|-----------|----------------|-----------|
| Usuarios app | `app_users` en `agenda/owners` | Invitados agenda (`invited_user_ids`) | UUID de Daniel en **`app_users`** |
| Comerciales | `comerciales` tabla (migración 023); join en agenda | `leads.comercial_id`, `socio_acciones.comercial_id` | ¿Existe fila para Daniel en `comerciales`? |
| Endpoint owners | `GET /api/admin/agenda/owners` | Picker de leads/socios/users al crear actividad | — |
| Sin `/api/admin/users` en agenda | 12O-run validado | Correcto para `client_crm` | — |
| Cookie sesión | `x-user-id` en agenda GET | Debe coincidir con `app_users.id` | — |
| Roles | `roles` join en owners users | Solo display | — |

**Recomendación dataset:** usar **`owner_type: lead`** + `lead_id` de leads demo; en cada actividad incluir **`invited_user_ids: [<id Daniel app_users>]`**; `comercial_id` opcional si hay comercial válido.

---

## 9. Campos recomendados para marcar demo

### Confirmados por código

| Campo | Tabla / uso | Uso sugerido demo |
|-------|-------------|-------------------|
| `nombre` | `leads` | Prefijo “Demo — …” |
| `origen` | `leads` | `demo_12N_pickup4x4` |
| `notas` | `leads` | `[DEMO] …` |
| `pipeline` | `leads` | Etapa mapeada a `leads_pipelines.nombre` |
| `contacto`, `email`, `telefono` | `leads` | Ficticios; email `@example.com` |
| `estado` | `leads` | Opcional (string libre) |
| `tipo`, `nota`, `fecha_limite`, `hora` | `socio_acciones` | Actividades agenda |
| `lead_id` | `socio_acciones` | UUID del lead demo creado antes |
| `invited_user_ids` | `socio_acciones` | UUID `app_users` del tester |

### Pendientes de verificar en Supabase

| Campo | Motivo |
|-------|--------|
| `tags` en leads | No aparece en POST/SELECT leads API |
| `etiquetas` | En **`empresas`**, no en lead directo |
| `installation_details_json` / campos Casalimpia | Muchos campos opcionales en SELECT — no necesarios para demo Pickup |
| `closed_at` / `closed_result` | Usados en `leadStatusPolicy` — no confirmado en insert POST |
| `initiative_kind`, `commercial_stage` | En SELECT extendido — opcional |
| Constraints NOT NULL adicionales | Solo `estructura_base.sql` / migraciones en instancia real |

---

## 10. Método de carga recomendado

| Opción | Pros (según auditoría repo) | Contras |
|--------|----------------------------|---------|
| **A — UI manual** | Respeta RBAC (`leads.write`); valida FK `lead_id`; sin SQL; fácil rollback fila a fila | Lento para 12+12 registros |
| **B — SQL revisable** | Rápido una vez confirmado schema | Riesgo entorno equivocado; FK/NOT NULL; **no ejecutar automáticamente** |
| **C — Script seed temporal** | Repetible | Requiere código nuevo (fuera de 12N-schema-audit) |
| **D — CSV / import** | Existe `POST /api/admin/leads/import` | Mapeo columnas; riesgo masivo |

**Recomendación para primera demo interna (Vercel + Supabase actual):**

> **A — Carga manual por UI** con checklist derivado de `dataset-ficticio-pickup4x4-12N-real.md` §8–§9, creando primero leads y luego actividades con `lead_id` e `invited_user_ids`.

Si se necesita rapidez tras confirmar schema en Supabase: preparar **SQL revisable en fase posterior** (documento aparte), **aplicación manual** por Daniel, nunca ejecución automática desde agente.

**No escribir SQL en este documento.**

---

## 11. Riesgos técnicos antes de 12N-impl

| Riesgo | Detalle |
|--------|---------|
| Campos obligatorios no vistos en UI | `nombre`, `tipo`, `fecha_limite`, `owner_type` + `lead_id` |
| `pipeline` inexistente en catálogo | Valores 12N-real no mapeados |
| `comercial_id` inválido | FK a `comerciales` |
| `invited_user_ids` vacío | Agenda “mine” vacía |
| Supabase actual con datos heredados | Mezcla con demo |
| Relación lead–agenda | Solo vía `socio_acciones.lead_id` |
| Reportes agenda | Pueden no reflejar solo carga de `socio_acciones` |
| `company_id` / multi-tenant | No confirmado en capa leads API |
| Entorno equivocado | Cargar en producción o base madre |
| SQL sin backup | Rollback difícil |

---

## 12. Checklist antes de crear 12N-impl

- [ ] Confirmar **schema real** en Supabase (`leads`, `socio_acciones`, `leads_pipelines`, `comerciales`, `app_users`)
- [ ] Listar **`leads_pipelines.nombre`** existentes y tabla de mapeo 12N → `pipeline`
- [ ] Confirmar **UUID** de Daniel en `app_users` (y opcional en `comerciales`)
- [ ] Confirmar **permisos** `leads.write` / `leads.read` en demo
- [ ] Confirmar **entorno** (Vercel demo, no prod)
- [ ] **Backup** o snapshot Supabase / plan de borrado demo
- [ ] Decidir método: **UI manual** (recomendado) vs SQL revisable
- [ ] Decidir demo técnica vs piloto de valor (**12N-real**)
- [ ] Aprobar explícitamente carga (Daniel)

---

## 13. Dictamen

> **GO** para avanzar a una fase **12N-impl** de **diseño/ejecución de carga**, con método preferente **UI manual** tras mapeo de pipelines.  
> **NO-GO** para **insertar datos** hasta: confirmar schema en Supabase, estados/`pipeline` válidos, usuario responsable (`app_users` + `invited_user_ids`) y rollback.

---

## 14. Próximo paso recomendado

| Paso | Acción |
|------|--------|
| 1 | En Supabase (solo lectura): listar `leads_pipelines`, muestra de `leads`, columnas `socio_acciones` |
| 2 | Completar tabla de mapeo: estados 12N-real → `leads.pipeline` |
| 3 | Obtener UUID `app_users` de Daniel en entorno demo |
| 4 | Ejecutar carga **manual** en Vercel: 12 leads → 8 actividades |
| 5 | Smoke: dashboard, leads, agenda, reporte comercial leads |
| 6 | Si se opta por SQL: nuevo doc **SQL revisable**, aplicación **manual** por Daniel |

---

## 15. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| TypeScript nuevo | **No** |
| SQL ejecutado / SQL en este doc | **No** |
| Supabase consultado | **No** |
| Datos modificados | **No** |
| Endpoints / APIs / middleware | **No** modificados |
| Migraciones nuevas | **No** |
| Usuarios creados | **No** |
| Kore / Zeta | **No** tocados |
| Commits | **No** en esta acción |
| Entregable | Solo este documento de auditoría |

---

*Documento 12N-schema-audit — inspección repo para dataset ficticio Pickup 4x4. Siguiente: verificación Supabase + 12N-impl.*
