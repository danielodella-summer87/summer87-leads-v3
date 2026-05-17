# Checklist de Limpieza de Base Madre — Constructor CRM Summer87

**Versión:** Fase L0 (documental)  
**Relacionado con:** `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md`, `migrations/20260513000000_create_installer_package_drafts.sql`, `migrations/20260512140000_create_installer_package_simulation_snapshots.sql`, `migrations/20260515100000_create_installer_package_meeting_decisions.sql`

**Estado:** checklist y criterios operativos documentados. **No ejecuta** limpieza, SQL, borrado de datos ni scripts en esta fase.

---

## 2. Resumen ejecutivo

Antes de usar **summer87-leads-v3** como **plantilla virgen duplicable** para futuros CRMs de clientes, Summer87 debe **separar y ordenar** lo que vive en la base madre en capas distintas:

| Capa | Qué es | Destino tras limpieza |
|------|--------|------------------------|
| **Producto reusable** | Código, migraciones estructurales, contratos, presets, capacidad del Constructor | Permanece en la madre |
| **Documentación estratégica** | BCR, base madre duplicable, contratos 7W/8x, presets 7Q | Permanece en `docs/` |
| **Caso semilla** | Pickup 4x4 (preset, flujo, evidencia útil) | Conservar o exportar a BCR antes de tocar datos |
| **Demo / test** | Drafts, snapshots, leads y empresas ficticias | Auditar → exportar si aporta → eliminar o resetear |
| **Legacy** | Datos o rutas heredadas no alineadas a la fábrica | Archivar o eliminar tras inventario |
| **Basura segura** | Motivos “asdf”, duplicados obvios, temporales | Candidato a borrado tras checklist |
| **Pendiente de decisión** | Ítems sin clasificar | No tocar hasta decisión de Daniel / equipo |
| **Sensible** | Datos reales, secretos, backups únicos | Respaldo obligatorio; nunca borrar a ciegas |

La limpieza **no busca borrar el aprendizaje** del Constructor ni de Pickup 4x4. Busca dejar una base **segura, ordenada y reutilizable** para que un clon manual no arrastre pruebas internas, datos de otro cliente ni evidencia falsa hacia un CRM operativo nuevo.

---

## 3. Objetivo de la limpieza

- **Reducir riesgo** al duplicar la base madre hacia `pickup4x4-crm-v1`, `crm-estudio-contable-v1`, etc.
- **Preservar la fábrica:** Constructor, Instalador, simulador, contrato `package_payload`, BCR documentada.
- **Eliminar o aislar ruido** que confunda instaladores, auditorías o futuros clientes.
- **Preparar un tag conceptual** de base limpia (`base-madre-v1` / `constructor-base-v1`) cuando el inventario y la validación post-limpieza estén completos.
- **No ejecutar nada automáticamente** en la fase L0: solo definir qué revisar, qué conservar y en qué orden decidir.

---

## 4. Principios de limpieza

1. **No borrar sin auditar** — cada ítem tiene categoría (sección 10) antes de cualquier acción.
2. **Exportar antes de eliminar** — aprendizajes útiles → BCR, documentos o export JSON; snapshots críticos archivados fuera de Supabase si aplica.
3. **Conservar código reusable** — capacidad del producto no se confunde con filas de prueba en BD.
4. **Conservar documentación estratégica** — `docs/constructor-crm/`, contratos de paquete, BCR, base madre duplicable.
5. **Separar test de caso real** — mismo rubro o cliente puede mezclar ambos; etiquetar origen antes de limpiar.
6. **No tocar datos sensibles sin respaldo** — backup verificado o export acordado.
7. **No ejecutar SQL destructivo sin revisión manual** — script propuesto, revisado y aprobado explícitamente (fuera de alcance L0).
8. **No limpiar Pickup 4x4 en bloque** hasta decidir: caso semilla, preset/blueprint v0, primer CRM operativo duplicado, o combinación (sección 9).

---

## 5. Qué debe conservarse en la base madre

### 5.1 Producto y código

- Motor **Constructor CRM** e **Instalador CRM** (rutas, páginas, APIs de evidencia).
- **Simulador** pre-instalación y flujo de snapshots (implementación, no filas de prueba obligatorias).
- Pantallas de revisión: secciones **colapsables**, **listado ejecutivo**, detalle de paquete, reuniones, blueprint, auditoría pre-SQL, cierre documental.
- **Presets** reutilizables (ej. `pickup_4x4` en `lib/admin/installablePackagePickup4x4Preset.ts`).
- **Helpers** de generación de package y validación de secretos en payload.
- **Componentes UI** y libs del CRM operativo base (leads, pipelines, oportunidades).
- **Endpoints** de simulación, drafts, meeting decisions, generación de package (capacidad de fábrica).

