# Resultados Inspección Read-only Leads contract_fields_json 12W-5d-SCHEMA-1-RESULTS — Constructor CRM Summer87

**Versión:** 12W-5d-SCHEMA-1-RESULTS — resultados de inspección manual Supabase  
**Proyecto:** summer87-leads-v3  
**Base documental:** `diseno-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1.md`, `diseno-persistencia-campos-dinamicos-pickup-12W-5d.md`, `diseno-mapping-nuevo-lead-pickup-payload-12W-5c.md`  
**Ejecutor:** Daniel — Supabase SQL Editor (SELECT-only)  
**Estado:** inspección completada; **sin** escritura en BD ni cambios en código.

---

## 1. Resumen ejecutivo

- **`public.leads` existe** en el entorno Supabase objetivo (proyecto **summer87-leads-v3**, rama visible **main / PRODUCTION**).
- **`contract_fields_json` no existe** ni aparece columna homónima obvia (`custom_fields`, `lead_fields`, `dynamic_fields`, `extra_fields` tampoco).
- La tabla ya tiene **cinco columnas JSONB** con semántica legacy/consultiva distinta a campos dinámicos del contrato Pickup; **no se recomienda reutilizarlas** para `contract_fields_json`.
- **Volumen bajo:** 12 leads, todos en pipeline **`Nuevo lead`**; entorno coherente con demo Pickup.
- **RLS habilitado** (`rls_enabled = true`, `rls_forced = false`); **0 policies** visibles en `pg_policies` — no bloquea diseño DDL, pero debe considerarse en **12W-5e** (API/UI).
- **Dictamen:** **GO** para pasar a **12W-5d-SQL-1** (diseño DDL documental). **NO-GO** para ejecutar DDL en esta fase.
- **Alcance cumplido:** solo **SELECT manual** ejecutado por Daniel; **ningún** ALTER/CREATE/UPDATE/INSERT/DELETE.

---

## 2. Entorno

| Campo | Valor |
|-------|--------|
| Proyecto Supabase | summer87-leads-v3 |
| Rama / entorno visible | main / PRODUCTION |
| Tabla inspeccionada | `public.leads` |
| Ejecutor | Daniel |
| Fecha inspección | 2026-05-21 |
| SQL ejecutado | SELECT-only manual (Supabase SQL Editor) |
| Cursor ejecutó SQL | **No** |
| DDL / DML ejecutado | **No** |

---

## 3. PRECHECK

| Verificación | Resultado |
|--------------|-----------|
| ¿Existe `public.leads`? | **Sí** |

La tabla está disponible para inspección de schema, conteos y muestra segura.

---

## 4. Estructura y columnas

Se inspeccionó `information_schema.columns` sobre `public.leads` en la instancia real (no inferido solo desde repo).

### Hallazgo principal

| Columna objetivo | ¿Presente? |
|------------------|------------|
| `contract_fields_json` | **No** |

### Columnas relevantes observadas (no exhaustivo)

Entre las columnas visibles en la inspección figuran campos **core/legacy** del CRM, entre otros:

`id`, `nombre`, `contacto`, `telefono`, `email`, `origen`, `estado`, `notas`, `created_at`, `updated_at`, `pipeline`, `rating`, `next_activity_type`, `next_activity_at`, `ai_context`, `ai_report`, `membership_goals`, `icp_targets`, `company_size`, `website`, `objetivos`, `audiencia`, `oferta`, `instagram`, `direccion`, `commercial_strategy_json`, `rubro_id`, `cantidad_personal`, `superficie_m2`, `cantidad_pisos`, `cantidad_banos`, `installation_details_json`, `visita_scheduled_at`, `visita_relevamiento_json`, entre otras.

**Nota de alcance:** el inventario completo de columnas queda respaldado por captura/manual de Daniel en Supabase; este documento **no inventa** columnas no vistas en esa inspección.

---

## 5. JSONB existentes

| Columna | Tipo observado | Uso en conteos §12 | Semántica (observada / diseño) |
|---------|----------------|-------------------|--------------------------------|
| `objetivos` | jsonb | Incluida | Legacy consultivo / membresía |
| `audiencia` | jsonb | Incluida | Legacy consultivo / ICP |
| `commercial_strategy_json` | jsonb | Incluida | Estrategia comercial (no contrato lead_fields) |
| `installation_details_json` | jsonb | Incluida | Detalle instalación Casa Limpia / rubro |
| `visita_relevamiento_json` | jsonb | **No** incluida en conteo §12 | Relevamiento de visita (dominio distinto) |

### Por qué no reutilizar estos JSONB para campos dinámicos Pickup

