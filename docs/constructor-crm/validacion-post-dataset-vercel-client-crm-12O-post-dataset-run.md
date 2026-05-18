# Validación Post Dataset Vercel Client CRM 12O-post-dataset-run — Constructor CRM Summer87

**Versión:** 12O-post-dataset-run — ejecución real registrada  
**Checklist origen:** `validacion-post-dataset-vercel-client-crm-12O-post-dataset.md`  
**Contexto:** validación **post** **12N-impl-run** (12 leads Demo + 8 actividades Agenda por UI)

**Tipo de ejecución:** validación **runtime real** en Vercel `client_crm` con dataset ficticio ya cargado.  
**Ámbito:** `https://pickup4x4-crm-demo.vercel.app`. **No** producción, **no** piloto cliente real.

**Distinción:**

| Acción | Detalle |
|--------|---------|
| **Validación en navegador** | Ejecutada por Daniel — menú, rutas, módulos, DevTools |
| **Este archivo** | Solo documentación del registro — **no** modifica datos ni código |

---

## 1. Resumen ejecutivo

Se ejecutó **12O-post-dataset-run** para confirmar que el entorno demo `client_crm` sigue **operativo** y **protegido** después de cargar el dataset Pickup 4x4 ficticio.

| Resultado global | Detalle |
|------------------|---------|
| Módulos operativos | ✅ Dashboard, Leads, Agenda, Reportes |
| Dataset visible | ✅ 12 leads + 8 actividades Demo |
| Menú `client_crm` | ✅ Reducido; sin Constructor / Configuración |
| Rutas internas | ✅ **3/3** → pantalla **403 · Sin permisos** |
| APIs críticas | ✅ **8/8** → **403** |
| `permissions/me` | ✅ **200**; flags internas **`false`** |
| Comparación vs **12O-run** (pre-dataset) | Paridad de seguridad mantenida |

**Dictamen:** **GO técnico post-dataset** para demo interna en Vercel. **NO-GO** para cliente real, producción o preproducción (ver §8).

**No implica:** producción lista, piloto cliente real, Supabase separado, multi-tenant/RLS final.

---

## 2. Entorno

| Campo | Valor |
|-------|--------|
| **URL** | `https://pickup4x4-crm-demo.vercel.app` |
| **Hosting** | Vercel |
| **Proyecto Vercel** | `pickup4x4-crm-demo` |
| **Tipo** | Demo interna `client_crm` |
| **Usuario** | Daniel / usuario actual |
| **Dataset presente** | 12 leads Demo + 8 actividades Agenda |
| **Supabase** | Proyecto **actual** — solo demo técnica (**no** clon separado) |
| **Producción** | **No** |
| **Cliente real** | **No** |
| **Commit referencia (12O-run)** | `8bead8c` — verificar en panel Vercel si hubo redeploy |

---

## 3. Validación funcional observada

### 3.1 Leads

| Prueba | Resultado | Estado |
|--------|-----------|--------|
| Lista — leads Demo visibles | 12 | ✅ |
| Búsqueda `demo` | 12 | ✅ |
| Búsqueda `lona` | 2 | ✅ |
| Búsqueda `combo` | 1 | ✅ |
| Kanban | 12 leads | ✅ |
| Columna pipeline | Todos en **Nuevo lead** | ✅ ⚠️ |
| Errores visibles | Ninguno | ✅ |

### 3.2 Agenda

| Prueba | Resultado | Estado |
|--------|-----------|--------|
| Actividades visibles | 8 | ✅ |
| Vencidas visibles | Sí | ✅ |
| Hoy visible | Sí | ✅ |
| Futuras visibles | Sí | ✅ |
| Leads vinculados visibles | Sí | ✅ |
| Comercial Daniel | Visible | ✅ |
| Invitado Daniel Admin | Visible | ✅ |
| Errores visibles | Ninguno | ✅ |

### 3.3 Dashboard

