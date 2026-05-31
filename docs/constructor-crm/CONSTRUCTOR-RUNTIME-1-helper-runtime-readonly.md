# CONSTRUCTOR-RUNTIME-1 — Helper runtime read-only desde la configuración del Constructor

> **Tipo:** Implementación de código puro + tests (sin UI, sin SQL, sin APIs).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-1-PRE-primer-consumo-runtime.md` (commit `15dbaea`).
> **Alcance:** Primera capa intermedia **read-only** del puente Constructor → CRM operativo. NO se modificó UI, no se ejecutó SQL, no se crearon tablas, no se tocaron datos, `package_payload`/`installable_package` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó `buildConstructorRuntimeConfig(input)`: un helper **puro y read-only** que consolida la configuración que el CRM operativo *puede empezar a consumir*, derivada del cierre confirmado del Discovery (snapshot 8b) + `vertical_key` confirmado (8d). Devuelve un `ConstructorRuntimeConfig` con: estado runtime, vertical (key/label/en-catálogo), estado y completitud del Discovery, módulos del vertical (habilitados/bloqueados), todos los blockers (incluido `quoting_blockers` solo si aplica), y **flags de seguridad** que en esta fase quedan **todas en `false`** (`can_generate_package_payload`, `can_activate_engines`, `can_create_operational_crm`).

Respeta la corrección conceptual: `quoting_blockers` solo aparece si el vertical declara módulo pricing (p. ej. `cleaning_services`); `pickup_4x4`, `marketing_agency`, `education` y `generic` no lo generan. Fallback seguro: sin snapshot → `unavailable`; vertical fuera de catálogo → fallback + blocker explícito. Selftests: Runtime **31/31**, DiscoveryContext **65/65**, VerticalCatalog **46/46**, build EXIT 0.

---

## B. Archivos creados/modificados

**Creados:**
- `lib/constructor/runtime/constructorRuntimeConfig.ts` — tipos + helper puro read-only.
- `lib/constructor/runtime/constructorRuntimeConfig.selftest.ts` — selftest (7 grupos, 31 checks).
- `lib/constructor/runtime/index.ts` — reexporta helper y tipos.
- `docs/constructor-crm/CONSTRUCTOR-RUNTIME-1-helper-runtime-readonly.md` — este documento.

**No modificados:** discovery, verticals, crmPackage, API, UI, SQL, `tsconfig.json` (la exclusión `**/*.selftest.ts` ya cubre el nuevo selftest).

---

## C. Qué hace el helper

Toma la `DiscoverySubmission` (snapshot persistido en `meta.discovery_submission`) y el `vertical_key` confirmado (`meta.vertical_key`), y consolida:
- Estado runtime (`unavailable | draft | blocked | review_required | ready_readonly`).
- Vertical: key, label, si está en catálogo.
- Discovery: status y completitud, `human_review_required`.
- Módulos: lista (key/label/category/required/enabled/blocker_keys), `enabled_modules`, `blocked_modules` — leídos del `discovery_context.business_modules` ya evaluado en el snapshot.
- Blockers: `missing_critical_fields`, `engine_blockers`, `vertical_blockers`, `business_module_blockers`, `quoting_blockers?`, y un `blockers` consolidado namespaced.
- Compuertas de seguridad (todas `false` esta fase).

---

## D. Qué NO hace

- No escribe nada; no toca `package_payload` ni `installable_package`.
- No activa motores; no crea CRM operativo.
- No accede a DB/red/fs/env; no depende de React; no muta el input; determinístico.
- No asume país/moneda/vertical/costeo; no asume Casa Limpia ni Pickup.

---

## E. Inputs esperados

```ts
type BuildConstructorRuntimeConfigInput = {
  discoverySubmission?: DiscoverySubmission | null; // meta.discovery_submission (8b)
  verticalKey?: string | null;                      // meta.vertical_key confirmado (8d)
  generatedAt?: string | null;                      // timestamp del caller (pureza)
};
```

El caller (futuro consumidor) lee `crm_setup_config.meta` y pasa estos valores. El helper no hace I/O.

---

## F. Output runtime

`ConstructorRuntimeConfig` (ver §B del PRE): `schema_version`, `status`, `vertical_key`, `vertical_label`, `vertical_in_catalog`, `discovery_status`, `discovery_completion_percent`, `human_review_required`, `modules`, `enabled_modules`, `blocked_modules`, `blockers`, los 4 arrays de blockers, `quoting_blockers?`, las 4 flags (`can_*`), `source`, `generated_at`.

---

## G. Estados runtime

| Estado | Cuándo |
|---|---|
| `unavailable` | No hay `discoverySubmission`. |
| `draft` | Discovery en `draft`. |
| `blocked` | Hay blockers duros (críticos/engine/vertical/módulos/quoting). |
| `review_required` | `human_review_required`, o Discovery `in_review`/`needs_rework`, o vertical fuera de catálogo. |
| `ready_readonly` | Discovery `confirmed`, sin blockers, vertical en catálogo. |

---

## H. Reglas de seguridad

- `can_use_readonly_runtime`: `true` si el snapshot es usable (`ready_readonly`, `review_required` o `blocked`); `false` en `unavailable`/`draft`.
- `can_generate_package_payload`, `can_activate_engines`, `can_create_operational_crm`: **`false` siempre en esta fase** (hardcoded).
- Solo se exponen módulos `enabled` como utilizables; los `!enabled` quedan en `blocked_modules`. Nunca se promueve dato `pending`/`estimated` (el snapshot ya los excluyó de `confirmed`).
- `quoting_blockers` se propaga solo si venía definido en el snapshot (vertical con pricing).

---

## I. Relación con DiscoveryContext

El runtime consume **solo el snapshot confirmado** (8b), que a su vez deriva del DiscoveryContext (8a). No re-deriva ni reinterpreta datos crudos; reusa `status`, `completion_percent`, blockers, `human_review_required` y `discovery_context.business_modules`.

## J. Relación con verticales

`vertical_key` (8d) determina el vertical; los módulos provienen del `discovery_context.business_modules` que el catálogo (VERTICALS-1) inyectó durante el cierre (8c). El helper valida la key contra los verticales conocidos y aplica fallback + blocker si no existe.

## K. Relación con package_payload

Ninguna. El helper no lee ni escribe `package_payload`; `can_generate_package_payload` es `false`. La generación del paquete es una fase posterior que usará estos blockers como gate.

## L. Relación con motores

El helper informa qué módulos/datos están listos pero **no activa motores**: `can_activate_engines` es `false`. Coherente con "motores read-only antes de escritura".

## M. Selftests

`node --experimental-strip-types lib/constructor/runtime/constructorRuntimeConfig.selftest.ts` → **31/31**:
- A) sin snapshot → `unavailable`, read-only false, compuertas off.
- B) generic confirmado → `ready_readonly`, sin quoting, compuertas off.
- C) cleaning_services → `blocked`/`review_required`, `quoting_blockers` presente, no habilita package/motores/CRM.
- D) pickup_4x4 → sin quoting, módulos pickup presentes, no activa motores.
- E) marketing_agency → sin quoting, módulos marketing presentes.
- F) vertical desconocido → fallback + `vertical_not_in_catalog`, no `ready_readonly`.
- G) no mutación + determinismo + `generated_at`.

Sin regresión: DiscoveryContext **65/65**, VerticalCatalog **46/46**.

---

## N. Riesgos pendientes

- El helper aún **no se consume** en UI/API (es la capa pura); su cableado al sidebar/operativo es la fase siguiente.
- Las labels de vertical son un espejo estable del catálogo (5 entradas); si se agregan verticales, mantener sincronía (o, en una mejora, derivar del catálogo vía un import de solo-datos).
- El `discovery_context` embebido puede crecer; el runtime solo lee campos puntuales (no lo re-serializa).
- Selftest fuera del type-check del app (exclusión `*.selftest.ts`, intencional).

---

## O. Próximos pasos

1. **CONSTRUCTOR-RUNTIME-2** — cablear el helper al sidebar del CRM operativo por vertical confirmado (read-only, fail-open), leyendo `meta` server-side; sin tocar leads/contract-fields.
2. Más adelante: re-sourcing de campos de lead desde el Constructor (con fallback neutro).

---

## P. Confirmaciones de alcance

- ✅ Existe helper runtime read-only con tipos reutilizables y selftests.
- ✅ Usa `discovery_submission` + `vertical_key` confirmado; respeta módulos por vertical.
- ✅ No asume costeo/cotización universal; `cleaning_services` puede mostrar `quoting_blockers`; pickup/marketing/generic no.
- ✅ `can_generate_package_payload`/`can_activate_engines`/`can_create_operational_crm` = **false** en esta fase.
- ✅ Build OK · Selftests OK.
- ✅ NO se modificó UI · NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
