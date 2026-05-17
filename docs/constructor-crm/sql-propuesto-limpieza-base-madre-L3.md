# SQL Propuesto de Limpieza Base Madre L3 — Constructor CRM Summer87

**Versión:** Limpieza-L3-SQL-propuesto (fase 11O — documental)  
**Relacionado con:** `docs/constructor-crm/propuesta-limpieza-segura-L3.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/selects-inventario-base-madre.md`

**Estado:** SQL revisable **no ejecutado**. Fecha de referencia inventario: **2026-05-17** (L1).

---

## ⚠️ ADVERTENCIA INICIAL — LEER ANTES DE CUALQUIER BLOQUE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  NO EJECUTAR SIN CONFIRMACIÓN EXPLÍCITA DE DANIEL                           ║
║                                                                              ║
║  • Este documento es SOLO para revisión humana.                               ║
║  • El SQL describe una limpieza FUTURA de datos demo/test.                     ║
║  • Requiere BACKUP verificado del proyecto Supabase antes de ejecutar.       ║
║  • Preferir staging o snapshot de proyecto antes que production.             ║
║  • NO usar "Run All" en el SQL Editor.                                       ║
║  • Ejecutar por BLOQUES, en orden, solo si cada SELECT previo coincide.      ║
║  • Si un SELECT devuelve filas inesperadas: DETENER — no ejecutar DELETE.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**En la fase 11O que genera este archivo:** no se ejecutó ninguna sentencia en Supabase.

---

## 3. Resumen ejecutivo

Este documento **traduce** la propuesta `propuesta-limpieza-segura-L3.md` en **SQL exacto** (principalmente `SELECT` de verificación y `DELETE` por ID o nombre exacto), listo para una futura ejecución controlada.

**Incluye:**

- Conteos y verificaciones previas y posteriores.
- `DELETE` propuesto para **2 leads de prueba** y **1 draft rechazado** (bloques seguros).
- Solo `SELECT` + comentarios para **drafts genéricos** (pendiente de decisión).

**Excluye explícitamente** Pickup 4x4, `app_users`, `leads_pipelines`, `crm_setup_config`, y cualquier `TRUNCATE` / `DROP` / `ALTER` / `UPDATE` / `CREATE`.

---

## 4. Alcance

| Incluido en este documento | Excluido |
|----------------------------|----------|
| Bloque 0 — SELECTs conteo inicial | Draft Pickup `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| Bloque 1 — Verificación Pickup (solo lectura) | Meeting decision `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| Bloque 2 — Verificación candidatos seguros | Snapshot(s) del draft Pickup |
| Bloque 3 — DELETE propuesto leads prueba | Preset `pickup_4x4` (código) |
| Bloque 4 — DELETE propuesto draft rechazado | `app_users` (Daniel Admin) |
| Bloque 5 — SELECT genéricos (sin DELETE) | `leads_pipelines` (18 filas) |
| Bloque 6 — SELECTs posteriores esperados | `crm_setup_config` |
| Bloque 7 — Checklist app (no SQL) | `empresas`, `entity_import_batches` (ya 0) |
| | Migraciones, código, Kore, Zeta |

### IDs de referencia (inventario L1)

| Rol | UUID / valor |
|-----|----------------|
| Draft Pickup (**NO TOCAR**) | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| Meeting decision Pickup (**NO TOCAR**) | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| Draft rechazado prueba (**DELETE seguro**) | `6f956975-8aac-4016-a982-29db70eb1b5e` |
| Draft genérico A (**pendiente**) | `defe6513-2c2a-45d7-9254-5bd0d196b0e9` |
| Draft genérico B (**pendiente**) | `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` |
| Leads prueba (nombres exactos) | `Prueba Seguimiento Pickup`, `Prueba Pickup 4x4` |

---

## 5. Precondiciones antes de ejecutar (futuro)

Ejecutar DELETE **solo** si se cumplen **todas**:

- [ ] Backup del proyecto Supabase **verificado** (descarga o snapshot PITR).
- [ ] Entorno confirmado: proyecto **summer87-leads-v3** (no otro tenant/proyecto).
- [ ] **Daniel confirma por escrito** qué bloques ejecutar (3, 4, o ninguno).
- [ ] Bloque 0 y Bloque 1 ejecutados; resultados coinciden con expectativas L1.
- [ ] Bloque 2: candidatos seguros devuelven **exactamente** lo esperado (ver §8).
- [ ] No hay filas inesperadas (IDs extra, tercer lead prueba, snapshots en draft rechazado).
- [ ] Ideal: misma secuencia probada en **staging** o copia del proyecto.
- [ ] Pickup documentado en BCR (`ficha-bcr-pickup4x4.md`) — ya cumplido en repo.

