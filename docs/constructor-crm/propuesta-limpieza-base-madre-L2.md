# Propuesta de Limpieza Controlada L2 — Base Madre Constructor CRM Summer87

**Versión:** Limpieza-L2-propuesta (documental)  
**Relacionado con:** `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/checklist-limpieza-base-madre.md`, `docs/constructor-crm/selects-inventario-base-madre.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`

**Estado:** propuesta de limpieza **no ejecutada**. No incluye SQL destructivo ni comandos de ejecución.

---

## 2. Resumen ejecutivo

Con base en el **inventario L1** (`inventario-datos-base-madre-L1.md`, 2026-05-17, Supabase summer87-leads-v3 / production), se propone una **limpieza controlada L2** para acercar la base madre a un estado **virgen duplicable**, sin perder aprendizaje útil del Constructor ni del caso **Pickup 4x4**.

**Situación actual:** la base está **limpia en volumen operativo** (0 empresas, 0 imports, 0 rubros demo, 1 admin), pero **no es virgen** por evidencia del Instalador (4 drafts, 3 snapshots, 1 meeting decision), `crm_setup_config`, 2 leads de prueba y 18 pipelines.

**Conclusión de la propuesta:**

- **No limpiar Pickup 4x4** en base de datos hasta **exportar o promover** su aprendizaje a la **Base de Conocimiento por Rubro (BCR)** y registrar decisión explícita (evidencia histórica vs. archivo).
- **Sí considerar**, en una fase L3 posterior y con backup, la limpieza de datos **claramente demo/test** (draft rechazado con motivo `prueba`, 2 leads «Prueba Pickup…», y eventualmente drafts/snapshots genéricos si se confirma que no aportan aprendizaje).

Esta fase **solo documenta** la propuesta; **no ejecuta** ninguna acción en Supabase.

---

## 3. Alcance

| Incluido | Excluido |
|----------|----------|
| Criterios y orden de limpieza propuesta | Ejecución de `DELETE` / `UPDATE` / `TRUNCATE` |
| Clasificación A–E ampliada | Modificación de Supabase |
| Plan por etapas y checklists | Scripts, endpoints, migraciones nuevas |
| Opciones de tratamiento Pickup / genéricos / pipelines | Instalación CRM, tenants, usuarios |
| Riesgos y prioridades | Escritura en Kore / Zeta |
| Referencia a fase 11K (export BCR) | Tag git `base-madre-v1` (solo se menciona) |

---

## 4. Principios de limpieza L2

1. **Conservar la máquina** — código Constructor, Instalador, migraciones, contratos `package_payload`, endpoints de evidencia.
2. **Auditar lo que la máquina produjo** — drafts, snapshots, decisions; no confundir capacidad de tabla con “basura”.
3. **Exportar aprendizaje antes de borrar** — especialmente Pickup 4x4 → BCR (blueprint v0, preguntas, riesgos, lección).
4. **No borrar Pickup 4x4 sin decisión explícita** — draft `0fa4f061…`, su snapshot y meeting decision `9c04f4a5…`.
5. **No tocar usuario admin** — `Daniel Admin` (único `app_users`) salvo política acordada para clones.
6. **No tocar migraciones** ni historial SQL del repo.
7. **No tocar código Constructor** en la misma iniciativa que limpieza de datos.
8. **Separar datos semilla de datos prueba** — Pickup semilla ≠ draft `rejection_reason: prueba` ≠ leads «Prueba…».
9. **Priorizar limpieza mínima y reversible** — backup, staging si existe, validación post-limpieza, documentar conteos antes/después.

---

## 5. Clasificación por grupo

### A. Conservar / no tocar

