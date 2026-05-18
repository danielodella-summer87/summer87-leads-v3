# Ejecución Carga Manual UI Dataset Pickup 4x4 12N-impl-run — Constructor CRM Summer87

**Versión:** 12N-impl-run — ejecución real registrada  
**Fecha de ejecución (carga UI):** 2026-05-18  
**Tipo:** demo interna `client_crm` — **no** producción, **no** piloto cliente real

**Documentos relacionados:**

| Documento | Rol |
|-----------|-----|
| `dataset-ficticio-pickup4x4-12N-real.md` | Diseño del dataset |
| `auditoria-schema-dataset-pickup4x4-12N-schema-audit.md` | Schema repo |
| `plan-carga-manual-ui-dataset-pickup4x4-12N-impl-plan.md` | Plan previo a la carga |
| `validacion-vercel-client-crm-12O-run.md` | Entorno Vercel validado pre-carga |

**Distinción importante:**

| Acción | Quién / cómo |
|--------|----------------|
| **Carga de datos** | Manual por UI en Vercel — ejecutada por Daniel, aprobada en chat |
| **Este archivo** | Solo **documentación** del registro y validación posterior — **no** inserta ni modifica datos |

---

## 1. Resumen ejecutivo

Se ejecutó la **carga manual por UI** del dataset ficticio Pickup 4x4 (**12N-real**) en `https://pickup4x4-crm-demo.vercel.app`.

| Métrica | Resultado |
|---------|-----------|
| Leads planificados | 12 |
| Leads creados | **12** ✅ |
| Actividades planificadas | 8 |
| Actividades creadas | **8** ✅ |
| Método | UI — **sin SQL** |
| Pipeline usado (todos los leads) | **Nuevo lead** |
| Validación posterior | Dashboard, Leads, Agenda, Reportes — **sin errores visibles** |

**No se afirma:** producción lista, piloto con cliente real, Supabase separado, multi-tenant/RLS final.

---

## 2. Registro de ejecución

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-05-18 |
| **Responsable** | Daniel |
| **URL** | `https://pickup4x4-crm-demo.vercel.app` |
| **Usuario** | Daniel / usuario actual |
| **Commit desplegado (referencia 12O-run)** | `8bead8c` — verificar en panel Vercel si hubo redeploy posterior |
| **Dataset usado** | 12N-real ficticio Pickup 4x4 |
| **Cantidad leads planificados** | 12 |
| **Cantidad leads creados** | 12 |
| **Cantidad actividades planificadas** | 8 |
| **Cantidad actividades creadas** | 8 |
| **Estados pipeline usados** | Solo **Nuevo lead** (12/12) |
| **Origen usado** | `demo_12N_pickup4x4` |
| **Bloqueos encontrados** | Ninguno bloqueante; ver hallazgos UX |
| **Datos omitidos** | Teléfono; bloque Datos Casalimpia; variación de etapas pipeline |
| **Capturas** | No adjuntas en repo (registro operativo local si aplica) |
| **Validación posterior** | ✅ Parcial completa (módulos operativos); seguridad 403 no re-ejecutada en esta sesión |
| **Decisión** | Ver §8 Dictamen |
| **Próximo paso** | Ver §9 |

**Aprobación:** carga manual previamente aprobada por Daniel en chat.

---

## 3. Entorno

| Campo | Valor |
|-------|--------|
| **URL** | `https://pickup4x4-crm-demo.vercel.app` |
| **Hosting** | Vercel |
| **Proyecto** | `pickup4x4-crm-demo` |
| **APP_MODE esperado** | `client_crm` |
| **Usuario operador** | Daniel / usuario actual |
| **Supabase** | Proyecto **actual** — solo demo técnica (**no** clon separado) |
| **Tipo** | Demo interna — **no** producción, **no** cliente real |
| **Método de carga** | Manual por UI — **sin SQL** |

---

## 4. Leads creados

### 4.1 Atributos comunes (todos los registros)

| Atributo | Valor |
|----------|--------|
| **Pipeline** | Nuevo lead |
| **Comercial** | Daniel |
| **Teléfono** | Vacío |
| **Origen** | `demo_12N_pickup4x4` |
| **Datos Casalimpia** | No completados |
| **Notas** | `[DEMO] ... Dataset ficticio Pickup 4x4 12N.` (variante por lead) |
| **Emails** | `demo+pickupNNN@example.com` (001–012) |

### 4.2 Lista de leads

