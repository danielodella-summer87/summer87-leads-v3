# Evidencia Backup Supabase 11R — Base Madre Constructor CRM Summer87

**Versión:** Fase 11R (evidencia documental)  
**Relacionado con:** `docs/constructor-crm/protocolo-backup-supabase-11Q.md`, `docs/constructor-crm/decision-ejecucion-limpieza-11P.md`, `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md`, `docs/constructor-crm/propuesta-limpieza-segura-L3.md`

**Estado:** evidencia de **revisión visual** en dashboard Supabase. **No** implica restore probado, dump descargado ni limpieza ejecutada.

---

## 2. Resumen ejecutivo

Se **verificó visualmente** en el dashboard de Supabase la **existencia de backups diarios** (backups físicos con fechas recientes y opción **Restore**) para el proyecto **summer87-leads-v3**, antes de considerar cualquier limpieza futura de la base madre.

Esta evidencia cumple el requisito **documental** del protocolo 11Q de constatar que hay respaldos automáticos disponibles en la UI. **No sustituye** SELECTs previos del SQL 11O ni la decisión explícita de alcance en la fase **11S** sugerida.

**No se ejecutó Restore**, no se descargó backup, no se ejecutó SQL y no se modificó la base de datos.

---

## 3. Entorno observado

| Campo | Valor |
|-------|--------|
| **Proyecto** | summer87-leads-v3 |
| **Organización (UI)** | Cámara Ciudad de la Costa |
| **Entorno visible** | main / **PRODUCTION** |
| **Sección revisada** | Database → **Backups** |
| **Fecha de revisión** | 2026-05-17 |
| **Responsable** | Daniel / Summer87 |
| **Método** | Revisión visual en Supabase Dashboard (sin CLI ni API en esta fase) |

---

## 4. Backups visibles

En la pantalla **Database → Backups** se observaron **backups diarios** y la lista de **backups físicos** siguientes (zona horaria indicada por Supabase: **+0000**):

| # | Fecha y hora (UTC) |
|---|-------------------|
| 1 | 17 May 2026 10:05:35 (+0000) |
| 2 | 16 May 2026 10:05:37 (+0000) |
| 3 | 15 May 2026 10:04:58 (+0000) |
| 4 | 14 May 2026 10:03:51 (+0000) |
| 5 | 13 May 2026 10:04:02 (+0000) |
| 6 | 12 May 2026 10:04:18 (+0000) |
| 7 | 11 May 2026 10:05:52 (+0000) |
| 8 | 10 May 2026 10:04:22 (+0000) |

**Observaciones de UI:**

- Cada fila de backup físico visible muestra botón u opción **Restore**.
- Se observa política de **backups diarios** activa en la misma pantalla.
- El backup más reciente al momento de la revisión: **17 May 2026 10:05:35 (+0000)**.

> Las capturas de pantalla, si existen, permanecen **fuera del repositorio Git** (no se adjuntan ni se suben a este repo).

---

## 5. Advertencia de Storage

Supabase indica en la misma sección de backups que:

> **Storage objects are not included** (los objetos de Storage no están incluidos en estos backups de base de datos).

**Implicancia para limpieza L3:**

- La limpieza propuesta (fases 11O / L3) afecta tablas **PostgreSQL** (`leads`, `installer_package_*`, etc.).
- **No toca** buckets ni archivos de Supabase Storage.
- Si en el futuro hubiera assets críticos solo en Storage, requerirían estrategia de respaldo aparte; **no aplica** al alcance actual de limpieza mínima.

---

## 6. Qué se validó

| Ítem | Estado |
|------|--------|
| Existencia visual de **backups diarios** | ✅ Observado |
| Disponibilidad de opción **Restore** por backup físico | ✅ Observado en UI |
| **Backups físicos recientes** (cadena 10–17 May 2026) | ✅ Listados en pantalla |
| **Proyecto correcto** (`summer87-leads-v3`) | ✅ Visible |
| **Entorno production** (`main / PRODUCTION`) | ✅ Visible |
| Cumplimiento parcial protocolo 11Q (evidencia de respaldo automático) | ✅ Registrado en este documento |

---

## 7. Qué NO se validó

| Ítem | Estado |
|------|--------|
| Prueba de **Restore** (restauración efectiva) | ❌ No realizada |
| Descarga de **dump** SQL o export manual | ❌ No realizada |
| Verificación de **PITR** minuto a minuto (si el plan lo incluye en otra UI) | ❌ No verificada en detalle |
| Inspección del **contenido** interno del backup (filas, tablas) | ❌ No realizada |
| Ejecución de **limpieza** L3 | ❌ No realizada |
| Ejecución de **SQL** (SELECT o DELETE) | ❌ No realizada |
| Export CSV mínimo §7 de protocolo 11Q | ❌ No realizado en esta fase (opcional además de backups diarios) |
| Entorno **staging** / clon para prueba | ❌ No configurado en esta fase |

