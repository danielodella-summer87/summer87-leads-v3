# Plan Contrato Constructor → CRM Operativo 12V — Constructor CRM Summer87

**Versión:** 12V — diseño de contrato, no implementación
**Fecha:** 2026-05-19
**Ámbito:** producto + arquitectura. Define el contrato `crm_package_config` y la estrategia de activación.
**No se modificó código, datos, SQL, Supabase, APIs, middleware, env, ni se hicieron commits.**

**Documentos base:**

| Fase | Documento |
|------|-----------|
| 12M | `go-no-go-demo-interna-pickup4x4-client-crm-12M.md` |
| 12U | `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md` |
| 12U-1V | `validacion-ocultar-iniciativa-client-crm-pickup4x4-12U-1V.md` |
| 12U-2V | `validacion-ocultar-tabs-tecnico-consultor-client-crm-pickup4x4-12U-2V.md` |
| 12U-3V | `validacion-agenda-socio-socios-client-crm-pickup4x4-12U-3V.md` |

---

## 1. Resumen ejecutivo

- El Constructor ya genera un `package_payload` declarativo rico (preset Pickup 4x4: 11 secciones, **Repo** `lib/admin/installablePackagePickup4x4Preset.ts`). Existe persistencia en `installable_package_drafts` y UI de simulación / aprobación. Es un **diseñador de planos** funcional.
- El CRM operativo **no lo consume**. Ninguna pantalla operativa (`app/admin/leads/**`, `dashboard`, `agenda`, `reportes`) abre `package_payload`. Lo que el cliente ve es app base Summer87 + `APP_MODE=client_crm` + allowlist `CLIENT_VISIBLE_MODULES` + parches de copy (12S/12T) + ocultamientos puntuales (12U-1/2/3).
- **12V no es un parche visual.** Los quick wins 12U-1/2/3 ya cubrieron la urgencia de demo. 12V es diseño documental del **contrato** que debe gobernar el render del CRM operativo.
- 12V entrega: definición de `crm_package_config` v1, modelo de activación (recomendado y alternativas), diseño conceptual del loader, lista de adapters por módulo, primer adapter recomendado, decisiones de producto, qué requiere SQL y qué no, y fases siguientes (12W → 12X → 12Y).
- 12W será la implementación incremental: primero loader runtime con fallback legacy, luego un adapter por superficie, en este orden recomendado: ficha lead → nuevo lead → pipeline → agenda → dashboard → reportes.
- No se toca producción real, datos reales, ni multi-tenant todavía. Tampoco se promete white-label en 12V. Branding queda explícitamente fuera de scope (12Y).
- Este documento es crítico, no triunfalista: hoy hay **fábrica de paquetes + CRM hardcodeado**, no fábrica de CRMs.

---

## 2. Problema que resuelve

### Estado actual

```
CRM base Summer87 Leads
  + APP_MODE=client_crm                      (lib/config/appMode.ts)
  + CLIENT_VISIBLE_MODULES (env allowlist)   (oculta items del sidebar)
  + filterAdminSidebarModulesByMode          (excluye categorías internas)
  + parches 12S/12T (copy)                   (componentes UI editados)
  + ocultamientos 12U-1/2/3 (!isClientCrmUi) (bloque Iniciativa, tabs, Socios)
  + dataset 12N (UI)                         (12 leads ficticios)
  + portal_config (memberSingular/Plural)    (label "Socio" → "Cliente")
= demo operativa controlada
```

Síntomas:

- **Campos del lead hardcodeados** en `app/admin/leads/nuevo/page.tsx` y `app/admin/leads/[id]/page.tsx` (este último, 6573 líneas).
- **Pipeline hardcodeado** o leído desde tabla operativa con fallback fijo (`Nuevo, Contactado, …`), sin relación con las 9 etapas declaradas por el preset Pickup.
- **`leadFlow.ts`** con 8 pasos consultivos heredados (lib/leads/leadFlow.ts, 381 líneas), iguales para todos los clientes.
- **Dashboard hardcodeado**: 10 bloques fijos (`CommercialFlowKpis`, `PipelineSummary`, …) iguales para cualquier cliente.
- **Reportes hardcodeados**: catálogo de cards con `disabled: true / "próximamente"`.
- **Agenda parcialmente hardcodeada**: `OwnerType = "lead" | "socio"`; labels desde `portal_config` (no del contrato).
- **Branding hardcodeado**: `lib/config/appSuiteConfig.ts` (`suiteName: "Summer87 Intelligence"`), logo `/licencia.png`.

### Estado objetivo

```
Constructor (cuestionario + preset)
  └─> crm_package_config (versionado, validado)
        └─> getActiveCrmPackageConfig() (loader server + provider client)
              └─> adapters por módulo
                    ├─ packageToSidebarModules
                    ├─ packageToLeadFields
                    ├─ packageToLeadDetailBlocks
                    ├─ packageToPipelineStages
                    ├─ packageToLeadFlow
                    ├─ packageToAgendaConfig
                    ├─ packageToDashboardBlocks
                    ├─ packageToReportsCatalog
                    ├─ packageToLabels
                    ├─ packageToBranding
                    └─ packageToRolePermissions
              └─> CRM operativo renderizado desde contrato activo
                    (con fallback legacy controlado mientras se migra)
```

