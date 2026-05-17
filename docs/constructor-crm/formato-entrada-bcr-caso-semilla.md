# Formato de Entrada BCR para Casos Semilla — Constructor CRM Summer87

**Versión:** Fase 11L-F0 (formato documental)  
**Siglas:** BCR — Base de Conocimiento por Rubro  
**Relacionado con:** `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/constructor-crm/caso-semilla-pickup4x4-bcr.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/checklist-limpieza-base-madre.md`, `docs/constructor-crm/propuesta-limpieza-base-madre-L2.md`

**Estado:** contrato conceptual para fichas Markdown. **No implementa** persistencia, UI, endpoints ni lógica en runtime.

---

## 2. Resumen ejecutivo

Este documento define la **ficha estándar** para transformar un caso real, piloto o diseño documental del Constructor CRM en **aprendizaje reutilizable** para la Base de Conocimiento por Rubro (BCR).

Cada caso semilla (Pickup 4x4, un estudio contable futuro, una clínica, etc.) debe poder documentarse con la **misma estructura**, de modo que el conocimiento sea **comparable**, **gobernable** y **promovible** hacia blueprints sin copiar datos del cliente ni IDs de la base madre.

Por ahora las entradas viven como **Markdown en el repositorio**. No existe tabla BCR en Supabase ni aplicación automática en el Constructor.

---

## 3. Propósito del formato

El formato sirve para:

| Objetivo | Descripción |
|----------|-------------|
| **Documentar aprendizaje** | Registrar qué se aprendió al construir o operar un CRM concreto |
| **Separar instancia de patrón** | Aislar datos del cliente de patrones reutilizables por rubro |
| **Alimentar blueprints** | Ser la materia prima curada de `blueprint_v0`, `blueprint_v1`, etc. |
| **Evitar copia ciega** | Forzar explícitamente qué promover y qué no |
| **Gobernanza y revisión** | Estados, confianza, fuentes y aprobación humana trazables |
| **Comparar casos** | Mismo rubro, distintos clientes → deltas visibles |

---

## 4. Cuándo se debe usar

Crear o actualizar una ficha BCR cuando ocurra **al menos uno** de estos hitos:

- Después de **cerrar un piloto documental** (draft aprobado, reunión, cierre 8x).
- Después de **aprobar un blueprint** sectorial para revisión interna.
- Después de **activar un CRM operativo** duplicado desde la base madre.
- Después de **30 / 60 / 90 días de uso** real (evidencia operativa).
- Después de una **retrospectiva** con el cliente o con el equipo Summer87.
- **Antes de limpiar datos** de la base madre que referencien el caso (draft, snapshot, meeting decision, leads de prueba).

**Regla:** si el caso aporta aprendizaje que no debe perderse, debe existir ficha BCR (o actualización de la existente) **antes** de DELETE o archivo en Supabase.

---

## 5. Estructura general de la ficha BCR

Toda entrada de caso semilla incluye **veinte bloques** (A–T), en este orden:

| ID | Sección | Rol |
|----|---------|-----|
| **A** | Identificación del caso | Quién, cuándo, estado, confidencialidad |
| **B** | Clasificación por rubro | Taxonomía BCR y matching |
| **C** | Contexto del negocio | Problema, proceso, restricciones |
| **D** | Estado del flujo Constructor | Etapas 8B–8x recorridas |
| **E** | Artefactos asociados | Draft, snapshot, preset, etc. (evidencia) |
| **F** | Aprendizajes estructurales | Qué funcionó / no / validar |
| **G** | Módulos recomendados | Lista sugerida para el rubro |
| **H** | Pipeline sugerido | Etapas conceptuales |
| **I** | Campos frecuentes | Grupos y campos conceptuales |
| **J** | Reportes útiles | KPIs y vistas |
| **K** | Preguntas de diagnóstico | Reutilizables en nuevos diseños |
| **L** | Riesgos típicos | Con mitigación |
| **M** | Integraciones relevantes | Modo, dirección, restricciones |
| **N** | Decisiones humanas importantes | Go/No-Go, alcance, bloqueos |
| **O** | Qué promover a BCR | Patrones aptos para el rubro |
| **P** | Qué NO promover | Lista negativa explícita |
| **Q** | Nivel de confianza | Escala + motivo |
| **R** | Evidencia / fuentes | Trazabilidad interna |
| **S** | Reglas de reutilización | Cómo usar sin copia ciega |
| **T** | Próximos pasos | Promoción, blueprint, limpieza, piloto |

