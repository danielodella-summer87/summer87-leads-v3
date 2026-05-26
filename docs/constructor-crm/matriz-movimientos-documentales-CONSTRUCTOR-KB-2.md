# Matriz movimientos documentales CONSTRUCTOR-KB-2

**Fase:** CONSTRUCTOR-KB-2  
**Proyecto:** summer87-leads-v3  
**Tipo:** matriz operativa previa de clasificacion documental  
**Alcance:** solo documentacion; sin movimientos, sin borrado, sin cambios de codigo

---

## 1. Resumen ejecutivo

- `KB-2` no mueve archivos.
- `KB-2` crea una matriz previa para movimientos seguros.
- Busca evitar borrar conocimiento util o mezclar aprendizaje reusable con historia operativa.
- Sirve como puente entre `KB-1` y futuras fases de movimiento, archivo o limpieza tecnica.
- Confirma un hallazgo importante: `docs/casalimpia/` existe y contiene archivos Office que deben tratarse como posibles activos reales de cliente.
- **Dictamen:** **GO documental**.

---

## 2. Criterios de clasificacion

- `knowledge` = aprendizaje reusable, decision vigente o patron tecnico.
- `templates` = material copiable o adaptable.
- `_archived` = evidencia historica cerrada, QA vieja o ejecucion puntual.
- `mantener` = documento vigente en la ubicacion actual.
- `revisar` = no se puede decidir sin inspeccion posterior.
- `no tocar todavia` = requiere fase tecnica especifica y no debe tratarse como movimiento documental simple.

---

## 3. Matriz de decisiones arquitectonicas

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| D1 | `docs/constructor-crm/cierre-constructor-fabrica-crms-CONSTRUCTOR-CLOSE-1.md` | Decision arquitectonica | Define la base madre como fabrica de CRMs | Si queda solo en su ruta actual, puede perderse como decision troncal entre mucha documentacion operativa | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Mantener original por ahora |
| D2 | `docs/constructor-crm/diseno-paquete-instalable-contrato-salida-CONSTRUCTOR-CLOSE-2.md` | Decision / contrato de salida | Formaliza el paquete instalable como contrato | Si queda aislado, el instalador puede seguir evolucionando sin ancla documental clara | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Mantener original por ahora |
| D3 | `docs/constructor-crm/diseno-generador-local-proyecto-cliente-CONSTRUCTOR-CLOSE-3.md` | Decision de arquitectura operativa | Define el generador local y la separacion repo madre / proyecto cliente | Riesgo de reabrir la idea de terminar clientes dentro de la base madre | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Mantener original por ahora |
| D4 | `docs/constructor-crm/auditoria-constructor-base-madre-AUDIT-1.md` | Auditoria base madre | Es el inventario rector de hardcodes, restos y conocimiento reusable | Si no se referencia, las fases siguientes pueden limpiar sin criterio comun | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Mantener original por ahora |
| D5 | `docs/constructor-crm/validacion-knowledge-base-inicial-CONSTRUCTOR-KB-1.md` | Cierre de fase | Deja asentada la estructura inicial de KB, templates y archived | Si no se referencia, se pierde el criterio de por que existen estas carpetas | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Mantener original por ahora |
| D6 | `docs/constructor-crm/casalimpia-ecuador-estrategia-instancia-limpia-CL-0a.md` | Decision de clon limpio | Define que Casa Limpia debe nacer fuera de la base madre | Si se ignora, se puede volver a acoplar Casa Limpia sobre la demo existente | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | No es activo real de cliente |
| D7 | `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md` | Politica de modos | Separa Constructor vs CRM operativo | Si se diluye, aumenta el riesgo de rutas internas visibles en clones | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Decision base de producto |
| D8 | `docs/constructor-crm/plan-contrato-constructor-crm-operativo-12V.md` | Decision / plan de contrato | Alinea modo operativo y contrato CRM | Riesgo de quedar eclipsado por decisiones posteriores si no se indexa | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Complementa 11X y 12V-2 |
| D9 | `docs/constructor-crm/validacion-contrato-crm-package-config-12V-2.md` | Validacion de contrato | Valida el contrato `crm_package_config` | Si queda aislado, se pierde la trazabilidad entre decision y validacion | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Mantener original por ahora |
| D10 | `docs/DECISION_RUTAS_COMERCIALES_7M.md` | Decision comercial / producto | Fija la ruta comercial canonia | Si queda enterrado, reaparece la deuda de multiples rutas | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Documento vigente |
| D11 | `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md` | Inventario reusable | Conserva recursos por vertical | Si no se indexa, se pierde base para futuras sugerencias del Constructor | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Tambien dialoga con verticales |
| D12 | `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md` | Matriz de recursos | Aporta clasificacion por rubro | Si queda suelto, cuesta enlazar recursos con presets y plantillas | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Base para verticales futuras |
| D13 | `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md` | Decision / presets | Describe presets sectoriales del instalador | Si se usa como implementacion directa puede contaminar core | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Template claro mas adelante |
| D14 | `docs/MATRIZ_ACTIVACION_INSTALADOR_7R.md` | Gobernanza operativa | Ordena activacion del instalador | Si queda fuera de la KB, se pierde criterio de operacion | Referenciar desde knowledge | `knowledge/decisiones/` | Media | `KB-3` | No | Puede dialogar con `knowledge/operacion` |
| D15 | `docs/CONTRATO_ENDPOINT_PAQUETE_INSTALABLE_8A.md` | Contrato de endpoint | Define la entrada/salida del instalador | Si queda suelto, se separa del resto del circuito de drafts | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Parte del bloque 8A-8E |
| D16 | `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md` | Modelo documental | Define datos del paquete instalable | Puede quedar desconectado del flujo de persistencia y revision | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Parte del bloque 8A-8E |
| D17 | `docs/CONTRATO_PERSISTENCIA_PAQUETE_INSTALABLE_8C.md` | Contrato de persistencia | Aclara como se guarda el draft | Si no se indexa, se pierde continuidad entre endpoint y storage | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Parte del bloque 8A-8E |
| D18 | `docs/CONTRATO_VISTA_REVISION_DRAFT_8D.md` | Contrato de revision | Aclara la vista previa del draft | Riesgo de duplicar criterios de revision en otros docs | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Parte del bloque 8A-8E |
| D19 | `docs/CONTRATO_CONFIRMACION_HUMANA_DRAFT_8E.md` | Decision de aprobacion | Formaliza la confirmacion humana | Si se aísla, se debilita el principio de aprobacion manual | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | Parte del bloque 8A-8E |
| D20 | `docs/APLICACION_MANUAL_MIGRACION_8B.md` | Registro operativo | Documenta una aplicacion manual historica | Puede confundirse con procedimiento activo y vigente | Revisar manualmente | `knowledge/operacion/` o `_archived/` | Media | `ARCHIVE-1` | Si | Mantener original hasta revisar |

