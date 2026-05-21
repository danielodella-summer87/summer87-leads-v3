# Diseño Nuevo Lead Pickup Fields 12W-5a — Constructor CRM Summer87

**Versión:** 12W-5a — diseño documental de campos Pickup 4x4 en Nuevo Lead  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento | Rol |
|-----------|-----|
| `diseno-filtro-pipeline-stage-key-12W-4d-FILTER-DESIGN.md` | Pipeline filtrado por `stage_key` |
| `validacion-nuevo-lead-pipeline-filter-12W-4d-FILTER-2.md` | Nuevo Lead + `contractOnly=1` |
| `validacion-vercel-pipeline-filter-12W-4d-QA.md` | QA Vercel post FILTER (commit `23a030a`) |
| `validacion-adapter-lead-fields-12W-3.md` | Adapter `packageToLeadFields` |
| `lib/crmPackage/configs/pickup4x4.config.ts` | Contrato demo Pickup |
| `lib/crmPackage/adapters/leadFields.ts` | Normalización `lead_fields.groups[]` |

**Commits de referencia (bloque FILTER cerrado):** `ccc8c52`, `71ab0bd`, `57b05a2`, `8b71cfa`, `23a030a`

**Estado:** **solo documentación** — sin implementación UI, API ni BD.

---

## 1. Resumen ejecutivo

- El **pipeline Pickup** ya está materializado y filtrado en `client_crm` (Nuevo Lead, Kanban; Ficha preparada con `contractOnly=1`).
- El **siguiente paso de producto** es que **Nuevo Lead** deje de percibirse como formulario genérico de agencia/Casa Limpia y refleje el flujo comercial **Pickup 4x4** (contacto → vehículo → necesidad → gestión).
- **Esta fase (12W-5a) no implementa código:** define qué mostrar, qué mapear hoy, qué mostrar sin persistir y qué exige API/BD futura.
- Se separan explícitamente: campos **ya persistibles** vía POST actual, campos del **contrato** (`lead_fields`), campos **solo visuales** (12W-5b), y campos que **requieren persistencia nueva** (12W-5d+).
- **Dictamen:** **GO** para diseñar UI Pickup en fases 12W-5b/5c; **NO-GO** para SQL, columnas nuevas o ampliar payload POST hasta cerrar mapeo y decisión de persistencia.

---

## 2. Estado actual del formulario Nuevo Lead

**Archivo:** `app/admin/leads/nuevo/page.tsx`  
**Modo:** `useLeadsClientCrmMode()` + snapshot `useLeadFieldsConfig()` / `usePipelineStagesConfig()` (atributos `data-crm-package-*` en DOM; **el formulario sigue hardcodeado**).

**Payload POST actual** (`LeadCreatePayload` → `POST /api/admin/leads`):  
`nombre`, `contacto`, `telefono`, `email`, `origen`, `pipeline`, `oferta`, `notas`, `next_activity_type`, `next_activity_at`, `comercial_id`, `rubro_id`, `cantidad_personal`, `superficie_m2`, `direccion`, `visita_scheduled_at`.

### Tabla — campos visibles hoy

