# Modelo de datos para borradores de paquete instalable — Summer87 Leads v3

## 1. Propósito

Este documento define el **modelo de datos futuro** para **persistir borradores** de paquetes instalables generados a partir del Constructor y la Auditoría, en continuidad con el endpoint de preview (**fase 8A**) descrito en `docs/CONTRATO_ENDPOINT_PAQUETE_INSTALABLE_8A.md`.

- **No crea tablas** en PostgreSQL/Supabase.
- **No ejecuta SQL** ni migraciones.
- **No modifica** el esquema actual ni el proyecto Supabase.
- Sirve como **referencia** para la fase **8B** (migración real) y diseños posteriores (8C–8G).

## 2. Principio rector

> **Persistir un paquete no equivale a instalar un CRM; solo guarda un borrador revisable con trazabilidad.**

La fila en base de datos representa un **artefacto de revisión** y **evidencia de proceso**, no el CRM operativo del cliente ni una instalación completada.

## 3. Tabla futura propuesta

**Nombre conceptual (propuesta, aún no existe en el esquema):**

`installer_package_drafts`

El nombre exacto, esquema (`public` u otro) y convenciones de naming pueden ajustarse al adoptar la migración; lo importante es separar claramente **borrador de instalación** de tablas operativas del CRM.

## 4. Objetivo de la tabla

La tabla debería permitir guardar y consultar:

- El **paquete** generado en modo **draft** (snapshot serializado).
- El **estado de revisión** del borrador en el flujo instalador / Summer87.
- El **usuario solicitante** (trazabilidad).
- La **fuente del Constructor** (referencia estable al diseño origen).
- **Advertencias** y **bloqueos** conocidos en el momento de la generación (y eventualmente actualizados).
- Indicación de **confirmación humana pendiente** o resuelta.
- **Trazabilidad de cambios** (quién revisó, aprobó, rechazó, cuándo y por qué).

## 5. Columnas propuestas

| Columna | Tipo sugerido | Descripción | Obligatoria |
|---------|---------------|-------------|-------------|
| `id` | `uuid` (PK, default `gen_random_uuid()`) | Identificador único del borrador. | Sí |
| `constructor_id` | `uuid` o `text` según modelo de Constructor | Referencia al diseño fuente en el Constructor. | Sí |
| `target_client_id` | `uuid` nullable | Cliente/empresa destino cuando aplique; debe validarse contra contexto seguro. | No |
| `package_version` | `text` | Versión lógica del formato de paquete (p. ej. `8A-preview`, `8B-draft-v1`). | Sí |
| `status` | `text` o `enum` | Estado del ciclo de vida del borrador (ver sección 6). | Sí |
| `package_payload` | `jsonb` | Snapshot del paquete (estructura sección 12); sin secretos. | Sí |
| `blocked_actions` | `jsonb` | Lista de acciones bloqueadas al momento de guardar (alineado a 8A). | Sí |
| `warnings` | `jsonb` | Advertencias textuales o estructuradas al momento de guardar. | No (puede ser `[]`) |
| `requires_human_confirmation` | `boolean` | Si el flujo exige confirmación humana antes de pasos sensibles. | Sí |
| `human_confirmation_status` | `text` o `enum` | Estado explícito de la confirmación (p. ej. `pending`, `approved`, `rejected`). | Sí |
| `requested_by` | `uuid` | Usuario que solicitó la generación; **solo desde contexto autenticado**, no desde body libre. | Sí |
| `reviewed_by` | `uuid` nullable | Usuario que marcó revisión inicial. | No |
| `approved_by` | `uuid` nullable | Usuario que aprobó para siguiente fase (p. ej. piloto). | No |
| `rejected_by` | `uuid` nullable | Usuario que rechazó el borrador. | No |
| `rejection_reason` | `text` nullable | Motivo legible del rechazo. | No |
| `generated_at` | `timestamptz` | Momento de generación del snapshot. | Sí |
| `reviewed_at` | `timestamptz` nullable | Momento de primera revisión significativa. | No |
| `approved_at` | `timestamptz` nullable | Momento de aprobación. | No |
| `rejected_at` | `timestamptz` nullable | Momento de rechazo. | No |
| `expires_at` | `timestamptz` nullable | Caducidad sugerida para no operar con borradores obsoletos. | No |
| `created_at` | `timestamptz` | Alta del registro. | Sí |
| `updated_at` | `timestamptz` | Última modificación. | Sí |

**Notas:**