---

## 6. Campos conceptuales por sección

### A. Identificación del caso

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `case_id_conceptual` | string | Sí | Slug estable, ej. `semilla-pickup-4x4-2026-05` (no UUID de BD) |
| `nombre_caso` | string | Sí | Nombre legible del caso semilla |
| `cliente_origen` | string | Opcional | Nombre comercial; marcar confidencialidad |
| `fecha_documentacion` | date | Sí | Fecha de cierre documental de la ficha |
| `operador` | string | Sí | Quién documentó (rol, no necesariamente PII) |
| `estado_entrada` | enum | Sí | Ver §7 |
| `confidencialidad` | enum | Sí | `interno` \| `restringido` \| `anonimizable` |
| `fuente_principal` | enum | Sí | Ver §9 (tipo dominante) |
| `version_ficha` | string | Sí | ej. `1.0` |
| `documento_relacionado` | path | Opcional | Ruta al `.md` detallado si existe |

### B. Clasificación por rubro

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `rubro` | string | Sí | Nombre de rubro en catálogo o propuesto |
| `rubro_id` | uuid/string | Opcional | Cuando exista en catálogo `rubros` |
| `vertical_padre` | string | Sí | ej. Automotor, Servicios profesionales |
| `subrubro` | string | Opcional | Granularidad adicional |
| `pais` | string | Sí | ISO o nombre |
| `tamano_empresa` | enum | Opcional | micro \| pyme \| mediana \| enterprise |
| `canal_principal` | string | Opcional | WhatsApp, referidos, mostrador, etc. |
| `tipo_venta` | string | Opcional | consultiva, transaccional, mixta, retainer |
| `complejidad` | enum | Sí | baja \| media \| alta |
| `etiquetas` | string[] | Opcional | `multisede`, `regulado`, `integracion_erp`, etc. |
| `b2b_b2c` | enum | Opcional | b2b \| b2c \| mixto |

### C. Contexto del negocio

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `resumen_negocio` | texto | Sí | 2–5 oraciones |
| `problema_principal` | texto | Sí | Dolor que motivó el CRM |
| `necesidad_crm` | texto | Sí | Qué debe resolver el sistema |
| `proceso_comercial_actual` | texto | Opcional | As-is antes del CRM |
| `restricciones` | lista | Opcional | Legal, técnicas, presupuesto, plazos |
| `sistema_externo_relevante` | string | Opcional | Kore, ERP, facturación, etc. |
| `criterio_exito_piloto` | texto | Opcional | Definición 30/60/90 días |

### D. Estado del flujo Constructor

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `draft_generado` | bool + nota | Paquete 8B creado |
| `simulacion_realizada` | bool + nota | Preinstalación / snapshot |
| `confirmacion_humana` | enum | pending \| approved \| rejected |
| `status_draft` | string | ej. `approved_for_pilot` |
| `reunion_registrada` | bool + nota | Meeting decisions |
| `preparacion_manual` | bool + nota | Sin instalación automática |
| `plan_piloto` | bool + nota | |
| `auditoria_pre_sql` | bool + nota | |
| `blueprint_tecnico` | bool + nota | Preset o payload curado |
| `cierre_documental` | bool + nota | Ficha BCR completada |
| `crm_operativo_activo` | bool + nota | Clon en producción |

### E. Artefactos asociados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `draft_id` | uuid | Solo evidencia interna; no promover |
| `snapshot_ids` | uuid[] | Idem |
| `meeting_decision_ids` | uuid[] | Idem |
| `preset_key` | string | ej. `pickup_4x4` |
| `package_version` | string | ej. `8B-draft-v1` |
| `ruta_preset_codigo` | path | Si aplica en repo |
| `export_payload` | bool | Si existe export JSON privado |
| `capturas_ui` | bool | Referencia a assets internos |

