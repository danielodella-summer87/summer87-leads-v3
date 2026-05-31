# CONSTRUCTOR-RUNTIME-3 — Cableado read-only de visibilidad del sidebar por vertical

> **Tipo:** Helper puro de visibilidad sugerida (sin tocar el sidebar real).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-2-primer-consumo-readonly-runtime.md` (commit `b1c5e7e`).
> **Alcance:** Preparar el puente runtime → navegación con un helper **puro, read-only y fail-open**. NO se modificó el sidebar real ni el CRM operativo `client_crm` de forma destructiva; no se tocaron leads, SQL, datos, `package_payload` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó `suggestRuntimeSidebarVisibility(runtime, items)`: un helper **puro** que, dado un `ConstructorRuntimeConfig` (RUNTIME-1) y una lista simplificada de ítems de sidebar, devuelve **sugerencias** de visibilidad (`keep | suggest_hide | internal_only | vertical_specific`) **sin mutar nada y sin aplicar ocultamientos**. Es deliberadamente conservador y **fail-open**: si no hay runtime o no está `ready_readonly`, todo es `keep`; nunca sugiere ocultar navegación base/seguridad/config; y `suggest_hide` solo aparece para ítems que el caller etiqueta explícitamente con un vertical distinto al confirmado.

**No se tocó `lib/admin/adminSidebarModules.ts` ni el admin shell**: esta fase solo crea la pieza pura + tests + docs, preparando el cableado real para una fase futura con criterio humano. Selftests: SidebarVisibility **23/23**, RuntimeConfig **31/31**, Verticals **46/46**, Discovery **65/65**, build EXIT 0.

---

## B. Diagnóstico del sidebar actual

(De SEPARATION-1, sin cambios) `lib/admin/adminSidebarModules.ts`:
- Define `DEFAULT_ADMIN_SIDEBAR_MODULES` y los filtra con `filterAdminSidebarModulesByMode(modules, filter)` por `APP_MODE`.
- Infiere `menuCategory` por key/href: `internal_constructor`, `internal_installer`, `internal_bcr`, `system_danger`; en `client_crm` esos quedan ocultos (fail-safe).
- Distingue **internos** (Constructor/instalador/BCR/danger) vs **operativos** (leads, clientes, agenda, reportes, etc.).
- Módulos que deben ser universales: navegación base/operativa (dashboard, leads, clientes, agenda, reportes, configuración…). Módulos que podrían depender del vertical: los `business_modules` del vertical confirmado.
- **Riesgo de ocultar demasiado pronto:** romper navegación operativa o esconder configuración/seguridad. Por eso esta fase **no oculta**, solo sugiere.
- **Dónde insertar sin cambiar comportamiento:** una capa que tome la salida del sidebar + el runtime y produzca sugerencias, aplicada recién en una fase futura. El helper de esta fase es esa capa, aún desconectada del render.

---

## C. Archivos creados/modificados

**Creados:**
- `lib/constructor/runtime/runtimeSidebarVisibility.ts` — helper puro + tipos.
- `lib/constructor/runtime/runtimeSidebarVisibility.selftest.ts` — selftest (9 grupos, 23 checks).
- `docs/constructor-crm/CONSTRUCTOR-RUNTIME-3-sidebar-readonly-por-vertical.md` — este documento.

**Modificados:**
- `lib/constructor/runtime/index.ts` — reexporta el helper y sus tipos.

**No modificados:** `adminSidebarModules.ts`, `app/admin/layout.tsx`, admin shell, API, SQL, datos, `tsconfig.json`.

---

## D. Helper creado

`suggestRuntimeSidebarVisibility(runtime, items) → SidebarVisibilityResult[]` y conveniencia `getSuggestedHiddenKeys(runtime, items) → string[]`. Tipos: `SidebarItemLite` (`key`, `href?`, `category?`, `vertical?`, `protected?`), `SidebarVisibilitySuggestion`, `SidebarVisibilityResult`. Puro: sin DB/red/fs/env/React, no muta input, determinístico, autocontenido (`import type` de RuntimeConfig).

---

## E. Reglas fail-open

1. `runtime` ausente o `status !== "ready_readonly"` → **todos `keep`** (razón `runtime_not_ready`).
2. Ítems `protected` o en la lista base/crítica (dashboard, leads, clientes, configuración, seguridad, auth, …) → **siempre `keep`**.
3. Categorías internas (`internal_*`/`system_*`) o keys con "constructor"/"installer" → `internal_only` (informativo, no operativo).
4. Por defecto → `keep`. Nunca se oculta sin señal explícita.

---

## F. Reglas por vertical

- **generic:** no oculta nada por defecto.
- **cleaning_services / pickup_4x4 / marketing_agency / education:** los ítems que el caller marca como `vertical`-scoped y **coinciden** con el vertical confirmado → `vertical_specific`; los que pertenecen a **otro** vertical → `suggest_hide`. Si un ítem coincide con un módulo del vertical confirmado (`runtime.modules`) → `vertical_specific`.
- **Costeo/cotización NO es universal:** solo se trata como módulo del vertical (p. ej. `cleaning_services`); en pickup/marketing/education/generic no se fuerza nada de quoting. Validado en los selftests (ningún `suggest_hide` sobre base operativa en esos verticales).
- Si no hay match seguro → `keep`.

---

## G. Qué NO hace

- No modifica el sidebar real ni el render; no aplica ocultamientos.
- No toca `client_crm` operativo, leads, `package_payload`, motores ni CRM operativo.
- No accede a DB/red/fs/env; no ejecuta SQL.

---

## H. Relación con RuntimeConfig

Consume `ConstructorRuntimeConfig` (RUNTIME-1): usa `status` (gate `ready_readonly`), `vertical_key` y `modules`. Si el runtime no está listo, no sugiere nada (fail-open).

## I. Relación con DiscoveryContext

Indirecta: el runtime deriva del snapshot confirmado (8b). El helper no lee el DiscoveryContext crudo; solo el runtime ya consolidado.

## J. Relación con package_payload

Ninguna: no lo lee ni escribe.

## K. Relación con motores

Ninguna: no activa motores; es presentacional/sugerencia.

---

## L. Validaciones realizadas

- `suggestRuntimeSidebarVisibility.selftest` → **23/23**: A unavailable→keep, B blocked→keep, C generic ready→sin hide (internal_only para interno, keep para base/desconocido), D cleaning (fail-open cuando no-ready), E pickup (sin quoting universal; otro-vertical→suggest_hide si ready), F marketing (base keep, sin hide), G desconocido→keep, H no-mutación, I generic ready + vertical-scoped → `vertical_specific` (match) vs `suggest_hide` (mismatch) y protegido→keep.
- Sin regresión: RuntimeConfig **31/31**, VerticalCatalog **46/46**, DiscoveryContext **65/65**.
- `npm run build` → **EXIT 0**.
- `git diff --check` → limpio.

---

## M. Riesgos pendientes

- El helper aún **no está conectado** al render del sidebar (intencional, esta fase prepara el puente).
- `suggest_hide` depende de que el caller etiquete ítems con su vertical; sin esa metadata, no se oculta nada (conservador).
- La lista `PROTECTED_BASE_KEYS` es estática; al agregar módulos base nuevos, mantenerla.

---

## N. Próximos pasos

1. **CONSTRUCTOR-RUNTIME-4** — conectar (aún opt-in y fail-open) las sugerencias al sidebar en Constructor interno, mostrando badges/diagnóstico, sin ocultar de forma efectiva sin validación humana.
2. Más adelante: aplicar visibilidad efectiva en `client_crm` con criterio, y re-sourcing de campos de lead.

---

## O. Confirmaciones de alcance

- ✅ Existe helper puro de visibilidad read-only por runtime/vertical; no rompe el sidebar actual.
- ✅ Fail-open: sin runtime o no-ready → no oculta nada; `blocked`/`review_required` → no oculta.
- ✅ generic no oculta por defecto; pickup/marketing/education no asumen cotización/costeo universal; cleaning lo trata como módulo del vertical.
- ✅ Selftests OK · Build OK.
- ✅ NO se modificó CRM operativo `client_crm` de forma destructiva · NO se modificaron leads.
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