---

## 4. Matriz de patrones tecnicos reutilizables

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| P1 | `docs/constructor-crm/diseno-persistencia-campos-dinamicos-pickup-12W-5d.md` + `docs/constructor-crm/validacion-api-contract-fields-json-12W-5e.md` + `docs/constructor-crm/cierre-global-contract-fields-vehiculo-pickup-12W-5.md` | Patron tecnico documental | Mejor explicacion del patron `contract_fields_json` | Si queda mezclado con docs de vertical, cuesta verlo como patron reusable | Referenciar desde knowledge | `knowledge/patrones/` | Alta | `KB-3` | No | Base para dinamicos por vertical |
| P2 | `lib/crmPackage/types.ts` | Patron tecnico en codigo | Contrato tipado canonia del paquete CRM | Si se toca en una fase documental, se mezcla KB con refactor tecnico | No tocar todavia | `knowledge/patrones/` via referencia | Alta | `CLEAN-3` | No | Solo referenciar, no mover |
| P3 | `app/api/admin/constructor/installable-package/generate/route.ts` | Implementacion activa | Generacion segura de paquetes y `blocked_actions` | Es codigo productivo sensible; mover o tocar ahora rompe alcance | No tocar todavia | `knowledge/patrones/` via referencia | Alta | `CLEAN-3` | No | Patrón fuerte, pero no documentalizar moviendo codigo |
| P4 | `app/api/admin/constructor/installable-package/drafts/[id]/simulation-snapshots/route.ts` + `migrations/20260512140000_create_installer_package_simulation_snapshots.sql` | Patron de trazabilidad | Simulacion auditable antes de instalar | Toca API y migracion activa | No tocar todavia | `knowledge/operacion/` via referencia | Media | `CLEAN-3` | No | Documentar el patron, no moverlo |
| P5 | `app/api/admin/constructor/installable-package/drafts/[id]/meeting-decisions/route.ts` + `migrations/20260515100000_create_installer_package_meeting_decisions.sql` | Patron de aprobacion | Deja decisiones humanas auditables | Si se mezcla con templates antes de tiempo, se confunde workflow con minuta example | No tocar todavia | `templates/reuniones/` via referencia | Media | `CLEAN-3` | No | Mantener codigo y migracion en su sitio |
| P6 | `docs/seed-minimo-nuevo-entorno-easy.md` | Patron operativo | Resume seed minimo para nuevo entorno | Si queda aislado, se pierde frente a SQL legacy disperso | Referenciar desde knowledge | `knowledge/patrones/` | Media | `KB-3` | No | Buen candidato a indice patrimonial |
| P7 | `docs/constructor-crm/runbook-instalacion-client-crm-12K.md` | Runbook reusable | Secuencia manual de instalacion y setup | Si queda mezclado con historia del repo, cuesta reutilizarlo | Referenciar desde knowledge | `knowledge/operacion/` | Media | `KB-3` | No | Podra inspirar template mas adelante |
| P8 | `docs/constructor-crm/manual-breve-usuario-cliente-12Q.md` | Manual base reusable | Material base para cliente final | Si queda como documento activo unico, puede confundirse con manual final universal | Referenciar desde knowledge | `templates/manuales-cliente/` | Media | `KB-4` | No | Futuro template parametrizable |
| P9 | `bootstrapp nueva instancia.sql` + `supabase/scripts/bootstrap_new_instance_consolidated.sql` | Bootstrap tecnico | Conservan criterio de arranque de entorno | Riesgo de ejecutar SQL legacy fuera de contexto | Revisar manualmente | `knowledge/operacion/` o `_archived/` | Media | `EXTRACT-1` | Si | No mover ni tocar en KB-2 |

