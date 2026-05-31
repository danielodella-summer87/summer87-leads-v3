# CONSTRUCTOR-DISCOVERY-8a — Helper puro DiscoveryContext universal con módulos por vertical

> **Tipo:** Implementación de código puro + tests (sin UI, sin SQL, sin APIs).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-DISCOVERY-8-PRE-discovery-context-confirmado.md` (commit `07991dd`).
> **Alcance:** Primera pieza reusable del DiscoveryContext universal, con **módulos de negocio por vertical**. NO se tocó UI, SQL, datos, APIs, `package_payload` (escritura), `installable_package` (escritura), `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó el **helper puro** que construye un `DiscoveryContext` desde el setup actual del Constructor (columnas JSONB por paso de `crm_setup_config`) **más los módulos de negocio que el vertical declara**. El helper normaliza respuestas en campos canónicos, asigna un **estado de confirmación** por dato, evalúa **módulos por vertical** y calcula los bloqueadores: `missing_critical_fields`, `engine_blockers`, `vertical_blockers`, `business_module_blockers`, `human_review_required` y —**solo si el vertical declara un módulo de costeo/cotización**— `quoting_blockers`.

**Corrección conceptual incorporada:** costeo y cotización **no son universales**. Son módulos opcionales (pricing/costing/quotation) que aplican a ciertos verticales (p. ej. limpieza), pero no a otros (vehículos, agencia, educación). Por eso `quoting_blockers` queda `undefined` cuando ningún módulo pricing fue declarado.

El helper es **puro, determinístico y agnóstico de cliente y vertical** (no asume país, moneda, vertical, módulos, Pickup ni Casa Limpia). Un selftest con 6 fixtures conceptuales (Casa Limpia, Pickup 4x4, agencia de marketing, cliente genérico, completo mínimo, input vacío) pasa **52/52**. Build OK.

---

## B. Archivos creados/modificados

**Creados:**
- `lib/constructor/discovery/discoveryContext.ts` — tipos + helper puro (módulo autocontenido).
- `lib/constructor/discovery/discoveryContext.selftest.ts` — selftest ejecutable con `node --experimental-strip-types`.
- `lib/constructor/discovery/index.ts` — reexporta helper y tipos (incluye tipos de módulos).
- `docs/constructor-crm/CONSTRUCTOR-DISCOVERY-8a-helper-discovery-context-universal.md` — este documento.

**Modificado (mínimo):**
- `tsconfig.json` — `**/*.selftest.ts` agregado a `exclude` (el selftest importa con extensión `.ts`, requisito de `node --experimental-strip-types`, que no debe entrar al type-check del app). No afecta el build del producto.

---

## C. Qué hace el helper

`buildDiscoveryContextFromSetup(input?)` → `DiscoveryContext`:
1. Lee de forma defensiva cada paso del setup (`empresa`, `cuestionario`, `diagnostico`, `proceso_pipeline`, `motores_ia`, `reportes`, `meta`).
2. Deriva campos canónicos (`client_name`, `country`, `currency`, `products_or_services`, `pipeline_stages`, etc.) con `value`, `state`, `source`, `critical`, `note`.
3. Incorpora **campos verticales** declarados por el caller (`verticalFields`) con su estado explícito (no se inventan).
4. Evalúa **módulos de negocio** (`businessModules`): un módulo queda `enabled` si todos sus `required_fields` están `confirmed`/`not_applicable`; si no, lista `blocker_keys`.
5. Particiona campos por estado y calcula `missing_critical_fields`, `engine_blockers`, `vertical_blockers`, `business_module_blockers`, `quoting_blockers` (condicional), `allowed_engines`/`blocked_engines`, `completion_percent`, `human_review_required` y `status`.
6. Reúne `assumptions`, `risks` y `sources` (trazabilidad paso↔campo).

Extrae etapas de pipeline tanto de strings como de objetos (`{nombre|label|name|key|titulo}`).

---

## D. Qué NO hace

