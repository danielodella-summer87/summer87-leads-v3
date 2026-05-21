# Diseño Mapping Nuevo Lead Pickup Payload 12W-5c — Constructor CRM Summer87

**Versión:** 12W-5c — mapping mínimo contrato Pickup → payload POST actual (solo documentación)  
**Proyecto:** summer87-leads-v3  
**Base documental:**

| Documento | Commit / rol |
|-----------|----------------|
| `diseno-nuevo-lead-pickup-fields-12W-5a.md` | Diseño campos y bloques |
| `validacion-ui-nuevo-lead-pickup-fields-12W-5b.md` | Validación técnica UI |
| `validacion-vercel-nuevo-lead-pickup-ui-12W-5b-QA.md` | QA Vercel GO visual (`20fa832`) |
| Implementación UI | `cb5c910` (12W-5b) |

**Estado:** **solo documentación** — sin cambios de código, API ni BD.

---

## 1. Resumen ejecutivo

- **12W-5b** resolvió la **UX visual** Pickup 4x4 por bloques (A–E), pipeline filtrado a 9 etapas contract y bloque Vehículo informativo; **no** introdujo persistencia nueva ni amplió el POST.
- **12W-5c** define qué campos del **contrato** `pickup4x4.config.ts` pueden **mapearse hoy** al payload existente de Nuevo Lead, qué **labels/opciones** conviene alinear en una futura implementación, y qué queda **fuera** por falta de columna/API.
- El objetivo del mapping mínimo es **alinear contrato, UI y guardado** usando únicamente los 16 campos que ya acepta `POST /api/admin/leads`, **sin ampliar BD**.
- **Vehículo** (`marca`, `modelo`, `año`, `matricula`, `tipo_uso`) y campos de oportunidad no mapeados (`presupuesto_estimado`, `tipo_cliente`, `estado_comercial`, Kore) siguen **fuera del POST** hasta **12W-5d/5e**.
- **Dictamen:** **GO** para mapping mínimo documentado y para futura **12W-5c-IMPL** (labels + adapter de opciones sobre payload actual). **NO-GO** para SQL, columnas Pickup específicas, payload nuevo o `stage_key` en POST.

---

## 2. Estado actual del POST Nuevo Lead

### 2.1 Origen del payload (UI)

**Archivo:** `app/admin/leads/nuevo/page.tsx`  
**Función:** `createLead()` construye `LeadCreatePayload` y hace `POST /api/admin/leads`.

Validaciones UI antes del POST:

- `nombre` obligatorio (trim).
- `comercial_id` obligatorio (trim).

Normalización: `norm()` (strings vacíos → `null`), `normNumber()`, `normDateTimeLocal()` (ISO).

### 2.2 Recepción y persistencia (API)

**Archivo:** `app/api/admin/leads/route.ts`  
**Función:** `POST` → `LeadCreateInput` → `insert` en tabla `leads`.

Reglas relevantes:

| Regla | Comportamiento |
|-------|----------------|
| `nombre` | Obligatorio; 400 si falta |
| `pipeline` | Default API `"Nuevo"` si body vacío; UI envía nombre elegido |
| `next_activity_type` | `cleanActivityType()` — solo valores en `ALLOWED_ACTIVITY` |
| `next_activity_at` | `cleanDateToISO()` |
| `comercial_id` | UUID o null (UI fuerza valor) |
| Permiso | `leads.write` |

**`ALLOWED_ACTIVITY` en API (valores que persisten sin error):**

`none`, `call`, `meeting`, `proposal`, `whatsapp`, `email`, `followup`

Cualquier otro string no vacío → **400** `"next_activity_type inválido"`.

### 2.3 Tabla — payload actual vs Pickup