---

## 5. Matriz Pickup / automotriz

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| A1 | `docs/constructor-crm/cierre-piloto-operativo-pickup-4x4-12W.md` | Cierre de piloto | Valida el piloto como aprendizaje del vertical | Si queda suelto entre QA, se diluye el valor reusable del piloto | Referenciar desde knowledge | `knowledge/verticales/automotriz-accesorios/` | Alta | `KB-3` | No | No equivale a producto final |
| A2 | `docs/constructor-crm/diseno-nuevo-lead-pickup-fields-12W-5a.md` + `docs/constructor-crm/diseno-mapping-nuevo-lead-pickup-payload-12W-5c.md` | Diseño vertical | Capturan semantica del vertical automotriz | Si quedan como doc generica activa, parecen obligatorios para todo clon | Referenciar desde knowledge | `knowledge/verticales/automotriz-accesorios/` | Media | `KB-3` | No | También informan patrones |
| A3 | `docs/constructor-crm/diseno-reportes-filtros-vehiculo-contract-fields-12W-6a.md` + `docs/constructor-crm/validacion-lista-filtros-vehiculo-contract-fields-12W-6b.md` + `docs/constructor-crm/validacion-lista-badges-vehiculo-contract-fields-12W-6c.md` | Aprendizaje funcional | Documentan filtros y badges de vehiculo | Mucho detalle UI puede contaminar la KB general | Referenciar desde knowledge | `knowledge/verticales/automotriz-accesorios/` | Media | `KB-3` | No | Separar luego QA fina |
| A4 | `docs/constructor-crm/validacion-vercel-contract-fields-json-12W-5-QA.md` + `docs/constructor-crm/validacion-vercel-lista-filtros-vehiculo-contract-fields-12W-6b-QA.md` + `docs/constructor-crm/validacion-vercel-lista-badges-vehiculo-contract-fields-12W-6c-QA.md` | QA historica | Evidencia cerrada del piloto | Alto ruido si permanece junto a la KB activa | Archivar en _archived | `_archived/validaciones-pickup-piloto/` | Alta | `ARCHIVE-1` | No | No borrar; archivar con criterio |
| A5 | `docs/constructor-crm/dataset-ficticio-pickup4x4-12N-real.md` + `docs/constructor-crm/plan-carga-manual-ui-dataset-pickup4x4-12N-impl-plan.md` + `docs/constructor-crm/ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md` + `docs/constructor-crm/auditoria-schema-dataset-pickup4x4-12N-schema-audit.md` | Dataset / carga demo | Sirven para explicar la demo y su operacion | Si se leen fuera de contexto, consolidan la demo como base real | Revisar manualmente | `_archived/validaciones-pickup-piloto/` | Alta | `ARCHIVE-1` | Si | Dejar solo criterio reusable en knowledge |
| A6 | `docs/constructor-crm/validacion-vercel-client-crm-12O-run.md` + `docs/constructor-crm/validacion-post-dataset-vercel-client-crm-12O-post-dataset-run.md` | QA de demo | Evidencian funcionamiento post dataset | Riesgo de ser interpretado como estado productivo | Archivar en _archived | `_archived/validaciones-pickup-piloto/` | Media | `ARCHIVE-1` | No | Mantener referencia desde operacion |
| A7 | `lib/crmPackage/configs/pickup4x4.config.ts` | Referencia de codigo | Mejor ejemplo actual de contrato vertical | Es codigo productivo y hoy ademas un foco de hardcode | No tocar todavia | `templates/verticales/pickup4x4/` via referencia | Alta | `CLEAN-1` | No | No mover codigo en KB-2 |
| A8 | `lib/admin/installablePackagePickup4x4Preset.ts` | Referencia de codigo | Ejemplo actual de preset instalable | Sigue acoplado al flujo del instalador | No tocar todavia | `templates/verticales/pickup4x4/` via referencia | Alta | `CLEAN-1` | No | Futuro `preset.example.ts` |
| A9 | `docs/constructor-crm/knowledge/verticales/automotriz-accesorios/README.md` + `docs/constructor-crm/templates/verticales/pickup4x4/README.md` | Destino preparado | Ya marcan donde debe caer el conocimiento y el template | Ninguno; hoy estan correctos como placeholders | Mantener donde esta | Sin cambios | Baja | `KB-3` | No | Se poblaran en fases posteriores |

