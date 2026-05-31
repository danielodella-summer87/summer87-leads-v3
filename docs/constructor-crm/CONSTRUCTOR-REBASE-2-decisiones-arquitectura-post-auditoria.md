# CONSTRUCTOR-REBASE-2 — Decisiones de arquitectura del Constructor CRM post auditoría

> **Tipo:** Decisiones de arquitectura + documentación (solo lectura sobre el código).
> **Fecha:** 2026-05-31.
> **Predecesor:** `CONSTRUCTOR-REBASE-1-auditoria-estado-real-post-casalimpia.md` (commit `319ce61`).
> **Alcance:** Definir el orden seguro de implementación. NO se modificó código, UI, SQL, datos, auth, middleware ni `.env.local`. NO se tocó `casalimpia-crm-inteligente` ni `summer87-leads-ecuador`. NO hay deploy/commit/push.
> **Principio rector:** No implementar todavía. Dejar decisiones claras para que las próximas fases sean pequeñas, seguras y auditables.

---

## A. Resumen ejecutivo

REBASE-1 mostró que el Constructor está avanzado en diseño pero con tres deudas que se cruzan: **flags de prototipo que bajan seguridad**, **contrato que no se consume en runtime**, y **acoplamientos a Pickup 4x4 / facility legacy**. La buena noticia que confirma esta fase: **la infraestructura para resolver casi todo ya existe** y solo hay que "enchufarla", no construirla desde cero.

Hallazgos arquitectónicos que cambian la estrategia:

1. **`lib/config/appMode.ts` ya es un sistema de gobierno por modo maduro**: lee `APP_MODE`/`CLIENT_SLUG` de env, define defaults por modo (`getModeFlagDefaults`), y fuerza superficies internas a `false` en `client_crm` (fail-safe). Los 4 flags de prototipo NO usan este sistema: son `const … = true` hardcodeados en cada archivo. **La decisión es migrarlos a ese patrón, no inventar uno nuevo.**
2. **La separación ya tiene dos capas reales**: `app/admin/constructor-crm/layout.tsx` redirige a `/403` en `client_crm`, y `guardConstructorApiByMode()` (`lib/admin/constructorApiAccess.ts`) devuelve 403 en las APIs del Constructor en `client_crm`. Lo que falta es **auth real** (hoy bypasseada) y **guards de menú**.
3. **`getActiveCrmPackageConfig()` ya está parametrizado** por `clientSlug`/`appMode` y es testeable sin DB. El único acoplamiento es el literal `PICKUP4X4_CLIENT_SLUG` y el `import` de la única config. Un loader dinámico se puede agregar **sin cambiar la firma pública**.
4. **`readiness/types.ts` ya tiene `QualityStatus` (`good|warning|danger|neutral`)**, base directa para la distinción confirmado/pendiente/estimado del `DiscoveryContext`.

**Decisión de secuencia:** el próximo bloque inmediato es **CONSTRUCTOR-SECURITY-1** (gobernar los 4 flags vía env, off por defecto en prod, sin cambiar comportamiento local). Es el cambio más pequeño, más seguro, reversible, y desbloquea poder exponer el Constructor sin riesgo. Todo lo demás (DiscoveryContext, separación completa, consumo runtime, loader dinámico) viene después, en bloques chicos y auditables.

---

## B. Estado Git inicial

```
Directorio: /Users/danielodella/PROYECTOS/summer87-leads-v3
git status --short:  (working tree limpio)
Rama: * main  319ce61 [origin/main]  (sincronizada)
```

`git log --oneline -10`:
```
319ce61 docs(constructor): add REBASE-1 post Casa Limpia audit
389630a Document Casa Limpia local clone validation
1bc7f0f Document Casa Limpia local clone procedure
d6b79b4 Document Casa Limpia pre-clone Go No-Go checklist
6a99859 Document Casa Limpia seed users and permissions
36b80a5 Document Casa Limpia clean clone technical plan
2924dd6 Document Casa Limpia CRM contract
7ddf4ad Document Casa Limpia read-only audit
458d17a Document facility UI survey diagnosis
3fd4a82 Document facility legacy naming QA
```

