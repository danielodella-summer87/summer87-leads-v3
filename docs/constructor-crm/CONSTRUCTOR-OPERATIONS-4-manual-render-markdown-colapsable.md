# CONSTRUCTOR-OPERATIONS-4 — Render del manual real desde Markdown con bloques colapsables

> **Tipo:** UI (Server Component lee Markdown + componente client colapsable) + documentación.
> **Fecha:** 2026-06-01.
> **Predecesores:** OPERATIONS-1 (`.md`), OPERATIONS-2 (ruta+card, `4c31163`), OPERATIONS-3 (menú+pantalla, `21caded`).
> **Alcance:** Renderizar el manual **real** (OPERATIONS-1) en la UI, con secciones
> colapsables y mejor diseño. NO se tocó `client_crm`, leads, sidebar real, SQL, datos,
> `package_payload`, motores ni `.env.local`. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

La pantalla `/admin/constructor-crm/manual-operativo` dejó de tener contenido
**hardcodeado** y ahora **renderiza el archivo Markdown real** OPERATIONS-1 como fuente
de verdad única. La página es un **Server Component** que lee el `.md` con
`fs/promises`, lo parsea por secciones de nivel 2 (`## `) y entrega cada sección a un
**componente client colapsable** (`ManualSectionAccordion`) que la renderiza con
**react-markdown + remark-gfm** (ya en dependencias; sin `dangerouslySetInnerHTML`).

Se conservan: el ítem del menú lateral (OPERATIONS-3) y la card del dashboard
(OPERATIONS-2), ambos apuntando a la misma ruta. Build OK.

---

## B. Estado inicial

```
Rama: * main  21caded [origin/main]  (working tree limpio)
```
`git log --oneline -5`:
```
21caded feat(constructor): add OPERATIONS-3 manual sidebar entry and full guide
4c31163 feat(constructor): add OPERATIONS manual to dashboard
292b6b3 feat(constructor): add SETUP-USER-5 setup pin change flow
23b52b8 fix(constructor): enforce SETUP-USER-4 internal login safety
d7055ee docs(constructor): add SETUP-USER-3 setup user deactivation runbook
```

---

## C. Diagnóstico

- **El `.md` existe y está trackeado:** `docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md`.
- **react-markdown disponible:** `react-markdown@^10.1.0` y `remark-gfm@^4.0.1` ya están en `package.json` (no se agregan dependencias).
- **Lectura desde Server Component viable:** sí, con `node:fs/promises` + `path.join(process.cwd(), ...)`. La página ya es del árbol `/admin/constructor-crm` (server-only).
- **Ruta actual existe** y **el menú lateral ya tiene "Manual operativo"** (`constructor_manual_operativo`, categoría `internal_constructor`) — no se toca.
- **Layout protege la ruta:** `app/admin/constructor-crm/layout.tsx` redirige a `/403` en `client_crm` (`isClientCrmMode()`). La nueva pantalla hereda esa protección.

---

## D. Archivos creados/modificados

**Creados (2):**

| Archivo | Rol |
|---|---|
| `components/constructor/ManualSectionAccordion.tsx` | Client component: bloques colapsables + render markdown por sección. |
| `docs/constructor-crm/CONSTRUCTOR-OPERATIONS-4-manual-render-markdown-colapsable.md` | Este documento. |

**Modificados (1):**

| Archivo | Cambio |
|---|---|
| `app/admin/constructor-crm/manual-operativo/page.tsx` | Reescrito: Server Component que lee el `.md`, parsea por `##` y delega en el accordion. Header fijo + "Cómo usar" + semáforo + referencia a la fuente. |

**No modificados (solo lectura):** `lib/admin/adminSidebarModules.ts`, `app/admin/AdminShell.tsx`,
`app/admin/layout.tsx`, `app/admin/constructor-crm/layout.tsx`, `app/admin/constructor-crm/page.tsx` (card intacta), `package.json`.

---

## E. Fuente de verdad del manual

`docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md`.
El contenido **no se duplica** en JSX: la pantalla lo lee y lo renderiza. Para actualizar
el manual, basta editar ese `.md`.

---

## F. Ruta mejorada

`/admin/constructor-crm/manual-operativo` (sin cambios de path). Pasó de contenido
hardcodeado a render dinámico del Markdown real, con secciones colapsables y diseño
profesional. La card del dashboard y el ítem del menú siguen apuntando aquí.

---

## G. Cómo se parsea el Markdown