### F. Aprendizajes estructurales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `modulos_utiles` | lista + nota | Qué habilitar |
| `modulos_descartados` | lista + motivo | Qué no usar y por qué |
| `pipeline_lecciones` | texto | Etapas que funcionaron o sobraron |
| `campos_lecciones` | texto | Obligatoriedad, grupos |
| `reportes_lecciones` | texto | Usados vs. ignorados |
| `integracion_lecciones` | texto | |
| `permisos_lecciones` | texto | Orden de creación de roles/usuarios |
| `que_funciono` | lista | |
| `que_no_funciono` | lista | Anti-patrones |
| `que_validar_antes` | lista | Checklist pre-activación |

### G. Módulos recomendados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `modulos` | lista `{ key, label, enabled, nota }` | Sugerencia BCR, no config aplicada |

### H. Pipeline sugerido

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `etapas` | lista `{ orden, key, label, terminal? }` | Conceptual |
| `reglas_avance` | texto | Campos obligatorios por etapa |
| `es_sugerencia_bcr` | bool | Siempre `true` en caso semilla |

### I. Campos frecuentes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `grupos` | lista `{ grupo, campos[], obligatorios[] }` | Sin valores de clientes reales |

### J. Reportes útiles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reportes` | lista `{ key, label, audiencia, nota }` | |

### K. Preguntas de diagnóstico

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `preguntas` | lista `{ id, texto, bloquea_diseno? }` | Reutilizables en Constructor |

### L. Riesgos típicos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `riesgos` | lista `{ riesgo, severidad, mitigacion, origen }` | |

### M. Integraciones relevantes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `integraciones` | lista `{ sistema, modo, write_allowed, sync_direction, estado, notas }` | |

### N. Decisiones humanas importantes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `decisiones` | lista `{ tipo, label, efecto, fecha }` | ej. `advance_manual_preparation` |
| `bloqueos_explicitos` | lista | tenant, usuarios, escritura externa |
| `alcance_piloto` | texto | |
| `usuarios_fase_1` | texto | Quién accede primero |

### O. Qué promover a BCR

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `items_promovibles` | lista categorizada | Rubro, módulos, pipeline, etc. |
| `destino_sugerido` | enum | `leccion` \| `pregunta` \| `riesgo` \| `blueprint_fragment` |

### P. Qué NO promover

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `items_excluidos` | lista | IDs, PII, credenciales, textos de prueba |
| `motivo_exclusion` | texto por ítem | |

### Q. Nivel de confianza

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nivel` | enum | baja \| media \| alta |
| `motivo` | texto | |
| `casos_similares_conteo` | number | Cuántos casos respaldan el patrón |
| `uso_operativo_dias` | number | Opcional |

### R. Evidencia / fuentes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fuentes` | lista `{ tipo, referencia, fecha, nota }` | Ver §9 |
| `enlaces_internos` | path[] | Docs, presets, exports privados |

### S. Reglas de reutilización

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `aplicacion` | enum | sugerir \| adaptar \| no_copiar |
| `condiciones` | lista | Cuándo aplica el patrón |
| `penalizaciones_matching` | texto | País distinto, tamaño distinto, etc. |

### T. Próximos pasos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `acciones` | lista `{ accion, responsable, plazo, bloqueante? }` | |
| `promocion_blueprint` | bool + target | ej. `blueprint_v0` |
| `limpieza_madre` | enum | pendiente \| autorizada \| no_aplica |

---

## 7. Estados posibles de una entrada BCR

| Estado | Significado | ¿Sugiere en Constructor? |
|--------|-------------|---------------------------|
| **borrador** | Ficha en redacción; incompleta o sin revisar | No |
| **en revisión** | Pendiente de curador / Tech Lead | No |
| **aprobado como caso semilla** | Aprendizaje validado como referencia del rubro | Solo como referencia documental |
| **promovido a blueprint v0** | Fragmentos curados en blueprint inicial del rubro | Sí, como sugerencia etiquetada |
| **promovido a blueprint de rubro** | Integrado en blueprint versionado (`v1`, `v2`…) | Sí, con confianza según versión |
| **archivado** | Caso cerrado; no usar para sugerencias por defecto | No (histórico) |
| **obsoleto** | Supersedido por otro caso o blueprint; conservar trazabilidad | No |

