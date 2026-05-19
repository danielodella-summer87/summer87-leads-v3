# Validación Ocultar Iniciativa Client CRM Pickup 4x4 12U-1V — Constructor CRM Summer87

**Versión:** 12U-1 — quick win ocultar Iniciativa en ficha lead (`client_crm`)  
**Auditoría origen:** `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md`  
**Patrón:** mismo enfoque que 12S (`useLeadsClientCrmMode` / `LeadsClientCrmContext`)

**Estado validación:** build local **OK**; validación visual Vercel **pendiente** (checklist §6).

---

## 1. Resumen del cambio

En `APP_MODE=client_crm` (demo Pickup 4x4) se **ocultan** en la ficha de lead las referencias visibles a **Iniciativa** / empresa vinculada, heredadas del CRM base Summer87. Pickup 4x4 no opera con módulo de iniciativas en el piloto.

| Estrategia | Detalle |
|------------|---------|
| **Condición UI** | `!isClientCrmUi` donde `isClientCrmUi = useLeadsClientCrmMode()` |
| **Sin borrar código** | Bloques intactos; visibles en modos internos (`constructor_base`, etc.) |
| **Sin backend** | No se modifican APIs, `empresa_id` en BD ni payloads |

---

## 2. Relación con auditoría 12U

La auditoría 12U identifica que el CRM operativo actual no consume aún el paquete del Constructor y conserva superficies del base madre. **12U-1** ataca el quick win P1: quitar ruido de **Iniciativa** en demo `client_crm` sin esperar arquitectura de instancia generada por Constructor.

---

## 3. Archivo modificado

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/[id]/page.tsx` | Condiciones `!isClientCrmUi` en alerta, bloque Datos de Iniciativa y botón «Copiar desde Iniciativa» |

**No modificado:** `LeadsClientCrmContext.tsx`, `layout.tsx`, APIs, middleware, otros tabs.

---

## 4. Qué se oculta en `client_crm`

| Elemento | Ubicación (tab / sección) | Comportamiento |
|----------|---------------------------|----------------|
| Alerta amarilla *«Este lead no está vinculado a una iniciativa»* | `datos` | No renderiza |
| Texto *«Vincula este lead a una iniciativa…»* + input/botón Vincular | `datos` | No renderiza |
| Título y campos **«Datos de Iniciativa»** (nombre, teléfono, email, rubro, dirección, web, redes, etc.) | Acordeón **Datos del lead** → `datos` | No renderiza |
| Botón **«Copiar desde Iniciativa»** (website desde empresa) | `comercial` → Datos del Lead | No renderiza |

---

## 5. Qué se mantiene visible en `client_crm`

| Elemento | Nota |
|----------|------|
| Acordeón **Datos del lead** + grid **Datos del lead (base)** | Sin cambio |
| **Seguimiento piloto** | Sin cambio |
| **Producto / servicio** y flujo comercial | Sin cambio (tabs no tocados en 12U-1) |
| **Siguiente paso recomendado** | Sin cambio |
| Tab **Acciones** / agenda del lead | Sin cambio |
| **Relevamiento de visita** | Sigue oculto desde 12S (`!isClientCrmUi`) |

---

## 6. Qué se mantiene en modos internos

Cuando `isClientCrmUi === false` (p. ej. `constructor_base`):

- Alerta de iniciativa no vinculada **visible** (si aplica).
- Bloque **Datos de Iniciativa** **visible** con todos los campos.
- **Copiar desde Iniciativa** **visible** en edición si hay web en empresa.

---

## 7. Qué no se tocó

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware / seguridad 403 | ❌ No |
| Migraciones / schema | ❌ No |
| Tabs **Técnico / Consultor** | ❌ No (12U-2) |
| **Socio/Socios** en Agenda | ❌ No (12U-3) |
| Constructor / Installer | ❌ No |
| `.env.local` | ❌ No |
| Checklist interno *«Confirmar vínculo con iniciativa»* en config de pasos | ❌ No (puede seguir en copy de siguiente paso; fuera de alcance 12U-1) |

---

## 8. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (Next.js 16, TypeScript sin error) |

---

## 9. Checklist visual pendiente — Vercel

Entorno: `https://pickup4x4-crm-demo.vercel.app` · ficha Demo **Demo — Lona marítima Hilux** (buscar `lona` o usar UUID conocido post-deploy)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ficha **no** muestra alerta de iniciativa no vinculada | ☐ |
| 2 | Ficha **no** muestra bloque **«Datos de Iniciativa»** | ☐ |
| 3 | Acordeón **«Datos del lead»** sigue visible | ☐ |
| 4 | **Producto / servicio** y bloques comerciales siguen visibles | ☐ |
| 5 | **Siguiente paso recomendado** sigue visible | ☐ |
| 6 | **Flujo comercial** (pasos / barra) sigue visible | ☐ |
| 7 | En modo interno (si se prueba): bloque Iniciativa **sigue** visible | ☐ |

---

## 10. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo | ❌ No |
| Datos modificados | ❌ No |
| APIs | ❌ No |
| Middleware | ❌ No |
| Migraciones | ❌ No |
| Commit desde esta pasada | ❌ No |

---

*Validación 12U-1V — Iniciativa oculta en client_crm; verificación runtime Vercel pendiente.*