| Campo payload | Se envía desde UI (12W-5b) | Se guarda en API (`leads`) | Uso actual | Observación Pickup |
|---------------|----------------------------|----------------------------|------------|-------------------|
| `nombre` | Sí — bloque A | Sí | Identidad lead | Contrato `nombre`; label «Nombre / Razón social» |
| `contacto` | Sí — bloque A | Sí | Persona de contacto | **No** está en `lead_fields` contrato; legacy útil — mantener |
| `telefono` | Sí — bloque A | Sí | Contacto | Contrato `telefono` |
| `email` | Sí — bloque A | Sí | Contacto | Contrato `email` |
| `origen` | Sí — bloque A | Sí | Canal (texto libre) | Contrato `origen`; sin catálogo en contrato JSON |
| `pipeline` | Sí — bloque D | Sí | Etapa Kanban | Contrato `etapa` → **nombre** pipeline DB, no `stage_key` |
| `oferta` | Sí — bloque C | Sí | Necesidad / producto | Contrato `producto_servicio`; parcial `accesorios_interes` |
| `notas` | Sí — bloque D | Sí | Observaciones | Contrato `observaciones` |
| `next_activity_type` | Sí — bloque D | Sí | Próxima acción | Contrato `proxima_accion` — **desalineación de claves** (§4) |
| `next_activity_at` | Sí — bloque D | Sí | Fecha seguimiento | Contrato `fecha_limite` |
| `comercial_id` | Sí — bloque D | Sí | Responsable | Contrato `vendedor_responsable` |
| `rubro_id` | No en `client_crm` | Sí | Legacy B2B | Oculto Pickup; payload sigue enviando `null` |
| `cantidad_personal` | No en `client_crm` | Sí | Legacy Casa Limpia | Oculto; `null` en demo |
| `superficie_m2` | No en `client_crm` | Sí | Legacy Casa Limpia | Oculto; `null` en demo |
| `direccion` | Sí — bloque E | Sí | Domicilio | Parcial para `localidad`; semántica distinta |
| `visita_scheduled_at` | No en `client_crm` | Sí | Segunda fecha legacy | Oculto Pickup; evitar duplicar con `next_activity_at` |

**Nota pipeline:** el contrato define `pipeline.stages[].label` (ej. «Nuevo contacto», `key: nuevo_contacto`). En Vercel QA (12W-5b-QA) el select muestra nombres materializados en BD (ej. **«Nuevo lead»**). El POST guarda el **string `nombre`** de la fila `leads_pipelines`, no el `stage_key` del contrato.

---

## 3. Campos contrato Pickup y mapping mínimo

**Fuente contrato:** `lib/crmPackage/configs/pickup4x4.config.ts` → `lead_fields.groups[]` (25 claves vía `packageToLeadFields()` en `lib/crmPackage/adapters/leadFields.ts`).

**Snapshot en UI:** `useLeadFieldsConfig()` / `LeadsClientCrmContext` — hoy solo atributos `data-crm-package-*`; el formulario sigue cableado a states legacy.

### 3.1 Tabla mapping contrato → payload

| Campo contrato | Grupo contrato | Campo UI 12W-5b | Campo payload | Persistencia hoy | Acción 12W-5c |
|----------------|----------------|-----------------|---------------|------------------|---------------|
| `nombre` | Cliente | Nombre / Razón social | `nombre` | **Sí** | Mantener; label ya alineado |
| `telefono` | Cliente | Teléfono | `telefono` | **Sí** | Mantener |
| `email` | Cliente | Email | `email` | **Sí** | Mantener |
| `localidad` | Cliente | — (sin campo) | — / `direccion` parcial | **No** dedicado | **Pendiente** — no mezclar en `direccion` sin decisión D4 |
| `tipo_cliente` | Cliente | — | — | **No** | **Pendiente 12W-5d** |
| `origen` | Cliente | Origen | `origen` | **Sí** (texto) | Mantener texto libre en 5c-IMPL; select futuro (D2) |
| `estado_comercial` | Cliente | — | — | **No** | **Pendiente 12W-5d** (distinto de `pipeline`) |
| `marca` | Vehículo | Card informativa | — | **No** | **Pendiente 12W-5d** — bloque B ya avisa |
| `modelo` | Vehículo | Card informativa | — | **No** | Idem |
| `año` | Vehículo | Card informativa | — | **No** | Idem |
| `matricula` | Vehículo | Card informativa | — | **No** | Idem |
| `tipo_uso` | Vehículo | Card informativa | — | **No** | Idem |
| `accesorios_interes` | Vehículo | — (no campo propio) | — | **No** | **No** volcar a `notas`/`oferta` en 5c; campo propio en 5d |
| `producto_servicio` | Oportunidad | Producto o accesorio consultado | `oferta` | **Sí** | Mapping principal necesidad comercial |
| `presupuesto_estimado` | Oportunidad | Mención en copy | — | **No** | **Pendiente 12W-5d** (D5) |
| `vendedor_responsable` | Oportunidad | Comercial responsable | `comercial_id` | **Sí** | UUID comercial |
| `etapa` | Oportunidad | Etapa comercial | `pipeline` | **Sí** (nombre) | Ya filtrado `contractOnly=1`; no usar `stage_key` en POST |
| `proxima_accion` | Oportunidad | Próxima acción comercial | `next_activity_type` | **Sí** con adapter | Mapear claves contrato → API (§4.2) |
| `fecha_limite` | Oportunidad | Fecha de seguimiento | `next_activity_at` | **Sí** | ISO datetime |
| `observaciones` | Oportunidad | Observaciones | `notas` | **Sí** | Label ya alineado |
| `kore_cliente_id` | Kore | — | — | **No** | Integración futura (D6) |
| `kore_documento_id` | Kore | — | — | **No** | Idem |
| `ultima_sincronizacion` | Kore | — | — | **No** | Solo lectura post-sync |
| `fuente_dato` | Kore | — | — | **No** | Idem |
| `confianza_dato` | Kore | — | — | **No** | Idem |

