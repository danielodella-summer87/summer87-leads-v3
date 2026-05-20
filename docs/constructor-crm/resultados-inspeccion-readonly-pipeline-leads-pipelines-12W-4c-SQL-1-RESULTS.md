# Resultados Inspección Read-Only Pipeline leads_pipelines 12W-4c-SQL-1-RESULTS — Constructor CRM Summer87

**Versión:** 12W-4c-SQL-1-RESULTS — resultados de inspección manual Supabase  
**Proyecto:** summer87-leads-v3  
**Base documental:** `inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1.md` (commit `8c3c38e`), auditoría SCHEMA-1 (`9c989e0`), plan 12W-4c (`b40bfd9`)  
**Ejecutor:** Daniel — Supabase SQL Editor (SELECT-only)  
**Estado:** inspección completada; **sin** escritura en BD ni cambios en repo de código.

| Campo | Valor |
|-------|--------|
| Fecha inspección | _Completar si aplica_ |
| Entorno Supabase | _Completar proyecto/URL_ |
| Total queries ejecutadas | Q1–Q11 (+ Q3b, Q3c, Q8b) |

---

## 1. Resumen ejecutivo

- **`leads_pipelines`** es el catálogo operativo (**18 filas** legacy); **`lead_pipelines`** existe (**9 filas**) pero **no** es la tabla que consume el CRM actual — no tocarla en esta línea de trabajo.
- **No existe** `stage_key`, `client_slug`, `tenant_id`, `activo` ni `contract_id` en `leads_pipelines`; el schema observado coincide con el repo y habilita diseñar DDL en fase posterior.
- Los **12 leads** están todos en pipeline **`Nuevo lead`**; **0 huérfanos** (Q8/Q8b); **17** filas de catálogo sin ningún lead asociado (Q9).
- **1** fila `tipo=ganado` (`Ganado`) y **1** `tipo=perdido` (`Perdido`); **0** duplicados de nombre (Q6) — no bloquea DDL, pero **sí** obliga estrategia antes de insertar `Venta ganada` / `Venta perdida` como terminales.
- **GO** para documentar resultados y **diseñar** DDL `stage_key` reversible; **NO-GO** para seed, UPDATE de `leads.pipeline`, DELETE legacy o sustituir el select por contrato directo.

---

## 2. Alcance

| Aspecto | Estado |
|---------|--------|
| Daniel ejecutó **SELECT** manualmente en Supabase | Sí |
| Cursor ejecutó SQL | **No** |
| Cambios de datos en Supabase | **No** |
| Supabase write (INSERT/UPDATE/DELETE/ALTER) | **No** |
| Código funcional modificado | **No** |
| Migraciones creadas | **No** |
| Build / Vercel | **No** tocados |

Este documento **solo** registra observaciones y dictamen para las fases **12W-4c-SQL-2** en adelante.

---

## 3. Resultados Q1–Q11

