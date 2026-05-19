# Validación Conexión Lead Fields Nuevo Lead 12W-3b — Constructor CRM Summer87

**Versión:** 12W-3b — wiring contrato `lead_fields` → Nuevo Lead (fallback-safe, sin cambio de guardado)  
**Base:** 12W-3 adapter (`aafb879`), patrón 12W-2b ficha (`eb63540`)  
**Commit funcional validado:** `c56259f` — Connect lead fields snapshot to new lead form  
**Estado:** build local **OK** + validación visual Vercel **OK** (2026-05-19); inspección DOM `data-*` **pendiente opcional**.

---

## Validación visual Vercel — 2026-05-19

| Campo | Valor |
|-------|--------|
| **Entorno** | Pickup 4x4 CRM demo — Vercel production (`pickup4x4-crm-demo.vercel.app`) |
| **Ruta** | `/admin/leads/nuevo` |
| **Commit validado** | `c56259f` |
| **Resultado** | **OK visual** |

Evidencia: capturas de pantalla del formulario Nuevo lead en deploy Vercel.

### Checks observados

| Criterio | Resultado |
|----------|-----------|
| Pantalla Nuevo lead carga | ✅ |
| Formulario se ve igual que antes | ✅ |
| Nombre | ✅ Visible |
| Contacto | ✅ Visible |
| Teléfono | ✅ Visible |
| Email | ✅ Visible |
| Origen | ✅ Visible |
| Producto / servicio consultado | ✅ Visible |
| Pipeline | ✅ Visible (etapas **legacy** — ver nota abajo) |
| Seguimiento inicial / Próxima acción | ✅ Visible (opciones **legacy** — ver nota abajo) |
| Fecha de próximo seguimiento | ✅ Visible |
| Comercial | ✅ Visible |
| Datos operativos del lead | ✅ Visible |
| Rubro | ✅ Visible (catálogo **legacy** — ver nota abajo) |
| Dirección | ✅ Visible |
| Fecha de revisión o seguimiento | ✅ Visible |
| Notas | ✅ Visible |
| Campos nuevos Vehículo (marca, modelo, matrícula, …) | ✅ **No** aparecen |
| Campos nuevos Kore | ✅ **No** aparecen |
| Sidebar (Summer87 Leads, Agenda, Reportes) | ✅ Sin cambio aparente |
| Error visual evidente | ✅ Ninguno en captura |
| Inspección DOM `data-crm-package-lead-fields-source` / `count` | ☐ No validado en captura (pendiente técnico opcional) |
| Guardar lead / redirección a ficha | ☐ No ejercido en esta pasada de capturas |
| Ficha lead (regresión 12W-2b) | ☐ Fuera de captura; sin evidencia nueva en esta validación |

### Notas de alcance (no son regresiones)

| Observación en captura | Interpretación |
|------------------------|----------------|
| Pipeline muestra etapas legacy | **Esperado.** 12W-3b **no** conecta `pipeline_config`; la fase de pipeline del contrato queda para una fase dedicada (`packageToPipeline` / wiring posterior). |
| Rubro muestra opciones legacy | **Esperado.** 12W-3b **no** oculta campos legacy ni sustituye catálogos; alineación rubros/catálogos → fase futura de campos o configuración operativa. |
| Próxima acción muestra opciones legacy | **Esperado.** 12W-3b **no** conecta `activity_types` del contrato; wiring de tipos de actividad → fase futura. |

### Dictamen visual

**12W-3b queda GO visual para Nuevo Lead:** la pantalla recibe el snapshot `leadFields` en código sin cambiar la UI ni el payload esperado en esta fase. Pipeline, rubros y próxima acción en modo legacy **no** cuentan como regresión frente al alcance acordado.

---

## 1. Resumen del cambio

Nuevo Lead **recibe** el snapshot `leadFields` calculado en server (`leads/layout.tsx`) vía contexto extendido, igual que `leadDetailVisibility` en 12W-2b.

| Capa | Rol |
|------|-----|
| `getActiveCrmPackageConfigFromEnvironment()` | Un solo `packageResult` en layout |
| `packageToLeadFields(config)` | Adapter → snapshot serializable |
| `LeadsClientCrmProvider` | Pasa `leadFields` al árbol `/admin/leads/*` |
| `useLeadFieldsConfig()` | Nuevo Lead (client) lee snapshot |
| `data-crm-package-lead-fields-*` | Atributos DOM para verificación sin texto visible |

**No** se modifican payload POST, APIs, campos visibles ni persistencia.

---

## 2. Relación con 12W-3

| 12W-3 | 12W-3b |
|-------|--------|
| Adapter puro `packageToLeadFields` | Primera **consumición** en UI (solo wiring) |
| Sin pantallas importando adapter | Layout server + contexto + hook en `nuevo/page.tsx` |
| Documento brecha contrato vs formulario | Este documento confirma que la brecha sigue vigente en guardado |