### 3.2 Campo legacy fuera del contrato pero en payload

| Campo UI / payload | En contrato | Recomendación 12W-5c |
|--------------------|-------------|----------------------|
| `contacto` | No | **Mantener** en POST y bloque A — valor operativo para Pickup (persona vs razón social) |

### 3.3 Resumen contable

| Categoría | Cantidad (aprox.) |
|-----------|------------------|
| Claves en contrato `lead_fields` | 25 |
| Mapeo directo 1:1 a payload hoy | **10** (`nombre`, `telefono`, `email`, `origen`, `oferta`, `comercial_id`, `pipeline`, `next_activity_*`, `notas`) |
| Legacy útil fuera contrato | **1** (`contacto`) |
| Parcial / ambiguo | **1** (`localidad` ↔ `direccion`) |
| Pendiente persistencia | **13** (vehículo, Kore, presupuesto, tipo/estado cliente, accesorios estructurados) |

---

## 4. Labels y opciones a alinear sin cambiar payload

Cambios de **label** y **opciones de select** no requieren modificar el shape del JSON POST si los **values** enviados siguen siendo los que acepta la API.

### 4.1 Tabla labels

| Elemento UI | Actual 12W-5b (`client_crm`) | Contrato / recomendado | ¿Cambio UI futuro? | Fase |
|-------------|------------------------------|------------------------|-------------------|------|
| Nombre | Nombre / Razón social * | `nombre` | Ya alineado | — |
| Contacto | Contacto | — (legacy) | Mantener | 5c-IMPL opcional |
| Origen | Origen | `origen` — «Origen / canal» | Label «Origen / canal» | 5c-IMPL |
| Producto | Producto o accesorio consultado | `producto_servicio` | Ya alineado | — |
| Etapa | Etapa comercial | `etapa` | Ya alineado; valor = nombre BD | — |
| Próxima acción | Próxima acción comercial | `proxima_accion` | Opciones desde contrato + adapter | **5c-IMPL** |
| Fecha | Fecha de seguimiento | `fecha_limite` | Ya alineado | — |
| Comercial | Comercial responsable * | `vendedor_responsable` | Ya alineado | — |
| Notas | Observaciones | `observaciones` | Ya alineado | — |
| Dirección | Dirección | `localidad` (distinto) | No renombrar a Localidad sin D4 | 5d |

### 4.2 Próxima acción — contrato vs UI vs API

**Contrato `activity_types` (`pickup4x4.config.ts`):**

| key contrato | label contrato |
|--------------|----------------|
| `llamada` | Llamada |
| `whatsapp` | WhatsApp |
| `email` | Email |
| `visita_showroom` | Visita a showroom |
| `instalacion` | Instalación de accesorios |

**UI actual `NEXT_ACTIVITY_OPTIONS` (`nuevo/page.tsx`):**

| label UI | value POST |
|----------|------------|
| — Opcional — | `""` |
| Contactar por WhatsApp | `whatsapp` |
| Llamar | `call` |
| Enviar cotización | `proposal` |
| Coordinar reunión | `meeting` |
| Consultar stock | `email` |
| Hacer seguimiento | `followup` |
| Otro | `followup` |

**API `cleanActivityType` acepta:** `call`, `meeting`, `proposal`, `whatsapp`, `email`, `followup` (y `none`).

**Problema:** si 5c-IMPL enviara las claves del contrato (`llamada`, `visita_showroom`, `instalacion`) **sin adapter**, el POST **fallaría con 400**.

**Adapter recomendado (5c-IMPL, sin cambiar API):**

| key contrato (UI label) | value POST (API) | Notas |
|-------------------------|------------------|-------|
| `llamada` | `call` | Semántica equivalente |
| `whatsapp` | `whatsapp` | 1:1 |
| `email` | `email` | 1:1 |
| `visita_showroom` | `meeting` | Showroom ≈ reunión coordinada |
| `instalacion` | `followup` | Hasta ampliar API o tipo dedicado |
| (opcional vacío) | `null` / omitir | «— Opcional —» |

