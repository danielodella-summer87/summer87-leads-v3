# Validación Lecturas Sensibles Client CRM 12I-impl-5V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-5V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `docs/constructor-crm/validacion-gestion-usuarios-bloqueada-client-crm-12I-impl-4V.md`, `lib/admin/internalRoleAccess.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye GETs reales en runtime ni consulta de datos en BD.

**Commit de implementación:** `bb7342e` — *Restrict sensitive reads in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura de handlers/helpers y **`npm run build` exitoso** — que en **`APP_MODE=client_crm`**:

1. Se **bloquean** lecturas internas de configuración de usuarios y matriz de roles/permisos (`GET config/usuarios`, `GET config/roles`).
2. Se **filtran** las permission keys efectivas en **`GET /api/admin/permissions/me`** sin bloquear el endpoint (UI operativa).
3. **`GET /api/admin/users`** permanece **abierto** por dependencia operativa de **Agenda**.

Complementa los bloqueos de **escritura** (12I-impl-1 a 4) y reduce exposición de datos de fábrica en clones cliente piloto.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper (bloqueo lectura)** | `guardInternalSensitiveReadByMode()` |
| **Helper (filtrado permisos)** | `filterPermissionKeysForClientCrm()` |
| **Archivo helper** | `lib/admin/internalRoleAccess.ts` |
| **Commit** | `bb7342e` |
| **Build** | ✅ OK |

### Endpoints

