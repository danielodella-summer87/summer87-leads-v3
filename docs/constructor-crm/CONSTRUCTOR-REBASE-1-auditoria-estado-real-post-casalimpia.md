# CONSTRUCTOR-REBASE-1 — Auditoría de estado real del Constructor CRM post Casa Limpia

> **Tipo:** Diagnóstico documental (solo lectura).
> **Fecha:** 2026-05-31.
> **Alcance:** Estado real del Constructor CRM en `summer87-leads-v3`. NO se modificó código, UI, SQL, datos, auth, middleware ni `.env.local`. NO se tocó `casalimpia-crm-inteligente` ni `summer87-leads-ecuador`. NO hay deploy/commit/push.
> **Principio rector:** Primero el mapa. No hacer correcciones masivas. No tocar código todavía.

---

## A. Resumen ejecutivo

El Constructor CRM existe como un módulo real y bastante avanzado en `app/admin/constructor-crm/` (12 páginas con UI funcional + paneles de readiness) y `app/api/admin/constructor/` (11 endpoints). La capa de **diseño/configuración guiada** (Discovery, cuestionario, diagnóstico, proceso/pipeline, motores IA, reportes, auditoría, paquete instalable) está mayormente implementada como **prototipo funcional**: persiste configuración en Supabase (`crm_setup_config`) y genera **paquetes instalables** (drafts) con simulación pre-install, decisiones de reunión y aprobación.

El gran límite actual es que **el contrato del Constructor todavía no se consume en runtime por el CRM operativo**. El paquete instalable es hoy un **contrato documental de salida**: ninguna pantalla operativa (`leads`, `dashboard`, `reportes`) lee `package_payload` para auto-configurarse. Adicionalmente, persisten **acoplamientos a Pickup 4x4** (config local única en `lib/crmPackage/configs/pickup4x4.config.ts`, campos de vehículo en alta de lead, checklists de reunión hardcodeados) y **naming/columnas facility legacy** heredados de Casa Limpia, ya diagnosticados pero sin decisión final de separación core vs. contrato.

Hay **tres flags de prototipo activos** que bajan la seguridad y deben revertirse antes de exponer a terceros: bypass de auth del Constructor en `middleware.ts`, bypass en endpoints `assist` y `assist/events`, y `CONSTRUCTOR_SETUP_PROTOTYPE_MODE`. Los **motores IA son mock** (respuestas sintéticas, sin IA real), lo cual es coherente con el aprendizaje de Casa Limpia: no operar motores sensibles sin Discovery validado.

**Dictamen corto:** la fábrica de CRMs está bien encaminada en diseño (modos definidos, paquete instalable, política de ocultamiento), pero la **separación Constructor/CRM operativo y el consumo del contrato en runtime están definidos en papel y NO implementados en código**. La fase REBASE debe absorber los aprendizajes de Casa Limpia volviendo reusables las piezas que hoy siguen atadas a Pickup, sin romper la demo ni la persistencia existente.

---

## B. Estado Git inicial

```
Directorio: /Users/danielodella/PROYECTOS/summer87-leads-v3
git status --short:  (working tree limpio)
Rama actual: * main  389630a [origin/main]  (sincronizada)
```

`git branch -vv`:
```
  backup/error-auditoria-0d38e9d                     0d38e9d feat(v3): add motores ia readiness guidance panel
  backup/error-auditoria-a653224                     a653224 feat(v3): add reportes readiness guidance panel
  backup/error-auditoria-antes-de-retroceder-869022f a653224 feat(v3): add reportes readiness guidance panel
  backup/error-auditoria-blueprint-6c11c11           6c11c11 fix(v3): harden auditoria final contract fallbacks
  backup/error-auditoria-fase4s-20260510-1605        869022f feat(v3): add auditoria global readiness summary
* main                                               389630a [origin/main] Document Casa Limpia local clone validation
```

