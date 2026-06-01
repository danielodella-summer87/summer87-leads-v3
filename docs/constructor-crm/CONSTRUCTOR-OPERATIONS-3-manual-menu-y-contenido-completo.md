# CONSTRUCTOR-OPERATIONS-3 — Manual operativo completo: en el menú lateral + contenido extendido

> **Tipo:** UI (ítem de menú lateral + reescritura de la pantalla del manual) + documentación.
> **Fecha:** 2026-06-01.
> **Predecesores:** OPERATIONS-1 (manual completo en `.md`) y OPERATIONS-2 (ruta + card en dashboard), commit `4c31163`.
> **Alcance:** Hacer el manual accesible desde el **menú lateral del Constructor** y
> convertir la pantalla en un manual **completo**, no un índice. NO se tocó `client_crm`,
> leads, SQL, datos, `package_payload`, motores ni `.env.local`. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

OPERATIONS-2 dejó la ruta `/admin/constructor-crm/manual-operativo` y una card en el
dashboard, pero el manual **no aparecía en el menú lateral** y la pantalla era apenas un
índice. OPERATIONS-3 corrige ambas cosas:

1. **Menú lateral:** se agregó el ítem **"Manual operativo"** (key
   `constructor_manual_operativo`, icono `📖`, categoría `internal_constructor`) en
   `DEFAULT_ADMIN_SIDEBAR_MODULES`. Por su categoría, el filtro por APP_MODE lo muestra
   solo en modos internos (`constructor_base`/`installation_prep` con Constructor
   habilitado) y lo **excluye de `client_crm`** (mismo mecanismo que el ya existente
   "Manual cliente").
2. **Pantalla completa:** se reescribió `manual-operativo/page.tsx` con secciones A–O
   (qué es el Constructor, flujo completo, clonación, entorno/APP_MODE, usuario setup,
   cambio de PIN, SQL manual, Discovery, verticales, runtime, QA, semáforo, checklist
   de entrega, qué no hacer nunca y referencia al `.md` completo).

Sin dependencias nuevas, sin tocar el shell ni el comportamiento del sidebar; build OK.

---

## B. Estado inicial

```
Rama: * main  4c31163 [origin/main]  (working tree limpio)
```
`git log --oneline -5`:
```
4c31163 feat(constructor): add OPERATIONS manual to dashboard
292b6b3 feat(constructor): add SETUP-USER-5 setup pin change flow
23b52b8 fix(constructor): enforce SETUP-USER-4 internal login safety
d7055ee docs(constructor): add SETUP-USER-3 setup user deactivation runbook
caded31 feat(constructor): add SETUP-USER-2 manual setup user bootstrap
```

---

## C. Diagnóstico

- **Por qué no aparecía en el menú:** el menú se define en
  `lib/admin/adminSidebarModules.ts` → `DEFAULT_ADMIN_SIDEBAR_MODULES`. El manual
  operativo no tenía un ítem allí (OPERATIONS-2 solo agregó una card en el contenido del
  dashboard, no una entrada de sidebar).
- **Cómo se define el menú:** array de defaults + merge con overrides persistidos
  (`portal_config.sidebar_modules`). `AdminShell` hace `mergeAdminSidebarModules` →
  `filterAdminSidebarModulesByMode` (APP_MODE) → `filterNavByRole` (rol) y renderiza por
  `navGroup` (`main`/`footer`).
- **Categorías por modo:** cada ítem tiene `menuCategory`. `filterAdminSidebarModulesByMode`:
  - `client_crm`: las categorías `internal_constructor`, `internal_installer`,
    `internal_bcr`, `system_danger` → **`return false`** (nunca se muestran).
  - `constructor_base` / `installation_prep`: `internal_constructor` se muestra si el
    Constructor está habilitado (y `showInternalMenus`).