| Ítem | Motivo |
|------|--------|
| Código Constructor / Instalador | Capacidad de fábrica |
| Documentación estratégica (`docs/constructor-crm/*`, 7W, 8x) | Gobernanza y contratos |
| Migraciones estructurales | Esquema compartido con futuros clones |
| Preset `pickup_4x4` (código) | Blueprint v0 en repo |
| Usuario **Daniel Admin** | Acceso operativo base madre |
| Endpoints de evidencia (drafts, snapshots, simulate, meeting-decisions) | Producto |
| Contrato `package_payload` | Intercambio Constructor ↔ Instalador |
| Base de Conocimiento por Rubro (documentación y futura persistencia) | Memoria sectorial |
| **18** `leads_pipelines` | Hasta revisión funcional — posible base operativa |
| `crm_setup_config` (1 fila) | Hasta decisión funcional (reset vs. conservar) |

### B. Exportar / promover a BCR antes de limpiar

| Ítem | IDs / referencia L1 |
|------|---------------------|
| Draft Pickup 4x4 aprobado | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` — preset `pickup_4x4`, target Pickup 4x4 |
| Snapshot Pickup asociado | 1 snapshot en draft `0fa4f061…` |
| Meeting decision Pickup | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` — `advance_manual_preparation` |
| Preguntas / checklist reunión Pickup | UI `paquetes/[id]`, constantes `PICKUP_REUNION_*` + payload |
| Decisión «Avanzar a preparación manual controlada» | Texto y razón en meeting decision |
| Blueprint / preset como **blueprint v0** rubro 4x4 | `lib/admin/installablePackagePickup4x4Preset.ts` + draft payload |
| Aprendizajes: Kore read-only, pipeline 4x4, reportes, permisos, auditoría pre-SQL | Extraer de `package_payload` y flujo documental |

### C. Revisar manualmente

| Ítem | Detalle L1 |
|------|------------|
| Drafts genéricos `approved_for_pilot` | `defe6513-2c2a-45d7-9254-5bd0d196b0e9`, `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` — `not-resolved-in-preview`, preset NULL |
| Snapshots genéricos | 2 snapshots en draft `defe6513…` |
| 18 `leads_pipelines` | ¿Base madre vs. preset agencia vs. cliente futuro? |
| `crm_setup_config` | `bb0804fd…`, step `auditoria`, score 15 |
| `app_users` en clon | ¿Solo en madre o re-seed en cada CRM cliente? |

### D. Candidatos a limpieza posterior (L3+, con aprobación y backup)

| Ítem | Detalle |
|------|---------|
| Draft rechazado | `6f956975-8aac-4016-a982-29db70eb1b5e` — `rejection_reason: prueba` |
| 2 leads de prueba | «Prueba Seguimiento Pickup», «Prueba Pickup 4x4» |
| Drafts genéricos no Pickup | Si Etapa 2 confirma que no aportan aprendizaje |
| Snapshots genéricos | Cascada FK desde drafts eliminados o limpieza selectiva |
| Artefactos locales `.claude/` | No versionados; política `.gitignore` (fuera de BD) |

### E. Limpio / sin acción

| Ítem | Valor L1 |
|------|----------|
| `empresas` | 0 |
| `rubros` demo/test/prueba | 0 |
| `entity_import_batches` | 0 |
| Meeting decisions con texto prueba/demo/asdf | 0 |

---

## 6. Plan recomendado por etapas

### Etapa 1 — Exportar aprendizaje Pickup (fase 11K)

- Documentar Pickup como **caso semilla** formal.
- Mapear elementos a entidades BCR conceptuales (blueprint, preguntas, riesgos, lección).
- Definir si el preset/draft queda como **blueprint v0** del rubro automotriz/4x4.
- Decidir: **evidencia histórica en BD** vs. **archivo exportado + limpieza posterior**.

**Salida:** documento BCR Pickup (11K) + decisión registrada. **Sin DELETE.**

### Etapa 2 — Confirmar datos genéricos

- Revisar drafts `defe6513…` y `d77f2e3e…` (manifest `not-resolved-in-preview`).
- Revisar 2 snapshots en `defe6513…` (payload, fechas, si duplican ensayos UI).
- Decidir: conservar como evidencia de flujo 8x vs. ruido eliminable en L3.

