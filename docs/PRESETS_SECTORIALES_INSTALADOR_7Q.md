# Presets sectoriales del Instalador CRM — Summer87 Leads v3

**Versión:** Fase 7Q (documental)  
**Relacionado con:** `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`, `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md`, `docs/DECISION_RUTAS_COMERCIALES_7M.md`

---

## 2. Propósito

El **Instalador CRM** tomará lo definido por el **Constructor** (modelo de negocio, políticas, módulos) y **sugerirá** configuraciones operativas iniciales según la **vertical** del cliente (pipeline, campos mínimos, motores IA, reportes y visibilidad de módulos). Este documento define los **primeros presets sectoriales** como referencia de producto; **no** implementa lógica en código.

---

## 3. Principio

> **El preset no reemplaza el Constructor; lo acelera.**

- **Constructor:** entiende el negocio, reglas y alcance del CRM a materializar.  
- **Preset:** sugiere una **base** coherente con la vertical (menos trabajo manual repetitivo).  
- **Instalador humano:** **valida**, ajusta y descarta lo que no aplique al cliente real.  
- **Auditoría CRM:** decide si la instancia está **lista** para pasar a **CRM operativo** con los módulos y riesgos aceptados.

---

## 4. Verticales iniciales

Los presets de esta fase cubren cinco verticales de referencia:

1. **Agencia de marketing digital**  
2. **Automotriz / accesorios**  
3. **Educación / instituciones educativas**  
4. **Servicios profesionales**  
5. **Finanzas / inversión**

Cada vertical incluye una tabla **Elemento → Recomendación** (secciones 6–10) y participa en la matriz comparativa (§11).

---

## 5. Formato común por vertical

Para cada vertical (§6–§10), la tabla usa:

| Elemento | Recomendación |
|------------|----------------|

Incluye: **pipeline sugerido**, **campos mínimos de lead**, **motores IA recomendados**, **reportes sugeridos**, **módulos visibles para cliente**, **recursos sectoriales reutilizables** (7O/7P), **qué NO activar por defecto**, **riesgos**.

---

## 6. Preset: Agencia de marketing digital

Recupera y ordena lo documentado en **7O** y **7P** (MODO EASY, Gamma, `AiLeadReport`, `commercialStrategyFlow`, `service-recommendations`, `leadsOk*`, catálogo comercial, neuroventas).

| Elemento | Recomendación |
|----------|----------------|
| **Pipeline sugerido** | Nuevo lead → Calificación → Diagnóstico → Estrategia → Propuesta → Seguimiento → **Ganado** / **Perdido** (etiquetas a mapear a pipelines configurables en instancia). |
| **Campos mínimos de lead** | Empresa; contacto; **canal de origen**; servicio consultado; **presupuesto aproximado**; rubro del cliente; **objetivo comercial**; estado web/redes; **próxima acción**; **responsable** comercial. |
| **Motores IA recomendados** | Diagnóstico comercial; investigación del prospecto; recomendación de servicios; estrategia comercial; propuesta / **Gamma**; análisis de objeciones; seguimiento (siempre con **validación humana** de salida). |
| **Reportes sugeridos** | Leads por canal; servicios más consultados; propuestas enviadas; tasa de cierre; pipeline por etapa; performance IA; campañas/leads si el modelo del cliente incluye campañas. |
| **Módulos visibles para cliente** | Leads (canónico), agenda según producto, reportes comerciales acordados, mesa de ayuda opcional; **Constructor** y **configuración avanzada** típicamente no visibles al rol cliente final. |
| **Recursos sectoriales reutilizables** | `leadsOkMacroFlow` / `leadsOkMicroFlow` y recorrido guiado; `AiLeadReport`; `commercialStrategyFlow` + APIs `commercial-strategy`; `service-recommendations`; rutas **Gamma** (`gamma-*`); catálogo comercial + APIs `services` / `service-categories`; perfiles/prompts **MODO EASY**; manual **neuroventas**. |
| **Qué NO activar por defecto** | Datos **demo**; servicios “de agencia” en instancia que **no** sea agencia; prompts MODO EASY en **otra** vertical; enlaces a rutas no canónicas como CRM principal (7M). |
| **Riesgos** | Mezclar pack agencia con cliente B2B industrial; coste de tokens Gamma; dependencia de contenidos legacy en BD; confundir preset con “verdad” comercial sin revisión. |

---

## 7. Preset: Automotriz / accesorios

Inspiración: operación tipo **Pickup 4x4** (compatibilidad vehículo/producto, stock, instalación).

