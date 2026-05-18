# Modos Constructor vs CRM Operativo 11X — Constructor CRM Summer87

**Versión:** Fase 11X (diseño funcional — documental)  
**Relacionado con:** `docs/constructor-crm/estado-base-madre-post-limpieza-11W.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/constructor-crm/cierre-limpieza-minima-11V.md`, `docs/constructor-crm/ficha-bcr-pickup4x4.md`

**Estado:** definición de modos y visibilidad. **No implementa** flags, permisos, middleware, UI ni endpoints en esta fase.

---

## 2. Resumen ejecutivo

El proyecto **summer87-leads-v3** concentra hoy la **fábrica interna** (Constructor, Instalador, BCR, evidencia de paquetes) y el **CRM operativo** (leads, clientes, oportunidades, agenda, reportes) en un mismo codebase y base Supabase.

Este documento separa **tres modos funcionales**:

1. **Constructor interno** — Summer87 diseña CRMs.  
2. **CRM operativo cliente** — el cliente usa el negocio, sin ver la fábrica.  
3. **Preparación / instalación controlada** — Summer87 prepara el clon antes de entrega.

Un **clon cliente** debe arrancar en modo **CRM operativo** (o preparación temporal), **nunca** como fábrica expuesta al usuario final.

---

## 3. Problema que resuelve

| Tensión actual | Consecuencia sin modos claros |
|----------------|------------------------------|
| La base madre mezcla Constructor, Instalador, BCR, tablas `installer_package_*` y módulos operativos | El cliente podría ver herramientas de diseño |
| Mismo menú `/admin` para todo | Confusión entre «diseñar CRM» y «vender accesorios» |
| Evidencia Pickup y drafts viven en la misma BD que leads | Riesgo de arrastrar pruebas o paquetes al clon |
| Duplicación manual planificada (`pickup4x4-crm-v1`, etc.) | Sin reglas, el clon hereda Constructor visible |

**Qué exige la solución:**

- El **cliente final** no ve Constructor, Instalador, BCR ni `package_payload`.
- Un **clon** funciona como **CRM operativo**, no como fábrica.
- **Antes de clonar:** definir qué se oculta, qué se conserva en madre, qué se configura en el clon y qué datos no se copian.

---

## 4. Modo 1 — Constructor interno

| Aspecto | Definición |
|---------|------------|
| **Nombre conceptual** | `constructor_base` (base madre) |
| **Usuarios** | Exclusivo **Summer87**, instalador interno, superadmin técnico acordado |
| **Propósito** | Diseñar, simular, auditar y documentar CRMs instalables |

**Capacidades (permitidas en este modo):**

- Diagnosticar negocio (cuestionario, diagnóstico, empresa en flujo Constructor).
- Administrar **`package_payload`** y borradores 8B.
- Generar drafts, **simular preinstalación**, guardar **snapshots**.
- Registrar **meeting decisions** y confirmación humana.
- Producir blueprint, **auditoría pre-SQL**, resumen ejecutivo, cierre documental.
- Consultar y curar **BCR** (Markdown hoy; persistencia futura).
- Usar presets sectoriales (`pickup_4x4`, etc.).
- Acceder a APIs bajo `/api/admin/constructor/*`.

**Prohibido:**

- Uso por **cliente final operativo** (vendedores, propietarios del negocio del cliente) como modo principal.
- Entregar un despliegue al cliente con menú Constructor visible.

**Dónde vive hoy:** proyecto **summer87-leads-v3** (base madre) en estado post-limpieza 11W.

---

## 5. Modo 2 — CRM operativo cliente

| Aspecto | Definición |
|---------|------------|
| **Nombre conceptual** | `client_crm` |
| **Usuarios** | Propietario cliente, usuarios operativos, staff según permisos del negocio |
| **Propósito** | Operación diaria del negocio |

**Módulos operativos (según diseño del paquete / rubro):**

- Leads, clientes, empresas (si aplica).
- Oportunidades, pipeline comercial, agenda.
- Reportes acordados, postventa.
- Mesa de ayuda (si el cliente la contrata).
- Configuración **restringida** (usuarios del cliente, pipelines operativos, personalización acordada).

**El cliente NO ve ni usa:**

- Constructor CRM (`/admin/constructor-crm/*`).
- Instalador / paquetes instalables.
- `package_payload`, snapshots, meeting decisions.
- Auditoría pre-SQL del Constructor.
- BCR interna (fichas, blueprints, curación).
- Generación de paquetes, simulate-preinstall, approve/reject de drafts.
- Herramientas de clonación, `reset-db`, endpoints internos de constructor.

**El cliente NO puede:**

- Crear paquetes instalables.
- Instalar ni clonar otro CRM desde la UI.
- Modificar aprendizaje sectorial global (BCR).