| Campo actual (UI) | Estado / payload | ¿Sirve para Pickup? | Acción recomendada |
|-------------------|------------------|---------------------|-------------------|
| **Nombre** * | `nombre` | Sí — cliente / razón social | Mantener; renombrar label «Nombre / Razón social» en 12W-5b |
| **Contacto** | `contacto` | Sí — persona de contacto | Mantener |
| **Teléfono** | `telefono` | Sí | Mantener |
| **Email** | `email` | Sí | Mantener |
| **Origen** | `origen` | Sí — canal (web, showroom, referido…) | Mantener; evolucionar a select de canales Pickup en 12W-5c |
| **Producto / servicio consultado** | `oferta` | Sí — necesidad / accesorio | Mantener; alinear label con `producto_servicio` / `accesorios_interes` del contrato |
| **Pipeline** | `pipeline` (nombre etapa) | Sí — ya filtrado 9 contract en `client_crm` | Mantener; labels desde API (QA OK) |
| **Próxima acción** | `next_activity_type` | Sí — seguimiento inicial | Mantener; alinear opciones con `activity_types` del contrato en 12W-5c |
| **Fecha próximo seguimiento** | `next_activity_at` | Sí | Mantener; mapear semántica a `fecha_limite` |
| **Comercial** * | `comercial_id` | Sí — `vendedor_responsable` | Mantener obligatorio |
| **Rubro** | `rubro_id` | Parcial — genérico B2B, no Pickup | En `client_crm`: ocultar o relegar a «opcional avanzado» (12W-5b) |
| **Cantidad de personal** | `cantidad_personal` | No — legacy Casa Limpia | Ya oculto si `isClientCrmUi`; no borrar del payload interno |
| **Superficie m²** | `superficie_m2` | No — legacy Casa Limpia | Igual que anterior |
| **Dirección** | `direccion` | Parcial — puede cubrir domicilio; no `localidad` pura | Mantener en bloque operativo opcional |
| **Fecha revisión o seguimiento** | `visita_scheduled_at` | Parcial — solapa con `next_activity_at` | En Pickup: unificar UX con «fecha límite» o ocultar duplicado (12W-5b) |
| **Notas** | `notas` | Sí — `observaciones` | Mantener |

**Bloques UI actuales:** (1) grid identidad + producto + pipeline + seguimiento + comercial; (2) «Datos operativos del lead»; (3) notas. **No hay** sección Vehículo ni Kore.

---

## 3. Campos Pickup esperados desde contrato

**Fuente:** `pickup4x4.config.ts` → `lead_fields.groups[]`  
**Adapter:** `packageToLeadFields()` → `source: "contract"`, **4 grupos**, **25 claves** (`validacion-adapter-lead-fields-12W-3.md`).

**Limitación del contrato hoy:** solo lista **claves** por grupo; **no** define en JSON: `label`, `type`, `required`, `placeholder`, ni catálogo de valores (origen, marcas, etc.). Esas decisiones son **de diseño/12W-5b**, no implementadas en config.

### Tabla — campos por grupo (contrato)

| Campo contrato | Label sugerido (UX) | Tipo sugerido | Obligatorio (diseño) | Grupo | Observación |
|---------------|---------------------|---------------|----------------------|-------|-------------|
| `nombre` | Nombre / Razón social | text | Sí | Cliente | Ya en POST |
| `telefono` | Teléfono | tel | Recomendado | Cliente | Ya en POST |
| `email` | Email | email | Opcional | Cliente | Ya en POST |
| `localidad` | Localidad / zona | text | Opcional | Cliente | Sin columna dedicada; ver §5 |
| `tipo_cliente` | Tipo de cliente | select | Opcional | Cliente | Particular / empresa / flota — sin columna |
| `origen` | Origen / canal | text o select | Recomendado | Cliente | Ya en POST |
| `estado_comercial` | Estado comercial | select | Opcional | Cliente | Distinto de `pipeline`; sin columna |
| `marca` | Marca | text o select | Recomendado | Vehículo | Sin columna |
| `modelo` | Modelo | text | Opcional | Vehículo | Sin columna |
| `año` | Año | number | Opcional | Vehículo | Sin columna |
| `matricula` | Matrícula | text | Opcional | Vehículo | Sin columna |
| `tipo_uso` | Uso del vehículo | select | Opcional | Vehículo | Particular, trabajo, flota, campo… |
| `accesorios_interes` | Accesorios de interés | text / tags | Opcional | Vehículo | Solapa con `oferta` |
| `producto_servicio` | Producto o servicio consultado | textarea | Recomendado | Oportunidad | Mapear a `oferta` |
| `presupuesto_estimado` | Presupuesto estimado | currency / number | Opcional | Oportunidad | Sin columna |
| `vendedor_responsable` | Comercial responsable | select (UUID) | Sí | Oportunidad | `comercial_id` |
| `etapa` | Etapa / pipeline | select | Sí (default) | Oportunidad | `pipeline` (nombre, no `stage_key`) |
| `proxima_accion` | Próxima acción | select | Opcional | Oportunidad | `next_activity_type` |
| `fecha_limite` | Fecha límite / próximo seguimiento | datetime | Opcional | Oportunidad | `next_activity_at` |
| `observaciones` | Observaciones | textarea | Opcional | Oportunidad | `notas` |
| `kore_cliente_id` | ID cliente Kore | text (ro) | No | Kore | Solo lectura futura |
| `kore_documento_id` | ID documento Kore | text (ro) | No | Kore | Integración pendiente credenciales |
| `ultima_sincronizacion` | Última sincronización | datetime (ro) | No | Kore | No en POST create |
| `fuente_dato` | Fuente del dato | text (ro) | No | Kore | No en POST create |
| `confianza_dato` | Confianza del dato | text/number (ro) | No | Kore | No en POST create |

