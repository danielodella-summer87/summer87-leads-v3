# Validación Staging / Clon Client CRM 12O — Constructor CRM Summer87

**Versión:** Fase 12O (validación en entorno aislado — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `validacion-integral-client-crm-12J.md` | Checklist integral (plantilla) |
| `validacion-integral-client-crm-12J-run-local.md` | Evidencia local de referencia |
| `runbook-instalacion-client-crm-12K.md` | Instalación y smoke tests |
| `preparacion-piloto-primer-cliente-12L.md` | Alcance piloto |
| `checklist-go-no-go-primer-cliente-12M.md` | Dictamen GO condicionado a 12O |
| `limpieza-semilla-datos-piloto-12N.md` | Dataset y criterios de datos |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV clon |

**Estado:** procedimiento **documentado**. **No** constituye staging/clon creado, validación ejecutada ni aprobación de producción.

**Ejecución operativa:** fase **12O-run** (completar plantilla §20 tras prueba real).

### Diferencia respecto a 12N

| Fase | Archivo | Propósito |
|------|---------|-----------|
| **12N** | `limpieza-semilla-datos-piloto-12N.md` | **Qué datos** cargar o limpiar para el piloto (plan de dataset) |
| **12O** | **Este documento** | **Cómo validar** `client_crm` en staging/clon con evidencia (repetir 12J fuera de local) |

---

## 2. Resumen ejecutivo

**12O** define **cómo repetir** la validación **`APP_MODE=client_crm`** en un entorno **aislado** (staging o clon), más cercano al piloto real que la prueba **local** documentada en **12J-run**.

### Qué hace 12O

| Función | Detalle |
|---------|---------|
| Replicar | Checklists 12J en URL/hosting controlado |
| Auditar | Menú, rutas, APIs, Agenda, `permissions/me`, datos |
| Evidenciar | Capturas y registro §20 para comité / 12M |

### Qué no hace 12O

| Limitación | Detalle |
|------------|---------|
| Crear staging/clon | Infra / DevOps del equipo |
| Instalar datos | **12N** / **12N-impl** |
| Ejecutar SQL | Fuera de alcance |
| Habilitar producción | Fase **12P** |
| Sustituir seguridad completa | Capa `APP_MODE` + guards; no RLS final |

### Obligatoriedad

Es paso **obligatorio** antes de mostrar el piloto a un **cliente real**, salvo decisión explícita documentada de riesgo aceptado (no recomendado).

---

## 3. Objetivo de 12O

Al completar **12O-run**, el responsable debe poder afirmar con evidencia que:

| # | Objetivo |
|---|----------|
| 1 | `APP_MODE=client_crm` funciona **fuera** del dev local |
| 2 | El **menú** permanece reducido según `CLIENT_VISIBLE_MODULES` |
| 3 | Rutas **internas** siguen bloqueadas (`/403`) |
| 4 | **APIs críticas** devuelven **403** con códigos 12I |
| 5 | Módulos **operativos** cargan (Leads, Agenda, Reportes) |
| 6 | **Agenda** usa `/api/admin/agenda/owners` y **no** `/api/admin/users` |
| 7 | **`permissions/me`** filtra keys internas (200, sin `system.danger`, etc.) |
| 8 | El entorno **no** apunta accidentalmente a **base madre** si no corresponde |
| 9 | Existe **paquete de evidencias** auditable (§17) |

---

## 4. Diferencia entre local, staging y clon

| Entorno | Propósito | Riesgo principal | Uso recomendado |
|---------|-----------|------------------|-----------------|
| **Local** | Validación técnica rápida (`npm run dev`) | Puerto/ENV de sesión; no representa deploy | **12J-run** — primera señal |
| **Staging** | Validación semi-real con URL y hosting controlados | Variables mal configuradas en panel | **12O-run** — antes de cliente |
| **Clon** | Instancia cercana al cliente con dataset controlado | Mezcla de datos si Supabase compartido | **12O-run** + **12N** |
| **Producción** | Operación live | Alto | **Fuera de alcance 12O** |

---

## 5. Precondiciones

Marcar antes de iniciar **12O-run**:

- [ ] Serie **12I** cerrada (hardening documentado).
- [ ] **12J-run** local **OK** (`validacion-integral-client-crm-12J-run-local.md`).
- [ ] Runbook **12K** leído por quien despliega/valida.
- [ ] **12L** definido (alcance, usuarios, guion).
- [ ] **12M** con **GO condicionado** (no GO productivo sin 12O).
- [ ] **12N** definido o **dataset piloto aprobado** (plantilla §19 de 12N).
- [ ] Entorno elegido: **staging** o **clon**.
- [ ] **URL** definida y accesible para validadores.
- [ ] **Commit SHA** anotado.
- [ ] Variables `client_crm` definidas en hosting (§6).
- [ ] **Fuente de datos** documentada.
- [ ] **Responsable Summer87** y **responsable de validación** asignados.
- [ ] **No** usar datos sensibles no autorizados.
- [ ] **No** apuntar a base madre salvo validación explícita y segura.
- [ ] **Plan de rollback** definido (12K §18 + §20 de este doc).

| Precondiciones | ☐ OK / ☐ Pendiente |
|----------------|-------------------|

---

## 6. Variables esperadas en staging/clon

> **No** registrar secretos en este documento ni en capturas. Confirmar valores desde panel del hosting / gestor de secretos.

| Variable | Ejemplo (no secreto) | Estado 12O-run | Observación |
|----------|----------------------|----------------|-------------|
| `APP_MODE` | `client_crm` | ⬜ | Si falta → default **`constructor_base`** — **riesgo crítico** |
| `CLIENT_SLUG` | `pickup4x4` | ⬜ | Trazabilidad |
| `CLIENT_NAME` | `Pickup 4x4` | ⬜ | UX / títulos |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` | ⬜ | Allowlist menú |
| `NEXT_PUBLIC_SUPABASE_URL` | *(proyecto staging/clon)* | ⬜ | Debe ser proyecto **correcto** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(configurado)* | ⬜ | No capturar en evidencias |
| `SUPABASE_SERVICE_ROLE_KEY` | *(server only)* | ⬜ | Nunca en cliente/browser |
| `OPENAI_API_KEY` | — | ⬜ opcional | No requerido piloto básico |
| `RESEND_API_KEY` | — | ⬜ opcional | No requerido sin emails |
| `RESET_DB_TOKEN` | — | ⬜ N/A cliente | **No** exponer; no usar en clon cliente |

Alias `SUMMER87_*` admitidos según `checklist-env-clon-client-crm-12G.md`.

---

## 7. Identificación del entorno

Completar al inicio de **12O-run** (sin secretos):

```text
Cliente:              _______________________________
Slug:                 _______________________________
Entorno:              [ ] staging  [ ] clon
URL:                  _______________________________
Hosting:              _______________________________
Supabase project:     _______________________________  (nombre/id, no keys)
Base de datos:        _______________________________  (ref. lógica / schema)
Commit SHA:           _______________________________
Fecha:                _______________________________
Responsable:          _______________________________
Módulos visibles:     leads87,agenda,reportes
Dataset:              [ ] 12N aprobado  [ ] demo técnica  [ ] pendiente
Origen datos:         _______________________________
Nivel sensibilidad:   [ ] bajo  [ ] medio  [ ] alto — justificar
Observaciones:        _______________________________
```

**Estado documental 12O:** plantilla **sin completar** — no implica entorno creado.

---

## 8. Checklist de despliegue / arranque (conceptual)

Sin comandos específicos de Vercel u otro host salvo los ya definidos por el equipo.

| Paso | ☐ OK | ☐ N/A | Notas |
|------|------|-------|-------|
| Confirmar **branch** y **commit** desplegado | | | |
| Configurar variables §6 en hosting | | | |
| Confirmar **`npm run build`** OK en CI o local previo | | | |
| Confirmar **URL** accesible (HTTPS si aplica) | | | |
| Confirmar **login** / sesión de usuario piloto | | | |
| Confirmar **no** hay secretos en UI, HTML ni logs compartidos | | | |
| Revisar logs: **sin** errores críticos persistentes al arranque | | | |
| Confirmar procedimiento de **vuelta atrás** (rollback) | | | |

---

## 9. Validación visual — menú

| Ítem | Esperado | Evidencia | Estado |
|------|----------|-----------|--------|
| Summer87 Leads / Leads | Visible | Captura menú | ⬜ |
| Agenda | Visible | Captura | ⬜ |
| Reportes | Visible | Captura | ⬜ |
| Constructor | **No** visible | Captura | ⬜ |
| Configuración | **No** visible | Captura | ⬜ |
| Roles / Usuarios | **No** visible | Captura | ⬜ |
| Paquetes / Instalador | **No** visible | Captura | ⬜ |
| BCR | **No** visible | Captura | ⬜ |
| Reset / Seed / Initialize | **No** visible | Captura | ⬜ |
| IA | **No** visible si no contratada | Captura | ⬜ |
| Mesa de ayuda | **No** visible si no contratada | Captura | ⬜ |

**Regla:** módulo **no** contratado → **no** es falla que no aparezca. Módulo **no** contratado que **sí** aparece → **alerta** (revisar `CLIENT_VISIBLE_MODULES` y `portal_config`).

---

## 10. Validación rutas operativas

| Ruta | Esperado | Evidencia | Estado |
|------|----------|-----------|--------|
| `/admin/dashboard` | Carga | Captura | ⬜ |
| `/admin/leads` o `/admin/leads87` | Carga | Captura + Network | ⬜ |
| `/admin/agenda` | Carga | Captura + Network | ⬜ |
| `/admin/reportes` | Carga | Captura | ⬜ |

### Opcionales (solo si contrato / 12L lo incluye)

| Ruta | Estado | Nota |
|------|--------|------|
| `/admin/personalizacion` | ⬜ N/A / ⬜ OK / ⬜ Falla | |
| `/admin/mesa-de-ayuda` | ⬜ N/A / ⬜ OK / ⬜ Falla | |
| `/admin/ia` | ⬜ N/A / ⬜ OK / ⬜ Falla | |

---

## 11. Validación rutas bloqueadas

Esperado: **`/403`** o pantalla «Sin permisos» / «No tenés permisos para acceder a esta sección.»

Probar **una URL por vez**.

| Ruta | Esperado | Evidencia | Estado |
|------|----------|-----------|--------|
| `/admin/configuracion` | `/403` | Captura | ⬜ |
| `/admin/configuracion/usuarios` | `/403` | Captura | ⬜ |
| `/admin/configuracion/roles` | `/403` | Captura | ⬜ |
| `/admin/configuracion/modulos-menu` | `/403` | Captura | ⬜ |
| `/admin/constructor-crm` | `/403` | Captura | ⬜ |
| `/admin/constructor-crm/auditoria` | `/403` | Captura | ⬜ |
| `/admin/constructor-crm/paquetes` | `/403` | Captura | ⬜ |

---

## 12. Validación APIs críticas

Ejecutar con **sesión activa** en la URL de staging/clon. **Solo** probar mutantes esperando **403**.

```javascript
async function probe(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });
  const body = await r.json().catch(() => null);
  return { url, status: r.status, error: body?.error };
}
```

| Método | Endpoint | Status | `error` esperado | Estado |
|--------|----------|--------|------------------|--------|
| GET | `/api/admin/config/roles` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ |
| GET | `/api/admin/config/usuarios` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ |
| GET | `/api/admin/users` | 403 | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` | ⬜ |
| POST | `/api/admin/config/reset-db` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ |
| GET | `/api/admin/setup/minimal-seed` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ |
| POST | `/api/admin/modules/initialize` | 403 | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` | ⬜ |
| POST | `/api/admin/config/usuarios/act-as` | 403 | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` | ⬜ |
| POST | `/api/admin/users/delete` | 403 | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` | ⬜ |

**Regla crítica:** si **cualquier** endpoint destructivo **no** devuelve 403 → **NO-GO** inmediato.

**No** ejecutar mutantes esperando éxito.

---

## 13. Validación Agenda

| Ítem | Esperado | Evidencia | Estado |
|------|----------|-----------|--------|
| `/admin/agenda` carga | Sin error persistente | Captura | ⬜ |
| Network: **no** `/api/admin/users` | Ausente al recargar | Network | ⬜ |
| Network: **sí** `/api/admin/agenda/owners` | Status **200** | Network | ⬜ |
| Payload `data.users[]` | Sin `role_id` ni permisos en JSON | DevTools (opcional) | ⬜ |
| Modal invitados | Abre si se prueba | Captura | ⬜ opcional |
| Crear actividades reales | **No** salvo autorización | — | ⬜ N/A |

**Referencia local:** 12J-run validó owners 200 y ausencia de `users`.

---

## 14. Validación `permissions/me`

| Criterio | Esperado | Estado |
|----------|----------|--------|
| `GET /api/admin/permissions/me` | **200** | ⬜ |
| Endpoint bloqueado | **No** (filtrado) | ⬜ |

### Keys / patrones que **no** deben aparecer

| Tipo | Valores |
|------|---------|
| Exactas | `system.danger`, `config.admin`, `config.update`, `config.read` |
| Patrones | `constructor`, `roles`, `users`, `permissions`, `danger` (y resto según 12I-impl-5V) |

Registrar flags de verificación o muestra del array en evidencias (sin tokens de sesión).

---

## 15. Validación datos piloto

Depende de **12N** y estado del dataset en staging/clon.

| Ítem | Estado |
|------|--------|
| Dataset **identificado** (plantilla 12N §19) | ⬜ |
| Datos **ficticios** o **autorizados** | ⬜ |
| **No** hay datos de otro cliente | ⬜ |
| **No** hay sensibles no autorizados | ⬜ |
| Leads: ejemplos **suficientes** para demo | ⬜ |
| Agenda: actividades si piloto requiere valor | ⬜ |
| Reportes: **no** rotos por vacío total | ⬜ |
| Dataset **explicable** al cliente | ⬜ |
| Si todo en **0**: documentado como **demo técnica**, no piloto de valor | ⬜ |

---

## 16. Validación seguridad visual

| Ítem | Estado |
|------|--------|
| No aparecen nombres Summer87 internos salvo marca acordada | ⬜ |
| No aparecen **usuarios internos** en listados cliente | ⬜ |
| No aparecen pantallas de **fábrica** | ⬜ |
| No aparecen botones **reset / seed / initialize** | ⬜ |
| No aparecen botones **invitar / borrar** usuarios | ⬜ |
| No aparecen enlaces a **Configuración** | ⬜ |
| No hay errores con **stack traces** o secretos en UI | ⬜ |

---

## 17. Evidencias obligatorias

Archivar en carpeta/ticket del piloto (sin secretos):

- [ ] Captura **URL/entorno** (barra de direcciones, sin query tokens sensibles)
- [ ] Menú `client_crm`
- [ ] Dashboard (si aplica)
- [ ] Leads
- [ ] Agenda
- [ ] Reportes
- [ ] `/403` Configuración
- [ ] `/403` Constructor
- [ ] Network **`/api/admin/agenda/owners`**
- [ ] Network **ausencia** `/api/admin/users`
- [ ] Resultados **`fetch`** APIs §12 (tabla o consola)
- [ ] **`permissions/me`** filtrado
- [ ] `git status` repo local (si aplica) + **commit SHA**
- [ ] Registro **dataset** (12N §19)
- [ ] **Dictamen** final §20

---

## 18. Criterios GO staging/clon

**GO 12O-run** si **todos** aplican:

| Criterio | ☐ |
|----------|---|
| Build / deploy OK | |
| Variables §6 correctas (`APP_MODE=client_crm`) | |
| Menú correcto | |
| Rutas operativas cargan | |
| Rutas internas bloquean | |
| APIs críticas bloquean (§12) | |
| Agenda usa **owners** | |
| `permissions/me` filtrado | |
| Datos seguros **o** demo técnica **documentada** | |
| Sin secretos visibles en evidencias | |
| Plan rollback definido | |
| Evidencias §17 **completas** | |

**GO 12O** habilita actualizar **12M** (entorno staging/clon) hacia piloto con cliente, junto con **12N** cerrado si se busca valor comercial.

---

## 19. Criterios NO-GO staging/clon

**NO-GO** si **cualquiera** ocurre:

| Bloqueante | ☐ |
|------------|---|
| `APP_MODE` no activo (menú fábrica) | |
| Menú muestra **Constructor** | |
| Menú muestra **Configuración** | |
| `GET /api/admin/users` → **200** | |
| `reset-db` / `minimal-seed` / `initialize` ≠ **403** | |
| Agenda llama `/api/admin/users` | |
| `permissions/me` expone `config.admin` o `system.danger` | |
| Rutas internas **cargan** (no `/403`) | |
| Datos de **otro** cliente | |
| Datos **sensibles** no autorizados | |
| Errores runtime **persistentes** | |
| **No** se sabe a qué Supabase apunta | |
| **Sin** rollback | |

---

## 20. Plantilla de resultados 12O-run

Completar tras ejecución real (no inventar resultados):

```text
Cliente:                 _______________________________
Slug:                    _______________________________
Entorno:                 [ ] staging  [ ] clon
URL:                     _______________________________
Commit SHA:              _______________________________
Fecha:                   _______________________________
Responsable:             _______________________________
Dataset:                 _______________________________

