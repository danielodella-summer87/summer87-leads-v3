# Base de Conocimiento por Rubro — Constructor CRM Summer87

**Versión:** Fase BCR-0 (documental)  
**Siglas:** BCR — Base de Conocimiento por Rubro  
**Relacionado con:** `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md`, `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`, `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md`, `docs/PAQUETE_INSTALABLE_CRM_7W.md`, `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md`, `lib/admin/installablePackagePickup4x4Preset.ts` (preset `pickup_4x4`, referencia actual)

**Estado:** diseño funcional aprobado como dirección estratégica. **No implementa** persistencia, endpoints, UI ni lógica en runtime.

---

## 2. Resumen ejecutivo

El **Constructor CRM** de Summer87 no debe limitarse a generar paquetes instalables caso a caso. Debe evolucionar hacia una **fábrica inteligente de CRMs por rubro**: cada diseño, simulación, reunión, piloto y retroalimentación operativa deja **aprendizaje reutilizable** para el siguiente cliente del mismo tipo de negocio.

La **Base de Conocimiento por Rubro (BCR)** es el módulo conceptual que concentra ese aprendizaje. No reemplaza al Constructor ni al Instalador; los **acelera** con sugerencias trazables, gobernadas y validables por humanos.

**Ejemplo:** si Summer87 diseña un CRM para un estudio contable, la BCR captura (tras revisión) módulos, pipeline, campos, reportes, preguntas de diagnóstico, riesgos e integraciones típicas de ese rubro. Al iniciar otro estudio contable, el Constructor **sugiere** un blueprint base y artefactos derivados; el instalador **acepta, adapta o descarta** cada ítem. Nada se aplica en silencio.

El proyecto ya cuenta con piezas alineadas a esta visión:

- Flujo avanzado de borrador instalable (draft, simulación, snapshot, resumen ejecutivo, reunión, blueprint, auditoría pre-SQL, cierre documental), especialmente maduro en **Pickup 4x4**.
- **`package_payload`** como formato canónico de intercambio entre Constructor e Instalador.
- Preset controlado **`pickup_4x4`** como semilla sectorial en código.
- Catálogo operativo de **`rubros`** en leads/empresas.
- Presets sectoriales documentados (fase 7Q) con principio explícito: *el preset no reemplaza al Constructor; lo acelera*.

La BCR unifica y extiende esas piezas bajo una taxonomía de rubro, gobernanza de estados y trazabilidad de origen.

---

## 3. Principios rectores

### 3.1 Sugerir, no aplicar automáticamente

Ningún fragmento de conocimiento del rubro modifica un `package_payload`, un draft ni una configuración operativa **sin acción explícita** de un rol autorizado (instalador, curador BCR o superadmin).

### 3.2 Trazabilidad total

Cada sugerencia aceptada, adaptada o descartada debe poder vincularse a: rubro, versión del ítem de conocimiento, fuente (preset, blueprint, caso, curación manual, inferencia asistida), draft o snapshot de origen, y usuario que decidió.

### 3.3 Origen visible de la sugerencia

La UI y los artefactos exportables muestran de dónde proviene la recomendación (ej.: *Blueprint Estudio contable v2*, *Caso anonimizado PYME Uruguay*, *Preset pickup_4x4*).

### 3.4 Confianza explícita

Toda sugerencia lleva un **nivel de confianza** (alto / medio / bajo o escala 0–100) con motivo: pocos casos, país distinto, rubro similar pero no idéntico, ítem solo en borrador, etc.

### 3.5 Aprendizaje gobernado

El conocimiento atraviesa estados (`capturado` → `borrador` → `en revisión` → `aprobado` → `publicado` → `obsoleto`). La promoción a estados que alimentan sugerencias por defecto exige **validación humana**, salvo agregados estadísticos anonimizados claramente etiquetados.

### 3.6 Taxonomía de rubros

El rubro es una **entidad de catálogo** (`rubro_id`), no texto libre. Se complementa con padre/subrubro, etiquetas, país, tamaño, canal y complejidad para matching fino.

### 3.7 Anonimización y agregación

Los casos reales conservan trazabilidad interna; lo promovido al rubro **no incluye** identidad del cliente, datos personales ni secretos. Solo patrones configuracionales y lecciones narrativas anonimizadas.

### 3.8 Validación humana

