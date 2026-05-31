# CONSTRUCTOR-DISCOVERY-8c — Cableado de vertical_key y catálogo al snapshot Discovery

> **Tipo:** Cableado mínimo (detección de vertical + uso del catálogo en el cierre de Discovery).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-VERTICALS-1-catalogo-modulos-por-vertical.md` (commit `7bf3d7b`).
> **Alcance:** Conectar el catálogo de verticales (VERTICALS-1) al botón "Terminé" (8b) para que el snapshot use módulos por vertical automáticamente. NO se ejecutó SQL, no se crearon tablas, no se tocó `package_payload`/`installable_package` (escritura), no se activaron motores, no se creó CRM operativo, no se tocó `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El cierre de Discovery ahora es **vertical-aware**. El `DiscoveryFinishPanel` detecta el `vertical_key` desde el setup persistido, lo resuelve contra el catálogo (VERTICALS-1) y pasa `businessModules` + `verticalRequiredFields` + `verticalFields` a `buildDiscoverySubmission`. El snapshot resultante incluye los módulos del vertical y respeta la corrección conceptual: **`cleaning_services` puede generar `quoting_blockers`; `pickup_4x4`, `marketing_agency`, `education` y `generic` no**, salvo que se agregue un módulo pricing explícito.

La detección es una **función pura** nueva (`detectVerticalKey`) en el catálogo, con fallback seguro a `generic`. No se crearon APIs ni tablas: el snapshot se sigue persistiendo en `crm_setup_config.meta.discovery_submission` vía el PATCH `meta` existente. Selftests: VerticalCatalog **42/42**, DiscoveryContext **65/65**, build EXIT 0.

---

## B. Archivos modificados

**Modificados:**
- `lib/constructor/verticals/verticalCatalog.ts` — agregada `detectVerticalKey(input)` + tipo `DetectVerticalInput`.
- `lib/constructor/verticals/index.ts` — reexporta `detectVerticalKey` y `DetectVerticalInput`.
- `lib/constructor/verticals/verticalCatalog.selftest.ts` — caso I (cableado end-to-end rubro → vertical → snapshot, 13 checks).
- `components/constructor/DiscoveryFinishPanel.tsx` — detecta vertical, arma input con el catálogo, lo usa en preview y "Terminé", y muestra el vertical detectado + sus módulos.

**Creados:** `docs/constructor-crm/CONSTRUCTOR-DISCOVERY-8c-cableado-verticales-snapshot.md` (este documento).

**No modificados:** `discoveryContext.ts`, API, SQL, `tsconfig.json` (la exclusión `**/*.selftest.ts` ya cubre el selftest).

---

## C. Cómo se detecta vertical_key

`detectVerticalKey({ verticalKey?, empresa?, meta? })`, pura y conservadora, en orden:
1. `verticalKey` explícito del caller si es una key conocida.
2. `empresa.vertical` o `meta.vertical_key` si son keys conocidas.
3. Mapeo por palabras clave (normalizado, sin acentos, lowercase) sobre `empresa.vertical` / `rubro` / `rubroPersonalizado` / `giro`:
   - limpieza/cleaning/facility/aseo/higiene → `cleaning_services`
   - pickup/4x4/vehículo/repuesto/automotriz/concesionario → `pickup_4x4`
   - marketing/agencia/publicidad/comunicación/branding → `marketing_agency`
   - educación/colegio/instituto/universidad/inscripción/escuela/academia → `education`
4. Sin match seguro → `generic` (fallback). No asume país, moneda, Casa Limpia ni Pickup.

---

## D. Cómo se resuelve el catálogo

`buildDiscoveryContextInputForVertical(baseInput, verticalKey)` (VERTICALS-1) resuelve la definición (con fallback `generic`) y devuelve un `DiscoverySetupInput` con `verticalKey`, `businessModules` (presets + extras del caller), `verticalRequiredFields` (unión) y `verticalFields` (defaults + extras), sin mutar el `baseInput`.

