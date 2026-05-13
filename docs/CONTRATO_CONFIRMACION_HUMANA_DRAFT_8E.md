# Contrato de confirmación humana de draft — Summer87 Leads v3

## 1. Propósito

Este documento define el **contrato futuro** para **aprobar o rechazar explícitamente** un borrador persistido en **`public.installer_package_drafts`**, en continuidad con la persistencia (**8C**) y la revisión solo lectura (**8D** / **8D-doc**).

- **No implementa** UI, botones, modales ni endpoints.
- **No modifica** estados en base de datos ni escribe en Zeta.
- Sirve como **contrato de producto, seguridad, auditoría y UX** antes de las implementaciones **8E** (API) y **8E-ui** (pantalla).

## 2. Principio rector

> **Confirmar humanamente un draft no instala un CRM; solo autoriza que el paquete pase a una fase posterior de piloto controlado.**

La confirmación humana es un **hit de gobernanza** sobre el artefacto persistido, no un disparador de instalación ni de provisión de tenant.

## 3. Estado actual

- **8C** persiste borradores vía el endpoint de generación con `mode: "draft"` en **`installer_package_drafts`**.
- **8D** permite **listar** y **ver detalle** en **`/admin/constructor/paquetes`** y **`/admin/constructor/paquetes/[id]`** en modo **solo lectura** (sin mutación).
- Los registros suelen nacer con **`status: draft_generated`** y **`human_confirmation_status: pending`**.
- **No existe** todavía flujo de **aprobación o rechazo** desde UI ni endpoints dedicados de transición de estado.

## 4. Estados involucrados

Campos de la fila relevantes para gobernanza y auditoría (todos actualizados solo vía **servidor** en fases futuras, nunca confiando en el body del cliente para identidad o tiempos):

| Campo | Rol |
|-------|-----|
| **`status`** | Estado del ciclo de vida del borrador (máquina de estados del paquete). |
| **`human_confirmation_status`** | Resultado explícito de la decisión humana: pendiente / aprobada / rechazada. |
| **`approved_by`** | Usuario interno que aprobó (UUID de contexto autenticado). |
| **`approved_at`** | Marca temporal de aprobación (servidor). |
| **`rejected_by`** | Usuario interno que rechazó. |
| **`rejected_at`** | Marca temporal de rechazo (servidor). |
| **`rejection_reason`** | Motivo obligatorio en rechazo (texto). |
| **`reviewed_by`** | Opcional: quien marcó revisión o solicitó cambios (según subfase). |
| **`reviewed_at`** | Marca temporal asociada a revisión o solicitud de cambios. |
| **`updated_at`** | Actualización automática del registro (trigger existente). |

## 5. Transiciones futuras permitidas

Las transiciones siguientes son **orientativas** para implementación; la primera entrega de **8E** puede limitarse a **aprobar** y **rechazar** únicamente, dejando “marcar en revisión”, “solicitar cambios”, “archivar” y “expirar” para **subfases** o jobs dedicados.

| Acción humana | `status` anterior permitido | `status` nuevo | `human_confirmation_status` nuevo |
|---------------|----------------------------|----------------|-----------------------------------|
| Marcar en revisión | `draft_generated` | `under_review` | `pending` (sin cambio semántico hasta decisión) |
| Solicitar cambios | `under_review` o `draft_generated` | `changes_requested` | `pending` |
| Aprobar para piloto | `under_review` o `draft_generated` | `approved_for_pilot` | `approved` |
| Rechazar | `under_review` o `draft_generated` | `rejected` | `rejected` |
| Archivar | `rejected`, `expired`, `superseded` | `archived` | **Conserva** el último estado humano relevante (`approved` / `rejected` / `pending` según corresponda; no “borra” la decisión previa) |
| Expirar (job/sistema) | `draft_generated`, `under_review`, `changes_requested` | `expired` | `pending` (la expiración no equivale a confirmación humana) |

**Nota de alcance:** la fase **8E-doc** no implementa ninguna de estas transiciones. La **8E** inicial de implementación puede **reducirse** solo a **aprobar** y **rechazar** desde estados permitidos, validando reglas de negocio y seguridad del apartado 16.

## 6. Acciones explícitamente bloqueadas

Aprobar un draft (incluso en **`approved_for_pilot`**) **no** habilita por sí solo:

- **Instalar CRM** ni provisionar instancia operativa.
- **Crear tenant** ni espacio aislado de cliente.
- **Crear usuarios** ni cuentas operativas.
- **Enviar invitaciones**.
- **Escribir en Zeta** (Zeta sigue siendo solo lectura salvo fases explícitas futuras con controles aparte).
- **Borrar datos** del CRM o del Constructor.
- **Publicar en producción** el paquete o exponer configuración sensible.
- **Exponer el Constructor al cliente final** como si fuera entrega final del sistema.