La IA puede **ordenar, explicar y redactar** sugerencias a partir de conocimiento aprobado; no es fuente de verdad para inventar módulos o riesgos sin anclaje documentado.

---

## 4. Qué debe aprender el Constructor

La BCR captura conocimiento estructurado y narrativo en las siguientes dimensiones:

- **Módulos útiles:** qué módulos se habilitan con frecuencia, cuáles se rechazan y por qué.
- **Pipeline recomendado:** etapas, terminales (ganado/perdido), reglas mínimas de avance, campos obligatorios por etapa.
- **Campos frecuentes:** grupos, obligatoriedad, campos sectoriales, campos de integración.
- **Reportes importantes:** KPIs y vistas críticas para operación y reunión de piloto.
- **Tareas recurrentes:** seguimientos, agenda, postventa, checklists operativos.
- **Preguntas de diagnóstico:** las que desbloquean diseño (comercial, técnica, legal/compliance).
- **Riesgos comunes:** con severidad, mitigación y origen (simulación, reunión, operación).
- **Integraciones habituales:** ERP, mensajería, sistemas sectoriales (ej. Kore read-only en automotriz).
- **Automatizaciones posibles:** qué puede automatizarse vs. qué exige confirmación humana.
- **Objeciones comerciales:** fricciones de venta del CRM, pricing, alcance (contenido sensible; curación restringida).
- **Aprendizajes de implementación:** narrativa de qué se intentó y cómo se desplegó.
- **Qué funcionó:** patrones que se repiten en casos exitosos.
- **Qué no funcionó:** anti-patrones y errores a no repetir.
- **Qué conviene validar antes:** checklist previo a activación o piloto (usuarios, permisos, sandbox, integraciones).

Además de volcar configuración, la BCR debe registrar **decisiones explícitas** (`installer_decisions`), **warnings** de simulación, resultados Go/No-Go y **deltas** respecto al blueprint del rubro.

---

## 5. Cuándo debe capturar aprendizaje

| Momento | Qué se captura (típico) | Estado inicial sugerido |
|---------|-------------------------|-------------------------|
| **Tras diagnóstico** | Rubro, contexto (país, tamaño, B2B/B2C), preguntas hechas, gaps, riesgos tempranos | `capturado` / `borrador` |
| **Tras package generado** | Snapshot estructural de `package_payload`, preset usado, diferencias vs. blueprint | `borrador` |
| **Tras simulación** | Riesgos detectados, readiness, bloqueos, extractos del resumen ejecutivo | `borrador` → candidato a `en revisión` |
| **Tras reunión con cliente** | Decisiones, preguntas respondidas, alcance piloto, pendientes | `en revisión` (con acta humana) |
| **Tras activación** | Config efectivamente aplicada vs. package diseñado (desvíos) | `aprobado` (parcial, diseño) |
| **Tras semanas de uso** | Módulos/etapas más usados u omitidos, reportes ignorados | `aprobado` (evidencia operativa) |
| **Tras cierre / retro** | Lecciones explícitas, qué reutilizar, qué no repetir | `aprobado` → promoción a `publicado` |

**Regla:** la captura automática **nunca** publica directamente al rubro. Siempre entra como propuesta en `capturado` o `borrador` hasta curación.

---

## 6. Asociación al rubro

La BCR usa una taxonomía en capas, apoyada en el catálogo existente `rubros` donde aplique:

- **`rubro_id`:** identificador estable en catálogo (obligatorio para matching principal).
- **`rubro_nombre`:** denormalizado para búsqueda y UI.
- **Rubro padre / subrubro:** jerarquía (ej. *Servicios profesionales* → *Estudio contable*).
- **Etiquetas adicionales:** `multisede`, `integracion_erp`, `regulado`, `estacional`, etc.
- **País / región:** afecta integraciones, compliance e idioma.
- **Tamaño de empresa:** micro, PYME, mediana, enterprise.
- **Canal principal:** referidos, web, WhatsApp, mostrador, licitaciones, etc.
- **Complejidad:** baja / media / alta (derivada de módulos, integraciones y roles).
- **B2B / B2C / mixto:** condiciona pipeline y campos.

**Matching al reutilizar:**

1. Mismo `rubro_id` y contexto similar (país, tamaño).
2. Mismo rubro padre + etiquetas solapadas (confianza penalizada).
3. Rubros similares según matriz sectorial (7P), con aviso explícito al usuario.