Opciones legacy (`proposal`, «Consultar stock», «Otro») pueden **retirarse en `client_crm`** o mostrarse solo en modos internos para no romper flujos Casa Limpia.

### 4.3 Origen

| Enfoque | Payload | Riesgo | Recomendación 12W-5c |
|---------|---------|--------|----------------------|
| Texto libre (actual) | `origen: string` | Baja consistencia reportes | **Mantener** en 5c-IMPL |
| Select valores fijos (web, showroom, referido…) | Mismo campo `origen` | Ninguno en API | **5c-IMPL** opcional si lista corta acordada con producto |
| Nuevo campo / JSONB | — | Requiere 5d | **NO** en 5c |

### 4.4 Pipeline

| Aspecto | Estado | Acción 12W-5c |
|---------|--------|---------------|
| Filtro 9 etapas | OK (`contractOnly=1`) | Ninguna |
| Labels en select | Nombres BD (QA: «Nuevo lead», …) | Documentar divergencia contrato «Nuevo contacto» vs BD; **no** renombrar en POST |
| `stage_key` en POST | No soportado | **NO-GO** explícito |
| Default | `Nuevo lead` si existe | Mantener `pickPreferredPipeline()` |

### 4.5 `accesorios_interes` vs `oferta`

| Opción | Veredicto 12W-5c |
|--------|------------------|
| Concatenar accesorios en `oferta` | **NO-GO** — mezcla semántica, deuda en reportes |
| Campo UI separado → `notas` | **NO-GO** — parche silencioso (§6) |
| Segundo textarea visual sin POST | **NO-GO** — confunde al usuario |
| Esperar 12W-5d (`custom_fields` o campo dedicado) | **GO** |

---

## 5. Propuesta de mapping mínimo 12W-5c

Lo implementable en **12W-5c-IMPL** sin SQL ni cambio de shape POST:

### 5.1 Mantener (sin regresión)

- Los **16 campos** del payload actual y la función `createLead()` sin nuevas claves.
- Bloque Vehículo **informativo**; sin states persistibles de vehículo.
- Pipeline por **nombre** + `contractOnly=1` en `client_crm`.
- Ocultación legacy en `client_crm` (`rubro`, personal, m², `visita_scheduled_at`).
- `contacto` en bloque A aunque no esté en contrato.

### 5.2 Alinear en 5c-IMPL (recomendado)

| # | Cambio | Tipo | Impacto POST |
|---|--------|------|--------------|
| 1 | Labels Pickup restantes (ej. «Origen / canal») | UI copy | Ninguno |
| 2 | `NEXT_ACTIVITY_OPTIONS` en `client_crm` desde `activity_types` + **adapter** §4.2 | UI select | Values siguen siendo API-safe |
| 3 | Origen: select corto opcional (mismos strings en `origen`) | UI | Ninguno |
| 4 | Leer labels de etapa desde snapshot `pipelineStages` donde aplique | UI | Ninguno |
| 5 | Banner/tooltip si bloque B visible: «no se guarda al crear» | UX | Ninguno |

### 5.3 Explícitamente fuera de 5c-IMPL

- Agregar `marca`, `modelo`, `año`, `matricula`, `tipo_uso`, `presupuesto_estimado` al payload.
- Guardar vehículo o presupuesto en `notas` / `oferta` estructurado.
- Campos ocultos que envían datos sin UI.
- Enviar `stage_key` en lugar de `pipeline` (nombre).
- Ampliar `ALLOWED_ACTIVITY` en API (eso es cambio de API → 5d o ticket API).

---

## 6. Riesgos de guardar campos extra en notas

| Riesgo | Detalle |
|--------|---------|
| No reportable | `notas` es texto libre; no alimenta reportes «por marca» o «por presupuesto» |
| Deuda técnica | Migrar después de JSONB implica parsear notas legacy |
| Migración frágil | Patrones ad hoc (`Marca: Toyota`) se rompen con edición manual |
| UX engañosa | Usuario cree que completó campos «reales» del bloque B |
| Mezcla con observaciones | Pierde el rol de `observaciones` comerciales |

**Dictamen:** **NO-GO** guardar vehículo, presupuesto, accesorios o localidad en `notas`/`oferta` de forma silenciosa. **GO** solo parche **explícito** temporal con banner (no recomendado para Pickup piloto).

---

## 7. Decisiones pendientes