| Elemento | Recomendación |
|----------|----------------|
| **Pipeline sugerido** | Nuevo lead → Calificación inicial → **Compatibilidad vehículo/producto** → Cotización → **Coordinación instalación/retiro** → Seguimiento → **Ganado** / **Perdido**. |
| **Campos mínimos de lead** | Nombre/contacto; teléfono/WhatsApp; canal origen; **marca / modelo / año** vehículo; producto consultado; **disponibilidad/stock**; instalación o retiro; próxima acción; responsable; observaciones. |
| **Motores IA recomendados** | Clasificación de consulta; compatibilidad producto/vehículo; recordatorio de seguimiento; detección de riesgo por demora; sugerencia de productos relacionados (**sin** sustituir fichas técnicas oficiales). |
| **Reportes sugeridos** | Productos más consultados; canales con más leads; leads sin seguimiento; cotizaciones enviadas; ventas ganadas/perdidas; demanda por marca/modelo; tiempos de respuesta. |
| **Módulos visibles para cliente** | Leads, catálogo de productos (si aplica), agenda de instalaciones/retiros, reportes operativos; sin módulos de campaña digital salvo que el negocio los use. |
| **Recursos sectoriales reutilizables** | Pipelines y campos de producto/stock; plantillas de cotización; reportes de demanda; **no** reutilizar MODO EASY ni flujos de propuesta tipo agencia sin adaptación. |
| **Qué NO activar por defecto** | Motores de **propuesta de agencia**; reportes de **campaña** si no aplican; prompts **MODO EASY** de agencia; Gamma orientado a servicios intangibles sin revisión. |
| **Riesgos** | Datos de compatibilidad incorrectos (responsabilidad legal); stock desalineado con ERP; IA que “confirme” ajuste mecánico sin técnico. |

---

## 8. Preset: Educación / instituciones educativas

| Elemento | Recomendación |
|----------|----------------|
| **Pipeline sugerido** | Nueva consulta → Calificación → **Carrera/programa de interés** → Envío de información → Entrevista/reunión → Inscripción → **Matriculado** / **Perdido**. |
| **Campos mínimos de lead** | Nombre aspirante; responsable/familiar si aplica; teléfono/WhatsApp; email; **programa de interés**; sede/modalidad; **período de ingreso**; canal origen; próxima acción; responsable admisiones. |
| **Motores IA recomendados** | Calificación de intención; recomendación de programa (orientativa); seguimiento por WhatsApp (borradores); detección de abandono; resumen para admisiones. |
| **Reportes sugeridos** | Consultas por programa; leads por canal; tasa de inscripción; embudo admisiones; próximos seguimientos; motivos de pérdida. |
| **Módulos visibles para cliente** | Leads/admisiones, agenda de visitas/open days, reportes de embudo; neuroventas solo si se adapta el contenido a admisiones. |
| **Recursos sectoriales reutilizables** | Flujos de seguimiento genéricos; plantillas de email; parte de reportes de embudo reutilizable desde motor comercial genérico. |
| **Qué NO activar por defecto** | Servicios de **agencia**; productos **automotrices**; motores de **stock**; MODO EASY agencia. |
| **Riesgos** | Tratamiento de datos menores (consentimientos); mensajes IA que comprometan políticas de admisión; confidencialidad en entrevistas. |

---

## 9. Preset: Servicios profesionales

Ejemplos: estudios jurídicos, contadores, consultoras, clínicas no médicas (según marco legal).

| Elemento | Recomendación |
|----------|----------------|
| **Pipeline sugerido** | Nueva consulta → Calificación → **Relevamiento** → Reunión → **Propuesta / honorarios** → Seguimiento → **Cliente** / **No avanza**. |
| **Campos mínimos de lead** | Nombre; contacto; **motivo de consulta**; **urgencia**; **área de servicio**; documentación disponible (sí/no + tipo); próxima acción; responsable. |
| **Motores IA recomendados** | Clasificación de consulta; resumen del caso (no dictamen); detección de urgencia; **checklist** documental; borrador de propuesta/honorarios para revisión profesional. |
| **Reportes sugeridos** | Consultas por área; tiempos de respuesta; casos abiertos; propuestas enviadas; conversiones. |
| **Módulos visibles para cliente** | Leads/casos, agenda, reportes operativos; módulos sensibles solo con rol adecuado. |
| **Recursos sectoriales reutilizables** | Parte del flujo comercial y de propuesta de **agencia** puede adaptarse a “propuesta de mandato” con copy y prompts revisados (**5** decisión Daniel / compliance). |
| **Qué NO activar por defecto** | Automatizaciones sensibles **sin** revisión humana; IA que emita **asesoramiento legal/financiero/médico definitivo**; MODO EASY sin adaptación ética y legal. |
| **Riesgos** | Responsabilidad profesional; secreto profesional; retención de documentos. |

