# Inventario de Datos Base Madre L1 — Constructor CRM Summer87

**Versión:** Inventario-L1-resultados  
**Relacionado con:** `docs/constructor-crm/selects-inventario-base-madre.md`, `docs/constructor-crm/checklist-limpieza-base-madre.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`

**Estado:** resultados de inventario manual (solo lectura). **No incluye** propuesta de limpieza ejecutable ni SQL destructivo.

---

## 2. Resumen ejecutivo

Se realizó un **inventario manual L1** sobre el proyecto Supabase **summer87-leads-v3** (entorno visible **main / PRODUCTION**), ejecutando únicamente **`SELECT`** seguros documentados en `selects-inventario-base-madre.md`.

**Conclusión general:** la base madre está **bastante limpia en datos operativos grandes** (0 empresas, 0 imports, 0 rubros demo, 1 usuario admin), pero **no está virgen** por el **historial del Constructor**: 4 drafts de paquete instalable, 3 snapshots, 1 decisión de reunión, 1 fila de `crm_setup_config`, 2 leads de prueba Pickup y 18 etapas de pipeline configuradas.

El caso **Pickup 4x4** queda claramente identificado como **caso semilla** (1 draft aprobado con preset `pickup_4x4`, 1 snapshot, 1 meeting decision). Convive con **artefactos de prueba** (1 draft rechazado con motivo `prueba`, 2 drafts genéricos `not-resolved-in-preview`, 2 leads de prueba).

**No se ejecutó limpieza** ni modificación de datos en esta fase.

---

## 3. Alcance

En esta fase:

- Se ejecutaron **SELECTs manuales** en el SQL Editor de Supabase.
- **No** se ejecutó `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`, `DROP`, `ALTER` ni `CREATE`.
- **No** se modificó información en base de datos.
- **No** se limpió ni reseteó ninguna tabla.
- **No** se tocó Kore ni Zeta.
- **No** se crearon tenants ni usuarios nuevos.
- Solo se **documentan resultados observados** para decisión de producto y fase L2.

---

## 4. Entorno observado

| Campo | Valor |
|-------|--------|
| **Proyecto Supabase** | summer87-leads-v3 |
| **Entorno visible** | main / PRODUCTION |
| **Organización visible (UI)** | Cámara Ciudad de la Costa |
| **Fecha del inventario** | 2026-05-17 |
| **Operador** | Daniel |
| **Fuente de resultados** | SELECTs manuales; resultados compartidos en conversación de trabajo |

---

## 5. Resultados de Constructor / Instalador

### 5.1 `installer_package_drafts`

| Métrica | Valor |
|---------|--------|
| **Total** | 4 |
| `approved_for_pilot` / `approved` | 3 |
| `rejected` / `rejected` | 1 |

### 5.2 `installer_package_simulation_snapshots`

| Métrica | Valor |
|---------|--------|
| **Total** | 3 |

### 5.3 `installer_package_meeting_decisions`

| Métrica | Valor |
|---------|--------|
| **Total** | 1 |

### 5.4 `crm_setup_config`

| Campo | Valor |
|-------|--------|
| **Total filas** | 1 |
| **id** | `bb0804fd-cc6a-44ab-8969-2b94cdaad984` |
| **status** | `setup` |
| **current_step** | `auditoria` |
| **readiness_score** | 15 |
| **created_at** | 2026-05-06 |
| **updated_at** | 2026-05-11 |

---

## 6. Drafts identificados

### Draft 1 — Pickup 4x4 / caso semilla

| Campo | Valor |
|-------|--------|
| **id** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **package_version** | `8B-draft-v1` |
| **target_client_id** | `b2222222-2222-4222-8222-222222222222` |
| **constructor_id** | `a1111111-1111-4111-8111-111111111111` |
| **generated_at** | ~2026-05-14 02:23 UTC |
| **Clasificación preliminar** | Pickup 4x4 / **caso semilla** |

### Draft 2 — Rechazado / prueba

