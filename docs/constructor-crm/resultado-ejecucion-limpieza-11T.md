# Resultado Ejecución Limpieza 11T — Base Madre Constructor CRM Summer87

**Versión:** Fase 11T (resultado de ejecución)  
**Fecha de ejecución:** 2026-05-17  
**Responsable:** Daniel / Summer87  
**Autorización:** `docs/constructor-crm/decision-final-limpieza-minima-11S.md` (Opción B — solo Bloque 3)  
**SQL de referencia:** `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md` — **Bloque 3**  
**Proyecto Supabase:** summer87-leads-v3 (main / PRODUCTION)

---

## 2. Resumen ejecutivo

Se ejecutó la **limpieza mínima autorizada** en 11S: eliminación de **2 leads de prueba** en `public.leads`, mediante **Bloque 3** del SQL propuesto L3.

**Resultado:** ambas filas eliminadas con `COMMIT`. Validación posterior: `SELECT` por nombres exactos → **0 filas**; `COUNT(*)` en `public.leads` → **0**.

No se modificaron tablas del Instalador, Pickup 4x4, usuarios, pipelines ni `crm_setup_config`.

---

## 3. Alcance ejecutado

| Campo | Valor |
|-------|--------|
| **Tabla afectada** | `public.leads` |
| **Filas eliminadas** | **2** |
| **Nombres exactos** | `Prueba Seguimiento Pickup`, `Prueba Pickup 4x4` |
| **Bloque ejecutado** | Bloque 3 — `sql-propuesto-limpieza-base-madre-L3.md` |
| **Criterio DELETE** | `WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4')` |
| **Herramienta** | Supabase SQL Editor |
| **Transacción** | `BEGIN` → `DELETE ... RETURNING` → `COMMIT` (tras simulación con `ROLLBACK`) |

---

## 4. Validación previa

### SELECT por nombres exactos

Antes del DELETE definitivo, `SELECT` por nombres exactos devolvió **exactamente 2 filas** (coincide con inventario L1).

| id | nombre | empresa_id | estado | origen |
|----|--------|------------|--------|--------|
| `a0e066d3-b846-4fdc-b476-2ef4d82794bf` | Prueba Seguimiento Pickup | NULL | NULL | Whatsapp |
| `fa68e48d-f91c-4e1b-869b-b5c1e1f0f439` | Prueba Pickup 4x4 | NULL | NULL | Whatsapp |

**Lectura:** sin empresa asociada; estado NULL; origen Whatsapp en ambos casos.

---

## 5. Simulación con ROLLBACK

| Paso | Resultado |
|------|-----------|
| `BEGIN` | Iniciada transacción de prueba |
| `DELETE ... RETURNING` (mismos nombres exactos) | **2 filas** en `RETURNING` (esperado) |
| `ROLLBACK` | Aplicado |
| **Persistencia** | **Sin cambios** en base (simulación correcta) |

La simulación confirmó que el `DELETE` afectaba solo las dos filas previstas antes del `COMMIT` real.

---

## 6. Ejecución real con COMMIT

| Paso | Resultado |
|------|-----------|
| `BEGIN` | Iniciada transacción real |
| `DELETE ... RETURNING` | **2 filas eliminadas** reportadas en `RETURNING` |
| Filas en RETURNING | Prueba Pickup 4x4; Prueba Seguimiento Pickup |
| `COMMIT` | Aplicado |
| **Persistencia** | Cambios **confirmados** en Supabase |

---

## 7. Validación posterior

Ejecutada en la misma sesión / inmediatamente después del `COMMIT`:

| Verificación | Resultado |
|--------------|-----------|
| `SELECT` por `nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4')` | **0 rows** |
| `SELECT COUNT(*) FROM public.leads` | **0** |

**Conclusión directa:** la tabla `public.leads` quedó **vacía** tras esta ejecución (coherente con L1: solo existían esos 2 leads).

---

## 8. Qué NO se tocó

En esta ejecución 11T **no** se ejecutó SQL sobre:

