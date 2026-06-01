# CONSTRUCTOR-OPERATIONS-2 — Manual operativo visible como opción del dashboard del Constructor

> **Tipo:** UI mínima (ruta interna + card en dashboard) + documentación.
> **Fecha:** 2026-06-01.
> **Predecesor:** `CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md`.
> **Último commit confirmado:** `292b6b3` (SETUP-USER-5).
> **Alcance:** Hacer accesible el manual operativo desde la UI del Constructor interno.
> NO se tocó el sidebar real, `app/admin/layout.tsx`, `AdminShell.tsx`,
> `adminSidebarModules.ts`, `client_crm`, leads, SQL, datos, `package_payload`,
> motores ni `.env.local`. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El manual operativo del Constructor CRM (OPERATIONS-1) ahora es **consultable desde la
UI interna**: se creó la ruta **`/admin/constructor-crm/manual-operativo`** (versión
estructurada en React del manual) y se agregó una **card "Manual operativo"** con CTA
"Abrir manual" en el dashboard del Constructor (`/admin/constructor-crm`).

La ruta queda **dentro del Constructor interno** y hereda el guard de
`app/admin/constructor-crm/layout.tsx`, por lo que en `APP_MODE = client_crm` redirige a
`/403` (no se ve en el CRM operativo del cliente). No se tocó el sidebar real ni el shell.

Se eligió la **Opción A** (página React con contenido estructurado) en vez de leer
Markdown del filesystem en runtime, por compatibilidad/seguridad con Next/Vercel. La
pantalla referencia el archivo completo del repo para la versión exhaustiva.

---

## B. Estado inicial

```
Rama: * main  292b6b3 [origin/main]
Working tree (untracked):
  docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md
```
`git log --oneline -5`:
```
292b6b3 feat(constructor): add SETUP-USER-5 setup pin change flow
23b52b8 fix(constructor): enforce SETUP-USER-4 internal login safety
d7055ee docs(constructor): add SETUP-USER-3 setup user deactivation runbook
caded31 feat(constructor): add SETUP-USER-2 manual setup user bootstrap
a8c7e7a docs(constructor): add SHELL-1 and SETUP-USER-1 planning docs
```

> Nota: la ejecución previa se cortó por error de socket **antes** de crear archivos.
> Diagnóstico post-corte: no existía la ruta `manual-operativo`, no existía este doc, y
> "Manual operativo" no aparecía en la UI. Se implementó desde cero.

---

## C. Diagnóstico

- **OPERATIONS-1 existe** y está **untracked** (sin commitear), como se esperaba.
- **`app/admin/constructor-crm/page.tsx`** es un **server component** que usa
  `PageContainer`, `Link` (next/link) e íconos de `lucide-react`. Renderiza aviso de
  estado, card principal, grilla de pasos, enlace a borradores de paquete, CTA y los
  paneles `ConstructorRuntimeStatusPanel` (RUNTIME-2) y `RuntimeSidebarDiagnosisPanel`
  (RUNTIME-4). Agregar una card aquí es seguro y aditivo.
- **No hay un componente Card genérico reutilizable** en esta página: las "cards" son
  `div`/`Link` con clases Tailwind. Se siguió ese patrón (sin crear componentes nuevos).
- **Layout protector:** `app/admin/constructor-crm/layout.tsx` ya hace
  `if (isClientCrmMode()) redirect("/403")`. Toda ruta hija (incluida `manual-operativo`)
  queda protegida sin tocar nada más.
- **Forma más segura de mostrar el manual:** página React con contenido estructurado
  (Opción A), sin lectura de filesystem en runtime, sin tocar sidebar/shell/`client_crm`.

---

## D. Archivos creados/modificados

**Creados (2):**

| Archivo | Rol |
|---|---|
| `app/admin/constructor-crm/manual-operativo/page.tsx` | Ruta interna con el manual estructurado (server component, read-only). |
| `docs/constructor-crm/CONSTRUCTOR-OPERATIONS-2-manual-visible-dashboard.md` | Este documento. |

**Modificados (1):**

| Archivo | Cambio |
|---|---|
| `app/admin/constructor-crm/page.tsx` | + import `BookOpen`; + card "Manual operativo" con CTA "Abrir manual" antes del CTA principal. |

**No modificados (solo lectura):** `app/admin/layout.tsx`, `app/admin/AdminShell.tsx`,
`lib/admin/adminSidebarModules.ts`, `app/admin/constructor-crm/layout.tsx`, paneles
runtime, `lib/config/appMode.ts`.

---

## E. Ruta creada

`/admin/constructor-crm/manual-operativo` → `app/admin/constructor-crm/manual-operativo/page.tsx`.

- Server component; sin estado, sin fetch, sin escritura. Solo presenta contenido.
- Protegida por el layout del Constructor (403 en `client_crm`).

---

## F. Opción agregada al dashboard

En `/admin/constructor-crm`, card aditiva (no rompe el layout existente):
- **Título:** "Manual operativo".
- **Descripción:** "Guía paso a paso para crear, preparar y activar un CRM cliente desde el Constructor."
- **CTA:** "Abrir manual" → `href="/admin/constructor-crm/manual-operativo"`.
- Ubicación: dentro de la card principal, entre el enlace de borradores de paquete y el CTA "Comenzar con Empresa".

