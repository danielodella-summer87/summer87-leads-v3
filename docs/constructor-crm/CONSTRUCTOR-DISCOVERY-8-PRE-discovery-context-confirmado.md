# CONSTRUCTOR-DISCOVERY-8-PRE — Diseño del DiscoveryContext confirmado

> **Tipo:** Diagnóstico + diseño + documentación (fase PRE, sin implementación).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-SEPARATION-1-separacion-constructor-crm-operativo.md` (commit `041e2e9`).
> **Alcance:** Diseñar el contrato técnico/funcional del **DiscoveryContext confirmado** como capacidad base reusable. NO se implementó nada: no se modificó código/UI, no se ejecutó SQL, no se crearon tablas, no se tocaron datos, `.env.local` ni proyectos externos. NO hay deploy/commit/push.
> **Principio rector:** No copiar Casa Limpia literalmente; extraer el patrón reusable (respuestas → estados de confirmación → contexto confirmado → faltantes críticos → bloqueo de motores → resumen interno → revisión humana).

---

## A. Resumen ejecutivo

El Discovery del Constructor hoy es un **flujo de 8 pasos** (empresa → cuestionario → documentos → diagnóstico → proceso-pipeline → motores-ia → reportes → auditoría) que persiste en una única tabla `crm_setup_config` (1 fila/instancia, un JSONB por paso) y calcula un **readiness por sección/campo** con estados `good|warning|danger|neutral`. Es un buen cuestionario, pero **no produce una fuente de verdad confirmada**: los datos quedan como respuestas de formulario sin un estado explícito de *confirmado/estimado/pendiente* a nivel de dato crítico, y nada bloquea motores o costeo si faltan datos clave.

El **DiscoveryContext** es la pieza que cierra esa brecha: un objeto **derivado** del setup actual que normaliza las respuestas en campos estructurados, les asigna un **estado de confirmación por dato**, calcula `missing_critical_fields`, `engine_blockers` y `quoting_blockers`, y se **congela** mediante un botón "Terminé" en una *submission* versionada. Es la precondición para activar motores sensibles, costeo/cotización y la generación/aprobación del `package_payload`.

**Decisión de diseño central:** el DiscoveryContext se **deriva** de `crm_setup_config` (no lo reemplaza). El primer bloque de implementación (**DISCOVERY-8a**) debe ser un **helper puro sin SQL** que construya el DiscoveryContext desde la fila existente y exponga los bloqueadores; la persistencia de la *submission confirmada* puede empezar **sin SQL** reutilizando la columna `meta` (JSONB) ya existente, y graduarse a una tabla dedicada `discovery_submissions` (con SQL) recién cuando haga falta historial/auditoría.

---

## B. Estado Git inicial

```
Directorio: /Users/danielodella/PROYECTOS/summer87-leads-v3
git status --short:  (working tree limpio)
Rama: * main  041e2e9 [origin/main]  (sincronizada)
```

`git log --oneline -10`:
```
041e2e9 docs(constructor): document Constructor and CRM separation
30d3141 fix(constructor): govern prototype flags by environment
b359bc9 docs(constructor): add REBASE-2 architecture decisions
319ce61 docs(constructor): add REBASE-1 post Casa Limpia audit
389630a Document Casa Limpia local clone validation
1bc7f0f Document Casa Limpia local clone procedure
d6b79b4 Document Casa Limpia pre-clone Go No-Go checklist
6a99859 Document Casa Limpia seed users and permissions
36b80a5 Document Casa Limpia clean clone technical plan
2924dd6 Document Casa Limpia CRM contract
```

---

## C. Diagnóstico del Discovery actual

**Dónde se carga / guarda.** Cada paso es una página en `app/admin/constructor-crm/<paso>/page.tsx` que hace `PATCH /api/admin/constructor/setup` con `{ step, data, mark_completed }`. La API mapea el paso a una columna JSONB cerrada (`STEP_TO_COLUMN`) de `crm_setup_config`. Hay además una rama `step: "meta"` para `status`, `readiness_score`, `current_step`, `completed_steps`, `meta`.

**Estructura de persistencia (`migrations/070_create_crm_setup_config.sql`).** Una fila por instancia:
- JSONB por paso: `empresa`, `cuestionario`, `documentos`, `diagnostico`, `proceso_pipeline`, `motores_ia`, `reportes`, `auditoria`.
- Escalares: `version`, `status` (`setup|active|paused`), `readiness_score` (0–100), `completed_steps TEXT[]`, `current_step`, `meta` JSONB (con índice GIN), `created_at`, `updated_at`.

**Campos explícitos vs texto libre (muestra representativa).**
- **Estructurados (enum/select/checklist):** `rubro`, `tiposCliente` (B2B/B2C/B2G), `fuentesProspectos`, `requiereVisita`, `tipoCotizacion`, `tiposVenta`, `cicloVenta`, `decisores`, `metricasImportantes`, `dondeAyudarIA`, `modeloComercial`, `complejidad`, `madurez`, `dependenciaHumana`, estado de matriz (`pendiente|parcial|solido|riesgo`).
- **Texto libre:** `queVende`/`queVendeDetalle`, `procesoActual`, `criteriosCalificacion`, `queBloquea`, `condicionesGanado`, `decisionesNoIA`, `riesgos`, `oportunidades`, `puntosCiegos`.
- **Faltantes notables como dato estructurado:** `pais` y `ciudad` son **texto libre** (con heurística de inversión país/ciudad), `ticketPromedio` es **texto libre** ("USD 500, variable…"), y **no hay moneda ni zonas como campos tipados**.

**Readiness existente.** Cada página computa un readiness por sección y por campo con `QualityStatus` (`good|warning|danger|neutral`), ponderado, con `nextAction` y `fieldHints`. Hay marca de avance (`mark_completed`, `completed_steps`, `current_step`).

**Concepto confirmado/pendiente/estimado.** **No existe** a nivel de dato. El readiness mide "cuán completo/extenso" está un campo, no "si el cliente lo confirmó". No hay distinción entre un dato validado y uno inferido/estimado.

**Qué falta para convertirlo en DiscoveryContext.**
1. **Normalización**: pasar de "respuestas de formulario por paso" a **campos canónicos** (país, moneda, servicios, etc.) independientes del layout del cuestionario.
2. **Estado de confirmación por dato** (confirmed/pending/estimated/not_applicable/requires_human_decision).
3. **Bloqueadores derivados**: `missing_critical_fields`, `engine_blockers`, `quoting_blockers`.
4. **Congelado (submission)**: un "Terminé" que produzca un snapshot versionado e inmutable.
5. **Resumen interno** para revisión humana antes de habilitar motores/costeo.

---

## D. Contrato conceptual DiscoveryContext

> Tipo conceptual (TypeScript ilustrativo, **no se implementa en esta fase**). Pensado para vivir en `lib/constructor/discovery/types.ts` cuando llegue 8a.

```ts
type DiscoveryDataState =
  | "confirmed" | "pending" | "estimated" | "not_applicable" | "requires_human_decision";

