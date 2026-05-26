# Auditoria constructor base madre AUDIT-1 - Constructor CRM Summer87

**Version:** AUDIT-1 - inventario de hardcodes, restos y conocimiento reusable  
**Proyecto:** summer87-leads-v3  
**Estado:** auditoria documental de la base madre / Constructor CRM  
**Alcance:** solo documentacion; sin codigo, sin SQL, sin Supabase, sin movimientos ni borrado de archivos

---

## 1. Resumen ejecutivo

- El repo esta bien encaminado como **Constructor CRM / fabrica / base madre**.
- No esta todavia lo suficientemente limpio como para clonar Casa Limpia hoy sin saneamiento previo.
- Existe contaminacion de verticales: Pickup, Casa Limpia legacy y documentacion/QA historica.
- La prioridad no es borrar rapido, sino **clasificar**, **preservar conocimiento util** y **extraer hardcodes del core**.
- Seguridad de usuarios, RLS avanzado, bypasses internos y permisos finos quedan como **baja prioridad / pendiente futuro** por uso interno actual, salvo que afecten la separacion Constructor vs proyecto cliente.
- **Dictamen:** **GO** para iniciar Knowledge Base y limpieza ordenada; **NO-GO** para clonar Casa Limpia hoy.

---

## 2. Criterio de lectura de la auditoria

- No todo lo especifico de Pickup o Casa Limpia es basura.
- Si algo contiene aprendizaje reutilizable, debe moverse o referenciarse como **Knowledge Base** o **Template**.
- Si algo esta hardcodeado dentro del core, debe extraerse o parametrizarse.
- Si algo es un activo real de cliente, debe salir del repo madre o quedar referenciado sin binarios ni acoples directos.
- Si algo corresponde a seguridad de usuarios, RLS o bypasses internos, queda en backlog futuro salvo que exponga el Constructor o comprometa un clon cliente.
- Los documentos estrategicos `CL-0a`, `CONSTRUCTOR-CLOSE-1`, `CONSTRUCTOR-CLOSE-2` y `CONSTRUCTOR-CLOSE-3` **no son activos reales de cliente**; son decisiones del Constructor y deben conservarse como Knowledge Base.

---

## 3. Hallazgos criticos priorizados para fabrica de CRMs

