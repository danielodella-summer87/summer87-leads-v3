# Validación Gestión Usuarios Bloqueada Client CRM 12I-impl-4V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-4V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `docs/constructor-crm/validacion-act-as-bloqueado-client-crm-12I-impl-3V.md`, `docs/constructor-crm/validacion-users-set-role-client-crm-12I-impl-2V.md`, `lib/admin/internalRoleAccess.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye `POST` reales de delete, toggle-active, invite ni resend-invite.

**Commit de implementación:** `4fafacd` — *Block client user management in client CRM mode*

**Contexto de producto:** para el primer cliente piloto, la **autogestión de usuarios** desde `client_crm` **no** está habilitada; la gestión queda para Summer87 / soporte controlado / staging hasta definir permisos y aislamiento por tenant.

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura de handlers y **`npm run build` exitoso** — que las **mutaciones sensibles de usuarios** quedan **bloqueadas** en **`APP_MODE=client_crm`** mediante `guardClientUserManagementByMode()`.

Cuatro endpoints responden **403** con `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` **antes** de sesión, body, Supabase, cambios en `app_users` o envío de emails.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper** | `guardClientUserManagementByMode()` |
| **Archivo helper** | `lib/admin/internalRoleAccess.ts` |
| **Funciones auxiliares** | `isClientUserManagementBlockedByMode()`, `clientUserManagementForbiddenResponse()` |
| **Commit** | `4fafacd` |
| **HTTP status (bloqueo)** | `403` |
| **Código error** | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |
| **Mensaje** | `Client user management is not available in client CRM mode.` |
| **Build** | ✅ OK |

### Endpoints protegidos

| Endpoint | Archivo route | Efecto histórico bloqueado en `client_crm` |
|----------|---------------|--------------------------------------------|
| `POST /api/admin/users/delete` | `app/api/admin/users/delete/route.ts` | DELETE en `app_users` |
| `POST /api/admin/users/toggle-active` | `app/api/admin/users/toggle-active/route.ts` | UPDATE `is_active` |
| `POST /api/admin/users/invite` | `app/api/admin/users/invite/route.ts` | INSERT/UPDATE `app_users` + email Resend |
| `POST /api/admin/users/resend-invite` | `app/api/admin/users/resend-invite/route.ts` | Email Resend |

**No modificados en esta fase:** `users/set-role` (política allowlist propia), `config/usuarios/act-as` (guard impersonación).

---

## 4. Qué hace el bloqueo

En **`client_crm`**, al inicio de cada **`POST`** de las cuatro rutas:

1. `guardClientUserManagementByMode()` → si bloqueado, **403 JSON** inmediato.
2. El resto del handler **no** se ejecuta.

### Efectos evitados

| Capa | No alcanzada en bloqueo |
|------|-------------------------|
| Sesión | `getInternalUserIdFromRequest` |
| Entrada | `formData` / `req.json()` |
| BD | Consultas y mutaciones Supabase |
| Datos | Borrado, activación/desactivación, invitaciones |
| Email | Envío vía Resend (invite / resend-invite) |

Evita desde clon cliente: **borrado**, **activar/desactivar**, **invitar** y **reenviar invitación** sin política fina por organización.

---

## 5. Lectura técnica

| Aspecto | Comportamiento |
|---------|----------------|
| **`constructor_base`** | Guard → `null`; flujo histórico intacto |
| **`installation_prep`** | No bloqueado por este guard en la implementación actual |
| **`client_crm`** | Las cuatro mutaciones siempre bloqueadas al inicio del `POST` |
| **Tenant / `company_id`** | El guard **no** sustituye aislamiento multi-tenant futuro |
| **Autogestión cliente** | Pendiente de fase futura con reglas y RBAC explícitos |

**Orden confirmado en diff:** guard → sesión → body/formData → Supabase → emails.

---

## 6. Por qué no se hicieron POST reales

| Riesgo | Motivo |
|--------|--------|
| **delete** | Puede borrar filas reales en `app_users` |
| **toggle-active** | Puede desactivar cuentas de producción |
| **invite / resend-invite** | Puede enviar **emails reales** |
| **Base madre** | No conviene pruebas mutantes en entorno compartido |

La validación **runtime** (respuesta 403) debe hacerse en **staging/clon** con usuarios descartables. Para **12I-impl-4V** bastan **diff + build**: el guard está **antes** de cualquier efecto.

### Prueba sugerida (staging, no ejecutada aquí)

```javascript
Promise.all([
  fetch("/api/admin/users/delete", { method: "POST" }),
  fetch("/api/admin/users/toggle-active", { method: "POST" }),
  fetch("/api/admin/users/invite", { method: "POST" }),
  fetch("/api/admin/users/resend-invite", { method: "POST" }),
]).then(async (rs) =>
  Promise.all(rs.map(async (r) => ({ status: r.status, body: await r.json() })))
).then(console.log);
```

Esperado en `client_crm`: **403** y `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` en los cuatro.

---

## 7. Qué NO se validó

| Ítem | Nota |
|------|------|
| `POST` reales a las cuatro APIs | No ejecutados |
| Borrado de usuarios | No ejecutado |
| Cambio de `is_active` | No ejecutado |
| Envío de emails | No ejecutado |
| Usuario cliente real | No probado |
| Staging / clon | No probado |
| Production | No probado |
| `.env.local` | No modificado |
| Flujo histórico en `constructor_base` | No probado en runtime (solo código) |
| Gestión futura por tenant / `company_id` | Fuera de alcance |
| `GET /api/admin/users` | No validado |
| `GET /api/admin/config/usuarios` | No validado |

---

## 8. Riesgos residuales

| Riesgo | Fase sugerida |
|--------|----------------|
| `GET /api/admin/users` — listado de usuarios activos | 12I-impl-5 |
| `GET /api/admin/config/usuarios` — puede incluir cuentas internas | 12I-impl-5 |
| `GET /api/admin/config/roles`, `permissions/me` | 12I-impl-5 |
| UI `/admin/configuracion/usuarios`, `/roles` accesible por URL | 12I-impl-6 |
| Autogestión cliente sin aislamiento org | Diseño + RLS + 12J |
| Validación integral en clon real | 12J |

---

## 9. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| Gestión sensible usuarios (`client_crm`) | ✅ Bloqueada (4fafacd) |
| **act-as** | ✅ Bloqueado (487f8c6) |
| **users/set-role** | ✅ Restringido (b4af5ba) |
| Matriz roles/permisos (escritura) | ✅ Bloqueada (7c3a543) |
| **system_danger** | ✅ Bloqueado (12H-impl) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| **portal_config** PATCH | ✅ Sanitizado (12H-impl-4V) |
| **Build** | ✅ OK |
| **Commit** | `4fafacd` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación documental |

---

## 10. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-5** | Revisar `GET users`, `config/usuarios`, `config/roles`, `permissions/me` |
| **12I-impl-6** | Revisar UI usuarios/roles por `APP_MODE` |
| **12J** | Validación con clon/staging real |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Preparación piloto primer cliente |

---

## 11. Decisión actual

> **En 12I-impl-4V solo se documenta la validación por revisión de código y build.**  
> **No se ejecutan POST reales de gestión de usuarios.**

---

## 12. Confirmación de alcance (fase 12I-impl-4V documental)

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

*Documento 12I-impl-4V — Bloqueo mutaciones usuarios en client_crm. Implementación: 4fafacd. Serie RBAC: 12I-impl-1V … 4V.*
