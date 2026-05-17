# Decisión Final Limpieza Mínima 11S — Base Madre Constructor CRM Summer87

**Versión:** Fase 11S (decisión final — documental)  
**Fecha de decisión:** 2026-05-17  
**Responsable:** Daniel / Summer87  
**Relacionado con:** `docs/constructor-crm/evidencia-backup-supabase-11R.md`, `docs/constructor-crm/protocolo-backup-supabase-11Q.md`, `docs/constructor-crm/decision-ejecucion-limpieza-11P.md`, `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/ficha-bcr-pickup4x4.md`

**Estado:** decisión registrada. **No se ejecutó** limpieza ni SQL en esta fase.

---

## 2. Resumen ejecutivo

Tras completar inventario L1, protocolo y evidencia de backup (11Q–11R), y documentar SQL propuesto (11O), se define la **primera ejecución autorizable recomendada** de limpieza sobre la base madre:

**Opción B — eliminar únicamente los 2 leads de prueba** («Prueba Seguimiento Pickup», «Prueba Pickup 4x4»), usando **solo Bloque 3** del documento SQL 11O, en una **fase posterior** (11T), con SELECTs del día y confirmación explícita de Daniel.

**En 11S no se ejecuta nada.** El draft rechazado `prueba`, los drafts genéricos y el resto del Instalador quedan para una **segunda etapa** (posible Bloque 4 u otra decisión).

---

## 3. Estado previo

| Hito | Estado | Referencia |
|------|--------|------------|
| Inventario L1 | ✅ | `inventario-datos-base-madre-L1.md` |
| Pickup BCR (caso semilla + ficha) | ✅ | `caso-semilla-pickup4x4-bcr.md`, `ficha-bcr-pickup4x4.md` |
| Propuesta L3 | ✅ | `propuesta-limpieza-segura-L3.md` |
| SQL L3 propuesto (11O) | ✅ Documentado, **no ejecutado** | `sql-propuesto-limpieza-base-madre-L3.md` |
| Decisión 11P | ✅ No ejecutar sin backup | `decision-ejecucion-limpieza-11P.md` |
| Protocolo backup 11Q | ✅ | `protocolo-backup-supabase-11Q.md` |
| Evidencia backup 11R | ✅ Backups diarios visibles; Restore en UI; **sin** restore probado | `evidencia-backup-supabase-11R.md` |
| Repositorio | ✅ Limpio al registrar 11S | Sin cambios pendientes en working tree |

**Base de datos (referencia L1):** proyecto `summer87-leads-v3`, main/PRODUCTION; 2 leads de prueba; 4 drafts (1 Pickup semilla); 3 snapshots; 1 meeting decision.

---

## 4. Opciones consideradas

| Opción | Descripción | Evaluación breve |
|--------|-------------|------------------|
| **A** | No ejecutar nada | Siempre válida; posterga virgen parcial |
| **B** | Solo 2 leads de prueba | **Recomendada** — menor superficie |
| **C** | 2 leads + draft rechazado `prueba` | Segunda etapa; toca Instalador |
| **D** | Probar en staging/snapshot antes | Ideal si hay tiempo; no bloqueante si hay backups diarios 11R |
| **E** | Esperar restore probado | Máxima cautela; no requerida para Opción B dado 11R |

---

## 5. Decisión recomendada

| Campo | Valor |
|-------|--------|
| **Opción adoptada (recomendación)** | **B** |
| **Alcance** | Limpieza **únicamente** de 2 filas en `public.leads` |
| **Nombres exactos** | `Prueba Seguimiento Pickup`, `Prueba Pickup 4x4` |
| **SQL autorizable (futuro)** | Solo **Bloque 3** de `sql-propuesto-limpieza-base-madre-L3.md` |
| **Ejecución en 11S** | **Ninguna** |

---

## 6. Motivos de la decisión

| Motivo | Detalle |
|--------|---------|
| **Menor riesgo** | No modifica tablas del Instalador ni FKs en cascada |
| **No toca Constructor / Instalador** | `installer_package_*` intactas |
| **No toca package drafts** | Los 4 drafts permanecen (incl. rechazado y genéricos) |
| **No toca snapshots** | Conteo 3 sin cambio |
| **No toca meeting decisions** | Conteo 1 (Pickup) sin cambio |
| **No toca Pickup 4x4** | Caso semilla BCR y evidencia BD preservados |
| **No toca app_users** | Daniel Admin intacto |
| **No toca pipelines** | 18 etapas intactas |
| **No toca crm_setup_config** | Fila setup/auditoría intacta |
| **Reduce ruido operativo** | UI de leads sin filas «Prueba…» |
| **Valida el proceso** | Primera limpieza real con alcance mínimo antes de Bloque 4 |

---

## 7. Qué queda fuera de esta ejecución mínima

| Ítem | ID / referencia | Etapa futura |
|------|-----------------|--------------|
| Draft rechazado prueba | `6f956975-8aac-4016-a982-29db70eb1b5e` | Posible Bloque 4 (decisión aparte) |
| Drafts genéricos | `defe6513…`, `d77f2e3e…` (`not-resolved-in-preview`) | Bloque 5 — no autorizado |
| Snapshots genéricos | 2 en `defe6513…` | Ligados a decisión genéricos |
| Pickup 4x4 draft | `0fa4f061…` | **Excluido permanentemente** |
| Meeting decision Pickup | `9c04f4a5…` | **Excluido** |
| Snapshot Pickup | 1 en draft `0fa4f061…` | **Excluido** |
| `app_users` | Daniel Admin | Excluido |
| `leads_pipelines` | 18 filas | Excluido |
| `crm_setup_config` | 1 fila | Excluido |
| Migraciones, código, preset, docs BCR | Repo | Excluido |

