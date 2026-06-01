# CONSTRUCTOR-SETUP-USER-5 — Cambio mínimo de PIN para usuario setup

> Flujo mínimo, seguro y acotado para que el usuario `setup` (o cualquier usuario
> con `must_change_password=true`) rote su PIN inicial de instalación **sin tocar
> SQL manual**, sin abrir permisos operativos y **sin crear sesión**.

---

## A. Resumen ejecutivo

Después de **SETUP-USER-4**, un usuario `setup` creado con PIN `1234` y
`must_change_password=true` queda correctamente **bloqueado al iniciar sesión**
(login no crea sesión). Eso es seguro, pero obligaba a rotar el PIN siempre por
SQL manual en cada instancia clonada.

SETUP-USER-5 agrega un **endpoint mínimo de cambio de PIN** y un **helper puro**
de evaluación:

- **Endpoint:** `POST /api/proto/change-pin` con body `{ username, currentPin, newPin }`.
- **Helper puro:** `lib/auth/internalChangePin.ts` (`evaluateChangePin`, `isWeakNewPin`).
- El cambio exige **PIN actual válido**, valida el nuevo PIN, lo guarda como
  **hash bcrypt**, pone `must_change_password = false` **solo tras éxito**, e
  **invalida sesiones previas** del usuario. **No crea sesión**: el usuario debe
  volver a iniciar sesión con el PIN nuevo.

El login (SETUP-USER-4) **no cambia**: sigue bloqueando `must_change_password=true`.

---

## B. Diagnóstico del login actual

Archivo: `app/api/proto/login/route.ts` + helper puro `lib/auth/internalLogin.ts`.

- **Cómo valida username/PIN:** el front sigue enviando `{ cedula, pin }` (donde
  `cedula` es realmente el `username`). El route consulta
  `app_credentials` por `username` y trae `user_id, password_hash, must_change_password`.
- **Dónde usa `verifyPassword`:** `login/route.ts:50-51` →
  `verifyPassword(pin, cred.password_hash)` (bcrypt `compare`, en `lib/auth/internalAuth.ts`).
- **Dónde usa `hashPassword`:** el login **no** hashea (solo verifica). `hashPassword`
  vive en `lib/auth/internalAuth.ts:7-10` (bcrypt `hash`, rounds 10) y se usa al
  crear/rotar credenciales (bootstrap, y ahora change-pin).
- **Cómo detecta `must_change_password`:** lo lee de `app_credentials` y lo pasa a
  `evaluateInternalLogin({ ..., mustChangePassword })`. En el helper
  (`internalLogin.ts:93-103`), si `mustChangePassword === true` retorna
  `SETUP_PASSWORD_CHANGE_REQUIRED` (rol `setup`) o `PASSWORD_CHANGE_REQUIRED`
  (otros roles), ambos `httpStatus 403`, **sin crear sesión**.
- **Qué respuesta devuelve `SETUP_PASSWORD_CHANGE_REQUIRED`:** `403` con
  `{ ok:false, code:"SETUP_PASSWORD_CHANGE_REQUIRED", error: <mensaje seguro> }`.
- **Qué tablas toca el login:** lee `app_credentials` y `app_users` (join `roles`);
  escribe `app_sessions` **solo** si el login es OK (`createSession`).
- **Dónde conviene el endpoint mínimo:** junto al login, en
  `app/api/proto/change-pin/route.ts` (mismo prefijo `proto`, mismas utilidades de
  `internalAuth`).
- **Helper reutilizable:** conviene un helper **puro nuevo** (mismo patrón que
  `evaluateInternalLogin`): sin I/O, testeable, con el orden de validaciones explícito.

---

## C. Archivos creados/modificados

**Creados** (3):

