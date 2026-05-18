# Validación Modo Client CRM 12D — Constructor CRM Summer87

**Versión:** Fase 12D (validación manual — documental)  
**Relacionado con:** `docs/constructor-crm/diseno-tecnico-flags-modo-12A.md`, `docs/constructor-crm/diseno-implementacion-menu-por-modo-12B.md`, `lib/config/appMode.ts`, `lib/admin/adminSidebarModules.ts`, `app/admin/constructor-crm/layout.tsx`

**Estado:** validación manual registrada. **No** incluye bloqueo de APIs ni pruebas en clon/tenant real.

**Commits de referencia (implementación previa a este documento):**

- Add app mode configuration helper  
- Tag admin sidebar modules by menu category  
- Filter admin sidebar modules by app mode  
- Block constructor UI routes in client CRM mode  

---

## 2. Resumen ejecutivo

Se validó el comportamiento inicial de **`APP_MODE=client_crm`** en entorno de desarrollo local (**summer87-leads-v3**), sin modificar `.env.local`:

| Capacidad | Resultado |
|-----------|-----------|
| **Menú filtrado por modo** | OK en `client_crm` con allowlist |
| **`CLIENT_VISIBLE_MODULES`** | OK — reduce ítems operativos visibles |
| **Bloqueo UI Constructor** | OK — `/admin/constructor-crm/*` → `/403` en `client_crm` |
| **Retorno a base madre** | OK — `npm run dev` normal restaura menú completo y acceso Constructor por URL |

La base madre (**`constructor_base`**, default sin `APP_MODE`) mantiene el comportamiento histórico: menú completo y rutas Constructor accesibles.

---

## 3. Alcance validado

| Escenario | Qué se probó | Resultado |
|-----------|--------------|-----------|
| **constructor_base** (modo normal) | Menú, leads, Constructor por URL | ✅ Esperado |
| **client_crm** sin allowlist | Menú operativo sin restricción por módulo | ✅ Esperado (allowlist vacía) |
| **client_crm** con allowlist | Menú reducido + bloqueo UI Constructor | ✅ Esperado |
| **Retorno a modo normal** | Tras prueba temporal con env de sesión | ✅ Menú y Constructor restaurados |

**Fuera de alcance 12D:** APIs Constructor, middleware, roles completos, clon productivo, RLS Supabase (ver §9).

---

## 4. Comandos usados

Referencias de sesión de desarrollo (variables **temporales** en la shell; **no** se editó `.env.local`):

```bash
npm run dev
```

```bash
APP_MODE=client_crm npm run dev
```

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**Nota:** Tras cada prueba con `APP_MODE`, se volvió a `npm run dev` sin variables para confirmar retorno a **constructor_base**.

**Build:** en fases de implementación previas se ejecutó `npm run build` con éxito; no se repitió como parte obligatoria de este documento 12D.

---

## 5. Validación en constructor_base

**Condición:** `npm run dev` normal (sin `APP_MODE` en sesión → default `constructor_base`).

| Prueba | Resultado |
|--------|-----------|
| `/admin` carga | ✅ |
| Menú completo visible | ✅ |
| `/admin/leads` carga | ✅ |
| `/admin/constructor-crm/paquetes` carga | ✅ |
| Constructor accesible por URL directa | ✅ |

**Comportamiento esperado base madre:** Summer87 opera fábrica + CRM operativo; Constructor no depende del ítem de menú default (no está en `DEFAULT_ADMIN_SIDEBAR_MODULES`) pero las rutas UI bajo `/admin/constructor-crm` siguen disponibles.

---

## 6. Validación client_crm sin allowlist

**Condición:** `APP_MODE=client_crm npm run dev` (sin `CLIENT_VISIBLE_MODULES`).

| Prueba | Resultado |
|--------|-----------|
| `/admin` carga | ✅ |
| Menú operativo completo visible | ✅ |
| Constructor como ítem de menú default | No aplica — no existe en defaults |
| Rutas UI Constructor | No validadas en este escenario (prueba aparte con allowlist + layout) |

**Interpretación:** Con `CLIENT_VISIBLE_MODULES` vacío, el filtro de menú **no restringe** categorías operativas/support (diseño 12B-impl). Es el comportamiento esperado en fase inicial.

---

## 7. Validación client_crm con allowlist

**Condición:**

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

### Menú lateral

