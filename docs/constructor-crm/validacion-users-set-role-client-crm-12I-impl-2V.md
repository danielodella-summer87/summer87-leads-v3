# Validación Users Set Role Client CRM 12I-impl-2V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-2V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `docs/constructor-crm/validacion-bloqueo-roles-permisos-client-crm-12I-impl-1V.md`, `lib/admin/internalRoleAccess.ts`, `app/api/admin/users/set-role/route.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye `POST` real contra `users/set-role` ni mutación de `app_users`.

**Commit de implementación:** `b4af5ba` — *Restrict role assignment in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura de helpers y **`npm run build` exitoso** — que **`POST /api/admin/users/set-role`** ya **no puede asignar** en **`APP_MODE=client_crm`** roles internos, de sistema, desconocidos o inexistentes.

Complementa **12I-impl-1** (bloqueo de escritura en matriz `roles` / `role_permissions`) y la política **12I**: el cliente no puede elevar privilegios vía cambio de `role_id` en `app_users`.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Endpoint** | `POST /api/admin/users/set-role` |
| **Helper** | `guardClientCrmRoleAssignment()` (+ funciones auxiliares en el mismo archivo) |
| **Archivo helper** | `lib/admin/internalRoleAccess.ts` |
| **Archivo route** | `app/api/admin/users/set-role/route.ts` |
| **Commit** | `b4af5ba` |
| **HTTP status (bloqueo)** | `403` |
| **Código error** | `INTERNAL_ROLE_ASSIGNMENT_DISABLED_IN_CLIENT_CRM` |
| **Mensaje** | `Internal role assignment is not available in client CRM mode.` |
| **Build** | ✅ OK |

---

## 4. Qué hace el bloqueo

Flujo en **`client_crm`** (después de sesión válida y lectura de `formData`):

1. Se obtienen `user_id` y `role_id` del formulario (sin cambio respecto al histórico).
2. Se consulta la tabla **`roles`** por `role_id` (`id`, `name`, `is_system`).
3. **Antes** de `app_users.update({ role_id })`, se ejecuta `guardClientCrmRoleAssignment(...)`.
4. Si el guard devuelve respuesta → **403 JSON** y **no** hay update.
5. Si el rol está permitido → continúa el flujo existente (redirect a `/admin/configuracion/usuarios`).

### Reglas de bloqueo (orden lógico en el helper)

| Condición | Acción |
|-----------|--------|
| Rol **no encontrado** (`targetRole` null) | Bloquear (`name: null`) |
| `is_system === true` | Bloquear |
| Nombre con patrón interno / Summer87 / sistema | Bloquear |
| Nombre **fuera** de allowlist cliente | Bloquear |
| Nombre en allowlist y no interno | Permitir update |

En **`constructor_base`** (sin `APP_MODE=client_crm`), el bloque `isClientCrmMode()` **no se ejecuta**; comportamiento histórico intacto.

---

## 5. Allowlist actual

Roles **`roles.name`** permitidos para asignación en `client_crm` (normalización a minúsculas):

| Rol permitido | Motivo | Nota |
|---------------|--------|------|
| `admin` | Administración operativa del cliente | No confundir con `admin_summer87` (patrón bloqueado) |
| `operador` | Operación día a día | — |
| `comercial` | Gestión comercial / leads | — |
| `viewer` | Solo lectura operativa | — |
| `tecnico` | Rol operativo técnico | — |
| `consultor` | Rol operativo consultoría | — |

**Aclaraciones:**

- La **existencia real** de esos nombres en la tabla `roles` de cada instancia queda **pendiente de verificación en BD** (no se inspeccionó en esta fase).
- El alias **`operaciones`** (mapeado a `operador` en `app/lib/rbac.ts`) **no** está en la allowlist → en `client_crm` se **bloquea** hasta definir política explícita en fase futura.

---

## 6. Roles bloqueados / patrones internos

