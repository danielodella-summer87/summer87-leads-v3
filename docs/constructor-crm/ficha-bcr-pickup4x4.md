# Ficha BCR — Caso Semilla Pickup 4x4

**Formato:** Fase 11L-F1 (ficha estandarizada A–T)  
**Siglas:** BCR — Base de Conocimiento por Rubro  
**Relacionado con:** `docs/constructor-crm/formato-entrada-bcr-caso-semilla.md`, `docs/constructor-crm/caso-semilla-pickup4x4-bcr.md`, `docs/constructor-crm/base-conocimiento-por-rubro.md`, `lib/admin/installablePackagePickup4x4Preset.ts`

---

## Introducción

Esta ficha es la **entrada BCR estandarizada** del caso **Pickup 4x4**, redactada según la estructura A–T definida en `formato-entrada-bcr-caso-semilla.md`. Complementa el documento narrativo `caso-semilla-pickup4x4-bcr.md` (fase 11K) con un formato **comparable, gobernable y reutilizable** para futuros casos del mismo u otros rubros.

**No ejecuta** promoción automática a tablas BCR, persistencia en Supabase ni sugerencias en runtime del Constructor. Es documentación operativa en repositorio.

---

## A. Identificación del caso

| Campo | Valor |
|-------|--------|
| **case_id_conceptual** | `semilla-pickup-4x4-2026-05` |
| **nombre_caso** | Pickup 4x4 |
| **cliente_origen** | Pickup 4x4 |
| **fecha_documentacion** | 2026-05-17 |
| **operador** | Daniel / Summer87 |
| **estado_entrada** | aprobado como caso semilla |
| **confidencialidad** | interno |
| **fuente_principal** | package_payload + preset + snapshot + meeting decision |
| **version_ficha** | 1.0 |
| **documento_relacionado** | `docs/constructor-crm/caso-semilla-pickup4x4-bcr.md` |

---

## B. Clasificación por rubro

| Campo | Valor |
|-------|--------|
| **rubro** | Venta / accesorios 4x4 |
| **rubro_id** | *(pendiente de catálogo `rubros`)* |
| **vertical_padre** | Automotor / Retail especializado |
| **subrubro** | Accesorios 4x4 / pickup |
| **país** | Uruguay |
| **tamaño_empresa** | Pequeña / mediana — *pendiente de confirmación con cliente* |
| **canal_principal** | WhatsApp / atención comercial / local físico |
| **tipo_venta** | Consultiva + postventa |
| **complejidad** | media |
| **b2b_b2c** | mixto (B2C predominante en consultas; B2B posible en flotas) |
| **etiquetas** | `automotor`, `4x4`, `accesorios`, `postventa`, `Kore`, `read-only`, `piloto-controlado` |

---

## C. Contexto del negocio

**Resumen:** negocio orientado a **consultas comerciales**, identificación de **vehículos**, venta de **accesorios/equipamiento 4x4** y **seguimiento postventa**, con atención por canales conversacionales (WhatsApp) y presencia comercial local.

**Problema principal:** consultas y oportunidades dispersas; datos de vehículo incompletos; seguimiento irregular; riesgo de depender de sistemas externos sin validar.

**Necesidad CRM:** ordenar **oportunidades**, **cotizaciones/presupuestos**, **seguimiento comercial** y **postventa** en un pipeline único con trazabilidad por vendedor.

**Proceso comercial actual (as-is):** recepción de consultas por WhatsApp/local → calificación informal → cotización → negociación → cierre → seguimiento variable postventa.

**Restricciones:**

- Integración posible con **Kore** en modo **solo lectura** en fase inicial.
- **Primera etapa** de acceso restringida a **propietarios + Daniel / Summer87**.
- **Usuarios operativos** (vendedores) en **fase posterior**, tras estructura y permisos claros.
- Sin instalación automática ni tenant hasta decisión explícita post-preparación manual.

**Sistema externo relevante:** Kore (consulta / sincronización unidireccional conceptual).

**Criterio de éxito piloto (30 días, sugerido):** oportunidades con etapa y próxima acción definidas; % de consultas con vehículo identificado; cotizaciones trazadas; cero escrituras en Kore; reportes de seguimiento usados por propietarios.

---

## D. Estado del flujo Constructor