12V no propone reemplazar todo. Propone **introducir el contrato** y un **modo dual legacy + contrato** que permita migrar superficie por superficie sin romper la demo 12M.

---

## 3. Principios de diseño

1. **Configuración gobierna UI.** Una superficie del CRM operativo que dependa del cliente debe leer su sección del contrato; los `if (isClientCrmUi)` son deuda temporal, no arquitectura.
2. **No borrar legacy hasta tener adapter.** Cada hardcode se reemplaza por un adapter equivalente con fallback al comportamiento legacy. Nada de remover columnas, módulos o helpers sin un adapter probado.
3. **Migración incremental, no big-bang.** El loader se introduce primero. Cada adapter se implementa en una fase 12W-N independiente, validable en demo Pickup.
4. **Seguridad no depende solo del frontend.** Lo que el contrato **oculta** en UI también debe estar **bloqueado** por guards de API / middleware cuando aplique. El contrato describe presentación y catálogo, no reemplaza autorización.
5. **Contrato versionado.** `crm_package_config.version` es obligatorio. Cambios incompatibles suben versión mayor; el loader rechaza versiones desconocidas con error legible (no silencioso).
6. **Fallback explícito.** Si el contrato no declara una sección, el adapter usa default legacy explícito y registra que está usando fallback (no se inventa).
7. **No mezclar white-label con arquitectura.** Branding (logo, color, suiteName) es 12Y, posterior. Si entrara antes, esconde la brecha real.
8. **No prometer multi-tenant final.** El contrato es por **instancia** (una instancia = un despliegue / un cliente). Multi-tenant en un solo despliegue es 12X+ y requiere decisiones de seguridad/datos no resueltas hoy.
9. **Separar demo / cliente real / producción.** El contrato se introduce primero en demo Pickup. Cliente real solo después de validar 12W completo. Producción solo después de 12X (Supabase separado).
10. **No optimizar prematuramente.** Cachear el contrato es válido; agregar un servicio de configuración distribuido en 12V no lo es.

---

## 4. Propuesta de contrato `crm_package_config` v1

Estructura conceptual. **No es código, es contrato documental.** El TypeScript / Zod equivalente se redacta en 12V-2.

```yaml
# crm_package_config v1 — instancia Pickup 4x4 (ejemplo mínimo)
version: "1.0.0"                  # SemVer del schema del contrato (no del cliente)
contract_id: "pickup4x4-2026-05-19-0001"
client:
  slug: "pickup4x4"
  name: "Pickup 4x4"
  businessType: "Venta y equipamiento 4x4"
  country: "UY"
source:
  origin: "constructor_draft"     # constructor_draft | manual_seed | preset_inline
  installable_package_draft_id: "<uuid>"
  preset_key: "pickup_4x4"
  generated_at: "2026-05-19T12:00:00Z"
activation:
  status: "active"                # draft | staged | active | retired
  activated_at: "2026-05-19T12:05:00Z"
  activated_by: "summer87_superadmin"
  scope: "instance"               # instance | tenant (tenant queda para 12X+)
modules:                          # gobierna sidebar y enrutamiento permitido
  - { key: "dashboard_comercial", enabled: true }
  - { key: "leads87",             enabled: true, label: "Leads" }
  - { key: "agenda",              enabled: true }
  - { key: "reportes",            enabled: true }
  # entidades (iniciativas) AUSENTE → no se renderiza
  # socios AUSENTE → no se renderiza
  # ia, mesa_ayuda, neuroventas, personalizacion: decisión por cliente
lead_fields:                      # gobierna nuevo lead + ficha
  groups:
    - group: "Cliente"
      fields: ["nombre","telefono","email","localidad","tipo_cliente","origen","estado_comercial"]
    - group: "Vehículo"
      fields: ["marca","modelo","año","matricula","tipo_uso","accesorios_interes"]
    - group: "Oportunidad"
      fields: ["producto_servicio","presupuesto_estimado","vendedor_responsable","etapa","proxima_accion","fecha_limite","observaciones"]
    - group: "Kore"
      fields: ["kore_cliente_id","kore_documento_id","ultima_sincronizacion","fuente_dato","confianza_dato"]
pipeline:
  stages:
    - { key: "nuevo_contacto",        label: "Nuevo contacto",        order: 1 }
    - { key: "consulta_calificada",   label: "Consulta calificada",   order: 2 }
    - { key: "vehiculo_identificado", label: "Vehículo identificado", order: 3 }
    - { key: "necesidad_detectada",   label: "Necesidad detectada",   order: 4 }
    - { key: "presupuesto_enviado",   label: "Presupuesto enviado",   order: 5 }
    - { key: "negociacion",           label: "Negociación",           order: 6 }
    - { key: "venta_ganada",          label: "Venta ganada",          order: 7, terminal: "won" }
    - { key: "venta_perdida",         label: "Venta perdida",         order: 8, terminal: "lost" }
    - { key: "postventa_seguimiento", label: "Postventa / seguimiento", order: 9 }
activity_types:                   # agenda
  - { key: "llamada",          label: "Llamada" }
  - { key: "whatsapp",         label: "WhatsApp" }
  - { key: "email",            label: "Email" }
  - { key: "visita_showroom",  label: "Visita a showroom" }
  - { key: "instalacion",      label: "Instalación de accesorios" }
dashboards:
  blocks:
    - { key: "pipeline_summary",        enabled: true, order: 1 }
    - { key: "oportunidades_por_etapa", enabled: true, order: 2 }
    - { key: "ventas_ganadas_perdidas", enabled: true, order: 3 }
    - { key: "seguimiento_pendiente",   enabled: true, order: 4 }
  # commercial_flow_kpis_leads87: AUSENTE → no se muestra
reports:
  catalog:
    - { key: "oportunidades_por_etapa",   enabled: true }
    - { key: "ventas_ganadas_perdidas",   enabled: true }
    - { key: "presupuestos_enviados",     enabled: true }
    - { key: "consultas_por_origen",      enabled: true }
    - { key: "clientes_activos",          enabled: true }
    - { key: "seguimiento_pendiente",     enabled: true }
    - { key: "datos_sincronizados_kore",  enabled: false, reason: "pending_kore_credentials" }
labels:
  entity_singular: "Cliente"
  entity_plural: "Clientes"
  lead_singular: "Lead"
  lead_plural: "Leads"
  lead_entity_relation: null      # NO "iniciativa", NO "socio"
  owner_types: ["lead"]           # agenda no acepta "socio"
visibility_rules:
  lead_detail:
    hide_tabs: ["tecnico","consultor"]
    hide_blocks: ["iniciativa_link","relevamiento_visita","servicios_especiales","next_step_easy"]
  sidebar:
    hide_modules: ["entidades","socios"]
role_permissions:
  - { role: "summer87_superadmin",         permissions: ["*"] }
  - { role: "pickup_responsable_comercial",permissions: ["leads.*","reports.read","agenda.*"] }
  - { role: "vendedor",                    permissions: ["leads.read","leads.update","agenda.own"] }
  - { role: "lectura_gerencial",           permissions: ["reports.read","dashboard.read"] }
  - { role: "integracion_tecnica_ro",      permissions: ["integrations.read"] }
ai_rules:
  allow_send_messages: false
  allow_external_writes: false
  allow_price_changes: false
  allow_document_creation: false
  notes: "IA solo análisis, clasificación y recomendaciones."
branding:                         # opcional en 12V; obligatorio recién en 12Y
  logo_url: null
  suite_name: "Pickup 4x4 CRM"
  primary_color: null
integrations:
  - system: "Kore"
    mode: "read_only"
    write_allowed: false
    sync_direction: "kore_to_summer87"
    status: "pending_credentials"
data_policy:
  external_system: "Kore"
  integration_mode: "read_only_initial"
  write_allowed: false
legacy_compatibility:
  app_mode_required: "client_crm"
  fallback_strategy: "legacy_first" # legacy_first | contract_first | strict
  unknown_sections: "warn"          # warn | ignore | reject
validation:
  schema_version: "1.0.0"
  validated_at: "2026-05-19T12:05:00Z"
  validator: "zod"                  # conceptual
  errors: []
audit:
  created_by: "constructor_ui"
  approval_chain:
    - { actor: "summer87_superadmin", action: "approved", at: "2026-05-19T11:55:00Z" }
  notes: "Activación demo controlada. No replicar a cliente real sin 12W."
```

