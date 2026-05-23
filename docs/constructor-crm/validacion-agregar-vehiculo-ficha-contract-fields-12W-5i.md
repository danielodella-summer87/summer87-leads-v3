# Validación agregar vehículo Ficha contract_fields 12W-5i — Constructor CRM Summer87

**Versión:** 12W-5i — agregar vehículo desde Ficha cuando no hay datos  
**Proyecto:** summer87-leads-v3  
**Base:** Edición vehículo (**12W-5h**, commit **`2344c81`**) · QA Vercel edición (**12W-5h-QA**, commit **`b021e6c`**)

---

## 1. Resumen ejecutivo

- Se habilita **agregar vehículo** desde la Ficha del Lead cuando el lead no tiene datos de vehículo en `contract_fields_json`.
- Reutiliza **PATCH** `contract_fields` de **12W-5h** (`saveVehicleEdit()` / `mergeContractFieldsPatch`).
- **No** requiere SQL ni API nueva.
- **Dictamen:** **GO técnico** si `npm run build` pasa; QA Vercel en fase **12W-5i-QA**.

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `app/admin/leads/[id]/page.tsx` | **Modificado** — bloque Vehículo vacío + «Agregar vehículo» |
| `docs/constructor-crm/validacion-agregar-vehiculo-ficha-contract-fields-12W-5i.md` | **Creado** (este documento) |

**No modificados:** API, SQL, Supabase, Nuevo Lead, Kanban, reportes, Zeta/Kore.

---

## 3. Comportamiento implementado

| Estado | Comportamiento |
|--------|----------------|
| Con vehículo | Lectura + **Editar** (12W-5h, sin cambios) |
| Sin vehículo + `canEditLead` | Bloque discreto + microcopy + **Agregar vehículo** |
| Sin vehículo + sin permiso | Bloque **oculto** (sin ruido) |
| Click **Agregar vehículo** | Mismo formulario de edición; draft vacío |
| **Guardar** | PATCH `contract_fields` → lectura con datos |
| **Cancelar** sin vehículo previo | Vuelve a card «Agregar vehículo» |
| **Cancelar** con vehículo previo | Vuelve a lectura con valores anteriores |
| Borrado total en edición | Tras guardar, vuelve a estado «Agregar vehículo» si `canEditLead` |

**Visibilidad:** `shouldShowVehicleSection = vehicleContractDisplay || vehicleEditing || canEditLead`.

---

## 4. Reglas UX

- Botones **secundarios** (borde slate, sin verde): Agregar vehículo, Editar, Cancelar, Guardar.
- **Un solo CTA verde principal** en la ficha (sin cambios).
- Microcopy breve cuando no hay datos:
  - *«Este lead todavía no tiene datos de vehículo asociados. Podés agregarlos para mejorar compatibilidad, cotización e instalación.»*
- Sin placeholder ruidoso para usuarios sin permiso de escritura.

---

## 5. NO-GO (fase)

- SQL / DDL
- Supabase manual
- API nueva
- Nuevo Lead
- Kanban
- Reportes
- Zeta / Kore
- Datos demo
- Commit (por instrucción de fase)

---

## 6. Validación técnica

```bash
npm run build
```

```bash
rg "Agregar vehículo|vehicleEditing|contract_fields|contract_fields_json|Vehículo" \
  app/admin/leads/\[id\]/page.tsx \
  docs/constructor-crm/validacion-agregar-vehiculo-ficha-contract-fields-12W-5i.md
```

```bash
git status
```

Resultados en §10.

---

## 7. QA manual sugerida

1. Buscar o usar en entorno controlado un lead **sin** datos de vehículo en `contract_fields_json`.
2. Abrir ficha → tab **Datos**.
3. Confirmar bloque **Vehículo** con botón **Agregar vehículo** (si hay permiso `leads.write` o es dueño).
4. Completar Marca, Modelo, Año, Matrícula, Uso → **Guardar**.
5. Confirmar modo lectura con datos visibles.
6. Confirmar `GET /api/admin/leads/:id` → `contract_fields_json` actualizado.
7. Probar **Cancelar** sin guardar → vuelve a card vacía.
8. (Opcional) Editar lead con vehículo, vaciar todos los campos, guardar → vuelve a «Agregar vehículo».

---

## 8. Dictamen

| Criterio | Veredicto |
|----------|-----------|
| Build local | Ver §10 |
| Agregar vehículo desde Ficha (UI) | **GO técnico** (post-build) |
| QA Vercel | Pendiente **12W-5i-QA** |

---

## 9. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **Sí** |
| API modificada | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos creados | **No** |
| Commit | **No** |

---

## 10. Registro de validación (implementación)

| Check | Resultado |
|-------|-----------|
| `npm run build` | **OK** — exit 0 |
| `rg` en archivos alcance | **OK** — Agregar vehículo, shouldShowVehicleSection, vehicleEditing, contract_fields |
| `git status` | `page.tsx` modificado; doc 12W-5i sin trackear; sin commit |

---

*Extiende **12W-5h** §9: agregar vehículo desde ficha ya no queda fuera de alcance.*
