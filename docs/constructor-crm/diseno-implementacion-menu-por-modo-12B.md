# Diseño Implementación Menú por Modo 12B — Constructor CRM Summer87

**Versión:** Fase 12B (diseño de implementación — documental)  
**Relacionado con:** `docs/constructor-crm/diseno-tecnico-flags-modo-12A.md`, `docs/constructor-crm/politica-ocultamiento-constructor-clones-11Y.md`, `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md`, `docs/constructor-crm/revision-setup-pipelines-11Z.md`

**Estado:** especificación de visibilidad del sidebar. **No implementa** helpers, filtros ni cambios en `adminSidebarModules.ts` en esta fase.

---

## 2. Resumen ejecutivo

Esta fase diseña cómo el **menú lateral del admin** (`AdminShell` + `lib/admin/adminSidebarModules.ts`) debe reaccionar a **`APP_MODE`** y flags de **12A**, **antes** de implementar guards de rutas (12C) o bloqueo de APIs (12E).

El menú es la **primera capa de UX** para separar fábrica Constructor y CRM operativo; **no** es la única barrera de seguridad (11Y, 12C).

---

## 3. Objetivo técnico

El menú debe:

| Requisito | Detalle |
|-----------|---------|
| Mostrar Constructor | En `constructor_base` para roles internos |
| Constructor en prep | En `installation_prep` **solo** para internos / instalador (misma superficie que hoy Summer87) |
| Ocultar Constructor | En `client_crm` para usuarios cliente |
| Módulos operativos | Visibles según `CLIENT_VISIBLE_MODULES` + RBAC existente |
| Seguridad | **Nunca** usar el menú como única defensa; URL/API en 12C+ |

---

## 4. Archivos potencialmente afectados (futura implementación)

| Archivo / área | Rol en 12B-impl |
|----------------|-----------------|
| `lib/admin/adminSidebarModules.ts` | Defaults, `mergeAdminSidebarModules`, **nueva** categoría por módulo, `filterSidebarModulesByMode()` |
| `app/admin/AdminShell.tsx` | Aplicar filtro por modo **después** de merge portal + `filterNavByRole` |
| `lib/config/appMode.ts` *(futuro)* | `getAppMode()`, flags, fail closed |
| `app/api/admin/config/portal/route.ts` | No exponer claves internas en `client_crm` al persistir (revisión) |
| `app/admin/configuracion/modulos-menu` | UI que edita `sidebar_modules` — restringir en `client_crm` |
| `docs/constructor-crm/base-madre-duplicable.md` | Checklist clon + menú |
| `.env.example` *(futuro 12G)* | Documentar `APP_MODE` por despliegue |

**No se tocan en 12B:** `middleware.ts`, layouts de `constructor-crm`, route handlers API.

---

## 5. Estado actual esperado del menú

Según el código y comportamiento documentado hoy:

| Aspecto | Estado actual |
|---------|---------------|
| **Defaults código** | `DEFAULT_ADMIN_SIDEBAR_MODULES` lista módulos **operativos** (dashboard, leads87, entidades, socios, agenda, reportes, IA, mesa de ayuda, footer: neuroventas, personalización, configuración) |
| **Constructor en defaults** | **No** aparece como entrada en `DEFAULT_ADMIN_SIDEBAR_MODULES`; rutas existen en `app/admin/constructor-crm/*` y redirect `/admin/constructor` → `constructor-crm` (`next.config.ts`) |
| **Persistencia** | `portal_config.sidebar_modules` en Supabase puede **añadir o sobrescribir** claves vía merge |
| **Filtrado actual** | `HIDDEN_SIDEBAR_MODULE_KEYS`, `filterNavByRole` en `AdminShell`, estado `oculto` por módulo |
| **Base madre** | Aceptable que Summer87 acceda a Constructor por **URL directa** o futura entrada de menú / portal |
| **Clon `client_crm`** | **No aceptable** que aparezca Constructor en sidebar ni como destino obvio |

**Implicancia 12B:** además de filtrar, hay que **etiquetar** módulos y evitar que `portal_config` reintroduzca claves internas en clones cliente.

---

## 6. Modelo conceptual de categorías de menú

Cada ítem del sidebar (default o persistido) debe llevar **`menuCategory`** (campo futuro en código, no en 12B):