| Indicador | Observado | Estado |
|-----------|-----------|--------|
| Carga | Sin error | ✅ |
| Total leads | 12 | ✅ |
| Pipeline — Nuevo lead | 12 | ✅ |
| Salud del pipeline — Bien | 12 | ✅ |
| Acciones vencidas | 3 | ✅ |
| Leads sin próxima acción | 1 | ✅ |
| Prioridades comerciales | Visibles | ✅ |
| Alertas comerciales | Visibles | ✅ |
| Top oportunidades | Visible | ✅ |
| Errores visibles | Ninguno | ✅ |

### 3.4 Reportes

| Elemento | Resultado | Estado |
|----------|-----------|--------|
| Hub `/admin/reportes` | Carga sin error | ✅ |
| Vista general | Referencia / próximamente | ⚠️ |
| Comercial — tarjeta Leads | Visible | ✅ |
| `/admin/reportes/comercial/leads` | Carga sin error | ✅ |
| Filas mostradas | **12 / 12** | ✅ |
| Filtros | búsqueda, origen, pipeline, estado, rating, fechas | ✅ |
| Exportar CSV | Disponible | ✅ |
| Errores visibles | Ninguno | ✅ |

---

## 4. Validación APIs críticas

**Método:** script en **DevTools Console** con **sesión activa** (origen: checklist §6 de `12O-post-dataset`).

| Resultado agregado | Valor |
|--------------------|-------|
| APIs críticas en **403** | **8 / 8** ✅ |
| APIs sensibles en **200/201** | **Ninguna** ✅ |

| Método | Endpoint | Status | Estado |
|--------|----------|--------|--------|
| GET | `/api/admin/config/roles` | **403** | ✅ |
| GET | `/api/admin/config/usuarios` | **403** | ✅ |
| GET | `/api/admin/users` | **403** | ✅ |
| POST | `/api/admin/config/reset-db` | **403** | ✅ |
| GET | `/api/admin/setup/minimal-seed` | **403** | ✅ |
| POST | `/api/admin/modules/initialize` | **403** | ✅ |
| POST | `/api/admin/config/usuarios/act-as` | **403** | ✅ |
| POST | `/api/admin/users/delete` | **403** | ✅ |

**Nota:** códigos `error` en JSON no se transcriben aquí; comportamiento equivalente a **12O-run** (403 en todas).

---

## 5. `permissions/me`

| Paso | Detalle |
|------|---------|
| Primer intento (script §6) | Flags mostraron **`undefined`** — estructura de respuesta distinta a la asumida en el script |
| Validación final | Comprobación adicional manual / ajuste de lectura del payload |

| Aspecto | Resultado | Estado |
|---------|-----------|--------|
| HTTP status | **200** | ✅ |
| `has_system_danger` | `false` | ✅ |
| `has_config_admin` | `false` | ✅ |
| `has_config_update` | `false` | ✅ |
| `has_config_read` | `false` | ✅ |
| `has_constructor` | `false` | ✅ |
| `has_roles` | `false` | ✅ |
| `has_users` | `false` | ✅ |

**Recomendación documental:** actualizar script del checklist para leer flags según forma real del JSON (sin cambiar código de producto en esta tarea).

---

## 6. Rutas internas bloqueadas

Navegación manual — una URL por vez.

| Ruta | Observado | Estado |
|------|-----------|--------|
| `/admin/constructor-crm` | **403 · Sin permisos** | ✅ |
| `/admin/constructor-crm/manual-cliente` | **403 · Sin permisos** | ✅ |
| `/admin/configuracion` | **403 · Sin permisos** | ✅ |

**Mensaje UI:** «403 · Sin permisos» — «No tenés permisos para acceder a esta sección.»

---

## 7. Menú `client_crm`

| Ítem | Estado |
|------|--------|
| **Visible:** Summer87 Leads, Agenda, Reportes | ✅ OK |
| **No visible:** Constructor, Configuración, Roles, Usuarios, Instalador, Paquetes | ✅ OK |

**Resultado sección:** ✅ **OK**

---

## 8. Comparación 12O-run vs 12O-post-dataset-run