---

## 8. Condiciones antes de ejecutar (fase posterior 11T)

Ejecutar Bloque 3 **solo** si se cumplen **todas**:

1. **Entorno Supabase** confirmado: proyecto `summer87-leads-v3`, main/PRODUCTION.
2. **Evidencia 11R** vigente (backups diarios visibles); opcional re-verificar pantalla Backups el mismo día.
3. **SELECT Bloque 0** (conteos) del documento 11O — anotar «antes».
4. **SELECT Bloque 2** — leads por `nombre IN ('Prueba Seguimiento Pickup', 'Prueba Pickup 4x4')` devuelve **exactamente 2 filas**.
5. **SELECT** `COUNT(*)` en `leads` — si total > 2, investigar antes de DELETE (posibles leads nuevos desde L1).
6. **Bloque 1** Pickup — verificar que draft/snapshot/meeting Pickup siguen presentes (no se ejecuta DELETE sobre ellos).
7. **Daniel confirma explícitamente** ejecución de Bloque 3 (referencia a este documento 11S).
8. **No usar Run All** en SQL Editor; solo Bloque 3 en transacción controlada según 11O.
9. **Documentar resultado** de inmediato (fase 11T / L4).
10. **Validar UI/app** según §10.

---

## 9. SQL permitido en fase futura

| Permitido | No permitido en esta ejecución mínima |
|-----------|--------------------------------------|
| **Solo Bloque 3** de `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md` | Bloques 4, 5 (DELETE drafts/snapshots genéricos) |
| SELECTs Bloques 0, 1, 2, 6 (verificación) | Cualquier DELETE sobre `installer_package_*` |
| | Patrones amplios (`ILIKE '%prueba%'` sin lista exacta de nombres) |

**Este documento 11S no incluye SQL ni sentencias DELETE.** Consultar el archivo 11O para el texto exacto.

---

## 10. Validación posterior esperada

Tras ejecución futura exitosa de **solo Bloque 3**:

| Métrica | Antes (L1) | Después esperado |
|---------|------------|------------------|
| `leads` | 2 | **0** (si no hubo otros leads) |
| `installer_package_drafts` | 4 | **4** (sin cambio) |
| `installer_package_simulation_snapshots` | 3 | **3** |
| `installer_package_meeting_decisions` | 1 | **1** |

**Checklist app (no SQL):**

- Módulo leads: no aparecen «Prueba Seguimiento Pickup» ni «Prueba Pickup 4x4».
- `/admin/constructor-crm/paquetes`: Pickup 4x4 **sigue visible**.
- Detalle Pickup: snapshot y reunión accesibles.
- Login Daniel Admin OK.
- `npm run build` sin errores.
- `git status` limpio en repo.
- Registrar en **fase 11T** (resultado de ejecución).

---

## 11. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Backup **no probado** con Restore real | Backups diarios 11R; Restore disponible si incidente; aceptado para alcance mínimo B |
| Entorno **production** | SELECTs del día; solo 2 filas por nombre exacto |
| **Nuevos leads** desde L1 | Bloque 2 + conteo total; detener si ≠ 2 filas por nombre exacto |
| App o reportes que **esperaban** leads demo | Riesgo bajo; validar UI post-limpieza |
| Ejecución accidental de Bloque 4 | Solo autorizar Bloque 3 en 11T; no Run All |

---

## 12. Próxima fase sugerida

### Fase 11T — Ejecución controlada Bloque 3 (limpieza de leads prueba)

| Campo | Valor |
|-------|--------|
| **Objetivo** | Ejecutar DELETE de 2 leads según Bloque 3 del SQL 11O |
| **Prerrequisito** | Confirmación **explícita** de Daniel tras leer 11S + SELECTs del día |
| **Entregable** | `docs/constructor-crm/resultado-ejecucion-limpieza-leads-11T.md` (nombre sugerido) con conteos antes/después y checklist §10 |
| **Si no confirma** | Permanecer en estado actual; Opción A sigue válida |

**Segunda etapa (futura, no 11T):** evaluar **Opción C** (Bloque 4 — draft rechazado) en documento de decisión aparte.

---

## 13. Decisión actual

> **En 11S no se ejecuta SQL.**  
> Solo se recomienda que la **próxima ejecución**, si Daniel confirma explícitamente, sea **únicamente Bloque 3**: limpieza de los **2 leads de prueba** indicados en §5.

| Campo | Valor |
|-------|--------|
| **Opción recomendada** | B |
| **Ejecutado en 11S** | Nada |
| **Bloque SQL futuro autorizado** | 3 únicamente |
| **Fecha registro** | 2026-05-17 |

---

## 14. Confirmación de alcance (fase 11S)

- ✅ Decisión final de limpieza mínima documentada
- ❌ No se ejecutó SQL
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se tocó Supabase (más allá de documentación en repo)
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional
- ❌ No se inventó que se ejecutó limpieza

---

*Decisión 11S — Primera ejecución recomendada: solo 2 leads de prueba (Bloque 3). Pendiente confirmación y fase 11T.*
