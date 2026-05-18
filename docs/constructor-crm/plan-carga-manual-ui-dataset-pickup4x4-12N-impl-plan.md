# Plan Carga Manual UI Dataset Pickup 4x4 12N-impl-plan — Constructor CRM Summer87

**Versión:** 12N-impl-plan — plan operativo (sin ejecución)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `dataset-ficticio-pickup4x4-12N-real.md` | Diseño de los 12 leads y 8 actividades |
| `auditoria-schema-dataset-pickup4x4-12N-schema-audit.md` | Schema inferido desde repo |
| `validacion-vercel-client-crm-12O-run.md` | Entorno Vercel demo validado |

**Estado:** plan **documentado**. **No** constituye carga ejecutada ni **12N-impl-run** completado.

---

## 2. Resumen ejecutivo

Este documento define **cómo cargar manualmente por UI** el dataset ficticio Pickup 4x4 diseñado en **12N-real**, en el entorno Vercel demo ya validado en **12O-run**.

| Afirmación | Detalle |
|------------|---------|
| Qué hace | Orden de pasos, tablas de carga, validaciones y plantilla de ejecución |
| Qué **no** hace | No ejecuta la carga en esta fase |
| Método elegido | **UI manual** — menor riesgo que SQL en Supabase actual |
| SQL / Supabase directo | **No** en este plan |
| Siguiente fase | **12N-impl-run** (ejecución real + registro) |

**No se afirma** que los datos ya fueron cargados, que es piloto con cliente real ni que es producción.

---

## 3. Objetivo

| # | Objetivo |
|---|----------|
| 1 | Convertir el diseño **12N-real** en pasos operativos repetibles en la UI |
| 2 | Mantener **trazabilidad** (planilla con nombres creados, resultados sí/no) |
| 3 | **Evitar SQL** en el proyecto Supabase actual usado para demo técnica |
| 4 | Reducir riesgo de inserciones incorrectas (FK, pipeline, invitados agenda) |
| 5 | Permitir **validación visual** tras cada bloque (Leads → Agenda → Reportes) |

---

## 4. Entorno objetivo

| Campo | Valor |
|-------|--------|
| **URL** | `https://pickup4x4-crm-demo.vercel.app` |
| **Proyecto Vercel** | `pickup4x4-crm-demo` |
| **Cliente referencia** | Pickup 4x4 |
| **Supabase** | Proyecto **actual** — solo **demo técnica** (no clon separado) |
| **Usuario operador** | Daniel / usuario actual |
| **Dataset** | Ficticio (**12N-real**) |
| **Alcance** | Demo **interna** — no producción, no piloto cliente |
| **APP_MODE** | `client_crm` (esperado en Vercel) |
| **Commit referencia (12O-run)** | `8bead8c` |

---

## 5. Precondiciones antes de cargar

Marcar todas antes de iniciar **12N-impl-run**:

- [ ] **Login** OK en la URL demo
- [ ] Menú reducido: Summer87 Leads, Agenda, Reportes
- [ ] **Constructor** no visible en menú
- [ ] **Configuración** no visible en menú
- [ ] Recordatorio: APIs críticas ya **403** en **12O-run** (no re-probar salvo duda)
- [ ] Aceptado usar **Supabase actual** solo para demo interna
- [ ] Confirmado: **no** se usará SQL en esta carga
- [ ] Confirmado: **no** se usarán datos reales (teléfonos, emails personales, clientes reales)
- [ ] Confirmado: volumen acotado (**12** leads + **8** actividades máx.)
- [ ] **Daniel** aprueba explícitamente iniciar carga manual (chat / ticket)

---

## 6. Estrategia de carga

### Orden recomendado

| Paso | Acción |
|------|--------|
| **1** | Abrir UI de leads y **verificar pipelines/estados** disponibles (listado, kanban o selector al crear) |
| **2** | Completar tabla §7 (mapeo 12N-real → valor UI real) |
| **3** | Crear **leads ficticios** uno a uno (§8); anotar en columna **Resultado** y UUID si la UI lo muestra |
| **4** | Crear **actividades** solo para leads ya existentes (§9) |
| **5** | Validar por módulo (§11): Dashboard, Leads, Agenda, Reportes, seguridad 403 |
| **6** | Completar plantilla §12 y documento **12N-impl-run** (futuro) |

### Reglas de parada

| Situación | Acción |
|-----------|--------|
| UI **no** permite vincular actividad a lead (`owner_type` + `lead_id`) | **Detener** actividades; documentar bloqueo; **no** forzar SQL |
| No se puede mapear pipeline deseado | Usar mínimos visibles: **Nuevo**, **Ganado**, **Perdido** u otros que muestre la UI |
| Error de permisos o FK | Parar; no improvisar en BD |
| Duda de entorno (URL incorrecta) | Parar antes de crear registros |