**Campos en propuesta UX §4 que no están en contrato** (no inventar como implementados): categoría de accesorio, descripción de necesidad, urgencia, estado del presupuesto, RUT/documento. Tratarlos como **extensión de producto** para 12W-5b (visual) o ampliación de contrato + persistencia en 12W-5d.

**`activity_types` del contrato** (referencia para próxima acción, no `lead_fields`): `llamada`, `whatsapp`, `email`, `visita_showroom`, `instalacion` — distinto del hardcode `NEXT_ACTIVITY_OPTIONS` actual en `nuevo/page.tsx`.

---

## 4. Propuesta UX para Nuevo Lead Pickup

Orden recomendado para que el formulario «se sienta» CRM Pickup sin alargar innecesariamente el piloto.

### Bloque A — Identificación del contacto

| Campo UX | Claves contrato / POST |
|----------|------------------------|
| Nombre / Razón social | `nombre` |
| Contacto | `contacto` (legacy, útil) |
| Teléfono, Email | `telefono`, `email` |
| Origen / canal | `origen` |

**Propósito comercial:** identificar quién llama y por qué canal llegó la consulta (atribución y priorización).

### Bloque B — Vehículo

| Campo UX | Claves contrato |
|----------|-----------------|
| Marca, Modelo, Año, Matrícula | `marca`, `modelo`, `año`, `matricula` |
| Tipo pickup / vehículo | (derivado; puede ser texto libre en `modelo` hasta catálogo) |
| Uso | `tipo_uso` |

**Propósito:** calificar oportunidad 4x4 (compatibilidad accesorios, stock, instalación). **En 12W-5b:** render visual; **persistencia:** 12W-5d (ver §6).

### Bloque C — Necesidad comercial

| Campo UX | Claves contrato / POST |
|----------|------------------------|
| Producto o accesorio consultado | `producto_servicio` → `oferta` |
| Accesorios de interés (tags o lista) | `accesorios_interes` (visual o append a `oferta` en 5c mínimo) |
| Categoría / descripción / urgencia / estado presupuesto | **Propuesta UX** — no en contrato; solo visual o notas hasta ampliar contrato |
| Presupuesto estimado | `presupuesto_estimado` |

**Propósito:** entender qué vende el lead y preparar cotización (etapas «Necesidad detectada» / «Presupuesto enviado»).

### Bloque D — Gestión comercial

| Campo UX | Claves contrato / POST |
|----------|------------------------|
| Pipeline (etapa) | `etapa` → `pipeline` |
| Próxima acción | `proxima_accion` → `next_activity_type` |
| Fecha próximo seguimiento | `fecha_limite` → `next_activity_at` |
| Comercial responsable | `vendedor_responsable` → `comercial_id` |
| Notas / observaciones | `observaciones` → `notas` |

**Propósito:** dejar el lead accionable en Kanban desde el día 1 (QA FILTER ya validó pipeline y seguimiento).

### Bloque E — Datos operativos opcionales

| Campo UX | Notas |
|----------|-------|
| Dirección | `direccion` — POST OK |
| Localidad | `localidad` — sin columna; visual o `direccion` |
| Rubro | `rubro_id` — legacy; ocultar en `client_crm` |
| RUT / documento | Futuro; no en contrato |
| Referencia Kore | grupo Kore — solo lectura cuando exista integración |

**Propósito:** datos de logística o integración sin bloquear el alta rápida en showroom.

---

## 5. Mapeo recomendado a campos existentes hoy