---

## 6. Matriz Casa Limpia / facility

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| C1 | `docs/constructor-crm/casalimpia-ecuador-estrategia-instancia-limpia-CL-0a.md` | Decision de clon limpio | Fija la estrategia correcta para Casa Limpia | Si queda sin indexar, puede ignorarse al ejecutar fases tecnicas | Referenciar desde knowledge | `knowledge/decisiones/` | Alta | `KB-3` | No | No es activo real de cliente |
| C2 | `docs/casalimpia/1.- CREACIÓN DE CLIENTE .xlsx` + `docs/casalimpia/3.- LEVANTAMIENTO DE INFORMACIÓN  PARA COTIZAR.xlsx` + `docs/casalimpia/4.- FORMATO_COSTEO_2026_FINAL_OK.xlsx` + `docs/casalimpia/5.- BORRADOR COTIZACION SERVICIO DE LIMPIEZA PERMANENTE  2026.docx` + `docs/casalimpia/6.- BORRADOR DE CONTRATO 2026.docx` + `docs/casalimpia/7.- R06-01-06 Planilla de ejecución - INICIACION SERVICIO.xlsx` | Posibles activos reales de cliente | Parecen binarios y documentos comerciales o contractuales reales | Riesgo alto de contaminar el repo madre con material sensible de cliente | Revisar manualmente | Fuera del repo madre o placeholder referenciado | Critica | `EXTRACT-1` | Si | No borrar sin respaldo |
| C3 | `supabase/migrations/20260428100000_casalimpia_fase1.sql` + `supabase/migrations/20260428110000_casalimpia_visit_completion_fields.sql` | Referencia tecnica | Muestran el acople facility ya materializado en schema | Tocar estas migraciones ahora rompe el alcance y la trazabilidad | No tocar todavia | `knowledge/verticales/facility-servicios/` via referencia | Alta | `CLEAN-2` | No | Son referencia, no material a mover ya |
| C4 | `app/api/admin/leads/route.ts` + `app/api/admin/leads/[id]/route.ts` | Referencia de codigo | Contienen `CASALIMPIA_LEAD_FIELDS` dentro del core | Riesgo alto de contaminar clones, pero no es un movimiento documental | No tocar todavia | `knowledge/verticales/facility-servicios/` via referencia | Alta | `CLEAN-2` | No | Resolver solo en fase tecnica |
| C5 | `docs/constructor-crm/knowledge/verticales/facility-servicios/README.md` | Destino de conocimiento | Ya define el destino del aprendizaje facility | Ninguno; esta bien como placeholder inicial | Mantener donde esta | Sin cambios | Baja | `KB-3` | No | Debe poblarse sin activos reales |
| C6 | `docs/constructor-crm/templates/verticales/casa-limpia-ecuador/README.md` | Destino de template | Marca el espacio de futura plantilla limpia | Ninguno, siempre que no se carguen activos reales | Mantener donde esta | Sin cambios | Baja | `KB-4` | No | Template futuro, no activo de cliente |