---

## 6. Bloque 0 — SELECTs de conteo inicial

> **Solo lectura.** Anotar resultados como línea base «ANTES».

```sql
-- =============================================================================
-- BLOQUE 0 — Conteos iniciales (ANTES de limpieza)
-- NO EJECUTAR SIN CONFIRMACIÓN EXPLÍCITA — documentación / futura ejecución
-- =============================================================================

SELECT 'installer_package_drafts' AS tabla, COUNT(*) AS total
FROM public.installer_package_drafts
UNION ALL
SELECT 'installer_package_simulation_snapshots', COUNT(*)
FROM public.installer_package_simulation_snapshots
UNION ALL
SELECT 'installer_package_meeting_decisions', COUNT(*)
FROM public.installer_package_meeting_decisions
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'empresas', COUNT(*) FROM public.empresas
UNION ALL
SELECT 'app_users', COUNT(*) FROM public.app_users
UNION ALL
SELECT 'leads_pipelines', COUNT(*) FROM public.leads_pipelines
UNION ALL
SELECT 'crm_setup_config', COUNT(*) FROM public.crm_setup_config
UNION ALL
SELECT 'entity_import_batches', COUNT(*) FROM public.entity_import_batches;
```

**Valores esperados (L1, 2026-05-17):**

| tabla | total esperado |
|-------|----------------|
| installer_package_drafts | **4** |
| installer_package_simulation_snapshots | **3** |
| installer_package_meeting_decisions | **1** |
| leads | **2** |
| empresas | **0** |
| app_users | **1** |
| leads_pipelines | **18** |
| crm_setup_config | **1** |
| entity_import_batches | **0** |

Si algún conteo difiere: **detener** y actualizar inventario antes de cualquier DELETE.

---

## 7. Bloque 1 — Verificación de Pickup excluido

> **Solo lectura.** Estos registros **deben existir** y **no deben modificarse** en la limpieza segura L3.

```sql
-- =============================================================================
-- BLOQUE 1 — Pickup 4x4: verificar que existe (NO TOCAR)
-- =============================================================================

-- 1.1 Draft Pickup por ID exacto
SELECT
  id,
  status,
  human_confirmation_status,
  package_version,
  package_payload->'installation_manifest'->>'preset' AS preset,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name,
  generated_at,
  created_at
FROM public.installer_package_drafts
WHERE id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
-- Esperado: 1 fila, preset pickup_4x4, status approved_for_pilot

-- 1.2 Meeting decision Pickup por ID exacto
SELECT
  id,
  draft_id,
  decision,
  decision_label,
  LEFT(decision_reason, 120) AS decision_reason_preview,
  created_at
FROM public.installer_package_meeting_decisions
WHERE id = '9c04f4a5-774e-4e8a-8654-a2f49ae297ea';
-- Esperado: 1 fila, draft_id = 0fa4f061..., decision advance_manual_preparation

-- 1.3 Snapshots asociados al draft Pickup (NO eliminar)
SELECT
  id,
  draft_id,
  snapshot_type,
  simulation_status,
  readiness_score,
  created_at
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999'
ORDER BY created_at;
-- Esperado: 1 fila (inventario L1)

-- 1.4 Guardia: ningún DELETE de este documento debe afectar Pickup
-- (comprobación lógica: los DELETE siguientes usan otros IDs / nombres)
SELECT
  id,
  package_payload->'installation_manifest'->>'preset' AS preset
FROM public.installer_package_drafts
WHERE id IN (
  '6f956975-8aac-4016-a982-29db70eb1b5e',  -- rechazado prueba (seguro)
  'defe6513-2c2a-45d7-9254-5bd0d196b0e9',  -- genérico (pendiente)
  'd77f2e3e-5a4d-4a96-97ff-d923e330b87c'   -- genérico (pendiente)
);
-- Esperado: 3 filas, NINGUNA con preset pickup_4x4
```

---

## 8. Bloque 2 — Verificación de candidatos seguros

> **Solo lectura.** Si el resultado **no coincide** con lo esperado, **no ejecutar** Bloques 3 ni 4.