### Etapa 3 — Limpiar datos claramente test (L3 propuesta)

- Draft `6f956975…` (rechazado, `prueba`).
- Leads «Prueba Seguimiento Pickup» y «Prueba Pickup 4x4».
- Cualquier otro demo confirmado en re-ejecución de SELECTs.

**Precondición:** Etapas 1–2 cerradas; backup verificado.

### Etapa 4 — Revisar configuración base

- **Pipelines:** ¿permanecen en madre como catálogo default o se documentan en BCR/preset?
- **`crm_setup_config`:** reset a `{}` / nueva fila / conservar para continuar trabajo Constructor.
- **`app_users`:** política para clones (nuevo admin por proyecto Supabase).

### Etapa 5 — Validar aplicación

- `npm run dev` — app levanta.
- Rutas Constructor, listado y detalle de paquetes.
- Login admin.
- `npm run build`.

### Etapa 6 — Tag base madre limpia (futuro)

- Tag conceptual: `base-madre-v1` o `constructor-base-v1`.
- **No crear tag en esta fase L2** — solo tras L3 + validación Etapa 5.

---

## 7. Propuesta de tratamiento para Pickup 4x4

| Opción | Descripción | Pros | Contras |
|--------|-------------|------|---------|
| **A** | Conservar filas en BD como evidencia histórica permanente en la madre | Trazabilidad completa; UI sigue mostrando caso referencia | Base no “virgen”; riesgo al duplicar misma BD |
| **B** | Exportar a BCR/documento y **luego** archivar o eliminar filas en madre | Madre más limpia; aprendizaje en BCR | Requiere export completo antes de DELETE; pierde demo en UI si se borra todo |
| **C** | Mover evidencia al **primer CRM operativo** `pickup4x4-crm-v1` al duplicar | Separación madre/cliente | Duplica complejidad; madre aún puede tener restos |

**Recomendación L2:**

- **No borrar Pickup 4x4 todavía.**
- Ejecutar primero **fase 11K**: documentar como caso semilla y **blueprint v0** en BCR.
- Mantener **Opción A** en production madre hasta tener clon Pickup o export BCR firmado; entonces reevaluar **Opción B** para madre virgen.

**Artefactos Pickup a preservar en export BCR (mínimo):**

- Draft `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` (payload resumido o export JSON privado).
- Snapshot (1).
- Meeting decision `9c04f4a5…`.
- Preset código + textos checklist/minuta UI.

---

## 8. Propuesta de tratamiento para drafts genéricos

Los drafts con `target_client_name: not-resolved-in-preview` y `preset: NULL`:

| id | generated_at | snapshots |
|----|--------------|-----------|
| `defe6513-2c2a-45d7-9254-5bd0d196b0e9` | ~2026-05-13 23:36 | **2** |
| `d77f2e3e-5a4d-4a96-97ff-d923e330b87c` | ~2026-05-13 22:40 | **0** |

**Hipótesis:** pruebas del flujo de generación/preview (8A/8B) sin cliente resuelto; `constructor_id` placeholder `11111111…`.

**Propuesta:**

1. Abrir detalle en UI o exportar `package_payload` (lectura) y comparar con Pickup.
2. Si solo repiten ensayos sin decisión de negocio → **candidatos D** en L3 (borrar draft + snapshots en cascada).
3. Si documentan un hito útil del producto → conservar o resumir en doc interno (no BCR rubro).

**No eliminar** en L2 sin Etapa 2 cerrada.

---

## 9. Propuesta de tratamiento para leads de prueba

| Lead | empresa_id | origen | Clasificación |
|------|------------|--------|---------------|
| Prueba Seguimiento Pickup | NULL | Whatsapp | Demo operativo Pickup |
| Prueba Pickup 4x4 | NULL | Whatsapp | Demo operativo Pickup |