| Archivo | Rol |
|---|---|
| `lib/auth/internalChangePin.ts` | Helper puro `evaluateChangePin` + `isWeakNewPin`. |
| `lib/auth/internalChangePin.selftest.ts` | Selftest del helper (15 asserts). |
| `app/api/proto/change-pin/route.ts` | Endpoint mínimo `POST` de cambio de PIN. |
| `docs/constructor-crm/CONSTRUCTOR-SETUP-USER-5-cambio-minimo-pin-setup.md` | Este documento. |

**Modificados:** ninguno. El login (`SETUP-USER-4`) **no se tocó**.

---

## D. Endpoint creado

`POST /api/proto/change-pin`

**Body esperado** (JSON):

```json
{ "username": "setup", "currentPin": "1234", "newPin": "9090" }
```

> También acepta `cedula` como alias de `username` (compat con el front del login).

**Respuestas:**

| Caso | HTTP | `code` |
|---|---|---|
| Cambio exitoso | 200 | `PIN_CHANGED_LOGIN_REQUIRED` |
| Falta username/currentPin/newPin | 400 | `VALIDATION_ERROR` |
| Usuario inexistente | 404 | `USER_NOT_FOUND` |
| Credencial huérfana (sin app_users) | 403 | `ORPHAN_CREDENTIAL` |
| PIN actual incorrecto | 401 | `INVALID_CURRENT_PIN` |
| Usuario inactivo | 403 | `USER_INACTIVE` |
| Nuevo PIN débil/vacío/corto | 400 | `WEAK_NEW_PIN` |
| Nuevo PIN igual al actual | 400 | `SAME_PIN` |
| Error interno | 500 | `INTERNAL_ERROR` |

**Respuesta de éxito** (sin cookie, sin sesión):

```json
{ "ok": true, "code": "PIN_CHANGED_LOGIN_REQUIRED",
  "message": "PIN actualizado. Iniciá sesión nuevamente con tu nuevo PIN." }
```

**Tablas:** lee `app_credentials` y `app_users`; escribe `app_credentials`
(`password_hash`, `must_change_password=false`) y borra `app_sessions` del usuario.
No toca `roles`, RBAC, ni datos operativos.

> Nota sobre `updated_at`: el seed de SETUP-USER-2 inserta en `app_credentials`
> solo `user_id, username, password_hash, must_change_password`. Como no se puede
> confirmar la existencia de la columna `updated_at` sin tocar SQL, el update
> **no** la setea (cambio mínimo, sin riesgo de romper por columna inexistente).

---

## E. Helper creado

`lib/auth/internalChangePin.ts` — **puro, sin I/O**.

- `evaluateChangePin(input): ChangePinEvaluateResult`
  - Input: `credentialFound, userFound, isActive, currentPinValid, newPin, newPinEqualsCurrent`.
  - El caller resuelve la DB y bcrypt; el helper solo decide.
- `isWeakNewPin(newPin): boolean` — vacío, `< 4` chars, `> 72` chars, o con
  espacios al borde → débil.
- Constantes: `MIN_NEW_PIN_LENGTH = 4`, `MAX_NEW_PIN_LENGTH = 72`.

**Orden de evaluación** (corta en el primer fallo):

1. `!credentialFound` → `USER_NOT_FOUND` (404)
2. `!userFound` → `ORPHAN_CREDENTIAL` (403)
3. `!currentPinValid` → `INVALID_CURRENT_PIN` (401) — *antes* de revelar estado activo
4. `isActive === false` → `USER_INACTIVE` (403)
5. `isWeakNewPin(newPin)` → `WEAK_NEW_PIN` (400)
6. `newPinEqualsCurrent` → `SAME_PIN` (400)
7. en otro caso → `PIN_CHANGE_ALLOWED` (ok:true)

> El helper **no** recibe `must_change_password`: el cambio de PIN no depende de
> ese flag (el login es quien lo bloquea). Un usuario `setup` activo con PIN
> válido puede cambiar su PIN aunque tenga `must_change_password=true`.

---

## F. Flujo de cambio de PIN