---

## 7. Mapeo de estados

Completar **antes** de cargar leads (inspección visual en UI / kanban / configuración visible en demo).

| Estado 12N-real | Estado UI a usar (`pipeline`) | Confirmado antes de carga | Observación |
|-----------------|----------------------------------|---------------------------|-------------|
| Nuevo | | ☐ | Default API: `"Nuevo"` si existe |
| Contactado | | ☐ | |
| Interesado | | ☐ | |
| Reunión agendada | | ☐ | |
| Cotización enviada | | ☐ | |
| Ganado | | ☐ | Alineado a `leadStatusPolicy` / tipo ganado |
| Perdido | | ☐ | |

> **Regla:** usar el **texto exacto** que acepte el selector de pipeline en UI, no inventar nombres. Si un estado 12N-real no tiene equivalente, elegir el más cercano y anotar en **Observación**.

---

## 8. Plan de carga de leads

Completar columnas **Crear?** y **Resultado** durante **12N-impl-run**.  
**ID lead en BD:** anotar solo si la UI lo muestra tras guardar (no inventar UUID).

| Orden | Nombre oportunidad | Contacto | Email ficticio | Interés | Pipeline/estado sugerido (12N) | Notas a pegar | Origen si existe | Crear? | Resultado |
|-------|------------------|----------|----------------|-----------------|-------------------------------|---------------|------------------|--------|-----------|
| 1 | Demo — Lona marítima Hilux | Ana Ficticia Demo | demo+pickup001@example.com | Lona marítima | Nuevo | [DEMO] Consulta Toyota Hilux doble cabina | demo_12N_pickup4x4 | ☐ | |
| 2 | Demo — Barra antivuelco Ranger | Bruno Ficticio Demo | demo+pickup002@example.com | Barra antivuelco | Contactado | [DEMO] Ford Ranger 2022 equipamiento | demo_12N_pickup4x4 | ☐ | |
| 3 | Demo — Estribos Frontier | Carla Ficticio Demo | demo+pickup003@example.com | Estribos laterales | Interesado | [DEMO] Nissan Frontier flota 3 unidades | demo_12N_pickup4x4 | ☐ | |
| 4 | Demo — Defensa frontal S10 | Diego Ficticio Demo | demo+pickup004@example.com | Defensa frontal | Reunión agendada | [DEMO] Chevrolet S10 protección frontal | demo_12N_pickup4x4 | ☐ | |
| 5 | Demo — Cobertor de caja Amarok | Elena Ficticio Demo | demo+pickup005@example.com | Cobertor rígido | Cotización enviada | [DEMO] VW Amarok rental temporada | demo_12N_pickup4x4 | ☐ | |
| 6 | Demo — Kit accesorios flota | Ficticio Contacto Flota | demo+pickup006@example.com | Pack flota 8 pickups | Interesado | [DEMO] Equipamiento flota mixta Hilux/Ranger | demo_12N_pickup4x4 | ☐ | |
| 7 | Demo — Portaequipaje techo | Franco Ficticio Demo | demo+pickup007@example.com | Portaequipaje | Contactado | [DEMO] No integración real WhatsApp | demo_12N_pickup4x4 | ☐ | |
| 8 | Demo — Enganche y luces | Gloria Ficticio Demo | demo+pickup008@example.com | Enganche + luces LED | Nuevo | [DEMO] Hilux municipio ficticio | demo_12N_pickup4x4 | ☐ | |
| 9 | Demo — Interior cuero sintético | Hugo Ficticio Demo | demo+pickup009@example.com | Tapizado interior | Perdido | [DEMO] Perdido por precio — aprendizaje | demo_12N_pickup4x4 | ☐ | |
| 10 | Demo — Snorkel + filtro | Iris Ficticio Demo | demo+pickup010@example.com | Snorkel | Ganado | [DEMO] Cierre positivo Ranger | demo_12N_pickup4x4 | ☐ | |
| 11 | Demo — Lona + estribos combo | Juan Ficticio Demo | demo+pickup011@example.com | Combo accesorios | Cotización enviada | [DEMO] S10 cliente recurrente ficticio | demo_12N_pickup4x4 | ☐ | |
| 12 | Demo — Consulta genérica accesorios | Kim Ficticio Demo | demo+pickup012@example.com | Varios | Nuevo | [DEMO] Lead web formulario ficticio | demo_12N_pickup4x4 | ☐ | |

**Campos UI según auditoría repo:** mínimo **nombre**; recomendados si aparecen: contacto, email, origen, notas, **pipeline**.

**Teléfono:** dejar vacío o ficticio obvio; **no** usar números reales.

---

## 9. Plan de carga de actividades (Agenda)

Tabla **`socio_acciones`** en backend. UI: `/admin/agenda` → crear actividad.