Por sección:

| Sección | Propósito | Ejemplo Pickup | Consumidor |
|---------|-----------|----------------|------------|
| `version` | SemVer del schema, gating de loader | `"1.0.0"` | loader |
| `contract_id` | identidad única, trazabilidad | `pickup4x4-…-0001` | loader, audit |
| `client` | identidad cliente | slug, name | branding, headers, logs |
| `source` | origen del contrato (draft/manual/preset) | `installable_package_draft_id` | audit, debug |
| `activation` | estado del contrato (draft/staged/active/retired) | `status: active` | loader (qué cargar), guards |
| `modules` | qué módulos existen en el sidebar | leads, agenda, reportes | `packageToSidebarModules` |
| `lead_fields` | grupos y campos del lead | Cliente / Vehículo / Oportunidad / Kore | `packageToLeadFields`, ficha + nuevo |
| `pipeline` | etapas del pipeline | 9 etapas Pickup | `packageToPipelineStages`, kanban + activación |
| `activity_types` | tipos de actividad agenda | llamada, visita_showroom, instalacion | `packageToAgendaConfig` |
| `dashboards` | bloques activados, orden | 4 bloques Pickup | `packageToDashboardBlocks` |
| `reports` | catálogo habilitado | 6 reportes activos, 1 pending | `packageToReportsCatalog` |
| `labels` | textos por instancia | "Cliente", `owner_types: ["lead"]` | `packageToLabels` |
| `visibility_rules` | qué tabs/bloques ocultar | hide tabs `tecnico`,`consultor` | adapters de ficha y sidebar |
| `role_permissions` | matriz roles × permisos | 5 roles Pickup | `packageToRolePermissions` (capa UI; auth real sigue en DB) |
| `ai_rules` | guardrails IA | `allow_send_messages: false` | motores IA |
| `branding` | white-label | suiteName "Pickup 4x4 CRM" | `packageToBranding` (12Y) |
| `integrations` | sistemas externos | Kore read-only | módulos integraciones |
| `data_policy` | reglas datos | read-only inicial | guards de escritura |
| `legacy_compatibility` | comportamiento del fallback | `legacy_first` | loader y adapters |
| `validation` | resultado validación al activar | errors[] | activación, audit |
| `audit` | trazabilidad de quién/cuándo aprobó | approval_chain | auditoría |

