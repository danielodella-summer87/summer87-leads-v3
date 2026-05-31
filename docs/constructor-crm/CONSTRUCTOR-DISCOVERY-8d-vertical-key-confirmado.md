# CONSTRUCTOR-DISCOVERY-8d — Selección explícita y persistencia de vertical_key confirmado

> **Tipo:** UI mínima + persistencia (selección manual de vertical, reuso del PATCH meta).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-DISCOVERY-8c-cableado-verticales-snapshot.md` (commit `c618be9`).
> **Alcance:** Convertir el vertical detectado automáticamente en una decisión explícita, visible y persistida del instalador. NO se ejecutó SQL, no se crearon tablas, no se tocó `package_payload`/`installable_package` (escritura), no se activaron motores, no se creó CRM operativo, no se tocó `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El cierre de Discovery ahora permite **elegir y confirmar** el vertical en vez de depender solo de la inferencia automática. El `DiscoveryFinishPanel` muestra un selector con los 5 verticales (`generic`, `cleaning_services`, `pickup_4x4`, `marketing_agency`, `education`), indica si el vertical fue **detectado**, **seleccionado manualmente (sin confirmar)** o **confirmado**, y persiste la decisión en **`crm_setup_config.meta.vertical_key`** vía el PATCH `meta` existente. El snapshot usa el vertical efectivo: confirmado/seleccionado si existe, detección automática como fallback.

No se crearon APIs ni tablas: se reutiliza `PATCH /api/admin/constructor/setup` con `step: "meta"`. La prioridad de resolución ya estaba en `detectVerticalKey` (`meta.vertical_key` conocido gana sobre el rubro), por lo que el vertical confirmado fluye solo al snapshot. Selftests: VerticalCatalog **46/46**, DiscoveryContext **65/65**, build EXIT 0.

---

## B. Archivos modificados

**Modificados:**
- `components/constructor/DiscoveryFinishPanel.tsx` — selector de vertical, estado (detectado/manual/confirmado), acción "Confirmar vertical" (persiste `meta.vertical_key`), y `Terminé` que persiste también `vertical_key` junto al snapshot.
- `lib/constructor/verticals/verticalCatalog.selftest.ts` — caso J: `meta.vertical_key` confirmado prevalece sobre el rubro (end-to-end).

**Creados:** `docs/constructor-crm/CONSTRUCTOR-DISCOVERY-8d-vertical-key-confirmado.md` (este documento).

**No modificados:** `verticalCatalog.ts` (la prioridad `meta.vertical_key` ya existía en `detectVerticalKey` desde 8c), `discoveryContext.ts`, API, SQL, `tsconfig.json`.

---

## C. Selección y estado del vertical

El panel calcula:
- `autoDetected`: sugerencia basada solo en el rubro/giro (`detectVerticalKey({ empresa })`).
- `verticalKey` efectivo: `selectedVertical` (override del instalador) si existe; si no, `autoDetected`.
- `source`: `confirmed` (persistido en `meta.vertical_key` y coincide), `manual` (seleccionado, sin confirmar) o `detected` (automático).

El selector lista los 5 verticales con su label. Al cambiar, el estado pasa a `manual` hasta confirmar.

---

## D. Persistencia de vertical_key

- **"Confirmar vertical"**: PATCH `{ step: "meta", data: { meta: { ...meta, vertical_key } } }` (merge no destructivo). Marca el vertical como confirmado.
- **"Terminé"**: persiste en el mismo merge `vertical_key` **y** `discovery_submission`, dejando ambos como decisión sellada.
- Al cargar (`loadSetup`), si `meta.vertical_key` es una key conocida, el selector se inicializa con ella y el estado es `confirmed`.

Todo en `crm_setup_config.meta`; sin tablas nuevas ni SQL.

---

## E. Resolución efectiva (confirmado → fallback)

`detectVerticalKey` (8c) resuelve en orden: (1) `verticalKey` explícito, (2) `empresa.vertical`/`meta.vertical_key` conocidos, (3) keywords del rubro, (4) `generic`. Por eso un `meta.vertical_key` confirmado **prevalece sobre el rubro**. En el panel, el override local del selector tiene además precedencia visual inmediata; al confirmar/cerrar se persiste y queda como fuente de verdad.

---

## F. Qué cambia en el botón "Terminé"

- Usa el vertical **efectivo** (confirmado/seleccionado o detectado) para armar el snapshot.
- Persiste `meta.vertical_key` junto al `meta.discovery_submission`, dejando la decisión del instalador registrada aunque no haya pulsado "Confirmar vertical" por separado.

---

## G. Qué NO hace

- No crea tablas ni ejecuta SQL; no crea APIs (reusa PATCH meta).
- No escribe `package_payload`/`installable_package`; no activa motores; no crea CRM operativo.
- No hace UI grande (un `<select>` + un botón + chip de estado).
- No asume país/moneda; el fallback sigue siendo `generic` (sin pricing).

---

## H. Relación con package_payload / motores / módulos por vertical

Igual que en 8c: el snapshot (con el vertical confirmado y sus módulos) es insumo previo; no toca el `package_payload` ni activa motores. La corrección conceptual se mantiene: `quoting_blockers` solo si el vertical confirmado incluye un módulo pricing (por defecto, `cleaning_services`).

---

## I. Validaciones realizadas

- `node --experimental-strip-types lib/constructor/verticals/verticalCatalog.selftest.ts` → **46/46** (caso J: rubro sugiere cleaning, `meta.vertical_key=pickup_4x4` confirmado gana → snapshot sin `quoting_blockers`; sin confirmar → fallback cleaning con `quoting_blockers`).
- `node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts` → **65/65** (sin regresión).
- `npm run build` → **EXIT 0**, `✓ Compiled successfully`.
- `git diff --check` → limpio.

---

## J. Riesgos pendientes

- El selector es UI mínima; no hay aún edición fina de módulos por vertical (mejora futura antes de generar el paquete).
- El panel opera sobre datos persistidos del setup (no ediciones sin guardar), igual que 8b/8c.
- `meta.vertical_key` se guarda como string libre validado contra `VERTICAL_KEYS`; valores ajenos se ignoran (fallback seguro).
- La rama `meta` del PATCH reemplaza `meta` completo; el cliente hace merge no destructivo (riesgo bajo en uso single-row).

---

## K. Próximos pasos

1. (Opcional) Edición fina de módulos del vertical antes de generar el paquete.
2. **CONSTRUCTOR-RUNTIME-1** — consumo del `package_payload` derivado solo de datos `confirmed`, usando el vertical confirmado.

---

## L. Confirmaciones de alcance

- ✅ El panel muestra el vertical detectado y permite seleccionar/cambiar entre los 5 verticales.
- ✅ `vertical_key` confirmado se persiste en `crm_setup_config.meta.vertical_key`.
- ✅ El snapshot usa el `vertical_key` confirmado/efectivo; fallback a detección automática.
- ✅ NO se ejecutó SQL · NO se crearon tablas · NO se tocaron datos externos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se hizo UI grande.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ Build OK · Selftests OK.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
