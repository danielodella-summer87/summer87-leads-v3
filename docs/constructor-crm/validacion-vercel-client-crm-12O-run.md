# Validación Vercel Client CRM 12O-run — Constructor CRM Summer87

**Versión:** 12O-run — ejecución real en Vercel (demo interna)  
**Checklist origen:** `docs/constructor-crm/validacion-staging-clon-client-crm-12O.md`  
**Referencia local:** `docs/constructor-crm/validacion-integral-client-crm-12J-run-local.md`  
**Preparación:** `preparacion-entorno-staging-clon-client-crm-12O-prep.md`, `decision-entorno-vercel-client-crm-12O-prep-run.md`

**Tipo de ejecución:** validación **runtime real** en Vercel con `APP_MODE=client_crm` (demo interna Pickup 4x4).  
**Ámbito:** `https://pickup4x4-crm-demo.vercel.app`. **No** producción, **no** piloto con cliente final.

---

## 2. Resumen ejecutivo

Se ejecutó **12O-run** en un entorno **temporal Vercel** (`pickup4x4-crm-demo`) desplegado desde `main` en commit **`8bead8c`**, replicando el alcance crítico de **12J-run** (menú, rutas operativas, `/403` internas, 8 APIs críticas, Agenda/owners, `permissions/me`).

| Resultado global | Detalle |
|----------------|---------|
| Deploy | Primer intento falló por `NEXT_PUBLIC_SUPABASE_URL` inválida; corregido; segundo deploy **OK** |
| Menú `client_crm` | ✅ Leads, Agenda, Reportes visibles; fábrica oculta |
| Rutas internas | ✅ `/403` en Constructor, manual-cliente, Configuración |
| APIs críticas | ✅ **8/8** → **403** |
| Agenda Network | ✅ Sin `/api/admin/users`; con `/api/admin/agenda/owners` **200** |
| `permissions/me` | ✅ **200**; flags internas en `false` |

**Dictamen:** **GO técnico en Vercel demo interna** para `client_crm`, **condicionado** a resolver **dataset 12N** y **aislamiento Supabase** antes de preproducción o cliente real.

**No implica:** listo para producción, seguridad completa, multi-tenant/RLS resueltos ni aprobación de piloto con cliente.

---

## 3. Identificación del entorno

| Campo | Valor registrado |
|-------|------------------|
| **Hosting** | Vercel |
| **Proyecto Vercel** | `pickup4x4-crm-demo` |
| **Repositorio** | `danielodella-summer87/summer87-leads-v3` |
| **Branch** | `main` |
| **Commit SHA desplegado** | `8bead8c` |
| **URL pública** | `https://pickup4x4-crm-demo.vercel.app` |
| **Tipo** | Demo interna / preview-staging **temporal** |
| **Cliente referencia** | Pickup 4x4 |
| **Slug esperado** | `pickup4x4` |
| **Supabase** | Proyecto **actual** — solo **demo técnica** (no clon separado) |
| **Usuario de prueba** | Daniel / usuario actual |
| **Dataset** | Datos actuales o vacío; **12N ficticio no aplicado formalmente** |
| **APP_MODE esperado** | `client_crm` |
| **CLIENT_VISIBLE_MODULES esperado** | `leads87,agenda,reportes` |

Variables confirmadas en panel Vercel (**sin** registrar secretos en este documento).

---

## 4. Deploy y preflight

| Ítem | Resultado | Estado |
|------|-----------|--------|
| Primer deploy | Falló: `NEXT_PUBLIC_SUPABASE_URL` inválida (valor mal cargado o no reconocido como URL HTTP/HTTPS) | ⚠️ corregido |
| Variables ENV en Vercel | Corregidas tras primer fallo | ✅ |
| Revisión `SUPABASE_SERVICE_ROLE_KEY` | Posible **espacio final** detectado en revisión; indicado corregir key exacta en panel | ⚠️ verificar |
| Segundo deploy | Terminó **OK** | ✅ |
| Pantalla login | Cargó correctamente | ✅ |
| Build previo local (12Q-impl-1 / bloque pre-piloto) | Referencia histórica OK; no re-ejecutado en esta sesión | — |

**Nota operativa:** no pegar valores de variables en evidencias ni en este doc.

---

## 5. Menú y navegación

URL base probada: `https://pickup4x4-crm-demo.vercel.app/admin/dashboard`

| Ítem menú | Esperado (12O) | Observado | Estado |
|-----------|----------------|-----------|--------|
| Summer87 Leads | Visible | Visible | ✅ |
| Agenda | Visible | Visible | ✅ |
| Reportes | Visible | Visible | ✅ |
| Constructor | No visible | No visible | ✅ |
| Configuración | No visible | No visible | ✅ |
| Roles / Usuarios | No visible | No visible | ✅ |
| Paquetes / Instalador | No visible | No visible | ✅ |
| Reset / Seed / Initialize | No visible | No visible | ✅ |
| Dashboard | Carga | Cargó correctamente | ✅ |

