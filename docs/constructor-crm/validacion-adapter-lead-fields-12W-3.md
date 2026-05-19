# Validación Adapter Lead Fields 12W-3 — Constructor CRM Summer87

**Versión:** 12W-3 — adapter puro `lead_fields.groups[]` → estructura consumible por formularios  
**Base:** 12V-1 plan (`1cb64e2`), 12V-2 tipos/demo (`696bdf5`), 12W-1 loader (`6cba550`), 12W-2b ficha (`eb63540` / doc `93d16d9`)  
**Estado:** adapter creado y exportado; **sin consumo en UI**; build local **OK** (2026-05-19).

---

## 1. Resumen del cambio

Se añade un **adapter puro** que traduce `lead_fields.groups[]` del contrato `crm_package_config` en una configuración normalizada (`LeadFieldsAdapterConfig`) con grupos, lista global de campos y origen (`contract` | `legacy`).

| Qué | Detalle |
|-----|---------|
| Nuevo | `lib/crmPackage/adapters/leadFields.ts` |
| Barrel | `lib/crmPackage/index.ts` exporta funciones y tipos |
| UI | **No modificada** — `app/admin/leads/nuevo/page.tsx` intacto |
| Datos / infra | Sin SQL, Supabase, APIs ni middleware |

El próximo paso **12W-3b** conectará el formulario Nuevo Lead (y eventualmente ficha) con fallback-safe cuando `source === "legacy"`.

---

## 2. Relación con 12V-1, 12V-2, 12W-1 y 12W-2b

| Fase | Aporte para 12W-3 |
|------|-------------------|
| **12V-1** | Plan: `lead_fields` como sección del contrato operativo |
| **12V-2** | Tipos `CrmPackageLeadFields` / `CrmPackageLeadFieldGroup` + demo `pickup4x4CrmPackageConfig` |
| **12W-1** | Loader server-side con fallback legacy (`getActiveCrmPackageConfig`) |
| **12W-2 / 12W-2b** | Patrón adapter + wiring ficha (`packageToLeadDetailVisibility`); **12W-3 replica el patrón sin wiring** |

12W-3 **no reutiliza** el loader en el adapter; la conexión loader → adapter → provider será responsabilidad de 12W-3b (análogo a `leads/layout.tsx` en 12W-2b).

---

## 3. Estado actual de Nuevo Lead

`app/admin/leads/nuevo/page.tsx` sigue con **campos hardcodeados** del CRM base:

| Bloque UI | Campos (estado / payload) |
|-----------|---------------------------|
| Identidad / contacto | `nombre`, `contacto`, `telefono`, `email`, `origen` |
| Producto | `oferta` (textarea) |
| Pipeline | `pipeline` (select API o fallback fijo) |
| Seguimiento inicial | `next_activity_type`, `next_activity_at` |
| Comercial | `comercial_id` (obligatorio) |
| Datos operativos | `rubro_id`, `cantidad_personal`, `superficie_m2`, `direccion`, `visita_scheduled_at` (parte oculta en `client_crm`) |
| Notas | `notas` |

Ningún import de `@/lib/crmPackage` ni `packageToLeadFields` en esta pantalla.

---

## 4. Archivos creados / modificados

| Archivo | Cambio |
|---------|--------|
| `lib/crmPackage/adapters/leadFields.ts` | **Creado** — adapter + tipos + helpers |
| `lib/crmPackage/index.ts` | Export barrel |
| `docs/constructor-crm/validacion-adapter-lead-fields-12W-3.md` | Este documento |

**No modificado:** `app/admin/leads/nuevo/page.tsx`, ficha lead, layout leads, loader, configs demo (salvo lectura de referencia), dashboard, agenda, reportes, sidebar, APIs, `.env`.

---

## 5. Qué hace el adapter

