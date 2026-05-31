# CONSTRUCTOR-SETUP-USER-1 — Política del usuario inicial "setup" para instancias clonadas

> **Tipo:** Diagnóstico + diseño de política (PRE). Sin código funcional, sin SQL, sin crear usuarios.
> **Fecha:** 2026-05-31.
> **Predecesor de cadena:** RUNTIME-5 (commit `2db22cb`).
> **Alcance:** Definir la política del usuario de instalación `setup` y diagnosticar su implementación segura/reusable. NO se modificó código/UI, no se ejecutó SQL, no se crearon usuarios, no se tocaron datos, `.env.local`, `package_payload`, motores, Casa Limpia ni Ecuador. NO hay deploy/commit/push.

---

## A. Resumen ejecutivo

Toda instancia clonada del Constructor debería poder tener un **usuario de instalación temporal** (`username: setup`, `PIN: 1234`) que permita el primer acceso controlado para completar/revisar el Discovery, confirmar el vertical y revisar configuración mínima, **sin** operar como usuario final. El repo ya tiene toda la infraestructura necesaria: `app_users` + `app_credentials` (username + `password_hash` bcrypt + `must_change_password`) + `app_sessions`, login username+PIN vía `/api/proto/login`, y RBAC por rol/ruta (`canAccessPath`).

**Hallazgo crítico de diagnóstico:** hoy `/admin/constructor` exige rol **`admin`** (`app/lib/rbac.ts`: `{ prefix: "/admin/constructor", allowed: ["admin"] }`). Por lo tanto, un rol "setup" *limitado* **no podría** acceder al Constructor sin **extender el RBAC** para habilitar un rol de instalación en rutas de Constructor/Discovery (y solo ahí). Esto es una decisión de la fase de implementación, no de este PRE.

**Recomendación de etapa actual:** **Opción D (documentar)** ahora; **Opción B (script de bootstrap manual, no automático)** como implementación posterior (`SETUP-USER-2`). `setup/1234` es **solo credencial local/de instalación**, con `must_change_password=true`, que debe **deshabilitarse o reemplazarse antes de exponer** el CRM. No se implementa nada en esta fase.

---

## B. Estado Git inicial

```
Rama: * main  2db22cb [origin/main]  (sincronizada)
Working tree: 1 archivo sin trackear → docs/.../CONSTRUCTOR-SHELL-1-...md (de la fase previa, sin commitear)
```
`git log --oneline -3`:
```
2db22cb docs(constructor): close RUNTIME-5 sidebar badge preview
f815faf feat(constructor): add RUNTIME-4 sidebar diagnosis panel
e686d62 feat(constructor): add RUNTIME-3 sidebar visibility suggestions
```
> Nota: `CONSTRUCTOR-SHELL-1-...md` quedó sin commitear de la fase anterior; no se toca aquí.

---

## C. Diagnóstico auth/setup actual

**Cómo se autentica el Constructor:** auth interno por cookie de sesión. `middleware.ts` valida vía `getSessionUser(cookie, admin)` (hash de token en `app_sessions`) y RBAC por ruta. Hay además un **bypass de prototipo gobernado por env** (`CONSTRUCTOR_AUTH_BYPASS`, SECURITY-1), off en producción.

**Dónde viven los usuarios (migraciones):**
- `app_users` (id, is_active, role_id → `roles.name`).
- `app_credentials` (036): `user_id`, `username` único, `password_hash` (bcrypt), **`must_change_password` default `true`**.
- `app_sessions` (036): `token_hash` (SHA-256 del token de cookie), `expires_at`.
- RBAC (028/029): `roles` (`admin`, `gerencia`, `comercial`), `permissions`, `role_permissions`. 037 siembra un admin interno.

**Helpers:** `lib/auth/internalAuth.ts` (`hashPassword`/`verifyPassword` bcrypt, `createSession`, `getSessionUser`, `getSessionCookieName`), `lib/auth/session.ts`, `lib/auth/server.ts`.

**Login username+PIN:** `/api/proto/login` acepta `{ cedula(username), pin }`, verifica con `verifyPassword(pin, cred.password_hash)` contra `app_credentials` y crea sesión. **Es el patrón "tipo Jessica"** (usuario limitado por username+PIN). Es **prototipo** → no debe ser la vía de producción tal cual.

**Rol limitado:** existe el concepto (RBAC), pero **no hay un rol de instalación**. Y `/admin/constructor` está restringido a `allowed: ["admin"]` → un rol limitado no entra al Constructor hoy.

**Patrón `discovery_client`:** no existe como tal en este repo (fue específico de Casa Limpia, fuera de alcance). El equivalente reusable sería un rol `setup`/`installer`.

**Depende de APP_MODE:** la separación Constructor↔cliente (SEPARATION-1) bloquea Constructor en `client_crm`. El usuario setup operaría en modos internos (`constructor_base`/`installation_prep`), nunca en `client_crm`.

**Riesgos de PIN 1234:** credencial trivial; aceptable solo local/instalación. En una instancia expuesta sería una puerta abierta → debe forzarse cambio (`must_change_password`) y deshabilitarse/reemplazarse antes de exponer.

---

## D. Política del usuario setup

| Atributo | Valor |
|---|---|
| `username` | `setup` |
| PIN inicial | `1234` (bcrypt en `app_credentials.password_hash`; **nunca en texto plano ni en repo**) |
| `must_change_password` | `true` (forzar cambio en primer uso real) |
| Rol recomendado | **nuevo rol `setup`/`installer`** (limitado), NO `admin` |
| Cuándo se crea | manualmente, al clonar una instancia nueva (no en build, no automático) |
| Cuándo se deshabilita/reemplaza | **antes** de entregar/exponer el CRM: deshabilitar (`is_active=false`) o reemplazar por usuarios reales del cliente |
| Documentación | registrar su creación y su baja en el runbook de la instancia |
| Naturaleza | **temporal / de instalación**, nunca usuario operativo definitivo |

