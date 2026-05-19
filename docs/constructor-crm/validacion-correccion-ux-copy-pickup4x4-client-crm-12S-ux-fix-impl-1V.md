# Validación Corrección UX/Copy Pickup 4x4 Client CRM 12S-ux-fix-impl-1V — Constructor CRM Summer87

**Versión:** 12S-ux-fix-impl-1 — implementación mínima  
**Plan origen:** `plan-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-plan.md`  
**Auditoría origen:** `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md`

**Estado validación documental:** build local OK; **validación visual final en Vercel OK para superficies Leads principales** (commit `4221ade`, §10).

---

## 1. Resumen de cambios

Se aplicó la corrección mínima **12S-ux-fix-impl-1** para que la demo `client_crm` Pickup 4x4 no muestre referencias **Casalimpia** ni narrativa **facility/limpieza** en superficies operativas principales.

| Estrategia | Detalle |
|------------|---------|
| **A — Copy global** | Renombres neutros en `leadFlow.ts`, nuevo lead, agenda |
| **B — Ocultar en client_crm** | Campos personal/superficie (nuevo lead); bloque relevamiento visita (ficha) |
| **Infra UI** | `LeadsClientCrmProvider` en `app/admin/leads/layout.tsx` (server → client) |

**No se modificó:** schema, APIs, datos, hardening 403, dashboard LEADS87 (fase 2).

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `app/admin/leads/LeadsClientCrmContext.tsx` | **Creado** — contexto `useLeadsClientCrmMode()` |
| `app/admin/leads/layout.tsx` | **Creado** — provee `isClientCrm` desde `getAppModeSnapshot()` |
| `app/admin/leads/nuevo/page.tsx` | Copy + ocultar personal/superficie en client_crm |
| `app/admin/leads/[id]/page.tsx` | Ocultar relevamiento en client_crm; parche copy (acordeón, proceso, producto) |
| `app/admin/leads/page.tsx` | Eliminar columna «Pipeline (DEBUG)» |
| `app/admin/agenda/page.tsx` | Subtítulo genérico actividades comerciales |
| `lib/leads/leadFlow.ts` | Labels, descripciones y `getLeadNextAction` neutros |
| `docs/constructor-crm/validacion-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-impl-1V.md` | Este documento |

**No modificado:** `lib/config/appMode.ts`, APIs, middleware, `.env.local`.

---

## 3. Qué se corrigió (UXFIX)

| ID | Cambio | Estado código |
|----|--------|---------------|
| UXFIX-01 | «Datos Casalimpia» → «Datos operativos del lead» | ✅ |
| UXFIX-02 | Helper genérico cotización/seguimiento | ✅ |
| UXFIX-03 | Ocultar Cantidad de personal + Superficie m² en `client_crm` | ✅ |
| UXFIX-04 | «Fecha de visita» → «Fecha de revisión o seguimiento» | ✅ |
| UXFIX-05 | «servicios de limpieza» → «productos o servicios a cotizar» | ✅ |
| UXFIX-06 | Visita→Revisión, Costeo→Cotización; CTAs neutros en flujo | ✅ |
| UXFIX-07 | Ocultar «Relevamiento de visita» (facility) en ficha `client_crm` | ✅ |
| UXFIX-08 | Agenda: leads y actividades comerciales | ✅ |
| UXFIX-09 | Columna Pipeline (DEBUG) eliminada | ✅ |
| UXFIX-10 | Dashboard LEADS87 | ⬜ Fase posterior (sin cambio) |
| UXFIX-11 | «Datos del prospecto» → «Datos del lead» (acordeón ficha + flujo) | ✅ |
| UXFIX-12 | Tabs Técnico/Consultor | ⬜ Fase posterior |

### Parche residual (post-validación Vercel)

| Ítem | Detalle | Estado |
|------|---------|--------|
| **Siguiente paso recomendado** — paso `datos` | Texto y checklist sin prospecto / superficie / visita (`NEXT_STEP_CONFIG` en `[id]/page.tsx`) | ✅ Código |
| **Siguiente paso recomendado** — paso `investigacion` | Copy de revisión/seguimiento (mismo objeto de config) | ✅ Código |
| Revalidación visual ficha Demo | Confirmar bloque en runtime Vercel | ✅ §10 |

### Parche final de copy residual

