# Validación API contract_fields_json 12W-5e — Constructor CRM Summer87

**Versión:** 12W-5e — implementación API POST/GET  
**Proyecto:** summer87-leads-v3  
**Base:** DDL `contract_fields_json` aplicado (`ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md`, commit **`2637bb0`**). **12W-5e depende de SQL-2 aplicado** en el entorno objetivo.

**Estado:** código API + helper; **sin** UI, **sin** SQL, **sin** datos demo cargados desde Cursor.

---

## 1. Resumen ejecutivo

- Se agregó el helper puro `lib/crmPackage/adapters/leadFieldPersistence.ts` para sanitizar y filtrar campos dinámicos del contrato CRM.
- **POST** `/api/admin/leads` acepta opcionalmente `contract_fields` o `contract_fields_json` y persiste en `public.leads.contract_fields_json` solo claves permitidas (whitelist del contrato activo con fallback Pickup).
- **GET** lista y **GET** `/api/admin/leads/:id` incluyen `contract_fields_json` en el `select`.
- Payload actual de Nuevo Lead **sin cambios**; compatibilidad backward: si no se envían campos dinámicos, se guarda `{}`.
- **Dictamen:** **GO API**; **NO-GO UI** hasta **12W-5f**; **NO-GO** datos demo hasta QA controlado.

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `lib/crmPackage/adapters/leadFieldPersistence.ts` | **Creado** |
| `app/api/admin/leads/route.ts` | **Modificado** — POST + GET lista |
| `app/api/admin/leads/[id]/route.ts` | **Modificado** — GET detalle |
| `docs/constructor-crm/validacion-api-contract-fields-json-12W-5e.md` | **Creado** (este documento) |

**No modificados:** `app/admin/leads/nuevo/page.tsx`, Kanban, Ficha UI, Zeta/Kore, migraciones.

---

## 3. Qué se implementó

| Capa | Detalle |
|------|---------|
| Helper | Whitelist, strip core, sanitización de tipos, límites, rechazo `kore_*` en create |
| POST create | `contract_fields_json` en `insert` explícito `{}` o sanitizado |
| GET list | `contract_fields_json` en `SELECT_WITH_SNAPSHOT` |
| GET detail | `contract_fields_json` en `selectLeadWithSnapshot` |
| POST sin columna | **Sin fallback de escritura** — error explícito (requiere SQL-2) |
| GET lectura degradada | Si columna ausente en select legacy, respuesta API con `contract_fields_json: {}` (solo lectura, sin segundo INSERT) |
| Contrato activo | `getActiveCrmPackageConfigFromEnvironment()` → whitelist; si vacío → `pickup4x4.config.ts` |

---

## 4. Reglas de sanitización

| Regla | Comportamiento |
|-------|----------------|
| Entrada | Solo objeto plano (`Record`); otro tipo → `{}` |
| `null` / `undefined` / string vacío | Ignorados por clave |
| Strings | `trim`; máx. **500** caracteres |
| Numbers | Finitos (`Number.isFinite`) |
| Booleans | Aceptados |
| Arrays | Solo `string[]`; máx. **20** ítems; ítem máx. **100** chars; sin vacíos |
| Objetos anidados, fechas objeto, funciones | Rechazados |
| Claves totales | Máx. **50** tras normalizar |
| Claves `_…` | Ignoradas (reservadas sistema) |
| Claves `kore_*` | Ignoradas en create manual |

---

## 5. Campos core excluidos (no van a JSONB)

**Contrato (columnas dedicadas):**  
`nombre`, `telefono`, `email`, `origen`, `producto_servicio`, `vendedor_responsable`, `etapa`, `proxima_accion`, `fecha_limite`, `observaciones`.

**Columnas / payload legacy:**  
`contacto`, `pipeline`, `oferta`, `notas`, `next_activity_type`, `next_activity_at`, `comercial_id`, `direccion`, `rubro_id`, `cantidad_personal`, `superficie_m2`, `visita_scheduled_at`, `estado`, `website`, `instagram`, `empresa_id`, `rating`, `score`, `meet_url`.

---

## 6. Kore excluido

Claves del grupo Kore del contrato (`kore_cliente_id`, `kore_documento_id`, …) **no** se persisten vía POST manual en esta fase (`rejectKore: true`). Integración sync queda fuera de alcance (**NO-GO Zeta/Kore**).

---

## 7. Payloads soportados (POST)

| Campo body | Prioridad | Notas |
|------------|-----------|-------|
| `contract_fields` | 1.ª si ambos presentes | Objeto plano |
| `contract_fields_json` | 2.ª | Alias compatible con nombre de columna |

