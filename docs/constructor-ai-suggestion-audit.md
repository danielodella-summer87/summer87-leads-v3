# Auditoría de sugerencias IA — Constructor CRM

## 1. Objetivo

Este documento define cómo registrar trazabilidad futura de sugerencias locales, mock e IA real dentro del Constructor CRM de Summer87 Leads v3.

No implementa logs todavía, no crea tablas, no toca Supabase y no modifica el frontend ni el endpoint actual. Es un contrato técnico para una fase posterior, antes de conectar IA real.

## 2. Por qué auditar sugerencias IA

Auditar sugerencias permite reconstruir qué recomendó el sistema, qué aceptó la persona usuaria y qué impacto tuvo sobre la configuración del CRM.

Los objetivos principales son trazabilidad comercial, responsabilidad humana, aprendizaje del sistema, explicación ante cliente, control de calidad y preparación para IA real con gobernanza mínima.

## 3. Fuentes de sugerencias

- `local`: sugerencias determinísticas generadas en el frontend por reglas TypeScript. No llaman API IA y sirven como fallback confiable.
- `mock`: sugerencias devueltas por `/api/admin/constructor/assist` en modo prototipo. Validan el contrato sin conectar OpenAI.
- `ai`: sugerencias futuras generadas por un proveedor real de IA. Deben tener el mismo flujo de validación humana que `local` y `mock`.

La fuente debe guardarse siempre para diferenciar comportamiento de reglas locales, pruebas mock y recomendaciones de IA real.

## 4. Eventos a registrar

- `suggestion_shown`: una o más sugerencias fueron mostradas al usuario.
- `suggestion_applied`: el usuario aplicó una sugerencia y el estado cambió.
- `suggestion_ignored`: el usuario descartó o cerró una sugerencia sin aplicarla.
- `suggestion_duplicate`: el usuario intentó aplicar una sugerencia ya presente y no hubo cambio.
- `suggestion_edited_before_apply`: el usuario editó una sugerencia o su resultado antes de aplicarla.
- `suggestion_failed`: una consulta o aplicación falló por error de red, validación o contrato.
- `suggestion_empty_result`: la consulta terminó correctamente pero no devolvió sugerencias.

## 5. Modelo conceptual de evento

```json
{
  "eventType": "suggestion_applied",
  "suggestionId": "mock-country-ecuador",
  "source": "mock",
  "step": "empresa",
  "field": "pais",
  "targetStep": "empresa",
  "targetField": "pais",
  "suggestionType": "correction",
  "severity": "medium",
  "confidence": 0.92,
  "action": "applied",
  "result": "success",
  "requestId": "mock-constructor-assist",
  "sessionId": "optional",
  "userId": "future",
  "timestamp": "future-server-generated",
  "metadata": {
    "prototypeMode": true,
    "screen": "constructor_empresa"
  }
}
```

## 6. Campos obligatorios

- `eventType`
- `suggestionId`
- `source`
- `step`
- `field`
- `action`
- `result`
- `requestId`
- `createdAt` futuro generado por servidor

## 7. Campos opcionales

- `userId`
- `sessionId`
- `targetStep`
- `targetField`
- `suggestionType`
- `severity`
- `confidence`
- `beforeSummary`
- `afterSummary`
- `editedValueSummary`
- `metadata`

## 8. Qué NO guardar

- No guardar texto completo sensible si no hace falta.
- No guardar documentos completos.
- No guardar prompts completos con datos privados en primera fase.
- No guardar claves ni tokens.
- No guardar cookies.
- No guardar datos personales innecesarios.
- No guardar contenido completo de formularios si alcanza con resumen.
- No guardar `suggestedPatch` completo si contiene datos sensibles; preferir resumen.

## 9. Diferencia entre before/after y resumen

Para campos simples puede guardarse `beforeSummary` y `afterSummary`, por ejemplo país antes y país después.

Para campos largos, arrays extensos o formularios completos, se debe guardar un resumen breve o un hash futuro. Para documentos, guardar solo metadata como tipo, nombre lógico, tamaño o etapa asociada. Para datos comerciales sensibles, guardar el campo modificado y un resumen operativo, no el contenido completo.

## 10. Eventos por pantalla

### Empresa

- Quito -> Ecuador/Quito.
- Acciones esperadas: `applied`, `duplicate`, `ignored`.
- Campos: `pais`, `ciudad`.

### Cuestionario

- `procesoActual` sugerido para estructurar el flujo comercial.
- Acciones esperadas: `applied`, `edited`, `ignored`.

### Diagnóstico

- Riesgos comerciales agregados.
- Acciones esperadas: `applied`, `duplicate`, `ignored`.

### Proceso/Pipeline

