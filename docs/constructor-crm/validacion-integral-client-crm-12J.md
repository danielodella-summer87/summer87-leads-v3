# Validación Integral Client CRM 12J — Constructor CRM Summer87

**Versión:** Fase 12J (checklist operativo pre-piloto — documental)  
**Relacionado con:** Serie hardening **12I** (`validacion-*-12I-impl-*V.md`), `docs/constructor-crm/politica-roles-cliente-vs-summer87-12I.md`, commits `5570b31`, `060a2a9`, `d641f7c`

**Estado del documento:** checklist **pendiente de ejecución runtime**. Los resultados en tablas figuran como **pendiente** hasta completar **12J-run** (validación manual real).

**Última cadena 12I cerrada (referencia):** Constructor UI/API, `system_danger`, sanitización `portal_config`, matriz roles/permisos, gestión usuarios, lecturas sensibles, UI configuración, Agenda desacoplada, `GET /api/admin/users` bloqueado.

---

## 2. Resumen ejecutivo

La fase **12J** es la **primera validación integral operativa** del modo **`APP_MODE=client_crm`** después de cerrar la cadena de hardening **12I** (validaciones documentales 12I-impl-1V a 12I-impl-8V).

Su objetivo es confirmar, en un entorno **local o staging** controlado, que:

| Objetivo | Descripción |
|----------|-------------|
| **Menú operativo** | El cliente ve solo módulos permitidos por `CLIENT_VISIBLE_MODULES` (p. ej. Leads, Agenda, Reportes). |
| **UI interna bloqueada** | Rutas Constructor y Configuración redirigen a **`/403`**. |
| **APIs internas bloqueadas** | Endpoints sensibles responden **`403`** con códigos de error documentados en 12I. |
| **Módulos operativos** | Leads, Agenda y Reportes cargan y se comportan de forma usable. |
| **Pre-piloto** | La instancia queda lista para el checklist **go/no-go** del primer cliente (fase **12M**). |

**12J no sustituye** el runbook de instalación (**12K**) ni la preparación de datos piloto (**12N**). Define **qué probar** y **qué evidencia capturar** antes de avanzar.

---

## 3. Entorno de validación

### Variables conceptuales (sesión temporal)

Usar variables de entorno **solo para la sesión de prueba** (no commitear secretos):

```bash
APP_MODE=client_crm
CLIENT_SLUG=pickup4x4
CLIENT_NAME="Pickup 4x4"
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
npm run dev
```

### Aclaraciones operativas

| Tema | Indicación |
|------|------------|
| **`.env.local`** | No editar en esta fase documental salvo decisión explícita del responsable. Preferir export en shell o script local no versionado. |
| **Volver a fábrica** | Tras 12J, volver a `npm run dev` normal (**`constructor_base`**) sin `APP_MODE=client_crm`. |
| **Puerto** | Si **3000** está ocupado, Next puede levantar en **3001** (u otro). Usar la URL que muestre la terminal. |
| **Base de datos** | Dejar explícito en la planilla si la prueba es **base madre**, **staging** o **clon** del cliente. |

### Ejemplo de arranque (referencia, no destructivo)

```bash
# Desde la raíz del repo, con build previo OK:
npm run build   # precondición; no repetir en cada iteración salvo cambios de código

APP_MODE=client_crm \
CLIENT_SLUG=pickup4x4 \
CLIENT_NAME="Pickup 4x4" \
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes \
npm run dev
```

---

## 4. Precondiciones

Marcar al iniciar **12J-run**:

