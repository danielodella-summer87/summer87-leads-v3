# Preparación Piloto Primer Cliente 12L — Constructor CRM Summer87

**Versión:** Fase 12L (preparación piloto — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `politica-roles-cliente-vs-summer87-12I.md` | Roles y permisos cliente vs fábrica |
| `validacion-integral-client-crm-12J.md` | Checklist integral |
| `validacion-integral-client-crm-12J-run-local.md` | Evidencia local (referencia técnica) |
| `runbook-instalacion-client-crm-12K.md` | Procedimiento de instalación y smoke tests |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV clon |
| `validacion-ui-configuracion-bloqueada-client-crm-12I-impl-6V.md` | UI configuración |
| `validacion-admin-users-read-bloqueado-client-crm-12I-impl-8V.md` | Lectura usuarios |

**Estado:** plan de preparación **documentado**. **No** constituye instalación ejecutada, piloto en curso ni deploy productivo.

---

## 2. Resumen ejecutivo

**12L** define las **condiciones previas** para ejecutar el **primer piloto** de una instancia **`APP_MODE=client_crm`** con un cliente controlado, sobre la base del hardening **12I**, la validación local **12J-run** y el runbook **12K**.

### Qué define 12L

| Ámbito | Contenido |
|--------|-----------|
| Objetivos del piloto | Qué validar y qué **no** validar aún |
| Cliente sugerido | Ficha y criterios de selección |
| Alcance funcional | Módulos, exclusiones, integraciones |
| Usuarios y datos | Política operativa sin autogestión cliente |
| Checklists | Antes de instalar y durante prueba con cliente |
| Criterios éxito / corte | Puente hacia **12M** (go/no-go) y **12N** (datos) |

### Qué no es 12L

| Limitación | Detalle |
|------------|---------|
| Instalación | La ejecuta el equipo siguiendo **12K** en el entorno elegido |
| Deploy productivo | Fase **12P** (cuando aplique) |
| Sustituto staging/clon | Piloto útil requiere entorno aislado + **12O** |
| Multi-tenant / RLS / seguridad completa | Fuera de alcance; hardening 12I es capa complementaria |

---

## 3. Objetivo del piloto

| # | Objetivo |
|---|----------|
| 1 | Validar que el **cliente** opera **Leads, Agenda y Reportes** sin acceso a fábrica (Constructor, Configuración, roles internos). |
| 2 | Validar que **Summer87** controla instalación, usuarios piloto y soporte con procedimiento definido. |
| 3 | Validar que el **CRM operativo** sirve para un **caso real limitado** (flujo comercial acotado). |
| 4 | **Medir fricción** de uso (menú, pantallas, expectativas vs alcance). |
| 5 | **Detectar** datos faltantes, basura heredada y necesidades de configuración operativa (insumo **12N**). |

### Fuera de alcance del piloto inicial

- Autogestión avanzada de usuarios por el cliente.
- Multi-tenant completo por `company_id` / RLS definitiva.
- Integraciones Zeta, Kore, emails masivos, IA comercial en producción.
- Promesa de versión final ni SLA productivo.

---

## 4. Cliente piloto sugerido

### Propuesta por defecto (no instalado)

| Campo | Valor sugerido |
|-------|----------------|
| **Cliente** | Pickup 4x4 |
| **Slug** | `pickup4x4` |

### Motivos de la sugerencia

| Motivo | Detalle |
|--------|---------|
| Caso comercial concreto | Relación y contexto ya conocidos en documentación del proyecto |
| Módulos simples | `leads87`, `agenda`, `reportes` cubren operación diaria sin fábrica |
| Validación CRM operativo | Permite probar valor sin exponer Constructor ni matriz de permisos |
| Datos controlables | Permite depurar o semillar antes de carga real (**12N**) |

### Alternativa

Si se elige **otro cliente**, completar la **misma ficha** (§5) y revisar allowlist, usuarios y datos. **No** asumir que Pickup 4x4 está instalado en producción ni que este documento implica go-live.

---

## 5. Ficha del piloto

Plantilla — completar antes de ejecutar instalación (**12K**) y piloto con cliente:

```text
Cliente:                    _______________________________
Slug:                       _______________________________
Responsable Summer87:       _______________________________
Responsable cliente:        _______________________________
Entorno:                    [ ] local  [ ] staging  [ ] clon
URL:                        _______________________________
Fecha prevista:             _______________________________
Módulos visibles:           leads87,agenda,reportes
Datos incluidos:            _______________________________
Usuarios incluidos:         _______________________________
Usuarios excluidos:         _______________________________
Integraciones incluidas:    _______________________________
Integraciones excluidas:    _______________________________
Duración piloto:            _______________________________
Criterio de éxito:          _______________________________
Criterio de corte:          _______________________________
Observaciones:              _______________________________
```

---

## 6. Alcance funcional inicial

| Módulo | Incluir piloto | Alcance | Exclusiones |
|--------|:--------------:|---------|-------------|
| **Leads / Summer87 Leads** | ✅ Sí | Listado, detalle, estados básicos, seguimiento manual | Importaciones masivas; IA comercial avanzada; propuestas/Gamma salvo validación explícita |
| **Agenda** | ✅ Sí | Ver agenda, actividades, invitados (vía `owners` acotado) | Automatizaciones complejas; emails; calendarios externos |
| **Reportes** | ✅ Sí | Reportes básicos visibles en hub | BI avanzado; financieros; IA de performance no validada |
| **Dashboard** | ⚠️ Sí / revisar | Vista inicial operativa | KPIs que requieran datos reales no semillados |
| **Personalización** | ❌ No por defecto | — | Pendiente decisión comercial/técnica |
| **Configuración** | ❌ No | — | Bloqueada en `client_crm` (12I) |
| **Constructor** | ❌ No | — | Bloqueado |
| **Roles / usuarios (admin)** | ❌ No | — | Gestión solo Summer87 fuera de `client_crm` |
| **Mesa de ayuda** | ❌ No salvo contrato | — | Fuera de allowlist piloto |
| **IA** | ❌ No salvo decisión explícita | — | Requiere validación y créditos |
| **Importaciones** | ❌ No | — | Requiere preparación **12N** |
| **Zeta / Kore** | ❌ No | — | Piloto inicial |

---

## 7. Módulos visibles permitidos

### Allowlist recomendada

```env
CLIENT_VISIBLE_MODULES=leads87,agenda,reportes
```

### Reglas

| Regla | Detalle |
|-------|---------|
| No incluir `configuracion` | UI y APIs bloqueadas |
| No incluir constructor | Menú y rutas bloqueadas |
| No incluir `personalizacion` | Salvo decisión explícita documentada en ficha |
| No incluir `ia` | Salvo validación aparte y contrato |
| No incluir `mesa_de_ayuda` / helpdesk | Salvo contrato |

Coherente con **12G**, **12K** y validación **12J-run** local.

---

## 8. Usuarios del piloto

### Política actual (heredada 12I)

| Principio | Detalle |
|-----------|---------|
| Autogestión cliente | **No** habilitada en esta etapa |
| Alta / baja / invites | Definidos y operados por **Summer87** |
| UI cliente | No crea usuarios; `invite`, `delete`, `toggle-active` bloqueados en `client_crm` |
| `set-role` | Restringido; no asignar roles internos de fábrica |
| `act-as` | **Bloqueado** en `client_crm` — soporte sin suplantación |

### Tabla de roles piloto (conceptual)

| Rol piloto | Puede hacer | No puede hacer | Usuario sugerido |
|------------|-------------|----------------|------------------|
| **Responsable cliente / dueño** | Navegar Leads, Agenda, Reportes; revisar pipeline básico | Configuración, Constructor, gestión usuarios, act-as | 1 cuenta nominada del cliente |
| **Usuario operativo comercial** | Leads (lectura/escritura según permisos BD); Agenda | Reportes sensibles si no tiene permiso; admin interno | 1–2 cuentas comerciales |
| **Usuario lectura** | Reportes (y lectura acordada) | Editar leads/agenda si rol solo lectura | Opcional |
| **Summer87 soporte** | Soporte por procedimiento; operar en **staging** o `constructor_base` | **act-as** en `client_crm`; exponerse como usuario del cliente en producción piloto | Equipo L2/L3 acotado |
| **Summer87 fábrica** | Constructor, configuración, roles en **base madre / staging fábrica** | Operar fábrica **desde** URL del piloto cliente | Equipo producto/ingeniería |

### Prohibiciones explícitas

- No asignar **superadmin** al cliente.
- No exponer nombres de **roles internos** de fábrica en capacitación.
- No usar **act-as** en instancia `client_crm` del piloto.

---

## 9. Datos del piloto

### Datos permitidos

| Tipo | Criterio |
|------|----------|
| Leads | Muestra depurada o casos de prueba acordados |
| Agenda | Actividades no críticas o de demostración |
| Reportes | Dataset controlado suficiente para lectura |
| Empresas / contactos | Consentimiento o datos no sensibles |

### Datos no permitidos inicialmente

| Tipo | Motivo |
|------|--------|
| Base completa real sin limpieza | Riesgo basura / datos ajenos |
| Datos sensibles sin acuerdo | Legal / reputacional |
| Datos financieros reales | Fuera de alcance piloto |
| Integraciones automáticas externas | Sin validación |
| Emails masivos | Sin Resend/contrato |
| Herencia basura sin depurar | Confunde al cliente |

### Notas operativas

| Situación | Interpretación |
|-----------|----------------|
| Contadores en **0** | **No** invalida piloto **técnico** (observado en 12J-run) |
| Piloto **útil** comercialmente | Requiere **12N** (limpieza/semilla) |
| Excel / Kore / Zeta | **No** importar sin plan y responsable |

---

## 10. Integraciones

| Integración | Estado piloto | Motivo |
|-------------|:-------------:|--------|
| **Supabase** | ✅ Sí | Backend; usar proyecto/dataset **controlado** |
| **OpenAI / IA** | ❌ No por defecto | Créditos, contrato, validación pendiente |
| **Resend / emails** | ❌ No por defecto | Invites y transaccional no críticos en piloto 1 |
| **Zeta** | ❌ No | Fuera de alcance |
| **Kore** | ❌ No | Fuera de alcance |
| **Gamma / propuestas** | ❌ No por defecto | Flujo comercial avanzado no validado en cliente |
| **Vercel / deploy** | ⬜ Pendiente **12P** | No definido como productivo en 12L |
| **WhatsApp / email cliente** | ❌ Fuera | Canal fuera de alcance inicial |

---

## 11. Seguridad y hardening heredado

### Estado implementado (serie 12I + validaciones)

| Capa | Estado en `client_crm` |
|------|------------------------|
| Constructor UI/API | ✅ Bloqueado |
| Configuración UI (`/admin/configuracion/*`) | ✅ Bloqueada |
| `system_danger` (reset, seed, initialize) | ✅ Bloqueado |
| Matriz roles/permisos (escritura) | ✅ Bloqueada |
| Gestión sensible usuarios (mutaciones) | ✅ Bloqueada |
| `GET` usuarios admin / config usuarios / config roles | ✅ Bloqueado (lecturas sensibles) |
| `permissions/me` | ✅ Filtrado (200 sin keys internas) |
| Agenda | ✅ Usa `/api/admin/agenda/owners` (no `/api/admin/users`) |
| Menú | ✅ Reducido por `CLIENT_VISIBLE_MODULES` |
| `portal_config` PATCH | ✅ Sanitiza `sidebar_modules` en persistencia |

### Límites explícitos

| Límite | Implicación |
|--------|-------------|
| **No** es RLS final | Políticas Supabase pueden requerir endurecimiento |
| **No** es multi-tenant definitivo | `owners` y queries pueden carecer de `company_id` |
| **No** sustituye staging/clon | Repetir 12J en entorno aislado |
| **No** garantiza datos limpios | Depende de **12N** |

---

## 12. Checklist antes de instalar piloto

Marcar **antes** de levantar entorno para el cliente:

- [ ] Cliente elegido y **aprobado** internamente.
- [ ] **Slug** definido y documentado en ficha §5.
- [ ] **Módulos visibles** definidos (`leads87,agenda,reportes` salvo excepción acordada).
- [ ] **Datos piloto** definidos (origen, volumen, sensibilidad).
- [ ] **Usuarios piloto** definidos (cuentas, roles BD, sin superadmin cliente).
- [ ] **Responsable Summer87** asignado.
- [ ] **Responsable cliente** asignado.
- [ ] **Entorno** definido: local / staging / clon (preferir **no** base madre).
- [ ] `npm run build` **OK** en commit elegido.
- [ ] **Repo limpio** o estado documentado.
- [ ] Runbook **12K** leído por quien instala.
- [ ] **12J-run** (o equivalente) repetido en el **mismo entorno** del piloto.
- [ ] Riesgos explicados al equipo interno y al cliente (alcance piloto).
- [ ] **No** hay datos sensibles no autorizados en el dataset.
- [ ] Plan de **rollback** a `constructor_base` acordado (12K §18).

---

## 13. Checklist de prueba con cliente

Durante la sesión con el cliente (marcar en vivo):

- [ ] Cliente **entra** correctamente (login / sesión).
- [ ] Cliente ve **menú reducido** acorde al contrato.
- [ ] Cliente **entiende** qué puede hacer (guion §17).
- [ ] Cliente **carga Leads** sin error bloqueante.
- [ ] Cliente **carga Agenda** sin error bloqueante.
- [ ] Cliente **carga Reportes** sin error bloqueante.
- [ ] Cliente **no** ve Configuración en menú.
- [ ] Cliente **no** ve Constructor en menú.
- [ ] URLs internas probadas (si aplica) → **403** / sin permisos.
- [ ] **No** aparecen errores visibles persistentes en consola.
- [ ] Cliente entiende que son **datos de prueba** / alcance limitado.
- [ ] Se **anotan** dudas y fricciones (§18).
- [ ] **No** se prometen funciones fuera de alcance (§6).

---

## 14. Criterios de éxito

**GO piloto** (insumo para **12M**) si se cumple lo siguiente:

| Criterio | ☐ |
|----------|---|
| Cliente navega con ayuda **mínima** | |
| Leads, Agenda, Reportes **cargan** | |
| Menú **no** muestra fábrica | |
| URLs internas **bloquean** (muestra representativa) | |
| **No** se exponen usuarios/roles internos en UI | |
| Agenda **no** depende de `/api/admin/users` | |
| Cliente percibe **valor** del CRM para su operación | |
| Se registran **mejoras accionables** (backlog) | |
| **No** se modificaron datos reales no autorizados | |

---

## 15. Criterios de corte / NO-GO

Detener o reprogramar piloto si ocurre **cualquiera**:

| Bloqueante | ☐ |
|------------|---|
| Constructor **visible** | |
| Configuración **visible** | |
| Usuarios/roles internos **visibles** | |
| `GET /api/admin/users` → **200** en `client_crm` | |
| reset-db / minimal-seed / initialize **accesibles** (≠ 403) | |
| Agenda **no** carga | |
| Leads **no** carga | |
| Reportes **no** carga | |
| Cliente ve datos **incorrectos** o **sensibles** | |
| Mezcla de datos de **otro** cliente | |
| **No** está claro quién opera el piloto | |
| Errores runtime **persistentes** | |

---

## 16. Evidencias a capturar

| Evidencia | ☐ |
|-----------|---|
| Menú vista cliente | |
| Dashboard (si aplica) | |
| Leads | |
| Agenda | |
| Reportes | |
| `/403` configuración | |
| `/403` constructor | |
| `fetch` APIs críticas (opcional, técnico) | |
| Network Agenda — `owners`, sin `users` | |
| Registro de **feedback** cliente (notas / grabación acordada) | |
| `git status` + **commit SHA** | |
| **URL** y entorno usados | |

Archivar junto al registro de instalación (**12K** §21) y checklist **12M**.

---

## 17. Guion de demostración al cliente

Guion breve (~20–40 min) — ajustar al alcance acordado:

| Paso | Acción |
|------|--------|
| 1 | Presentar el CRM como **entorno piloto**, no versión final productiva. |
| 2 | Aclarar **alcance**: Leads, Agenda, Reportes; configuración la maneja Summer87. |
| 3 | Mostrar **menú reducido** y explicar cada ítem visible. |
| 4 | Demostrar **Leads**: listado y un detalle representativo. |
| 5 | Demostrar **Agenda**: vista y concepto de actividades/invitados (sin prometer integraciones). |
| 6 | Demostrar **Reportes**: hub y un reporte básico. |
| 7 | Explicar que **no** pueden entrar a Configuración ni Constructor (y que es intencional). |
| 8 | Pedir **feedback** sobre claridad, utilidad y flujo (§18). |
| 9 | **Registrar** dudas y pedidos fuera de alcance en backlog. |
| 10 | **No prometer** funciones no incluidas en §6 (IA, imports, autogestión usuarios, etc.). |

---

## 18. Preguntas para el cliente piloto

Usar al cierre de la demo o en entrevista corta:

| # | Pregunta |
|---|----------|
| 1 | ¿Entendés qué hacer al entrar? |
| 2 | ¿El menú es claro? |
| 3 | ¿Leads representa tu proceso comercial actual? |
| 4 | ¿Agenda te resulta útil para el día a día? |
| 5 | ¿Qué reporte necesitás ver **primero**? |
| 6 | ¿Qué **dato falta** para que esto sea usable? |
| 7 | ¿Qué **dato sobra** o confunde? |
| 8 | ¿Qué pantalla **no** entendiste? |
| 9 | ¿Qué acción esperabas poder hacer y no pudiste? |
| 10 | ¿Qué tendría que pasar para que lo uses **una semana** en serio? |

Registrar respuestas en ficha §5 / evidencias §16.

---

## 19. Riesgos residuales

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Datos heredados o basura | Cliente pierde confianza | **12N** limpieza/semilla |
| Sin `tenant` / `company_id` integral | Mezcla futura de datos | Diseño post-piloto |
| Sin RLS definitiva | Exposición si URL/filtrado fallan | Staging + auditoría |
| Sin autogestión usuarios | Carga operativa en Summer87 | Política + runbook soporte |
| Sin staging/clon con dataset real | Piloto solo local no representativo | **12O** |
| Sin deploy productivo | No hay URL estable cliente | **12P** |
| Sin backup/rollback formal productivo | Riesgo operativo | **12P** |
| Sin monitoreo/logs | Incidencias tardías | Definir en deploy |
| Sin manual usuario final | Fricción adopción | **12Q** |
| Allowlist mal configurada | Módulos legacy visibles | Revisar ENV + menú en 12K |

---

## 20. Decisiones pendientes

Completar antes de **12M** / ejecución piloto:

| Decisión | Opciones | Recomendación piloto 1 |
|----------|----------|------------------------|
| Cliente piloto | Pickup 4x4 / otro | Pickup 4x4 si caso listo; si no, otro con ficha §5 |
| Entorno | local / staging / clon | **Staging/clon** aislado (no base madre) |
| Datos | muestra / limpio / importación | Muestra **depurada** vía **12N** |
| Usuarios | uno / dos / + lectura | Dueño + 1 comercial |
| Personalización | sí / no | **No** en piloto 1 |
| IA | sí / no | **No** |
| Reportes | básicos / específicos | **Básicos** visibles en allowlist |
| Duración | 1 semana / 2 semanas | **2 semanas** con checkpoint semanal |
| Criterio comercial | demo interna / demo cliente / piloto real | **Demo cliente** acotada → piloto real limitado |

---

## 21. Próximas fases

| Fase | Entregable |
|------|------------|
| **12M** | Checklist go/no-go definitivo primer cliente |
| **12N** | Limpieza / semilla de datos piloto |
| **12O** | Validación staging/clon con evidencia final |
| **12P** | Plan deploy / rollback productivo |
| **12Q** | Manual breve usuario cliente |

**Secuencia sugerida:** completar decisiones §20 → **12N** (datos) → instalación **12K** en staging → **12J-run** en misma URL → piloto cliente → cierre **12M**.

---

## 22. Confirmación de alcance (fase 12L documental)

- ✅ Documento de preparación piloto creado  
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
- ❌ No se afirma piloto instalado, producción lista, multi-tenant resuelto ni seguridad completa  

---

*Documento 12L — preparación primer piloto `client_crm`. Ejecutar instalación con runbook 12K; cerrar con checklist 12M tras piloto con cliente.*