1. **Semántica distinta:** cada columna ya modela un agregado de negocio legacy (consultoría, instalación, visita), no el mapa `lead_fields` / contrato Pickup de **12W-5d**.
2. **Riesgo de colisión:** mezclar claves Pickup en JSONB con datos históricos o vacíos complica validación, migración y lectura en API.
3. **Diseño acordado en 12W-5d:** columna dedicada **`contract_fields_json`** nullable, con whitelist futura vía `packageToLeadFields()`.
4. **Evidencia de vacío:** los cuatro JSONB del conteo §12 tienen **0 filas no vacías** en los 12 leads; reutilizar no aporta datos útiles y sí acopla dominios.

---

## 6. Índices

Índices detectados en `public.leads`:

| Índice |
|--------|
| `idx_leads_empresa_id` |
| `idx_leads_is_member` |
| `idx_leads_rubro_id` |
| `idx_leads_socio_id` |
| `leads_created_at_idx` |
| `leads_pipeline_idx` |
| `leads_pkey` |

No se observó índice sobre `contract_fields_json` (columna inexistente).

---

## 7. Constraints

Constraints detectados:

| Constraint |
|------------|
| `leads_empresa_id_fkey` |
| `leads_comercial_id_fkey` |
| `leads_initiative_kind_check` |
| `leads_next_activity_type_allowed` |
| `leads_pkey` |
| `leads_rating_range` |
| `leads_rubro_id_fkey` |
| `leads_score_range` |
| `leads_socio_id_fkey` |

Ningún constraint nombra `contract_fields_json`. El diseño DDL en SQL-1 debe evaluar si conviene constraint/check o solo tipo `jsonb` nullable.

---

## 8. Triggers

| Trigger | Evento | Timing | Función |
|---------|--------|--------|---------|
| `trg_leads_updated_at` | UPDATE | BEFORE | `set_updated_at()` |

Impacto para DDL: `ADD COLUMN` no requiere cambio de trigger; escrituras futuras en `contract_fields_json` seguirán actualizando `updated_at` vía el mismo trigger en UPDATE de fila.

---

## 9. Policies / RLS

| Verificación | Resultado |
|--------------|-----------|
| `pg_policies` sobre `leads` | **0 filas** |
| `rls_enabled` | **true** |
| `rls_forced` | **false** |

### Observación

- **No bloquea** el diseño documental de DDL en **12W-5d-SQL-1** ni la ejecución manual posterior en SQL-2 si Daniel aprueba.
- **Sí debe considerarse** en **12W-5e**: con RLS activo y sin policies listadas en esta inspección, el comportamiento efectivo en API (service role vs authenticated) debe validarse antes de asumir lectura/escritura desde el cliente admin.

---

## 10. Volumen y distribución

| Métrica | Valor |
|---------|--------|
| `total_leads` | **12** |

### Distribución por `pipeline`

| pipeline | cantidad |
|----------|----------|
| Nuevo lead | **12** |

Entorno acotado y homogéneo; migración o backfill de `contract_fields_json` sería de bajo volumen cuando se apruebe en SQL-2.

---

## 11. Campos core POST

Conteos sobre los 12 leads (campos alineados con POST Nuevo Lead / inspección SCHEMA-1):

| Campo / métrica | Con dato (conteo) | Total |
|-----------------|-------------------|-------|
| total | — | **12** |
| `nombre` (con_nombre) | **12** | 12 |
| `contacto` (con_contacto) | **12** | 12 |
| `telefono` (con_telefono) | **0** | 12 |
| `email` (con_email) | **11** | 12 |
| `origen` (con_origen) | **5** | 12 |
| `oferta` (con_oferta) | **12** | 12 |
| `notas` (con_notas) | **12** | 12 |
| `direccion` (con_direccion) | **0** | 12 |
| `next_activity_type` | **11** | 12 |
| `next_activity_at` | **0** | 12 |
| `comercial_id` | **12** | 12 |
| `rubro_id` | **0** | 12 |
| `visita_scheduled_at` | **0** | 12 |

**Lectura rápida:** el demo tiene nombre/contacto/oferta/notas/comercial_id casi completos; teléfono, dirección, rubro y fechas de actividad/visita están mayormente vacíos.

---

## 12. Uso JSONB legacy

Conteos sobre **12** leads (subconjunto del diseño SCHEMA-1 §7.4):

| JSONB | No vacío |
|-------|----------|
| `objetivos` | **0** |
| `audiencia` | **0** |
| `installation_details_json` | **0** |
| `commercial_strategy_json` | **0** |

### Observación — `visita_relevamiento_json`

- La columna **existe** como `jsonb` (confirmado en §5).
- **No fue incluida** en el conteo concreto de esta subsección (§7.4 del diseño).
- Documentar explícitamente para SQL-1: si se necesita baseline de uso, repetir conteo `visita_relevamiento_json` en SQL-2 pre-DDL o en QA; hoy no bloquea GO a diseño DDL.

---

## 13. Muestra segura

- Se ejecutó muestra de **10 leads** con **teléfono/email enmascarados** en el SELECT.
- **No se registran** teléfonos ni emails completos en este documento.