| Endpoint | Comportamiento en `client_crm` | Error / nota |
|----------|-------------------------------|----------------|
| `GET /api/admin/config/usuarios` | **403** antes de Supabase | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` |
| `GET /api/admin/config/roles` | **403** antes de Supabase | Idem |
| `GET /api/admin/permissions/me` | **200** — filtrado de `data` (keys) | No bloqueado |
| `GET /api/admin/users` | **Sin cambio** (histórico) | Pendiente — Agenda |

**Archivos route modificados en implementación:** `app/api/admin/config/usuarios/route.ts`, `app/api/admin/config/roles/route.ts`, `app/api/admin/permissions/me/route.ts`.

---

## 4. Qué hace el bloqueo

En **`client_crm`**, al inicio de **`GET`** en `config/usuarios` y `config/roles`:

1. `guardInternalSensitiveReadByMode()` → si bloqueado, **403 JSON** inmediato.
2. **No** se ejecuta `allowDevOrRequire`, consultas a `app_users` / `roles` / `permissions` / `role_permissions`, ni construcción de matriz.

### Datos que deja de exponerse vía esas rutas

| Fuente | Contenido sensible evitado |
|--------|---------------------------|
| `config/usuarios` | Listado administrativo `app_users` (email, roles, `is_active`, timestamps) |
| `config/roles` | Roles, `permissions`, asignaciones `role_permissions`, `is_system` |

En **`constructor_base`** el guard devuelve `null`; comportamiento histórico intacto.

---

## 5. Qué hace el filtrado de `permissions/me`

En **`client_crm`**, tras resolver usuario y cargar keys desde `role_permissions`, se aplica **`filterPermissionKeysForClientCrm(keys)`** antes de armar la respuesta JSON.

### Keys exactas removidas

- `system.danger`
- `config.admin`
- `config.update`
- `config.read`

### Patrones (substring) removidos

- `constructor`
- `installer`
- `bcr`
- `roles`
- `users`
- `permissions`
- `portal.internal`
- `support.act_as`
- `danger`

### Conservadas (ejemplos operativos)

- `leads.read`, `leads.write`, `leads.create` (alias en otros layers)
- `helpdesk.read`, `helpdesk.write`, `helpdesk.manage` (si existen en BD para el rol)

El endpoint **no** se bloquea: `usePermissions()` y módulos **Leads / Agenda / Reportes** dependen de esta API. El mapa estático por rol en `app/lib/rbac.ts` sigue aplicándose en el cliente además del array filtrado.

---

## 6. Por qué `GET /api/admin/users` no se bloqueó

| Evidencia | Detalle |
|-----------|---------|
| **Consumidor** | `app/admin/agenda/page.tsx` |
| **Uso** | Listado de usuarios activos para tarjetas de agenda y modal de actividades (`invited_user_ids`) |
| **Riesgo si se bloquea** | Agenda puede dejar de cargar participantes cuando `agenda` está en `CLIENT_VISIBLE_MODULES` |
| **Decisión piloto** | Mantener endpoint abierto; mutaciones ya bloqueadas en 12I-impl-4 |

### Pendiente

- Endpoint acotado por **tenant / `company_id`**, o
- Uso exclusivo de **`/api/admin/agenda/owners`** (u homólogo) para el módulo Agenda.

---

## 7. Lectura técnica

| Aspecto | Comportamiento |
|---------|----------------|
| Orden `config/usuarios` y `config/roles` | guard → `allowDevOrRequire` → Supabase → respuesta |
| Orden `permissions/me` | resolución usuario → keys BD → **filtro** → payload `{ user, data, error }` |
| **`constructor_base`** | Sin guards/filtros adicionales por modo |
| **`installation_prep`** | Lecturas sensibles no bloqueadas por este guard en implementación actual |
| **APP_MODE vs RBAC** | Capa complementaria; no sustituye RLS ni aislamiento multi-tenant |

**Escrituras previas (sin cambio en 12I-impl-5):** POST/PATCH `config/roles`, mutaciones `users/*`, `act-as`, `set-role` con políticas propias.

---

## 8. Qué NO se validó

| Ítem | Nota |
|------|------|
| GETs reales en runtime | No ejecutados en esta fase documental |
| `client_crm` con sesión y consola | Pendiente staging |
| Agenda tras dejar `/api/admin/users` abierto | No probado en runtime |
| Staging / clon / production | No probado |
| `.env.local` | No modificado |
| Contenido real de `permissions` en BD | No verificado |
| UI `/admin/configuracion/usuarios` o `/roles` por URL | No validado |
| Filtrado por tenant / `company_id` | Fuera de alcance |

---

## 9. Riesgos residuales

| Riesgo | Mitigación / fase |
|--------|-------------------|
| `GET /api/admin/users` — listado global activo | 12I-impl-7, RLS, tenant |
| `permissions/me` + mapa estático `admin` en frontend | Revisar exposición UI; 12I-impl-6 |
| URLs de configuración accesibles sin menú | 12I-impl-6 (guards UI) |
| Agenda depende de usuarios globales | Endpoint acotado 12I-impl-7 |
| Validación integral clon | 12J |
| RLS / `company_id` cliente real | Diseño + runbook 12K |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| `GET config/usuarios` (`client_crm`) | ✅ Bloqueado (bb7342e) |
| `GET config/roles` (`client_crm`) | ✅ Bloqueado (bb7342e) |
| `permissions/me` filtrado | ✅ Implementado (bb7342e) |
| `GET /api/admin/users` | ⏸️ Abierto — Agenda |
| Gestión sensible usuarios (POST) | ✅ Bloqueada (4fafacd) |
| **act-as** | ✅ Bloqueado (487f8c6) |
| **users/set-role** | ✅ Restringido (b4af5ba) |
| Matriz roles/permisos (escritura) | ✅ Bloqueada (7c3a543) |
| **system_danger** | ✅ Bloqueado (12H-impl) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| **portal_config** PATCH | ✅ Sanitizado (12H-impl-4V) |
| **Build** | ✅ OK |
| **Commit** | `bb7342e` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-6** | Revisar UI usuarios/roles por `APP_MODE` |
| **12I-impl-7** | Reemplazar `/api/admin/users` en Agenda por endpoint acotado |
| **12J** | Validación con clon/staging real (GETs + operación) |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Preparación piloto primer cliente |

---

## 12. Decisión actual

> **En 12I-impl-5V solo se documenta la validación por revisión de código y build.**  
> **No se ejecutan GETs reales ni se consultan datos.**

---

## 13. Confirmación de alcance (fase 12I-impl-5V documental)

- ✅ Validación por diff + build documentada  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12I-impl-5V — Lecturas sensibles en client_crm. Implementación: bb7342e. Serie RBAC lectura/escritura: 12I-impl-1V … 5V.*
