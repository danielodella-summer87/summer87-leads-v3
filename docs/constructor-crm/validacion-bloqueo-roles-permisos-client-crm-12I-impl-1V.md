# Validación Bloqueo Roles y Permisos Client CRM 12I-impl-1V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-1V (validación manual + documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/inventario-tecnico-roles-permisos-12I-impl-0.md`, `lib/admin/internalRoleAccess.ts`, `app/api/admin/roles/toggle-permission/route.ts`, `app/api/admin/config/roles/route.ts`

**Estado:** implementación y prueba manual en `client_crm` confirmadas. **No** se ejecutaron escrituras reales en `roles` ni `role_permissions`.

**Commit de implementación:** `7c3a543` — *Block internal role management in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó que en **`APP_MODE=client_crm`** quedan **bloqueadas las escrituras críticas** sobre la matriz de roles y permisos internos:

- `POST /api/admin/roles/toggle-permission`
- `POST /api/admin/config/roles`
- `PATCH /api/admin/config/roles`

Las tres rutas responden **403** con el error **`INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM`** cuando el usuario tiene sesión activa. No se modificaron filas en `roles` ni `role_permissions` durante la validación.

Complementa el inventario **12I-impl-0** (brecha P0) y la política **12I**. La lectura `GET /api/admin/config/roles` **no** se bloqueó en esta fase.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper** | `lib/admin/internalRoleAccess.ts` |
| **Función** | `guardInternalRoleManagementByMode()` |
| **Regla** | Bloquea si `isClientCrmMode() === true` |
| **Endpoints protegidos** | `POST /api/admin/roles/toggle-permission`, `POST /api/admin/config/roles`, `PATCH /api/admin/config/roles` |
| **Commit** | `7c3a543` |
| **HTTP status** | `403` |
| **Código error** | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |
| **Mensaje** | `Internal role management is not available in client CRM mode.` |
| **Build** | ✅ OK (previo al commit) |

---

## 4. Validación con sesión en `client_crm`

### Entorno temporal

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

Usuario **logueado** (sesión interna válida; sin sesión el middleware redirige a `/login` antes del handler).

### Prueba desde consola del navegador

```javascript
Promise.all([
  fetch("/api/admin/roles/toggle-permission", { method: "POST" }),
  fetch("/api/admin/config/roles", { method: "POST" }),
  fetch("/api/admin/config/roles", { method: "PATCH" }),
]).then(async (responses) => {
  const results = await Promise.all(
    responses.map(async (r) => ({
      status: r.status,
      body: await r.json(),
    }))
  );
  console.log(results);
});
```

### Resultado observado

| Endpoint | Status | `body.error` |
|----------|--------|--------------|
| `POST /api/admin/roles/toggle-permission` | **403** | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |
| `POST /api/admin/config/roles` | **403** | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |
| `PATCH /api/admin/config/roles` | **403** | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |

- Los tres endpoints devolvieron **403**.
- El body incluye el error esperado y el mensaje: *Internal role management is not available in client CRM mode.*
- **No** se modificaron roles ni `role_permissions`.
- **No** se tocó Supabase manualmente.

---

## 5. Lectura técnica

El guard se ejecuta **al inicio** de cada handler de escritura, **antes** de cualquier efecto lateral.

| Handler | Orden (simplificado) |
|---------|----------------------|
| `toggle-permission` POST | `guardInternalRoleManagementByMode()` → `getInternalUserIdFromRequest` → `formData` → Supabase insert/delete |
| `config/roles` POST | `guard` → `allowDevOrRequire` → `req.json()` → validaciones → Supabase insert en `roles` |
| `config/roles` PATCH | `guard` → `allowDevOrRequire` → `req.json()` → validaciones → delete/insert en `role_permissions` |

**Consecuencia:** un `POST`/`PATCH` con **body vacío** no alcanza la validación de body ni Supabase; devuelve **403 por modo** de inmediato.

En `toggle-permission`, en `client_crm` la respuesta es **JSON 403** (no redirect), coherente con pruebas vía `fetch` desde consola.

---

## 6. GET no bloqueado

| Aspecto | Decisión |
|---------|----------|
| `GET /api/admin/config/roles` | **No** bloqueado en 12I-impl-1 |
| Motivo | Prioridad P0: **escrituras** (toggle, crear rol, reemplazar permisos) |
| Siguiente | Fase posterior (12I-impl-5 u otra) si se decide filtrar lectura o denegar matriz interna en `client_crm` |

---

## 7. Retorno a modo normal

Tras las pruebas se detuvo el dev con `APP_MODE` y se volvió a:

```bash
npm run dev
```

| Verificación | Resultado |
|--------------|-----------|
| `/admin/dashboard` | Cargó correctamente |
| Menú | Completo restaurado (`constructor_base` efectivo) |
| Comportamiento | Coherente con uso interno Summer87 |

---

## 8. Qué NO se validó

| Ítem | Nota |
|------|------|
| Toggle real de un permiso | No ejecutado |
| Creación de rol con body válido | No ejecutado |
| Modificación de `role_permissions` con datos reales | No ejecutado |
| `POST`/`PATCH` en `constructor_base` con payload válido | No ejecutado en esta fase |
| Usuario cliente real / clon dedicado | No probado |
| Entorno production | No probado |
| Clon / staging real | No probado |
| `.env.local` | No modificado |
| `GET /api/admin/config/roles` | Fuera de alcance 12I-impl-1 |
| `users/set-role`, `act-as`, invite, delete | Fases posteriores |

---

## 9. Riesgos residuales

| Riesgo | Fase sugerida |
|--------|----------------|
| `POST /api/admin/users/set-role` sin guard de modo | 12I-impl-2 |
| `users/delete`, `toggle-active`, `invite` | 12I-impl-4 |
| `POST /api/admin/config/usuarios/act-as` | 12I-impl-3 |
| `GET /api/admin/config/roles` expone matriz interna | 12I-impl-5 |
| UI `/admin/configuracion/roles` accesible por URL | 12I-impl-4 (UI) |
| Separación fina roles cliente vs Summer87 en BD | 12I + inventario BD |
| Validación en clon `client_crm` real | 12J |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| Edición matriz roles/permisos (`client_crm`) | ✅ Bloqueada (7c3a543) |
| system_danger (reset-db, seed, initialize) | ✅ Bloqueado (12H-impl) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| `portal_config.sidebar_modules` PATCH | ✅ Sanitizado (12H-impl-4V) |
| Menú + allowlist `client_crm` | ✅ Validado (12D) |
| **Build** | ✅ OK |
| **Commit** | `7c3a543` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-2** | Bloquear asignación de roles internos en `users/set-role` |
| **12I-impl-3** | Bloquear `act-as` en `client_crm` |
| **12I-impl-4** | Revisar `users/delete`, `toggle-active`, `invite` |
| **12I-impl-5** | Revisar `GET config/roles` / `permissions/me` |
| **12J** | Validación staging / clon real |

---

## 12. Decisión actual

> **En 12I-impl-1V solo se documenta la validación manual.**  
> **No se modifica código ni configuración.**

---

## 13. Confirmación de alcance (fase 12I-impl-1V documental)

- ✅ Validación manual documentada  
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

*Documento 12I-impl-1V — Bloqueo escritura roles/permisos en client_crm. Implementación: 7c3a543. Política: 12I. Inventario: 12I-impl-0.*