```sql
-- =============================================================================
-- BLOQUE 2 — Candidatos a limpieza SEGURA (verificación)
-- =============================================================================

-- 2.1 Draft rechazado prueba por ID exacto
SELECT
  id,
  status,
  human_confirmation_status,
  rejection_reason,
  generated_at,
  created_at
FROM public.installer_package_drafts
WHERE id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Esperado: EXACTAMENTE 1 fila
--   status = rejected
--   human_confirmation_status = rejected
--   rejection_reason contiene 'prueba'

-- 2.2 Sin snapshots hijos en draft rechazado (inventario L1: 0)
SELECT COUNT(*) AS snapshots_en_rechazado
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Esperado: 0

-- 2.3 Sin meeting decisions hijos en draft rechazado (inventario L1: 0)
SELECT COUNT(*) AS decisions_en_rechazado
FROM public.installer_package_meeting_decisions
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Esperado: 0
-- Si > 0: DETENER y revisar FK antes de cualquier DELETE

-- 2.4 Leads de prueba por nombres EXACTOS (no ILIKE amplio)
SELECT id, nombre, empresa_id, estado, origen, created_at, updated_at
FROM public.leads
WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4')
ORDER BY nombre;
-- Esperado: EXACTAMENTE 2 filas
-- Si 0, 1 o >2: DETENER — anotar IDs reales y actualizar este documento

-- 2.5 Guardia: leads de prueba NO deben ser el único lead con otro criterio
SELECT COUNT(*) AS total_leads
FROM public.leads;
-- Esperado: 2 (coincide con 2.4). Si total > 2 y 2.4 devuelve 2, hay otros leads: revisar antes de DELETE por nombre
```

---

## 9. Bloque 3 — SQL propuesto: limpiar leads de prueba

### ⛔ NO EJECUTAR EN ESTA FASE (11O — solo documentación)

Ejecutar **solo** si Bloque 2.4 devolvió **exactamente 2 filas** y Daniel aprobó.

```sql
-- =============================================================================
-- BLOQUE 3 — DELETE leads de prueba (PROPUESTO)
-- NO EJECUTAR SIN CONFIRMACIÓN EXPLÍCITA DE DANIEL
-- Re-ejecutar Bloque 2.4 inmediatamente antes de este DELETE
-- =============================================================================

BEGIN;

-- Verificación final en la misma transacción (debe devolver 2)
SELECT id, nombre, created_at
FROM public.leads
WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4');

-- DELETE por nombres exactos (no usar ILIKE '%prueba%')
DELETE FROM public.leads
WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4')
RETURNING id, nombre, created_at;
-- Esperado: 2 filas en RETURNING

-- Si RETURNING no devuelve exactamente 2 filas: ROLLBACK;
-- Si OK:
COMMIT;
-- Alternativa conservadora: usar ROLLBACK; en primera prueba para simular sin persistir
```

**Notas:**

- No se incluye `DELETE` por `id` fijo porque L1 no documentó UUIDs de leads; si en el día de ejecución se prefieren IDs, sustituir por:
  `DELETE FROM public.leads WHERE id IN ('<uuid-1>', '<uuid-2>')` tras anotarlos del SELECT 2.4.
- **No borrar** leads cuyo nombre contenga «Pickup» pero no sea exactamente uno de los dos nombres anteriores.

---

## 10. Bloque 4 — SQL propuesto: limpiar draft rechazado prueba

### ⛔ NO EJECUTAR EN ESTA FASE (11O — solo documentación)

Ejecutar **solo** si Bloque 2.1–2.3 coinciden y Daniel aprobó (puede ser en la misma sesión que Bloque 3).

```sql
-- =============================================================================
-- BLOQUE 4 — DELETE draft rechazado prueba (PROPUESTO)
-- NO EJECUTAR SIN CONFIRMACIÓN EXPLÍCITA DE DANIEL
-- ID exacto: 6f956975-8aac-4016-a982-29db70eb1b5e
-- Inventario L1: sin snapshots, sin meeting decisions
-- =============================================================================

BEGIN;

-- Confirmación inmediata antes del DELETE
SELECT
  id,
  status,
  human_confirmation_status,
  rejection_reason
FROM public.installer_package_drafts
WHERE id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Debe devolver 1 fila con rejected / prueba

SELECT COUNT(*) AS snapshots_antes
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Debe ser 0

SELECT COUNT(*) AS decisions_antes
FROM public.installer_package_meeting_decisions
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Debe ser 0

-- DELETE por ID exacto — NO usar WHERE status = 'rejected' sin ID
DELETE FROM public.installer_package_drafts
WHERE id = '6f956975-8aac-4016-a982-29db70eb1b5e'
RETURNING id, status, rejection_reason, generated_at;
-- Esperado: 1 fila en RETURNING

-- Si RETURNING vacío o >1: ROLLBACK;
COMMIT;

-- PROHIBIDO en esta limpieza:
-- DELETE FROM public.installer_package_drafts WHERE id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
```

