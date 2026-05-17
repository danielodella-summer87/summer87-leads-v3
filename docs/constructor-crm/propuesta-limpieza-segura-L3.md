# Propuesta de Limpieza Segura L3 — Base Madre Constructor CRM Summer87

**Versión:** Limpieza-L3-propuesta (documental)  
**Relacionado con:** `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/propuesta-limpieza-base-madre-L2.md`, `docs/constructor-crm/checklist-limpieza-base-madre.md`, `docs/constructor-crm/selects-inventario-base-madre.md`, `docs/constructor-crm/caso-semilla-pickup4x4-bcr.md`, `docs/constructor-crm/ficha-bcr-pickup4x4.md`, `docs/constructor-crm/formato-entrada-bcr-caso-semilla.md`

**Estado:** propuesta L3 **no ejecutada**. Incluye SELECTs de confirmación como documentación. **No incluye** `DELETE`, `UPDATE`, `TRUNCATE`, `DROP` ni comandos de limpieza listos para ejecutar.

---

## 2. Resumen ejecutivo

Tras **documentar Pickup 4x4** como caso semilla BCR (`caso-semilla-pickup4x4-bcr.md`, `ficha-bcr-pickup4x4.md`), esta fase define una **propuesta L3 de limpieza segura** sobre la base madre Supabase **summer87-leads-v3**: eliminar o revisar solo datos **claramente demo/test** y artefactos genéricos sin aprendizaje, **sin tocar** el caso semilla Pickup ni configuración reusable sin decisión explícita.

**Alcance L3 propuesto (futuro, con backup y confirmación):**

- Draft rechazado con `rejection_reason: prueba`
- Dos leads «Prueba Pickup…»
- Drafts/snapshots genéricos `not-resolved-in-preview` **solo si** Daniel confirma que son ruido

**Fuera de alcance L3:** draft/snapshot/meeting decision Pickup, usuario admin, pipelines (18 filas), `crm_setup_config` (hasta decisión aparte), código, migraciones, preset y documentación BCR.

**Esta fase no ejecuta nada** en Supabase ni en el repositorio más allá de crear este documento.

---

## 3. Estado previo

| Hito | Estado |
|------|--------|
| Inventario L1 | ✅ Completado (`inventario-datos-base-madre-L1.md`, 2026-05-17) |
| Propuesta L2 | ✅ Completada (`propuesta-limpieza-base-madre-L2.md`) |
| Pickup 4x4 — caso semilla BCR | ✅ `caso-semilla-pickup4x4-bcr.md` (11K) |
| Pickup 4x4 — ficha BCR A–T | ✅ `ficha-bcr-pickup4x4.md` (11L-F1) |
| Formato entrada BCR | ✅ `formato-entrada-bcr-caso-semilla.md` |
| Export BCR Pickup en BD | ❌ No existe persistencia BCR en tablas |

**Situación de la base madre (conteos L1):**

| Recurso | Total | Nota |
|---------|-------|------|
| `installer_package_drafts` | 4 | 1 Pickup semilla + 1 rechazado prueba + 2 genéricos |
| `installer_package_simulation_snapshots` | 3 | 1 Pickup + 2 en draft genérico `defe6513…` |
| `installer_package_meeting_decisions` | 1 | Solo Pickup |
| `crm_setup_config` | 1 | `setup` / `auditoria` / score 15 |
| `empresas` | 0 | Limpio |
| `leads` | 2 | Prueba Pickup |
| `rubros` demo/test | 0 | Limpio |
| `app_users` | 1 | Daniel Admin |
| `entity_import_batches` | 0 | Limpio |
| `leads_pipelines` | 18 | Config reusable — no auto-limpiar |

**Conclusión:** la base **no está virgen** por evidencia del Constructor y datos de prueba; el aprendizaje Pickup ya está **en repo**. L3 puede planificar limpieza **mínima** de demo/test sin riesgo de perder semilla documentada.

---

