# Checklist ENV Clon Client CRM 12G — Constructor CRM Summer87

**Versión:** Fase 12G (checklist documental — configuración de despliegue)  
**Relacionado con:** `docs/constructor-crm/diseno-tecnico-flags-modo-12A.md`, `docs/constructor-crm/diseno-implementacion-menu-por-modo-12B.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `docs/constructor-crm/validacion-apis-constructor-bloqueadas-12F.md`, `lib/config/appMode.ts`

**Estado:** guía para futuros clones **client_crm**. No describe un clon productivo ya entregado ni valores reales de secretos.

---

## 2. Resumen ejecutivo

Este documento define qué **variables de entorno** y decisiones de configuración conceptual debe llevar un **clon cliente** para operar como **CRM operativo**, ocultando **Constructor**, **Instalador (paquetes)** y **BCR**, con menú acotado por contrato.

La implementación en código ya cubre:

- Filtrado de sidebar por `APP_MODE` y `CLIENT_VISIBLE_MODULES`
- Bloqueo UI de `/admin/constructor-crm/*` en `client_crm`
- Bloqueo API de `/api/admin/constructor/*` en `client_crm`

**12G** convierte las validaciones **12D** y **12F** en checklist repetible para despliegue, **sin** crear ni modificar archivos `.env` en el repositorio.

---

## 3. Principio principal

> **La base madre usa `constructor_base`; el clon cliente usa `client_crm`.**

| Instancia | Rol |
|-----------|-----|
| **summer87-leads-v3** (base madre) | Fábrica Constructor + CRM operativo Summer87 |
| **Clon cliente** (ej. futuro Pickup 4x4 CRM) | Solo superficie operativa acordada; sin fábrica |

Modo intermedio **`installation_prep`**: preparación interna Summer87 antes de entrega al cliente (§7).

---

## 4. Variables principales

Todas las variables admiten alias con prefijo `SUMMER87_` (ej. `SUMMER87_APP_MODE`) según `lib/config/appMode.ts`. En tablas se usa el nombre corto.

| Variable | Base madre (recomendado) | Clon cliente (recomendado) | Obligatoria en clon | Nota |
|----------|--------------------------|----------------------------|:-------------------:|------|
| `APP_MODE` | `constructor_base` | `client_crm` | **Sí** | Sin valor en madre → default `constructor_base` |
| `CLIENT_SLUG` | Opcional / vacío | `pickup4x4` (ejemplo) | Recomendada | Identidad técnica del clon; no exponer en UI salvo branding |
| `CLIENT_NAME` | Opcional / vacío | `Pickup 4x4` (ejemplo) | Recomendada | Títulos, login, emails |
| `CLIENT_VISIBLE_MODULES` | Vacío (sin filtro) | `leads87,agenda,reportes` (ejemplo) | **Recomendada en go-live** | Allowlist por `key` del sidebar (§8) |
| `ENABLE_CONSTRUCTOR` | `true` (default por modo) | `false` | Implícita en `client_crm` | Compuestas fuerzan `false` en `client_crm` |
| `ENABLE_INSTALLER` | `true` | `false` | Implícita | Paquetes instalables |
| `ENABLE_BCR` | `true` | `false` | Implícita | Curación BCR (futuro UI) |
| `SHOW_INTERNAL_MENUS` | `true` | `false` | Implícita | Menús internos en sidebar |
| `INTERNAL_ADMIN_EMAILS` | Lista Summer87 (opcional) | Vacío o soporte L3 acotado | No | Bypass muy limitado; pendiente 12I |

---

## 5. Configuración recomendada para base madre

Bloque **conceptual** (no copiar secretos al repo):

```env
APP_MODE=constructor_base
ENABLE_CONSTRUCTOR=true
ENABLE_INSTALLER=true
ENABLE_BCR=true
SHOW_INTERNAL_MENUS=true
```

**Compatibilidad:** si `APP_MODE` **no existe**, `getAppMode()` en `lib/config/appMode.ts` asume **`constructor_base`**. La base madre actual puede seguir sin definir la variable hasta que se quiera hacer explícito el modo.

`CLIENT_VISIBLE_MODULES` vacío → no restringe módulos operativos en sidebar.

---

## 6. Configuración recomendada para clon cliente

Bloque **conceptual** (Pickup como ejemplo; cada cliente define sus valores):

```env
APP_MODE=client_crm
CLIENT_SLUG=pickup4x4
CLIENT_NAME=Pickup 4x4
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
ENABLE_CONSTRUCTOR=false
ENABLE_INSTALLER=false
ENABLE_BCR=false
SHOW_INTERNAL_MENUS=false
```

**Importante:** en `client_crm`, las funciones compuestas (`isConstructorEnabled`, etc.) **siempre** devuelven `false` para superficies internas aunque un flag diga `true`. Aun así, declarar flags en `false` evita confusión operativa y documenta intención.

---

## 7. Configuración installation_prep

Bloque **conceptual** para entorno de **preparación Summer87** (no entrega al cliente final):

```env
APP_MODE=installation_prep
CLIENT_SLUG=pickup4x4
CLIENT_NAME=Pickup 4x4
ENABLE_CONSTRUCTOR=true
ENABLE_INSTALLER=true
ENABLE_BCR=false
SHOW_INTERNAL_MENUS=true
```

| Aspecto | Detalle |
|---------|---------|
| **Uso** | Clon temporal mientras Summer87 configura pipelines, datos semilla controlados, pruebas |
| **No es** | Modo de producción para el propietario del negocio |
| **Antes de go-live** | Pasar a `APP_MODE=client_crm` y revisar `CLIENT_VISIBLE_MODULES` (§11) |

---

## 8. CLIENT_VISIBLE_MODULES

### Semántica

- **Allowlist** por `key` de `DEFAULT_ADMIN_SIDEBAR_MODULES` / merge `portal_config.sidebar_modules`.
- Solo aplica en **`client_crm`** a categorías operativas y **support** (`operational_crm`, `operational_reports`, `operational_config`, `support`).
- Si está **vacío** en `client_crm`, el filtro **deja pasar** todos los módulos operativos/support del default (comportamiento validado en 12D — no recomendado para go-live).

### Keys válidas de referencia (sidebar actual)

| Key | Label típico | Categoría |
|-----|--------------|-----------|
| `dashboard_comercial` | Dashboard | operational_crm |
| `leads87` | Summer87 Leads | operational_crm |
| `entidades` | Iniciativas | operational_crm |
| `socios` | Clientes | operational_crm |
| `agenda` | Agenda | operational_crm |
| `reportes` | Reportes | operational_reports |
| `ia` | IA | operational_config |
| `mesa_ayuda` | Mesa de ayuda | support |
| `neuroventas` | Manual de neuroventas | support |
| `personalizacion` | Personalización | operational_config |
| `configuracion` | Configuración | operational_config |

### No incluir en allowlist

- Cualquier key/href de **Constructor** (`constructor`, rutas `/admin/constructor-crm`)
- **Instalador** / paquetes
- **BCR** / conocimiento rubro
- **reset-db** / `system_danger`

---

## 9. Ejemplos por tipo de cliente

Ejemplos **conceptuales**; el contrato comercial define el set final.

### Pickup 4x4 (PYME comercial acotada)

```env
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
```

### Agencia / consultoría

```env
CLIENT_VISIBLE_MODULES=leads87,socios,agenda,reportes,mesa_ayuda
```

### CRM comercial simple

```env
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
```

### Operación con mesa de ayuda

```env
CLIENT_VISIBLE_MODULES=socios,mesa_ayuda,reportes
```

---

## 10. Qué no debe estar activo en client_crm

En el clon **entregado al cliente**, no debe figurar (ni confiar solo en defaults):

| Configuración / superficie | Motivo |
|----------------------------|--------|
| `APP_MODE=constructor_base` | Expone fábrica |
| `ENABLE_CONSTRUCTOR=true` | Confusión; APIs/UI deben quedar bloqueadas |
| `ENABLE_INSTALLER=true` | Paquetes instalables |
| `ENABLE_BCR=true` | Curación interna |
| `SHOW_INTERNAL_MENUS=true` | Menú interno |
| Service role / secrets en cliente o frontend | Solo server-side en hosting |
| **reset-db** visible o accesible | `system_danger` — 12H |
| Endpoints internos sin guard de modo | Cubierto en código para `/api/admin/constructor/*`; revisar otros prefijos |
| BCR visible en UI o docs operativos del cliente | Solo Markdown/repo Summer87 hasta decisión producto |

---

## 11. Validaciones antes de entregar un clon cliente

Checklist manual (repetir tras cada cambio de `.env` en el host):

- [ ] `APP_MODE=client_crm` en el entorno de despliegue
- [ ] Menú **no** muestra Constructor ni paquetes
- [ ] `/admin/constructor-crm` y subrutas → **403** (layout UI)
- [ ] `GET /api/admin/constructor/installable-package/drafts?limit=1` → **403** JSON `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM`
- [ ] Ítems visibles del menú = keys en `CLIENT_VISIBLE_MODULES` (más footer/support permitidos por categoría)
- [ ] `/admin/leads` o ruta de leads87 carga
- [ ] `/admin/reportes` carga si `reportes` está en allowlist
- [ ] `/admin/configuracion` revisada si `configuracion` está habilitada (tabs internos — pendiente producto)
- [ ] `npm run build` exitoso en el entorno de build
- [ ] Sin leads demo ni datos de otro cliente
- [ ] Proyecto Supabase = el del clon (no el de base madre salvo decisión explícita)
- [ ] `.env` del host sin secretos ajenos al clon
- [ ] **No** subir `.env` al repositorio Git

Referencias de validación previa: **12D** (menú/UI), **12F** (API GET drafts).

---

## 12. Variables de Supabase y secretos

| Regla | Detalle |
|-------|---------|
| **No documentar valores reales** | URLs, anon keys, service role, JWT secret |
| **Fuera de Git** | `.env.local`, variables del host (Vercel, etc.) |
| **Un clon, un Supabase** | Proyecto o branch dedicado cuando el cliente sea productivo |
| **Service role** | Solo en servidor (route handlers); nunca en bundle cliente |
| **No compartir keys** | En tickets, Slack ni este repo |
| **Base madre vs clon** | No reutilizar credenciales de summer87-leads-v3 en clon cliente salvo decisión arquitectónica explícita, documentada y con riesgo aceptado |

Variables típicas del stack (nombres genéricos, sin valores):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 13. Relación con Pickup 4x4

Si se prepara un clon **Pickup 4x4** (caso semilla BCR en base madre — ver docs 11K/L):

| Fase | `APP_MODE` sugerido |
|------|---------------------|
| Preparación Summer87 | `installation_prep` |
| Entrega al propietario | `client_crm` |

| Variable | Valor ejemplo |
|----------|----------------|
| `CLIENT_SLUG` | `pickup4x4` |
| `CLIENT_NAME` | `Pickup 4x4` |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` (ajustar por contrato) |

- **Constructor** y **BCR** no visibles para propietarios del negocio.
- **Kore:** mantener **solo lectura** hasta validación explícita (política de proyecto).
- Draft Pickup en base madre **no** implica que el clon herede datos de prueba sin migración/seed controlado.

---

## 14. Relación con 12D y 12F

| Fase | Qué validó | Qué aporta 12G |
|------|------------|----------------|
| **12D** | Menú, allowlist, UI `/admin/constructor-crm` → 403 | Checklist de env para reproducir |
| **12F** | API GET drafts → 403 JSON en `client_crm` | Ítem de checklist §11 |
| **12G** | — | Proceso y tablas para **nuevos clones**; **no** agrega guards en código |

---

## 15. Riesgos si se configura mal

| Error | Consecuencia |
|-------|----------------|
| `APP_MODE` ausente o `constructor_base` en clon cliente | Cliente ve fábrica; APIs Constructor activas |
| Flags internos en `true` en clon | Confusión operativa (código fail-safe en `client_crm`, pero mala gobernanza) |
| `CLIENT_VISIBLE_MODULES` vacío en go-live | Menú operativo demasiado amplio |
| Key incorrecta en allowlist | Módulo crave ausente (ej. `leads` vs `leads87`) |
| Mismo Supabase/secrets que base madre | Fuga de datos entre clientes |
| BCR o Constructor en `portal_config.sidebar_modules` | Revisar sanitización futura en merge |
| Dejar `installation_prep` en producción cliente | Summer87 ve internos; cliente no debería estar en prep |
| Confundir validación dev temporal con `.env` de producción | Variables de sesión no persistidas en host |

---

## 16. Recomendación de proceso

1. Crear clon o entorno (repo + Supabase según arquitectura).
2. Definir **`APP_MODE`** (`installation_prep` → luego `client_crm`).
3. Definir **`CLIENT_SLUG`** y **`CLIENT_NAME`**.
4. Definir **`CLIENT_VISIBLE_MODULES`** según contrato.
5. Fijar flags internos en **`false`** en clon cliente.
6. Desplegar variables en el host (no en Git).
7. Validar **menú** (12D).
8. Validar **UI Constructor** bloqueada.
9. Validar **APIs Constructor** bloqueadas (12F).
10. Validar **módulos operativos** críticos (leads, reportes, etc.).
11. Ejecutar **`npm run build`**.
12. Documentar entrega (slug, módulos, fecha, responsable).

---

## 17. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12H** | Revisión `reset-db` y `system_danger` |
| **12I** | Roles cliente vs roles Summer87; `INTERNAL_ADMIN_EMAILS` |
| **12J** | Checklist técnico clon/staging real (infra + DNS) |
| **12K** | `.env.example` documentado en repo (si se aprueba) |
| **12L** | Validación de un clon `client_crm` real en staging |

---

## 18. Decisión actual

> **En 12G solo se documenta el checklist de configuración.**  
> **No se crean ni modifican archivos `.env`, `.env.local` ni `.env.example`.**

---

## 19. Confirmación de alcance (fase 12G documental)

- ✅ Checklist ENV y proceso de clon documentados  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se creó `.env.example`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12G — Checklist ENV clon client_crm. Implementación de guards: 12B-impl, 12C (UI), 12E (API). Validaciones: 12D, 12F.*