| Categoría | Descripción | Ejemplos de keys / rutas |
|-----------|-------------|---------------------------|
| `internal_constructor` | Árbol Constructor CRM | `constructor`, href `/admin/constructor-crm` |
| `internal_installer` | Paquetes / instalador (si menú separado) | `paquetes`, simulate |
| `internal_bcr` | Curación BCR (futuro) | `bcr`, conocimiento rubro |
| `operational_crm` | Operación diaria | `leads87`, `leads`, `socios`, `oportunidades`, `agenda` |
| `operational_reports` | Reportes del negocio | `reportes` |
| `operational_config` | Config operativa acotada | subconjunto `configuracion` |
| `support` | Ayuda / neuroventas | `mesa_ayuda`, `neuroventas` |
| `system_danger` | Reset, herramientas destructivas | `reset-db`, acciones críticas en config |

Módulos sin categoría explícita en primera iteración → inferir por `href` prefix o tratar como `operational_crm` con lista allowlist conservadora.

---

## 7. Reglas de visibilidad por `APP_MODE`

Leyenda: **Sí** = puede mostrarse si flags y rol lo permiten | **No** = no listar | **Int** = solo usuarios internos (RBAC + futuro allowlist)

| APP_MODE | internal_constructor | internal_installer | internal_bcr | operational_crm | operational_config | system_danger |
|----------|:--------------------:|:------------------:|:--------------:|:-----------------:|:------------------:|:-------------:|
| `constructor_base` | **Int** | **Int** | **Int** | **Sí** | **Sí** (amplio) | **Int** |
| `installation_prep` | **Int** | **Int** | No o **Int** | **Sí** (pruebas) | **Int** | **Int** |
| `client_crm` | **No** | **No** | **No** | **Sí** (filtrado `CLIENT_VISIBLE_MODULES`) | **Sí** (limitado) | **No** |

**Notas:**

- En `installation_prep`, módulos operativos pueden mostrarse para pruebas Summer87; banner «entorno preparación».
- En `client_crm`, **ninguna** categoría `internal_*` ni `system_danger`.

---

## 8. Reglas por flags específicos

Los flags **restringen**; no abren más allá de `APP_MODE` (12A §7).

| Flag | Efecto en menú |
|------|----------------|
| `ENABLE_CONSTRUCTOR=false` | Ocultar todo `internal_constructor` (y breadcrumbs «Constructor CRM» en nav si aplica) |
| `ENABLE_INSTALLER=false` | Ocultar `internal_installer` / entradas paquetes |
| `ENABLE_BCR=false` | Ocultar `internal_bcr` |
| `SHOW_INTERNAL_MENUS=false` | Ocultar **todas** las categorías `internal_*` de un golpe |
| `CLIENT_VISIBLE_MODULES` | Allowlist de `key` operativos en `client_crm` (ej. `leads87`, `agenda`, `reportes`) |
| `INTERNAL_ADMIN_EMAILS` | **No** usar en primera implementación de menú si no hay helper de usuario estable en servidor; preferir **rol admin Summer87** + `APP_MODE` hasta 12C |

**Orden de filtrado propuesto (pipeline):**

```
defaults → merge portal_config → filterHiddenKeys → filterByAppMode → filterByFlags → filterNavByRole → filterClientVisibleModules
```

---

## 9. Propuesta de helper futuro (no implementar en 12B)

Módulo sugerido: **`lib/config/appMode.ts`** (servidor; opcional re-export seguro para cliente solo de flags no secretos).

| Función | Responsabilidad |
|---------|-----------------|
| `getAppMode()` | Lee `APP_MODE`; inválido → fail closed (`client_crm` o modo seguro) |
| `isConstructorEnabled()` | `APP_MODE` + `ENABLE_CONSTRUCTOR` |
| `isInstallerEnabled()` | Idem instalador |
| `isBcrEnabled()` | BCR UI |
| `shouldShowInternalMenus()` | `SHOW_INTERNAL_MENUS` ∧ modo no `client_crm` |
| `getClientVisibleModules()` | Parse lista env; default mínimo si vacío en `client_crm` |
| `filterSidebarModules(modules, context)` | Aplica categorías + flags + allowlist |

**`context` conceptual:**

```ts
type SidebarFilterContext = {
  appMode: AppMode;
  enableConstructor: boolean;
  enableInstaller: boolean;
  enableBcr: boolean;
  showInternalMenus: boolean;
  clientVisibleModules: string[] | null;
  // userEmail?: string — fase posterior para INTERNAL_ADMIN_EMAILS
};
```

**Export para `AdminShell`:** llamar `filterSidebarModules` en servidor (RSC) o en API que alimente menú; evitar leak de flags sensibles al bundle cliente si no hace falta.

---

## 10. Reglas de fail closed

