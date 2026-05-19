# Validación Loader crm_package_config 12W-1 — Constructor CRM Summer87

**Versión:** 12W-1 — loader server-side con fallback legacy (sin UI)  
**Base:** `plan-contrato-constructor-crm-operativo-12V.md` (12V-1), `validacion-contrato-crm-package-config-12V-2.md` (12V-2)  
**Commit tipos/contrato:** `696bdf5` — Add typed CRM package config contract

**Estado:** loader implementado; build local **OK**; **ninguna pantalla** importa el loader.

---

## 1. Resumen del cambio

Se agrega el **puente técnico** para resolver el contrato activo en servidor, sin cambiar comportamiento visible:

| Entregable | Archivo |
|------------|---------|
| Loader explícito (opciones) | `getActiveCrmPackageConfig()` |
| Loader desde env | `getActiveCrmPackageConfigFromEnvironment()` |
| Barrel | `lib/crmPackage/index.ts` actualizado |

El loader devuelve `pickup4x4CrmPackageConfig` solo cuando `clientSlug === "pickup4x4"` y `appMode === "client_crm"` (si `appMode` se informa). En cualquier otro caso: `config: null`, `source: "none"` — **fallback legacy implícito** para quien llame en 12W-2.

---

## 2. Relación con 12V-1 y 12V-2

| Fase | Aporte |
|------|--------|
| **12V-1** | Opción C: contrato local TS; sin SQL; loader conceptual |
| **12V-2** | `CrmPackageConfig`, demo Pickup, `validateCrmPackageConfigShape` |
| **12W-1** | `getActiveCrmPackageConfig*` — **sin adapters ni pantallas** |

---

## 3. Archivos creados / modificados

| Archivo | Cambio |
|---------|--------|
| `lib/crmPackage/getActiveCrmPackageConfig.ts` | **Creado** |
| `lib/crmPackage/index.ts` | Export loader + tipos |
| `docs/constructor-crm/validacion-loader-crm-package-config-12W-1.md` | Este documento |

**Sin tocar:** `app/admin/**`, APIs, middleware, Supabase, `pickup4x4.config.ts` (salvo uso por import del loader).

---

## 4. Qué hace el loader

1. Recibe opciones explícitas (`appMode`, `clientSlug`, `enabled`) — testeable sin env.
2. Si `enabled === false` → sin contrato (`reason: "disabled"`).
3. Si `appMode` está definido y ≠ `client_crm` → sin contrato (`unsupported_app_mode`).
4. Si `clientSlug` ≠ `pickup4x4` → sin contrato (`no_matching_local_config`).
5. Si coincide Pickup + client_crm → valida con `validateCrmPackageConfigShape(pickup4x4CrmPackageConfig)`.
6. Válido → `ok: true`, `config`, `source: "local_demo_config"`.
7. Inválido → `ok: false`, `config: null`, `errors[]`, **sin throw**.

`getActiveCrmPackageConfigFromEnvironment()` usa `getAppModeSnapshot()` y `getClientSlug()` (`CLIENT_SLUG` / `SUMMER87_CLIENT_SLUG`). Si `client_crm` y no hay slug en env → fallback documentado `pickup4x4` (solo demo).

---

## 5. Qué NO hace el loader

| Ítem | Estado |
|------|--------|
| Leer Supabase / SQL | ❌ |
| `fetch` / request HTTP | ❌ |
| Leer archivos dinámicos (`fs`) | ❌ |
| Provider React / hook cliente | ❌ |
| Adapters (`packageTo*`) | ❌ |
| Cambiar sidebar, leads, agenda, dashboard | ❌ |
| Sustituir `isClientCrmUi` / parches 12U | ❌ |
| Zod | ❌ |

---

## 6. Casos de fallback (tabla)

| Condición | `ok` | `config` | `source` | `reason` |
|-----------|------|----------|----------|----------|
| `enabled === false` | true | null | none | `disabled` |
| `appMode` definido y ≠ `client_crm` | true | null | none | `unsupported_app_mode` |
| `clientSlug` ≠ `pickup4x4` | true | null | none | `no_matching_local_config` |
| Pickup + client_crm + validación OK | true | contrato | local_demo_config | — |
| Pickup + client_crm + validación falla | false | null | local_demo_config | `validation_failed` |

Quien consuma el loader en 12W-2 debe tratar `config === null` como **seguir con legacy** (`legacy_compatibility.fallback_strategy: "legacy_first"` en el contrato).

---

## 7. Por qué no hay SQL / Supabase

12V-1 reservó persistencia activa por instancia para **12X**. 12W-1 solo materializa la **resolución en memoria** del archivo TS versionado (Opción C).

---

## 8. Por qué no hay cambios visibles

Ningún componente en `app/admin/**` importa el loader (verificado en esta fase). El CRM operativo sigue igual que tras 12U-1/2/3.

---

## 9. Cómo se usará en 12W-2

1. **Server Components / route handlers** (futuro): `const { config } = getActiveCrmPackageConfigFromEnvironment()`.
2. Si `config` → primer adapter (p. ej. `packageToLeadDetailVisibility`) con fallback si sección ausente.
3. Provider React opcional en 12W-2+ solo cuando una superficie lo necesite en cliente.
4. Tests manuales sugeridos (sin framework):

```ts
// Casos esperados (referencia mental / REPL)
getActiveCrmPackageConfig({ clientSlug: "pickup4x4", appMode: "client_crm" });
// → ok true, config definido

getActiveCrmPackageConfig({ clientSlug: "otro", appMode: "client_crm" });
// → ok true, config null, reason no_matching_local_config

getActiveCrmPackageConfig({ enabled: false });
// → ok true, config null, reason disabled
```

---

## 10. Build local

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✅ **OK** |

---

## 11. Riesgos / decisiones abiertas

| Tema | Nota |
|------|------|
| Fallback slug en env | `getActiveCrmPackageConfigFromEnvironment` asume `pickup4x4` solo si `isClientCrm` y sin `CLIENT_SLUG` — acotar cuando haya segundo cliente |
| Múltiples configs locales | Hoy solo `pickup4x4.config.ts`; nuevos clientes = nuevo archivo + rama en loader |
| Validación | Shape mínima; Zod en activación futura |
| Import accidental UI | Revisar grep antes de cada PR 12W |

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| SQL / Supabase / datos | ❌ No |
| APIs / middleware | ❌ No |
| Pantallas consumiendo loader | ❌ No |
| Provider React | ❌ No |
| Adapters | ❌ No |
| Cambios visuales | ❌ No |
| Commit en esta pasada | ❌ No |
| Zod instalado | ❌ No |

---

*Validación 12W-1 — Loader listo; adapters y UI en 12W-2+.*