| Campo Pickup deseado | Campo actual / POST | Persistencia actual | Riesgo | Fase recomendada |
|----------------------|---------------------|---------------------|--------|------------------|
| Nombre / razón social | `nombre` | Sí | Bajo | **12W-5c** (label UX) |
| Contacto persona | `contacto` | Sí | Bajo | 12W-5c |
| Teléfono / email | `telefono`, `email` | Sí | Bajo | 12W-5c |
| Origen / canal | `origen` | Sí (texto libre) | Medio — sin catálogo | 12W-5c (select valores) |
| Localidad | — / `direccion` parcial | Parcial | Medio — semántica | 12W-5b visual; 12W-5d si columna |
| Tipo cliente | — | No | Medio | 12W-5b visual; 12W-5d |
| Estado comercial | — | No | Medio | 12W-5b visual; 12W-5d |
| Marca / modelo / año / matrícula | — | No | **Alto** — núcleo Pickup | 12W-5b visual; **12W-5d** JSONB o columnas |
| Tipo uso | — | No | Alto | 12W-5b / 12W-5d |
| Accesorios interés | `oferta` (parcial) | Parcial | Medio — mezcla con producto | 12W-5c estructurar `oferta` o JSONB |
| Producto / servicio | `oferta` | Sí | Bajo | 12W-5c |
| Presupuesto estimado | — | No | Medio | 12W-5b visual; 12W-5d |
| Comercial | `comercial_id` | Sí | Bajo | 12W-5c |
| Etapa | `pipeline` | Sí (nombre) | Bajo — ya FILTER-2 | Hecho |
| Próxima acción | `next_activity_type` | Sí | Medio — valores ≠ contrato | 12W-5c |
| Fecha límite | `next_activity_at` | Sí | Bajo | 12W-5c; revisar duplicado `visita_scheduled_at` |
| Observaciones | `notas` | Sí | Bajo | 12W-5c |
| Kore * | — | No | Bajo en create | Post integración |
| Rubro | `rubro_id` | Sí | Bajo — ruido Pickup | Ocultar 12W-5b en `client_crm` |
| Cantidad personal / m² | `cantidad_personal`, `superficie_m2` | Sí | Bajo si ocultos | Ya ocultos en `client_crm` |
| Fecha revisión | `visita_scheduled_at` | Sí | Medio — duplicado | 12W-5b ocultar o unificar |

---

## 6. Decisiones de persistencia

| Opción | Pros | Contras | Riesgo | Recomendación |
|--------|------|---------|--------|---------------|
| **A. Render visual por contrato; POST solo campos actuales** | Cero migración; no rompe API; piloto rápido | Datos vehículo no guardados; frustración si usuario espera persistencia | Medio UX | **Recomendada para 12W-5b** |
| **B. Guardar extras en notas estructuradas** | Sin migración inmediata | Notas ilegibles, no reportable, deuda técnica | Alto datos | Solo parche **explícito** y temporal |
| **C. Columna JSONB en `leads`** (p. ej. `custom_fields`) | Flexible multi-cliente; alineado Constructor | Requiere migración + convención de claves + API | Medio técnico | **Preferida para 12W-5d** si producto confirma persistencia configurable |
| **D. Columnas específicas Pickup** (`marca`, `modelo`, …) | Consultas SQL simples | Rompe visión fábrica; N clientes = N migraciones | Alto mantenimiento | **NO-GO** en piloto |
| **E. Tabla `lead_field_values` / EAV** | Máxima flexibilidad instalador | Complejidad queries, joins, UI | Alto | Post-piloto / paquetes instalables maduros |

### Recomendación conservadora (12W-5a)

1. **No** columnas específicas Pickup en BD todavía.  
2. **Diseñar primero** UI por bloques A–E + wiring de labels desde contrato (`leadFields.groups`).  
3. **12W-5b:** UI Pickup sin ampliar POST (Opción A).  
4. **12W-5c:** mapeo mínimo claves conocidas → payload actual (§5, filas con persistencia Sí).  
5. **12W-5d:** decisión formal JSONB vs EAV; actualizar POST/GET con capa de mapeo documentada.  
6. **No** volcar vehículo en `notas` sin banner «no guardado» si se usa parche B.

---

## 7. Diseño de fases sugerido

