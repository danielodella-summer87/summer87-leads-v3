# Plan Deploy / Rollback Client CRM 12P — Constructor CRM Summer87

**Versión:** Fase 12P (plan deploy y rollback — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `validacion-staging-clon-client-crm-12O.md` | Validación obligatoria previa (**12O-run**) |
| `checklist-go-no-go-primer-cliente-12M.md` | Dictamen piloto |
| `runbook-instalacion-client-crm-12K.md` | Smoke tests y rollback dev |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV |
| `limpieza-semilla-datos-piloto-12N.md` | Datos antes de go-live |
| `validacion-integral-client-crm-12J.md` | Checklist post-deploy |

**Estado:** plan **documentado**. **No** constituye deploy ejecutado, URL productiva entregada ni rollback probado en producción.

**Ejecución operativa:** fase **12P-run** (registrar en plantilla §18).

---

### Diferencia respecto a 12O y 12K

| Fase | Archivo | Propósito |
|------|---------|-----------|
| **12K** | `runbook-instalacion-client-crm-12K.md` | Instalar y validar **local** / piloto controlado |
| **12O** | `validacion-staging-clon-client-crm-12O.md` | Validar **staging/clon** con evidencia |
| **12P** | **Este documento** | Planificar **deploy productivo** (o pre-prod estable) y **rollback** formal |

---

## 2. Resumen ejecutivo

**12P** define el **marco operativo** para desplegar una instancia **`APP_MODE=client_crm`** en un entorno **estable y compartible con el cliente** (dominio productivo o pre-prod acordado) y para **revertir** cambios si el release falla o expone fábrica por error de configuración.

### Qué hace 12P

| Función | Detalle |
|---------|---------|
| Pre-requisitos | Enlace con **12O-run GO**, **12M**, **12N** |
| Deploy conceptual | Pasos sin atar a un proveedor no documentado en repo |
| Variables | Checklist ENV productivo (sin secretos en el doc) |
| Post-deploy | Smoke tests derivados de **12J** |
| Rollback | Estrategias por commit, variables y proyecto |
| Registro | Plantilla de release §18 |

### Qué no hace 12P

| Limitación | Detalle |
|------------|---------|
| Ejecutar deploy | Responsabilidad DevOps / release owner |
| Crear staging/clon | **12O** / infra |
| Habilitar “seguridad completa” | No sustituye RLS ni multi-tenant |
| Sustituir **12O-run** | Deploy productivo **después** de staging validado |
| Implicar producción lista | Solo plan; **12P-run** confirma ejecución |

---

## 3. Objetivo de 12P

| # | Objetivo |
|---|----------|
| 1 | Documentar **cuándo** y **cómo** promover `client_crm` de staging a URL estable |
| 2 | Asegurar **variables** y **commit** trazables por release |
| 3 | Definir **smoke tests** mínimos post-deploy (subset 12J) |
| 4 | Definir **rollback** sin depender de improvisación |
| 5 | Separar **base madre** (constructor) de **instancia cliente** |
| 6 | Dejar evidencia auditable para comité / cliente (**12P-run**) |

---

## 4. Cadena de fases previas (obligatorias)

| Fase | Estado requerido antes de **12P-run** |
|------|--------------------------------------|
| **12I** | Hardening cerrado |
| **12J-run** | OK local |
| **12K** | Runbook conocido |
| **12L** | Piloto definido |
| **12M** | GO o GO condicionado documentado |
| **12N** | Dataset aprobado o demo técnica explícita |
| **12O-run** | **GO** en staging/clon con evidencias §17 de 12O |
| **12R** (recomendado) | Feedback piloto incorporado o riesgos aceptados |

| Regla | Detalle |
|-------|---------|
| **No** pasar a **12P-run** sin **12O-run OK** | Salvo excepción firmada en §18 |
| **12O OK** | No implica listo para tráfico masivo — solo entorno aislado validado |

---

## 5. Modelo de entornos

| Entorno | Rol | Deploy 12P |
|---------|-----|------------|
| **Base madre** (`constructor_base`) | Fábrica Summer87 | **Fuera de alcance** — no desplegar cliente aquí |
| **Staging / clon** | Validación **12O** | Origen de evidencia; no sustituto de checklist post-prod |
| **Pre-prod / URL estable cliente** | Piloto extendido o soft launch | **Primer objetivo típico de 12P** |
| **Producción cliente** | Operación acordada | Mismo plan; mayor rigor en backup y ventana |

**Principio:** una **instancia de hosting + proyecto Supabase** por cliente piloto, salvo arquitectura multi-tenant futura explícita.

---

## 6. Estrategias de deploy (conceptual)

Elegir una y documentarla en §18. **No** inventar pipeline no adoptado por el equipo.

| Estrategia | Cuándo | Ventajas | Riesgos |
|------------|--------|----------|---------|
| **Proyecto hosting separado** por cliente | Piloto / primer go-live | Aislamiento ENV y secretos | Más proyectos que mantener |
| **Branch + preview** → promote | Mismo repo, releases etiquetadas | Trazabilidad git | Confusión de ENV entre previews |
| **Mismo proyecto, ENV por target** | Solo si el equipo ya lo opera | Menos proyectos | **Riesgo crítico** si `APP_MODE` se mezcla |
| **Clon de repo + deploy** | White-label fuerte | Separación total | Drift entre repos |

### Recomendación 12P

**Proyecto hosting + Supabase separados** para el cliente piloto, con `APP_MODE=client_crm` fijo en ese proyecto.

---

## 7. Variables de entorno en deploy productivo

> Sin secretos en este documento. Cargar desde panel del proveedor / vault.

| Variable | Valor esperado | Crítico | Nota |
|----------|----------------|:-------:|------|
| `APP_MODE` | `client_crm` | **Sí** | Si falta → **constructor_base** en producción |
| `CLIENT_SLUG` | ej. `pickup4x4` | Recomendado | |
| `CLIENT_NAME` | ej. `Pickup 4x4` | Recomendado | |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` | **Sí** | Revisar contrato |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto **cliente** | **Sí** | Verificar §8 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Del mismo proyecto | **Sí** | |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Sí** | Nunca exponer al browser |
| `OPENAI_API_KEY` | — | No piloto básico | |
| `RESEND_API_KEY` | — | No sin emails | |
| `RESET_DB_TOKEN` | — | **No** en instancia cliente | Riesgo si existe y filtra |

Checklist post-configuración:

- [ ] `APP_MODE` verificado en **runtime** (menú sin Constructor).
- [ ] Supabase URL coincide con ficha §8.
- [ ] No hay variables de **base madre** copiadas por error.

---

## 8. Identificación del release

Plantilla (completar en **12P-run**):

```text
Cliente:              _______________________________
Slug:                 _______________________________
Entorno destino:      [ ] pre-prod  [ ] producción cliente
URL final:            _______________________________
Hosting / proveedor:  _______________________________
Proyecto Supabase:    _______________________________  (nombre, no keys)
Commit SHA:           _______________________________
Tag / release:        _______________________________
Fecha deploy:         _______________________________
Responsable deploy:   _______________________________
Responsable QA:       _______________________________
Rollback owner:       _______________________________
Dataset (12N):        _______________________________
12O-run referencia:   _______________________________
```

---

## 9. Preflight antes del deploy

| Ítem | ☐ |
|------|---|
| **12O-run** = GO (evidencias archivadas) | |
| **12M** actualizado | |
| **12N** cerrado o excepción documentada | |
| `npm run build` OK en **commit** a desplegar | |
| Repo limpio o release tag desde commit conocido | |
| Variables §7 configuradas en **destino** (no solo local) | |
| Backup Supabase programado o confirmado (§14) | |
| Ventana de deploy comunicada | |
| Rollback §12 asignado a persona | |
| No deploy en **base madre** por error | |

---

## 10. Checklist de deploy (conceptual)

Pasos genéricos — adaptar al proceso del equipo (Vercel, Railway, Docker, etc.):

| Paso | Acción | ☐ |
|------|--------|---|
| 1 | Congelar **commit** / crear tag | |
| 2 | Verificar **branch** de release | |
| 3 | Aplicar variables §7 en entorno **destino** | |
| 4 | Lanzar **build** (CI o proveedor) | |
| 5 | Confirmar build **exitoso** | |
| 6 | Publicar a **URL** acordada | |
| 7 | Verificar **HTTPS** y dominio correcto | |
| 8 | **Login** con usuario piloto | |
| 9 | Ejecutar smoke tests §11 | |
| 10 | Registrar resultado en §18 | |

**No** incluir comandos destructivos (reset DB, seed masivo) en el mismo release salvo **12N-impl** aprobado aparte.

---

## 11. Smoke tests post-deploy (subset 12J)

Ejecutar en la **URL final** con sesión de usuario piloto. Falla de cualquier ítem crítico → considerar **rollback** §12.

### Menú

| Ítem | Esperado | ☐ |
|------|----------|---|
| Leads / Summer87 Leads visible | Sí | |
| Agenda, Reportes visible | Sí | |
| Constructor, Configuración | **No** visible | |

### Rutas

| Ruta | Esperado | ☐ |
|------|----------|---|
| `/admin/leads` o `/admin/leads87` | Carga | |
| `/admin/agenda` | Carga | |
| `/admin/reportes` | Carga | |
| `/admin/configuracion` | `/403` | |
| `/admin/constructor-crm` | `/403` | |

### APIs (muestra mínima)

| Endpoint | Esperado | ☐ |
|----------|----------|---|
| `GET /api/admin/users` | 403 | |
| `POST /api/admin/config/reset-db` | 403 | |
| `GET /api/admin/permissions/me` | 200 filtrado | |

### Agenda Network

| Prueba | ☐ |
|--------|---|
| Sin `/api/admin/users` | |
| Con `/api/admin/agenda/owners` 200 | |

**Opcional:** repetir tabla completa APIs de **12O** §12 en primera release mayor.

---

## 12. Estrategias de rollback

| Estrategia | Cuándo usar | Acción conceptual |
|------------|---------------|-------------------|
| **Redeploy commit anterior** | Fallo funcional post-release | Volver a SHA/tag previo en hosting |
| **Revertir variables** | Menú muestra fábrica / ENV incorrecto | Restaurar snapshot ENV; forzar `APP_MODE=client_crm` |
| **Deshabilitar tráfico** | Incidente grave | Maintenance page / DNS pause (si existe) |
| **Restaurar BD** | Corrupción datos (raro en piloto) | Restore backup Supabase — **solo** con aprobación |
| **Rollback a staging** | Prod inestable | Redirigir usuarios a URL staging validada (comunicar) |

### Rollback rápido por `APP_MODE` (solo dev/staging)

En **producción cliente**, cambiar accidentalmente a `constructor_base` **expone fábrica** — preferir **redeploy** con ENV corregido, no “rollback” a constructor en la misma URL cliente.

### Checklist rollback

| Paso | ☐ |
|------|---|
| Decisión de rollback documentada (motivo, hora) | |
| Commit/ENV objetivo identificado | |
| Redeploy o restore ejecutado | |
| Smoke tests §11 en estado post-rollback | |
| Cliente/internos notificados | |
| Incidente archivado en §18 | |

---

## 13. Criterios GO deploy (12P-run)

**GO release** si:

| Criterio | ☐ |
|----------|---|
| Preflight §9 completo | |
| Build/deploy exitoso | |
| Variables §7 correctas en runtime | |
| Smoke tests §11 OK | |
| Supabase apunta al proyecto **cliente** correcto | |
| Evidencias capturadas (capturas + SHA) | |
| Rollback §12 asignado y probado en staging (recomendado) | |
| No secretos en logs públicos | |

**GO deploy** ≠ listo para escalar comercialmente sin **12Q**, soporte y monitoreo.

---

## 14. Criterios NO-GO deploy

Detener o revertir si:

| Bloqueante | Acción |
|------------|--------|
| **12O-run** no GO | No desplegar prod |
| `APP_MODE` ≠ `client_crm` en runtime | Corregir ENV; rollback si ya publicado |
| Constructor o Configuración visibles | **Rollback** inmediato |
| `GET /api/admin/users` → 200 | **Rollback**; revisar guards |
| Endpoints `system_danger` no 403 | **Rollback** |
| Supabase apunta a **base madre** | Detener; corregir proyecto |
| Build falla | No promover |
| Smoke tests críticos fallan | Rollback §12 |
| Sin backup antes de cambio de datos | No ejecutar **12N-impl** en mismo release |

---

## 15. Backup y datos

| Regla | Detalle |
|-------|---------|
| **12P** no ejecuta backup | Documenta expectativa |
| Antes de go-live con datos reales | Backup Supabase según protocolo interno (ref. docs proyecto 11Q si aplica) |
| Deploy de **código** | No sustituye backup de **BD** |
| **12N-impl** | Release separado, ventana propia, aprobación explícita |

---

## 16. Monitoreo y observabilidad (conceptual)

| Ítem | Recomendación |
|------|----------------|
| Logs hosting | Errores 5xx, fallos build |
| Logs aplicación | Sin imprimir secretos |
| Alertas | Caída URL, pico 5xx (definir con equipo) |
| Uptime | Ping URL post-deploy |
| No incluido en 12P-run mínimo | APM completo, RLS alerts |

---

## 17. Comunicación de release

| Audiencia | Mensaje mínimo |
|-----------|----------------|
| Cliente | URL piloto / prod acotada; alcance; no es “versión final” hasta acuerdo |
| Interno Summer87 | SHA, ENV, responsable rollback, enlace evidencias |
| Soporte | Canal y horario; qué NO pueden hacer (config, usuarios) |

---

## 18. Plantilla de resultados 12P-run

```text
Cliente:                 _______________________________
URL:                     _______________________________
Commit SHA:              _______________________________
Fecha deploy:            _______________________________
Responsable deploy:      _______________________________

12O-run ref:             [ ] GO  [ ] N/A — justificar: _______

Preflight §9:            [ ] OK  [ ] Falla
Build/deploy:            [ ] OK  [ ] Falla
Variables runtime:       [ ] OK  [ ] Falla
Smoke tests §11:         [ ] OK  [ ] Falla

Dictamen release:        [ ] GO  [ ] GO condicionado  [ ] NO-GO / ROLLBACK
Rollback ejecutado:      [ ] No  [ ] Sí — motivo: _______________
Evidencias:              _______________________________
Pendientes:              _______________________________
Firma:                   _______________________________
```

**Estado documental 12P:** plantilla **sin completar** — ningún deploy productivo afirmado.

---

## 19. Dictamen recomendado actual (solo documentación)

> **No ejecutar 12P-run** hasta **12O-run GO**, dataset **12N** acordado y comité alineado con **12M**.

| Afirmación | Estado |
|------------|--------|
| Producción lista | ❌ No |
| Seguridad completa | ❌ No |
| Multi-tenant resuelto | ❌ No |
| Deploy ejecutado | ❌ No (solo plan) |

---

## 20. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| ENV distinto staging vs prod | Checklist §7 + §11 |
| Un solo proyecto para madre y cliente | Proyectos separados |
| Rollback no practicado | Ensayo en staging |
| Sin monitoreo | Definir alertas mínimas §16 |
| Drift de `CLIENT_VISIBLE_MODULES` | Contrato + revisión release |
| RLS / tenant incompleto | Roadmap post-piloto |
| Deploy sin **12Q** | Manual usuario antes de autoservicio |

---

## 21. Próximas fases

| Fase | Entregable |
|------|------------|
| **12P-run** | Ejecutar deploy/rollback real y completar §18 |
| **12Q** | Manual breve usuario cliente |
| **12R** | Registro feedback piloto |
| **12N-impl** | Seed/limpieza BD — aprobación explícita aparte |

---

## 22. Confirmación de alcance (fase 12P documental)

- ✅ Plan deploy/rollback documentado  
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
- ❌ No se instaló CRM real en producción  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  
- ❌ No se modificó `validacion-staging-clon-client-crm-12O.md`  
- ❌ No se afirma deploy ejecutado, producción lista, multi-tenant resuelto ni seguridad completa  

---

*Documento 12P — plan deploy/rollback `client_crm`. Ejecutar solo tras **12O-run GO**. Operación: **12P-run**.*