---

## 6. Modo 3 — Preparación / instalación controlada

| Aspecto | Definición |
|---------|------------|
| **Nombre conceptual** | `installation_prep` |
| **Usuarios** | Summer87 / Daniel / roles internos de despliegue |
| **Propósito** | Puente entre diseño (Constructor) y entrega (CRM operativo) |

**Permite (Summer87):**

- Revisar configuración aplicada o pendiente.
- Limpiar datos de prueba residuales en el clon.
- Validar módulos habilitados vs. `package_payload` aceptado.
- Preparar usuarios y permisos del cliente (cuando se autorice creación).
- Revisar integraciones (ej. Kore read-only) en sandbox.
- Ejecutar checklist de activación sin exponer UI al cliente.

**Características:**

- **No es producción cliente** — etiquetar entorno (banner, `APP_MODE`, URL).
- Puede coexistir en **base madre** (hoy: draft Pickup en preparación manual) o en **clon** antes de go-live.
- **Bloqueado** para usuarios finales del cliente (sin login operativo hasta corte).

**Transición típica:** `installation_prep` → `client_crm` al firmar go-live.

---

## 7. Regla principal de producto

> **El Constructor diseña el CRM; el CRM operativo lo usa el cliente.**

Corolarios:

- Diseño y evidencia técnica viven en **madre** o en zona interna del clon **inaccesible**.
- Operación diaria solo consume **configuración ya aplicada** (módulos, pipeline, campos).
- Summer87 puede volver temporalmente a modo preparación; el cliente no.

---

## 8. Qué debe ver cada rol

Leyenda: ✅ acceso habitual | 🔒 restringido / solo lectura operativa | ❌ sin acceso | ⚙️ solo Summer87

| Rol | Constructor | Instalador / Paquetes | BCR | CRM operativo | Reportes operativos | Configuración | Usuarios / permisos |
|-----|-------------|----------------------|-----|---------------|---------------------|---------------|---------------------|
| **Daniel / Summer87** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Instalador interno** | ✅ | ✅ | 🔒 lectura/curación | 🔒 | ✅ | ⚙️ | ⚙️ |
| **Superadmin técnico** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Propietario cliente** | ❌ | ❌ | ❌ | ✅ | ✅ | 🔒 acotada | 🔒 su org |
| **Usuario operativo cliente** | ❌ | ❌ | ❌ | ✅ | 🔒 según rol | ❌ | ❌ |
| **Invitado / staff** | ❌ | ❌ | ❌ | 🔒 módulos asignados | 🔒 | ❌ | ❌ |

---

## 9. Qué rutas pertenecen al Constructor interno

Rutas **UI** (prefijo habitual `/admin/constructor-crm`):

| Ruta conceptual | Uso |
|-----------------|-----|
| `/admin/constructor-crm` | Home Constructor |
| `/admin/constructor-crm/paquetes` | Listado borradores instalables |
| `/admin/constructor-crm/paquetes/[id]` | Detalle draft, simulación, reunión, blueprint |
| `/admin/constructor-crm/auditoria` | Auditoría pre-SQL / readiness |
| `/admin/constructor-crm/cuestionario` | Cuestionario de diseño |
| `/admin/constructor-crm/diagnostico` | Diagnóstico |
| `/admin/constructor-crm/empresa` | Contexto empresa en flujo Constructor |
| `/admin/constructor-crm/documentos` | Documentos del flujo |
| `/admin/constructor-crm/proceso-pipeline` | Diseño pipeline (Constructor) |
| `/admin/constructor-crm/motores-ia` | Motores IA internos del Constructor |
| `/admin/constructor-crm/reportes` | Reportes del flujo Constructor (no confundir con reportes operativos) |

**APIs internas** (patrón `/api/admin/constructor/*`):

- `installable-package/generate`
- `installable-package/drafts` (+ `[id]`, approve, reject, simulate-preinstall, simulation-snapshots, meeting-decisions)
- `constructor/setup` (relacionado con `crm_setup_config`)

**Documentación / procesos (no rutas app):**

- `docs/constructor-crm/*` BCR, limpieza, fichas semilla.
- Presets en `lib/admin/installablePackage*Preset.ts`.

> El menú global `/admin` hoy mezcla Constructor y operativo; en modo `client_crm` el ítem Constructor debe **desaparecer** del menú cliente.

---

## 10. Qué rutas pertenecen al CRM operativo

Rutas **operativas** (visibles en modo `client_crm` según módulos contratados):