---

## E. Cómo se pasan módulos al snapshot

El panel arma `vertical.input = buildDiscoveryContextInputForVertical(rowToSetupInput(row), detectVerticalKey(...))` y llama `buildDiscoverySubmission(vertical.input, opts)`. El submission (8b) deriva el `DiscoveryContext` con los módulos del vertical y calcula `business_module_blockers` y, si corresponde, `quoting_blockers`.

---

## F. Qué cambia en el botón "Terminé"

- El preview y el guardado usan el input **vertical-aware** (antes era el setup crudo sin módulos).
- El preview muestra ahora: **vertical detectado** (label + key), **módulos del vertical**, y los bloqueos existentes, con la aclaración "Los módulos se derivan del vertical detectado. Podrán ajustarse luego antes de generar el paquete instalable."
- El snapshot persistido en `meta.discovery_submission` ya incluye `business_modules` evaluados y los blockers por vertical.

---

## G. Qué NO hace

- No crea selector visual complejo de vertical (detección automática + display; el ajuste manual llega en una fase futura).
- No escribe `package_payload` ni `installable_package`; no activa motores; no crea CRM operativo.
- No ejecuta SQL ni crea tablas; no toca datos externos; no asume país/moneda/vertical sin evidencia.

---

## H. Relación con package_payload

Ninguna escritura. El snapshot (con módulos por vertical y blockers) es insumo previo; una fase futura usará los blockers para decidir "apto/no apto para piloto" antes de derivar el `package_payload` solo de datos `confirmed`.

---

## I. Relación con motores

El cierre no activa motores. El snapshot informa `allowed_engines`/`blocked_engines` y `human_review_required` (vía el `discovery_context`); la activación real es una fase aparte que leerá estos bloqueos.

---

## J. Relación con módulos por vertical

Es el núcleo de esta fase: el snapshot ahora refleja los módulos del vertical detectado. `quoting_blockers` aparece solo cuando el vertical incluye un módulo pricing/costing/quotation (por defecto, solo `cleaning_services`) o cuando se agrega uno explícito.

---

## K. Validaciones realizadas

- `node --experimental-strip-types lib/constructor/verticals/verticalCatalog.selftest.ts` → **42/42** (incluye caso I: limpieza→quoting presente; pickup/marketing/education/generic→quoting undefined; pickup+pricing explícito→quoting presente; `empresa.vertical` gana sobre rubro; no mutación).
- `node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts` → **65/65** (sin regresión).
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.

---

## L. Riesgos pendientes

- La detección es por palabras clave: rubros ambiguos podrían caer a `generic` (fallback seguro, sin pricing). Aceptable; un selector manual de vertical es mejora futura.
- El panel cierra sobre **datos persistidos**; ediciones del cuestionario sin guardar no se reflejan hasta guardar (igual que 8b).
- `vertical_key` aún no se persiste como campo propio del setup; se detecta on-the-fly y queda dentro del `discovery_context` del snapshot. Persistirlo explícito sería una mejora.
- Los campos verticales por defecto entran como `pending` → generan `business_module_blockers` hasta capturarse (comportamiento honesto).

---

## M. Próximos pasos

1. (Opcional) Selector manual de vertical en el Constructor para override de la detección.
2. (Opcional) Persistir `vertical_key` como campo del setup (`meta.vertical_key`).
3. **CONSTRUCTOR-RUNTIME-1** — consumo del `package_payload` derivado solo de datos `confirmed`.

---

## N. Confirmaciones de alcance

- ✅ `DiscoveryFinishPanel` usa el catálogo de verticales.
- ✅ El snapshot incluye módulos por vertical; `cleaning_services` puede generar `quoting_blockers`; pickup/marketing/education/generic no.
- ✅ Fallback seguro a `generic`; no se asume país/moneda/vertical sin evidencia.
- ✅ No se modificó UI grande (detección automática + display mínimo).
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos externos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