| # | Nombre oportunidad | Email ficticio | Creado |
|---|-------------------|----------------|--------|
| 1 | Demo — Lona marítima Hilux | demo+pickup001@example.com | ✅ |
| 2 | Demo — Barra antivuelco Ranger | demo+pickup002@example.com | ✅ |
| 3 | Demo — Estribos Frontier | demo+pickup003@example.com | ✅ |
| 4 | Demo — Defensa frontal S10 | demo+pickup004@example.com | ✅ |
| 5 | Demo — Cobertor de caja Amarok | demo+pickup005@example.com | ✅ |
| 6 | Demo — Kit accesorios flota | demo+pickup006@example.com | ✅ |
| 7 | Demo — Portaequipaje techo | demo+pickup007@example.com | ✅ |
| 8 | Demo — Enganche y luces | demo+pickup008@example.com | ✅ |
| 9 | Demo — Interior cuero sintético | demo+pickup009@example.com | ✅ |
| 10 | Demo — Snorkel + filtro | demo+pickup010@example.com | ✅ |
| 11 | Demo — Lona + estribos combo | demo+pickup011@example.com | ✅ |
| 12 | Demo — Consulta genérica accesorios | demo+pickup012@example.com | ✅ |

> **Nota:** no se registran UUID en este documento (no fueron capturados en la ejecución). Identificación para limpieza futura: prefijo **Demo —**, origen `demo_12N_pickup4x4`, dominio `@example.com`.

### 4.3 Validación módulo Leads

| Prueba | Resultado |
|--------|-----------|
| Lista muestra 12 leads | ✅ |
| Búsqueda `demo` → 12 | ✅ |
| Búsqueda `lona` → 2 | ✅ |
| Búsqueda `combo` → 1 | ✅ |
| Kanban muestra 12 | ✅ |
| Todos en columna **Nuevo lead** | ✅ (hallazgo: poca variedad de etapa) |
| Errores visibles | ❌ Ninguno |

**Hallazgo:** todos en **Nuevo lead** — adecuado para demo técnica; para demo comercial más rica, mover manualmente a otras etapas si existen en UI.

---

## 5. Actividades creadas (Agenda)

### 5.1 Atributos comunes

| Atributo | Valor |
|----------|--------|
| **Dueño** | Lead |
| **Comercial** | Daniel |
| **Invitado** | Daniel Admin |
| **Vinculación** | Lead Demo correspondiente |
| **Datos reales** | Ninguno |

### 5.2 Detalle por actividad

| # | Título | Lead vinculado | Tipo | Fecha | Lugar / nota |
|---|--------|----------------|------|-------|----------------|
| 1 | Demo — Seguimiento lona Hilux | Demo — Lona marítima Hilux | llamada | 2026-05-18 | — |
| 2 | Reunión defensa S10 | Demo — Defensa frontal S10 | reunion | 2026-05-19 | Showroom ficticio Pickup 4x4 |
| 3 | Revisar cotización Amarok | Demo — Cobertor de caja Amarok | llamada | 2026-05-21 | — |
| 4 | Recordatorio vencido Frontier | Demo — Estribos Frontier | llamada | 2026-05-16 | Vencida |
| 5 | Visita showroom estribos | Demo — Estribos Frontier | reunion | 2026-05-27 | Showroom ficticio Pickup 4x4 |
| 6 | Seguimiento post-cotización combo | Demo — Lona + estribos combo | llamada | 2026-05-21 | — |
| 7 | Cierre perdido / aprendizaje | Demo — Interior cuero sintético | llamada | 2026-05-16 | — |
| 8 | Onboarding ganado snorkel | Demo — Snorkel + filtro | llamada | 2026-05-19 | — |

### 5.3 Validación módulo Agenda

| Prueba | Resultado |
|--------|-----------|
| Total actividades visibles | 8 ✅ |
| Vencidas visibles | ✅ |
| Hoy visible | ✅ |
| Futuras visibles | ✅ |
| Leads vinculados visibles | ✅ |
| Comercial Daniel visible | ✅ |
| Invitado Daniel Admin visible | ✅ |
| Errores visibles | ❌ Ninguno |

---

## 6. Dashboard validado

| Indicador / bloque | Observado |
|--------------------|-----------|
| Carga | ✅ Sin error |
| Total leads | 12 |
| Pipeline total — Nuevo lead | 12 |
| Salud del pipeline — Bien | 12 |
| Estado de actividad | ✅ No vacío |
| Acciones vencidas | 3 |
| Leads sin próxima acción | 1 |
| Prioridades comerciales | ✅ Visible |
| Alertas comerciales | ✅ Visible |
| Top oportunidades | ✅ Visible |
| Errores visibles | ❌ Ninguno |

**Hallazgo:** concentración en **Nuevo lead** — para narrativa comercial futura conviene distribuir etapas manualmente.

---

## 7. Reportes validados

### 7.1 Hub Reportes (`/admin/reportes`)

| Elemento | Resultado |
|----------|-----------|
| Carga | ✅ Sin error |
| Vista general | ⚠️ Referencia / próximamente |
| Botón Ir a Leads | ✅ Visible |
| Tarjeta Comercial — Leads (listado + filtros) | ✅ Visible |

### 7.2 Reporte Comercial → Leads (`/admin/reportes/comercial/leads`)

