# Inventario técnico Roles y Permisos 12I-impl-0 — Constructor CRM Summer87

**Versión:** Fase 12I-impl-0 (inventario por inspección de código — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `lib/rbac/requirePermission.ts`, `app/lib/rbac.ts`, `middleware.ts`

**Estado:** inventario de implementación actual en repo. **No** modifica usuarios, roles, permisos ni RLS.

**Método:** lectura de archivos en `lib/auth`, `lib/rbac`, `app/api/admin/users|roles|config/usuarios|config/roles|permissions`, `app/admin/configuracion/*`, `app/admin/AdminShell.tsx`, `middleware.ts`. **No** se ejecutó SQL ni consulta a Supabase.

**Alcance explícito:** lo marcado como *pendiente de verificar en BD* no fue confirmado contra datos reales.

---

## 2. Resumen ejecutivo

El proyecto combina **varias capas de identidad/rol** que no están unificadas:

1. **Sesión interna** (`app_sessions` + cookie `crm_session` con token) → `getInternalUserIdFromRequest` / `getAppUserFromRequest`.
2. **Cookie prototipo CRM** (`crm_session` en formato JSON base64 con `CrmRole`: superadmin | admin | staff | member) → `lib/auth/session.ts`, bypass parcial en `middleware.ts`.
3. **Rol operativo en BD** (`app_users.role_id` → `roles.name`) normalizado a `RoleKey` en `app/lib/rbac.ts` (admin, operador, comercial, …).
4. **Permisos en BD** (`role_permissions` + `permissions.key`) vía `lib/rbac/requirePermission.ts`.
5. **Mapa estático** `PERMISSIONS_BY_ROLE` en `app/lib/rbac.ts` (usado por UI vía `usePermissions` + `normalizeRole`).
6. **Filtro de menú** `filterNavByRole` en `AdminShell` (subconjunto distinto de `RoleKey`).

**`APP_MODE=client_crm`** ya bloquea Constructor, system_danger y sanitiza `portal_config`, pero **no** aplica guards en rutas `/api/admin/users/*`, `/api/admin/roles/*` ni `/api/admin/config/usuarios/*` / `config/roles/*` (confirmado por búsqueda: sin `isClientCrmMode` en esos archivos).

---

## 3. Tipos y enums encontrados

| Nombre | Archivo | Valores encontrados | Uso | Nota |
|--------|---------|---------------------|-----|------|
| **`CrmRole`** | `lib/auth/session.ts`, `src/lib/auth/session.ts` | `superadmin`, `admin`, `staff`, `member` | Cookie `crm_session` (JSON); `getSession()`; layout `/admin/configuracion` bypass; páginas `/app/*` | Confirmado por código. **Distinto** del rol en `roles.name` de BD. |
| **`CRM_VALID_ROLES`** | `middleware.ts`, APIs Constructor assist | Mismos 4 valores | Decodificar cookie CRM en middleware | Confirmado |
| **`RoleKey` (RBAC admin)** | `app/lib/rbac.ts` | `admin`, `operador`, `comercial`, `tecnico`, `consultor`, `viewer` | `canAccessPath`, `hasPermission`, `normalizeRole`, middleware vía `roles.name` | Confirmado |
| **`RoleKey` (AdminShell)** | `app/admin/AdminShell.tsx` | `admin`, `operador`, `comercial`, `viewer` | `filterNavByRole` (oculta prefijos de menú) | Subconjunto; no incluye `tecnico`/`consultor` |
| **`RoleKey` (reports UI)** | `components/reports/roleTheme.ts` | (tipado propio — revisar archivo si se usa) | Temas UI reportes | Inferido por nombre |
| **`ALLOWED_ROLES` (invites)** | `app/api/admin/config/invites/route.ts` | `admin`, `operador`, `comercial`, `viewer` | POST allowlist invitaciones | Confirmado; **sin** `superadmin` |
| **`ALLOWED_ROLES` (InviteForm UI)** | `app/admin/configuracion/usuarios/InviteForm.tsx` | Igual que API invites | Select invitación | Confirmado |
| **`AppUser` (RBAC API)** | `lib/rbac/requirePermission.ts` | `{ id, role_id }` | Retorno de `requirePermission` | Confirmado |
| **Preset label** | `lib/admin/installablePackagePickup4x4Preset.ts` | `summer87_superadmin` (key de preset, no tipo TS) | Paquete instalable | No es `CrmRole`; es metadata de preset |
| **`roles.is_system`** | `app/api/admin/config/roles/route.ts`, `RolesTab.tsx` | boolean en SELECT/INSERT | Marcar roles de sistema | Campo usado en API; **pendiente verificar en BD** qué filas tienen `is_system=true` |
| **`owner`** | — | **No encontrado** como tipo/enum en archivos inspeccionados | — | No documentar como rol implementado |

**Tablas referenciadas en código (existencia inferida por queries, no por migraciones en esta fase):**

| Tabla | Archivos que la usan | Pendiente BD |
|-------|----------------------|--------------|
| `app_users` | users/*, permissions/me, middleware, auth/me | Esquema completo, seeds, roles reales |
| `roles` | config/usuarios, config/roles, set-role UI | Nombres reales (`admin` vs `superadmin` vs `operaciones`) |
| `permissions` | config/roles API, roles/[id] page | Columnas reales (ver § inconsistencia) |
| `role_permissions` | requirePermission, toggle-permission, config/roles PATCH | — |
| `app_sessions` | `lib/auth/internalAuth.ts` | — |
| `app_user_invites` | `config/invites/route.ts` | — |

**Inconsistencia `permissions` (código):**

- API `GET /api/admin/config/roles` selecciona: `id, key, module, action, description`.
- Página `app/admin/configuracion/roles/[id]/page.tsx` selecciona: `id, label, category`.

→ **Pendiente verificar en BD** si la tabla tiene ambos conjuntos de columnas o si una ruta está desactualizada.

---

## 4. Helpers RBAC y auth

| Helper | Archivo | Qué valida | Entradas | Salida / comportamiento | Riesgos / notas |
|--------|---------|------------|----------|-------------------------|-----------------|
| **`requirePermission`** | `lib/rbac/requirePermission.ts` | Clave en `permissions.key` vía `role_permissions` | `Request`, `permissionKey` | `AppUser` o `null` (caller suele responder 403) | Si no hay cookie `x-user-id`, **toma el primer `app_users` activo** (orden `created_at`). Riesgo alto en dev/API sin cookie. |
| **`requireAnyPermission`** | `lib/rbac/requirePermission.ts` | Al menos una clave del array | `Request`, `permissionKeys[]` | Igual que arriba | Mismo fallback de usuario |
| **`loadUserWithPermissionKeys`** | `lib/rbac/requirePermission.ts` (privado) | Carga usuario + keys | Cookie `x-user-id` o fallback | — | Fallback primer admin activo |
| **`extractPermissionKeys`** | `lib/rbac/extractPermissionKeys.ts` | Parseo join Supabase | Filas `role_permissions` | `string[]` | — |
| **`getActiveUserPermissions`** | `lib/rbac/server.ts` | Permisos sesión interna | `getInternalUserIdFromRequest()` | `string[]` | Usado en layout configuración |
| **`hasPermission`** | `lib/rbac/server.ts` | Una clave | permissionKey | `boolean` | Server-only |
| **`getActiveUserId`** | `lib/rbac/server.ts` | ID sesión | — | `string \| null` | Alias de internal user id |
| **`getInternalUserIdFromRequest`** | `lib/auth/server.ts` | Sesión `app_sessions` | Cookie `crm_session` (token) | `userId` | Mismo nombre de cookie que cookie CRM JSON (ver abajo) |
| **`getAppUserFromRequest`** | `lib/auth/server.ts` | Usuario + `roles.name` | Sesión interna | Objeto con `role` string | Usado en páginas server configuración |
| **`getSession` / `CrmSession`** | `lib/auth/session.ts` | Cookie CRM prototipo | `crm_session` base64 JSON | `{ id, role: CrmRole }` | Layout config: bypass si `admin` o `superadmin` |
| **`getSessionUser`** | `lib/auth/internalAuth.ts` | Token hash en `app_sessions` | Valor cookie | `{ userId }` | Cookie name **`crm_session`** |
| **`canAccessPath`** | `app/lib/rbac.ts` | Prefijos `/admin/*` por `RoleKey` | `roles.name` normalizado | `boolean` | `/admin/configuracion` solo `admin`; admin ve todo |
| **`hasPermission` (client map)** | `app/lib/rbac.ts` | Mapa estático `PERMISSIONS_BY_ROLE` | `UserWithRole` | `boolean` | `admin` → siempre true |
| **`normalizeRole`** | `app/lib/rbac.ts` | Alias `operaciones`→`operador`, etc. | string | `RoleKey \| null` | Usado en permissions/me |
| **`filterNavByRole`** | `app/admin/AdminShell.tsx` | Oculta hrefs por rol UI | Rol de `/api/auth/me` | Nav filtrado | **No** es guard de API; subconjunto de roles |
| **`usePermissions`** | `lib/rbac/usePermissions.ts` | Fetch `/api/admin/permissions/me` + mapa rol | — | `hasPermission(key)` | Combina keys BD + mapa estático |
| **`allowDevOrRequire`** | Varios (`config/usuarios`, `config/roles`, IA, …) | En **no producción** devuelve `{ id: "dev" }` sin chequear permiso | req, perm | Usuario fake | **Bypass total en desarrollo** |

**Alias de permisos confirmados:**

- `leads.create` → `leads.write` (`requirePermission.ts`, `app/lib/rbac.ts`).

**No existe** carpeta `lib/permissions/*` en el repo.

**`proxy.ts`:** no encontrado en el proyecto (búsqueda glob).

---

## 5. APIs de usuarios y roles

Leyenda riesgo `client_crm`: evaluación si un usuario con sesión válida y rol/permiso amplio en clon cliente pudiera abusar la API **sin** guard `APP_MODE` adicional.

| API | Método | Archivo | Acción | Permisos / auth en código | Riesgo `client_crm` | Recomendación futura |
|-----|--------|---------|--------|---------------------------|---------------------|----------------------|
| `/api/admin/users` | GET | `app/api/admin/users/route.ts` | Lista `app_users` activos | `requirePermission(req, "leads.read")` | **Medio** — cualquier rol con `leads.read` ve todos los usuarios | Filtrar por tenant; subir permiso a `users.read` cliente |
| `/api/admin/users/invite` | POST | `app/api/admin/users/invite/route.ts` | Insert/update `app_users` + email Resend | Solo `getInternalUserIdFromRequest` | **Alto** — sin chequeo de permiso ni rol destino | `users.manage_client` + allowlist roles; deny internos |
| `/api/admin/users/delete` | POST | `app/api/admin/users/delete/route.ts` | DELETE `app_users` | Solo sesión interna | **Alto** | Deny en `client_crm`; confirmación; no borrar internos |
| `/api/admin/users/set-role` | POST | `app/api/admin/users/set-role/route.ts` | UPDATE `role_id` cualquiera | Solo sesión interna | **Crítico** — cualquier rol UUID de tabla `roles` | 12I-impl-2: deny superadmin/sistema; allowlist cliente |
| `/api/admin/users/toggle-active` | POST | `app/api/admin/users/toggle-active/route.ts` | UPDATE `is_active` | Solo sesión interna | **Alto** | Guard modo + no desactivar cuentas Summer87 |
| `/api/admin/users/resend-invite` | POST | `app/api/admin/users/resend-invite/route.ts` | Email invitación | Solo sesión interna | **Medio** | Misma política que invite |
| `/api/admin/config/usuarios` | GET | `app/api/admin/config/usuarios/route.ts` | Lista completa `app_users` | `allowDevOrRequire(..., "config.read")` | **Alto** en prod si tiene `config.read` | Deny o scope cliente en `client_crm` |
| `/api/admin/config/usuarios/act-as` | POST | `app/api/admin/config/usuarios/act-as/route.ts` | Setea cookie `x-user-id` | `config.admin` (prod); dev bypass | **Crítico** — impersonación | 12I-impl-3: **denegar** en `client_crm` |
| `/api/admin/config/usuarios/active` | GET | `app/api/admin/config/usuarios/active/route.ts` | Lee cookie `x-user-id` | **Sin auth** explícito | **Medio** — filtra usuario impersonado | Documentar; restringir en prod |
| `/api/admin/config/roles` | GET | `app/api/admin/config/roles/route.ts` | Roles + permisos + matriz | `config.read` (prod) | **Alto** — expone permisos internos | 12I-impl-1: deny GET o filtrar en `client_crm` |
| `/api/admin/config/roles` | POST | mismo | Crea rol `is_system: false` | `config.admin` | **Alto** | Deny en `client_crm` |
| `/api/admin/config/roles` | PATCH | mismo | Reemplaza `role_permissions` de un rol | `config.admin` | **Crítico** — puede ampliar cualquier rol | 12I-impl-1: deny PATCH en `client_crm` |
| `/api/admin/roles/toggle-permission` | POST | `app/api/admin/roles/toggle-permission/route.ts` | INSERT/DELETE una fila `role_permissions` | Solo sesión interna | **Crítico** — sin `requirePermission` | 12I-impl-1: deny en `client_crm` |
| `/api/admin/permissions/me` | GET | `app/api/admin/permissions/me/route.ts` | Rol + keys efectivas | Auth Supabase o sesión interna | **Medio** — fuente de verdad UI | 12I-impl-5: no exponer keys internas en `client_crm` |

**API relacionada (invites allowlist):**

| API | Método | Archivo | Nota |
|-----|--------|---------|------|
| `/api/admin/config/invites` | POST | `app/api/admin/config/invites/route.ts` | `ALLOWED_ROLES` acotado; solo sesión; tabla `app_user_invites` |

**`APP_MODE` en estas APIs:** **no aplicado** (inspección mayo 2026).

---

## 6. Rutas UI

| Ruta | Archivo / componente | Función | Visible en menú (default) | Riesgo `client_crm` | Política sugerida (12I) |
|------|----------------------|---------|---------------------------|---------------------|-------------------------|
| `/admin/configuracion/usuarios` | `app/admin/configuracion/usuarios/page.tsx` | Lista usuarios; forms a set-role, toggle-active, delete; `InviteForm` | Footer `configuracion` — oculto si no allowlist / filtro rol | **Alto** — select con **todos** los `roles` de BD | Solo roles cliente; ocultar ruta o guard layout |
| `/admin/configuracion/roles` | `app/admin/configuracion/roles/page.tsx` | Lista roles; link a detalle | Idem | **Alto** | No cliente; URL directa posible |
| `/admin/configuracion/roles/[id]` | `app/admin/configuracion/roles/[id]/page.tsx` | Toggle permisos vía form → `toggle-permission` | Idem | **Crítico** | Deny en `client_crm` |
| `/admin/configuracion/modulos-menu` | `app/admin/configuracion/modulos-menu/page.tsx` | Edita menú → PATCH portal | internal_config en menú | **Medio** — PATCH sanitizado server-side | Ocultar UI; política 12H |
| `/admin/configuracion` | `app/admin/configuracion/page.tsx` + tabs (`RolesTab`, reset, seed…) | Hub config + **RolesTab** (API config/roles) + minimal-seed UI | Idem | **Alto** | Restringir tabs en `client_crm` |
| `/admin/personalizacion` | `app/admin/personalizacion/page.tsx` | Labels operativos | Footer | **Bajo–medio** | Condicional allowlist |

**Guards UI:**

| Mecanismo | Alcance | Nota |
|-----------|---------|------|
| `app/admin/configuracion/layout.tsx` | Hijas de `/admin/configuracion` | Bypass si `getSession()` CRM es `admin` o `superadmin`; si no, requiere permiso BD `config.admin` |
| `middleware.ts` + `canAccessPath` | `/admin/configuracion` solo `RoleKey` **`admin`** (nombre en `roles.name`) | Usuario `operador` con URL directa → **403** |
| `filterNavByRole` | Oculta `/admin/configuracion` a no-admin | No bloquea API |
| `APP_MODE` | Sin guard en páginas usuarios/roles inspeccionadas | Brecha vs 12I |

**AdminShell:** rol desde `GET /api/auth/me` (`app_user.role` = `roles.name`), no desde `permissions/me`.

---

## 7. Permisos literales encontrados en código

Solo claves **observadas** en `requirePermission`, `requireAnyPermission`, `app/lib/rbac.ts` o rutas citadas. Lista en BD puede ser mayor (*pendiente verificar en BD*).

| Permiso literal | Archivo(s) representativos | Qué protege | Categoría sugerida | Nota |
|-----------------|----------------------------|-------------|-------------------|------|
| `system.danger` | `config/reset-db/route.ts` | Reset DB | system_danger | + `guardSystemDangerByMode` en client_crm |
| `config.admin` | `config/usuarios/act-as`, `config/roles` POST/PATCH, `leads/unassigned` | Admin config, act-as, roles write | internal / support_admin | Crítico en clon |
| `config.read` | `config/usuarios`, `config/roles` GET, IA read, constructor package | Lectura configuración | internal | Dev bypass |
| `config.update` | minimal-seed, services, agency-roles, IA write, modules/initialize | Escritura config | internal | seed/initialize + mode guard |
| `leads.read` | `leads/*`, `users` GET | Lectura leads / listado users | client_operational | users GET acoplado a leads |
| `leads.write` | `leads/*` mutaciones | Escritura leads | client_operational | — |
| `leads.create` | `empresas/convert-to-lead` | Alias → `leads.write` | client_operational | Alias en código |
| `helpdesk.read` | `app/lib/rbac.ts` (mapa estático) | — | client_operational | **No** visto en requirePermission API |
| `helpdesk.write` | `app/lib/rbac.ts` (mapa estático) | — | client_operational | Idem |
| `*` (wildcard) | `app/lib/rbac.ts` — rol `admin` en mapa | Todos en UI vía `hasPermission` | internal (UI) | Solo mapa cliente, no BD |

**No encontrados** en código inspeccionado (no listar como existentes): `constructor.*`, `installer.*`, `roles.manage_client`, `users.manage_internal`, `portal.internal_config`.

---

## 8. Brechas respecto a política 12I

| Brecha | Evidencia en código | Riesgo | Prioridad | Fase sugerida |
|--------|---------------------|--------|-----------|---------------|
| `set-role` sin validación de rol destino | `users/set-role/route.ts` — solo sesión | Escalamiento a cualquier `roles.id` (incl. si existe nombre `superadmin` en BD) | P0 | 12I-impl-2 |
| `toggle-permission` sin RBAC ni APP_MODE | `roles/toggle-permission/route.ts` | Modificar matriz global de permisos | P0 | 12I-impl-1 |
| `config/roles` PATCH reemplaza permisos de cualquier rol | `config/roles/route.ts` | Mismo impacto que toggle | P0 | 12I-impl-1 |
| `act-as` disponible con `config.admin` | `config/usuarios/act-as/route.ts` | Impersonación total vía `x-user-id` + fallback requirePermission | P0 | 12I-impl-3 |
| Sin separación Summer87 vs cliente en listados | `usuarios/page.tsx` — `select * from roles` sin filtro | Cliente asigna roles de fábrica si existen en BD | P0 | 12I-impl-2 + inventario BD |
| `CrmRole` superadmin bypass layout config | `configuracion/layout.tsx` | Cookie prototipo podría abrir hub config sin permisos BD | P1 | Alinear sesiones; 12I-impl-4 |
| Dos sistemas de rol (`CrmRole` vs `roles.name`) | `session.ts` vs `permissions/me` | Confusión producto y auditoría | P1 | 12I-impl-0 follow-up diseño |
| `requirePermission` fallback primer usuario activo | `requirePermission.ts` L52–62 | Auth débil si falta cookie | P1 | Hardening transversal |
| `allowDevOrRequire` en no-prod | Múltiples APIs config | Falsa sensación de seguridad en clon local | P2 | Documentar en 12J |
| `GET /api/admin/users` con solo `leads.read` | `users/route.ts` | Enumeración de usuarios | P2 | 12L |
| UI roles accesible por URL si middleware permite | `canAccessPath` solo bloquea no-`admin` | Operador → 403; **admin** BD → acceso completo usuarios/roles | P1 | 12I-impl-4 |
| APP_MODE no en APIs users/roles | grep sin `isClientCrmMode` | Menú oculto ≠ API segura | P0 | 12I-impl-1/2 |
| `filterNavByRole` ≠ guard API | `AdminShell.tsx` | Falsa seguridad | P2 | Ya documentado 12D/12I |
| Invites allowlist vs set-role sin allowlist | invites vs set-role | Invitar viewer pero luego asignar otro rol vía form | P1 | 12I-impl-2 |
| Cookie `crm_session` doble semántica | `internalAuth` token vs `session.ts` JSON | Comportamiento middleware ambiguo | P1 | Inventario auth dedicado |

---

## 9. Recomendaciones 12I-impl (orden propuesto)

| Fase | Entregable | Depende de |
|------|------------|------------|
| **12I-impl-1** | Bloquear `POST /api/admin/roles/toggle-permission` y `PATCH /api/admin/config/roles` (y opc. POST rol) en `client_crm` | Este inventario |
| **12I-impl-2** | Bloquear `users/set-role` + filtrar roles asignables; alinear con `ALLOWED_ROLES` de invites | Nombres reales en tabla `roles` (BD) |
| **12I-impl-3** | Denegar `config/usuarios/act-as` en `client_crm` | — |
| **12I-impl-4** | Guards UI + tabs en `/admin/configuracion`; ocultar usuarios/roles | Menú + layout |
| **12I-impl-5** | Filtrar respuesta `permissions/me` (no devolver keys internas) | Catálogo `permissions` en BD |
| **12J** | Validación staging/clon con cuenta cliente | 12G checklist |
| **12K** | Runbook instalación `client_crm` | — |
| **12L** | Auditoría resto APIs admin (complemento 12I) | — |

*Nota:* la numeración en `politica-roles-cliente-vs-summer87-12I.md` (impl-1 = set-role) difiere ligeramente del orden técnico anterior (impl-1 = toggle-permission primero por criticidad). Ajustar en planificación de sprint; lo importante es el alcance, no el número.

---

## 10. Validaciones futuras (post-implementación)

- [ ] En `client_crm`, `set-role` → 403 para roles no allowlisted.
- [ ] En `client_crm`, `toggle-permission` y `config/roles` PATCH → 403.
- [ ] En `client_crm`, `act-as` → 403.
- [ ] Propietario cliente opera leads/agenda sin ver matriz de permisos agencia.
- [ ] `constructor_base` sigue pudiendo gestionar roles (regresión).
- [ ] `npm run build` OK.
- [ ] Inventario BD actualizado (roles `is_system`, permisos reales).

---

## 11. Relación con capas existentes

```
Request
  → middleware (sesión + canAccessPath por roles.name)
  → layout configuración (CrmSession admin/superadmin OR config.admin)
  → APP_MODE (Constructor, system_danger, portal sanitize)   ← no cubre users/roles hoy
  → requirePermission / sesión interna en APIs
  → RLS Supabase (no inventariado aquí; pendiente)
```

---

## 12. Decisión actual

> **En 12I-impl-0 solo se documenta el inventario técnico por inspección de código.**  
> **No se modifican usuarios, roles, permisos ni políticas RLS.**

---

## 13. Confirmación de alcance

- ✅ Inventario documentado desde código  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints ni migraciones  
- ❌ No se instaló CRM / tenant / usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12I-impl-0 — Base para 12I-impl-1…5 y validación 12J. Política: `politica-roles-cliente-vs-summer87-12I.md`.*