---

## 5. Relación con `package_payload` actual

Mapeo entre el preset Pickup (verificado en `lib/admin/installablePackagePickup4x4Preset.ts`) y `crm_package_config` v1:

| Preset actual (`package_payload`)            | `crm_package_config` v1            | Reuso |
|----------------------------------------------|------------------------------------|-------|
| `installation_manifest`                      | `source` + `activation`            | Reusar campos clave (preset, sourceConstructorId) |
| `client_identity`                            | `client`                           | Mapeo directo |
| `crm_modules_config.modules[]`               | `modules[]`                        | Mapeo directo; ojo: keys del preset (`clientes`, `vehiculos`, `oportunidades`, `pipeline_comercial`, …) **no coinciden** con keys del sidebar actual (`dashboard_comercial`, `leads87`, `entidades`, `socios`, `agenda`, `reportes`, `ia`, …). Requiere **tabla de equivalencias** en el adapter (no asumir match 1:1). |
| `pipeline_config.stages[]`                   | `pipeline.stages[]`                | Mapeo directo |
| `lead_fields_config.groups[]`                | `lead_fields.groups[]`             | Mapeo directo |
| `permissions_config.roles[]`                 | `role_permissions[].role`          | Solo roles; el **mapa de permisos por rol** **no existe** en el preset hoy (solo lista de roles con label). Pendiente normalizar. |
| `ai_rules_config.rules[]` (lista de strings) | `ai_rules.*` (flags booleanos)     | **No es reuso directo.** Hoy son frases en español; el contrato requiere flags estructurados. Hay que diseñar el mapeo (o admitir ambos: `rules_text[]` + `flags`). |
| `reports_config.reports[]`                   | `reports.catalog[]`                | Mapeo directo (agregando `enabled` y `reason`) |
| `integrations_config.integrations[]`         | `integrations[]`                   | Mapeo directo |
| `installer_decisions`                        | parte de `data_policy` + `audit`   | Reuso de `installationMode`, `externalWrites`, `koreWrite` |
| `activation_checklist`                       | `audit.approval_chain` (parcial)   | Reuso como histórico, no como contrato vivo |

**Faltan en el preset actual:**

- `activity_types` (agenda) — no existe en el preset Pickup.
- `dashboards.blocks` — el preset no declara qué bloques van al dashboard operativo.
- `labels` estructurado (entity singular/plural, owner_types).
- `visibility_rules` (qué tabs/bloques esconder en ficha lead).
- `branding` (logo, color, suiteName).
- Matriz `role × permisos` (solo hay lista de roles).
- `legacy_compatibility` y `validation` (metadatos del propio contrato).
- `contract_id` y `version` (`package_payload` no tiene SemVer del schema).

**Conclusión de mapeo:**

- ~60% del contrato v1 se puede derivar del `package_payload` actual.
- ~40% son piezas que el Constructor **todavía no genera** y deben sumarse al cuestionario / preset (12W o 12V-2).
- **No se debe consumir `package_payload` directamente desde el CRM operativo.** Siempre vía adapter. Razón: el `package_payload` actual mezcla intención (qué quiere el cliente) con metadatos del proceso (`activation_checklist`, `installer_decisions`). El adapter es quien decide qué llega al runtime.

---

## 6. Modelo de activación

Tres opciones evaluadas:

### Opción A — Reutilizar `installable_package_drafts.package_payload` + flag `is_active`

Agregar columna `is_active` (o un `status: 'active'`) sobre la tabla existente. El loader busca el draft activo del cliente y lo transforma vía adapters.

- **Ventajas:** sin tabla nueva; reutiliza la UI de drafts; trazabilidad ya existente.
- **Riesgos:** los drafts son **borradores** por diseño; tratar un draft como "instalado" mezcla dos conceptos. Mutar un draft activo cambia comportamiento runtime sin un evento explícito de "activación". Difícil rollback.
- **SQL requerido:** 1 columna nueva (`is_active boolean` o `installed_at timestamptz`) + índice parcial. **Mínimo.**

### Opción B — Tabla nueva `active_crm_package_configs` (o `installed_crm_packages`)

Tabla dedicada con `(client_slug, version, payload jsonb, status, activated_at, activated_by)` y `installable_package_draft_id` opcional. Activar = insertar fila con `status='active'` y `retired_at=null`; retirar = `status='retired'`.

- **Ventajas:** separación limpia entre "diseño" (drafts) e "instalación" (configs activas). Versionado nativo, rollback trivial (re-activar versión previa). Audit log natural.
- **Riesgos:** requiere SQL nuevo (tabla + RLS + índices). Necesita política clara de quién puede activar.
- **SQL requerido:** 1 tabla + RLS + 1-2 índices. **Moderado.** No en 12V.

### Opción C — Archivo/config temporal para demo (TypeScript/JSON local)

`lib/crmPackage/configs/pickup4x4.config.ts` exporta el contrato como constante. El loader lee de filesystem según `CLIENT_SLUG`.

- **Ventajas:** **cero SQL**, cero Supabase. Permite implementar el loader y los adapters en 12W sin tocar BD. Reversible (es código).
- **Riesgos:** no escala más allá de demo. No cubre activación por cliente, ni versionado en BD, ni rollback. Si se queda más allá de 12W, se vuelve deuda.
- **SQL requerido:** **ninguno**.