**Separación crítica:** `caso_id` / `draft_id` (instancia, posiblemente confidencial) vs. ítems **generalizados** del rubro (anonimizados).

---

## 7. Reutilización en nuevos CRMs

Flujo propuesto al iniciar un nuevo diseño en el Constructor:

1. **Seleccionar rubro** (temprano en el flujo; autocomplete sobre catálogo).
2. **Buscar conocimiento previo** del rubro y variantes cercanas.
3. **Mostrar modelos sugeridos:** blueprints, plantillas y resumen de casos anonimizados.
4. **Sugerir por bloque:** preguntas, módulos, pipeline, campos, reportes, riesgos, integraciones.
5. Por cada ítem: mostrar **origen**, **confianza** y vista previa del fragmento.
6. Acciones del instalador: **Usar como base** | **Adaptar** | **Descartar** (motivo opcional).
7. Generar o actualizar `package_payload` **solo** con ítems aceptados.
8. Registrar **linaje:** qué ítems BCR alimentaron el paquete (`suggested_from` conceptual).

**Prioridad de fuentes** (confianza por defecto, de mayor a menor):

1. Blueprint `publicado` del mismo rubro y contexto.
2. Lección `aprobada` / `publicada` post-implementación.
3. Caso real anonimizado del rubro.
4. Preset fijo documentado o en código (ej. `pickup_4x4`).
5. Inferencia asistida por IA (siempre etiquetada; confianza acotada).

---

## 8. Reglas para evitar copia ciega

- **Nunca aplicar automáticamente** configuración heredada al nuevo cliente.
- **Mostrar origen** de cada sugerencia (tipo de fuente + versión + fecha de validación).
- **Mostrar confianza** y el motivo de su nivel.
- **Permitir adaptación** con diff visible (sugerido vs. valor actual del draft).
- **Registrar descartes** para bajar peso de sugerencias poco útiles en el rubro.
- **No copiar identidad ni datos sensibles** (nombres, RUT, credenciales, tokens).
- **Auditar divergencias:** si varios casos recientes contradicen el blueprint publicado, generar alerta de revisión al curador.
- **No mezclar verticales** sin override consciente (ej. motores de agencia en laboratorio).
- **Re-validar en reunión:** preguntas y riesgos sugeridos no se marcan como respondidos sin acta humana.

---

## 9. Categorías de conocimiento

| Categoría | Descripción |
|-----------|-------------|
| **Conocimiento general por rubro** | Narrativa del negocio, actores, ciclo comercial típico, restricciones sectoriales. |
| **Blueprints por rubro** | Fragmentos o `package_payload` completo aprobado como base reutilizable (versionado). |
| **Aprendizajes de implementación** | Post-mortem: éxitos, fracasos, validaciones previas. |
| **Preguntas por rubro** | Banco por fase (diagnóstico, reunión, técnica). |
| **Riesgos por rubro** | Catálogo con severidad y mitigación. |
| **Plantillas operativas** | Checklists, minutas, mensajes B2B (no son configuración CRM directa). |
| **Integraciones comunes** | Patrones por rubro y país (modo read-only, campos esperados). |
| **Notas comerciales** | Objeciones, mensajes, criterios de piloto (acceso restringido). |
| **Checklist de activación** | Consolidación de `activation_checklist` y checklists de reunión exitosos. |

---

## 10. Relación con `package_payload`

El `package_payload` es la **materia prima estructurada** de la BCR. La BCR **extrae, propone y compone**; no sustituye el paquete del caso.

| Bloque | Aporte a la BCR |
|--------|-----------------|
| **`client_identity`** | Taxonomía: rubro, país, tipo de negocio, sistema externo, modo integración. |
| **`crm_modules_config`** | Patrones de módulos habilitados/rechazados por rubro. |
| **`pipeline_config`** | Plantillas de etapas y reglas de seguimiento. |
| **`lead_fields_config`** | Catálogo de campos sectoriales y obligatoriedad. |
| **`reports_config`** | KPIs y reportes críticos del rubro. |
| **`integrations_config`** | Integraciones habituales y restricciones (ej. solo lectura). |
| **`activation_checklist`** | Checklists de activación validados en campo. |
| **`installer_decisions`** | **Fuente prioritaria:** decisiones humanas explícitas y deltas vs. sugerido. |

**Flujo de extracción (conceptual):**

