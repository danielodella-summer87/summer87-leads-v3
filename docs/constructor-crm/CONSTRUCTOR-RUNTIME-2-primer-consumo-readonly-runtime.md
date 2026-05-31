# CONSTRUCTOR-RUNTIME-2 — Primer consumo read-only del runtime en el Constructor

> **Tipo:** Consumo read-only mínimo (panel informativo interno).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-RUNTIME-1-helper-runtime-readonly.md` (commit `6228180`).
> **Alcance:** Primer consumo real del helper runtime, como **panel de gobierno read-only** en el Constructor interno. NO se modificó CRM operativo `client_crm`, sidebar ni leads; no se ejecutó SQL, no se crearon tablas, no se tocaron datos, `package_payload`/`installable_package` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se implementó el primer consumo del helper `buildConstructorRuntimeConfig` (RUNTIME-1) en un **panel informativo read-only** montado en `app/admin/constructor-crm/page.tsx` (Constructor interno, nunca en `client_crm`). El panel hace **solo GET** a `/api/admin/constructor/setup`, lee `meta.discovery_submission` + `meta.vertical_key`, construye la config runtime y la muestra: estado runtime, vertical, módulos habilitados/bloqueados, blockers, y las compuertas de seguridad (`can_generate_package_payload`/`can_activate_engines`/`can_create_operational_crm`) que figuran en **`no`**. Si no hay snapshot, muestra estado seguro e indica cerrar el Discovery con "Terminé".

Cambio mínimo: 1 componente nuevo + 2 líneas en el page (import + render). Reutiliza el GET existente; sin API/SQL/tablas. Selftests: Discovery **65/65**, Verticals **46/46**, Runtime **31/31**, build EXIT 0.

---

## B. Archivos modificados

**Creados:**
- `components/constructor/ConstructorRuntimeStatusPanel.tsx` — panel client read-only.
- `docs/constructor-crm/CONSTRUCTOR-RUNTIME-2-primer-consumo-readonly-runtime.md` — este documento.

**Modificados:**
- `app/admin/constructor-crm/page.tsx` — import + `<ConstructorRuntimeStatusPanel />` tras el CTA (2 líneas).

**No modificados:** runtime/discovery/verticals (helpers intactos), API, sidebar, leads, SQL, `tsconfig.json`.

---

## C. Dónde se consume el runtime

En el **dashboard del Constructor** (`/admin/constructor-crm`, server component), que ya está protegido por el layout guard de SEPARATION-1 (redirige a `/403` en `client_crm`). El panel es un client component montado al final del contenido. **No** se tocó el CRM operativo cliente.

## D. Cómo se lee discovery_submission

El panel hace `GET /api/admin/constructor/setup` (sin PATCH), toma `data.meta.discovery_submission` (snapshot 8b). Un `404` (sin fila de setup) se trata como "sin snapshot" → estado `unavailable`, no como error.

## E. Cómo se usa vertical_key confirmado

Lee `data.meta.vertical_key` (8d) y lo pasa como `verticalKey` a `buildConstructorRuntimeConfig`, junto al snapshot. El helper aplica su resolución (confirmado → snapshot → fallback) y marca `vertical_in_catalog`.

## F. Qué muestra el panel

- Estado runtime (No disponible / Borrador / Bloqueado / Requiere revisión / Listo read-only).
- Vertical (label + key) y aviso si está fuera de catálogo.
- Discovery status + completitud + revisión humana.
- Módulos habilitados / bloqueados; faltantes críticos; bloqueos de motores/vertical/módulos; `quoting_blockers` solo si el vertical lo trae.
- Compuertas: Generar paquete / Activar motores / Crear CRM operativo = **no**; Consumo read-only = sí/no.
- Mensaje guía si no hay snapshot.

## G. Qué NO hace

- No hace PATCH ni escribe datos; no genera `package_payload`; no activa motores; no crea CRM operativo; no llama servicios externos; no toca SQL.
- No modifica `client_crm`, sidebar ni leads.

## H. Relación con DiscoveryContext

Consume el resultado del snapshot confirmado (8b/8a) vía el helper runtime; no re-deriva datos crudos. Solo muestra estados ya calculados.

## I. Relación con verticales

Usa `vertical_key` (8d) + los módulos que el catálogo (VERTICALS-1) inyectó en el snapshot (8c). Refleja la corrección conceptual: `quoting_blockers` solo aparece si el vertical lo declara.

## J. Relación con package_payload

Ninguna: no lee ni escribe el paquete; la compuerta `can_generate_package_payload` se muestra en `no`.

## K. Relación con motores

No activa motores; muestra `can_activate_engines = no`. Coherente con read-only.

## L. Validaciones realizadas

- Selftests: DiscoveryContext **65/65**, VerticalCatalog **46/46**, RuntimeConfig **31/31**.
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.
- Seguridad por inspección: el panel solo usa `fetch(..., { cache: "no-store" })` con GET; no hay `method: "PATCH"`, ni escrituras, ni llamadas a motores/paquete.

## M. Riesgos pendientes

- El panel lee datos persistidos (no ediciones sin guardar del cuestionario).
- Visible solo en Constructor interno; el consumo en sidebar/CRM cliente es fase futura (RUNTIME-3).
- Si el `meta` no tiene `discovery_submission`, el estado es `unavailable` (esperado).

## N. Próximos pasos

1. **CONSTRUCTOR-RUNTIME-3** — cablear (aún read-only, fail-open) la visibilidad de módulos del sidebar al vertical confirmado.
2. Más adelante: re-sourcing de campos de lead desde el Constructor con fallback neutro.

## O. Confirmaciones de alcance

- ✅ Existe primer consumo read-only del runtime (panel en Constructor interno).
- ✅ Se construye desde `discovery_submission` + `vertical_key` confirmado; sin snapshot → estado seguro; con blockers → los muestra; `ready_readonly` sin activar nada.
- ✅ NO se tocó CRM operativo `client_crm` · NO se tocó sidebar · NO se tocaron leads.
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
