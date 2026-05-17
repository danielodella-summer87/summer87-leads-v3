# Caso Semilla Pickup 4x4 — Base de Conocimiento por Rubro

**Versión:** Fase 11K (documental)  
**Siglas:** BCR — Base de Conocimiento por Rubro  
**Relacionado con:** `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/propuesta-limpieza-base-madre-L2.md`, `docs/constructor-crm/checklist-limpieza-base-madre.md`, `lib/admin/installablePackagePickup4x4Preset.ts`

**Estado:** caso semilla formalizado en documento. **No implica** promoción automática a tablas BCR, persistencia ni aplicación en runtime.

---

## 2. Resumen ejecutivo

**Pickup 4x4** es el **primer caso semilla** del Constructor CRM Summer87 para el rubro **venta / accesorios 4x4**. Recorrió el flujo instalable más maduro del producto (draft 8B, simulación, snapshot, reunión, blueprint, auditoría pre-SQL y cierre documental) y dejó un **preset controlado** (`pickup_4x4`) en código como punto de partida sectorial.

Su aprendizaje — módulos, pipeline, campos, reportes, integración Kore read-only, riesgos y preguntas de diagnóstico — debe **conservarse y abstraerse** hacia la BCR **antes** de cualquier limpieza de la base madre que toque el draft, el snapshot o la decisión de reunión asociados.

Este documento **formaliza** ese aprendizaje como conocimiento reutilizable. **No borra ni modifica** datos en Supabase ni promueve filas a una base BCR inexistente en producción.

---

## 3. Estado del caso

| Artefacto / etapa | Estado observado | Notas |
|-------------------|------------------|-------|
| Draft aprobado para piloto | ✅ Completado | `approved_for_pilot` + confirmación humana `approved` |
| Snapshot de simulación asociado | ✅ 1 snapshot | Acoplado al draft semilla |
| Meeting decision registrada | ✅ Completado | `advance_manual_preparation` |
| Preparación manual controlada | ✅ Habilitada por decisión | No equivale a instalación |
| Plan de entorno piloto | ✅ Documentado en flujo UI | Checklist reunión Pickup |
| Plan ejecutable bloqueado | ✅ Política explícita | `tenantCreation`, `userCreation`, `externalWrites` bloqueados en preset |
| Diseño técnico | ✅ En `package_payload` + preset | Modelo 8B |
| Blueprint técnico | ✅ Derivado del preset + draft | Candidato `blueprint_v0` rubro 4x4 |
| Especificación de migración futura | 📋 Conceptual | Para CRM operativo duplicado, no ejecutada |
| Auditoría pre-SQL | ✅ Recorrida en flujo Constructor | `crm_setup_config` en paso `auditoria` (madre) |
| Resumen ejecutivo final | ✅ Generado en flujo 8x | Export UI / minuta |
| Cierre documental | ✅ Esta fase 11K | Caso exportado a BCR narrativa |

**Lectura de producto:** Pickup está **listo para ser considerado en piloto controlado**, no **instalado** ni **operativo** en un tenant dedicado.

---

## 4. Identificadores relevantes

| Clave | Valor |
|-------|--------|
| **draft_id** | `0fa4f061-cdd1-4693-a20a-9ff5e92ca999` |
| **meeting_decision_id** | `9c04f4a5-774e-4e8a-8654-a2f49ae297ea` |
| **preset** | `pickup_4x4` |
| **package_version** | `8B-draft-v1` |
| **status** | `approved_for_pilot` |
| **human_confirmation_status** | `approved` |
| **target_client_name** (manifest) | Pickup 4x4 |
| **client_identity_name** | Pickup 4x4 |

> Estos IDs son **evidencia histórica** del caso en la base madre. No deben promoverse como plantilla reutilizable en otros clientes (ver §16).

---

## 5. Rubro y clasificación BCR