```
Cliente → POST /api/proto/change-pin { username, currentPin, newPin }
   │
   ├─ valida presencia de los 3 campos
   ├─ SELECT app_credentials by username  → user_id, password_hash
   ├─ verifyPassword(currentPin, hash)    → currentPinValid (bcrypt)
   ├─ SELECT app_users by user_id         → userFound, is_active
   ├─ evaluateChangePin({...})            → decisión pura
   │     └─ ok:false → responde código + httpStatus (NO escribe nada)
   │
   └─ ok:true:
        ├─ hashPassword(newPin)                       (bcrypt rounds 10)
        ├─ UPDATE app_credentials                     (password_hash, must_change_password=false)
        ├─ DELETE app_sessions WHERE user_id          (invalida sesiones previas)
        └─ responde PIN_CHANGED_LOGIN_REQUIRED        (SIN cookie / SIN sesión)
```

Luego el usuario vuelve a `POST /api/proto/login` con el nuevo PIN y, como
`must_change_password` ya es `false`, el login crea sesión normalmente.

---

## G. Qué cambia para setup

- Antes: rotar el PIN del `setup` requería **SQL manual** (o re-correr el
  bootstrap) en cada instancia clonada.
- Ahora: el `setup` puede rotar su PIN inicial vía `POST /api/proto/change-pin`
  con `username=setup`, `currentPin` actual y `newPin`. Tras el cambio,
  `must_change_password` pasa a `false` y el login deja de bloquearlo.
- El cambio **no** otorga sesión ni permisos operativos: el rol sigue siendo
  `setup` (allowlist a Constructor/Discovery, ver `app/lib/rbac.ts`).

---

## H. Qué cambia para usuarios existentes

- Cualquier usuario interno **activo** que conozca su PIN actual puede rotar su
  PIN por el mismo endpoint (incluye usuarios con `must_change_password=true`).
- Tras el cambio se **invalidan sus sesiones previas** (deben reloguear).
- Roles, permisos y datos operativos **no se modifican**.
- Usuarios **inactivos** no pueden cambiar el PIN (`USER_INACTIVE`).

---

## I. Seguridad aplicada

- **No crea sesión** en el endpoint (sin cookie). Login sigue siendo la única vía
  de sesión.
- **Exige PIN actual válido** (bcrypt `compare`) antes de cualquier escritura.
- Nuevo PIN siempre persistido como **hash bcrypt** (rounds 10, vía `hashPassword`).
- `must_change_password=false` **solo** tras un cambio exitoso.
- Validación de fuerza del nuevo PIN (no vacío, `≥ 4`, sin espacios al borde).
- Rechazo si el nuevo PIN **es igual** al actual (comparación de PINs en claro
  en memoria, nunca persistida ni logueada).
- **No se loguean PINs ni hashes**: en dev solo se loguea `username` + `code`.
- **No se devuelven hashes** al cliente.
- Validación de PIN actual **antes** de revelar el estado activo de la cuenta.
- Solo lee `app_users`; solo escribe `app_credentials` y `app_sessions`.

---

## J. Qué NO hace

- No ejecuta SQL, ni migraciones, ni crea tablas.
- No crea sesión ni cookie.
- No toca `roles`/RBAC, ni `package_payload`, ni runtime, ni motores.
- No crea CRM operativo ni usuarios reales.
- No guarda PIN en claro en el repo ni en la DB.
- No loguea PINs.
- No setea `updated_at` (columna no confirmada).
- No toca `.env.local`, ni Casa Limpia CRM, ni Ecuador, ni leads, ni sidebar.

---

## K. Relación con SETUP-USER-4

- SETUP-USER-4 endureció el **login**: bloquea `is_active=false` y
  `must_change_password=true` (no crea sesión). Helper `evaluateInternalLogin`.
