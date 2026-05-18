# Estado Base Madre Post-Limpieza 11W — Constructor CRM Summer87

**Versión:** Fase 11W (estado y hoja de ruta — documental)  
**Fecha:** 2026-05-17  
**Responsable:** Daniel / Summer87  
**Relacionado con:** `cierre-limpieza-minima-11V.md`, `validacion-post-limpieza-11U.md`, `resultado-ejecucion-limpieza-11T.md`, `inventario-datos-base-madre-L1.md`, `base-madre-duplicable.md`, `base-conocimiento-por-rubro.md`, `ficha-bcr-pickup4x4.md`

**Estado:** snapshot documental post-ciclo 11S–11V. **No autoriza** nuevos borrados ni cambios en Supabase.

---

## 2. Resumen ejecutivo

Tras el **cierre de limpieza mínima** (11V), la base madre del proyecto **summer87-leads-v3** quedó **más limpia en datos operativos** (sin leads de prueba) y **mucho mejor documentada** (inventario, BCR Pickup, backup, SQL, ejecución y validación UI/build).

Sigue **sin ser una base 100% virgen**: conserva evidencia del Constructor (drafts, snapshots, meeting decision), configuración de setup y pipelines, y el caso semilla **Pickup 4x4** intacto.

**No se recomienda seguir borrando** sin nueva fase y decisión explícita. El foco sugerido pasa a **estabilización de producto** (modos Constructor vs. CRM operativo, setup, pipelines) antes de cualquier nueva limpieza o declaración de «base virgen v1».

---

## 3. Estado actual resumido

| Recurso | Estado documentado | Fuente / nota |
|---------|-------------------|---------------|
| **leads** | **0** | ✅ Validado 11T (SQL) + 11U (UI) |
| **empresas** | **0** | L1; sin cambio en ciclo limpieza |
| **entity_import_batches** | **0** | L1 |
| **app_users** | **1** (Daniel Admin) | L1; no tocado |
| **installer_package_drafts** | **4** (esperado) | L1 / 11U UI; no re-contado en SQL post-11T |
| **installer_package_simulation_snapshots** | **3** (esperado) | L1; no re-contado post-11T |
| **installer_package_meeting_decisions** | **1** (esperada) | L1; Pickup |
| **leads_pipelines** | **18** (esperado) | L1; sin decisión producto |
| **crm_setup_config** | **1** (esperada, step auditoría) | L1; sin cambio |
| **rubros** demo/test/prueba | **0** (L1) | Sin cambio esperado |
| **Pickup 4x4** | **Intacto**; caso semilla BCR | 11U + `ficha-bcr-pickup4x4.md` |

> **Nota:** Filas marcadas como «esperado según L1/11U» no fueron revalidadas con SELECT global (Bloque 0) después de 11T, salvo `leads = 0`. Antes de clonar o declarar virgen v1, conviene re-ejecutar conteos del SQL 11O.

**Proyecto / entorno (referencia):** summer87-leads-v3 — main / PRODUCTION.

---

## 4. Qué quedó limpio

| Área | Detalle |
|------|---------|
| **`public.leads`** | Sin filas; sin «Prueba Seguimiento Pickup» ni «Prueba Pickup 4x4» |
| **`empresas`** | Vacía (0) |
| **Imports** | Sin lotes registrados |
| **Rubros demo** | 0 filas demo/test/prueba (L1) |
| **Documentación BCR** | Base conceptual, formato entrada, ficha Pickup |
| **Pickup** | Documentado **antes** y durante limpieza; no borrado |
| **SQL limpieza** | Propuesta L3, SQL 11O, ejecución 11T documentada |
| **Backup** | Protocolo 11Q + evidencia 11R (backups diarios visibles) |
| **Validación** | UI leads/paquetes/Pickup + `npm run build` (11U) |
| **Ciclo limpieza** | Cerrado formalmente (11V) |

---

## 5. Qué queda pendiente