## 4. Alcance de la limpieza propuesta

### 4.1 Incluido para posible limpieza (futura, con confirmación)

| Ítem | ID / referencia | Condición |
|------|-----------------|-----------|
| Draft rechazado prueba | `6f956975-8aac-4016-a982-29db70eb1b5e` | `rejection_reason = prueba` — alta confianza demo |
| Leads de prueba | «Prueba Seguimiento Pickup», «Prueba Pickup 4x4» | Tras SELECT que devuelva exactamente 2 filas esperadas |
| Drafts genéricos | `defe6513-2c2a-45d7-9254-5bd0d196b0e9`, `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` | Solo si se confirma `not-resolved-in-preview` = ruido UI |
| Snapshots genéricos | 2 filas ligadas a `defe6513…` | Solo si se elimina o archiva ese draft (ver §10 cascada) |

### 4.2 Excluido explícitamente

| Ítem | ID / referencia | Motivo |
|------|-----------------|--------|
| Draft Pickup 4x4 | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` | Caso semilla BCR — conservar o archivar con decisión aparte |
| Snapshot Pickup | 1 snapshot en draft `0fa4f061…` | Evidencia semilla |
| Meeting decision Pickup | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` | Evidencia semilla |
| Usuario admin | Daniel Admin (`app_users`, 1 fila) | Acceso operativo madre |
| Migraciones / esquema | Repo `migrations/` | Estructura compartida |
| Código Constructor / Instalador | `app/`, `lib/` | Producto |
| Preset `pickup_4x4` | `lib/admin/installablePackagePickup4x4Preset.ts` | Blueprint v0 en código |
| Documentación BCR | `docs/constructor-crm/*` | Memoria sectorial |
| `leads_pipelines` (18) | — | Posible config reusable — decisión posterior |
| `crm_setup_config` (1) | `bb0804fd-cc6a-44ab-8969-2b94cdaad984` | Reset funcional futuro, no L3 automático |
| Kore / Zeta | — | Sin escritura ni limpieza externa |

---

## 5. Principios L3

1. **Limpieza mínima** — solo filas demo/test confirmadas; no «reset general».
2. **Backup antes de tocar** — snapshot Supabase o export lógico de tablas afectadas.
3. **Primero SELECT, luego propuesta de borrado** — conteos y filas exactas documentadas en L4.
4. **Staging / snapshot de proyecto** — si existe entorno no-production, probar ahí antes que en production madre.
5. **No tocar Pickup** — draft, snapshot y meeting decision del semilla fuera de cualquier DELETE por patrón.
6. **No tocar admin** — único `app_users` operativo.
7. **No tocar estructura** — sin `DROP`/`ALTER`/`TRUNCATE`.
8. **No tocar configuración reusable sin decisión** — pipelines y `crm_setup_config` quedan en revisión.
9. **Validar app después** — UI paquetes, login, build.
10. **Documentar conteos antes/después** — entregable L4 post-ejecución (futura).

---

## 6. Matriz de decisión por ítem