| Dimensión | Valor propuesto |
|-----------|-----------------|
| **Rubro** | Venta / accesorios 4x4 |
| **Vertical padre** | Automotor / Retail especializado |
| **Tipo de negocio** | Venta consultiva + postventa |
| **Canal probable** | WhatsApp / atención comercial / local físico |
| **Complejidad** | Media |
| **Integración relevante** | Kore read-only |
| **Estado BCR** | Caso semilla / **blueprint v0 candidato** |
| **País de referencia (caso)** | Uruguay (preset) |

---

## 6. Aprendizajes estructurales

Pickup 4x4 aporta al Constructor y a la BCR los siguientes aprendizajes **estructurales** (patrones, no datos vivos):

| Área | Aprendizaje |
|------|-------------|
| **Módulos CRM útiles** | Clientes, vehículos, oportunidades, pipeline, agenda/tareas, postventa, reportes, integración Kore RO |
| **Pipeline comercial** | Etapas desde contacto hasta postventa, con terminales ganado/perdido |
| **Campos** | Grupos Cliente, Vehículo, Oportunidad y Kore; obligatoriedad progresiva por etapa |
| **Reportes iniciales** | Por etapa, origen, presupuestos, ganadas/perdidas, seguimiento, sync Kore |
| **Integración Kore** | Modo inicial solo lectura; sin escritura externa en fase piloto |
| **Permisos** | Roles diferenciados; usuarios operativos **al final** del despliegue |
| **Postventa** | Etapa terminal de seguimiento como parte del ciclo, no opcional |
| **Auditoría pre-SQL** | Checklist antes de considerar instalación real |
| **Gobernanza** | Aprobación humana, simulación + snapshot, decisión de reunión antes de preparación manual |
| **IA** | Solo análisis/recomendación; sin mensajes automáticos ni escritura en Kore |

---

## 7. Módulos recomendados derivados del caso

Módulos sugeridos para el rubro (alineados con preset `pickup_4x4`):

- Clientes
- Vehículos
- Oportunidades
- Pipeline comercial
- Cotizaciones / presupuestos (como capacidad dentro de oportunidades)
- Agenda / seguimiento
- Postventa
- Reportes
- Integración Kore read-only
- Auditoría de instalación

---

## 8. Pipeline sugerido derivado

Pipeline **conceptual** derivado del caso (sugerencia BCR; **no** configuración aplicada automáticamente en ningún tenant):

| Orden | Etapa |
|-------|--------|
| 1 | Nuevo contacto |
| 2 | Consulta calificada |
| 3 | Vehículo identificado |
| 4 | Necesidad / accesorio definido |
| 5 | Presupuesto / cotización |
| 6 | Negociación |
| 7 | Ganado |
| 8 | Perdido |
| 9 | Postventa |

**Nota:** el preset en código usa etiquetas cercanas (`necesidad_detectada`, `presupuesto_enviado`, `venta_ganada`, etc.). La BCR puede unificar nomenclatura en una versión `blueprint_v1` sin tocar este caso hasta validación humana.

---

## 9. Campos frecuentes derivados

Campos conceptuales reutilizables para el rubro:

| Grupo | Campos |
|-------|--------|
| **Cliente** | nombre cliente, teléfono / WhatsApp, email, localidad, tipo de cliente, origen, estado comercial |
| **Vehículo** | marca vehículo, modelo vehículo, año, matrícula, tipo de uso, accesorio o producto de interés |
| **Oportunidad** | producto/servicio, presupuesto estimado, vendedor / responsable, etapa, próxima acción, fecha límite, observaciones |
| **Integración** | ID externo Kore si aplica, documento Kore, última sincronización, fuente del dato, confianza del dato |
| **Seguimiento** | estado del seguimiento (transversal) |

---

## 10. Reportes útiles derivados

- Oportunidades por etapa
- Leads sin seguimiento / seguimiento pendiente
- Cotizaciones abiertas / presupuestos enviados
- Ventas ganadas / perdidas
- Demanda por marca / modelo (agregado)
- Accesorios más consultados
- Seguimiento postventa
- Actividad por vendedor
- Alertas de datos incompletos
- Datos sincronizados desde Kore (solo lectura)

---

## 11. Preguntas de diagnóstico reutilizables

Preguntas para futuros clientes del rubro (y para validar el blueprint):