| Condición | Comportamiento menú |
|-----------|---------------------|
| `APP_MODE` ausente / inválido | Tratar como **`client_crm`** o modo seguro: **sin** internos |
| `ENABLE_*` ausente | En **desarrollo madre** documentado: defaults 12A; en **clon**: conservador (`false` para internos) |
| Duda en categoría de un módulo | **Ocultar** si `href` contiene `/constructor-crm` o `/admin/constructor` |
| `client_crm` | **Nunca** mostrar `reset-db` ni entradas `system_danger` |
| `portal_config` con key interna | Sanitizar al merge: strip keys `constructor`, `paquetes`, etc. si `client_crm` |

---

## 11. Menú Constructor a ocultar en `client_crm`

Ocultar ítems (por key, label o href) equivalentes a:

| Ítem menú | Ruta / área |
|-----------|-------------|
| Constructor CRM | `/admin/constructor-crm`, `/admin/constructor` |
| Paquetes instalables | `/admin/constructor-crm/paquetes` |
| Auditoría Constructor | `/admin/constructor-crm/auditoria` |
| Diagnóstico | `/admin/constructor-crm/diagnostico` |
| Cuestionario | `/admin/constructor-crm/cuestionario` |
| Documentos Constructor | `/admin/constructor-crm/documentos` |
| Motores IA internos | `/admin/constructor-crm/motores-ia` |
| Proceso pipeline Constructor | `/admin/constructor-crm/proceso-pipeline` |
| Reportes Constructor | `/admin/constructor-crm/reportes` (≠ `/admin/reportes`) |

Cualquier entrada persistida en `sidebar_modules` con `href` bajo `/admin/constructor-crm` debe eliminarse del merge en `client_crm`.

---

## 12. Menú operativo permitido en `client_crm`

Sujeto a `CLIENT_VISIBLE_MODULES` y RBAC (subset típico Pickup / PYME):

| Módulo | Keys / rutas conceptuales |
|--------|---------------------------|
| Leads | `leads87`, `/admin/leads`, `/admin/leads87` |
| Clientes / empresas | `socios`, `entidades`, `/admin/socios`, `/admin/empresas` |
| Oportunidades | `oportunidades` (si se habilita en portal; hoy puede estar en HIDDEN) |
| Agenda | `agenda` |
| Reportes operativos | `reportes` → `/admin/reportes` |
| Mesa de ayuda | `mesa_ayuda` |
| Configuración limitada | `configuracion` (footer) — ver §13 |
| Personalización | `personalizacion` si contrato lo incluye |
| Dashboard comercial | `dashboard_comercial` si se desea home cliente |

**Ocultar por defecto en cliente** salvo contrato: `ia` interna Summer87, `neuroventas` (evaluar), módulos «en_preparacion» no acordados.

---

## 13. Tratamiento de Configuración

`/admin/configuracion` concentra pestañas **internas y operativas** (usuarios, roles, pipelines, servicios, IA, módulos-menú, etc.).

| Modo | Política menú / config |
|------|------------------------|
| `constructor_base` | Configuración completa según rol admin |
| `installation_prep` | Summer87 ve tabs necesarios para prep |
| `client_crm` | Solo tabs **operational_config** allowlist (usuarios org, pipelines operativos, personalización); **ocultar** edición de `sidebar_modules` que reinyecte Constructor, IA global Summer87, reset |

**Subfase futura (no 12B):** `configTabsByAppMode.ts` o mapa en `app/admin/configuracion/layout.tsx`.

Marcar explícitamente: **roles**, **pipelines**, **servicios**, **IA interna**, **reset-db** — revisión en **12E** junto con 11Z.

---

## 14. Tratamiento de reset-db / system danger

| Regla | Detalle |
|-------|---------|
| `client_crm` | **Sin** entrada menú ni tab que lleve a reset masivo de BD |
| `constructor_base` | Solo rol **admin** Summer87; idealmente confirmación fuerte |
| Sidebar | No es suficiente; 12C/API debe rechazar endpoints destructivos |
| Categoría | `system_danger` siempre filtrada en `client_crm` |

---

## 15. Diferencia entre ocultamiento de menú y bloqueo real

| Capa | Fase | Responsabilidad |
|------|------|-----------------|
| **Menú** | **12B-impl** | UX correcta; menos confusión |
| **Rutas UI** | **12C / 12D** | 403 o redirect si URL directa `/admin/constructor-crm` |
| **APIs** | **12E** | 403 en `/api/admin/constructor/*` |

**Prueba obligatoria post-12B:** con menú limpio, abrir `/admin/constructor-crm/paquetes` en ventana privada — **debe fallar** tras 12C; en 12B solo se documenta que **aún puede cargar** hasta 12C.

---

## 16. Plan de implementación futura recomendado

