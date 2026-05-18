# Validación Integral Client CRM 12J-run (local) — Constructor CRM Summer87

**Versión:** 12J-run — ejecución manual local  
**Checklist origen:** `docs/constructor-crm/validacion-integral-client-crm-12J.md`  
**Hardening previo:** serie **12I** (commits `5570b31`, `060a2a9`, `d641f7c`, entre otros)

**Tipo de ejecución:** validación **runtime real** en desarrollo local con `APP_MODE=client_crm`.  
**Ámbito:** local (`http://localhost:3001`). **No** staging, **no** producción, **no** clon aislado.

**Fecha de ejecución:** documentada al cerrar 12J-run (sesión local del responsable).

---

## 2. Resumen ejecutivo

Se ejecutó el checklist **12J** en entorno local **`client_crm`** con módulos `leads87`, `agenda`, `reportes`. El resultado global fue **OK local**: menú operativo correcto, rutas operativas cargan, rutas internas devuelven **403**, APIs críticas probadas responden **403** con códigos alineados a 12I, Agenda usa **`/api/admin/agenda/owners`** y **no** llama a **`/api/admin/users`**, y **`permissions/me`** responde **200** con keys internas filtradas.

**Dictamen:** **GO técnico local** para avanzar a **12K** (runbook) y **12L** (preparación piloto), **condicionado** a repetir esta validación en **staging/clon** antes del primer cliente real.

**No implica:** listo para producción, seguridad completa ni multi-tenant resuelto.

---

## 3. Preflight

| Ítem | Resultado | Notas |
|------|-----------|-------|
| Repo limpio antes de iniciar | ✅ OK | Sin cambios no intencionales al arrancar |
| `npm run build` | ✅ OK | Next.js **16.0.11**, compilación correcta |
| Bloqueantes de build | ✅ Ninguno | Warnings no bloqueantes (ver abajo) |

### Warnings observados (no bloqueantes)

| Warning | Impacto en 12J-run |
|---------|-------------------|
| `baseline-browser-mapping` desactualizado | ⚠️ Informativo |
| Convención `middleware` deprecated (recomienda `proxy`) | ⚠️ Informativo |
| `DEP0205` — `module.register()` deprecated | ⚠️ Informativo |
| `AI DEBUG OPENAI_API_KEY presente: false` | ⚠️ Informativo; no afectó rutas probadas |

---

## 4. Entorno `client_crm` levantado

### Comando

```bash
APP_MODE=client_crm
CLIENT_SLUG=pickup4x4
CLIENT_NAME="Pickup 4x4"
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
npm run dev
```

### Resultado de arranque

| Aspecto | Valor |
|---------|--------|
| Puerto 3000 | Ocupado (proceso **31392**) |
| Puerto efectivo | **3001** |
| URL usada | `http://localhost:3001` |
| Ready | ~**460 ms** |
| `.env.local` | No modificado en esta ejecución |

---

## 5. Validación menú

Captura visual y navegación manual.

| Ítem menú | Esperado (12J) | Observado | Estado |
|-----------|----------------|-----------|--------|
| Summer87 Leads | Visible | Visible | ✅ |
| Agenda | Visible | Visible | ✅ |
| Reportes | Visible | Visible | ✅ |
| Constructor | No visible | No visible | ✅ |
| Configuración | No visible | No visible | ✅ |
| Roles / Usuarios | No visible | No visible | ✅ |
| Paquetes / Instalador | No visible | No visible | ✅ |
| Reset / Seed / Initialize | No visible | No visible | ✅ |

**Resultado sección:** ✅ **OK**

---

## 6. Rutas operativas (UI)

| Ruta | Resultado esperado | Observado | Estado |
|------|-------------------|-----------|--------|
| `/admin/dashboard` | Carga | Carga correctamente | ✅ |
| `/admin/leads` | Carga | Carga correctamente; contadores en **0** | ✅ |
| `/admin/agenda` | Carga | Carga; estado vacío sin acciones pendientes | ✅ |
| `/admin/reportes` | Carga | Hub con tabs/resumen | ✅ |

### Observaciones

- Contadores de leads en **0** — la página **no** falló; datos no representativos del piloto final.
- **No** se ejecutaron mutaciones ni creación/edición de datos en Leads/Agenda/Reportes.

