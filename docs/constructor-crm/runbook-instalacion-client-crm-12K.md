# Runbook Instalación Client CRM 12K — Constructor CRM Summer87

**Versión:** Fase 12K (runbook operativo — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `validacion-integral-client-crm-12J.md` | Checklist integral pre-piloto |
| `validacion-integral-client-crm-12J-run-local.md` | Evidencia runtime local (referencia) |
| `politica-roles-cliente-vs-summer87-12I.md` | Política roles/permisos cliente |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV clon |
| Serie `validacion-*-12I-impl-*V.md` | Hardening APIs/UI validado por código |

**Estado:** procedimiento **documentado**. No describe una instalación productiva ya entregada ni un deploy en Vercel ejecutado en esta fase.

---

## 2. Resumen ejecutivo

**12K** define el **procedimiento operativo** para levantar una instancia **`APP_MODE=client_crm`** de forma **controlada**, apoyándose en el hardening cerrado en la serie **12I** y en la validación manual documentada en **12J-run** (local).

### Qué es

- Guía repetible para **piloto controlado** (local temporal o staging/clon).
- Checklists de menú, rutas, APIs, Agenda y `permissions/me`.
- Plantilla de registro, criterios **GO/NO-GO** y **rollback** a `constructor_base`.

### Qué no es

| Limitación | Detalle |
|------------|---------|
| Deploy productivo definitivo | Fuera de alcance 12K |
| Sustituto de staging/clon real | Debe repetirse 12J en entorno aislado antes del primer cliente |
| RLS / multi-tenant futuro | No resuelto por este runbook |
| Seguridad “completa” | Capa `APP_MODE` + guards; complementa, no reemplaza, RBAC/RLS |

---

## 3. Objetivo del runbook

Al completar 12K (ejecución operativa, no solo lectura del doc), el responsable debe poder:

| # | Objetivo |
|---|----------|
| 1 | Levantar modo **`client_crm`** con variables correctas |
| 2 | Mostrar **solo** módulos contratados (`CLIENT_VISIBLE_MODULES`) |
| 3 | Confirmar bloqueo de **configuración interna** (UI + APIs) |
| 4 | Confirmar bloqueo de **Constructor** (UI + APIs) |
| 5 | Confirmar bloqueo de **`system_danger`** |
| 6 | Validar operación básica: Leads, Agenda, Reportes |
| 7 | Generar **evidencias** trazables (capturas, fetch, Network) |
| 8 | Ejecutar **rollback** documentado a fábrica (`constructor_base`) |

---

## 4. Alcance

### Incluye

- Variables de entorno (conceptuales, sin secretos).
- Preflight obligatorio.
- Arranque local temporal y pasos conceptuales staging/clon.
- Checklists: menú, rutas operativas, rutas bloqueadas, APIs críticas, Agenda, `permissions/me`, datos.
- Criterios GO/NO-GO.
- Rollback a `constructor_base`.
- Lista de evidencias y plantilla de registro de instalación.

### No incluye

| Fuera de alcance | Fase sugerida |
|------------------|---------------|
| Crear tenant real en BD | Infra / producto |
| Crear usuarios cliente | 12L / operaciones |
| Migraciones SQL | DBA / 12N |
| Limpieza o semilla de datos | **12N** |
| Deploy Vercel / producción | **12P** |
| RLS definitiva | Infra |
| Zeta / Kore | Integraciones |
| Emails / invites reales | Contrato + env |
| Autogestión usuarios cliente | Política futura |

---

## 5. Variables de entorno requeridas

> **Nunca** pegar secretos en este documento ni commitear `.env.local`. Usar gestor del hosting o export temporal en shell para pruebas locales.

Alias admitidos con prefijo `SUMMER87_` (ver `lib/config/appMode.ts` y `checklist-env-clon-client-crm-12G.md`).

| Variable | Ejemplo (no secreto) | Obligatoria | Descripción | Riesgo si falta |
|----------|----------------------|:-----------:|-------------|-----------------|
| `APP_MODE` | `client_crm` | **Sí** | Activa modo cliente | Sin valor → default **`constructor_base`** (fábrica) |
| `CLIENT_SLUG` | `pickup4x4` | Recomendada | Identificador técnico del cliente | Trazabilidad y branding bajos |
| `CLIENT_NAME` | `Pickup 4x4` | Recomendada | Nombre visible / documental | UX y títulos confusos |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` | **Sí** (go-live piloto) | Allowlist de módulos en menú | Menú incorrecto o módulos no contratados visibles |
| `NEXT_PUBLIC_SUPABASE_URL` | *(existente en proyecto)* | **Sí** | URL Supabase | App no conecta |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(existente)* | **Sí** | Cliente Supabase browser | Auth/client fallan |
| `SUPABASE_SERVICE_ROLE_KEY` | *(existente, solo server)* | **Sí** (server) | APIs admin server-side | Route handlers admin fallan |
| `OPENAI_API_KEY` | — | No (piloto básico) | IA / generación | IA no disponible |
| `RESEND_API_KEY` | — | No (sin emails en piloto) | Invitaciones / transaccional | Invites por email no disponibles |
| `RESET_DB_TOKEN` | — | **No en cliente** | Protección extra reset (si existe) | **Riesgo alto** si se expone en clon cliente |

### Buenas prácticas

- **Validación local:** variables por sesión en terminal; no editar `.env.local` salvo decisión explícita del responsable.
- **Staging/clon:** proyecto Supabase **separado** o dataset controlado; no apuntar a base madre para piloto.
- **Producción futura:** variables en panel del hosting; rotación de keys fuera de este doc.

### Bloque conceptual piloto (sin valores secretos)

```env
APP_MODE=client_crm
CLIENT_SLUG=pickup4x4
CLIENT_NAME=Pickup 4x4
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
# + variables Supabase ya definidas en el entorno (no copiar aquí)
```

---

## 6. Módulos visibles permitidos para piloto

Allowlist recomendada para primer piloto operativo:

| `key` | Módulo | Incluir en piloto |
|-------|--------|:-----------------:|
| `leads87` | Summer87 Leads / Leads | ✅ |
| `agenda` | Agenda | ✅ |
| `reportes` | Reportes | ✅ |

### No incluir salvo contrato y validación explícita

| `key` / área | Motivo |
|--------------|--------|
| `configuracion` | Bloqueada en `client_crm` (12I) |
| Constructor / instalador | Bloqueado por modo |
| `personalizacion` | Decisión comercial + técnica pendiente |
| `ia` | No validada para cliente en piloto básico |
| `mesa_de_ayuda` / helpdesk | Solo si está en contrato |
| BCR, reset, seed, initialize | Internos Summer87 |

---

## 7. Preflight obligatorio

Marcar **antes** de arrancar o desplegar:

- [ ] `git status` **limpio** (o cambios documentados y aceptados).
- [ ] `npm run build` → **OK**.
- [ ] Rama **`main`** (o rama de release) actualizada y commit SHA anotado.
- [ ] Entorno definido: **local** / **staging** / **clon** (anotar en registro §21).
- [ ] URL y puerto confirmados (ver §8 — no asumir `:3000`).
- [ ] Usuario de prueba **logueado** con rol piloto acordado.
- [ ] **No** ejecutar acciones destructivas (reset DB, seed, initialize, delete masivo).
- [ ] **No** tocar Supabase manualmente (SQL Editor, deletes).
- [ ] **No** ejecutar SQL desde este runbook.
- [ ] **No** usar datos reales sensibles si el entorno no es el acordado.

| Preflight | ☐ OK / ☐ Falla |
|-----------|----------------|

---

## 8. Arranque local temporal

### Comando (sesión actual)

```bash
APP_MODE=client_crm \
CLIENT_SLUG=pickup4x4 \
CLIENT_NAME="Pickup 4x4" \
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes \
npm run dev
```

### Aclaraciones operativas

| Tema | Indicación |
|------|------------|
| Puerto | Si **3000** está ocupado, Next puede usar **3001** u otro — usar la URL que imprima la terminal |
| Error común | No abrir `http://localhost:3000` si el log indica **3001** |
| Proceso | Mantener la terminal en ejecución durante las pruebas |
| Volver a fábrica | `Ctrl+C` → `npm run dev` **sin** `APP_MODE=client_crm` (ver §18) |
| Puerto ocupado persistente | Si hay conflicto recurrente, **consultar** antes de cerrar procesos ajenos |

**Referencia:** en 12J-run local, Next levantó en **3001** con puerto 3000 ocupado — resultado **OK**.

---

## 9. Arranque staging / clon

Pasos **conceptuales** (adaptar al proceso del equipo; no inventar pipeline Vercel no documentado en repo).

| Paso | Acción |
|------|--------|
| 1 | Crear **proyecto/hosting separado** (o preview branch dedicada) para el cliente piloto |
| 2 | Configurar variables §5 en el panel del proveedor (**sin** commitear secretos) |
| 3 | Usar **Supabase separado** o dataset controlado — evitar base madre |
| 4 | Confirmar **dominio/URL** de staging (anotar en registro) |
| 5 | Ejecutar **build** y **deploy** según proceso interno del equipo |
| 6 | Repetir checklists §10–§17 (equivalente a **12J-run** en esa URL) |
| 7 | Archivar evidencias y completar plantilla §21 |

**No ejecutar** en base madre: `PATCH /api/admin/config/portal` esperando persistencia, resets, seeds, ni imports masivos.

---

## 10. Checklist visual — menú

| Ítem menú | Esperado en piloto | ☐ OK | ☐ Falla |
|-----------|-------------------|------|---------|
| Summer87 Leads / Leads | **Visible** | | |
| Agenda | **Visible** | | |
| Reportes | **Visible** | | |
| Constructor | **No visible** | | |
| Configuración | **No visible** | | |
| Roles / Usuarios | **No visible** | | |
| Paquetes / Instalador | **No visible** | | |
| BCR | **No visible** | | |
| Reset / Seed / Initialize | **No visible** | | |
| Módulos no contratados | **No visible** | | |

**Evidencia:** captura del sidebar con URL y `APP_MODE` anotado en registro.

---

## 11. Checklist rutas operativas

| Ruta | Esperado | Evidencia | ☐ OK | ☐ Falla |
|------|----------|-----------|------|---------|
| `/admin/dashboard` | Carga (si aplica al menú) | Captura | | |
| `/admin/leads` o `/admin/leads87` | Carga listado | Captura + Network | | |
| `/admin/agenda` | Carga vista agenda | Captura + Network | | |
| `/admin/reportes` | Carga hub reportes | Captura | | |

### Opcionales / decisión producto

| Ruta | Nota | ☐ OK | ☐ N/A | ☐ Falla |
|------|------|------|-------|---------|
| `/admin/personalizacion` | Solo si contrato lo incluye | | | |
| `/admin/mesa-de-ayuda` | Solo si contrato helpdesk | | | |
| `/admin/ia` | No recomendado en piloto básico | | | |

**Nota:** contadores en **0** o estado vacío **no** invalidan OK de carga si no hay error runtime (observado en 12J-run local).

---

## 12. Checklist rutas bloqueadas

Esperado: redirect o pantalla **`/403`** — «403 · Sin permisos» / «No tenés permisos para acceder a esta sección.»

Probar **una URL por vez** (evitar pegar varias rutas en la barra de direcciones).

| Ruta | Esperado | ☐ OK | ☐ Falla |
|------|----------|------|---------|
| `/admin/configuracion` | `/403` | | |
| `/admin/configuracion/usuarios` | `/403` | | |
| `/admin/configuracion/roles` | `/403` | | |
| `/admin/configuracion/modulos-menu` | `/403` | | |
| `/admin/constructor-crm` | `/403` | | |
| `/admin/constructor-crm/auditoria` | `/403` | | |
| `/admin/constructor-crm/paquetes` | `/403` | | |

**Capa:** `app/admin/configuracion/layout.tsx` + guards modo Constructor (12I / 12D–12F).

---

## 13. Checklist APIs bloqueadas (mínimas)

Ejecutar con **sesión activa** desde consola del navegador. **No** esperar éxito en POST mutantes.

```javascript
async function probe(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });
  const body = await r.json().catch(() => null);
  return { url, status: r.status, error: body?.error ?? body };
}
```

| Endpoint | Método | Status | `error` esperado | ☐ OK | ☐ Falla |
|----------|--------|--------|------------------|------|---------|
| `/api/admin/config/roles` | GET | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/config/usuarios` | GET | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/users` | GET | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/config/reset-db` | POST | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/setup/minimal-seed` | GET | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/modules/initialize` | POST | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/config/usuarios/act-as` | POST | 403 | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` | | |
| `/api/admin/users/delete` | POST | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | | |

**Precaución en base madre:** si un guard fallara, un POST podría mutar — preferir **staging/clon**. En 12J-run local los 8 endpoints devolvieron **403**.

### APIs extendidas (opcional, segunda pasada)

| Endpoint | Error esperado (referencia 12I) |
|----------|--------------------------------|
| `GET /api/admin/constructor/installable-package/drafts?limit=1` | `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` |
| `POST /api/admin/users/invite` | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |
| `POST /api/admin/roles/toggle-permission` | `INTERNAL_ROLE_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |

---

## 14. Checklist Agenda

| Ítem | Esperado | ☐ OK | ☐ Falla |
|------|----------|------|---------|
| `/admin/agenda` carga | Sin error persistente | | |
| Network: **no** `/api/admin/users` | Ausente al recargar agenda | | |
| Network: **sí** `/api/admin/agenda/owners` | Status **200** | | |
| Modal / invitados (opcional) | Abre si se prueba | | |
| Payload `data.users[]` (opcional) | Sin `role_id` ni permisos en JSON | | |
| Mutaciones agenda | **No** probar salvo autorización explícita | ☐ N/A | |

**Referencia 12J-run:** owners **200**, sin llamada a `/api/admin/users`.

---

## 15. Checklist `permissions/me`

```javascript
fetch("/api/admin/permissions/me", { cache: "no-store" })
  .then((r) => r.json())
  .then(console.log);
```

| Criterio | Esperado | ☐ OK | ☐ Falla |
|----------|----------|------|---------|
| HTTP status | **200** | | |
| Endpoint bloqueado | **No** (filtrado, no 403) | | |

### Keys / patrones que **no** deben aparecer en el array efectivo

| Tipo | Valores |
|------|---------|
| Exactas | `system.danger`, `config.admin`, `config.update`, `config.read` |
| Patrones | `constructor`, `installer`, `bcr`, `roles`, `users`, `permissions`, `portal.internal`, `support.act_as`, `danger` |

**Referencia 12J-run:** flags de verificación (`has_system_danger`, `has_config_admin`, etc.) en **`false`**.

**Nota:** la UI puede usar mapa estático en `app/lib/rbac.ts` — documentar discrepancias en observaciones del registro.

---

## 16. Checklist datos

| Ítem | Acción |
|------|--------|
| Datos heredados | Documentar si hay registros de fábrica visibles |
| Contadores en 0 / vacío | **No** invalidan OK de carga por sí solos |
| Piloto representativo | Requiere fase **12N** (limpieza/semilla) |
| Importaciones | **No** ejecutar sin plan |
| IA / Gamma / externos | **No** sin contrato y créditos |
| Tenant / `company_id` | **No** validado por este runbook |

---

## 17. Evidencias a capturar

- [ ] Menú `client_crm`
- [ ] Dashboard (si aplica)
- [ ] Leads
- [ ] Agenda
- [ ] Reportes
- [ ] `/403` en `/admin/configuracion`
- [ ] `/403` en `/admin/constructor-crm`
- [ ] Network: **`/api/admin/agenda/owners`**
- [ ] Network: **ausencia** de `/api/admin/users` en Agenda
- [ ] Tabla o consola: resultados `fetch` APIs §13
- [ ] `permissions/me` filtrado
- [ ] `git status` + commit SHA al cierre
- [ ] Registro §21 completado

---

## 18. Rollback / retorno a fábrica

| Paso | Acción |
|------|--------|
| 1 | Detener servidor dev `client_crm` (`Ctrl+C` en terminal) |
| 2 | Ejecutar `npm run dev` **sin** `APP_MODE=client_crm` |
| 3 | Confirmar menú **completo** `constructor_base` (Constructor, Configuración, etc.) |
| 4 | Confirmar `/admin/configuracion` **carga** (con rol que lo permita) |
| 5 | Confirmar `/admin/constructor-crm` **carga** si el rol lo permite |
| 6 | **No** revertir commits de hardening salvo bug confirmado |
| 7 | Si estado inconsistente: reiniciar dev server y sesión del navegador |

**Puertos:** si persiste conflicto de puertos, consultar al equipo antes de terminar procesos del sistema.

---

## 19. Criterios GO

Marcar **GO** solo si **todos** aplican en el entorno bajo prueba:

| # | Criterio | ☐ |
|---|----------|---|
| 1 | `npm run build` OK | |
| 2 | Menú solo módulos allowlist | |
| 3 | Rutas operativas cargan (§11) | |
| 4 | Rutas internas bloquean `/403` (§12) | |
| 5 | APIs críticas §13 → **403** + error documentado | |
| 6 | Agenda usa **owners**, no **users** | |
| 7 | `permissions/me` **200** filtrado | |
| 8 | Repo limpio o estado documentado | |
| 9 | Sin errores runtime persistentes en consola | |

**GO local** (12J-run) **no** sustituye GO en **staging/clon** antes del primer cliente real.

---

## 20. Criterios NO-GO

Detener avance a piloto / producción si ocurre **cualquiera**:

| Bloqueante | ☐ Detectado |
|------------|-------------|
| Constructor visible en menú | |
| Configuración visible en menú | |
| `GET /api/admin/users` → **200** en `client_crm` | |
| `POST /api/admin/config/reset-db` ≠ 403 | |
| `GET /api/admin/setup/minimal-seed` ≠ 403 | |
| `POST /api/admin/modules/initialize` ≠ 403 | |
| Agenda llama `/api/admin/users` | |
| Leads / Agenda / Reportes no cargan | |
| Roles/usuarios internos expuestos en UI o API | |
| Build falla | |
| Repo sucio sin explicación | |

---

## 21. Registro de instalación (plantilla)

Copiar y completar por cada intento (local, staging o clon):

```text
Cliente:           _______________________
Slug:              _______________________
Fecha:             _______________________
Responsable:       _______________________
Entorno:           [ ] local  [ ] staging  [ ] clon
URL:               _______________________
Commit:            _______________________
Módulos visibles:  _______________________

Resultado build:              [ ] OK  [ ] Falla
Resultado menú:               [ ] OK  [ ] Falla
Resultado rutas operativas:   [ ] OK  [ ] Falla
Resultado rutas bloqueadas:   [ ] OK  [ ] Falla
Resultado APIs:               [ ] OK  [ ] Falla
Resultado Agenda:             [ ] OK  [ ] Falla  [ ] N/A parcial
Resultado permissions/me:    [ ] OK  [ ] Falla

Dictamen:          [ ] GO  [ ] NO-GO  [ ] GO condicionado
Observaciones:     _______________________
Pendientes:        _______________________
Evidencias:        _______________________
```

### Ejemplo de referencia (12J-run local — no reutilizar como instalación productiva)

| Campo | Valor documentado |
|-------|-------------------|
| Slug | `pickup4x4` |
| URL | `http://localhost:3001` |
| Módulos | `leads87,agenda,reportes` |
| Dictamen | GO técnico **local**, condicionado a staging/clon |

---

## 22. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Solo validación local (sin staging/clon) | Repetir 12J en entorno aislado (**12O**) |
| RLS / políticas Supabase no finales | Diseño infra posterior |
| Sin `tenant` / `company_id` integral en owners y queries | Auditoría post-piloto |
| Datos heredados o en 0 | **12N** limpieza/semilla |
| Autogestión usuarios cliente | Política producto futura |
| Deploy productivo / monitoreo / backup | **12P** |
| `permissions/me` vs mapa estático UI | Cruzar en staging |
| PATCH portal en base madre | Solo staging/clon |

---

## 23. Próximas fases

| Fase | Entregable |
|------|------------|
| **12L** | Preparación piloto primer cliente (accesos, roles, responsables) |
| **12M** | Checklist go/no-go definitivo primer cliente |
| **12N** | Limpieza / semilla datos piloto |
| **12O** | Validación staging/clon con evidencia final (repetir 12J + este runbook) |
| **12P** | Plan deploy / rollback productivo (cuando el equipo lo defina) |

---

## 24. Confirmación de alcance (fase 12K documental)

- ✅ Runbook operativo creado  
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
- ❌ No se instaló CRM real  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  
- ❌ No se afirma instalación productiva existente ni multi-tenant resuelto  

---

*Runbook 12K — instalación controlada `client_crm`. Basado en hardening 12I y validación 12J-run-local. Ejecutar checklists en cada entorno antes de 12M.*
