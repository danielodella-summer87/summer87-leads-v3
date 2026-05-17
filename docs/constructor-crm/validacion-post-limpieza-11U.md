# Validación Post-Limpieza 11U — Base Madre Constructor CRM Summer87

**Versión:** Fase 11U (validación visual y build)  
**Fecha de validación:** 2026-05-17  
**Responsable:** Daniel / Summer87  
**Relacionado con:** `docs/constructor-crm/resultado-ejecucion-limpieza-11T.md`, `docs/constructor-crm/decision-final-limpieza-minima-11S.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`

**Estado:** validación UI/build documentada. **No** implica nuevos cambios en base de datos ni en código en esta fase.

---

## 2. Resumen ejecutivo

Tras la **limpieza mínima 11T** (eliminación de 2 leads de prueba en `public.leads`, tabla en **0** filas), se realizó **validación funcional visual** en rutas admin de leads y Constructor/paquetes, incluido el **detalle del draft Pickup 4x4**, y se ejecutó **`npm run build`** con **resultado exitoso**.

La app **no muestra errores** en las pantallas revisadas; los leads de prueba **no aparecen**; el Instalador y **Pickup permanecen intactos** en UI. Warnings de build observados **no bloquean** esta validación.

---

## 3. Alcance validado

| Área | Ruta / acción | Validado |
|------|---------------|----------|
| Leads operativos | `/admin/leads` | ✅ |
| Listado Instalador | `/admin/constructor-crm/paquetes` | ✅ |
| Detalle caso semilla | `/admin/constructor-crm/paquetes/0fa4f061-cdd1-4693-a20a-9ff5e92ca999` | ✅ |
| Build producción local | `npm run build` | ✅ |

**Fuera de alcance 11U:** SQL en Supabase, restore de backup, staging, flujos completos de generación de paquete, todas las pestañas internas del detalle Pickup.

---

## 4. Validación `/admin/leads`

| Criterio | Resultado |
|----------|-----------|
| Pantalla carga | ✅ Sin error |
| Total leads mostrado | **0** |
| Estado vacío | ✅ Correcto — mensaje **«No hay leads para mostrar.»** |
| Lead «Prueba Seguimiento Pickup» | ✅ **No aparece** |
| Lead «Prueba Pickup 4x4» | ✅ **No aparece** |

**Conclusión:** coherente con `resultado-ejecucion-limpieza-11T.md` (`COUNT(*) = 0` en `public.leads`).

---

## 5. Validación listado paquetes (`/admin/constructor-crm/paquetes`)

| Métrica (UI) | Valor observado |
|--------------|-----------------|
| Pantalla carga | ✅ Sin error |
| **Total borradores** | **4** |
| Aprobados | **3** |
| Rechazados | **1** |
| Expirados | **0** |
| Con evidencia | **2** |
| Sin evidencia | **2** |

**Conclusión:** el listado del **Constructor / Instalador no se rompió** tras la limpieza de leads; conteos alineados con inventario L1 en drafts (4 totales, 1 rechazado).

---

## 6. Validación detalle Pickup