1. Al cerrar simulación, reunión o retro → propuesta de extracción (diff vs. blueprint del rubro).
2. Instalador o curador marca: *promover al rubro* / *solo este caso* / *descartar*.
3. Solo lo promovido actualiza blueprints, lecciones, preguntas o riesgos en estado `aprobado` o superior.

Los snapshots de simulación y resúmenes ejecutivos alimentan **riesgos y preguntas**, no se copian íntegros al blueprint sin curación.

---

## 11. Relación con presets

| Concepto | Naturaleza | Mutabilidad | Rol en el flujo |
|----------|------------|-------------|-----------------|
| **Preset fijo** | Definición en código o JSON versionado con el producto (release). | Cambia con versión de producto. | Punto de partida oficial y estable. Ej.: `pickup_4x4`. |
| **Blueprint por rubro** | Configuración aprobada en BCR, evoluciona con casos reales. | Versionado en BCR (`v1`, `v2`…). | Mejor práctica validada en campo. |
| **Conocimiento acumulado** | Metadatos, frecuencias, lecciones, descartes. | Crece con cada caso. | Ajusta confianza y prioridad de sugerencias; no es JSON ejecutable directo. |
| **Caso real anonimizado** | Draft + snapshots + decisiones; trazabilidad interna. | Inmutable como evidencia. | Referencia comparativa; no se expone identidad del cliente. |
| **Plantilla operativa** | Minutas, checklists reunión, mensajes comerciales. | Curación editorial. | Acelera proceso humano; no reemplaza `package_payload`. |

**Jerarquía al crear un CRM nuevo:**

`Preset (si existe)` → merge conceptual con `Blueprint del rubro` → sugerencias de `Conocimiento acumulado` → edición humana → `package_payload` del caso.

> **El preset no reemplaza al Constructor; lo acelera.** (Alineado a `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md`.)

---

## 12. Modelo conceptual de datos (sin SQL)

Las siguientes entidades son **conceptuales**. No implican tablas creadas ni migraciones en esta fase.

### 12.1 `crm_industry_knowledge`

- **Propósito:** documento maestro del rubro en la BCR (descripción del negocio, actores, ciclo comercial, enlaces a artefactos hijos).
- **Campos conceptuales:** `id`, `rubro_id`, `rubro_nombre`, `rubro_padre_id`, `vertical`, `pais_default`, `complejidad_tipica`, `canal_principal_tipico`, `b2b_b2c`, `estado`, `version`, `resumen`, `etiquetas[]`, `ultima_revision_at`, `revisado_por`, `curador_id`.
- **Cuándo se crea:** primera formalización del rubro en BCR o promoción desde captura pasiva.
- **Cuándo se actualiza:** curación periódica, fusión de subrubros, cambio de curador.
- **Cómo se usa:** contexto del panel de rubro, explicaciones IA acotadas, índice de hijos (blueprints, lecciones, etc.).

### 12.2 `crm_industry_blueprints`

- **Propósito:** `package_payload` parcial o completo aprobado como base reutilizable del rubro.
- **Campos conceptuales:** `id`, `knowledge_id`, `nombre`, `package_fragment` (JSON), `preset_origen` (nullable), `version`, `estado`, `confianza`, `aprobado_por`, `publicado_at`, `derivado_de_draft_id` (nullable), `supersedes_id` (nullable).
- **Cuándo se crea:** promoción post-aprobación piloto, curación manual o consolidación de preset + casos.
- **Cuándo se actualiza:** nueva versión semver; la anterior pasa a `obsoleto`.
- **Cómo se usa:** acción «Usar como base» al generar package; composición modular con templates.

### 12.3 `crm_industry_lessons`

- **Propósito:** aprendizajes cualitativos y estructurados (qué funcionó, qué no, qué validar antes).
- **Campos conceptuales:** `id`, `knowledge_id`, `tipo` (`exito` | `fallo` | `validar` | `anti_patron`), `titulo`, `descripcion`, `evidencia_refs[]`, `impacto`, `estado`, `fuente` (`reunion` | `operacion` | `simulacion` | `manual`), `confianza`, `caso_origen_id` (interno, no expuesto).
- **Cuándo se crea:** cierre de caso, retrospectiva, revisión post-piloto.
- **Cuándo se actualiza:** moderación del curador; deprecación si contradice blueprint vigente.
- **Cómo se usa:** narrativa en sugerencias, checklists, alertas de divergencia.