| Ítem | Detalle | Estado |
|------|---------|--------|
| Acordeón ficha | «Datos del prospecto» → **«Datos del lead»** (`[id]/page.tsx`) | ✅ Código |
| Producto / servicio | Helper «informada por el lead»; placeholder Pickup 4x4 (sin limpieza) | ✅ Código |
| Proceso comercial | Tooltip y subtítulo sin prospecto / visita / costeo | ✅ Código |
| «Después de esto sigue» (paso 1) | Sin relevamiento técnico / costeo; copy de cotización | ✅ Código |
| Informe evaluación (tab Consultor) | «prospecto» → «lead» en descripciones | ✅ Código |
| Actividades | «Reunión / visita» → «Reunión / seguimiento» | ✅ Código |
| Nuevo lead | Helper «contacto»; «Coordinar reunión»; label fecha sin «visita» | ✅ Código |
| IA — hint informe | «comunicación con el lead» | ✅ Código |

**Búsqueda final de términos visibles (client_crm):**

| Término | Resultado |
|---------|-----------|
| Casalimpia | No en código Leads UI |
| Pipeline DEBUG | Eliminado (lista) |
| Relevamiento de visita / Servicios especiales | Ocultos con `{!isClientCrmUi ? (…)}` (~L4506) |
| personal / superficie (nuevo lead) | Ocultos con `{!isClientCrmUi ? (…)}` |
| prospecto / limpieza / visita (ficha datos) | Corregidos en parche final |
| prospecto / visita / costeo (Siguiente paso) | Ya neutralizados (parche residual) |

**Pendiente fuera de alcance (no modificado):**

- Copy facility dentro del bloque «Relevamiento de visita» (solo visible en modo interno / `constructor_base`).
- Dashboard `CommercialFlowKpis` LEADS87 (UXFIX-10).
- Tabs Técnico / Consultor para rol comercial (UXFIX-12).
- Bloque «Datos de Iniciativa» en acordeón (fase 2).
- Variables/columnas BD (`visita_*`, `superficie_m2`, etc.) — sin cambio.

| Build | Resultado |
|-------|-----------|
| `npm run build` (parche final) | ✅ **OK** (§5) |

| Revalidación visual Vercel | ✅ OK — §10 (2026-05-18) |

---

## 4. Qué no se tocó

| Ítem | Nota |
|------|------|
| Columnas BD (`superficie_m2`, `visita_*`, etc.) | Intactas |
| Payload API al crear lead | Sigue enviando campos opcionales si existen en estado |
| Modo `constructor_base` / interno | Relevamiento visita **visible** si no es `client_crm` |
| Dashboard `CommercialFlowKpis` LEADS87 | Sin cambio |
| Reportes hub «próximamente» | Sin cambio |
| Marca Summer87 en shell | Sin cambio |
| Hardening 403 / APIs críticas | Sin cambio |
| Datos Demo en Supabase | Sin cambio |

---

## 5. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` (impl-1 inicial) | ✅ **OK** (Next.js 16, compilación y TypeScript sin error) |
| `npm run build` (parche residual) | ✅ **OK** |
| `npm run build` (parche final copy) | ✅ **OK** |

---

## 6. Checklist manual / Vercel

Entorno: `https://pickup4x4-crm-demo.vercel.app` (`APP_MODE=client_crm`).  
**Copy / UI — superficies Leads principales:** validadas en §10 (2026-05-18).

### Copy / UI

- [x] **Nuevo lead:** título «Datos operativos del lead» (no Casalimpia)
- [x] **Nuevo lead:** no aparecen personal ni superficie m²
- [x] **Nuevo lead:** label «Fecha de revisión o seguimiento» (sin «visita»)
- [x] **Ficha lead:** acordeón «Datos del lead» (no «Datos del prospecto»)
- [x] **Ficha lead:** no aparece bloque «Relevamiento de visita»
- [x] **Ficha lead:** producto/servicio sin mención de limpieza
- [x] **Lista leads:** sin columna «Pipeline (DEBUG)»; etapa sigue en badge del nombre
- [x] **Flujo lista/ficha:** sin «servicios de limpieza»; pasos Revisión / Cotización
- [x] **Ficha — Siguiente paso recomendado (paso datos):** sin prospecto, superficie ni visita
- [ ] **Agenda:** subtítulo «leads y actividades comerciales…» (no revalidado en esta pasada)
- [ ] **Ficha lead:** tooltip proceso comercial (no inspeccionado explícitamente en §10)

### Regresión funcional

- [x] 12 leads Demo visibles (lista §10)
- [ ] Búsqueda `demo` OK
- [ ] Agenda 8 actividades; crear actividad opcional
- [ ] Dashboard carga
- [ ] Reporte Comercial → Leads 12/12 + CSV
- [ ] Crear lead Demo de prueba (smoke)

### Seguridad (smoke recomendado post-deploy)

- [ ] Constructor / Configuración → 403
- [ ] APIs críticas 8/8 → 403
- [ ] `permissions/me` flags internas `false`

---