| Ítem | ID / referencia | Estado actual (L1) | Clasificación | Acción propuesta L3 | Riesgo | Confirmación Daniel |
|------|-----------------|-------------------|---------------|---------------------|--------|---------------------|
| Draft Pickup | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` | `approved_for_pilot` / `pickup_4x4` | Caso semilla BCR | **Conservar** (evidencia histórica) | Bajo si no se toca | No aplica (excluido) |
| Snapshot Pickup | 1 en draft `0fa4f061…` | Asociado semilla | Caso semilla BCR | **Conservar** | Bajo | No aplica |
| Meeting decision Pickup | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` | `advance_manual_preparation` | Caso semilla BCR | **Conservar** | Alto si se borra por error | No aplica |
| Draft rechazado prueba | `6f956975-8aac-4016-a982-29db70eb1b5e` | `rejected` / reason `prueba` | Demo/test | **Candidato a eliminar** (Paso 3) | Bajo | **Sí** |
| Draft genérico A | `defe6513-2c2a-45d7-9254-5bd0d196b0e9` | `approved_for_pilot` / `not-resolved-in-preview` | Revisar | **Eliminar solo si confirmado ruido** (Paso 4) | Medio | **Sí** |
| Draft genérico B | `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` | Igual, 0 snapshots L1 | Revisar | **Eliminar solo si confirmado ruido** (Paso 4) | Medio | **Sí** |
| Snapshots genéricos | 2 × draft `defe6513…` | Simulación preview | Revisar | **Eliminar con draft** o antes si FK lo exige | Medio | **Sí** (junto genérico A) |
| Leads prueba Pickup | nombres «Prueba…» (2 filas) | Demo operativo | Demo/test | **Candidato a eliminar** (Paso 2) | Bajo | **Sí** |
| app_users Daniel | 1 fila admin | Activo | Operativo madre | **No tocar** | Crítico | No aplica |
| crm_setup_config | `bb0804fd-cc6a-44ab-8969-2b94cdaad984` | `auditoria` / 15 | Revisar | **Decisión aparte** (Paso 5) — reset o conservar | Medio | **Sí** (decisión funcional) |
| leads_pipelines | 18 etapas | Config general | Reusable | **No limpiar en L3** (Paso 6 solo revisión) | Alto si se trunca | **Sí** si algún día se limpia |
| empresas | 0 | Limpio | Sin acción | Ninguna | — | No |
| entity_import_batches | 0 | Limpio | Sin acción | Ninguna | — | No |

---

## 7. Orden recomendado de limpieza futura

| Paso | Acción | Ejecutar en L3 doc | Ejecutar en BD |
|------|--------|--------------------|----------------|
| **0** | Backup / snapshot Supabase del proyecto | Documentar procedimiento | Futuro 11O+ |
| **1** | SELECT de confirmación (§8) — registrar conteos «antes» | Referencia | Futuro |
| **2** | Limpiar **leads de prueba** si SELECT confirma 2 filas esperadas | Pseudocódigo §9 | Futuro + Daniel |
| **3** | Limpiar **draft rechazado** `6f956975…` si sin dependencias inesperadas | Pseudocódigo §9 | Futuro + Daniel |
| **4** | Revisar UI/historial; si OK, limpiar **drafts genéricos** y snapshots asociados | Pseudocódigo §9 | Futuro + Daniel |
| **5** | **Decidir** `crm_setup_config` (conservar / reset fila / ignorar) | Decisión documental | Futuro |
| **6** | **Revisar** `leads_pipelines` (documentar si son plantilla madre) | Sin DELETE L3 | — |
| **7** | Validación posterior (§11) | Checklist | Futuro |
| **8** | Documentar resultado **L4** (conteos después, incidencias) | Nuevo doc | Futuro |

**Orden lógico leads antes de drafts:** los leads no tienen FK a drafts; pueden ir primero para reducir ruido en UI de leads sin afectar Instalador.

---

## 8. SELECTs de confirmación previos

> Solo **`SELECT`**. Ejecutar en SQL Editor **antes** de cualquier limpieza futura. Anotar resultados en L4.

### 8.1 Conteos globales «antes»

```sql
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
SELECT 'crm_setup_config', COUNT(*) FROM public.crm_setup_config
UNION ALL
SELECT 'leads_pipelines', COUNT(*) FROM public.leads_pipelines
UNION ALL
SELECT 'app_users', COUNT(*) FROM public.app_users;
```

**Esperado (L1):** drafts 4, snapshots 3, meeting_decisions 1, leads 2, empresas 0, crm_setup_config 1, leads_pipelines 18, app_users 1.

### 8.2 Draft rechazado con reason prueba

```sql
SELECT
  id,
  status,
  human_confirmation_status,
  rejection_reason,
  generated_at,
  created_at
FROM public.installer_package_drafts
WHERE id = '6f956975-8aac-4016-a982-29db70eb1b5e';
```