### Recomendación

**12V-1 / 12V-2 / 12W (todo el ciclo de loader + primeros adapters): Opción C.**

- Permite avanzar arquitectura sin SQL.
- Aísla la decisión de persistencia, que requiere más diseño (RLS, multi-tenant, scope).
- Mantiene la opción de migrar a Opción B sin cambiar contrato ni adapters (solo cambia el loader interno).

**12X (Supabase demo limpio): migrar a Opción B.**

- Tabla `active_crm_package_configs` dedicada.
- Opción A queda descartada: mezclar drafts e installs es lo que generó la confusión 12U en primer lugar.

> **Si Opción B requiere SQL, señalarlo explícitamente:** sí, requiere SQL. **No se crea en 12V.** Solo se documenta la intención. La fase 12X la implementa con migración versionada.

---

## 7. Runtime loader (diseño conceptual)

`getActiveCrmPackageConfig()` — **conceptual, no implementar en 12V.**

**Server-side primario:**

- Resuelve la instancia activa por `CLIENT_SLUG` (env) o, en futuro, por host / tenant.
- Lee desde la fuente elegida (Opción C: archivo; Opción B: tabla).
- Valida con schema (Zod en 12V-2) antes de devolver.
- Cachea por proceso (memoria) con invalidación por `activated_at`. No usar Redis ni servicios externos en 12V/12W.
- Si no hay contrato activo o el contrato falla validación: devuelve `null` y registra warning. **No throw** en el loader — los adapters deciden fallback.

**Client-side:**

- Provider React (`CrmPackageConfigProvider`) que recibe el contrato como prop del Server Component raíz (`AdminShell` o layout).
- Hook `useCrmPackageConfig()` para componentes client.
- **No** fetcheo client del contrato (evita SWR / latencia / leaks de info). El contrato se inyecta server → client una vez por request.

**Fallback legacy:**

- Si `getActiveCrmPackageConfig()` devuelve `null` o sección ausente: adapter usa default legacy hardcodeado existente.
- `legacy_compatibility.fallback_strategy: "legacy_first"` (default 12W): primero legacy, contrato solo override cuando declarado.
- `"contract_first"`: contrato manda, legacy es fallback por sección ausente. Recomendado a partir de 12W-3.
- `"strict"`: error si falta sección. Solo para cliente real en 12X+.

**Compatibilidad `client_crm`:**

- En `APP_MODE=client_crm`, si hay contrato: se aplica.
- Si no hay contrato: comportamiento actual (parches 12S/12T + ocultamientos 12U-1/2/3) sigue funcionando. La demo 12M **no se rompe**.
- En `APP_MODE=constructor_base` / `installation_prep`: loader devuelve `null` por diseño (esos modos no son CRM operativo).

**Anti-objetivos del loader:**

- No reemplaza guards de API (`guardConstructorApiByMode`, `permissions/me`). Son ortogonales.
- No decide auth. Lo que se ve y lo que se permite son capas distintas.
- No materializa el contrato a tablas operativas (pipelines, roles). Eso lo hace el **activador**, no el loader.

---

## 8. Adapters necesarios

| Adapter | Entrada | Salida | Consumidor | Prioridad | Riesgo | SQL |
|---------|---------|--------|------------|-----------|--------|-----|
| `packageToSidebarModules` | `modules[]`, `visibility_rules.sidebar` | `AdminSidebarModule[]` filtrado/ordenado | `AdminShell` / `lib/admin/adminSidebarModules.ts` | P2 | Bajo | No |
| `packageToLeadFields` | `lead_fields.groups[]` | Spec de inputs por grupo | `app/admin/leads/nuevo/page.tsx`, ficha tab Datos | **P1** | Medio (forma del estado del form) | No |
| `packageToLeadDetailBlocks` | `visibility_rules.lead_detail`, `modules[]` | Lista de bloques a renderizar en ficha (`iniciativa`, `relevamiento`, etc.) | `app/admin/leads/[id]/page.tsx` | **P1** | Alto (archivo de 6573 líneas) | No |
| `packageToPipelineStages` | `pipeline.stages[]` | Stages normalizadas + diff vs tabla operativa | Kanban, lista, ficha (selector etapa), activador | P2 | Alto (involucra escritura controlada a tabla pipelines al activar) | **Sí, en activación** |
| `packageToLeadFlow` | `pipeline.stages[]` (y futuro `flow_config`) | Versión de `leadFlow.ts` por instancia | `lib/leads/leadFlow.ts` y consumidores | P3 | Alto (helpers facility hardcodeados) | No |
| `packageToAgendaConfig` | `activity_types[]`, `labels.owner_types`, `labels.entity_*` | Tipos de actividad + owner types + labels | `app/admin/agenda/page.tsx` | P2 | Medio (owner_types hoy es enum TS) | No |
| `packageToDashboardBlocks` | `dashboards.blocks[]` | Lista ordenada de bloques habilitados | `app/admin/dashboard/page.tsx` | P2 | Medio (10 componentes hoy) | No |
| `packageToReportsCatalog` | `reports.catalog[]` | Cards visibles + estado (enabled/pending) | `app/admin/reportes/**` | P3 | Bajo | No |
| `packageToLabels` | `labels` | Labels resueltos por entidad/módulo | múltiples (sidebar, agenda, ficha) | P2 | Bajo (sustituye `portal_config` parcialmente) | No |
| `packageToBranding` | `branding` | suiteName, logoUrl, color | `lib/config/appSuiteConfig.ts` consumidores | P4 (12Y) | Bajo | No |
| `packageToRolePermissions` | `role_permissions[]` | Matriz roles × permisos para **UI** | navegación, gating de botones | P3 | Alto (no confundir con auth real) | No (no en UI; sí cuando llegue a DB) |

