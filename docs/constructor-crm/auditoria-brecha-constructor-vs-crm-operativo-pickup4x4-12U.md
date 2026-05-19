# Auditoría Brecha Constructor vs CRM Operativo Pickup 4x4 12U — Constructor CRM Summer87

**Versión:** 12U — auditoría estructural documental
**Fecha:** 2026-05-18
**Ámbito:** producto + arquitectura. No es una nueva lista de copy a borrar.
**No se modificó código, datos, SQL, Supabase, APIs, middleware, env, ni se hicieron commits.**

**Documentos base:**

| Fase | Documento |
|------|-----------|
| 11X | `modos-constructor-vs-crm-operativo-11X.md` |
| 12N | `ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md` |
| 12O | `validacion-post-dataset-vercel-client-crm-12O-post-dataset-run.md` |
| 12S audit | `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md` |
| 12S fix | `validacion-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-impl-1V.md` |
| 12T audit | `auditoria-dashboard-reportes-shell-pickup4x4-client-crm-12T-ux-audit.md` |
| 12T fix | `validacion-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-impl-1V.md` |
| 12M | `go-no-go-demo-interna-pickup4x4-client-crm-12M.md` |

**Leyenda de evidencia:**

| Etiqueta | Significado |
|----------|-------------|
| **Repo** | Path:línea verificado en código fuente |
| **Doc** | Cita o estado documentado en fases previas |
| **Inferido** | Conclusión por flujo o nombres; no string UI directo |

---

## 2. Resumen ejecutivo

El CRM operativo Pickup 4x4 **no nace** del Constructor. Es la **app base Summer87 Leads** (rubro original Casalimpia / LEADS87 consultivo) con:

1. Limpieza de copy manual (12S/12T).
2. Ocultamientos cosméticos por `APP_MODE=client_crm`.
3. Dataset ficticio cargado por UI (12N).
4. Sidebar filtrado por allowlist `CLIENT_VISIBLE_MODULES`.

El Constructor **sí produce un contrato rico** — preset `pickup_4x4` con módulos, pipeline (9 etapas), campos por grupo (Cliente / Vehículo / Oportunidad / Kore), permisos, reglas IA, reportes, integraciones, `activation_checklist`, `installer_decisions` (**Repo** `lib/admin/installablePackagePickup4x4Preset.ts`).

Pero **nadie lo consume en runtime operativo**. La búsqueda de `package_payload`, `crm_modules_config`, `pipeline_config`, `lead_fields_config`, `reports_config` solo devuelve resultados dentro de `app/admin/constructor-crm/**` (UI de diseño/auditoría/aprobación) — **cero** matches en `app/admin/leads`, `dashboard`, `agenda`, `reportes` (**Repo**, grep verificado).

Conclusión: hoy hay **fábrica de paquetes** + **CRM hardcodeado**. Falta la **fábrica de CRMs**. La diferencia es el adapter/render layer que lee el contrato.

| Afirmación | Estado |
|------------|--------|
| El Constructor genera un contrato declarativo serializable | ✅ Sí |
| El CRM operativo lee ese contrato en alguna pantalla | ❌ No |
| El cliente percibe un CRM configurado para Pickup | Parcial (copy limpio, dataset coherente) |
| El próximo cliente nacerá limpio si solo se cambia el preset | ❌ No |

---

## 3. Diagrama conceptual: estado actual vs objetivo

### Estado actual (probable, comprobado por código)

```
CRM base Summer87 Leads (rubro consultoría / facility heredado)
  + APP_MODE=client_crm                (oculta tabs, campos facility, menús internos)
  + dataset demo Pickup 4x4 (12N)      (12 leads ficticios, 8 actividades)
  + sidebar allowlist                  (CLIENT_VISIBLE_MODULES = leads87,agenda,reportes)
  + parches 12S / 12T                  (copy neutro en componentes)
  + portal_config / personalización    (labels memberSingular/Plural)
= demo operativa visualmente coherente
```

**El Constructor está en paralelo:**

```
Constructor (UI /admin/constructor-crm/*)
  └─> genera installable_package_drafts.package_payload (contrato rico)
        ├─ client_identity
        ├─ crm_modules_config
        ├─ pipeline_config (9 etapas Pickup)
        ├─ lead_fields_config (grupos Cliente/Vehículo/Oportunidad/Kore)
        ├─ permissions_config (5 roles)
        ├─ ai_rules_config
        ├─ reports_config (7 reportes)
        ├─ integrations_config (Kore read-only)
        ├─ activation_checklist
        └─ installer_decisions
              └─ ⛔ NO HAY CONSUMIDOR DOWNSTREAM
                   (ningún archivo en app/admin/leads, dashboard, agenda,
                    reportes lee package_payload ni sus sub-configs)
```

