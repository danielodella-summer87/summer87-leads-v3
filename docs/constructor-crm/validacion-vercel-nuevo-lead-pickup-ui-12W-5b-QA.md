# Validación Vercel Nuevo Lead Pickup UI 12W-5b-QA — Constructor CRM Summer87

**Versión:** 12W-5b-QA — QA manual Vercel post UI Pickup Nuevo Lead  
**Proyecto:** summer87-leads-v3  
**Fase previa:** 12W-5b (commit `cb5c910`) — UI por bloques sin persistencia nueva  
**Diseño de referencia:** `diseno-nuevo-lead-pickup-fields-12W-5a.md` (commit `3e7e354`)

---

## 1. Resumen ejecutivo

- QA manual en Vercel ejecutada por Daniel posterior al cierre de **12W-5b** (`cb5c910`).
- La pantalla **Nuevo Lead** carga sin error en el entorno demo Pickup 4x4.
- El formulario ya se percibe como **Pickup 4x4 por bloques** (A–E), no como formulario genérico legacy.
- El select **Etapa comercial** conserva el filtro de **9 etapas contract**; no aparecen etapas legacy.
- El bloque **Vehículo** queda claramente como sección **no persistente / fase futura** (informativa, sin edición).
- **Dictamen:** **GO** visual/UX para 12W-5b. **NO-GO** para afirmar persistencia de vehículo u otros campos no mapeados al POST.

---

## 2. Entorno

| Ítem | Valor |
|------|-------|
| **URL** | https://pickup4x4-crm-demo.vercel.app/admin/leads/nuevo |
| **Commit base** | `cb5c910` (12W-5b — UI Nuevo Lead Pickup por bloques) |
| **Validador** | Daniel |
| **Fecha** | 2026-05-20 |
| **Modo esperado** | `client_crm` (tenant demo Pickup 4x4) |

---

## 3. Alcance

**Incluido en esta validación:**

- Carga de la pantalla Nuevo Lead
- Bloques visuales A–E (Pickup)
- Bloque Vehículo informativo / no editable
- Select **Etapa comercial** (pipeline `contractOnly=1`)
- Visibilidad u ocultación de campos legacy en `client_crm`
- CTA principal **Guardar** (único, sin duplicar CTAs verdes)

**Excluido:**

- Crear lead de prueba
- Guardar cambios / submit real
- Validación POST / payload en runtime
- SQL, Supabase, migraciones
- Persistencia de vehículo
- Kanban, Ficha, Lista de leads
- Build local / deploy nuevo

---

## 4. Validación carga general

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Pantalla carga sin error | OK | **GO** |
| Título «Nuevo lead» visible | OK | **GO** |
| Un solo CTA principal «Guardar» | OK | **GO** |
| Pantalla rota / error visible | No observado | **GO** |

---

## 5. Validación bloques Pickup

| Bloque | Resultado observado | Dictamen |
|--------|---------------------|----------|
| **A — Identificación del contacto** | Visible; label «Nombre / Razón social» | **GO** |
| **B — Vehículo** | Visible; informativo, no editable | **GO** |
| **C — Necesidad comercial** | Visible | **GO** |
| **D — Gestión comercial** | Visible | **GO** |
| **E — Datos operativos opcionales** | Visible | **GO** |

La estructura por secciones coincide con el diseño 12W-5a/5b: flujo contacto → vehículo (visual) → necesidad → gestión → operativos.

---

## 6. Validación bloque Vehículo

| Check | Resultado |
|-------|-----------|
| Campos no editables | OK — bloque informativo |
| Muestra Marca, Modelo, Año, Matrícula, Uso del vehículo | OK |
| Indica «Preparado para próxima fase» | OK |
| Aclara que la persistencia estructurada se activará en fase posterior | OK |

**Dictamen:** **GO**

**Nota de cumplimiento 12W-5b:** esta validación confirma la decisión de fase **sin persistencia nueva** — el bloque B cumple el objetivo de capacitación y expectativa de producto sin enviar marca/modelo/año/matrícula/uso al POST. No debe interpretarse como persistencia activa.