- No accede a DB, red, filesystem ni `process.env`.
- No depende de React/Next; no muta el input; no usa `Date.now()`/`Math.random()` (determinístico).
- No inventa valores; no asume país/moneda/vertical/módulos por defecto.
- **No trata costeo/cotización como universales.**
- No escribe `package_payload` ni `installable_package`; no activa motores.

---

## E. Estados de dato

| Estado | Significado | completion | Para módulos |
|---|---|---|---|
| `confirmed` | Validado/estructurado | 1.0 | satisface required_field |
| `estimated` | Derivado/proxy sin confirmar | 0.5 | NO satisface (bloquea) |
| `pending` | Falta capturar | 0 | NO satisface (bloquea) |
| `not_applicable` | Irrelevante explícito | 1.0 | satisface required_field |
| `requires_human_decision` | Conflicto/ambigüedad | 0 | NO satisface + fuerza human review |

Campos **críticos universales** (CRM mínimo): `client_name`, `products_or_services`, `sales_process`, `pipeline_stages`. `country`, `currency`, etc. **no** son críticos universales: su criticidad la define el vertical (`verticalRequiredFields`) o un módulo.

---

## F. Módulos por vertical

`BusinessModuleInput` declara: `key`, `label?`, `category` (`commercial|operational|pricing|product|analytics|compliance|other`), `required?`, `required_fields[]`, `optional_fields[]`. El helper devuelve `BusinessModule` con `enabled`, `blocker_keys`, `human_review_required`.

- Si **no** se declaran módulos, el helper no inventa ninguno (estado conservador vía `engine_blockers`/`vertical_blockers`).
- Un módulo es **pricing** si `category === "pricing"` o su key matchea `quot|cost|pricing|price|quotation|costing|cotiz|costeo`. Solo entonces se genera `quoting_blockers`.
- Los `required_fields` pueden referenciar campos canónicos o campos verticales declarados (`verticalFields`), lo que permite modelar `vehicle_compatibility`, `purchase_history_data`, `budget_estimation`, etc., sin hardcode.

---

## G. Reglas de blockers

- **missing_critical_fields:** campos `critical` en `pending`/`requires_human_decision`.
- **engine_blockers:** `missing_client_identity`, `missing_products_or_services`, `missing_pipeline_stages`, `missing_sales_process`, `country_requires_human_decision`.
- **vertical_blockers:** campos de `verticalRequiredFields` no confirmados (p. ej. `country` solo si el vertical lo declara).
- **business_module_blockers:** por cada módulo `required` no habilitado → `${moduleKey}:${fieldKey}` por cada blocker.
- **quoting_blockers** (opcional): solo si hay módulo pricing/costing declarado → `${moduleKey}:${fieldKey}` de los módulos pricing. `undefined` si no aplica.
- **Motores:** read-only (`field_assistant`, `document_reader`, `risk_detector`, `report_generator`) operan si hay algún dato; sensibles (`auto_proposal`, `auto_messaging`, `external_writer`) se bloquean ante `engine_blockers`; `external_writer` siempre bloqueado en este helper.
- **human_review_required:** true si hay `human_decision_fields`, `missing_critical_fields`, `vertical_blockers`, `business_module_blockers`, o algún módulo con `human_review_required`.

---

## H. Casos de selftest

`node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts` → **52/52 passed**.

- **A. Casa Limpia conceptual:** módulos `site_survey`, `service_recommendation`, `costing`, `quotation` → `quoting_blockers` **presente** (costing:currency, costing:cost_inputs), `business_module_blockers` por site_survey, `service_recommendation` habilitado, `vertical_blockers` incluye service_areas.
- **B. Pickup 4x4 conceptual:** módulos `vehicle_fitment`, `product_recommendation`, `purchase_history`, `opportunity_detection` (ninguno pricing) → `quoting_blockers` **ausente**; `vehicle_fitment`/`product_recommendation` habilitados; `purchase_history` bloqueado por dato vertical; KORE marcado `estimated`; sin hardcode `pickup4x4`.
- **C. Agencia de marketing conceptual:** módulos `commercial_diagnosis`, `channel_strategy`, `campaign_planning`, `proposal_scope` → `quoting_blockers` **ausente**; bloqueos por `operational_team` y `budget_estimation`.
- **D. Cliente genérico:** falta todo lo crítico → `missing_critical_fields` + `vertical_blockers` (country) + `business_module_blockers`, `status: draft`, sin `quoting_blockers`.
- **E. Completo mínimo + submitted:** sin blockers → `status: confirmed`, `human_review_required: false`.
- **F. Input vacío:** robustez, determinismo, `quoting_blockers` ausente.

