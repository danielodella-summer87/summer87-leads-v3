# Validación edición Ficha Lead Vehículo contract_fields 12W-5h — Constructor CRM Summer87

**Versión:** 12W-5h — edición de vehículo desde Ficha del Lead  
**Proyecto:** summer87-leads-v3  
**Base:** Lectura visual (**12W-5g**, commit **`5dbcb82`**) · API POST/GET contract_fields_json (**12W-5e**, commit **`87922eb`**) · Nuevo Lead vehículo (**12W-5f**, commit **`69fa3c2`**)

---

## 1. Resumen ejecutivo

- Se habilita **edición local** del bloque **Vehículo** en la Ficha del Lead (tab **Datos**).
- Los cambios persisten vía **PATCH** `/api/admin/leads/:id` con `contract_fields`, aplicando **merge seguro** sobre `contract_fields_json` existente.
- Solo se actualizan claves whitelist del contrato activo (vehículo: `marca`, `modelo`, `año`, `matricula`, `tipo_uso`); claves futuras se preservan.
- Campos vacíos explícitos **eliminan** la clave del JSONB.
- **Dictamen:** **GO técnico** si `npm run build` pasa; **NO-GO QA** hasta aprobación Daniel.

---

## 2. Archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `lib/crmPackage/adapters/leadFieldPersistence.ts` | **Modificado** — `mergeContractFieldsPatch()` |
| `app/api/admin/leads/[id]/route.ts` | **Modificado** — PATCH merge `contract_fields` / `contract_fields_json` |
| `app/admin/leads/[id]/page.tsx` | **Modificado** — modo lectura/edición bloque Vehículo |
| `docs/constructor-crm/validacion-edicion-ficha-vehiculo-contract-fields-12W-5h.md` | **Creado** (este documento) |

**No modificados:** SQL, Supabase manual, Nuevo Lead, Kanban, Lista, reportes, Zeta/Kore, pipeline/stage_key, notas/oferta.

---

## 3. API PATCH

### Payload soportado

```json
{
  "contract_fields": {
    "marca": "Toyota",
    "modelo": "Hilux",
    "año": 2022,
    "matricula": "QA1234",
    "tipo_uso": "trabajo"
  }
}
```

También acepta alias `contract_fields_json` (misma semántica).

### Merge seguro

1. Lee `contract_fields_json` actual del lead.
2. Por cada clave presente en el payload entrante y en **whitelist** del contrato activo:
   - Valor vacío / `null` → **elimina** la clave del objeto mergeado.
   - Valor válido → sanitiza y **sobrescribe** solo esa clave.
3. Claves **no enviadas** en el payload → se **preservan** del JSON actual.
4. Claves **fuera de whitelist** (futuras) → se **preservan** sin modificar.

Helper: `mergeContractFieldsPatch()` en `leadFieldPersistence.ts`.

### Eliminación de claves vacías

| Entrada | Efecto |
|---------|--------|
| `null` | Elimina clave whitelist |
| `""` o string solo espacios | Elimina clave whitelist |
| `año` no numérico / vacío | Elimina clave `año` |

### Whitelist

- `getActiveCrmPackageConfigFromEnvironment()` → `resolveContractFieldWhitelist()` → `sanitizeContractFields()`.
- Fallback documentado: `pickup4x4.config.ts`.
- Claves core y `kore_*` nunca van a JSONB.

### Respuesta PATCH

- Re-hidratación incluye `contract_fields_json` en el select post-update.
- Comportamiento PATCH existente para otros campos **intacto**.

---

## 4. UI — bloque Vehículo

### Modo lectura

- Visible cuando `hasVehicleContractFields(contract_fields_json)` (igual que **12W-5g**).
- Muestra Marca, Modelo, Año, Matrícula, Uso del vehículo (solo filas con valor).
- Botón **Editar** secundario/discreto (solo si `canEditLead`).

### Modo edición

- Inputs: Marca, Modelo, Año (number), Matrícula, Uso del vehículo (select).
- Opciones `tipo_uso`: `particular`, `trabajo`, `flota`, `campo`, `otro`.
- Botones dentro del bloque: **Cancelar**, **Guardar** (secundarios; no compiten con CTA principal de la ficha).

### Guardado

```typescript
PATCH /api/admin/leads/:id
{
  contract_fields: {
    marca, modelo, año, matricula, tipo_uso
  }
}
```

- Campos vacíos se envían como `null` → API elimina la clave.
- Tras guardar: `patchLead()` actualiza estado local con respuesta (incl. `contract_fields_json`).

### Sin datos de vehículo

- Prioridad fase: editar si ya hay datos. Si no hay datos → bloque **oculto** (sin placeholder).
- Ver §9 para el caso de borrado total de campos.

---

## 5. NO-GO (fase)

- SQL / DDL / Supabase manual desde Cursor
- Creación de datos demo
- Kanban / Lista / reportes
- Nuevo Lead
- Zeta / Kore
- Commit (por instrucción de fase)

---

## 6. Validación técnica

```bash
npm run build
```

```bash
rg "contract_fields|contract_fields_json|Vehículo|tipo_uso|matricula|matrícula" \
  app/api/admin/leads/\[id\]/route.ts \
  app/admin/leads/\[id\]/page.tsx \
  docs/constructor-crm/validacion-edicion-ficha-vehiculo-contract-fields-12W-5h.md
```

```bash
git status
```

Resultados en §10.

---

## 7. QA manual sugerida

1. Abrir lead QA: `/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6`
2. Tab **Datos** → bloque **Vehículo** → **Editar**
3. Cambiar **Modelo** o **Matrícula** → **Guardar**
4. Verificar lectura en UI (modo lectura)
5. Verificar `GET /api/admin/leads/:id` → `contract_fields_json` actualizado
6. Verificar fila en Supabase (`contract_fields_json`) — manual, fuera de Cursor
7. Si no se desea dejar el dato modificado → **Cancelar** antes de guardar, o revertir manualmente

**Lead QA referencia:**

```json
{
  "año": 2022,
  "marca": "Toyota",
  "modelo": "Hilux",
  "tipo_uso": "trabajo",
  "matricula": "QA1234"
}
```

---

## 8. Dictamen

| Criterio | Veredicto |
|----------|-----------|
| Build local | Ver §10 |
| Edición Ficha + PATCH merge | **GO técnico** (post-build) |
| QA manual / Supabase | **NO-GO** hasta aprobación Daniel |

---

## 9. Observaciones de alcance

Si se eliminan todos los campos de vehículo, el bloque queda oculto porque **12W-5h** edita vehículo existente. Agregar vehículo desde ficha cuando no hay datos queda fuera de alcance y puede tratarse como fase posterior.

---

## 10. Registro de validación (implementación)

| Check | Resultado |
|-------|-----------|
| `npm run build` | **OK** — exit 0 |
| `rg` en archivos alcance | **OK** — API PATCH merge, UI Vehículo edición, doc 12W-5h |
| `git status` | 3 archivos modificados + doc sin trackear; sin commit |
| SQL / Supabase / datos demo | **No ejecutado** |
| `npm run build` (ajuste doc 12W-5h) | **No re-ejecutado** — cambio solo en documentación; build previo OK (§10) |

---

*Lead QA de referencia: `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` (12W-5-QA).*
