# Validación Vercel Lista badges vehículo contract_fields 12W-6c-QA — Constructor CRM Summer87

**Versión:** 12W-6c-QA — validación manual Vercel de badges frontend por vehículo  
**Proyecto:** summer87-leads-v3  
**Base:** 12W-6c commit `153271f` — Add vehicle badges to leads list

---

## 1. Resumen ejecutivo

- QA manual en Vercel completada.
- La Lista de Leads carga correctamente.
- Los badges de vehículo aparecen debajo del nombre del lead.
- Toyota Hilux muestra badges `Toyota Hilux` y `Trabajo`.
- Los leads sin vehículo muestran badge `Sin vehículo`.
- El lead Ford 12W-5i, luego de la eliminación total validada en 12W-5j-QA, aparece correctamente como `Sin vehículo`.
- Los filtros 12W-6b siguen visibles.
- No se detectaron errores visuales ni ruptura de la Lista.
- **Dictamen:** **GO**.

---

## 2. Entorno

| Campo | Valor |
|------|-------|
| App | pickup4x4-crm-demo.vercel.app |
| URL | https://pickup4x4-crm-demo.vercel.app/admin/leads |
| Fecha | 2026-05-25 |
| Ejecutor | Daniel |
| Commit base | `153271f` |

---

## 3. Prueba visual — Badges visibles en Lista

Resultado observado:
- La pantalla **Gestión operativa** carga sin error.
- La tab **Lista** aparece activa.
- El bloque **Filtros de vehículo** sigue visible.
- La tabla de leads carga correctamente.
- En la columna **Nombre**, debajo del nombre y etapa del lead, aparecen badges de vehículo.

---

## 4. Prueba A — Lead Toyota Hilux

Lead observado:
- `Demo QA 12W-5 — Toyota Hilux`

Resultado:
- Muestra badge principal: `Toyota Hilux`.
- Muestra badge secundario: `Trabajo`.
- Esto coincide con `contract_fields_json` validado en fases anteriores.

Dictamen: GO.

---

## 5. Prueba B — Lead Ford 12W-5i sin vehículo

Lead observado:
- `Demo QA 12W-5i — Vehículo agregado desde ficha`

Resultado:
- Muestra badge `Sin vehículo`.
- El resultado es correcto porque ese lead quedó con `contract_fields_json = {}` tras la eliminación total validada en 12W-5j-QA.

Dictamen: GO.

---

## 6. Prueba C — Otros leads sin datos de vehículo

Resultado observado:
- Los leads demo sin datos de vehículo muestran badge tenue `Sin vehículo`.
- El badge no interfiere con la lectura del nombre, etapa, progreso ni siguiente paso.

Dictamen: GO.

---

## 7. Checks consolidados

| Check | Resultado |
|------|-----------|
| Lista carga sin error | GO |
| Badges visibles debajo del nombre | GO |
| Toyota Hilux muestra `Toyota Hilux` | GO |
| Toyota Hilux muestra `Trabajo` | GO |
| Ford 12W-5i muestra `Sin vehículo` | GO |
| Otros leads sin datos muestran `Sin vehículo` | GO |
| Filtros 12W-6b siguen visibles | GO |
| Tabla de leads carga sin error | GO |
| Acciones masivas siguen visibles | GO |
| Sin CTA verde adicional | GO |
| Kanban no tocado | GO |
| Sin SQL | GO |
| Sin API nueva | GO |
| Sin Supabase manual | GO |

---

## 8. Observaciones

- Los badges se muestran con estilo discreto y no sobrecargan la fila.
- El badge `Sin vehículo` aparece en varios leads porque la mayoría de los datos demo no tienen `contract_fields_json` de vehículo.
- Toyota Hilux permite confirmar el caso completo: marca + modelo + tipo de uso.
- Ford 12W-5i permite confirmar el caso vacío posterior a eliminación total.
- No se validó Kanban en esta fase porque quedó fuera de alcance.

---

## 9. Fuera de alcance / NO-GO

- Kanban.
- Reportes.
- SQL.
- Índices.
- API nueva.
- Cambios en Supabase.
- Zeta/Kore.
- Datos demo nuevos.
- Edición masiva por vehículo.

---

## 10. Dictamen final

| Criterio | Veredicto |
|----------|-----------|
| 12W-6c-QA | GO |
| Badges frontend por vehículo | GO |
| Lista operativa con filtros + badges | GO |
| Pasar a cierre piloto Pickup 4x4 | GO |
| Kanban badges ahora | Opcional / NO-GO por prioridad |
| Reportes ahora | Pendiente 12W-6d |

---

## 11. Confirmación de alcance

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
