# Validación Reset DB Bloqueado Client CRM 12H-impl-1V — Constructor CRM Summer87

**Versión:** Fase 12H-impl-1V (validación manual — documental)  
**Relacionado con:** `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `docs/constructor-crm/validacion-apis-constructor-bloqueadas-12F.md`, `docs/constructor-crm/checklist-env-clon-client-crm-12G.md`, `lib/admin/systemDangerAccess.ts`, `app/api/admin/config/reset-db/route.ts`

**Estado:** validación manual registrada. **No** incluye prueba de reset real ni despliegue en producción.

**Commit de implementación:** `44640f3` — *Block reset db in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó que la acción destructiva **`POST /api/admin/config/reset-db`** queda **bloqueada por `APP_MODE=client_crm`**, devolviendo **403** con código `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` **antes** de RBAC, token, lectura de body o acceso a Supabase.

Esta validación **implementa en runtime** el primer ítem de la política **12H** (reset-db bloqueado en clon cliente) y complementa las capas ya validadas:

- Menú y UI Constructor (**12D**)
- APIs Constructor (**12F**)

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Helper** | `lib/admin/systemDangerAccess.ts` |
| **Función** | `guardSystemDangerByMode()` |
| **Endpoint** | `POST /api/admin/config/reset-db` |
| **Commit** | `44640f3` |
| **Error JSON** | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| **Status HTTP** | **403** |
| **Mensaje** | `System danger actions are not available in client CRM mode.` |

---

## 4. Validación con sesión en client_crm

### Entorno temporal

Variables de sesión (no se editó `.env.local`):

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**Menú:** reducido correctamente (Leads, Agenda, Reportes) — coherente con **12D**.

### Prueba desde consola del navegador (usuario logueado)

```javascript
fetch("/api/admin/config/reset-db", { method: "POST" })
  .then(async (r) => ({ status: r.status, body: await r.json() }))
  .then(console.log);
```

### Resultado observado

| Campo | Valor |
|-------|--------|
| **status** | `403` |
| **body.error** | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| **body.message** | `System danger actions are not available in client CRM mode.` |
| **Token** | No solicitado |
| **Body / confirmación** | No requeridos |
| **Reset ejecutado** | **No** |

---

## 5. Lectura técnica

Orden de ejecución en `app/api/admin/config/reset-db/route.ts` tras `44640f3`:

1. `guardSystemDangerByMode()` → en `client_crm` retorna 403 y **termina**
2. `requirePermission("system.danger")` — no alcanzado en client_crm
3. Validación `x-reset-token` / `RESET_DB_TOKEN` — no alcanzada
4. `req.json()` y `confirm: "BORRAR TODO"` — no alcanzados
5. Deletes Supabase — **no ejecutados**

**Conclusión:** el endpoint queda protegido por **modo de instancia** en `client_crm`, independientemente de permisos o token, siempre que la petición llegue al route handler.

---

## 6. Validación sin sesión

### Prueba de referencia

```bash
curl -i -X POST http://localhost:3000/api/admin/config/reset-db
```

### Resultado observado

| Aspecto | Detalle |
|---------|---------|
| **HTTP** | `307` redirect hacia `/login` |
| **Header observado** | `x-debug-crm-session-present: 0` (si aplica en el entorno) |
| **Handler reset-db** | **No** alcanzado |
| **system_danger guard** | **No** evaluado (auth previa) |
| **Reset** | **No** ejecutado |

**Interpretación:** sin sesión, la capa de autenticación redirige antes del handler. No contradice el guard por modo; confirma que una petición anónima tampoco dispara borrado.

---

## 7. Retorno a modo normal

| Paso | Resultado |
|------|-----------|
| `npm run dev` sin `APP_MODE` en sesión | ✅ |
| `/admin/dashboard` | Carga correctamente |
| Menú lateral | Completo restaurado |
| Modo efectivo | `constructor_base` (default) |

Comportamiento de **base madre** coherente con fases anteriores. **No** se probó `POST` reset-db con token y confirmación en esta validación (ver §8).

---

## 8. Qué NO se validó

- Ejecución de **reset real** (borrado de tablas).
- `POST` con **token** correcto (`x-reset-token`).
- Body con **confirmación** `BORRAR TODO`.
- Comportamiento en **producción** o hosting desplegado.
- Persistencia de variables en **`.env.local`** del proyecto (solo sesión temporal).
- Usuario **cliente final** dedicado (prueba con sesión admin Summer87 en dev).
- **Clon / tenant** productivo separado.
- Otras APIs **system_danger** (`minimal-seed`, `modules/initialize`, etc.).
- **Middleware / proxy** global.
- Regresión explícita de reset-db en **constructor_base** con token + RBAC (solo por lectura de código / confianza en guard temprano).

---

## 9. Riesgos residuales

| Riesgo | Estado |
|--------|--------|
| `POST /api/admin/setup/minimal-seed` | Pendiente **12H-impl-2** |
| `POST /api/admin/modules/initialize` | Pendiente **12H-impl-3** |
| `PATCH /api/admin/config/portal` reintroduce módulos internos | Pendiente **12H-impl-4** |
| Roles / usuarios / `set-role` | Pendiente **12I** |
| reset-db en **constructor_base** | Sigue existiendo; debe mantener RBAC + token + confirmación fuerte |
| Runbook uso seguro en entornos internos | Pendiente documentación operativa |
| UI `/admin/configuracion` aún puede mostrar controles de reset | Pendiente revisión UI (fuera de 12H-impl-1) |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **reset-db** en `client_crm` | ✅ Bloqueado (403) — esta validación |
| Constructor UI | ✅ Bloqueado (12D) |
| Constructor API | ✅ Bloqueado (12F) |
| Menú `client_crm` + allowlist | ✅ Validado (12D) |
| **Repo** | Limpio tras commit `44640f3` |
| **Datos / Supabase** | Sin cambios en esta fase documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12H-impl-2** | Revisar / bloquear `setup/minimal-seed` en `client_crm` |
| **12H-impl-3** | Revisar / bloquear `modules/initialize` en `client_crm` |
| **12H-impl-4** | Sanitizar `portal_config` — no reactivar internal / system_danger |
| **12I** | Roles cliente vs Summer87 |
| **12J** | Validación en clon / staging real |

---

## 12. Decisión actual

> **En 12H-impl-1V solo se documenta la validación manual.**  
> **No se modifica código ni configuración persistente.**

---

## 13. Confirmación de alcance (fase 12H-impl-1V documental)

- ✅ Validación manual de bloqueo reset-db registrada  
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

*Documento 12H-impl-1V — Validación reset-db en client_crm. Política: 12H. Siguiente implementación recomendada: 12H-impl-2 (minimal-seed).*