| ID | Decisión | Opciones | Recomendación 12W-5c |
|----|----------|----------|----------------------|
| **D1** | Persistencia vehículo | JSONB `custom_fields` / EAV / postergar | **Postergar** hasta 12W-5d; UI informativa hasta entonces |
| **D2** | Origen | Texto libre / select valores fijos | **Texto libre** ahora; select en 5c-IMPL si producto define lista |
| **D3** | Activity types | Claves contrato + adapter / ampliar API / mantener mix legacy | **Adapter contrato → API** en `client_crm`; ampliar API en 5d si hace falta `instalacion` nativo |
| **D4** | Localidad | `direccion` parcial / campo nuevo / JSONB | **No** mapear localidad → dirección sin decisión; 5d |
| **D5** | Presupuesto estimado | No persistir / `custom_fields` / columna | **No persistir** en 5c; JSONB en 5d |
| **D6** | Kore | Solo lectura en ficha / sync POST | **Pendiente** integración; fuera de Nuevo Lead create |
| **D7** | QA POST demo | Tras 5c-IMPL / tras 5e persistencia | **5c-IMPL** smoke POST opcional; **5-QA** formal con vehículo cuando exista 5e |
| **D8** | Label pipeline BD vs contrato | Renombrar filas BD / solo documentar | **Documentar** («Nuevo lead» vs «Nuevo contacto»); no bloquear 5c |

---

## 8. Fases siguientes

| Fase | Alcance | Entregable |
|------|---------|------------|
| **12W-5c** (esta) | Diseño mapping mínimo | Este documento |
| **12W-5c-IMPL** | Labels finos + `activity_types` adapter + origen select opcional | PR acotado a `nuevo/page.tsx` (+ helper adapter si aplica) |
| **12W-5d** | Decisión JSONB vs EAV + diseño API/GET | Doc migración; sin SQL hasta aprobación |
| **12W-5e** | Persistencia vehículo y campos contrato no mapeados | BD + API + UI editable bloque B |
| **12W-5-QA** | Vercel POST controlado | Lead demo + verificación Kanban/Ficha |

---

## 9. NO-GO explícitos

- No SQL ni migraciones en 12W-5c / 5c-IMPL mínimo.
- No columnas específicas Pickup (`marca`, `modelo`, …) en `leads`.
- No guardar vehículo ni presupuesto en `notas` u `oferta` sin UI de persistencia real.
- No agregar claves nuevas al payload sin actualizar API y diseño 5d.
- No enviar `stage_key` en POST — solo `pipeline` (nombre).
- No romper modos internos: adapter de actividades solo en `client_crm` o con fallback legacy.
- No tocar Kanban, Ficha, Lista, `PipelinesTab`, middleware.
- No usar `leadFields` solo como `data-*` si el objetivo es mapping — 5c-IMPL debe consumir snapshot para opciones.

---

## 10. Dictamen final

| Pregunta | Dictamen |
|----------|----------|
| ¿Mapping mínimo con payload actual es viable? | **GO** — 10 campos contrato + `contacto` legacy |
| ¿Implementar labels/opciones sin BD? | **GO** en **12W-5c-IMPL** con adapter `activity_types` |
| ¿Persistir vehículo en esta fase? | **NO-GO** hasta **12W-5d/5e** |
| ¿Ampliar POST ahora? | **NO-GO** |
| ¿Guardar extras en notas? | **NO-GO** |

**Próximo paso recomendado:**

1. Si el objetivo es **cerrar alineación operativa sin BD** → **12W-5c-IMPL** (adapter actividades + origen select + copy origen/canal).  
2. Si el objetivo es **datos estructurados de vehículo** → saltar implementación cosmética y abrir **12W-5d** (JSONB recomendado en 12W-5a §6).

---

## 11. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | **No** |
| API modificada | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Solo documentación | **Sí** |
| Commit | **No** (por instrucción de fase) |

---

## Referencias de código

| Archivo | Responsabilidad mapping |
|---------|-------------------------|
| `app/admin/leads/nuevo/page.tsx` | Payload UI, labels 5b, `NEXT_ACTIVITY_OPTIONS` |
| `app/api/admin/leads/route.ts` | Validación POST, `cleanActivityType`, insert `leads` |
| `lib/crmPackage/configs/pickup4x4.config.ts` | `lead_fields`, `pipeline.stages`, `activity_types` |
| `lib/crmPackage/adapters/leadFields.ts` | Normalización grupos contrato |
| `app/admin/leads/LeadsClientCrmContext.tsx` | Snapshot `client_crm` vs legacy |