**Transiciones típicas:** `borrador` → `en revisión` → `aprobado como caso semilla` → (opcional) `promovido a blueprint v0` → `promovido a blueprint de rubro`. Cualquier estado puede pasar a `archivado` u `obsoleto`.

---

## 8. Nivel de confianza

| Nivel | Cuándo usar | Efecto en producto (futuro) |
|-------|-------------|------------------------------|
| **Baja** | Un caso débil, país distinto, muchos descartes, solo inferencia IA | Sugerencias al final o con aviso fuerte |
| **Media** | Un caso documentado completo sin uso operativo largo | Sugerencia visible con revisión obligatoria |
| **Alta** | Varios casos similares + validación operativa + curador | Puede proponerse como base por defecto del rubro |

**Reglas heurísticas:**

- **Un solo caso documentado** → confianza **media** o **baja** (según completitud y rubro regulado).
- **Varios casos similares** (mismo `rubro_id`, contexto parecido) → subir hacia **alta**.
- **Validación operativa real** (30+ días, métricas de uso) → aumenta confianza.
- **Descartes frecuentes** del mismo ítem en el Constructor → reduce confianza del ítem en el rubro.

---

## 9. Tipos de origen

Cada ítem de la ficha puede citar una o más fuentes:

| Tipo | Uso |
|------|-----|
| **package_payload** | Draft 8B exportado o resumido |
| **preset** | Definición en código o JSON versionado |
| **snapshot** | Resultado de simulación / preinstalación |
| **meeting decision** | Acta de reunión, Go/No-Go |
| **blueprint técnico** | Diseño curado previo |
| **auditoría pre-SQL** | Hallazgos pre-instalación |
| **uso operativo** | Telemetría cualitativa post-activación |
| **entrevista cliente** | Retro o diagnóstico |
| **retro interna** | Summer87 post-piloto |
| **IA asistida** | Redacción o clustering; siempre etiquetada |
| **curaduría manual** | Editor humano BCR |

---

## 10. Reglas de anonimización

Al redactar o promover desde una ficha:

1. **No promover IDs reales** de drafts, snapshots, tenants, usuarios ni leads.
2. **No promover datos personales** (nombres de contacto, teléfonos, emails de terceros).
3. **No promover credenciales** ni endpoints con secretos.
4. **No promover notas sensibles** (salud, disputas legales, precios confidenciales).
5. **No promover nombres de contacto** en fragmentos del rubro; usar roles genéricos.
6. **No copiar decisiones específicas** si no son generalizables (ej. fecha tentativa de un solo cliente).
7. **Separar** bloque **E (evidencia)** — acceso restringido — de bloques **G–L (patrón)** — reutilizable.

La ficha completa puede ser `confidencialidad: restringido`; la promoción al rubro usa solo extractos anonimizados.

---

## 11. Reglas para promoción a blueprint

Una entrada puede transformarse en **blueprint** (v0 o superior) cuando:

| Criterio | Requerido |
|----------|-----------|
| Caso completo (secciones A–T cubiertas o justificadas N/A) | Sí |
| Evidencia suficiente (≥2 fuentes o uso operativo documentado) | Sí |
| Revisión humana (`en revisión` → aprobado) | Sí |
| Utilidad clara para **otro** cliente del mismo rubro | Sí |
| Patrón no excesivamente específico | Sí |
| Consistencia con otros casos del rubro (sin contradicción grave) | Deseable |
| Aceptación por **curador BCR** (rol definido en gobernanza) | Sí |

**Salida de promoción:** blueprint versionado con linaje `derived_from_case_ids` (conceptual, interno), sin nombres de cliente en el artefacto publicado.

---

## 12. Diferencia entre caso semilla y blueprint

| Dimensión | Caso semilla | Blueprint |
|-----------|--------------|-----------|
| **Naturaleza** | Aprendizaje de un caso concreto | Patrón curado del rubro |
| **Confianza** | Inicial; depende de evidencia del caso | Acumulada; versionada |
| **Evidencia** | Conserva referencia histórica (interna) | Solo patrones generalizados |
| **Aplicación** | **No** se aplica automáticamente | **Puede sugerirse** como base al diseñar |
| **Versionado** | `version_ficha` del documento | `blueprint_v0`, `v1`, … |
| **Validación** | Aprobación como semilla | Curador + consistencia multi-caso |

