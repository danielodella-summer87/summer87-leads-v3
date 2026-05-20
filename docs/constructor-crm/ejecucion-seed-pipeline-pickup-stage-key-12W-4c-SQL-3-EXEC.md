# Ejecución Seed Pipeline Pickup stage_key 12W-4c-SQL-3-EXEC — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-3-EXEC — registro de ejecución manual seed idempotente + POSTCHECK  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-seed-pipeline-pickup-stage-key-12W-4c-SQL-3.md` (commit `7621c7e`), `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md`, `resultados-inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1-RESULTS.md`  
**Ejecutor:** Daniel — Supabase SQL Editor (seed aprobado SQL-3)  
**Estado:** Seed aplicado; POSTCHECK OK; **sin** `UPDATE leads.pipeline`, **sin** DELETE legacy, **sin** tocar `lead_pipelines`, **sin** cambios de código.

| Campo | Valor |
|-------|--------|
| Fecha ejecución | _Completar si aplica_ |
| Entorno Supabase | _Completar proyecto/URL_ |
| Cursor ejecutó SQL | **No** |

---

## 1. Resumen ejecutivo

- Daniel ejecutó manualmente el seed idempotente SQL-3 en Supabase.
- Se poblaron **9** `stage_key` del contrato Pickup.
- **4** `stage_key` se asignaron a filas existentes.
- **5** filas nuevas fueron insertadas.
- No se tocaron `leads`, `lead_pipelines`, APIs ni código.

---

## 2. Alcance

| Aspecto | Estado |
|---------|--------|
| SQL ejecutado por Daniel en Supabase | **Sí** |
| SQL ejecutado por Cursor | **No** |
| Escritura realizada | **UPDATE** / **INSERT** solo en `public.leads_pipelines` |
| `UPDATE leads.pipeline` | **No** |
| `DELETE` / deprecación legacy | **No** |
| Tocar `lead_pipelines` | **No** |
| Cambios de código funcional | **No** |
| Migraciones en repo | **No** (fase documental) |

Este documento registra únicamente la ejecución aprobada de **12W-4c-SQL-3** y los POSTCHECK observados.

---

## 3. Seed ejecutado

Script completo y PRECHECK/ROLLBACK: ver `diseno-seed-pipeline-pickup-stage-key-12W-4c-SQL-3.md`.

### Resumen de operaciones

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| **UPDATE** | **4** | Asignar `stage_key` a filas existentes |
| **INSERT** | **5** | Crear filas nuevas con `stage_key` del contrato Pickup |

### Tabla de acciones

| Acción | `nombre` (fila operativa) | `stage_key` asignado | Origen fila |
|--------|---------------------------|----------------------|-------------|
| **UPDATE** | Nuevo lead | `nuevo_contacto` | existente |
| **UPDATE** | Negociación | `negociacion` | existente |
| **UPDATE** | Ganado | `venta_ganada` | existente |
| **UPDATE** | Perdido | `venta_perdida` | existente |
| **INSERT** | Consulta calificada | `consulta_calificada` | nueva |
| **INSERT** | Vehículo identificado | `vehiculo_identificado` | nueva |
| **INSERT** | Necesidad detectada | `necesidad_detectada` | nueva |
| **INSERT** | Presupuesto enviado | `presupuesto_enviado` | nueva |
| **INSERT** | Postventa / seguimiento | `postventa_seguimiento` | nueva |

**No ejecutado en esta fase:**

- `UPDATE leads.pipeline`
- `DELETE` de filas legacy
- Cualquier cambio en `lead_pipelines`

---

## 4. Resultado seed

| Campo | Valor |
|-------|--------|
| Resultado Supabase | `Success. No rows returned.` |
| Interpretación | Seed aplicado sin error; transacción confirmada. |

---

## 5. POSTCHECK

| Check | Resultado | Interpretación |
|-------|-----------|----------------|
| **POSTCHECK-1** | `con_stage_key_set = 9`, `con_stage_key_null = 14`, `total = 23` | Coherente con diseño conservador: 9 keys contrato + 14 legacy sin mapear; catálogo pasó de 18 a 23 filas. |
| **POSTCHECK-2** | 9 keys presentes (ver §6) | Las 9 etapas del contrato Pickup tienen fila única con `stage_key` NOT NULL. |
| **POSTCHECK-3** | Nuevo lead → `nuevo_contacto`; Negociación → `negociacion`; Ganado → `venta_ganada`; Perdido → `venta_perdida` | Los 4 mapeos críticos en filas existentes son correctos. |
| **POSTCHECK-4** | `Nuevo lead = 12` | Distribución de leads sin cambio; ningún lead migrado de etapa. |
| **POSTCHECK-5** | `leads_huerfanos = 0` | Todo `leads.pipeline` sigue resolviendo contra `nombre` en catálogo. |
| **POSTCHECK-6** | `perdido = 1` → `["Perdido"]`, `ganado = 1` → `["Ganado"]` | Restricción API (un ganado, un perdido) preservada; nombres terminales operativos intactos. |
| **POSTCHECK-7** | 5 filas nuevas existen: Consulta calificada, Vehículo identificado, Necesidad detectada, Presupuesto enviado, Postventa / seguimiento | INSERT del seed materializado en catálogo. |
| **POSTCHECK-8** | `lead_pipelines = 9` | Tabla de relación lead↔pipeline sin alteración. |

