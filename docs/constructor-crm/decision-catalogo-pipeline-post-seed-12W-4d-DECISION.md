# Decisión Catálogo Pipeline post seed 12W-4d-DECISION — Constructor CRM Summer87

**Versión:** 12W-4d-DECISION — decisión producto/arquitectura sobre catálogo `leads_pipelines` post seed  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento | Rol |
|-----------|-----|
| `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md` | QA visual Vercel post seed (GO) |
| `ejecucion-seed-pipeline-pickup-stage-key-12W-4c-SQL-3-EXEC.md` | Estado BD post SQL-3-EXEC |
| `diseno-seed-pipeline-pickup-stage-key-12W-4c-SQL-3.md` | Diseño seed idempotente |
| `ejecucion-ddl-stage-key-leads-pipelines-12W-4c-SQL-2-EXEC.md` | Columna `stage_key` en BD |
| `lib/crmPackage/configs/pickup4x4.config.ts` | Contrato Pickup (9 etapas) |
| `lib/crmPackage/adapters/pipelineStages.ts` | Adapter contrato → etapas normalizadas |
| `app/api/admin/leads/pipelines/route.ts` | API catálogo operativo |
| `app/admin/leads/nuevo/page.tsx` | Select Pipeline |
| `app/admin/leads/kanban/page.tsx` | Columnas Kanban |
| `app/admin/leads/[id]/page.tsx` | Ficha / selector etapa |

**Estado de este documento:** **propuesta de decisión** — compara opciones y recomienda camino conservador. **No** constituye decisión final de producto hasta aprobación explícita del equipo.

**Commits de referencia (bloque 12W-4 cerrado):** `886c172` (adapter), `b136337` / `7a321ef` (snapshot), `b40bfd9` (plan materialización), `9c989e0` (schema), `8c3c38e` / `c202227` (SQL read-only + resultados), `8c484e0` / `be87f63` (DDL `stage_key`), `7621c7e` / `3cbd2c1` (diseño + seed), `99df72b` (QA).

---

## 1. Propósito

Tras materializar `stage_key` en `public.leads_pipelines` (SQL-2 + SQL-3), el catálogo operativo pasó de **18** a **23** filas. El contrato Pickup queda trazado en **9** filas con `stage_key`; las **14** restantes son legacy sin key.

El objetivo de **12W-4d-DECISION** es decidir **qué debe ver y usar el CRM operativo** (select, Kanban, ficha, reportes) frente al catálogo completo en BD, **sin** ejecutar SQL adicional, cambios de API/UI ni migración de datos en esta fase.

Este documento:

- Confirma el estado actual validado.
- Enmarca el problema de producto (catálogo ampliado vs experiencia Pickup).
- Compara opciones A–E.
- Recomienda un camino conservador y las fases siguientes.
- Deja decisiones abiertas explícitas para cierre de producto.

---

## 2. Estado actual confirmado

Fuente: POSTCHECK SQL-3-EXEC + QA 12W-4c-QA (Vercel `pickup4x4-crm-demo`, 2026-05-20).

| Métrica | Valor | Notas |
|---------|-------|-------|
| `leads_pipelines` total | **23** | 18 originales + 5 INSERT seed |
| Filas con `stage_key` set | **9** | Contrato Pickup materializado |
| Filas legacy `stage_key` NULL | **14** | Sin DELETE ni deprecación |
| Leads en pipeline **Nuevo lead** | **12** | Sin `UPDATE leads.pipeline` |
| Leads huérfanos (`leads.pipeline` sin match en catálogo) | **0** | POSTCHECK-5 |
| `lead_pipelines` | **9** filas | **No** tocado en seed |
| Terminales **Ganado** / **Perdido** | Intactos | Nombres operativos + `tipo` ganado/perdido |
| QA Vercel 12W-4c-QA | **GO** | Nuevo Lead, select, Kanban, ficha OK |
| UI actual | Lista **todo** el catálogo | Sin filtro por `stage_key` ni columna `activo` |