**Analogía:** el caso semilla es el **diario de campo**; el blueprint es el **mapa** derivado para el siguiente viajero.

---

## 13. Plantilla Markdown de una ficha BCR

Copiar el bloque siguiente para cada nuevo caso. Reemplazar placeholders `{{...}}`.

```markdown
# Caso Semilla BCR — {{nombre_caso}}

**case_id_conceptual:** `{{case_id_conceptual}}`  
**Versión ficha:** {{version_ficha}}  
**Fecha:** {{fecha_documentacion}}  
**Operador:** {{operador}}  
**Estado entrada:** {{estado_entrada}}  
**Confidencialidad:** {{confidencialidad}}

---

## A. Identificación del caso

| Campo | Valor |
|-------|--------|
| Cliente origen | {{cliente_origen}} |
| Fuente principal | {{fuente_principal}} |
| Documento relacionado | {{ruta_doc_detallado}} |

---

## B. Clasificación por rubro

| Campo | Valor |
|-------|--------|
| Rubro | {{rubro}} |
| rubro_id | {{rubro_id}} |
| Vertical padre | {{vertical_padre}} |
| Subrubro | {{subrubro}} |
| País | {{pais}} |
| Tamaño empresa | {{tamano_empresa}} |
| Canal principal | {{canal_principal}} |
| Tipo de venta | {{tipo_venta}} |
| Complejidad | {{complejidad}} |
| B2B/B2C | {{b2b_b2c}} |
| Etiquetas | {{etiquetas}} |

---

## C. Contexto del negocio

**Resumen:** {{resumen_negocio}}

**Problema principal:** {{problema_principal}}

**Necesidad CRM:** {{necesidad_crm}}

**Proceso comercial actual:** {{proceso_comercial_actual}}

**Restricciones:** {{restricciones}}

**Sistema externo relevante:** {{sistema_externo}}

**Criterio de éxito piloto:** {{criterio_exito_piloto}}

---

## D. Estado del flujo Constructor

| Etapa | Estado | Notas |
|-------|--------|-------|
| Draft generado | {{si_no}} | |
| Simulación / snapshot | {{si_no}} | |
| Confirmación humana | {{approved_rejected}} | |
| status draft | {{status_draft}} | |
| Reunión registrada | {{si_no}} | |
| Preparación manual | {{si_no}} | |
| Plan piloto | {{si_no}} | |
| Auditoría pre-SQL | {{si_no}} | |
| Blueprint técnico | {{si_no}} | |
| Cierre documental | {{si_no}} | |
| CRM operativo activo | {{si_no}} | |

---

## E. Artefactos asociados (evidencia — no promover)

| Artefacto | Referencia interna |
|-----------|-------------------|
| draft_id | `{{draft_id}}` |
| snapshot_ids | {{snapshot_ids}} |
| meeting_decision_ids | {{meeting_decision_ids}} |
| preset_key | `{{preset_key}}` |
| package_version | {{package_version}} |

---

## F. Aprendizajes estructurales

**Qué funcionó:** {{lista}}

**Qué no funcionó:** {{lista}}

**Qué validar antes:** {{lista}}

*(Detalle por área: módulos, pipeline, campos, reportes, integración, permisos.)*

---

## G. Módulos recomendados

- {{modulo_1}}
- {{modulo_2}}

---

## H. Pipeline sugerido

> Sugerencia BCR — no configuración aplicada automáticamente.

| Orden | Etapa |
|-------|--------|
| 1 | {{etapa_1}} |
| 2 | {{etapa_2}} |

---

## I. Campos frecuentes

### Grupo {{nombre_grupo}}
- {{campo_1}}
- {{campo_2}}

---

## J. Reportes útiles

- {{reporte_1}}
- {{reporte_2}}

---

## K. Preguntas de diagnóstico

1. {{pregunta_1}}
2. {{pregunta_2}}

---

## L. Riesgos típicos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| {{riesgo}} | {{alta_media_baja}} | {{mitigacion}} |

---

## M. Integraciones relevantes

| Sistema | Modo | Escritura | Dirección | Estado |
|---------|------|-----------|-----------|--------|
| {{sistema}} | {{modo}} | {{si_no}} | {{direccion}} | {{estado}} |

---

## N. Decisiones humanas importantes

- {{decision_1}}
- **Bloqueos:** {{bloqueos}}
- **Usuarios fase 1:** {{usuarios_fase_1}}

---

## O. Qué promover a BCR

- {{item_promovible_1}}
- {{item_promovible_2}}

---

## P. Qué NO promover

- {{item_excluido_1}}
- {{item_excluido_2}}

---

## Q. Nivel de confianza

| Nivel | {{baja_media_alta}} |
| Motivo | {{motivo_confianza}} |
| Casos similares | {{conteo}} |

---

## R. Evidencia / fuentes

| Tipo | Referencia | Fecha |
|------|------------|-------|
| {{tipo_origen}} | {{referencia}} | {{fecha}} |

---

## S. Reglas de reutilización

- **Aplicación:** sugerir / adaptar / no copiar
- **Condiciones:** {{condiciones}}
- **Penalizaciones matching:** {{penalizaciones}}

---

## T. Próximos pasos

- [ ] {{accion_1}}
- [ ] Promoción a blueprint: {{si_no}} → `{{blueprint_target}}`
- [ ] Limpieza base madre: {{estado_limpieza}}

---

*Ficha BCR — solo documentación. No implica persistencia en BD ni instalación.*
```

