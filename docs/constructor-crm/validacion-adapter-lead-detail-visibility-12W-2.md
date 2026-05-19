# Validación Adapter Lead Detail Visibility 12W-2 — Constructor CRM Summer87

**Versión:** 12W-2 — primer adapter (`visibility_rules.lead_detail`)  
**Base:** 12V-1 plan, 12V-2 tipos/demo, 12W-1 loader (`6cba550`)  
**UX vigente:** 12U-1 (Iniciativa), 12U-2 (Técnico/Consultor + CTAs) — **sin cambios en esta fase**

**Estado:** adapter implementado; build **OK**; **ninguna pantalla** lo consume; ficha **no modificada**.

---

## 1. Resumen del cambio

Se agrega la primera capa reusable que traduce el contrato en reglas de visibilidad para la ficha de lead:

| Función | Rol |
|---------|-----|
| `packageToLeadDetailVisibility(config)` | `CrmPackageConfig` → `hiddenTabs` / `hiddenBlocks` |
| `isLeadDetailTabHidden(visibility, tabId)` | Consulta tab |
| `isLeadDetailBlockHidden(visibility, blockId)` | Consulta bloque |

Arrays (no `Set`) para tests y serialización futura.

---

## 2. Relación con 12V-1, 12V-2 y 12W-1

| Fase | Aporte |
|------|--------|
| **12V-1** | `visibility_rules.lead_detail` en contrato documental |
| **12V-2** | `pickup4x4CrmPackageConfig.visibility_rules` tipado |
| **12W-1** | `getActiveCrmPackageConfig()` — cadena futura: loader → adapter |
| **12W-2** | `packageToLeadDetailVisibility()` — **solo adapter, sin wiring UI** |

---

## 3. Relación con 12U-1 y 12U-2

| 12U | Comportamiento hoy en ficha | Equivalente en contrato Pickup |
|-----|-----------------------------|--------------------------------|
| **12U-1** | `!isClientCrmUi` oculta Iniciativa | `hide_blocks` incluye `iniciativa_link` |
| **12U-2** | `visibleTabs` filtra `tecnico`, `consultor`; CTAs Consultor ocultos | `hide_tabs: ["tecnico","consultor"]`; bloques consultivos en `hide_blocks` |

El adapter **no reemplaza** `isClientCrmUi` ni condiciones 12U en esta fase. Al conectar (12W-2b), la regla será: **contrato OR legacy** hasta retirar duplicación, sin cambiar resultado visual validado.

---

## 4. Archivos creados / modificados

| Archivo | Cambio |
|---------|--------|
| `lib/crmPackage/adapters/leadDetailVisibility.ts` | **Creado** |
| `lib/crmPackage/index.ts` | Export adapter |
| `docs/constructor-crm/validacion-adapter-lead-detail-visibility-12W-2.md` | Este documento |

**No modificado:** `app/admin/leads/[id]/page.tsx`, loader, config demo, APIs.

---

## 5. Qué hace el adapter

1. Recibe `CrmPackageConfig | null | undefined`.
2. Lee `visibility_rules.lead_detail.hide_tabs` y `hide_blocks`.
3. Normaliza: `trim`, omite vacíos, dedupe, conserva orden.
4. Si hay al menos un id → `source: "contract"`.
5. Si `config` ausente o `lead_detail` vacío → `source: "legacy"`, listas vacías.

---

## 6. Qué NO hace todavía

| Ítem | Estado |
|------|--------|
| Import en ficha lead | ❌ |
| Provider React / hook cliente | ❌ |
| Sustituir `isClientCrmUi` | ❌ |
| Eliminar condiciones 12U | ❌ |
| Sidebar (`visibility_rules.sidebar`) | ❌ (adapter aparte futuro) |
| Dashboard / agenda / reportes | ❌ |
| Cambio visible en demo Vercel | ❌ |

---

## 7. Casos de fallback

| Entrada | `hiddenTabs` | `hiddenBlocks` | `source` |
|---------|--------------|----------------|----------|
| `null` / `undefined` | `[]` | `[]` | `legacy` |
| `visibility_rules` sin `lead_detail` | `[]` | `[]` | `legacy` |
| `lead_detail` con arrays vacíos | `[]` | `[]` | `legacy` |
| Pickup demo con reglas | ver §8 | ver §8 | `contract` |

---

## 8. Resultado esperado — `pickup4x4CrmPackageConfig`

Con loader + contrato activo:

```ts
const { config } = getActiveCrmPackageConfig({
  clientSlug: "pickup4x4",
  appMode: "client_crm",
});
const v = packageToLeadDetailVisibility(config);
```

| Campo | Valor esperado |
|-------|----------------|
| `source` | `"contract"` |
| `hiddenTabs` | `["tecnico", "consultor"]` |
| `hiddenBlocks` | `["iniciativa_link", "relevamiento_visita", "servicios_especiales", "next_step_easy"]` |
| `isLeadDetailTabHidden(v, "tecnico")` | `true` |
| `isLeadDetailTabHidden(v, "datos")` | `false` |
| `isLeadDetailBlockHidden(v, "iniciativa_link")` | `true` |

Duplicados en contrato futuro se colapsan (ej. `["tecnico","tecnico"]` → `["tecnico"]`).

---

## 9. Cómo se conectará en 12W-2b / 12W-3

**12W-2b (ficha lead, server o layout):**

```ts
// Pseudocódigo — no implementado aún
const pkg = getActiveCrmPackageConfigFromEnvironment();
const leadVisibility = packageToLeadDetailVisibility(pkg.config);

// Fallback-safe: OR con isClientCrmUi hasta retirar 12U
const hideTab = (id: string) =>
  isClientCrmUi
    ? isLeadDetailTabHidden(leadVisibility, id) || /* reglas 12U existentes */
    : false;
```

**12W-3+:** otros adapters (`packageToSidebarModules`, pipeline, …).

---

## 10. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** |

---

## 11. Riesgos / decisiones abiertas

| Tema | Nota |
|------|------|
| Doble fuente de verdad | Contrato + `isClientCrmUi` hasta migración; conectar con OR explícito |
| IDs de bloques | Deben alinearse con `data-block-id` o flags en ficha al cablear |
| CTAs Consultor | 12U-2 no está en `hide_blocks`; seguir condiciones actuales hasta adapter de CTAs |
| Solo server | Adapter es puro TS; ficha es client — pasar snapshot serializable en layout |

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Ficha lead modificada | ❌ No |
| Cambios visibles | ❌ No |
| Pantallas consumiendo adapter | ❌ No |
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Provider React | ❌ No |
| Commit en esta pasada | ❌ No |
| Comportamiento 12U | ✅ Vigente (código sin tocar) |

---

*Validación 12W-2 — Adapter listo; wiring ficha en 12W-2b.*