| Paso | Acción |
|------|--------|
| 1 | Crear `lib/config/appMode.ts` (lectura env, tests unitarios de defaults) |
| 2 | Extender tipo `AdminSidebarModule` con `menuCategory?` + mapa href → categoría |
| 3 | Implementar `filterSidebarModules` sin cambiar defaults en madre (`APP_MODE` unset = comportamiento actual documentado) |
| 4 | Integrar en `AdminShell` después de merge portal |
| 5 | Validar `constructor_base` (o sin env): menú **igual** al actual para Daniel |
| 6 | Probar `APP_MODE=client_crm`: Constructor **ausente** |
| 7 | Documentar en `resultado-menu-12B.md` o anexo 12D |
| 8 | **Después:** middleware / layout guard (12C) y API (12E) |

---

## 17. Estrategia de implementación incremental

| Commit | Contenido | Riesgo |
|--------|-----------|--------|
| **1** | Solo `appMode.ts` + tests; sin cambio visible | Bajo |
| **2** | `menuCategory` en defaults + inferencia href; sin filtrar aún | Bajo |
| **3** | Filtro activo; default madre: `constructor_base` o flag «legacy» que no filtra internos | Medio — probar madre |
| **4** | Sanitizar merge `portal_config` en `client_crm` | Medio |
| **5** | Pruebas manuales + doc | Bajo |

**No mezclar** en el mismo commit: menú + middleware + API guards.

**Protección madre:** variable explícita `APP_MODE=constructor_base` en `.env` de summer87-leads-v3 antes de activar filtro estricto; o `LEGACY_SIDEBAR=true` temporal hasta validar.

---

## 18. Validaciones futuras

| # | Caso | Resultado esperado |
|---|------|-------------------|
| 1 | `APP_MODE=constructor_base` | Menú usable; mismos ítems operativos que hoy; Constructor accesible (URL o ítem si existe) |
| 2 | `APP_MODE=client_crm` | Sin ítems Constructor / paquetes / BCR |
| 3 | `APP_MODE=installation_prep` + interno | Constructor visible si `SHOW_INTERNAL_MENUS=true` |
| 4 | `APP_MODE=installation_prep` + rol cliente simulado | Sin internos |
| 5 | `/admin/leads` visible en `client_crm` si módulo en allowlist | Sí |
| 6 | URL `/admin/constructor-crm` con menú oculto | **No protegida** hasta 12C — documentar |
| 7 | `npm run build` | Exitoso |
| 8 | `portal_config` con key `constructor` en clone | Stripped tras sanitizar |

---

## 19. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Ocultar demasiado en madre | `APP_MODE=constructor_base` explícito; prueba regresión Daniel |
| Constructor visible en `client_crm` | Checklist §18 + sanitizar portal |
| Romper sidebar (array vacío) | Fallback mínimo: al menos dashboard o leads |
| `CLIENT_VISIBLE_MODULES` vacío | Default allowlist documentada en 12G |
| Mezclar rol con modo | Pipeline: modo primero, rol después |
| Confiar solo en menú | Recordatorio 12C/12E en PR template |

---

## 20. Próximas fases sugeridas

| Fase | Nombre | Entregable |
|------|--------|------------|
| **12B-impl** | Menú por modo | Código: `appMode.ts` + filtro sidebar |
| **12C** | Bloqueo rutas UI | Middleware / layout `constructor-crm` |
| **12D** | Bloqueo APIs internas | Wrapper route handlers |
| **12E** | Validación `client_crm` | Checklist 11Y + §18 |
| **12F** | Revisión setup/pipelines + menú config tabs | 11Z + §13 |
| **12G** | Checklist clon `.env.example` | `APP_MODE`, módulos visibles |

Secuencia: **12B-impl → 12C → 12D → 12E**; **12F** en paralelo antes del primer clon Pickup.

---

## 21. Decisión actual

> **En 12B solo se documenta el diseño de implementación del menú por modo.**  
> **No se toca código.**

| Ítem | Estado |
|------|--------|
| Categorías menú | Definidas conceptualmente |
| Helpers | Especificados, no creados |
| `adminSidebarModules.ts` | Sin cambios en 12B |

---

## 22. Confirmación de alcance (fase 12B documental)

- ✅ Diseño de implementación de menú documentado
- ❌ No se modificó código funcional
- ❌ No se crearon archivos TypeScript
- ❌ No se tocó `lib/admin/adminSidebarModules.ts`
- ❌ No se tocaron layouts ni middleware/proxy
- ❌ No se tocó `.env.local` ni `.env.example`
- ❌ No se ejecutó SQL
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se crearon endpoints ni scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta

---

*Diseño 12B — Menú por APP_MODE. Prerrequisito de implementación: 12A. Siguiente código: 12B-impl, luego 12C.*