`git log --oneline -15`:
```
389630a Document Casa Limpia local clone validation
1bc7f0f Document Casa Limpia local clone procedure
d6b79b4 Document Casa Limpia pre-clone Go No-Go checklist
6a99859 Document Casa Limpia seed users and permissions
36b80a5 Document Casa Limpia clean clone technical plan
2924dd6 Document Casa Limpia CRM contract
7ddf4ad Document Casa Limpia read-only audit
458d17a Document facility UI survey diagnosis
3fd4a82 Document facility legacy naming QA
8d2ea00 Neutralize Casa Limpia naming in leads APIs
a64324d Document Casa Limpia facility legacy diagnosis
51f70af Document neutral behavior after Pickup fallback cleanup
04cf100 Remove implicit Pickup fallback from CRM package core
6f2904f Document Pickup fallback cleanup diagnosis
11fe649 Extract Casa Limpia assets from Constructor repo
```

Lectura: los últimos ~15 commits son **documentación de Casa Limpia** + **limpieza de acoplamientos** (extracción de activos Casa Limpia, neutralización de naming/fallback Pickup). El repo viene de una fase de extracción/limpieza, no de desarrollo de features del Constructor.

---

## C. Inventario de estructura relevante

### Config de proyecto
- `package.json` — Next.js **16.0.11**, React **19.2.3**, Supabase SSR + JS, `@dnd-kit` (Kanban), `@react-pdf/renderer` + `pdf-lib` (documentos), `resend` (email), `xlsx`. Sin dependencia de SDK de IA → confirma que los motores IA son **mock**.
- `next.config.ts` — `rewrites()` mapea `/admin/constructor` → `/admin/constructor-crm` (la carpeta `constructor` rompía el segment explorer de Next DevTools por colisión con `Object.prototype.constructor`). URLs públicas siguen siendo `/admin/constructor/...`.
- `middleware.ts` — auth/RBAC para `/admin/:path*` y `/api/admin/:path*`. **Contiene bypass de auth del Constructor** (ver §G/§I).

### App — Constructor (`app/admin/constructor-crm/`)
```
layout.tsx, page.tsx (dashboard)
empresa/            cuestionario/        documentos/
diagnostico/        proceso-pipeline/    motores-ia/
reportes/           auditoria/           manual-cliente/
paquetes/           paquetes/[id]/
```

### API — Constructor (`app/api/admin/constructor/`)
```
setup/route.ts                          (GET/PATCH config — persistencia real)
assist/route.ts                         (MOCK IA — sin IA real)
assist/events/route.ts                  (MOCK audit de sugerencias)
installable-package/generate/route.ts   (genera draft; bloquea acciones destructivas)
installable-package/drafts/route.ts
installable-package/drafts/[id]/route.ts
installable-package/drafts/[id]/simulation-snapshots/route.ts
installable-package/drafts/[id]/simulate-preinstall/route.ts
installable-package/drafts/[id]/meeting-decisions/route.ts
installable-package/drafts/[id]/approve/route.ts
installable-package/drafts/[id]/reject/route.ts
```

### Lib relevante
- `lib/constructor/readiness/` — `types.ts`, `statusStyles.ts`, `helpers.ts`, `overallProgress.ts` (cálculo de progreso global del flujo de 8 pasos). **Funcional, agnóstico de cliente.**
- `lib/constructor-ai/` — `client.ts`, `helpers.ts`, `types.ts`, `useConstructorMockAI.ts`, `useConstructorAIAudit.ts`, `audit-client.ts`, `audit-types.ts`. **Funcional pero apunta a endpoint mock.**
- `lib/crmPackage/` — contrato de paquete + adapters (`leadFields`, `pipelineStages`, `leadDetailVisibility`, `leadFieldPersistence`), `getActiveCrmPackageConfig.ts`, y **`configs/pickup4x4.config.ts` (única config local)**.
- `lib/modules/` — registry/initialize de módulos, readiness.
- `lib/config/` — `appMode.ts` (APP_MODE, CLIENT_SLUG por env), `appSuiteConfig.ts` (naming de suite/módulos configurable), `crmMode.ts` (pasos del setup).