**Reglas comunes a todos los adapters:**

- Entrada inmutable. No mutar el contrato.
- Si la sección está ausente: devolver fallback explícito (legacy).
- Si la sección está malformada: devolver fallback y registrar warning (no romper la pantalla).
- Tipado estricto en salida (no `any`).
- Sin side effects (puros). El activador, no el adapter, es quien escribe tabla pipelines.

---

## 9. Primer adapter recomendado

**Recomendación: `packageToLeadFields` + `packageToLeadDetailBlocks` en pareja (12W-2).**

Evaluación por superficie:

| Candidato | Pro | Contra |
|-----------|-----|--------|
| Ficha lead (detail blocks + fields) | Mayor brecha visible (auditoría 12U §B). Es donde el cliente realmente "vive". Valida que el contrato puede gobernar UI compleja. | Archivo de 6573 líneas → alto riesgo de regresión. |
| Nuevo lead (lead fields) | Más acotado (1 página). Form simple. | Aislado: por sí solo no demuestra que el contrato gobierna el flujo del cliente. |
| Agenda | Acotada, owner_types es un cambio puntual. | Bajo valor demostrativo; ya casi resuelto por 12U-3. |
| Dashboard | Bloques opt-in son patrón claro. | Estructura repetida, poca complejidad de schema → no estresa el contrato. |
| Reportes | Casi mecánico (mostrar/ocultar cards). | Demasiado fácil; no valida el contrato realmente. |
| Sidebar | Alto impacto visual, bajo costo. | Choca con `CLIENT_VISIBLE_MODULES` + `filterAdminSidebarModulesByMode`: empezar acá obliga a resolver convivencia de **tres fuentes de verdad** simultáneamente. Mejor dejarlo para 12W-5. |

**Decisión recomendada:** ficha lead (detail blocks + fields) en pareja, fase **12W-2**.

- Es donde la auditoría 12U detectó la brecha más crítica.
- Resolverlo implica todo el patrón: loader → provider → hook → adapter → reemplazo de hardcodes con fallback.
- Si funciona ahí, funciona en todas las superficies más simples.
- **Mitigación del riesgo del archivo de 6573 líneas:** empezar leyendo el contrato pero **sin** quitar los hardcodes legacy. Solo enmascarar con visibility_rules. El refactor a render-from-config es 12W-2b. Esto se alinea con `fallback_strategy: legacy_first`.

**Alternativa más conservadora si se quiere validar el patrón antes:** `packageToReportsCatalog` (P3 ascendido a primero). Tres días, bajo riesgo, deja el patrón completo (loader + adapter + provider + hook) probado antes de tocar la ficha. Aceptable, pero el valor demostrativo es bajo.

**No recomendado como primero:** sidebar (conflicto con allowlist env) ni pipeline (requiere SQL en activación).

---

## 10. Modo dual legacy + contrato

Estrategia para convivencia mientras se migra:

| Caso | Comportamiento |
|------|----------------|
| Loader devuelve `null` (no hay contrato activo) | Cada adapter usa default legacy. CRM se comporta como hoy. **Demo 12M intacta.** |
| Loader devuelve contrato pero falla validación | Loader registra warning, devuelve `null`. Mismo path que el caso anterior. |
| Contrato presente, sección ausente | Adapter de esa sección usa fallback legacy. Otras secciones aplican contrato. |
| Contrato presente, sección presente, `fallback_strategy: legacy_first` | Adapter aplica solo overrides explícitos (p. ej. `hide_blocks`). Hardcodes no removidos siguen presentes salvo override. |
| Contrato presente, sección presente, `fallback_strategy: contract_first` | Adapter renderiza desde contrato; legacy se usa para campos no declarados. Recomendado a partir de 12W-3. |
| Contrato presente, sección presente, `fallback_strategy: strict` | Cualquier ausencia es error visible. Solo cliente real, **no demo**. |

**Flags de seguridad:**

- Toggle env `CRM_PACKAGE_CONFIG_ENABLED` (off por default) durante 12W. Permite encender el contrato por entorno (demo Pickup Vercel) sin afectar otros despliegues.
- `CRM_PACKAGE_CONFIG_STRATEGY=legacy_first|contract_first|strict` para forzar estrategia desde env durante pruebas.
- Logs del loader explicitan qué se cargó y qué se descartó (`source`, `version`, `contract_id`, `errors`).

**Validación de config (defensivo):**

- Zod schema (12V-2) valida estructura y tipos.
- Reglas adicionales: `pipeline.stages[].order` único; `modules[].key` único; `lead_fields.groups[].fields[]` sin duplicados.
- Validación falla → contrato no se aplica → fallback legacy. **Un contrato malformado no debe romper la demo.**

---

## 11. Tabla de decisiones de producto

