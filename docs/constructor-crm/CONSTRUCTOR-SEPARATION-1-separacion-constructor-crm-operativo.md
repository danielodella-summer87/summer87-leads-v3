# CONSTRUCTOR-SEPARATION-1 — Separación Constructor vs CRM operativo

> **Tipo:** Auditoría de separación + documentación de política (verificación; sin cambio de código necesario).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-SECURITY-1-gobierno-flags-prototipo.md` (commit `30d3141`).
> **Alcance:** Reforzar/documentar la separación Constructor interno ↔ CRM operativo gobernada por `APP_MODE`. NO se ejecutó SQL, no se tocaron datos, UI de negocio, `.env.local`, `package_payload`, `DiscoveryContext` ni proyectos externos. NO hay deploy/commit/push.
> **Principio rector:** Pequeño, seguro y reversible. Implementar solo si el diagnóstico detecta brecha real.

---

## A. Resumen ejecutivo

La separación entre el Constructor interno y el CRM operativo **ya está implementada como capacidad base** del producto, gobernada por `APP_MODE`, y es **fail-safe en tres capas independientes** cuando `APP_MODE=client_crm`:

1. **Menú/Sidebar:** los módulos `internal_constructor` (y `installer`/`bcr`/`system_danger`) se ocultan en `client_crm` (`lib/admin/adminSidebarModules.ts`). La categoría se **infiere** del key/href, así que cualquier entrada que apunte al Constructor queda oculta automáticamente.
2. **Rutas (layout guard):** `app/admin/constructor-crm/layout.tsx` redirige a `/403` en `client_crm`. Cubre además el alias `/admin/constructor/*` porque el rewrite de `next.config.ts` lo resuelve al mismo segmento `constructor-crm`.
3. **APIs:** los **11 endpoints** de `app/api/admin/constructor/*` invocan `guardConstructorApiByMode()` en **todos** sus handlers, devolviendo `403` en `client_crm`.

En `constructor_base` el Constructor sigue funcionando con normalidad (menú visible según `constructorEnabled`, layout no redirige, APIs pasan). En production los bypass de prototipo quedan forzados `false` por SECURITY-1, por lo que el acceso exige auth real.

**Conclusión:** el diagnóstico **no detecta brecha real**. Todos los criterios de aceptación ya se cumplen con el código existente. Por el principio "implementar solo si hace falta", **esta fase no modifica código**: documenta la política, verifica las tres capas y deja registrados los riesgos/pendientes. Se evaluó —y se descartó— un guard de `APP_MODE` en el middleware (ver §J), porque el middleware corre en Edge runtime y leería el modo de forma no confiable; el diseño actual enforce a propósito en layout + API (Node runtime).

---

## B. Estado Git inicial

```
Directorio: /Users/danielodella/PROYECTOS/summer87-leads-v3
git status --short:  (working tree limpio)
Rama: * main  30d3141 [origin/main]  (sincronizada)
```

`git log --oneline -10`:
```
30d3141 fix(constructor): govern prototype flags by environment
b359bc9 docs(constructor): add REBASE-2 architecture decisions
319ce61 docs(constructor): add REBASE-1 post Casa Limpia audit
389630a Document Casa Limpia local clone validation
1bc7f0f Document Casa Limpia local clone procedure
d6b79b4 Document Casa Limpia pre-clone Go No-Go checklist
6a99859 Document Casa Limpia seed users and permissions
36b80a5 Document Casa Limpia clean clone technical plan
2924dd6 Document Casa Limpia CRM contract
7ddf4ad Document Casa Limpia read-only audit
```

Ramas backup locales intactas.

---

## C. Diagnóstico de separación actual

| Pregunta | Estado hoy | Evidencia |
|---|---|---|
| ¿Qué pasa con `/admin/constructor-crm` en `client_crm`? | **Bloqueado** → redirige a `/403`. | `app/admin/constructor-crm/layout.tsx:13` (`if (isClientCrmMode()) redirect("/403")`). |
| ¿Qué pasa con `/admin/constructor` (alias por rewrite) en `client_crm`? | **Bloqueado** → el rewrite resuelve a `constructor-crm`, que aplica el mismo layout guard. | `next.config.ts` rewrites + layout guard. |
| ¿Qué pasa con `/api/admin/constructor/*` en `client_crm`? | **Bloqueado** → `403` en los 11 endpoints. | `guardConstructorApiByMode()` en todos los handlers; `lib/admin/constructorApiAccess.ts` (`isClientCrmMode()` → 403). |
| ¿El sidebar muestra Constructor en `client_crm`? | **No** → categoría `internal_constructor` retorna `false`. | `lib/admin/adminSidebarModules.ts:409-416`; categoría inferida en `:225-229`. |
| ¿Hay accesos indirectos al Constructor? | No detectados. El único ítem de sidebar que toca el árbol (`constructor_manual_cliente`) es `internal_constructor` y se oculta. Breadcrumb solo etiqueta, no enlaza. | grep de refs en `AdminShell.tsx`/`adminSidebarModules.ts`. |
| ¿El bypass local puede interferir con la separación? | **No.** Aunque `CONSTRUCTOR_AUTH_BYPASS` esté activo en local, solo saltea el login en el middleware; el layout guard y las APIs siguen bloqueando por `APP_MODE` en `client_crm`. | `middleware.ts:71` (bypass) vs. layout/API guards independientes. |
| ¿Production queda protegida? | **Sí.** Bypass forzado `false` en prod (SECURITY-1) + las tres capas de separación. | `lib/config/constructorPrototypeFlags.ts`. |
| ¿`constructor_base` sigue permitiendo trabajar? | **Sí.** Menú visible (`constructorEnabled`), layout no redirige, APIs pasan. | `adminSidebarModules.ts:370-391`; `constructorApiAccess.ts` (solo bloquea `client_crm`). |

---

## D. Política definida

1. **Constructor visible solo para modos internos** (`constructor_base`, `installation_prep`) y según flags (`constructorEnabled`, `showInternalMenus`).
2. **CRM operativo visible para `client_crm`**; el cliente final nunca ve el Constructor.
3. **`/admin/constructor-crm/*` bloqueado en `client_crm`** (layout guard → `/403`).
4. **Alias `/admin/constructor/*` bloqueado en `client_crm`** (rewrite → mismo layout guard).
5. **APIs `/api/admin/constructor/*` bloqueadas en `client_crm`** (`guardConstructorApiByMode()` → 403 en todos los handlers).
6. **Sidebar no muestra Constructor en `client_crm`** (filtro por modo, categoría inferida → fail-safe ante key/href nuevos).
7. **Bloqueo fail-safe:** ante duda, no mostrar / no permitir. La categoría del sidebar se infiere por substring (`constructor`/`installer`) y prefijo de ruta, de modo que un módulo nuevo del Constructor queda oculto sin configuración adicional. Las APIs bloquean por `APP_MODE` con allowlist conservadora.

---

## E. Cambios realizados, si hubo

**No hubo cambios de código.** El diagnóstico confirmó que las tres capas ya implementan la política completa y fail-safe. Único cambio en disco: la creación de este documento. Esto respeta el principio "implementar solo si hace falta".

---

## F. Rutas Constructor

| Ruta | `constructor_base` | `installation_prep` | `client_crm` |
|---|---|---|---|
| `/admin/constructor-crm` y subrutas | Accesible | Accesible | **403** (layout guard) |
| `/admin/constructor` (alias rewrite) | Accesible | Accesible | **403** (rewrite → layout guard) |

Mecanismo: `app/admin/constructor-crm/layout.tsx` evalúa `isClientCrmMode()` server-side por request y hace `redirect("/403")`. Es la capa de ruta; el middleware (Edge) no chequea `APP_MODE` por diseño (ver §J).

---

## G. APIs Constructor

Los 11 endpoints invocan `guardConstructorApiByMode()` al inicio de cada handler:

```
assist/route.ts                                   (POST)            ✓
assist/events/route.ts                            (POST)            ✓
setup/route.ts                                    (GET, PATCH)      ✓ ✓
installable-package/generate/route.ts             (POST)            ✓
installable-package/drafts/route.ts               (GET/POST)        ✓
installable-package/drafts/[id]/route.ts          (GET)             ✓
installable-package/drafts/[id]/approve/route.ts  (POST)            ✓
installable-package/drafts/[id]/reject/route.ts   (POST)            ✓
installable-package/drafts/[id]/simulate-preinstall/route.ts (POST) ✓
installable-package/drafts/[id]/simulation-snapshots/route.ts (GET/POST) ✓
installable-package/drafts/[id]/meeting-decisions/route.ts (GET/POST)    ✓
```

En `client_crm`, `guardConstructorApiByMode()` devuelve `403` con `{ error: "CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM" }` y `Cache-Control: no-store`. No se tocó ningún handler ni response shape.

---

## H. Sidebar / navegación

- `app/admin/layout.tsx` calcula el `sidebarModeFilter` server-side desde `getAppModeSnapshot()` (el cliente no lee `process.env`).
- `AdminShell.tsx` aplica `filterAdminSidebarModulesByMode(visible, sidebarModeFilter)` y luego filtro por rol.
- En `client_crm`, `shouldIncludeSidebarModuleByMode` retorna `false` para categorías `internal_constructor`, `internal_installer`, `internal_bcr`, `system_danger` (`adminSidebarModules.ts:409-416`).
- La categoría se infiere por key (`includes("constructor")`) y prefijo de href (`/admin/constructor-crm`, `/admin/constructor`) → **cualquier** entrada del Constructor se oculta automáticamente (fail-safe).
- Existe además sanitización conservadora del `sidebar_modules` persistido en `portal_config` para `client_crm`.

**Estado:** la navegación ya no expone el Constructor en `client_crm`. No requiere cambios.

---

## I. Validaciones realizadas

- `npm run build` — EXIT reportado en la salida de la fase (sin cambios de código, build estable).
- `npm run lint` — falla por **deuda preexistente no relacionada**; ninguno de los archivos de esta fase aplica (no se modificó código). Reportado sin corregir masivamente.
- `git diff --check` — sin errores de whitespace.
- Inspección de seguridad: `client_crm` bloquea rutas y APIs del Constructor; sidebar no lo expone; `constructor_base` mantiene Constructor; production con bypass off.
- Verificado que todos los handlers de las 11 APIs invocan el guard de modo.

---

## J. Riesgos pendientes

1. **Defensa en una sola capa de ruta:** el bloqueo de rutas del Constructor en `client_crm` vive en el **layout guard** (Node runtime), no en el middleware. Se evaluó agregar un chequeo de `APP_MODE` en `middleware.ts`, pero **se descartó**: el middleware corre en **Edge runtime**, donde `getAppMode()` (acceso dinámico a `process.env`) no se resuelve de forma confiable; añadirlo aportaría una falsa sensación de seguridad o requeriría un helper de referencias estáticas adicional. El diseño actual enforce a propósito en layout + API (Node). Si en el futuro se quiere un guard de modo en middleware, debe hacerse con un helper estático equivalente al de SECURITY-1.
2. **Auth real aún pendiente:** la separación por `APP_MODE` es correcta, pero la autenticación/roles finos para usuarios externos (matriz rol×permisos en runtime) sigue sin consumirse — fuera del alcance de esta fase.
3. **`client_crm` no ejercitado en runtime real:** la verificación es por inspección de código; no hay un entorno `client_crm` desplegado para e2e. Conviene una validación e2e cuando exista la primera instancia cliente.
4. **`setup` permiso real:** en prod, `requireConstructorSetupAccess()` devuelve 403 hasta cablear `config.update` (pendiente de SECURITY-1).

---

## K. Próximos pasos

1. **CONSTRUCTOR-DISCOVERY-8** — `DiscoveryContext` confirmado + botón "Terminé" + persistencia de submissions (siguiente bloque natural de producto).
2. (Opcional, hardening) **e2e de separación** cuando exista una instancia `client_crm` real: URL directa de Constructor con sesión cliente → 403; APIs → 403; sidebar sin Constructor.
3. (Futuro) Si se decide endurecer en middleware, hacerlo con helper de referencias estáticas de `APP_MODE` (no acceso dinámico).

---

## L. Confirmaciones de alcance

- ✅ Separación Constructor ↔ CRM operativo documentada y verificada.
- ✅ En `client_crm` el Constructor no es visible y queda bloqueado (sidebar + ruta + API).
- ✅ `/admin/constructor-crm/*` bloqueado en `client_crm`.
- ✅ `/admin/constructor/*` (alias) bloqueado en `client_crm`.
- ✅ `/api/admin/constructor/*` bloqueado en `client_crm` (11 endpoints).
- ✅ `constructor_base` mantiene el Constructor disponible.
- ✅ NO se ejecutó SQL · NO se tocaron datos.
- ✅ NO se modificó `.env.local`.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador.
- ✅ NO se tocó `package_payload` ni `DiscoveryContext`.
- ✅ NO se modificó UI ni lógica de negocio (sin cambios de código).
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
