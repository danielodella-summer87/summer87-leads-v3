# Contrato de persistencia del paquete instalable — Summer87 Leads v3

## 1. Propósito

Este documento define **cómo debería evolucionar** el endpoint de la **fase 8A** (`POST /api/admin/constructor/installable-package/generate`) para **persistir un borrador** del paquete instalable en la tabla **`public.installer_package_drafts`**, una vez que la migración **8B** esté aplicada y las políticas de acceso (RLS / service role) estén definidas.

- **No modifica** código de aplicación.
- **No aplica** SQL ni migraciones en Supabase.
- Es **contrato técnico previo** a la implementación de la fase **8C** (persistencia real).

## 2. Principio rector

> **Guardar un draft no instala un CRM; solo conserva un snapshot revisable para control humano posterior.**

La fila en `installer_package_drafts` es un **artefacto de revisión**, no el CRM operativo del cliente ni una instalación completada.

## 3. Estado actual

- **8A:** el endpoint genera un **preview en memoria** y devuelve JSON sin `INSERT` (comportamiento actual documentado en `docs/CONTRATO_ENDPOINT_PAQUETE_INSTALABLE_8A.md`).
- **8B:** existe una **migración versionada** en Git (`migrations/20260513000000_create_installer_package_drafts.sql`) que define `public.installer_package_drafts`.
- La migración **8B no ha sido aplicada** en Supabase en el contexto de esta fase documental; la tabla puede no existir aún en entornos remotos.
- **No hay persistencia activa** del paquete en base de datos vinculada al endpoint 8A en esta fase.

## 4. Endpoint futuro afectado

**Ruta actual / futura:**

`POST /api/admin/constructor/installable-package/generate`

En una **fase futura (8C)**, el mismo endpoint podría:

- Aceptar `mode: "draft"` para **intentar persistir** un borrador (además del `preview` actual).
- Mantener `preview` como **comportamiento por defecto** sin `INSERT`.

El contrato exacto del body y headers se alineará al documento 8A y a esta extensión.

## 5. Modos esperados

| mode | Comportamiento | Persistencia | Riesgo |
|------|----------------|----------------|--------|
| `preview` | Igual que hoy: arma paquete en memoria, respuesta no vinculada a fila en DB. | **No** persiste. | Bajo (sin estado en DB). |
| `draft` | Arma el mismo snapshot lógico y, si políticas lo permiten, ejecuta `INSERT` en `installer_package_drafts`. | **Sí**, si usuario autorizado, tabla existe, validaciones pasan y mecanismo RLS/service role resuelto. | Medio–alto: requiere controles estrictos de payload, tenant y secretos. |

**Definiciones:**

- **`preview`:** no persiste; no depende de que exista la tabla.
- **`draft`:** persiste borrador **solo** si el usuario tiene **permiso explícito**, la tabla **existe**, pasan validaciones de payload/contexto y el mecanismo de acceso a datos (ver sección 9) está operativo.

## 6. Campos a insertar en `installer_package_drafts`

| Columna | Fuente | Valor inicial sugerido |
|---------|--------|-------------------------|
| `constructor_id` | Contexto seguro + cuerpo validado (no confiar solo en body sin comprobación) | UUID del constructor alcanzable por el actor, o `NULL` si el modelo no lo materializa aún |
| `target_client_id` | Validación servidor contra contexto / pertenencia | UUID válido o `NULL` |
| `package_version` | Constante de versión de formato | `"8B-draft-v1"` (o la versión vigente acordada) |
| `status` | Política de flujo | `"draft_generated"` |
| `package_payload` | Snapshot serializado del paquete (sin secretos) | Objeto JSON alineado a subclaves (`installation_manifest`, etc.) |
| `blocked_actions` | Misma lógica que preview + política | Array JSON (no vacío si negocio lo exige) |
| `warnings` | Preview + advertencias de normalización / negocio | Array JSON |
| `requires_human_confirmation` | Política | `true` |
| `human_confirmation_status` | Estado inicial humano | `"pending"` |
| `requested_by` | **Solo** usuario autenticado en servidor | UUID del actor; **nunca** desde body libre |
| `generated_at` | Servidor | `now()` |
| `expires_at` | Política de negocio | `now() + intervalo` (p. ej. 7 o 14 días) |

