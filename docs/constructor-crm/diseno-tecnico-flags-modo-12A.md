# Diseño Técnico Flags de Modo 12A — Constructor CRM Summer87

**Versión:** Fase 12A (diseño técnico — documental)  
**Relacionado con:** `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md`, `docs/constructor-crm/politica-ocultamiento-constructor-clones-11Y.md`, `docs/constructor-crm/revision-setup-pipelines-11Z.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/estado-base-madre-post-limpieza-11W.md`

**Estado:** especificación de flags y puntos de integración. **No implementa** variables, guards, middleware ni cambios en menú/API.

---

## 2. Resumen ejecutivo

Este documento **traduce** las decisiones funcionales de **11X** (modos), **11Y** (ocultamiento en clones) y **11Z** (setup y pipelines) en un **diseño técnico de flags de modo** para futuras implementaciones en **summer87-leads-v3** y clones derivados.

Define nombres, semántica, defaults por modo, precedencia de seguridad, ubicación de configuración, archivos del repo potencialmente afectados, y plan **12B–12F**. **No existe hoy** un sistema `APP_MODE` unificado en runtime; esto es el contrato previo a codificarlo.

---

## 3. Objetivo técnico

El sistema debe poder responder de forma **determinística** en cada despliegue (madre, clon en prep, clon productivo):

| Pregunta | Respuesta vía flags |
|----------|---------------------|
| ¿Es fábrica Constructor o CRM cliente? | `APP_MODE` |
| ¿Se muestra menú/rutas Constructor? | `ENABLE_CONSTRUCTOR` + `SHOW_INTERNAL_MENUS` + RBAC |
| ¿Opera Instalador (paquetes)? | `ENABLE_INSTALLER` |
| ¿Hay curación BCR en UI? | `ENABLE_BCR` |
| ¿Qué módulos operativos ve el cliente? | `CLIENT_VISIBLE_MODULES` |
| ¿Quién puede bypass interno? | `INTERNAL_ADMIN_EMAILS` + roles |

**Modos objetivo:**

- `constructor_base` — summer87-leads-v3 (base madre).  
- `installation_prep` — clon en preparación Summer87.  
- `client_crm` — clon en producción para cliente final.

---

## 4. Flags conceptuales propuestos

Todos los nombres son **propuesta 12A**; pueden mapearse a `process.env` en servidor (Next.js) con prefijo `SUMMER87_` o sin prefijo según convención del repo.

### 4.1 `APP_MODE`

| Valor | Tipo |
|-------|------|
| `constructor_base` | enum string |
| `installation_prep` | enum string |
| `client_crm` | enum string |

**Obligatorio** en todo despliegue. Sin valor válido → tratar como **fail closed** (ver §7).

### 4.2 `ENABLE_CONSTRUCTOR`

| Valor | Semántica |
|-------|-----------|
| `true` | Rutas UI y APIs bajo `/admin/constructor-crm` y `/api/admin/constructor/*` **permitidas** sujeto a RBAC |
| `false` | Constructor **bloqueado** para todos salvo bypass documentado (§7) |

### 4.3 `ENABLE_INSTALLER`

| Valor | Semántica |
|-------|-----------|
| `true` | Paquetes, simulate, approve/reject, snapshots (subconjunto Instalador) |
| `false` | Sin operaciones de paquete instalable |

En la práctica suele ir acoplado a `ENABLE_CONSTRUCTOR`; puede separarse si en el futuro el Instalador vive fuera del árbol `constructor-crm`.

### 4.4 `ENABLE_BCR`

| Valor | Semántica |
|-------|-----------|
| `true` | UI futura de curación BCR / enlaces internos a fichas (Summer87) |
| `false` | Sin superficie BCR en app |

Hoy BCR es solo Markdown en repo; el flag prepara UI/persistencia F4.

### 4.5 `SHOW_INTERNAL_MENUS`

| Valor | Semántica |
|-------|-----------|
| `true` | Sidebar muestra ítems Constructor, paquetes, auditoría, etc. |
| `false` | Solo menú operativo + config acotada |

No sustituye bloqueo de ruta; acelera UX correcta.

### 4.6 `CLIENT_SLUG`

| Tipo | Ejemplo |
|------|---------|
| string opcional | `pickup4x4` |

Identidad técnica del clon (carpeta, Supabase branch, logs). No exponer al usuario final en UI salvo branding.

### 4.7 `CLIENT_NAME`

| Tipo | Ejemplo |
|------|---------|
| string opcional | `Pickup 4x4` |

Títulos, login branding, emails.

### 4.8 `CLIENT_VISIBLE_MODULES`

| Tipo | Ejemplo conceptual |
|------|-------------------|
| lista (JSON en env o array en código derivado) | `["leads","oportunidades","agenda","reportes"]` |