type DiscoveryField<T> = {
  value: T | null;
  state: DiscoveryDataState;
  source?: "questionnaire" | "diagnostico" | "document" | "manual" | "ai_suggestion";
  note?: string;          // por qué está estimado / qué falta confirmar
  critical?: boolean;     // si su ausencia/duda bloquea motores o costeo
};

type DiscoveryContext = {
  // Identidad
  client_key: DiscoveryField<string>;     // slug del cliente
  vertical_key: DiscoveryField<string>;   // rubro/vertical normalizado
  project_key: DiscoveryField<string>;    // identificador de proyecto/instancia

  // Localización y economía
  country: DiscoveryField<string>;
  currency: DiscoveryField<string>;       // hoy NO existe como campo tipado → pending por defecto
  cities_zones: DiscoveryField<string[]>;

  // Oferta y demanda
  services: DiscoveryField<string[]>;
  client_types: DiscoveryField<string[]>; // B2B/B2C/B2G + segmentos

  // Proceso
  commercial_process: DiscoveryField<{ stages: string[] }>;
  critical_fields: DiscoveryField<string[]>;    // datos que el negocio considera imprescindibles
  operational_rules: DiscoveryField<string[]>;
  commercial_rules: DiscoveryField<string[]>;

  // Contexto cualitativo
  constraints: DiscoveryField<string[]>;
  assumptions: DiscoveryField<string[]>;        // supuestos no confirmados
  sources: { step: string; field: string }[];  // trazabilidad a crm_setup_config

  // Estado y derivados
  status: "draft" | "in_review" | "confirmed" | "needs_rework";
  completion_percent: number;                   // reutiliza readiness existente
  missing_critical_fields: string[];            // claves de campos critical no confirmados
  engine_blockers: string[];                    // motivos por los que motores quedan bloqueados
  quoting_blockers: string[];                   // motivos por los que costeo queda bloqueado

  // Timestamps
  updated_at: string;
  submitted_at?: string | null;                 // set por el botón "Terminé"
  schema_version: string;
};
```

Notas:
- `currency`, `cities_zones` y `services` hoy no existen como datos tipados en el cuestionario → el helper los marcará `pending` o `estimated` hasta que se capturen explícitamente. Esto es deseado: hace **visible** la deuda de datos en vez de inventar confirmaciones.
- `sources` mantiene trazabilidad a la columna/paso de `crm_setup_config` de donde se derivó cada campo.

---

## E. Estados de dato

| Estado | Significado | ¿Alimenta motores? | ¿Alimenta cotización? | ¿Se muestra como bloqueo? | ¿Entra al `package_payload`? |
|---|---|---|---|---|---|
| `confirmed` | Validado por el cliente / fuente confiable | **Sí** | **Sí** | No | **Sí** |
| `estimated` | Propuesto/inferido, no validado | Solo **read-only** (motores no escriben) | **No** (costeo bloqueado) | Sí, como aviso "estimado" | Solo como `metadata`/marcado, nunca como confirmado |
| `pending` | Falta capturar | No | No | **Sí** (bloqueante si `critical`) | No |
| `not_applicable` | Explícitamente irrelevante para el cliente | Neutral (no bloquea) | Neutral | No | Sí, como `not_applicable` |
| `requires_human_decision` | Conflicto/ambigüedad (p. ej. país/ciudad invertidos) | **No** | **No** | **Sí** (bloqueante) | No hasta resolver |

Regla transversal: **un dato `critical` que no esté `confirmed` o `not_applicable` bloquea** lo que dependa de él. `estimated` permite *previsualizar* (read-only) pero nunca *ejecutar* escritura ni costear.

---

## F. Botón "Terminé" reusable

- **Cuándo aparece:** en el Constructor base (`constructor_base`), al final del flujo de Discovery (o por paso, marcando "confirmar sección"). Nunca visible para `client_crm`.
- **Qué valida antes de cerrar:** que no haya `requires_human_decision` sin resolver y que `missing_critical_fields` esté vacío *o* que cada faltante crítico esté explícitamente marcado `estimated`/`not_applicable` con nota. Reusa el readiness existente como umbral mínimo.
- **Qué genera:** un `DiscoveryContext` con `status: "confirmed"` y `submitted_at` sellado; y los tres arrays de bloqueadores recalculados.
- **Qué guarda:** una *submission* (snapshot inmutable) — ver §G. No muta las respuestas de los pasos; las **congela**.
- **Qué mensaje muestra:** confirmación clara del tipo "Discovery confirmado. Motores/costeo se habilitarán según datos confirmados; los datos estimados quedan marcados y no habilitan escritura ni cotización."
- **Qué NO debe hacer:** **no** activar motores sensibles, **no** ejecutar costeo, **no** generar/aprobar `package_payload`, **no** escribir en sistemas externos, **no** tocar el CRM operativo. Solo congela y habilita revisión.
- **Cómo evita activar motores sensibles:** el "Terminé" solo **marca** el contexto como confirmado; la activación de cada motor es un paso aparte que **lee** los bloqueadores. Separación explícita entre "confirmar Discovery" y "activar motor".
- **Disponibilidad para revisión interna:** la submission queda consultable (resumen interno + bloqueadores) para que Summer87 revise antes de avanzar a instalación.

---

## G. Persistencia recomendada

Opciones evaluadas:

| Opción | Descripción | ¿SQL? | Veredicto |
|---|---|---|---|
| **A. Reusar `crm_setup_config`** | Derivar el contexto al vuelo desde los JSONB existentes; guardar la submission confirmada dentro de `meta` (p. ej. `meta.discovery_submission`). | **No** (reusa columna `meta` existente) | **Recomendada para 8a** |
| **B. Tabla `discovery_submissions`** | Tabla append-only de snapshots confirmados (historial, auditoría, varias submissions). | **Sí** (nueva tabla) | **Recomendada a futuro** (cuando haga falta historial) |
| C. Dentro de `installer_package_drafts` | Guardar el contexto en el draft del paquete. | Sí (cambia shape) | No: acopla Discovery al paquete; el Discovery debe preceder al paquete |
| D. Solo como `package_payload` | No persistir contexto, derivar al generar el paquete. | No | No: pierde el estado confirmado y la revisión previa |

**Recomendación (híbrida, por etapas):**
1. **8a (sin SQL):** helper puro que **deriva** el `DiscoveryContext` desde la fila de `crm_setup_config` en cada lectura. El "Terminé" persiste el snapshot confirmado en `meta.discovery_submission` (JSONB ya existente, idempotente, sin migración). Esto cumple el criterio "sin SQL si es posible".
2. **8b+ (con SQL, diferido):** cuando se necesite historial/múltiples submissions/consultas cross-instancia, introducir `discovery_submissions` (pseudo-diseño abajo) con migración idempotente como las existentes.

**Pseudo-diseño documental de `discovery_submissions` (NO ejecutar):**
```
discovery_submissions (
  id UUID PK default gen_random_uuid(),
  setup_config_id UUID,            -- FK lógica a crm_setup_config.id
  schema_version TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft','in_review','confirmed','needs_rework')),
  context JSONB NOT NULL,          -- snapshot del DiscoveryContext
  missing_critical_fields TEXT[],
  engine_blockers TEXT[],
  quoting_blockers TEXT[],
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ default now()
)  -- + índice por status; sin tocar tablas existentes; rollback comentado.
```

---

## H. Relación con `package_payload`

- **Qué puede entrar al paquete:** solo campos `confirmed` (y `not_applicable` como exclusión explícita). Mapea a sectores del contrato `crm_package_config` v1: `client.country`, `pipeline.stages`, `lead_fields`, `labels`, `reports`, `ai_rules`, etc.
- **Qué queda solo para revisión interna:** `assumptions`, notas de `estimated`, `sources`, y el resumen de diagnóstico cualitativo. No se exporta como configuración operativa.
- **Qué bloquea generación/aprobación:** cualquier `engine_blocker`/`quoting_blocker` activo, o `missing_critical_fields` no vacío, marca el paquete como *borrador no apto para piloto*.
- **Qué permite avanzar aunque esté `estimated`:** campos no críticos pueden viajar como `metadata` con su marca `estimated`; **nunca** se promueven a `confirmed` en el payload.
- **Cómo se evita que datos pendientes entren como confirmados:** el helper que construye el payload solo lee `state === "confirmed"`; un dato `pending`/`estimated`/`requires_human_decision` no se serializa como valor confirmado (a lo sumo como metadato marcado). El "Terminé" es la única vía de sellar `confirmed`.

---

## I. Relación con motores

| Motor / caso | Con `confirmed` | Con `estimated` | Bloqueado si… |
|---|---|---|---|
| Asistente de campos (sugerencias) | Opera | Opera read-only | — (es read-only por naturaleza) |
| Motor de lectura/resumen documental | Opera | Read-only | Documentos críticos `pending` |
| Detector de riesgos | Opera | Read-only | Sin proceso comercial confirmado |
| Generador de reportes | Opera | Read-only (preview) | Métricas/pipeline `pending` |
| **Costeo / Cotización** (sensible) | Opera | **Bloqueado** | `currency`/`ticket`/estructura de precio no `confirmed` → `quoting_blockers` |
| **Propuesta automática** (sensible) | Opera | **Bloqueado** | Servicios/condiciones de cierre no `confirmed` |
| Escritura a sistemas externos | Solo con `ai_rules.allow_external_writes` y Discovery confirmado | **Bloqueado** | Discovery no confirmado |

Principio: **motores read-only antes de escritura**. Ningún motor escribe ni costea sin Discovery confirmado; los `estimated` solo habilitan previsualización.

---

## J. Relación con costeo/cotización

Caso sensible explícito (aprendizaje directo de Casa Limpia):
- El **costeo se bloquea** mientras los **parámetros críticos** (moneda, ticket/estructura de precio, unidades, márgenes, servicios cotizables) no estén `confirmed`. Hoy `ticketPromedio` es texto libre y **no hay `currency` tipada** → por defecto `quoting_blockers` incluiría "moneda no confirmada" y "estructura de precio no confirmada".
- La **cotización** nunca usa valores `estimated` como si fueran reales; a lo sumo muestra un preview claramente marcado "estimado, no cotizable".
- El módulo de costeo debe ser **reusable** (no el `.xlsx` literal de Casa Limpia, ya extraído del repo). Su activación depende de `quoting_blockers === []`.

---

## K. Riesgos

1. **Falsos confirmados:** si el "Terminé" no valida bien, datos `estimated` podrían tratarse como `confirmed`. Mitigación: el sellado `confirmed` es explícito por dato; el helper de payload solo lee `confirmed`.
2. **Deuda de datos oculta:** campos hoy inexistentes (moneda, zonas, servicios tipados) podrían quedar como texto libre. Mitigación: el DiscoveryContext los marca `pending`/`estimated` y los expone en `missing_critical_fields` (los hace visibles).
3. **Acoplar Discovery al paquete (opción C):** rompería el orden lógico Discovery → paquete. Mitigación: persistir en `crm_setup_config`/submission, no en el draft.
4. **Crecer el `meta` JSONB:** guardar submissions grandes en `meta` puede inflar la fila. Mitigación: 8a guarda solo el último snapshot; el historial migra a `discovery_submissions` cuando haga falta.
5. **Divergencia readiness vs estados de dato:** el readiness mide completitud, no confirmación. Mitigación: tratarlos como capas distintas; readiness alimenta `completion_percent`, pero el bloqueo lo deciden los estados de dato.

---

## L. Implementación mínima recomendada — CONSTRUCTOR-DISCOVERY-8a

**Alcance pequeño, sin SQL, sin UI grande:**
1. **Helper puro** `lib/constructor/discovery/buildDiscoveryContext.ts`: toma la fila de `crm_setup_config` (o el objeto ya cargado) y devuelve un `DiscoveryContext` derivado, con `state` por campo, `missing_critical_fields`, `engine_blockers`, `quoting_blockers`. Sin efectos secundarios, sin DB, sin red.
2. **Tipos** en `lib/constructor/discovery/types.ts` (los de §D).
3. **Selftest/tests** del helper con fixtures (p. ej. fila vacía → todo `pending` y bloqueadores poblados; fila completa → `confirmed`). Reutiliza el patrón de `lib/crmPackage/validate.ts`.
4. **Documentación** de uso del helper.
5. **No tocar `package_payload`** salvo lectura/análisis; **no** persistir aún (o, si se persiste el snapshot, solo en `meta.discovery_submission`, sin migración).

Criterio de aceptación de 8a: el helper construye el contexto y los bloqueadores de forma determinista desde el setup existente, con tests verdes y sin SQL.

---

## M. Próximas fases

1. **CONSTRUCTOR-DISCOVERY-8a** — helper puro + tipos + tests (sin SQL).
2. **CONSTRUCTOR-DISCOVERY-8b** — botón "Terminé" en UI del Constructor base + persistencia del snapshot confirmado (empezar en `meta`, evaluar `discovery_submissions`).
3. **CONSTRUCTOR-DISCOVERY-8c** — capturar campos hoy faltantes como datos tipados (moneda, zonas, servicios) para reducir `pending`.
4. **CONSTRUCTOR-QUOTING-1** — módulo de costeo reusable, bloqueado por `quoting_blockers`.
5. **CONSTRUCTOR-RUNTIME-1** — consumo de `package_payload` derivado de datos `confirmed`.

---

## N. Confirmaciones de alcance

- ✅ Existe el documento CONSTRUCTOR-DISCOVERY-8-PRE.
- ✅ Queda definido el DiscoveryContext confirmado, estados de dato, bloqueo de motores y costeo, persistencia y siguiente bloque mínimo.
- ✅ NO se modificó código funcional.
- ✅ NO se modificó UI.
- ✅ NO se ejecutó SQL · NO se crearon tablas.
- ✅ NO se tocaron datos.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador.
- ✅ NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
- ✅ Único cambio en disco: la creación de este documento.
- ✅ Índices NO actualizados (preferencia de esta fase).