Variables confirmadas:   [ ] Sí  [ ] No — detalle: _______
Build/deploy:            [ ] OK  [ ] Falla
Menú:                    [ ] OK  [ ] Falla
Rutas operativas:        [ ] OK  [ ] Falla
Rutas bloqueadas:        [ ] OK  [ ] Falla
APIs críticas:           [ ] OK  [ ] Falla
Agenda owners:           [ ] OK  [ ] Falla
permissions/me:          [ ] OK  [ ] Falla
Datos:                   [ ] OK  [ ] Demo técnica  [ ] Falla

Riesgos observados:      _______________________________
Dictamen:                [ ] GO  [ ] GO condicionado  [ ] NO-GO
Evidencias:              _______________________________
Pendientes:              _______________________________
Firma responsable:       _______________________________
```

**Estado actual (solo doc 12O):** plantilla **vacía** — validación staging **no ejecutada** en esta fase documental.

---

## 21. Relación con 12P

| Fase | Rol |
|------|-----|
| **12O** | Valida **staging/clon** `client_crm` con evidencia |
| **12P** | Plan **deploy / rollback productivo** (cuando el equipo lo defina) |

| Regla | Detalle |
|-------|---------|
| No pasar a **12P** sin **12O-run OK** | Salvo excepción documentada y aceptada |
| Si **12O** falla | Corregir ENV, deploy, guards o datos; **no** avanzar a producción |
| **12O OK** | No implica producción lista — solo entorno aislado validado |

---

## 22. Riesgos residuales

| Riesgo | Nota |
|--------|------|
| Staging ≠ producción | Config, latencia, dominios |
| Supabase mal apuntado | Verificar §7 en cada deploy |
| Variables difieren local vs staging | Checklist §6 |
| Datos no representan piloto real | **12N** + clon dedicado |
| Sin RLS / multi-tenant final | Post-piloto infra |
| Sin monitoreo productivo | **12P** |
| Sin backup/rollback productivo | **12P** |
| Sin manual usuario | **12Q** |
| Sin soporte operativo formal | Canal + SLA |

---

## 23. Próximas fases

| Fase | Entregable |
|------|------------|
| **12O-run** | Ejecutar este checklist en staging/clon y completar §20 |
| **12P** | Plan deploy/rollback productivo |
| **12Q** | Manual breve usuario cliente |
| **12R** | Registro feedback piloto con cliente |
| **12N-impl** | Dataset / seed en BD — solo con aprobación explícita |

**Secuencia sugerida:** 12N aprobado → staging listo → **12O-run** → actualizar **12M** → piloto cliente (**12R**).

---

## 24. Confirmación de alcance (fase 12O documental)

- ✅ Procedimiento de validación staging/clon documentado  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se creó SQL ejecutable  
- ❌ No se modificaron, borraron ni insertaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM real  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  
- ❌ No se afirma staging/clon creado, validación ejecutada, producción lista, multi-tenant resuelto ni seguridad completa  

---

*Documento 12O — validación staging/clon `client_crm`. Ejecución: **12O-run**. Base: 12J-run local + series 12K–12N. Puente hacia 12P solo tras GO 12O-run.*