Ramas backup locales intactas (`backup/error-auditoria-*`).

---

## C. Decisiones sobre flags de prototipo

**Marco común para los 4 flags.** Hoy son `const FLAG = true` hardcodeados. La decisión transversal es: **deben seguir existiendo como compuerta, pero pasar a leerse de env mediante el patrón de `lib/config/appMode.ts`** (`readFirstEnv` + `parseEnvBoolean`), con **default seguro `false` en producción** y posibilidad de `true` solo en local/prototipo. Ninguno se toca en esta fase; la implementación es CONSTRUCTOR-SECURITY-1.

Regla de seguridad adicional: cualquiera de estos bypass debe quedar **forzado a off cuando `NODE_ENV === "production"`**, sin importar la env var (doble llave), para que un error de configuración no exponga el Constructor.

### C.1 `CONSTRUCTOR_AUTH_BYPASS` (`middleware.ts:48`)
- **Riesgo actual:** ALTO. Abre todo el árbol `/admin/constructor` y `/api/admin/constructor` **sin login**. Es el riesgo de exposición #1.
- **¿Debe seguir existiendo?** Sí, como conveniencia de desarrollo local únicamente.
- **¿A env?** Sí → `CONSTRUCTOR_AUTH_BYPASS` / `SUMMER87_CONSTRUCTOR_AUTH_BYPASS`.
- **Valor local:** `true` permitido (prototipo).
- **Valor producción:** `false` forzado (y forzado off por `NODE_ENV==="production"`).
- **Criterio de aceptación futuro:** con la env en off, abrir cualquier ruta del Constructor sin sesión válida redirige a `/login`; con sesión válida y rol habilitado, entra. Tests: ruta directa sin cookie → `/login`.
- **No tocar en esta fase:** no editar `middleware.ts` ni el orden de chequeos (bypass → crm_session → login → RBAC).

### C.2 `CONSTRUCTOR_ASSIST_AUTH_BYPASS` (`assist/route.ts:53`)
- **Riesgo actual:** MEDIO. El endpoint es mock (no llama IA real, no escribe), pero queda accesible sin sesión. El propio archivo ya tiene `hasConstructorAssistAccess()` listo para usarse.
- **¿Debe seguir existiendo?** Sí, atado al mismo control que C.1.
- **¿A env?** Sí, misma convención.
- **Valor local:** `true` permitido. **Producción:** `false` forzado.
- **Criterio de aceptación futuro:** sin sesión válida → 401/403; el camino real ya está escrito en `hasConstructorAssistAccess()`. Antes de conectar IA real (OpenAI), exigir permiso `constructor.assist` (ya marcado como TODO en el archivo).
- **No tocar en esta fase:** no conectar IA real; sigue mock.

### C.3 `CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS` (`assist/events/route.ts:32`)
- **Riesgo actual:** BAJO. Solo registra eventos de auditoría mock (no persiste de forma sensible). Aun así no debería aceptar eventos anónimos en prod.
- **¿Debe seguir existiendo?** Sí, atado al mismo control.
- **¿A env?** Sí, misma convención.
- **Valor local:** `true`. **Producción:** `false` forzado.
- **Criterio de aceptación futuro:** sin sesión válida → 403; con sesión → registra.
- **No tocar en esta fase:** sin cambios.

### C.4 `CONSTRUCTOR_SETUP_PROTOTYPE_MODE` (`setup/route.ts:11`)
- **Riesgo actual:** MEDIO. Permite leer/guardar `crm_setup_config` **sin exigir `config.update`**. El `requireConstructorSetupAccess()` ya está escrito para enchufar el permiso real.
- **¿Debe seguir existiendo?** Sí, como modo de diseño interno.
- **¿A env?** Sí → `CONSTRUCTOR_SETUP_PROTOTYPE_MODE` / `SUMMER87_…`.
- **Valor local:** `true`. **Producción:** `false` forzado → exige permiso real.
- **Criterio de aceptación futuro:** con modo off, GET/PATCH sin `config.update` → 403; con permiso → opera.
- **No tocar en esta fase:** no cambiar el mapeo cerrado `STEP_TO_COLUMN` ni el `STEP_ORDER`.