| Elemento | Resultado |
|----------|-----------|
| Carga | ✅ Sin error |
| Filas mostradas | 12 / 12 |
| Leads Demo visibles | ✅ |
| Filtros | búsqueda, origen, pipeline, estado, rating, desde/hasta ✅ |
| Exportar CSV | ✅ Disponible |
| Fuente indicada en UI | Datos reales desde `/api/admin/leads` (texto UI) |
| Errores visibles | ❌ Ninguno |

---

## 8. Hallazgos UX / Producto

| # | Hallazgo | Severidad | Nota |
|---|----------|-----------|------|
| 1 | Formulario nuevo lead muestra bloque **“Datos Casalimpia”** | ⚠️ | No corresponde a Pickup 4x4; renombrar a “Datos operativos del lead” u ocultar por cliente/rubro |
| 2 | Lista: “Datos del prospecto” y progreso **13%** en todos | ⚠️ | Aceptable en demo técnica; narrativa de datos incompletos |
| 3 | Todos los leads en **Nuevo lead** | ⚠️ | Útil técnicamente; menos rico comercialmente |
| 4 | Hub reportes con secciones **próximamente** | ⚠️ | Reporte comercial leads **sí** funciona |

---

## 9. Seguridad (referencia, no re-ejecutada en 12N-impl-run)

La carga **no** revalidó el smoke 403 de **12O-run**. Se asume vigente salvo cambio de ENV/deploy.

| Control (12O-run) | Estado esperado |
|-------------------|-----------------|
| Constructor / Configuración en menú | Ocultos |
| Rutas internas críticas | 403 |
| APIs críticas | 403 |

**Recomendación opcional:** mini validación **12O-post-dataset** si hubo redeploy o cambio de variables.

---

## 10. Riesgos y límites

| Riesgo / límite | Detalle |
|-----------------|---------|
| Supabase | Proyecto **actual**, no separado — datos ficticios **ya persisten** en la BD de la demo |
| Alcance | Demo interna — **no** piloto cliente real |
| Rollback | **No** automático; limpieza futura manual o SQL revisable con checklist |
| Marcadores para borrado | Prefijo `Demo —`, origen `demo_12N_pickup4x4`, emails `@example.com` |
| Borrado | **No** borrar sin checklist aprobado |
| Producción / cliente real | **No** validados en esta ejecución |
| Multi-tenant / RLS final | **No** validados |
| Kore / Zeta | **No** tocados |
| SQL | **No** usado en la carga |

---

## 11. Criterios GO / NO-GO (post-carga)

### GO (demo interna)

- ✅ Leads visibles y claramente demo (12/12)
- ✅ Agenda visible (8/8) con mezcla vencidas / hoy / futuras
- ✅ Reporte comercial leads operativo (12/12)
- ✅ Sin datos reales introducidos en la carga
- ✅ Sin errores persistentes observados en módulos probados

### NO-GO (contextos excluidos)

- ❌ Cliente real / preproducción sin Supabase separado y limpieza formal
- ❌ Narrativa comercial rica sin redistribuir etapas (pendiente opcional)
- ❌ UX Datos Casalimpia sin decisión de producto (pendiente)

---

## 12. Dictamen

> **GO** para **demo interna** con dataset ficticio **visible** en Leads, Agenda, Dashboard y Reporte Comercial → Leads.  
> **NO-GO** para **cliente real** o **preproducción** hasta: Supabase separado y/o limpieza formal, distribución de etapas si se requiere narrativa comercial, y resolución del hallazgo UX **Datos Casalimpia**.

---

## 13. Próximo paso recomendado

| Prioridad | Acción |
|-----------|--------|
| 1 | ✅ Documentar esta ejecución (este archivo) |
| 2 | Opcional — ajuste UX: renombrar/ocultar **Datos Casalimpia** por cliente/rubro |
| 3 | Opcional — mover algunos leads a etapas distintas de **Nuevo lead** en UI |
| 4 | Opcional — **12O-post-dataset**: re-smoke 403 y menú tras carga |
| 5 | Antes de cliente real — **12M Go/No-Go** con evidencia y decisión de datos |

---

## 14. Confirmación de alcance (esta tarea documental)

| Ítem | Estado |
|------|--------|
| Código funcional modificado en Cursor | ❌ No |
| TypeScript nuevo | ❌ No |
| SQL ejecutado / creado desde Cursor | ❌ No |
| Supabase tocado desde Cursor | ❌ No |
| Datos insertados/borrados desde Cursor | ❌ No |
| Carga de datos | ✅ Hecha **manualmente por UI** (fuera de este archivo) |
| Endpoints / APIs / middleware | ❌ No modificados |
| Migraciones | ❌ No |
| Usuarios creados | ❌ No |
| Kore / Zeta | ❌ No |
| Commit | ❌ No en esta tarea |

---

*Documento 12N-impl-run — registro de ejecución. Plan previo: `plan-carga-manual-ui-dataset-pickup4x4-12N-impl-plan.md`.*
