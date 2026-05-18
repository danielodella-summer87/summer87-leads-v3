# Política System Danger en Client CRM 12H — Constructor CRM Summer87

**Versión:** Fase 12H (política funcional/técnica — documental)  
**Relacionado con:** `docs/constructor-crm/diseno-tecnico-flags-modo-12A.md`, `docs/constructor-crm/diseno-implementacion-menu-por-modo-12B.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `docs/constructor-crm/validacion-apis-constructor-bloqueadas-12F.md`, `docs/constructor-crm/checklist-env-clon-client-crm-12G.md`, `lib/config/appMode.ts`, `lib/admin/adminSidebarModules.ts`

**Estado:** clasificación y política propuesta. **No** implementa bloqueos nuevos en esta fase.

**Contexto:** Constructor (UI + `/api/admin/constructor/*`) ya está oculto/bloqueado en `client_crm` (12C–12F). Quedan superficies sensibles **fuera** de ese árbol.

---

## 2. Resumen ejecutivo

Tras validar menú, UI Constructor y APIs Constructor en modo **`client_crm`**, el riesgo residual se concentra en:

- **Configuración** del portal y del CRM (`/admin/configuracion/*`, `portal_config`)
- **Acciones destructivas** (p. ej. `reset-db`, seeds, initialize)
- **Identidad y permisos** (usuarios, roles, invites, act-as)
- **IA y pipelines** con impacto estructural

Este documento **clasifica** rutas UI y APIs en categorías (`operational_config`, `internal_config`, `system_danger`, `support_admin`) y define **política objetivo** para clones cliente. La implementación incremental queda para **12H-impl** y fases **12I–12L**.

---

## 3. Principio principal

> **En `client_crm`, el cliente debe operar su CRM; no administrar la fábrica, resetear el sistema ni cambiar seguridad estructural.**

| Actor en clon cliente | Puede | No debe |
|------------------------|-------|---------|
| Usuario operativo | Leads, agenda, reportes contratados | Constructor, BCR, reset |
| Propietario / admin cliente (futuro) | Usuarios de su org, personalización acotada | Roles Summer87, `portal_config` completo, IA interna |
| Summer87 (soporte) | Bypass documentado en `installation_prep` o herramientas L3 | Confundir prep con producción cliente |

---

## 4. Diferencia entre categorías

| Categoría | Definición | Ejemplos conceptuales |
|-----------|------------|------------------------|
| **operational_config** | Ajustes que el **cliente** podría usar con permisos acotados para operar su negocio | Pipelines operativos, estados de lead, opciones de leads, personalización de labels |
| **internal_config** | Configuración de **plataforma Summer87** o de la instancia como producto | `portal_config` completo, módulos-menú global, rubros plantilla, IA global |
| **system_danger** | Acciones **destructivas**, irreversibles o de borrado masivo | `reset-db`, seeds masivos, delete usuario, initialize módulos en prod |
| **support_admin** | Acciones de **soporte técnico interno** (no cliente final) | `act-as`, invites de staff, tokens de reset, herramientas de diagnóstico |

**Relación con `menuCategory` (12B):** `operational_config` y `support` en sidebar; `system_danger` para reset y herramientas críticas; Constructor ya mapeado a `internal_*`.

---

## 5. Rutas UI a revisar

Leyenda visibilidad menú: depende de **`CLIENT_VISIBLE_MODULES`** + filtro por modo + **`filterNavByRole`**. Sin allowlist de `configuracion`, el ítem footer **no** aparece en `client_crm` (validado 12D), pero la **ruta puede seguir existiendo** si se conoce la URL.

| Ruta | Clasificación sugerida | constructor_base | installation_prep | client_crm | Nota |
|------|----------------------|:----------------:|:-----------------:|:----------:|------|
| `/admin/leads` | Operativo (no config) | Sí | Sí | Si contrato / allowlist | Core CRM |
| `/admin/leads87` | Operativo | Sí | Sí | Si `leads87` en allowlist | Alias producto |
| `/admin/agenda` | Operativo | Sí | Sí | Si `agenda` en allowlist | — |
| `/admin/reportes` | Operativo | Sí | Sí | Si `reportes` en allowlist | Solo reportes **operativos** |
| `/admin/mesa-de-ayuda` | Operativo / support | Sí | Sí | Si `mesa_ayuda` en allowlist | — |
| `/admin/personalizacion` | operational_config | Sí | Sí | Solo si allowlist + política 12I | Footer; labels cliente |
| `/admin/configuracion` | Mezcla internal + danger | Sí | Sí | **No** por defecto; solo subconjunto futuro | Página hub; incluye reset/seed en código actual |
| `/admin/configuracion/modulos-menu` | internal_config | Sí | Sí (Summer87) | **No** cliente | Edita `sidebar_modules` |
| `/admin/configuracion/usuarios` | operational_config / internal | Sí | Sí | Propietario futuro / pendiente 12I | Gestión usuarios |
| `/admin/configuracion/roles` | internal_config | Sí | Sí (Summer87) | **No** cliente | Permisos agencia |
| `/admin/configuracion/roles/[id]` | internal_config | Sí | Sí (Summer87) | **No** cliente | Detalle permisos |
| `/admin/configuracion/pipelines` | operational_config | Sí | Sí | Condicional / pendiente | Impacto en Kanban |
| `/admin/configuracion/ia` | internal_config | Sí | Sí (Summer87) | **No** cliente | IA plataforma |
| `/admin/configuracion/leads` | operational_config | Sí | Sí | Condicional | Opciones/políticas leads |
| `/admin/configuracion/personalizacion` | operational_config | Sí | Sí | Condicional | Sub-ruta config |
| `/admin/configuracion/rubros` | internal_config | Sí | Sí | **No** cliente | Tab en hub principal |
| `/admin/configuracion/servicios` | operational_config | Sí | Sí | Condicional | Catálogo servicios |
| `/admin/configuracion/comerciales` | operational_config | Sí | Sí | Condicional | — |
| `/admin/configuracion/estados` | operational_config | Sí | Sí | Condicional | — |
| `/admin/ia` | internal_config (menú) | Sí | Sí | **No** por defecto | Motores/prompts; distinto de IA en lead |

**Estado actual código:** no hay layout guard en `/admin/configuracion` equivalente a `constructor-crm/layout.tsx`. Ocultar menú **no** bloquea URL directa ni APIs.

---

## 6. APIs sensibles a revisar

| API | Riesgo | Clasificación | Política sugerida en `client_crm` |
|-----|--------|---------------|-----------------------------------|
| `POST /api/admin/config/reset-db` | Borrado masivo tablas | **system_danger** | **Bloquear siempre** (403) |
| `GET/POST /api/admin/setup/minimal-seed` | Seed / bootstrap instancia | **system_danger** | **Bloquear** (usado desde `/admin/configuracion`) |
| `POST /api/admin/modules/initialize` | Inicialización módulos | **system_danger** / support_admin | **Bloquear** cliente; Summer87 en prep |
| `GET/PATCH /api/admin/config/portal` | `sidebar_modules`, branding | **internal_config** | Lectura acotada; PATCH sin keys internas |
| `GET/POST /api/admin/config/usuarios` | Lista/gestión usuarios | operational_config / internal | Acotar por rol cliente (12I) |
| `POST /api/admin/config/usuarios/act-as` | Suplantación | **support_admin** | Solo Summer87 |
| `GET /api/admin/config/usuarios/active` | Sesión activa | operational_config | Permitir propio usuario |
| `POST /api/admin/users/delete` | Eliminar usuario | **system_danger** | Bloquear o solo admin org acotado |
| `POST /api/admin/users/invite` | Invitar usuarios | operational_config | Invites solo dominio cliente |
| `POST /api/admin/users/set-role` | Cambiar rol | internal_config | **No** asignar roles Summer87 |
| `POST /api/admin/users/toggle-active` | Activar/desactivar | operational_config | Acotar alcance org |
| `POST /api/admin/roles/toggle-permission` | Permisos agencia | **internal_config** | **Bloquear** cliente |
| `GET/POST/PATCH /api/admin/leads/pipelines` | Estructura comercial | operational_config | Permitir con permiso; sin plantillas BCR |
| `GET/PATCH /api/admin/config/ia` | Config IA global | **internal_config** | **Bloquear** cliente |
| `POST /api/admin/config/ia/generate` | Generación IA config | internal_config | **Bloquear** cliente |
| `GET/PATCH /api/admin/config/leads` | Políticas leads | operational_config | Revisar campo a campo |
| `GET/POST/PATCH .../config/leads/options` | Opciones leads | operational_config | Condicional |
| `GET /api/admin/permissions/me` | Permisos sesión | operational_config | **Permitir** (necesario para UI) |
| `/api/admin/ia/*` | Perfiles, prompts, sugerencias | **internal_config** | **Bloquear** o subset operativo futuro |
| `/api/admin/constructor/*` | Fábrica | internal_constructor | **Ya bloqueado** 12E/12F |

**Estado actual:** solo `/api/admin/constructor/*` tiene `guardConstructorApiByMode()`. **`reset-db` y demás no tienen guard por `APP_MODE` hoy.**

---

## 7. Política para reset-db

| Modo | Política |
|------|----------|
| **client_crm** | **Bloqueado** — API 403 + sin UI + sin menú |
| **installation_prep** | **Bloqueado** salvo autorización interna explícita (token + rol Summer87) |
| **constructor_base** | Permitido solo con **rol interno**, token servidor (`RESET_DB_TOKEN`), **confirmación fuerte** |

Reglas adicionales:

- **Nunca** en menú de clon cliente (`system_danger`).
- **Nunca** depender solo del frontend: la UI en `/admin/configuracion` llama `POST /api/admin/config/reset-db` hoy — debe existir guard servidor (12H-impl-1).
- Documentar en runbook: operación solo en base madre o entorno desechable.

---

## 8. Política para modulos-menu / portal_config

| Riesgo | Mitigación objetivo |
|--------|---------------------|
| Reintroducir módulos **internal_*** vía `sidebar_modules` | En `client_crm`, **sanitizar** al guardar y al mergear: strip keys constructor, paquetes, BCR |
| Propietario cliente activa Constructor sin saberlo | Bloquear PATCH que incluya `href` bajo `/admin/constructor-crm` |
| Personalización operativa legítima | Fase posterior: allowlist de keys editables (`leads87`, `agenda`, labels) |

**Rutas:** `/admin/configuracion/modulos-menu` → **internal_config**; API `portal` → validación server-side.

**Estado actual:** `sanitizeSidebarModulesForPersist` filtra keys conocidas del default, pero **no** impide categorías internas por modo.

---

## 9. Política para usuarios y roles

| Tema | Política |
|------|----------|
| Usuarios operativos del cliente | Futuro: propietario invita usuarios de su organización |
| Superadmin / staff Summer87 | **No** asignable desde clon cliente |
| `set-role`, `toggle-permission` | **internal_config** — solo Summer87 |
| `act-as` | **support_admin** — solo L3 |
| `delete` usuario | Tratar como **system_danger** o operational con confirmación |

Profundización: fase **12I** (roles cliente vs Summer87).

---

## 10. Política para pipelines

| Aspecto | Política |
|---------|----------|
| Uso operativo | Cliente con pipeline comercial **puede** necesitar ver/editar etapas |
| Riesgo | Romper Kanban, etapas compartidas, integración leads87 |
| client_crm | Permitir edición **operativa** con permiso `operational_config`; **no** plantillas internas ni BCR |
| Decisión producto | **Pendiente** — no cerrar en 12H |

Marcar para validación en **12J / 12L** con clon Pickup.

---

## 11. Política para IA

| Superficie | client_crm |
|------------|------------|
| IA en contexto de **lead** (propuestas, gamma, etc.) | Operativa si está en contrato |
| `/admin/ia`, perfiles/prompts globales | **Ocultar** — internal_config |
| `/api/admin/ia/*`, `/api/admin/config/ia` | **Bloquear** cliente |
| Motores Constructor | Ya bloqueados con Constructor |

No mezclar **configuración IA Summer87** con **IA operativa del negocio del cliente**.

---

## 12. Política para reportes

| Tipo | client_crm |
|------|------------|
| `/admin/reportes` operativos | Visible si `reportes` en `CLIENT_VISIBLE_MODULES` |
| Reportes Constructor (`/admin/constructor-crm/reportes`) | Bloqueados con UI Constructor |
| Auditoría, BCR, instalación | **No** exponer |

Datos: solo del **tenant/cliente** del clon; sin cruce con base madre.

---

## 13. Matriz de decisión

| Superficie | Permitido cliente | Solo propietario cliente | Solo Summer87 | Bloqueado siempre en client_crm | Pendiente diseño |
|------------|:-----------------:|:------------------------:|:-------------:|:-------------------------------:|:----------------:|
| Leads / leads87 | ✅ | — | — | — | — |
| Agenda | ✅ | — | — | — | — |
| Reportes operativos | ✅ | — | — | — | — |
| Mesa de ayuda | ✅ | — | — | — | — |
| Personalización (labels) | — | ✅ | — | — | — |
| Usuarios org cliente | — | ✅ | — | — | ✅ |
| Pipelines operativos | — | ✅ | — | — | ✅ |
| Config leads / estados | — | ✅ | — | — | ✅ |
| Roles / permisos agencia | — | — | ✅ | — | — |
| portal_config / modulos-menu | — | — | ✅ | — | — |
| IA interna / `/admin/ia` | — | — | ✅ | — | — |
| Constructor UI/API | — | — | — | ✅ | — |
| reset-db | — | — | — | ✅ | — |
| minimal-seed / initialize | — | — | — | ✅ | — |
| act-as | — | — | ✅ | — | — |
| invites staff Summer87 | — | — | ✅ | — | — |

---

## 14. Recomendación técnica futura

Implementación **incremental** (no big-bang):

1. **12H-impl-1:** `guardSystemDangerByMode()` en `POST /api/admin/config/reset-db` (+ opcional `minimal-seed`, `modules/initialize`).
2. **12H-impl-2:** Lista `system_danger` en sidebar + rechazo API genérico por prefijo.
3. Separar **operational_config** vs **internal_config** en guards de `/admin/configuracion/*` (layout o middleware de segmento config).
4. **12I:** usuarios/roles cliente.
5. Validar con `APP_MODE=client_crm` (checklist §16).

Prioridad: **reset-db** antes que refinar pipelines o IA.

---

## 15. Posible helper futuro (no implementar en 12H)

Módulo conceptual: `lib/admin/clientCrmAccess.ts` (nombre tentativo).

| Función | Propósito |
|---------|-----------|
| `isSystemDangerRoute(pathname)` | Match `/admin/configuracion` + acciones reset, etc. |
| `isInternalConfigRoute(pathname)` | modulos-menu, roles, ia config |
| `guardSystemDangerByMode()` | `NextResponse` 403 si `client_crm` |
| `guardOperationalConfigByRole()` | RBAC + modo |
| `sanitizeClientVisibleSidebarModules(modules)` | Strip `internal_*` al persistir en client_crm |
| `rejectInternalSidebarKeysInClientCrm(keys)` | Validación PATCH `portal` |

Reutilizar `isClientCrmMode()` de `lib/config/appMode.ts`.

---

## 16. Validaciones futuras

- [ ] `client_crm`: `POST /api/admin/config/reset-db` → **403**
- [ ] `client_crm`: menú sin Configuración si `configuracion` ∉ allowlist
- [ ] `client_crm`: PATCH `portal` no persiste keys constructor / internal
- [ ] `client_crm`: usuario no puede `set-role` a admin Summer87
- [ ] `constructor_base`: reset-db sigue disponible con controles actuales (token)
- [ ] `constructor_base`: flujos internos sin regresión
- [ ] `npm run build` exitoso tras cada impl

Referencias: **12D** (menú), **12F** (Constructor API), **12G** (ENV).

---

## 17. Riesgos si no se aborda

| Riesgo | Impacto |
|--------|---------|
| Cliente invoca **reset-db** | Pérdida total de datos del clon |
| **portal_config** reactiva módulos internos | Confusión + fuga de UX Constructor |
| Cliente modifica **roles/permisos** agencia | Escalación privilegios |
| Exposición **IA/prompts** internos | IP Summer87, costos, compliance |
| Edición pipeline sin guía | CRM inoperable para usuarios finales |
| Solo ocultar menú | URL/API directa (lección 12C–12F) |
| Reputación / contrato | Entrega de clon “no seguro” |

---

## 18. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12H-impl-1** | Bloquear `/api/admin/config/reset-db` (+ seeds críticos) en `client_crm` |
| **12H-impl-2** | `system_danger` en sidebar/API genérica |
| **12I** | Roles cliente vs Summer87 |
| **12J** | Validación configuración limitada en `client_crm` |
| **12K** | `.env.example` (si se aprueba; checklist 12G existe) |
| **12L** | Prueba clon/staging real |

---

## 19. Decisión actual

> **En 12H solo se documenta la política.**  
> **No se bloquea todavía `reset-db` ni configuración sensible fuera de Constructor.**

Lo ya implementado (Constructor menú/UI/API) **no** sustituye esta política.

---

## 20. Confirmación de alcance (fase 12H documental)

- ✅ Política `system_danger` / config clasificada  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12H — Política system_danger y configuración en client_crm. Siguiente implementación recomendada: 12H-impl-1 (reset-db).*