1. ¿Venden solo accesorios o también vehículos?
2. ¿Cómo reciben consultas hoy?
3. ¿Cuál es el canal principal de contacto?
4. ¿Qué datos del vehículo son obligatorios?
5. ¿Cómo se arma una cotización?
6. ¿Quién hace seguimiento?
7. ¿Qué información viene de Kore?
8. ¿Kore será solo lectura?
9. ¿Qué reportes necesitan los propietarios?
10. ¿Qué define éxito del piloto en 30 días?
11. ¿Quiénes acceden en primera etapa?
12. ¿Qué queda fuera de alcance?

*(El flujo UI Pickup incluye checklist de reunión ampliado; estas doce son el núcleo BCR portable.)*

---

## 12. Riesgos típicos del rubro

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Stock o disponibilidad desactualizada | Presupuestos incorrectos | No prometer stock en v1; marcar confianza del dato |
| Compatibilidad producto/vehículo incorrecta | Reclamos postventa | Campos vehículo obligatorios antes de cotizar |
| Leads sin seguimiento | Pérdida de venta | Reporte seguimiento pendiente + agenda |
| Falta de datos del vehículo | Cotización inválida | Regla de avance de etapa |
| Confundir piloto con producción | Expectativas erróneas | Etiquetar entorno piloto; bloquear instalación automática |
| Escribir en Kore antes de validar | Daño en sistema legado | Kore read-only + `koreWrite: blocked` |
| Usuarios operativos antes de estructura clara | Caos de permisos | Usuarios operativos al final |
| Exceso de campos en primera versión | Baja adopción | Mínimo viable por etapa |
| No medir postventa | No se cierra el ciclo | Etapa y reportes postventa desde diseño |

---

## 13. Integración Kore read-only

| Principio | Detalle |
|-----------|---------|
| **Relevancia** | Kore es la integración sectorial principal del caso automotriz/4x4 |
| **Modo inicial** | Solo lectura (`read_only` / `read_only_initial`) |
| **Escritura externa** | No permitida en fase piloto |
| **Sincronización** | Unidireccional conceptual: Kore → Summer87; **no** bidireccional inicial |
| **Validación** | Datos externos deben validarse antes de usarse en decisiones comerciales |
| **Credenciales** | Pendientes (`pending_credentials` en preset); documentación técnica antes de ejecución real |
| **IA** | No puede modificar Kore ni crear ventas/documentos automáticos |

---

## 14. Decisiones humanas importantes

| Decisión / política | Significado |
|---------------------|-------------|
| **`advance_manual_preparation`** | Avanzar a preparación manual controlada — habilita planificación, **no** instalación |
| **Preparación manual controlada** | Siguiente fase operativa sin generador automático de tenant |
| **Usuarios operativos al final** | Primera etapa: propietarios + Daniel / Summer87 |
| **No instalar automáticamente** | `installationMode: draft_only` |
| **No crear tenant todavía** | `tenantCreation: blocked` |
| **No crear usuarios todavía** | `userCreation: blocked` |
| **No escribir en Kore ni Zeta** | `externalWrites` / `koreWrite` bloqueados |
| **Aprobación para piloto** | `approved_for_pilot` = listo para **considerar** piloto, no CRM en producción |

**Meeting decision registrada:** label *Avanzar a preparación manual controlada*; motivo (preview): *Pickup 4x4 cuenta con un paquete CRM…* (texto completo en BD / UI, no reproducido aquí para evitar arrastre de datos sensibles).

---

## 15. Qué se debe promover a BCR

Elementos **aptos** para promoción conceptual (curación humana → estado `borrador` / `publicado` en futura BCR):

- Rubro y taxonomía (§5)
- Módulos base 4x4 (§7)
- Pipeline sugerido (§8)
- Campos frecuentes (§9)
- Reportes iniciales (§10)
- Preguntas de diagnóstico (§11)
- Riesgos del rubro (§12)
- Checklist de integración Kore read-only (§13)
- Reglas de no escritura externa
- Criterio de usuarios al final
- Patrón de preparación manual controlada post-reunión