---

## E. Permisos permitidos (alcance funcional)

El usuario setup **debe poder**:
- Iniciar sesión en la instancia clonada (username+PIN, vía el login interno).
- Acceder al Discovery/setup inicial (`/admin/constructor-crm/*`).
- Confirmar el `vertical_key` (DISCOVERY-8d).
- Revisar paneles internos de configuración/diagnóstico (RUNTIME-2/4/5, read-only).
- Cerrar el snapshot del Discovery ("Terminé", 8b) si corresponde.

> Requiere (fase de implementación) extender `canAccessPath` para permitir el rol `setup` en `/admin/constructor*` (y rutas de Discovery), manteniéndolo fuera de todo lo demás.

---

## F. Permisos bloqueados

El usuario setup **NO debe poder**:
- Operar leads reales ni datos del CRM operativo.
- Borrar datos / reset / seed destructivo.
- Tocar `package_payload`/`installable_package` como escritura.
- Activar motores ni generar el CRM operativo.
- Aprobar paquetes ni acciones sensibles.
- Acceder a zonas sensibles innecesarias (configuración avanzada, usuarios/roles, system.danger).
- Operar como usuario final del cliente.

---

## G. Opciones de implementación

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. SQL manual por instancia** | INSERT de `app_user` + rol + `app_credentials` (bcrypt de "1234"). | Control total; sin código nuevo. | Requiere generar el hash bcrypt aparte; manual y repetitivo; propenso a error. |
| **B. Script de bootstrap interno (manual)** | Script node ejecutado a mano al clonar; crea el usuario setup idempotente. | Reusable entre clones; idempotente; no corre en build; usa `hashPassword` existente. | Requiere escribir/ mantener el script. |
| **C. Endpoint interno protegido** | Endpoint que crea el usuario setup. | Cómodo. | **Nueva superficie de ataque**; riesgo de quedar expuesto; más auditoría. |
| **D. Documentar solo (esta fase)** | Política y diagnóstico, sin implementar. | Riesgo cero; correcto para PRE. | No crea el usuario aún. |

---

## H. Recomendación para la etapa actual

- **Etapa actual (este PRE):** **Opción D** — solo documentar (no se ejecuta SQL ni se crean usuarios; el alcance lo prohíbe).
- **Implementación posterior (`SETUP-USER-2`):** **Opción B** — script de bootstrap manual idempotente que, al clonar una instancia, cree el `app_user` con rol `setup`, su `app_credentials` (bcrypt de "1234", `must_change_password=true`), reusando `hashPassword`. Requiere también la extensión mínima de RBAC para el rol `setup` en rutas de Constructor/Discovery. Nunca en build; nunca con secretos en repo.

---

## I. Riesgos de seguridad

- **PIN 1234** es trivial: solo local/instalación; `must_change_password=true`; **obligatorio** deshabilitar/reemplazar antes de exponer.
- Nunca guardar el PIN ni hashes en el repo ni en `.env.local`.
- No auto-crear el usuario en cada build (evitar credencial persistente por defecto).
- El login `/api/proto/login` es prototipo: para producción debe endurecerse o reemplazarse por el login interno definitivo.
- Extender el RBAC para el rol `setup` debe ser **acotado** (solo Constructor/Discovery) y con tests, para no abrir rutas operativas.

---

## J. Relación con clonación de nuevos CRM

Al clonar `summer87-leads-v3` → `nuevo-crm-cliente`, el usuario setup es el **primer acceso controlado** para configurar la instancia (Discovery → vertical → módulos → runtime → validación) antes de que existan usuarios reales del cliente. Es parte del runbook de clonación, no del CRM operativo final.

## K. Relación con Discovery

El usuario setup es quien **completa/confirma** el Discovery y cierra el snapshot (8b/8d). Su alcance se limita a esa superficie interna.

## L. Relación con Runtime

Puede **ver** los paneles runtime read-only (RUNTIME-2/4/5) para revisar estado/vertical/módulos, pero no activa nada (las compuertas `can_*` siguen en `false`).

## M. Relación con package_payload

Ninguna: el usuario setup no genera ni escribe `package_payload`; eso queda bloqueado y reservado a una fase con validación.

## N. Próximas fases

1. **CONSTRUCTOR-SETUP-USER-2** — implementar Opción B (script de bootstrap manual) + extensión mínima de RBAC para el rol `setup`, con tests; sin SQL automático ni secretos en repo.
2. **CONSTRUCTOR-SETUP-USER-3** — checklist de baja/cambio del usuario setup antes de exponer la instancia (runbook de entrega).

---

## O. Confirmaciones de alcance

- ✅ Queda documentada la política del usuario setup; `setup/1234` es temporal/de instalación, no usuario operativo final, y no debe quedar inseguro en producción.
- ✅ Queda definida la opción recomendada (D ahora; B después).
- ✅ NO se modificó UI · NO se ejecutó SQL · NO se crearon usuarios · NO se tocaron datos.
- ✅ NO se tocó `package_payload` · NO se activaron motores · NO se creó CRM operativo.
- ✅ NO se tocó Casa Limpia CRM ni Ecuador · NO se tocó `.env.local`.
- ✅ NO se hizo deploy · NO se hizo commit · NO se hizo push.
- ✅ Único cambio en disco: este documento.
