# Validación UI Configuración Bloqueada Client CRM 12I-impl-6V — Constructor CRM Summer87

**Versión:** Fase 12I-impl-6V (validación por revisión de código + build — documental)  
**Relacionado con:** `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, `docs/constructor-crm/validacion-lecturas-sensibles-client-crm-12I-impl-5V.md`, `docs/constructor-crm/validacion-gestion-usuarios-bloqueada-client-crm-12I-impl-4V.md`, `app/admin/configuracion/layout.tsx`, `lib/config/appMode.ts`

**Estado:** implementación confirmada por diff y build. **No** incluye prueba runtime manual en `client_crm`.

**Commit de implementación:** `b2679b7` — *Block admin configuration UI in client CRM mode*

---

## 2. Resumen ejecutivo

Se validó — mediante **revisión de diff**, lectura del layout y **`npm run build` exitoso** — que en **`APP_MODE=client_crm`** el segmento **`/admin/configuracion/*`** queda **bloqueado** por un guard en el **Server Component** del layout padre: al detectar `client_crm`, ejecuta **`redirect("/403")`** antes de sesión, permisos o render de páginas hijas.

Complementa los guards de **API** (12I-impl-1 a 5): evita acceso por **URL directa** a pantallas de usuarios, roles, módulos-menú y hub de configuración interna aunque el ítem de menú esté oculto por `CLIENT_VISIBLE_MODULES`.

---

## 3. Implementación validada

| Elemento | Detalle |
|----------|---------|
| **Layout** | `app/admin/configuracion/layout.tsx` |
| **Helper** | `isClientCrmMode()` |
| **Archivo helper** | `lib/config/appMode.ts` |
| **Commit** | `b2679b7` |
| **Acción** | `redirect("/403")` |
| **Build** | ✅ OK |

---

## 4. Rutas UI bloqueadas

Todas las rutas bajo el layout **`app/admin/configuracion/layout.tsx`** quedan bloqueadas en **`client_crm`** (redirección a `/403`):

| Ruta | Contenido (referencia) |
|------|------------------------|
| `/admin/configuracion` | Hub (tabs, reset/seed, roles en UI) |
| `/admin/configuracion/usuarios` | Gestión usuarios |
| `/admin/configuracion/roles` | Listado roles |
| `/admin/configuracion/roles/[id]` | Detalle permisos por rol |
| `/admin/configuracion/modulos-menu` | Editor `sidebar_modules` |
| `/admin/configuracion/pipelines` | Pipelines |
| `/admin/configuracion/ia` | Configuración IA plataforma |
| `/admin/configuracion/rubros` | Rubros |
| `/admin/configuracion/servicios` | Servicios |
| `/admin/configuracion/comerciales` | Comerciales |
| `/admin/configuracion/estados` | Estados |
| `/admin/configuracion/leads` | Opciones leads (config) |
| `/admin/configuracion/personalizacion` | Sub-ruta personalización dentro del segmento |

**Mecanismo:** un solo guard en el layout padre; no se requirieron guards por página hija.

---

## 5. Rutas no afectadas

| Ruta / área | Motivo |
|-------------|--------|
| `/admin/personalizacion` | **Fuera** del segmento `configuracion` (`app/admin/personalizacion/page.tsx`); **no** modificada en esta fase |
| `/admin/leads`, `/admin/leads87` | Operativos; sin cambio |
| `/admin/agenda` | Operativo; sin cambio |
| `/admin/reportes` | Operativo; sin cambio |
| `/admin/constructor-crm/*` | Ya bloqueado por layout propio (12D) |
| **APIs** | No dependen de este layout; mantienen guards de fases 12I-impl anteriores |

---

## 6. Lectura técnica

| Aspecto | Comportamiento |
|---------|----------------|
| Posición del guard | **Inicio** del Server Component `ConfiguracionLayout` |
| Orden | `isClientCrmMode()` → `redirect("/403")` **antes** de `getSession()` y `getActiveUserPermissions()` |
| Efecto | No se renderiza ningún `children` del segmento |
| Tipo de control | Bloqueo **UI / URL directa** |
| Relación con APIs | **Complementario**; no sustituye guards en route handlers |
| **`constructor_base`** | Sin `APP_MODE=client_crm` → flujo histórico (sesión + `config.admin`) |
| **`installation_prep`** | No bloqueado por este guard en implementación actual |

Comentario en código documenta: guard por `APP_MODE`, configuración operativa cliente en fase futura, `/admin/personalizacion` fuera del segmento.

---

## 7. Por qué bloquear todo `/admin/configuracion`

| Razón | Detalle |
|-------|---------|
| Piloto primer cliente | Configuración **avanzada** no se entrega al cliente final |
| Contenido del segmento | Usuarios, roles, módulos-menú, hub con herramientas internas, ajustes de plataforma |
| Seguridad pragmática | Bloqueo del **segmento completo** hasta diseñar rutas de **configuración operativa** acotadas |
| Coherencia con APIs | Lecturas/escrituras sensibles ya denegadas en 12I-impl-1 a 5 |
| Futuro | `operational_config` en rutas separadas (p. ej. solo pipelines/estados permitidos) |

---

## 8. Qué NO se validó

| Ítem | Nota |
|------|------|
| Runtime manual en `client_crm` | No ejecutado en esta fase documental |
| `/admin/configuracion` con sesión real | Pendiente staging |
| Staging / clon / production | No probado |
| `.env.local` | No modificado |
| `/admin/personalizacion` en runtime | No validado |
| Rediseño configuración operativa cliente | Fuera de alcance |
| APIs | No tocadas en b2679b7 |
| Middleware | No modificado |
| SQL | No ejecutado |

---

## 9. Riesgos residuales

| Riesgo | Fase sugerida |
|--------|----------------|
| `/admin/personalizacion` accesible si menú/rol lo permite | Política producto + allowlist |
| `GET /api/admin/users` abierto (Agenda) | 12I-impl-7 |
| Configuración operativa cliente sin ruta dedicada | Diseño post-piloto |
| Validación integral clon | 12J |
| `CLIENT_VISIBLE_MODULES` con `configuracion` por error | Checklist 12M / 12K |
| Runbook instalación | 12K |

---

## 10. Estado técnico al cierre

| Capa | Estado |
|------|--------|
| **`/admin/configuracion/*` UI** | ✅ Bloqueado en `client_crm` (b2679b7) |
| Constructor UI/API | ✅ Bloqueado (12D–12F) |
| **system_danger** | ✅ Bloqueado (12H-impl) |
| **portal_config** PATCH | ✅ Sanitizado (12H-impl-4V) |
| Matriz roles/permisos (escritura) | ✅ Bloqueada (7c3a543) |
| **users/set-role** | ✅ Restringido (b4af5ba) |
| **act-as** | ✅ Bloqueado (487f8c6) |
| Gestión sensible usuarios (POST) | ✅ Bloqueada (4fafacd) |
| **GET config/usuarios / config/roles** | ✅ Bloqueados (bb7342e) |
| **permissions/me** | ✅ Filtrado (bb7342e) |
| **Build** | ✅ OK |
| **Commit** | `b2679b7` |
| **Repo** | Limpio tras commit |
| **Datos** | Sin cambios en esta validación documental |

---

## 11. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-7** | Reemplazar `/api/admin/users` en Agenda por endpoint acotado |
| **12J** | Validación con clon/staging real (UI + APIs) |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Preparación piloto primer cliente |
| **12M** | Checklist go/no-go primer cliente |

---

## 12. Decisión actual

> **En 12I-impl-6V solo se documenta la validación por revisión de código y build.**  
> **No se ejecuta runtime manual ni se modifican datos.**

---

## 13. Confirmación de alcance (fase 12I-impl-6V documental)

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

*Documento 12I-impl-6V — UI configuración bloqueada en client_crm. Implementación: b2679b7. Serie hardening 12I: APIs 1–5V, UI 6V.*