Esas capacidades permanecen alineadas con **`blocked_actions`** y con fases posteriores (**8F**, **8G**) con validaciones y permisos adicionales.

## 7. Reglas para aprobar

Condiciones mínimas propuestas (todas evaluadas en **servidor**):

- **Usuario autorizado** (rol/permiso explícito distinto del solo `config.read` si el producto lo exige; a definir en 8E junto a RBAC).
- El **draft existe** y el id es UUID válido.
- El draft **no está expirado** (`expires_at` nulo o en el futuro, según regla acordada).
- El draft **no está rechazado** ni en estado terminal incompatible (p. ej. no `archived` si la política lo prohíbe).
- El draft **no está archivado** (si la política exige aprobar solo desde estados activos).
- **`package_payload`** es **legible** y objeto JSON válido coherente con el CHECK existente.
- **`blocked_actions`** está **presente** (array) y se mantiene como lista de inhibidores; la aprobación humana no los elimina automáticamente.
- **`warnings`** visibles al usuario en UI antes de confirmar (y en logs de auditoría si aplica).
- **`human_confirmation_status`** es **`pending`** (o la política permite re-aprobación solo desde estados explícitos, si se define).
- El usuario debe **aceptar texto explícito** de comprensión (ver sección 9) vía payload (`confirmationTextAccepted: true` validado en servidor, no solo en cliente).
- **`approved_by`** se toma **solo** del contexto autenticado (nunca del body).
- **`approved_at`** lo genera el **servidor** (timestamp fiable).

## 8. Reglas para rechazar

- **Usuario autorizado** (misma línea de permisos que aprobar, o más amplia según decisión de producto).
- El **draft existe**.
- **`rejection_reason`** es **obligatorio** y no vacío (sanitizado/longitud máxima en servidor).
- **`rejected_by`** sale del **contexto autenticado** únicamente.
- **`rejected_at`** lo genera el **servidor**.
- **No borra** el draft: el registro queda como **evidencia** y trazabilidad.
- **No instala** nada ni toca Zeta ni crea tenants/usuarios.

## 9. Confirmación explícita en UI

Diseño propuesto (para **8E-ui**, no en esta fase):

- Botón secundario **“Rechazar draft”** (estilo destructivo suave, no borrado físico).
- Botón principal de aprobación: **no** usar verde “éxito” si implica confusión con “CRM listo”; si es el único CTA positivo, usar verde **solo** si el copy deja claro que **no hay instalación** (copy del principio rector).
- **Modal de confirmación** obligatorio para ambas ramas (aprobar y rechazar).
- Texto obligatorio de lectura, por ejemplo:  
  **“Entiendo que aprobar este draft no instala el CRM y solo habilita revisión para piloto.”**
- **Checkbox obligatorio** (“He leído y comprendo”) enlazado al envío; el servidor debe validar `confirmationTextAccepted` en approve.
- **Campo motivo obligatorio** para rechazo (vinculado a `rejection_reason`).
- Antes de confirmar, mostrar **warnings** y **blocked_actions** en el modal o en el paso previo (resumen).

## 10. Endpoints futuros sugeridos

Propuestos **solo como contrato**; **no se crean** en **8E-doc**:

- `POST /api/admin/constructor/installable-package/drafts/[id]/approve`
- `POST /api/admin/constructor/installable-package/drafts/[id]/reject`
- Opcional: `POST /api/admin/constructor/installable-package/drafts/[id]/mark-under-review`

## 11. Body conceptual approve

```json
{
  "confirmationTextAccepted": true,
  "note": "string | optional"
}
```

- `confirmationTextAccepted` debe ser **`true`** y validarse en servidor junto con la aceptación real del flujo (no confiar solo en el cliente).
- `note` opcional para auditoría complementaria (longitud acotada).

## 12. Body conceptual reject

```json
{
  "reason": "string"
}
```

- `reason` obligatorio; mapea a **`rejection_reason`** en base.

## 13. Response approve conceptual

```json
{
  "ok": true,
  "draft": {
    "id": "uuid",
    "status": "approved_for_pilot",
    "humanConfirmationStatus": "approved",
    "approvedAt": "ISO",
    "approvedBy": "uuid"
  },
  "nextHumanAction": "prepare_pilot_installation_review"
}
```

## 14. Response reject conceptual

```json
{
  "ok": true,
  "draft": {
    "id": "uuid",
    "status": "rejected",
    "humanConfirmationStatus": "rejected",
    "rejectedAt": "ISO",
    "rejectedBy": "uuid",
    "rejectionReason": "string"
  },
  "nextHumanAction": "regenerate_or_archive"
}
```

## 15. Errores esperados