### Estado objetivo

```
Constructor cuestionario por cliente
  └─> contrato Constructor → CRM operativo (versionado, validado)
        └─> adapter / render layer
              ├─ menú lateral lee modules
              ├─ ficha lead lee lead_fields + visibility_rules
              ├─ pipeline lee pipeline_config
              ├─ dashboard lee dashboards.metrics
              ├─ agenda lee labels.entityName, activity_types
              ├─ reportes lee reports_config (habilitados)
              ├─ permisos lee role_permissions del contrato
              └─ branding lee branding (logo, suiteName, colors)
        └─> CRM operativo Pickup renderizado desde configuración
              (sin "Iniciativa", "Socio", "Técnico/Consultor",
               "EASY", "Casalimpia", "LEADS87" salvo que el contrato lo pida)
```

---

## 4. Tabla "Qué debería venir del Constructor"

| Área | Debería venir del Constructor | Estado actual observado | Brecha |
|------|------------------------------|-------------------------|--------|
| **Módulos visibles** | `crm_modules_config.modules[]` decide menú | Sidebar hardcodeado `DEFAULT_ADMIN_SIDEBAR_MODULES` (**Repo** `lib/admin/adminSidebarModules.ts:92-200`); allowlist `CLIENT_VISIBLE_MODULES` solo **oculta** | Alta |
| **Campos del lead** | `lead_fields_config.groups[]` (Cliente / Vehículo / Oportunidad / Kore) | Inputs fijos en `app/admin/leads/nuevo/page.tsx` (nombre, contacto, telefono, email, origen, oferta, pipeline, rubro, cantidad_personal, superficie_m2, direccion, visita_scheduled_at) | Crítica |
| **Pipeline** | `pipeline_config.stages[]` (9 etapas Pickup) | Pipeline desde `/api/admin/leads/pipelines` (tabla operativa), fallback hardcodeado `Nuevo, Contactado, En seguimiento, Calificado, No interesado, Cerrado` (**Repo** `nuevo/page.tsx:35-42`) | Alta |
| **Ficha del lead** | Render desde contrato + visibility_rules por modo/rol | `app/admin/leads/[id]/page.tsx` (6573 líneas) con tabs hardcodeados, bloque iniciativa unconditional, NEXT_STEP_CONFIG consultivo EASY (**Repo** `[id]/page.tsx:654-802`) | Crítica |
| **Agenda** | `activity_types`, `labels.entity`, owner types del contrato | Hardcodeado: `owner_type = "lead" | "socio"`; labels desde `portal_config` (memberSingular/Plural) — independiente del Constructor (**Repo** `lib/personalizacion.ts`) | Alta |
| **Dashboard** | `dashboards.kpis[]` activados | Componentes fijos `CommercialFlowKpis`, `PipelineSummary`, `LeadHealthSummary`, … (**Repo** `components/crm/dashboard/*`); copy 12T neutralizado pero estructura igual para todo cliente | Alta |
| **Reportes** | `reports_config.reports[]` habilita catálogo | Hub `ReportesClient.tsx` con cards `disabled: true`/`próximamente`; solo `comercial/leads` operativo | Alta |
| **Permisos** | `permissions_config.roles[]` + matriz role × permission key | Roles vienen de tabla `roles` Supabase; `permissions/me` filtra internas con `filterPermissionKeysForClientCrm` (**Repo** `app/api/admin/permissions/me/route.ts:140`) | Media |
| **Branding** | `branding.logo`, `branding.clientName`, `branding.suiteName` | Hardcodeado `APP_SUITE_CONFIG = { suiteName: "Summer87 Intelligence", … }` (**Repo** `lib/config/appSuiteConfig.ts`); logo fijo `/licencia.png` | Alta |
| **Labels / copy** | `labels` por módulo (singular/plural, "Cliente" vs "Socio" vs "Empresa") | Mezcla: `portal_config` (member labels) + hardcodes en componentes | Media |
| **Automatizaciones** | `ai_rules` del contrato gobierna qué puede hacer IA | `ai_rules_config` se genera en el preset pero no se consume en runtime IA | Alta |
| **IA / recomendaciones** | Reglas + motores activados desde Constructor | Motores IA del CRM operativo no están gobernados por contrato Pickup | Alta |

---

## 5. Tabla "Herencias detectadas o sospechadas"