---

## G. Qué muestra el manual

- **Título:** "Manual operativo del Constructor CRM".
- **Subtítulo:** "Desde la venta de un nuevo CRM hasta la activación en cliente".
- **Advertencia interna:** "Este manual es interno. No ejecuta SQL, no activa motores y no crea CRM operativo."
- **Flujo general** (10 pasos): venta → clonar → entorno → usuario setup → Discovery → vertical → Terminé → runtime → QA → activación.
- **Usuario setup:** tabla con `username: setup`, `PIN inicial: 1234`, rol setup; aviso rojo de que el PIN debe cambiarse antes de exposición (vía `/api/proto/change-pin`, sin sesión) y que el usuario es temporal.
- **Comandos base** (bloque Terminal): `cd /Users/danielodella/PROYECTOS`, `cp -R summer87-leads-v3 nombre-del-nuevo-crm`, `cd …/nombre-del-nuevo-crm`, `git status --short`, `npm install`, `npm run build`, `npm run dev`.
- **Advertencia SQL manual:** "Todo SQL debe revisarse y ejecutarse manualmente. Nunca asumir que Claude lo ejecutó."
- **Semáforo:** VERDE / AMARILLO / ROJO con criterios.
- **Checklist final** antes de entregar al cliente.
- **Referencia** al archivo completo: `docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md` + botón "Volver al Constructor".

---

## H. Qué NO hace

- No ejecuta SQL, no activa motores, no escribe datos, no crea CRM operativo.
- No lee Markdown del filesystem en runtime (contenido estructurado en React).
- No toca el sidebar real, ni `AdminShell`, ni `app/admin/layout.tsx`, ni `adminSidebarModules.ts`.
- No toca `client_crm`, leads, `package_payload`, ni `.env.local`.
- No agrega entradas al menú lateral (solo card en el dashboard del Constructor).

---

## I. Relación con APP_MODE

La ruta vive bajo `/admin/constructor-crm/*`, cuyo `layout.tsx` redirige a `/403` cuando
`isClientCrmMode()` (APP_MODE `client_crm`). En modos internos (`constructor_base`,
`installation_prep`) es accesible; en el CRM operativo del cliente, no. No se modificó
`lib/config/appMode.ts`.

---

## J. Relación con sidebar real

Ninguna. No se tocó `adminSidebarModules.ts` ni `AdminShell.tsx`; el filtrado del
sidebar por APP_MODE/rol sigue igual. El acceso al manual es por una **card en el
contenido** del dashboard, no por el menú lateral (eso sería SHELL-2, fuera de alcance).

---

## K. Relación con client_crm

Ninguna funcional: la ruta y la card viven en el Constructor interno, bloqueado en
`client_crm` por el layout guard. El cliente no ve el manual ni la card.

---

## L. Validaciones realizadas

- `npm run build` → **EXIT 0** (ver reporte; ruta `/admin/constructor-crm/manual-operativo` registrada).
- `git diff --check` → limpio.
- `git status --short` → solo archivos nuevos/modificados de esta fase + OPERATIONS-1 untracked.
- Inspección: la nueva página solo presenta contenido (sin fetch/PATCH/SQL); la card es un `Link` aditivo.

---

## M. Riesgos/pendientes

- La pantalla es una **versión estructurada** (no el Markdown completo); puede
  desincronizarse del manual OPERATIONS-1 si este cambia. Mitigación: referenciar el
  archivo fuente (hecho) y mantener ambos en la misma fase de cambios.
- El acceso es por card en el dashboard, **no** por el sidebar real (decisión de
  alcance; el sidebar real se aborda en SHELL-2).
- Renderizar el Markdown completo en UI (con `react-markdown`, ya presente en deps)
  sería una mejora futura si se quiere paridad total sin duplicar contenido.

---

## N. Próximos pasos

1. (Opcional) Renderizar el `.md` completo en la ruta con `react-markdown` (importación
   estática) para evitar duplicación de contenido.
2. **SHELL-2** — si se quiere el manual como ítem del sidebar real (Opción C, con tests
   de no-regresión de `client_crm`).
3. Commit de OPERATIONS-1 + OPERATIONS-2 cuando se autorice (esta fase no commitea).

---

## O. Confirmaciones de alcance

- ✅ Existe la ruta `/admin/constructor-crm/manual-operativo` y es visible dentro del Constructor.
- ✅ El dashboard `/admin/constructor-crm` muestra una card clara "Manual operativo" con CTA "Abrir manual".
- ✅ No se tocó el sidebar real · no se modificó `client_crm` · no se modificaron leads.
- ✅ No se ejecutó SQL · no se crearon usuarios reales · no se tocaron datos.
- ✅ No se tocó `.env.local` · no se tocó Casa Limpia CRM · no se tocó Ecuador.
- ✅ No se tocó `package_payload` · no se activaron motores · no se creó CRM operativo.
- ✅ Build OK.
- ✅ No se hizo deploy · no se hizo commit · no se hizo push.