| Función / tipo | Rol |
|----------------|-----|
| `packageToLeadFields(config)` | Entrada principal → `{ groups, allFields, source }` |
| `getLeadFieldGroups(config)` | Atajo: solo `groups` normalizados |
| `isLeadFieldEnabled(adapterConfig, fieldKey)` | Campo presente cuando `source === "contract"` |
| `hasLeadField(config, fieldKey)` | Atajo: `packageToLeadFields` + `isLeadFieldEnabled` |
| `KnownLeadFieldKey` | Union documental de claves Pickup; runtime acepta `string` vía `LeadFieldKey` |

**Normalización:**

- `group` y cada `field` con `trim`
- Ignorar grupos sin nombre o sin campos válidos
- Ignorar strings vacíos y no-string en arrays
- Dedupe de `fields` **dentro** del grupo (primer orden)
- Dedupe global en `allFields` (primer orden entre grupos)

**Origen:**

- `source: "contract"` si queda ≥1 grupo válido
- `source: "legacy"` si `config` es null/undefined, no hay `lead_fields.groups`, o ningún grupo válido tras normalizar

---

## 6. Qué NO hace todavía

- No renderiza inputs ni cambia labels en Nuevo Lead
- No mapea claves contrato → columnas Supabase / payload POST
- No sustituye pipeline API ni comerciales API
- No oculta campos legacy del formulario
- No importa loader, React ni código server-only
- No valida con Zod ni persiste configuración

---

## 7. Casos de fallback

| Condición | `groups` | `allFields` | `source` |
|-----------|----------|-------------|----------|
| `config === null` / `undefined` | `[]` | `[]` | `legacy` |
| Sin `lead_fields` o `groups` vacío | `[]` | `[]` | `legacy` |
| Grupos solo con nombres vacíos o fields vacíos | `[]` | `[]` | `legacy` |
| ≥1 grupo válido tras normalizar | normalizado | unión deduplicada | `contract` |

En **12W-3b**, la UI debe seguir mostrando el formulario legacy completo cuando `source === "legacy"` (`legacy_compatibility.fallback_strategy: legacy_first` en demo Pickup).

---

## 8. Resultado esperado para `pickup4x4CrmPackageConfig`

`packageToLeadFields(pickup4x4CrmPackageConfig)`:

| Campo | Valor esperado |
|-------|----------------|
| `source` | `"contract"` |
| `groups.length` | `4` |
| Grupos (orden) | Cliente (7), Vehículo (6), Oportunidad (7), Kore (5) |
| `allFields.length` | `25` (sin duplicados) |

Lista global `allFields` (orden de aparición):

`nombre`, `telefono`, `email`, `localidad`, `tipo_cliente`, `origen`, `estado_comercial`, `marca`, `modelo`, `año`, `matricula`, `tipo_uso`, `accesorios_interes`, `producto_servicio`, `presupuesto_estimado`, `vendedor_responsable`, `etapa`, `proxima_accion`, `fecha_limite`, `observaciones`, `kore_cliente_id`, `kore_documento_id`, `ultima_sincronizacion`, `fuente_dato`, `confianza_dato`

Helpers: `isLeadFieldEnabled(..., "nombre") === true`; con adapter legacy, cualquier campo → `false`.

---

## 9. Brecha entre campos contrato vs formulario actual

### 9.1 Campos en común (misma clave o equivalente directo)

| Contrato | Nuevo Lead hoy |
|----------|----------------|
| `nombre` | `nombre` |
| `telefono` | `telefono` |
| `email` | `email` |
| `origen` | `origen` |

### 9.2 Solapamiento semántico (claves distintas — requiere mapeo en 12W-3b+)

| Contrato | Formulario legacy | Nota |
|----------|-------------------|------|
| `producto_servicio` | `oferta` | Mismo rol UX, distinta clave payload |
| `observaciones` | `notas` | Mismo rol, distinta clave |
| `etapa` | `pipeline` | Formulario usa nombres de etapa API, no `key` del contrato |
| `proxima_accion` | `next_activity_type` | Valores API (`whatsapp`, `call`, …) vs claves contrato |
| `fecha_limite` | `next_activity_at` | Semántica cercana a “próximo seguimiento” |
| `vendedor_responsable` | `comercial_id` | Formulario usa UUID comercial, no string libre |
| `localidad` | `direccion` | Parcial; no equivalente 1:1 |