| Elemento | Pantalla | Origen probable | Evidencia | Severidad | Recomendación |
|----------|----------|-----------------|-----------|-----------|---------------|
| **Bloque "Iniciativa"** + warning *"Este lead no está vinculado a una iniciativa"* | Ficha lead → tab Datos | App base / módulo Iniciativas hardcodeado | `app/admin/leads/[id]/page.tsx:3852-3905` (sin guard `!isClientCrmUi`), L3999 `Datos de Iniciativa` | Crítica producto | Quick win: envolver en `!isClientCrmUi`. Estructural: el bloque solo debe existir si el contrato declara módulo `iniciativas` |
| **Subbloque "Datos de Iniciativa"** (Nombre, Teléfono, Email, Rubro, Dirección, Website, Instagram, Facebook) | Ficha lead → acordeón Datos | Modelo `lead.empresas` joineado a tabla `empresas` | `[id]/page.tsx:3999-4070+` | Crítica producto | Idem — campos de la entidad asociada vienen del schema base, no del contrato Pickup |
| **Tabs "Técnico" / "Consultor"** | Ficha lead | Flujo LEADS87 consultivo EASY heredado | `LEAD_TABS` hardcodeado en `[id]/page.tsx:653-661`; visibilidad por **rol** en `getVisibleLeadTabs` (admin/consultor las ven, comercial no) | Alta | Quick win: ocultar para `client_crm` independientemente de rol. Estructural: tabs derivadas de `lead_view.tabs[]` del contrato |
| **`NEXT_STEP_CONFIG`** con copy *"servicios EASY"*, *"tab Consultor"* | Ficha lead → bloque "Siguiente paso" | LEADS87 consultivo hardcodeado | `[id]/page.tsx:669-802` (referencias a "EASY", "Consultor", "narrativa consultiva") | Alta | Estructural: el bloque debería derivarse de pasos declarados en el contrato (mismas keys que `pipeline_config` o un `flow_config` aparte) |
| **`leadFlow.ts`** 8 pasos consultivos (lead, datos, investigacion, diagnostico, acciones, servicios, propuesta, presentacion) | Ficha lead, lista, kanban, dashboard | Flujo consultivo Summer87 (heredado del CRM base) | `lib/leads/leadFlow.ts` (381 líneas); helpers `hasRelevamientoKeyFields`, `hasServiciosDefinidos` con campos `tipo_servicio`, `superficie_m2`, `numero_operarios` (facility) | Alta | Copy neutralizado en 12S; estructura sigue siendo la misma. Estructural: pasos deben venir del contrato (Pickup tiene 9 etapas declaradas, distintas) |
| **`servicios_especiales`** (fumigacion, desratizacion, jardineria, …) | `leadFlow.ts` helpers | Schema legacy Casalimpia | `leadFlow.ts:179-225` constantes `SERVICIOS_ESPECIALES_FLAT`, `SERVICIOS_ESPECIALES_GROUPED` | Media (oculto en UI client_crm) | Estructural: el módulo "servicios especiales" no debería existir en CRM Pickup; debe activarse desde contrato |
| **Campos `visita_*`, `superficie_m2`, `cantidad_personal`, `notas_instalacion`** | Schema `leads`, helpers flujo | Schema base facility | Modelo `LeadFlowLead` (`leadFlow.ts:62-91`); inputs ocultos en `nuevo/page.tsx` con `!isClientCrmUi` | Media (oculto) | Schema compartido entre clientes; ocultamiento ≠ inexistencia. Mejor: los campos del lead deberían ser jsonb gobernado por `lead_fields_config` |
| **"Socio" / "Socios"** | Agenda, sidebar default | Modelo y módulo `app/admin/socios` heredado | `app/admin/agenda/page.tsx:11` (`OwnerType = "lead" | "socio"`); `DEFAULT_ADMIN_SIDEBAR_MODULES` key `socios` label "Clientes" href `/admin/socios` | Media | Quick win: forzar `Cliente` o ningún owner por personalización. Estructural: owner_types vienen del contrato |
| **"LEADS87"** en algunos componentes dashboard | Dashboard | Producto consultivo Summer87 | Aún residual en `PipelineSummary.tsx`, `TopOpportunities.tsx` (**Doc 12T audit §A**); título principal neutralizado en 12T fix | Baja-media | Limpieza 12T cubre los visibles principales. Estructural: dashboard debería ser una composición declarada |
| **Reportes "Próximamente"** | Hub reportes | Catálogo roadmap hardcodeado | `ReportesClient.tsx` (cards `disabled: true`) | Baja | Reemplazar por catálogo derivado de `reports_config.reports[]` del contrato; solo se muestran los habilitados |
| **Marca "Summer87 Intelligence" / "Summer87 Leads"** | Shell, dashboard banner | `APP_SUITE_CONFIG` hardcodeado | `lib/config/appSuiteConfig.ts` | Media (decisión white-label) | Estructural: `branding` desde contrato |
| **Constructor / Configuración fuera del menú cliente** | Sidebar | Correcto: filtrado por modo + allowlist | `filterAdminSidebarModulesByMode` (categorías `internal_*` y `system_danger` excluidas en `client_crm`) | OK | No es herencia incorrecta; es protección |