- Campos `created_by` / `updated_by` pueden añadirse en la misma migración si el estándar del proyecto los usa (ver sección 13).
- Índices, FKs y políticas RLS se definirán en la migración **8B**; aquí no se especifica SQL.

## 6. Estados sugeridos

| Estado | Significado | Acción permitida (orientativa) |
|--------|-------------|--------------------------------|
| `draft_generated` | Borrador recién persistido; pendiente de revisión. | Revisión interna, transición a `under_review`. |
| `under_review` | Instalador / interno revisando el paquete. | Solicitar cambios, aprobar hacia piloto, rechazar. |
| `changes_requested` | Se pidieron correcciones en Constructor o en el paquete. | Regenerar nuevo draft o actualizar tras correcciones (política a definir). |
| `approved_for_pilot` | Aprobado explícitamente para uso en piloto controlado (no implica instalación automática). | Solo flujos posteriores acotados (8F/8G). |
| `rejected` | Rechazado con motivo; no debe usarse para instalación. | Archivar o conservar como evidencia. |
| `expired` | Pasó `expires_at` o política de retención sin revisión. | No operar; regenerar si aplica. |
| `superseded` | Reemplazado por un borrador más nuevo para el mismo `constructor_id` / flujo. | Consulta histórica solamente. |
| `archived` | Conservado por auditoría; fuera del flujo operativo activo. | Solo lectura administrativa. |

## 7. Confirmación humana

La **confirmación humana** debe ser **explícita** (acción de usuario autorizado en UI o API interna) y **nunca inferida** automáticamente por heurísticas, por tiempo transcurrido ni por ausencia de errores.

Campos relacionados:

- `requires_human_confirmation` — típicamente `true` hasta políticas futuras muy acotadas.
- `human_confirmation_status` — refleja el resultado del flujo humano (`pending`, `approved`, `rejected`, etc.).
- `approved_by`, `approved_at` — evidencia de quién y cuándo aprobó.
- `rejected_by`, `rejected_at`, `rejection_reason` — evidencia de rechazo.

Las transiciones de estado que impliquen **riesgo** (p. ej. hacia `approved_for_pilot`) deben exigir estos campos coherentes con la política de producto.

## 8. Seguridad y permisos

- Solo **superadmin** / **instalador autorizado** (y roles internos explícitos) deberían **crear** o **mutar** borradores sensibles.
- El **cliente final** del CRM operativo **no** debe poder **leer** borradores ni **aprobar** contenido del instalador.
- **No** persistir **secretos** (API keys, tokens, service role, contraseñas, claves privadas).
- **No** persistir **service role keys** ni material equivalente.
- **No** permitir **tenant spoofing**: `target_client_id` y alcance del `constructor_id` deben validarse contra **contexto de tenant/instancia** resuelto en servidor, no confiar en valores arbitrarios del cliente.
- `requested_by` debe obtenerse del **usuario autenticado** en el servidor, **no** de un campo libre del body.
- `target_client_id`, cuando exista, debe **validarse** contra reglas de pertenencia y permisos antes de insertar o actualizar.

## 9. Relación con Constructor

- `constructor_id` apunta al **diseño fuente** del CRM en el Constructor.
- El borrador debe preservar un **snapshot** del paquete en `package_payload` en el momento de la generación/persistencia.
- Los **cambios posteriores** del Constructor **no** deben **mutar silenciosamente** un draft ya guardado: el snapshot permanece como fue generado (inmutabilidad lógica del payload salvo políticas explícitas de “reopen”).
- Si el Constructor cambia de forma sustancial, el flujo correcto es **generar un nuevo draft** o marcar el anterior como **`superseded`** y enlazar la cadena de versiones si el producto lo requiere.

## 10. Relación con Auditoría

- El draft debe poder almacenar **warnings** y **blocked_actions** alineados con lo observado en **Auditoría** / readiness / checklist del Constructor.
- Si la **auditoría no está en estado aceptable** para el negocio, el estado **no** debería permitirse como `approved_for_pilot` (regla de aplicación en capa de servicio o constraint lógico).
- La auditoría puede aportar **readiness**, **checklist** y **validaciones previas** serializadas dentro de `package_payload` o en columnas auxiliares futuras si hiciera falta (sin duplicar secretos).

## 11. Relación con Zeta

**Zeta permanece solo lectura hasta nuevo aviso.**