| Q | Resultado observado | Interpretación | Impacto |
|---|---------------------|----------------|--------|
| **Q1** | Columnas: `id` (uuid, PK default `gen_random_uuid()`), `created_at`, `updated_at`, `nombre` (text NOT NULL), `posicion` (int default 0), `color` (text nullable), `tipo` (text default `'normal'`), `orden` (int default 9999). **No** aparecen `stage_key`, `client_slug`, `tenant_id`, `activo`, `contract_id`. | Schema alineado con `estructura_base.sql` + migraciones 020/021. Puente contrato↔fila aún **no** existe en BD. | **GO** diseño DDL `stage_key` nullable en SQL-2. |
| **Q2** | Índices: `leads_pipelines_pkey`, `leads_pipelines_nombre_uq`, `leads_pipelines_orden_idx`, `leads_pipelines_posicion_idx`. Sin índice `stage_key`. | Unicidad por **nombre** (índice `nombre_uq`). Orden vía `orden` y `posicion`. | Seed futuro debe evitar colisiones de `nombre`; upsert por `stage_key` requerirá índice nuevo en DDL. |
| **Q3** | `lead_pipelines` **existe**. `leads_pipelines` **existe**. Q3b: **18** filas en `leads_pipelines`. Q3c: **9** filas en `lead_pipelines`. | Dos tablas homónimas en inglés/español; app usa **`leads_pipelines`** (SCHEMA-1). | **NO-GO** tocar `lead_pipelines`. Riesgo de confusión al escribir SQL manual. |
| **Q4** | **18** nombres: Nuevo, Nuevo lead, Visita, Investigación inicial, Evaluación, Diagnóstico comercial, Servicios, Contacto iniciado, Costeo, Reunión agendada, Cotización, Propuesta enviada, Propuesta, Negociación, Presentación, Ganado, Contrato, Perdido. | Catálogo **legacy** ≠ 9 etapas Pickup (`nuevo_contacto`…`postventa_seguimiento`). Select Vercel explica estas filas. Duplicidad conceptual: Nuevo / Nuevo lead; Propuesta / Propuesta enviada. | Materialización requiere **additive** + mapeo, no reemplazo ciego. |
| **Q5** | `ganado`: **1** → `["Ganado"]`. `perdido`: **1** → `["Perdido"]`. `normal`: **16**. | Respeta regla API (máx. un ganado y un perdido). | DDL OK. Seed con `Venta ganada`/`Venta perdida` como **tipo** ganado/perdido exige **reconciliar** filas `Ganado`/`Perdido` en misma transacción. |
| **Q6** | **0** filas duplicadas por `lower(trim(nombre))`. | Integridad actual del unique nombre. | Seed debe usar `label` únicos del contrato o mapear antes de INSERT. |
| **Q7** | **12** leads totales. Distribución: **`Nuevo lead` = 12**. | Sin diversidad de pipeline en datos reales; entorno demo acotado. | Migración `leads.pipeline` de bajo volumen **cuando** se apruebe; hoy todo en una etapa. |
| **Q8** | **0** filas huérfanas. Q8b: `leads_huerfanos = 0`. | Todo `leads.pipeline` matchea un `leads_pipelines.nombre` (`Nuevo lead`). | Kanban/lista estables **hoy**; cambios de nombre romperían match. |
| **Q9** | **17** filas de catálogo sin leads (todas excepto **Nuevo lead**). | Catálogo inflado vs uso real; solo una etapa operativa en uso. | Facilita planificación, pero **NO-GO** DELETE masivo de las 17 sin política de deprecación. |
| **Q10** | **1** columna: `leads.company_size` (text). Nada en `leads_pipelines` con client/tenant/slug. | `company_size` es campo descriptivo, **no** multi-tenant. | Catálogo **global por instancia** Supabase; `stage_key` sin `client_slug` coherente con datos. |
| **Q11** | **0** filas en nombres de cierre (ganado, perdido, cerrado, venta ganada, etc.). | Ningún lead en etapa terminal hoy. | `leadStatusPolicy` sin efecto inmediato en los 12 leads; sigue bloqueante **antes** de usar labels Pickup como `nombre` operativo. |

### Detalle Q4 — Inventario completo (referencia)

| # | nombre (leads_pipelines) | tipo (inferido Q5) | Leads asociados (Q7/Q9) |
|---|--------------------------|--------------------|-------------------------|
| 1 | Nuevo | normal | 0 |
| 2 | Nuevo lead | normal | **12** |
| 3 | Visita | normal | 0 |
| 4 | Investigación inicial | normal | 0 |
| 5 | Evaluación | normal | 0 |
| 6 | Diagnóstico comercial | normal | 0 |
| 7 | Servicios | normal | 0 |
| 8 | Contacto iniciado | normal | 0 |
| 9 | Costeo | normal | 0 |
| 10 | Reunión agendada | normal | 0 |
| 11 | Cotización | normal | 0 |
| 12 | Propuesta enviada | normal | 0 |
| 13 | Propuesta | normal | 0 |
| 14 | Negociación | normal | 0 |
| 15 | Presentación | normal | 0 |
| 16 | Ganado | ganado | 0 |
| 17 | Contrato | normal | 0 |
| 18 | Perdido | perdido | 0 |

*Tipos `ganado`/`perdido` asignados según Q5; filas `normal` no listadas individualmente en Q5.*

### Contrato Pickup (9 etapas) vs catálogo observado