| ID | Hallazgo | Archivo / ruta | Tipo | Riesgo para fabrica / clones | Prioridad ajustada | Accion sugerida |
|----|----------|----------------|------|-------------------------------|--------------------|-----------------|
| H1 | Pickup como fallback default | `lib/crmPackage/getActiveCrmPackageConfig.ts` y `lib/crmPackage/adapters/leadFieldPersistence.ts` | Hardcode de vertical | Puede hacer que un clon sin contrato terminado caiga a Pickup por defecto | Alta | Extraer fallback a modo neutro o exigir contrato aprobado |
| H2 | Whitelist `contract_fields_json` cae a Pickup | `lib/crmPackage/adapters/leadFieldPersistence.ts`, consumido por `app/api/admin/leads/route.ts` y `app/api/admin/leads/[id]/route.ts` | Hardcode de persistencia | Riesgo de validar campos de un cliente nuevo con reglas Pickup | Alta | Separar fallback tecnico del preset Pickup |
| H3 | `CONSTRUCTOR_AUTH_BYPASS` activo | `middleware.ts` | Seguridad interna | Bajo para uso interno actual, pero impropio si se expone un clon o el Constructor fuera del equipo | Baja / futuro | Registrar y revisar antes de exponer a terceros o equipo ampliado |
| H4 | `APP_MODE` / `CRM_MODE` hardcodeados o no completamente gobernados por entorno | `lib/config/appMode.ts` y `lib/config/crmMode.ts` | Modo de ejecucion / configuracion core | Dificulta cambiar entre `constructor_base` y `client_crm` sin deuda residual; puede contaminar clones | Media ahora / alta antes de clones reales | Revisar y llevar a env/config explicita con default neutro de Constructor |
| H5 | Posibles activos reales de Casa Limpia en carpeta `docs/casalimpia/` | `docs/casalimpia/` si existe; en esta auditoria no se confirma y queda como `requiere verificacion manual` | Activo real de cliente / riesgo de contaminacion del repo madre | Un clon cliente o repo madre puede arrastrar documentos reales, binarios o material sensible de un cliente | Media ahora / alta si se confirma | Verificar existencia; si hay activos reales, mover fuera del repo madre o reemplazar por referencias/placeholders; no borrar sin respaldo |
| H6 | Pagina de paquetes con hardcode Pickup | `app/admin/constructor-crm/paquetes/[id]/page.tsx` | UI acoplada | El Constructor madre queda sesgado a Pickup en una zona central | Alta | Partir en componentes y extraer copy, checklist y presets a configuracion |
| H7 | `CASALIMPIA_LEAD_FIELDS` en APIs | `app/api/admin/leads/route.ts` y `app/api/admin/leads/[id]/route.ts` | Legacy vertical en core | Mezcla Casa Limpia / facility con core compartido | Alta | Reclasificar en columnas core vs contrato o mover a adapter vertical |
| H8 | `installablePackagePickup4x4Preset` mergea preset Pickup | `lib/admin/installablePackagePickup4x4Preset.ts`, usado por `app/api/admin/constructor/installable-package/generate/route.ts` | Preset fuerte | El generador puede nacer demasiado orientado a Pickup | Alta | Mantener como preset/template reusable, no como preset dominante del core |
| H9 | Mock Pickup en assist | `app/api/admin/constructor/assist/route.ts` | Mock vertical | El asistente del Constructor sesga sugerencias hacia 4x4 | Alta | Mover a fixtures o prompt library por vertical |
| H10 | Bloque Vehiculo hardcodeado en UI | `app/admin/leads/nuevo/page.tsx`, `app/admin/leads/[id]/page.tsx`, `app/admin/leads/page.tsx` | UI hardcodeada | Un clon no automotriz podria heredar UI de vehiculo | Alta | Parametrizar por contrato o vertical y desacoplar del core |
| H11 | Migraciones Casa Limpia / facility acopladas | `supabase/migrations/20260428100000_casalimpia_fase1.sql`, `supabase/migrations/20260428110000_casalimpia_visit_completion_fields.sql` | Legacy de schema | Arrastra estructura especifica de limpieza dentro de la base madre | Alta | Documentar como patron reusable y separar de la base default para clones |
| H12 | Carpeta `src` paralela legacy | `src/app/actions/auth.ts`, `src/app/logout/page.tsx`, `src/lib/auth/session.ts` | Estructura legacy | Confusion de fuente de verdad y riesgo de duplicidad al clonar | Alta | Auditar y decidir si archivar, integrar o eliminar en fase controlada |
| H13 | RLS `installer_package_drafts` y related sin policies finales | `migrations/20260513000000_create_installer_package_drafts.sql`, `migrations/20260512140000_create_installer_package_simulation_snapshots.sql`, `migrations/20260515100000_create_installer_package_meeting_decisions.sql` | Seguridad / gobernanza | No bloquea uso interno actual, pero requiere cierre antes de apertura mas amplia | Baja / futuro | Mantener en backlog de hardening |
| H14 | Rol `summer87_superadmin` incrustado | `lib/crmPackage/configs/pickup4x4.config.ts`, `lib/admin/installablePackagePickup4x4Preset.ts` | Seguridad / semantica de rol | No bloquea hoy, pero no debe propagarse ciegamente a clones cliente | Baja / futuro | Redefinir como rol interno del instalador y separarlo de configs cliente |

### Nota de interpretacion para H5

- Los documentos estrategicos `docs/constructor-crm/casalimpia-ecuador-estrategia-instancia-limpia-CL-0a.md`, `CONSTRUCTOR-CLOSE-1/2/3` y documentos equivalentes **no son activos reales del cliente**.
- Deben conservarse como **Knowledge Base del Constructor**.
- El riesgo H5 aplica a una eventual carpeta `docs/casalimpia/` con brochures, contratos, plantillas de costeo, relevamientos u otros materiales reales del cliente.

---

## 4. Basura / restos a limpiar

No se propone borrar directo en esta fase. Solo clasificar.