Ejemplo (entorno controlado, no ejecutado desde Cursor):

```json
{
  "nombre": "Demo — Test API 5e",
  "comercial_id": "<uuid>",
  "pipeline": "Nuevo lead",
  "contract_fields": {
    "marca": "Toyota",
    "modelo": "Hilux",
    "año": 2022,
    "nombre": "ignorado en JSONB",
    "kore_cliente_id": "ignorado"
  }
}
```

---

## 8. Comportamiento si no viene `contract_fields`

- No se envía `contract_fields` ni `contract_fields_json` → API inserta **`contract_fields_json: {}`** explícito.
- Compatible con UI actual (16 campos core sin blob).
- **Precondición:** columna `contract_fields_json` debe existir en `public.leads` (commit **`2637bb0`** / SQL-2-EXEC). Si no existe, **POST falla** con error de Supabase — no hay reintento ni segundo `INSERT`.

---

## 9. GET / SELECT

- Lista: `GET /api/admin/leads` devuelve cada lead con `contract_fields_json` (objeto, típicamente `{}` hoy).
- Detalle: `GET /api/admin/leads/:id` incluye el mismo campo.
- Sin cambio de permisos (`leads.read`).
- **Solo lectura:** si un entorno antiguo no expone la columna en el `select` (p. ej. `SELECT_LEGACY` por `instagram`/`direccion`), la API **normaliza** la respuesta con `contract_fields_json: {}` — **no** escribe ni duplica leads.
- **POST** no reutiliza ese patrón: escritura exige schema post SQL-2.

---

## 10. NO-GO explícitos (12W-5e)

| Ítem | Estado |
|------|--------|
| UI Nuevo Lead / Vehículo editable | **NO** |
| SQL / DDL / Supabase desde Cursor | **NO** |
| Datos demo Pickup en JSONB | **NO** |
| Zeta / Kore sync | **NO** |
| PATCH ficha con `contract_fields` | **NO** (solo POST create + GET) |
| Índices GIN / por marca | **NO** |
| `stage_key` en pipeline | **NO** |
| Ampliar `ALLOWED_ACTIVITY` | **NO** |

---

## 11. Validación técnica

### 11.1 `npm run build`

| Resultado | Detalle |
|-----------|---------|
| **Exit code 0** | `next build` — TypeScript OK, 74 rutas generadas |

### 11.2 `rg "contract_fields_json|contract_fields"`

| Área | Archivos tocados en código |
|------|----------------------------|
| `app/api/admin/leads/route.ts` | POST insert, GET select, tipos `LeadCreateInput` / `LeadRow` |
| `app/api/admin/leads/[id]/route.ts` | GET detalle select + fallback lectura `{}` |
| `lib/crmPackage/adapters/leadFieldPersistence.ts` | Helper sanitización/whitelist |

Documentación previa (5d DDL/RESULTS) también referencia el campo; sin cambios de schema en esta fase.

### 11.3 `git status` (post-implementación)

| Estado | Archivo |
|--------|---------|
| Modificado | `app/api/admin/leads/route.ts` |
| Modificado | `app/api/admin/leads/[id]/route.ts` |
| Nuevo | `lib/crmPackage/adapters/leadFieldPersistence.ts` |
| Nuevo | `docs/constructor-crm/validacion-api-contract-fields-json-12W-5e.md` |

**Commit:** no solicitado.

---

## 12. QA sugerido (manual, Daniel)

1. **GET** lista leads → verificar `contract_fields_json: {}` en filas demo.
2. **POST** local con `contract_fields: { marca, modelo, año }` y whitelist Pickup → verificar persistencia solo de claves vehículo.
3. Confirmar que `nombre` en body sigue en columna `nombre`, no duplicado en JSONB.
4. **NO** ejecutar POST masivo desde Cursor en producción.

---

## 13. Dictamen

| Criterio | Veredicto |
|----------|-----------|
| API POST/GET `contract_fields_json` | **GO** |
| UI editable vehículo | **NO-GO** hasta **12W-5f** |
| Datos demo en JSONB | **NO-GO** hasta **12W-5-QA** controlado |
| DDL adicional | **NO-GO** |

---

## 14. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **Sí** (API + helper) |
| API modificada | **Sí** |
| SQL ejecutado | **No** |
| Supabase modificado desde Cursor | **No** |
| Datos modificados | **No** |
| Migraciones creadas | **No** |
| Commit | **No** (salvo pedido explícito) |

---

*Completar §11 con salidas de build/rg tras validación local.*