**Conclusión:** la evidencia es **disponibilidad de respaldo en dashboard**, no **restauración probada**.

---

## 8. Impacto sobre decisión de limpieza

| Aspecto | Lectura |
|---------|---------|
| **Riesgo** | La existencia de backups diarios con Restore **reduce el riesgo** de una limpieza acotada mal ejecutada en production. |
| **No reemplaza** | SELECTs previos (Bloques 0–2 de `sql-propuesto-limpieza-base-madre-L3.md`) el **mismo día** de la ejecución. |
| **No reemplaza** | Confirmación humana de Daniel sobre **bloque exacto** (solo leads vs. leads + draft rechazado). |
| **No reemplaza** | Decisión 11P/11S y checklist §9 de protocolo 11Q. |
| **Decisión 11P** | Sigue vigente en espíritu: no ejecutar sin respaldo; este 11R aporta evidencia de respaldo automático, pendiente 11S para autorizar ejecución. |

Antes de cualquier DELETE: ejecutar SELECTs de confirmación del documento **11O**, comparar con inventario L1, **no usar Run All**, ejecutar por bloques.

---

## 9. Alcance de limpieza futura respaldada

La limpieza futura **considerada** (si se aprueba en 11S), respaldada conceptualmente por estos backups de **base de datos**:

| Incluido (candidato) | Detalle |
|----------------------|---------|
| 2 leads de prueba | «Prueba Seguimiento Pickup», «Prueba Pickup 4x4» (Bloque 3 SQL 11O) |
| 1 draft rechazado | `6f956975-8aac-4016-a982-29db70eb1b5e`, `rejection_reason: prueba` (Bloque 4) |

| Excluido | Motivo |
|----------|--------|
| Draft Pickup 4x4 | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` — caso semilla BCR |
| Snapshot(s) Pickup | Evidencia semilla |
| Meeting decision Pickup | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| `app_users` | Daniel Admin |
| `leads_pipelines` | 18 etapas — config reusable |
| `crm_setup_config` | Decisión funcional aparte |
| Drafts genéricos `defe6513…` / `d77f2e3e…` | Bloque 5 — no autorizado |

---

## 10. Decisión recomendada

| Recomendación | Detalle |
|---------------|---------|
| **Backup automático** | Considerado **disponible** a nivel evidencia visual 11R. |
| **Siguiente paso** | Fase **11S** — *Decisión final de ejecución mínima L3* |
| **Cautela** | Aun con backups diarios: ejecutar primero **SELECTs** del SQL 11O; confirmar bloque; **no** usar Run All. |
| **Restore** | Solo si hubiera incidente; no usar Restore de prueba en production sin ventana de mantenimiento. |
| **Export adicional** | Opcional pero útil: CSV mínimo protocolo 11Q §7 el día de la ejecución, además de confiar en backups diarios. |

**No se recomienda** interpretar este documento como autorización automática para ejecutar DELETE hoy.

---

## 11. Próxima fase sugerida

### Fase 11S — Decisión final de ejecución mínima L3

**Objetivo:** Registrar decisión explícita de Daniel tras 11R.

| Opción | Descripción |
|--------|-------------|
| **A** | No ejecutar limpieza (mantener estado actual) |
| **B** | Ejecutar solo **Bloque 3** (2 leads de prueba) |
| **C** | Ejecutar **Bloques 3 + 4** (leads + draft rechazado prueba) |

**Entregable sugerido:** `docs/constructor-crm/decision-final-ejecucion-11S.md`

**Si se aprueba B o C:** fase posterior de **ejecución controlada** + documento **L4** (conteos después, checklist app).

---

## 12. Confirmación de alcance (fase 11R)

En la fase que produce este documento:

- ✅ Evidencia visual de backups registrada
- ❌ No se ejecutó **Restore**
- ❌ No se ejecutó SQL
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se tocó Supabase más allá de **revisión visual** en dashboard (sin Restore, sin descarga, sin API)
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional
- ❌ No se afirmó que se probó restauración

---

*Evidencia 11R — Backups diarios visibles en Supabase para summer87-leads-v3 (2026-05-17). Prerrequisito documental cumplido; decisión de ejecución pendiente 11S.*
