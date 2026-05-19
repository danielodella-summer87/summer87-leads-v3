# Validación Ocultar Tabs Técnico Consultor Client CRM Pickup 4x4 12U-2V — Constructor CRM Summer87

**Versión:** 12U-2 — quick win ocultar tabs Técnico / Consultor y CTAs hacia Consultor en ficha lead (`client_crm`)  
**Auditoría origen:** `auditoria-brecha-constructor-vs-crm-operativo-pickup4x4-12U.md`  
**Fase anterior:** `validacion-ocultar-iniciativa-client-crm-pickup4x4-12U-1V.md` (12U-1)  
**Commit funcional:** `0b3eefd`

**Estado validación:** build local **OK**; validación visual Vercel **OK** para tabs Técnico/Consultor y CTAs hacia Consultor en `client_crm`.

---

## Validación visual Vercel — 2026-05-18

| Campo | Valor |
|-------|--------|
| **Entorno** | Pickup 4x4 CRM demo — Vercel production (`pickup4x4-crm-demo.vercel.app`) |
| **Commit funcional** | `0b3eefd` |
| **Usuario** | Daniel (admin) |
| **Lead** | Demo — Lona marítima Hilux |
| **URL ficha** | https://pickup4x4-crm-demo.vercel.app/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df |
| **Resultado** | **OK** |

### Observaciones en ficha (`client_crm`)

| Criterio | Resultado |
|----------|-----------|
| Tab **Técnico** | No visible |
| Tab **Consultor** | No visible |
| Botón cabecera **Propuesta comercial** | No visible |
| Tabs **Datos** y **Comercial** | Visibles |
| **Contactos** y **Acciones** (cabecera) | Visibles |
| **Flujo comercial** | Visible |
| **Siguiente paso recomendado** | Visible |
| **Seguimiento piloto** | Visible |
| **Datos del lead** | Visible |
| **Iniciativa** / **Datos de Iniciativa** | No visibles (12U-1 sigue vigente) |

### Dictamen

**12U-2 queda visualmente validado para la ficha principal en `client_crm`.** La demo ya no expone superficies Técnico/Consultor ni CTAs hacia Consultor para admin.

Durante esta validación **tampoco se observó Iniciativa / Datos de Iniciativa**, confirmando que **12U-1 sigue vigente** en el mismo despliegue.

---

## 1. Resumen del cambio

En `APP_MODE=client_crm`, las pestañas **Técnico** y **Consultor** dejan de mostrarse en la ficha de lead **incluso para usuario admin**, evitando superficies heredadas (IA consultiva, EASY, propuesta inteligente, etc.) en la demo Pickup 4x4.

Además, en `client_crm` se ocultan los **CTAs visibles** que navegan al tab Consultor (cabecera y flujo comercial), para que no queden accesos a un tab que el usuario no puede ver.

| Estrategia | Detalle |
|------------|---------|
| **Tabs** | Tras `getVisibleLeadTabs(role)`, filtrar `tecnico` y `consultor` si `isClientCrmUi` |
| **CTAs Consultor** | Envolver / condicionar con `!isClientCrmUi` los botones que hacen `router.push` a `?tab=consultor&section=…` |
| **Fallback tab** | `useEffect` existente: si `activeTab` no está en `visibleTabIds`, vuelve a `"datos"` |
| **URL** | `?tab=consultor` / `?tab=tecnico` no activan tab si no están en `visibleTabIds` |
| **Sin borrar código** | Contenido de tabs y lógica de propuesta intactos; no se renderizan CTAs/tabs inaccesibles en `client_crm` |

---

## 2. Relación con auditoría 12U

La auditoría 12U prioriza quick wins mientras el CRM operativo no consume el paquete del Constructor. **12U-2** reduce ruido consultivo en demo `client_crm` sin esperar ocultamiento por rol comercial ni refactor de tabs.

---

## 3. Relación con 12U-1

| Fase | Alcance |
|------|---------|
| **12U-1** | Iniciativa (alerta + bloque + copiar desde iniciativa) — ✅ validado Vercel; reconfirmado en sesión 12U-2 (2026-05-18) |
| **12U-2** | Tabs **Técnico** / **Consultor** + CTAs hacia Consultor en `client_crm` — ✅ validado Vercel (2026-05-18) |

