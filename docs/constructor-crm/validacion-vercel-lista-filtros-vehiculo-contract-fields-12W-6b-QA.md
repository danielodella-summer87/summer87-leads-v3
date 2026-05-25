# Validación Vercel Lista filtros vehículo contract_fields 12W-6b-QA — Constructor CRM Summer87
**Versión:** 12W-6b-QA — validación manual Vercel de filtros frontend por vehículo  
**Proyecto:** summer87-leads-v3  
**Base:** 12W-6b commit `915b52d` — Add vehicle filters to leads list
---
## 1. Resumen ejecutivo
- QA manual en Vercel completada.
- La Lista de Leads carga correctamente.
- El bloque **Filtros de vehículo** aparece visible.
- Se validaron los filtros:
  - Todos
  - Con vehículo
  - Sin vehículo
  - Marca Toyota
  - Tipo de uso Trabajo
- Los filtros operan sobre `contract_fields_json` ya disponible en frontend.
- No se detectaron errores visuales ni ruptura de filtros existentes.
- **Dictamen:** **GO**.
---
## 2. Entorno
| Campo | Valor |
|------|-------|
| App | pickup4x4-crm-demo.vercel.app |
| URL | https://pickup4x4-crm-demo.vercel.app/admin/leads |
| Fecha | 2026-05-23 |
| Ejecutor | Daniel |
| Commit base | `915b52d` |
---
## 3. Prueba inicial — Lista y filtros visibles
Resultado observado:
- La pantalla **Gestión operativa** carga sin error.
- La tab **Lista** aparece activa.
- El buscador general sigue visible.
- El filtro **Pipeline** sigue visible.
- El bloque **Filtros de vehículo** aparece visible.
- Microcopy visible: “Filtros basados en los datos de vehículo capturados en el contrato CRM.”
- Controles visibles:
  - Presencia
  - Marca
  - Modelo
  - Tipo de uso
- No se agregó CTA verde adicional.
Estado inicial observado:
- Presencia = Todos
- Resultado = 15 leads
---
## 4. Prueba A — Presencia: Con vehículo
Configuración:
- Presencia = Con vehículo
- Marca = vacío
- Modelo = vacío
- Tipo de uso = Todos
Resultado observado:
- Resultado = 1 lead.
- Aparece: Demo QA 12W-5 — Toyota Hilux.
- No aparece Ford 12W-5i, correcto porque quedó con `contract_fields_json = {}` tras 12W-5j-QA.
Dictamen: GO.
---
## 5. Prueba B — Presencia: Sin vehículo
Configuración:
- Presencia = Sin vehículo
- Marca = vacío
- Modelo = vacío
- Tipo de uso = Todos
Resultado observado:
- Resultado = 14 leads.
- No aparece Toyota Hilux.
- Aparece Demo QA 12W-5i — Vehículo agregado desde ficha.
- El comportamiento es consistente con la eliminación total validada en 12W-5j-QA.
Dictamen: GO.
---
## 6. Prueba C — Marca Toyota
Configuración:
- Presencia = Todos
- Marca = Toyota
- Modelo = vacío
- Tipo de uso = Todos
Resultado observado:
- Resultado = 1 lead.
- Aparece: Demo QA 12W-5 — Toyota Hilux.
- El filtro por marca funciona correctamente.
Dictamen: GO.
---
## 7. Prueba D — Tipo de uso Trabajo
Configuración:
- Presencia = Todos
- Marca = vacío
- Modelo = vacío
- Tipo de uso = Trabajo
Resultado observado:
- Resultado = 1 lead.
- Aparece: Demo QA 12W-5 — Toyota Hilux.
- El filtro por `tipo_uso = trabajo` funciona correctamente.
Dictamen: GO.
---
## 8. Checks consolidados
| Check | Resultado |
|------|-----------|
| Lista carga sin error | GO |
| Bloque Filtros de vehículo visible | GO |
| Microcopy visible | GO |
| Presencia Todos | GO |
| Presencia Con vehículo | GO |
| Presencia Sin vehículo | GO |
| Marca Toyota | GO |
| Tipo de uso Trabajo | GO |
| Buscador general sigue visible | GO |
| Filtro Pipeline sigue visible | GO |
| Tabla de leads carga sin error | GO |
| Acciones masivas siguen visibles | GO |
| Sin CTA verde adicional | GO |
| Sin SQL | GO |
| Sin API nueva | GO |
| Sin Supabase manual | GO |
---
## 9. Observaciones
- El lead Toyota Hilux conserva datos de vehículo y por eso aparece en “Con vehículo”, Marca Toyota y Tipo de uso Trabajo.
- El lead Ford 12W-5i quedó sin vehículo después de la eliminación total de 12W-5j-QA y por eso aparece en “Sin vehículo”.
- La QA confirma que los filtros frontend respetan el estado real de `contract_fields_json`.
- No se probaron reportes ni Kanban en esta fase.
---
## 10. Fuera de alcance / NO-GO
- SQL.
- Índices.
- API nueva.
- Cambios en Supabase.
- Kanban.
- Reportes.
- Zeta/Kore.
- Datos demo nuevos.
- Edición masiva por vehículo.
---
## 11. Dictamen final
| Criterio | Veredicto |
|----------|-----------|
| 12W-6b-QA | GO |
| Filtros frontend por vehículo | GO |
| Pasar a 12W-6c badges | GO |
| SQL / índices ahora | NO-GO |
| Reportes ahora | Pendiente 12W-6d |
---
## 12. Confirmación de alcance
| Aspecto | Estado |
|---------|--------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado manualmente | No |
| Datos creados | No |
| Datos editados | No |
| Solo documentación | Sí |
| Commit | No |
---
Documento de QA manual Vercel. No sustituye pruebas automatizadas futuras.