### Docs
- `docs/constructor-crm/` — **151 archivos**. Núcleo estratégico: `auditoria-constructor-base-madre-AUDIT-1.md`, `cierre-constructor-fabrica-crms-CONSTRUCTOR-CLOSE-1.md`, `diseno-paquete-instalable-contrato-salida-CONSTRUCTOR-CLOSE-2.md`, `diseno-generador-local-proyecto-cliente-CONSTRUCTOR-CLOSE-3.md`, `modos-constructor-vs-crm-operativo-11X.md`, `politica-ocultamiento-constructor-clones-11Y.md`, `plan-contrato-constructor-crm-operativo-12V.md`. Subcarpetas: `knowledge/`, `templates/`, `_archived/`.
- `docs/casalimpia/` — solo `README.md` (placeholder); activos extraídos en `CONSTRUCTOR-EXTRACT-1B`.
- Migraciones SQL: carpetas `migrations/` (81 entradas) y `supabase/` (no inspeccionadas en detalle — fuera de alcance, no se ejecutó SQL).

---

## D. Estado real de módulos del Constructor

| Módulo | Ruta | Estado real |
|---|---|---|
| Dashboard Constructor | `constructor-crm/page.tsx` | **Funcional**. Progreso visual del flujo; aún sin persistir en ese bloque ("la persistencia se conectará en una fase posterior"). |
| Empresa (identidad/rubro/modelo/contexto IA) | `constructor-crm/empresa/` | **Funcional ~95%**. Persiste vía `/api/admin/constructor/setup`. Readiness + mock AI para sugerencias. |
| Discovery / Cuestionario | `constructor-crm/cuestionario/` | **Funcional ~95%**. 6 secciones, persiste, sugerencias locales + mock AI. |
| Documentos | `constructor-crm/documentos/` | **Parcial ~60%**. Registro/listado manual funcional; **carga real de archivos = stub** (pendiente Supabase Storage). |
| Diagnóstico | `constructor-crm/diagnostico/` | **Funcional ~85%**, en desarrollo. Matriz 4D + readiness + mock AI. |
| Proceso / Pipeline | `constructor-crm/proceso-pipeline/` | **Funcional ~85%**. Etapas, columnas Kanban, reglas; mock AI. |
| Reportes | `constructor-crm/reportes/` | **Funcional ~85%**. Operativo/gerencial/IA; mock AI + audit. |
| Motores IA | `constructor-crm/motores-ia/` | **Funcional UI ~80%, motor MOCK**. Configura motores por etapa con prioridad/riesgo; sin IA real. |
| Auditoría | `constructor-crm/auditoria/` | **Funcional ~90%**. Checklist, riesgos, export/copy; audit mock. |
| Manual cliente | `constructor-crm/manual-cliente/` | **Stub ~40%**. Template hardcodeado con placeholders `___`; sin generación dinámica desde el Discovery. |
| Paquetes (instalador) | `constructor-crm/paquetes/`, `paquetes/[id]/` | **Funcional ~95%**. Lista de drafts, detalle, simulación pre-install, decisiones de reunión, aprobar/rechazar. |
| Persistencia setup | `api/.../setup/route.ts` | **Funcional**. GET/PATCH sobre `crm_setup_config`. `CONSTRUCTOR_SETUP_PROTOTYPE_MODE=true`. |
| Generación paquete instalable | `api/.../installable-package/*` | **Funcional como contrato de salida**. Genera draft JSON, bloquea acciones destructivas; **no ejecuta instalación real**. |
| Motor IA backend | `api/.../assist/*` | **MOCK**. Respuestas sintéticas `{ mock:true, model:"mock" }`; auth bypass activo. |
| **Consumo del contrato en CRM operativo** | `leads`, `dashboard`, `reportes` | **NO IMPLEMENTADO**. Ninguna pantalla cliente lee `package_payload` para auto-configurarse (per `12V`). |
| Separación Constructor vs cliente | `middleware.ts`, `layout.tsx`, política `11Y` | **Definida, parcialmente implementada**. Guard por `APP_MODE` en layout/API; **bypass de auth activo**; menú/guards por modo aún pendientes. |
| Datos demo | base madre Supabase | **No limpios**. Leads/draft de prueba Pickup persisten (per `AUDIT-1`/`BM-0`). |
| Roles / permisos | `lib/rbac`, contrato `role_permissions` | **Matriz definida; no consumida en runtime**. APIs operativas no leen permisos del contrato. |

