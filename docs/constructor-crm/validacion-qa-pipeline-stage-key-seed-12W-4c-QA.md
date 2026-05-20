# Validación QA Pipeline stage_key seed 12W-4c-QA — Constructor CRM Summer87

**Versión:** 12W-4c-QA — validación visual/operativa Vercel posterior a SQL-3-EXEC  
**Proyecto:** summer87-leads-v3  
**Base documental:** `ejecucion-seed-pipeline-pickup-stage-key-12W-4c-SQL-3-EXEC.md`, `diseno-seed-pipeline-pickup-stage-key-12W-4c-SQL-3.md`, `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md`  
**Commit base documentación:** `3cbd2c1` — Document Pickup pipeline seed execution  
**Validador:** Daniel — navegador en entorno Vercel  
**Dictamen:** **GO visual/operativo 12W-4c-QA**

| Campo | Valor |
|-------|--------|
| Cursor ejecutó SQL / modificó datos | **No** |
| Lead nuevo creado en QA | **No** |
| Cards movidas / cambios guardados | **No** |

---

## 1. Resumen ejecutivo

- QA visual/operativa realizada en Vercel posterior a **SQL-3-EXEC**.
- **Nuevo Lead** carga y el select Pipeline refleja las **5** nuevas etapas del seed.
- **Kanban** carga y muestra columnas nuevas vacías sin mover los **12** leads.
- **Ficha** de lead carga, permite edición/cancelación y mantiene etapa **Nuevo lead**.
- Dictamen: **GO visual/operativo**; sin cambios de datos en QA.

---

## 2. Alcance

| Incluido | Excluido |
|----------|----------|
| Validación visual en Vercel | Crear lead nuevo |
| Ruta `/admin/leads/nuevo` (Nuevo Lead) | Mover cards en Kanban |
| Select Pipeline (opciones visibles) | Guardar cambios en ficha o formulario |
| Ruta `/admin/leads/kanban` (Kanban) | Ejecutar SQL |
| Ficha de lead (desde Kanban → Ver) | Build |
| Modo edición y **Cancelar** | Cambios de código |
| | Migraciones |
| | Modificar APIs / middleware / Vercel |

---

## 3. Entorno

| Campo | Valor |
|-------|--------|
| **URL Vercel** | https://pickup4x4-crm-demo.vercel.app |
| **Fecha** | 2026-05-20 |
| **Usuario observado** | Daniel Admin |
| **Commit base doc** | `3cbd2c1` |
| **Estado BD previo (SQL-3-EXEC)** | **23** filas catálogo; **9** con `stage_key`; **14** legacy `stage_key` NULL; **12** leads en `Nuevo lead`; **0** huérfanos; `lead_pipelines` = **9** sin cambio |

**Rutas validadas:**

1. `/admin/leads/nuevo`
2. `/admin/leads/kanban`
3. Ficha de lead (abierta desde Kanban, botón **Ver**)

---

## 4. Validación Nuevo Lead

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Ruta `/admin/leads/nuevo` carga | Sin error | **GO** |
| Título visible | «Nuevo lead» | **GO** |
| Formulario visible | Sí | **GO** |
| Botón Guardar | Visible arriba a la derecha | **GO** |
| Select Pipeline carga | Sin error | **GO** |
| No se guardó lead nuevo | No se ejecutó POST de alta | **GO** (alcance QA) |

---

## 5. Validación Select Pipeline

| Grupo | Valores observados | Dictamen |
|-------|-------------------|----------|
| **Nuevas etapas seed** | Consulta calificada; Vehículo identificado; Necesidad detectada; Presupuesto enviado; Postventa / seguimiento | **GO** — las 5 INSERT de SQL-3 visibles |
| **Legacy existentes** | Nuevo lead; Nuevo; Investigación inicial; Visita; Diagnóstico comercial; Evaluación; Contacto iniciado; Servicios; Reunión agendada; Costeo; Propuesta enviada; Cotización; Negociación; Propuesta; Presentación; Contrato | **GO** — catálogo legacy sigue listado |
| **Terminales** | Ganado; Perdido | **GO** — nombres operativos intactos |
| **Final de lista** | Opciones legacy + nuevas coexisten (lista extendida) | **GO** — coherente con 23 filas sin filtro `stage_key`/`activo` |

---