### 5.2 Datos y esquema (capacidad, no contenido demo)

- Tablas de evidencia: `installer_package_drafts`, `installer_package_simulation_snapshots`, `installer_package_meeting_decisions` — **estructura y RLS**; el contenido demo es auditable por separado.
- **Migraciones estructurales** existentes (no revertir sin plan).
- Contrato **`package_payload`** (documentación 7W / 8A–8B y validaciones en código).

### 5.3 Conocimiento y documentación

- **Base de Conocimiento por Rubro** (documento y, en fases futuras, persistencia).
- Documentación **base madre duplicable** y checklist (este documento).
- **Docs técnicos** del Constructor, Instalador, presets 7Q, recursos 7O/7P.

### 5.4 Regla mnemotécnica

> **Conservar la máquina; auditar lo que la máquina produjo.**

---

## 6. Qué debe auditarse antes de limpiar

Inventario obligatorio (marcar entorno: local / staging / producción madre). Sin borrar en esta fase documental.

### 6.1 Evidencia del Instalador / Constructor

- [ ] `installer_package_drafts` — borradores: cuáles son Pickup real, test interno, superseded.
- [ ] `installer_package_simulation_snapshots` — por `draft_id`; payloads y resúmenes ejecutivos.
- [ ] `installer_package_meeting_decisions` — actas reales vs. prueba.

### 6.2 Datos operativos CRM (Supabase u origen acordado)

- [ ] Leads **demo** o de importación de prueba.
- [ ] **Empresas** ficticias o seeds obsoletos.
- [ ] **Socios** / contactos de prueba (si aplica al esquema).
- [ ] **Usuarios** demo, invitaciones pendientes de test.
- [ ] **`app_users`** (o equivalente) de prueba vs. equipo Summer87 real.

### 6.3 Configuración de negocio

- [ ] **Rubros** de prueba vs. catálogo productivo deseado en madre.
- [ ] **Pipelines** y estados de prueba.
- [ ] **Servicios** / catálogo demo (easy_services, agency_services, etc., según existan).
- [ ] Configuraciones **temporales** (flags, seeds, `crm_setup_config` si aplica).
- [ ] Datos **importados** en ensayos (CSV, APIs de prueba).

### 6.4 Repositorio y filesystem (sin ejecutar borrados)

- [ ] **Archivos backup** antiguos en repo o fuera de git.
- [ ] Carpetas **temporales** (exports, dumps locales).
- [ ] **`.claude/`** u otros paths locales — ¿deben estar en `.gitignore`?
- [ ] **PDFs** o informes generados en pruebas (Gamma, exports).
- [ ] Datos **legacy** (leads87, seeds viejos) que no correspondan a la madre como fábrica.

### 6.5 Secretos y entorno

- [ ] **`.env.local`** — no versionado; inventariar qué apunta a qué proyecto Supabase (solo revisión manual, no modificar en L0).
- [ ] Credenciales o tokens en exports accidentales (buscar en repo con política acordada).

---

## 7. Qué podría eliminarse o resetearse antes de declarar base virgen

Solo **después** de auditoría, exportación a BCR si aplica, y aprobación explícita (fases L3–L4):

- Drafts de **prueba** en `installer_package_drafts` (y snapshots/decisiones en cascada por FK).
- **Snapshots** de simulación sin valor de evidencia o duplicados de ensayo.
- **Decisiones de reunión** falsas o generadas solo para UI test.
- Motivos, notas o rechazos tipo **“asdf”**, “test”, “borrar”.
- **Empresas** y **leads** ficticios claramente identificados.
- **Payloads experimentales** dentro de `package_payload` en drafts descartables.
- Filas de **importación temporal** (imports de validación no promovidos).
- **Sesiones** o tokens de prueba (si existieran en tablas auxiliares).
- **Backups duplicados** en disco si el contenido ya está en git tag o archivo archivado acordado.
- Configuraciones **demo no reutilizables** (pack agencia en instancia que no es agencia, etc.).

**Reset vs. delete:** en algunos entornos conviene **vaciar tablas de evidencia de test** manteniendo esquema; en otros, **nuevo proyecto Supabase** para la madre “virgen”. La decisión es por entorno, no universal.

---

## 8. Qué NO debe eliminarse sin decisión explícita