| Campo | Valor observado |
|-------|-----------------|
| **URL** | `/admin/constructor-crm/paquetes/0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **ID draft** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| Pantalla | ✅ Abre sin error |
| **Estado** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **package_version** | `8B-draft-v1` |
| **target_client_id** | ✅ Presente (visible en UI) |
| Nombre / caso | Pickup 4x4 — visible |

**Conclusión:** el **caso semilla Pickup 4x4 sigue intacto**; la limpieza 11T no afectó drafts ni esta vista.

---

## 7. Build

| Campo | Detalle |
|-------|---------|
| **Comando** | `npm run build` |
| **Resultado** | ✅ **Exitoso** |
| **Framework** | Next.js **16.0.11** (Turbopack) |
| Compilación | Compiled successfully |
| TypeScript | ✅ Finalizado correctamente |
| Generación de páginas | ✅ Completada |
| Rutas relevantes incluidas | `/admin/leads`, `/admin/constructor-crm/paquetes` (y árbol admin) |

No hubo **error bloqueante** en el build.

---

## 8. Warnings no bloqueantes

| Warning | Impacto en 11U |
|---------|----------------|
| `baseline-browser-mapping` desactualizado | Informativo; no bloquea build ni validación UI |
| Convención **middleware** deprecated; Next recomienda **proxy** | Deuda técnica futura; no relacionada con limpieza 11T |
| `OPENAI_API_KEY presente: false` | Esperable en build sin clave; no bloquea rutas validadas |
| `DeprecationWarning` — `module.register()` | Informativo; no bloquea build |

**Aclaración:** ninguno de estos warnings invalida la validación post-limpieza 11U.

---

## 9. Qué NO se validó

| Ítem | Nota |
|------|------|
| Re-ejecución completa **Bloque 0** (conteos SQL) | Pendiente opcional; 11T validó solo `leads` |
| **Restore** de backup Supabase | No probado (11R: backups visibles únicamente) |
| Entorno **staging** / clon | No usado |
| Flujo completo de **creación de nuevo lead** | No ejecutado |
| **Generación de package** / simulate end-to-end | No ejecutado |
| **Todas las secciones** del detalle Pickup (reunión, blueprint, auditoría, etc.) | Solo apertura y metadatos principales |
| Meeting decision / snapshot en UI (pestañas profundas) | No recorrido exhaustivamente |
| Login multi-usuario / permisos operativos | Fuera de alcance |

---

## 10. Estado final observado

| Dimensión | Estado |
|-----------|--------|
| **Leads operativos** | Vacíos en UI y BD (0) |
| **Constructor / paquetes** | Intacto — 4 borradores listados |
| **Pickup 4x4** | Visible y accesible en detalle |
| **Build** | Exitoso |
| **Base madre vs. antes de 11T** | **Más limpia** en módulo leads (sin filas prueba) |
| **Base madre «virgen»** | **Aún no** — persisten drafts (4), snapshots (3 esperados), meeting decision (1), `crm_setup_config` (1), `leads_pipelines` (18), draft rechazado y genéricos |

---

## 11. Riesgos residuales

| Riesgo | Estado post-11U |
|--------|-----------------|
| Draft rechazado `prueba` (`6f956975…`) | Sigue en listado (1 rechazado) |
| Drafts genéricos `not-resolved-in-preview` | Siguen (2 sin evidencia / parte de los 4) |
| `crm_setup_config` en **auditoría** | Sin validar cambio; sigue según L1 |
| **18 pipelines** | Sin decisión de producto |
| Backup **restore no probado** | Mitigación: backups diarios 11R |
| Warning **middleware → proxy** | Seguimiento técnico futuro |
| Tabla `leads` en 0 | Aceptado; nuevo lead requerirá flujo normal |

---

## 12. Próxima fase sugerida

### Fase 11V — Cierre documental limpieza mínima y decisión sobre siguiente limpieza

| Opción | Descripción |
|--------|-------------|
| **A** | **Cerrar limpieza mínima** y no borrar más hasta nueva decisión explícita |
| **B** | Evaluar **Bloque 4** — draft rechazado `prueba` |
| **C** | Revisar **drafts genéricos** + snapshots (Bloque 5) |
| **D** | Revisar **`crm_setup_config`** / reset funcional |

### Recomendación

**Opción A — cerrar la limpieza mínima (11T + 11U) como ciclo completado.**

Motivos:

- Objetivo 11S/11T cumplido y validado en UI y build.
- Riesgo/beneficio de seguir borrando (draft rechazado, genéricos) es bajo y puede esperar decisión de producto.
- Pickup y evidencia Instalador deben conservarse hasta clon operativo o nueva política de madre virgen.

Si se retoma limpieza: nuevo documento de decisión (equivalente a 11S) + SELECTs del día + referencia a SQL 11O Bloque 4 o 5.

**Entregable sugerido 11V:** `docs/constructor-crm/cierre-limpieza-minima-11V.md`

---

## 13. Confirmación de alcance (fase 11U)

En la fase que produce este documento:

- ✅ Validación visual UI documentada
- ✅ Resultado de `npm run build` documentado (comando ya ejecutado en sesión de validación)
- ❌ No se modificó código funcional en repo
- ❌ No se ejecutó SQL en 11U
- ❌ No se modificaron datos en Supabase en 11U
- ❌ No se crearon endpoints ni scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se inventaron validaciones no realizadas (§9 delimita exclusiones)

---

*Validación 11U — Post-limpieza mínima leads OK. Constructor y Pickup OK. Build OK. Ciclo 11S→11T→11U cerrado operativamente; cierre formal sugerido en 11V.*
