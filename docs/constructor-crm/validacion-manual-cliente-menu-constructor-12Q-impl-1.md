# Validación — Manual cliente en Constructor CRM (12Q-impl-1)

**Fecha:** 2026-05-17  
**Alcance:** pantalla interna Summer87 para revisar el manual breve orientado al usuario cliente final.

---

## Cambios realizados

| Ítem | Detalle |
|------|---------|
| **Ruta UI** | `app/admin/constructor-crm/manual-cliente/page.tsx` → `/admin/constructor-crm/manual-cliente` |
| **Menú lateral** | Entrada `constructor_manual_cliente` en `lib/admin/adminSidebarModules.ts` (`DEFAULT_ADMIN_SIDEBAR_MODULES`) |
| **Label menú** | Manual cliente |
| **Href menú** | `/admin/constructor-crm/manual-cliente` |
| **Icono** | 📘 |
| **Categoría** | `internal_constructor` (no operativo cliente) |
| **Breadcrumb** | `AdminShell`: Constructor CRM → Manual cliente |

---

## Ubicación y seguridad

- La pantalla queda bajo **`/admin/constructor-crm`**, por lo que hereda el guard de `app/admin/constructor-crm/layout.tsx` (`isClientCrmMode()` → redirect `/403`).
- En **`APP_MODE=client_crm`** el ítem de menú se filtra con `filterAdminSidebarModulesByMode` (categoría `internal_constructor` no visible).
- **No** se modificó `CLIENT_VISIBLE_MODULES`.
- **No** se agregó como módulo operativo del cliente.

---

## Contenido de la pantalla

- Título visible: **Manual breve de uso — CRM Operativo Summer87** (sin “12Q”).
- Sin bloques de alcance documental interno, fases 12L–12P, APP_MODE, Supabase, APIs, SQL ni rutas internas.
- 19 secciones del manual en cards.
- Caja destacada “Antes de entregar…”.
- Botón principal verde: **Copiar texto del manual** (clipboard; fallback “Próximamente”).
- Botón/link secundario: **Volver al Constructor** → `/admin/constructor-crm`.
- **No** se implementó exportación PDF.

---

## Lo que no se tocó

| Área | Estado |
|------|--------|
| Supabase | No modificado |
| SQL / migraciones | No ejecutado |
| Datos | No modificados |
| APIs / endpoints | Sin cambios |
| `.env.local` | Sin cambios |
| Middleware / proxy | Sin cambios |
| Autenticación / permisos | Sin cambios |
| Zeta / Kore | Sin cambios |

---

## Validaciones pendientes (manual)

- [x] `npm run build` sin errores (2026-05-17, local)
- [ ] Revisión visual en modo Constructor (`constructor_base` o equivalente con Constructor habilitado)
- [ ] Confirmar ítem **Manual cliente** visible en sidebar interno
- [ ] Con `APP_MODE=client_crm`: menú sin ítem; URL `/admin/constructor-crm/manual-cliente` → **403**
- [ ] Copiar al portapapeles en navegador de escritorio

---

## Referencia

- Manual fuente interno: `docs/constructor-crm/manual-breve-usuario-cliente-12Q.md`