## 6. Validación Kanban

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Ruta `/admin/leads/kanban` carga | Sin error | **GO** |
| Título / encabezado | «Pipeline visual» visible | **GO** |
| Columnas del pipeline | Visibles | **GO** |
| **Nuevo lead** — conteo leads | **12** leads en columna **Nuevo lead** | **GO** — sin migración `leads.pipeline` |
| **Consulta calificada** | Columna visible, **vacía** | **GO** |
| **Vehículo identificado** | Columna visible, **vacía** | **GO** |
| **Necesidad detectada** | Columna visible, **vacía** | **GO** |
| **Presupuesto enviado** | Columna visible, **vacía** | **GO** |
| **Postventa / seguimiento** | Columna visible, **vacía** | **GO** |
| Legacy visible | Nuevo lead, Nuevo, Investigación inicial, Visita, Diagnóstico comercial, Evaluación, Contacto iniciado, Servicios, Reunión agendada, Costeo, Propuesta enviada, Cotización, Negociación, Propuesta, Ganado, Presentación, Perdido, Contrato | **GO** |
| **Final del tablero** | Se observan **Contrato** y **Postventa / seguimiento** al final del scroll horizontal | **GO** |
| Pantalla rota / error visual | No observado | **GO** |
| Movimiento de cards | No se movieron leads en esta validación | **GO** (alcance QA) |

---

## 7. Validación Ficha

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Abrir desde Kanban | Botón **Ver** abre ficha | **GO** |
| Carga detalle | Sin error; lead «Demo — Consulta genérica accesorios» | **GO** |
| **Editar** | Entra a modo edición | **GO** |
| Botones en edición | Refrescar / Cancelar / Guardar / Eliminar visibles | **GO** |
| Acordeón **Datos del lead** | Abre correctamente | **GO** |
| Campo **Etapa** | Muestra **Nuevo lead** | **GO** — coherente con POSTCHECK-4 SQL-3 |
| **Cancelar** edición | Funciona; ficha estable | **GO** |
| Guardar cambios | No ejecutado | **GO** (alcance QA) |

---

## 8. Hallazgos

### Hallazgos esperados

| Hallazgo | Interpretación |
|----------|----------------|
| Catálogo ampliado en select y Kanban | Coherente con **5 INSERT** + **4 UPDATE** `stage_key` (SQL-3-EXEC). |
| Columnas nuevas vacías | Ningún lead asignado a etapas nuevas; seed no migró `leads.pipeline`. |
| **12** leads siguen en **Nuevo lead** | Estrategia conservadora SQL-3 confirmada en UI. |
| Legacy sigue visible | **14** filas sin `stage_key` + resto del catálogo listado por `nombre`. |

### Observaciones (no bloqueantes)

| Observación | Nota |
|-------------|------|
| Select Pipeline más cargado | Esperado: API/UI listan catálogo completo sin filtro por `stage_key` ni columna `activo`. |
| Kanban más columnas | Esperado: mismo motivo; scroll horizontal más largo. |

---

## 9. Riesgos pendientes

- **23** filas en catálogo `leads_pipelines`.
- **14** filas legacy sin `stage_key`.
- No hay columna **`activo`** para ocultar legacy en UI/API.
- La API no filtra por `stage_key` todavía.
- La UI sigue operando por **`nombre`** (`leads.pipeline`, selects, columnas Kanban).
- `leadStatusPolicy` no cambió (terminales **Ganado** / **Perdido** por nombre).
- No se validó **guardar lead nuevo** con pipeline nuevo en esta fase (POST real pendiente si producto lo requiere).

---

## 10. Dictamen final

**GO visual/operativo 12W-4c-QA.**

El seed **SQL-3** no rompió **Nuevo Lead**, **Kanban** ni **Ficha** en el entorno Vercel validado. No hay evidencia visual de regresión en las rutas probadas.

**Siguiente paso:** decidir entre **12W-4c-SQL-4** (deprecación/mapeo legacy controlado) o **12W-4d** (filtro API/UI por `stage_key` / vista separada), con decisión de producto previa.

---

## 11. Próximos pasos sugeridos

| Opción | Descripción |
|--------|-------------|
| **A — 12W-4d-FILTER** | Filtrar API/UI para mostrar solo filas con `stage_key` del contrato Pickup, o preparar vista separada operativa vs legacy. |
| **B — 12W-4c-SQL-4** | Deprecación / mapeo legacy controlado; eventual `activo`; migración `leads.pipeline` solo con plan explícito. |
| **C — QA POST** | Guardar lead nuevo con etapa del pipeline nuevo, si producto quiere validar POST real antes de filtrar catálogo. |

**Recomendación conservadora:** documentar decisión de producto (¿mostrar solo 9 etapas contrato vs catálogo completo?) **antes** de tocar API/POST o ejecutar SQL-4.

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado en QA | **No** |
| Supabase modificado en QA | **No** |
| Datos modificados en QA | **No** |
| Lead nuevo creado | **No** |
| Cards movidas | **No** |
| Guardar cambios ejecutado | **No** |
| APIs | **No** |
| Middleware | **No** |
| Vercel modificado | **No** |
| Build | **No** |
| Commit | **No** (solo documentación en repo) |
| Solo documentación | **Sí** |

---

*Documento generado en fase 12W-4c-QA. Registra observaciones de Daniel en Vercel; no sustituye pruebas automatizadas ni validación POST de alta de lead.*