| Elemento | Ruta / ejemplo | Estado auditado | Accion sugerida |
|----------|----------------|-----------------|-----------------|
| Checklists de raiz | `CHECKLIST_ACCIONES_LEADS.md` | Documento operativo historico fuera del set actual del Constructor | Confirmar si sigue vivo; si no, archivar |
| Backups SQL sueltos | `backup_base_vacia.sql`, `estructura_base.sql`, `bootstrapp nueva instancia.sql`, carpeta `backups/` | Artefactos sensibles / historicos | Revisar manualmente, mover a `_archived` o zona de backups documentada |
| Auditorias legacy | `docs/AUDITORIA_LIMPIEZA_7B.md`, `docs/AUDITORIA_LEADS87.md` y otras auditorias historicas | Mezcla de historia y deuda | Mantener si aportan conocimiento; si no, archivar |
| Validaciones masivas Pickup | multiples `docs/constructor-crm/validacion-*pickup*`, `validacion-*vehiculo*` | Mucha señal historica mezclada con ruido | Agrupar como piloto, archivo historico o Knowledge Base |
| Ejecuciones Pickup | `docs/constructor-crm/ejecucion-*pickup*` | Evidencia util pero ruidosa para la base madre | Archivar por fase o mover a carpeta historica |
| `tsconfig.tsbuildinfo` | `tsconfig.tsbuildinfo` | Artefacto generado | Agregar a `.gitignore` si no corresponde versionarlo |
| Tmp scripts | `scripts/tmp-ia-prompts-debug.mjs` | Script temporal de depuracion | Confirmar muerto; archivar o eliminar en fase posterior |
| Scripts utilitarios de fase | `scripts/gen-mod-easy-v21-migration.mjs`, `scripts/gen-mod-easy-v22-migration.mjs`, `scripts/validate-mod-easy-motor.mjs` | Utilidad puntual / heredada | Revisar manualmente y reclasificar |
| `src` paralela | `src/app/...`, `src/lib/...` | Legacy estructural | Auditar, luego archivar o integrar |
| `.next` | No encontrada dentro del repo actual | No presente hoy | No aplica; mantener fuera del repo |
| `node_modules` | No encontrada dentro del repo actual | No presente hoy | No aplica; mantener fuera del repo |
| PDFs / cookies | No encontrados dentro del repo actual | No presentes hoy | No aplica |

---

## 5. Conocimiento util que NO debe borrarse

| Elemento | Origen | Aprendizaje util | Destino sugerido | Reutilizacion futura |
|----------|--------|------------------|------------------|----------------------|
| `pickup4x4.config.ts` | `lib/crmPackage/configs/pickup4x4.config.ts` | Primer contrato vertical completo validado | `templates/` o `presets/` del Constructor | Alto |
| Migraciones Casa Limpia / facility | `supabase/migrations/20260428100000_casalimpia_fase1.sql`, `20260428110000_casalimpia_visit_completion_fields.sql` | Muestran como se acoplo facility al schema y que evitar o rescatar | Knowledge Base tecnica | Alto |
| `crmPackage/types.ts` | `lib/crmPackage/types.ts` | Modelo canonico del contrato CRM | Core estable | Muy alto |
| Generacion segura de paquetes | `app/api/admin/constructor/installable-package/generate/route.ts` | Preview, draft, bloqueos y revision humana | Core / reference implementation | Muy alto |
| `installer_package_drafts` / simulation / meeting_decisions | migraciones + rutas API asociadas | Trazabilidad de instalacion y aprobacion | Base del instalador | Alto |
| Documentos CONSTRUCTOR-CLOSE-1/2/3 | `docs/constructor-crm/` | Definicion de fabrica, paquete y generador local | Knowledge Base del Constructor | Muy alto |
| Decisiones 7M / 7O / 7P / 7Q / 7R | `docs/DECISION_RUTAS_COMERCIALES_7M.md`, `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`, `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md`, `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md`, `docs/MATRIZ_ACTIVACION_INSTALADOR_7R.md` | Historia del instalador y recursos sectoriales | Knowledge Base / historial de decisiones | Alto |
| Decisiones 8A-8E | `docs/CONTRATO_ENDPOINT_PAQUETE_INSTALABLE_8A.md`, `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md`, `docs/APLICACION_MANUAL_MIGRACION_8B.md`, `docs/CONTRATO_PERSISTENCIA_PAQUETE_INSTALABLE_8C.md`, `docs/CONTRATO_VISTA_REVISION_DRAFT_8D.md`, `docs/CONTRATO_CONFIRMACION_HUMANA_DRAFT_8E.md` | Contratos tempranos del instalador y draft review | Knowledge Base / plantillas de salida | Alto |
| Decisiones 12V | `docs/constructor-crm/plan-contrato-constructor-crm-operativo-12V.md`, `validacion-contrato-crm-package-config-12V-2.md` | Vision del contrato CRM operativo | Core conceptual / docs base | Alto |
| Decision 11X | `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md` | Separacion Constructor vs CRM operativo | Politica base madre | Muy alto |
| `contract_fields_json` | docs 12W-5 + API 12W-5e | Patron reusable para campos dinamicos por vertical | Base madre / plantilla tecnica | Muy alto |
| Base de conocimiento por rubro | `docs/constructor-crm/base-conocimiento-por-rubro.md` | Curacion sectorial reutilizable | Knowledge Base | Alto |
| Recursos sectoriales | `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`, `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md` | Insumos para futuros clones | Knowledge Base / presets | Alto |
| Plantillas de reunion / minuta | `migrations/20260515100000_create_installer_package_meeting_decisions.sql` + rutas meeting_decisions | Decision log auditable del instalador | Base del workflow de aprobacion | Medio / alto |
| Seed minimo nuevo entorno | `docs/seed-minimo-nuevo-entorno-easy.md` | Criterio para levantar entornos sin contaminar | Checklist / template de clon limpio | Alto |