### 12.4 `crm_industry_questions`

- **Propósito:** banco de preguntas por fase del flujo Constructor/Instalador.
- **Campos conceptuales:** `id`, `knowledge_id`, `fase` (`diagnostico` | `reunion` | `tecnica` | `legal`), `texto`, `obligatoria`, `dispara_modulo` (opcional), `frecuencia_uso`, `utilidad_score`, `estado`.
- **Cuándo se crea:** diagnóstico, minutas de reunión (ej. flujo Pickup 4x4), curación 7Q.
- **Cuándo se actualiza:** descartes repetidos bajan prioridad; respuestas frecuentes suben utilidad.
- **Cómo se usa:** wizard de diagnóstico, minuta de reunión, validación pre-piloto.

### 12.5 `crm_industry_risks`

- **Propósito:** riesgos sectoriales con mitigación y trazabilidad.
- **Campos conceptuales:** `id`, `knowledge_id`, `severidad`, `descripcion`, `mitigacion`, `origen`, `ocurrencias`, `estado`, `confianza`.
- **Cuándo se crea:** simulación, reunión, lección o curación manual.
- **Cuándo se actualiza:** tras incidentes o nuevas simulaciones del rubro.
- **Cómo se usa:** auditoría pre-instalación, badges en UI, resumen ejecutivo.

### 12.6 `crm_industry_templates`

- **Propósito:** plantillas atómicas reutilizables (pipeline, campos, reportes, checklist, integración).
- **Campos conceptuales:** `id`, `knowledge_id`, `tipo_template`, `payload`, `variante` (tamaño, país, canal), `version`, `estado`, `confianza`.
- **Cuándo se crea:** extracción desde `package_payload`, preset o blueprint descompuesto.
- **Cuándo se actualiza:** versionado; obsolescencia al publicar blueprint que las reemplaza.
- **Cómo se usa:** composición modular del blueprint; sugerencias granulares («solo pipeline», «solo campos»).

**Entidades de soporte recomendadas (conceptuales):**

- **`crm_knowledge_suggestions_log`:** registro de sugerido / aceptado / adaptado / descartado (entrenamiento de confianza).
- **`crm_knowledge_case_link`:** enlace draft ↔ ítems promovidos (auditoría interna).

---

## 13. UX propuesta

> Wireframe funcional; **no implementado** en esta fase.

### 13.1 Selección de rubro

Al iniciar diseño: selector con autocomplete sobre catálogo `rubros`, opción «subrubro pendiente de alta» y campos de contexto (país, tamaño, B2B/B2C).

### 13.2 Aviso de conocimiento previo

Banner informativo: *«Existe conocimiento para Estudio contable: 4 casos, blueprint v2 publicado, confianza alta en módulos y pipeline.»*

### 13.3 Panel de sugerencias

Panel lateral o sección dedicada con bloques colapsables: Módulos | Pipeline | Campos | Reportes | Preguntas | Riesgos | Integraciones.

Cada ítem muestra: título, badge de confianza, chip de origen, fecha de última validación.

### 13.4 Acciones por ítem

- **Usar como base:** copia el fragmento al draft actual (requiere confirmación).
- **Adaptar:** modal diff (sugerido vs. actual); al guardar, opción «¿Aportar mejora al rubro?» (roles internos).
- **Descartar:** con motivo opcional; alimenta log de descartes.

### 13.5 Origen y confianza

Siempre visibles en la fila del ítem; detalle expandible con referencia a caso anonimizado o versión de blueprint.

### 13.6 Comparación con casos anteriores

Lista anonimizada: contexto (PYME, Uruguay, B2B) y decisiones agregadas (módulos elegidos), sin nombre de cliente. Enlace a snapshot solo para roles con permiso.

### 13.7 Integración con flujo Pickup 4x4 existente

Tras simulación: bloque «¿Promover hallazgos a la BCR del rubro?» Tras reunión: importar preguntas respondidas al banco del rubro.

---

## 14. Gobernanza

### 14.1 Estados del conocimiento