### Las 9 filas con contrato (`stage_key`)

| `stage_key` | `nombre` operativo |
|-------------|-------------------|
| `nuevo_contacto` | Nuevo lead |
| `consulta_calificada` | Consulta calificada |
| `vehiculo_identificado` | Vehículo identificado |
| `necesidad_detectada` | Necesidad detectada |
| `presupuesto_enviado` | Presupuesto enviado |
| `negociacion` | Negociación |
| `venta_ganada` | Ganado |
| `venta_perdida` | Perdido |
| `postventa_seguimiento` | Postventa / seguimiento |

### Comportamiento técnico actual (código, sin modificar en esta fase)

- **API** `GET /api/admin/leads/pipelines` selecciona: `id, created_at, updated_at, nombre, posicion, tipo, color, orden` — **no** incluye `stage_key`.
- **UI** (Nuevo Lead, Kanban, ficha) consume `nombre` del catálogo remoto; `leads.pipeline` sigue siendo **texto por nombre**.
- **Adapter** `packageToPipelineStages` expone el contrato Pickup en contexto/DOM; el select operativo legacy sigue apuntando a la API/BD hasta una fase de filtro o materialización UI.

---

## 3. Problema de producto

| Dimensión | Situación |
|-----------|-----------|
| **Técnico** | El contrato Pickup ya está **trazado** en BD vía `stage_key` en 9 filas. El adapter y el snapshot en contexto reflejan las mismas 9 keys en `pickup4x4.config.ts`. |
| **Operativo** | La UI lista **las 23 filas** de `leads_pipelines` ordenadas por `orden` / `created_at`. Select Pipeline y Kanban muestran legacy + nuevas etapas + terminales. |
| **UX** | Select más largo; Kanban con más columnas y scroll horizontal (observado en QA, no bloqueante). |
| **Riesgo de filtrar pronto** | Ocultar las 14 legacy podría esconder etapas que aún tienen sentido operativo o histórico, aunque hoy los 12 leads están en **Nuevo lead** (que sí tiene `stage_key`). |
| **Gobernanza** | No existe columna `activo` ni política de deprecación en BD. |
| **Semántica dual** | `leads.pipeline` = **nombre** operativo; contrato = **label** distinto en config (ej. config «Nuevo contacto» vs BD «Nuevo lead»). |
| **Política de estado** | `leadStatusPolicy` sigue resolviendo terminales por **nombre** Ganado/Perdido, no por `stage_key`. |

**Tensión central:** el seed fue **conservador** (correcto para estabilidad): amplió catálogo sin migrar leads ni borrar legacy. Producto debe decidir si el CRM Pickup en demo/cliente debe **verse** como las 9 etapas del contrato o como el catálogo histórico completo mientras coexisten ambos mundos.

---

## 4. Opciones evaluadas

### Opción A — Mantener catálogo completo por ahora (estado transitorio documentado)

| Pros | Contras |
|------|---------|
| Cero código, cero SQL adicional | Select/Kanban cargados (23 opciones/columnas) |
| Riesgo operativo bajo | Cliente/demo ve etapas que quizá no forman el CRM Pickup final |
| Ya validado GO en 12W-4c-QA | No reduce deuda de percepción «catálogo sucio» |
| Legacy visible si algún lead futuro cae en nombre legacy | Puede confundir con labels del contrato en documentación |

**Alineación:** equivalente a posponer cambios (opción E del brief) pero **con** documentación explícita del transitorio.

---

### Opción B — Filtrar UI/API por `stage_key IS NOT NULL`

| Pros | Contras |
|------|---------|
| CRM operativo muestra solo **9** etapas contrato | Requiere cambios en API y/o frontend |
| Alineado con Constructor CRM / `pickup4x4.config.ts` | Legacy queda oculto, no eliminado — riesgo si un lead usa nombre legacy no mapeado |
| No requiere DDL nuevo | API hoy no expone `stage_key`; hay que extender SELECT y tipos |
| **Nuevo lead** sigue en «Nuevo lead» con `nuevo_contacto` — coherente post seed | Kanban, ficha, lista, reportes y bulk deben revalidarse |
| | Configuración admin de pipelines podría necesitar vista «completa» separada |