**Si en el futuro existieran snapshots/decisions en este draft:** eliminar hijos primero solo si CASCADE no aplica; con migración actual, CASCADE existe desde draft padre — por eso es crítico confirmar 0 hijos antes de borrar.

---

## 11. Bloque 5 — Drafts/snapshots genéricos (pendiente de decisión)

> **Solo SELECT y comentarios.** **No hay DELETE** en este documento para estos registros.

```sql
-- =============================================================================
-- BLOQUE 5 — Genéricos not-resolved-in-preview (REVISIÓN — SIN DELETE AÚN)
-- Requiere confirmación manual: ¿ruido UI o aprendizaje?
-- =============================================================================

-- 5.1 Draft genérico A (2 snapshots según L1)
SELECT
  id,
  status,
  human_confirmation_status,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name,
  package_payload->'installation_manifest'->>'preset' AS preset,
  generated_at
FROM public.installer_package_drafts
WHERE id = 'defe6513-2c2a-45d7-9254-5bd0d196b0e9';
-- Esperado: not-resolved-in-preview, preset NULL

SELECT
  id,
  draft_id,
  snapshot_type,
  created_at
FROM public.installer_package_simulation_snapshots
WHERE draft_id = 'defe6513-2c2a-45d7-9254-5bd0d196b0e9'
ORDER BY created_at;
-- Esperado: 2 filas

-- 5.2 Draft genérico B (0 snapshots según L1)
SELECT
  id,
  status,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name,
  package_payload->'installation_manifest'->>'preset' AS preset
FROM public.installer_package_drafts
WHERE id = 'd77f2e3e-5a4d-4a96-97ff-d923e330b87c';

SELECT COUNT(*) AS snapshots_d77f
FROM public.installer_package_simulation_snapshots
WHERE draft_id = 'd77f2e3e-5a4d-4a96-97ff-d923e330b87c';
-- Esperado: 0

-- -----------------------------------------------------------------------------
-- FUTURO (solo si Daniel aprueba en fase posterior — NO incluido como ejecutable aquí):
--
-- Al eliminar draft defe6513..., ON DELETE CASCADE eliminará sus 2 snapshots
-- (ver migrations installer_package_simulation_snapshots.draft_id CASCADE).
--
-- Ejemplo conceptual para documento futuro 11O-bis o L3-ampliado:
--   DELETE FROM public.installer_package_drafts
--   WHERE id IN (
--     'defe6513-2c2a-45d7-9254-5bd0d196b0e9',
--     'd77f2e3e-5a4d-4a96-97ff-d923e330b87c'
--   );
-- NUNCA ejecutar sin repetir Bloque 1 y sin excluir Pickup de la sesión.
-- -----------------------------------------------------------------------------
```

**Conteos si solo se ejecutan Bloques 3+4 (seguro):** drafts 4→3, snapshots 3→3, meeting_decisions 1→1.

**Conteos si además se aprueban genéricos (futuro):** drafts 4→1 (solo Pickup), snapshots 3→1.

---

## 12. Bloque 6 — SELECTs posteriores esperados

> Ejecutar **después** de Bloques 3 y/o 4 (si se aprobaron), para documentar resultado L4.