- Sin empresas asociadas; volumen bajo (2 filas).
- **Candidatos claros** a limpieza en L3.
- **Antes de borrar:** confirmar que no se usan en demo comercial actual ni en pruebas de seguimiento planificadas.
- Si se eliminan, verificar FKs (`socio_acciones`, propuestas, documentos) — inventario L1 no reportó dependencias; re-validar con SELECT en L3.

---

## 10. Propuesta de tratamiento para pipelines

- **18** etapas en `leads_pipelines` (mezcla etapas tipo agencia/servicios: Contrato, Costeo, Gamma-style comercial, etc.).
- Parecen **configuración comercial general** de la instancia madre, no basura obvia.
- **Útiles** como base operativa para demos internos o como semilla de preset — **no limpiar automáticamente**.
- **Acción L2:** workshop corto — ¿permanecen en base madre, se documentan en BCR/preset 7Q, o se resetean al declarar virgen?
- Duplicar madre **con estos 18 pipelines** a un cliente no-Pickup sería riesgo de producto (ver §12–13).

---

## 11. Propuesta de tratamiento para `crm_setup_config`

| Campo | Valor observado |
|-------|-----------------|
| id | `bb0804fd-cc6a-44ab-8969-2b94cdaad984` |
| status | `setup` |
| current_step | `auditoria` |
| readiness_score | 15 |

- Representa **estado de trabajo en curso** del Constructor en esta instancia, no necesariamente “datos cliente”.
- **Opciones futuras (L3/L4):** (1) conservar para seguir diseño; (2) reset JSONB de pasos a `{}` y `current_step: empresa`; (3) nueva fila en clon solo.
- **No limpiar automáticamente** en L2.

---

## 12. Riesgos si se limpia mal

- Perder **aprendizaje Pickup** no exportado a BCR.
- Romper **evidencia histórica** (meeting decision, snapshot único).
- Borrar **trazabilidad** de aprobación piloto (`approved_for_pilot`).
- Dejar **BCR sin caso semilla** real en rubro 4x4.
- **Copiar** a clon datos test si la limpieza es incompleta.
- **Romper pantallas** que listan drafts (vacío esperado vs. error).
- **Falsa sensación** de base virgen con pipelines/setup/config sin revisar.
- **Tocar** `app_users` / credenciales y bloquear acceso a la madre.

---

## 13. Riesgos si no se limpia

- **Duplicar** repositorio + misma BD production a un cliente con drafts y leads de prueba.
- **Arrastrar** leads «Prueba Pickup» al CRM operativo del cliente.
- **Mostrar** drafts viejos en listado del Constructor de un clon.
- **Confundir** instalador con evidencia de otro caso.
- **Mezclar** caso Pickup con nuevo cliente del mismo Supabase.
- **Mantener** `crm_setup_config` en paso `auditoria` con score 15 en una “virgen”.

---

## 14. Orden de prioridad recomendado

| Prioridad | Acción |
|-----------|--------|
| **P1** | No tocar Pickup hasta export BCR (11K). No tocar usuario admin. No tocar código/migraciones. |
| **P2** | Documentar Pickup como semilla BCR. Revisar drafts genéricos (`defe6513…`, `d77f2e3e…`). |
| **P3** | Proponer limpieza L3: leads prueba + draft `6f956975…` (rechazado `prueba`). |
| **P4** | Revisar 18 pipelines + `crm_setup_config` + política clones. |
| **P5** | Validación app + tag `base-madre-v1` (post-L3). |

---

## 15. SQL futuro propuesto (solo conceptual)

En una **fase L3 posterior** se podrá preparar un documento aparte con SQL de limpieza **revisado línea por línea** y ejecutado solo tras backup y, si existe, **staging**.

**Este documento L2 no incluye** `DELETE`, `UPDATE`, `TRUNCATE`, `DROP` ni `ALTER`.

**Tablas que podrían tratarse en L3** (sujeto a decisión y FKs):

