# Validación Corrección UX/Copy Pickup 4x4 Client CRM 12S-ux-fix-impl-1V — Constructor CRM Summer87

**Versión:** 12S-ux-fix-impl-1 — implementación mínima  
**Plan origen:** `plan-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-plan.md`  
**Auditoría origen:** `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md`

**Estado validación documental:** build local OK tras parche final de copy; **revalidación visual final en Vercel pendiente** (checklist §6).

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
| UXFIX-04 | «Fecha de visita» → «Fecha de revisión / visita» | ✅ |
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
| Revalidación visual ficha Demo | Confirmar bloque en runtime Vercel | ⬜ Pendiente |

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

| Revalidación visual Vercel | ⬜ Pendiente post-deploy |

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

## 6. Validaciones pendientes (manual / Vercel)

Ejecutar con `APP_MODE=client_crm` en `https://pickup4x4-crm-demo.vercel.app` (o local equivalente):

### Copy / UI

- [ ] **Nuevo lead:** título «Datos operativos del lead» (no Casalimpia)
- [ ] **Nuevo lead:** no aparecen personal ni superficie m²
- [ ] **Nuevo lead:** label «Fecha de revisión o seguimiento» (sin «visita»)
- [ ] **Ficha lead:** acordeón «Datos del lead» (no «Datos del prospecto»)
- [ ] **Ficha lead:** no aparece bloque «Relevamiento de visita»
- [ ] **Ficha lead:** placeholder producto Pickup 4x4; sin «limpieza» en helper
- [ ] **Ficha lead:** tooltip proceso comercial sin prospecto/visita/costeo
- [ ] **Lista leads:** sin columna «Pipeline (DEBUG)»; etapa sigue en badge del nombre
- [ ] **Flujo lista/ficha:** sin texto «servicios de limpieza»; pasos Revisión / Cotización si aplica
- [ ] **Ficha — Siguiente paso recomendado (paso datos):** sin prospecto, superficie ni visita en descripción/checklist
- [ ] **Agenda:** subtítulo «leads y actividades comerciales…»

### Regresión funcional

- [ ] 12 leads Demo visibles; búsqueda `demo` OK
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

## 8. Dictamen preliminar

> **GO técnico de implementación** (build OK, alcance acotado al plan).  
> **Validación visual en demo** pendiente antes de declarar demo comercial pulida.

---

## 9. Próximo paso

1. Desplegar a Vercel demo (si aplica) y completar checklist §6.
2. Actualizar este documento con fecha y resultado visual.
3. Opcional fase 2: UXFIX-10 (dashboard LEADS87), tabs consultoría, simplificar progreso %.

---

*12S-ux-fix-impl-1V — registro post-implementación. Completar checklist §6 tras revisión en entorno client_crm.*