| Fase | Alcance | Entregable |
|------|---------|------------|
| **12W-5a** | Este documento | Diseño campos + mapeo + riesgos |
| **12W-5b** | UI Nuevo Lead Pickup por bloques; ocultar legacy ruidoso (`rubro`, m², personal); **sin cambiar POST** | Pantalla «parece Pickup» |
| **12W-5c** | Mapeo mínimo contrato → payload existente; labels; selects alineados (`activity_types`, canales origen) | Guardar solo lo ya soportado |
| **12W-5d** | Decisión + diseño persistencia dinámica (JSONB o EAV) | Doc migración + API |
| **12W-5e** | Implementación persistencia + POST/GET | BD + API si aplica |
| **12W-5-QA** | Vercel `client_crm` | Crear lead con vehículo persistido |

---

## 8. NO-GO explícitos

- No tocar SQL ni Supabase en 12W-5a ni 12W-5b.
- No agregar columnas sin decisión documentada (§6).
- No guardar campos nuevos en `notas` de forma silenciosa.
- No eliminar campos legacy del payload hasta verificar modos internos / `constructor_base`.
- No romper `LeadCreatePayload` ni validaciones actuales de `POST /api/admin/leads`.
- No hardcodear labels Pickup sin pasar por contrato/adapters cuando `source === "contract"`.
- No construir formulario multi-cliente genérico completo antes de cerrar piloto Pickup.
- No confundir `etapa` (contrato) con `stage_key` en POST — sigue siendo **nombre** de pipeline.

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Formulario demasiado largo | Abandono en alta rápida | Bloques colapsables; obligatorios mínimos: nombre + comercial + pipeline |
| Campos vehículo sin persistencia | Usuario cree que guardó marca/modelo | 12W-5b: aviso o deshabilitar guardado de bloque B hasta 12W-5e |
| Mezcla legacy + contrato | UI confusa (rubro + matrícula) | Ocultar legacy en `client_crm`; mantener en modos internos |
| `oferta` sobrecargada | Producto + accesorios + vehículo en un textarea | 12W-5c separar labels; 12W-5d estructurar |
| Dos fechas de seguimiento | `next_activity_at` vs `visita_scheduled_at` | Unificar en UX Pickup |
| BD específica Pickup | Pierde fábrica CRM | JSONB / EAV gobernado por contrato |
| Contrato sin metadata de campo | No hay `required`/`type` en JSON | Ampliar contrato en fase posterior o mapa local `pickupFieldMeta` en adapter |
| QA Ficha: etapa no editable | Cambio de etapa solo Kanban | Documentado en `validacion-vercel-pipeline-filter-12W-4d-QA.md`; no bloquea Nuevo Lead |

---

## 10. Recomendación final

| Pregunta | Dictamen |
|----------|----------|
| ¿Avanzar diseño UI Pickup en Nuevo Lead? | **GO** — siguiente paso **12W-5b** |
| ¿Usar contrato como fuente de grupos/campos? | **GO** — `leadFields` snapshot ya disponible; falta metadata y render |
| ¿SQL / columnas nuevas ahora? | **NO-GO** |
| ¿Ampliar POST en 12W-5b? | **NO-GO** |
| ¿Próximo paso técnico? | **12W-5b** — reorganizar UI por bloques A–E, ocultar ruido legacy en `client_crm`, campos vehículo **solo visuales** con copy claro |

**Criterio de éxito del piloto (documental):** un vendedor Pickup completa Nuevo Lead en &lt; 2 min con identificación + vehículo (aunque sea visual) + necesidad + etapa **Nuevo lead** + comercial + próxima acción, sin ver rubro/m²/personal ni 23 pipelines legacy.

---

## 11. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| API modificada | **No** |
| Solo documentación | **Sí** |
| Commit | **No** (por instrucción de fase) |

---

## 12. Referencias cruzadas

- Pipeline filtrado QA: `validacion-vercel-pipeline-filter-12W-4d-QA.md` (Nuevo Lead 9 etapas **GO**).
- Ficha etapa no editable: observación producto Opción A — no bloquea 12W-5.
- Plan constructor: `plan-contrato-constructor-crm-operativo-12V.md` § campos dinámicos / JSONB postergado a 12X+.
