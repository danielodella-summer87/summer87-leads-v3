# Validación Vercel Ficha Lead Vehículo contract_fields 12W-5g-QA — Constructor CRM Summer87

**Versión:** 12W-5g-QA — validación visual en Vercel  
**Proyecto:** summer87-leads-v3  
**Base:** **12W-5g** — commit **`5dbcb82`** (*Show vehicle contract fields on lead detail*)

---

## 1. Resumen ejecutivo

- QA visual en Vercel **completada**.
- La ficha del lead muestra el bloque **Vehículo** leyendo `contract_fields_json`.
- Datos visibles: Toyota, Hilux, 2022, QA1234, **Trabajo**.
- Bloque **solo lectura**, sin edición.
- **Dictamen:** **GO**

---

## 2. Entorno

| Ítem | Valor |
|------|--------|
| URL | https://pickup4x4-crm-demo.vercel.app/admin/leads/c17d12fc-352b-4d6c-931c-b5ab2139f0e6 |
| App | pickup4x4-crm-demo.vercel.app |
| Fecha | 2026-05-22 |
| Ejecutor | Daniel |
| Commit base | `5dbcb82` |

**Lead QA:**

| Campo | Valor |
|-------|--------|
| `id` | `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` |
| `nombre` | Demo QA 12W-5 — Toyota Hilux |

**`contract_fields_json` (validado en 12W-5-QA):**

| Clave | Valor |
|-------|--------|
| `marca` | Toyota |
| `modelo` | Hilux |
| `año` | 2022 |
| `matricula` | QA1234 |
| `tipo_uso` | trabajo |

---

## 3. Evidencia visual

Lo observado en captura de pantalla en Vercel:

- El **header** muestra el lead **Demo QA 12W-5 — Toyota Hilux**.
- Tab **Datos** activo.
- Bloque **Seguimiento piloto** arriba.
- Bloque **Vehículo** debajo de Seguimiento piloto.
- Bloque **Datos del lead** debajo.
- El bloque **Vehículo** muestra:
  - **Marca:** Toyota
  - **Modelo:** Hilux
  - **Año:** 2022
  - **Matrícula:** QA1234
  - **Uso del vehículo:** Trabajo

Microcopy del bloque indica que son datos del vehículo asociados a la oportunidad. No hay campos editables ni botones dentro del bloque.

---

## 4. Checks

| Check | Resultado |
|-------|-----------|
| Ficha carga sin error | **GO** |
| Bloque Vehículo visible | **GO** |
| Marca visible | **GO** |
| Modelo visible | **GO** |
| Año visible | **GO** |
| Matrícula visible | **GO** |
| Uso visible y formateado en español | **GO** |
| Sin inputs editables | **GO** |
| Sin botones en el bloque | **GO** |
| No rompe flujo del proceso | **GO** |
| No rompe Seguimiento piloto | **GO** |

---

## 5. Observaciones

- La ficha **todavía no permite editar** vehículo; correcto para **12W-5g**.
- La visualización depende de `contract_fields_json` cargado en **12W-5-QA**.
- No se crearon nuevos leads en esta QA visual.
- No se tocó Supabase en esta validación.

---

## 6. Fuera de alcance / NO-GO

- Editar vehículo desde ficha
- PATCH `contract_fields_json`
- Reportes por marca/modelo
- Kanban mostrando vehículo
- SQL, API o migraciones
- Zeta/Kore

---

## 7. Dictamen final

| Criterio | Veredicto |
|----------|-----------|
| **12W-5g-QA** | **GO** |
| Ficha muestra vehículo desde `contract_fields_json` | **GO** |

**Próximo paso sugerido:**

- **12W-5h** — si se quiere editar vehículo desde ficha.
- **12W-6** — si se quiere reportar/filtrar por marca/modelo.

---

## 8. Confirmación de alcance

| Aspecto | Estado |
|---------|--------|
| Código modificado | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos creados | **No** |
| Solo documentación | **Sí** |
| Commit | **No** |

---

*QA visual ejecutada por Daniel el 2026-05-22 en pickup4x4-crm-demo.vercel.app.*