---

## 7. Validación Pipeline

| Check | Resultado | Dictamen |
|-------|-----------|----------|
| Etapa por defecto coherente («Nuevo lead») | OK | **GO** |
| Select con **9 etapas** contract | OK | **GO** |
| Sin etapas legacy en el desplegable | OK | **GO** |

**Etapas observadas en Vercel (9):**

1. Nuevo lead  
2. Consulta calificada  
3. Vehículo identificado  
4. Necesidad detectada  
5. Presupuesto enviado  
6. Negociación  
7. Ganado  
8. Perdido  
9. Postventa / seguimiento  

Coherente con el filtro `contractOnly=1` validado en bloques 12W-4d-FILTER (Nuevo Lead, Kanban, Ficha).

---

## 8. Validación campos legacy en `client_crm`

| Campo legacy | Resultado en UI |
|--------------|-----------------|
| Rubro | No visible |
| Cantidad de personal | No visible |
| Superficie m² | No visible |
| Fecha de revisión o seguimiento | No visible |
| Dirección | Visible (bloque E) |

**Dictamen:** **GO** — ruido legacy reducido en `client_crm`; solo dirección en operativos opcionales.

---

## 9. No ejecutado (explícito)

- No se creó lead.
- No se guardaron cambios.
- No se ejecutó POST real a `/api/admin/leads`.
- No se ejecutó SQL.
- No se modificaron datos en Supabase.
- No se validó movimiento de cards en Kanban.
- No se abrió Ficha ni Lista para regresión cruzada en esta sesión.

Esta omisión es **intencional** para acotar el QA a UI/UX en Nuevo Lead sin efectos colaterales en datos demo.

---

## 10. Riesgos pendientes

| Riesgo | Impacto | Mitigación / fase |
|--------|---------|-------------------|
| Vehículo todavía no persiste | Usuario puede asumir que Marca/Modelo se guardan | Copy en bloque B + banner futuro en 12W-5e; persistencia en 12W-5d |
| Expectativa de guardado de vehículo | Frustración post «Guardar» | QA POST futuro (12W-5-QA) cuando exista persistencia |
| Falta **12W-5c** mapping mínimo | Labels/selects aún parcialmente hardcodeados vs contrato | Siguiente paso técnico recomendado |
| Falta **12W-5d** decisión JSONB/EAV | Bloqueo para datos estructurados multi-cliente | Diseño antes de SQL |
| QA POST no realizado aquí | No se validó payload ni redirect post-create | Ejecutar en fase QA con lead demo controlado |

---

## 11. Dictamen final

| Pregunta | Dictamen |
|----------|----------|
| ¿12W-5b cumple objetivo visual/UX Pickup? | **GO** |
| ¿Se puede afirmar persistencia de vehículo? | **NO-GO** |
| ¿Pipeline contract sigue correcto en Nuevo Lead? | **GO** |
| ¿Campos legacy ocultos en `client_crm`? | **GO** |

**Próximo paso recomendado:**

1. **12W-5c** — Mapeo mínimo contrato → payload actual (labels, `activity_types`, canales origen) **si** se prioriza cerrar guardado alineado al contrato sin ampliar BD.  
2. **12W-5d** — Decisión y diseño de persistencia dinámica (JSONB/EAV) **si** se prioriza que vehículo y campos de oportunidad se guarden estructuradamente.  
3. **12W-5-QA (POST)** — Crear lead demo controlado en Vercel una vez definida persistencia o mapeo 5c.

---

## 12. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Lead creado | **No** |
| Guardado ejecutado | **No** |
| Solo documentación | **Sí** |
| Commit | **No** (por instrucción de fase) |

---

## Referencias

- Implementación UI: `app/admin/leads/nuevo/page.tsx` (12W-5b, `cb5c910`)
- Validación técnica local: `validacion-ui-nuevo-lead-pickup-fields-12W-5b.md`
- Diseño campos: `diseno-nuevo-lead-pickup-fields-12W-5a.md`
- QA pipeline FILTER: `validacion-vercel-pipeline-filter-12W-4d-QA.md`