---

### Opción C — Agregar columna `activo` y deprecar legacy

| Pros | Contras |
|------|---------|
| Gobernanza clara: ocultar sin borrar | DDL nuevo (12W-4c-SQL-4 o similar) |
| Permite revivir etapas o marcar solo contrato activo | Seed + backfill de `activo` en 23 filas |
| API puede filtrar `activo = true` sin depender solo de `stage_key` | Cambios API/UI + decisión sobre las 14 legacy |
| Escalable a multi-cliente futuro | Más alcance que B; no urgente si B resuelve Pickup demo |

---

### Opción D — Migrar/renombrar `leads.pipeline` y catálogo a labels exactos del contrato

| Pros | Contras |
|------|---------|
| Máxima coherencia semántica nombre ↔ label ↔ key | **Alto riesgo** — rompe datos, filtros, reportes históricos |
| Un solo vocabulario en UI y BD | Requiere `leadStatusPolicy`, APIs de leads, posible SQL-4 masivo |
| | Cambia nombres operativos que usuarios ya conocen («Nuevo lead», «Ganado») |
| | **No necesario** para validar valor del contrato Pickup en demo |

**Dictamen preliminar:** **NO-GO** en esta etapa.

---

### Opción E — Validar POST real (lead nuevo en etapa nueva) antes de decidir filtro

| Pros | Contras |
|------|---------|
| Confirma flujo de alta con pipeline nuevo en BD | Crea dato de prueba o requiere limpieza posterior |
| Reduce incertidumbre sobre payload `pipeline` por nombre | **No resuelve** governance del catálogo (sigue habiendo 23 filas) |
| Complementa QA visual sin POST | Puede posponer decisión de filtro sin necesidad |

**Relación con A:** el POST es **validación operativa**, no sustituto de decisión de catálogo.

---

## 5. Recomendación

**Recomendación conservadora (propuesta, no decisión final cerrada):**

1. **No** tocar SQL adicional todavía (sin SQL-4, sin `activo`, sin DELETE legacy).
2. **No** borrar filas legacy ni migrar `leads.pipeline`.
3. **Mantener** el estado actual como **transitorio estable** documentado (equivalente operativo a Opción A) hasta cierre explícito de D1–D7 (§8).
4. **Avanzar** con diseño **12W-4d-FILTER-DESIGN** (documento técnico sin código) si producto confirma que Pickup debe mostrar solo las 9 etapas contrato.
5. **Implementar** **12W-4d-FILTER** solo tras aprobación: cambio mínimo, preferiblemente controlado por `APP_MODE=client_crm` y/o feature flag, no hardcode global en todas las instancias.
6. **Antes de filtrar**, definir si reportes y ficha administrativa deben ver catálogo completo o solo `stage_key` (ver D3, D7).
7. **POST de lead nuevo** (Opción E): recomendable como QA puntual **después** de decidir filtro o en paralelo si producto exige evidencia de alta; **no** bloqueante para redactar diseño de filtro.

### Dictamen propuesto (fases, no cierre de producto)

| Fase | Propuesta |
|------|-----------|
| **12W-4d-DECISION** (este doc) | **GO** para registrar opciones y recomendación |
| **12W-4d-FILTER-DESIGN** | **GO** para diseñar filtro sin implementar |
| **12W-4d-FILTER** (código) | **GO condicionado** a aprobación producto tras D1 |
| **12W-4c-SQL-4** (`activo`, deprecación, migración nombres) | **NO-GO** hasta que filtro por `stage_key` no sea suficiente o producto exija gobernanza en BD |

---

## 6. Diseño preliminar si se elige B — filtro por `stage_key`

*Solo diseño; sin implementación en 12W-4d-DECISION.*

### API