**Resultado sección:** ✅ **OK**

---

## 6. Rutas operativas (UI)

| Ruta | Resultado esperado | Observado | Estado |
|------|-------------------|-----------|--------|
| `/admin/dashboard` | Carga | Carga correctamente | ✅ |
| `/admin/leads` / leads87 | Carga | Incluido en recorrido menú operativo | ✅ |
| `/admin/agenda` | Carga | Carga correctamente (§7) | ✅ |
| `/admin/reportes` | Carga | Visible en menú; recorrido operativo | ✅ |

Contadores en **0** o datos heredados/vacíos **no** invalidan OK de carga si no hay error runtime (coherente con **12J-run**).

**Mutaciones** (crear/editar leads o agenda): **no** ejecutadas en esta sesión (§9).

---

## 7. Rutas internas bloqueadas

Prueba manual URL por URL con sesión activa.

| Ruta | Esperado | Observado | Estado |
|------|----------|-----------|--------|
| `/admin/constructor-crm` | `/403` | Pantalla **403 · Sin permisos** | ✅ |
| `/admin/constructor-crm/manual-cliente` | `/403` | Idem | ✅ |
| `/admin/configuracion` | `/403` | Idem | ✅ |

**Mensaje UI:** «403 · Sin permisos» — «No tenés permisos para acceder a esta sección.»

Alineado con **12J-run** local y **12Q-impl-1V**.

**Resultado sección:** ✅ **OK**

---

## 8. Validación Agenda / Network

DevTools → Network en `/admin/agenda`.

| Prueba | Esperado | Observado | Estado |
|--------|----------|-----------|--------|
| Filtro `users` | Sin `/api/admin/users` | No apareció la ruta | ✅ |
| Filtro `owners` | `GET /api/admin/agenda/owners` | Apareció; **200**; tipo **fetch** | ✅ |

**Resultado sección:** ✅ **OK**

---

## 9. APIs críticas bloqueadas

`fetch` desde consola del navegador **con sesión activa** en Vercel. Resumen consola: **8/8 en 403** ✅.

| Método | Endpoint | Status | Código error (observado) | Estado |
|--------|----------|--------|--------------------------|--------|
| GET | `/api/admin/config/roles` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/config/usuarios` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/users` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/config/reset-db` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| GET | `/api/admin/setup/minimal-seed` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/modules/initialize` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/config/usuarios/act-as` | 403 | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` | ✅ |
| POST | `/api/admin/users/delete` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ✅ |

### APIs no ejecutadas en esta sesión

| Grupo | Estado |
|-------|--------|
| Constructor API (`/api/admin/constructor/*`) | ⬜ no probado |
| Roles escritura / portal PATCH | ⬜ no probado |
| Usuarios `invite`, `toggle-active`, etc. | ⬜ no probado |

**Resultado sección:** ✅ **OK** (muestra crítica 8 endpoints)

---

## 10. `permissions/me`

```text
GET /api/admin/permissions/me
```

| Aspecto | Resultado | Estado |
|---------|-----------|--------|
| HTTP status | **200** | ✅ |
| Flags internas sensibles | Ver tabla | ✅ |

| Flag | Valor observado |
|------|-----------------|
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
| Producción | Fuera de alcance |
| Cliente real / piloto de valor | Solo demo interna |
| Supabase **separado** | Decisión 12O-prep-run: proyecto actual |
| Dataset **12N ficticio** aplicado formalmente | Pendiente |
| Preproducción (**12P-run**) | Siguiente decisión |
| RLS definitiva | Infra posterior |
| Multi-tenant final | No resuelto |
| Creación/edición **leads** | Sin mutaciones |
| Creación/edición **agenda** | Sin mutaciones |
| Importación masiva | No ejecutada |
| IA / Gamma | No ejecutada |
| Envío de **emails** | No ejecutado |
| **Zeta / Kore** | Fuera de alcance |
| **Rollback** real en Vercel | No probado |
| Rotación de claves | No ejecutada en esta tarea |
| Limpieza base actual | No ejecutada |
| Subrutas Constructor (`paquetes`, `auditoria`, …) | Muestra representativa suficiente vía layout + manual-cliente |

---

## 12. Riesgos y notas de seguridad

| Riesgo / nota | Detalle |
|---------------|---------|
| Supabase **actual** | Solo demo técnica; puede arrastrar **datos heredados** o vacío |
| Presentación al cliente | **No** mostrar como producción ni piloto de valor |
| Preproducción | Recomendado **Supabase separado** o limpieza formal **12N** antes de avanzar |
| Exposición de secretos | Durante el proceso se **visualizaron parcialmente** variables sensibles en capturas/comando local; tratar entorno como **demo interna** |
| Rotación de claves | Si capturas salieron **fuera del equipo**, conviene **rotar claves en Supabase** |
| `RESET_DB_TOKEN` | **No** agregar en Vercel |
| `APP_MODE` | Mantener **`client_crm`** en este proyecto demo |
| ENV typo | Primer fallo por URL inválida y posible espacio en service role — revisar panel tras cada cambio |