| key contrato | label contrato | ¿Presente en Q4? |
|--------------|----------------|------------------|
| `nuevo_contacto` | Nuevo contacto | No (existe **Nuevo** / **Nuevo lead**) |
| `consulta_calificada` | Consulta calificada | No |
| `vehiculo_identificado` | Vehículo identificado | No |
| `necesidad_detectada` | Necesidad detectada | No |
| `presupuesto_enviado` | Presupuesto enviado | No (hay Cotización / Propuesta enviada) |
| `negociacion` | Negociación | Sí (**Negociación**) |
| `venta_ganada` | Venta ganada | No (hay **Ganado**) |
| `venta_perdida` | Venta perdida | No (hay **Perdido**) |
| `postventa_seguimiento` | Postventa / seguimiento | No |

---

## 4. Diagnóstico consolidado

| Hallazgo | Detalle |
|----------|---------|
| Catálogo operativo | **`leads_pipelines` = 18 filas** legacy (consultoría/operación), no las 9 Pickup. |
| Tabla homónima | **`lead_pipelines` = 9 filas** — existe pero **no** alimenta Nuevo Lead/Kanban/API actual. |
| Puente contrato | **Sin `stage_key`** (ni columnas tenant/activo/contract en catálogo). |
| Multi-cliente | **Sin scope** real; solo `leads.company_size` (descriptivo). |
| Datos leads | **12 leads**, todos en **`Nuevo lead`**. |
| Huérfanos | **0** — operación estable respecto a catálogo. |
| Catálogo sin uso | **17** etapas sin ningún lead. |
| Unicidad nombre | **0** duplicados case-insensitive (Q6). |
| Terminales | **1× Ganado** (`tipo=ganado`), **1× Perdido** (`tipo=perdido`). |
| Select Vercel | Coherente con Q4: lista legacy desde API, no labels contrato. |

---

## 5. GO / NO-GO

### GO (habilitado)

| Ítem | Estado |
|------|--------|
| Documentar resultados (este archivo) | ✅ |
| Diseñar DDL `stage_key` en **12W-4c-SQL-2** (documento + script revisable, sin ejecutar hasta aprobación) | ✅ |
| Planificar seed **idempotente** 9 etapas Pickup (diseño en SQL-3, **no** ejecutar ahora) | ✅ |
| Revisar estrategia de **terminales** (Ganado/Perdido vs Venta ganada/Venta perdida + `leadStatusPolicy`) | ✅ |

### NO-GO (bloqueado hasta fases posteriores explícitas)

| Ítem | Motivo |
|------|--------|
| Ejecutar **seed** ahora | Catálogo legacy 18 filas; terminales ocupadas; sin `stage_key` ni mapeo firmado |
| **UPDATE** `leads.pipeline` ahora | 12 leads estables en `Nuevo lead`; sin tabla de mapeo a contrato |
| **DELETE** filas legacy | 17 filas sin leads pero catálogo referenciado por UI/API; riesgo futuro |
| Reemplazar **select Pipeline** por contrato directo | Fuera de alcance; POST sigue `nombre` string |
| Tocar **`lead_pipelines`** | No es tabla operativa; 9 filas ajenas al flujo CRM documentado |

**Dictamen inspección:** **GO** para siguiente fase **documental** (SQL-2 DDL). **NO-GO** para materialización ejecutable inmediata.

---

## 6. Implicancias para próxima fase

**Recomendación:** **12W-4c-SQL-2** = diseño de DDL `stage_key` + script SQL revisable. **Todavía no ejecución** hasta que Daniel apruebe y tenga backup (protocolo 11Q).

El DDL propuesto debe contemplar:

| Requisito | Detalle |
|-----------|---------|
| `stage_key` | `TEXT NULL` en `leads_pipelines` |
| Índice | Único **parcial** `WHERE stage_key IS NOT NULL` |
| Fuera de alcance SQL-2 | **No** `ALTER leads.pipeline`; **no** INSERT/UPDATE catálogo; **no** DELETE legacy |
| Reversibilidad | `DROP INDEX` + `DROP COLUMN` documentados como rollback |
| Ejecución | Solo Daniel, manual, post-aprobación explícita |

Secuencia sugerida post-SQL-2:

1. **12W-4c-SQL-3** — seed idempotente (9 filas Pickup con `stage_key`, reconciliación `Ganado`/`Perdido`).
2. **12W-4c-SQL-4** — mapeo `Nuevo lead` → decisión producto; UPDATE leads si aplica.
3. **12W-4c-POL** — `leadStatusPolicy` si `nombre` materializado = labels contrato.
4. **12W-4c-QA** — Vercel Nuevo Lead / Kanban / ficha.

---

## 7. Decisiones pendientes (producto / arquitectura)

| # | Pregunta | Opciones / notas |
|---|----------|------------------|
| D1 | ¿Terminales operativos: **Venta ganada** / **Venta perdida** o conservar **Ganado** / **Perdido** como `nombre` con `stage_key` Pickup? | Q5: solo un slot `ganado`/`perdido`. Reconciliar en una transacción. |
| D2 | ¿Migrar **`Nuevo lead`** (12 leads) → **`Nuevo contacto`** o mantener hasta seed? | Q7/Q8: bajo riesgo volumen; impacto Kanban/POST por nombre. |
| D3 | ¿Qué hacer con **17 etapas** sin leads? | Deprecar con `activo` (no existe hoy) vs ocultar en API vs dejar hasta fase limpieza. |
| D4 | ¿Columna **`activo`** además de `stage_key`? | Inspección: no existe; plan 12W-4c sugirió `stage_key` primero. |
| D5 | ¿**leadStatusPolicy** antes o después del seed? | Q11: sin leads en cierre hoy; recomendación plan 12W-4c: **antes** si `nombre` = label Pickup. |
| D6 | ¿Relación **`lead_pipelines`** (9) vs contrato? | Fuera de scope operativo; documentar solo; no sincronizar en esta fase. |

---

## 8. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Confundir `lead_pipelines` vs `leads_pipelines` | Alta | Checklist SQL: siempre `leads_pipelines` |
| Catálogo inflado (18 vs 9) | Media | Seed additive; no DELETE sin política |
| Slots `ganado`/`perdido` ocupados | Alta | Reconciliar `Ganado`/`Perdido` antes de insertar terminales Pickup |
| UNIQUE `nombre` | Media | Mapear labels; Q6 hoy OK |
| Sin tenant en catálogo | Baja | `stage_key` global por instancia |
| DELETE de 17 filas “sin uso” | Media | Q9 no autoriza delete: UI/API aún las listan |
| Cambiar `leads.pipeline` sin mapeo | Alta | Q8=0 hoy; cualquier rename rompe los 12 leads |
| Romper Kanban | Alta | Matching por `nombre` string |
| `leadStatusPolicy` vs labels Pickup | Media | D5 antes de usar Venta ganada como nombre |
| Ejecutar seed sin backup | Alta | 11Q obligatorio en fase write |

---

## 9. Dictamen final

Los resultados de **12W-4c-SQL-1** habilitan avanzar al **diseño** de DDL `stage_key` (fase **12W-4c-SQL-2**), con script revisable y rollback documentado.

**No** habilitan todavía seed ni migración completa de `leads.pipeline`: el catálogo tiene **18 etapas legacy**, los slots terminales están ocupados por **Ganado**/**Perdido**, y las decisiones D1–D5 siguen abiertas.

La operación actual está **estable**: **12 leads** en **`Nuevo lead`**, **0 huérfanos**, sin leads en etapas de cierre. La siguiente fase debe ser **DDL controlado y reversible**, no materialización completa ni cambios en UI/POST.

El wiring **12W-4b** (snapshot `contract` / 9 en DOM) permanece válido y **desacoplado** del catálogo Supabase hasta las fases SQL-3+.

---

## 10. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado por Cursor | **No** |
| Supabase modificado (write) | **No** |
| Datos modificados | **No** |
| APIs modificadas | **No** |
| Middleware modificado | **No** |
| Vercel | **No** |
| Build ejecutado | **No** |
| Commit | **No** |
| Solo documentación | **Sí** — este archivo |

**Relacionado:** actualizar §6 de `inspeccion-readonly-pipeline-leads-pipelines-12W-4c-SQL-1.md` con enlace a este RESULTS es opcional en commit futuro; no requerido en esta pasada.