---

## 6. Clasificacion Pickup 4x4

### Core correcto

- `lib/crmPackage/types.ts`
- `lib/crmPackage/adapters/leadFieldPersistence.ts` salvo el fallback Pickup
- patron `contract_fields_json`
- flujos Leads / Ficha / Lista como base reusable

### Hardcode a extraer

- fallback Pickup en `getActiveCrmPackageConfigFromEnvironment()`
- fallback Pickup en whitelist de `leadFieldPersistence`
- bloque `Vehículo` hardcodeado en `app/admin/leads/nuevo/page.tsx`
- bloque `Vehículo` hardcodeado en `app/admin/leads/[id]/page.tsx`
- filtros / badges de vehiculo hardcodeados en `app/admin/leads/page.tsx`
- pagina de paquetes `app/admin/constructor-crm/paquetes/[id]/page.tsx`

### Plantilla reusable

- `lib/crmPackage/configs/pickup4x4.config.ts`
- `lib/admin/installablePackagePickup4x4Preset.ts`

### Knowledge Base

- validaciones 12W-5, 12W-6b, 12W-6c
- QA Vercel del piloto
- cierre piloto 12W
- dataset o caso semilla Pickup si se mantiene solo como referencia

### Revisar manualmente

- mocks Pickup en `app/api/admin/constructor/assist/route.ts`
- documentos operativos y ejecuciones del piloto
- copy comercial duro dentro del Constructor

---

## 7. Clasificacion Casa Limpia / facility

### Activos reales a extraer del repo madre

- En esta auditoria **no se confirma** una carpeta `docs/casalimpia/`.
- Queda como **requiere verificacion manual** si existieran brochures, contratos, plantillas de costeo, relevamientos o binarios reales del cliente.
- Los documentos estrategicos del Constructor sobre Casa Limpia **no cuentan** como activos reales del cliente.

### Facility legacy que hoy contamina el core

- columnas y migraciones facility ya presentes en schema:
  - `superficie_m2`
  - `cantidad_pisos`
  - `cantidad_banos`
  - `installation_details_json`
  - `visita_relevamiento_json`
- constante `CASALIMPIA_LEAD_FIELDS` en APIs de leads

### Conocimiento util a preservar

- las migraciones facility muestran exactamente que aspectos del modelo ya existen como columnas legacy
- sirven para decidir, en `CL-0b` o `CL-0c`, que se deja en core y que se mueve a `contract_fields_json`
- no deben borrarse sin antes extraer el aprendizaje y documentar el modelo final deseado

### Accion sugerida

- no borrar aun;
- inventariar que parte es reusable;
- separar **legacy facility core** de **contrato Casa Limpia cliente**;
- si aparecen activos reales del cliente, moverlos fuera del repo madre o dejarlos solo como placeholder o referencia documental.

---

## 8. Knowledge Base propuesta

### Arbol sugerido

```text
docs/constructor-crm/knowledge/
docs/constructor-crm/knowledge/decisiones/
docs/constructor-crm/knowledge/patrones/
docs/constructor-crm/knowledge/verticales/
docs/constructor-crm/knowledge/verticales/automotriz-accesorios/
docs/constructor-crm/knowledge/verticales/facility-servicios/
docs/constructor-crm/templates/
docs/constructor-crm/templates/packages/
docs/constructor-crm/templates/verticales/
docs/constructor-crm/templates/runbooks/
docs/constructor-crm/templates/manuales-cliente/
docs/constructor-crm/_archived/
```

### Criterio