| Área | Detalle |
|------|---------|
| `installer_package_drafts` | Sin DELETE/UPDATE |
| `installer_package_simulation_snapshots` | Sin DELETE/UPDATE |
| `installer_package_meeting_decisions` | Sin DELETE/UPDATE |
| Draft Pickup 4x4 | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` — no tocado |
| Meeting decision Pickup | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` — no tocado |
| Snapshots Pickup | Asociados al draft semilla — no tocados |
| Draft rechazado prueba | `6f956975-8aac-4016-a982-29db70eb1b5e` — no tocado |
| Drafts genéricos | `defe6513…`, `d77f2e3e…` — no tocados |
| `app_users` | Daniel Admin — no tocado |
| `leads_pipelines` | 18 etapas — no tocado |
| `crm_setup_config` | 1 fila — no tocado |
| `empresas` | No tocado (ya 0 en L1) |
| `entity_import_batches` | No tocado |
| Kore / Zeta | Sin escritura ni limpieza externa |
| Código, migraciones, endpoints, scripts repo | Sin cambios |
| Preset / documentación BCR Pickup | Sin cambios en repo en esta fase |

---

## 9. Estado esperado después de 11T

| Recurso | Antes (L1) | Después 11T | Validación en esta fase |
|---------|------------|-------------|-------------------------|
| **leads** | 2 | **0** | ✅ Validado (`COUNT(*)` = 0) |
| **installer_package_drafts** | 4 | 4 (esperado) | ⏳ Sin re-ejecutar SELECT de conteo en 11T |
| **installer_package_simulation_snapshots** | 3 | 3 (esperado) | ⏳ Sin re-ejecutar SELECT de conteo en 11T |
| **installer_package_meeting_decisions** | 1 | 1 (esperado) | ⏳ Sin re-ejecutar SELECT de conteo en 11T |
| **empresas** | 0 | 0 (esperado) | No tocado |
| **app_users** | 1 | 1 (esperado) | No tocado |
| **leads_pipelines** | 18 | 18 (esperado) | No tocado |
| **crm_setup_config** | 1 | 1 (esperado) | No tocado |

**Nota:** Solo se **validó directamente** el estado de `public.leads`. Los demás conteos permanecen como **«sin cambios esperados»** porque no hubo SQL sobre esas tablas; conviene reconfirmar con Bloque 0 del SQL 11O en fase 11U o antes de una futura limpieza Bloque 4.

---

## 10. Riesgos residuales

| Riesgo | Estado |
|--------|--------|
| Restore de backup **no probado** | Sigue vigente (11R: backups visibles, sin restore ejecutado) |
| Draft rechazado `prueba` | **Sigue existiendo** (`6f956975…`) |
| Drafts genéricos `not-resolved-in-preview` | **Siguen existiendo** (2 drafts) |
| `crm_setup_config` en paso auditoría | **Sin cambio** |
| Base madre **no completamente virgen** | Drafts/snapshots/decision Instalador + pipelines + setup |
| Validación **UI/app** | **Pendiente** (fase 11U sugerida) |
| Nuevos leads creados tras 11T | Monitorear; hoy tabla en 0 |

---

## 11. Próxima fase sugerida

### Fase 11U — Validación visual / app post-limpieza mínima

| # | Acción |
|---|--------|
| 1 | Abrir app local (entorno apuntando a summer87-leads-v3) |
| 2 | Revisar módulo **leads** — no deben aparecer «Prueba…» |
| 3 | Abrir `/admin/constructor-crm/paquetes` — **Pickup 4x4** visible |
| 4 | Abrir detalle Pickup — snapshot y meeting decision presentes |
| 5 | Login **Daniel Admin** |
| 6 | `npm run build` si corresponde al flujo de release |
| 7 | Opcional: re-ejecutar SELECT conteos Bloque 0 (11O) y pegar en anexo 11U |

### Fases posteriores (no autorizadas por 11T)

| Fase | Contenido |
|------|-----------|
| Decisión aparte | Bloque 4 — draft rechazado `prueba` |
| Decisión aparte | Bloque 5 — drafts/snapshots genéricos |
| L4 extendido | Documento de cierre si se encadena más limpieza |

---

## 12. Confirmación de alcance (fase 11T — documentación de resultado)

**Lo que ocurrió en Supabase (ejecución real):**

- ✅ Se ejecutó SQL **limitado** a `public.leads` (Bloque 3)
- ✅ Se eliminaron **solo 2** leads de prueba (nombres exactos)
- ✅ Simulación previa con `ROLLBACK` sin persistir
- ✅ `COMMIT` en ejecución real

**Lo que no ocurrió en esta fase documental / alcance acotado:**

- ❌ No se modificó código funcional en repo (este entregable es solo `.md`)
- ❌ No se crearon endpoints ni scripts en repo
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se tocó Pickup ni tablas `installer_package_*`
- ❌ No se inventaron validaciones de conteo Instalador en esta ejecución (pendiente 11U)

---

*Resultado 11T — Limpieza mínima de leads completada. Base madre: leads = 0; Instalador y Pickup intactos según alcance.*