Próximo paso sugerido: **12W-3c / 12W-4** — visibilidad por campo, grupos UI o mapeo payload (con API acordada).

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/leads/LeadsClientCrmContext.tsx` | `LeadFieldsSnapshot`, `LEGACY_LEAD_FIELDS`, `useLeadFieldsConfig()` |
| `app/admin/leads/layout.tsx` | `packageToLeadFields` + prop al provider |
| `app/admin/leads/nuevo/page.tsx` | Hook + `data-*` en contenedor del formulario |
| `docs/constructor-crm/validacion-conexion-lead-fields-nuevo-lead-12W-3b.md` | Este documento |

**No modificado:** ficha `[id]/page.tsx`, APIs, `pickup4x4.config.ts`, adapter source, agenda, dashboard, reportes, sidebar, middleware, `.env`.

---

## 4. Qué consume ahora Nuevo Lead

- `const leadFields = useLeadFieldsConfig()` — grupos, `allFields`, `source`.
- Atributos en el wrapper del formulario:
  - `data-crm-package-lead-fields-source` → `"contract"` | `"legacy"`
  - `data-crm-package-lead-fields-count` → número de campos en contrato (0 en legacy)

El snapshot **no** filtra inputs ni altera validación `canSave` / `createLead`.

---

## 5. Qué NO cambia todavía

- Render de campos Vehículo / Kore / localidad / etc.
- Eliminación de campos legacy (`contacto`, `rubro_id`, `oferta`, …)
- Payload `LeadCreatePayload` y `POST /api/admin/leads`
- Mapeo clave contrato → columna DB
- Labels, secciones o agrupación visual por `lead_fields.groups`
- Comportamiento `isClientCrmUi` (ocultar personal / m²)

---

## 6. Fallback legacy

| Condición | `leadFields` en contexto |
|-----------|---------------------------|
| Loader sin contrato (`config: null`) | `source: legacy`, listas vacías |
| Adapter sin grupos válidos | Idem |
| Modo interno sin demo Pickup | Depende de env; si no hay contrato → legacy |
| Demo `client_crm` + Pickup activo | `source: contract`, 4 grupos, 25 `allFields` |

Con `source: legacy`, el formulario se comporta **igual** que antes de 12W-3b (mismos campos y POST).

---

## 7. Resultado esperado en `client_crm`

Con `pickup4x4CrmPackageConfig` activo (demo Vercel / env):

| Verificación | Esperado |
|--------------|----------|
| DOM `data-crm-package-lead-fields-source` | `contract` |
| DOM `data-crm-package-lead-fields-count` | `25` |
| UI visible | Idéntica a pre-12W-3b |
| POST al guardar | Mismo JSON legacy |

---

## 8. Resultado esperado en modo interno

| Verificación | Esperado |
|--------------|----------|
| Sin contrato en loader | `source: legacy`, `count: 0` |
| Formulario | Todos los campos legacy visibles (incl. personal, m² si aplica) |
| POST | Sin cambios |

---

## 9. Build local

```bash
npm run build
```

| Campo | Valor |
|-------|--------|
| Exit code | `0` |
| TypeScript | OK |
| Next.js | 16.0.11 — compilación OK |

---

## 10. Checklist visual Vercel

Validado en deploy `pickup4x4-crm-demo` — commit `c56259f` (2026-05-19). Detalle en sección **Validación visual Vercel**.

- [x] `/admin/leads/nuevo` carga sin error
- [x] Formulario se ve **igual** que antes
- [x] Campos actuales siguen visibles (nombre, contacto, teléfono, email, origen, producto/servicio, pipeline, seguimiento, comercial, rubro, dirección, fechas, notas)
- [x] **No** aparecen campos Vehículo / Kore nuevos
- [x] Comercial visible (obligatorio en UI; guardado no ejercido en captura)
- [x] Pipeline y seguimiento inicial intactos (valores legacy — esperado)
- [ ] Guardar lead sigue redirigiendo a ficha — no validado en captura
- [ ] Ficha lead no regresó (12W-2b intacto) — fuera de captura
- [ ] Inspección DOM: `data-crm-package-lead-fields-source=contract` y `count=25` en demo Pickup — **pendiente técnico opcional**
- [x] Sin error visual evidente en captura (consola no revisada)

---

## 11. Riesgos / decisiones abiertas

| Tema | Nota |
|------|------|
| Confusión “contrato activo” sin UI nueva | Esperado; documentar en QA |
| Próxima fase ocultar por contrato | Debe ser OR con legacy, nunca quitar campos del POST sin API |
| `isLeadFieldEnabled` en formulario | Reservado para 12W-3c; no usado en 12W-3b |
| Duplicar loader en otra ruta | Prohibido; solo `leads/layout.tsx` |

---

## 12. Confirmación de alcance

| Restricción | Cumplido |
|-------------|----------|
| Nuevo Lead recibe snapshot | Sí |
| Sin campos Vehículo/Kore en UI | Sí |
| Sin cambio payload / API / Supabase / datos | Sí |
| Sin cambio visual agresivo | Sí (solo `data-*`) |
| Loader una vez en layout | Sí |
| `nuevo/page.tsx` sin import loader | Sí |
| Sin commits en esta pasada | Según instrucción de sesión |

**Dictamen técnico local:** GO wiring preparatorio (`npm run build` OK).  
**Dictamen visual producto:** GO — validación Vercel 2026-05-19 (commit `c56259f`); Nuevo Lead recibe snapshot sin cambio de UI ni payload en esta fase. Pipeline / rubros / próxima acción legacy son comportamiento esperado, no regresión. Inspección DOM `data-*` opcional pendiente.