`parseManualSections(markdown)` (en el Server Component):
- Divide por líneas y rastrea **bloques de código** (` ``` `) para no confundir
  comentarios `#`/`##` dentro de code como headings.
- Detecta headings de **nivel 2** con `/^##\s+(.+)/` (no captura `###`).
- Cada `## Título` abre una sección nueva; las líneas siguientes son su cuerpo.
- El **preámbulo** anterior al primer `##` (título H1 + intro/metadata) se descarta: la
  pantalla ya tiene un header fijo.
- Devuelve `{ id, title, body }[]`; el `body` es Markdown crudo que se renderiza en el client.

---

## H. Cómo funcionan los bloques colapsables

`ManualSectionAccordion` (client):
- Recibe `sections` ya parseadas (sin lógica de filesystem en el client).
- Estado `openIds` (Set). **Por defecto abre las primeras 3 secciones**; el resto colapsado.
- Cada card: botón con título + chevron que rota (indicador visual abierto/cerrado),
  `aria-expanded` para accesibilidad.
- Botón global "Expandir todo / Colapsar todo".
- El cuerpo se monta solo cuando la sección está abierta (render condicional).

---

## I. Diseño aplicado

- **Header fijo**: badge + título + subtítulo + aviso interno (amarillo).
- **"Cómo usar este manual"**: 3 bullets (leer flujo, seguir por orden, no SQL sin confirmación).
- **Semáforo** destacado: VERDE / AMARILLO / ROJO con puntos de color.
- **Referencia a la fuente** en monospace.
- **Cards** blancas, bordes suaves, sombra ligera, hover `shadow-md`, buen espaciado.
- **Markdown** estilizado vía componentes de react-markdown:
  - `code` inline con fondo slate claro; `pre` con fondo `slate-900`.
  - `blockquote` como bloque de advertencia (borde y fondo ámbar).
  - `table` con borde y **scroll horizontal**.
  - `a` subrayado; `strong` resaltado; headings/listas/párrafos con jerarquía y espaciado.
- Sin `dangerouslySetInnerHTML`. Sin dependencias nuevas.

---

## J. Qué NO hace

- No duplica el contenido en JSX (lo lee del `.md`).
- No usa `dangerouslySetInnerHTML`.
- No toca el sidebar real, `AdminShell`, `app/admin/layout.tsx` ni `adminSidebarModules.ts`.
- No toca `client_crm`, leads, datos, SQL, `package_payload`, motores ni `.env.local`.
- No agrega buscador (fuera de alcance, opcional).

---

## K. Relación con APP_MODE

La ruta vive bajo `/admin/constructor-crm/*`; su layout redirige a `/403` cuando
`isClientCrmMode()`. En modos internos (`constructor_base`/`installation_prep`) es
accesible. No se modificó `lib/config/appMode.ts`.

---

## L. Relación con sidebar real

Ninguna: el ítem "Manual operativo" ya existía (OPERATIONS-3) y **no se tocó**
`adminSidebarModules.ts`. Solo cambió el contenido de la pantalla destino.

---

## M. Relación con client_crm

Ninguna exposición: ítem de categoría `internal_constructor` (no aparece en `client_crm`)
y ruta con guard 403 en ese modo. El cliente final no ve el manual.

---

## N. Validaciones realizadas

- `npm run build` → **EXIT 0** (ruta `/admin/constructor-crm/manual-operativo` registrada).
- `git diff --check` → limpio.
- `git status --short` → solo los archivos de esta fase.
- Inspección: `app/admin/layout.tsx`, `AdminShell.tsx`, `adminSidebarModules.ts` **sin cambios**.

---

## O. Riesgos/pendientes

- **Empaquetado en Vercel:** la lectura por `fs` requiere que el `.md` esté incluido en
  el bundle de la función. Next suele trazar lecturas con `path.join(process.cwd(), …)`;
  si en deploy no se incluyera, la pantalla muestra el fallback de error con la ruta del
  archivo (no rompe). Mitigación futura: import estático del `.md` (loader) o copia a
  `public/`.
- **Parseo por `## `:** depende de que el manual mantenga secciones de nivel 2. Si se
  reestructura el `.md`, la segmentación cambia (es el comportamiento deseado: la fuente
  manda).
- El preámbulo (H1 + intro) no se muestra dentro del acordeón (reemplazado por header fijo).

---

## P. Próximos pasos

1. (Opcional) Import estático del Markdown para robustez de bundling en Vercel.
2. (Opcional) Buscador/filtrado de secciones e índice con anclas.
3. Commit de OPERATIONS-4 cuando se autorice (esta fase no commitea).

---

## Q. Confirmaciones de alcance

- ✅ `/admin/constructor-crm/manual-operativo` sigue funcionando y renderiza el `.md` real.
- ✅ El contenido sale del Markdown OPERATIONS-1 (fuente de verdad, sin copia hardcodeada).
- ✅ Manual en bloques colapsables, diseño claro y profesional.
- ✅ La card del dashboard y el ítem del menú siguen funcionando.
- ✅ No se tocó el sidebar real (no fue necesario) · no se modificó `client_crm` · no se modificaron leads.
- ✅ No se ejecutó SQL · no se crearon usuarios reales · no se tocaron datos.
- ✅ No se tocó `.env.local` · no se tocó Casa Limpia CRM · no se tocó Ecuador.
- ✅ No se tocó `package_payload` · no se activaron motores · no se creó CRM operativo.
- ✅ Build OK.
- ✅ No se hizo deploy · no se hizo commit · no se hizo push.