| Control | 12O-run (pre-dataset) | 12O-post-dataset-run |
|---------|----------------------|----------------------|
| Menú reducido | ✅ | ✅ |
| Rutas internas 403 | ✅ 3/3 | ✅ 3/3 |
| APIs críticas 403 | ✅ 8/8 | ✅ 8/8 |
| `permissions/me` flags `false` | ✅ | ✅ |
| Dataset Demo en BD | ❌ no aplicado | ✅ 12 + 8 |
| Módulos con datos reales de negocio | Vacío / heredado | Demo ficticio visible |

**Conclusión:** la carga **12N** no reabrió superficie interna ni APIs críticas respecto al baseline **12O-run**.

---

## 9. Hallazgos conocidos (mantener)

| Hallazgo | Severidad |
|----------|-----------|
| Bloque **“Datos Casalimpia”** en formulario lead — no corresponde a Pickup 4x4 | ⚠️ UX |
| Todos los leads en **Nuevo lead** | ⚠️ Narrativa comercial limitada |
| Hub reportes con secciones **próximamente** | ⚠️ Esperado |
| **Supabase actual** — demo técnica, no clon separado | ⚠️ Riesgo datos heredados |
| Dataset ficticio **persiste** en BD usada por Vercel demo | ⚠️ Limpieza futura planificada |

---

## 10. Criterios GO / NO-GO

### GO (cumplido — demo interna post-dataset)

- ✅ Módulos operativos cargan con dataset visible
- ✅ Constructor / Configuración bloqueados (menú + rutas)
- ✅ **8/8** APIs críticas → **403**
- ✅ `permissions/me` **200** sin flags internas activas
- ✅ Sin errores persistentes en la sesión probada

### NO-GO (contextos excluidos — sin cambio)

- ❌ Cliente real / producción / preproducción sin Supabase separado y **12M Go/No-Go**
- ❌ Demo comercial pulida sin resolver UX Casalimpia (opcional)
- ❌ Multi-tenant / RLS final — no validados

---

## 11. Dictamen

> **GO técnico post-dataset** para **demo interna** `client_crm` en Vercel con dataset ficticio visible y controles de seguridad equivalentes a **12O-run**.  
> **NO-GO** para **cliente real**, **producción** o **preproducción** hasta resolver **Supabase separado** y/o **limpieza formal**, decisión **12M Go/No-Go** y ajuste UX **Datos Casalimpia** si se requiere una demo comercial más pulida.

---

## 12. Próximo paso recomendado

| Opción | Acción |
|--------|--------|
| **A** | Decidir corrección UX **Datos Casalimpia** (renombrar / ocultar por cliente-rubro) |
| **B** | Opcional: distribuir algunos leads a etapas ≠ **Nuevo lead** en UI |
| **C** | Preparar **12M Go/No-Go** demo interna con esta evidencia |
| **D** | **No** avanzar a cliente real sin Supabase separado o estrategia clara de limpieza / rollback |
| **E** | Mantener guía de limpieza: prefijo `Demo —`, origen `demo_12N_pickup4x4`, emails `@example.com` |

---

## 13. Lo que NO se validó

| Ítem | Motivo |
|------|--------|
| Producción / cliente real | Fuera de alcance |
| Supabase separado | No existe en este entorno |
| Multi-tenant / RLS final | Infra posterior |
| Kore / Zeta | Fuera de alcance |
| Subrutas Constructor (`paquetes`, `auditoria`, …) | Muestra representativa vía layout + manual-cliente |
| Network Agenda `owners` vs `users` | No re-ejecutado en esta sesión (OK en 12O-run) |
| Rotación de claves / rollback Vercel | No ejecutado |

---

## 14. Confirmación de alcance (esta tarea documental)

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| SQL ejecutado / creado | ❌ No |
| Supabase directo desde Cursor | ❌ No |
| Datos modificados durante esta validación | ❌ No |
| Carga de datos en esta sesión | ❌ No (dataset cargado previamente en **12N-impl-run**) |
| Endpoints / APIs / middleware | ❌ No modificados |
| Migraciones | ❌ No |
| Usuarios creados | ❌ No |
| Kore / Zeta | ❌ No |
| Commit desde Cursor | ❌ No |

---

*12O-post-dataset-run — ejecución registrada. Checklist: `validacion-post-dataset-vercel-client-crm-12O-post-dataset.md`. Carga dataset: `ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md`.*