---

## I. Relación con Casa Limpia / Pickup / agencia / cliente genérico

Los cuatro son **casos de validación conceptual**, no arquitectura base. Las fixtures son ejemplos de entrada (no configuración real ni importada). El helper produce el mismo comportamiento para cualquier vertical: deriva estados de los datos presentes, evalúa los módulos que el vertical declara y bloquea lo que falte. No hay ramas `if (cliente === "…")` ni `if (vertical === "…")`.

---

## J. Relación con package_payload

El helper **no escribe** `package_payload`. Define la frontera de lo exportable: solo campos `confirmed` (y `not_applicable` como exclusión explícita) son candidatos al contrato `crm_package_config`; `estimated`/`pending` no se promueven a confirmados. La generación/aprobación del paquete deberá leer los blockers para marcar "apto/no apto para piloto" (fase posterior).

---

## K. Relación con motores y módulos sensibles

Motores read-only antes de escritura: el helper expone `allowed_engines`/`blocked_engines`. Los **módulos sensibles** (costeo/cotización entre ellos, cuando el vertical los usa) solo se habilitan si sus `required_fields` están confirmados; mientras tanto figuran en `business_module_blockers`/`quoting_blockers`. Esto hace **visible** la deuda de datos en lugar de operar sobre supuestos.

---

## L. Corrección conceptual: costeo/cotización NO son universales

`quoting_blockers` es **opcional** y solo se completa si el vertical declara un módulo pricing/costing/quotation. En verticales sin ese módulo (vehículos, agencia, educación, retail…) el campo queda `undefined` — no se asume que todo CRM necesita cotizar, costear, llevar stock o compatibilidad vehicular. Cada módulo declara sus propios campos críticos.

---

## M. Próximos pasos

1. **CONSTRUCTOR-DISCOVERY-8b** — botón "Terminé" + persistencia del snapshot confirmado (empezar en `meta.discovery_submission`, sin SQL).
2. **CONSTRUCTOR-DISCOVERY-8c** — capturar como datos tipados los campos hoy faltantes (moneda, zonas, servicios, costos, campos verticales) para reducir `pending`/`estimated`.
3. **CONSTRUCTOR-VERTICALS-1** — catálogo reusable de módulos por vertical (presets de `businessModules`).
4. **CONSTRUCTOR-RUNTIME-1** — consumo de `package_payload` derivado solo de datos `confirmed`.

---

## N. Confirmaciones de alcance

- ✅ Existe helper puro de DiscoveryContext con tipos reutilizables (incluye módulos por vertical).
- ✅ Existen fixtures/selftests (Casa Limpia/Pickup/agencia/genérico/completo/vacío) — 52/52.
- ✅ No hay hardcode de Casa Limpia ni Pickup como arquitectura base.
- ✅ No se asume país/moneda/vertical por defecto.
- ✅ Costeo/cotización NO se tratan como universales; `quoting_blockers` solo si hay módulo pricing/costing.
- ✅ Se calculan `missing_critical_fields`, `engine_blockers`, `vertical_blockers`, `business_module_blockers`, `human_review_required`.
- ✅ Build OK · Selftest OK.
- ✅ NO se modificó UI · NO se ejecutó SQL · NO se tocaron datos.
- ✅ NO se tocó `package_payload` ni `installable_package` como escritura.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
