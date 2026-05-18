# Validación Admin Users Read Bloqueado Client CRM 12I-impl-8V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-8V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `docs/constructor-crm/validacion-lecturas-sensibles-client-crm-12I-impl-5V.md`, `lib/admin/internalRoleAccess.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye GETs reales en runtime ni consulta de datos en BD.

**Commit de implementación:** `060a2a9` — *Block admin users read in client CRM mode*  
**Commit prerequisite (Agenda):** `5570b31` — *Use agenda owners for invite users*

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura del handler y **`npm run build` exitoso** — que en **`APP_MODE=client_crm`** el endpoint **`GET /api/admin/users`** queda **bloqueado con 403** antes de autenticación por permiso y antes de cualquier consulta a Supabase.

Este cierre es posible porque en la fase anterior (**12I-impl-7**, commit `5570b31`) **Agenda** dejó de depender de `/api/admin/users` y pasó a consumir **`GET /api/admin/agenda/owners`**, que expone un listado **acotado** de usuarios activos para invitados (`id`, `nombre`, `email`, `role` como etiqueta).

Complementa el hardening de lecturas sensibles iniciado en **12I-impl-5V** (`bb7342e`), donde `GET /api/admin/users` permanecía abierto explícitamente por dependencia operativa de Agenda.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Endpoint** | `GET /api/admin/users` |
| **Archivo route** | `app/api/admin/users/route.ts` |
| **Helper** | `guardInternalSensitiveReadByMode()` |
| **Archivo helper** | `lib/admin/internalRoleAccess.ts` |
| **Commit implementación** | `060a2a9` |
| **Commit prerequisite Agenda** | `5570b31` |
| **Error** | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` |
| **Status** | `403` |
| **Build** | ✅ OK |

### Evidencia en diff (`060a2a9`)

| Verificación | Resultado |
|--------------|-----------|
| Import de `guardInternalSensitiveReadByMode` | ✅ Presente |
| Guard al **inicio** de `GET` | ✅ Antes del `try` principal |
| Guard **antes** de `requirePermission` | ✅ |
| Guard **antes** de `supabaseAdmin()` / query `app_users` | ✅ |
| Respuesta en `client_crm` | ✅ 403 JSON vía `internalSensitiveReadForbiddenResponse()` |
| `constructor_base` (sin `client_crm`) | ✅ Guard devuelve `null`; flujo histórico intacto |

---

## 4. Qué hace el bloqueo

En **`APP_MODE=client_crm`**, al inicio de **`GET /api/admin/users`**:

1. Se ejecuta `guardInternalSensitiveReadByMode()`.
2. Si el modo es `client_crm`, responde de inmediato con **403** y cuerpo JSON estándar de lecturas sensibles (`ok: false`, `error: INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM`).
3. **No** se invoca `requirePermission(req, "leads.read")`.
4. **No** se instancia cliente Supabase admin para este handler.
5. **No** se lista la tabla `app_users` ni se normalizan filas con `role_id` / join `roles`.

### Objetivo de seguridad / producto

Evita exponer el **listado global de usuarios activos del CRM** (emails, roles, `role_id` en payload histórico de constructor) en clones **`client_crm`** destinados a operación piloto, donde la gestión administrativa de usuarios ya está bloqueada por fases anteriores (12I-impl-4).

En **`constructor_base`**, el guard no aplica bloqueo; el endpoint mantiene el comportamiento histórico: usuarios activos ordenados por `created_at`, campos `id`, `nombre`, `email`, `role_id`, `role` (nombre de rol).

---

## 5. Relación con Agenda

| Aspecto | Detalle |
|---------|---------|
| **Situación previa (12I-impl-5V)** | `GET /api/admin/users` no se bloqueaba porque `app/admin/agenda/page.tsx` lo usaba para tarjetas y modal de invitados (`invited_user_ids`). |
| **Desacople (12I-impl-7, `5570b31`)** | Agenda consume `GET /api/admin/agenda/owners` y mapea `data.users` para la UI de invitados. |
| **Contrato acotado** | `users[]`: `id`, `nombre`, `email`, `role` (string desde `roles.name`). **No** expone `role_id` ni matriz de permisos. |
| **Filtro operativo** | Solo usuarios con `is_active = true` (en implementación del endpoint owners). |
| **Esta fase (12I-impl-8)** | Con Agenda desacoplada, **`GET /api/admin/users`** puede bloquearse en `client_crm` sin romper el módulo Agenda. |

**Nota:** En **12I-impl-8** no se modificaron `app/admin/agenda/page.tsx` ni `app/api/admin/agenda/owners/route.ts`; el desacople ya estaba commiteado en `5570b31`.

---

## 6. Rutas no modificadas en esta fase

| Recurso | Estado en 12I-impl-8 |
|---------|----------------------|
| `app/admin/agenda/page.tsx` | No modificado |
| `app/api/admin/agenda/owners/route.ts` | No modificado |
| APIs mutantes de usuarios (`delete`, `invite`, `toggle-active`, `set-role`, `resend-invite`, `act-as`) | No tocadas |
| `middleware.ts` | No modificado |
| Layouts (`app/admin/configuracion/layout.tsx`, etc.) | No tocados |
| `GET /api/admin/config/usuarios` / `config/roles` | Sin cambios (ya bloqueados en `bb7342e`) |
| `GET /api/admin/permissions/me` | Sin cambios (filtrado en `bb7342e`) |

---

## 7. Lectura técnica

| Aspecto | Comportamiento |
|---------|----------------|
| **Orden en `GET /api/admin/users`** | `guardInternalSensitiveReadByMode()` → (si no bloqueado) `requirePermission` → Supabase → respuesta `{ data, error }` |
| **`constructor_base`** | Sin bloqueo por modo; listado histórico de usuarios activos |
| **`installation_prep`** | No queda bloqueado por este guard en la implementación actual de `isInternalSensitiveReadBlockedByMode()` |
| **`client_crm`** | 403 inmediato en `GET /api/admin/users` |
| **Política compartida** | Mismo helper y respuesta que `GET config/usuarios` y `GET config/roles` (12I-impl-5V) |
| **Capa `APP_MODE`** | Complementaria al RBAC existente (`leads.read` en constructor); **no** sustituye RLS ni aislamiento multi-tenant futuro por `company_id` |

### Payload de error (referencia, sin secretos)

```json
{
  "ok": false,
  "error": "INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM",
  "message": "Internal sensitive reads are not available in client CRM mode."
}
```

---

## 8. Qué NO se validó

| Ítem | Nota |
|------|------|
| GET real en runtime (`fetch("/api/admin/users")`) | No ejecutado en esta fase documental |
| `client_crm` con sesión autenticada | Pendiente staging / dev local |
| `/admin/agenda` tras el bloqueo de users | No probado en runtime en 12I-impl-8V |
| Network tab (ausencia de llamadas a `/api/admin/users` desde Agenda) | Pendiente |
| Staging / clon / production | No probado |
| `.env.local` | No modificado |
| Contenido real de `app_users` en BD | No consultado |
| Aislamiento por `tenant` / `company_id` | Fuera de alcance |

---

## 9. Riesgos residuales

| Riesgo | Nota / fase sugerida |
|--------|----------------------|
| **`/api/admin/agenda/owners` lista usuarios sin filtro tenant** | Requiere revisión futura por `company_id` / multi-tenant |
| **`permissions/me` + mapa estático frontend** | El filtrado server-side no elimina por sí solo lógica legacy en `app/lib/rbac.ts` |
| **Validación integral en clon staging** | 12J |
| **Runbook instalación `client_crm`** | 12K |
| **Checklist go/no-go primer cliente** | 12M |
| **Autogestión de usuarios cliente** | Política producto post-piloto (invites, roles allowlist, tenant scope) |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **`GET /api/admin/users` en `client_crm`** | ✅ Bloqueado (`060a2a9`) |
| **Agenda desacoplada de `/api/admin/users`** | ✅ (`5570b31`) |
| **`GET /api/admin/agenda/owners`** | ✅ Operativo como fuente acotada para invitados |
| **`GET config/usuarios`** | ✅ Bloqueado (`bb7342e`) |
| **`GET config/roles`** | ✅ Bloqueado (`bb7342e`) |
| **`permissions/me`** | ✅ Filtrado (`bb7342e`) |
| **UI `/admin/configuracion/*`** | ✅ Bloqueada (`b2679b7`) |
| **Gestión sensible usuarios (mutaciones)** | ✅ Bloqueada (`4fafacd`) |
| **act-as** | ✅ Bloqueado (`487f8c6`) |
| **users/set-role** | ✅ Restringido (`b4af5ba`) |
| **Matriz roles/permisos (escritura)** | ✅ Bloqueada (`7c3a543`) |
| **system_danger** | ✅ Bloqueado (12H-impl) |
| **Constructor UI/API** | ✅ Bloqueados (12D–12F) |
| **portal_config PATCH** | ✅ Sanitizado (12H-impl-4V) |
| **Build** | ✅ OK |
| **Commit** | `060a2a9` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12J** | Validación con clon/staging real `client_crm` (UI + APIs, Network, sesión) |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Preparación piloto primer cliente |
| **12M** | Checklist go/no-go primer cliente |
| **Futuro** | Autogestión de usuarios cliente acotada por `tenant` / `company_id` |

---

## 12. Decisión actual

> **En 12I-impl-8V solo se documenta la validación por revisión de código y build.**  
> **No se ejecuta runtime manual ni se consultan datos.**

---

## 13. Confirmación de alcance (fase 12I-impl-8V documental)

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
- ❌ No se instaló CRM  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12I-impl-8V — bloqueo `GET /api/admin/users` en client_crm. Implementación: 060a2a9. Prerequisite Agenda: 5570b31. Serie hardening 12I: APIs 1–5V, UI 6V, Agenda 7, users read 8V.*
