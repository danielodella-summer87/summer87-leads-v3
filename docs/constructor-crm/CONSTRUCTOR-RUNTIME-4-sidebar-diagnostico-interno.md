# CONSTRUCTOR-RUNTIME-4 — Diagnóstico interno de navegación por vertical (runtime → sidebar)

> **Tipo:** Consumo diagnóstico (panel informativo interno; sin alterar el sidebar real).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-3-sidebar-readonly-por-vertical.md` (commit `e686d62`).
> **Alcance:** Conectar las **sugerencias** del runtime (RUNTIME-3) a un **panel de diagnóstico** en el Constructor interno. NO se modificó el comportamiento real del sidebar, no se ocultaron módulos, no se tocó `client_crm`, leads, SQL, datos, `package_payload` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó `RuntimeSidebarDiagnosisPanel`: un panel **read-only/diagnóstico** montado en `app/admin/constructor-crm/page.tsx` (Constructor interno, protegido por el layout guard de SEPARATION-1). Hace **solo GET** a `/api/admin/constructor/setup`, construye el `ConstructorRuntimeConfig` (RUNTIME-1) y evalúa una lista representativa de ítems de navegación con `suggestRuntimeSidebarVisibility` (RUNTIME-3), mostrando por ítem su sugerencia (`keep | vertical_specific | internal_only | suggest_hide`) con la aclaración visible **"Diagnóstico interno: no oculta módulos todavía"**.

**No se tocó el sidebar real** (`adminSidebarModules.ts`/`layout.tsx` intactos) ni `client_crm`. Es **fail-open**: sin runtime listo, todo queda en `keep`. Selftests: Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**, build EXIT 0.

---

## B. Archivos modificados

**Creados:**
- `components/constructor/RuntimeSidebarDiagnosisPanel.tsx` — panel client read-only.
- `docs/constructor-crm/CONSTRUCTOR-RUNTIME-4-sidebar-diagnostico-interno.md` — este documento.

**Modificados:**
- `app/admin/constructor-crm/page.tsx` — import + `<RuntimeSidebarDiagnosisPanel />` debajo del panel de RUNTIME-2 (2 líneas).

**No modificados:** `lib/admin/adminSidebarModules.ts`, `app/admin/layout.tsx`, helpers de runtime/discovery/verticals, API, SQL, `tsconfig.json`.

---

## C. Panel creado

`RuntimeSidebarDiagnosisPanel` (client): GET setup → lee `meta.discovery_submission` + `meta.vertical_key` → `buildConstructorRuntimeConfig` → `suggestRuntimeSidebarVisibility(runtime, DIAGNOSIS_ITEMS)` → muestra el resultado por ítem con badge de sugerencia y razón. `404` se trata como "sin snapshot" (fail-open).

`DIAGNOSIS_ITEMS` es una **lista representativa** (mirror read-only) de las keys reales del sidebar (`dashboard_comercial`, `leads87`, `entidades`, `socios`, `agenda`, `reportes`, `ia`, `mesa_ayuda`, `neuroventas`, `personalizacion`, `configuracion`, `constructor_manual_cliente`) + 3 ejemplos vertical-scoped para ilustrar el scoping. **No** se importa la config real del sidebar (evita acoplar/arriesgar la navegación).

---

## D. Punto de montaje

`app/admin/constructor-crm/page.tsx`, debajo de `ConstructorRuntimeStatusPanel` (RUNTIME-2). Constructor interno; nunca en `client_crm` (el layout guard ya bloquea ese modo).

---

## E. Reglas fail-open

Heredadas del helper (RUNTIME-3): si `runtime.status !== "ready_readonly"` → todos `keep`; navegación base/seguridad/config siempre `keep`; internos → `internal_only`; `suggest_hide` solo para ítems vertical-scoped de otro vertical. El panel **no aplica** ninguna de estas sugerencias: solo las muestra.

---

## F. Qué muestra

- Estado runtime + vertical (label/key).
- Indicador "Sugerencias activas (solo diagnóstico)" vs "Fail-open: todo se mantiene".
- Lista por ítem: key, razón, y badge de sugerencia (`Mantener`/`Del vertical`/`Interno`/`Sugerir ocultar`).
- Aclaración de que es representativo y no altera el filtrado real ni `client_crm`.

---

## G. Qué NO hace

- No oculta módulos reales; no modifica el filtrado del sidebar; no toca `adminSidebarModules.ts`/`layout.tsx`.
- No hace PATCH ni escribe datos; no toca `client_crm`, leads, `package_payload`, motores ni CRM operativo; no ejecuta SQL.

---

## H. Relación con RuntimeConfig

Construye el `ConstructorRuntimeConfig` con `buildConstructorRuntimeConfig` (RUNTIME-1) desde el snapshot + `vertical_key` confirmados; el gate `ready_readonly` decide si las sugerencias se activan.

## I. Relación con runtimeSidebarVisibility

Usa `suggestRuntimeSidebarVisibility` (RUNTIME-3) tal cual; el panel solo presenta sus resultados.

## J. Relación con el sidebar real

Ninguna funcional: el sidebar real sigue filtrando por `APP_MODE` como antes. El panel es un mirror diagnóstico independiente. Conectar las sugerencias al render real es una fase futura con criterio humano.

## K. Relación con client_crm

Ninguna: el panel vive en el Constructor interno (bloqueado en `client_crm` por el layout guard). No cambia la experiencia del cliente.

---

## L. Validaciones realizadas

- Selftests: Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**.
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.
- `git diff --stat` confirma `adminSidebarModules.ts` y `layout.tsx` **sin cambios**.
- Seguridad por inspección: el panel solo usa GET; no hay `method: "PATCH"` ni escrituras ni activaciones.

---

## M. Riesgos pendientes

- `DIAGNOSIS_ITEMS` es un mirror estático; si cambian los módulos reales del sidebar, mantenerlo (o, en una mejora, derivarlo del catálogo real read-only).
- El diagnóstico no refleja el filtrado real por `APP_MODE`/rol (es solo la capa runtime/vertical).
- El panel lee datos persistidos (no ediciones sin guardar).

---

## N. Próximos pasos

1. **CONSTRUCTOR-RUNTIME-5** — (opt-in, fail-open) badges en el sidebar real del Constructor interno mostrando la sugerencia, sin ocultar; o derivar `DIAGNOSIS_ITEMS` del catálogo real read-only.
2. Más adelante: aplicar visibilidad efectiva con criterio humano y re-sourcing de campos de lead.

---

## O. Confirmaciones de alcance

- ✅ Existe diagnóstico visual interno del sidebar por runtime/vertical.
- ✅ No se modifica el comportamiento real del sidebar; no se ocultan módulos.
- ✅ Sin runtime confirmado → estado seguro/fail-open; `blocked`/`review_required` → no oculta nada.
- ✅ NO se modificó el comportamiento real del sidebar · NO se ocultaron módulos.
- ✅ NO se modificó CRM operativo `client_crm` · NO se modificaron leads.
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