- La tabla **no** debe modelar **escrituras** hacia Zeta como parte del borrador.
- Cualquier integración con Zeta debería representarse en el payload como **`pending`**, **`read_only`** o **`blocked`**, según el contrato de integraciones, sin implicar sincronización bidireccional desde esta tabla.

## 12. `package_payload`

- Tipo sugerido: **`jsonb`** en PostgreSQL.
- Debe contener la estructura lógica del paquete, por ejemplo:
  - `installation_manifest`
  - `client_identity`
  - `crm_modules_config`
  - `pipeline_config`
  - `lead_fields_config`
  - `permissions_config`
  - `ai_rules_config`
  - `reports_config`
  - `integrations_config`
  - `installer_decisions`
  - `activation_checklist`
- **No** debe contener **secretos** ni credenciales; solo datos de configuración revisables y metadatos seguros.

## 13. Auditoría de cambios

Para trazabilidad fuerte, una migración futura podría añadir o combinar:

- `created_by`, `updated_by` (además de `requested_by`).
- `reviewed_by`, `approved_by`, `rejected_by` y timestamps asociados (ya listados en sección 5).
- Campos de **razón** (`rejection_reason`, motivos de `changes_requested`).
- **Historial de versiones** (tabla hija `installer_package_draft_events` o similar) o puntero `superseded_by` / `replaces_draft_id` para cadena de borradores.

La decisión entre tabla única vs. event sourcing ligero es **fase de implementación**.

## 14. Retención y expiración

- Los borradores deberían **expirar** si no se revisan en un plazo de negocio acordado.
- `expires_at` permite **bloquear** transiciones operativas con paquetes viejos y forzar regeneración.
- `archived` (estado o flag complementario) permite **conservar evidencia** sin usar el borrador en flujos activos de instalación.

## 15. Riesgos

- **Aprobar un paquete viejo** desactualizado respecto al Constructor o a la normativa.
- **Guardar secretos** accidentalmente dentro de `jsonb`.
- **Mezclar tenant/clientes** por validación laxa de `target_client_id` o `constructor_id`.
- **Cliente final** accediendo a **información interna** del instalador.
- **Instalar** o ejecutar pasos sensibles **desde un draft no aprobado**.
- **Datos heredados** sin saneamiento entre entornos.
- **Activar IA sensible** por error al interpretar el payload en una fase posterior.

## 16. Validaciones antes de persistir

Antes de `INSERT`/`UPDATE` significativo, la capa de aplicación (y eventualmente constraints) debería exigir:

- **Usuario autorizado** para la operación.
- **Constructor existe** y el actor tiene alcance sobre él.
- **`target_client_id` válido** si aplica (pertenencia, no spoofing).
- **`package_payload` sin secretos** (validación de esquema o denylist de claves).
- **`blocked_actions` presentes** y coherentes con política de seguridad.
- **`requires_human_confirmation`** acorde al riesgo (típicamente `true`).
- **Zeta** y otras integraciones en modo acorde a política (**read-only** donde corresponda).
- **`status` inicial** adecuado (p. ej. `draft_generated`).
- **Ausencia de acciones destructivas** solicitadas desde el cliente en el body de generación.

## 17. Criterios de aceptación futura

Cuando exista la migración y la persistencia real, los criterios mínimos deberían incluir:

- **No** crea CRM operativo por el hecho de guardar el borrador.
- **No** instala nada automáticamente.
- **No** escribe en Zeta desde esta tabla.
- **No** crea usuarios finales.
- **No** expone el Constructor al cliente final.
- **Guarda solo** un borrador **revisable** con estructura clara.
- **Mantiene trazabilidad** (quién/cuándo/qué estado).
- **Requiere aprobación humana explícita** para avanzar a fases de riesgo.
- **Permite invalidar**, **supersedear** o **archivar** drafts viejos.

## 18. Fases futuras sugeridas

| Fase | Descripción |
|------|-------------|
| **8B** | Crear migración para `installer_package_drafts` (y RLS/políticas según modelo). |
| **8C** | Persistir borrador desde endpoint/servicio (extensión del flujo 8A). |
| **8D** | Vista interna de revisión del paquete generado. |
| **8E** | Confirmación humana explícita en UI/API interna. |
| **8F** | Marcar draft **aprobado para piloto** con controles adicionales. |
| **8G** | Instalación piloto **controlada** (fuera del alcance del solo INSERT del borrador). |

---

*Documento de fase **8B-doc**. No ejecuta SQL ni modifica el repositorio de esquema.*
