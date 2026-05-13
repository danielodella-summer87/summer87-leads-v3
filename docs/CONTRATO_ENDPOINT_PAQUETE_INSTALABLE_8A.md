# Contrato técnico del endpoint interno de paquete instalable — Summer87 Leads v3

## 1. Propósito

Este documento define el **contrato técnico previo** para un futuro **endpoint interno** capaz de **generar un paquete instalable del CRM** a partir del estado consolidado del **Constructor** y la **Auditoría** (y fuentes relacionadas descritas más abajo).

- **No implementa** el endpoint ni ninguna ruta asociada.
- **No define** esquemas de base de datos definitivos ni migraciones.
- Sirve como **referencia de producto y seguridad** antes de la fase de implementación (p. ej. 8A implementación real).

## 2. Principio rector

> **El endpoint no instala un CRM; solo prepara un paquete revisable para que un instalador humano decida si continúa.**

Cualquier automatización posterior debe respetar este principio: la generación del paquete es un paso de **preparación y revisión**, no de **activación operativa** del CRM del cliente.

## 3. Endpoint futuro propuesto

**Propuesta futura (aún no creada):**

```http
POST /api/admin/constructor/installable-package/generate
```

- Ruta indicativa bajo el prefijo **admin** y el ámbito **constructor**.
- En la fase **8A-doc** no existe implementación; solo se documenta la intención y el contrato esperado.

## 4. Quién puede usarlo

Solo deberían poder invocar el endpoint (cuando exista):

- **superadmin**
- **instalador autorizado**
- **usuario interno Summer87** con permisos explícitos para esta operación

El **cliente final** del CRM operativo **no** debe poder usar este endpoint ni descubrirlo como acción disponible en su interfaz. El Constructor permanece **privado** para Summer87 / instalador / roles internos autorizados.

## 5. Entrada esperada

**Body conceptual** (JSON):

```json
{
  "constructorId": "string",
  "targetClientId": "string | null",
  "mode": "preview | draft",
  "includeSampleData": false,
  "requestedBy": "current_user"
}
```

**Notas:**

- `mode`: distingue generación **solo revisable** (`preview`) de un posible **borrador** (`draft`) según políticas futuras.
- `includeSampleData`: por defecto `false`; si en el futuro se permitiera, debe estar acotado por políticas y permisos.
- `requestedBy`: representación conceptual de que la identidad del solicitante debe derivarse del **contexto de sesión autenticado**, no de un valor arbitrario enviado por el cliente.
- El contrato **no** debe aceptar **instrucciones destructivas** (p. ej. borrado, reset masivo, ejecución remota, credenciales embebidas, overrides de tenant ajeno).

## 6. Fuentes internas que debería leer

El endpoint, al implementarse, debería basarse en datos ya consolidados en el ecosistema Constructor / Auditoría, incluyendo de forma conceptual:

- **Empresa**
- **Cuestionario**
- **Documentos**
- **Diagnóstico**
- **Proceso / pipeline**
- **Motores IA**
- **Reportes**
- **Auditoría**
- **Preset sectorial**
- **Decisiones del instalador**

La lectura debe ser **coherente con permisos** y con el modelo de “solo lo necesario” para armar el paquete, sin exponer secretos (ver sección 11).

## 7. Salida esperada

**Response conceptual** (JSON):

```json
{
  "ok": true,
  "packageId": "preview-only",
  "status": "preview_generated",
  "requiresHumanConfirmation": true,
  "package": {
    "installation_manifest": {},
    "client_identity": {},
    "crm_modules_config": {},
    "pipeline_config": {},
    "lead_fields_config": {},
    "permissions_config": {},
    "ai_rules_config": {},
    "reports_config": {},
    "integrations_config": {},
    "installer_decisions": {},
    "activation_checklist": {}
  },
  "blockedActions": [],
  "warnings": [],
  "nextHumanAction": "review_package"
}
```

- Los objetos bajo `package` son **placeholders** alineados con la visión de manifiesto / archivos conceptuales ya trabajados en fases de UI (7X–7Z); la forma exacta se definirá en implementación.
- `blockedActions` y `warnings` permiten distinguir **bloqueos duros** de **avisos revisables** sin ejecutar acciones reales.

## 8. Acciones explícitamente bloqueadas

El endpoint **no** debe, en ninguna variante prevista de esta fase de diseño:

- Crear **Supabase** real (proyecto / instancia / recursos de producción).
- Crear **tenant**.
- Crear **usuarios**.
- Enviar **invitaciones**.
- Escribir en **Zeta**.
- **Borrar** datos.
- **Activar IA sensible** sin flujo y permisos explícitos posteriores.
- **Exponer el Constructor** al cliente final.
- **Publicar** a producción de forma automática.
- **Instalar CRM automáticamente** (sin paso humano explícito y fases posteriores).

## 9. Validaciones mínimas

Antes de devolver un paquete “válido” para revisión, el sistema debería poder aplicar controles mínimos (conceptuales):

- **Constructor existe** (referencia coherente con `constructorId` o recurso equivalente).
- **Usuario tiene permiso** para la operación.
- **Empresa identificada** (datos mínimos de identidad cliente / destino).
- **Auditoría existe** (o estado de auditoría requerido según reglas de negocio).
- **Pipeline revisado** (suficiente para no generar paquete incoherente).
- **Permisos previstos** (estructura mínima definida).
- **IA sensible bloqueada** o en estado no operativo según política.
- **Integraciones clasificadas** (activas / pendientes / no autorizadas, según modelo).
- **Zeta solo lectura** (sin escritura desde este flujo).
- **Confirmación humana pendiente** explícita en la respuesta cuando corresponda.