| `/admin/personalizacion` | No ejecutado en esta sesión | ⬜ no probado |

**Resultado sección:** ✅ **OK** (alcance probado)

---

## 7. Validación Agenda / Network

DevTools → Network, recarga de `/admin/agenda`.

| Prueba | Esperado | Observado | Estado |
|--------|----------|-----------|--------|
| Filtro `users` | Sin `/api/admin/users` | No apareció la ruta | ✅ |
| Filtro `owners` | `GET /api/admin/agenda/owners` | Apareció; **200**; tipo **fetch**; iniciador `page.tsx` | ✅ |

**Conclusión:**

- Agenda **ya no depende** de `/api/admin/users`.
- Agenda **usa** `/api/admin/agenda/owners`.

**No validado en esta sesión:** apertura de modal de invitados, búsqueda de invitados, inspección del payload JSON de `users[]` (campos acotados).

**Resultado sección:** ✅ **OK** (criterios Network críticos)

---

## 8. Rutas UI internas bloqueadas

Prueba manual URL por URL (tras intento inicial con URLs concatenadas que generó **404** por URL inválida — **no** contabilizado como fallo de app).

| Ruta | Esperado | Observado | Estado |
|------|----------|-----------|--------|
| `/admin/configuracion` | `/403` | Pantalla **403 · Sin permisos** | ✅ |
| `/admin/configuracion/usuarios` | `/403` | Idem | ✅ |
| `/admin/constructor-crm` | `/403` | Idem | ✅ |

**Mensaje UI:** «403 · Sin permisos» — «No tenés permisos para acceder a esta sección.»

### Rutas del checklist 12J no probadas en esta sesión

| Ruta | Estado |
|------|--------|
| `/admin/constructor-crm/auditoria` | ⬜ no probado |
| `/admin/constructor-crm/paquetes` | ⬜ no probado |
| `/admin/configuracion/roles` | ⬜ no probado |
| `/admin/configuracion/roles/[id]` | ⬜ no probado |
| `/admin/configuracion/modulos-menu` | ⬜ no probado |
| `/admin/configuracion/ia` | ⬜ no probado |
| `/admin/configuracion/pipelines` | ⬜ no probado |

**Resultado sección:** ✅ **OK** (muestra representativa + layout configuración/constructor)

---

## 9. APIs críticas bloqueadas

`fetch` desde consola del navegador **con sesión activa**. Ocho endpoints probados.

