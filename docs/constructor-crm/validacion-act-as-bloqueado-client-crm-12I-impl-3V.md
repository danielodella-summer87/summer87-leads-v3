# Validación Act-As Bloqueado Client CRM 12I-impl-3V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-3V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `docs/constructor-crm/validacion-users-set-role-client-crm-12I-impl-2V.md`, `docs/constructor-crm/validacion-bloqueo-roles-permisos-client-crm-12I-impl-1V.md`, `lib/admin/internalRoleAccess.ts`, `app/api/admin/config/usuarios/act-as/route.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye `POST` real contra `act-as` ni cambio de cookie `x-user-id`.

**Commit de implementación:** `487f8c6` — *Block internal impersonation in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura del handler y **`npm run build` exitoso** — que **`POST /api/admin/config/usuarios/act-as`** queda **bloqueado** en **`APP_MODE=client_crm`** **antes** de cualquier impersonación o modificación de cookie.

El endpoint históricamente permite suplantar identidad vía cookie **`x-user-id`** (soporte interno). En clones **`client_crm`**, propietarios u operadores **no** deben poder activar esa vía.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Endpoint** | `POST /api/admin/config/usuarios/act-as` |
| **Helper** | `guardInternalImpersonationByMode()` |
| **Archivo helper** | `lib/admin/internalRoleAccess.ts` |
| **Archivo route** | `app/api/admin/config/usuarios/act-as/route.ts` |
| **Commit** | `487f8c6` |
| **HTTP status (bloqueo)** | `403` |
| **Código error** | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` |
| **Mensaje** | `Internal impersonation is not available in client CRM mode.` |
| **Build** | ✅ OK |

---

## 4. Qué hace el bloqueo

En **`client_crm`**, al inicio de **`POST`**:

1. Se invoca `guardInternalImpersonationByMode()`.
2. Si el modo es `client_crm`, se responde **403** con JSON (`ok: false`, `error`, `message`).
3. **No** se ejecuta el resto del handler.

### Efectos evitados

| Efecto | Estado en bloqueo |
|--------|-------------------|
| `allowDevOrRequire(req, "config.admin")` | No alcanzado |
| `req.json()` / lectura de `user_id` | No alcanzado |
| Consulta `app_users` en Supabase | No alcanzada |
| `cookies.set("x-user-id", ...)` | No ejecutado |
| Limpiar cookie (`user_id` null) | No ejecutado |

Un **body vacío** en `client_crm` devuelve **403 por modo**, no error de validación de body.

---

## 5. Lectura técnica

| Aspecto | Comportamiento |
|---------|----------------|
| **`constructor_base`** | `guard` → `null`; flujo histórico (permiso `config.admin` en prod, bypass dev en no-prod) |
| **`installation_prep`** | No bloqueado por este guard en la implementación actual |
| **`client_crm`** | Siempre bloqueado al inicio del `POST` |
| **Auditoría L3** | El guard **no** sustituye registro/auditoría futura de soporte Summer87 |
| **Impersonación en prod cliente** | Requiere política aparte, trazabilidad y decisión explícita de producto |

**Orden confirmado en diff:** guard → `allowDevOrRequire` → `req.json()` → Supabase → cookies.

---

## 6. Por qué no se hizo POST real

| Motivo | Detalle |
|--------|---------|
| Riesgo de sesión | `act-as` puede **cambiar** la cookie `x-user-id` de la sesión activa de trabajo |
| Base madre | No conviene ejecutar pruebas que alteren impersonación en entorno compartido |
| Runtime | Validación con respuesta **403** puede hacerse en **staging/clon** con sesión logueada |
| Suficiencia de fase | **Diff + build** bastan: el guard está **antes** de cualquier efecto lateral |

### Prueba sugerida (staging, no ejecutada aquí)

```javascript
fetch("/api/admin/config/usuarios/act-as", { method: "POST" })
  .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
  .then(console.log);
```

Esperado en `client_crm`: **403**, `error: "INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM"`, **sin** cambio en cookies.

---

## 7. Qué NO se validó

| Ítem | Nota |
|------|------|
| `POST` real a `act-as` | No ejecutado |
| Modificación de cookie `x-user-id` | No ejecutada |
| Usuario cliente real | No probado |
| Staging / clon | No probado |
| Production | No probado |
| `.env.local` | No modificado |
| Flujo histórico `act-as` en `constructor_base` | No probado en runtime (solo por código) |
| Auditoría futura de soporte | Fuera de alcance |
| `users/delete`, `toggle-active`, `invite` | Fases posteriores |

---

## 8. Riesgos residuales

| Riesgo | Fase sugerida |
|--------|----------------|
| `POST /api/admin/users/delete` | 12I-impl-4 |
| `POST /api/admin/users/toggle-active` | 12I-impl-4 |
| `POST /api/admin/users/invite`, `resend-invite` | 12I-impl-4 |
| `GET /api/admin/config/usuarios`, `GET config/roles` | 12I-impl-5 (política lectura) |
| `GET /api/admin/permissions/me` expone keys internas | 12I-impl-5 |
| UI `/admin/configuracion/usuarios`, `/roles` por URL | 12I-impl-6 |
| Validación integral en clon real | 12J |

---

## 9. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **act-as** en `client_crm` | ✅ Bloqueado (487f8c6) |
| **users/set-role** | ✅ Restringido (b4af5ba) |
| Matriz roles/permisos (escritura) | ✅ Bloqueada (7c3a543) |
| **system_danger** | ✅ Bloqueado (12H-impl) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| **portal_config** PATCH | ✅ Sanitizado (12H-impl-4V) |
| **Build** | ✅ OK |
| **Commit** | `487f8c6` |
| **Repo** | Limpio tras commit |
| **Datos / cookies** | Sin cambios en esta validación documental |

---

## 10. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-4** | Revisar `users/delete`, `toggle-active`, `invite`, `resend-invite` |
| **12I-impl-5** | Revisar `GET config/roles` / `permissions/me` |
| **12I-impl-6** | Revisar UI usuarios/roles por `APP_MODE` |
| **12J** | Validación con clon/staging real |
| **12K** | Runbook instalación `client_crm` |

---

## 11. Decisión actual

> **En 12I-impl-3V solo se documenta la validación por revisión de código y build.**  
> **No se ejecuta POST real de act-as.**

---

## 12. Confirmación de alcance (fase 12I-impl-3V documental)

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

*Documento 12I-impl-3V — Bloqueo act-as en client_crm. Implementación: 487f8c6. Serie RBAC: 12I-impl-1V … 3V.*
