# Política Roles Cliente vs Summer87 12I — Constructor CRM Summer87

**Versión:** Fase 12I (política funcional/técnica — documental)  
**Relacionado con:** `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md`, `docs/constructor-crm/politica-system-danger-client-crm-12H.md`, `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `docs/constructor-crm/validacion-portal-config-sanitizado-client-crm-12H-impl-4V.md`, `lib/config/appMode.ts`, `lib/auth/session.ts`

**Estado:** política propuesta. **No** implementa cambios en usuarios, roles, permisos, invitaciones ni RLS.

**Contexto:** Ya existen capas de hardening por `APP_MODE` (menú, Constructor, system_danger, sanitización `portal_config`). Falta definir con claridad **quién puede hacer qué** en identidad y permisos antes de codificar **12I-impl**.

---

## 2. Resumen ejecutivo

Esta fase define la **separación conceptual** entre:

- **Roles internos Summer87** (fábrica, superadmin, soporte técnico)
- **Roles del CRM operativo del cliente** (propietario, admin operativo, usuario operativo, lectura)
- **Actores externos eventuales** (invitados acotados)

El objetivo es evitar que un **cliente** obtenga permisos de **fábrica**, confunda **soporte Summer87** con **propietario del negocio**, o modifique la plataforma como si fuera Summer87.

La implementación en código, APIs y UI queda para **12I-impl-0 … 12I-impl-3** y validación **12J**. En **12I** solo se documenta la política.

---

## 3. Principio principal

> **En `client_crm`, el cliente administra su operación; Summer87 administra la plataforma, la fábrica y el soporte técnico.**

| Dimensión | Cliente | Summer87 |
|-----------|---------|----------|
| Operación diaria | Leads, agenda, reportes contratados | No sustituye al cliente salvo soporte acordado |
| Plataforma / fábrica | Sin acceso | Constructor, instalador, BCR, seeds |
| Seguridad estructural | Sin elevación a roles internos | Superadmin, permisos internos, act-as auditado |

---

## 4. Tipos de actores

| Actor | Propósito | Puede ver Constructor | Puede tocar configuración interna | Puede operar CRM | Nota |
|-------|-----------|:---------------------:|:---------------------------------:|:----------------:|------|
| **Summer87 superadmin / fábrica** | Gobernanza de producto, base madre, clones, riesgo L3 | Sí (en `constructor_base` / prep) | Sí | Sí | Solo equipo autorizado; nunca asignable por cliente |
| **Summer87 soporte técnico** | Incidentes, instalación, diagnóstico en clon | Condicional (idealmente `installation_prep`) | Condicional y auditado | Condicional | No confundir con propietario cliente |
| **Propietario cliente** | Dueño del negocio / contrato; gobierno operativo de su instancia | No | No (solo subconjunto operativo futuro) | Sí | Máximo rol **cliente**; sin superadmin |
| **Administrador operativo cliente** | Gestión día a día: usuarios operativos, pipelines, catálogos | No | Parcial (operational_config) | Sí | Sin roles internos Summer87 |
| **Usuario operativo cliente** | Leads, agenda, tareas según módulos | No | No | Sí | Permisos granulares por módulo |
| **Usuario lectura / reportes** | Consulta y exportación acotada | No | No | Lectura | Sin edición ni usuarios |
| **Invitado externo eventual** | Acceso puntual (auditor, partner) | No | No | Condicional / Futuro | Time-box, alcance mínimo |

---

## 5. Separación de dominios de permisos

Los siguientes identificadores son **nombres conceptuales** para diseño y documentación. **No** implica que todos existan hoy como claves en BD, middleware o `toggle-permission`.

### 5.1 Permisos de fábrica Summer87

| Permiso (conceptual) | Descripción |
|----------------------|-------------|
| `constructor.*` | Constructor CRM, paquetes instalables, asistencia fábrica |
| `installer.*` | Instalador, preinstalación, simulaciones |
| `bcr.*` | Base de conocimiento por rubro |
| `portal.internal_config` | `portal_config` completo, módulos-menú global |
| `roles.manage_internal` | Matriz de permisos agencia / roles plantilla |
| `users.manage_internal` | Staff Summer87, cuentas de soporte |
| `system.danger` | reset-db, minimal-seed, modules/initialize |

### 5.2 Permisos de soporte Summer87

| Permiso (conceptual) | Descripción |
|----------------------|-------------|
| `support.act_as` | Impersonación controlada (act-as) |
| `support.diagnostics` | Lectura logs, readiness, herramientas prep |
| `support.installation` | Flujos `installation_prep` sin exponer fábrica al cliente |

### 5.3 Permisos de administración cliente

| Permiso (conceptual) | Descripción |
|----------------------|-------------|
| `users.manage_client` | Invitar / desactivar usuarios de la **misma** org/instancia |
| `roles.manage_client` | Asignar roles **cliente** (no superadmin ni internos) |
| `portal.operational_menu` | Menú operativo limitado (futuro; hoy parcial vía sanitize PATCH) |
| `config.operational` | Pipelines, estados, comerciales, personalización labels |

### 5.4 Permisos operativos cliente

| Permiso (conceptual) | Descripción |
|----------------------|-------------|
| `leads.*` | CRUD leads según política |
| `agenda.*` | Calendario y citas |
| `reports.*` | Reportes contratados |
| `helpdesk.*` | Mesa de ayuda si está en contrato |
| `ia.operational` | IA en contexto de lead/reunión **contratada** |

### 5.5 Permisos de solo lectura

| Permiso (conceptual) | Descripción |
|----------------------|-------------|
| `leads.read` | Ver leads sin editar |
| `reports.read` | Ver reportes |
| `agenda.read` | Ver agenda |

**Regla transversal:** en `client_crm`, cualquier permiso de **5.1** y **5.2** (salvo soporte explícito y auditado) debe tratarse como **denegado** para actores cliente, independientemente de lo que muestre una UI legacy.

---

## 6. Matriz de permisos recomendada

Leyenda: **Sí** = permitido en política objetivo · **No** = prohibido · **Condicional** = solo con contrato, rol explícito o modo prep · **Futuro** = pendiente de implementación/aislamiento multi-tenant

| Acción | Summer87 superadmin | Summer87 soporte | Propietario cliente | Admin operativo cliente | Usuario operativo | Solo lectura |
|--------|:-------------------:|:----------------:|:-------------------:|:-----------------------:|:-----------------:|:------------:|
| Ver Constructor | Sí | Condicional | No | No | No | No |
| Usar APIs Constructor | Sí | Condicional | No | No | No | No |
| reset-db | Sí | Condicional | No | No | No | No |
| minimal-seed | Sí | Condicional | No | No | No | No |
| modules/initialize | Sí | Condicional | No | No | No | No |
| Editar `portal_config` completo | Sí | Condicional | No | No | No | No |
| Editar menú operativo limitado | Sí | Condicional | Futuro | Futuro | No | No |
| Invitar usuarios cliente | Sí | Condicional | Futuro | Futuro | No | No |
| Eliminar usuarios cliente | Sí | Condicional | Futuro | Condicional | No | No |
| Asignar superadmin | Sí | No | No | No | No | No |
| Modificar roles internos | Sí | Condicional | No | No | No | No |
| Modificar pipelines operativos | Sí | Condicional | Sí | Sí | Condicional | No |
| Ver leads | Sí | Sí | Sí | Sí | Sí | Sí |
| Editar leads | Sí | Condicional | Sí | Sí | Condicional | No |
| Ver reportes | Sí | Sí | Sí | Sí | Condicional | Sí |
| Gestionar agenda | Sí | Condicional | Sí | Sí | Condicional | No |
| Configurar IA interna | Sí | Condicional | No | No | No | No |
| Usar IA operativa contratada | Sí | Sí | Sí | Sí | Condicional | No |

**Nota:** En `client_crm`, varias filas de **fábrica** ya están bloqueadas por guards de modo (12F, 12H-impl); esta matriz es la **política objetivo** que debe alinearse con RBAC en **12I-impl**.

---

## 7. Política para superadmin

| Regla | Detalle |
|-------|---------|
| Titularidad | Solo **Summer87** / Daniel / equipo explícitamente autorizado |
| Asignación | **Nunca** por cliente ni por UI de invitaciones cliente |
| Visibilidad | **No** visible como opción para propietarios cliente en selects de rol |
| APIs | Endpoints de `set-role` / invitaciones **no** deben permitir elevar a `superadmin` desde contexto cliente |
| Clones | Puede existir cuenta interna de soporte Summer87; **no** debe presentarse como usuario operativo del negocio del cliente |
| Separación contractual | El contrato del cliente define operación; superadmin es gobernanza de plataforma |

---

## 8. Política para propietario cliente

| Puede (objetivo) | No puede |
|------------------|----------|
| Ver y gobernar la **operación** del negocio (leads, reportes, agenda según contrato) | Ver Constructor, BCR, Instalador |
| Administrar **usuarios operativos** de su organización (fase futura, con aislamiento) | Ejecutar reset-db, seed, initialize |
| Configurar **parámetros operativos** acotados (pipelines, estados, personalización) | Asignarse o asignar **superadmin** |
| Ver reportes ejecutivos | Modificar **roles internos** Summer87 |
| Invitar admins/operativos dentro del alcance definido | `act-as`, permisos `system.danger`, `portal.internal_config` completo |
| Usar IA **operativa** contratada | Configurar IA **interna** de plataforma |

---

## 9. Política para usuarios operativos

| Regla | Detalle |
|-------|---------|
| Alcance | Solo módulos **contratados** y visibles por `CLIENT_VISIBLE_MODULES` + RBAC |
| Operación | Leads, agenda, reportes según rol asignado |
| Configuración | **Sin** acceso a configuración sensible por defecto |
| Usuarios / roles | **Sin** gestión salvo permiso explícito futuro (`users.manage_client` acotado) |
| Portal | **Sin** edición de `portal_config` ni acciones `system_danger` |
| Elevación | **Sin** auto-asignación de permisos vía `toggle-permission` |

---

## 10. Política para soporte Summer87

| Regla | Detalle |
|-------|---------|
| Principio | Acceso **acotado**, **documentado** y preferentemente **temporal** |
| Identidad | Puede requerir `INTERNAL_ADMIN_EMAILS` (u homólogo en env) y/o rol interno — **inspeccionar implementación real en 12I-impl-0** |
| Modo ideal | Operar en **`installation_prep`** o entorno de soporte dedicado, no mezclado con sesión del propietario |
| Producción cliente | Cualquier bypass (act-as, PATCH interno) debe quedar **auditado** y fuera del flujo self-service del cliente |
| Separación | La cuenta de soporte **no** es el propietario del negocio; no compartir credenciales |
| Visibilidad | El cliente **no** debe ver cuentas internas salvo política explícita de “contacto soporte” sin privilegios de fábrica |

---

## 11. Riesgo de roles actuales

Estado **conceptual** del proyecto (sin afirmar esquema exacto de tablas sin inventario dedicado):

| Observación | Implicación |
|-------------|-------------|
| Existen rutas UI `/admin/configuracion/usuarios`, `/admin/configuracion/roles`, `/admin/configuracion/roles/[id]` | Superficie de elevación de privilegios si la URL es accesible en `client_crm` |
| Existen APIs bajo `/api/admin/users/*`, `/api/admin/roles/*`, `/api/admin/config/usuarios/*` | Deben revisarse guards por modo **y** por rol |
| En código aparece tipo `CrmRole`: `"superadmin" \| "admin" \| "staff" \| "member"` | Nomenclatura **genérica**; no distingue por sí sola “cliente” vs “Summer87” |
| `APP_MODE` bloquea Constructor y system_danger | **No** sustituye control fino de `set-role` / `toggle-permission` |
| Menú oculto ≠ API bloqueada para usuarios/roles | Riesgo residual documentado en 12H |

**Antes de 12I-impl:** ejecutar **12I-impl-0** — inventario de `app_users`, tablas de roles/permisos, seeds, defaults de invitación y qué comprueba cada API hoy.

---

## 12. APIs a revisar antes de implementación

Rutas **existentes** en el repo (verificación por árbol `app/api/admin/`). Política sugerida para **`client_crm`**:

| API | Riesgo | Política `client_crm` sugerida | Fase futura |
|-----|--------|--------------------------------|-------------|
| `POST /api/admin/users/invite` | Alto — invitaciones fuera de alcance | Solo roles cliente; deny lista interna; sin superadmin | 12I-impl-1, 12L |
| `POST /api/admin/users/delete` | Alto — pérdida de acceso | Solo usuarios de la org cliente; deny internos | 12I-impl-1 |
| `POST /api/admin/users/set-role` | **Crítico** — escalamiento | Deny `superadmin` y roles internos; allow solo roles cliente | 12I-impl-1 |
| `POST /api/admin/users/toggle-active` | Alto | Solo usuarios cliente; deny cuentas Summer87 | 12I-impl-1 |
| `POST /api/admin/users/resend-invite` | Medio | Misma política que invite | 12I-impl-1 |
| `GET/PATCH /api/admin/config/usuarios` | Alto | Lectura/edición acotada; sin datos internos | 12I-impl-3, 12L |
| `POST /api/admin/config/usuarios/act-as` | **Crítico** | **Denegar** a actores cliente | 12I-impl-1 |
| `PATCH /api/admin/config/usuarios/active` | Alto | Deny manipulación de cuentas internas | 12I-impl-1 |
| `POST /api/admin/roles/toggle-permission` | **Crítico** | **Denegar** en `client_crm` (o allowlist estricta operativa) | 12I-impl-2 |
| `GET/PATCH /api/admin/config/roles` | Alto | Deny edición matriz interna | 12I-impl-2, 12I-impl-3 |
| `GET /api/admin/permissions/me` | Medio | Debe reflejar solo permisos cliente efectivos | 12I-impl-0 |

---

## 13. Rutas UI a revisar

| Ruta UI | Clasificación | Política `client_crm` | Nota |
|---------|---------------|----------------------|------|
| `/admin/configuracion/usuarios` | operational_config / internal | Propietario futuro; deny staff Summer87 en lista | URL puede existir sin ítem menú |
| `/admin/configuracion/roles` | internal_config | **No** para cliente | Matriz permisos agencia |
| `/admin/configuracion/roles/[id]` | internal_config | **No** para cliente | Detalle permisos |
| `/admin/configuracion/modulos-menu` | internal_config | **No** cliente; PATCH ya sanitiza en server | UI aún puede intentar guardar |
| `/admin/configuracion` | Mezcla | Hub restringido; sin pestañas internas | Incluye herramientas sensibles en base madre |
| `/admin/personalizacion` | operational_config | Condicional / allowlist | Labels operativos |

**Estado actual:** no hay guard dedicado en layout de `configuracion` equivalente a Constructor (12D). Política UI = **12I-impl-3**.

---

## 14. Reglas mínimas para `client_crm`

1. El cliente **no** puede asignar roles Summer87 (`superadmin`, staff fábrica, permisos internos).
2. El cliente **no** puede activar permisos `constructor.*`, `installer.*`, `bcr.*`, `system.danger`.
3. El cliente **no** puede modificar `INTERNAL_ADMIN_EMAILS` ni variables de gobernanza en env.
4. El cliente **no** puede ver ni editar la matriz de **roles internos** / permisos agencia globales.
5. El cliente solo gestiona usuarios de **su propia instancia/empresa** cuando exista **aislamiento** (`company_id` / tenant) verificado en servidor y RLS.
6. El cliente **no** puede usar **act-as**.
7. El cliente **no** puede invitar usuarios fuera del dominio/alcance definido (correo, org, rol).
8. El cliente **no** debe ver cuentas internas Summer87 en listados, salvo contacto de soporte sin privilegios de fábrica (producto a definir).

---

## 15. Relación con APP_MODE

| Modo | Rol en la arquitectura de seguridad |
|------|-------------------------------------|
| `constructor_base` | Superficie interna Summer87; roles amplios coherentes con fábrica |
| `installation_prep` | Soporte e instalación controlada; transición hacia clon cliente |
| `client_crm` | Restricciones **fuertes** en menú, Constructor, system_danger, sanitize `portal_config` |

**Complementariedad:**

```
Request → APP_MODE guards (menú, rutas sensibles, APIs peligrosas)
       → RBAC / sesión / permisos (quién es el usuario)
       → RLS Supabase (qué filas ve en BD)   [futuro reforzado]
```

`APP_MODE` **no reemplaza** RBAC: un `admin` cliente seguiría siendo peligroso si puede llamar `set-role` → `superadmin` sin bloqueo adicional.

---

## 16. Relación con Supabase / RLS

| Tema | Política 12I |
|------|----------------|
| Alcance de esta fase | **No** modifica RLS ni políticas en Supabase |
| Multiusuario real | Requiere revisar `tenant` / `company_id`, `app_users`, membresías y políticas RLS |
| Service role | Operaciones server-side deben validar modo **y** rol; no confiar solo en UI |
| Estado actual | Usuarios operativos complejos y separación estricta org ↔ org quedan para implementación posterior; **la política se fija antes** para no codificar a ciegas |
| Clones | Un clon `client_crm` compartido sin RLS fuerte es **riesgo alto** aunque el menú esté filtrado |

---

## 17. Recomendación técnica futura

Estrategia **incremental** (orden sugerido):

| Paso | Entregable |
|------|------------|
| 1 | **Inventariar** roles, permisos y comprobaciones reales (12I-impl-0) |
| 2 | **Clasificar** cada permiso: interno vs cliente vs soporte |
| 3 | **Bloquear** `set-role` hacia roles/valores internos en `client_crm` |
| 4 | **Bloquear** `roles/toggle-permission` en `client_crm` |
| 5 | **Separar** listados: usuarios cliente vs cuentas Summer87 (filtro server-side) |
| 6 | **Revisar UI** usuarios/roles: guards + ocultar rutas |
| 7 | **Validar** con cuenta cliente real en clon (12J) |
| 8 | **Documentar** runbook de instalación y soporte (12K) |

Prioridad de implementación: **APIs críticas** antes que pulido visual.

---

## 18. Validaciones futuras

Checklist para cierre de **12I-impl** + **12J** (no ejecutado en 12I documental):

- [ ] Cliente **no** ve “Roles internos” ni matriz agencia completa
- [ ] Cliente **no** puede asignar `superadmin` (UI ni API)
- [ ] `POST set-role` con `superadmin` → **403** en `client_crm`
- [ ] `POST toggle-permission` → **403** en `client_crm` (o allowlist mínima documentada)
- [ ] Cliente **puede** operar leads / agenda / reportes según contrato
- [ ] Summer87 mantiene soporte controlado en prep o con auditoría
- [ ] `npm run build` pasa
- [ ] `constructor_base` **no** se rompe (regresión fábrica)

---

## 19. Riesgos si no se aborda

| Riesgo | Impacto |
|--------|---------|
| Escalamiento de privilegios | Cliente con poder de fábrica en su clon |
| Exposición de herramientas internas | Constructor, BCR, reset vía rol o URL |
| Sabotaje operativo | Cliente desactiva usuarios críticos o borra datos |
| Modificación de plataforma | `toggle-permission`, roles globales, `portal_config` |
| Confusión de identidad | Soporte Summer87 = propietario en auditorías |
| Reputacional / contractual | Incumplimiento de alcance del SaaS entregado |
| Clones inseguros | Imposible entregar `client_crm` con confianza comercial |

---

## 20. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12I-impl-0** | Inventario técnico de roles/permisos actuales |
| **12I-impl-1** | Bloquear asignación de roles internos / superadmin en `client_crm` |
| **12I-impl-2** | Bloquear `roles/toggle-permission` (y afines) en `client_crm` |
| **12I-impl-3** | Revisar UI usuarios/roles |
| **12J** | Validación con clon/staging real |
| **12K** | Runbook instalación `client_crm` |
| **12L** | Auditoría APIs usuarios/roles (complemento) |
| **12M** | Validación PATCH `portal_config` en staging (serie 12H) |

---

## 21. Decisión actual

> **En 12I solo se documenta la política de roles.**  
> **No se modifican usuarios, roles ni permisos.**

---

## 22. Confirmación de alcance (fase 12I documental)

- ✅ Política de roles documentada  
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
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12I — Roles cliente vs Summer87. Complementa 12H (system_danger) y hardening por modo. Siguiente paso recomendado: 12I-impl-0 (inventario técnico).*
