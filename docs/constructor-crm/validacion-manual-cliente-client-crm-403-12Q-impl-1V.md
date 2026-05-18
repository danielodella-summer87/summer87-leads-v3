# Validación Manual Cliente Bloqueado en Client CRM 12Q-impl-1V

**Versión:** 12Q-impl-1V — validación runtime local  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `validacion-manual-cliente-menu-constructor-12Q-impl-1.md` | Implementación y pendientes previos |
| `cierre-bloque-pre-piloto-client-crm-12R-cierre.md` | Cierre de bloque; pendiente 403 en `client_crm` |
| `validacion-integral-client-crm-12J-run-local.md` | Misma convención de entorno local |

**Tipo de ejecución:** prueba manual en desarrollo con `APP_MODE=client_crm`.  
**Ámbito:** local (`http://localhost:3001`). **No** staging, **no** producción.

**Fecha de ejecución:** pausa técnica posterior a **12R-cierre** (sesión local del responsable).

---

## 2. Resumen ejecutivo

Se validó en **runtime local** que la pantalla interna del manual cliente en **`/admin/constructor-crm/manual-cliente`** queda **bloqueada** cuando `APP_MODE=client_crm`: al abrir la URL, el navegador termina en **`/403`** con el mensaje **«403 · Sin permisos»** / **«No tenés permisos para acceder a esta sección.»**

**Dictamen:** ✅ **OK** — cierra el pendiente de **12Q-impl-1** y el ítem de **12R-cierre** referente a la ruta `manual-cliente` en `client_crm`.

**Contexto previo:** `npm run build` de **12Q-impl-1** ya había sido **OK** (sin re-ejecutar build en esta sesión).

**No implica:** staging validado, piloto con cliente ni que el manual esté entregado al usuario final.

---

## 3. Entorno

| Variable / aspecto | Valor |
|--------------------|--------|
| **APP_MODE** | `client_crm` |
| **CLIENT_SLUG** | `pickup4x4` |
| **CLIENT_NAME** | `Pickup 4x4` |
| **CLIENT_VISIBLE_MODULES** | `leads87,agenda,reportes` |
| **Comando** | `npm run dev` |
| **Puerto 3000** | Ocupado (proceso **31392**) |
| **Puerto efectivo** | **3001** |
| **URL base** | `http://localhost:3001` |
| **URL probada** | `http://localhost:3001/admin/constructor-crm/manual-cliente` |
| **`.env.local`** | No modificado en esta validación |

---

## 4. Resultado

| Ruta probada | Esperado | Observado | Estado |
|--------------|----------|-----------|--------|
| `/admin/constructor-crm/manual-cliente` | `/403` | Redirección / pantalla **`http://localhost:3001/403`** — **«403 · Sin permisos»** — **«No tenés permisos para acceder a esta sección.»** | ✅ **OK** |

### Notas de la sesión

- No se modificó código en esta validación.
- No se modificaron datos.
- No se ejecutó SQL.
- No se tocó Supabase.

---

## 5. Lectura técnica

| Capa | Comportamiento esperado |
|------|-------------------------|
| **Ruta** | `manual-cliente` vive bajo el árbol **`/admin/constructor-crm/*`** |
| **Layout guard** | `app/admin/constructor-crm/layout.tsx` llama `isClientCrmMode()` y hace `redirect("/403")` antes de renderizar hijos |
| **Menú lateral** | El ítem `constructor_manual_cliente` usa `menuCategory: "internal_constructor"`; `filterAdminSidebarModulesByMode` **no** lo expone en `client_crm` |
| **Módulo operativo cliente** | **No** forma parte de `CLIENT_VISIBLE_MODULES`; no es módulo CRM operativo del piloto |

La validación confirma que **acceso directo por URL** queda alineado con el bloqueo ya observado en **12J-run** para `/admin/constructor-crm` (muestra representativa del mismo layout).

---

## 6. Qué NO se validó

| Ítem | Motivo |
|------|--------|
| **Staging / clon** | Solo local |
| **Producción** | Fuera de alcance |
| **12O-run** | Pendiente de entorno clon |
| **Entrega del manual al cliente** | Operación comercial / CS; documento **12Q** |
| **Ítem menú visible en modo Constructor** | No era alcance de esta prueba (`client_crm` only) |
| **Revisión visual del contenido del manual** | Ruta bloqueada en `client_crm` |
| **Copiar texto del manual** en `client_crm` | Ruta inaccesible; probar en modo Constructor habilitado |
| **Build en esta sesión** | Ya OK en **12Q-impl-1** |

---

## 7. Confirmación de alcance

Esta validación **12Q-impl-1V** confirma explícitamente:

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| Archivos TypeScript | **No** creados |
| `.env.local` | **No** tocado |
| SQL | **No** ejecutado |
| Datos | **No** modificados |
| Supabase | **No** tocado |
| Endpoints / APIs | **No** creados ni modificados |
| Middleware | **No** modificado |
| Commits | **No** realizados en esta acción |
| Entregable | **Solo** este documento |

---

*Documento 12Q-impl-1V — cierre runtime local del bloqueo de `/admin/constructor-crm/manual-cliente` en `client_crm`.*