| Etapa / control | Estado | Notas |
|-----------------|--------|-------|
| Draft generado | ✅ | Paquete 8B-draft-v1 |
| Draft aprobado para piloto | ✅ | `approved_for_pilot` + `human_confirmation_status: approved` |
| Simulación / snapshot | ✅ | 1 snapshot asociado al draft |
| Meeting decision registrada | ✅ | `advance_manual_preparation` |
| Preparación manual controlada | ✅ | Habilitada por decisión; **no** es instalación |
| Instalación real | 🚫 Bloqueada | `installationMode: draft_only` |
| Tenant creado | 🚫 No | `tenantCreation: blocked` |
| Usuarios creados | 🚫 No | `userCreation: blocked` |
| Escritura en Kore | 🚫 No | `koreWrite: blocked` |
| Escritura en Zeta | 🚫 No | Sin uso en este caso; política no escritura |
| Plan entorno piloto | ✅ | Documentado en flujo UI / reunión |
| Auditoría pre-SQL | ✅ | Documentada (`crm_setup_config` en madre, paso auditoría) |
| Blueprint técnico | ✅ | Preset `pickup_4x4` + payload draft |
| Cierre documental | ✅ | 11K narrativo + esta ficha 11L-F1 |

**Lectura:** listo para **considerar** piloto y preparación manual; **no** CRM operativo dedicado ni producción.

---

## E. Artefactos asociados

> **Evidencia histórica interna.** Los identificadores de esta sección **no** son patrón reutilizable para otros clientes.

| Artefacto | Valor / referencia |
|-----------|-------------------|
| **draft_id** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **meeting_decision_id** | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| **preset** | `pickup_4x4` |
| **package_version** | `8B-draft-v1` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **snapshot_count** | 1 |
| **target_client_name** (manifest) | Pickup 4x4 |
| **source_file (preset)** | `lib/admin/installablePackagePickup4x4Preset.ts` |

**Documentos relacionados:**

- `docs/constructor-crm/caso-semilla-pickup4x4-bcr.md`
- `docs/constructor-crm/inventario-datos-base-madre-L1.md`
- `docs/constructor-crm/propuesta-limpieza-base-madre-L2.md`
- `docs/constructor-crm/formato-entrada-bcr-caso-semilla.md`
- `docs/constructor-crm/base-conocimiento-por-rubro.md`

**IDs de instancia no promovibles (inventario L1):** `target_client_id`, `constructor_id` del draft — solo trazabilidad interna.

---

## F. Aprendizajes estructurales

### Qué funcionó / patrones a repetir

- Un CRM de venta 4x4 debe modelar **cliente + vehículo + oportunidad** como núcleo, no solo contactos genéricos.
- Los **datos del vehículo** son críticos antes de cotizar (marca, modelo, año, uso).
- **Postventa** forma parte del ciclo comercial, no es módulo opcional tardío.
- **Kore** debe iniciar en **solo lectura**; validar datos antes de decisiones comerciales.
- El **pipeline** debe contemplar explícitamente **presupuesto/cotización** y **negociación** antes de terminales.
- La **preparación manual controlada** (post-`advance_manual_preparation`) reduce riesgo vs. instalación automática.
- **Usuarios operativos** conviene dejarlos al **final**, tras pipeline, campos y permisos base.
- **Reportes** deben priorizar **seguimiento** y **estado de oportunidades**, no solo volumen de leads.

### Qué no funcionó / anti-patrones

- Asumir stock o disponibilidad desde Kore sin campo de confianza.
- Habilitar muchos campos en v1 sin reglas de avance por etapa.
- Confundir `approved_for_pilot` con CRM ya instalado.

### Qué validar antes de activación operativa

- Identidad cliente y alcance piloto.
- Política read-only Kore firmada.
- Campos mínimos por etapa (vehículo antes de presupuesto).
- Roles y quién accede en fase 1 vs. fase 2.
- Simulación + snapshot + aprobación humana (checklist preset).

### Descartes de módulos

- Ningún módulo del preset fue marcado como descartado; futuros casos pueden omitir «Integración Kore» si no aplica.

---

## G. Módulos recomendados

| Módulo | key (referencia preset) | Nota |
|--------|-------------------------|------|
| Clientes | `clientes` | Base de contacto |
| Vehículos | `vehiculos` | Diferenciador rubro 4x4 |
| Oportunidades | `oportunidades` | Consulta → venta |
| Pipeline comercial | `pipeline_comercial` | Etapas §H |
| Cotizaciones / presupuestos | *(capacidad en oportunidades)* | Etapa presupuesto |
| Agenda / tareas | `agenda_tareas` | Seguimiento |
| Postventa | `postventa` | Ciclo completo |
| Reportes | `reportes` | §J |
| Integración Kore read-only | `integracion_kore` | Solo lectura inicial |
| Auditoría de instalación | *(proceso Constructor)* | Pre-SQL / checklist activación |

---

## H. Pipeline sugerido