- `knowledge/` guarda aprendizajes, patrones y decisiones reutilizables.
- `templates/` guarda plantillas copiables o adaptables.
- `_archived/` guarda historia operativa, QA vieja y evidencias que ya no son parte del core activo.
- Nada de esto debe ejecutarse en runtime.
- Las plantillas deben usar sufijo `.example` cuando corresponda.

---

## 9. Politica de limpieza

- No borrar sin clasificar.
- Primero preservar conocimiento util en `knowledge/` y `templates/`.
- Luego archivar basura historica.
- Luego limpiar hardcodes del core.
- Un commit por fase o por grupo pequeno de hallazgos.
- No mezclar movimientos de docs con cambios de codigo.
- No tocar SQL ni Supabase en `KB-1`.
- No crear carpetas cliente todavia.
- No clonar Casa Limpia hasta resolver Pickup fallback y revisar activos reales.
- Seguridad avanzada queda registrada, pero no bloquea la etapa interna de Daniel.

---

## 10. Riesgos para futuros clones cliente

- Un clon podria heredar hardcodes Pickup o Casa Limpia sin querer.
- Un clon podria nacer con copy o branding de otro vertical.
- El repo madre hoy mezcla plantilla base con conocimiento historico y restos de implementacion.
- Si no se sanea `src` paralela, puede haber confusion sobre la fuente de verdad.
- Si no se separan presets de core, el primer cliente nuevo queda sesgado por el piloto Pickup.
- Si no se verifica `docs/casalimpia/`, un material real de cliente podria colarse al flujo del Constructor.
- Seguridad interna (bypass, RLS incompleto, rol `summer87_superadmin`) no bloquea hoy, pero debe revisarse antes de abrir el Constructor o clones a terceros.

---

## 11. Fases recomendadas

| Fase | Objetivo |
|------|----------|
| `AUDIT-1` | Documento actual de inventario, lectura y dictamen |
| `KB-1` | Crear estructura `knowledge/`, `templates/` y `_archived/` y mover conocimiento util sin tocar codigo |
| `EXTRACT-1` | Verificar y extraer activos reales de Casa Limpia fuera del repo madre si existen |
| `CLEAN-1` | Aislar Pickup como preset o vertical, no como fallback default |
| `CLEAN-2` | Neutralizar Casa Limpia / facility legacy en codigo activo |
| `CLEAN-3` | Revisar modos, flags, seguridad y roles antes de acceso a terceros |
| `CL-0b` | Auditoria read-only especifica Casa Limpia sobre repo ya saneado |
| `CL-0c` | Contrato CRM Casa Limpia |
| `CL-0d` | Plan de clon `casalimpia-crm-inteligente` |

### Criterio operativo

- Primero clasificar.
- Despues preservar conocimiento util.
- Luego verificar y extraer activos reales si existen.
- Luego limpiar hardcodes del core.
- Recien despues pensar en clonar Casa Limpia.

---

## 12. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| API modificada | No |
| Solo documentacion | Si |
| Commit | No |

---

## 13. GO / NO-GO final

| Criterio | Dictamen |
|----------|----------|
| Clonar Casa Limpia hoy | NO-GO |
| Crear Knowledge Base | GO |
| Preservar conocimiento util | GO |
| Limpiar hardcodes sin Knowledge Base previa | NO-GO |
| Extraer o verificar activos reales Casa Limpia | GO |
| Priorizar seguridad avanzada ahora | NO-GO por uso interno |
| Registrar seguridad para antes de cliente real | GO |
| Pasar a `KB-1` despues de commitear `AUDIT-1` | GO |

---

## 14. Checklist de cobertura AUDIT-1

| Punto minimo | Estado |
|--------------|--------|
| 1. Resumen ejecutivo | OK |
| 2. Criterio de lectura | OK |
| 3. Hallazgos criticos | OK |
| 4. Basura / restos | OK |
| 5. Conocimiento util | OK |
| 6. Clasificacion Pickup | OK |
| 7. Clasificacion Casa Limpia / facility | OK |
| 8. Knowledge Base propuesta | OK |
| 9. Politica de limpieza | OK |
| 10. Fases recomendadas | OK |
| 11. GO / NO-GO | OK |
| 12. Confirmacion de alcance | OK |

---

## 15. Cierre

La auditoria confirma que `summer87-leads-v3` ya se parece a una fabrica de CRMs, pero todavia no es una base madre saneada. El paso correcto no es limpiar a ciegas ni clonar inmediatamente, sino separar con criterio lo que es **basura**, lo que es **hardcode a extraer**, y lo que es **conocimiento reusable** que debe preservarse como patrimonio del Constructor.
