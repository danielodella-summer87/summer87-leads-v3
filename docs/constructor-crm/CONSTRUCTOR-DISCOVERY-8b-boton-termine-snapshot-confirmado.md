# CONSTRUCTOR-DISCOVERY-8b — Botón "Terminé" y persistencia del snapshot DiscoveryContext confirmado

> **Tipo:** Implementación mínima (helper de snapshot + UI mínima + reuso de PATCH).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-DISCOVERY-8a-helper-discovery-context-universal.md` (commit `7525422`).
> **Alcance:** Primer cierre funcional del Discovery. NO se ejecutó SQL, no se crearon tablas, no se tocó `package_payload`/`installable_package` (escritura), no se activaron motores, no se creó CRM operativo, no se tocó `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Se agregó el cierre del Discovery dentro del Constructor base: un panel **"Terminé"** que construye un **snapshot `DiscoverySubmission`** usando el helper puro de 8a (`buildDiscoverySubmission`) y lo persiste en **`crm_setup_config.meta.discovery_submission`** reutilizando el **PATCH `meta` existente** de `/api/admin/constructor/setup`. No se creó ninguna API ni tabla, no se ejecutó SQL.

El snapshot incluye el `DiscoveryContext` completo (para revisión interna), `submitted_at`, `schema_version`, `source: "constructor_discovery"`, `status`, `completion_percent`, los blockers (`missing_critical_fields`, `engine_blockers`, `vertical_blockers`, `business_module_blockers`, y `quoting_blockers` **solo si el vertical declara módulo de costeo/cotización**), `human_review_required` y un `summary` legible. El botón **no activa motores, no genera paquete, no aprueba nada y no crea el CRM operativo**. Build OK; selftest 65/65.

---

## B. Archivos modificados

**Creados:**
- `components/constructor/DiscoveryFinishPanel.tsx` — UI mínima del cierre de Discovery (client component).
- `docs/constructor-crm/CONSTRUCTOR-DISCOVERY-8b-boton-termine-snapshot-confirmado.md` — este documento.

**Modificados:**
- `lib/constructor/discovery/discoveryContext.ts` — agregados `buildDiscoverySubmission`, `buildDiscoverySubmissionSummary`, tipos `DiscoverySubmission`/`BuildDiscoverySubmissionOptions`, `DISCOVERY_SUBMISSION_SCHEMA_VERSION`.
- `lib/constructor/discovery/index.ts` — reexporta el helper de snapshot y sus tipos.
- `lib/constructor/discovery/discoveryContext.selftest.ts` — caso G (snapshot): preview, sellado, vertical con pricing, determinismo.
- `app/admin/constructor-crm/cuestionario/page.tsx` — import + montaje de `<DiscoveryFinishPanel />` tras el `StepReadinessPanel` (2 líneas).

**No se modificó** `app/api/admin/constructor/setup/route.ts`: el PATCH `meta` existente ya acepta `{ step: "meta", data: { meta: {...} } }`.

---

## C. Qué hace el botón "Terminé"

1. Lee el setup actual (GET `/api/admin/constructor/setup`).
2. Arma el snapshot con `buildDiscoverySubmission(setup, { submittedAt, generatedAt })` (timestamp generado en el cliente y pasado al helper puro).
3. Hace **merge no destructivo** del `meta` existente + `discovery_submission` y lo persiste vía PATCH `{ step: "meta", data: { meta: mergedMeta } }`.
4. Muestra estado/blockers/summary en preview antes de cerrar, y un mensaje de éxito con `submitted_at` tras guardar.

---

## D. Qué NO hace

- No activa motores. No genera `package_payload`. No aprueba paquetes. No crea el CRM operativo.
- No ejecuta SQL ni crea tablas. No llama servicios externos ni envía emails.
- No escribe fuera de `crm_setup_config.meta`.

---

## E. Dónde se persiste el snapshot

En `crm_setup_config.meta.discovery_submission` (columna `meta` JSONB ya existente, una fila por instancia). Merge no destructivo: se conservan `source`, `setup_phase`, `created_by` y demás claves de `meta`.

---

## F. Estructura de `meta.discovery_submission`