**Tipos en UI (código):** `llamada`, `whatsapp`, `email`, `reunion`. Si no hay “tarea”, usar **llamada** o **reunion** según corresponda y aclarar en nota.

**Invitados:** incluir a **Daniel** (usuario actual) en invitados si el formulario lo permite — necesario para vista “mine” (`invited_user_ids`).

| Orden | Tipo UI | Título | Lead relacionado (nombre exacto) | Fecha relativa → absoluta | Responsable | Estado esperado | Nota | Crear? | Resultado |
|-------|---------|--------|-----------------------------------|-------------------------|-------------|-----------------|------|--------|-----------|
| 1 | llamada | Demo — Seguimiento lona Hilux | Demo — Lona marítima Hilux | Hoy | Daniel | Pendiente | [DEMO] Llamada seguimiento | ☐ | |
| 2 | reunion | Demo — Reunión comercial defensa S10 | Demo — Defensa frontal S10 | Mañana | Daniel | Pendiente | [DEMO] Reunión showroom ficticia | ☐ | |
| 3 | llamada | Demo — Revisar cotización Amarok | Demo — Cobertor de caja Amarok | En 3 días | Daniel | Pendiente | [DEMO] Revisión cotización | ☐ | |
| 4 | llamada | Demo — Recordatorio vencido Frontier | Demo — Estribos Frontier | Hace 2 días | Daniel | Vencida / pendiente | [DEMO] Recordatorio vencido | ☐ | |
| 5 | reunion | Demo — Visita showroom estribos | Demo — Estribos Frontier | Próxima semana | Daniel | Pendiente | [DEMO] Visita showroom ficticia | ☐ | |
| 6 | llamada | Demo — Seguimiento post-cotización combo | Demo — Lona + estribos combo | En 3 días | Daniel | Pendiente | [DEMO] Post-cotización | ☐ | |
| 7 | llamada | Demo — Cierre perdido / aprendizaje | Demo — Interior cuero sintético | Hace 2 días | Daniel | Completada si UI permite | [DEMO] Cierre perdido | ☐ | |
| 8 | llamada | Demo — Onboarding ganado snorkel | Demo — Snorkel + filtro | Mañana | Daniel | Pendiente | [DEMO] Post-venta ganado | ☐ | |

### Aclaraciones agenda

- Crear **solo** si el lead de la columna “Lead relacionado” **ya existe** en Leads.
- Si la UI **no** permite elegir lead: marcar **Pendiente** en Resultado; no forzar SQL.
- **Owner:** seleccionar lead (no socio) si el formulario pide tipo de dueño.
- Tras crear, verificar que la actividad aparece en Agenda (filtros hoy / vencidas / próximas).

---

## 10. Qué hacer si falta un campo en UI

| Situación | Acción |
|-----------|--------|
| No hay campo **origen** | Omitir; reforzar prefijo **Demo —** y notas `[DEMO]` |
| No hay campo **notas** | Poner contexto en **nombre** o campo libre disponible |
| No hay campo **pipeline** / etapa | Usar default visible; documentar en §7 |
| No hay opción **Ganado** / **Perdido** | Usar la más cercana disponible; anotar en Resultado |
| No aparece **responsable** | Dejar vacío si opcional; agenda: usar invitados |
| No se puede **vincular** actividad al lead | **Parar** bloque agenda; registrar bloqueo |
| No se puede **crear** actividad | Documentar error; no SQL |
| **Error** visible (toast / 500) | Captura; parar; no continuar masivo |
| Campo **obligatorio** no previsto | Completar con valor ficticio mínimo o parar fila |

**Regla general:** no improvisar SQL ni editar BD. Si afecta consistencia del plan, **parar** y escalar.

---

## 11. Validación posterior por módulo

Ejecutar tras carga (o tras cada bloque).

### Dashboard

- [ ] Carga sin error persistente
- [ ] Contadores / resúmenes **no vacíos** si el dashboard deriva de leads (esperado con 10–12 leads)

### Leads

- [ ] **10–12** registros visibles (o cantidad creada documentada)
- [ ] Nombres con prefijo **Demo —**
- [ ] Variación de **pipeline** / etapas
- [ ] Búsqueda por “Demo” o “pickup” funciona

### Agenda

- [ ] **6–8** actividades visibles **si** se pudieron crear
- [ ] Mezcla de **pendientes**, **vencidas** y **futuras** (según fechas cargadas)
- [ ] Responsable / invitado visible (Daniel)
- [ ] Actividades ligadas al lead correcto (nombre owner)

### Reportes

- [ ] Hub `/admin/reportes` carga
- [ ] **Reporte comercial → Leads** muestra filas si aplica
- [ ] Métricas / listados **no vacíos** donde consuman `GET /api/admin/leads`
- [ ] Si reportes no muestran agenda: **documentar** (esperado según auditoría repo)