- **Preset `pickup_4x4`** y helper asociado.
- **Documentación** y flujo UI Pickup 4x4 si sirve como caso semilla.
- **Migraciones** SQL del repo (historial estructural).
- **Docs BCR** y **docs base madre** (`docs/constructor-crm/*`).
- **Endpoints** del Constructor / Instalador (código).
- **Tablas de evidencia** (estructura); solo su *contenido* es candidato a limpieza auditada.
- Contrato **`package_payload`** (docs + validadores).
- **Estructura** de `app_users` / roles / RBAC aunque se limpien filas de prueba después.
- **Datos reales** de clientes o pilotos en curso (si existieran en la madre).
- **Backups únicos** sin copia secundaria.
- **`.env.example`** (si existe o se crea en el futuro) — plantilla sin secretos.

Ante la duda: clasificar como **Pendiente de decisión** (sección 10) y escalar.

---

## 9. Tratamiento especial para Pickup 4x4

Pickup 4x4 fue el **caso semilla** del Constructor: preset `pickup_4x4`, drafts, simulaciones, checklists de reunión, minutas y blueprint en UI.

### 9.1 Decisiones previas obligatorias

Antes de cualquier limpieza que toque Pickup:

1. ¿Será el **primer CRM operativo** duplicado (`pickup4x4-crm-v1`)?
2. ¿Se **exporta** como caso de aprendizaje a BCR (blueprint, preguntas, riesgos, lecciones)?
3. ¿El **preset** permanece como **blueprint v0** del rubro automotriz/4x4?
4. ¿Qué filas en BD son **reales** vs. **prueba interna**?

### 9.2 Acciones permitidas solo tras esas decisiones

- Eliminar motivos falsos, drafts duplicados de ensayo UI, snapshots sin acta.
- Conservar **un** hilo de evidencia coherente si aporta aprendizaje o auditoría futura.
- **No borrar** snapshot, resumen ejecutivo o cierre documental que deba promoverse a BCR sin export previo.

### 9.3 Qué conservar en la madre aunque Pickup migre a clon

- Código preset y documentación de proceso.
- Aprendizajes ya **publicados** en BCR (cuando exista persistencia).
- Referencia en docs a Pickup como caso de referencia del flujo 8x.

---

## 10. Clasificación de datos

Usar una etiqueta por ítem inventariado:

| Categoría | Criterio | Acción típica |
|-----------|----------|---------------|
| **Producto reusable** | Código, migraciones, contratos, presets | Mantener |
| **Documentación estratégica** | `docs/constructor-crm/`, 7Q, 8B, etc. | Mantener |
| **Caso semilla** | Pickup 4x4 evidencia y preset con valor metodológico | Conservar o exportar → luego limpiar exceso |
| **Demo / test** | Identificable como prueba, sin contrato comercial | Exportar si útil → eliminar/resetear |
| **Legacy** | Heredado, no usado en flujo canónico | Archivar o eliminar tras revisión |
| **Basura segura** | Duplicado obvio, sin valor, sin FK críticas | Eliminar en L4 con aprobación |
| **Pendiente de decisión** | Origen incierto | No tocar |
| **Sensible / requiere respaldo** | Real, PII, secretos, backup único | Backup primero; decisión explícita |

Registrar en hoja de inventario (fase L1): `id`, `tabla/archivo`, `categoría`, `responsable`, `fecha`, `notas`.

---

## 11. Checklist previo a limpieza

Ejecutar en orden antes de cualquier propuesta de borrado (fase L3+):

- [ ] **`git status` limpio** o cambios conscientemente commiteados en rama de trabajo.
- [ ] **Backup** de base de datos del entorno afectado (si aplica), verificado restaurable o export acordado.
- [ ] **Identificar entorno:** local / staging / producción madre — no mezclar criterios.
- [ ] **Listar tablas** a revisar (sección 6) con conteos aproximados.
- [ ] **Confirmar qué datos son test** (criterios: nombre, email, flags, notas, `targetClientName` en manifest, etc.).
- [ ] **Exportar aprendizaje Pickup 4x4** hacia BCR o documento anexo (capturas, JSON de package aprobado, lecciones).
- [ ] Revisar **`.env.local`** (solo lectura): qué Supabase toca `npm run dev` en la madre.
- [ ] Revisar **archivos temporales** y `.gitignore` (`.claude/`, dumps, PDFs de prueba).
- [ ] **Confirmar con Daniel** (o responsable producto) antes de borrar categorías *Pendiente* o *Sensible*.
- [ ] **No ejecutar SQL destructivo** sin script revisado línea por línea y aprobación (fase L4).

---

## 12. Checklist posterior a limpieza

Tras L4 (cuando exista, en el futuro) validar:

- [ ] **`npm run dev`** — la app levanta sin error fatal.
- [ ] **`npm run build`** — build de producción pasa.
- [ ] **Constructor** abre para rol interno Summer87.
- [ ] **Listado de paquetes** (`/admin/constructor-crm/...`) no rompe.
- [ ] **Detalle de paquete** carga sin error (draft de referencia o vacío controlado).
- [ ] Base madre **sin drafts de test visibles** en UI operativa (o claramente etiquetados como archivo).
- [ ] **Documentación** en `docs/constructor-crm/` intacta y enlazada.
- [ ] **`git status` limpio** tras commits de solo docs/config permitidos.
- [ ] **Tag o commit** de base limpia registrado (ej. mensaje: `chore: base madre virgen L5`).

