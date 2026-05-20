# Validación Vercel Pipeline filter 12W-4d-QA — Constructor CRM Summer87

**Versión:** 12W-4d-QA — QA manual en Vercel post FILTER-1..4  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md`, `validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md`, `validacion-nuevo-lead-pipeline-filter-12W-4d-FILTER-2.md`, `validacion-kanban-pipeline-filter-12W-4d-FILTER-3.md`, `validacion-ficha-pipeline-filter-12W-4d-FILTER-4.md`, `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`

**Commits de referencia (bloque FILTER):**

| Fase | Commit |
|------|--------|
| 12W-4d-FILTER-1 | `ccc8c52` |
| 12W-4d-FILTER-2 | `71ab0bd` |
| 12W-4d-FILTER-3 | `57b05a2` |
| 12W-4d-FILTER-4 | `8b71cfa` |

---

## 1. Resumen ejecutivo

- QA manual en Vercel posterior a FILTER-1..4 (API + Nuevo Lead + Kanban + Ficha).
- **Nuevo Lead OK:** select Pipeline muestra solo las 9 etapas contract; sin legacy visible.
- **Kanban OK:** validado visualmente por Daniel (columnas filtradas, sin catálogo completo de 23).
- **Ficha OK** en carga, lectura, flujo del proceso y entrada a modo edición general.
- **Observación (no bloqueante):** en Datos del lead, el campo **Etapa** se muestra como campo no editable; no se pudo abrir/validar el `<select>` filtrado en Ficha. Pendiente decisión producto (Opción A elegida: documentar sin cambio técnico).
- **Dictamen:** GO parcial/operativo del filtro en superficies validadas; observación de UX no bloqueante para el cierre del bloque FILTER.

---

## 2. Alcance

### Incluido

- Nuevo Lead — carga y select Pipeline
- Kanban — carga y columnas (validación reportada)
- Ficha — apertura, lectura, modo edición, bloque Datos del lead / campo Etapa (valor visible)

### Excluido

- Guardar cambios en Ficha
- Crear lead nuevo (POST)
- Mover cards (drag & drop)
- SQL, Supabase, cambios de código
- Lista / Bulk
- Validación exhaustiva de Network en todos los pasos

---

## 3. Entorno

| Campo | Valor |
|-------|-------|
| **URL** | https://pickup4x4-crm-demo.vercel.app |
| **Modo esperado** | `client_crm` |
| **Commit base** | `8b71cfa` (12W-4d-FILTER-4) |
| **Validador** | Daniel |
| **Fecha** | 2026-05-20 |

---

## 4. Validación Nuevo Lead

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Carga pantalla Nuevo Lead | OK | GO |
| Formulario visible | OK | GO |
| Pipeline default = Nuevo lead | OK | GO |
| Select Pipeline muestra 9 etapas contract | OK | GO |
| Legacy no aparece en select | OK | GO |
| No se guardó lead nuevo | No ejecutado | Fuera de alcance |

### Etapas observadas en select (9 contract)

1. Nuevo lead  
2. Consulta calificada  
3. Vehículo identificado  
4. Necesidad detectada  
5. Presupuesto enviado  
6. Negociación  
7. Ganado  
8. Perdido  
9. Postventa / seguimiento  

---

## 5. Validación Kanban

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Kanban carga | OK reportado por Daniel | GO |
| Columnas filtradas (~9 contract) | OK reportado | GO |
| Sin 23 columnas legacy del catálogo completo | OK reportado | GO |
| 12 leads en Nuevo lead | OK esperado / observado en entorno demo | GO |
| No se movieron cards | No ejecutado | Fuera de alcance |

**Nota:** Este documento no incluye captura ni listado columna por columna. Daniel marcó **Kanban OK** durante la sesión de QA manual en Vercel.

---

## 6. Validación Ficha

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Ficha abre desde Kanban | OK | GO |
| Nombre lead visible | OK | GO |
| Flujo del proceso visible | OK | GO |
| Editar entra en modo edición | OK | GO |
| Datos del lead abre | OK | GO |
| Campo Etapa muestra **Nuevo lead** | OK | GO |
| Campo Etapa editable / `<select>` visible | No; aparece como campo no editable | Observación producto/UX |
| Guardar cambios | No ejecutado | Fuera de alcance |

---

## 7. Observación producto/UX — Etapa no editable en Ficha

**Contexto técnico (FILTER-4):** La ficha ya consume `GET .../pipelines?contractOnly=1` en `client_crm`, construye `etapasForSelect` (catálogo filtrado + inyección legacy del valor actual) y el JSX de edición incluye un `<select>` cuando `editing === true`. El filtro de datos está preparado en código.

**Lo observado en Vercel:** En el bloque **Datos del lead**, el campo **Etapa** se percibe como **input/campo no editable**; no fue posible abrir un desplegable ni cambiar la etapa desde Ficha durante esta QA.

**Interpretación:**

- No hay evidencia de regresión del filtro: el valor actual del lead se conserva y muestra correctamente **«Nuevo lead»**.
- La limitación observada es de **producto/UX o visibilidad del control de edición** en ese bloque, no de que `contractOnly=1` devuelva datos incorrectos.
- Por eso **no se validó** el select filtrado en Ficha en runtime (aunque FILTER-4 lo haya preparado en código).

**Decisión pendiente (producto):**

| Opción | Descripción |
|--------|-------------|
| **A** | Mantener cambio de etapa solo desde Kanban — **elegida en esta QA** (documentar, sin cambio técnico) |
| **B** | Habilitar selector de etapa editable en Ficha — fase futura propuesta **12W-4d-FILTER-4b** |

**Recomendación actual:** No abrir cambio de código en el cierre de FILTER; registrar la observación y continuar con evolución de producto / QA general según prioridad.

---

## 8. Dictamen

| Área | Dictamen |
|------|----------|
| Filtro en **Nuevo Lead** | **GO** |
| Filtro en **Kanban** | **GO** (validación manual reportada por Daniel) |
| **Ficha** — carga, lectura, edición general, valor Etapa visible | **GO** |
| **Ficha** — select de etapa filtrado en edición | **NO-GO** para afirmar validación (control no editable / no visible como select) |
| **Observación Etapa en Ficha** | **No bloqueante** para cierre operativo del bloque FILTER-1..4 |
| POST lead nuevo, PATCH guardar, drag & drop | **NO-GO** para afirmar (no ejecutados en esta QA) |

**Dictamen global:** **GO parcial/operativo** del filtro pipeline en las superficies validadas (Nuevo Lead + Kanban + Ficha lectura). Observación documentada sin bloquear el bloque FILTER.

---

## 9. Riesgos pendientes

| Riesgo | Notas |
|--------|-------|
| Edición de etapa desde Ficha requerida por producto | Abrir **12W-4d-FILTER-4b** (habilitar UX del select en Datos del lead) |
| Lista / Bulk sin filtro `contractOnly` | Sigue mostrando catálogo completo hasta **12W-4d-FILTER-5** (opcional) |
| POST crear lead nuevo | No validado en esta sesión |
| Drag & drop Kanban | No validado en esta sesión |
| Network (`contractOnly=1` en todos los fetch) | No auditado paso a paso en DevTools en esta QA |

---

## 10. Próximas opciones

| Opción | Descripción | Recomendación |
|--------|-------------|---------------|
| **A** | Documentar observación Etapa en Ficha; no tocar código | **Elegida ahora** |
| **B** | **12W-4d-FILTER-4b** — habilitar select etapa editable en Ficha | Solo si producto lo decide |
| **C** | **12W-4d-FILTER-5** — Lista / Bulk con `contractOnly=1` | Opcional |
| **D** | **12W-5** — Nuevo Lead campos Pickup (evolución producto) | Próxima evolución según roadmap |

---

## 11. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Lead creado | **No** |
| Cards movidas | **No** |
| Guardado ejecutado | **No** |
| Solo documentación | **Sí** |
| Commit | **No** (por instrucción de fase) |

---

## 12. Referencias

- API: `validacion-api-pipeline-stage-key-filter-12W-4d-FILTER-1.md`
- Nuevo Lead: `validacion-nuevo-lead-pipeline-filter-12W-4d-FILTER-2.md`
- Kanban: `validacion-kanban-pipeline-filter-12W-4d-FILTER-3.md`
- Ficha: `validacion-ficha-pipeline-filter-12W-4d-FILTER-4.md`
- Seed / BD previo: `validacion-qa-pipeline-stage-key-seed-12W-4c-QA.md`