- **¿Agregar un ítem afecta `client_crm`?** No, si la categoría es `internal_constructor`:
  queda excluido por diseño. El ítem existente "Manual cliente"
  (`constructor_manual_cliente`, misma categoría, href bajo `/admin/constructor-crm/`) ya
  demuestra el patrón seguro.
- **Forma más segura:** agregar el ítem a los defaults con
  `menuCategory: "internal_constructor"` (no inferida: explícita) y href interno. No se
  toca `AdminShell`, ni `layout.tsx`, ni la lógica de filtrado. No hay selftests que
  dependan del conteo del array (verificado: ningún test referencia
  `DEFAULT_ADMIN_SIDEBAR_MODULES`/`filterAdminSidebarModulesByMode`).

---

## D. Archivos creados/modificados

**Modificados (2):**

| Archivo | Cambio |
|---|---|
| `lib/admin/adminSidebarModules.ts` | + ítem `constructor_manual_operativo` (label "Manual operativo", href `/admin/constructor-crm/manual-operativo`, icono `📖`, `menuCategory: "internal_constructor"`). |
| `app/admin/constructor-crm/manual-operativo/page.tsx` | Reescrito: manual completo con secciones A–O. |

**Creados (1):**

| Archivo | Rol |
|---|---|
| `docs/constructor-crm/CONSTRUCTOR-OPERATIONS-3-manual-menu-y-contenido-completo.md` | Este documento. |

**No modificados (solo lectura):** `app/admin/AdminShell.tsx`, `app/admin/layout.tsx`,
`app/admin/constructor-crm/layout.tsx`, `app/admin/constructor-crm/page.tsx` (la card de
OPERATIONS-2 se mantiene), `lib/config/appMode.ts`.

> Nota: la lógica de filtrado del sidebar **no** se modificó; solo se agregó un dato
> (un ítem) que esa lógica ya sabe clasificar y excluir de `client_crm`.

---

## E. Opción agregada al menú

- **Label:** "Manual operativo".
- **Ruta:** `/admin/constructor-crm/manual-operativo`.
- **Icono:** `📖` (coherente con el estilo emoji del sidebar; "Manual cliente" usa `📘`).
- **Categoría:** `internal_constructor` → visible solo en modos internos, nunca en `client_crm`.

---

## F. Ruta mejorada

`/admin/constructor-crm/manual-operativo` pasó de índice resumido a **manual completo**
(server component, read-only), con cards/secciones bien separadas, bloques de comandos en
monospace y advertencias visibles (amarillas/rojas). Estilo consistente con el dashboard
del Constructor. Sin dependencias nuevas.

---

## G. Qué contenido se agregó

Secciones visibles A–O:
- **A.** Qué es el Constructor CRM (base que se clona; para instalador, no cliente; cliente usa CRM operativo).
- **B.** Flujo completo venta → relevamiento → clonación → entorno → Supabase/Vercel/dominio → setup → Discovery → vertical → "Terminé" → runtime → QA → activación → baja de setup.
- **C.** Cómo clonar (bloque TERMINAL con los comandos pedidos; aclara reemplazar el slug).
- **D.** Entorno y variables (.env.local no se commitea; Supabase propio; APP_MODE `constructor_base`/`installation_prep`/`client_crm`; `client_crm` bloquea el Constructor).
- **E.** Usuario setup (username `setup`, PIN `1234`, uso instalación, temporal, cambiar PIN, deshabilitar/reemplazar antes de exponer).
- **F.** Cambio de PIN (`POST /api/proto/change-pin`, no crea sesión, reloguear, no PIN plano, no compartir).
- **G.** SQL manual (advertencia fuerte; bootstrap revisable; baja/rotación manual; nada automático).
- **H.** Discovery (cuestionario, confirmar vertical, "Terminé", no crea CRM operativo, no motores, no package_payload).
- **I.** Verticales (`generic`, `cleaning_services`, `pickup_4x4`, `marketing_agency`, `education`; costeo solo en algunos).
- **J.** Runtime read-only (estado de preparación; no activa nada; no modifica navegación; diagnóstico).
- **K.** QA interno (checklist: build, login, dashboard, manual, Discovery, vertical, Terminé, runtime, setup rotado, client_crm sin Constructor).
- **L.** Semáforo VERDE/AMARILLO/ROJO con criterios.
- **M.** Checklist final de entrega al cliente.
- **N.** Qué no hacer nunca.
- **O.** Referencia al `.md` completo + botón "Volver al Constructor".