- [ ] **Repo limpio** (`git status` sin cambios no intencionales) antes de iniciar.
- [ ] **`npm run build`** OK en el commit bajo prueba.
- [ ] **Usuario logueado** con rol operativo válido (p. ej. admin/comercial del piloto).
- [ ] **Sesión válida** en navegador (cookies / auth prototype según entorno).
- [ ] **No ejecutar acciones destructivas** (reset DB, seed, initialize, delete usuarios, etc.).
- [ ] **No modificar datos reales** salvo prueba explícita acordada.
- [ ] **POST mutantes:** solo en endpoints **ya bloqueados**, con body mínimo o vacío, esperando **403** — nunca esperar éxito.
- [ ] **Entorno identificado:** base madre vs staging/clon documentado en la planilla.
- [ ] **Preferencia:** ejecutar en **staging/clon**; si es base madre, limitarse a lectura + comprobación de bloqueos seguros.

| Precondición | Estado |
|--------------|--------|
| Repo limpio | ⬜ pendiente |
| Build OK | ⬜ pendiente |
| Usuario + sesión | ⬜ pendiente |
| Entorno documentado | ⬜ pendiente |

---

## 5. Validación menú

Comprobar el sidebar/menú principal con `CLIENT_VISIBLE_MODULES=leads87,agenda,reportes`.

| Ítem menú | Resultado esperado | Evidencia | Estado |
|-----------|-------------------|-----------|--------|
| Leads / Summer87 Leads (`leads87` en allowlist) | **Visible** y navegable | Captura menú | ⬜ pendiente |
| Agenda (`agenda` en allowlist) | **Visible** | Captura menú | ⬜ pendiente |
| Reportes (`reportes` en allowlist) | **Visible** | Captura menú | ⬜ pendiente |
| Constructor | **No visible** | Captura menú | ⬜ pendiente |
| Configuración | **No visible** | Captura menú | ⬜ pendiente |
| Roles / Usuarios (config) | **No visible** | Captura menú | ⬜ pendiente |
| Paquetes / Instalador | **No visible** | Captura menú | ⬜ pendiente |
| BCR | **No visible** | Captura menú | ⬜ pendiente |
| Reset / seed / initialize | **No visible** | Captura menú | ⬜ pendiente |

---

## 6. Validación UI operativa

Rutas que **deben cargar** (HTTP 200 en página, sin pantalla de error persistente).

| Ruta | Resultado esperado | Evidencia a capturar | Estado |
|------|-------------------|----------------------|--------|
| `/admin/leads` o `/admin/leads87` | Listado operativo carga | Captura pantalla + Network (200 en APIs de listado) | ⬜ pendiente |
| `/admin/agenda` | Vista agenda carga | Captura + Network (`/api/admin/agenda`, `owners`) | ⬜ pendiente |
| `/admin/reportes` | Hub reportes carga | Captura | ⬜ pendiente |
| `/admin/dashboard` | Revisar si queda en menú/allowlist; documentar si carga, redirige o 403 | Captura + nota en planilla | ⬜ pendiente |
| `/admin/personalizacion` | **Decisión pendiente** según contrato piloto: documentar si carga, está oculto o redirige | Captura + nota producto | ⬜ pendiente |

---

## 7. Validación UI bloqueada

Rutas que **deben redirigir a `/403`** (o equivalente bloqueo UI documentado en 12I).

| Ruta | Resultado esperado | Capa responsable | Estado |
|------|-------------------|------------------|--------|
| `/admin/constructor-crm` | Redirect **`/403`** | UI + guards modo (12D–12F) | ⬜ pendiente |
| `/admin/constructor-crm/auditoria` | **`/403`** | UI Constructor | ⬜ pendiente |
| `/admin/constructor-crm/paquetes` | **`/403`** | UI Constructor | ⬜ pendiente |
| `/admin/configuracion` | **`/403`** | `app/admin/configuracion/layout.tsx` (12I-impl-6) | ⬜ pendiente |
| `/admin/configuracion/usuarios` | **`/403`** | Layout configuración | ⬜ pendiente |
| `/admin/configuracion/roles` | **`/403`** | Layout configuración | ⬜ pendiente |
| `/admin/configuracion/roles/[id]` | **`/403`** | Layout configuración | ⬜ pendiente |
| `/admin/configuracion/modulos-menu` | **`/403`** | Layout configuración | ⬜ pendiente |
| `/admin/configuracion/ia` | **`/403`** | Layout configuración | ⬜ pendiente |
| `/admin/configuracion/pipelines` | **`/403`** | Layout configuración | ⬜ pendiente |

