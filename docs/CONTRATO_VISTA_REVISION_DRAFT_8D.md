# Contrato de vista interna de revisión de draft — Summer87 Leads v3

## 1. Propósito

Este documento define la **futura vista interna** para **revisar** borradores persistidos en **`public.installer_package_drafts`**, en continuidad con el endpoint de generación/persistencia (**fase 8C**) y el modelo de datos (**8B** / **8B-doc**).

- **No implementa** UI, rutas ni endpoints.
- **No modifica** datos en base ni en Zeta.
- Sirve como **contrato de producto, UX y seguridad** antes de la implementación de la fase **8D** (pantalla real).

## 2. Principio rector

> **Revisar un draft no equivale a aprobarlo ni instalar un CRM; solo permite inspeccionar el paquete persistido antes de una decisión humana posterior.**

La vista es de **inspección y trazabilidad**, no de **activación** del CRM operativo del cliente.

## 3. Estado actual

- **8C** permite persistir borradores vía `POST /api/admin/constructor/installable-package/generate` con `mode: "draft"`.
- La tabla **`installer_package_drafts`** existe en **Supabase remoto** (tras migración **8B** aplicada y validada).
- Los registros nacen típicamente con **`status: draft_generated`** y **`human_confirmation_status: pending`**.
- **No existe** todavía una **vista interna** dedicada en el Constructor para listar ni inspeccionar esos drafts desde la UI.

## 4. Ruta futura sugerida

**Listado (propuesta, aún no creada):**

`/admin/constructor/paquetes`

**Detalle (propuesta, aún no creada):**

`/admin/constructor/paquetes/[id]`

Ambas rutas vivirían bajo el **Constructor** (privado Summer87 / instalador / roles internos autorizados), no bajo el CRM operativo del cliente final.

## 5. Quién puede acceder

**Puede acceder (conceptualmente):**

- **superadmin**
- **instalador autorizado**
- **usuario interno Summer87** con permiso explícito (clave de permiso a definir en implementación, p. ej. lectura de paquetes instalables)

**No debe acceder:**

- **cliente final** del CRM operativo
- **comerciales** u operadores en nombre del cliente sin rol interno explícito
- **usuarios** del CRM operativo que no formen parte del modelo interno de instalación

## 6. Vista listado

Tabla o grilla sugerida con columnas:

| Columna sugerida | Notas |
|------------------|--------|
| Fecha de generación | `generated_at` o `created_at` |
| Estado | `status` (texto + badge, sin mutación en 8D) |
| `package_version` | Versión lógica del paquete |
| `constructor_id` | Referencia fuente (o “—” si null) |
| `target_client_id` | Metadata validada (o “—” si null) |
| `requested_by` | Quien solicitó el draft (solo lectura) |
| `expires_at` | Caducidad del borrador |
| Conteo de warnings | Derivado de `warnings` (JSON array) |
| Conteo de `blocked_actions` | Derivado de `blocked_actions` (JSON array) |
| Acción | **Ver detalle** (navegación a `/admin/constructor/paquetes/[id]`) |

**En la fase 8D de implementación:** el listado **no** debe incluir acciones de **aprobar**, **instalar** ni **rechazar** todavía.

## 7. Vista detalle

Secciones sugeridas (solo lectura, datos desde fila + `package_payload`):

1. **Resumen del draft** — id, versiones, fechas, estado, expiración, solicitante.
2. **Estado humano** — `human_confirmation_status`, `requires_human_confirmation`, texto guía.
3. **Manifest** — subárbol `installation_manifest` (o equivalente en payload).
4. **Identidad cliente** — `client_identity`.
5. **Módulos CRM** — `crm_modules_config`.
6. **Pipeline** — `pipeline_config`.
7. **Campos de leads** — `lead_fields_config`.
8. **Permisos** — `permissions_config`.
9. **Reglas IA** — `ai_rules_config`.
10. **Reportes** — `reports_config`.
11. **Integraciones** — `integrations_config` (solo lectura; Zeta no editable).
12. **Decisiones del instalador** — `installer_decisions`.
13. **Checklist de activación** — `activation_checklist`.
14. **Warnings** — lista legible desde JSON.
15. **Acciones bloqueadas** — lista legible desde JSON.
16. **Auditoría técnica** — bloque descriptivo (readiness, notas internas, enlaces a Auditoría del Constructor si aplica en fases posteriores), sin ejecutar validaciones reales desde esta pantalla en 8D.