---

## 6. Análisis por módulo

### A. Constructor / Instalador

**Qué genera hoy** (verificado en código):

- Cuestionario, diagnóstico, empresa, documentos, proceso-pipeline, motores-ia, reportes, auditoría (8 pasos en `lib/config/crmMode.ts:57-130`).
- Drafts persistidos vía `app/api/admin/constructor/installable-package/drafts/*` (CRUD + simulación + snapshots + aprobación + rechazo + meeting-decisions).
- Preset declarativo Pickup 4x4 (`lib/admin/installablePackagePickup4x4Preset.ts`) que produce **11 secciones de configuración**: `installation_manifest`, `client_identity`, `crm_modules_config`, `pipeline_config`, `lead_fields_config`, `permissions_config`, `ai_rules_config`, `reports_config`, `integrations_config`, `installer_decisions`, `activation_checklist`.
- UI de paquetes en `app/admin/constructor-crm/paquetes/[id]/page.tsx` que **verifica** la presencia de `crm_modules_config`, `pipeline_config`, `lead_fields_config`, `reports_config` en el payload (líneas 776-780).

**Qué NO está consumiendo el CRM operativo:**

```bash
# grep package_payload en superficie operativa: 0 resultados
grep -rn "package_payload\|crm_modules_config\|pipeline_config\|lead_fields_config\|reports_config" \
  app/admin/leads app/admin/dashboard app/admin/agenda app/admin/reportes lib/leads lib/crm
#   (sin matches)
```

Es decir: el Constructor diseña, simula, audita, aprueba y guarda evidencia — pero el CRM operativo **no abre el paquete**.

**Manifest / contract:** existe estructuralmente como JSON en `installable_package_drafts.package_payload`, pero **no hay**:
- Un loader runtime tipo `getActivePackageConfig()` que lo lea en el cliente.
- Un adapter por sección (`packageToLeadFields`, `packageToPipeline`, `packageToReports`).
- Versionado / activación / "instalado actual" para una instancia.

**Veredicto:** el Constructor es un **diseñador de planos**, no un **generador de CRMs**. El plano se queda en el cajón.

### B. Leads / Ficha

**Limpio (12S):**
- Lista, nuevo lead, ficha tab Datos en lo principal: sin Casalimpia, sin "Datos del prospecto", sin personal/superficie en `client_crm`, sin columna Pipeline DEBUG, sin "Relevamiento de visita" en `client_crm`.

**Sigue heredado (estructural):**
- Bloque **Iniciativa** + subbloque **Datos de Iniciativa** renderizados unconditionally en tab Datos (**Repo** `[id]/page.tsx:3852,3999`). No hay guard `!isClientCrmUi`.
- Tabs **Técnico / Consultor** decididas por **rol**, no por contrato Pickup ni por modo (`LEAD_TABS`, `getVisibleLeadTabs` en `[id]/page.tsx:653-847`).
- `NEXT_STEP_CONFIG` con copy *"servicios EASY"*, *"tab Consultor"* hardcodeado.
- `leadFlow.ts` con 8 pasos consultivos y helpers facility (`hasRelevamientoKeyFields`, `hasServiciosDefinidos`) — copy neutro, pero estructura idéntica para todos los clientes.

**Debería ser configurable:**
- Qué tabs existen (datos, comercial, técnico, consultor, contactos, acciones) y bajo qué condiciones — desde el contrato.
- Qué campos componen "Datos del lead" y "Entidad asociada" — desde `lead_fields_config.groups[]`.
- Qué pasos tiene el flujo — desde `pipeline_config.stages[]` o un `flow_config` paralelo (Pickup declara 9 etapas: nuevo_contacto, consulta_calificada, vehiculo_identificado, necesidad_detectada, presupuesto_enviado, negociacion, venta_ganada, venta_perdida, postventa_seguimiento — no coinciden con los 8 pasos consultivos de `leadFlow.ts`).

### C. Pipeline / LeadFlow