**Fuente de promoción sugerida:** `preset pickup_4x4` (código versionado) + este documento + fragmentos anonimizados del `package_payload` del draft (export manual privado si hace falta detalle).

---

## 16. Qué NO debe promoverse automáticamente

- IDs reales de drafts, snapshots, decisiones o UUIDs de cliente/constructor de prueba
- Nombres internos de drafts en otros entornos
- Datos personales de leads de prueba («Prueba Pickup…»)
- Textos de prueba o `rejection_reason: prueba` de otros drafts
- Credenciales Kore o endpoints no documentados
- Detalles ultra-específos de Pickup que no se validen en otro caso 4x4/automotor
- Decisiones que solo aplican a Pickup sin revisión (ej. nombres de roles `pickup_responsable_comercial` → abstraer a «responsable comercial» en BCR)

---

## 17. Estado recomendado del aprendizaje

| Campo | Valor |
|-------|--------|
| **Estado** | Caso semilla |
| **Confianza** | Media |
| **Motivo** | Un solo caso documentado; sin uso operativo sostenido en CRM dedicado |
| **Siguiente paso para subir confianza** | Validar patrones en otro caso 4x4/automotor **o** tras 30–60 días de uso real del piloto Pickup |

---

## 18. Relación con limpieza de base madre

Antes de limpiar en Supabase el draft `0fa4f061…`, su snapshot o la meeting decision `9c04f4a5…`, el equipo debe decidir explícitamente:

| Opción | Cuándo |
|--------|--------|
| **Conservar como evidencia histórica** | Mientras no exista segundo caso ni clon operativo |
| **Exportar a documento** | ✅ Hecho en esta fase 11K (este archivo) |
| **Promover a BCR** | Curación humana de §15 en futura persistencia BCR |
| **Trasladar al futuro CRM operativo** | Al duplicar `pickup4x4-crm-v1` |
| **Archivar antes de limpiar la madre** | Cuando la madre deba quedar virgen y el aprendizaje ya esté en BCR/repo |

**Regla:** no ejecutar DELETE sobre artefactos Pickup hasta cerrar esta decisión (alineado con `propuesta-limpieza-base-madre-L2.md`).

---

## 19. Relación con base madre duplicable

Pickup 4x4 **valida** el Constructor (flujo 8x, preset, reunión, auditoría) pero la **base madre duplicable** no debe quedar atada a un único cliente.

| Separación | Acción |
|------------|--------|
| **En la madre** | Evidencia temporal del caso semilla (draft/snapshot/decision) |
| **En repo / BCR** | Conocimiento reutilizable (preset + este documento + futuros blueprints) |
| **En clon operativo** | Datos y configuración del cliente Pickup cuando exista `pickup4x4-crm-v1` |

El aprendizaje debe vivir como **conocimiento**, no como dato vivo mezclado en la plantilla virgen que se duplique hacia otros rubros.

---

## 20. Próxima fase sugerida

| Fase | Objetivo |
|------|----------|
| **11L — Formato conceptual de entrada BCR para casos semilla** | Plantilla única (rubro, módulos, pipeline, riesgos, confianza, promoción/no promoción) para el 2.º caso y para curadores |
| **11L — Propuesta L3 de limpieza segura** | Plan ejecutable acotado post-export Pickup: qué filas demo sí pueden limpiarse y bajo qué backup |

### Recomendación

**Primero:** diseñar el **formato conceptual de entrada BCR** (11L). Este documento ya captura Pickup de forma narrativa; el molde estandariza qué extraer del próximo caso y qué criterios exige la limpieza L3 antes de borrar evidencia en madre.

**Después:** **propuesta L3** de limpieza segura, con Pickup ya exportado y criterios de promoción claros.

---

## 21. Confirmación de alcance

En la fase **11K** que produce este archivo:

- ✅ Se creó documentación estratégica y operativa
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se ejecutó SQL
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional
- ❌ No se promovió conocimiento a tablas BCR en base de datos

---

*Documento generado como entregable Fase 11K — Exportar aprendizaje Pickup 4x4 a BCR (narrativa). Revisión humana recomendada antes de archivar evidencia en Supabase.*