- SETUP-USER-5 **complementa** sin debilitar: el login sigue igual; el cambio de
  PIN es la vía limpia para que `must_change_password` pase a `false`. Después del
  cambio, el flujo SETUP-USER-4 deja entrar al usuario normalmente.
- Mismo patrón de diseño: helper puro + route delgado + selftest.

---

## L. Relación con clonación de nuevos CRM

En una instancia clonada el flujo de instalación queda:

1. SETUP-USER-2: bootstrap manual del usuario `setup` (PIN `1234`,
   `must_change_password=true`).
2. SETUP-USER-4: el `setup` queda **bloqueado** en login hasta rotar el PIN.
3. **SETUP-USER-5**: el `setup` rota su PIN vía endpoint, sin SQL → `must_change_password=false`.
4. Login normal con el PIN nuevo para tareas de Constructor/Discovery.
5. SETUP-USER-3: baja/deshabilitación del `setup` antes de exponer el CRM.

Esto elimina la dependencia de SQL manual para el paso de rotación inicial,
manteniendo el resto del runbook intacto.

---

## M. Validaciones realizadas

| Validación | Resultado |
|---|---|
| `node --experimental-strip-types lib/auth/internalChangePin.selftest.ts` | ✅ 15/15 |
| `node --experimental-strip-types lib/auth/internalLogin.selftest.ts` | ✅ 7/7 |
| `node --experimental-strip-types app/lib/rbac.setup.selftest.ts` | ✅ 21/21 |
| `discoveryContext.selftest.ts` | ✅ EXIT 0 |
| `verticalCatalog.selftest.ts` | ✅ EXIT 0 |
| `constructorRuntimeConfig.selftest.ts` | ✅ EXIT 0 |
| `runtimeSidebarVisibility.selftest.ts` | ✅ EXIT 0 |
| `npm run build` | ✅ EXIT 0 (ruta `/api/proto/change-pin` registrada) |
| `git diff --check` | ✅ EXIT 0 |

---

## N. Riesgos pendientes

- **Sin rate limiting:** el endpoint permite probar `currentPin`. Mitiga el costo
  bcrypt, pero conviene throttling/lockout a futuro (igual que el login).
- **`updated_at` no se actualiza:** si el esquema tiene esa columna y se desea
  trazabilidad, agregarla al update tras confirmar que existe.
- **Política de fuerza del PIN mínima** (`≥ 4`): adecuada para PIN de instalación;
  endurecer si se reutiliza para usuarios operativos.
- **Sin UI:** por alcance/seguridad se entregó **solo endpoint + doc**. Una UI
  mínima podría agregarse después si se valida que no amplía superficie de riesgo.

---

## O. Próximos pasos

1. (Opcional) UI mínima de “cambiar PIN” en la pantalla de login cuando el código
   sea `SETUP_PASSWORD_CHANGE_REQUIRED` / `PASSWORD_CHANGE_REQUIRED`.
2. (Opcional) Rate limiting / lockout compartido login + change-pin.
3. Commit de SETUP-USER-5 (cuando se autorice; este paso **no** commitea).

---

## P. Confirmaciones de alcance

- ✅ Existe flujo mínimo de cambio de PIN para setup / usuarios con `must_change_password=true`.
- ✅ No se crea sesión automática tras el cambio.
- ✅ Login sigue bloqueando `must_change_password=true`.
- ✅ El cambio exige PIN actual válido.
- ✅ Nuevo PIN se guarda como hash bcrypt.
- ✅ `must_change_password` pasa a `false` solo tras éxito.
- ✅ No se guarda PIN plano. No se loguean PINs. No se devuelven hashes.
- ✅ No se ejecutó SQL. No se crearon usuarios reales. No se tocaron datos operativos.
- ✅ No se tocó `.env.local`, ni Casa Limpia CRM, ni Ecuador, ni `package_payload`.
- ✅ No se activaron motores. No se creó CRM operativo.
- ✅ Build OK. Selftests OK. Sin deploy. Sin commit. Sin push.