**Estado actual:**
- `pipelineOptions` se cargan desde `/api/admin/leads/pipelines` (tabla operativa) con fallback hardcodeado `Nuevo, Contactado, En seguimiento, Calificado, No interesado, Cerrado` (`nuevo/page.tsx:35-42`).
- `leadFlow.ts` mantiene 8 etapas consultivas independientes del pipeline operativo.
- Demo Pickup muestra todos los leads en "Nuevo lead" (Doc 12T) — sin distribución.

**Brecha:** el **preset Pickup declara 9 etapas específicas** (`installablePackagePickup4x4Preset.ts:56-67`) con keys `nuevo_contacto`, `consulta_calificada`, `vehiculo_identificado`, `necesidad_detectada`, `presupuesto_enviado`, `negociacion`, `venta_ganada`, `venta_perdida`, `postventa_seguimiento`. Estas etapas **no están instaladas** en la tabla de pipelines del CRM operativo demo, ni hay mecanismo runtime para hacerlo. El pipeline visible no responde a lo que diseñó el Constructor.

### D. Agenda

- `OwnerType = "lead" | "socio"` (**Repo** `agenda/page.tsx:11`) — el módulo presupone dos clases de owner heredadas del CRM base.
- Etiqueta visible: `labelSingularAgenda` viene de `usePersonalizacion()` que lee `portal_config.label_member_singular` con default `"Socio"` (**Repo** `lib/personalizacion.ts:11`). Si el cliente no setea personalización, sale "Socio" — no es Pickup.
- Tipos de actividad (llamada, whatsapp, email, reunión) son OK genéricos.

**Debería venir del contrato:**
- Tipos de actividad permitidos (`activity_types`).
- Qué entidades pueden ser owner (solo `lead`, o `lead` + `cliente`, o `lead` + `vehículo`).
- Labels singular/plural por entidad.

### E. Dashboard

- Tras 12T: "Flujo comercial" en lugar de "Flujo comercial LEADS87"; hints neutralizados; quedan referencias `LEADS87` en `PipelineSummary.tsx` y `TopOpportunities.tsx` (**Doc 12T audit §A**).
- Componentes fijos: `CommercialFlowKpis`, `PipelineSummary`, `LeadHealthSummary`, `CommercialPriorities`, `CommercialAlerts`, `ActivityStateSummary`, `PropuestasEsperandoRespuesta`, `StalledLeads`, `ConversionMetrics`, `TopOpportunities`. Todos se muestran a todos los clientes.

**Debería ser configurable:**
- Qué KPIs / bloques aparecen, en qué orden, con qué umbrales — desde `dashboards.blocks[]` del contrato.
- Pickup probablemente quiere métricas distintas (oportunidades por etapa, ventas ganadas/perdidas, presupuestos enviados, datos sincronizados Kore — son los 7 reportes declarados en el preset, no los 10 bloques actuales).

### F. Reportes

- Hub `ReportesClient.tsx` con catálogo hardcodeado de cards (mayoría `disabled: true`, `próximamente`).
- Solo **Comercial → Leads** está conectado (lista + CSV).

**Debería venir del contrato:**
- El catálogo de cards y su estado (habilitado / próximamente / oculto) → `reports_config.reports[]`.
- Pickup declara 7 reportes: oportunidades_por_etapa, clientes_activos, consultas_por_origen, presupuestos_enviados, ventas_ganadas_perdidas, seguimiento_pendiente, datos_sincronizados_kore — **ninguno** existe hoy como ruta operativa.

### G. Shell / branding

- `APP_SUITE_CONFIG` hardcodeado.
- `DEFAULT_ADMIN_SIDEBAR_MODULES` lista cerrada con keys: `dashboard_comercial`, `leads87`, `entidades` (label "Iniciativas"), `socios` (label "Clientes"), `agenda`, `reportes`, `ia`, `mesa_ayuda`, `neuroventas`, `personalizacion` (**Repo** `lib/admin/adminSidebarModules.ts:92-200`).
- `filterAdminSidebarModulesByMode` + `CLIENT_VISIBLE_MODULES` allowlist ocultan correctamente lo interno en `client_crm`.
- Logo: `/licencia.png` fijo.

**Debería venir del contrato:**
- Lista de módulos visibles + labels + iconos.
- Branding (logo, nombre, paleta) por cliente.

### H. Seguridad / permisos

- `APP_MODE=client_crm` fuerza `enableConstructor/Installer/BCR = false`, `showInternalMenus = false` (**Repo** `lib/config/appMode.ts:151-220`).
- `permissions/me` filtra keys internas con `filterPermissionKeysForClientCrm`.
- Guardas API `guardConstructorApiByMode` en endpoints constructor.
- 12O documenta 8/8 APIs críticas → 403.