---

## H. Qué NO hace

- No oculta módulos ni cambia el comportamiento del sidebar (solo agrega un ítem interno).
- No modifica `client_crm`, leads, navegación operativa, `AdminShell` ni `layout.tsx`.
- No ejecuta SQL, no crea usuarios, no toca datos, `package_payload`, motores ni `.env.local`.
- No lee Markdown del filesystem en runtime (contenido en React).
- No agrega dependencias nuevas.

---

## I. Relación con APP_MODE

El ítem usa `menuCategory: "internal_constructor"`. `filterAdminSidebarModulesByMode`:
en `client_crm` excluye esa categoría (false); en modos internos la muestra si el
Constructor está habilitado. La ruta, además, está bajo el layout guard que redirige a
`/403` en `client_crm`. Doble protección: menú **y** ruta.

---

## J. Relación con sidebar real

Se agregó **un dato** (un ítem default) que la lógica existente ya sabe filtrar. No se
modificó el renderer (`AdminShell`), ni el filtrado, ni se ocultó ningún módulo. El resto
del menú queda idéntico.

---

## K. Relación con client_crm

Ninguna exposición: el ítem (categoría `internal_constructor`) no aparece en `client_crm`,
y la ruta responde 403 en ese modo. El cliente final no ve el manual ni la entrada de menú.

---

## L. Validaciones realizadas

- `npm run build` → **EXIT 0** (ruta `/admin/constructor-crm/manual-operativo` registrada).
- `git diff --check` → limpio.
- `git status --short` → solo los archivos de esta fase + docs untracked previos.
- Inspección: ningún selftest referencia `DEFAULT_ADMIN_SIDEBAR_MODULES`/`filterAdminSidebarModulesByMode`, por lo que el ítem nuevo no rompe tests. (Selftests de auth/Constructor disponibles para correr; esta fase no cambia esa lógica.)

---

## M. Riesgos/pendientes

- La pantalla es una versión estructurada (paridad parcial con el `.md`); puede
  desincronizarse si OPERATIONS-1 cambia. Mitigación: referencia al archivo fuente.
- Mejora futura: renderizar el `.md` completo con `react-markdown` (ya en dependencias)
  para evitar duplicación de contenido.
- Si en el futuro se persiste un override de label/icono para
  `constructor_manual_operativo` vía `portal_config`, se respeta el merge existente (key
  ya incluida en `ALLOWED_KEYS`).

---

## N. Próximos pasos

1. (Opcional) Renderizar el Markdown completo en la ruta con `react-markdown`.
2. Commit de OPERATIONS-1/2/3 cuando se autorice (esta fase no commitea).
3. Mantener el contenido de la pantalla sincronizado con el `.md` al actualizar el proceso.

---

## O. Confirmaciones de alcance

- ✅ El menú lateral muestra "Manual operativo" dentro del Constructor (modos internos).
- ✅ `/admin/constructor-crm/manual-operativo` muestra un manual completo (A–O), no un índice.
- ✅ No se modificó `client_crm` · no se modificaron leads · no se ocultaron módulos.
- ✅ No se cambió la navegación existente (solo se agregó un ítem interno).
- ✅ No se ejecutó SQL · no se crearon usuarios reales · no se tocaron datos.
- ✅ No se tocó `.env.local` · no se tocó Casa Limpia CRM · no se tocó Ecuador.
- ✅ No se tocó `package_payload` · no se activaron motores · no se creó CRM operativo.
- ✅ Build OK.
- ✅ No se hizo deploy · no se hizo commit · no se hizo push.