| Área | Rutas conceptuales (existentes o planificadas en codebase) |
|------|--------------------------------------------------------------|
| Leads | `/admin/leads`, `/admin/leads/[id]`, kanban, importar, nuevo |
| Clientes / empresas | `/admin/clientes`, `/admin/empresas` |
| Oportunidades | `/admin/oportunidades`, `/admin/oportunidades/[id]` |
| Agenda | `/admin/agenda` |
| Reportes | `/admin/reportes`, `/admin/reportes/comercial/*` |
| Mesa de ayuda | `/admin/mesa-de-ayuda`, `/admin/mesa-de-ayuda/[id]` |
| Dashboard | `/admin/dashboard` |
| Eventos / reuniones operativas | `/admin/eventos`, `/admin/reuniones` |
| Configuración **restringida** | `/admin/configuracion/*` (usuarios, pipelines, rubros, roles — solo lo acordado) |
| Copilot / IA operativa | `/admin/copilot`, `/admin/ia` — **solo si** el contrato lo incluye y no expone Constructor |

**Módulos por cliente:** en clon Pickup 4x4 serían los del preset (clientes, vehículos si se modelan vía leads/oportunidades, etc.) — definición en paquete, no en este doc.

**Fuera de CRM operativo cliente:** todo el árbol `/admin/constructor-crm/*`.

---

## 11. Qué debe ocultarse en clones cliente

Al entregar un clon (ej. `pickup4x4-crm-v1`):

| Ocultar al cliente final | Motivo |
|--------------------------|--------|
| Constructor CRM (UI completa) | Fábrica interna |
| Instalador / Paquetes | Diseño e instalación |
| `package_payload` y tablas drafts | Evidencia técnica |
| BCR (docs, futura UI curador) | Memoria Summer87 |
| Snapshots y meeting decisions | Simulación / reunión interna |
| Auditoría pre-SQL | Pre-instalación |
| `reset-db` y scripts de reset | Peligro operativo |
| Endpoints `/api/admin/constructor/*` | Bloqueo API + 403 |
| IA / motores solo de diseño | Si no son feature del cliente |
| Menú y breadcrumbs hacia Constructor | UX |

**Datos:** no copiar a clon (o limpiar en `installation_prep`) leads demo, drafts ajenos al cliente, genéricos `not-resolved-in-preview`, draft rechazado `prueba`.

---

## 12. Qué puede conservarse técnicamente pero oculto

| Capa | Estrategia recomendada (corto plazo) |
|------|--------------------------------------|
| **Codebase** | El clon puede contener el mismo repo; rutas Constructor **no enlazadas** |
| **UI / menú** | Ocultar por `APP_MODE` + rol |
| **Endpoints** | Middleware / guard: rechazar si `client_crm` y path `constructor` |
| **Tablas BD** | Pueden existir vacías o sin uso; sin UI ni API cliente |
| **Eliminación física del código** | Fase posterior (12B+); primero **bloquear** |

Ventaja: Summer87 puede reutilizar el mismo artefacto de despliegue y activar modo preparación sin redeploy distinto.

---

## 13. Variables conceptuales de modo

**No se implementan en 11X.** Referencia para fases 12A/12B:

| Variable | Valores ejemplo | Uso |
|----------|-----------------|-----|
| `APP_MODE` | `constructor_base` \| `client_crm` \| `installation_prep` | Modo global del despliegue |
| `ENABLE_CONSTRUCTOR` | `true` / `false` | Atajo feature flag |
| `ENABLE_BCR` | `true` / `false` | Acceso curación BCR |
| `ENABLE_INSTALLER` | `true` / `false` | Paquetes / simulate |
| `CLIENT_SLUG` | `pickup4x4` | Identidad del clon |
| `CLIENT_NAME` | `Pickup 4x4` | Branding / títulos |

**Ejemplos de combinación:**

| Despliegue | APP_MODE | ENABLE_CONSTRUCTOR |
|------------|----------|-------------------|
| summer87-leads-v3 (madre) | `constructor_base` | `true` |
| pickup4x4-crm-v1 (prep) | `installation_prep` | `true` (solo internos) |
| pickup4x4-crm-v1 (prod cliente) | `client_crm` | `false` |

---

## 14. Relación con base madre duplicable

| Entidad | Modo por defecto |
|---------|------------------|
| **summer87-leads-v3** | `constructor_base` (+ zonas `installation_prep` para casos como Pickup) |
| **Clon cliente** | `client_crm` en go-live |
| **Clon en preparación** | `installation_prep` hasta checklist de corte |

**Checklist de clonación (añadir a `base-madre-duplicable.md`):**

1. Duplicar repo / proyecto Supabase.
2. Fijar `.env` y `APP_MODE=installation_prep`.
3. Limpiar datos no cliente (leads demo, drafts ajenos).
4. Aplicar configuración del paquete aceptado.
5. Crear usuarios cliente cuando se autorice.
6. Validar menú sin Constructor para rol propietario.
7. Cambiar a `APP_MODE=client_crm` y deshabilitar Constructor.
8. Tag documental del clon (ej. `pickup4x4-crm-v1-go-live`).