| Estado | Significado |
|--------|-------------|
| **Capturado** | Extraído automáticamente del flujo; sin revisión. |
| **Borrador** | En edición por curador o instalador. |
| **En revisión** | Pendiente de aprobación explícita. |
| **Aprobado** | Válido para uso interno y sugerencias con etiqueta de no publicado. |
| **Publicado** | Disponible como sugerencia por defecto del rubro. |
| **Obsoleto / archivado** | Reemplazado o deprecado; solo consulta histórica. |

### 14.2 Roles

- **Curador de rubro:** edita y promueve conocimiento de uno o más rubros asignados.
- **Administrador BCR:** políticas globales, fusión de rubros, resolución de conflictos, publicación.
- **Instalador:** acepta/adapta/descarta sugerencias; propone promoción desde casos.
- **Superadmin Summer87:** acceso completo; sin acceso del cliente final del CRM operativo.

### 14.3 Versionado

Blueprints y templates con `version` semántica y `supersedes_id`. No se muta silenciosamente un ítem `publicado`; se publica versión nueva.

### 14.4 Nivel de confianza

Score calculado a partir de: número de casos alineados, recencia, tasa de aceptación vs. descarte, homogeneidad de contexto (país, tamaño, canal).

### 14.5 Trazabilidad

Log de sugerencias, enlaces caso ↔ ítem promovido, auditoría de divergencias blueprint vs. últimos N casos.

### 14.6 Anti-contaminación

Descartes masivos de un ítem bloquean su promoción automática. Alertas de mezcla vertical (recursos de agencia sugeridos a rubro incompatible).

---

## 15. Ejemplos por rubro

Ejemplos breves de referencia para curación inicial. No son configuración ejecutable.

### 15.1 Estudio contable

- **Módulos:** clientes/empresas, oportunidades por servicio, pipeline comercial, agenda vencimientos, reportes cartera, documentos (metadatos).
- **Pipeline:** Contacto → Calificación → Diagnóstico → Propuesta honorarios → Negociación → Ganado / Perdido → Onboarding.
- **Campos:** tipo servicio, régimen tributario, cantidad empleados, software actual, socio responsable, próxima acción.
- **Reportes:** pipeline por servicio, leads sin seguimiento, propuestas enviadas, tasa de cierre.
- **Preguntas:** ¿Qué servicios venden? ¿Cómo asignan socios? ¿Integran sistema contable? ¿SLA de respuesta?
- **Riesgos:** confundir CRM con sistema contable; datos fiscales sensibles; IA dando asesoramiento tributario.

### 15.2 Estudio legal

- **Módulos:** clientes, asuntos/expedientes, pipeline captación, agenda plazos, reportes carga por abogado.
- **Pipeline:** Consulta → Conflicto de interés → Evaluación → Propuesta → Engagement → Activo / Archivado.
- **Campos:** área de derecho, jurisdicción, urgencia, abogado líder, estado conflicto.
- **Reportes:** asuntos por etapa, tiempo en evaluación, origen de referidos.
- **Preguntas:** ¿Cómo registran plazos? ¿Separan captación de litigio? ¿Política de conflictos?
- **Riesgos:** secreto profesional; IA como consejo legal; permisos insuficientes por asunto.

### 15.3 Agencia de marketing

- **Módulos:** leads, pipeline proyectos, catálogo servicios, propuestas, reportes por canal, IA diagnóstico (validación humana).
- **Pipeline:** Nuevo lead → Calificación → Diagnóstico → Estrategia → Propuesta → Seguimiento → Ganado / Perdido.
- **Campos:** canal origen, servicio consultado, presupuesto, objetivo comercial, responsable.
- **Reportes:** leads por canal, servicios consultados, propuestas enviadas, tasa de cierre.
- **Preguntas:** ¿Retainer o proyecto? ¿Integran plataformas ads? ¿Qué packs venden?
- **Riesgos:** pack agencia en cliente no agencia; coste tokens; prompts sectoriales en vertical incorrecta (7O/7Q).

### 15.4 Venta / accesorios 4x4

- **Módulos:** clientes, vehículos, oportunidades, pipeline, agenda, postventa, reportes, integración ERP (Kore read-only).
- **Pipeline:** Nuevo contacto → Consulta calificada → Vehículo identificado → Necesidad → Presupuesto → Negociación → Ganado/Perdido → Postventa.
- **Campos:** marca, modelo, año, matrícula, accesorios, presupuesto, IDs externos, confianza de dato.
- **Reportes:** demanda por marca, cotizaciones, leads sin seguimiento, ventas ganadas/perdidas.
- **Preguntas:** responsable piloto, usuarios, endpoints API, modo read-only, criterio de éxito 30 días (ya modelado en flujo Pickup).
- **Riesgos:** compatibilidad producto incorrecta; escritura en sistemas externos sin aprobación; stock desalineado.