**Veredicto:** **OK por APP_MODE**. Es la parte que sí está bien gobernada, pero es **protección** (qué bloquear), no **contrato** (qué exponer). Si mañana el contrato Pickup activara o desactivara módulos operativos, no hay mecanismo para que las APIs operativas respondan a esa decisión.

---

## 7. Dictamen técnico-producto

| Veredicto | Detalle |
|-----------|---------|
| **GO demo interna** | Vigente. La demo controlada (12M) sigue siendo válida con dataset ficticio y guion. |
| **NO-GO como "CRM generado por Constructor"** | El CRM operativo Pickup no está siendo renderizado desde el `package_payload`. Es la app base + ocultamientos + dataset. |
| **Brecha principal** | Falta el **contrato Constructor → CRM operativo** efectivo (loader runtime + adapter por sección + activación de contrato por instancia). |
| **Dependencia actual** | Pantallas hardcodeadas + parches de copy + allowlists + filtros por rol + portal_config. Sostenible para 1 demo interna; no escala a fábrica multi-cliente. |
| **Riesgo si no se cierra la brecha** | Cada nuevo cliente repetirá el ciclo 12S/12T (auditar, parchar copy, ocultar bloques, validar). El Constructor seguirá "vendiendo" configurabilidad que no existe en runtime. |

> El CRM Pickup 4x4 actual es **válido como demo operativa controlada**, pero **no debe considerarse todavía una instancia generada limpiamente por el Constructor**. La prioridad estratégica es pasar de **parches / ocultamientos** a un **contrato de configuración** que gobierne el CRM operativo.

---

## 8. Qué NO hacer

- **No** seguir corrigiendo solo síntomas de copy. 12S y 12T fueron necesarios para la demo; un 12V/12W solo de copy sería deuda perpetua.
- **No** declarar que "el Constructor ya genera CRMs limpios". Hoy solo genera **paquetes** documentales/declarativos; el CRM no los consume.
- **No** mostrar un cliente real como si su instancia hubiera sido generada limpiamente por el Constructor. Es la app base con ocultamientos.
- **No** borrar columnas BD (`visita_*`, `superficie_m2`, `cantidad_personal`, `notas_instalacion`, `servicios_especiales*`) ni la tabla `socios` sin estrategia. Hoy esos campos están **ocultos** en `client_crm`; borrarlos rompería otros flujos antes de tener un schema configurable real.
- **No** mezclar white-label (logo, suiteName, branding) con la arquitectura del Constructor. Son dos capas distintas; resolver branding cosméticamente no implica que el contrato esté funcionando.
- **No** tocar Supabase manualmente para "inyectar" un pipeline Pickup en la tabla operativa: no es contrato — es parche en producción que el próximo cliente pisaría.
- **No** asumir que `installer_decisions.installationMode = "draft_only"` significa que la instalación está controlada. Significa que el Constructor decidió no hacer escrituras externas; el CRM operativo no chequea ese estado.

---

## 9. Recomendación de arquitectura

### Contrato Constructor → CRM operativo (propuesta conceptual)

