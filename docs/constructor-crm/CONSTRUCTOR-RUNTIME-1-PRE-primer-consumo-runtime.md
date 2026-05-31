# CONSTRUCTOR-RUNTIME-1-PRE — Diseño del primer consumo runtime del Constructor CRM

> **Tipo:** Diagnóstico + diseño + documentación (fase PRE, sin implementación).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-DISCOVERY-8d-vertical-key-confirmado.md` (commit `0349e1b`).
> **Alcance:** Diseñar el primer corte mínimo y seguro para que el CRM operativo consuma configuración **derivada del Constructor**. NO se modificó código/UI, no se ejecutó SQL, no se tocaron datos, `package_payload` (escritura), motores, `.env.local` ni proyectos externos. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

El CRM operativo **ya consume configuración en runtime** —campos de lead, etapas de pipeline, visibilidad de ficha y whitelist de persistencia— pero esa config proviene de la **config estática `pickup4x4` seleccionada por env** (`getActiveCrmPackageConfigFromEnvironment`), **no** del output confirmado del Constructor (`meta.vertical_key` + `meta.discovery_submission`). El sidebar, por su parte, filtra solo por `APP_MODE` y **no tiene conciencia de vertical**.

Por lo tanto, el "primer consumo runtime" no es construir una superficie nueva de consumo: es **conectar la decisión confirmada del Constructor con el runtime**, eligiendo el punto de menor riesgo. La auditoría indica que el área de **campos de lead / pipeline / persistencia ya funciona y es la más riesgosa de re-cablear** (sostiene la demo Pickup 4x4 en `client_crm` y la persistencia de `contract_fields_json`). En cambio, el **sidebar por vertical es aditivo, read-only y de bajo radio de impacto**.

**Recomendación (una sola):** primer corte = **B. Módulos visibles del sidebar derivados del `vertical_key` confirmado**, como capa **read-only y fail-open** (si no hay vertical/confirmación, comportamiento actual intacto). Es reusable para todos los verticales, ejercita el puente Constructor→runtime de punta a punta y no toca el camino de leads/contract-fields. El re-cableado de campos de lead desde el Constructor (en lugar de la config estática) queda como **segundo** corte, una vez establecido el puente.

> Matiz sobre la recomendación inicial del pedido ("campos de Lead + módulos visibles"): los **campos de Lead ya se consumen** hoy (vía la config estática Pickup), así que ahí el trabajo real es *re-sourcing* (más riesgoso). Los **módulos del sidebar NO son vertical-aware** todavía, por lo que son el primer corte más seguro y de mayor valor incremental.

---

## B. Estado Git inicial

```
Rama: * main  0349e1b [origin/main]  (sincronizada, working tree limpio)
```
`git log --oneline -6`:
```
0349e1b feat(constructor): add DISCOVERY-8d confirmed vertical selection
c618be9 feat(constructor): wire vertical catalog into discovery snapshot
7bf3d7b feat(constructor): add VERTICALS-1 vertical module catalog
4c3d0a9 feat(constructor): add DISCOVERY-8b confirmed discovery snapshot
7525422 feat(constructor): add DISCOVERY-8a universal DiscoveryContext helper
07991dd docs(constructor): define DISCOVERY-8 PRE DiscoveryContext
```

---

## C. Diagnóstico del runtime actual

**Lo que YA lee `crmPackage`/config en runtime:**
- `app/admin/leads/layout.tsx` → `getActiveCrmPackageConfigFromEnvironment()` + adapters (`packageToLeadFields`, `packageToPipelineStages`, `packageToLeadDetailVisibility`) → provee `leadFields`/`pipelineStages`/`leadDetailVisibility` a las páginas vía `LeadsClientCrmProvider`.
- `app/api/admin/leads/route.ts` y `app/api/admin/leads/[id]/route.ts` → `getActiveCrmPackageConfigFromEnvironment()` + `leadFieldPersistence` (whitelist/sanitización de `contract_fields_json`).

**De dónde sale esa config hoy:** `getActiveCrmPackageConfigFromEnvironment()` resuelve la config **solo si `clientSlug === "pickup4x4"`** (la config local estática `pickup4x4.config.ts`); para cualquier otro slug devuelve `null` y los adapters caen a un **fallback neutro** (logrado en CLEAN-1B). **No** lee `meta.vertical_key` ni `meta.discovery_submission`.

**Qué depende de `pickup4x4.config.ts`:** es la única config local; alimenta los adapters de leads cuando el env declara `CLIENT_SLUG=pickup4x4` en `client_crm`.

**¿`getActiveCrmPackageConfig` existe?** Sí, parametrizado por `clientSlug`/`appMode`, fallback `null`, contrato `ok/config/source/errors`.

**¿El CRM operativo ya varía por `clientSlug`/`appMode`?** Sí, pero **solo** entre "pickup4x4" y "neutro". No varía por vertical del Constructor.

**Sidebar:** `lib/admin/adminSidebarModules.ts` filtra por `APP_MODE` (oculta internos en `client_crm`). **No** tiene conciencia de `vertical_key` ni de `business_modules`.

**Más seguro para un primer consumo runtime:** el **sidebar** (presentacional, aditivo, los guards reales siguen en layout/API por SEPARATION-1).

**Riesgoso de tocar ahora:** el camino **leads layout/API + leadFieldPersistence**, porque sostiene la demo Pickup y la persistencia de `contract_fields_json`; re-cablear su fuente puede romper datos/UX en uso.

---

## D. Evaluación de candidatos

### A. Campos de Lead configurables
- **Beneficio:** alto; núcleo del CRM por vertical.
- **Riesgo:** **alto** — ya consumido por layout + API + persistencia; re-sourcing desde el Constructor puede romper la demo Pickup y la whitelist de `contract_fields_json`.
- **Archivos impactados:** `leads/layout.tsx`, `leads/[id]/page.tsx`, `api/admin/leads/*`, adapters `leadFields`/`leadFieldPersistence`.
- **Complejidad:** media-alta. **Reusable:** sí. **Sirve para CL/Pickup/agencia/educación:** sí.
- **Veredicto:** valioso pero **segundo** corte (tras tener el puente).

### B. Módulos visibles del sidebar  ⟵ **RECOMENDADO**
- **Beneficio:** alto y transversal; alinea la navegación con el vertical confirmado.
- **Riesgo:** **bajo** — presentacional; los guards de seguridad permanecen en layout/API. Fail-open: sin vertical/confirmación, comportamiento actual.
- **Archivos impactados:** `lib/admin/adminSidebarModules.ts` (filtro), `app/admin/layout.tsx` (pasar señal de vertical), + un resolver read-only nuevo.
- **Complejidad:** baja. **Reusable:** sí (catálogo vertical→módulos ya existe).
- **Veredicto:** **primer corte**.

### C. Pipeline/etapas
- **Beneficio:** alto. **Riesgo:** medio-alto — ya consumido por la ficha/kanban vía adapters; re-sourcing afecta vistas y filtros en uso.
- **Archivos:** `leads/layout.tsx`, ficha, `pipelineStages` adapter.
- **Complejidad:** media. **Veredicto:** después de campos de lead.

### D. Ficha de Lead (visibilidad de secciones)
- **Beneficio:** medio. **Riesgo:** medio — ya consumido (`leadDetailVisibility`); re-sourcing cambia tabs/bloques visibles.
- **Archivos:** `leads/[id]/page.tsx`, `leadDetailVisibility` adapter.
- **Complejidad:** media. **Veredicto:** acompaña a campos de lead, no primero.

### E. Roles/permisos — **NO primero**
Tocan auth/seguridad; un error expone o bloquea de más. Requieren la matriz rol×permisos consumida en runtime (no existe). Alto riesgo, fuera de un primer corte seguro.

### F. Reportes — **NO primero**
Dependen de que campos/pipeline ya estén consumidos desde el Constructor; sin esa base, reportes derivados serían inconsistentes. Valor tardío.

### G. Motores IA — **NO primero**
Por diseño (REBASE-2/DISCOVERY-8): los motores sensibles no operan sin DiscoveryContext confirmado y siguen mock. Activarlos ahora viola el principio "read-only antes de escritura".

---

## E. Arquitectura recomendada

**Fuente de la config runtime (capa intermedia read-only):** introducir —en una fase de implementación posterior— un resolver fino `getConstructorRuntimeConfig()` que lea:
1. `crm_setup_config.meta.vertical_key` (decisión **confirmada** del instalador, 8d).
2. El **catálogo de verticales** (VERTICALS-1) para resolver `business_modules` del vertical.
3. Opcionalmente `meta.discovery_submission.discovery_context` para conocer qué módulos están `enabled` (todos sus `required_fields` `confirmed`).

**Por qué una capa intermedia y no `package_payload`:** el `package_payload`/`installable_package` no se consume hoy y está fuera de alcance como escritura; `discovery_submission` ya existe y es el output confirmado natural. La capa intermedia desacopla el runtime de la forma exacta del snapshot y permite fallback neutro.

**Qué puede consumirse ahora:** `vertical_key` confirmado + módulos del catálogo (datos estáticos de presets) + módulos `enabled` del snapshot.
**Qué debe seguir solo como `confirmed`:** cualquier dato de negocio (campos, moneda, costos) — nunca `pending`/`estimated`.
**Qué NO consumir todavía:** roles/permisos, reportes, motores, y el re-sourcing de campos de lead (segundo corte).

**Cómo evitar que `pending`/`estimated` entren como `confirmed`:** el resolver solo expone (a) `vertical_key` (confirmado por definición) y (b) módulos con `enabled === true` (sus `required_fields` están `confirmed`). Los módulos bloqueados se tratan como **ocultos/deshabilitados**, nunca activos. Ningún campo `pending`/`estimated` se promueve a comportamiento.

---

## F. Primer corte mínimo recomendado (para CONSTRUCTOR-RUNTIME-1)

- **Objetivo:** que el sidebar del CRM operativo refleje los módulos del **vertical confirmado**, de forma read-only y fail-open.
- **Alcance:** solo visibilidad de módulos en `client_crm`; sin tocar guards de seguridad, sin escritura, sin campos de lead.
- **Archivos probables:** nuevo `lib/constructor/runtime/getConstructorRuntimeConfig.ts` (puro, + selftest), señal de vertical en `app/admin/layout.tsx`, refinamiento aditivo en `lib/admin/adminSidebarModules.ts`.
- **Datos de entrada:** `meta.vertical_key` (confirmado) + catálogo vertical + (opcional) módulos `enabled` del snapshot.
- **Fallback:** si no hay `vertical_key` confirmado o no hay config → **comportamiento actual del sidebar** (fail-open, no se oculta nada de más).
- **Criterio de aceptación:** con `vertical_key=cleaning_services` confirmado, el sidebar muestra los módulos del vertical; sin confirmación, idéntico a hoy; los guards de SEPARATION-1 siguen bloqueando el Constructor en `client_crm`.
- **Validación manual:** alternar `meta.vertical_key` y verificar el menú; verificar que `client_crm` sigue sin ver el Constructor.
- **Riesgos:** bajos (presentacional); el único cuidado es no ocultar módulos operativos por error → por eso fail-open y aditivo.

---

## G. Datos que pueden consumirse

- `meta.vertical_key` (confirmado, 8d).
- `business_modules` del **catálogo** (presets estáticos) para el vertical.
- Del `discovery_submission`: módulos con `enabled === true` (todos sus `required_fields` `confirmed`).

## H. Datos que NO deben consumirse (todavía)

- Campos/valores en estado `pending` o `estimated`.
- `engine_blockers`/`quoting_blockers`/`business_module_blockers` como habilitadores (son señales de bloqueo, no de activación).
- Roles/permisos, reportes, motores.
- `package_payload`/`installable_package` (ni lectura para comportamiento ni escritura).

---

## I. Relación con DiscoveryContext

El runtime consumirá **solo el resultado confirmado** del DiscoveryContext (snapshot 8b): vertical confirmado y módulos `enabled`. Los estados de dato (`confirmed`/`estimated`/`pending`) del 8a son la garantía de que nada no validado llega al runtime.

## J. Relación con vertical_key y módulos por vertical

`vertical_key` (8d) es la llave de entrada; el catálogo (VERTICALS-1) traduce vertical→módulos. El primer corte (sidebar) es el primer consumidor real de esta cadena, validando el puente Constructor→runtime sin riesgo de datos.

## K. Relación con package_payload

Ninguna en esta fase ni en el primer corte. El `package_payload` sigue sin consumirse y sin escribirse; la capa intermedia usa `discovery_submission`/catálogo, no el paquete instalable.

---

## L. Riesgos

1. Re-cablear campos de lead/persistencia primero rompería la demo Pickup → por eso es **segundo** corte.
2. Ocultar módulos operativos por error en el sidebar → mitigado con fail-open + aditivo.
3. Consumir módulos bloqueados como activos → mitigado consumiendo solo `enabled`.
4. Acoplar el runtime a la forma del snapshot → mitigado con la capa intermedia `getConstructorRuntimeConfig`.

---

## M. Próximo bloque recomendado

**CONSTRUCTOR-RUNTIME-1** — implementar el resolver read-only `getConstructorRuntimeConfig()` (puro + selftest) y el **sidebar por vertical confirmado** (aditivo, fail-open), sin tocar leads/contract-fields, sin SQL, sin escritura. Segundo corte posterior: **RUNTIME-2** (re-sourcing de campos de lead desde el Constructor con fallback neutro).

---

## N. Confirmaciones de alcance

- ✅ Existe el documento CONSTRUCTOR-RUNTIME-1-PRE.
- ✅ Queda claro el primer consumo runtime recomendado (sidebar por vertical) y por qué no motores/roles/reportes.
- ✅ Queda claro qué datos pueden usarse y cuáles no, y cómo evitar `pending`/`estimated` como `confirmed`.
- ✅ NO se modificó código funcional · NO se modificó UI.
- ✅ NO se ejecutó SQL · NO se tocaron datos.
- ✅ NO se tocó `package_payload` como escritura · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
- ✅ Índices NO actualizados (preferencia de esta fase).