## 7. Confirmaciones de alcance

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo | ❌ No |
| Datos insertados/borrados | ❌ No |
| Migraciones | ❌ No |
| APIs modificadas | ❌ No |
| Commit desde Cursor | ❌ No |
| `CLIENT_SLUG` hardcodeado | ❌ No |

---

## 8. Dictamen

> **GO técnico de implementación** (build OK, alcance acotado al plan).  
> **GO visual** para superficies Leads principales en Vercel (`4221ade`, §10).  
> Demo comercial **pulida en nuevo lead / lista / ficha**; ítems de fase 2 y smoke extendido siguen pendientes (§10).

---

## 9. Próximo paso

1. ~~Desplegar a Vercel demo y completar checklist copy/UI Leads~~ ✅ §10.
2. Opcional: revalidar Agenda, tooltip proceso comercial y regresión funcional (§6).
3. Opcional: smoke 403 post-fix (seguridad).
4. Fase 2: UXFIX-10 (dashboard LEADS87), UXFIX-12 (tabs), bloque Datos de Iniciativa, white-label Pickup 4x4.

---

## 10. Validación visual final en Vercel

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-05-18 |
| **Entorno** | Vercel production — `pickup4x4-crm-demo` |
| **URL base** | https://pickup4x4-crm-demo.vercel.app |
| **Commit validado** | `4221ade` — *Polish residual client CRM lead copy* |
| **Estado deploy** | Ready / Current |

### Nuevo lead

**URL:** https://pickup4x4-crm-demo.vercel.app/admin/leads/nuevo

| Criterio | Resultado |
|----------|-----------|
| Título «Datos operativos del lead» visible | ✅ OK |
| «Datos Casalimpia» no aparece | ✅ OK |
| «Cantidad de personal» no aparece | ✅ OK |
| «Superficie m²» no aparece | ✅ OK |
| Helper usa «qué busca el contacto» | ✅ OK |
| Bloque operativo: necesidad, seguimiento, cotización (sin narrativa facility) | ✅ OK |
| Label «Fecha de revisión o seguimiento» | ✅ OK |
| «Coordinar visita» no visible en pantalla | ✅ OK |

### Lista leads

**URL:** https://pickup4x4-crm-demo.vercel.app/admin/leads

| Criterio | Resultado |
|----------|-----------|
| 12 leads Demo visibles | ✅ OK |
| Columna «Pipeline (DEBUG)» no aparece | ✅ OK |
| Badge «Etapa: Nuevo lead» visible | ✅ OK |
| Siguiente paso: «Completar datos operativos del lead» | ✅ OK |
| Sin errores visuales en pantalla | ✅ OK |

### Ficha lead

**URL:** https://pickup4x4-crm-demo.vercel.app/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df

| Criterio | Resultado |
|----------|-----------|
| Flujo: «Datos del lead» | ✅ OK |
| Flujo: «Revisión» y «Cotización» | ✅ OK |
| Siguiente paso: «información mínima del lead» | ✅ OK |
| Sin «prospecto», «superficie» ni «visita» en Siguiente paso | ✅ OK |
| Checklist: «Confirmar revisión o seguimiento si corresponde» | ✅ OK |
| Sin «servicios de limpieza» | ✅ OK |
| Sin bloque «Relevamiento de visita» | ✅ OK |
| Acordeón inferior: «Datos del lead» (no «Datos del prospecto») | ✅ OK |
| Producto/servicio sin mención de limpieza | ✅ OK |

### Dictamen visual

**OK** — Las superficies Leads principales (nuevo lead, lista, ficha Demo) cumplen el objetivo 12S-ux-fix-impl-1 en producción Vercel.

### Pendientes fuera de alcance

| Ítem | Nota |
|------|------|
| Dashboard LEADS87 | UXFIX-10 — fase posterior |
| Tabs Técnico / Consultor | UXFIX-12 — fase posterior |
| Bloque «Datos de Iniciativa» | Fase 2 — acordeón ficha |
| White-label Pickup 4x4 | Branding / personalización — no cubierto por este fix |
| Smoke 403 post-fix | Opcional — revalidar Constructor, APIs críticas, `permissions/me` |
| Agenda copy | No inspeccionada en esta pasada visual |
| Regresión: CSV, crear lead, dashboard | Checklist §6 — pendiente |

### Confirmación de esta validación (solo documental)

| Ítem | Estado |
|------|--------|
| SQL ejecutado | ❌ No |
| Supabase directo | ❌ No |
| Datos modificados | ❌ No |
| Nuevas migraciones | ❌ No |
| APIs modificadas | ❌ No |
| Código funcional modificado en esta pasada | ❌ No — solo este `.md` |

---

*12S-ux-fix-impl-1V — registro post-implementación y validación visual Vercel 2026-05-18.*