### 9.3 Solo en contrato Pickup (sin UI en Nuevo Lead)

`localidad`, `tipo_cliente`, `estado_comercial`, todo el grupo **Vehículo**, `presupuesto_estimado`, grupo **Kore** completo.

### 9.4 Solo en formulario legacy (sin entrada en contrato)

`contacto`, `rubro_id`, `cantidad_personal`, `superficie_m2`, `visita_scheduled_at`, más los ya listados con clave distinta en §9.2.

### 9.5 Legacy que debe seguir en fallback (12W-3b)

Hasta conectar contrato, el formulario debe conservar **todos** los campos actuales y el payload POST existente. Los campos §9.4 no deben eliminarse sin migración de datos/API. Los §9.3 pueden exponerse progresivamente cuando exista mapeo payload y UX acordada.

---

## 10. Cómo se conectará en 12W-3b

Patrón previsto (análogo 12W-2b):

1. **Server** (`leads/layout.tsx` o layout dedicado a `/nuevo`): `getActiveCrmPackageConfigFromEnvironment()` → `packageToLeadFields(config)`.
2. **Contexto** extendido (p. ej. `LeadsClientCrmProvider`): pasar snapshot `leadFields` al árbol.
3. **Nuevo Lead (client):** si `source === "contract"`, usar `groups` para ordenar/seccionar o filtrar visibilidad; si `legacy`, formulario actual sin cambios.
4. **OR / fallback:** `legacy_first` — nunca quitar campos legacy del payload hasta mapeo explícito contrato → API.
5. **Mapeo clave:** tabla §9.2 en código o capa fina `leadFieldPayloadMap` (fuera de alcance 12W-3).

---

## 11. Build local

```bash
npm run build
```

| Resultado | Detalle |
|-----------|---------|
| **Exit code** | `0` |
| **TypeScript** | OK |
| **Next.js** | 16.0.11 — compilación y generación de rutas OK |
| **Warnings** | `baseline-browser-mapping` desactualizado; convención `middleware` deprecada (preexistentes, fuera de alcance) |

---

## 12. Riesgos / decisiones abiertas

| Tema | Riesgo / decisión |
|------|-------------------|
| Claves contrato vs columnas DB | POST actual no incluye `marca`, `kore_*`, etc.; conectar UI sin API rompería guardado |
| Pipeline | Contrato usa `etapa` (keys); formulario usa nombres de pipeline Supabase |
| Comercial | `vendedor_responsable` vs `comercial_id` |
| Kore | Campos read-only / integración; probablemente no en alta manual inicial |
| `client_crm` vs base | Ocultación parcial ya existe (`isClientCrmUi`); 12W-3b debe combinar con contrato sin regresión |
| Duplicados cross-grupo | Adapter dedupe global; UI debe definir si un campo puede aparecer en un solo grupo |

---

## 13. Confirmación de alcance

| Restricción | Cumplido |
|-------------|----------|
| Adapter puro, sin React / loader en adapter | Sí |
| Validado conceptualmente contra `pickup4x4CrmPackageConfig` | Sí (§8) |
| No conectar Nuevo Lead | Sí |
| Sin cambios visibles en Vercel por esta fase | Sí |
| Sin SQL / Supabase / datos / APIs / middleware / deps / Zod / commits | Sí |
| No tocar ficha salvo documentación | Sí |
| Ninguna pantalla `app/admin/**` importa `packageToLeadFields` | Verificar en §11 post-build (grep) |

**Próximo paso:** **12W-3b** — wiring + fallback-safe en `nuevo/page.tsx` (y documento de validación asociado).