> **Sugerencia BCR.** No se aplica automáticamente en ningún tenant ni draft sin acción humana explícita.

| Orden | Etapa | Terminal |
|-------|--------|----------|
| 1 | Nuevo contacto | |
| 2 | Consulta calificada | |
| 3 | Vehículo identificado | |
| 4 | Necesidad / accesorio definido | |
| 5 | Presupuesto / cotización | |
| 6 | Negociación | |
| 7 | Ganado | Sí |
| 8 | Perdido | Sí |
| 9 | Postventa | |

**Reglas de avance sugeridas:**

- No avanzar a presupuesto sin **vehículo identificado** (marca, modelo, año mínimos).
- No cerrar como ganado sin **producto/accesorio** y responsable registrados.
- Postventa obligatoria para oportunidades ganadas en piloto (medición de ciclo).

**Nota nomenclatura:** el preset usa keys como `necesidad_detectada`, `presupuesto_enviado`, `venta_ganada`; la BCR unifica etiquetas en esta ficha para legibilidad cross-caso.

---

## I. Campos frecuentes

### Cliente

| Campo | Obligatorio sugerido | Nota |
|-------|---------------------|------|
| nombre | Sí (etapa 1) | |
| teléfono / WhatsApp | Sí (etapa 1) | Canal principal |
| email | Opcional | |
| origen | Sí (etapa 2) | WhatsApp, local, referido |
| localidad | Opcional | Si aplica |
| tipo_cliente | Opcional | Particular / empresa |
| estado_comercial | Transversal | |

### Vehículo

| Campo | Obligatorio sugerido | Nota |
|-------|---------------------|------|
| marca | Sí (antes de presupuesto) | |
| modelo | Sí (antes de presupuesto) | |
| año | Sí (antes de presupuesto) | |
| versión | Opcional | Si aplica al catálogo |
| matricula | Opcional | Según negocio |
| uso del vehículo | Recomendado | Trabajo, recreación, mixto |
| accesorios_interes | Recomendado | En grupo vehículo u oportunidad |

### Oportunidad

| Campo | Obligatorio sugerido | Nota |
|-------|---------------------|------|
| accesorio / producto de interés | Sí (etapa 4) | |
| presupuesto estimado | Recomendado (etapa 5) | |
| etapa | Sí | Pipeline §H |
| vendedor / responsable | Sí (etapa 2+) | |
| próxima acción | Sí (oportunidades abiertas) | |
| fecha último contacto | Recomendado | |
| probabilidad | Opcional v1 | Evitar sobrecarga inicial |
| observaciones | Opcional | |

### Integración (Kore)

| Campo | Obligatorio sugerido | Nota |
|-------|---------------------|------|
| ID externo Kore (cliente) | Si hay sync | No promover valor real |
| ID documento Kore | Si aplica | |
| estado sincronización | Recomendado | pending / ok / error |
| confianza del dato | Recomendado | alta / media / baja |
| fuente del dato | Recomendado | Kore / manual / mixto |
| última sincronización | Recomendado | Solo lectura |

---

## J. Reportes útiles

| Reporte | Audiencia | Nota |
|---------|-----------|------|
| Oportunidades por etapa | Propietarios / comercial | Core piloto |
| Leads sin seguimiento | Comercial | Alerta operativa |
| Cotizaciones abiertas | Comercial | Presupuestos pendientes |
| Ventas ganadas / perdidas | Propietarios | Cierre período |
| Demanda por marca / modelo | Propietarios | Agregado, sin PII |
| Accesorios más consultados | Comercial / stock | |
| Seguimiento postventa | Comercial | Cierra ciclo |
| Actividad por vendedor | Propietarios | Post fase operativos |
| Alertas de datos incompletos | Comercial / admin | Calidad de dato |
| Estado de integración Kore | Técnico / admin | RO, errores sync |
| Consultas por origen | Marketing / propietarios | En preset |
| Clientes activos | Propietarios | En preset |
| Seguimiento pendiente | Comercial | En preset |

---

## K. Preguntas de diagnóstico

| # | Pregunta | Bloquea diseño |
|---|----------|-----------------|
| 1 | ¿Venden solo accesorios o también vehículos? | Sí |
| 2 | ¿Cómo reciben consultas hoy? | Sí |
| 3 | ¿Cuál es el canal principal? | Sí |
| 4 | ¿Qué datos del vehículo son obligatorios? | Sí |
| 5 | ¿Cómo se arma una cotización? | Sí |
| 6 | ¿Quién hace seguimiento? | Sí |
| 7 | ¿Qué información viene de Kore? | Sí |
| 8 | ¿Kore será solo lectura? | Sí |
| 9 | ¿Qué reportes necesitan los propietarios? | Recomendado |
| 10 | ¿Qué define éxito del piloto en 30 días? | Sí |
| 11 | ¿Quiénes acceden en primera etapa? | Sí |
| 12 | ¿Qué queda fuera de alcance? | Sí |