La presentación puede usar acordeones o tabs; el contrato no prescribe el layout exacto.

## 8. Acciones permitidas en 8D

**Solo:**

- Ver **listado** de drafts autorizados.
- **Abrir detalle** de un draft por id.
- **Copiar ID** (clipboard) del draft.
- **Leer** JSON / secciones estructuradas en modo lectura (expandir, syntax highlight opcional).
- **Volver** al listado o al flujo previo del Constructor.

**No permitir en 8D:**

- **Aprobar** o **rechazar** draft.
- **Instalar** CRM o disparar instalación.
- **Crear CRM**, **tenant**, **usuarios**.
- **Escribir en Zeta**.
- **Borrar** draft (salvo fase futura explícita con confirmación y políticas).

## 9. Estados visibles

La UI debe **mostrar** de forma clara los valores de `status`, por ejemplo:

| Estado | Lectura sugerida en UI |
|--------|-------------------------|
| `draft_generated` | Borrador recién creado, pendiente de revisión. |
| `under_review` | En revisión interna. |
| `changes_requested` | Se pidieron cambios (sin mutación desde 8D). |
| `approved_for_pilot` | Marcado en flujos posteriores; 8D solo muestra. |
| `rejected` | Rechazado; solo lectura. |
| `expired` | Caducado; alerta visual. |
| `superseded` | Reemplazado por otro draft. |
| `archived` | Archivado; solo consulta. |

**8D-doc / implementación 8D inicial:** la vista **no cambia** estados; cualquier transición queda para **8E** u otras fases con API y confirmación explícita.

## 10. Semáforos UX

Propuesta de **código de color informativo** (no sustituye reglas de negocio ni “aprobación”):

| Semáforo | Uso sugerido |
|----------|----------------|
| **Verde** | Draft revisable sin **warnings críticos** adicionales ni estado `expired`/`rejected` (definición de “crítico” en producto). |
| **Ámbar** | Hay **warnings** o requiere atención humana antes de cualquier siguiente paso. |
| **Rojo** | `expired`, `rejected`, o estado considerado **no apto** para continuar sin nueva generación. |

El color **no aprueba** ni **habilita instalación**; solo orienta la lectura.

## 11. Seguridad

- **No** exponer **secretos** ni tokens en UI ni en respuestas al navegador.
- **No** mostrar **service role** ni claves de ningún tipo.
- **No** exponer el **Constructor** al cliente final a través de esta vista.
- **No** permitir acciones **destructivas** desde la UI de 8D.
- Si se muestra **`package_payload`**, debe ser **lectura controlada** (render seguro, truncamiento de campos enormes opcional).
- **Evitar** datos sensibles **innecesarios** (principio de mínima exposición).
- **Zeta** solo como contexto **read-only** / bloqueado en copy; **no** como destino editable.

## 12. Lectura desde Supabase

Decisiones para la **implementación** futura:

- Puede usarse un **endpoint interno** server-side (`GET` bajo `/api/admin/...`) que liste y devuelva drafts **filtrados por permiso**.
- **No** leer desde el **browser** directamente contra Supabase si **RLS** no tiene **policies** adecuadas (hoy la migración 8B dejó RLS sin policies permisivas → acceso típico vía **servidor** con **service role encapsulado** o policies futuras muy acotadas).
- Si se usa **service role**, debe limitarse al **runtime del servidor** (Route Handlers / Server Actions), nunca en cliente.
- **No** crear policies **permisivas** para el cliente final.

## 13. Endpoints futuros sugeridos

**Propuesta (no se crean en esta fase):**

- `GET /api/admin/constructor/installable-package/drafts` — listado paginado / filtros básicos (`status`, `expires_at`, etc.).
- `GET /api/admin/constructor/installable-package/drafts/[id]` — detalle de un draft por `id`.