**Esperado:** 1 fila, `status = rejected`, `rejection_reason` contiene `prueba`.

```sql
-- Verificar que no hay snapshots ni meeting decisions colgados (debería ser 0)
SELECT COUNT(*) AS snapshots_hijos
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';

SELECT COUNT(*) AS decisions_hijos
FROM public.installer_package_meeting_decisions
WHERE draft_id = '6f956975-8aac-4016-a982-29db70eb1b5e';
```

### 8.3 Leads de prueba Pickup

```sql
SELECT id, nombre, empresa_id, estado, origen, created_at, updated_at
FROM public.leads
WHERE nombre ILIKE '%prueba%'
   OR nombre ILIKE '%Prueba Seguimiento Pickup%'
   OR nombre ILIKE '%Prueba Pickup 4x4%'
ORDER BY created_at;
```

**Esperado:** 2 filas («Prueba Seguimiento Pickup», «Prueba Pickup 4x4»). Anotar `id` de cada una en L4 antes de borrar (futuro 11O).

```sql
-- Confirmación estricta por nombres exactos L1
SELECT id, nombre
FROM public.leads
WHERE nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4');
```

### 8.4 Drafts genéricos not-resolved-in-preview

```sql
SELECT
  id,
  status,
  human_confirmation_status,
  package_version,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name,
  package_payload->'installation_manifest'->>'preset' AS preset,
  generated_at
FROM public.installer_package_drafts
WHERE id IN (
  'defe6513-2c2a-45d7-9254-5bd0d196b0e9',
  'd77f2e3e-5a4d-4a96-97ff-d923e330b87c'
)
   OR package_payload->'installation_manifest'->>'targetClientName' = 'not-resolved-in-preview';
```

**Esperado:** 2 filas, `preset` NULL.

### 8.5 Snapshots del draft genérico defe6513

```sql
SELECT
  s.id,
  s.draft_id,
  s.snapshot_type,
  s.simulation_status,
  s.readiness_score,
  s.created_at
FROM public.installer_package_simulation_snapshots s
WHERE s.draft_id = 'defe6513-2c2a-45d7-9254-5bd0d196b0e9'
ORDER BY s.created_at;
```

**Esperado (L1):** 2 snapshots.

```sql
-- Snapshots del otro genérico (esperado 0 según L1)
SELECT COUNT(*) AS snapshots_d77f
FROM public.installer_package_simulation_snapshots
WHERE draft_id = 'd77f2e3e-5a4d-4a96-97ff-d923e330b87c';
```

### 8.6 Pickup — verificar exclusión (no debe entrar en limpieza)

```sql
SELECT
  id,
  status,
  human_confirmation_status,
  package_payload->'installation_manifest'->>'preset' AS preset,
  package_payload->'installation_manifest'->>'targetClientName' AS target_client_name
FROM public.installer_package_drafts
WHERE id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
```

**Esperado:** 1 fila, `pickup_4x4`, `approved_for_pilot`.

```sql
SELECT COUNT(*) AS snapshot_pickup
FROM public.installer_package_simulation_snapshots
WHERE draft_id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';

SELECT id, draft_id, decision, decision_label
FROM public.installer_package_meeting_decisions
WHERE id = '9c04f4a5-774e-4e8a-8654-a2f49ae297ea'
   OR draft_id = '0fa4f061-cdd1-4693-a20a-9ff5e92ca999';
```

**Esperado:** 1 snapshot, 1 meeting decision.

### 8.7 crm_setup_config (solo lectura / decisión)

```sql
SELECT id, status, current_step, readiness_score, created_at, updated_at
FROM public.crm_setup_config;
```

### 8.8 app_users — verificar admin intacto

```sql
SELECT id, email, nombre, is_active, created_at
FROM public.app_users
ORDER BY created_at;
```

**Esperado:** 1 fila Daniel Admin.

---

## 9. SQL de limpieza futura — NO EJECUTAR