---

## L. Riesgos típicos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Stock o disponibilidad desactualizada | Alta | No prometer stock en v1; confianza del dato |
| Compatibilidad producto/vehículo incorrecta | Alta | Vehículo obligatorio antes de cotizar |
| Leads sin seguimiento | Alta | Reporte + agenda + próxima acción |
| Falta de datos del vehículo | Media | Reglas de avance de etapa |
| Confundir piloto con producción | Alta | Bloqueos instalación; etiquetado entorno |
| Escribir en Kore antes de validar | Alta | read-only + `koreWrite: blocked` |
| Usuarios operativos antes de estructura clara | Media | Fase 1 restringida |
| Exceso de campos en primera versión | Media | Mínimo viable por etapa |
| No medir postventa | Media | Etapa y reportes postventa |
| Depender de datos externos sin confianza | Media | Campo `confianza_dato`; validación manual |

---

## M. Integraciones relevantes

### Kore

| Aspecto | Valor |
|---------|--------|
| **Relevancia** | Principal para rubro automotriz / 4x4 en este caso |
| **Modo inicial** | read-only (`read_only_initial` en identidad cliente) |
| **Escritura externa** | No permitida |
| **Sincronización bidireccional** | No en fase inicial (`kore_to_summer87` conceptual) |
| **Validación** | Datos externos revisados antes de uso comercial |
| **Credenciales** | Pendientes (`pending_credentials`) |
| **Documentación técnica** | Pendiente antes de ejecución real |
| **Rol** | Fuente de **consulta**; Kore no se modifica desde Summer87 |

### Zeta

| Aspecto | Valor |
|---------|--------|
| **Uso en este caso** | Ninguno |
| **Política** | Mantener **no escritura**; no integrar sin caso explícito |

---

## N. Decisiones humanas importantes

| Decisión | Detalle |
|----------|---------|
| **decision** | `advance_manual_preparation` |
| **label** | Avanzar a preparación manual controlada |
| **Efecto** | Habilita preparación manual; **no** autoriza instalación ni tenant |
| **Preparar manualmente** | Antes de cualquier instalación real o clon `pickup4x4-crm-v1` |
| **No instalar automáticamente** | `installationMode: draft_only` |
| **No crear tenant todavía** | `tenantCreation: blocked` |
| **No crear usuarios todavía** | `userCreation: blocked` |
| **No escribir en Kore** | `koreWrite: blocked` |
| **No escribir en Zeta** | Sin integración; política general no escritura |
| **Primera etapa acceso** | Propietarios + Daniel / Summer87 |
| **Usuarios operativos** | Después — vendedores y roles operativos |
| **IA** | Solo análisis/recomendación; sin mensajes automáticos ni modificación Kore |

---

## O. Qué promover a BCR

Elementos aptos para curación hacia blueprint del rubro **Venta / accesorios 4x4**:

- Taxonomía del rubro (§B)
- Módulos base (§G)
- Pipeline conceptual (§H)
- Campos frecuentes por grupo (§I)
- Reportes iniciales (§J)
- Preguntas de diagnóstico (§K)
- Riesgos y mitigaciones (§L)
- Checklist integración Kore read-only (§M)
- Patrón **preparación manual controlada** post-reunión
- Criterio **usuarios al final**
- **Postventa** como etapa relevante del ciclo
- Reglas IA y no escritura externa (desde preset)

**Destino sugerido:** `blueprint_v0` rubro 4x4 / automotor retail especializado.

---

## P. Qué NO promover

- `draft_id` real (`0fa4f061-…`)
- `meeting_decision_id` real (`9c04f4a5-…`)
- Nombres internos de drafts en otros entornos (`not-resolved-in-preview`, etc.)
- Datos sensibles o PII de leads de prueba («Prueba Pickup…»)
- Credenciales Kore o endpoints con secretos
- Textos de prueba o borradores rechazados (`rejection_reason: prueba`)
- Decisiones **exclusivas** de Pickup no validadas en otro 4x4 (ej. rol `pickup_responsable_comercial` → abstraer a «responsable comercial»)
- `target_client_id` / `constructor_id` de instancia
- Datos operativos no validados en **uso real** sostenido (métricas, tasas de conversión)
- Motivo completo de reunión si contiene datos confidenciales del cliente

---

## Q. Nivel de confianza