---

## E. Capacidades base del Constructor YA existentes (Categoría A)

1. **Flujo guiado de diseño de CRM en 8 pasos** (empresa → cuestionario → documentos → diagnóstico → proceso/pipeline → motores IA → reportes → auditoría) con **paneles de readiness** y cálculo de progreso global (`lib/constructor/readiness/overallProgress.ts`).
2. **Persistencia de configuración** del setup en `crm_setup_config` (GET/PATCH funcional).
3. **Paquete instalable como contrato de salida**: generación de draft, simulación pre-install, snapshots, decisiones de reunión, aprobar/rechazar. Bloquea acciones destructivas (no crea Supabase, no activa IA sensible, etc.).
4. **Asistencia IA mock por campo/sección** con auditoría de sugerencias (shown/applied/duplicate/failed/empty) — andamiaje listo para enchufar IA real.
5. **Contrato `crm_package_config` + adapters** (`leadFields`, `pipelineStages`, `leadDetailVisibility`, `leadFieldPersistence`) — patrón reusable ya probado.
6. **Arquitectura env-driven** (`APP_MODE`, `CLIENT_SLUG`, naming de suite/módulos en `appSuiteConfig.ts`) — base para multi-cliente.
7. **Patrón `contract_fields_json`** para campos dinámicos por vertical — reusable y validado (per `AUDIT-1`).
8. **Modos funcionales definidos** (`constructor_base`, `client_crm`, `installation_prep`) y guard por modo en layout/API del Constructor.
9. **Política de ocultamiento Constructor↔cliente** documentada con checklist de validación de clon (per `11Y`).

---

## F. Capacidades existentes pero INCOMPLETAS (Categoría B)

1. **Consumo del contrato en runtime**: el `package_payload` se genera pero **no lo lee** ninguna pantalla operativa → el CRM no se auto-configura desde el Constructor (per `12V`).
2. **Mapeo Discovery → contrato CRM v1**: ~60% derivable del preset actual; **~40% son piezas nuevas** (activity_types, dashboards.blocks, labels estructurado, visibility_rules, branding, matriz rol×permisos) sin generar todavía (per `12V`).
3. **Carga de documentos**: registro manual OK; **subida real de archivos = stub** (pendiente Supabase Storage).
4. **Motores IA reales**: backend mock; falta integración con IA real **atada a un DiscoveryContext confirmado**.
5. **Manual cliente**: template hardcodeado; falta generación dinámica desde los datos del Discovery.
6. **Separación Constructor/cliente en código**: layout/API guard por modo existe, pero **menú por modo, guards de ruta y tests e2e** están pendientes (per `11Y` §19, 12B–12D).
7. **Matriz rol×permisos**: definida en el contrato (`role_permissions`) pero **no consumida** por UI/API operativas.
8. **Costeo / cotización**: capturado en Discovery, pero **no existe módulo dedicado** en el Constructor.

---

## G. Acoplamientos / hardcodes detectados (Categoría C)

### Acoplamiento a Pickup 4x4 (ALTO)
- `lib/crmPackage/configs/pickup4x4.config.ts` — **config demo completa hardcodeada** (nombre "Pickup 4x4", `contract_id` fijo, pipeline, campos, roles, integraciones Kore, `suite_name`).
- `lib/crmPackage/getActiveCrmPackageConfig.ts:12` — `PICKUP4X4_CLIENT_SLUG = "pickup4x4"`; es la **única** config local. Si `clientSlug !== "pickup4x4"` → `no_matching_local_config` (fallback a `null`). **No hay carga dinámica de configs para otros clientes** todavía.
- `app/admin/leads/nuevo/page.tsx` — `buildPickupContractFields()` (marca, modelo, año, matrícula, tipo_uso) adjuntos a `contract_fields` cuando `isClientCrmUi`. Ramificado por modo, **no por contrato**.
- `app/admin/constructor-crm/paquetes/[id]/page.tsx` — `PICKUP_REUNION_PREVIA_CHECKLIST`, minutas y acuerdos **hardcodeados** (incluye nombres literales tipo "Daniel / Summer87"). Uso demo/documental, no regla de negocio crítica, pero no parametrizable.