> **Resumen de la decisión C:** un único helper de "prototipo/bypass" en `lib/config` (a crear en SECURITY-1) que centralice estas 4 lecturas con la regla "off en prod siempre". No hay cambios de comportamiento en local. Es puramente defensivo.

---

## D. Decisión sobre DiscoveryContext confirmado (contrato conceptual, NO implementación)

**Qué es.** `DiscoveryContext` es el **objeto de verdad** del descubrimiento de un cliente: la foto estructurada y *con nivel de confianza por dato* de lo que sabemos del negocio antes de habilitar motores, costeo y generación de instancia. Es el puente entre el setup actual del Constructor (`crm_setup_config`) y el paquete instalable.

**Qué datos puede incluir (conceptual):** identidad y rubro; modelo comercial (ticket, ciclo, canales, definición de oportunidad); proceso/etapas; campos críticos por vertical; segmentos de cliente; documentos de referencia; reglas de IA deseadas; parámetros de costeo; restricciones de datos/privacidad. (Mapea 1:1 con los 8 pasos del setup.)

**Estados por dato (extiende `QualityStatus` ya existente):**
| Estado | Significado | Efecto |
|---|---|---|
| `confirmado` | Validado por el cliente / fuente confiable | Habilita motores y costeo que dependan de él |
| `estimado` | Valor propuesto/inferido, no validado | Visible pero marcado; **no** habilita escritura sensible |
| `pendiente` | Falta capturar | Bloquea lo que dependa de él |
| `no_aplica` | Explícitamente irrelevante para este cliente | Neutral; no bloquea |
| `requiere_decision_humana` | Conflicto o ambigüedad | Bloquea hasta resolución manual |

**Qué datos alimentan motores:** etapas del proceso, campos críticos, reglas de IA, segmentos. **Qué datos bloquean motores:** cualquier insumo de un motor en estado `pendiente` o `requiere_decision_humana` → el motor queda read-only/deshabilitado. **Qué bloquea costeo/cotización:** parámetros críticos (estructura de precio, unidades, márgenes, ticket) en estado distinto de `confirmado` → costeo bloqueado (aprendizaje directo de Casa Limpia).

**Relación con el setup actual:** `DiscoveryContext` se **deriva** de `crm_setup_config` (no lo reemplaza); cada paso aporta su sección y su nivel de confianza. El "botón Terminé" produce una **submission confirmada** que congela el estado de cada dato.

**Relación con el paquete instalable:** `DiscoveryContext` confirmado es **precondición** para generar/aprobar un paquete instalable consumible en runtime. Un paquete generado desde un Discovery con datos críticos no confirmados debe marcarse como *borrador no apto para piloto*.

> **No se implementa en esta fase.** Solo queda fijado el contrato. La implementación es CONSTRUCTOR-DISCOVERY-8.

---

## E. Decisión sobre separación Constructor vs CRM operativo

**Quién ve el Constructor:** usuarios internos Summer87 (instalador/constructor/superadmin técnico) en `constructor_base` e `installation_prep`. **Quién ve solo CRM operativo:** el cliente final, siempre en `client_crm`. **El cliente final nunca ve el Constructor.**

**Comportamiento por `APP_MODE`** (defaults ya implementados en `appMode.ts:getModeFlagDefaults`):
| Modo | Constructor | Instalador | BCR | Menús internos | Uso |
|---|---|---|---|---|---|
| `constructor_base` | ✅ | ✅ | ✅ | ✅ | Summer87 diseña la base madre |
| `installation_prep` | ✅ | ✅ | ❌ | ✅ | Summer87 prepara la instancia antes del corte |
| `client_crm` | ❌ (forzado) | ❌ (forzado) | ❌ | ❌ (forzado) | Cliente opera; superficies internas off por fail-safe |

