# Validación Vercel eliminación vehículo contract_fields 12W-5j-QA — Constructor CRM Summer87

**Versión:** 12W-5j-QA — eliminación parcial y total de campos de vehículo desde Ficha  
**Proyecto:** summer87-leads-v3  
**Base:** **12W-5i** commit **`30c69e5`** · **12W-5i-QA** commit **`8517870`** · PATCH `contract_fields` implementado en **12W-5h**

---

## 1. Resumen ejecutivo

- QA manual en Vercel **completada**.
- Se validó **eliminación parcial** de campos de vehículo.
- Se validó **eliminación total** de campos de vehículo.
- En eliminación parcial, se borró **matrícula** y se preservaron marca/modelo/año/tipo_uso.
- En eliminación total, `contract_fields_json` quedó `{}`.
- La ficha volvió al estado **Agregar vehículo**.
- **Dictamen:** **GO**

---

## 2. Entorno

| Campo | Valor |
|-------|-------|
| App | pickup4x4-crm-demo.vercel.app |
| Fecha | 2026-05-23 |
| Ejecutor | Daniel |
| Lead id | `f069d260-c56a-4bc3-baf0-ae19f7163272` |
| Lead nombre | Demo QA 12W-5i — Vehículo agregado desde ficha |
| URL ficha | https://pickup4x4-crm-demo.vercel.app/admin/leads/f069d260-c56a-4bc3-baf0-ae19f7163272 |
| URL GET | https://pickup4x4-crm-demo.vercel.app/api/admin/leads/f069d260-c56a-4bc3-baf0-ae19f7163272 |

---

## 3. Prueba A — eliminación parcial

Se abrió el lead QA con vehículo cargado. En el bloque **Vehículo** se hizo click en **Editar**, se borró solo **Matrícula** y se guardó.

**Resultado observado:**

- Marca **Ford** preservada.
- Modelo **Ranger** preservado.
- Año **2021** preservado.
- Uso **trabajo** preservado.
- **Matrícula** eliminada.

**JSON relevante confirmado por GET:**

```json
{
  "contract_fields_json": {
    "año": 2021,
    "marca": "Ford",
    "modelo": "Ranger",
    "tipo_uso": "trabajo"
  }
}
```

---

## 4. Prueba B — eliminación total

Se volvió a editar el bloque **Vehículo**. Se borraron **Marca**, **Modelo** y **Año**. **Matrícula** ya estaba vacía. Se seleccionó **Uso del vehículo:** — Seleccionar — y se guardó.

**Resultado visual observado:**

- No quedan Marca/Modelo/Año/Matrícula/Uso visibles.
- El bloque vuelve al estado vacío accionable.
- Se muestra microcopy de lead sin vehículo.
- Aparece botón **Agregar vehículo**.

**JSON final confirmado por GET:**

```json
{
  "contract_fields_json": {}
}
```

---

## 5. Checks

| Check | Resultado |
|-------|-----------|
| Eliminación parcial ejecutada | **GO** |
| Matrícula eliminada del JSONB | **GO** |
| Marca preservada en parcial | **GO** |
| Modelo preservado en parcial | **GO** |
| Año preservado en parcial | **GO** |
| Tipo de uso preservado en parcial | **GO** |
| Eliminación total ejecutada | **GO** |
| `contract_fields_json` quedó `{}` | **GO** |
| Ficha volvió a «Agregar vehículo» | **GO** |
| No quedan campos de vehículo visibles | **GO** |
| Seguimiento piloto intacto | **GO** |
| Datos del lead intacto | **GO** |
| Sin SQL manual | **GO** |
| Sin API nueva | **GO** |
| Sin datos nuevos creados en esta QA | **GO** |

---

## 6. Observaciones

- Esta QA usó el lead controlado creado en **12W-5i-QA**.
- No se creó un nuevo lead en esta fase.
- La eliminación parcial confirma que `mergeContractFieldsPatch` borra solo claves enviadas vacías y preserva las demás.
- La eliminación total confirma que la UI vuelve al estado **Agregar vehículo**.
- No se tocó Zeta/Kore.

---

## 7. Fuera de alcance / NO-GO

- SQL o DDL.
- API nueva.
- Crear nuevos leads.
- Reportes por marca/modelo.
- Kanban mostrando vehículo.
- Edición masiva.
- Zeta/Kore.
- Índices.

---

## 8. Dictamen final

| Criterio | Veredicto |
|----------|-----------|
| **12W-5j-QA** | **GO** |
| Eliminación parcial UI + GET | **GO** |
| Eliminación total UI + GET | **GO** |
| Cadena vehículo **12W-5** | Funcionalmente cerrada |

**Próximo paso sugerido:**

- **12W-6** — reportes/filtros por marca/modelo/tipo_uso.
- O cierre documental global **12W-5** antes de avanzar.

---

## 9. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado manualmente | **No** |
| Datos creados | **No** |
| Datos editados por UI | **Sí**, lead QA existente |
| Solo documentación | **Sí** |
| Commit | **No** |

---

*Documento de QA manual Vercel. No sustituye pruebas automatizadas futuras.*

*QA manual ejecutada por Daniel el 2026-05-23 en pickup4x4-crm-demo.vercel.app — lead QA `f069d260-c56a-4bc3-baf0-ae19f7163272`.*
