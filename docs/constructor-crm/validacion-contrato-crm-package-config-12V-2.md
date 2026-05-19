# Validación Contrato crm_package_config 12V-2 — Constructor CRM Summer87

**Versión:** 12V-2 — tipos TypeScript + contrato demo local Pickup 4x4 (Opción C)  
**Documento base:** `plan-contrato-constructor-crm-operativo-12V.md` (12V-1)  
**Fases UX previas:** 12U-1, 12U-2, 12U-3 (sin cambios en esta pasada)

**Estado:** tipos y config demo creados; build local **OK**; sin runtime ni pantallas consumiendo el contrato.

---

## 1. Resumen del cambio

Se introduce el **contrato tipado** `crm_package_config` v1 como capa de diseño para el puente Constructor → CRM operativo:

| Entregable | Ubicación |
|------------|-----------|
| Tipos y subtipos | `lib/crmPackage/types.ts` |
| Demo Pickup 4x4 local | `lib/crmPackage/configs/pickup4x4.config.ts` |
| Barrel export | `lib/crmPackage/index.ts` |
| Validación mínima de forma | `lib/crmPackage/validate.ts` |

**Zod:** no está en `package.json` → **no se instaló**. Validación con `validateCrmPackageConfigShape` (TypeScript + checks manuales). Zod recomendado en fase posterior (activación / 12W+).

---

## 2. Relación con 12V-1

| 12V-1 (plan) | 12V-2 (esta fase) |
|--------------|-------------------|
| Contrato documental YAML/ejemplo | `CrmPackageConfig` + `pickup4x4CrmPackageConfig` |
| Opción C: archivo TS local | `lib/crmPackage/configs/pickup4x4.config.ts` |
| Loader / adapters conceptual | **No implementados** |
| Sin SQL / sin runtime | **Mantiene** |

El preset `lib/admin/installablePackagePickup4x4Preset.ts` y `package_payload` en drafts **no se modificaron**. El contrato local es paralelo y alineado al ejemplo del plan, con keys de sidebar operativo (`dashboard_comercial`, `leads87`, …).

---

## 3. Archivos creados

| Archivo | Rol |
|---------|-----|
| `lib/crmPackage/types.ts` | `CrmPackageConfig` y subtipos exportados |
| `lib/crmPackage/configs/pickup4x4.config.ts` | `pickup4x4CrmPackageConfig` (`satisfies CrmPackageConfig`) |
| `lib/crmPackage/index.ts` | Re-export tipos, demo, validador |
| `lib/crmPackage/validate.ts` | `validateCrmPackageConfigShape` |
| `docs/constructor-crm/validacion-contrato-crm-package-config-12V-2.md` | Este documento |

**Archivos operativos:** ninguno modificado (`app/admin/leads`, `agenda`, `dashboard`, `reportes`, APIs, middleware).

---

## 4. Qué define el contrato

Secciones mínimas en `CrmPackageConfig`:

`version`, `contract_id`, `client`, `source`, `activation`, `modules`, `lead_fields`, `pipeline`, `activity_types`, `dashboards`, `reports`, `labels`, `visibility_rules`, `role_permissions`, `ai_rules`, `branding`, `integrations`, `data_policy`, `legacy_compatibility`, `validation`, `audit`.

Demo Pickup incluye: 4 módulos sidebar, 4 grupos de campos, 9 etapas pipeline, 5 activity types, 4 bloques dashboard, 7 reportes (1 disabled Kore), labels Cliente/lead-only, visibility 12U-1/2/3 equivalente, 5 roles, Kore read-only, `fallback_strategy: "legacy_first"`.

---

## 5. Qué NO hace todavía

| Ítem | Estado |
|------|--------|
| Loader `getActiveCrmPackageConfig` | ❌ No existe |
| Provider React / hook cliente | ❌ No |
| Adapters (`packageToSidebarModules`, …) | ❌ No |
| Pantallas leyendo el contrato | ❌ No |
| Cambio visible en demo Vercel | ❌ No |
| Persistencia Supabase del contrato | ❌ No |
| Sustitución de `package_payload` | ❌ No |

---

## 6. Por qué no hay SQL

El contrato v1 en 12V-2 es **archivo TS versionado en repo** (Opción C). La activación por instancia en BD (`crm_package_active`, etc.) queda para **12X** según plan 12V-1.

---

## 7. Por qué no hay runtime

12V-2 es **solo diseño tipado** para desbloquear 12W sin big-bang. Conectar runtime antes de adapters definidos repetiría el acoplamiento actual (`isClientCrmUi` disperso).

---

## 8. Cómo se usará en 12W

Orden sugerido (plan 12V-1):

1. **12W-1:** `getActiveCrmPackageConfig()` lee demo local por `CLIENT_SLUG` + fallback legacy.
2. **12W-2+:** adapters por superficie (ficha lead → nuevo lead → pipeline → agenda → dashboard → reportes).
3. Validar demo Pickup; luego evaluar mapeo desde `package_payload` / draft aprobado.

`pickup4x4CrmPackageConfig` será la referencia golden para tests de adapters.

---

## 9. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** |

---

## 10. Riesgos / decisiones abiertas

| Tema | Nota |
|------|------|
| Keys preset vs sidebar | `crm_modules_config` del preset usa keys distintas a `modules[]` operativo; adapter 12W debe tabla de equivalencias |
| `role_permissions` | Preset solo lista roles; contrato incluye `permissions[]` — normalizar al mapear draft |
| `ai_rules` | Preset: `rules_text[]`; contrato: flags + texto opcional |
| Zod | Recomendado al activar contratos desde UI/API; no bloqueante para 12V-2 |
| Import accidental | No importar `@/lib/crmPackage` desde `app/admin/**` hasta adapter listo |

---

## 11. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Pantallas operativas | ❌ No |
| Loader / adapters / runtime | ❌ No |
| `package_payload` / drafts | ❌ No tocado |
| Commit en esta pasada | ❌ No |
| Zod instalado | ❌ No (no estaba en proyecto) |

---

*Validación 12V-2 — Contrato tipado listo para 12W; demo local Pickup 4x4 en `lib/crmPackage/`.*
