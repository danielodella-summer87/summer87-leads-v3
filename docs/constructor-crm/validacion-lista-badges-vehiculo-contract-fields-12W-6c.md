# Validacion lista badges vehiculo contract_fields 12W-6c - Constructor CRM Summer87

**Version:** 12W-6c - implementacion frontend de badges en Lista de Leads  
**Proyecto:** summer87-leads-v3  
**Base:** `diseno-reportes-filtros-vehiculo-contract-fields-12W-6a.md`, `validacion-lista-filtros-vehiculo-contract-fields-12W-6b.md`

---

## 1. Resumen ejecutivo

- Se agregan badges frontend de vehiculo en la **Lista de Leads**.
- La implementacion usa `contract_fields_json` ya disponible en frontend.
- No requiere SQL, API nueva ni indices.
- **Dictamen:** **GO tecnico** si `npm run build` pasa.

---

## 2. Archivos modificados / creados

| Archivo | Accion |
|---------|--------|
| `app/admin/leads/page.tsx` | **Modificado** - helper de badges y render visual en cada lead |
| `docs/constructor-crm/validacion-lista-badges-vehiculo-contract-fields-12W-6c.md` | **Creado** - este documento |

---

## 3. Badges implementados

| Badge | Estado | Regla |
|-------|--------|-------|
| Marca + modelo | GO | Se muestra cuando existen `marca` y `modelo` |
| Vehículo parcial | GO | Se muestra si hay algun dato de vehiculo, pero no `marca` + `modelo` |
| Sin vehículo | GO | Se muestra cuando no hay datos de vehiculo |
| Tipo de uso | GO | Badge secundario si existe `tipo_uso` |

---

## 4. Reglas de visualizacion

- **Completo** = `marca` + `modelo`.
- **Parcial** = existe algun dato de vehiculo, pero no `marca` + `modelo`.
- **Sin vehiculo** = no existe ninguna clave valida.
- `tipo_uso` se muestra como badge secundario solo si existe.
- Maximo **2 badges** visibles por lead.

### Detalle de lectura

- Si `contract_fields_json` falta o no es objeto, se trata como `{}`.
- `tipo_uso` se formatea a:
  - `particular` -> `Particular`
  - `trabajo` -> `Trabajo`
  - `flota` -> `Flota`
  - `campo` -> `Campo`
  - `otro` -> `Otro`

---

## 5. UX

- Los badges se ubicaron debajo del nombre del lead, dentro de la celda principal.
- El estilo se mantuvo discreto y liviano.
- No se agrega CTA verde adicional.
- No se modifica el flujo ni las acciones de la lista.
- No se toca Kanban en esta fase.

---

## 6. NO-GO

- SQL
- Indices
- API nueva
- Supabase
- Kanban
- Reportes
- Zeta/Kore
- Datos demo
- Commit

---

## 7. Validacion tecnica

### Comandos

```bash
npm run build
```

```bash
rg "Vehículo parcial|Sin vehículo|getVehicleBadges|contract_fields_json|tipo_uso" app/admin/leads/page.tsx docs/constructor-crm/validacion-lista-badges-vehiculo-contract-fields-12W-6c.md
```

```bash
git status
```

### Resultado

| Check | Resultado |
|-------|-----------|
| `npm run build` | **OK** - exit code 0 |
| `rg` | **OK** - coincidencias en `app/admin/leads/page.tsx` (helper `getVehicleBadgesForLead`, badges `Vehículo parcial` y `Sin vehículo`) y en este documento |
| `git status` | **OK** - `app/admin/leads/page.tsx` modificado y `docs/constructor-crm/validacion-lista-badges-vehiculo-contract-fields-12W-6c.md` nuevo, sin commit |

---

## 8. QA manual sugerida

1. Abrir **Lista de Leads**.
2. Ver Toyota Hilux con badge `Toyota Hilux` y `Trabajo`.
3. Ver Ford 12W-5i como `Sin vehículo` si sigue con `contract_fields_json = {}`.
4. Ver leads sin vehiculo con badge tenue `Sin vehículo`.
5. Confirmar que los filtros `12W-6b` siguen funcionando.
6. Confirmar que no hay CTA verde adicional.

---

## 9. Dictamen

- **GO tecnico** si `build` OK.
- **QA Vercel pendiente** para fase `12W-6c-QA`.

---

## 10. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | Si |
| API modificada | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Commit | No |

---

## 11. Cierre

La implementacion queda acotada a la Lista de Leads y aprovecha `contract_fields_json` ya presente en frontend para dar contexto visual rapido, sin cambiar filtros, backend ni acciones de la pantalla.
