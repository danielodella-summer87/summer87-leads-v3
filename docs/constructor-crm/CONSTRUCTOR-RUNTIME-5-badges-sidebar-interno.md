# CONSTRUCTOR-RUNTIME-5 — Badges de runtime en el sidebar interno (Opción B: vista previa, sin tocar el sidebar real)

> **Tipo:** Vista previa de badges en panel de diagnóstico (sin modificar el sidebar real).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-4-sidebar-diagnostico-interno.md` (commit `f815faf`).
> **Alcance:** Mostrar cómo se verían los badges de runtime en el sidebar, **sin tocar el sidebar real** ni `client_crm`. No se ocultaron módulos, no se modificó navegación; no se tocó leads, SQL, datos, `package_payload` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se evaluó si era seguro agregar badges al **sidebar real** y se concluyó que **no** (Opción B). Motivo: el sidebar real lo renderiza `AdminShell`, un **componente compartido** que `app/admin/layout.tsx` usa para **todas** las rutas admin, incluido el CRM operativo `client_crm`. Tocarlo —aun con gating— modifica el shell que usa el cliente, lo que viola el alcance ("Si tocar el sidebar real implica riesgo alto, NO tocarlo").

Por eso se mejoró el panel de diagnóstico interno (`RuntimeSidebarDiagnosisPanel`) para que **aproxime visualmente el sidebar** con una **vista previa estilo columna oscura** y badges por módulo (`Mantener`/`Del vertical`/`Interno`/`Revisar`), más un detalle expandible con la razón por ítem. Es **fail-open**: si el runtime no está `ready_readonly`, no se muestran badges ("sin badge"). El sidebar real (`adminSidebarModules.ts`, `layout.tsx`, `AdminShell.tsx`) quedó **intacto** (verificado con `git diff --stat`). Selftests: 65/46/31/23 OK, build EXIT 0.

---

## B. Diagnóstico del sidebar real

- El sidebar se renderiza en `AdminShell.tsx`, montado por `app/admin/layout.tsx` para **todo** `/admin/*` (Constructor interno y CRM operativo `client_crm`).
- El filtrado por `APP_MODE`/rol vive en `lib/admin/adminSidebarModules.ts` (`filterAdminSidebarModulesByMode`) y en `AdminShell` (`filterNavByRole`).
- **No existe un shell separado** para el Constructor interno: comparte `AdminShell` con `client_crm`.
- ¿Lugar seguro para badges en el shell real? Existiría técnicamente (pasar runtime al shell y renderizar badges solo cuando no es `client_crm`), pero implica **agregar fetch + lógica al shell compartido** que también usa el cliente → riesgo alto y fuera de alcance.

---

## C. Decisión tomada: **Opción B**

No se toca el sidebar real. Se mejora el panel de diagnóstico para aproximarlo visualmente con badges. Los badges en el sidebar real quedan **diferidos** hasta separar el shell interno del operativo (o introducir un slot de badges sin fetch en el shell, en una fase dedicada).

---

## D. Archivos modificados

**Modificados:**
- `components/constructor/RuntimeSidebarDiagnosisPanel.tsx` — vista previa estilo sidebar con badges + detalle expandible; relabel `suggest_hide → "Revisar"`.

**Creados:**
- `docs/constructor-crm/CONSTRUCTOR-RUNTIME-5-badges-sidebar-interno.md` — este documento.

**Intactos (verificado):** `lib/admin/adminSidebarModules.ts`, `app/admin/layout.tsx`, `app/admin/AdminShell.tsx`, helpers de runtime/discovery/verticals, API, SQL.

---

## E. Qué se implementó

- Una **vista previa estilo sidebar** (columna oscura `#0b1220`, como el sidebar real) que lista los ítems representativos con su badge de sugerencia cuando el runtime está `ready_readonly`; si no, muestra "sin badge".
- Vocabulario de badges: `Mantener` (keep), `Del vertical` (vertical_specific), `Interno` (internal_only), `Revisar` (suggest_hide — etiqueta no ejecutiva).
- Chips de cabecera "Estado runtime" + "Vertical" (ya presentes de RUNTIME-4) y un `<details>` con la razón por ítem para trazabilidad.
- Aclaración visible de que es un **mockup**, que no refleja ni altera el filtrado real y que `client_crm` no se ve afectado.

---

## F. Reglas fail-open

- Sin runtime / `404` → fail-open (panel muestra estado; sin badges).
- `runtime.status !== "ready_readonly"` (draft/blocked/review_required) → "sin badge" por ítem.
- `ready_readonly` → badges informativos solamente.
- Error de carga → mensaje de error, sin badges, sin afectar nada.
- `client_crm` → este panel no se monta ahí (vive en el Constructor interno, bloqueado por el layout guard).

---

## G. Qué NO hace

- No oculta módulos; no modifica navegación, orden ni filtros.
- No toca el sidebar real (`AdminShell`/`adminSidebarModules`/`layout`).
- No hace PATCH ni escribe; no toca `client_crm`, leads, `package_payload`, motores ni CRM operativo; no ejecuta SQL.

---

## H. Relación con RuntimeConfig

Construye `ConstructorRuntimeConfig` con `buildConstructorRuntimeConfig` (RUNTIME-1) desde el snapshot + `vertical_key`; el gate `ready_readonly` decide si se muestran badges.

## I. Relación con runtimeSidebarVisibility

Usa `suggestRuntimeSidebarVisibility` (RUNTIME-3) para obtener la sugerencia por ítem; el panel solo la presenta como badge.

## J. Relación con el sidebar real

Ninguna funcional: el sidebar real sigue igual. El panel es un mockup independiente. Conectar badges al shell real requiere una fase que separe el shell interno del operativo.

## K. Relación con client_crm

Ninguna: el panel vive en `/admin/constructor-crm` (bloqueado en `client_crm` por el layout guard). El shell compartido no fue modificado, así que el cliente no ve cambios.

---

## L. Validaciones realizadas

- Selftests: Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**.
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.
- `git diff --stat` confirma `adminSidebarModules.ts`, `layout.tsx` y `AdminShell.tsx` **sin cambios**.

---

## M. Riesgos pendientes

- Badges en el sidebar real siguen diferidos; requieren separar shell interno vs operativo o un slot de badges sin fetch.
- La lista del mockup es representativa (mirror estático); mantener si cambian los módulos reales.
- El panel lee datos persistidos (no ediciones sin guardar).

---

## N. Próximos pasos

1. **CONSTRUCTOR-SHELL-1** (opcional) — separar un shell interno del Constructor del shell operativo, para poder agregar badges al sidebar real sin tocar `client_crm`.
2. Alternativa: introducir en `AdminShell` un slot de badges opcional, alimentado server-side solo en modos internos (sin fetch en `client_crm`), con tests de no-regresión.

---

## O. Confirmaciones de alcance

- ✅ Decisión Opción B documentada (no se toca el sidebar real por ser shell compartido con `client_crm`).
- ✅ No se ocultaron módulos · No se modificó navegación real.
- ✅ No se modificó CRM operativo `client_crm` · No se modificaron leads.
- ✅ No se ejecutó SQL · No se crearon tablas · No se tocaron datos.
- ✅ No se tocó `package_payload` como escritura · No se activaron motores · No se creó CRM operativo.
- ✅ No se tocó Casa Limpia CRM ni Ecuador · No se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ No se hizo deploy · No se hizo commit · No se hizo push.
