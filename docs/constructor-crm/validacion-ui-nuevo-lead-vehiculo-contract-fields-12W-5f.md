# Validación UI Nuevo Lead Vehículo contract_fields 12W-5f — Constructor CRM Summer87

**Versión:** 12W-5f — bloque Vehículo editable y POST `contract_fields` en `client_crm`  
**Proyecto:** summer87-leads-v3  
**Base:** API `contract_fields_json` (**12W-5e**, commit **`87922eb`**); UI bloques Pickup (**12W-5b**)

---

## 1. Resumen ejecutivo

- El bloque **B — Vehículo** en Nuevo Lead (`client_crm`) pasó de card informativa a formulario editable con cinco campos.
- `createLead()` envía `contract_fields` en el POST solo cuando `isClientCrmUi` y hay al menos un valor no vacío tras limpieza.
- El payload core (nombre, contacto, pipeline, oferta, notas, etc.) **no cambió**.
- Modos internos **no** muestran el bloque Vehículo.
- **Dictamen:** **GO UI**; **NO-GO QA POST** hasta test controlado aprobado por Daniel (ver §9).

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `app/admin/leads/nuevo/page.tsx` | **Modificado** — states, helpers, UI editable, `contract_fields` en POST |
| `docs/constructor-crm/validacion-ui-nuevo-lead-vehiculo-contract-fields-12W-5f.md` | **Creado** (este documento) |

**No modificados:** API (`app/api/admin/leads/*`), SQL, Supabase, Kanban, Ficha, Lista, Zeta/Kore, `leadFieldPersistence.ts`.

---

## 3. Campos agregados (UI + states)

| Label UI | State React | Clave `contract_fields` | Tipo enviado |
|----------|-------------|-------------------------|--------------|
| Marca | `vehiculoMarca` | `marca` | `string` (trim; omitido si vacío) |
| Modelo | `vehiculoModelo` | `modelo` | `string` |
| Año | `vehiculoAnio` | `año` | `number` solo si `Number.isFinite` tras trim |
| Matrícula | `vehiculoMatricula` | `matricula` | `string` |
| Uso del vehículo | `vehiculoTipoUso` | `tipo_uso` | `string` (`particular`, `trabajo`, `flota`, `campo`, `otro`) |

Helpers locales en la página:

- `cleanContractString`
- `cleanContractNumber`
- `buildPickupContractFields`

---

## 4. Payload `contract_fields` esperado

Solo si `isClientCrmUi === true` y al menos un campo tiene valor válido:

```json
{
  "nombre": "…",
  "comercial_id": "…",
  "pipeline": "Nuevo lead",
  "contract_fields": {
    "marca": "Toyota",
    "modelo": "Hilux",
    "año": 2022,
    "matricula": "ABC1234",
    "tipo_uso": "trabajo"
  }
}
```

- Si todos los campos de vehículo están vacíos → **no** se incluye la clave `contract_fields` en el body.
- Si el año no es numérico finito → **no** se envía la clave `año` (el resto puede enviarse igual).
- La API (**12W-5e**) sanitiza y persiste solo claves en whitelist del contrato Pickup.

---

## 5. Qué se guarda y qué no

| Dato | ¿En POST UI? | Destino persistencia |
|------|--------------|----------------------|
| Marca, modelo, año, matrícula, tipo_uso | Sí (`contract_fields`, solo `client_crm`) | `public.leads.contract_fields_json` vía API |
| Nombre, teléfono, email, origen, oferta, notas, pipeline, actividad, comercial, dirección | Sí (payload core, sin cambios) | Columnas core / legacy existentes |
| Vehículo en modos internos | No (bloque oculto) | — |
| Vehículo en notas u oferta | No (no se concatena texto) | — |
| `stage_key`, Kore, presupuesto, categoría, urgencia | No | Fuera de alcance 12W-5f |

---

## 6. NO-GO (fase)

- No API
- No SQL
- No Supabase
- No datos demo / seeds desde Cursor
- No Kanban / Ficha / Lista
- No Zeta / Kore
- No ampliar `next_activity_type`
- No `stage_key`
- No commit en esta fase

---

## 7. Validación técnica

Comandos obligatorios (ejecutar en raíz del repo):

```bash
npm run build
```

```bash
rg "contract_fields|vehiculo|vehículo|tipo_uso|matricula|matrícula" app/admin/leads/nuevo/page.tsx docs/constructor-crm/validacion-ui-nuevo-lead-vehiculo-contract-fields-12W-5f.md
```

```bash
git status
```

Resultados documentados en §10 al cerrar la implementación.

---

## 8. QA manual sugerida

1. Deploy o entorno local **después** de merge/deploy con este cambio.
2. Entrar a `/admin/leads/nuevo` con UI `client_crm` (Pickup).
3. Completar identificación + comercial; opcionalmente vehículo (marca/modelo/año).
4. Guardar lead **solo si Daniel aprueba** creación controlada en staging/prod.
5. Verificar **GET** `/api/admin/leads/:id` → `contract_fields_json` con las claves enviadas.
6. Verificar fila en Supabase (`contract_fields_json`) en fase QA dedicada.

---

## 9. Dictamen

| Área | Veredicto |
|------|-----------|
| UI Nuevo Lead — bloque Vehículo editable | **GO** |
| POST real en prod/staging sin test | **NO-GO** hasta QA controlado |
| Persistencia end-to-end | Depende de **12W-5e** ya desplegado + SQL-2 (`2637bb0`) |

---

## 10. Registro de validación (implementación)

| Check | Resultado |
|-------|-----------|
| `npm run build` | **OK** — exit 0, TypeScript y páginas estáticas sin error |
| `rg contract_fields \| vehiculo \| …` | **OK** — coincidencias en `page.tsx` (helpers, states, POST, UI) y en este doc |
| `git status` | `app/admin/leads/nuevo/page.tsx` modificado; doc 12W-5f sin trackear; sin commit |
