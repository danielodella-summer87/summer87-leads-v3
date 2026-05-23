# Validación Vercel agregar vehículo Ficha contract_fields 12W-5i-QA — Constructor CRM Summer87

**Versión:** 12W-5i-QA — validación manual de agregar vehículo en Vercel  
**Proyecto:** summer87-leads-v3  
**Base:** **12W-5i** — commit **`30c69e5`** (*Allow adding vehicle fields on lead detail*)

---

## 1. Resumen ejecutivo

- QA manual en Vercel **completada**.
- Se creó un lead QA **sin vehículo**.
- La ficha mostró el bloque **Vehículo** con microcopy y botón **Agregar vehículo**.
- Se agregaron datos de vehículo desde la ficha.
- La ficha volvió a modo lectura con los datos visibles.
- **GET** API confirmó `contract_fields_json` actualizado.
- **Dictamen:** **GO**

---

## 2. Entorno

| Ítem | Valor |
|------|--------|
| App | pickup4x4-crm-demo.vercel.app |
| Fecha | 2026-05-23 |
| Ejecutor | Daniel |
| Commit base | `30c69e5` |
| Lead id | `f069d260-c56a-4bc3-baf0-ae19f7163272` |
| Lead nombre | Demo QA 12W-5i — Vehículo agregado desde ficha |

**URLs:**

| Uso | URL |
|-----|-----|
| Ficha | https://pickup4x4-crm-demo.vercel.app/admin/leads/f069d260-c56a-4bc3-baf0-ae19f7163272 |
| GET API | https://pickup4x4-crm-demo.vercel.app/api/admin/leads/f069d260-c56a-4bc3-baf0-ae19f7163272 |

**Estado inicial:** lead sin claves de vehículo en `contract_fields_json`.  
**Estado post-QA:** vehículo Ford Ranger 2021 persistido vía PATCH desde ficha.

---

## 3. Prueba visual inicial — sin vehículo

Flujo observado:

1. Se abrió la ficha del lead recién creado **Demo QA 12W-5i — Vehículo agregado desde ficha**.
2. Tab **Datos** activo.
3. Bloque **Vehículo** visible en estado **vacío accionable** (debajo de Seguimiento piloto).
4. Microcopy mostrado:

   > Este lead todavía no tiene datos de vehículo asociados. Podés agregarlos para mejorar compatibilidad, cotización e instalación.

5. Botón secundario visible: **Agregar vehículo**.
6. **No** hubo CTA verde adicional en el bloque.
7. **No** rompió Seguimiento piloto ni Datos del lead.

**Dictamen estado vacío:** **GO**

---

## 4. Prueba visual posterior — vehículo agregado

Flujo ejecutado:

1. Click en **Agregar vehículo** → modo edición con formulario vacío.
2. Datos cargados:

| Campo | Valor ingresado |
|-------|-----------------|
| Marca | Ford |
| Modelo | Ranger |
| Año | 2021 |
| Matrícula | QA5I123 |
| Uso del vehículo | Trabajo |

3. **Guardar** → bloque volvió a modo lectura.
4. Datos visibles tras guardar:

| Campo | Valor mostrado |
|-------|----------------|
| Marca | Ford |
| Modelo | Ranger |
| Año | 2021 |
| Matrícula | QA5I123 |
| Uso del vehículo | Trabajo |

5. Botón **Editar** quedó disponible (secundario/discreto).

**Dictamen agregado + lectura:** **GO**

---

## 5. Prueba API GET

**Endpoint:**

`GET https://pickup4x4-crm-demo.vercel.app/api/admin/leads/f069d260-c56a-4bc3-baf0-ae19f7163272`

**Fragmento relevante de la respuesta (`contract_fields_json`):**

```json
"contract_fields_json": {
  "año": 2021,
  "marca": "Ford",
  "modelo": "Ranger",
  "tipo_uso": "trabajo",
  "matricula": "QA5I123"
}
```

**Validaciones:**

| Check | Resultado |
|-------|-----------|
| Claves de vehículo presentes tras agregar desde ficha | **GO** |
| `marca` = Ford, `modelo` = Ranger | **GO** |
| `año` = 2021 (number) | **GO** |
| `matricula` = QA5I123 | **GO** |
| `tipo_uso` = trabajo | **GO** |
| Coherencia UI ↔ GET | **GO** |

**Dictamen API GET:** **GO**

---

## 6. Checks

| Check | Resultado |
|-------|-----------|
| Lead QA creado sin vehículo | **GO** |
| Bloque Vehículo vacío visible | **GO** |
| Microcopy correcto | **GO** |
| Botón Agregar vehículo visible | **GO** |
| Modo edición abre | **GO** |
| Guardar persiste datos | **GO** |
| Vuelve a modo lectura | **GO** |
| Botón Editar visible post-guardado | **GO** |
| GET API devuelve Ford/Ranger/2021/QA5I123/trabajo | **GO** |
| No rompe Seguimiento piloto | **GO** |
| No rompe Datos del lead | **GO** |
| Sin SQL manual | **GO** |
| Sin API nueva | **GO** |

---

## 7. Observaciones

- Este QA **sí** creó un lead controlado de prueba.
- El flujo completa el hueco documentado en **12W-5h**: ahora un lead sin vehículo puede recibir datos desde ficha.
- No se validó eliminación total en esta QA; queda como prueba opcional posterior.
- No se tocó Zeta/Kore.

---

## 8. Fuera de alcance / NO-GO

- SQL o DDL.
- API nueva.
- Reportes por marca/modelo.
- Kanban mostrando vehículo.
- Edición masiva.
- Zeta/Kore.
- Índices.

---

## 9. Dictamen final

- **12W-5i-QA:** **GO**.
- Agregar vehículo desde ficha + PATCH + GET confirmados.

**Próximo paso sugerido:**

- **12W-5j** — QA eliminación parcial/total de campos de vehículo.
- **12W-6** — reportes/filtros por marca/modelo.

---

## 10. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado manualmente | **No** |
| Datos creados | **Sí**, lead QA controlado |
| Datos editados por UI | **Sí**, `contract_fields_json` del lead QA |
| Solo documentación | **Sí** |
| Commit | **No** |

---

*QA manual ejecutada por Daniel el 2026-05-23 en pickup4x4-crm-demo.vercel.app — commit base `30c69e5`.*