---

## 7. Matriz basura / restos / archivo historico

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| B1 | `CHECKLIST_ACCIONES_LEADS.md` + `CHECKLIST_AGENDA_FECHA_LIMITE.md` + `CHECKLIST_REPARACION_EMPRESA_ID.md` | Checklist historico | Aportan contexto tecnico y operativo pasado | Alto riesgo de obsolescencia y confusion si siguen en raiz | Archivar en _archived | `_archived/checklists-legado/` | Media | `ARCHIVE-1` | Si | Revisar antes si alguno sigue vigente |
| B2 | `backup_base_vacia.sql` + `estructura_base.sql` + `bootstrapp nueva instancia.sql` + `backups/backup_pre_invites_20260226-1200.sql` | Backup / bootstrap legacy | Valor forense o historico | Riesgo medio-alto por sensibilidad y posible desalineacion | Revisar manualmente | `_archived/sql-legado/` | Alta | `EXTRACT-1` | Si | No borrar ni mover sin respaldo |
| B3 | `docs/AUDITORIA_LIMPIEZA_7B.md` + `docs/AUDITORIA_LEADS87.md` + `docs/AUDITORIA_LEADS87_FINAL.md` | Auditoria legacy | Conservan historia de limpieza y rutas | Pueden competir con documentos mas recientes y claros | Archivar en _archived | `_archived/auditorias-legado/` | Media | `ARCHIVE-1` | No | Dejar referencias desde knowledge si aportan contexto |
| B4 | `docs/constructor-crm/validacion-vercel-nuevo-lead-pickup-ui-12W-5b-QA.md` + `docs/constructor-crm/validacion-vercel-edicion-ficha-vehiculo-contract-fields-12W-5h-QA.md` + `docs/constructor-crm/validacion-vercel-eliminacion-vehiculo-contract-fields-12W-5j-QA.md` | QA cerrada | Evidencia detallada de pruebas puntuales | Alto ruido si queda junto a la documentacion activa | Archivar en _archived | `_archived/validaciones-pickup-piloto/` | Alta | `ARCHIVE-1` | No | Buen bloque para archivo controlado |
| B5 | `scripts/tmp-ia-prompts-debug.mjs` | Script temporal | Puede contener pistas de depuracion pasada | Alto riesgo de parecer script util vigente cuando puede estar muerto | Revisar manualmente | `_archived/scripts-tmp/` o sin mover | Media | `EXTRACT-1` | Si | No mover sin validar si esta muerto |
| B6 | `src/app/actions/auth.ts` + `src/app/logout/page.tsx` + `src/lib/auth/session.ts` | Legacy estructural | Revelan un arbol paralelo antiguo | Alto riesgo de confusion sobre source of truth | Revisar manualmente | Sin destino documental aun | Alta | `CLEAN-2` | Si | No tratar como archivo documental comun |
| B7 | `*.pdf` en repo | Archivo binario esperado | No se encontraron PDFs | Riesgo nulo por ahora | Mantener donde esta | No aplica | Baja | No aplica | No | Registrar no encontrado |
| B8 | `*.tsbuildinfo` en repo | Artefacto generado esperado | No se encontro `tsbuildinfo` | Riesgo nulo por ahora | Mantener donde esta | No aplica | Baja | No aplica | No | Registrar no encontrado |
| B9 | `node_modules/` y `.next/` en repo | Artefactos de build esperados | No se encontraron dentro del repo | Riesgo nulo por ahora | Mantener donde esta | No aplica | Baja | No aplica | No | Registrar no encontrado |

---

## 8. Matriz "no tocar todavia"

