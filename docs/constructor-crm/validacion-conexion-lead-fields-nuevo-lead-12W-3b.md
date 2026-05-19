# Validación Conexión Lead Fields Nuevo Lead 12W-3b — Constructor CRM Summer87

**Versión:** 12W-3b — wiring contrato `lead_fields` → Nuevo Lead (fallback-safe, sin cambio de guardado)  
**Base:** 12W-3 adapter (`aafb879`), patrón 12W-2b ficha (`eb63540`)  
**Estado:** build local **OK** (2026-05-19); validación visual Vercel **pendiente** (§10).

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

## 10. Checklist visual pendiente Vercel

Validar en deploy con commit 12W-3b:

- [ ] `/admin/leads/nuevo` carga sin error
- [ ] Formulario se ve **igual** que antes
- [ ] Campos actuales siguen visibles (nombre, contacto, pipeline, comercial, notas, …)
- [ ] **No** aparecen campos Vehículo / Kore nuevos
- [ ] Comercial obligatorio sigue funcionando
- [ ] Pipeline y seguimiento inicial intactos
- [ ] Guardar lead sigue redirigiendo a ficha
- [ ] Ficha lead no regresó (12W-2b intacto)
- [ ] Inspección DOM: `data-crm-package-lead-fields-source=contract` en demo Pickup
- [ ] Sin error visual en consola (muestreo)

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

**Dictamen técnico local:** GO wiring preparatorio. **Dictamen visual producto:** pendiente checklist §10 en Vercel.