| Caso | Tipo |
|------|------|
| `superadmin` | Patrón nombre |
| `summer87` | Patrón nombre |
| `factory` | Patrón nombre |
| `fabrica` | Patrón nombre |
| `internal` | Patrón nombre |
| `soporte` | Patrón nombre |
| `support` | Patrón nombre |
| `tecnico_summer87` | Patrón nombre |
| `system` | Patrón nombre |
| `owner_internal` | Patrón nombre |
| `admin_summer87` | Patrón nombre |
| `roleName` vacío / `null` | Sin nombre válido |
| `role_id` inexistente (sin fila en `roles`) | Rol desconocido |
| `is_system === true` | Flag de rol de sistema |

Cualquier nombre que **contenga** (substring) un patrón interno listado también se trata como bloqueado, salvo coincidencia exacta previa con la allowlist.

---

## 7. Lectura técnica

| Aspecto | Detalle |
|---------|---------|
| `constructor_base` | No entra en validación por `isClientCrmMode()` |
| Orden en `client_crm` | Consulta `roles` → guard → `app_users.update` |
| Efecto del bloqueo | **403**; **sin** `update` |
| Alcance | No reemplaza diseño fino cliente vs Summer87 ni RLS multi-tenant |
| Runtime en producción cliente | **Pendiente** staging/clon (**12J**) |

**Diferencia con 12I-impl-1:** allí se bloquean **escrituras** en matriz global (`toggle-permission`, `POST/PATCH config/roles`). Aquí se restringe **asignación** de `role_id` a un usuario concreto.

---

## 8. Qué NO se validó

| Ítem | Nota |
|------|------|
| `POST` real a `users/set-role` | No ejecutado |
| Modificación de `app_users` | No ejecutada |
| `role_id` real interno (p. ej. superadmin en BD) | No probado en runtime |
| `role_id` real de rol permitido | No probado en runtime |
| Usuario cliente real | No probado |
| Staging / clon dedicado | No probado |
| Production | No probado |
| `.env.local` | No modificado |
| Contenido real de tabla `roles` | No verificado en BD |
| Alias `operaciones` | No validado en runtime |
| `users/delete`, `toggle-active`, `invite`, `act-as` | Fases posteriores |

---

## 9. Por qué no se hizo POST real

- **`POST /api/admin/users/set-role`** puede **modificar** `app_users.role_id` de usuarios reales.
- En **base madre** (summer87-leads-v3 compartida) no conviene ejecutar pruebas mutantes.
- La validación de runtime debe hacerse en **staging** o **clon `client_crm`** con `user_id` y `role_id` de prueba desechables.
- Para esta fase bastan **diff + build**; el comportamiento esperado está acotado en código.

### Prueba sugerida (staging, no ejecutada aquí)

Con sesión y `APP_MODE=client_crm`, `FormData` con `role_id` de rol interno conocido → esperar **403** y `INTERNAL_ROLE_ASSIGNMENT_DISABLED_IN_CLIENT_CRM` sin cambio en BD.

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| `users/set-role` en `client_crm` | ✅ Restringido (b4af5ba) |
| Edición matriz roles/permisos | ✅ Bloqueada (12I-impl-1, 7c3a543) |
| system_danger | ✅ Bloqueado (12H-impl) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| `portal_config.sidebar_modules` PATCH | ✅ Sanitizado (12H-impl-4V) |
| **Build** | ✅ OK |
| **Commit** | `b4af5ba` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-3** | Bloquear `act-as` en `client_crm` |
| **12I-impl-4** | Revisar `users/delete`, `toggle-active`, `invite` |
| **12I-impl-5** | Revisar `GET config/roles` / `permissions/me` |
| **12J** | Validación con clon/staging real (set-role + matriz roles) |
| **12K** | Runbook instalación `client_crm` |

---

## 12. Decisión actual

> **En 12I-impl-2V solo se documenta la validación por revisión de código y build.**  
> **No se ejecuta POST real.**

---

## 13. Confirmación de alcance (fase 12I-impl-2V documental)

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

*Documento 12I-impl-2V — Restricción users/set-role en client_crm. Implementación: b4af5ba. Serie: 12I-impl-1V (matriz), 12I-impl-2V (asignación).*