- `GET /api/admin/leads/pipelines` podría:
  - Aceptar query `?contractOnly=1` cuando `APP_MODE=client_crm`, **o**
  - Filtrar server-side `.not('stage_key', 'is', null)` solo en modo cliente.
- Extender `SELECT` a incluir `stage_key` en respuesta (hoy ausente en `route.ts`).
- Mantener endpoint sin filtro para pantallas de **Configuración** / administración de catálogo si deben ver legacy.

### Frontend

- Alternativa mínima: filtrar en cliente `pipelines.filter(p => p.stage_key != null)` **solo si** la API devuelve `stage_key`.
- **Riesgo:** duplicar lógica si algunas pantallas llaman API cruda y otras no.
- Preferible **una fuente** (API filtrada o hook compartido) para Nuevo Lead, Kanban y ficha.

### Compatibilidad legacy

- Leads con `leads.pipeline` = nombre legacy deben seguir resolviendo en ficha/Kanban aunque la columna no aparezca en selector de **nuevas** altas.
- Fallback: si el nombre del lead no está en lista filtrada, mostrar valor actual + advertencia o incluir fila legacy puntual en selector de edición.

### Configuración

- `PipelinesTab` / admin de etapas probablemente necesita **catálogo completo** (23 filas) para no impedir mantenimiento legacy.

### Contrato vs nombre

- El filtro por `stage_key` alinea con `pickup4x4.config.ts` y `pipelineStages.ts`; la UI seguirá mostrando `nombre` operativo hasta una fase de labels unificados (no mezclar con Opción D).

---

## 7. Superficies afectadas si se filtra

| Superficie | Riesgo | Validación requerida |
|------------|--------|----------------------|
| Nuevo Lead — select Pipeline | Medio | Solo 9 opciones; default sigue siendo «Nuevo lead» |
| Kanban — columnas | Alto | Menos columnas; leads en legacy deben seguir visibles en su columna |
| Ficha — selector etapa | Alto | Edición de lead en etapa legacy; no perder valor actual |
| Lista leads / filtros por pipeline | Medio | Filtros por `nombre` deben seguir encontrando legacy |
| Reportes comerciales | Alto | Agrupación por `nombre` vs `stage_key` (ver D7) |
| Configuración pipelines | Medio | No limitar vista admin si filtro es solo operativo |
| Bulk change de etapa | Alto | Misma lista que select operativo |
| API `GET/POST/PATCH` pipelines | Medio | Contrato de respuesta + query param |
| Dashboard / resumen pipeline | Medio | Bloques que cuentan etapas pueden omitir legacy |

---

## 8. Decisiones abiertas

| ID | Pregunta | Opciones / notas |
|----|----------|------------------|
| **D1** | ¿El CRM Pickup debe mostrar solo 9 etapas contrato o catálogo completo? | Define si se implementa B o se mantiene A |
| **D2** | ¿El filtro debe vivir en API, frontend o ambos? | API = fuente única; frontend solo si flag temporal |
| **D3** | ¿Configuración pipelines debe mostrar legacy? | Probable **sí** para admin; **no** para flujo comercial |
| **D4** | ¿Qué hacer con las 14 filas `stage_key` NULL? | Mantener; mapear después; marcar `activo=false`; no DELETE sin plan |
| **D5** | ¿Se necesita columna `activo`? | Solo si B por `stage_key` no alcanza o multi-tenant |
| **D6** | ¿Validar POST lead nuevo antes de filtrar? | Recomendable pero no bloqueante para diseño FILTER |
| **D7** | ¿Reportes agrupan por `nombre` o `stage_key`? | Hoy por `nombre`; cambiar reportes es alcance aparte |

**Cierre:** requiere decisión explícita de producto (Daniel / stakeholder Pickup). Este documento **no** cierra D1–D7.

---

## 9. Riesgos

