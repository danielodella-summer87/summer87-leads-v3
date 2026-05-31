# CONSTRUCTOR-VERTICALS-1 — Catálogo reusable de módulos por vertical

> **Tipo:** Implementación de código puro + tests (sin UI, sin SQL, sin APIs).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-DISCOVERY-8b-boton-termine-snapshot-confirmado.md` (commit `4c3d0a9`).
> **Alcance:** Catálogo reusable de verticales que resuelve `vertical_key → businessModules` para alimentar el DiscoveryContext. NO se tocó UI, SQL, datos, APIs, `package_payload` (escritura), motores, CRM operativo, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se creó un **catálogo de verticales** puro y reusable que transforma una `vertical_key` en su conjunto de `businessModules`, `vertical_required_fields` y campos verticales por defecto, compatibles directamente con `buildDiscoveryContextFromSetup` (8a). Esto elimina la necesidad de pasar módulos a mano y, sobre todo, mantiene la **corrección conceptual**: solo el vertical `cleaning_services` trae módulos pricing/costing/quotation por defecto; `generic`, `pickup_4x4`, `marketing_agency` y `education` **no** generan `quoting_blockers` salvo que el caller agregue explícitamente un módulo pricing.

El catálogo depende de DiscoveryContext **solo por tipos** (`import type`), por lo que en runtime no hay acoplamiento y los selftests corren con `node --experimental-strip-types` sin cadenas de import frágiles. Selftests: VerticalCatalog **29/29**, DiscoveryContext (8a/8b) **65/65**, build EXIT 0.

---

## B. Archivos creados/modificados

**Creados:**
- `lib/constructor/verticals/verticalCatalog.ts` — tipos + catálogo + helpers puros.
- `lib/constructor/verticals/verticalCatalog.selftest.ts` — selftest (8 grupos, 29 checks).
- `lib/constructor/verticals/index.ts` — reexporta catálogo, helpers y tipos.
- `docs/constructor-crm/CONSTRUCTOR-VERTICALS-1-catalogo-modulos-por-vertical.md` — este documento.

**No modificados:** `discoveryContext.ts`, `discoveryContext.selftest.ts`, `index.ts` de discovery, API, UI, `tsconfig.json` (la exclusión `**/*.selftest.ts` de fases previas ya cubre el nuevo selftest).

---

## C. Qué problema resuelve

Antes, `buildDiscoveryContextFromSetup` aceptaba `businessModules` pero alguien tenía que **declararlos a mano** en cada llamada. El catálogo provee esos presets por vertical de forma reusable y consistente, sin hardcodear Casa Limpia/Pickup/agencia dentro del helper. `buildDiscoveryContextInputForVertical(baseInput, verticalKey)` arma el input completo (módulos + campos críticos + campos verticales) listo para el helper.

---

## D. Catálogo inicial de verticales

| VerticalKey | Categoría | Pricing por defecto |
|---|---|---|
| `generic` | general | **No** |
| `cleaning_services` | services | **Sí** (costing, quotation) |
| `pickup_4x4` | retail | **No** |
| `marketing_agency` | agency | **No** |
| `education` | education | **No** |

`VerticalDefinition`: `key`, `label`, `description`, `category`, `business_modules`, `vertical_required_fields`, `default_fields?`, `notes?`. `BusinessModulePreset` es alias de `BusinessModuleInput` (compatibilidad 1:1).

---

## E. Módulos por vertical

- **generic:** `lead_capture`, `lead_qualification`, `follow_up`, `basic_reporting`. (sin pricing)
- **cleaning_services:** `site_survey`, `service_recommendation`, `operational_scope`, **`costing` (pricing)**, **`quotation` (pricing)**, `proposal_review`. `vertical_required_fields`: country, service_areas.
- **pickup_4x4:** `vehicle_fitment`, `product_recommendation`, `purchase_history`, `opportunity_detection`, `stock_interest`, `customer_segmentation`. Campos verticales por defecto: vehicle_compatibility, purchase_history_data, stock_data (pending). (sin pricing)
- **marketing_agency:** `commercial_diagnosis`, `channel_strategy`, `campaign_planning`, `proposal_scope` (commercial, **no** pricing), `client_follow_up`, `performance_reporting`. (sin pricing)
- **education:** `enrollment_pipeline`, `documentation_checklist`, `admission_status`, `capacity_tracking`, `family_follow_up`, `reporting`. (sin pricing)

---

## F. Corrección conceptual: costeo/cotización no son universales

Un módulo se considera pricing si su `category === "pricing"` o su key matchea el patrón de costeo/cotización. **Solo `cleaning_services`** declara módulos pricing por defecto. `proposal_scope` (agencia) es categoría `commercial`, explícitamente **no** cotización. Por tanto `quoting_blockers` solo aparece en `cleaning_services` por defecto, o cuando el caller agrega un módulo pricing explícito a cualquier vertical (validado en el selftest, caso F).

---

## G. Cómo se conecta con DiscoveryContext 8a/8b

`buildDiscoveryContextInputForVertical(baseInput, verticalKey)` devuelve un `DiscoverySetupInput` con `verticalKey`, `businessModules` (presets + extras del caller), `verticalRequiredFields` (unión) y `verticalFields` (defaults + extras). Ese input se pasa tal cual a `buildDiscoveryContextFromSetup` (8a) y, por extensión, a `buildDiscoverySubmission` (8b). El caller (UI/API en fases futuras) solo necesita elegir el vertical; el catálogo hace el resto. **Esta fase no cablea el catálogo en la UI ni en la API** (solo provee la pieza pura).

---

## H. Qué NO hace

- No accede a DB, red, fs, env ni React; no muta el input base.
- No toca UI, API ni Supabase.
- No escribe `package_payload`; no activa motores; no crea CRM operativo.
- No asume cliente, país ni moneda; no inventa datos.

---

## I. Selftest y resultados

`node --experimental-strip-types lib/constructor/verticals/verticalCatalog.selftest.ts` → **29/29**:
- A) generic sin pricing · B) cleaning_services con pricing (quoting_blockers presente: costing:currency, costing:cost_inputs) · C) pickup_4x4 sin pricing · D) marketing_agency sin pricing (proposal_scope commercial) · E) education sin pricing · F) pickup_4x4 + módulo pricing explícito → quoting_blockers presente · G) vertical desconocido → fallback seguro a generic (sin pricing) · H) no muta el input base.

`node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts` → **65/65** (sin regresión).

---

## J. Relación con Casa Limpia

`cleaning_services` modela el caso Casa Limpia (relevamiento + costeo + cotización) **como vertical, no como core**. Es un preset reusable; no se importó ni copió configuración del proyecto Casa Limpia.

## K. Relación con Pickup 4x4

`pickup_4x4` modela compatibilidad/recomendación/historial **sin** costeo. No genera `quoting_blockers` por defecto; el `pickup4x4.config.ts` legacy se consultó solo como referencia histórica, no se copió como arquitectura.

## L. Relación con agencia de marketing

`marketing_agency` modela diagnóstico/estrategia/alcance de propuesta. `proposal_scope` es alcance comercial, explícitamente distinto de cotización; sin pricing.

## M. Relación con education/generic

`education` (inscripción/admisión/cupos) y `generic` (captura/calificación/seguimiento) son verticales sin pricing. `generic` es además el **fallback seguro** para verticales desconocidas.

---

## N. Próximos pasos

1. **CONSTRUCTOR-DISCOVERY-8c** — capturar `vertical_key` y datos tipados faltantes en el setup, y cablear el catálogo en el cierre de Discovery (8b) para derivar módulos automáticamente.
2. **CONSTRUCTOR-RUNTIME-1** — consumo del `package_payload` derivado solo de datos `confirmed`.
3. Ampliar el catálogo con más verticales/presets a medida que aparezcan casos reales.

---

## O. Confirmaciones de alcance

- ✅ Existe catálogo reusable de verticales con tipos y helpers puros.
- ✅ Verticales iniciales: generic, cleaning_services, pickup_4x4, marketing_agency, education.
- ✅ Costeo/cotización por defecto solo en cleaning_services; los demás no generan `quoting_blockers`.
- ✅ Un módulo pricing agregado explícitamente sí genera `quoting_blockers`.
- ✅ `buildDiscoveryContextFromSetup` se usa con `businessModules` derivados del catálogo.
- ✅ Selftest VerticalCatalog OK (29/29) · Selftest DiscoveryContext OK (65/65) · Build OK.
- ✅ NO se modificó UI · NO se ejecutó SQL · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