| Método | Endpoint | Status | `error` observado | Estado |
|--------|----------|--------|-------------------|--------|
| GET | `/api/admin/config/roles` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/config/usuarios` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/users` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/config/reset-db` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/setup/minimal-seed` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/modules/initialize` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/config/usuarios/act-as` | 403 | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/users/delete` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ✅ |

### APIs del checklist 12J no ejecutadas en esta sesión

| Grupo | Ejemplos | Estado |
|-------|----------|--------|
| Constructor API | `GET .../constructor/installable-package/drafts`, `POST .../assist` | ⬜ no probado |
| Roles escritura | `POST toggle-permission`, `POST/PATCH config/roles` | ⬜ no probado |
| Usuarios mutantes adicionales | `invite`, `toggle-active`, `resend-invite` | ⬜ no probado |
| Portal PATCH | sanitización `sidebar_modules` | ⬜ no probado (requiere staging) |

**Resultado sección:** ✅ **OK** (muestra crítica de 8 endpoints)

---

## 10. `permissions/me`

```javascript
// Ejecutado en consola con sesión activa
GET /api/admin/permissions/me
```

| Aspecto | Resultado | Estado |
|---------|-----------|--------|
| HTTP status | **200** | ✅ |
| Keys internas filtradas (flags de verificación) | Ver tabla | ✅ |

| Flag / ausencia esperada | Valor observado |
|--------------------------|-----------------|
| `has_system_danger` | `false` |
| `has_config_admin` | `false` |
| `has_config_update` | `false` |
| `has_config_read` | `false` |
| `has_constructor` | `false` |
| `has_roles` | `false` |
| `has_users` | `false` |

**Resultado sección:** ✅ **OK**

---

## 11. Lo que NO se validó

| Ítem | Motivo / alcance |
|------|------------------|
| Staging o clon real | Solo local |
| Producción / Vercel | Fuera de alcance |
| RLS definitivo | Infra posterior |
| `tenant` / `company_id` real | No probado |
| Creación/edición de leads | Sin mutaciones |
| Creación/edición de agenda | Sin mutaciones |
| Importación masiva | No ejecutada |
| Generación IA / Gamma | No ejecutada |
| Envío de emails | No ejecutado |
| Integración Zeta / Kore | No ejecutado |
| Limpieza de datos heredados | Fase 12N |
| Instalación CRM real para cliente | Fase 12K |
| Subconjunto extendido de rutas UI §8 del checklist | No todas las URLs |
| Subconjunto extendido de APIs §8 del checklist | Solo 8 endpoints |
| Modal invitados Agenda (payload `users`) | No documentado en sesión |
| `/admin/personalizacion` | No probado |

---

## 12. Riesgos residuales

| Riesgo | Severidad | Nota |
|--------|-----------|------|
| Prueba solo en entorno local actual | ⚠️ Alta | Repetir en staging/clon antes de piloto |
| `/api/admin/agenda/owners` sin revisión `tenant`/`company_id` | ⚠️ Media | Post-piloto |
| Datos en 0 / heredados no representativos | ⚠️ Media | 12N semilla/limpieza |
| `permissions/me` filtrado server-side vs mapa estático UI | ⚠️ Baja | Cruzar en staging |
| Runbook instalación **12K** pendiente | ⚠️ Media | Bloqueante operativo piloto |
| Preparación piloto **12L** pendiente | ⚠️ Media | |
| Checklist go/no-go **12M** pendiente | ⚠️ Media | |
| Limpieza/semilla datos **12N** pendiente | ⚠️ Media | |

---

## 13. Dictamen

### Decisión

> **GO técnico local** para avanzar a **12K** (runbook instalación `client_crm`) y **12L** (preparación piloto), **condicionado** a repetir esta validación en **staging/clon** antes del **primer cliente real**.

### Lo que NO afirma este dictamen

| Afirmación | Estado |
|------------|--------|
| Listo para producción | ❌ No |
| Seguridad completa | ❌ No |
| Multi-tenant resuelto | ❌ No |
| Todas las filas del checklist 12J ejecutadas | ❌ No — muestra representativa + ítems críticos |

### Criterios Go del checklist 12J — estado local

| Criterio | Local 12J-run |
|----------|---------------|
| Menú correcto | ✅ |
| Operativos cargan | ✅ |
| Internos → `/403` (muestra) | ✅ |
| APIs críticas (muestra 8) → 403 | ✅ |
| Agenda sin `/api/admin/users` | ✅ |
| `permissions/me` filtrado | ✅ |
| Build OK (preflight) | ✅ |
| Sin datos internos visibles en prueba manual | ✅ (con datos en 0) |
| Staging/clon | ⬜ pendiente |

---

## 14. Evidencias capturadas (sesión)

| Evidencia | Estado |
|-----------|--------|
| Captura menú `client_crm` | ✅ referenciada en ejecución |
| Capturas rutas operativas | ✅ dashboard, leads, agenda, reportes |
| Captura `/403` configuración / constructor | ✅ |
| Network Agenda (sin `users`, con `owners`) | ✅ |
| Consola `fetch` APIs (8 endpoints) | ✅ |
| `permissions/me` flags | ✅ |
| Adjunto formal en ticket/repositorio de evidencias | ⬜ opcional — responsable |

---

## 15. Estado final

| Ítem | Estado |
|------|--------|
| Dev `client_crm` local | ✅ Validado |
| Código funcional modificado | ❌ No |
| Datos modificados | ❌ No |
| SQL ejecutado | ❌ No |
| Supabase tocado manualmente | ❌ No |
| Commits realizados | ❌ No |
| **Resultado global 12J-run local** | ✅ **OK local** |

---

## 16. Confirmación de alcance (documental 12J-run)

- ✅ Resultados runtime locales documentados según ejecución real descrita  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL en esta fase documental  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints ni se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12J-run-local — resultados de validación integral en `http://localhost:3001`. Complementa `validacion-integral-client-crm-12J.md`. Próximo paso recomendado: repetir checklist en staging/clon y cerrar **12M**.*
