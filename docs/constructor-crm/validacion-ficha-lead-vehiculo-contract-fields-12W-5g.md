# Validación Ficha Lead Vehículo contract_fields 12W-5g — Constructor CRM Summer87

**Versión:** 12W-5g — lectura visual de vehículo en Ficha desde `contract_fields_json`  
**Proyecto:** summer87-leads-v3  
**Base:** API GET (**12W-5e**, **`87922eb`**) · Nuevo Lead (**12W-5f**, **`69fa3c2`**) · QA E2E (**12W-5-QA**, **`6a1188e`**)

---

## 1. Resumen ejecutivo

- Se agregó en la **Ficha del lead** (tab **Datos**) un bloque de **solo lectura** «Vehículo» que lee `lead.contract_fields_json`.
- Si hay al menos un campo de vehículo (`marca`, `modelo`, `año`, `matricula`, `tipo_uso`), el bloque se muestra con etiquetas en español.
- Sin botones, sin edición, sin cambios en API/SQL/Supabase.
- **Dictamen:** **GO lectura visual**; **NO-GO edición** (fase **12W-5h** u otra).

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `app/admin/leads/[id]/page.tsx` | **Modificado** — tipo `Lead`, helpers, `useMemo`, bloque UI |
| `docs/constructor-crm/validacion-ficha-lead-vehiculo-contract-fields-12W-5g.md` | **Creado** (este documento) |

**No modificados:** API, SQL, Supabase, Nuevo Lead, Kanban, `leadFieldPersistence.ts`.

---

## 3. Fuente de datos

| Capa | Detalle |
|------|---------|
| Endpoint | `GET /api/admin/leads/:id` (ya incluye `contract_fields_json` desde **12W-5e**) |
| Estado UI | `lead` en `LeadDetailPage` vía `fetchLead()` existente |
| Normalización | `getContractFieldsFromLead(lead)` — objeto plano o `{}` |

No se requirió cambio de API: el detalle ya devuelve el JSONB.

---

## 4. Campos mostrados

| Clave JSONB | Label UI | Formato |
|-------------|----------|---------|
| `marca` | Marca | string trim |
| `modelo` | Modelo | string trim |
| `año` | Año | number finito (o string numérico) |
| `matricula` | Matrícula | string trim |
| `tipo_uso` | Uso del vehículo | mapa: particular→Particular, trabajo→Trabajo, flota→Flota, campo→Campo, otro→Otro; otro string → valor limpio |

Solo se renderizan filas con valor presente.

---

## 5. Condición de visibilidad

El bloque **Vehículo** aparece en tab **Datos** cuando:

```text
hasVehicleContractFields(contract_fields_json) === true
```

Es decir, al menos una de: `marca`, `modelo`, `año`, `matricula`, `tipo_uso` tiene valor válido tras sanitización local.

Si no hay datos de vehículo → **no se muestra** el bloque (sin placeholder ruidoso).

**Ubicación:** debajo de «Seguimiento piloto», encima de «Datos del lead» — fuera del flujo de proceso comercial.

---

## 6. NO-GO (fase)

- SQL / DDL / Supabase desde Cursor
- Creación de datos demo
- POST / PATCH `contract_fields`
- Cambios en API (no necesarios)
- Nuevo Lead
- Kanban
- Edición de vehículo en ficha
- Zeta / Kore
- Commit (por instrucción de fase)

---

## 7. Validación técnica

```bash
npm run build
```

```bash
rg "contract_fields_json|Vehículo|tipo_uso|matricula|matrícula" app/admin/leads docs/constructor-crm/validacion-ficha-lead-vehiculo-contract-fields-12W-5g.md
```

```bash
git status
```

Resultados en §10.

---

## 8. QA sugerido (manual)

1. Abrir ficha del lead QA:  
   `/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6`
2. Tab **Datos** → confirmar bloque **Vehículo** visible.
3. Verificar: Toyota, Hilux, 2022, QA1234, Uso **Trabajo**.
4. Confirmar: sin inputs editables, sin botones en el bloque.
5. Lead sin `contract_fields_json` de vehículo → bloque ausente.

---

## 9. Dictamen

| Criterio | Veredicto |
|----------|-----------|
| Lectura visual en Ficha | **GO** |
| Edición desde Ficha | **NO-GO** / pendiente |
| API modificada | **No** |
| Persistencia nueva | **No** |

---

## 10. Registro de validación (implementación)

| Check | Resultado |
|-------|-----------|
| `npm run build` | **OK** — exit 0 |
| `rg` en `app/admin/leads` + doc | **OK** — `page.tsx` ficha: helpers, bloque Vehículo, `contract_fields_json` |
| `git status` | `app/admin/leads/[id]/page.tsx` modificado; doc 12W-5g sin trackear; sin commit |

---

*Lead QA de referencia: `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` (12W-5-QA).*