### Facility legacy heredado de Casa Limpia (MEDIO)
- Columnas `superficie_m2`, `cantidad_pisos`, `cantidad_banos`, `visita_relevamiento_json`, `installation_details_json` **persisten en schema base madre** sin decisión final core vs. contrato (diagnóstico en `CONSTRUCTOR-CLEAN-2A/2B/2C`, sin implementación).

### Flags de prototipo que bajan seguridad (ALTO — ver §I)
- `middleware.ts:48` — `CONSTRUCTOR_AUTH_BYPASS = true` (Constructor accesible **sin login**).
- `app/api/admin/constructor/assist/route.ts:53` — `CONSTRUCTOR_ASSIST_AUTH_BYPASS = true`.
- `app/api/admin/constructor/assist/events/route.ts:32` — `CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS = true`.
- `app/api/admin/constructor/setup/route.ts:11` — `CONSTRUCTOR_SETUP_PROTOTYPE_MODE = true`.

### Bien aislado (NO requiere acción)
- `appSuiteConfig.ts` (naming configurable con fallback), `appMode.ts` (multi-cliente por env), Gamma (`lib/leads/*gamma*` genérico), `agencyServices` (agnóstico), rutas `leads87`/`copilot` (claves de módulo internas, no de cliente).

---

## H. Aprendizajes de Casa Limpia a absorber en el Constructor

| Aprendizaje Casa Limpia | Estado en Constructor | Acción de migración |
|---|---|---|
| Discovery configurable por cliente (no hardcodeado) | Cuestionario/diagnóstico existen y persisten, pero el output no alimenta config runtime | Conectar Discovery → `crm_package_config` (cerrar el ~40% faltante). |
| Botón "Terminé" + persistencia de submissions | Persistencia de setup OK; falta "submission" formal de Discovery confirmado | Modelar `DiscoveryContext` confirmado como gate. |
| Rol limitado para usuarios externos | Matriz definida, no consumida en runtime | Implementar `role_permissions` en API/UI. |
| Proceso comercial read-only por etapas | Pipeline configurable existe | Asegurar vista read-only por etapas como capacidad base. |
| Motores read-only antes de escritura | Motores mock; `ai_rules` con flags definidos en contrato | No activar motores con escritura sin Discovery validado. |
| Costeo/Cotización bloqueado por falta de datos críticos | No existe módulo de costeo | Crear módulo de costeo **reusable**, bloqueado por datos críticos faltantes. |
| Limpieza controlada de datos demo | Política definida; datos demo aún no limpios | Implementar limpieza controlada previa a entrega de instancia. |
| Distinción confirmado / pendiente / estimado | Readiness usa estados (good/warning/danger/neutral) | Extender a marcado de datos confirmados vs estimados vs pendientes. |
| Separación instalador/constructor vs operativo/cliente | Modos definidos; separación parcial | Cerrar guards/menú por modo; cliente nunca ve el Constructor. |

---

## I. Riesgos (Categorías E y F)

### E. Riesgos que pueden romper el Constructor si se toca sin cuidado
1. **Adapters de `crmPackage`** (`leadFields`, `pipelineStages`, `leadDetailVisibility`, `leadFieldPersistence`): tocar la resolución de config activa puede afectar alta de lead y ficha en modo `client_crm`. Cambiar con tests de los `validacion-adapter-*`.
2. **`getActiveCrmPackageConfig.ts`**: el fallback a `null` ya fue intencional (CLEAN-1B). Reintroducir un default de cliente rompería la neutralidad lograda.
3. **`crm_setup_config` (persistencia)**: el mapeo `STEP_TO_COLUMN` está cerrado; renombrar pasos/columnas rompe lectura/guardado del setup.
4. **`contract_fields_json`**: persistencia de campos dinámicos; alterar el shape impacta datos ya cargados.
5. **Middleware**: cualquier cambio en el orden de chequeos (bypass → crm_session → login → RBAC) puede dejar rutas abiertas o cerrar de más.

