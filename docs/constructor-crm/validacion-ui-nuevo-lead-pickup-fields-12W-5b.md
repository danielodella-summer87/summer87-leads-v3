# Validación UI Nuevo Lead Pickup Fields 12W-5b — Constructor CRM Summer87

**Versión:** 12W-5b — reorganización visual Nuevo Lead Pickup (sin persistencia nueva)  
**Proyecto:** summer87-leads-v3  
**Base:** `diseno-nuevo-lead-pickup-fields-12W-5a.md`

---

## 1. Resumen ejecutivo

- Nuevo Lead fue reorganizado visualmente en bloques Pickup (A–E) en `client_crm`.
- No se modificó POST ni `LeadCreatePayload`.
- Campos persistibles actuales se mantuvieron (mismos states y `createLead()`).
- Campos de vehículo quedan como bloque informativo «Preparado para próxima fase».
- Pipeline filtrado con `contractOnly=1` se mantiene sin cambios de lógica.

---

## 2. Alcance

**Incluido:**

- `app/admin/leads/nuevo/page.tsx`
- Reorganización visual por bloques
- Labels Pickup en `client_crm`
- Bloque vehículo no persistente (card informativa)
- Componente `FormSection` local
- Este documento

**Excluido:**

- API / `POST /api/admin/leads`
- SQL / Supabase / migraciones
- Persistencia vehículo, presupuesto, categoría, urgencia
- Kanban / Ficha / Lista / PipelinesTab / middleware / `.env` / Vercel
- Commit (por instrucción de fase)

---

## 3. Cambio UI

### Bloque A — Identificación del contacto

- Nombre / Razón social *, Contacto, Teléfono, Email, Origen
- Microcopy en `client_crm`: atribución y canal

### Bloque B — Vehículo (`client_crm` únicamente)

- Card con borde punteado; sin inputs editables ni states nuevos
- Campos previstos listados: Marca, Modelo, Año, Matrícula, Uso del vehículo
- Copy: compatibilidad/accesorios + aviso de persistencia en fase posterior

### Bloque C — Necesidad comercial

- `oferta` como textarea principal
- Label Pickup: «Producto o accesorio consultado»
- Nota: presupuesto estimado en fase futura (`client_crm`)

### Bloque D — Gestión comercial

- Etapa comercial (pipeline), próxima acción comercial, fecha de seguimiento, comercial responsable, observaciones (`notas`)
- Aviso fallback pipelines sin cambios
- Microcopy Kanban en `client_crm`

### Bloque E — Datos operativos opcionales

- `client_crm`: solo Dirección (rubro, personal, m², fecha revisión ocultos)
- Modos internos: Rubro, cantidad personal, superficie m², dirección, fecha revisión

**CTA:** un solo botón «Guardar» en cabecera (sin CTAs verdes adicionales).

---

## 4. Persistencia

| Campo UI | State / payload actual | Se guarda hoy | Nota |
|----------|------------------------|---------------|------|
| Nombre / Razón social | `nombre` | Sí | Label Pickup en `client_crm` |
| Contacto | `contacto` | Sí | |
| Teléfono | `telefono` | Sí | |
| Email | `email` | Sí | |
| Origen | `origen` | Sí | |
| Marca, Modelo, Año, Matrícula, Uso | — | **No** | Bloque B solo visual |
| Producto o accesorio | `oferta` | Sí | |
| Presupuesto / categoría / urgencia | — | **No** | Mención futura en copy |
| Etapa comercial | `pipeline` (nombre) | Sí | API `contractOnly=1` en `client_crm` |
| Próxima acción comercial | `next_activity_type` | Sí | |
| Fecha de seguimiento | `next_activity_at` | Sí | |
| Comercial responsable | `comercial_id` | Sí | Obligatorio al guardar |
| Observaciones | `notas` | Sí | |
| Dirección | `direccion` | Sí | Bloque E |
| Rubro | `rubro_id` | Sí | Solo modos internos (UI oculta en `client_crm`) |
| Cantidad personal / m² | `cantidad_personal`, `superficie_m2` | Sí | Solo internos; payload sin cambio |
| Fecha revisión | `visita_scheduled_at` | Sí | Solo internos; oculta en `client_crm` |

---

## 5. Comportamiento esperado

- En `client_crm` el formulario se percibe Pickup 4x4 por bloques.
- Pipeline sigue cargando 9 etapas contract (`getPipelinesUrl(true)`).
- Guardar envía el mismo payload que antes (sin campos vehículo).
- No se pierden campos legacy del payload en modos internos.
- Vehículo no se persiste y queda explícitamente señalado.

---

## 6. Riesgos

- Usuario puede esperar que vehículo se guarde al ver el bloque B.
- Formulario más largo (más scroll).
- Falta persistencia dinámica hasta 12W-5d.
- Modos internos comparten títulos de bloque (Gestión comercial) con labels mixtos aceptables.
- Próxima fase debe resolver mapping contrato → POST y JSONB/EAV.

---

## 7. QA sugerido

- [ ] Abrir `/admin/leads/nuevo` en Vercel con tenant `client_crm`
- [ ] Confirmar bloques A → E y bloque B informativo
- [ ] Confirmar Pipeline con 9 etapas contract
- [ ] Confirmar un solo botón «Guardar» principal
- [ ] No crear lead de prueba salvo que se pida explícitamente
- [ ] Revisar layout mobile y aviso fallback pipelines
- [ ] Modo interno: rubro y campos legacy siguen visibles en bloque E

---

## 8. Próximas fases

- **12W-5c** — Mapeo mínimo contrato → payload actual; selects alineados
- **12W-5d** — Decisión persistencia JSONB/EAV
- **12W-5-QA** — Validación Vercel con persistencia vehículo
- Opcional: POST lead demo controlado

---

## 9. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código funcional modificado | **Sí** — Nuevo Lead UI |
| POST modificado | **No** |
| Payload modificado | **No** |
| API modificada | **No** |
| SQL ejecutado | **No** |
| Supabase modificado | **No** |
| Datos modificados | **No** |
| Kanban/Ficha/Lista modificados | **No** |
| Build ejecutado | **Sí** — `npm run build` exit 0 |
| Commit | **No** |

---

## 10. Validación técnica obligatoria

_Resultados registrados al cerrar 12W-5b._

### `npm run build`

**Resultado:** exit code 0 — compilación y TypeScript OK (Next.js 16.0.11).

### `createLead` / payload sin cambios

Comando sugerido:

```bash
git diff app/admin/leads/nuevo/page.tsx | rg -n "createLead|LeadCreatePayload|const payload"
```

Criterio: el cuerpo de `createLead()` y las claves de `payload` permanecen iguales a la base pre-5b.

### `git status`

```
modified:   app/admin/leads/nuevo/page.tsx
untracked:  docs/constructor-crm/validacion-ui-nuevo-lead-pickup-fields-12W-5b.md
```

### Verificación `createLead` / payload

`git diff` no incluye cambios en `createLead`, `LeadCreatePayload` ni `const payload` — solo JSX de formulario y helpers `FormSection` / `Textarea.compact`.
