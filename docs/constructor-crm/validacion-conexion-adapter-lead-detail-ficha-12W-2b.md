# Validación Conexión Adapter Lead Detail Ficha 12W-2b — Constructor CRM Summer87

**Versión:** 12W-2b — wiring contrato → ficha lead (fallback-safe)  
**Base:** 12W-1 loader (`6cba550`), 12W-2 adapter (`defcf26`), 12U-1/12U-2 validados Vercel

**Estado:** integración en layout + ficha; build local **OK**; checklist visual Vercel **pendiente**.

---

## 1. Resumen del cambio

La ficha de lead **consume** el snapshot `leadDetailVisibility` calculado en server (`leads/layout.tsx`) vía contexto extendido. Las reglas **12U** (`isClientCrmUi`) se mantienen en **OR** con el contrato: nunca se muestra más que antes en `client_crm`.

| Capa | Rol |
|------|-----|
| `getActiveCrmPackageConfigFromEnvironment()` | Resuelve contrato en layout (server) |
| `packageToLeadDetailVisibility(config)` | Adapter → snapshot |
| `LeadsClientCrmProvider` | Pasa `leadDetailVisibility` al árbol leads |
| `useLeadDetailVisibility()` + helpers | Ficha (client) combina con 12U |

---

## 2. Relación con 12W-1 y 12W-2

| Fase | Aporte |
|------|--------|
| **12W-1** | Loader devuelve `pickup4x4CrmPackageConfig` en demo |
| **12W-2** | `packageToLeadDetailVisibility` |
| **12W-2b** | Primera **consumición** en UI (solo ficha leads) |

---

## 3. Relación con 12U-1 y 12U-2

| Superficie | Lógica integrada |
|------------|------------------|
| Tabs Técnico/Consultor | `shouldHideLeadTab` = 12U (`isClientCrmUi`) **OR** `isLeadDetailTabHidden` |
| Iniciativa / Datos Iniciativa | `hideIniciativaSurfaces` = 12U **OR** bloque `iniciativa_link` |
| CTAs Consultor / Propuesta comercial | `hideConsultorSurfaces` (= ocultar tab consultor) |

`isClientCrmUi` **no eliminado**. Sin contrato activo (`source: legacy`), el OR deja el comportamiento 12U intacto.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/LeadsClientCrmContext.tsx` | `LeadDetailVisibilitySnapshot`, `useLeadDetailVisibility()` |
| `app/admin/leads/layout.tsx` | Loader + adapter → provider |
| `app/admin/leads/[id]/page.tsx` | `shouldHideLeadTab`, `hideIniciativaSurfaces`, `hideConsultorSurfaces` |
| `docs/constructor-crm/validacion-conexion-adapter-lead-detail-ficha-12W-2b.md` | Este documento |

**No modificado:** agenda, dashboard, reportes, sidebar, APIs, `pickup4x4.config.ts`.

---

## 5. Qué consume ahora la ficha

- Snapshot `leadDetailVisibility` desde contexto.
- Helpers puros `isLeadDetailTabHidden` / `isLeadDetailBlockHidden` (import directo adapter, sin loader en client).
- `visibleTabs` filtrado por `shouldHideLeadTab`.
- Bloques Iniciativa y CTAs Consultor según constantes anteriores.

---

## 6. Qué sigue en fallback legacy

| Condición | Comportamiento |
|-----------|----------------|
| Loader sin contrato (`config: null`) | `leadDetailVisibility` = listas vacías, `source: legacy` |
| Modo interno (`constructor_base`) | Sin contrato típico → solo reglas rol/12U (12U no aplica si no `client_crm`) |
| `ok: false` loader | `config: null` → legacy; sin error en UI |

---

## 7. Qué NO se conectó todavía

| Ítem | Estado |
|------|--------|
| `hide_blocks`: relevamiento_visita, servicios_especiales, next_step_easy | ❌ (solo iniciativa_link + tabs) |
| `nuevo/page.tsx` | ❌ |
| Sidebar `visibility_rules.sidebar` | ❌ |
| Dashboard / agenda / reportes | ❌ |
| Eliminar duplicación 12U | ❌ (fase posterior) |

---

## 8. Resultado esperado en `client_crm`

Igual que validación 12U-1/12U-2 Vercel (contrato Pickup refuerza las mismas reglas):

- Sin tabs Técnico/Consultor.
- Sin Iniciativa / Datos de Iniciativa.
- Sin Propuesta comercial ni CTAs a Consultor.
- Datos, Comercial, Contactos, Acciones, flujo comercial visibles.

---

## 9. Resultado esperado en modo interno

Sin cambio respecto a antes de 12W-2b: si no hay contrato activo, `hideIniciativaSurfaces` y `hideConsultorSurfaces` dependen solo de `isClientCrmUi` (false) → superficies internas visibles según rol.

---

## 10. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** |

---

## 11. Checklist visual pendiente — Vercel

Ficha: **Demo — Lona marítima Hilux** · `client_crm` · post-deploy 12W-2b

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Ficha carga | ☐ |
| 2 | No tab Técnico | ☐ |
| 3 | No tab Consultor | ☐ |
| 4 | No Propuesta comercial (cabecera) | ☐ |
| 5 | No Iniciativa / Datos de Iniciativa | ☐ |
| 6 | Sí Datos / Comercial | ☐ |
| 7 | Sí Contactos / Acciones | ☐ |
| 8 | Sí Flujo comercial / Siguiente paso | ☐ |
| 9 | Sin error consola evidente | ☐ |
| 10 | Agenda / Dashboard no afectados | ☐ |

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Dashboard / agenda / reportes / sidebar | ❌ No |
| Cambio visual intencional distinto a 12U | ❌ No (mismo resultado esperado) |
| `getActiveCrmPackageConfigFromEnvironment` en page client | ❌ No (solo layout server) |
| Commit en esta pasada | ❌ No |

---

*Validación 12W-2b — Contrato participa en visibilidad ficha; verificación Vercel pendiente.*
