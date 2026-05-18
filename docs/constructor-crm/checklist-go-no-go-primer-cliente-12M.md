# Checklist Go / No-Go Primer Cliente 12M — Constructor CRM Summer87

**Versión:** Fase 12M (matriz de decisión — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `politica-roles-cliente-vs-summer87-12I.md` | Política roles/permisos |
| `validacion-integral-client-crm-12J.md` | Checklist integral |
| `validacion-integral-client-crm-12J-run-local.md` | Evidencia runtime local |
| `runbook-instalacion-client-crm-12K.md` | Instalación y smoke tests |
| `preparacion-piloto-primer-cliente-12L.md` | Alcance y preparación piloto |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV clon |

**Estado del documento:** matriz **publicada** para uso en comité de decisión. **No** constituye aprobación de piloto ejecutada ni habilitación de producción.

### Diferencia respecto a 12L

| Fase | Archivo | Propósito |
|------|---------|-----------|
| **12L** | `preparacion-piloto-primer-cliente-12L.md` | **Preparar** alcance, módulos, usuarios, datos y guion del piloto |
| **12M** | **Este documento** | **Decidir** GO / GO condicionado / NO-GO antes de exponer el piloto al cliente |

---

## 2. Resumen ejecutivo

**12M** es la **matriz final de decisión** previa al **primer piloto cliente** en modo **`client_crm`**. Consolida criterios **técnicos**, de **seguridad**, **funcionales**, de **datos**, **usuarios**, **operativos** y **comerciales** en un único dictamen **GO**, **GO condicionado** o **NO-GO**.

### Qué hace 12M

| Función | Detalle |
|---------|---------|
| Decidir | Si se puede **avanzar** a piloto controlado (staging/clon + cliente) |
| Bloquear | Avance prematuro cuando hay criterios **NO-GO** |
| Documentar | Evidencias requeridas y responsables |

### Qué no hace 12M

| Limitación | Detalle |
|------------|---------|
| Instalar | Usar **12K** para ejecución |
| Habilitar producción | Fase **12P** |
| Sustituir **12N** | Limpieza/semilla de datos piloto |
| Sustituir **12O** | Validación integral en staging/clon |
| Aprobar piloto por sí solo | Requiere completar filas y firmar plantilla §19 |

### Base documental

Serie **12I** (hardening), validación local **12J-run**, runbook **12K**, preparación **12L**.

---

## 3. Estado de partida

| Área | Estado actual | Evidencia |
|------|---------------|-----------|
| Hardening `client_crm` | ✅ Cerrado **12I** | `validacion-*-12I-impl-*V.md`, commits 12I |
| Validación local real | ✅ Cerrada **12J-run** | `validacion-integral-client-crm-12J-run-local.md` |
| Runbook instalación | ✅ Cerrado **12K** | `runbook-instalacion-client-crm-12K.md` |
| Preparación piloto | ✅ Cerrada **12L** | `preparacion-piloto-primer-cliente-12L.md` |
| Staging/clon real | ⬜ **Pendiente** | Requiere **12O** |
| Datos piloto limpios | ⬜ **Pendiente 12N** | Semilla/depuración |
| Deploy productivo | ⬜ **Pendiente 12P** | Plan deploy/rollback |
| Manual usuario cliente | ⬜ **Pendiente 12Q** | Manual breve operativo |

---

## 4. Definición de GO

**GO** en 12M **no** significa producción ni seguridad completa.

**GO** significa que el equipo puede:

| Permiso | Descripción |
|---------|-------------|
| Avanzar entorno | Instalar o revalidar en **staging/clon** o piloto **controlado** con alcance limitado |
| Mostrar al cliente | Presentar como **entorno piloto**, no versión final |
| Validar operación | Leads, Agenda, Reportes con **datos controlados** |
| Mantener control Summer87 | Configuración, usuarios de fábrica y Constructor fuera del alcance cliente |

Variante **GO condicionado:** avance permitido solo al cumplir acciones listadas en §18 (p. ej. cerrar **12N** antes de sesión con cliente y datos reales).

---

## 5. Definición de NO-GO

**NO-GO** significa que **no** debe:

| Prohibición | Hasta |
|-------------|-------|
| Mostrarse al cliente | Corregir bloqueos técnicos/seguridad/datos |
| Instalarse en staging/clon | Resolver criterios §13–§15 |
| Usarse con datos reales no autorizados | Cerrar **12N** y acuerdos de datos |

Cualquier criterio **NO-GO** de las secciones §13–§15 **anula** un GO global.

---

## 6. Criterios técnicos GO

| Criterio | Evidencia requerida | Estado sugerido |
|----------|---------------------|-----------------|
| `npm run build` OK | Log build + commit SHA | ✅ validado local (12J-run preflight) |
| Repo limpio | `git status` | ✅ / ⬜ verificar al firmar |
| `APP_MODE=client_crm` validado | ENV + menú reducido | ✅ validado local |
| Menú reducido correcto | Captura sidebar | ✅ validado local |
| `/admin/dashboard` carga | Captura | ✅ validado local |
| `/admin/leads` carga | Captura + Network | ✅ validado local |
| `/admin/agenda` carga | Captura + Network | ✅ validado local |
| `/admin/reportes` carga | Captura | ✅ validado local |
| Agenda usa `/api/admin/agenda/owners` | Network 200 | ✅ validado local |
| Agenda **no** llama `/api/admin/users` | Network ausente | ✅ validado local |
| `/admin/configuracion` → `/403` | Captura URL | ✅ validado local (muestra) |
| `/admin/configuracion/usuarios` → `/403` | Captura | ✅ validado local |
| `/admin/constructor-crm` → `/403` | Captura | ✅ validado local |
| APIs críticas → 403 | Consola `fetch` (8 endpoints) | ✅ validado local |
| `permissions/me` filtra keys internas | Consola flags / keys | ✅ validado local |
| `constructor_base` al `npm run dev` normal | Menú fábrica restaurado | ⬜ pendiente verificar en sesión de cierre |

**Nota:** filas marcadas ✅ local requieren **repetición en staging/clon** (§6 última columna → ⬜ donde aplique entorno distinto).

---

## 7. Criterios de seguridad GO

| Criterio | Evidencia | Estado sugerido |
|----------|-----------|-----------------|
| Constructor no visible en menú | Captura | ✅ local |
| Configuración no visible | Captura | ✅ local |
| Roles/usuarios no visibles en menú | Captura | ✅ local |
| `GET /api/admin/users` → 403 | `fetch` | ✅ local |
| `POST reset-db` → 403 | `fetch` | ✅ local |
| `GET minimal-seed` → 403 | `fetch` | ✅ local |
| `POST modules/initialize` → 403 | `fetch` | ✅ local |
| `POST act-as` → 403 | `fetch` | ✅ local |
| `POST users/delete` (y mutantes invite/toggle) → 403 | `fetch` / muestra | ✅ local (delete probado) |
| `permissions/me` sin keys internas | Consola | ✅ local |
| Secretos no expuestos en UI/docs | Revisión | ⬜ pendiente formal |
| Base madre no usada para piloto real | Decisión entorno | ⬜ pendiente staging/clon |

---

## 8. Criterios funcionales GO

Aplicable **durante** piloto con cliente (marcar en ejecución):

| Criterio | ☐ Pendiente | ☐ OK |
|----------|-------------|------|
| Cliente puede entrar | | |
| Cliente ve menú comprensible | | |
| Cliente puede abrir Leads | | |
| Cliente puede abrir Agenda | | |
| Cliente puede abrir Reportes | | |
| Dashboard no confunde (si visible) | | |
| No aparecen errores visibles persistentes | | |
| Datos del piloto son entendibles | | |
| Cliente sabe que configuración la maneja Summer87 | | |

**Referencia local:** carga técnica OK en 12J-run; **valor** comercial pendiente de sesión cliente + **12N**.

---

## 9. Criterios de datos GO

| Criterio | Estado sugerido |
|----------|-----------------|
| Datos piloto **definidos** (ficha 12L §5) | ⬜ pendiente |
| Datos **limpiados o semillados** | ⬜ pendiente **12N** |
| Sin datos sensibles no autorizados | ⬜ pendiente |
| Sin mezcla de datos de otros clientes | ⬜ pendiente |
| Sin basura heredada visible que confunda | ⬜ pendiente |
| Contadores en 0 | ✅ aceptable solo **demo técnica**; ❌ para piloto de **valor** |
| **12N cerrado** antes de piloto real con cliente | ⬜ obligatorio |

---

## 10. Criterios de usuarios GO

| Criterio | Estado sugerido |
|----------|-----------------|
| Responsable Summer87 definido | ⬜ pendiente |
| Responsable cliente definido | ⬜ pendiente |
| Usuarios piloto definidos (cuentas + roles BD) | ⬜ pendiente |
| No se entrega superadmin al cliente | ⬜ confirmar |
| No se habilita autogestión cliente | ✅ política 12I/12L |
| No se usa act-as en `client_crm` | ✅ bloqueado 12I |
| Soporte Summer87 por procedimiento documentado | ⬜ pendiente |

---

## 11. Criterios operativos GO

| Criterio | Estado sugerido |
|----------|-----------------|
| Entorno definido (local / staging / clon) | ⬜ local probado; staging pendiente |
| URL definida y comunicada | ⬜ |
| Commit SHA anotado | ⬜ |
| Variables ENV definidas (12G / 12K) | ⬜ |
| Runbook **12K** seguido en instalación | ⬜ |
| Evidencias capturadas (12K §17) | ⬜ parcial local |
| Plan de rollback definido | ⬜ formalizar |
| Canal de soporte definido | ⬜ |
| Duración piloto definida | ⬜ |
| Criterios de éxito piloto definidos (12L §14) | ⬜ |

---

## 12. Criterios comerciales GO

| Criterio | Estado sugerido |
|----------|-----------------|
| Cliente entiende que es **piloto** | ⬜ pendiente sesión |
| Alcance explicado (Leads, Agenda, Reportes) | ⬜ |
| Exclusiones explicadas (Constructor, Config, IA, etc.) | ⬜ |
| No se promete producción | ⬜ |
| No se prometen IA/integraciones no incluidas | ⬜ |
| Objetivo del piloto claro | ⬜ |
| Feedback esperado definido (12L §18) | ⬜ |
| Próximo paso post-piloto definido | ⬜ |

---

## 13. Criterios NO-GO técnicos

Si **cualquiera** ocurre → **NO-GO** hasta corrección.

| Bloqueo | Motivo | Acción requerida |
|---------|--------|------------------|
| Build falla | No desplegable | Corregir código/ENV; rebuild |
| Repo sucio sin explicación | Trazabilidad | Commit o stash documentado |
| Constructor visible | Fuga fábrica | Revisar `APP_MODE`, menú, portal |
| Configuración visible | Fuga admin | Revisar layout + `CLIENT_VISIBLE_MODULES` |
| `GET /api/admin/users` → 200 en `client_crm` | Exposición usuarios | Revisar guard 12I-impl-8 |
| `reset-db` no bloquea | Riesgo destructivo | Revisar `systemDangerAccess` |
| `minimal-seed` no bloquea | Riesgo datos | Idem |
| `modules/initialize` no bloquea | Riesgo módulos | Idem |
| Agenda llama `/api/admin/users` | Regresión 12I-impl-7 | Corregir `agenda/page.tsx` |
| Leads no carga | Piloto inutilizable | Debug rutas/API |
| Agenda no carga | Piloto inutilizable | Debug |
| Reportes no carga | Piloto inutilizable | Debug |
| `permissions/me` expone `config.admin` o `system.danger` | Fuga permisos | Revisar filtro 12I-impl-5 |
| Rutas internas no dan `/403` | Fuga UI | Revisar layouts/guards |

---

## 14. Criterios NO-GO de datos

| Bloqueo | Acción requerida |
|---------|------------------|
| Datos reales sensibles sin autorización | Retirar dataset; legal/compliance |
| Mezcla de datos de clientes | Aislar Supabase; **12N** |
| Basura heredada visible | Limpieza **12N** |
| Datos imposibles de explicar al cliente | Redefinir semilla |
| Falta de dataset mínimo | Ejecutar **12N** |
| Reportes vacíos cuando se espera valor comercial | Semilla o ajustar expectativa |
| Importaciones sin plan | Detener imports; planificar **12N** |

---

## 15. Criterios NO-GO operativos / comerciales

| Bloqueo | Acción requerida |
|---------|------------------|
| Sin responsable Summer87 | Asignar owner |
| Sin responsable cliente | Asignar contraparte |
| Sin duración de piloto | Definir en ficha 12L |
| Sin canal de soporte | Definir Slack/email/ticket |
| Cliente espera funciones fuera de alcance | Re-alinear 12L §6 |
| No se explicó que no es producción | Reprogramar kickoff |
| Sin rollback | Documentar 12K §18 |
| Sin evidencias capturadas | Completar 12K §17 antes de GO |

---

## 16. Matriz final de decisión

Completar en comité; estado inicial sugerido según documentación existente (**sin** aprobación de piloto firmada).

| Dimensión | Estado | Comentario | Dictamen |
|-----------|--------|------------|----------|
| Técnica local | ✅ | 12J-run: build, rutas operativas, APIs muestra | **GO** |
| Seguridad APP_MODE | ✅ | 12J-run: menú, 403, 8 APIs, permissions filtrado | **GO** local |
| UI operativa | ✅ | Leads/Agenda/Reportes/dashboard cargan local | **GO** local |
| APIs críticas | ✅ | 8 endpoints 403 documentados | **GO** local |
| Agenda owners | ✅ | owners 200; sin `/api/admin/users` | **GO** local |
| Datos piloto | ⬜ | Contadores 0; **12N** no cerrado | **GO condicionado** |
| Usuarios piloto | ⬜ | Ficha 12L sin completar en runtime | **GO condicionado** |
| Entorno staging/clon | ⬜ | Solo local probado | **GO condicionado** → **12O** |
| Comercial / expectativa cliente | ⬜ | Sin sesión cliente documentada | **Pendiente** |
| Rollback | ⬜ | Procedimiento 12K; falta práctica formal | **GO condicionado** |
| Evidencias | ⚠️ Parcial | Local 12J-run; falta paquete staging | **GO condicionado** |

### Dictamen global (checkbox comité)

- [ ] **GO** — avanzar a piloto controlado con condiciones cumplidas  
- [ ] **GO condicionado** — avanzar solo tras §18  
- [ ] **NO-GO** — detener hasta corregir bloqueos  

---

## 17. Dictamen recomendado actual

> **Dictamen actual (documental, sin firma de comité):**  
> **GO técnico local**, **NO-GO productivo**, **GO condicionado** para preparar **staging/clon** y **piloto controlado** con cliente después de cerrar **datos (12N)**, **usuarios**, **entorno (12O)**, **evidencias completas** y **rollback** probado.

| Afirmación | ¿Válida ahora? |
|------------|----------------|
| Listo para producción | ❌ **No** |
| Seguridad completa | ❌ **No** |
| Multi-tenant resuelto | ❌ **No** |
| Piloto con cliente aprobado | ❌ **No** (hasta firmar §19) |

---

## 18. Acciones obligatorias antes del cliente real

Marcar antes de cambiar dictamen a **GO** sin condiciones:

- [ ] Ejecutar **12N** — limpieza/semilla datos piloto.
- [ ] Definir **usuarios piloto** (BD + credenciales entregadas por canal seguro).
- [ ] Definir **responsable cliente** y **responsable Summer87**.
- [ ] Definir **entorno staging/clon** (Supabase aislado).
- [ ] Repetir **12J-run** en URL de staging/clon (**12O**).
- [ ] Capturar **evidencias** completas (12K §17 + 12M §16).
- [ ] Confirmar **rollback** en práctica (12K §18).
- [ ] Preparar **guion de demo** (12L §17).
- [ ] Preparar **manual breve** (**12Q**).
- [ ] Validar con cliente **alcance y exclusiones** por escrito o acta breve.

---

## 19. Plantilla de decisión

Completar y archivar al cerrar comité:

```text
Cliente:                 _______________________________
Slug:                    _______________________________
Fecha:                   _______________________________
Responsable Summer87:    _______________________________
Responsable cliente:     _______________________________
Commit:                  _______________________________
Entorno:                 [ ] local  [ ] staging  [ ] clon
URL:                     _______________________________
Módulos:                 leads87,agenda,reportes
Datos:                   _______________________________
Usuarios:                _______________________________

Resultado técnico:       [ ] GO  [ ] GO cond.  [ ] NO-GO
Resultado seguridad:     [ ] GO  [ ] GO cond.  [ ] NO-GO
Resultado datos:         [ ] GO  [ ] GO cond.  [ ] NO-GO
Resultado usuarios:      [ ] GO  [ ] GO cond.  [ ] NO-GO
Resultado comercial:     [ ] GO  [ ] GO cond.  [ ] NO-GO

Dictamen final:          [ ] GO  [ ] GO condicionado  [ ] NO-GO
Firmado por:             _______________________________
Pendientes antes de avanzar:
                         _______________________________
```

---

## 20. Riesgos residuales

| Riesgo | Nota |
|--------|------|
| Falta RLS definitiva | Endurecer post-piloto |
| Falta multi-tenant completo | `company_id` en queries/owners |
| Falta staging/clon validado | **12O** obligatorio antes de cliente |
| Falta datos limpios | **12N** |
| Falta deploy/rollback productivo | **12P** |
| Falta monitoreo | Definir en deploy |
| Falta manual usuario final | **12Q** |
| Falta autogestión usuarios cliente | Política futura |
| Falta política soporte formal | Canal + SLA piloto |
| Allowlist mal configurada | Módulos legacy visibles |

---

## 21. Próximas fases

| Fase | Entregable |
|------|------------|
| **12N** | Limpieza/semilla datos piloto |
| **12O** | Validación staging/clon con evidencia (repetir 12J + 12M) |
| **12P** | Plan deploy/rollback productivo |
| **12Q** | Manual breve usuario cliente |
| **12R** | Registro feedback piloto (post-sesión cliente) |

**Orden recomendado:** 12N → staging + 12O → completar §19 → piloto cliente → 12R → revisión para 12P.

---

## 22. Confirmación de alcance (fase 12M documental)

- ✅ Matriz Go/No-Go creada  
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
- ❌ No se afirma piloto aprobado, producción lista, multi-tenant resuelto ni seguridad completa  

---

*Checklist 12M — decisión Go/No-Go primer cliente `client_crm`. Completar §19 tras 12N, 12O y sesión comercial. Base: 12I–12L, evidencia 12J-run-local.*