**Rutas a bloquear al cliente:** `/admin/constructor-crm/*` (todas), `/api/admin/constructor/*` (todas), BCR, reset/seed, aprobaciones de paquete, gestión de usuarios/roles internos. *Estado actual:* layout ya redirige a `/403` y `guardConstructorApiByMode()` ya devuelve 403 en `client_crm` — **las dos capas base existen.** **Rutas internas a mantener:** todo el árbol del Constructor y sus APIs solo en modos internos.

**Validaciones antes de entregar una instancia (checklist mínimo, de `11Y`):** menú sin entradas de Constructor; URL directa de Constructor con sesión cliente → 403; APIs Constructor → 403; ninguna pantalla cliente muestra `package_payload` crudo; BCR no enlazado; reset/seed deshabilitados; aprobaciones no accesibles; módulos y reportes operativos OK; branding del cliente correcto; build OK; revisión manual final.

**Qué falta (no en esta fase):** auth real (depende de C: quitar bypass), guards de **menú** por modo, y tests e2e de la separación. Eso es CONSTRUCTOR-SEPARATION-1, posterior a SECURITY-1.

---

## F. Decisión sobre consumo runtime de `package_payload`

**Qué significa consumirlo:** que las pantallas del CRM operativo lean el contrato activo (vía `getActiveCrmPackageConfig`) y se **auto-configuren** (campos, etapas, visibilidad, etc.) en lugar de usar lógica hardcodeada por cliente.

**Orden de consumo recomendado (de menor a mayor riesgo):**
1. **Campos de lead** (`leadFields` adapter) — primer corte, ya hay adapter y validaciones.
2. **Etapas de pipeline** (`pipelineStages` adapter).
3. **Visibilidad de detalle** (`leadDetailVisibility` adapter).
4. **Reportes** — depende de campos/pipeline ya consumidos.
5. **Roles/permisos** — el más sensible; se aborda con la matriz rol×permisos (ver H), no en el primer corte.

**Módulo que NO se debe tocar todavía:** **roles/permisos en runtime** (auth real). Tocar permisos sin la base de SECURITY-1 + DiscoveryContext es riesgoso y de alto impacto.

**Primer corte mínimo viable (cuando llegue CONSTRUCTOR-RUNTIME-1):** un solo módulo —**campos de lead**— leyendo el contrato activo detrás de una bandera, con el preset Pickup como caso de prueba y *fallback neutro* si no hay contrato (comportamiento ya logrado en CLEAN-1B). Validar con la batería `validacion-adapter-lead-fields-*` antes de extender.

---

## G. Decisión sobre acoplamiento Pickup 4x4

**Qué queda como preset/fixture:** `lib/crmPackage/configs/pickup4x4.config.ts` **se conserva** como preset de referencia y fixture de tests. No se elimina.

**Qué deja de ser único:** la **resolución** de config activa. Hoy `getActiveCrmPackageConfig` solo devuelve algo si `clientSlug === "pickup4x4"`. Debe pasar a resolver **cualquier** cliente con contrato válido.

**Cómo debería funcionar un loader dinámico (conceptual):** un `resolveCrmPackageConfig(clientSlug)` que (a) consulte un **registry de presets** locales por slug, y (b) en una fase posterior lea el `package_payload` aprobado desde DB (`installable_package_drafts` con estado `approved_for_pilot`). La **firma pública de `getActiveCrmPackageConfig` no cambia**: solo se reemplaza el `import` único por la resolución por registry. Pickup pasa a ser una entrada más del registry.

**Riesgos al tocar `getActiveCrmPackageConfig`:** es consumido por los adapters que alimentan alta de lead y ficha en `client_crm`; un cambio en la resolución o en el shape puede romper esas pantallas y la persistencia de `contract_fields_json`. Mitigación: mantener `ok/config/source/errors` y `fallback null` neutro; cubrir con `validacion-adapter-*` y `validacion-loader-crm-package-config-*`.