Filtra módulos **operativos** en `client_crm`. No incluye `constructor`, `installer`, `bcr`.

### 4.9 `INTERNAL_ADMIN_EMAILS`

| Tipo | Ejemplo |
|------|---------|
| lista emails allowlist | `daniel@summer87.com,...` |

Usuarios que pueden ver menús internos en `installation_prep` o override **muy acotado** en `client_crm` (solo soporte L3, no propietario cliente).

---

## 5. Semántica de `APP_MODE`

### 5.1 `constructor_base`

| Aspecto | Comportamiento esperado |
|---------|-------------------------|
| Despliegue | **summer87-leads-v3** (base madre) |
| Constructor | Visible para roles internos Summer87 |
| BCR | Accesible Summer87 (docs hoy; UI futura) |
| Instalador | Visible |
| CRM operativo | Puede existir para **pruebas internas** (leads, kanban, etc.) |
| Cliente final | No es el usuario principal de esta instancia |

### 5.2 `installation_prep`

| Aspecto | Comportamiento esperado |
|---------|-------------------------|
| Despliegue | Clon o entorno **pre-go-live** |
| Constructor | **Limitado** a Summer87 / instalador (`INTERNAL_ADMIN_EMAILS` + roles) |
| Cliente operativo | **No** debe operar negocio aún (sin leads productivos o banner prep) |
| Uso | Validar config, pipelines, paquete aplicado, permisos antes de entrega |
| Transición | → `client_crm` tras checklist go-live (11Y §15) |

### 5.3 `client_crm`

| Aspecto | Comportamiento esperado |
|---------|-------------------------|
| Despliegue | Clon **productivo** cliente |
| Constructor | **Oculto y bloqueado** (UI + API) |
| BCR | **Oculta** |
| Instalador | **Oculto** |
| Superficie | Solo **CRM operativo** + config acotada |
| Beneficio BCR | Solo vía **config ya aplicada**, no memoria editable |

---

## 6. Matriz recomendada de defaults

Valores por defecto al **arrancar** cada tipo de instancia (override solo con decisión documentada):

| APP_MODE | ENABLE_CONSTRUCTOR | ENABLE_INSTALLER | ENABLE_BCR | SHOW_INTERNAL_MENUS | Uso |
|----------|:------------------:|:----------------:|:----------:|:-------------------:|-----|
| `constructor_base` | **true** | **true** | **true** | **true** | Base madre Summer87 |
| `installation_prep` | **true*** | **true*** | false o true*** | **true*** | *Solo efectivo para internos (RBAC + allowlist) |
| `client_crm` | **false** | **false** | **false** | **false** | CRM cliente go-live |

**Notas `installation_prep`:**

- Flags en `true` no implican que el **propietario cliente** vea Constructor; RBAC + `INTERNAL_ADMIN_EMAILS` restringen.
- Alternativa conservadora: `ENABLE_BCR=false` en prep si BCR solo vive en madre.

**Ejemplo env conceptual (no crear archivo en 12A):**

```
APP_MODE=client_crm
ENABLE_CONSTRUCTOR=false
ENABLE_INSTALLER=false
ENABLE_BCR=false
SHOW_INTERNAL_MENUS=false
CLIENT_SLUG=pickup4x4
CLIENT_NAME=Pickup 4x4
```

---

## 7. Precedencia de seguridad

| Regla | Detalle |
|-------|---------|
| **1. `APP_MODE` manda** | Define techo de lo que la instancia puede exponer |
| **2. Flags solo restringen** | `ENABLE_*=false` puede cerrar aunque el rol sea amplio; `true` **no abre** más allá de `APP_MODE` |
| **3. `client_crm` + `ENABLE_CONSTRUCTOR=true`** | **No** debe mostrar Constructor al cliente; solo bypass si email ∈ `INTERNAL_ADMIN_EMAILS` **y** política explícita soporte |
| **4. Fail closed** | `APP_MODE` ausente, inválido o desconocido → `ENABLE_CONSTRUCTOR=false`, `SHOW_INTERNAL_MENUS=false`, bloqueo APIs constructor |
| **5. RBAC adicional** | Owner cliente ≠ superadmin Summer87 aunque flags mal copiados |
| **6. Sin bypass por service role en browser** | Claves servidor no exponen UI interna al cliente |

**Función conceptual (pseudocódigo, no implementar en 12A):**

```
effectiveConstructorAccess =
  APP_MODE !== 'client_crm'
  && ENABLE_CONSTRUCTOR
  && (userIsInternal || APP_MODE === 'constructor_base')
```

---

## 8. Ubicación futura de configuración