```yaml
crm_package_config:
  version: "12V-1"                        # versionado del contrato
  client:                                  # identidad + activación
    slug: pickup4x4
    name: "Pickup 4x4"
    activatedAt: "..."
    installedFromDraftId: "..."
  modules:                                 # qué módulos existen en el menú
    - key: leads
      label: "Leads"
      enabled: true
    - key: vehiculos
      enabled: true
    - key: clientes                        # antes "socios" — etiqueta por cliente
      label: "Clientes"
      enabled: true
    - key: oportunidades
      enabled: true
    - key: agenda
      enabled: true
    - key: reportes
      enabled: true
    - key: postventa
      enabled: true
    # iniciativas: AUSENTE → no se renderiza el bloque
  lead_fields:                             # gobierna nuevo lead + ficha
    groups:
      - group: "Cliente"
        fields: [nombre, telefono, email, localidad, tipo_cliente, origen]
      - group: "Vehículo"
        fields: [marca, modelo, año, matricula, tipo_uso, accesorios_interes]
      - group: "Oportunidad"
        fields: [producto_servicio, presupuesto_estimado, etapa, proxima_accion]
      - group: "Kore"
        fields: [kore_cliente_id, ultima_sincronizacion, confianza_dato]
  pipeline:                                # etapas del CRM
    stages:
      - { key: nuevo_contacto, label: "Nuevo contacto", order: 1 }
      - { key: consulta_calificada, order: 2 }
      - { key: vehiculo_identificado, order: 3 }
      - { key: necesidad_detectada, order: 4 }
      - { key: presupuesto_enviado, order: 5 }
      - { key: negociacion, order: 6 }
      - { key: venta_ganada, order: 7, terminal: won }
      - { key: venta_perdida, order: 8, terminal: lost }
      - { key: postventa_seguimiento, order: 9 }
  activity_types:                          # agenda
    - { key: llamada, label: "Llamada" }
    - { key: whatsapp, label: "WhatsApp" }
    - { key: visita_showroom, label: "Visita a showroom" }
    - { key: instalacion, label: "Instalación de accesorios" }
  dashboards:                              # qué bloques mostrar
    blocks:
      - { key: pipeline_summary, enabled: true }
      - { key: oportunidades_por_etapa, enabled: true }
      - { key: ventas_ganadas_perdidas, enabled: true }
      # flujo_comercial_macro / leads87: AUSENTE
  reports:                                 # catálogo activado
    - { key: oportunidades_por_etapa, enabled: true }
    - { key: ventas_ganadas_perdidas, enabled: true }
    - { key: presupuestos_enviados, enabled: true }
  labels:                                  # textos por instancia
    entity_singular: "Cliente"
    entity_plural: "Clientes"
    leadEntityRelation: null               # NO "iniciativa"
  visibility_rules:                        # quién ve qué (no qué se permite)
    leadDetail:
      hideTabs: [tecnico, consultor]       # Pickup no usa flujo consultivo
      hideBlocks: [relevamiento_visita, servicios_especiales, iniciativa_link]
  role_permissions:                        # roles del cliente
    - { role: pickup_responsable_comercial, permissions: [...] }
    - { role: vendedor, permissions: [...] }
  ai_rules:
    allowSendMessages: false
    allowExternalWrites: false
  branding:
    logoUrl: "..."
    suiteName: "Pickup 4x4 CRM"
    primaryColor: "#..."
  data_policy:
    externalSystem: "Kore"
    integrationMode: "read_only_initial"
    writeAllowed: false
```

**Lectura desde el CRM operativo:** un único loader (`lib/crmPackage/getActiveCrmPackageConfig.ts`, **conceptual, no implementado**) que devuelva el contrato activo para la instancia. Cada superficie consulta su sección:

- `AdminShell` lee `modules` + `branding`.
- `app/admin/leads/nuevo/page.tsx` lee `lead_fields.groups`.
- `app/admin/leads/[id]/page.tsx` lee `lead_fields.groups` + `visibility_rules.leadDetail`.
- Pipeline (lista + kanban) lee `pipeline.stages` (y se sincroniza con la tabla operativa al activar el paquete).
- `app/admin/dashboard/page.tsx` lee `dashboards.blocks`.
- `app/admin/agenda/page.tsx` lee `activity_types` + `labels`.
- `app/admin/reportes` lee `reports`.

Si el contrato no declara `iniciativas`, **el bloque no se renderiza** — no hay que ocultarlo a mano cliente por cliente.

---

## 10. Fases recomendadas

| Fase | Objetivo | Tipo |
|------|----------|------|
| **12U-1** | **Quick win**: ocultar bloque "Iniciativa" + warning + subbloque "Datos de Iniciativa" en `client_crm` (envolver en `!isClientCrmUi` en `[id]/page.tsx:3852,3999`) | Síntoma |
| **12U-2** | **Quick win**: ocultar tabs `tecnico` + `consultor` en `client_crm` independientemente de rol (`getVisibleLeadTabs`) | Síntoma |
| **12U-3** | **Quick win**: forzar `Cliente` como label de owner en Agenda en `client_crm` (override en `personalizacion` o guard en `agenda/page.tsx`) | Síntoma |
| **12V** | **Estructural**: diseñar contrato Constructor → CRM operativo (formato, versionado, activación, almacenamiento, loader server, loader client) | Arquitectura |
| **12W** | **Estructural**: adapter / render layer — primer módulo (ficha lead: `lead_fields` + `visibility_rules`); luego pipeline; luego dashboard; luego agenda; luego reportes | Arquitectura |
| **12X** | **Datos**: instancia demo limpia + Supabase separado (proyecto Pickup propio); rollback formal del dataset 12N | Infra |
| **12Y** | **White-label**: `branding` mínimo (logo, suiteName, primaryColor) leído del contrato | Producto |

**Distinción clara:**

- **12U-1/2/3** son **síntomas**. Hacen falta para que la demo comercial pulida funcione **antes** de tener el contrato. Son baratos y reversibles.
- **12V → 12W** son **arquitectura**. Sin esto el producto **no es** una fábrica de CRMs.
- **12X → 12Y** son ortogonales: infra y branding.