| Tabla | Tratamiento conceptual posible |
|-------|--------------------------------|
| `installer_package_meeting_decisions` | Eliminar solo filas no Pickup / o archivar Pickup tras export |
| `installer_package_simulation_snapshots` | Cascada o selectivo por `draft_id` |
| `installer_package_drafts` | Eliminar rechazados y genéricos confirmados; conservar o archivar Pickup |
| `leads` | Eliminar 2 filas de prueba por `id` o criterio nombre |
| `crm_setup_config` | `UPDATE` de JSONB / delete fila — solo con decisión Etapa 4 |

Toda sentencia futura debe ir acompañada de **SELECT de verificación** previo y posterior (ver `selects-inventario-base-madre.md`).

---

## 16. Checklist antes de cualquier limpieza real (L3+)

- [ ] **Backup** de Supabase verificado (restaurable o export acordado).
- [ ] **Confirmar entorno** (no production accidental sin ventana).
- [ ] **Exportar Pickup** a BCR / documento 11K completado.
- [ ] **Revisar drafts genéricos** (Etapa 2) y registrar decisión por id.
- [ ] **Validar leads** son prueba (re-ejecutar SELECT §6.5–6.6 inventario).
- [ ] **Confirmar con Daniel** (o responsable producto) lista D aprobada.
- [ ] **Preparar SQL** en documento L3 separado (no este archivo).
- [ ] **Revisión humana** de cada sentencia propuesta.
- [ ] **Ejecutar primero en staging** si existe snapshot/clon.
- [ ] Plan de **rollback** documentado.

---

## 17. Checklist después de limpieza real futura (L3+)

- [ ] Re-ejecutar **conteos** (drafts, snapshots, leads, empresas).
- [ ] Abrir **Constructor** y rutas `/admin/constructor-crm`.
- [ ] **Listado de paquetes** — sin drafts test no deseados (o estado esperado documentado).
- [ ] **Detalle de paquete** — sin error 500.
- [ ] **Login** admin funcional.
- [ ] Confirmar **ausencia** de leads «Prueba…» en UI operativa.
- [ ] `npm run build` exitoso.
- [ ] `git status` limpio (solo docs si aplica).
- [ ] Actualizar **inventario** o anexo L3 con conteos después.
- [ ] Evaluar tag **`base-madre-v1`**.

---

## 18. Recomendación

1. **No ejecutar limpieza** en esta fase L2.
2. **Primero:** fase **11K** — documentar/exportar **Pickup 4x4** como caso semilla BCR (blueprint v0, preguntas, riesgos, lección, decisión `advance_manual_preparation`).
3. **Segundo:** cerrar **Etapa 2** (drafts genéricos + 2 snapshots).
4. **Tercero:** redactar **propuesta L3** con SQL de verificación + DELETE propuesto (documento aparte, revisión humana, backup).
5. **Duplicación a cliente:** proyecto Supabase **nuevo**; no clonar production con evidencia actual.

---

## 19. Próxima fase sugerida

### Fase 11K — Documentar Pickup 4x4 como caso semilla BCR

**Objetivo:** convertir el aprendizaje Pickup 4x4 (draft, snapshot, meeting decision, preset, UI checklist) en entradas conceptuales BCR **antes** de limpiar filas en base de datos.

**Entregable sugerido:** `docs/constructor-crm/caso-semilla-pickup-4x4-bcr.md` (o secciones añadidas en BCR con versión `blueprint_v0`).

**Después de 11K:** `propuesta-limpieza-base-madre-L3.md` (SQL propuesto, aún sin ejecutar hasta aprobación).

---

## 20. Confirmación de alcance

Este documento de propuesta L2:

- **No borró** ni **modificó** datos.
- **No ejecutó** SQL.
- **No creó** endpoints, scripts ni migraciones.
- **No instaló** CRM, tenant ni usuarios.
- **No tocó** Kore ni Zeta.
- **No tocó** Supabase.

Es únicamente la **propuesta de limpieza controlada** derivada del inventario L1.

---

*Última actualización: 2026-05-17 — Propuesta L2 (no ejecutada).*