| Opción | Pros | Contras |
|--------|------|---------|
| **A. Variables de entorno** | Simple por despliegue; alineado Vercel/Docker; un `.env` por clon | Sin UI; error humano al copiar |
| **B. Tabla BD config** | Por instancia; editable sin redeploy | Requiere migración; riesgo si cliente lee tabla |
| **C. Archivo config por cliente** | Versionable en clon privado | Secretos no en repo |
| **D. Híbrido** | `APP_MODE` en env; módulos en BD | Más piezas |

### Recomendación 12A

| Fase | Enfoque |
|------|---------|
| **12B–12C (inicial)** | **Variables de entorno** leídas en servidor (`lib/config/appMode.ts` futuro) |
| **Posterior** | Tabla `instance_config` o extensión `crm_setup_config` **por clon**, no heredar fila madre en auditoría |
| **Secretos** | Solo en env / secret manager; **nunca** en Git |

**No tocar `.env.local` ni crear `.env.example` en 12A** (restricción de fase); **12F** puede documentar plantilla.

---

## 9. Archivos / rutas potencialmente afectados

Lista **conceptual** (existencia verificada en repo donde aplica; **sin modificar** en 12A):

| Área | Rutas / archivos |
|------|------------------|
| Edge / request | `middleware.ts` (futuro `proxy.ts` si migra Next 16) |
| Menú admin | `lib/admin/adminSidebarModules.ts` |
| Layout shell | `app/admin/layout.tsx`, `app/admin/AdminShell.tsx` |
| Constructor UI | `app/admin/constructor-crm/**` |
| Constructor API | `app/api/admin/constructor/**` |
| Acceso paquetes | `lib/admin/constructorInstallablePackageAccess.ts` |
| Configuración | `app/admin/configuracion/**` (filtrar tabs internos) |
| Leads operativo | `app/admin/leads/**`, `app/api/admin/leads/**` |
| Reportes | `app/admin/reportes/**` |
| Auth / roles | helpers de sesión, `app_users`, `roles` |
| Setup BD | consumidores de `crm_setup_config`, `/api/admin/constructor/setup` |
| Pipelines | `app/api/admin/leads/pipelines/**`, kanban |

**Nuevo módulo sugerido (futuro):** `lib/config/appMode.ts` — parseo env, validación enum, helpers `isClientCrm()`, `canAccessConstructor(user)`.

---

## 10. Control de menú

| Modo | Comportamiento menú |
|------|---------------------|
| `constructor_base` | Menú completo interno según rol |
| `installation_prep` | Menú interno solo usuarios internos; banner prep |
| `client_crm` | **Sin** ítems Constructor / paquetes / BCR; solo `CLIENT_VISIBLE_MODULES` |

**Implementación futura (12B):**

- Filtrar en `adminSidebarModules.ts` según `getAppMode()` + flags.
- Respetar `modulos-menu` / configuración existente pero **después** del filtro modo.
- **No confiar solo en menú** (11Y §12).

---

## 11. Control de rutas UI

| Regla | Detalle |
|-------|---------|
| Prefijo bloqueado en `client_crm` | `/admin/constructor-crm` y subrutas |
| Respuesta | **403** JSON/HTML o redirect a `/admin/dashboard` / `/admin/leads` |
| `installation_prep` | Permitir solo si sesión interna |
| `constructor_base` | Permitir según rol + flags |

**Puntos de enganche:**

- `middleware.ts` matcher para `/admin/constructor-crm/:path*`
- Layout server component en `app/admin/constructor-crm/layout.tsx` (futuro) con guard
- Evitar renderizar páginas pesadas si modo incorrecto (defensa en profundidad)

---

## 12. Control de APIs

| Patrón | Política |
|--------|----------|
| `/api/admin/constructor/*` | Bloquear en `client_crm` salvo bypass interno |
| Subrutas críticas | `installable-package/generate`, `drafts`, `approve`, `reject`, `simulate-preinstall`, `simulation-snapshots`, `meeting-decisions`, `setup` |
| Implementación | Guard al inicio de cada route handler o wrapper `withConstructorAccess()` |
| Service role | Uso solo servidor; **no** habilitar cliente vía anon key a rutas internas |

**Principio:** ocultar menú **no alcanza**; probar con `curl` / DevTools en 12D.

---

## 13. Control de BCR

| Capa | Política |
|------|----------|
| Repo `docs/constructor-crm/*` | No servido estáticamente al cliente |
| UI futura BCR | `ENABLE_BCR && APP_MODE !== 'client_crm'` |
| API futura `crm_industry_*` | Mismos guards |
| Cliente | Recibe **pipeline/campos ya decididos**, no edición de fichas semilla |

Pickup: ficha vive en madre; clon **no** expone editor BCR.

---

## 14. Control de configuración cliente