### Sección: SQL conceptual futuro — NO EJECUTAR EN ESTA FASE

Lo siguiente describe **intención operativa** para la fase **11O** (SQL exacto revisable). **No es SQL ejecutable** en esta entrega.

#### Bloque A — Leads de prueba (Paso 2 futuro)

- Obtener IDs con SELECT §8.3 (`nombre IN (...)`).
- Verificar que el resultado son **exactamente 2 filas** y ninguna otra fila crítica en el mismo SELECT amplio.
- **Acción conceptual:** eliminar esas filas de `public.leads` **por ID confirmado**, no por `ILIKE '%prueba%'` amplio (evita borrar leads legítimos futuros).

#### Bloque B — Draft rechazado prueba (Paso 3 futuro)

- Confirmar draft `6f956975-8aac-4016-a982-29db70eb1b5e` con SELECT §8.2.
- Confirmar **0** snapshots y **0** meeting decisions hijos.
- **Acción conceptual:** eliminar **una fila** en `installer_package_drafts` con ese ID exacto.

#### Bloque C — Drafts genéricos (Paso 4 futuro, condicional)

- Solo si Daniel confirma que `not-resolved-in-preview` no aporta aprendizaje.
- Para draft `defe6513-2c2a-45d7-9254-5bd0d196b0e9`:
  - **Opción 1:** eliminar draft y dejar que **ON DELETE CASCADE** elimine sus 2 snapshots (ver §10).
  - **Opción 2:** listar snapshot IDs con SELECT §8.5; eliminar snapshots primero solo si la política del equipo prefiere orden explícito (redundante con CASCADE).
- Para draft `d77f2e3e-5a4d-4a96-97ff-d923e330b87c`:
  - Confirmar 0 snapshots; **acción conceptual:** eliminar solo el draft.
- **Nunca** usar `WHERE target_client_name = 'not-resolved-in-preview'` sin listar IDs en pantalla en el mismo momento.

#### Bloque D — Explícitamente fuera de L3

- No eliminar filas con `draft_id = 0fa4f061-cdd1-4693-a20a-9ff5e92ca999`.
- No eliminar `meeting_decision_id = 9c04f4a5-774e-4e8a-8654-a2f49ae297ea`.
- No modificar `crm_setup_config` ni `leads_pipelines` en la misma ventana que Bloques A–C sin decisión escrita.

#### Conteo esperado «después» (si se ejecutan A+B+C completos y Daniel aprueba genéricos)

| Tabla | Antes (L1) | Después (orientativo) |
|-------|------------|------------------------|
| `leads` | 2 | 0 |
| `installer_package_drafts` | 4 | 1 (solo Pickup) |
| `installer_package_simulation_snapshots` | 3 | 1 (solo Pickup) |
| `installer_package_meeting_decisions` | 1 | 1 |

---

## 10. Dependencias / orden técnico

```
installer_package_drafts (padre)
    ├── installer_package_simulation_snapshots  ON DELETE CASCADE
    └── installer_package_meeting_decisions     ON DELETE CASCADE
```

| Regla | Detalle |
|-------|---------|
| Snapshots dependen de drafts | `draft_id` NOT NULL + CASCADE |
| Meeting decisions dependen de drafts | Idem |
| Eliminar draft genérico `defe6513…` | **Desaparecen automáticamente** sus 2 snapshots (documentar en L4) |
| Eliminar draft Pickup | **Eliminaría** snapshot Pickup y meeting decision Pickup — **prohibido en L3** |
| Draft rechazado `6f956975…` | L1 sin snapshots; borrado aislado de bajo riesgo |
| Leads | Sin FK a `installer_package_*`; orden independiente |
| Patrones amplios | **Prohibidos** — solo IDs listados en SELECT del día |
| Meeting decision huérfana | No aplica hoy (solo 1 fila, ligada a Pickup) |

**Si en el futuro existiera CASCADE inesperado:** ejecutar SELECT §8.2 y §8.5 inmediatamente antes del borrado y comparar con matriz §6.