| Pendiente | Impacto | Prioridad sugerida |
|-----------|---------|-------------------|
| Draft rechazado `prueba` (`6f956975…`) | 1 rechazado en listado UI | Baja — limpieza futura opcional (Bloque 4) |
| Drafts genéricos `not-resolved-in-preview` | 2 drafts, ruido Instalador | Media — revisión producto |
| Snapshots genéricos (2 en `defe6513…`) | Evidencia UI preview | Ligado a genéricos |
| **`crm_setup_config`** en auditoría | Setup Constructor incompleto en madre | **Alta** — revisión funcional |
| **18 `leads_pipelines`** | ¿Plantilla madre vs. por cliente? | **Alta** — antes de clon |
| Warning **middleware → proxy** (Next 16) | Deuda técnica | Media |
| **baseline-browser-mapping** desactualizado | Warning build | Baja |
| **Ocultamiento Constructor** en CRM operativo | Producto cliente final | **Alta** — diseño |
| **Clon Pickup** / base virgen v1 | Duplicación madre | Media — tras decisiones arriba |
| **Persistencia BCR** en Supabase | Solo Markdown hoy | Baja–media — roadmap BCR F4 |
| Restore backup **probado** | Riesgo aceptado 11V | Baja hasta próximo DELETE |

---

## 6. Estado de Pickup 4x4

| Dimensión | Estado |
|-----------|--------|
| **Rol** | Caso semilla BCR — venta / accesorios 4x4 |
| **Evidencia BD** | Draft `0fa4f061…`, snapshot, meeting `9c04f4a5…` — **intactos** |
| **Documentación** | `caso-semilla-pickup4x4-bcr.md`, `ficha-bcr-pickup4x4.md` |
| **Preset código** | `pickup_4x4` en `installablePackagePickup4x4Preset.ts` |
| **UI** | Visible en Constructor / Paquetes (11U) |
| **Limpieza / archivo** | **No** — bloqueado hasta decisión explícita |

**Decisiones futuras (una sola política, no automática):**

1. **Conservar en madre** como evidencia histórica del Constructor.
2. **Archivar** (export + eventual limpieza en madre tras clon).
3. **Trasladar** evidencia al **primer CRM operativo** (`pickup4x4-crm-v1`) y virgenizar madre después.

Pickup sirve como **aprendizaje sectorial 4x4** independientemente de dónde viva la fila en BD.

---

## 7. Estado de la Base de Conocimiento por Rubro (BCR)

| Aspecto | Estado |
|---------|--------|
| Diseño funcional | ✅ `base-conocimiento-por-rubro.md` |
| Formato casos semilla | ✅ `formato-entrada-bcr-caso-semilla.md` |
| Primer caso | ✅ Pickup — narrativo + ficha A–T |
| **Persistencia en Supabase** | ❌ No existe (`crm_industry_*` conceptual solo) |
| **Runtime Constructor** | No lee fichas Markdown automáticamente |
| **Próximos pasos posibles** | Fichas otros rubros (contable, legal, etc.); diseño F4 persistencia; promoción blueprint v0 |

La BCR **vive en Markdown** en repo; es memoria de producto, no tabla productiva aún.

---

## 8. Estado de base madre duplicable

| Lectura | Detalle |
|---------|---------|
| **Orden actual** | summer87-leads-v3 **mucho más ordenada** que pre-inventario en leads y documentación |
| **¿Declarar «base virgen v1»?** | **Todavía no** |
| **Motivo** | Evidencia Constructor + setup + pipelines sin política cerrada |

**Antes de declarar base virgen v1, decidir:**

| Tema | Pregunta abierta |
|------|------------------|
| `crm_setup_config` | ¿Reset, conservar o excluir del clon? |
| `leads_pipelines` | ¿18 etapas son plantilla madre universal? |
| Drafts genéricos | ¿Eliminar, archivar o ignorar en clon? |
| Draft rechazado | ¿Limpieza Bloque 4 o conservar? |
| **Constructor en clon** | ¿Visible solo Summer87 o oculto al cliente? |
| **app_users** | ¿Re-seed admin por clon? Credenciales nuevas |
| **`.env` del clon** | URLs, keys, Kore — estrategia por entorno |
| **Pickup** | ¿Madre vs. clon operativo? |

Referencia estratégica: `base-madre-duplicable.md`.

---

## 9. Opciones de hoja de ruta