### Seguridad (smoke rápido)

- [ ] `/admin/constructor-crm` → **403**
- [ ] `/admin/configuracion` → **403**
- [ ] No reabrir prueba masiva de APIs; opcional spot-check si hubo cambio de ENV

---

## 12. Registro de ejecución 12N-impl-run

Completar en fase **12N-impl-run** (no en este plan):

```text
Fecha:
Responsable:
URL:                    https://pickup4x4-crm-demo.vercel.app
Usuario:
Commit desplegado:      8bead8c (o el vigente)
Dataset usado:          12N-real ficticio Pickup 4x4

Cantidad leads planificados:       12
Cantidad leads creados:
Cantidad actividades planificadas:   8
Cantidad actividades creadas:

Estados usados (texto exacto UI):
-

Bloqueos encontrados:
-

Datos omitidos:
-

Capturas:               (ruta interna / enlace, sin secretos)

Validación posterior:   §11 OK / parcial / falla
Decisión:               GO demo visual / NO-GO / condicionado

Próximo paso:
-
```

---

## 13. Criterios GO / NO-GO después de carga

### GO si (todos los aplicables)

- [ ] Leads **visibles** y claramente **demo**
- [ ] Agenda **visible** **o** bloqueo **documentado** con causa
- [ ] Reportes / dashboard **útiles** para narrativa interna
- [ ] **No** hay datos reales mezclados
- [ ] Seguridad **403** intacta en rutas internas
- [ ] **No** hay errores persistentes en operación normal

### NO-GO si (cualquiera)

- [ ] Se mezclan **datos reales** o sensibles
- [ ] No se puede **distinguir** demo de datos heredados
- [ ] **Agenda** o **reportes** rotos sin workaround documentado
- [ ] Aparece **Constructor** o **Configuración** en menú
- [ ] Errores de **permisos** al operar
- [ ] Carga en **entorno equivocado** (URL distinta)
- [ ] **No** se puede identificar ni revertir registros demo después

---

## 14. Rollback / limpieza futura

**No ejecutar en esta fase.**

| Práctica | Detalle |
|----------|---------|
| Trazabilidad | Conservar esta planilla con nombres **exactos** creados |
| Marcado | Todos con **Demo —**, `[DEMO]`, origen `demo_12N_pickup4x4` si se usó |
| Borrado | Manual por UI **o** SQL **revisable** en fase futura, con aprobación explícita |
| Prohibido | Borrar masivo sin checklist; no mezclar limpieza con nueva carga |
| Supabase actual | Datos heredados pueden coexistir — no borrar sin identificar |

---

## 15. Riesgos

| Riesgo | Mitigación en plan |
|--------|---------------------|
| UI sin todos los campos del diseño | §10; priorizar nombre + pipeline + notas |
| Pipeline limitado en selector | §7; mínimos Nuevo/Ganado/Perdido |
| Agenda: relación técnica (`lead_id`, invitados) | Verificar en formulario; parar si falla |
| Reportes no reflejan agenda | Validar leads; documentar gap |
| Datos heredados en Supabase | No tocar; filtrar por “Demo” en UI |
| Confusión demo vs piloto real | Comunicación interna; no mostrar al cliente |
| Carga manual incompleta | Planilla Resultado; GO condicionado |
| Borrado posterior delicado | §14; no borrar en caliente |

---

## 16. Dictamen

> **GO** para **preparar** la carga manual UI del dataset ficticio (**este plan**).  
> **NO-GO** para **ejecutar** la carga hasta **aprobación explícita de Daniel** en chat y **confirmación visual** del entorno correcto (`pickup4x4-crm-demo`).

---

## 17. Próximo paso

| Orden | Acción |
|-------|--------|
| 1 | Abrir Vercel → pantalla **crear lead**; anotar campos disponibles |
| 2 | Confirmar **pipelines** visibles y completar §7 |
| 3 | Si OK → ejecutar **12N-impl-run** siguiendo §8 y §9 |
| 4 | Si falta capacidad crítica en UI → documentar bloqueo; decidir si hace falta **SQL revisable** (fase aparte, aplicación manual) |
| 5 | Tras carga exitosa → completar §12 y validación §11 |

---

## 18. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| TypeScript nuevo | **No** |
| SQL ejecutable / SQL ejecutado | **No** |
| Supabase consultado o modificado directamente | **No** |
| Datos insertados / modificados / borrados | **No** |
| Endpoints / APIs / middleware | **No** modificados |
| Migraciones | **No** |
| Usuarios creados | **No** |
| Kore / Zeta | **No** tocados |
| Commits | **No** en esta acción |
| Entregable | Solo `plan-carga-manual-ui-dataset-pickup4x4-12N-impl-plan.md` |

---

*Documento 12N-impl-plan — plan de carga manual UI. Ejecución: **12N-impl-run**.*