**Qué NO cambiar todavía:** el contrato de retorno, el fallback a `null`, y `pickup4x4.config.ts`. El loader dinámico es parte de CONSTRUCTOR-RUNTIME-1/INSTALLER-1, no de las fases inmediatas.

---

## H. Aprendizajes Casa Limpia a migrar

| Aprendizaje | Clasificación | Fundamento |
|---|---|---|
| **Distinción confirmado/pendiente/estimado** | **Migrar ahora (conceptual)** | Ya quedó fijado en el contrato DiscoveryContext (§D); base `QualityStatus` existe. |
| **Rol limitado para usuarios externos** | **Migrar ahora (decisión) / próximo (impl)** | Decisión de separación fijada (§E); implementación tras SECURITY-1. |
| **Separación instalador/constructor/cliente** | **Migrar próximo** | Dos capas ya existen; falta auth real + menú (SEPARATION-1). |
| **Discovery configurable** | **Migrar próximo** | DISCOVERY-8 tras SECURITY-1. |
| **Botón "Terminé"** | **Migrar próximo** | Parte de DISCOVERY-8 (produce submission confirmada). |
| **Persistencia de submissions** | **Migrar próximo** | Parte de DISCOVERY-8; el setup ya persiste, falta el "freeze" confirmado. |
| **Proceso comercial por etapas (read-only)** | **Migrar próximo** | Pipeline configurable existe; consumo runtime read-only en RUNTIME-1. |
| **Motores read-only antes de escritura** | **Migrar más adelante** | Depende de DiscoveryContext confirmado; motores siguen mock hasta entonces. |
| **Costeo/Cotización bloqueado por datos críticos** | **Migrar más adelante** | QUOTING-1; requiere DiscoveryContext con parámetros confirmados. |
| **Limpieza controlada de datos demo** | **Migrar más adelante** | CLEANUP-1; requiere SQL + backup, fuera del foco inmediato. |
| **Formato de costeo literal de Casa Limpia (xlsx)** | **No migrar literalmente** | Fue extraído del repo (EXTRACT-1B); el costeo debe ser módulo genérico, no el archivo de un cliente. |
| **Columnas facility legacy literales** | **No migrar literalmente** | Deben volverse `contract_fields` por vertical, no columnas fijas del core (decisión en CLEANUP-1). |

---

## I. Riesgos

1. **Tocar `middleware.ts` sin cuidado** puede abrir o cerrar de más rutas. Mitigación: SECURITY-1 cambia solo el origen del valor del flag (env), no el orden de chequeos.
2. **Reintroducir un default de cliente en `getActiveCrmPackageConfig`** rompería la neutralidad lograda en CLEAN-1B. Mitigación: el loader resuelve por registry, manteniendo fallback `null`.
3. **Consumir el contrato en más de un módulo a la vez** multiplica la superficie de error. Mitigación: primer corte = solo campos de lead, detrás de bandera.
4. **Confundir mock IA con IA real**: activar IA real sin DiscoveryContext confirmado viola el aprendizaje central de Casa Limpia. Mitigación: motores read-only hasta DISCOVERY-8.
5. **Cambios en `STEP_TO_COLUMN`/`contract_fields_json`** impactan datos ya cargados. Mitigación: no tocar shapes en fases inmediatas.
6. **Olvidar la doble llave en prod**: una env mal seteada podría reactivar un bypass. Mitigación: forzar off cuando `NODE_ENV==="production"`.

---

## J. Próximo bloque recomendado

**Recomendación única: CONSTRUCTOR-SECURITY-1 — gobernar los flags de prototipo.**

**Por qué (y por qué no las otras):**
- Es el **cambio más pequeño y reversible**: mover 4 `const` a lectura de env con default seguro, usando un patrón (`appMode.ts`) que ya existe. Sin cambios de comportamiento en local.
- **Elimina el riesgo de exposición #1** (Constructor sin login), que hoy bloquea cualquier demo a terceros.
- **Desbloquea** a todas las demás fases: la separación real (C), el DiscoveryContext con permisos (B/D) y el consumo runtime con roles (F) **dependen** de tener auth real disponible.
- **B/DISCOVERY-8** es más grande y depende de auth real para los permisos de setup. **C/SEPARATION-1** depende de quitar el bypass primero. **D/RUNTIME-1** toca pantallas operativas (mayor riesgo). **E/CLEANUP-1** requiere SQL + datos (fuera del foco ágil/seguro inmediato).