*Semilla actual del producto: preset `pickup_4x4` + flujo documental Pickup 4x4.*

### 15.5 Librería

- **Módulos:** clientes (colegios, mayoristas), pedidos/listas escolares, pipeline B2B, stock básico (metadato), agenda entregas.
- **Pipeline:** Consulta → Lista/colegio identificado → Cotización → Reserva → Entrega → Postventa.
- **Campos:** tipo cliente, colegio/curso, lista escolar, canal, fecha entrega crítica.
- **Reportes:** demanda por lista/colegio, pedidos pendientes, conversión por canal.
- **Preguntas:** ¿Mayorista, retail o ambos? ¿Temporada lista escolar? ¿Integran POS?
- **Riesgos:** estacionalidad extrema; mezclar pipeline retail con licitaciones institucionales.

### 15.6 Laboratorio

- **Módulos:** clientes B2B (médicos, clínicas), solicitudes, pipeline convenios, agenda toma de muestra, reportes volumen.
- **Pipeline:** Contacto → Calificación → Convenio/cotización → Alta operativa → Activo → Renovación / Baja.
- **Campos:** tipo cliente, especialidad, volumen mensual estimado, SLA resultado, matriz de precios ref.
- **Reportes:** pipeline convenios, clientes inactivos, volumen por especialidad.
- **Preguntas:** ¿B2B clínicas o walk-in? ¿Integran LIS? ¿Normativa datos de salud?
- **Riesgos:** datos clínicos en CRM comercial; IA interpretando resultados; confundir CRM con LIS.

---

## 16. Implementación por fases

| Fase | Nombre | Alcance | Entregable |
|------|--------|---------|------------|
| **F0** | Diseño funcional | Este documento; contratos conceptuales; alineación con 7Q/8B/Pickup | BCR documentada |
| **F1** | Captura pasiva | Registrar propuestas de extracción desde drafts/simulaciones sin publicar | Log conceptual + UI «promover» mínima (futuro) |
| **F2** | Plantillas curadas manualmente | Blueprints y preguntas/riesgos desde 7Q + Pickup para 2–3 rubros | Contenido `publicado` inicial |
| **F3** | Sugerencias activas | Al generar package: cargar blueprint + preset; aceptar/adaptar/descartar | Linaje en draft |
| **F4** | Aprendizaje cualitativo | Lecciones post-piloto desde `installer_decisions` y retro | Lecciones `aprobadas` |
| **F5** | Inteligencia | IA explica y ordena sugerencias **aprobadas**; no inventa módulos sin ancla | Guardrails documentados |
| **F6** | Auto-mejora | Agregados anonimizados (frecuencias, descartes) que ajustan confianza | Políticas de gobernanza automática acotada |

Cada fase posterior requiere definición explícita de persistencia y permisos; **ninguna fase de esta lista está implementada por el solo hecho de existir este documento**.

---

## 17. Decisión actual

**Por ahora no se implementa SQL ni endpoints.** La Base de Conocimiento por Rubro queda **documentada como dirección estratégica del Constructor CRM**.

Hasta una fase posterior acordada:

- No se crean tablas ni migraciones para entidades `crm_industry_*`.
- No se modifican rutas del Constructor ni `package_payload` en runtime.
- No se escribe en Kore, Zeta ni sistemas externos.
- El preset `pickup_4x4` y el flujo Pickup 4x4 siguen siendo la **referencia operativa** más madura para validar el diseño BCR en el primer piloto sectorial.

---

## 18. Confirmación de alcance

Este documento:

- **No crea tablas** ni esquema en base de datos.
- **No ejecuta SQL** ni migraciones.
- **No crea endpoints** ni contratos API implementados.
- **No modifica datos** de producción ni de borradores existentes.
- **No instala CRM** ni activa tenants.
- **No crea usuarios** ni credenciales.
- **No escribe en Kore ni en Zeta.**

Es exclusivamente un artefacto de **diseño funcional y estrategia de producto** para Summer87 Leads v3 / Constructor CRM.

---

*Última actualización: fase BCR-0 — documentación inicial.*