| Decisión | Recomendación | Motivo | Riesgo | Fase |
|----------|---------------|--------|--------|------|
| ¿Dónde guardar el contrato activo? | Archivo TS local (Opción C) en 12V/12W; tabla dedicada (Opción B) en 12X | Permite avanzar sin SQL; tabla dedicada cuando haya RLS y rollback | Bajo en 12V; medio en 12X | 12V-1 / 12X |
| ¿Contrato por cliente o por APP_MODE? | Por **cliente/instancia** (`client.slug`) | APP_MODE describe entorno; contrato describe configuración del cliente. Son ortogonales. | Bajo | 12V-1 |
| ¿Pipeline se lee o se instala en tabla? | **Ambos**: contrato es fuente de verdad; activador escribe tabla pipelines | El kanban y otras pantallas ya leen de tabla. Contrato es lo que el activador materializa. | Alto (requiere SQL al activar) | 12W-4 |
| ¿Campos del lead van a columnas o JSON config? | **Híbrido**: columnas comunes siguen como hoy; campos específicos por cliente en JSON gobernado por `lead_fields_config` | Schema-breaking changes son caros; JSON cubre el long tail. | Alto si se intenta migrar todo a JSON | 12W-2b → 12X+ |
| ¿Branding entra en 12V? | **No.** Entra en 12Y | Branding sin contrato esconde la brecha real (lo dice principio 7) | Bajo | 12Y |
| ¿Reportes se ocultan o se generan dinámicamente? | **Se ocultan ahora**, se generan dinámicamente en 12W-6 | Hub actual ya tiene cards con `disabled: true`; ocultar es el primer paso. | Bajo | 12W-6 |
| ¿Permisos se derivan del contrato o siguen en tabla `roles`? | **Híbrido**: auth real sigue en DB (`roles`, `permissions/me`); contrato describe **UI gating** y catálogo de roles esperados | Mover auth completa al contrato es riesgo de seguridad. Solo capa visual primero. | Alto si se reemplaza auth real | 12W-3 (UI) / 12X+ (DB) |
| ¿Se mantiene `APP_MODE`? | **Sí, sin cambios.** APP_MODE sigue gobernando entorno y guards de API | APP_MODE es **infraestructura**; contrato es **configuración**. No mezclar. | Bajo | permanente |
| ¿`portal_config` (labels) coexiste con `labels` del contrato? | Contrato gana cuando está presente; `portal_config` queda como fallback. A futuro, deprecar `portal_config` | Evita duplicidad; mantiene compatibilidad | Medio | 12W-5 |
| ¿`CLIENT_VISIBLE_MODULES` (env allowlist) se mantiene? | Mantener hasta `packageToSidebarModules` (12W-5). Después, deprecarlo gradualmente | Allowlist env y contrato pueden contradecirse | Medio | 12W-5+ |

---

## 12. Qué requiere SQL

### No requiere SQL (todo lo de 12V y la mayor parte de 12W)

- Diseño documental del contrato (este documento).
- Tipos TypeScript + schema Zod (12V-2).
- Loader runtime con Opción C (archivo TS local).
- Adapters de UI: ficha lead, nuevo lead, agenda (labels), dashboard, reportes, sidebar.
- Ocultamientos adicionales basados en `visibility_rules`.
- Provider React + hook `useCrmPackageConfig()`.
- Flags env (`CRM_PACKAGE_CONFIG_ENABLED`, `CRM_PACKAGE_CONFIG_STRATEGY`).

### Sí puede requerir SQL (no en 12V; identificar y dejar pendiente)

- **Tabla `active_crm_package_configs`** (Opción B). Activación, versionado, audit. Fase 12X.
- **Escritura de pipelines** al activar un contrato: si se decide que `packageToPipelineStages` materializa stages en la tabla operativa de pipelines, eso es SQL controlado (upsert con `client_slug`). Fase 12W-4. **No** en 12V.
- **Tabla de auditoría de activación** (`crm_package_activations`): quién activó qué versión, cuándo, con qué resultado. Fase 12X.
- **Campos dinámicos del lead** (si se decide persistir `lead_fields` extra como `jsonb` en `leads`): requiere migración y backfill. Fase 12X+. **Postergar.**
- **Tabla `crm_package_clients`** o equivalente si llega multi-tenant en un mismo despliegue. Fase 12X+. No comprometer ahora.

**12V no escribe SQL. No crea migraciones. No toca Supabase. Solo identifica.**

---

## 13. Fases recomendadas

| Fase | Objetivo | Entregable | Tipo | SQL |
|------|----------|------------|------|-----|
| **12V-1** | Documento contrato v1 + decisiones de activación | Este documento | Doc | No |
| **12V-2** | Tipo TypeScript del contrato + schema Zod, sin runtime | `types/crmPackageConfig.ts` + `lib/crmPackage/schema.ts` | Tipos | No |
| **12W-1** | Loader runtime + provider + hook + flag env + fallback legacy | `lib/crmPackage/getActiveCrmPackageConfig.ts`, provider, hook | Arquitectura | No |
| **12W-2** | Adapter ficha lead (`packageToLeadFields` + `packageToLeadDetailBlocks`) | Lectura de `visibility_rules` y `lead_fields` en `app/admin/leads/[id]/page.tsx` | Adapter | No |
| **12W-3** | Adapter nuevo lead | Lectura de `lead_fields` en `app/admin/leads/nuevo/page.tsx` | Adapter | No |
| **12W-4** | Adapter pipeline + activador que materializa stages | `packageToPipelineStages` + endpoint activación con escritura controlada | Adapter + activación | **Sí** (escritura controlada) |
| **12W-5** | Adapter agenda + activity_types + labels + sidebar | `packageToAgendaConfig`, `packageToLabels`, `packageToSidebarModules` | Adapter | No |
| **12W-6** | Adapter dashboard + reportes | `packageToDashboardBlocks`, `packageToReportsCatalog` | Adapter | No |
| **12X** | Supabase demo limpio + tabla `active_crm_package_configs` + migración Opción C → B | Migración + RLS + audit table | Infra + datos | **Sí** |
| **12Y** | White-label / branding desde contrato | `packageToBranding`, override de `APP_SUITE_CONFIG` | Producto | No |