### Nombres demo observados (sin PII completa)

| # | nombre (observado) |
|---|-------------------|
| 1 | Demo — Consulta genérica accesorios |
| 2 | Demo — Lona + estribos combo |
| 3 | Demo — Snorkel + filtro |
| 4 | Demo — Interior cuero sintético |
| 5 | Demo — Enganche y luces |
| 6 | Demo — Portaequipaje techo |
| 7 | Demo — Kit accesorios flota |
| 8 | Demo — Cobertor de caja Amarok |
| 9 | Demo — Defensa frontal S10 |
| 10 | Demo — Estribos Frontier |

### Patrones adicionales (agregados, sin PII)

- **Pipeline:** todos los visibles en **`Nuevo lead`**.
- **Origen:** mayormente `NULL`; algunos valores tipo `demo_12N_pickup...` (prefijo demo, no expandido aquí).

---

## 14. Compatibilidad `contract_fields_json`

### Búsqueda por nombres parecidos (`%field%`, `%json%`, etc.)

| Columna encontrada | Tipo |
|--------------------|------|
| `ai_custom_prompt` | text |
| `proposal_draft_json` | text |
| `commercial_strategy_json` | jsonb |
| `installation_details_json` | jsonb |
| `visita_relevamiento_json` | jsonb |

### Candidatas conocidas (lista explícita del diseño)

| Columna esperada | ¿Devuelta? |
|------------------|------------|
| `objetivos` | Sí (jsonb) |
| `audiencia` | Sí (jsonb) |
| `commercial_strategy_json` | Sí (jsonb) |
| `installation_details_json` | Sí (jsonb) |
| `contract_fields_json` | **No** |
| `custom_fields` | **No** |
| `lead_fields` | **No** |
| `dynamic_fields` | **No** |
| `extra_fields` | **No** |

### Conclusión de compatibilidad

- **`contract_fields_json` ausente** — hueco limpio para `ADD COLUMN` en fase SQL-1/SQL-2.
- **JSONB existentes no son equivalentes** al contrato dinámico Pickup; son dominios legacy separados.
- **`proposal_draft_json`** es `text`, no jsonb — no sustituto.

---

## 15. GO / NO-GO

| Criterio | Resultado | Dictamen |
|----------|-----------|----------|
| Tabla `public.leads` existe | Sí | **GO** SQL-1 |
| `contract_fields_json` ausente | Confirmado | **GO** SQL-1 |
| Sin columna homónima obvia | Confirmado | **GO** SQL-1 |
| JSONB legacy semánticamente distintos | 5 jsonb, 0 uso en 4 contados | **GO** columna nueva |
| Volumen bajo / demo acotado | 12 leads, 1 pipeline | **GO** diseño reversible |
| Policies visibles | 0 rows | **GO** DDL diseño; atención API 5e |
| RLS | enabled, not forced | **GO** DDL; revisar en 5e |
| Ejecutar DDL en SCHEMA-1-RESULTS | No ejecutado | **NO-GO** DDL aquí |
| Ejecutar DDL sin SQL-1 + aprobación Daniel | N/A | **NO-GO** hasta SQL-2 manual |

### Dictamen final

| Fase | Veredicto |
|------|-----------|
| **12W-5d-SQL-1** (diseño DDL + rollback documental) | **GO** |
| **DDL directo en esta fase** | **NO-GO** |

**Motivo GO SQL-1:** tabla operativa confirmada, columna objetivo ausente, precedente de columnas JSONB en la misma tabla, volumen bajo, sin policies listadas que impidan planificar DDL; JSONB actuales no cubren el contrato Pickup.

**Motivo NO-GO DDL ahora:** SCHEMA-1 es solo inspección; el DDL debe diseñarse en SQL-1 y ejecutarse manualmente solo en **12W-5d-SQL-2** si Daniel aprueba.

---

## 16. Próximas fases

| Fase | Entregable / acción |
|------|---------------------|
| **12W-5d-SQL-1** | Diseño DDL `contract_fields_json` (+ rollback, impacto índices/RLS, notas sobre JSONB legacy) |
| **12W-5d-SQL-2** | Ejecución manual en Supabase **solo si Daniel aprueba** |
| **12W-5e** | API/UI custom fields; validar RLS y políticas efectivas |
| **12W-5-QA** | POST controlado en Vercel con payload Pickup y lectura de `contract_fields_json` |

---

## 17. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| API modificada | **No** |
| SQL ejecutado | Solo **SELECT** manual (Daniel) |
| DDL ejecutado | **No** |
| Datos modificados | **No** |
| Supabase modificado (schema/datos) | **No** |
| Solo documentación | **Sí** (este archivo) |
| Commit | **No** (salvo pedido explícito posterior) |

---

*Documento generado a partir de resultados confirmados por Daniel el 2026-05-21. Inspección read-only SCHEMA-1 cerrada.*