---

## 10. Preset: Finanzas / inversión

| Elemento | Recomendación |
|----------|----------------|
| **Pipeline sugerido** | Nueva consulta → Calificación → **Perfil de inversor** → Reunión → **Documentación / KYC** → Propuesta → Seguimiento → **Cliente** / **No avanza**. |
| **Campos mínimos de lead** | Nombre; contacto; país; **tipo de interés**; monto aproximado; horizonte; **perfil de riesgo** (auto-declarado); estado documentación/KYC; próxima acción; responsable. |
| **Motores IA recomendados** | Clasificación de oportunidad; checklist documental; **resumen de perfil** (no clasificación regulatoria); alertas de **riesgo operativo** (demoras, faltantes); reporte ejecutivo interno. |
| **Reportes sugeridos** | Oportunidades por país; monto potencial agregado; etapa KYC; reuniones agendadas; seguimientos pendientes. |
| **Módulos visibles para cliente** | Pipeline acotado al rol; sin promesas de rentabilidad en UI genérica; reportes para compliance interno. |
| **Recursos sectoriales reutilizables** | Estructuras de checklist y seguimiento reutilizables desde otros verticales con **re-entrenamiento** de prompts y disclaimers. |
| **Qué NO activar por defecto** | **Recomendaciones financieras automáticas**; promesas de rentabilidad; decisiones de inversión **sin** validación humana y marco legal. |
| **Riesgos** | Cumpl normativo (KYC/AML según jurisdicción); comunicaciones IA mal interpretadas como asesoramiento personalizado licenciado. |

---

## 11. Matriz comparativa

| Vertical | Pipeline (resumen) | IA prioritaria | Reportes clave | Riesgo principal |
|----------|-------------------|----------------|----------------|------------------|
| **Agencia marketing digital** | Calificación → diagnóstico → estrategia → propuesta | Investigación, diagnóstico, servicios, Gamma, objeciones | Canales, propuestas, cierre, pipeline, IA | Mezclar pack con no-agencia |
| **Automotriz / accesorios** | Compatibilidad → cotización → instalación | Clasificación consulta, compatibilidad, demora | Productos, stock, cotizaciones, marca/modelo | Compatibilidad/stock incorrectos |
| **Educación** | Programa → info → entrevista → inscripción | Intención, abandono, resumen admisiones | Programas, embudo, pérdidas | Datos menores, políticas admisión |
| **Servicios profesionales** | Relevamiento → honorarios | Resumen caso, urgencia, checklist, borrador propuesta | Áreas, tiempos, propuestas | Responsabilidad profesional |
| **Finanzas / inversión** | Perfil → KYC → propuesta | Clasificación, checklist, alertas operativas | KYC, montos, seguimientos | Cumplimiento y asesoramiento no licenciado |

---

## 12. Cómo lo usará el Instalador

1. El **Constructor** detecta la vertical o el **instalador** la elige explícitamente.  
2. El sistema **sugiere** el preset asociado (tablas §6–§10).  
3. El **instalador** acepta, ajusta o descarta ítem por ítem (pipelines, campos, módulos, IA).  
4. La **auditoría** valida riesgos, permisos y datos mínimos.  
5. El instalador **materializa** el CRM operativo (instancia).  
6. El **cliente** usa solo los módulos y reportes acordados para su rol.

---

## 13. Reglas de seguridad del preset

- Ningún preset activa IA con **decisiones finales** sustitutivas de un profesional o del cliente.  
- Todo motor **sensible** (legal, financiero, salud, inversión, compatibilidad técnica) requiere **validación humana** explícita en el flujo.  
- Los presets son **sugerencias**, no configuración obligatoria.  
- **No** mezclar recursos sectoriales entre verticales **sin** confirmación del instalador y criterio de producto (alineado con 7O/7P).

---

## 14. Próxima fase sugerida (7R)

Elegir una línea (o desglosar en subtareas):

- **Fase 7R — Matriz de activación del Instalador CRM** (qué se enciende por vertical en JSON/config y orden de pasos).  
- **Fase 7R — Primer modelo técnico del botón “Crear CRM para [empresa]”** (contrato API + estados + rollback).

---

*Fin del documento — Fase 7Q.*
