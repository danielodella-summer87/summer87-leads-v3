# Validación Vercel edición Ficha Lead Vehículo contract_fields 12W-5h-QA — Constructor CRM Summer87

**Versión:** 12W-5h-QA — validación manual de edición en Vercel  
**Proyecto:** summer87-leads-v3  
**Base:** **12W-5h** — commit **`2344c81`** (*Enable vehicle contract fields editing on lead detail*)

---

## 1. Resumen ejecutivo

- QA manual en Vercel **completada**.
- Se editó el bloque **Vehículo** desde la Ficha del Lead.
- Cambio probado: matrícula pasó a **QA1234-H**.
- La ficha volvió a modo lectura y mostró el dato actualizado.
- **GET** API confirmó `contract_fields_json` actualizado.
- **Dictamen:** **GO**

---

## 2. Entorno

| Ítem | Valor |
|------|--------|
| App | pickup4x4-crm-demo.vercel.app |
| Fecha | 2026-05-23 |
| Ejecutor | Daniel |
| Commit base | `2344c81` |
| Lead id | `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` |
| Lead nombre | Demo QA 12W-5 — Toyota Hilux |

**URLs:**

| Uso | URL |
|-----|-----|
| Ficha | https://pickup4x4-crm-demo.vercel.app/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6 |
| GET API | https://pickup4x4-crm-demo.vercel.app/api/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6 |

**Estado previo (12W-5g-QA):** matrícula `QA1234`.  
**Estado post-edición (12W-5h-QA):** matrícula `QA1234-H`.

---

## 3. Prueba visual en Ficha

Flujo ejecutado:

1. Se abrió la ficha del lead **Demo QA 12W-5 — Toyota Hilux**.
2. Tab **Datos** activo.
3. Bloque **Vehículo** visible (debajo de Seguimiento piloto).
4. Botón **Editar** visible en el bloque (secundario/discreto).
5. Modo edición: se cambió **Matrícula** a `QA1234-H`.
6. **Guardar** → bloque volvió a modo lectura.
7. Datos visibles tras guardar:

| Campo | Valor mostrado |
|-------|----------------|
| Marca | Toyota |
| Modelo | Hilux |
| Año | 2022 |
| Matrícula | QA1234-H |
| Uso del vehículo | Trabajo |

**Dictamen visual:** **GO**

---

## 4. Prueba API GET

**Endpoint:**

`GET https://pickup4x4-crm-demo.vercel.app/api/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6`

**Fragmento relevante de la respuesta (`contract_fields_json`):**

```json
"contract_fields_json": {
  "año": 2022,
  "marca": "Toyota",
  "modelo": "Hilux",
  "tipo_uso": "trabajo",
  "matricula": "QA1234-H"
}
```

**Validaciones:**

| Check | Resultado |
|-------|-----------|
| `matricula` actualizada a `QA1234-H` | **GO** |
| Resto de campos de vehículo preservados | **GO** |
| `año` sigue siendo number (`2022`) | **GO** |
| `tipo_uso` sin cambio (`trabajo`) | **GO** |

**Dictamen API GET:** **GO**

---

## 5. Checks consolidados

| Check | Resultado |
|-------|-----------|
| Ficha carga sin error | **GO** |
| Bloque Vehículo visible con datos existentes | **GO** |
| Botón Editar visible (permiso de escritura) | **GO** |
| Modo edición: inputs y select operativos | **GO** |
| Guardar persiste cambio (matrícula) | **GO** |
| Vuelta a modo lectura tras guardar | **GO** |
| UI muestra matrícula actualizada | **GO** |
| GET API refleja `contract_fields_json` | **GO** |
| No rompe Seguimiento piloto ni Datos del lead | **GO** |
| Un solo CTA principal en ficha (Editar vehículo es secundario) | **GO** |

---

## 6. Observaciones

- Edición acotada al bloque **Vehículo**; no se modificó edición general del lead ni tabs.
- Solo se probó cambio de **matrícula**; merge PATCH preservó marca, modelo, año y tipo_uso.
- Si se eliminan todos los campos de vehículo, el bloque queda oculto (comportamiento documentado en **12W-5h** §9); no probado en esta QA.
- Agregar vehículo desde ficha cuando no hay datos previos queda **fuera de alcance** (fase posterior).
- No se ejecutó SQL ni Supabase manual desde Cursor en esta validación.

---

## 7. Fuera de alcance / NO-GO (esta QA)

- Agregar vehículo en lead sin datos previos
- Borrado total de campos de vehículo
- Kanban / Lista / reportes
- Nuevo Lead
- Zeta / Kore
- SQL / migraciones

---

## 8. Dictamen final

| Criterio | Veredicto |
|----------|-----------|
| **12W-5h-QA** (edición vehículo en Ficha, Vercel) | **GO** |
| PATCH merge + lectura post-guardado | **GO** |
| GET `contract_fields_json` coherente con UI | **GO** |

**Cierre de fase:** **12W-5h** — **GO QA** (Daniel, 2026-05-23).

---

## 9. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado en esta QA | **No** |
| SQL ejecutado | **No** |
| Supabase modificado desde Cursor | **No** |
| Datos demo nuevos creados | **No** |
| Solo documentación QA | **Sí** |
| Commit | **No** (por instrucción) |

---

*QA manual ejecutada por Daniel el 2026-05-23 en pickup4x4-crm-demo.vercel.app — commit base `2344c81`.*