```jsonc
{
  "schema_version": "1.0.0",
  "source": "constructor_discovery",
  "submitted_at": "2026-05-31T12:00:00.000Z",   // null en preview
  "status": "draft | in_review | confirmed | needs_rework",
  "completion_percent": 0-100,
  "human_review_required": true|false,
  "missing_critical_fields": ["..."],
  "engine_blockers": ["..."],
  "vertical_blockers": ["..."],
  "business_module_blockers": ["modulo:campo", "..."],
  "quoting_blockers": ["modulo:campo"],          // SOLO si el vertical declara módulo pricing/costing
  "summary": "texto legible para revisión interna",
  "discovery_context": { /* DiscoveryContext completo de 8a */ }
}
```

---

## G. Relación con DiscoveryContext 8a

`buildDiscoverySubmission` invoca `buildDiscoveryContextFromSetup` (8a) y envuelve su salida con metadatos de submission + resumen. Vive en el mismo módulo autocontenido `discoveryContext.ts` (decisión deliberada): así el selftest corre con `node --experimental-strip-types` sin cadenas de import con extensión `.ts` que romperían el build. El snapshot embebe el `DiscoveryContext` íntegro para trazabilidad.

---

## H. Relación con package_payload

Ninguna escritura. El snapshot es **previo** al paquete; sus blockers (`missing_critical_fields`, `*_blockers`) serán la base para que una fase futura decida "apto/no apto para piloto". Solo datos `confirmed` deberían viajar luego al `package_payload`; esta fase no lo toca.

---

## I. Relación con motores

El cierre no activa ningún motor. El snapshot informa `allowed_engines`/`blocked_engines` (vía el `discovery_context`) y `human_review_required`, pero la activación real de motores es una fase aparte que **leerá** estos bloqueos.

---

## J. Relación con módulos por vertical

El snapshot respeta la corrección conceptual: `business_module_blockers` refleja los módulos requeridos no satisfechos, y `quoting_blockers` **solo aparece** si el vertical declara un módulo pricing/costing/quotation. Hoy el setup aún no captura `businessModules` (eso llega en una fase de presets por vertical); mientras tanto el snapshot refleja el estado sin módulos declarados, de forma honesta.

---

## K. Validaciones realizadas

- `npm run build` → **EXIT 0**, `✓ Compiled successfully` (type-check incluido; component y helper OK).
- Selftest `discoveryContext.selftest.ts` (8a + 8b) → **65/65 passed**.
- `git diff --check` → limpio.
- Inspección: el botón solo hace GET + PATCH meta; no toca otras tablas/endpoints.

---

## L. Riesgos pendientes

- El panel cierra el Discovery sobre **datos persistidos** (no sobre ediciones del cuestionario sin guardar). El copy lo aclara; conviene refrescar antes de cerrar.
- `meta` se reemplaza completo en el PATCH (rama meta): el cliente hace merge no destructivo, pero dos cierres concurrentes podrían pisarse (caso poco probable en uso interno single-row).
- Aún no hay historial de submissions (solo el último snapshot en `meta`); historial migraría a una tabla `discovery_submissions` (con SQL) en una fase futura.
- `businessModules` todavía no se capturan en el setup; el snapshot los refleja vacíos hasta la fase de presets por vertical.

---

## M. Próximos pasos

1. **CONSTRUCTOR-DISCOVERY-8c** — capturar como datos tipados los campos hoy faltantes (moneda, zonas, servicios, costos) y los `businessModules` por vertical.
2. **CONSTRUCTOR-VERTICALS-1** — catálogo de presets de módulos por vertical.
3. **CONSTRUCTOR-RUNTIME-1** — consumo del `package_payload` derivado solo de datos `confirmed`.

---

## N. Confirmaciones de alcance

- ✅ Existe acción "Terminé" para cerrar el Discovery.
- ✅ El snapshot se genera con `buildDiscoverySubmission` (sobre `buildDiscoveryContextFromSetup`).
- ✅ Se persiste en `meta.discovery_submission` vía PATCH existente.
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos externos.
- ✅ NO se tocó `package_payload` como escritura · NO se tocó `installable_package` como escritura.
- ✅ NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ Build OK · Selftest 8a/8b OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