| Campo | Valor |
|-------|--------|
| **Confianza** | **media** |
| **Motivo** | Caso muy bien documentado (draft, snapshot, reunión, preset, flujo 8x), pero **único**; aún sin validación operativa sostenida en CRM real dedicado |
| **casos_similares_conteo** | 1 |
| **uso_operativo_dias** | 0 *(CRM clon no activo)* |

**Cómo subir a alta:**

- Documentar y comparar **otro caso 4x4 / automotor** similar, o
- **30 / 60 / 90 días** de uso real en clon operativo Pickup con retro documentada.

**Cómo bajar:**

- Si las sugerencias derivadas de esta ficha son **descartadas repetidamente** en nuevos diseños del mismo rubro (registrar motivo en futura UI BCR).

---

## R. Evidencia / fuentes

| Tipo origen | Referencia | Fecha (aprox.) |
|-------------|------------|----------------|
| package_payload | Draft `0fa4f061-…` aprobado | 2026-05-14 |
| preset | `pickup_4x4` — `installablePackagePickup4x4Preset.ts` | Repo |
| snapshot | 1 snapshot en draft semilla | 2026-05 |
| meeting decision | `9c04f4a5-…` — `advance_manual_preparation` | 2026-05 |
| documento caso semilla | `caso-semilla-pickup4x4-bcr.md` | 2026-05-17 |
| inventario L1 | `inventario-datos-base-madre-L1.md` | 2026-05-17 |
| propuesta limpieza L2 | `propuesta-limpieza-base-madre-L2.md` | 2026-05-17 |
| formato entrada BCR | `formato-entrada-bcr-caso-semilla.md` | 2026-05-17 |
| auditoría pre-SQL | `crm_setup_config` (madre) | 2026-05 |
| UI Constructor | Paquetes instalables / detalle draft | 2026-05 |
| curaduría manual | Esta ficha F1 | 2026-05-17 |

---

## S. Reglas de reutilización

| Regla | Detalle |
|-------|---------|
| **Aplicación** | **Sugerir** — nunca aplicar automáticamente |
| **Adaptar al cliente** | País, catálogo, canales y si vende vehículos además de accesorios |
| **Validar país / sistema / canal** | Uruguay + Kore no es patrón universal |
| **Verificar Kore u otro ERP** | Si no hay Kore, omitir módulo integración o sustituir ERP |
| **Vehículos vs. solo accesorios** | Ajustar módulo Vehículos y obligatoriedad |
| **No copiar IDs ni nombres internos** | Usar solo bloques G–L en nuevos diseños |
| **Reunión** | Confirmar preguntas críticas §K antes de aprobar piloto |
| **Confianza en UI futura** | Mostrar **media** con motivo «1 caso documentado» |
| **Descartes / adaptaciones** | Registrar para ajustar peso del rubro (F6 futura) |

**Penalizaciones de matching sugeridas:** país distinto → bajar confianza; sin integración legacy → omitir Kore; venta solo mostrador sin WhatsApp → revisar canal y campos.

---

## T. Próximos pasos

| # | Acción | Responsable | Bloqueante |
|---|--------|-------------|------------|
| 1 | Usar esta ficha como **primera entrada BCR manual** (F1) | Summer87 | — |
| 2 | Si existe persistencia BCR (F4), **migrar** contenido como semilla | Tech | F4 |
| 3 | Antes de limpiar datos Pickup en madre: **decidir** conservar evidencia vs. archivar | Producto | L3 |
| 4 | Preparar **propuesta L3** de limpieza segura (demo/test sí; Pickup según decisión) | Producto | Paso 3 |
| 5 | Validar **otro caso automotor/4x4** para subir confianza a alta | Producto | Opcional |
| 6 | Evaluar promoción a **`blueprint_v0`** tras revisión curador | Curador BCR | Paso 5 deseable |

**Promoción blueprint:** candidato `blueprint_v0` — pendiente curación explícita, no automática.

**Limpieza base madre:** `pendiente` — no DELETE sobre draft/snapshot/decision Pickup hasta decisión post-ficha (L2 §7).

---

## Decisión actual

**Esta ficha es documental.** No implica persistencia BCR en Supabase, tablas `crm_industry_*`, ni uso automático por el Constructor en runtime. El preset `pickup_4x4` en código permanece independiente hasta integración explícita en fases F3+.

---

## Confirmación de alcance

En la fase que produce este archivo:

- ✅ Ficha BCR estandarizada A–T para Pickup 4x4
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
- ❌ No se promovió conocimiento a base de datos BCR

---

*Ficha BCR v1.0 — Caso semilla Pickup 4x4. Primera entrada manual F1 del formato 11L.*