```sql
-- =============================================================================
-- BLOQUE 6 — Verificación DESPUÉS (esperado si solo Bloques 3 + 4)
-- =============================================================================

-- 6.1 Leads: sin nombres de prueba
SELECT id, nombre, created_at
FROM public.leads
WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4');
-- Esperado: 0 filas

SELECT COUNT(*) AS total_leads
FROM public.leads;
-- Esperado: 0 (si solo existían esos 2 leads)

-- 6.2 Draft rechazado: ya no existe
SELECT id FROM public.installer_package_drafts
WHERE id = '6f956975-8aac-4016-a982-29db70eb1b5e';
-- Esperado: 0 filas

-- 6.3 Pickup sigue existiendo
SELECT id, status,
  package_payload->'installation_manifest'->>'preset' AS preset
FROM public.installer_package_drafts
WHERE id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
-- Esperado: 1 fila

-- 6.4 Meeting decision Pickup sigue existiendo
SELECT id, draft_id, decision
FROM public.installer_package_meeting_decisions
WHERE id = '9c04f4a5-774e-4e8a-8654-a2f49ae297ea';
-- Esperado: 1 fila

-- 6.5 Snapshot Pickup sigue existiendo
SELECT COUNT(*) AS snapshots_pickup
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
-- Esperado: 1

-- 6.6 Conteos globales DESPUÉS (comparar con Bloque 0)
SELECT 'installer_package_drafts' AS tabla, COUNT(*) AS total
FROM public.installer_package_drafts
UNION ALL
SELECT 'installer_package_simulation_snapshots', COUNT(*)
FROM public.installer_package_simulation_snapshots
UNION ALL
SELECT 'installer_package_meeting_decisions', COUNT(*)
FROM public.installer_package_meeting_decisions
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads;
```

**Matriz esperada (solo Bloques 3 + 4 ejecutados):**

| Métrica | ANTES (L1) | DESPUÉS esperado |
|---------|------------|------------------|
| leads | 2 | **0** |
| drafts | 4 | **3** (Pickup + 2 genéricos) |
| snapshots | 3 | **3** (sin cambio) |
| meeting_decisions | 1 | **1** (sin cambio) |

---

## 13. Bloque 7 — Validación app posterior (no SQL)

Checklist manual tras ejecución futura:

| # | Paso |
|---|------|
| 1 | Abrir `/admin/constructor-crm/paquetes` — lista sin error |
| 2 | Confirmar **Pickup 4x4** visible (draft `0fa4f061…`) |
| 3 | Abrir detalle del paquete Pickup |
| 4 | Confirmar **meeting decision** «Avanzar a preparación manual controlada» |
| 5 | Confirmar **snapshot** de simulación presente |
| 6 | Verificar que **no** aparecen leads «Prueba Seguimiento Pickup» / «Prueba Pickup 4x4» en módulo leads |
| 7 | Login **Daniel Admin** correcto |
| 8 | `npm run build` — sin errores |
| 9 | `git status` — sin cambios accidentales en repo |
| 10 | Registrar resultados en documento **L4** (fecha, operador, conteos Bloque 0 vs 6) |

---

## 14. Qué NO hacer

- No usar `reset-db` ni scripts de reset masivo.
- No `TRUNCATE` ninguna tabla.
- No `DELETE FROM public.installer_package_drafts` sin `WHERE id = ...` exacto.
- No borrar por `preset`, `ILIKE '%pickup%'`, ni `status = 'rejected'` sin ID.
- No tocar `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` ni `9c04f4a5-774e-4e8a-8654-a2f49ae297ea`.
- No borrar snapshots con `WHERE draft_id <> ...` o patrones amplios.
- No modificar `app_users`, `leads_pipelines`, `crm_setup_config`.
- No tocar `.env.local`, Kore, Zeta, migraciones ni código.
- No ejecutar Bloque 5 DELETE sin documento y aprobación nuevos.

---

## 15. Próxima fase sugerida

### Fase 11P — Revisión humana del SQL L3 y decisión de ejecución

Daniel decide en 11P (sin ejecutar automáticamente):

| Opción | Acción |
|--------|--------|
| **A** | No ejecutar nada; conservar evidencia en BD |
| **B** | Ejecutar solo **Bloque 3** (leads) tras backup |
| **C** | Ejecutar **Bloques 3 + 4** (leads + draft rechazado) — limpieza segura mínima |
| **D** | Preparar **staging** y probar C antes de production |
| **E** | Aprobar además genéricos (Bloque 5) → requiere **anexo SQL** nuevo, no este archivo |

Tras ejecución aprobada: documentar **L4** con capturas de Bloque 0 y 6.

---

## 16. Confirmación de alcance (fase 11O — creación de este documento)

- ✅ SQL propuesto documentado para revisión
- ❌ **No se ejecutó SQL** en Supabase
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se crearon endpoints
- ❌ No se crearon scripts ejecutables en repo
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional

---

*SQL propuesto L3 — Base madre summer87-leads-v3. Pickup 4x4 excluido. Ejecución pendiente de fase 11P.*