**Evidencia:** captura de barra de direcciones en `/403` y, si aplica, mensaje o pantalla estándar del proyecto.

---

## 8. Validación APIs bloqueadas

Ejecutar desde consola del navegador (con sesión) o herramienta HTTP. Registrar **`status`** y **`body.error`**.

> **Seguridad:** POST solo en rutas **bloqueadas**; body `{}` o mínimo. No esperar mutación exitosa.

### Constructor

| Método | Endpoint | Status esperado | `error` esperado | Estado |
|--------|----------|-----------------|------------------|--------|
| GET | `/api/admin/constructor/installable-package/drafts?limit=1` | 403 | `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| GET | `/api/admin/constructor/setup` | 403 | `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` (si protegido) | ⬜ pendiente |
| POST | `/api/admin/constructor/assist` | 403 | `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |

### System danger

| Método | Endpoint | Status esperado | `error` esperado | Estado |
|--------|----------|-----------------|------------------|--------|
| POST | `/api/admin/config/reset-db` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| GET | `/api/admin/setup/minimal-seed` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/setup/minimal-seed` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/modules/initialize` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |

### Roles / permisos

| Método | Endpoint | Status esperado | `error` esperado | Estado |
|--------|----------|-----------------|------------------|--------|
| POST | `/api/admin/roles/toggle-permission` | 403 | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/config/roles` | 403 | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| PATCH | `/api/admin/config/roles` | 403 | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| GET | `/api/admin/config/roles` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |

### Usuarios

| Método | Endpoint | Status esperado | `error` esperado | Estado |
|--------|----------|-----------------|------------------|--------|
| POST | `/api/admin/config/usuarios/act-as` | 403 | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/users/delete` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/users/toggle-active` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/users/invite` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| POST | `/api/admin/users/resend-invite` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| GET | `/api/admin/config/usuarios` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |
| GET | `/api/admin/users` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ pendiente |

### Portal

| Método | Endpoint | Nota | Estado |
|--------|----------|------|--------|
| PATCH | `/api/admin/config/portal` | **No ejecutar contra base madre** en 12J inicial. Validar en **staging/clon**: en `client_crm` debe **sanitizar** `sidebar_modules` al persistir (12H-impl-4). | ⬜ pendiente staging |

### Permissions

| Método | Endpoint | Status esperado | Nota | Estado |
|--------|----------|-----------------|------|--------|
| GET | `/api/admin/permissions/me` | **200** | Array de keys **sin** permisos internos (ver §12) | ⬜ pendiente |

### Snippet de prueba (referencia)

```javascript
// Ejemplo: un endpoint bloqueado (con sesión activa)
fetch("/api/admin/users")
  .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
  .then(console.log);
// Esperado en client_crm: status 403, body.error === "INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM"
```

---

## 9. Validación Agenda

Checklist específico (prioridad alta tras 12I-impl-7 / 12I-impl-8).

- [ ] `/admin/agenda` carga sin error persistente.
- [ ] **Network:** no aparece llamada a **`/api/admin/users`**.
- [ ] **Network:** aparece **`/api/admin/agenda/owners`** (al montar y/o al abrir modal).
- [ ] Respuesta `owners`: incluye `data.leads`, `data.socios`, `data.users`.
- [ ] `data.users[]` contiene campos acotados (`id`, `nombre`, `email`, `role`); **no** `role_id` ni permisos en payload.
- [ ] Modal de actividad / bloque **Invitados** abre.
- [ ] Búsqueda por nombre o email en invitados filtra correctamente.
- [ ] **Opcional:** no crear/editar actividades si se desea evitar mutación de datos.