### F. Cosas que NO conviene tocar todavía
- **`casalimpia-crm-inteligente` y `summer87-leads-ecuador`** (otros proyectos) — Casa Limpia Ecuador en pausa hasta Discovery de Jessica en Vercel.
- **Columnas facility legacy en schema** — esperar decisión core vs. contrato (no borrar datos).
- **Migraciones SQL existentes / datos en Supabase** — sin SQL en esta fase.
- **`pickup4x4.config.ts`** como artefacto — sirve de preset/fixture de referencia; no eliminar hasta tener loader dinámico de configs.
- **`.env.local`** — intacto.

---

## J. Backlog priorizado

> Convención por ítem: **objetivo · módulo/carpeta probable · riesgo · ¿SQL? · ¿UI? · ¿migración desde Casa Limpia? · criterio de aceptación**.

### Crítico inmediato
1. **Revertir/condicionar flags de prototipo de seguridad**
   - Objetivo: que el bypass de auth no quede activo al exponer a terceros.
   - Módulo: `middleware.ts`, `api/.../assist`, `assist/events`, `setup`.
   - Riesgo: alto si se exponen rutas. · SQL: no · UI: no · Migración CL: no.
   - Aceptación: bypass controlado por env (off por defecto en prod); login obligatorio fuera de prototipo local.
2. **Definir `DiscoveryContext` confirmado como gate de motores/costeo**
   - Objetivo: ningún motor sensible ni costeo opera sin Discovery validado.
   - Módulo: `lib/constructor`, `cuestionario/`, `motores-ia/`.
   - Riesgo: medio · SQL: posible (flag de confirmación) · UI: sí (botón "Terminé") · Migración CL: **sí**.
   - Aceptación: motores/costeo bloqueados hasta `discovery.confirmed = true`.

### Importante próximo
3. **Cerrar el ~40% faltante del contrato y consumirlo en runtime**
   - Objetivo: que el CRM operativo se auto-configure desde `package_payload`.
   - Módulo: `lib/crmPackage`, adapters, `leads`/`dashboard`/`reportes`.
   - Riesgo: alto · SQL: probable · UI: sí · Migración CL: parcial.
   - Aceptación: al menos un cliente distinto de Pickup configurable sin tocar código.
4. **Loader dinámico de configs (sacar dependencia de `pickup4x4` como única)**
   - Objetivo: resolver config activa por cliente desde DB/draft.
   - Módulo: `getActiveCrmPackageConfig.ts`.
   - Riesgo: alto · SQL: sí (origen de config) · UI: no · Migración CL: no.
   - Aceptación: `clientSlug` arbitrario resuelve config válida; Pickup queda como un preset más.
5. **Matriz rol×permisos consumida en API/UI**
   - Objetivo: roles limitados reales para usuarios externos.
   - Módulo: `lib/rbac`, APIs `leads/*`, layout.
   - Riesgo: alto · SQL: posible · UI: sí · Migración CL: **sí**.
   - Aceptación: usuario externo no puede acceder a rutas/acciones fuera de su rol.
6. **Separación Constructor↔cliente en código (menú + guards + e2e)**
   - Objetivo: el cliente final no ve el Constructor.
   - Módulo: `middleware.ts`, `AdminShell`, layout.
   - Riesgo: medio · SQL: no · UI: sí · Migración CL: **sí**.
   - Aceptación: sesión cliente sobre URL de Constructor → 403; menú sin entradas de Constructor.
7. **Limpieza controlada de datos demo previa a entrega**
   - Objetivo: instancia limpia sin leads/drafts de prueba.
   - Módulo: scripts/procedimiento + base madre.
   - Riesgo: alto (datos) · SQL: sí · UI: no · Migración CL: **sí**.
   - Aceptación: procedimiento reproducible y auditable; backup previo obligatorio.

### Futuro
8. **Módulo de costeo/cotización reusable** — `lib/crmPackage` + nueva sección Constructor; bloqueado por datos críticos faltantes. Migración CL: **sí** (formato de costeo extraído).
9. **Motores IA reales atados a DiscoveryContext** — reemplazar mock en `api/.../assist` por IA real read-only primero.
10. **Carga de documentos real** — Supabase Storage en `documentos/`.
11. **Manual cliente dinámico** — generado desde el Discovery, no template fijo.
12. **Decisión facility legacy** (core vs contrato) e implementación.