| Código | Cuándo ocurre | Acción sugerida |
|--------|----------------|-----------------|
| `UNAUTHORIZED` | Sesión inválida o ausente según política de auth. | Volver a iniciar sesión o revisar cookies/headers. |
| `FORBIDDEN` | Usuario sin permiso para aprobar/rechazar. | Solicitar rol/permiso; no reintentar sin cambio. |
| `INVALID_DRAFT_ID` | Id no UUID o mal formado. | Corregir URL o parámetro. |
| `DRAFT_NOT_FOUND` | No existe fila para ese id. | Verificar id o listar drafts de nuevo. |
| `DRAFT_EXPIRED` | `expires_at` vencido según regla de negocio. | Regenerar draft o archivar según proceso. |
| `DRAFT_ALREADY_APPROVED` | Ya en `approved_for_pilot` (o política equivalente). | No re-aprobar; seguir flujo 8F/8G si aplica. |
| `DRAFT_ALREADY_REJECTED` | Ya rechazado. | No re-chazar; regenerar o archivar. |
| `DRAFT_ARCHIVED` | Estado archivado; no operable. | Solo lectura o reporting. |
| `CONFIRMATION_REQUIRED` | Falta aceptación explícita / `confirmationTextAccepted` inválido en approve. | Completar modal y checkbox. |
| `REJECTION_REASON_REQUIRED` | Rechazo sin motivo válido. | Completar campo `reason`. |
| `DATABASE_UPDATE_FAILED` | Error al persistir la transición. | Reintentar con idempotencia o revisar logs/DB. |
| `PAYLOAD_UNREADABLE` | Payload corrupto o no objeto según validación. | Escalar a ingeniería; no aprobar. |

## 16. Seguridad

- **No aceptar** `approved_by`, `rejected_by`, `approved_at`, `rejected_at`, `reviewed_at` ni timestamps equivalentes desde el **body**; solo servidor.
- **No permitir** cliente final ni operadores sin rol interno explícito.
- **No exponer** la service role key ni credenciales en respuestas o logs de cliente.
- Endpoints **solo server-side**; si se usa service role, **encapsulada** en Route Handlers o capa equivalente; preferir políticas RLS **no permisivas** para el cliente si en el futuro se lee con usuario JWT.
- Cada transición debe **registrar** el usuario autenticado en los campos `*_by` y tiempos en `*_at`.
- **No permitir** cambio de estado **arbitrario** (whitelist de transiciones + validación de estado origen).

## 17. Auditoría futura

- Cada transición debería quedar **trazada** (quién, cuándo, de qué estado a cuál).
- **Ideal:** tabla de **eventos** de ciclo de vida (`draft_events` o similar) en una fase posterior, con payload reducido y referencia al `draft_id`.
- **Mínimo viable:** los campos actuales (`approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`, `reviewed_by`, `reviewed_at`, `status`, `human_confirmation_status`, `updated_at`) sirven para una **primera versión** de auditoría en fila.
- Registrar **`note`** en approve y **motivo** en reject si existen.
- **Conservar** el draft como evidencia; el rechazo no implica borrado lógico obligatorio en v1.

## 18. Relación con instalación piloto

- **`approved_for_pilot`** significa “**listo para ser considerado** en un flujo de piloto”, **no** “CRM instalado”.
- Solo **habilita** trabajo posterior (**8F** — preparar draft aprobado; **8G** — instalación piloto **controlada**).
- Antes de cualquier instalación debe existir **nueva validación**, **permisos** y **logs** específicos de esa fase.
- La **instalación piloto** debe seguir siendo una **acción explícita y separada**, no un efecto colateral del approve.

## 19. Criterios de aceptación futura

- Aprobar establece **`status`** en **`approved_for_pilot`** (desde estados permitidos).
- Aprobar establece **`human_confirmation_status`** en **`approved`**.
- Rechazar establece **`status`** en **`rejected`**.
- Rechazar establece **`human_confirmation_status`** en **`rejected`**.
- **No** instala CRM, **no** crea tenant, **no** crea usuarios, **no** escribe en Zeta.
- **No** borra el draft.
- Requiere **usuario autorizado** y registro de **usuario + timestamp** en servidor.
- Rechazo exige **motivo** obligatorio.
- La UI muestra **advertencias** (y idealmente `blocked_actions`) **antes** de confirmar.

## 20. Fases futuras sugeridas

| Fase | Contenido sugerido |
|------|---------------------|
| **8E** | Implementar endpoints **approve** / **reject** (y opcionalmente `mark-under-review`) con validaciones y seguridad del §16. |
| **8E-ui** | Botones, modales, checkbox y campo de motivo en **`/admin/constructor/paquetes/[id]`**. |
| **8F** | Preparar draft **aprobado** para piloto (checklist técnica, permisos adicionales). |
| **8G** | **Instalación piloto controlada** (acción explícita, logs, rollback planificado). |

---

**8E-doc** cierra aquí: contrato acordado, **sin** implementación.