| Ítem (key / label) | Visible |
|--------------------|:-------:|
| Summer87 Leads (`leads87`) | ✅ |
| Agenda (`agenda`) | ✅ |
| Reportes (`reportes`) | ✅ |
| Dashboard (`dashboard_comercial`) | ❌ |
| Iniciativas (`entidades`) | ❌ |
| Clientes (`socios`) | ❌ |
| IA (`ia`) | ❌ |
| Mesa de ayuda (`mesa_ayuda`) | ❌ |
| Manual de neuroventas (`neuroventas`) | ❌ |
| Personalización (`personalizacion`) | ❌ |
| Configuración (`configuracion`) | ❌ |

### Rutas

| Ruta | Resultado |
|------|-----------|
| `/admin` | ✅ Carga |
| `/admin/leads` | ✅ Carga |
| `/admin/constructor-crm/paquetes` | ❌ Redirige a `/403` |

---

## 8. Validación de bloqueo UI Constructor

| Aspecto | Detalle |
|---------|---------|
| **Implementación** | `app/admin/constructor-crm/layout.tsx` — Server Component |
| **Condición de bloqueo** | `isClientCrmMode()` → `redirect("/403")` |
| **Rutas afectadas** | `/admin/constructor-crm` y subrutas (`paquetes`, `auditoria`, `cuestionario`, etc.) |
| **Página 403** | Ruta `/403` existente; mensaje “Sin permisos” correcto |
| **constructor_base** | Rutas Constructor siguen cargando (validado en §5) |
| **Alias `/admin/constructor/*`** | Redirect en `next.config.ts` hacia `constructor-crm`; queda cubierto por el mismo layout |

**Limitación explícita:** el bloqueo es **solo UI**. No impide llamadas directas a APIs (§9).

---

## 9. Qué NO se validó

- Bloqueo de **`/api/admin/constructor/*`** (pendiente 12E).
- Cambios en **middleware** / **proxy** (no modificados).
- Todos los **roles** (`admin`, `comercial`, `operador`, `viewer`).
- **Usuario cliente final** real (solo sesión Summer87 en dev).
- **Tenant / clon** desplegado con `.env` de producción.
- **`.env` de producción** o Vercel/hosting.
- Todos los módulos operativos posibles en allowlist.
- **Supabase RLS** y permisos a nivel BD.
- **`installation_prep`** como modo intermedio.
- Sanitización de **`portal_config.sidebar_modules`** en clon cliente.

---

## 10. Riesgos residuales

| Riesgo | Mitigación futura |
|--------|-------------------|
| APIs internas accesibles por URL/curl | 12E — guards en route handlers |
| Protección UI ≠ seguridad completa | Combinar menú + layout + API + RBAC |
| Owner cliente vs superadmin Summer87 | 12I — roles y `INTERNAL_ADMIN_EMAILS` |
| Keys incorrectas en `CLIENT_VISIBLE_MODULES` | Checklist clon 12G; documentar keys válidas |
| `portal_config` reintroduce claves internas | Sanitizar merge en `client_crm` |
| **reset-db** y acciones destructivas | 12H — `system_danger` + bloqueo API |
| Configuración (`/admin/configuracion`) con tabs internos | Subfase tabs por modo (12B §13) |

---

## 11. Estado técnico al cierre

| Componente | Estado |
|------------|--------|
| `lib/config/appMode.ts` | Implementado — default `constructor_base` |
| `filterAdminSidebarModulesByMode()` | Implementado — integrado vía `app/admin/layout.tsx` → `AdminShell` |
| `menuCategory` + `getAdminSidebarModuleCategory()` | Implementado |
| Guard UI `app/admin/constructor-crm/layout.tsx` | Implementado — commit “Block constructor UI routes in client CRM mode” |
| **Menú en constructor_base** | Sin regresión observada |
| **Menú en client_crm + allowlist** | Filtrado correcto |
| **UI Constructor en client_crm** | Bloqueada → `/403` |
| **Build** | Exitoso en fases de implementación previas |
| **Repo** | Commits de helper, categorías, filtro menú y guard UI registrados antes de este doc |

---

## 12. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12E** | Bloqueo `/api/admin/constructor/*` por `APP_MODE` |
| **12F** | Validación documental de APIs bloqueadas |
| **12G** | `.env.example` + checklist clon (`APP_MODE`, módulos visibles) |
| **12H** | Revisión `reset-db` y categoría `system_danger` |
| **12I** | Roles cliente vs Summer87; bypass interno acotado |

---

## 13. Decisión actual

> **En 12D solo se documenta la validación manual.**  
> **No se modifica código ni configuración persistente.**

---

## 14. Confirmación de alcance (fase 12D documental)

- ✅ Validación manual registrada en este archivo  
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

*Documento 12D — Validación modo client_crm. Siguiente foco recomendado: 12E (API guards).*
