# Validación Ocultar Iniciativa Client CRM Pickup 4x4 12U-1V — Constructor CRM Summer87

**Versión:** 12U-1 — quick win ocultar Iniciativa en ficha lead (`client_crm`)  
**Auditoría origen:** `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md`  
**Patrón:** mismo enfoque que 12S (`useLeadsClientCrmMode` / `LeadsClientCrmContext`)

**Estado validación:** build local **OK**; validación visual Vercel **OK** para ocultamiento de Iniciativa en `client_crm`; pendiente **12U-2** tabs Técnico/Consultor.

**Commit funcional validado (Vercel):** `73aa5c7`

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

## 9. Checklist visual — Vercel

Ficha validada: **Demo — Lona marítima Hilux** · evidencia en §10.

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ficha **no** muestra alerta de iniciativa no vinculada | ✅ §10 |
| 2 | Ficha **no** muestra bloque **«Datos de Iniciativa»** | ✅ §10 |
| 3 | Acordeón **«Datos del lead»** sigue visible | ✅ §10 |
| 4 | **Producto / servicio** y bloques comerciales siguen visibles | ✅ §10 |
| 5 | **Siguiente paso recomendado** sigue visible | ✅ §10 |
| 6 | **Flujo comercial** (pasos / barra) sigue visible | ✅ §10 |
| 7 | En modo interno (si se prueba): bloque Iniciativa **sigue** visible | ☐ No revalidado en esta pasada |

---

## 10. Validación visual Vercel — 2026-05-18

| Campo | Valor |
|-------|--------|
| **Entorno** | Vercel production — `pickup4x4-crm-demo` |
| **Commit funcional** | `73aa5c7` |
| **URL validada** | https://pickup4x4-crm-demo.vercel.app/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df |
| **Lead usado** | **Demo — Lona marítima Hilux** |
| **Usuario** | Sesión admin (Daniel) |

### Nota de ejecución

En una **primera captura** aún aparecían la alerta de iniciativa y el bloque «Datos de Iniciativa» — **inferido**: vista anterior, caché del navegador o deploy aún no propagado. Tras recarga con deploy actualizado (`73aa5c7`), el ocultamiento de Iniciativa se confirmó.

### Resultado — alcance 12U-1

| Criterio | Resultado |
|----------|-----------|
| **No** aparece alerta «Este lead no está vinculado a una iniciativa» | ✅ OK |
| **No** aparece texto «Vincula este lead a una iniciativa…» | ✅ OK |
| **No** aparece bloque **«Datos de Iniciativa»** | ✅ OK |
| Acordeón **«Datos del lead»** sigue visible | ✅ OK |
| **Producto / servicio consultado** sigue visible | ✅ OK |
| **Seguimiento piloto** sigue visible | ✅ OK |
| **Siguiente paso recomendado** sigue visible | ✅ OK |
| **Flujo comercial** sigue visible | ✅ OK |

### Dictamen visual 12U-1

**OK** — El objetivo **12U-1** (ocultar Iniciativa en `client_crm`) queda cumplido en Vercel production.

---

## 11. Hallazgo fuera de alcance 12U-1

| Hallazgo | Detalle |
|----------|---------|
| Tabs **Técnico** / **Consultor** | Siguen **visibles** para usuario **admin** en `client_crm` |
| Contenido al abrirlos | Superficies heredadas de **consultoría / EASY / IA / propuesta** no adecuadas para demo limpia Pickup 4x4 |
| Fase | Resolver en **12U-2** |
| Impacto en 12U-1 | **Ninguno** — 12U-1 solo cubría ocultamiento de **Iniciativa**; no afecta el dictamen de esta fase |

---

## 12. Confirmación de alcance

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

*Validación 12U-1V — Iniciativa oculta en client_crm verificada en Vercel (`73aa5c7`); tabs Técnico/Consultor → 12U-2.*