No mezclar.

---

## 11. Tabla de acciones

| Acción | Tipo | Prioridad | Riesgo | Requiere código | Requiere SQL | Comentario |
|--------|------|-----------|--------|-----------------|--------------|------------|
| Ocultar bloque Iniciativa en `client_crm` (warning + subbloque "Datos de Iniciativa") | Quick win | P1 | Bajo | Sí (`[id]/page.tsx`) | No | Envolver en `!isClientCrmUi`; revisable en 12W al adoptar contrato |
| Ocultar tabs Técnico / Consultor en `client_crm` independiente de rol | Quick win | P1 | Bajo | Sí (`[id]/page.tsx` `getVisibleLeadTabs`) | No | Evita que admin recorriendo la ficha vea pasos consultivos EASY |
| Forzar label `Cliente` en Agenda en `client_crm` | Quick win | P2 | Bajo | Sí (`agenda/page.tsx`) | No | Alternativa: cargar `portal_config.label_member_*` en seed; pero código es más controlable |
| Limpiar referencias residuales LEADS87 en `PipelineSummary.tsx` / `TopOpportunities.tsx` | Quick win | P2 | Bajo | Sí | No | Pendiente 12T (P2) |
| Crear contrato `crm_package_config` (esquema TypeScript + tabla `installed_package_config` o reutilizar `package_payload` + flag `is_active`) | Arquitectura | P1 producto | Medio | Sí + tipos | Sí (1 migración) | **Bloqueante** para 12W |
| Loader `getActiveCrmPackageConfig()` (server + provider client) | Arquitectura | P1 | Medio | Sí | No | Primer consumidor: ficha lead |
| Adapter ficha lead → `lead_fields_config` | Arquitectura | P1 | Alto (toca página de 6573 líneas) | Sí | No | Empezar por leer config y _no romper_ comportamiento actual (modo dual: legacy + contrato) |
| Adapter pipeline → `pipeline_config.stages` (con activación que escribe la tabla pipelines) | Arquitectura | P2 | Alto | Sí | Sí (escritura controlada por instalador) | Implica que activar paquete escriba pipelines reales |
| Adapter dashboard → `dashboards.blocks` | Arquitectura | P2 | Medio | Sí | No | Bloques opt-in |
| Adapter agenda → `activity_types` + `labels` | Arquitectura | P2 | Medio | Sí | No | |
| Adapter reportes → `reports_config` | Arquitectura | P2 | Bajo | Sí | No | Hub: mostrar solo habilitados |
| Branding desde contrato | Producto | P3 | Bajo | Sí | No | Logo, suiteName, color primario |
| Separar Supabase demo (proyecto Pickup propio) | Infra | P2 (antes de cliente real) | Medio | No | No (infra) | 12X |
| Documentar `crm_package_config` v1 | Doc | P1 | Bajo | No | No | Antes de 12W |

---

## 12. Dictamen final

El CRM Pickup 4x4 actual es válido como **demo operativa controlada**. No debe considerarse todavía una **instancia generada limpiamente por el Constructor**.

- El **Constructor** ya produce un contrato declarativo rico (preset `pickup_4x4` con 11 secciones).
- El **CRM operativo** no consume ese contrato: no hay loader runtime, no hay adapter por sección, no hay activación de configuración por instancia.
- La separación entre **app base + parches + APP_MODE** y **CRM generado** es la brecha principal del producto.
- La prioridad estratégica es pasar de **corregir copy y ocultar bloques** (12S / 12T / quick wins 12U-1/2/3) a **definir y consumir un contrato Constructor → CRM operativo** (12V → 12W).

Sin ese cambio, cada cliente nuevo repetirá el mismo ciclo de auditoría UX + parches + ocultamientos. Con ese cambio, agregar un cliente se reduce a: cuestionario → contrato → activación → CRM renderizado.

---

## 13. Confirmación de alcance (este documento)

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| Archivos TypeScript creados | ❌ No |
| Build ejecutado | ❌ No (no requerido para inspección documental) |
| SQL ejecutado o creado | ❌ No |
| Supabase modificado | ❌ No |
| Datos modificados / borrados / insertados | ❌ No |
| Migraciones creadas | ❌ No |
| APIs / middleware / env modificados | ❌ No |
| Commits | ❌ No |
| Entregable | Solo `docs/constructor-crm/auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md` |

---

*12U — Auditoría estructural Constructor vs CRM operativo Pickup 4x4. Distingue quick wins (12U-1/2/3) de arquitectura (12V → 12W). No reemplaza ni invalida 12M (GO demo interna).*