No se solapan: 12U-1 no tocó tabs; 12U-2 no tocó iniciativa.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/[id]/page.tsx` | `visibleTabs` con filtro `!tecnico && !consultor` cuando `isClientCrmUi`; CTAs hacia Consultor ocultos con `!isClientCrmUi` (ver §5) |
| `docs/constructor-crm/validacion-ocultar-tabs-tecnico-consultor-client-crm-pickup4x4-12U-2V.md` | Esta validación ampliada |

**No modificado:** contenido JSX interno de tabs Técnico/Consultor, lógica de propuesta, `getVisibleLeadTabs` por rol en modos internos, APIs, `LeadsClientCrmContext.tsx`.

---

## 5. Qué se oculta en `client_crm`

### Tabs

| Elemento | Comportamiento |
|----------|----------------|
| Botón tab **Técnico** (áreas de trabajo) | No aparece en barra inferior |
| Botón tab **Consultor** (áreas de trabajo) | No aparece en barra inferior |
| Contenido `activeTab === "tecnico"` | No accesible vía tabs; `activeTab` redirige a tab válido |
| Contenido `activeTab === "consultor"` | Idem |

### CTAs hacia Consultor

| CTA | Ubicación | Query / destino |
|-----|-----------|-----------------|
| **Propuesta comercial** | Cabecera de la ficha | `?tab=consultor&section=services-proposal` |
| CTA paso 4 del flujo comercial | Bloque proceso comercial | `?tab=consultor&section=services-proposal` |
| **Abrir Consultor — propuesta** | Paso 6 del flujo comercial | `?tab=consultor&section=proposal-export` |
| Botón **Siguiente paso recomendado** | Solo cuando el destino es tab `consultor` o `tecnico` | `?tab=${display.tab}&section=…` |

Condición de implementación: `{!isClientCrmUi ? (…botón…) : null}` o `&& !isClientCrmUi` en el bloque condicional existente.

---

## 6. Qué se mantiene visible en `client_crm`

| Elemento |
|----------|
| Tabs **Datos**, **Comercial** (áreas de trabajo) |
| **Contactos** y **Acciones** (cabecera) |
| Flujo comercial (pasos 1–6; CTAs que **no** apuntan a Consultor) |
| **Siguiente paso recomendado** cuando el destino no es tab Técnico/Consultor |
| Acordeón **Datos del lead**, **Seguimiento piloto**, **Producto / servicio** |
| Agenda / acciones del lead (tab Acciones) |

---

## 7. Qué se mantiene en modos internos

Cuando `isClientCrmUi === false` (`constructor_base`, etc.):

- `getVisibleLeadTabs(role)` sin filtro adicional.
- Admin sigue viendo **Técnico** y **Consultor** según rol.
- Contenido de esos tabs sin cambios.
- **Todos los CTAs** de cabecera y flujo hacia Consultor siguen visibles y funcionales.

*Validación visual de modos internos: fuera de alcance de esta sesión Vercel (solo `client_crm` en pickup4x4-crm-demo).*

---

## 8. Qué no se tocó

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware / seguridad 403 | ❌ No |
| Migraciones / schema | ❌ No |
| Iniciativa (12U-1) | ❌ No |
| Socio/Socios Agenda (12U-3) | ❌ No |
| Constructor / Installer | ❌ No |
| Contenido interno de tabs Técnico/Consultor | ❌ No (solo visibilidad de tabs y CTAs) |
| Lógica de propuesta / generación documentos | ❌ No |
| `.env.local` | ❌ No |

---

## 9. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** (Next.js 16, TypeScript sin error) |

---

## 10. Checklist visual — Vercel

Entorno: `https://pickup4x4-crm-demo.vercel.app` · usuario **admin** (Daniel) · ficha **Demo — Lona marítima Hilux** · commit `0b3eefd`  
`https://pickup4x4-crm-demo.vercel.app/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df`

Referencia detallada: [Validación visual Vercel — 2026-05-18](#validación-visual-vercel--2026-05-18).

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ficha **no** muestra tab **Técnico** | ✅ § Vercel 2026-05-18 |
| 2 | Ficha **no** muestra tab **Consultor** | ✅ § Vercel 2026-05-18 |
| 3 | Ficha **sí** muestra tab **Datos** | ✅ § Vercel 2026-05-18 |
| 4 | Ficha **sí** muestra tab **Comercial** | ✅ § Vercel 2026-05-18 |
| 5 | Ficha **sí** muestra **Contactos** (cabecera) | ✅ § Vercel 2026-05-18 |
| 6 | Ficha **sí** muestra **Acciones** (cabecera) | ✅ § Vercel 2026-05-18 |
| 7 | **Flujo comercial** visible | ✅ § Vercel 2026-05-18 |
| 8 | **Siguiente paso recomendado** visible (cuando aplica y no apunta a Técnico/Consultor) | ✅ § Vercel 2026-05-18 |
| 9 | **Datos del lead** / seguimiento piloto / producto visibles | ✅ § Vercel 2026-05-18 |
| 10 | Si URL o estado previo tenía `tab=tecnico` o `tab=consultor`, cae en **Datos** u otro tab válido | ☐ Pendiente (no probado explícitamente en esta sesión) |
| 11 | Cabecera **no** muestra botón **Propuesta comercial** | ✅ § Vercel 2026-05-18 |
| 12 | Flujo comercial **no** muestra CTAs hacia propuesta/exportación del tab Consultor (paso 4 → services-proposal; paso 6 → proposal-export) | ✅ § Vercel 2026-05-18 |

**Modo interno (`constructor_base`):** tabs Técnico/Consultor y todos los CTAs anteriores **sí** deben verse — no validado en esta sesión.

---

## 11. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo | ❌ No |
| Datos modificados | ❌ No |
| APIs | ❌ No |
| Middleware | ❌ No |
| Migraciones | ❌ No |
| Constructor / Installer | ❌ No |
| Código modificado en esta pasada (solo doc) | ❌ No |
| Commit desde esta pasada | ❌ No |

---

*Validación 12U-2V — Tabs Técnico/Consultor y CTAs hacia Consultor ocultos en `client_crm`; validación visual Vercel OK (2026-05-18, commit `0b3eefd`). Pendiente opcional: ítem 10 (redirect URL con `tab=tecnico` / `tab=consultor`).*
