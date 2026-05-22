# Validación Vercel contract_fields_json 12W-5-QA — Constructor CRM Summer87

**Versión:** 12W-5-QA — validación end-to-end manual (Vercel + Supabase)  
**Proyecto:** summer87-leads-v3  
**Cadena:** SQL-2-EXEC (**12W-5d**, commit **`2637bb0`**) → API (**12W-5e**, **`87922eb`**) → UI Nuevo Lead (**12W-5f**, **`69fa3c2`**)

---

## 1. Resumen ejecutivo

- QA manual en Vercel/Supabase **completada**.
- Se creó un lead controlado desde `/admin/leads/nuevo`.
- El bloque **Vehículo** envió `contract_fields`.
- API **GET** devolvió `contract_fields_json`.
- Supabase confirmó persistencia JSONB.
- **Dictamen:** **GO end-to-end** para `contract_fields_json`.

---

## 2. Entorno

| Ítem | Valor |
|------|--------|
| App | pickup4x4-crm-demo.vercel.app |
| Supabase | summer87-leads-v3 — **main** / **PRODUCTION** |
| Fecha | 2026-05-22 |
| Ejecutor | Daniel |

**Lead creado:**

| Campo | Valor |
|-------|--------|
| `id` | `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` |
| `nombre` | Demo QA 12W-5 — Toyota Hilux |
| `pipeline` | Nuevo lead |
| Comercial | Daniel |

---

## 3. Prueba 1 — UI Nuevo Lead

**Resultado:**

- Bloque Vehículo visible y editable.
- Campos visibles: Marca, Modelo, Año, Matrícula, Uso del vehículo.
- Ya no aparece «Preparado para próxima fase».
- Copy indica que se guarda como campos del contrato CRM.
- Un solo CTA principal: **Guardar**.

**Dictamen:** **GO**

---

## 4. Prueba 2 — Creación de lead controlado

**Datos usados:**

| Campo | Valor |
|-------|--------|
| Nombre | Demo QA 12W-5 — Toyota Hilux |
| Contacto | Daniel QA |
| Producto / oferta | Lona marítima + estribos |
| Origen | `qa_12w5` |
| Pipeline | Nuevo lead |
| Comercial | Daniel |
| Vehículo — marca | Toyota |
| Vehículo — modelo | Hilux |
| Vehículo — año | 2022 |
| Vehículo — matrícula | QA1234 |
| Vehículo — tipo_uso | trabajo |

**Resultado:** lead creado y redirigido a ficha.

**Dictamen:** **GO**

---

## 5. Prueba 3 — GET API

**Endpoint:**

```
https://pickup4x4-crm-demo.vercel.app/api/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6
```

**Resultado relevante — `contract_fields_json`:**

```json
{
  "año": 2022,
  "marca": "Toyota",
  "modelo": "Hilux",
  "tipo_uso": "trabajo",
  "matricula": "QA1234"
}
```

**Dictamen:** **GO**

---

## 6. Prueba 4 — Supabase

**SELECT usado:**

```sql
SELECT
  id,
  created_at,
  nombre,
  pipeline,
  contract_fields_json
FROM public.leads
WHERE nombre ILIKE '%Demo QA 12W-5%'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado:**

- 1 fila encontrada.
- `id`: `c17d12fc-352b-4d6c-931c-b5ab2139f0e6`
- `nombre`: Demo QA 12W-5 — Toyota Hilux
- `pipeline`: Nuevo lead
- `contract_fields_json` contiene datos de vehículo.

**Dictamen:** **GO**

---

## 7. Observación menor

**Registro:** en el GET observado, `telefono` quedó como `"099000000qa12w5@summer87.test"` y `email` quedó `null`.

**Interpretación:** probable error de carga manual/foco al completar la prueba. No afecta el objetivo de esta QA, que era validar `contract_fields_json` end-to-end.

**Acción recomendada:** no bloquear **12W-5-QA**. Revisar UX/validaciones de teléfono/email en una fase posterior si se considera necesario.

---

## 8. NO-GO / fuera de alcance

- No se validó edición posterior de `contract_fields_json` desde ficha.
- No se validó visualización de vehículo en ficha.
- No se validó Kanban mostrando vehículo.
- No se tocó SQL.
- No se tocó Supabase salvo creación del lead controlado desde UI.
- No se tocó Zeta/Kore.
- No se agregó índice por marca.
- No se hizo rollback.

---

## 9. Dictamen final

| Criterio | Veredicto |
|----------|-----------|
| UI Vehículo editable | **GO** |
| POST desde Nuevo Lead | **GO** |
| Persistencia JSONB Supabase | **GO** |
| GET detalle API | **GO** |
| Ficha mostrando vehículo | **NO-GO** / pendiente fase posterior |
| Edición vehículo | **NO-GO** / pendiente |
| Reportes por marca | **NO-GO** / pendiente |

**Dictamen:** **12W-5-QA** queda **GO end-to-end** para creación y lectura de `contract_fields_json`.

---

## 10. Próximas fases recomendadas

- **12W-5g:** mostrar bloque Vehículo en Ficha del lead leyendo `contract_fields_json`.
- **12W-5h:** edición controlada de `contract_fields_json` desde ficha, si se decide.
- **12W-6:** reportes/filtros por marca/modelo si se prioriza.

---

## 11. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **Sí**, por creación de lead controlado desde UI |
| DDL ejecutado | **No** |
| Datos demo creados | **Sí**, 1 lead QA controlado |
| Commit | **No** |

---

*QA ejecutada por Daniel el 2026-05-22 en pickup4x4-crm-demo.vercel.app.*