**Convención de archivos sugerida:** `docs/constructor-crm/casos-semilla/caso-semilla-{{slug-rubro}}-{{slug-cliente}}.md`

---

## 14. Ejemplo resumido: Pickup 4x4

Referencia completa: `caso-semilla-pickup4x4-bcr.md`. Encaje en el formato:

| Sección | Valor resumido |
|---------|----------------|
| **A** | `case_id`: `semilla-pickup-4x4-2026-05`; estado: aprobado como caso semilla |
| **B** | Rubro: venta/accesorios 4x4; vertical: Automotor; complejidad: media; Uruguay |
| **C** | Venta consultiva + postventa; Kore relevante; piloto sin instalación aún |
| **D** | Draft `approved_for_pilot`, snapshot, reunión `advance_manual_preparation`, cierre 11K |
| **E** | draft `0fa4f061…`, decision `9c04f4a5…`, preset `pickup_4x4` — **no promover** |
| **F–M** | Módulos 4x4, pipeline 9 etapas, Kore RO, riesgos stock/compatibilidad |
| **O/P** | Promover patrones; no promover IDs ni leads «Prueba Pickup» |
| **Q** | Confianza **media** (un caso) |
| **T** | Siguiente: propuesta L3 limpieza tras formato BCR |

---

## 15. Ejemplo futuro: Estudio contable

Ficha **conceptual** (sin caso real documentado aún):

| Sección | Contenido sugerido |
|---------|-------------------|
| **B** | Rubro: Estudio contable; vertical: Servicios profesionales; complejidad: media-alta; etiquetas: `regulado`, `multicliente` |
| **G** | Clientes, expedientes/carpetas, tareas, vencimientos fiscales, documentación, facturación honorarios, reportes, permisos por equipo |
| **H** | Contacto → diagnóstico → propuesta honorarios → aceptado → onboarding → en curso → entregable → cerrado / perdido |
| **I** | RUT/CI, régimen tributario, servicios contratados, responsable contable, próximo vencimiento, estado carpeta |
| **J** | Carpetas por estado, vencimientos próximos, honorarios pendientes, carga por colaborador, clientes sin movimiento |
| **K** | ¿PYME o corporativo? ¿Integración con sistema de facturación? ¿Quién aprueba documentos? ¿Qué vencimientos son críticos? |
| **L** | Mezclar datos entre clientes, permisos excesivos, no registrar vencimientos, piloto sin separación de entornos |
| **M** | ERP / facturación: lectura inicial; sin escritura hasta validar |
| **Q** | Confianza **baja** hasta primer caso documentado |

---

