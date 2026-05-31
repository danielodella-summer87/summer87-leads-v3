# CONSTRUCTOR-SHELL-1 — Diagnóstico y plan de separación del shell interno vs CRM operativo

> **Tipo:** Diagnóstico + diseño (PRE). Sin cambio de código funcional.
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-5-badges-sidebar-interno.md` (commit `2db22cb`).
> **Alcance:** Diagnosticar cómo se comparte el shell admin y diseñar la ruta segura para badges/runtime futuros. NO se modificó el sidebar, navegación, `client_crm`, leads, SQL, datos, `package_payload` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El shell admin (sidebar + header) lo renderiza **`AdminShell`** (`app/admin/AdminShell.tsx`, `"use client"`), montado por **`app/admin/layout.tsx`** para **todas** las rutas `/admin/*` — Constructor interno y CRM operativo `client_crm` incluidos. El layout del Constructor (`app/admin/constructor-crm/layout.tsx`) es **solo un guard** (redirige a `/403` en `client_crm`) y devuelve `children` directo: las páginas del Constructor renderizan **dentro** del `<main>` del AdminShell compartido, **no** en un shell propio.

Consecuencia: el Constructor **no puede** reemplazar ni envolver el sidebar desde su layout (el `<aside>` se dibuja un nivel más arriba). Tocar `AdminShell` para badges afecta —al menos en el código— el shell que usa `client_crm`.

**Hallazgo clave (la "costura"):** `AdminShell` ya recibe `sidebarModeFilter` (que incluye `appMode`), calculado server-side en `app/admin/layout.tsx`. Eso habilita la opción más limpia a futuro: **un slot de badges opcional pasado como prop, computado server-side SOLO en modos internos**, que en `client_crm` llega `undefined` → sin badges → sin cambio de comportamiento.

**Decisión de esta fase:** no hay un cambio de código *mínimo y de riesgo cero* que valga la pena ahora (todo toca el shell compartido o el layout `/admin`). Se recomienda **Opción C** como ruta futura, a implementar en una fase dedicada con tests de no-regresión. **Esta fase no modifica código** (mantiene Opción A: paneles internos de diagnóstico ya existentes). Selftests 65/46/31/23 OK, build EXIT 0.

---

## B. Estado Git inicial

```
Rama: * main  2db22cb [origin/main]  (sincronizada, working tree limpio)
```
`git log --oneline -3`:
```
2db22cb docs(constructor): close RUNTIME-5 sidebar badge preview
f815faf feat(constructor): add RUNTIME-4 sidebar diagnosis panel
e686d62 feat(constructor): add RUNTIME-3 sidebar visibility suggestions
```

---

## C. Diagnóstico del shell actual

| Pregunta | Respuesta (evidencia) |
|---|---|
| ¿Qué componente renderiza el sidebar real? | `app/admin/AdminShell.tsx` (`"use client"`), `<aside>` en su render; filtra con `filterAdminSidebarModulesByMode(visible, sidebarModeFilter)`. |
| ¿Qué layout lo monta? | `app/admin/layout.tsx` (server): `<AdminShell sidebarModeFilter={getSidebarModeFilterFromEnv()}>{children}</AdminShell>`. |
| ¿Qué rutas usan ese layout? | **Todas** las de `/admin/*` (Constructor interno y `client_crm`). |
| ¿Cómo se filtra hoy por APP_MODE? | `app/admin/layout.tsx` arma `sidebarModeFilter` desde `getAppModeSnapshot()`; `AdminShell` lo aplica vía `filterAdminSidebarModulesByMode` + `filterNavByRole`. En `client_crm` se ocultan categorías internas (fail-safe, SEPARATION-1). |
| ¿Constructor interno y CRM operativo comparten shell? | **Sí.** Mismo `AdminShell`. |
| ¿Existe layout específico en `constructor-crm/layout.tsx`? | Sí, pero es **solo un guard** (`if (isClientCrmMode()) redirect("/403")`); no renderiza shell ni sidebar. |
| ¿Ese layout puede envolver/reemplazar el shell sin tocar `client_crm`? | **No** para el sidebar: renderiza por debajo de `AdminShell`, solo aporta contenido dentro de `<main>`. Un sidebar propio ahí sería un segundo sidebar anidado (mala UX). |
| ¿Dónde sería seguro inyectar badges a futuro? | En `AdminShell`, vía un **prop opcional de badges** computado server-side en `app/admin/layout.tsx` **solo en modos internos** (en `client_crm` → `undefined`). |
| ¿Qué riesgo tiene tocar `AdminShell` hoy? | **Alto** sin tests de no-regresión: es el shell del CRM operativo; cualquier fetch/efecto/render nuevo corre también para `client_crm`. |

---

## D. Riesgo de tocar AdminShell

- Es un **client component compartido** con estado (rol, portal config, sidebar) y efectos (`fetch /api/auth/me`, `/api/admin/config/portal`). Agregar lógica de runtime/badges introduce un camino nuevo que también se ejecuta en `client_crm`.
- Un fetch a `/api/admin/constructor/setup` desde el shell en `client_crm` devolvería 403 (guard de modo), pero igualmente **agrega un efecto** al shell del cliente.
- Conclusión: tocar `AdminShell` exige **tests de no-regresión de `client_crm`** y debe ser su propia fase; no es un cambio de riesgo cero.

---

## E. Opciones arquitectónicas

**Opción A — Mantener `AdminShell` compartido, no tocarlo; solo paneles internos de diagnóstico.**
- Pros: riesgo cero; ya implementado (RUNTIME-2/4/5). Contras: badges no aparecen en el sidebar real.

**Opción B — Shell interno propio para `/admin/constructor-crm`.**
- Requiere reestructurar `app/admin/layout.tsx` para **no** renderizar `AdminShell` en rutas de Constructor (route groups o shell condicional). Pros: separación real. Contras: refactor del layout compartido → **riesgo alto**, gran superficie.

**Opción C — Slot de badges opcional en `AdminShell`, alimentado server-side SOLO en modos internos.**
- `app/admin/layout.tsx` computa un mapa `key→badge` solo cuando `appMode` es interno (sin fetch; o con datos ya disponibles server-side), y lo pasa como prop opcional a `AdminShell`. En `client_crm` el prop es `undefined` → sin badges → sin cambio. Pros: badges en sidebar real **sin afectar `client_crm`** (demostrable: prop ausente). Contras: toca `AdminShell` + `layout` → requiere tests de no-regresión; el dato de runtime (meta.vertical_key) hoy se lee client-side vía API (en server-side habría que leerlo de otra forma, sin acoplar `client_crm`).

**Opción D — Extraer el renderer del sidebar a un componente puro, sin cambiar comportamiento.**
- Pros: prepara terreno. Contras: refactor de un componente grande con riesgo de regresión y **sin beneficio inmediato**; no habilita badges por sí solo.

---

## F. Decisión recomendada

**Recomendada: Opción C**, a implementar en una **fase dedicada (SHELL-2)** con tests de no-regresión de `client_crm`. Es la única que habilita badges en el sidebar real **sin** afectar al cliente (el prop opcional llega `undefined` en `client_crm`), manteniendo `AdminShell` como un solo componente (evita el refactor grande de Opción B).

**Para AHORA (SHELL-1): no implementar código.** No existe un cambio mínimo de riesgo cero que supere el costo; Opción C merece su propia fase con tests. Se mantiene Opción A (paneles internos de diagnóstico ya existentes de RUNTIME-2/4/5).

---

## G. Cambios realizados, si hubo

**Ninguno de código.** Único cambio en disco: este documento. (Coherente con "Solo implementar si existe un cambio mínimo, seguro y reversible" — no lo hay sin tests dedicados.)

---

## H. Qué NO se tocó

`AdminShell.tsx`, `app/admin/layout.tsx`, `constructor-crm/layout.tsx`, `adminSidebarModules.ts`, los paneles existentes, API, SQL, datos, `client_crm`, leads, `.env.local`.

---

## I. Relación con RuntimeConfig

El runtime (`buildConstructorRuntimeConfig`) y las sugerencias (`suggestRuntimeSidebarVisibility`) ya están listos y probados. Lo único pendiente es el **canal de presentación** en el sidebar real, que Opción C resolvería pasando un mapa de badges derivado del runtime como prop a `AdminShell` (solo modos internos).

## J. Relación con el sidebar real

Sin cambios. El sidebar real sigue filtrando por `APP_MODE`/rol como antes. Los badges viven solo en el panel de diagnóstico interno (RUNTIME-5).

## K. Relación con client_crm

Sin impacto. `AdminShell` no fue tocado; `client_crm` ve exactamente lo mismo. Opción C, cuando se implemente, debe demostrar por prop `undefined` + tests que `client_crm` no cambia.

---

## L. Validaciones realizadas

- Selftests: Discovery **65/65**, Verticals **46/46**, RuntimeConfig **31/31**, SidebarVisibility **23/23**.
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.

---

## M. Riesgos pendientes

- Badges en el sidebar real siguen diferidos a SHELL-2 (Opción C).
- Opción C requiere resolver el origen server-side del `vertical_key`/runtime sin acoplar `client_crm` (hoy se lee client-side por API).
- Cualquier cambio futuro a `AdminShell` necesita tests de no-regresión de `client_crm`.

---

## N. Próximo paso recomendado

**CONSTRUCTOR-SHELL-2** — implementar Opción C: prop opcional de badges en `AdminShell`, alimentado server-side en `app/admin/layout.tsx` solo en modos internos (`undefined` en `client_crm`), con tests de no-regresión que verifiquen que el sidebar de `client_crm` no cambia. Cambio aditivo, fail-open, sin ocultar módulos.

---

## O. Confirmaciones de alcance

- ✅ Queda diagnosticado cómo se comparte el shell (AdminShell compartido por todas las rutas `/admin`).
- ✅ Queda claro que `AdminShell` no debe tocarse hoy sin tests; ruta segura futura = Opción C.
- ✅ No se rompió el sidebar · No se ocultaron módulos · No se modificó navegación real.
- ✅ No se modificó CRM operativo `client_crm` · No se modificaron leads.
- ✅ No se ejecutó SQL · No se crearon tablas · No se tocaron datos.
- ✅ No se tocó `package_payload` como escritura · No se activaron motores · No se creó CRM operativo.
- ✅ No se tocó Casa Limpia CRM ni Ecuador · No se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ No se hizo deploy · No se hizo commit · No se hizo push.