### No tocar por ahora
- Casa Limpia Ecuador / proyecto clon (pausa hasta Discovery de Jessica).
- Migraciones SQL y datos en Supabase fuera de un bloque con backup.
- `pickup4x4.config.ts` como preset de referencia (hasta tener loader dinámico).

---

## K. Fases siguientes recomendadas (secuencia, sin implementar)

1. **CONSTRUCTOR-REBASE-2** — Decisiones de arquitectura: condicionar flags de prototipo por env; definir `DiscoveryContext` confirmado; congelar contrato de separación. (Diseño, sin código pesado.)
2. **CONSTRUCTOR-DISCOVERY-8** — Discovery configurable + botón "Terminé" + persistencia formal de submissions; gate de confirmación.
3. **CONSTRUCTOR-PROCESS-5** — Proceso comercial visual como capacidad base, read-only por etapas, derivado del Discovery.
4. **CONSTRUCTOR-ASSISTANTS-1** — Asistentes guiados para completar campos (sobre el andamiaje mock existente), read-only primero.
5. **CONSTRUCTOR-QUOTING-1** — Módulo de costeo/cotización reusable, bloqueado por datos críticos faltantes.
6. **CONSTRUCTOR-CLEANUP-1** — Limpieza controlada de datos demo + decisión facility legacy, con backup.
7. **CONSTRUCTOR-INSTALLER-1** — Consumo del contrato en runtime + loader dinámico de configs + generación de instancia/configuración operativa.

> La separación Constructor↔cliente (guards/menú/e2e) y la matriz rol×permisos pueden ir como sub-bloque de REBASE-2 o como fase propia CONSTRUCTOR-SEPARATION-1 según prioridad de exposición a terceros.

---

## L. Cosas que NO conviene tocar todavía (resumen)

- Proyectos externos: `casalimpia-crm-inteligente`, `summer87-leads-ecuador`.
- Schema/columnas facility legacy y datos en Supabase (sin SQL en esta fase).
- `pickup4x4.config.ts` como preset de referencia.
- `.env.local` y flags de prototipo (cambiar recién en REBASE-2 con criterio).
- Adapters de `crmPackage` sin la batería de `validacion-adapter-*` como red de seguridad.

---

## M. Dictamen

El Constructor CRM **existe, es real y está avanzado en su capa de diseño** (Discovery, cuestionario, diagnóstico, proceso, motores-mock, reportes, auditoría, paquete instalable con simulación y aprobación). Lo que **falta es cerrar el lazo**: que el contrato generado se **consuma en runtime** y que la **separación Constructor/cliente** y los **roles limitados** estén implementados, no solo documentados. Los acoplamientos a Pickup 4x4 y el naming facility legacy son **deuda acotada y reversible**; ya hubo trabajo de neutralización (CLEAN-1B). Los flags de prototipo de seguridad son el **riesgo inmediato** a gobernar.

**Recomendación:** no hacer correcciones masivas. Arrancar por **CONSTRUCTOR-REBASE-2** (decisiones de arquitectura + gobierno de flags + `DiscoveryContext`), y recién después avanzar Discovery → contrato → consumo runtime → loader dinámico, absorbiendo en cada paso el aprendizaje correspondiente de Casa Limpia.

---

## N. Confirmaciones de alcance

- ✅ NO se modificó código funcional.
- ✅ NO se modificó UI.
- ✅ NO se ejecutó SQL.
- ✅ NO se tocaron datos.
- ✅ NO se tocó Casa Limpia CRM (`casalimpia-crm-inteligente`).
- ✅ NO se tocó Ecuador (`summer87-leads-ecuador`).
- ✅ NO se tocó `.env.local`, middleware, auth ni APIs.
- ✅ NO se hizo deploy.
- ✅ NO se hizo commit.
- ✅ NO se hizo push.
- ✅ Único cambio en disco: creación de este documento de auditoría.
- ✅ Índices NO actualizados (preferencia de esta fase).