| Recurso | `constructor_base` | `installation_prep` | `client_crm` |
|---------|-------------------|---------------------|--------------|
| `crm_setup_config` | Visible Summer87 (wizard/auditoría) | Revisable internos | **No visible** |
| `leads_pipelines` | Catálogo editable referencia | Curar antes go-live | Solo etapas **activas** / subset |
| `CLIENT_VISIBLE_MODULES` | Ignorado o “all internal test” | Transición | **Autoritativo** para menú operativo |
| Tabs `/admin/configuracion` | Amplios | Internos | Usuarios, pipelines operativos, personalización acordada |

Alineado con **11Z**: no resetear setup en 12A; interpretar según modo en 12E.

---

## 15. Relación con roles

| Capa | Responsabilidad |
|------|-----------------|
| **APP_MODE** | Tipo de **instancia** (fábrica vs. cliente) |
| **RBAC** | Qué puede hacer el **usuario** dentro de la instancia |
| **Combinación** | `client_crm` + rol `owner` cliente → operativo, **nunca** Constructor |
| **Anti-patrón** | Dar rol superadmin Summer87 a propietario Pickup en clon productivo |

**Matriz conceptual:**

```
accesoConstructor = f(APP_MODE, ENABLE_CONSTRUCTOR, rol, INTERNAL_ADMIN_EMAILS)
```

---

## 16. Relación con Supabase / RLS

| Etapa | Enfoque |
|-------|---------|
| **12B–12D (inicial)** | Guards en **aplicación** Next.js (suficiente para piloto controlado) |
| **Futuro** | RLS por `tenant_id` / `client_slug`; tablas `installer_package_*` sin políticas para rol cliente |
| **Principio** | UI oculta ≠ seguridad definitiva; diseño deja **camino** a políticas BD |

No priorizar RLS avanzado en primera implementación de flags; **sí** documentar que anon key no debe leer drafts.

---

## 17. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Flags mal configurados en clon | Checklist 12F; validación al boot (log error si `client_crm` + constructor true) |
| Solo ocultar menú | Rutas + API guards (12C) |
| `APP_MODE` inválido | Fail closed §7 |
| Mismo usuario cliente y superadmin | Cuentas separadas; no compartir email |
| Copiar `.env` de madre a clon | Plantilla por modo en 12F |
| Endpoints expuestos | Tests 12D |
| BCR visible | `ENABLE_BCR=false` default en `client_crm` |
| `crm_setup_config` heredado en clon | 12E — fila propia o ignorar en cliente |

---

## 18. Validaciones futuras

Checklist para **12D** (sesión `client_crm`, usuario propietario simulado):

- [ ] Menú sin «Constructor CRM» ni «Paquetes».
- [ ] `GET /admin/constructor-crm` → bloqueo.
- [ ] `GET /admin/constructor-crm/paquetes` → bloqueo.
- [ ] `POST /api/admin/constructor/installable-package/drafts` → 403.
- [ ] `/admin/leads` carga (si módulo habilitado).
- [ ] `/admin/reportes` carga (si contratado).
- [ ] No hay enlaces a docs BCR en UI.
- [ ] Sesión interna Summer87 en mismo build con `APP_MODE=constructor_base` → Constructor visible.
- [ ] `npm run build` exitoso.
- [ ] Pickup clon: detalle operativo OK; sin payload JSON en respuestas cliente.

---

## 19. Plan de implementación futura

| Fase | Entregable | Dependencia |
|------|------------|-------------|
| **12B** | Menú filtrado por modo (`adminSidebarModules.ts` + config) | 12A |
| **12C** | Middleware/layout guards UI + wrapper API constructor | 12A, 12B parcial |
| **12D** | Validación manual checklist §18 | 12C |
| **12E** | Setup + pipelines según modo (11Z + flags) | 12A |
| **12F** | `.env.example` por modo, checklist clon, script validación env (opcional) | 12A |

**Orden:** 12A (este doc) → **12B** → **12C** → **12D**; **12E** en paralelo antes del primer clon Pickup; **12F** al documentar clonación.

---

## 20. Decisión actual

> **En 12A solo se diseña técnicamente el sistema de flags.**  
> No se implementan variables de entorno en runtime, guards, middleware, menú ni APIs.

| Ítem | Estado |
|------|--------|
| Contrato flags | Definido en este documento |
| Código | Sin cambios |
| `.env` / `.env.example` | Sin crear en 12A |

---

## 21. Confirmación de alcance (fase 12A)

- ✅ Diseño técnico de flags documentado
- ❌ No se modificó código funcional
- ❌ No se crearon archivos TypeScript
- ❌ No se tocó `.env.local` ni `.env.example`
- ❌ No se ejecutó SQL
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se crearon endpoints ni scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se afirma que `APP_MODE` ya exista en el producto

---

*Diseño 12A — Flags de modo. Base para implementación 12B (menú) y 12C (rutas/API).*