---

## 13. Criterios GO / NO-GO (12O)

### Checklist §18 12O — resultado

| Criterio | Estado |
|----------|--------|
| Build / deploy OK (tras corrección ENV) | ✅ |
| Variables `client_crm` en Vercel (confirmación interna) | ✅ |
| Menú correcto | ✅ |
| Rutas operativas cargan | ✅ |
| Rutas internas bloquean | ✅ |
| APIs críticas bloquean (8/8) | ✅ |
| Agenda usa **owners** | ✅ |
| `permissions/me` filtrado | ✅ |
| Datos seguros **o** demo técnica documentada | ⚠️ Demo técnica con Supabase actual — **no** dataset 12N formal |
| Sin secretos en evidencias públicas | ⚠️ Riesgo por exposición parcial — ver §12 |
| Plan rollback conceptual | ⚠️ No probado en Vercel; ver **12P** |

### Bloqueantes NO-GO — no observados en runtime

| Bloqueante | Estado |
|------------|--------|
| Menú muestra Constructor / Configuración | ❌ no ocurrió |
| `GET /api/admin/users` → 200 | ❌ no ocurrió |
| system_danger / reset / initialize ≠ 403 | ❌ no ocurrió |
| Rutas internas cargan sin 403 | ❌ no ocurrió |

---

## 14. Dictamen

> **GO técnico en Vercel demo interna** para `client_crm`, **condicionado** a resolver **dataset 12N** y **aislamiento Supabase** antes de **preproducción** o **cliente real**.

| Afirmación | Permitido | Prohibido |
|------------|-----------|-----------|
| Hardening `client_crm` se comporta en Vercel como en local | ✅ | |
| Listo para **producción** | | ❌ |
| **Seguridad completa** | | ❌ |
| **Multi-tenant** resuelto | | ❌ |
| **Cliente real** aprobado | | ❌ |
| **RLS** final | | ❌ |

**Relación 12M:** habilita actualizar matriz hacia **GO condicionado** en entorno Vercel demo; **no** GO productivo sin **12N** + decisión comercial.

---

## 15. Próximo paso recomendado

| Orden | Acción |
|-------|--------|
| 1 | Mantener URL solo **demo interna** hasta nueva decisión |
| 2 | Archivar evidencias (capturas menú, 403, consola 8/8) sin secretos |
| 3 | Definir **12N real** o aplicación formal de **12N ficticio** |
| 4 | Evaluar **Supabase separado** o limpieza antes de **12P-run** preproducción |
| 5 | Completar **12M** con evidencia de este documento si se acerca piloto |
| 6 | **12P-run** solo tras GO explícito + dataset + aislamiento |
| 7 | **12R-run** (feedback) solo si se abre a usuarios cliente |

---

## 16. Registro plantilla 12O §20 (completado)

```text
Cliente:                 Pickup 4x4
Slug:                    pickup4x4
Entorno:                 [x] staging/preview demo  [ ] clon definitivo
URL:                     https://pickup4x4-crm-demo.vercel.app
Commit SHA:              8bead8c
Fecha:                   (sesión 12O-run Vercel)
Responsable:             Daniel
Dataset:                 Actual/vacío; 12N ficticio pendiente formal

Variables confirmadas:   [x] Sí (panel Vercel, sin secretos en doc)
Build/deploy:            [x] OK (tras corrección URL Supabase)
Menú:                    [x] OK
Rutas operativas:        [x] OK
Rutas bloqueadas:        [x] OK
APIs críticas:           [x] OK (8/8)
Agenda owners:           [x] OK
permissions/me:          [x] OK
Datos:                   [x] Demo técnica  [ ] 12N aplicado

Riesgos observados:      Supabase compartido; posible exposición parcial de keys en proceso
Dictamen:                [x] GO condicionado  [ ] NO-GO
Evidencias:              Capturas/consola interna (sin secretos públicos)
Pendientes:              12N, Supabase separado, 12P-run, rotación keys si aplica
```

---

## 17. Confirmación de alcance (esta tarea documental)

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| Datos | **No** modificados |
| SQL | **No** ejecutado desde esta tarea |
| Supabase | **No** tocado desde esta tarea (solo uso vía app desplegada) |
| Usuarios | **No** creados |
| Migraciones | **No** |
| Kore / Zeta | **No** tocados |
| Commits | **No** realizados al crear este documento |
| Entregable | Solo `validacion-vercel-client-crm-12O-run.md` |

---

*Documento 12O-run Vercel — evidencia demo interna `client_crm`. Base: 12J-run local. Condicionante: 12N + Supabase antes de preprod/cliente.*