Autenticación y permisos alineados a **8A/8C** (`config.read` o permiso más específico a definir).

## 14. Response conceptual listado

```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "status": "draft_generated",
      "packageVersion": "8B-draft-v1",
      "constructorId": "uuid-or-null",
      "targetClientId": "uuid-or-null",
      "requestedBy": "uuid-or-null",
      "generatedAt": "ISO-8601",
      "expiresAt": "ISO-8601-or-null",
      "warningsCount": 0,
      "blockedActionsCount": 10
    }
  ],
  "nextCursor": null
}
```

## 15. Response conceptual detalle

```json
{
  "ok": true,
  "draft": {
    "id": "uuid",
    "status": "draft_generated",
    "packageVersion": "8B-draft-v1",
    "humanConfirmationStatus": "pending",
    "requiresHumanConfirmation": true,
    "constructorId": "uuid-or-null",
    "targetClientId": "uuid-or-null",
    "requestedBy": "uuid-or-null",
    "generatedAt": "ISO-8601",
    "expiresAt": "ISO-8601",
    "reviewedAt": null,
    "approvedAt": null,
    "rejectedAt": null
  },
  "package": {},
  "warnings": [],
  "blockedActions": []
}
```

Los objetos `package`, `warnings` y `blockedActions` reflejan las columnas JSONB almacenadas, sin secretos.

## 16. Errores esperados

| Código | Cuándo ocurre | Acción sugerida |
|--------|----------------|-----------------|
| `UNAUTHORIZED` | Sin sesión válida. | Reautenticar. |
| `FORBIDDEN` | Sin permiso para listar o ver drafts. | Solicitar rol interno adecuado. |
| `DRAFT_NOT_FOUND` | `id` inexistente o fuera de alcance. | Verificar id y permisos. |
| `TABLE_NOT_AVAILABLE` | Tabla no desplegada en el entorno. | Aplicar migración 8B en ese entorno. |
| `DATABASE_READ_FAILED` | Error genérico de lectura. | Revisar logs servidor; mensaje genérico al cliente. |
| `PAYLOAD_UNREADABLE` | JSON corrupto o no deserializable. | Marcar draft como problemático en proceso interno; no exponer stack al usuario. |

## 17. Relación con confirmación humana

- **8D** solo **revisa** contenido ya persistido.
- La **aprobación humana explícita** será **8E** (botones / flujos de transición de estado).
- En **8D** **no** debe haber botón **Aprobar** todavía.
- En **8D** **no** debe haber botón **Instalar**.

## 18. Relación con instalación piloto

- Ningún draft mostrado en **8D** debe **instalar CRM** por el hecho de visualizarse.
- La **instalación piloto** es **fase posterior** (**8G** u homónima).
- El detalle prepara **información para decidir**; no **ejecuta** instalación.

## 19. Criterios de aceptación futura

Cuando se implemente la **8D** en código:

- El **listado** carga drafts **internos** autorizados.
- El **detalle** carga un draft por **ID** con la misma regla de acceso.
- **No** es visible al **cliente final** en rutas operativas.
- **No** permite **aprobar** ni **instalar**.
- **No** modifica la base desde acciones de UI de esta fase.
- **No** escribe en **Zeta**.
- Muestra **warnings** y **blocked_actions** de forma legible.
- Muestra **`human_confirmation_status`** y `requires_human_confirmation`.
- Mantiene **lectura segura** del payload (sin secretos, sin acciones destructivas).

## 20. Fases futuras sugeridas

| Fase | Descripción |
|------|-------------|
| **8D** | Implementar vista **listado / detalle** solo lectura según este contrato. |
| **8E** | **Confirmación humana explícita** (transiciones de estado, UI de aprobación/rechazo acotada). |
| **8F** | **Aprobar** draft para **piloto** con controles adicionales. |
| **8G** | **Instalación piloto controlada** (fuera del alcance de la sola revisión visual). |

---

*Documento de fase **8D-doc**. No implementa UI, rutas, endpoints ni cambios en base de datos.*