Los fallos se mapean a errores esperados (sección 10).

## 10. Errores esperados

| Código | Cuándo ocurre | Acción sugerida |
|--------|----------------|-----------------|
| `UNAUTHORIZED` | Sesión ausente o token inválido. | Reautenticar; no reintentar sin credenciales. |
| `FORBIDDEN` | Usuario autenticado sin rol/permiso para generar paquete. | Escalar a admin; no exponer detalles internos al cliente. |
| `CONSTRUCTOR_NOT_FOUND` | `constructorId` inexistente o fuera de alcance del actor. | Verificar ID y permisos de alcance. |
| `AUDIT_NOT_READY` | Auditoría requerida incompleta o no aprobada según reglas. | Completar auditoría en Constructor. |
| `COMPANY_MISSING` | Falta identidad mínima de empresa / cliente destino. | Completar paso Empresa / identidad en Constructor. |
| `PIPELINE_INCOMPLETE` | Pipeline insuficiente para un paquete coherente. | Revisar proceso/pipeline en Constructor. |
| `PERMISSIONS_INCOMPLETE` | Modelo de permisos previsto incompleto. | Definir permisos antes de regenerar. |
| `AI_RULES_UNREVIEWED` | Reglas de IA en estado no revisable / no aprobadas. | Revisión humana de reglas IA en flujo interno. |
| `INTEGRATIONS_UNCLASSIFIED` | Integraciones sin clasificación aceptable. | Clasificar integraciones (activas/pendientes/bloqueadas). |
| `HUMAN_CONFIRMATION_REQUIRED` | Paquete generable solo como borrador o con bloqueo hasta confirmación. | Instalador revisa y confirma en fase posterior (p. ej. 8D). |

Los códigos son **conceptuales**; la forma exacta (`code` en JSON, HTTP status, i18n) se definirá en implementación.

## 11. Seguridad

- **No** incluir **claves secretas** ni tokens en el cuerpo del paquete devuelto.
- **No** devolver **service role keys** ni credenciales de Supabase.
- **No** permitir **tenant spoofing** (un actor no debe poder forzar contexto de otro tenant).
- **No** aceptar `company_id` / identificadores sensibles desde el body si ya existe un **contexto seguro** resolvible solo del lado servidor (política a definir en implementación).
- **No** permitir que el **cliente final** ejecute el endpoint (solo rutas y UI operativa CRM para el cliente).
- **Registrar** usuario que solicita la generación (ver sección 14).
- Mantener el endpoint como **interno / admin** y detrás de las mismas barreras que el resto del Constructor.

## 12. Relación con Zeta

**Zeta permanece solo lectura hasta nuevo aviso.**

El endpoint de generación de paquete **no** debe escribir en Zeta ni sincronizar datos hacia Zeta como parte de esta operación. Cualquier integración futura con Zeta debe ser una **fase explícita** con contrato y permisos propios.

## 13. Relación con base de datos

En la **primera implementación real**, el endpoint podría:

- Generar el paquete **en memoria** y devolverlo sin persistencia, o
- Guardar un **borrador** en almacenamiento controlado,

pero **cualquier persistencia** debe definirse en una **migración futura explícita** y revisión de seguridad.

**En esta fase 8A-doc no se asume ninguna tabla nueva.**

## 14. Logs y auditoría futura

En una fase posterior de implementación operativa, debería poder registrarse al menos:

- Usuario **solicitante**
- **Fecha/hora**
- `constructorId`
- `targetClientId`
- **Modo** de generación (`preview` / `draft`)
- **Advertencias** (`warnings`)
- **Estado final** de la operación
- Indicación de si hubo **confirmación humana** (cuando exista el flujo 8D+)

El medio de log (tabla, servicio externo, retención) queda fuera del alcance de este documento.

## 15. Flujo futuro

1. El **instalador** revisa la **Auditoría** y el estado del Constructor.
2. El instalador **solicita** la generación del paquete (cuando el endpoint exista).
3. El endpoint **genera** un paquete en modo `preview` o `draft` según política.
4. El sistema **devuelve** el paquete y **advertencias** / bloqueos conceptuales.
5. El instalador **revisa** el contenido y las advertencias.
6. Si falta algo, el instalador **corrige** el Constructor y vuelve a intentar.
7. La **confirmación humana explícita** para pasos sensibles queda en una **fase posterior** (p. ej. 8D).
8. **Solo otra fase** podría iniciar una **instalación controlada** (piloto / producción) con controles adicionales.

## 16. Criterios de aceptación futura

Cuando se implemente el endpoint real, los criterios mínimos de aceptación deberían incluir:

- **No** instala CRM por sí solo.
- **No** crea tenant.
- **No** crea usuarios.
- **No** escribe en Zeta.
- **No** borra datos.
- **No** expone el Constructor al cliente final.
- **Requiere** permisos internos explícitos.
- **Devuelve** un paquete **revisable** (estructura clara, sin secretos).
- **Distingue** `warnings` de bloqueos / acciones prohibidas.
- **Requiere** confirmación humana donde el modelo de riesgo lo exija.

## 17. Fases futuras sugeridas

Propuesta de roadmap incremental (nombres orientativos):

- **8A** — Implementar endpoint **preview** sin persistencia (o con política mínima acordada).
- **8B** — Persistir **borrador** de paquete instalable con modelo de datos y migración explícitos.
- **8C** — **Vista de revisión** del paquete generado (interna).
- **8D** — **Confirmación humana explícita** antes de pasos sensibles.
- **8E** — **Instalación piloto controlada** (fuera del alcance inmediato de la generación de paquete).

---

*Documento generado en fase **8A-doc**. No modifica código ni infraestructura.*