| ID | Archivo / ruta | Tipo | Valor / utilidad | Riesgo si queda donde esta | Accion recomendada | Destino sugerido | Prioridad | Fase sugerida | Requiere revision manual | Notas |
|----|----------------|------|------------------|----------------------------|--------------------|------------------|-----------|----------------|---------------------------|-------|
| N1 | `supabase/migrations/` + `migrations/` | Migraciones activas | Son historia viva de schema y politicas | Mover o editar aqui ya no seria documental | No tocar todavia | Sin destino en KB-2 | Alta | `CLEAN-2` / `CLEAN-3` | No | Solo referenciar patrones cuando ayude |
| N2 | `scripts/fix-orphan-leads.ts` + `scripts/generate-mod-easy-senior-sql.mjs` + `scripts/gen-mod-easy-v21-migration.mjs` + `scripts/gen-mod-easy-v22-migration.mjs` + `scripts/validate-mod-easy-motor.mjs` + `supabase/scripts/` | Scripts activos o dudosos | Pueden impactar datos, schema o diagnosticos | No pueden moverse como parte de KB sin fase tecnica | No tocar todavia | Sin destino en KB-2 | Alta | `CLEAN-3` | Si | Requieren inventario tecnico propio |
| N3 | `app/api/admin/leads/route.ts` + `app/api/admin/leads/[id]/route.ts` + `app/api/admin/constructor/installable-package/**/route.ts` | Rutas API activas | Implementan comportamiento real del sistema | Cualquier cambio deja de ser documental | No tocar todavia | Sin destino en KB-2 | Alta | `CLEAN-1` / `CLEAN-2` / `CLEAN-3` | No | Solo clasificar por referencia |
| N4 | `app/admin/leads/page.tsx` + `app/admin/leads/[id]/page.tsx` + `app/admin/constructor-crm/paquetes/[id]/page.tsx` | UI productiva | Contiene hardcodes y comportamiento activo | Debe sanearse despues, no ahora | No tocar todavia | Sin destino en KB-2 | Alta | `CLEAN-1` / `CLEAN-2` | No | No mover ni editar en fase KB |
| N5 | `lib/crmPackage/getActiveCrmPackageConfig.ts` + `lib/crmPackage/adapters/leadFieldPersistence.ts` + `lib/config/appMode.ts` + `lib/config/crmMode.ts` + `lib/config/appSuiteConfig.ts` + `middleware.ts` | Config y core | Son el corazon del acople actual | Requieren refactor tecnico posterior, no movimiento documental | No tocar todavia | Sin destino en KB-2 | Critica | `CLEAN-1` / `CLEAN-3` | No | Principal frente tecnico despues de KB |
| N6 | `src/` paralela legacy | Estructura dudosa | Puede ser residuo o depender de algo vivo | No puede moverse hasta confirmar source of truth | No tocar todavia | Sin destino en KB-2 | Alta | `CLEAN-2` | Si | Debe resolverse con revision tecnica |

### Explicacion

Los items de este bloque requieren fases `CLEAN` o revision tecnica posterior. `KB-2` solo clasifica y ordena el trabajo futuro.

---

## 9. Reglas de ejecucion futura

- Primero indexar decisiones y patrones.
- Despues mover templates claros.
- Despues archivar QA vieja.
- Despues limpiar hardcodes.
- Un commit por grupo logico.
- Antes de mover, revisar enlaces, referencias e imports.
- No mover migraciones ni scripts sin fase tecnica especifica.
- No borrar nada en el primer movimiento.

---

## 10. Fases derivadas sugeridas

| Fase | Objetivo |
|------|----------|
| `KB-3` | Indexar decisiones y patrones sin mover originales |
| `KB-4` | Preparar templates verticales claros |
| `ARCHIVE-1` | Archivar QA Pickup cerrada y evidencia historica de bajo valor operativo activo |
| `EXTRACT-1` | Verificar y extraer activos reales Casa Limpia |
| `CLEAN-1` | Resolver Pickup como fallback o preset dominante |
| `CLEAN-2` | Neutralizar Casa Limpia / facility legacy y resolver `src` paralela |
| `CLEAN-3` | Revisar modos, flags, seguridad y config antes de cliente real |

---

## 11. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Matriz operativa creada | GO |
| Mover documentos ahora | NO-GO |
| Borrar documentos ahora | NO-GO |
| Crear referencias knowledge | GO futuro |
| Archivar QA vieja | GO futuro con matriz |
| Tocar codigo | NO-GO |
| Tocar SQL | NO-GO |
| Clonar Casa Limpia | NO-GO |

---

## 12. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| Archivos movidos | No |
| Archivos borrados | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| Solo documentacion | Si |
| Commit | No |

---

## 13. Cierre

`KB-2` deja una matriz previa de movimientos para evitar limpieza a ciegas. La secuencia recomendada sigue siendo: **indexar -> preparar templates -> archivar evidencia historica -> limpiar hardcodes -> revisar activos reales Casa Limpia -> recien despues pensar en clones cliente**.