Columnas como `reviewed_by`, `approved_by`, `rejected_*` quedan `NULL` en el alta salvo flujos explícitos posteriores.

## 7. Valores iniciales recomendados

- **`package_version`:** `"8B-draft-v1"` (o versión acordada al implementar).
- **`status`:** `"draft_generated"`.
- **`requires_human_confirmation`:** `true`.
- **`human_confirmation_status`:** `"pending"`.
- **`generated_at`:** `now()` (o equivalente en capa de aplicación consistente con DB).
- **`expires_at`:** `now()` + intervalo definido por negocio (**p. ej. 7 o 14 días**) para evitar operar con borradores obsoletos.
- **`requested_by`:** derivado **exclusivamente** del contexto autenticado en servidor (**nunca** desde el body del cliente).

## 8. Seguridad de inserción

- **No** aceptar `requested_by` desde el body.
- **No** aceptar `company_id` / `tenant_id` libres desde el body sin validación contra **contexto seguro** resuelto en servidor.
- **`target_client_id`** debe **validarse** contra pertenencia y permisos (anti–tenant spoofing).
- **`package_payload`** debe pasar por **limpieza / denylist** de secretos (ver sección 13) y, idealmente, validación de esquema en fases posteriores.
- **`blocked_actions`** debe estar **presente** y coherente con la política de riesgo (alineado al preview 8A).
- **`warnings`** debe **conservar** las advertencias ya calculadas en preview más las de persistencia (p. ej. RLS, expiración).
- **Zeta** permanece **solo lectura / bloqueado** en el modelo de integraciones; el draft no debe representar escritura a Zeta.
- El **cliente final** del CRM operativo **no** debe poder **crear ni leer** drafts (solo roles internos autorizados).

## 9. Service role vs RLS

Decisiones a tomar **explícitamente** en la fase de implementación **8C**:

- **Service role:** si el servidor usa cliente Supabase con **service role**, debe estar **encapsulado** solo en el runtime del API route / servidor, **nunca** enviarse al cliente ni incluirse en `package_payload`.
- **Sesión + RLS:** si se usa el cliente con **JWT de usuario** y políticas RLS, deben existir **policies** que permitan `INSERT`/`SELECT` acotados; hoy la migración **8B** dejó **RLS habilitado sin policies** → una inserción “normal” con rol sujeto a RLS tendería a **denegarse** (deny-by-default).
- La fase **8C** debe **documentar y codificar** el mecanismo elegido (bypass controlado con service role en servidor **o** policies mínimas + sesión), y los tests de seguridad asociados.

## 10. Errores esperados

| Código | Cuándo ocurre | Acción sugerida |
|--------|----------------|-----------------|
| `DRAFT_MODE_DISABLED` | `draft` solicitado pero feature o permiso aún no habilitado. | Usar `preview` o esperar despliegue de 8C. |
| `TABLE_NOT_AVAILABLE` | La tabla no existe (migración 8B no aplicada). | Aplicar migración en entorno controlado o seguir en `preview`. |
| `UNAUTHORIZED` | Sin sesión o identidad de actor. | Reautenticar. |
| `FORBIDDEN` | Sin permiso para persistir draft. | Escalar a admin interno. |
| `CONSTRUCTOR_NOT_FOUND` | `constructor_id` inexistente o fuera de alcance. | Verificar ID y permisos. |
| `TARGET_CLIENT_INVALID` | `target_client_id` inválido o no pertenece al contexto. | Corregir o omitir según política. |
| `PAYLOAD_CONTAINS_SECRET` | Denylist u heurística detecta material sensible. | Sanear Constructor / payload y reintentar. |
| `DATABASE_INSERT_FAILED` | Error genérico de DB no clasificado. | Revisar logs servidor; no reintentar en bucle sin diagnóstico. |
| `RLS_BLOCKED` | Política RLS impide `INSERT`/`SELECT`. | Ajustar policies o usar ruta servidor acordada (sección 9). |
| `HUMAN_CONFIRMATION_REQUIRED` | Negocio exige confirmación antes de continuar otro flujo. | Flujo UI/API de confirmación explícita (fase 8E+). |

## 11. Response esperada al persistir

JSON **conceptual** tras `INSERT` exitoso en modo `draft`:

```json
{
  "ok": true,
  "packageId": "uuid",
  "status": "draft_generated",
  "persisted": true,
  "requiresHumanConfirmation": true,
  "draft": {
    "id": "uuid",
    "status": "draft_generated",
    "humanConfirmationStatus": "pending",
    "expiresAt": "ISO"
  },
  "warnings": [],
  "blockedActions": [],
  "nextHumanAction": "review_persisted_draft"
}
```

Los UUIDs son ejemplos; `packageId` en este contrato alinea el identificador del **draft persistido** (p. ej. igual a `draft.id` o referencia explícita en documentación de implementación).

## 12. Response esperada cuando sigue en `preview`

El modo **`preview`** conserva el comportamiento de **8A**:

- `persisted`: **`false`** o **ausente** del contrato (definición única en implementación).
- `packageId`: **`"preview-only"`** (u otra convención ya establecida en 8A).
- **Sin** `INSERT` en `installer_package_drafts`.
- **Sin** dependencia de que la tabla exista en el entorno.

## 13. Validación de secretos

**Denylist conceptual** de claves o fragmentos prohibidos dentro de `package_payload` (y subárboles), sin pretender ser exhaustiva:

- `service_role`, `serviceRole`
- `access_token`, `refresh_token`
- `api_key`, `secret`, `password`
- `authorization`, `bearer`
- `private_key`

Esto **no reemplaza** una validación de **esquema formal** (JSON Schema / contrato versionado) que debería añadirse en fases posteriores.

## 14. Auditoría futura

Debería poder registrarse / inferirse desde la fila y logs:

- `requested_by`, `generated_at`, `status`
- `warnings`, `blocked_actions`
- Transiciones posteriores (`reviewed_by`, `approved_by`, `rejected_by`, timestamps)
- Eventual tabla de **eventos** o log append-only si el producto lo exige

## 15. Relación con confirmación humana

- **Persistir** un draft **no** equivale a **aprobar** instalación ni CRM.
- El draft **inicia** con `human_confirmation_status: "pending"`.
- Solo una **fase posterior** (p. ej. 8E) puede pasar a `approved` con acción explícita y trazabilidad.
- **`approved_for_pilot`** no debe ser **estado inicial** del registro al insertar.

## 16. Relación con instalación piloto

- **Ningún** draft debe **instalar CRM automáticamente**.
- La **instalación piloto** debe ser **otra fase explícita** (p. ej. 8G), con dependencias de: aprobación humana, permisos, logs, validación post-instalación y controles de rollback.

## 17. Riesgos

- Persistir **payload con secretos**.
- **Saltarse RLS** con service role **sin** controles ni auditoría.
- Confiar en **`target_client_id` del body** sin validación.
- Permitir que el **cliente final** cree o lea drafts.
- **Aprobar** un draft **viejo** o desalineado del Constructor.
- Usar un draft para **instalar** sin **confirmación** explícita.
- **Mezclar datos** entre tenants.
- Guardar datos de **Zeta** de forma indebida en el payload.

## 18. Criterios de aceptación futura

- `mode: "preview"` **sigue sin persistir**.
- `mode: "draft"` **solo persiste** si el usuario está **autorizado** y el sistema cumple validaciones.
- `requested_by` se obtiene del **contexto autenticado**.
- `package_payload` **no** contiene secretos detectados por las reglas acordadas.
- **RLS / service role** definidos y probados **explícitamente**.
- **No** instala CRM, **no** crea tenant, **no** crea usuarios, **no** escribe en Zeta.
- Devuelve **id de draft** cuando persiste.
- Mantiene **`human_confirmation_status: "pending"`** al crear.

## 19. Fases futuras sugeridas

| Fase | Descripción |
|------|-------------|
| **8C** | Implementar persistencia `draft` en el endpoint (tras aplicar migración y definir acceso DB). |
| **8D** | Vista interna de revisión del draft persistido. |
| **8E** | Confirmación humana explícita (transición de estados). |
| **8F** | Aprobar draft para piloto (`approved_for_pilot` con controles). |
| **8G** | Instalación piloto **controlada** (separada del solo `INSERT` del draft). |

---

*Documento de fase **8C-doc**. No modifica código, endpoint ni migraciones; no ejecuta SQL.*
