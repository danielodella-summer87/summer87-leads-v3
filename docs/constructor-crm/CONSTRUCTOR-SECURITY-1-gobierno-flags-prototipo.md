# CONSTRUCTOR-SECURITY-1 — Gobierno de flags de prototipo del Constructor CRM

> **Tipo:** Implementación de seguridad (cambios mínimos de código).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-REBASE-2-decisiones-arquitectura-post-auditoria.md` (commit `b359bc9`).
> **Alcance:** Centralizar y gobernar por env los 4 flags de prototipo. NO se ejecutó SQL, no se tocaron datos, UI, `.env.local`, ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Los 4 flags de prototipo del Constructor estaban **hardcodeados en `true`**, lo que dejaba el Constructor accesible sin login y los endpoints `assist`/`assist/events`/`setup` sin control de sesión/permiso. Esta fase implementa la decisión de REBASE-2: los flags **siguen existiendo** pero pasan a un **helper centralizado gobernado por variables de entorno**, con **default `false`** y **forzado `false` en production** (doble llave). El comportamiento local solo cambia si Daniel activa explícitamente la env correspondiente; sin env, todo queda seguro por defecto.

Cambio mínimo y reversible: un helper nuevo (`lib/config/constructorPrototypeFlags.ts`) y la sustitución de 4 constantes por llamadas a ese helper. **No se alteró lógica de negocio, response shapes, orden del middleware, `APP_MODE` ni permisos generales.**

---

## B. Flags gobernados

| Flag (env) | Archivo donde se usa | Qué habilita |
|---|---|---|
| `CONSTRUCTOR_AUTH_BYPASS` | `middleware.ts` | Abre `/admin/constructor*` y `/api/admin/constructor*` sin login. |
| `CONSTRUCTOR_ASSIST_AUTH_BYPASS` | `app/api/admin/constructor/assist/route.ts` | Usa el assist (IA mock) sin sesión válida. |
| `CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS` | `app/api/admin/constructor/assist/events/route.ts` | Registra eventos de auditoría mock sin sesión. |
| `CONSTRUCTOR_SETUP_PROTOTYPE_MODE` | `app/api/admin/constructor/setup/route.ts` | Lee/guarda `crm_setup_config` sin exigir `config.update`. |

---

## C. Riesgo anterior

- **`const … = true` hardcodeado** en 4 archivos: imposible desactivar sin editar código y redeploy.
- **Exposición #1:** `CONSTRUCTOR_AUTH_BYPASS=true` dejaba todo el árbol del Constructor accesible sin autenticación, incluso si se hubiera desplegado a un entorno accesible por terceros.
- Los endpoints `assist`/`events` aceptaban requests anónimos; `setup` permitía leer/escribir configuración sin permiso real.
- El único freno era recordar revertir manualmente antes de exponer — frágil y no auditable.

---

## D. Nuevo comportamiento

Cada flag se resuelve mediante una función del helper que aplica, en orden:
1. **Si `NODE_ENV === "production"` → `false`** (siempre, ignorando la env).
2. Si no, lee la env correspondiente y devuelve `true` **solo** con un valor explícito reconocido (`"true"`, `"1"`, `"yes"`, case-insensitive).
3. En cualquier otro caso (env ausente, vacía o no reconocida) → `false`.

El helper usa **referencias estáticas** a `process.env.<NOMBRE>` (no acceso dinámico por clave), requisito para que el valor se resuelva correctamente tanto en **Edge runtime** (`middleware.ts`) como en **Node runtime** (route handlers). No lanza si falta la env, no expone secretos y no depende del browser.

---

## E. Variables de entorno

| Variable | Valores que activan | Default |
|---|---|---|
| `CONSTRUCTOR_AUTH_BYPASS` | `true` / `1` / `yes` | `false` |
| `CONSTRUCTOR_ASSIST_AUTH_BYPASS` | `true` / `1` / `yes` | `false` |
| `CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS` | `true` / `1` / `yes` | `false` |
| `CONSTRUCTOR_SETUP_PROTOTYPE_MODE` | `true` / `1` / `yes` | `false` |

Se definen en el entorno local de Daniel (p. ej. `.env.local`, **que NO fue modificado en esta fase**). Cualquier otro valor (`false`, `0`, vacío, ausente, basura) deja el flag en `false`.

---

## F. Valores por ambiente

| Ambiente | Sin env | Con env `true` |
|---|---|---|
| **Local / dev** (`NODE_ENV !== "production"`) | `false` (seguro) | `true` (bypass activo, uso controlado) |
| **Production** (`NODE_ENV === "production"`) | `false` | **`false` forzado** (la env se ignora) |

---

## G. Qué ocurre en production

- Todos los flags devuelven `false` **siempre**, sin importar el valor de la env.
- El Constructor exige login (RBAC del middleware sin bypass).
- `assist` y `assist/events` exigen sesión válida (camino real ya escrito en `hasConstructorAssistAccess()` / `hasConstructorAssistEventsAccess()`).
- `setup` exige el permiso real (`requireConstructorSetupAccess()` devuelve 403 hasta conectar `config.update`).

---

## H. Qué ocurre en local/dev

- Sin env → todo en `false`: el Constructor se comporta como si no hubiera bypass (más seguro que antes incluso en local).
- Con `CONSTRUCTOR_AUTH_BYPASS=true` (etc.) → el bypass se activa para la fase de prototipo, igual que antes, pero **explícito y reversible sin tocar código**.

---

## I. Archivos modificados

**Creados:**
- `lib/config/constructorPrototypeFlags.ts` — helper centralizado (4 funciones + parser estricto + force-off en prod).
- `docs/constructor-crm/CONSTRUCTOR-SECURITY-1-gobierno-flags-prototipo.md` — este documento.

**Modificados (mínimo):**
- `middleware.ts` — import del helper; eliminada la const `CONSTRUCTOR_AUTH_BYPASS`; uso de `isConstructorAuthBypassEnabled()`. Orden de chequeos intacto.
- `app/api/admin/constructor/assist/route.ts` — import; eliminada const; uso de `isConstructorAssistAuthBypassEnabled()`.
- `app/api/admin/constructor/assist/events/route.ts` — import; eliminada const; uso de `isConstructorAssistEventsAuthBypassEnabled()`.
- `app/api/admin/constructor/setup/route.ts` — import; eliminada const; uso de `isConstructorSetupPrototypeModeEnabled()`.

No se tocaron pantallas, rutas de negocio, SQL, datos ni `.env.local`.

---

## J. Validaciones realizadas

- `npm run build` — ver §resultado en el reporte de la fase (EXIT reportado).
- `git diff --check` — sin errores de whitespace.
- Inspección de seguridad (§validaciones específicas): production fuerza `false`; sin env → `false`; con env explícita en dev → `true`.
- Verificado que el helper usa referencias estáticas `process.env.<NOMBRE>` (compatible Edge + Node).

---

## K. Riesgos pendientes

- **Auth real aún no implementada**: quitar el bypass no agrega controles nuevos; depende del RBAC existente (middleware) y de los guards ya escritos en los endpoints. La separación completa (menú + e2e) es **CONSTRUCTOR-SEPARATION-1**.
- **IA real**: `assist` sigue siendo mock; conectar OpenAI exigirá el permiso `constructor.assist` (TODO ya marcado en el archivo).
- **`setup` permiso real**: `requireConstructorSetupAccess()` devuelve 403 en prod hasta conectar `config.update`; falta cablear el permiso real.
- **Configuración de entorno**: las env deben quedar documentadas para el deploy (no se tocó `.env.local` ni configuración de Vercel en esta fase).

---

## L. Próximos pasos

1. **CONSTRUCTOR-SEPARATION-1** — auth real + guards de menú por modo + e2e de separación Constructor/cliente.
2. Cablear el permiso real de `setup` (`config.update`) cuando se cierre el modo prototipo.
3. Documentar/definir las env en el entorno de deploy (Vercel) sin exponer el Constructor.

---

## M. Confirmaciones de alcance

- ✅ Los 4 flags dejan de estar hardcodeados en `true`.
- ✅ Existe helper centralizado (`lib/config/constructorPrototypeFlags.ts`).
- ✅ Default sin env = `false`; production = `false` forzado; local/dev activable por env explícita.
- ✅ NO se modificó `.env.local`.
- ✅ NO se ejecutó SQL · NO se tocaron datos.
- ✅ NO se modificó UI ni rutas de negocio.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