## 16. Relación con Base Madre Duplicable

Al duplicar la base madre hacia un CRM cliente (`pickup4x4-crm-v1`, `crm-estudio-contable-v1`, etc.):

1. El **clon** lleva configuración y datos del cliente.
2. El **aprendizaje reusable** debe **volver** a la BCR de la madre (ficha + eventual blueprint), no quedarse solo en el clon.
3. Tras 30/60/90 días en el clon, actualizar la ficha (sección **F**, **Q**, fuente `uso operativo`).
4. La madre duplicable permanece **virgen** de datos vivos del cliente; solo conserva presets, docs y evidencia archivada según política de limpieza.

---

## 17. Relación con limpieza de base madre

Orden recomendado (alineado con L2 y checklist):

1. **Crear o actualizar** ficha BCR del caso.
2. **Aprobar** como caso semilla o exportar a blueprint.
3. **Registrar decisión** sobre evidencia en Supabase (conservar / archivar / eliminar).
4. **Ejecutar limpieza** solo en fases posteriores con backup y sin SQL destructivo en esta fase documental.

**Pickup 4x4:** ficha en `caso-semilla-pickup4x4-bcr.md`; limpieza de draft/snapshot pendiente de decisión explícita post-11L.

---

## 18. Relación con futuras tablas BCR

Este formato Markdown es el **contrato previo** para modelar entidades persistentes (nombres conceptuales, sin SQL):

| Tabla conceptual | Contenido típico derivado de la ficha |
|------------------|--------------------------------------|
| `crm_industry_knowledge` | Metadatos del rubro, taxonomía, confianza agregada |
| `crm_industry_blueprints` | Secciones G, H, I, J curadas y versionadas |
| `crm_industry_lessons` | Sección F (`que_funciono`, `que_no_funciono`) |
| `crm_industry_questions` | Sección K |
| `crm_industry_risks` | Sección L |
| `crm_industry_templates` | Plantillas de payload / checklist activación |

**Mapeo sección → tabla:**

- A, B, C, Q → `crm_industry_knowledge` + vínculo caso
- G, H, I, J → `crm_industry_blueprints` (JSON por bloque)
- F → `crm_industry_lessons`
- K → `crm_industry_questions`
- L → `crm_industry_risks`
- E, R → tabla de **evidencia** restringida (no expuesta al instalador)

Hasta F4 no se crean estas tablas; la ficha Markdown es la fuente de verdad.

---

## 19. Implementación por fases

| Fase | Alcance | Entregable |
|------|---------|------------|
| **F0** | Formato documental | Este documento |
| **F1** | Fichas Markdown manuales | `casos-semilla/*.md` por rubro |
| **F2** | Panel interno de casos semilla | UI listado / edición (futuro) |
| **F3** | Promoción manual a blueprint | Flujo curador, diff, versión |
| **F4** | Persistencia BCR | Tablas conceptuales §18 |
| **F5** | Sugerencias IA desde BCR | Etiquetadas, confianza acotada |
| **F6** | Métricas adopción y descarte | Peso de sugerencias por rubro |

**Fase actual del proyecto:** **F0** (definición de formato). Pickup 4x4 equivale a una ficha **F1** ad hoc previa a este estándar; puede re-etiquetarse sin cambiar contenido sustantivo.

---

## 20. Decisión actual

**Por ahora las entradas BCR se documentan como Markdown.** No existe todavía persistencia BCR en base de datos ni aplicación automática en el Constructor.

Los instaladores y el Constructor **no leen** estas fichas en runtime. Cualquier preset en código (ej. `pickup_4x4`) sigue siendo independiente hasta integración explícita en fases F3+.

---

## 21. Confirmación de alcance

En la fase que produce este documento:

- ✅ Se definió formato conceptual y plantilla copiable
- ❌ No se crearon tablas
- ❌ No se ejecutó SQL
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se modificaron datos
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se escribió en Kore ni Zeta
- ❌ No se modificó código funcional

---

*Documento Fase 11L-F0 — Formato de entrada BCR para casos semilla. Próximo paso operativo sugerido: F1 con segundo rubro (ej. estudio contable) o propuesta L3 de limpieza segura post-fichas.*