**Alcance sugerido de SECURITY-1 (para la fase siguiente, no ahora):** crear un helper en `lib/config` que lea los 4 flags de env con `parseEnvBoolean`, default `false`, y forzado off en producción; reemplazar los 4 `const` por ese helper; documentar las env vars; agregar tests de "sin sesión → bloqueado en prod / permitido en local". Sin tocar lógica de negocio ni el orden de middleware.

---

## K. Fases siguientes (secuencia propuesta)

1. **CONSTRUCTOR-SECURITY-1** — gobernar flags de prototipo (próximo inmediato).
2. **CONSTRUCTOR-SEPARATION-1** — auth real + guards de menú por modo + e2e de separación.
3. **CONSTRUCTOR-DISCOVERY-8** — `DiscoveryContext` confirmado + botón "Terminé" + submissions.
4. **CONSTRUCTOR-RUNTIME-1** — primer consumo de `package_payload` (campos de lead) + loader dinámico de configs.
5. **CONSTRUCTOR-PROCESS-5** — proceso comercial por etapas read-only en runtime.
6. **CONSTRUCTOR-ASSISTANTS-1** — asistentes guiados (sobre andamiaje mock, read-only).
7. **CONSTRUCTOR-QUOTING-1** — módulo de costeo/cotización reusable, bloqueado por datos críticos.
8. **CONSTRUCTOR-CLEANUP-1** — limpieza controlada de datos demo + decisión facility legacy (con SQL + backup).
9. **CONSTRUCTOR-INSTALLER-1** — generación de instancia/configuración operativa end-to-end.

---

## L. Qué no se toca todavía

- `middleware.ts`, las APIs del Constructor, `auth`, `.env.local` (SECURITY-1 los toca recién en su fase).
- `pickup4x4.config.ts` (preset de referencia) y el contrato de retorno de `getActiveCrmPackageConfig`.
- Shapes `STEP_TO_COLUMN` y `contract_fields_json`.
- Motores IA reales (siguen mock).
- Schema/columnas facility legacy y datos en Supabase (sin SQL en esta etapa).
- Proyectos `casalimpia-crm-inteligente` y `summer87-leads-ecuador` (Ecuador en pausa hasta Discovery de Jessica en Vercel).

---

## M. Dictamen

El Constructor está **mejor posicionado de lo que sugería la auditoría**: gran parte de la infraestructura de gobierno (modos por env, guards base, loader parametrizable, estados de calidad) ya existe. El trabajo de las próximas fases es **conectar y endurecer**, no reconstruir. La ruta segura es empezar por lo más chico y de mayor impacto: **gobernar los flags de prototipo (SECURITY-1)**, que elimina el riesgo de exposición y desbloquea todo lo demás. Recién con auth real disponible tiene sentido avanzar separación, DiscoveryContext y consumo runtime, siempre en cortes mínimos y auditables. **GO a SECURITY-1 como próximo bloque; NO-GO a tocar runtime, datos o motores reales todavía.**

---

## N. Confirmaciones de alcance

- ✅ NO se modificó código.
- ✅ NO se modificó UI.
- ✅ NO se ejecutó SQL.
- ✅ NO se tocaron datos.
- ✅ NO se tocó Casa Limpia CRM (`casalimpia-crm-inteligente`).
- ✅ NO se tocó Ecuador (`summer87-leads-ecuador`).
- ✅ NO se tocó `.env.local`, middleware, auth ni APIs.
- ✅ NO se hizo deploy.
- ✅ NO se hizo commit.
- ✅ NO se hizo push.
- ✅ Único cambio en disco: creación de este documento de decisiones.
- ✅ Índices NO actualizados (preferencia de esta fase).