| Ítem Agenda | Estado |
|-------------|--------|
| Carga UI | ⬜ pendiente |
| Sin `/api/admin/users` | ⬜ pendiente |
| Con `/api/admin/agenda/owners` | ⬜ pendiente |
| Payload users acotado | ⬜ pendiente |
| Modal invitados | ⬜ pendiente |

---

## 10. Validación Leads

- [ ] `/admin/leads` o `/admin/leads87` carga.
- [ ] Listado de leads carga (tabla/kanban según UI).
- [ ] Detalle de un lead existente carga (solo si hay datos seguros de prueba).
- [ ] **No** ejecutar importaciones masivas.
- [ ] **No** ejecutar generación IA / Gamma si consume créditos o servicios externos.
- [ ] **No** modificar datos salvo prueba explícita acordada.

| Ítem Leads | Estado |
|------------|--------|
| Listado | ⬜ pendiente |
| Detalle (opcional) | ⬜ pendiente |
| Sin mutaciones no planificadas | ⬜ pendiente |

---

## 11. Validación Reportes

- [ ] `/admin/reportes` carga.
- [ ] Reportes comerciales permitidos (p. ej. leads, pipeline) cargan sin error.
- [ ] No expone enlaces o datos de **Configuración** interna.
- [ ] No muestra accesos a **Constructor** ni matriz de roles.

| Ítem Reportes | Estado |
|---------------|--------|
| Hub reportes | ⬜ pendiente |
| Sub-reportes operativos | ⬜ pendiente |
| Sin fugas UI interna | ⬜ pendiente |

---

## 12. Validación `permissions/me`

### Prueba conceptual

En **`client_crm`**, con sesión válida:

```javascript
fetch("/api/admin/permissions/me", { cache: "no-store" })
  .then((r) => r.json())
  .then((j) => console.log(j?.data ?? j));
```

### Criterios (keys que **no** deben aparecer en el array efectivo)

| Categoría | Keys / patrones excluidos |
|-----------|---------------------------|
| Exactas | `system.danger`, `config.admin`, `config.update`, `config.read` |
| Substrings | `constructor`, `installer`, `bcr`, `roles`, `users`, `permissions`, `portal.internal`, `support.act_as`, `danger` |

### Resultado esperado

| Aspecto | Esperado | Estado |
|---------|----------|--------|
| HTTP status | **200** | ⬜ pendiente |
| Endpoint bloqueado | **No** (filtrado, no 403) | ⬜ pendiente |
| Keys internas | Ausentes según tabla | ⬜ pendiente |
| Keys operativas | Presentes si el rol las tiene en BD (p. ej. `leads.read`) | ⬜ pendiente |

**Nota:** el cliente puede seguir aplicando mapa estático en `app/lib/rbac.ts`; 12J debe documentar cualquier discrepancia UI vs API.

---

## 13. Criterios Go / No-Go

### Go — avanzar hacia piloto (12L / 12M) si:

| Criterio | Estado |
|----------|--------|
| Menú muestra solo módulos operativos allowlist | ⬜ pendiente |
| Leads, Agenda, Reportes cargan | ⬜ pendiente |
| Rutas internas redirigen a `/403` | ⬜ pendiente |
| APIs críticas de la tabla §8 responden **403** con error documentado | ⬜ pendiente |
| Agenda **no** usa `/api/admin/users` | ⬜ pendiente |
| `permissions/me` filtrado (200 sin keys internas) | ⬜ pendiente |
| `npm run build` OK en commit probado | ⬜ pendiente |
| Repo limpio tras documentar evidencias | ⬜ pendiente |
| No hay datos internos de fábrica visibles al operador piloto | ⬜ pendiente |

### No-Go — detener avance a piloto si:

| Bloqueante | Estado observado |
|------------|------------------|
| Constructor visible en menú o accesible | ⬜ N/A hasta ejecutar |
| Configuración visible o editable | ⬜ N/A hasta ejecutar |
| Cualquier endpoint destructivo **no** devuelve 403 | ⬜ N/A hasta ejecutar |
| `GET /api/admin/users` devuelve listado en `client_crm` | ⬜ N/A hasta ejecutar |
| Agenda rota (sin owners / sin invitados) | ⬜ N/A hasta ejecutar |
| Leads o Reportes no cargan | ⬜ N/A hasta ejecutar |
| Aparecen usuarios internos / emails de fábrica no esperados | ⬜ N/A hasta ejecutar |
| Errores runtime persistentes en consola o servidor | ⬜ N/A hasta ejecutar |

**Decisión 12J-run:** ⬜ **Go** / ⬜ **No-Go** / ⬜ **Go condicionado** (anotar condiciones).

---

## 14. Evidencias a capturar

Al completar **12J-run**, adjuntar o referenciar (carpeta interna / ticket):

- [ ] Captura menú en `client_crm`.
- [ ] Captura `/admin/leads` o `/admin/leads87`.
- [ ] Captura `/admin/agenda`.
- [ ] Captura `/admin/reportes`.
- [ ] Captura `/403` al abrir `/admin/configuracion`.
- [ ] Captura `/403` al abrir `/admin/constructor-crm`.
- [ ] Consola o log de `fetch` de endpoints críticos (§8).
- [ ] Network de Agenda **sin** `/api/admin/users` y **con** `/api/admin/agenda/owners`.
- [ ] `git status` final del entorno de prueba (commit SHA anotado).
- [ ] Planilla §13 con decisión Go/No-Go firmada por responsable.

---

## 15. Lo que NO valida 12J

| Fuera de alcance | Motivo |
|------------------|--------|
| RLS definitiva / políticas Supabase finales | Fase infra / multi-tenant posterior |
| Multi-tenant perfecto por `company_id` | Pendiente diseño datos |
| Autogestión de usuarios cliente | Política producto futura |
| Producción / Vercel deploy | Fase release |
| Integración Zeta / Kore | Otros sistemas |
| Datos limpios del cliente piloto | Fase 12N |
| Performance / carga | No es QA de rendimiento |
| Emails / invites reales | Riesgo operativo |
| Creación real de tenant en BD | No en checklist documental |
| Validación de mutación exitosa de portal en base madre | Riesgo datos |

---

## 16. Riesgos residuales

| Riesgo | Mitigación sugerida |
|--------|---------------------|
| `/api/admin/agenda/owners` sin filtro `tenant` / `company_id` | Revisión post-piloto; acotar query |
| Módulos operativos con configuración legacy en BD | Auditoría datos 12N |
| `permissions/me` filtrado en server pero UI con mapa estático | Cruzar API vs UI en 12J-run |
| Datos heredados de fábrica en clon | Limpieza / semilla piloto |
| Sin runbook instalación formal | **12K** |
| Sin checklist go/no-go firmado | **12M** |
| `/admin/personalizacion` sin política cerrada | Decisión producto antes de piloto |

---

## 17. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12J-run** | Ejecutar este checklist en local/staging y **completar** columnas Estado + decisión §13 |
| **12K** | Runbook instalación `client_crm` (env, menú, roles allowlist, smoke tests) |
| **12L** | Preparación piloto primer cliente (accesos, datos, responsables) |
| **12M** | Checklist go/no-go definitivo primer cliente |
| **12N** | Limpieza / semilla de datos piloto |

---

## 18. Confirmación de alcance (fase 12J documental)

Este archivo **solo crea el checklist** de validación integral. **No constituye** ejecución runtime ni aprobación de piloto.

- ✅ Checklist y criterios Go/No-Go documentados  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  
- ❌ **No se afirma** que la validación runtime 12J ya fue ejecutada  

---

*Documento 12J — validación integral pre-piloto `client_crm`. Ejecución operativa: fase **12J-run**. Hardening previo: serie **12I** (commits hasta `d641f7c`).*