- Etapa `Diagnóstico / reunión` agregada.
- Acciones esperadas: `applied`, `duplicate`, `ignored`.

### Motores IA

- Motor `Auditor de seguimiento comercial`.
- Acciones esperadas: `applied`, `duplicate`, `ignored`.

### Reportes

- `Reporte ejecutivo comercial` y `Reporte de pipeline`.
- Acciones esperadas: `applied`, `duplicate`, `ignored`.

## 11. Relación con hook useConstructorMockAI

En una fase futura, `useConstructorMockAI` debería registrar `suggestion_shown` cuando recibe sugerencias exitosas.

`MockAISuggestionCard` debería disparar eventos de intención del usuario, como `suggestion_applied` o `suggestion_ignored`, sin persistir por sí sola. La pantalla concreta debe decidir si el resultado fue `success`, `duplicate`, `edited` o `failed`, porque solo la pantalla conoce si el estado cambió.

El endpoint `/api/admin/constructor/assist` no debería registrar aceptación. La aceptación debería registrarse desde el frontend o mediante un endpoint futuro dedicado de eventos.

## 12. Endpoint futuro sugerido para logs

Endpoint propuesto, sin implementar:

```txt
POST /api/admin/constructor/assist/events
```

Payload conceptual:

```json
{
  "eventType": "suggestion_applied",
  "suggestion": {},
  "step": "empresa",
  "field": "pais",
  "action": "applied",
  "result": "success",
  "metadata": {}
}
```

Este endpoint debe requerir sesión y un permiso futuro explícito. No debe aceptar logs anónimos ni confiar en `userId` enviado por frontend.

## 13. Tabla futura sugerida

Tabla propuesta, sin migrar:

```txt
constructor_ai_suggestion_events
```

Campos sugeridos:

- `id`
- `company_id` / `tenant_id` futuro
- `user_id`
- `session_id`
- `source`
- `event_type`
- `step`
- `field`
- `suggestion_id`
- `suggestion_type`
- `severity`
- `confidence`
- `action`
- `result`
- `request_id`
- `before_summary`
- `after_summary`
- `metadata jsonb`
- `created_at`

No crear esta tabla ahora. Antes de migrar, revisar naming real del proyecto y no asumir `tenant` o `company` hasta confirmar el modelo de datos definitivo.

## 14. Seguridad y permisos

El endpoint de eventos debe requerir sesión válida y permiso futuro `constructor.assist.audit` o `constructor.assist`.

Debe validar `source`, `eventType`, `step`, `field`, `action` y `result`; limitar tamaño de `metadata`; aplicar rate limit futuro; rechazar payloads anónimos; y derivar `userId` desde sesión del servidor, no desde el frontend.

## 15. UX futura

El logging debe ocurrir en background y no saturar al usuario. La UI debe seguir mostrando mensajes simples como “sugerencia aplicada” o “esta sugerencia ya estaba aplicada”.

En fases futuras puede agregarse deshacer cuando el cambio sea reversible, y un historial visible en Auditoría final si aporta valor al proceso de validación con cliente.

## 16. Relación con Auditoría final

Auditoría final podría mostrar un resumen de:

- sugerencias IA consultadas;
- sugerencias aplicadas;
- sugerencias ignoradas;
- sugerencias duplicadas;
- campos modificados por sugerencias.

No debería mostrar datos sensibles completos. Debe servir para validar con cliente qué partes del setup fueron influenciadas por reglas locales, mock o IA real.

## 17. Estrategia incremental

Audit-1: Documento actual.

Audit-2: Tipos TypeScript para eventos, sin persistencia.

Audit-3: Logging local en memoria o dev console solo para debugging.

Audit-4: Endpoint de eventos mock sin Supabase.

Audit-5: Persistencia Supabase con migración revisada.

Audit-6: Resumen en Auditoría final.

Audit-7: Uso de logs para mejorar prompts IA real.

## 18. Checklist antes de implementar logs reales

- Definir `tenant` / `company id` real.
- Definir permisos.
- Definir privacidad.
- Definir retención.
- Definir tabla.
- Definir endpoint.
- Definir eventos aceptados.
- Definir límites de payload.
- Definir cómo resumir `before` / `after`.
- Probar build.
- Probar con usuario real.

## 19. Fuera de alcance actual

- No endpoint.
- No Supabase.
- No migración.
- No frontend.
- No OpenAI.
- No logging real.
- No historial UI.

## 20. Recomendación

Antes de conectar OpenAI real, implementar al menos tipos de eventos o un endpoint mock de eventos. No conviene conectar IA real sin trazabilidad mínima sobre qué se mostró, qué se aplicó, qué se ignoró y qué quedó bajo validación humana.
