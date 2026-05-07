# Contrato técnico — IA real del Constructor CRM

## 1. Objetivo

Este contrato define cómo una futura IA real podrá asesorar el Constructor CRM de Summer87 Leads v3 sin reemplazar automáticamente la decisión humana.

Hoy el Constructor ya cuenta con asistentes locales basados en reglas TypeScript en Empresa, Cuestionario comercial, Diagnóstico comercial, Proceso y pipeline, Motores IA y Reportes. Esas reglas son determinísticas, no llaman a OpenAI y aplican cambios solo cuando el usuario hace click.

La IA real debe ser una capa posterior sobre ese patrón: debe sugerir, explicar y ayudar a detectar inconsistencias, pero no ejecutar cambios, guardar datos, activar el CRM ni modificar configuración crítica sin aprobación explícita del usuario.

## 2. Principios de diseño

- Sugerir, no sobrescribir: la IA propone cambios, pero el estado local y la persistencia solo cambian por acción explícita del usuario.
- Validación humana obligatoria: toda sugerencia aplicada debe pasar por una decisión humana visible.
- Transparencia: cada sugerencia debe explicar por qué se propone y qué contexto utilizó.
- Contexto acumulado: la IA debe usar Empresa, Cuestionario, Diagnóstico, Pipeline, Motores IA y Reportes cuando estén disponibles.
- Seguridad: la IA no debe activar CRM, modificar permisos, tocar Supabase directamente ni cambiar datos críticos sin confirmación.
- Reversibilidad: toda sugerencia debe poder ignorarse, editarse antes de aplicar o descartarse sin efectos secundarios.
- Trazabilidad: en una fase futura se deberían registrar sugerencias aceptadas, rechazadas y editadas.
- Modo prototipo: el endpoint futuro debe respetar que el setup actual tiene un modo prototipo controlado y no debe ampliarlo ni depender de bypasses en producción.

## 3. Endpoint futuro propuesto

Endpoint propuesto:

```txt
POST /api/admin/constructor/assist
```

Este endpoint todavía no debe implementarse. El objetivo de este documento es definir el contrato antes de escribir código, conectar OpenAI o modificar el frontend actual.

## 4. Casos de uso del endpoint

El endpoint futuro debería soportar al menos estos casos:

- Sugerencia por campo: revisar un valor puntual, como `pais`, `vertical` o `metricas`.
- Sugerencia por paso completo: analizar el formulario completo de un paso y proponer mejoras.
- Validación de coherencia: revisar si Empresa, Cuestionario, Diagnóstico, Pipeline, Motores IA y Reportes cuentan una historia consistente.
- Detección de datos faltantes: identificar campos incompletos o insuficientes para activar etapas posteriores.
- Detección de contradicciones: detectar, por ejemplo, venta consultiva sin diagnóstico/reunión o reportes ejecutivos sin métricas directivas.
- Recomendación de rubros/segmentos: sugerir segmentos para educación, limpieza u otros verticales.
- Sugerencia de pipeline: proponer etapas, columnas y reglas de avance.
- Sugerencia de motores IA: proponer motores, inputs, outputs y validación humana.
- Sugerencia de reportes: proponer reportes por rol, frecuencia, métrica y alerta.
- Preparación de informe para cliente: sugerir notas de validación, preguntas pendientes y resumen de coherencia.

## 5. Payload de entrada

Ejemplo de request:

```json
{
  "mode": "field_suggestion",
  "step": "empresa",
  "field": "pais",
  "value": "Quito",
  "currentForm": {},
  "constructorContext": {
    "empresa": {},
    "cuestionario": {},
    "documentos": {},
    "diagnostico": {},
    "proceso_pipeline": {},
    "motores_ia": {},
    "reportes": {}
  },
  "metadata": {
    "source": "constructor",
    "locale": "es-UY",
    "prototypeMode": true
  }
}
```

Campos:

- `mode`: indica el tipo de asistencia solicitada, por ejemplo sugerencia de campo, revisión de paso o chequeo de coherencia.
- `step`: paso del Constructor sobre el que se está pidiendo asistencia.
- `field`: campo puntual a revisar. Es opcional para revisiones de paso completo o coherencia global.
- `value`: valor actual del campo cuando aplica.
- `currentForm`: estado local actual del paso visible. Debe enviarse normalizado y sin secretos.
- `constructorContext`: setup acumulado disponible desde pasos anteriores y posteriores guardados.
- `metadata.source`: origen de la solicitud. Para este flujo debería ser `constructor`.
- `metadata.locale`: idioma/región esperada para tono, ejemplos y formato.
- `metadata.prototypeMode`: marca si el entorno aún opera bajo modo prototipo. No autoriza acciones peligrosas.

## 6. Tipos TypeScript propuestos

```ts
type ConstructorAssistMode =
  | "field_suggestion"
  | "step_review"
  | "coherence_check"
  | "missing_data_check"
  | "client_report_review";

type ConstructorStep =
  | "empresa"
  | "cuestionario"
  | "documentos"
  | "diagnostico"
  | "proceso_pipeline"
  | "motores_ia"
  | "reportes"
  | "auditoria";

type ConstructorAISuggestionType =
  | "correction"
  | "enrichment"
  | "warning"
  | "missing_data"
  | "contradiction"
  | "process_advice"
  | "report_advice"
  | "ai_engine_advice"
  | "client_validation_note";

type ConstructorAISuggestionSeverity = "low" | "medium" | "high" | "blocker";

type ConstructorAISource = "local" | "ai";

type ConstructorAssistRequest = {
  mode: ConstructorAssistMode;
  step: ConstructorStep;
  field?: string;
  value?: unknown;
  currentForm: Record<string, unknown>;
  constructorContext: {
    empresa?: Record<string, unknown>;
    cuestionario?: Record<string, unknown>;
    documentos?: Record<string, unknown>;
    diagnostico?: Record<string, unknown>;
    proceso_pipeline?: Record<string, unknown>;
    motores_ia?: Record<string, unknown>;
    reportes?: Record<string, unknown>;
  };
  metadata: {
    source: "constructor";
    locale: string;
    prototypeMode: boolean;
    requestId?: string;
  };
};

type ConstructorAISuggestion = {
  id: string;
  type: ConstructorAISuggestionType;
  severity: ConstructorAISuggestionSeverity;
  title: string;
  message: string;
  reason: string;
  targetStep: ConstructorStep;
  targetField?: string;
  suggestedValue?: unknown;
  suggestedPatch?: Record<string, unknown>;
  requiresHumanApproval: boolean;
  confidence: number;
  source: ConstructorAISource;
};

type ConstructorAssistResponse = {
  ok: boolean;
  suggestions: ConstructorAISuggestion[];
  warnings: string[];
  metadata: {
    model: string;
    prototypeMode: boolean;
    requestId?: string;
  };
};
```

## 7. Respuesta esperada

Ejemplo de response:

```json
{
  "ok": true,
  "suggestions": [
    {
      "id": "sug-country-ecuador",
      "type": "correction",
      "severity": "medium",
      "title": "Quito parece ser una ciudad",
      "message": "Quito es una ciudad/capital. Se sugiere registrar Ecuador como país y Quito como ciudad.",
      "reason": "El campo esperado es país, pero el valor ingresado corresponde a una ciudad.",
      "targetStep": "empresa",
      "targetField": "pais",
      "suggestedPatch": {
        "pais": "Ecuador",
        "ciudad": "Quito"
      },
      "requiresHumanApproval": true,
      "confidence": 0.92,
      "source": "ai"
    }
  ],
  "warnings": [],
  "metadata": {
    "model": "pending",
    "prototypeMode": true
  }
}
```

Reglas de respuesta:

- `ok` indica si el endpoint pudo procesar la solicitud, no si las sugerencias deben aplicarse.
- `suggestions` puede venir vacío si no hay recomendaciones útiles.
- `warnings` debe incluir limitaciones, contexto insuficiente o datos no analizados.
- `metadata.model` puede ser `pending` en mocks o entornos sin OpenAI configurado.
- `confidence` debe estar entre `0` y `1`, y nunca debe reemplazar la validación humana.

## 8. Tipos de sugerencia

- `correction`: corrige una clasificación o valor probable, por ejemplo Quito como ciudad y Ecuador como país.
- `enrichment`: agrega detalle útil sin corregir un error, por ejemplo segmentos educativos.
- `warning`: advierte un riesgo, por ejemplo propuesta sin validación humana.
- `missing_data`: marca información faltante, por ejemplo decisores o métricas.
- `contradiction`: detecta contradicción, por ejemplo venta consultiva sin etapa de diagnóstico.
- `process_advice`: recomienda cambios en proceso, etapas, columnas o condiciones.
- `report_advice`: recomienda reportes, métricas, frecuencia o alertas.
- `ai_engine_advice`: recomienda motores IA, inputs, outputs o límites de automatización.
- `client_validation_note`: sugiere notas o preguntas para validar con cliente.

## 9. Severidad

- `low`: mejora menor o enriquecimiento opcional. Ejemplo: ampliar la descripción de vertical.
- `medium`: recomendación importante para calidad del setup. Ejemplo: agregar decisores comerciales.
- `high`: riesgo relevante si se avanza sin resolver. Ejemplo: venta consultiva sin validación humana antes de propuesta.
- `blocker`: condición que debe impedir activación o automatización real. Ejemplo: activar CRM sin permisos reales o sin aprobación del cliente.

## 10. Validación humana

Ninguna sugerencia se aplica automáticamente.

El frontend debería mostrar acciones explícitas:

- Aplicar sugerencia.
- Ignorar.
- Editar antes de aplicar.

Las sugerencias de alto riesgo (`high`) y bloqueantes (`blocker`) requieren confirmación adicional. Los cambios relacionados con propuesta, precio, descuento, cierre ganado, cierre perdido, activación del CRM, permisos, comunicación final o datos sensibles requieren aprobación humana explícita.

La IA no debe ejecutar `PATCH` al setup ni modificar estado persistente por su cuenta. Solo devuelve sugerencias estructuradas.

## 11. Contrato de suggestedPatch

`suggestedPatch` representa un cambio sugerido sobre el formulario actual.

Reglas:

- Puede modificar campos del form actual.
- No debe tocar campos fuera del `step` salvo que se declare explícitamente y el frontend lo permita.
- No debe activar CRM.
- No debe modificar permisos.
- No debe cambiar datos sensibles sin aprobación.
- No debe borrar contenido existente salvo que la sugerencia indique claramente el reemplazo y el usuario confirme.
- El frontend aplica el patch solo con click.

Ejemplo de patch seguro:

```json
{
  "tipoVenta": ["Venta consultiva", "Venta por proyecto"],
  "procesoActual": "Lead recibido → calificación → diagnóstico/reunión → propuesta → seguimiento → negociación → cierre."
}
```

Para campos de texto largos, el frontend debería preferir un patrón tipo `appendTextIfMissing` antes de reemplazar contenido existente. Para arrays, debería usar merge sin duplicados. Para colecciones como etapas, columnas, motores o reportes, debería evitar duplicados por nombre normalizado.

## 12. Relación con asistentes locales actuales

Los asistentes locales actuales siguen funcionando como fallback y como primera capa de seguridad. La IA real no debe reemplazarlos en la primera implementación.

En una fase futura, cada pantalla podría combinar:

- sugerencias locales;
- sugerencias IA.

El patrón visual debería seguir siendo inline, cercano al campo o bloque correspondiente, con botones secundarios y sin CTA principal adicional.

El frontend debería diferenciar el origen:

- “Sugerencia local”.
- “Sugerencia IA”.

Las sugerencias IA deben usar el mismo flujo de aplicación manual que las reglas locales actuales.

## 13. Contexto acumulado

La IA debe usar el contexto acumulado de manera segura, con campos opcionales y tolerancia a pasos faltantes.

- Empresa: rubro, país, ciudad, vertical, tipos de cliente, modelo comercial, qué vende, fuentes, visita/cotización y objetivo CRM.
- Cuestionario: tipo de venta, ciclo, ticket, decisores, criterios de calificación, proceso actual, información pre-propuesta, bloqueos, motivos de pérdida, métricas e IA deseada.
- Documentos: materiales fuente, tipo documental, uso actual, importancia y etapa comercial asociada.
- Diagnóstico: modelo comercial, complejidad, madurez, dependencia humana, riesgos, oportunidades, puntos ciegos, recomendaciones y preguntas.
- Proceso/Pipeline: etapas, columnas, condiciones de avance, decisiones humanas, documentos por etapa, alertas y tareas automáticas.
- Motores IA: motores definidos, etapa, tipo, objetivo, input, output, prioridad, riesgo, activación y validación humana.
- Reportes: reportes definidos, audiencia, frecuencia, métricas, filtros, generación, distribución, formato y alertas.

El endpoint debe limitar tamaño y profundidad del contexto. En primera fase no debería enviar documentos completos al modelo.

## 14. Ejemplos por paso

### Empresa

- Quito → sugerir Ecuador como país y Quito como ciudad.
- Rubro educación → sugerir segmentos como colegios privados, universidades, institutos técnicos, academias online y centros de capacitación.
- Vertical limpieza → sugerir preguntas de relevamiento técnico sobre metraje, frecuencia, sedes, horarios, personal e insumos.

### Cuestionario

- Proceso corto → sugerir flujo comercial típico con calificación, diagnóstico/reunión, propuesta, seguimiento, negociación y cierre.
- Sin decisores → sugerir dueño/fundador, gerencia general, gerencia comercial, administración/finanzas y operaciones.
- Sin métricas → sugerir leads nuevos, tasa de conversión, motivos de pérdida, ventas ganadas, monto cotizado, monto cerrado y tiempo promedio de cierre.

### Diagnóstico

- Sin riesgos → sugerir seguimiento manual, baja trazabilidad, dependencia de personas clave, pérdida de información y criterios poco claros.
- Sin oportunidades → sugerir automatizar seguimiento, mejorar calificación, ordenar pipeline, generar reportes y usar IA para próximos pasos.
- Sin preguntas → sugerir preguntas abiertas sobre decisor final, datos antes de cotizar, pérdidas por seguimiento, reportes de dirección y límites de IA.

### Proceso y pipeline

- Venta consultiva → incluir diagnóstico/reunión antes de propuesta.
- Riesgo seguimiento → incluir etapa o columna Seguimiento.
- Sin perdido → agregar etapa o columna Perdido con motivo obligatorio.

### Motores IA

- Venta consultiva → sugerir generador de borrador de propuesta con revisión humana.
- Riesgo seguimiento → sugerir auditor de seguimiento comercial.
- Limpieza → sugerir motor de relevamiento técnico y checklist de cotización.
- Educación → sugerir calificador de interesados educativos y recomendador de programa/curso.

### Reportes

- Dirección → sugerir reporte ejecutivo comercial semanal.
- Pipeline → sugerir reporte de seguimiento comercial con oportunidades sin próxima acción y seguimiento vencido.
- Motores IA → sugerir reporte de actividad IA con sugerencias generadas, aceptadas, ignoradas y alertas de riesgo.

## 15. Seguridad y permisos

El endpoint futuro debe cumplir:

- Requerir usuario autenticado.
- En producción no debe usar bypass ni modo prototipo como autorización.
- Requerir permiso futuro `constructor.assist` o una combinación de `config.read` / `config.update`, según decisión de producto y seguridad.
- Aplicar rate limiting por usuario, instancia y endpoint.
- No enviar secretos al modelo.
- No exponer claves de OpenAI ni variables de entorno.
- Sanitizar inputs y normalizar objetos antes de construir prompts.
- Limitar tamaño de contexto enviado al modelo.
- No incluir documentos completos en primera fase.
- No permitir que el modelo elija permisos, tablas, endpoints o acciones de escritura.
- Registrar errores sin volcar datos sensibles completos.

El endpoint debe tratar la salida del modelo como datos no confiables: parsear, validar schema, limitar campos permitidos y descartar sugerencias fuera de contrato.

## 16. Logging y auditoría futura

Más adelante sería útil registrar:

- usuario;
- step;
- field;
- suggestion id;
- accepted / ignored / edited;
- timestamp;
- confidence;
- source local/ai;
- modo solicitado;
- antes/después cuando corresponda, evitando datos sensibles completos si no hace falta;
- warnings emitidos;
- requestId para trazabilidad.

Esto no se implementa ahora. La primera documentación solo deja definido el contrato.

## 17. Estrategia incremental de implementación

Fase IA-1: crear endpoint mock que devuelve sugerencias estáticas y valida request/response contra los tipos.

Fase IA-2: conectar frontend al endpoint manteniendo fallback local. Si el endpoint falla, la UI sigue mostrando sugerencias locales.

Fase IA-3: conectar OpenAI con prompts controlados por step, schema estricto y límites de contexto.

Fase IA-4: agregar registro de sugerencias aceptadas, rechazadas y editadas.

Fase IA-5: agregar revisión de coherencia del Constructor completo, con foco en contradicciones, faltantes y riesgos de activación.

Fase IA-6: integrar sugerencias al informe para cliente, diferenciando observaciones locales, observaciones IA e ítems para validación humana.

## 18. Prompt base futuro

Prompt base inicial, no usado todavía:

```txt
Actuá como consultor senior en procesos comerciales, CRM, automatización e IA aplicada.

Vas a asistir la configuración del Constructor CRM de Summer87 Leads v3.

Reglas:
- Usá el contexto acumulado disponible: Empresa, Cuestionario, Documentos, Diagnóstico, Proceso/Pipeline, Motores IA y Reportes.
- No inventes datos. Si falta información, marcala como hipótesis o dato faltante.
- Sugerí, no impongas.
- Nunca indiques que un cambio debe aplicarse automáticamente.
- Priorizá validación humana para decisiones comerciales sensibles.
- No sugieras activar el CRM, modificar permisos, cambiar precios, aprobar descuentos, cerrar oportunidades ni enviar comunicaciones finales sin aprobación humana.
- Devolvé JSON estricto compatible con ConstructorAssistResponse.
- Cada sugerencia debe incluir título, mensaje, razón, severidad, confidence y si requiere aprobación humana.
- Si no hay una sugerencia útil, devolvé suggestions vacío y explica limitaciones en warnings.
```

## 19. Fuera de alcance actual

- No implementación de endpoint.
- No conexión OpenAI.
- No migraciones.
- No logs.
- No permisos reales.
- No activación CRM.
- No PDF real.
- No cambios frontend.
- No cambios en Supabase.
- No modificación de asistentes locales actuales.
- No nuevas variables de entorno ni secretos.

## 20. Checklist antes de implementar IA real

- Definir permisos.
- Cerrar modo prototipo o aislarlo de producción.
- Definir endpoint final.
- Definir modelo y proveedor.
- Definir límites de contexto.
- Definir logs y retención.
- Definir UI de aceptar/ignorar/editar.
- Definir fallback local.
- Revisar privacidad y datos sensibles.
- Validar con cliente interno.
- Agregar pruebas de contrato.
- Validar build.
- Revisar rate limiting.
- Revisar observabilidad y errores.
- Revisar política de documentos fuente antes de enviarlos al modelo.