| Riesgo | Mitigación propuesta |
|--------|---------------------|
| Ocultar etapas legacy y que un lead quede en nombre no listado | Fallback en ficha/Kanban; no filtrar leads existentes, solo catálogo de selección |
| Romper filtros/búsquedas por `leads.pipeline` | No cambiar columna `leads.pipeline`; filtro solo en catálogo UI/API |
| Duplicar lógica API vs frontend | Diseño 12W-4d-FILTER-DESIGN: una regla, un hook |
| Configuración muestra menos de lo necesario | Separar modo operativo vs admin |
| Confundir `nombre` operativo con `label` del contrato | Documentar mapping; no renombrar en esta fase |
| Aumentar deuda si transitorio no se documenta | Este documento + QA 12W-4c-QA como línea base |
| Crear datos de prueba innecesarios (POST QA) | Usar lead demo identificable o limpieza 12N |
| Implementar SQL-4 antes de decisión producto | **NO-GO** en recomendación actual |

---

## 10. Plan recomendado de próximas fases

| Fase | Entregable | Dependencias |
|------|------------|--------------|
| **12W-4d-DECISION** | Este documento | SQL-3-EXEC + QA GO |
| **12W-4d-FILTER-DESIGN** | Diseño técnico filtro (API param, tipos, pantallas, fallback legacy) | Cierre D1, D2, D3 |
| **12W-4d-FILTER** | Implementación mínima en API/UI | Aprobación producto + diseño |
| **12W-4d-QA** | QA Nuevo Lead / Kanban / ficha / reportes post filtro | Deploy Vercel |
| **12W-4c-SQL-4** | `activo`, backfill, eventual deprecación | Solo si B insuficiente o D5 = sí |
| **QA POST opcional** | Alta lead en etapa nueva (nombre nuevo) | Producto lo solicite; limpieza acordada |

**Orden sugerido:** DECISION → (cierre D1) → FILTER-DESIGN → FILTER → QA. POST opcional en cualquier momento con dato controlado.

---

## 11. Dictamen final

El estado actual es **técnicamente estable y validado** (seed idempotente, 0 huérfanos, terminales intactos, QA Vercel GO). El catálogo ampliado a **23** filas es **coherente** con la estrategia conservadora del seed; no es un defecto de ejecución.

El **siguiente movimiento no debe ser más SQL** sino **decisión de producto** sobre qué ve el operador Pickup y, si aplica, **diseño de filtro controlado** por `stage_key` (fase 12W-4d-FILTER-DESIGN / 12W-4d-FILTER).

**Propuesta de dictamen (pendiente aprobación):**

- **Mantener** catálogo completo en BD y en UI **hasta** cerrar D1 (transitorio estable = Opción A documentada).
- **No** borrar legacy, **no** migrar `leads.pipeline`, **no** ejecutar SQL-4 todavía.
- **GO** para preparar diseño de filtro (12W-4d-FILTER-DESIGN) asumiendo objetivo producto: Pickup operativo muestra **solo las 9 etapas** con `stage_key`.
- **NO-GO** para SQL-4 / columna `activo` / renombres masivos (Opción C/D) en la misma ventana que el filtro mínimo.

Cuando producto confirme D1 = «solo 9 etapas», la implementación preferida es **filtro por `stage_key` en API bajo `client_crm`**, con vista admin sin filtrar.

---

## 12. Confirmación de alcance

| Ítem | Estado en fase 12W-4d-DECISION |
|------|--------------------------------|
| Código funcional modificado | **No** |
| TypeScript creado/editado | **No** |
| SQL ejecutado | **No** |
| Supabase consultado/modificado | **No** |
| Datos modificados | **No** |
| Lead nuevo creado | **No** |
| Cards movidas | **No** |
| APIs | **No** |
| Middleware | **No** |
| Vercel | **No** |
| Build | **No** |
| Commit | **No** |
| Solo documentación | **Sí** |

---

*Documento generado en fase 12W-4d-DECISION. Propone camino conservador; la decisión final de producto (D1–D7) queda a cargo del equipo antes de 12W-4d-FILTER o SQL-4.*