Si algo falla: **rollback** desde backup; no continuar duplicación a clientes.

---

## 13. Posible tag de versión base

Cuando inventario, limpieza aprobada y checklist posterior estén completos (fase L6), se **podría** crear un tag git **conceptual**, por ejemplo:

- `base-madre-v1`
- `constructor-base-v1`

El tag marca el **commit** desde el cual se autoriza la primera duplicación manual controlada hacia un CRM cliente.

**Decisión L0:** no se crea ningún tag en esta fase; solo se documenta la convención.

---

## 14. Relación con Base de Conocimiento por Rubro

- La limpieza **no debe perder aprendizaje** validado: casos útiles se **promueven o documentan** en BCR antes de borrar filas demo.
- Drafts y snapshots de Pickup pueden aportar **preguntas, riesgos y fragmentos de blueprint** — export manual en L2.
- La BCR **no vive** en tablas operativas de leads del cliente; la limpieza de leads demo **no sustituye** export a BCR.
- Descartes masivos sin export previo **degradan** la fábrica inteligente por rubro.

Ver: `docs/constructor-crm/base-conocimiento-por-rubro.md`.

---

## 15. Relación con futuros CRM duplicados

Cada CRM cliente debe nacer desde una **base madre etiquetada como limpia**, de modo que el clon:

- **No herede** leads, empresas ni drafts de otros clientes o de pruebas internas.
- **No herede** `.env.local` ni secretos de la máquina de desarrollo de la madre.
- **Reciba** solo configuración acordada en el diseño (package aprobado, branding, modo operativo).
- **Tenga** Constructor deshabilitado u oculto para el usuario final (según `base-madre-duplicable.md`).

La limpieza de la madre es **prerrequisito** de la fase BM-3 (primera duplicación manual), no opcional.

---

## 16. Riesgos de no limpiar

- **Copiar basura** a nuevos clientes al duplicar repo + dump de BD.
- **Exponer** Constructor, drafts o snapshots de prueba al cliente final.
- **Mezclar** datos de Pickup 4x4 con otro rubro o cliente en el mismo Supabase.
- **Duplicar secrets** o URLs de Supabase incorrectas en clones.
- **Confundir demos con realidad** en auditorías y Go/No-Go.
- **Tomar decisiones** con evidencia falsa (snapshots de test presentados como piloto).
- **Degradar confianza** en el Constructor y en Summer87 ante el cliente.
- **Contaminar BCR** si se promueven a rubro patrones basados en datos de prueba no etiquetados.

---

## 17. Implementación por fases

| Fase | Nombre | Entregable | Alcance L0 |
|------|--------|------------|------------|
| **L0** | Documento checklist | Este archivo | ✓ Solo documentación |
| **L1** | Inventario de datos actuales | Hoja/spreadsheet por tabla y archivo | Futuro |
| **L2** | Exportación de aprendizajes | Paquetes BCR, exports JSON, actas archivadas | Futuro |
| **L3** | Propuesta de limpieza | Lista DELETE/RESET por ítem con categoría | Futuro; requiere aprobación |
| **L4** | Cleanup revisado | SQL o acciones manuales ejecutadas en entorno acordado | Futuro; no en L0 |
| **L5** | Validación post-limpieza | Checklist sección 12 completado | Futuro |
| **L6** | Tag base madre limpia | `base-madre-v1` o equivalente | Futuro |

---

## 18. Decisión actual

**Por ahora solo se documenta el checklist.** No se ejecuta limpieza, no se borran datos, no se corre SQL destructivo ni scripts de reset.

Cualquier acción de las fases L1–L6 requiere **fase explícita**, inventario y aprobación según secciones 11 y 8.

---

## 19. Confirmación de alcance

Este documento:

- **No borra datos** en base de datos ni en filesystem.
- **No ejecuta SQL** (ni destructivo ni de otro tipo).
- **No crea scripts** de limpieza o clonación.
- **No modifica** `.env`, `.env.local` ni `.env.example`.
- **No crea endpoints** ni cambia rutas del Constructor.
- **No instala CRM** ni crea tenants.
- **No crea usuarios** ni escribe en **Kore** ni **Zeta**.

Es un artefacto de **checklist y decisión operativa** para preparar summer87-leads-v3 como base madre virgen duplicable.

---

*Última actualización: fase L0 — documentación inicial.*