---

## 11. Validación posterior requerida

Tras cualquier ejecución futura (fase posterior a 11O), completar:

| # | Verificación |
|---|--------------|
| 1 | Repetir SELECT conteos §8.1 («después») y comparar con tabla §9 |
| 2 | Abrir `/admin/constructor-crm/paquetes` — lista carga sin error |
| 3 | **Pickup visible** si se conservó — draft `0fa4f061…` presente |
| 4 | Abrir detalle Pickup — snapshot y reunión accesibles |
| 5 | Drafts genéricos y rechazado **ausentes** solo si se aprobaron en Paso 3–4 |
| 6 | Módulo leads — **no** aparecen «Prueba Seguimiento Pickup» / «Prueba Pickup 4x4» |
| 7 | Login **Daniel Admin** OK |
| 8 | `npm run build` sin errores (local) |
| 9 | `git status` limpio en repo (sin cambios accidentales) |
| 10 | Documentar **L4** — operador, fecha, conteos, incidencias, capturas opcionales |

---

## 12. Qué NO hacer

- No usar `reset-db` ni scripts de reset masivo del proyecto.
- No limpiar **toda** la tabla `installer_package_drafts` ni «todos los rechazados» sin ID.
- No `TRUNCATE` ninguna tabla.
- No borrar **Pickup** (draft / snapshot / meeting decision).
- No borrar usuario **Daniel Admin**.
- No borrar **pipelines** automáticamente (18 filas).
- No tocar `.env.local` ni secretos en documentación pública.
- No escribir ni limpiar **Kore** ni **Zeta**.
- No modificar **migraciones** ni esquema.
- No ejecutar `DELETE` por `ILIKE '%pickup%'` en payloads (arrastraría semilla).
- No mezclar limpieza BD con deploy de código en la misma ventana sin rollback plan.

---

## 13. Recomendación

| Recomendación | Detalle |
|---------------|---------|
| **No ejecutar limpieza todavía** | Este documento L3 es planificación; Pickup ya está en BCR pero la evidencia en BD puede conservarse |
| **Crear fase 11O antes de ejecutar** | Documento aparte con **SQL exacto** (`DELETE` por ID), revisable línea por línea |
| **11O sin ejecución** | Incluso en 11O: solo escribir SQL en markdown; ejecutar solo tras **confirmación explícita** de Daniel |
| **Orden sugerido** | 11O (SQL propuesto) → confirmación → backup → ejecución en SQL Editor → L4 (resultados) |
| **Genéricos** | Tratar `defe6513` / `d77f2e3e` como **opt-in**; los pasos 2–3 (leads + rechazado) son el **mínimo viable** de limpieza |

---

## 14. Próxima fase sugerida

### Fase 11O — SQL propuesto de limpieza L3 — revisión humana

| Campo | Valor |
|-------|--------|
| **Objetivo** | Crear `docs/constructor-crm/sql-propuesto-limpieza-L3-11O.md` (nombre sugerido) con sentencias `DELETE` exactas por UUID, comentadas, ordenadas, con SELECT previo embebido como comentario |
| **Entrada** | Este documento L3 + resultados frescos de §8 ejecutados el día O |
| **Salida** | SQL listo para pegar en Supabase **sin ejecutar** hasta OK final |
| **Ejecución** | Fase **L4** o **11P** posterior, con backup |

---

## 15. Confirmación de alcance

En la fase que produce este documento L3:

- ✅ Propuesta de limpieza segura documentada (alcance, matriz, orden, SELECTs, pseudocódigo)
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se ejecutó SQL en Supabase
- ❌ No se crearon endpoints
- ❌ No se crearon scripts ejecutables
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se escribió en Kore ni Zeta
- ❌ No se modificó código funcional

---

*Propuesta L3 — Base madre Constructor CRM. Pickup 4x4 documentado en BCR; limpieza demo/test planificada para ejecución controlada posterior.*