| Campo | Valor |
|-------|--------|
| **id** | `6f956975-8aac-4016-a982-29db70eb1b5e` |
| **status** | `rejected` |
| **human_confirmation_status** | `rejected` |
| **package_version** | `8B-draft-v1` |
| **target_client_id** | `22222222-2222-4222-8222-222222222222` |
| **constructor_id** | `11111111-1111-4111-8111-111111111111` |
| **generated_at** | ~2026-05-13 23:41 UTC |
| **rejection_reason** | `prueba` |
| **Clasificación preliminar** | **demo/test** — candidato a limpieza posterior |

### Draft 3 — Genérico / preview no resuelto

| Campo | Valor |
|-------|--------|
| **id** | `defe6513-2c2a-45d7-9254-5bd0d196b0e9` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **package_version** | `8B-draft-v1` |
| **target_client_id** | `22222222-2222-4222-8222-222222222222` |
| **constructor_id** | `11111111-1111-4111-8111-111111111111` |
| **generated_at** | ~2026-05-13 23:36 UTC |
| **target_client_name** (manifest) | `not-resolved-in-preview` |
| **preset** | `NULL` |
| **Clasificación preliminar** | Genérico / preview no resuelto — **revisar** |

### Draft 4 — Genérico / preview no resuelto

| Campo | Valor |
|-------|--------|
| **id** | `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **package_version** | `8B-draft-v1` |
| **target_client_id** | `22222222-2222-4222-8222-222222222222` |
| **constructor_id** | `11111111-1111-4111-8111-111111111111` |
| **generated_at** | ~2026-05-13 22:40 UTC |
| **target_client_name** (manifest) | `not-resolved-in-preview` |
| **preset** | `NULL` |
| **Clasificación preliminar** | Genérico / preview no resuelto — **revisar** |

---

## 7. Pickup 4x4

| Hallazgo | Detalle |
|----------|---------|
| Drafts con `pickup` en `package_payload` | **1** |
| **Draft id** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **package_version** | `8B-draft-v1` |
| **generated_at** | 2026-05-14 02:23:03 |
| **preset** | `pickup_4x4` |
| **target_client_name** | Pickup 4x4 |
| **client_identity_name** | Pickup 4x4 |
| **Snapshots asociados** | 1 |
| **Meeting decisions asociadas** | 1 |
| **decision** | `advance_manual_preparation` |
| **decision_label** | Avanzar a preparación manual controlada |
| **decision_reason_preview** | Pickup 4x4 cuenta con un paquete CRM… |

**Clasificación:** caso semilla, aprendizaje útil, **candidato a exportar/promover a BCR** antes de cualquier limpieza. **No borrar** sin esa exportación y decisión explícita.

---

## 8. Snapshots por draft

| draft_id | snapshot_count | Pickup | target_client_name | preset |
|----------|----------------|--------|--------------------|--------|
| `defe6513-2c2a-45d7-9254-5bd0d196b0e9` | **2** | No | not-resolved-in-preview | NULL |
| `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` | **1** | Sí | Pickup 4x4 | pickup_4x4 |
| `6f956975-8aac-4016-a982-29db70eb1b5e` | **0** | — | — | — |
| `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` | **0** | — | — | — |

**Lectura:** los 2 snapshots del draft genérico `defe6513…` deben revisarse junto con ese draft; el snapshot Pickup está acoplado al caso semilla.

---

## 9. Meeting decisions

### 9.1 Decisión registrada (total: 1)

| Campo | Valor |
|-------|--------|
| **id** | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| **draft_id** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **decision** | `advance_manual_preparation` |
| **decision_label** | Avanzar a preparación manual controlada |
| **decision_reason_preview** | Pickup 4x4 cuenta con un paquete CRM… |
| **Clasificación** | Pickup 4x4 — **conservar como evidencia semilla** |

### 9.2 Decisiones con texto prueba / demo / asdf

| Métrica | Valor |
|---------|--------|
| Filas con `asdf` / `test` / `prueba` / `demo` en motivos o notas | **0** |

---

## 10. Datos de prueba detectados

### 10.1 Draft

- **id** `6f956975-8aac-4016-a982-29db70eb1b5e` — `rejection_reason` = **`prueba`**

### 10.2 Leads

| Nombre | empresa_id | estado | origen | created_at | updated_at |
|--------|------------|--------|--------|------------|------------|
| Prueba Seguimiento Pickup | NULL | NULL | Whatsapp | 2026-05-11 | 2026-05-14 |
| Prueba Pickup 4x4 | NULL | NULL | Whatsapp | 2026-05-11 | 2026-05-11 |

**Clasificación:** demo/test — **candidatos a limpieza posterior**. **No borrar todavía** (pendiente exportación BCR y propuesta L2).

---

## 11. Empresas / Leads

### 11.1 Empresas

| Métrica | Valor |
|---------|--------|
| **total_empresas** | **0** |

### 11.2 Leads

| Métrica | Valor |
|---------|--------|
| **total_leads** | **2** |

Ambos leads listados en §10.2 (prueba Pickup).

**Clasificación:** leads de prueba relacionados a Pickup — limpieza posterior tras decidir exportación/aprendizaje.

---

## 12. Rubros

| Métrica | Valor |
|---------|--------|
| Rubros con nombre demo/test/prueba | **0 filas** |

**Observación operativa:** un SELECT inicial falló por columna `updated_at` inexistente en `rubros`; se corrigió la consulta. Sin impacto en datos (solo lectura).

---

## 13. Usuarios

### 13.1 `app_users`

| Métrica | Valor |
|---------|--------|
| **total_app_users** | **1** |
| **email** | daniel@summer87… (dominio Summer87; no reproducir email completo en repos públicos) |
| **nombre** | Daniel Admin |
| **is_active** | true |
| **created_at** | 2026-04-27 |

**Clasificación:** usuario administrador de la base madre — **no tocar** en limpieza automática. Antes de duplicar la base, **decidir** usuario admin del clon y credenciales nuevas.

### 13.2 Observación de esquema

SELECT inicial falló por columna `role` inexistente en `app_users` (el esquema usa `role_id` + join a `roles`). Consulta corregida. Sin impacto en datos.

---

## 14. Imports

| Tabla | Total |
|-------|--------|
| `entity_import_batches` | **0** |

**Lectura:** no hay imports temporales registrados en la base madre.

---

## 15. Pipelines

| Métrica | Valor |
|---------|--------|
| **total_leads_pipelines** | **18** |

### 15.1 Etapas (`leads_pipelines`)

| nombre | tipo |
|--------|------|
| Contrato | normal |
| Costeo | normal |
| Cotización | normal |
| Evaluación | normal |
| Nuevo | normal |
| Presentación | normal |
| Propuesta | normal |
| Servicios | normal |
| Visita | normal |
| Contacto iniciado | normal |
| Diagnóstico comercial | normal |
| Ganado | ganado |
| Investigación inicial | normal |
| Negociación | normal |
| Nuevo lead | normal |
| Perdido | perdido |
| Propuesta enviada | normal |
| Reunión agendada | normal |

**Clasificación:** configuración comercial general, posiblemente **reusable** en madre o en clones — **revisar manualmente** antes de declarar base virgen. **No limpiar automáticamente.**

### 15.2 Observación de esquema

SELECT inicial falló por columna `activo` inexistente en `leads_pipelines`. Consulta corregida. Sin impacto en datos.

---

## 16. SELECTs fallidos sin impacto

| Bloque | Error | Resolución |
|--------|-------|------------|
| Rubros | Columna `updated_at` inexistente | Ajustar SELECT al esquema real |
| app_users | Columna `role` inexistente | Usar `role_id` + `roles.name` |
| leads_pipelines | Columna `activo` inexistente | Omitir columna o usar columnas existentes |

**Aclaración:** todos fueron **SELECT de lectura**. No generaron cambios. Sirvieron para alinear `selects-inventario-base-madre.md` con el esquema de **production**.

---

## 17. Clasificación consolidada

### A. Conservar / no tocar ahora

- Código Constructor / Instalador (repositorio).
- Documentación estratégica (`docs/constructor-crm/*`, contratos 7W/8x).
- Migraciones estructurales.
- Preset `pickup_4x4` (código).
- Usuario **Daniel Admin** (único `app_users`).
- **18** `leads_pipelines` hasta revisión de producto.
- `crm_setup_config` (1 fila) hasta decisión de reset o migración a clon.

### B. Exportar / promover a BCR antes de limpiar

- Draft Pickup `0fa4f061-cdd1-4693-a20a-9ff5e92ca999`
- Snapshot asociado a ese draft (preset `pickup_4x4`)
- Meeting decision `9c04f4a5-774e-4e8a-8654-a2f49ae297ea`
- Checklist, preguntas y textos de reunión Pickup (UI/código + payload del draft)

### C. Revisar manualmente

- 2 drafts `approved_for_pilot` con `not-resolved-in-preview` (`defe6513…`, `d77f2e3e…`)
- 2 snapshots del draft `defe6513…`
- Catálogo completo de `leads_pipelines`
- Estado de `crm_setup_config` (`auditoria`, score 15)
- Política de `app_users` al duplicar base madre

### D. Candidatos a limpieza posterior (L2+, con aprobación)

- Draft rechazado `6f956975…` (motivo `prueba`)
- Leads «Prueba Seguimiento Pickup» y «Prueba Pickup 4x4»
- Drafts/snapshots genéricos **si** se confirma que no aportan aprendizaje tras revisión

### E. Limpio / sin filas relevantes

- **empresas:** 0
- **rubros** demo/test/prueba: 0
- **entity_import_batches:** 0
- **meeting decisions** con texto prueba/demo/asdf: 0

---

## 18. Riesgos para base madre duplicable

1. **Base no virgen** por drafts, snapshots y meeting decision del Constructor.
2. **Leads de prueba Pickup** mezclados con futuro CRM operativo si se duplica la misma BD.
3. **18 pipelines** posiblemente heredados de otro contexto comercial — riesgo de arrastrar configuración no alineada al siguiente cliente.
4. **`crm_setup_config`** en paso `auditoria` con score bajo — estado de fábrica a medio configurar.
5. **Pickup 4x4 mezclado con pruebas** si no se clasifica y exporta a BCR antes de limpiar.
6. **Duplicar production** tal cual arrastraría evidencia técnica vieja y UUIDs de placeholder (`22222222…`, `11111111…`).
7. **Limpiar Pickup sin exportar a BCR** perdería el único caso semilla documentado en BD.

---

## 19. Recomendación

**No ejecutar limpieza todavía.**

1. Crear **propuesta de limpieza controlada L2** (`docs/constructor-crm/` — fase 11J sugerida).
2. **Antes de limpiar Pickup:**
   - Decidir si permanece como **caso semilla** permanente en madre o solo en BCR/archivo.
   - **Exportar/promover** aprendizaje a BCR (blueprint, preguntas, riesgos, lección).
   - Decidir si el draft Pickup queda como **evidencia histórica** en madre o se archiva/supersede.
3. **Después** (solo con propuesta aprobada):
   - Limpiar o resetear drafts genéricos y draft `prueba`.
   - Limpiar leads de prueba.
   - Revisar y eventualmente normalizar `leads_pipelines`.
   - Decidir reset o nueva fila de `crm_setup_config` para base “virgen duplicable”.
4. **Duplicación a cliente:** usar **proyecto Supabase nuevo** + código etiquetado; no clonar este production con datos de evidencia.

---

## 20. Próxima fase sugerida

**Fase 11J — Propuesta de limpieza controlada de base madre L2**

**Objetivo:** documentar exactamente qué se limpiaría, qué se conservaría, qué se exportaría a BCR y qué SQL (`SELECT` de verificación + `DELETE` propuesto) se revisaría **más adelante**, **sin ejecutarlo** en la misma entrega.

**Entradas:** este inventario L1, checklist de limpieza, decisión Pickup/BCR, revisión de pipelines.

---

## 21. Confirmación de alcance

Este documento de resultados:

- **No borró** datos.
- **No modificó** datos.
- **No ejecutó** SQL destructivo (la ejecución previa del operador fue solo `SELECT`).
- **No creó** endpoints ni scripts.
- **No creó** migraciones.
- **No instaló** CRM ni creó tenant/usuario.
- **No tocó** Kore ni Zeta.

Solo registra el **estado observado** el 2026-05-17 en summer87-leads-v3 (production) para decisiones de producto y la fase L2.

---

*Última actualización: 2026-05-17 — Inventario L1 cerrado.*