**Distinción:**

- **Quick wins:** 12U-1, 12U-2, 12U-3 — ya hechos. No más quick wins de copy.
- **Arquitectura:** 12V → 12W-6.
- **Infra:** 12X.
- **Branding:** 12Y.

---

## 14. Riesgos

1. **Sobre-ingeniería.** Diseñar un contrato que cubra hipotéticos clientes futuros antes de tener uno real funcionando es muerte por arquitectura. Mitigación: contrato v1 modela lo que Pickup necesita hoy, nada más.
2. **Romper la demo actual.** Cualquier cambio que toque ficha lead o sidebar puede regresionar 12M. Mitigación: flag `CRM_PACKAGE_CONFIG_ENABLED=false` por default, `fallback_strategy: legacy_first` durante todo 12W.
3. **Mezclar contrato con datos reales.** Aplicar el contrato Pickup sobre datos reales (no ficticios) en el mismo Supabase es un error mayor. Mitigación: 12X antes de cliente real.
4. **Duplicar config.** Tres fuentes de verdad para el mismo dato (env, contrato, `portal_config`) es la regresión silenciosa más probable. Mitigación: tabla de precedencia explícita en la documentación del loader y deprecación gradual de las fuentes redundantes.
5. **Meter SQL antes del diseño.** Crear `active_crm_package_configs` ahora cierra opciones. Mitigación: Opción C en 12V/12W; SQL recién en 12X.
6. **Confundir `APP_MODE` con tenant.** `APP_MODE` describe entorno (constructor / installer / cliente); contrato describe configuración del cliente. Mezclarlos genera código no-debug-able.
7. **Hacer white-label sin resolver contrato.** Pintar un logo distinto en una app hardcodeada vende humo. Mitigación: 12Y va después de 12W.
8. **Acoplar adapters al preset Pickup 4x4.** Los adapters deben leer del contrato, no del preset. El preset Pickup es solo un caso. Mitigación: tests con contratos sintéticos distintos en 12W.
9. **Romper CRMs futuros con compatibilidad rígida.** SemVer del contrato + `legacy_compatibility.unknown_sections: warn` permite agregar secciones sin romper instancias viejas.
10. **Invalidar validaciones 12N–12U.** Cualquier cambio runtime debe re-validar el dataset 12N y los GO 12M, 12U-1V/2V/3V. Mitigación: cada fase 12W-N entrega su propio `validacion-…-12W-N-V.md`.
11. **Pretender que esto reemplaza autorización.** El contrato describe presentación; auth sigue en DB. Documentarlo en cada adapter que toque permisos.
12. **Que el Constructor no aprenda a generar las secciones nuevas** (`activity_types`, `dashboards`, `labels`, `visibility_rules`, `branding`). El preset Pickup actual no las tiene. Mitigación: 12V-2 actualiza el preset; el cuestionario del Constructor se amplía gradualmente en 12W.

---

## 15. Dictamen final

12V debe tratarse como la **fase de diseño del contrato de configuración**, no como implementación apresurada. El objetivo es dejar definido **cómo** el Constructor pasa de generar paquetes documentales a **gobernar el CRM operativo**. La implementación debe empezar en 12W con un loader y un primer adapter, manteniendo fallback legacy y sin tocar Supabase hasta 12X.

Sin 12V/12W, cada cliente nuevo repite el ciclo 12S/12T/12U: auditar copy, parchar, ocultar, validar. Con 12V/12W, agregar un cliente se reduce a: cuestionario → contrato → activación → CRM renderizado. La diferencia entre un CRM hardcodeado con parches y una fábrica de CRMs **es exactamente esta capa**.

No comprometer multi-tenant en un mismo despliegue. No comprometer white-label en 12V. No tocar producción. La demo 12M es válida y debe seguir siéndolo después de cada fase 12W.

---

## 16. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| TypeScript creado/editado | ❌ No |
| SQL | ❌ No |
| Supabase | ❌ No |
| Datos modificados / borrados / insertados | ❌ No |
| APIs / middleware / env modificados | ❌ No |
| Migraciones creadas | ❌ No |
| Commits | ❌ No |
| Vercel / infra | ❌ No |
| Solo documentación | ✅ Sí |
| Entregable | `docs/constructor-crm/plan-contrato-constructor-crm-operativo-12V.md` |

---

*12V — Plan de contrato Constructor → CRM operativo. Diseño del contrato `crm_package_config`, estrategia de activación, adapters y fases. No reemplaza ni invalida 12M (GO demo interna) ni 12U (auditoría brecha). Habilita 12W (implementación incremental).*
