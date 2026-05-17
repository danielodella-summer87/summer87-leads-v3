# Protocolo Backup Supabase 11Q — Base Madre Constructor CRM Summer87

**Versión:** Fase 11Q (protocolo documental)  
**Relacionado con:** `docs/constructor-crm/decision-ejecucion-limpieza-11P.md`, `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md`, `docs/constructor-crm/propuesta-limpieza-segura-L3.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`

**Estado:** protocolo definido. **No implica** que un backup ya exista ni que se haya validado en Supabase en esta fase.

---

## 2. Resumen ejecutivo

Antes de ejecutar **cualquier limpieza** sobre la base madre del Constructor CRM (leads de prueba, draft rechazado, o futuros genéricos), el equipo debe contar con un **respaldo confiable y verificable** del proyecto Supabase **summer87-leads-v3**.

Este documento define **qué respaldar**, **cómo evaluar opciones**, **checklists antes y después** de crear el backup, y la relación con el SQL propuesto (fase 11O). **No autoriza ejecución de limpieza** por sí solo.

**Decisión vigente (11P):** no ejecutar limpieza hasta completar este protocolo y registrar evidencia en la fase **11R** sugerida.

---

## 3. Contexto

| Elemento | Detalle |
|----------|---------|
| **Proyecto Supabase** | `summer87-leads-v3` |
| **Entorno observado (L1)** | `main` / **PRODUCTION** (dashboard Supabase) |
| **Limpieza propuesta (L3)** | 2 leads de prueba + 1 draft rechazado (`rejection_reason: prueba`); genéricos pendientes |
| **SQL documentado** | `sql-propuesto-limpieza-base-madre-L3.md` — **no ejecutado** |
| **Decisión 11P** | No ejecutar limpieza todavía; esperar backup validado |
| **Pickup 4x4** | **Excluido** de limpieza; caso semilla BCR en repo (`ficha-bcr-pickup4x4.md`) |
| **IDs protegidos** | Draft `0fa4f061-cdd1-4693-a20a-9ff5e92ca999`; meeting `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |

La base madre no está «virgen» (4 drafts, 3 snapshots, 2 leads, etc.) pero el volumen es **acotado**. El riesgo de una limpieza mal ejecutada sigue siendo **alto en reputación** (production) aunque el volumen sea bajo.

---

## 4. Objetivo del backup

| Objetivo | Descripción |
|----------|-------------|
| **Recuperación** | Restaurar filas o tablas si un DELETE afecta datos incorrectos |
| **Preservar evidencia** | Conservar estado previo de Pickup y artefactos del Instalador |
| **Auditoría antes/después** | Comparar conteos y exports con inventario L1 y post-limpieza L4 |
| **Proteger base madre duplicable** | No declarar la plantilla «lista para clonar» sin punto de restauración conocido |
| **Habilitar staging** | Permitir probar Bloques 3–4 en clon sin tocar production |

El backup **no sustituye** la documentación BCR ni el control de cambios en Git; complementa la operación en base de datos.

---

## 5. Opciones de respaldo a evaluar

Evaluar según plan Supabase, permisos de organización y tiempo disponible.

| Opción | Descripción | Cuándo priorizar |
|--------|-------------|------------------|
| **Backup automático / PITR** | Point-in-Time Recovery del plan Pro/Team si está habilitado | Ideal en production; verificar en Dashboard → Database → Backups |
| **Snapshot / restore del proyecto** | Duplicar proyecto o restaurar a punto en el tiempo (según plan) | Antes de cambios destructivos en production |
| **Dump SQL manual** | Export lógico vía Supabase CLI, `pg_dump` o Database → Backups → descarga | Si PITR no está disponible o se quiere archivo local |
| **Export CSV por tabla** | Export desde Table Editor o consultas a CSV de tablas afectadas | Respaldo mínimo rápido, fila a fila |
| **Copia manual de resultados SELECT** | Pegar salida de Bloque 0–2 del SQL propuesto en documento L4/11R | Complemento, **no suficiente** como único respaldo |
| **Entorno staging / clon** | Proyecto Supabase duplicado o branch de preview con mismas migraciones | Probar limpieza antes que production (Opción D de 11P) |

**Nota:** en esta fase 11Q **no se confirma** cuál opción está activa en la cuenta Summer87; debe verificarse en el dashboard al ejecutar 11R.

---

## 6. Tablas críticas a respaldar antes de limpieza

Aunque la limpieza L3 segura **solo toca** `leads` y `installer_package_drafts` (1 fila), conviene contexto completo del Instalador y configuración madre.

| Tabla | Rol en base madre | ¿Limpieza L3 segura? |
|-------|-------------------|----------------------|
| `public.installer_package_drafts` | Borradores 8B; incluye Pickup | Solo 1 fila rechazada (futuro Bloque 4) |
| `public.installer_package_simulation_snapshots` | Simulaciones; CASCADE desde drafts | No DELETE directo en L3 segura |
| `public.installer_package_meeting_decisions` | Reuniones; CASCADE desde drafts | No tocar (solo Pickup existe hoy) |
| `public.leads` | 2 leads prueba | Bloque 3 futuro |
| `public.crm_setup_config` | Setup Constructor (1 fila) | **Excluido** — respaldo por contexto |
| `public.app_users` | Daniel Admin | **Excluido** — respaldo por contexto |
| `public.leads_pipelines` | 18 etapas | **Excluido** — respaldo por contexto |

Tablas L1 ya vacías o sin acción (`empresas`, `entity_import_batches`) — opcionales en export mínimo.

---

## 7. Respaldo mínimo recomendado (limpieza segura L3)

Mínimo aceptable **antes** de autorizar Bloques 3 y/o 4 en production:

| # | Elemento | Formato sugerido |
|---|----------|------------------|
| 1 | Export `installer_package_drafts` | CSV o JSON (todas las filas; son 4) |
| 2 | Export `installer_package_simulation_snapshots` | CSV o JSON (3 filas) |
| 3 | Export `installer_package_meeting_decisions` | CSV o JSON (1 fila) |
| 4 | Export `leads` | CSV o JSON (2 filas) |
| 5 | Captura de **conteos iniciales** | Texto en `evidencia-backup-11R.md` (Bloque 0 del SQL propuesto, resultados pegados) |
| 6 | Confirmación escrita de **Pickup 4x4** presente | ID draft `0fa4f061…`, preset `pickup_4x4`, 1 snapshot, 1 meeting decision |

**Ubicación:** fuera del repositorio Git (almacenamiento seguro acordado: Drive cifrado, bucket privado, máquina local con disco cifrado).

**Caducidad:** conservar al menos hasta cerrar L4 post-limpieza + 30 días o hasta clon operativo Pickup, lo que sea mayor.

---

## 8. Respaldo ideal recomendado

| # | Elemento |
|---|----------|
| 1 | **Backup completo** del proyecto (PITR activo verificado **o** dump SQL completo de la base) |
| 2 | **Prueba de restauración** o consulta en **staging/clon** (restaurar dump en proyecto de prueba o duplicar proyecto) |
| 3 | Validación de que el backup **se abre o consulta** (conectar con cliente SQL o restaurar 1 tabla de prueba) |
| 4 | **Registro** en documento 11R: fecha/hora UTC, responsable, método, ruta/ubicación, retención, ID proyecto |
| 5 | Export mínimo §7 **además** del backup completo |
| 6 | Opcional: export `crm_setup_config`, `app_users`, `leads_pipelines` para snapshot de configuración madre |

**Meta:** poder volver al estado del día del backup sin depender solo de memoria o de capturas de pantalla.

---

## 9. Checklist antes de ejecutar limpieza

Completar **todos** los ítems antes de cualquier DELETE (fase posterior a 11Q/11R):

- [ ] Proyecto Supabase confirmado: **summer87-leads-v3** (nombre en dashboard coincide).
- [ ] Rama/entorno confirmado: **main / PRODUCTION** (no preview branch equivocado si aplica).
- [ ] Backup o export **disponible** según §7 o §8.
- [ ] **Fecha y hora** del backup anotadas (UTC recomendado).
- [ ] **Responsable** que generó el backup identificado (nombre + rol).
- [ ] **Ubicación** del archivo/snapshot documentada (ruta lógica, sin secretos en repo).
- [ ] Archivos de backup **no** contienen `service_role` ni `.env.local` empaquetados.
- [ ] **Daniel** autorizó por escrito alcance: Bloque 3, 4, o ambos (referencia `decision-ejecucion-limpieza-11P.md` actualizada si cambia).
- [ ] **SELECTs previos** del día ejecutados (`sql-propuesto-limpieza-base-madre-L3.md` Bloques 0–2); resultados coinciden con L1 o inventario actualizado.
- [ ] Pickup verificado en Bloque 1 — **no** incluido en alcance de DELETE.
- [ ] Protocolo 11Q **completado** y evidencia 11R **registrada**.

---

## 10. Checklist después de crear backup

Al terminar de generar el respaldo (tarea humana en Supabase, fuera de esta fase documental):

- [ ] Archivo o snapshot **existe** en la ubicación acordada.
- [ ] **Tamaño** coherente (no 0 bytes; proporcional a pocas filas en tablas pequeñas o dump completo > mínimo esperado).
- [ ] Se puede **abrir o consultar** (visor CSV, cliente SQL, o UI Supabase restore de prueba).
- [ ] Incluye tablas críticas §6 (al menos las del mínimo §7).
- [ ] **No se subió a Git** si contiene datos personales o payloads completos.
- [ ] Ubicación documentada en **11R** (fuera del repo si hay sensibilidad).
- [ ] Responsable y fecha registrados en **11R**.
- [ ] Opcional: hash o nombre de archivo versionado en 11R (sin contenido del dump).

---

## 11. Qué no hacer

- **No** subir dumps, CSV con PII ni `package_payload` completos al repositorio Git.
- **No** compartir **service role key**, `anon` con RLS bypass, ni contraseñas de base en chat o docs.
- **No** guardar `.env.local` junto con exports de backup.
- **No** usar `reset-db` del proyecto como sustituto de backup.
- **No** asumir que **GitHub** es backup de la base de datos (solo código y docs).
- **No** ejecutar limpieza basándose **solo** en capturas de pantalla o SELECTs pegados sin export restaurable.
- **No** ejecutar DELETE en **production** sin respaldo confirmado según §7 mínimo o §8 ideal.
- **No** incluir en scripts del repo rutas automáticas a backups con credenciales.

---

## 12. Relación con fase 11O (SQL propuesto)

| Fase | Rol |
|------|-----|
| **11O** | SQL propuesto (`sql-propuesto-limpieza-base-madre-L3.md`) — revisable, con DELETE por ID |
| **11P** | Decisión: no ejecutar hasta backup |
| **11Q** | Este protocolo — **qué** respaldar y **cómo** validar |
| **11R** (sugerida) | Evidencia concreta de que el backup existe |
| **Ejecución** | Solo después de 11Q + 11R + checklist §9 |

El SQL de limpieza L3 **solo puede considerarse ejecutable** cuando:

1. Existe evidencia 11R de backup válido.
2. Daniel confirma bloques (3 y/o 4).
3. SELECTs del mismo día coinciden con expectativas.

Hasta entonces, los bloques DELETE del documento 11O permanecen **documentación**, no autorización operativa.

---

## 13. Decisión recomendada

| Recomendación | Detalle |
|---------------|---------|
| **Ejecutar limpieza ahora** | **No** |
| **Primer paso operativo** | En dashboard Supabase: verificar si **PITR / backups automáticos** están activos en el plan actual |
| **Si no hay PITR** | Realizar **export manual mínimo** §7 de las cuatro tablas Instalador + leads el mismo día de la limpieza |
| **Si hay tiempo** | Configurar o usar **staging/clon** y ejecutar allí Bloques 3–4 antes que production |
| **Registrar** | Completar fase **11R** con método, fecha y validación antes de autorizar ejecución |

**Riesgo de esperar:** bajo (datos demo acotados). **Riesgo de limpiar sin backup:** innecesario en production.

---

## 14. Próxima fase sugerida

### Fase 11R — Evidencia de backup Supabase previo a limpieza

| Campo | Contenido sugerido |
|-------|-------------------|
| **Archivo** | `docs/constructor-crm/evidencia-backup-supabase-11R.md` |
| **Objetivo** | Documentar **qué** respaldo concreto existe (método, fecha UTC, alcance, ubicación segura, responsable) |
| **Validación** | Checkbox: mínimo §7 cumplido / ideal §8 cumplido; prueba de consulta o restore |
| **Salida** | Autorización condicional para pasar a ejecución controlada (L4) referenciando 11P + SQL 11O |

**No inventar en 11R** que el backup ya existe hasta que una persona lo cree y lo registre.

---

## 15. Confirmación de alcance (fase 11Q)

En la fase que produce este protocolo:

- ✅ Protocolo de backup documentado
- ❌ No se ejecutó SQL
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se tocó Supabase (dashboard, CLI, API)
- ❌ No se crearon endpoints
- ❌ No se crearon scripts ejecutables en repo
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional
- ❌ No se afirma que un backup ya fue creado o validado

---

*Protocolo 11Q — Backup antes de limpieza base madre. Prerrequisito de ejecución del SQL L3 (11O).*