| Opción | Descripción | Cuándo elegir |
|--------|-------------|---------------|
| **A** | **Pausar limpieza** y avanzar producto Constructor | ✅ Recomendado ahora |
| **B** | Revisar **`crm_setup_config`** | Antes de clon o virgen v1 |
| **C** | Revisar **`leads_pipelines`** como config base | Antes de duplicar a otro rubro |
| **D** | Diseñar **ocultamiento Constructor** en CRM operativo | Antes de entregar CRM a cliente |
| **E** | Preparar **clon Pickup 4x4** (`pickup4x4-crm-v1`) | Tras B–D parcialmente resueltos |
| **F** | Diseñar **persistencia BCR** en BD | Cuando haya 2+ casos semilla o necesidad UI curador |
| **G** | Revisar draft rechazado / genéricos (limpieza posterior) | Solo con nueva decisión tipo 11S |

**No son mutuamente excluyentes** a largo plazo; en el corto plazo conviene **secuenciar** A → B/C/D → E → G opcional.

---

## 10. Recomendación

| Prioridad | Acción |
|-----------|--------|
| **0** | **No seguir borrando** datos en base madre |
| **1** | Definir **modo «Constructor interno»** vs **«CRM operativo cliente»** |
| **2** | Definir **ocultamiento del Constructor** para usuario final del clon |
| **3** | Revisar **`crm_setup_config`** (estado auditoría, score 15) |
| **4** | Revisar **`leads_pipelines`** (18 etapas — ¿base reusable?) |
| **5** | **Recién después** decidir Bloque 4 (draft rechazado) o genéricos |

La limpieza mínima cumplió su objetivo; el valor marginal de más DELETE hoy es **bajo** frente al riesgo en production y la falta de política de clon.

---

## 11. Próximas fases sugeridas

No es obligatorio ejecutar todas; elegir según prioridad de negocio.

| Fase | Título sugerido | Objetivo |
|------|-----------------|----------|
| **11X** | Modos: Constructor interno vs CRM operativo | Modelo de producto, permisos, rutas, branding |
| **11Y** | Política de ocultamiento del Constructor en clones | Qué ve el cliente vs. Summer87 |
| **11Z** | Revisión `crm_setup_config` + pipelines pre–virgen v1 | Decisiones documentales antes de tag `mother-v1` |
| *(opcional)* | Segundo caso semilla BCR | Otro rubro con ficha A–T |
| *(opcional)* | Diseño clon Pickup | `pickup4x4-crm-v1` según `base-madre-duplicable.md` |
| *(opcional)* | Reapertura limpieza G | Solo con documento decisión + backup + SELECTs |

**Entregables sugeridos (nombres):**

- `docs/constructor-crm/modos-constructor-crm-operativo-11X.md`
- `docs/constructor-crm/politica-ocultamiento-constructor-11Y.md`
- `docs/constructor-crm/revision-setup-pipelines-11Z.md`

---

## 12. Decisión actual

> **Después de 11V, el ciclo de limpieza mínima se considera cerrado.**  
> **En 11W no se autorizan nuevos borrados.**  
> La base madre queda en **estado post-limpieza controlada**, no en **estado virgen final**.

| Campo | Valor |
|-------|--------|
| Ciclo 11S–11V | Cerrado |
| Autorización DELETE en 11W | Ninguna |
| Estado madre | Operativa + documentada + parcialmente limpia |
| Tag `mother-v1` / virgen v1 | No declarado |

---

## 13. Confirmación de alcance (fase 11W)

- ✅ Estado post-limpieza y hoja de ruta documentados
- ❌ No se ejecutó SQL en 11W
- ❌ No se modificaron datos en 11W
- ❌ No se tocó Supabase en 11W
- ❌ No se modificó código funcional
- ❌ No se crearon endpoints ni scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se inventaron revalidaciones SQL no realizadas (§3)

---

## Mapa documental del ciclo (referencia)

```
L1 → L2/L3 → 11O → 11P → 11Q → 11R → 11S → 11T → 11U → 11V (cierre)
                                                          ↓
                                                         11W (este doc)
```

**BCR paralelo:** `base-conocimiento-por-rubro.md`, formato, caso/ficha Pickup.

---

*Estado 11W — Base madre post-limpieza. Siguiente foco recomendado: producto (11X/11Y) y setup/pipelines (11Z), no más DELETE.*