---

## 6. Estado final del catálogo operativo

Filas con `stage_key` poblado (contrato Pickup materializado):

| `stage_key` | `nombre` | `tipo` | `orden` | origen |
|-------------|----------|--------|---------|--------|
| `nuevo_contacto` | Nuevo lead | normal | 10 | existente |
| `consulta_calificada` | Consulta calificada | normal | 11 | nueva |
| `vehiculo_identificado` | Vehículo identificado | normal | 12 | nueva |
| `necesidad_detectada` | Necesidad detectada | normal | 13 | nueva |
| `presupuesto_enviado` | Presupuesto enviado | normal | 14 | nueva |
| `negociacion` | Negociación | normal | 70 | existente |
| `venta_ganada` | Ganado | ganado | 80 | existente |
| `venta_perdida` | Perdido | perdido | 90 | existente |
| `postventa_seguimiento` | Postventa / seguimiento | normal | 95 | nueva |

**Resto del catálogo:** 14 filas legacy con `stage_key` NULL (sin DELETE en esta fase).

---

## 7. Impacto operativo

| Área | Impacto |
|------|---------|
| **Nuevo Lead** | Sin cambio en payload — API y formulario siguen usando `nombre` (`Nuevo lead`). |
| **Kanban** | Puede mostrar columnas nuevas vacías si lista todo el catálogo `leads_pipelines`. |
| **Select Pipeline** | Puede mostrar **5** opciones nuevas además de las existentes. |
| **`leads.pipeline`** | Los **12** leads existentes siguen en `Nuevo lead`. |
| **Huérfanos** | **0** — POSTCHECK-5 confirmado. |
| **Terminales** | Se mantienen con nombres operativos **Ganado** / **Perdido** (`tipo` ganado/perdido intactos). |
| **`stage_key` en BD** | Disponible para fases futuras (filtro API, UI por key, migración leads). |

---

## 8. GO / NO-GO actualizado

### GO

- GO para documentar esta ejecución (presente documento).
- GO para **QA visual/operativa** (12W-4c-QA).
- GO para diseñar fase de filtro/deprecación legacy **si producto aprueba**.

### NO-GO

- NO-GO para `UPDATE leads.pipeline` sin plan **SQL-4**.
- NO-GO para `DELETE` legacy.
- NO-GO para cambiar select Pipeline a contrato directo todavía.
- NO-GO para tocar `lead_pipelines`.
- NO-GO para `leadStatusPolicy` salvo que se cambien nombres operativos terminales.

---

## 9. Riesgos restantes

- El catálogo ahora tiene **23** filas (18 originales + 5 INSERT).
- **14** filas legacy siguen sin `stage_key`.
- Select Pipeline y Kanban pueden verse más cargados al listar todo el catálogo.
- **Nuevo lead** conserva `nombre` legacy aunque `stage_key` sea `nuevo_contacto`.
- **Ganado** / **Perdido** conservan nombres legacy aunque `stage_key` sea `venta_ganada` / `venta_perdida`.
- No hay columna `activo` para ocultar legacy en UI/API.
- La API no filtra por `stage_key` todavía.

---

## 10. Próxima fase recomendada

### 12W-4c-QA

- Validar Nuevo Lead.
- Validar select Pipeline.
- Validar Kanban.
- Validar ficha.
- Confirmar que los **12** leads siguen en `Nuevo lead`.
- Confirmar que no hay errores visuales.

### Después (12W-4c-SQL-4 o 12W-4d — según decisión producto)

- Filtrar API por `stage_key`.
- Deprecar legacy.
- Agregar columna `activo`.
- Migrar `leads.pipeline`.
- UI/POST por `stage_key`.

---

## 11. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado por Cursor | **No** |
| SQL ejecutado por Daniel | **Sí** — seed SQL-3 aprobado |
| Supabase modificado | **Sí** — `leads_pipelines` |
| Datos de `leads` modificados | **No** |
| Filas catálogo modificadas | **Sí** — 4 UPDATE `stage_key` + 5 INSERT nuevas |
| `DELETE` ejecutado | **No** |
| `lead_pipelines` tocado | **No** |
| Seed ejecutado | **Sí** |
| APIs | **No** |
| Middleware | **No** |
| Vercel | **No** |
| Build | **No** |
| Commit | **No** (solo documentación en repo) |
| Solo documentación en repo | **Sí** |

---

*Documento generado en fase 12W-4c-SQL-3-EXEC. No sustituye migración versionada en `/migrations` ni `supabase/migrations/` — pendiente cuando Daniel apruebe copiar script al repo.*