---

## 15. Relación con Pickup 4x4

| Hoy (madre) | Futuro clon Pickup |
|-------------|-------------------|
| Caso semilla BCR + draft `0fa4f061…` en **constructor_base** | Clon en `installation_prep` → `client_crm` |
| Evidencia visible a Summer87 en Paquetes | Propietarios Pickup: **solo CRM operativo** |
| No limpiar sin decisión (11V) | Constructor/BCR ocultos en go-live |

**Acceso Daniel / Summer87 en clon cliente:** opcional mantener rol interno con Constructor en `installation_prep` o soporte; **no** mezclar con login del propietario Pickup.

---

## 16. Relación con BCR

| Principio | Detalle |
|-----------|---------|
| **Dónde vive BCR** | Base madre / Summer87 (Markdown; futuro BD) |
| **Flujo de aprendizaje** | Clon operativo → retrospectiva → **vuelta a BCR** en madre (fichas, no tablas cliente) |
| **Cliente** | No edita ni ve BCR |
| **Beneficio indirecto** | Blueprint y campos sugeridos derivados de BCR al **diseñar** el paquete, no en runtime cliente |

El CRM operativo muestra **configuración ya decidida**, no la «memoria» ni el linaje de sugerencias.

---

## 17. Relación con limpieza y datos

| Regla | Aplicación |
|-------|------------|
| Limpiar antes de clonar | Sin leads demo (hecho en madre para prueba Pickup); no arrastrar drafts internos |
| Evidencia Constructor ≠ operación | Tablas `installer_package_*` no son módulos del menú cliente |
| Paquetes internos | Listado `/paquetes` solo en `constructor_base` |
| Post-limpieza 11V | No más DELETE sin decisión; clonación respeta 11X |

---

## 18. Riesgos si no se separan modos

| Riesgo | Impacto |
|--------|---------|
| Cliente ve Constructor / Paquetes | Pérdida de confianza; errores en drafts |
| Acceso a `package_payload` o snapshots | Fuga de diseño y datos de integración |
| Confusión diseño vs. operación | Usuarios en etapas equivocadas |
| Ejecución de simulate / approve | Corrupción de evidencia o instalación |
| Exposición BCR | IP y procesos internos visibles |
| Producto no vendible como CRM profesional | Percepción «beta interna» |
| Base madre no declarable virgen | Mezcla evidencia + plantilla |
| Soporte imposible | Incidencias en rutas que el cliente no debería tocar |

---

## 19. Recomendación

**Antes** de tocar `crm_setup_config`, pipelines o nueva limpieza (11Z):

1. **Definir menú cliente** — ítems permitidos en `client_crm` (Pickup: leads, oportunidades, agenda, reportes acordados).
2. **Listar rutas bloqueadas** — árbol `/admin/constructor-crm` + APIs constructor.
3. **Roles con acceso Constructor** — solo Summer87 / instalador / superadmin técnico.
4. **Indicador de modo activo** — banner en `installation_prep`; ausencia de Constructor en `client_crm`.
5. **Criterio de validación de clon** — checklist: propietario no alcanza `/admin/constructor-crm/paquetes` (404 o 403).

Implementación: fases **11Y** (política ocultamiento), **12A** (diseño flags), **12B** (código).

---

## 20. Próximas fases sugeridas

| Fase | Título | Objetivo |
|------|--------|----------|
| **11Y** | Política de ocultamiento del Constructor en clones | Menú, guards, 403, checklist clon |
| **11Z** | Revisión `crm_setup_config` y pipelines según modo | ¿Setup solo en `constructor_base`? |
| **12A** | Diseño técnico de flags de modo | Env, middleware, matriz rol×modo |
| **12B** | Implementación visibilidad por modo/rol | Sin eliminar código al inicio |

Elegir **una** como siguiente sprint; secuencia sugerida: **11Y → 11Z → 12A → 12B**.

---

## 21. Decisión actual

> **En 11X solo se documenta el diseño funcional de modos.**  
> No se implementan flags, permisos, endpoints ni cambios de UI.

| Campo | Valor |
|-------|--------|
| Modos definidos | 3 (`constructor_base`, `client_crm`, `installation_prep`) |
| Implementación | Pendiente 12A/12B |
| Limpieza adicional | No autorizada (11V/11W) |

---

## 22. Confirmación de alcance (fase 11X)

- ✅ Diseño funcional de modos documentado
- ❌ No se ejecutó SQL
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se modificó código funcional
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se afirma que flags o guards ya existan en runtime

---

*Modos 11X — Separación fábrica (Constructor) vs. operación (CRM cliente). Base para ocultamiento 11Y y clonación segura.*
