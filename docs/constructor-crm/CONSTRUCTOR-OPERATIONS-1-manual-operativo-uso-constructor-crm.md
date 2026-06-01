# CONSTRUCTOR-OPERATIONS-1 — Manual operativo del Constructor CRM: de la venta a la activación

> **Tipo:** Manual operativo (documentación pura). Sin código, sin SQL, sin datos.
> **Fecha:** 2026-06-01.
> **Proyecto base:** `/Users/danielodella/PROYECTOS/summer87-leads-v3`
> **Predecesor de cadena:** `CONSTRUCTOR-SETUP-USER-5` (commit `292b6b3`).
> **Audiencia:** Daniel (EASY/Summer87) y un futuro operador técnico que clone instancias.
>
> **Convenciones de marcado usadas en todo el manual:**
> - **TERMINAL —** comando para correr en la terminal (zsh/bash en macOS).
> - **CURSOR/CLAUDE —** acción dentro del editor (Cursor) o pidiéndosela a Claude.
> - **SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA —** bloque SQL que se aplica
>   a mano en el panel de Supabase, revisado por una persona. **Nada de esto lo
>   ejecuta Claude ni el build.**
> - **🟢 VERDE / 🟡 AMARILLO / 🔴 ROJO —** semáforo de decisión (ver sección Y).

---

## A. Resumen ejecutivo

El **Constructor CRM** es el conjunto de herramientas internas de
`summer87-leads-v3` que permite **clonar** el proyecto base y **configurar** una
instancia nueva para un cliente: hacer el *Discovery* (relevamiento), confirmar el
*vertical* (rubro), revisar el *runtime* read-only y diagnosticar la navegación,
**antes** de activar el CRM operativo real del cliente.

Este manual describe el proceso real, paso a paso, **desde que Summer87/EASY vende
un CRM nuevo hasta que queda activado para el cliente**. Está pensado para repetirse
de forma segura por clon.

**Idea central de seguridad:** todo lo destructivo o sensible (SQL, creación de
usuarios reales, activación de motores, generación del CRM operativo) es **manual y
con confirmación humana**. El Constructor solo *lee*, *diagnostica* y *persiste
configuración mínima* (Discovery snapshot + `vertical_key`) en `crm_setup_config.meta`.
No activa motores ni genera el `package_payload`.

**Usuario de instalación (resumen, ver Q–S):** `username: setup`, **PIN inicial
`1234`**, rol `setup` (acceso acotado a Constructor/Discovery), `must_change_password=true`.
Es **temporal**: hay que rotarle el PIN y luego deshabilitarlo/reemplazarlo antes de
exponer la instancia.

---

## B. Qué es el Constructor CRM

- Es el **modo interno** del mismo código base (`summer87-leads-v3`), separado del
  CRM operativo del cliente por la variable **`APP_MODE`** (`lib/config/appMode.ts`):
  - `constructor_base` (default) — modo Constructor / base madre.
  - `installation_prep` — preparación de una instalación.
  - `client_crm` — CRM operativo real del cliente (el Constructor queda **bloqueado**).
- Vive bajo las rutas **`/admin/constructor-crm/*`** (Discovery, diagnóstico, runtime,
  manual cliente, etc.). El layout `app/admin/constructor-crm/layout.tsx` es un *guard*
  que **redirige a `/403` si `APP_MODE = client_crm`** (separación SEPARATION-1).
- Componentes clave ya implementados:
  - **DiscoveryContext** (`lib/constructor/discovery/`) — relevamiento tipado.
  - **Catálogo de verticales** (`lib/constructor/verticals/`) — 5 verticales:
    `generic`, `cleaning_services`, `pickup_4x4`, `marketing_agency`, `education`.
  - **Runtime read-only** (`lib/constructor/runtime/`) — `buildConstructorRuntimeConfig`,
    sugerencias de sidebar, diagnóstico.
  - **Paneles internos** en `/admin/constructor-crm` (runtime, diagnóstico de navegación).
  - **Usuario `setup`** + login interno `/api/proto/login` + cambio de PIN
    `/api/proto/change-pin` + RBAC del rol `setup` (`app/lib/rbac.ts`).

> El Constructor **no** es el CRM del cliente. Es la herramienta para *preparar* ese CRM.

---

## C. Cuándo usarlo

Usar el Constructor CRM cuando:
- Se **vendió** un CRM nuevo y hay que **crear una instancia** para ese cliente.
- Hace falta **relevar** el negocio (Discovery) y **confirmar el vertical**.
- Se quiere **revisar/diagnosticar** la instancia (runtime, navegación) antes de entregar.
- Se prepara la **baja del usuario setup** y la entrega de accesos reales.

**No** usar el Constructor (o ya no aplica) cuando:
- La instancia ya está en `client_crm` y operando para el cliente (el Constructor está bloqueado por diseño).
- Se quiere operar leads/datos reales (eso es el CRM operativo, no el Constructor).

---

## D. Flujo general desde venta hasta activación

```
VENTA
  │
  ├─ F. Requisitos previos
  ├─ G. Nombre del proyecto
  ├─ H–I. Crear carpeta + clonar base
  ├─ J. Abrir en Cursor/Claude
  ├─ K. Revisar Git inicial
  ├─ L. Crear repo GitHub del nuevo CRM
  ├─ M. Variables de entorno (.env.local de la instancia, sin secretos en repo)
  ├─ N. Supabase (proyecto + migraciones SQL MANUAL)
  ├─ O. Vercel (proyecto + envs)
  ├─ P. Dominio/subdominio
  │
  ├─ Q. Crear usuario setup (SQL MANUAL con hash del bootstrap)
  ├─ R. Cambiar PIN de setup (POST /api/proto/change-pin)
  ├─ S. Login inicial como setup
  │
  ├─ T. Completar Discovery
  ├─ U. Confirmar vertical
  ├─ V. Cerrar Discovery con "Terminé"
  ├─ W. Revisar Runtime read-only
  ├─ X. Revisar diagnóstico de navegación
  │
  ├─ Y. Decisión GO / NO-GO interno (semáforo)
  ├─ Z. Preparar usuarios reales del cliente
  ├─ AA. Deshabilitar/reemplazar setup
  ├─ AB. QA antes de entregar
  ├─ AC. Activación en cliente (APP_MODE=client_crm)
  └─ AD. Validación post-activación
```

---

## E. Roles involucrados

| Rol | Quién | Qué hace |
|---|---|---|
| **Product/Project Owner** | Daniel / EASY | Decide la venta, el vertical, GO/NO-GO, entrega al cliente. |
| **Operador técnico** | Daniel o técnico | Clona, configura envs, aplica SQL MANUAL, corre el Constructor. |
| **Usuario `setup`** | credencial temporal | Primer acceso para Discovery/diagnóstico. **No** es usuario del cliente. |
| **Usuarios reales del cliente** | admin/operadores del cliente | Se crean al final (Z); operan el CRM ya activado. |
| **Claude / Cursor** | asistente | Edita código/documentación bajo pedido. **No** ejecuta SQL ni crea usuarios reales ni hace deploy por su cuenta. |

---

## F. Requisitos previos antes de clonar

🟡 **Revisar antes de empezar:**
- Acceso a la cuenta de **Supabase** (para crear proyecto y correr SQL MANUAL).
- Acceso a **Vercel** (para crear el proyecto y cargar envs).
- Acceso al **DNS/dominio** del cliente o subdominio propio.
- Node.js y npm instalados (mismo entorno con que se construye el base).
- Cuenta de **GitHub** con permisos para crear repos.
- Datos mínimos de la venta: nombre del cliente, rubro/vertical estimado, dominio deseado.

**TERMINAL — verificar entorno básico:**
```
node -v
npm -v
git --version
```

---

## G. Convención de nombres para nuevos proyectos

- Carpeta y repo en **kebab-case**, descriptivo y sin datos sensibles:
  `clienteslug-crm` o `clienteslug-leads`.
- Ejemplos: `camara-costa-crm`, `pickup4x4-crm`, `acme-leads`.
- Evitar: espacios, mayúsculas, acentos, nombres genéricos (`crm-nuevo`).
- El **slug** elegido se reutiliza en: nombre de carpeta, repo GitHub, proyecto Vercel,
  subdominio y (si aplica) `CLIENT_SLUG` en envs.

> En este manual usaremos `nombre-del-nuevo-crm` como placeholder. Reemplazar por el slug real.

---

## H. Crear carpeta del nuevo CRM

**TERMINAL — entrar a la carpeta de proyectos:**
```
cd /Users/danielodella/PROYECTOS
```

> No se crea la carpeta a mano: el `cp -R` del paso I la genera con el contenido del base.

🔴 **NO tocar nunca** estas carpetas vecinas (fuera de alcance, prohibido):
`/Users/danielodella/PROYECTOS/casalimpia-crm-inteligente` y
`/Users/danielodella/PROYECTOS/summer87-leads-ecuador`.

---

## I. Clonar/copiar el proyecto base

Hay dos formas; elegí **una**.

**Opción 1 — Copia local del base (recomendada para empezar rápido):**

**TERMINAL — copiar el base a la instancia nueva:**
```
cd /Users/danielodella/PROYECTOS
cp -R summer87-leads-v3 nombre-del-nuevo-crm
```

**TERMINAL — entrar al nuevo CRM:**
```
cd /Users/danielodella/PROYECTOS/nombre-del-nuevo-crm
```

🟡 **Importante tras `cp -R`:** la copia trae el `.git` y el `.env.local` del base.
- El `.env.local` copiado apunta al Supabase del base → **hay que reemplazarlo** por
  el de la instancia nueva (sección M). **Nunca** trabajar el cliente nuevo contra el
  Supabase del base.
- El historial `.git` apunta al `origin` del base → se re-inicializa o se cambia el
  remoto (sección K/L).

**TERMINAL — quitar dependencias copiadas y reinstalar limpio (opcional pero recomendado):**
```
rm -rf node_modules .next
npm install
```

**Opción 2 — Clonar desde GitHub (si el base ya está versionado y querés partir limpio de git):**

**TERMINAL:**
```
cd /Users/danielodella/PROYECTOS
git clone <URL_DEL_REPO_BASE> nombre-del-nuevo-crm
cd nombre-del-nuevo-crm
npm install
```

> Con la Opción 2 el `.env.local` **no** viaja (está en `.gitignore`): hay que crearlo
> de cero (sección M).

---

## J. Abrir el proyecto en Cursor/Claude

**CURSOR/CLAUDE — abrir la carpeta de la instancia nueva** (`nombre-del-nuevo-crm`),
**no** la del base. Confirmar en la barra/título que la ruta es
`/Users/danielodella/PROYECTOS/nombre-del-nuevo-crm`.

🔴 Trabajar siempre en la instancia nueva. **Nunca** pedirle a Claude que toque
`casalimpia-crm-inteligente`, `summer87-leads-ecuador`, ni el `.env.local` con secretos.

---

## K. Revisar Git inicial

**TERMINAL — ver estado y rama:**
```
git status --short
git branch -vv
git log --oneline -5
```

Si copiaste con `cp -R` (Opción 1) y querés **un historial limpio** para el cliente:

**TERMINAL — reinicializar git (solo si se decidió partir de cero):**
```
rm -rf .git
git init
git add -A
git commit -m "chore: bootstrap nombre-del-nuevo-crm desde summer87-leads-v3"
```

🟡 Si en cambio querés **conservar** el historial del base, **no** borres `.git`; solo
cambiá el remoto en la sección L.

> Esta sección **sí** crea commits locales en la instancia nueva (es parte del setup
> del cliente). El alcance "no commit/push" de este documento aplica al **repo base**
> `summer87-leads-v3`, donde este manual es el único cambio.

---

## L. Crear repositorio GitHub del nuevo CRM

**CURSOR/CLAUDE o navegador —** crear un repo nuevo (privado) en GitHub:
`nombre-del-nuevo-crm`.

**TERMINAL — apuntar el remoto y subir (con `gh` CLI):**
```
gh repo create nombre-del-nuevo-crm --private --source=. --remote=origin --push
```

**TERMINAL — alternativa sin `gh` (remoto manual):**
```
git remote remove origin   # si venía del base
git remote add origin git@github.com:<org-o-usuario>/nombre-del-nuevo-crm.git
git push -u origin main
```

🟡 Verificar que **no** se sube `.env.local` (debe estar en `.gitignore`):
**TERMINAL:**
```
git ls-files .env.local    # debe devolver vacío
git check-ignore .env.local # debe imprimir .env.local
```

---

## M. Configurar variables de entorno

El `.env.local` es **por instancia** y **nunca** se commitea. Contiene los secretos
de Supabase/servicios del cliente nuevo.

🔴 **NO** copiar secretos del base a este manual ni al repo. 🔴 **NO** reutilizar el
Supabase del base para el cliente.

Variables que el proyecto usa (nombres, **sin valores**):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase de la instancia. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key del Supabase de la instancia. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only) del Supabase de la instancia. |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | URL base de la app (dominio/subdominio). |
| `APP_MODE` (o `SUMMER87_APP_MODE`) | `constructor_base` durante el setup; `client_crm` al activar. |
| `CLIENT_SLUG` | Slug del cliente (si la instancia lo usa). |
| `RESEND_API_KEY`, `MAIL_FROM` | Emails (invitaciones). |
| `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `GAMMA_API_KEY` | Motores IA (solo si/ cuando se habiliten; fuera del alcance del setup). |
| `CONSTRUCTOR_AUTH_BYPASS` | Bypass de prototipo: **dejar apagado** (off) — nunca en producción. |
| `RESET_DB_TOKEN` | Token de reset (no usar salvo procedimiento explícito). |

**CURSOR/CLAUDE — editar `.env.local` de la instancia nueva** cargando los valores
reales del Supabase/servicios del cliente. Durante el setup:
```
APP_MODE=constructor_base
CONSTRUCTOR_AUTH_BYPASS=        # vacío / off
```

🟡 Si la lista de variables del proyecto cambió, confirmar contra el código real
(`grep -r "process.env." lib app`) antes de dar por completa esta sección.

---

## N. Crear/configurar Supabase

1. **Navegador —** crear un **proyecto Supabase nuevo** para la instancia (no reutilizar
   el del base ni el de Casa Limpia/Ecuador).
2. Copiar URL + anon key + service role al `.env.local` (sección M).
3. **Aplicar el esquema/migraciones** del proyecto en el SQL Editor de Supabase.

> **SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA.** Todas las migraciones y seeds
> se aplican a mano en el SQL Editor de Supabase, revisadas por una persona. El repo
> incluye SQL como **plantillas** (no se ejecutan solas). Ejemplo de migración
> documentada en el README (invitaciones):

```sql
-- SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS invite_status text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS invited_at timestamptz,
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users (email);
```

Tablas relevantes para el setup (deben existir tras migraciones): `app_users`,
`app_credentials` (`username`, `password_hash` bcrypt, `must_change_password`),
`app_sessions`, `roles`, y `crm_setup_config` (columna `meta` JSONB donde el
Discovery persiste `discovery_submission` y `vertical_key`).

---

## O. Crear/configurar Vercel

1. **Navegador —** importar el repo `nombre-del-nuevo-crm` en Vercel como proyecto nuevo.
2. Cargar **todas** las variables de entorno (sección M) en Vercel (Production/Preview).
3. 🟡 Durante el setup mantener `APP_MODE=constructor_base`. **No** poner `client_crm`
   hasta la activación (sección AC).
4. 🔴 **No hacer deploy a producción del cliente** hasta pasar QA (AB) y GO interno (Y).

> Este manual **no** ejecuta deploys. El deploy es una acción humana explícita.

---

## P. Configurar dominio/subdominio

1. Definir el dominio/subdominio (ej. `cliente.tudominio.com` o el dominio propio del cliente).
2. **Navegador —** en Vercel, agregar el dominio al proyecto y seguir las instrucciones DNS.
3. Configurar los registros DNS (CNAME/A) en el proveedor del dominio.
4. Actualizar `APP_URL` / `NEXT_PUBLIC_APP_URL` en `.env.local` y en Vercel con la URL final.
5. Verificar HTTPS/cert emitido antes de exponer.

---

## Q. Crear usuario setup

Credencial **temporal de instalación** (no usuario final):

| Atributo | Valor |
|---|---|
| `username` | `setup` |
| **PIN inicial** | **`1234`** (solo instalación local/inicial; **cambiar antes de exponer**) |
| Rol | `setup` (acceso acotado a Constructor/Discovery; sin permisos operativos) |
| `must_change_password` | `true` (el login lo **bloquea** hasta rotar el PIN — ver R/S) |

🔴 **Nunca** guardar el PIN en texto plano ni el hash bcrypt en el repo. El PIN `1234`
es la **única** credencial permitida en este manual; **no** inventar credenciales de
cliente ni incluir hashes/secretos reales.

**Paso 1 — generar el hash bcrypt del PIN (no escribe nada, solo imprime SQL):**

**TERMINAL — PIN por defecto 1234:**
```
node scripts/bootstrap-setup-user.mjs
```

**TERMINAL — PIN custom (recomendado si querés evitar 1234 desde el inicio):**
```
SETUP_PIN=XXXX node scripts/bootstrap-setup-user.mjs
# o
node scripts/bootstrap-setup-user.mjs --pin XXXX
```

El script imprime por pantalla un **SQL listo para revisar** (con el hash bcrypt ya
embebido). **No** se conecta a Supabase ni ejecuta nada.

---

## R. Cómo aplicar SQL manual cuando corresponda (seed del usuario setup)

**Paso 2 — aplicar el SQL del seed a mano en Supabase.**

> **SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA.** Copiar el SQL impreso por el
> script (o usar la plantilla `docs/constructor-crm/sql/CONSTRUCTOR-SETUP-USER-2-seed-usuario-setup.sql`
> reemplazando `<<SETUP_PIN_BCRYPT_HASH>>` por el hash generado), revisarlo y pegarlo
> en el **SQL Editor de Supabase** de la instancia nueva. Estructura:

```sql
-- SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA
BEGIN;
INSERT INTO public.roles (name, label, description, is_system)
VALUES ('setup', 'Setup (instalación)', 'Rol temporal de instalación: solo Constructor/Discovery', true)
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE v_role_id UUID; v_user_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'setup';
  SELECT user_id INTO v_user_id FROM public.app_credentials WHERE username = 'setup';
  IF v_user_id IS NULL THEN
    INSERT INTO public.app_users (is_active, role_id) VALUES (true, v_role_id) RETURNING id INTO v_user_id;
    INSERT INTO public.app_credentials (user_id, username, password_hash, must_change_password)
    VALUES (v_user_id, 'setup', '<<SETUP_PIN_BCRYPT_HASH>>', true);
  ELSE
    UPDATE public.app_users SET is_active = true, role_id = v_role_id WHERE id = v_user_id;
    UPDATE public.app_credentials SET password_hash = '<<SETUP_PIN_BCRYPT_HASH>>', must_change_password = true WHERE user_id = v_user_id;
  END IF;
END $$;
COMMIT;
```

🔴 **Reglas SQL MANUAL (para toda la operación):**
- Nada de SQL lo ejecuta Claude ni el build/migración automática.
- Revisar cada bloque antes de correrlo; correr dentro de `BEGIN; … COMMIT;`.
- No commitear el hash bcrypt generado.
- El SQL del repo es **plantilla**: requiere reemplazo de placeholders + confirmación humana.

---

## S. Cambiar PIN setup y login inicial

Tras SETUP-USER-4, el login **no crea sesión** si `must_change_password=true`. Por eso
el usuario `setup` recién creado **no puede loguear** hasta rotar su PIN. El cambio se
hace por **endpoint, sin sesión** (SETUP-USER-5).

**Paso 1 — cambiar el PIN vía API (no crea sesión):**

`POST /api/proto/change-pin` con body `{ username, currentPin, newPin }`.

**TERMINAL — ejemplo con curl (ajustar host y PINs):**
```
curl -X POST http://localhost:3000/api/proto/change-pin \
  -H "Content-Type: application/json" \
  -d '{"username":"setup","currentPin":"1234","newPin":"NUEVO_PIN"}'
```

Respuesta esperada (éxito):
```json
{ "ok": true, "code": "PIN_CHANGED_LOGIN_REQUIRED",
  "message": "PIN actualizado. Iniciá sesión nuevamente con tu nuevo PIN." }
```

Qué hace el endpoint: valida el PIN actual (bcrypt), exige nuevo PIN no vacío y `≥ 4`
caracteres y distinto al actual, guarda el nuevo PIN como **hash bcrypt**, pone
`must_change_password=false`, **invalida sesiones previas** y **NO crea sesión**. El
usuario debe **volver a iniciar sesión** con el PIN nuevo.

**Paso 2 — login inicial como setup** (ya con `must_change_password=false`):

**CURSOR/CLAUDE / Navegador —** abrir `/login` e ingresar usuario `setup` + el PIN nuevo.
El front envía `{ cedula: "setup", pin: "NUEVO_PIN" }` a `/api/proto/login`. Si todo está
OK, crea sesión y entra al Constructor.

🟡 Mientras corras local, levantar el server:

**TERMINAL:**
```
npm run dev
# luego abrir http://localhost:3000/login
```

---

## T. Completar Discovery

**CURSOR/CLAUDE / Navegador —** ya logueado como `setup`, ir al Constructor:
`/admin/constructor-crm` (home con paneles) y a **`/admin/constructor-crm/cuestionario`**
(Discovery + cierre).

- Completar los datos del cuestionario (empresa, rubro, etc.).
- El `DiscoveryContext` se arma a partir del setup persistido.
- 🟡 El Discovery opera sobre **datos guardados** (no sobre ediciones sin guardar):
  guardar/refrescar antes de cerrar.

---

## U. Confirmar vertical

En el panel de cierre del cuestionario (`DiscoveryFinishPanel`):
- Se muestra el vertical **detectado** automáticamente por el rubro.
- Hay un **selector** con los 5 verticales: `generic`, `cleaning_services`,
  `pickup_4x4`, `marketing_agency`, `education`.
- **CURSOR/CLAUDE / Navegador —** elegir el vertical correcto y pulsar **"Confirmar
  vertical"**. Esto persiste `crm_setup_config.meta.vertical_key` (sin SQL; vía el PATCH
  meta existente). El estado pasa a **confirmado**.

> El vertical confirmado **prevalece** sobre la detección automática.

---

## V. Cerrar Discovery con "Terminé"

En el mismo panel, pulsar **"Terminé"**:
- Construye el **snapshot** `discovery_submission` (estado, `completion_percent`,
  blockers, `human_review_required`, summary) y lo persiste junto a `vertical_key` en
  `crm_setup_config.meta` (merge no destructivo).
- 🔴 **No** activa motores, **no** genera `package_payload`, **no** aprueba nada,
  **no** crea el CRM operativo. Es solo el cierre del relevamiento.

🟡 Revisar el **preview** de blockers antes de confirmar; si hay
`human_review_required=true` o blockers críticos, resolver antes de avanzar (semáforo Y).

---

## W. Revisar Runtime read-only

**CURSOR/CLAUDE / Navegador —** en `/admin/constructor-crm` (home) está el panel de
runtime (RUNTIME-2): hace solo **GET** a `/api/admin/constructor/setup`, construye el
`ConstructorRuntimeConfig` y muestra estado (`ready_readonly` / `blocked` /
`review_required`) y el vertical efectivo.

Qué mirar:
- **Estado runtime**: `ready_readonly` indica que el snapshot + vertical están listos
  para lectura (no activa nada).
- **Vertical** (label/key) coincide con el confirmado en U.
- Las compuertas `can_*` siguen en `false` (no se activa nada en esta fase).

---

## X. Revisar diagnóstico de navegación

**CURSOR/CLAUDE / Navegador —** en la misma home, el `RuntimeSidebarDiagnosisPanel`
(RUNTIME-4) muestra, por ítem de navegación, una **sugerencia** (`Mantener` /
`Del vertical` / `Interno` / `Sugerir ocultar`) con su razón.

🟡 Es **solo diagnóstico**: **no** oculta módulos ni cambia el sidebar real. Sirve para
verificar que la navegación por vertical "tiene sentido" antes de entregar. Si el
runtime no está listo, es **fail-open** (todo `Mantener`).

---

## Y. Decidir GO / NO-GO interno (semáforo)

Antes de preparar usuarios reales y entregar, evaluar:

**🟢 VERDE — listo para avanzar:**
- Discovery cerrado ("Terminé") con `vertical_key` **confirmado**.
- Runtime en `ready_readonly`, vertical correcto.
- Diagnóstico de navegación coherente con el vertical.
- `human_review_required=false` o revisión humana ya resuelta.
- Build OK, sin errores.

**🟡 AMARILLO — revisar antes de seguir:**
- Blockers no críticos o campos faltantes menores.
- Dominio/Supabase/Vercel configurados pero sin validar end-to-end.
- Dudas sobre el vertical o módulos.
→ Resolver y re-revisar; no entregar todavía.

**🔴 ROJO — detenerse:**
- `must_change_password` del setup aún en `true` (login bloqueado / PIN sin rotar).
- `CONSTRUCTOR_AUTH_BYPASS` encendido.
- `.env.local` apuntando al Supabase del base u otra instancia.
- Blockers críticos / `human_review_required=true` sin resolver.
- Cualquier indicio de tocar Casa Limpia/Ecuador.
→ No avanzar bajo ninguna circunstancia.

**TERMINAL — chequeo técnico de GO interno:**
```
npm run build       # debe terminar EXIT 0
git status --short  # estado limpio esperado en la instancia
```

---

## Z. Preparar usuarios reales del cliente

Recién con 🟢 VERDE se crean los usuarios reales (admin/operadores del cliente).

- **Vía invitaciones** (Google-only, ver README): `POST /api/admin/users/invite`
  crea/actualiza en `app_users` (allowlist + rol) y envía email con Resend.
- **O vía SQL MANUAL** (escenario C de la plantilla SETUP-USER-3) — **NO EJECUTAR SIN
  CONFIRMACIÓN HUMANA**, completando `<<...>>` fuera de Git (rol, email, hash bcrypt).

🔴 **No** inventar credenciales del cliente en este repo. **No** incluir emails reales
como placeholders en archivos versionados. **No** poner hashes/secretos en el repo.

---

## AA. Deshabilitar o reemplazar setup

🔴 **Obligatorio antes de exponer la instancia.** El usuario `setup` es temporal.

Usar la plantilla `docs/constructor-crm/sql/CONSTRUCTOR-SETUP-USER-3-disable-or-rotate-setup-user.sql`
(escenarios A/B/C/D). Orden recomendado:

1. **Auditar** sesiones activas de setup (consultas de diagnóstico).
2. **Invalidar** sesiones de setup.
3. **Deshabilitar** (`is_active=false`) o **eliminar** la credencial setup.
4. (Opcional) **Reemplazar** por el usuario real (escenario C).
5. **Re-auditar**: 0 sesiones activas y login imposible con setup.

> **SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA.** Ejemplo (escenario A):

```sql
-- SQL MANUAL — NO EJECUTAR SIN CONFIRMACIÓN HUMANA
BEGIN;
DELETE FROM public.app_sessions
WHERE user_id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1);
UPDATE public.app_users SET is_active = false, updated_at = now()
WHERE id = (SELECT user_id FROM public.app_credentials WHERE username = 'setup' LIMIT 1);
-- Opcional: DELETE FROM public.app_credentials WHERE username = 'setup';
COMMIT;
```

🟡 **Nota de consistencia:** la plantilla SETUP-USER-3 trae un comentario heredado
("/api/proto/login hoy NO valida must_change_password") que quedó **desactualizado**:
SETUP-USER-4 **sí** bloquea `must_change_password=true` y `is_active=false` en el login.
Igualmente, deshabilitar/rotar setup antes de exponer sigue siendo **obligatorio**.

---

## AB. QA antes de entregar

Checklist técnico (correr en la instancia nueva):

**TERMINAL — selftests de auth y Constructor:**
```
node --experimental-strip-types lib/auth/internalLogin.selftest.ts
node --experimental-strip-types lib/auth/internalChangePin.selftest.ts
node --experimental-strip-types app/lib/rbac.setup.selftest.ts
node --experimental-strip-types lib/constructor/discovery/discoveryContext.selftest.ts
node --experimental-strip-types lib/constructor/verticals/verticalCatalog.selftest.ts
node --experimental-strip-types lib/constructor/runtime/constructorRuntimeConfig.selftest.ts
node --experimental-strip-types lib/constructor/runtime/runtimeSidebarVisibility.selftest.ts
```

**TERMINAL — build y limpieza:**
```
npm run build
git diff --check
git status --short
```

QA funcional:
- Login `setup` con PIN rotado funciona; con `1234`/`must_change_password=true` **no**.
- `setup` accede **solo** a `/admin/constructor-crm/*` (RBAC allowlist); rutas operativas → denegado.
- Discovery cerrado, vertical confirmado, runtime `ready_readonly`.
- `.env.local` con valores de la instancia (no del base); `CONSTRUCTOR_AUTH_BYPASS` off.

---

## AC. Activación en cliente

🟢 Solo con QA OK + setup deshabilitado/reemplazado + usuarios reales creados:

1. **Cambiar el modo** a CRM operativo: `APP_MODE=client_crm` en `.env.local` y en Vercel.
   Esto **bloquea** el Constructor (`/admin/constructor-crm/*` → `/403`).
2. Confirmar `CONSTRUCTOR_AUTH_BYPASS` apagado y dominio/HTTPS listos.
3. **Navegador —** ejecutar el **deploy** a producción (acción humana explícita).
4. Confirmar que el cliente entra con sus usuarios reales.

**Entrega de acceso al cliente:**
- Pasar la URL final del CRM.
- Cada usuario real recibe su **invitación** (Google-only) o sus credenciales por canal seguro.
- 🔴 **Nunca** entregar el usuario `setup` ni el PIN de instalación al cliente.

---

## AD. Validación post-activación

Tras activar:
- El cliente loguea con sus usuarios reales; permisos correctos por rol.
- `/admin/constructor-crm/*` responde `403` (modo `client_crm`).
- `setup` no puede loguear (deshabilitado) y no tiene sesiones activas (re-auditar SQL MANUAL, escenario D/E de SETUP-USER-3).
- Dominio sirve por HTTPS; emails (invitaciones) salen correctamente.
- Revisar logs de errores del primer día.

---

## AE. Checklist operativo completo

- [ ] F. Requisitos previos (Supabase, Vercel, DNS, Node, GitHub).
- [ ] G. Slug/nombre definido.
- [ ] H–I. Carpeta creada + base clonado/copiado.
- [ ] I. `node_modules`/`.next` limpios + `npm install`.
- [ ] J. Proyecto abierto en Cursor/Claude (ruta correcta).
- [ ] K. Git revisado (re-init o remoto cambiado).
- [ ] L. Repo GitHub creado; `.env.local` **no** trackeado.
- [ ] M. `.env.local` con valores de la instancia (no del base).
- [ ] N. Supabase nuevo + migraciones SQL MANUAL aplicadas.
- [ ] O. Vercel con envs; `APP_MODE=constructor_base` durante setup.
- [ ] P. Dominio/subdominio + HTTPS.
- [ ] Q. Hash setup generado con el bootstrap.
- [ ] R. Seed setup aplicado por SQL MANUAL.
- [ ] S. PIN de setup rotado (`/api/proto/change-pin`) + login OK.
- [ ] T. Discovery completado.
- [ ] U. Vertical confirmado.
- [ ] V. Discovery cerrado ("Terminé").
- [ ] W. Runtime `ready_readonly` revisado.
- [ ] X. Diagnóstico de navegación revisado.
- [ ] Y. GO/NO-GO interno (🟢).
- [ ] Z. Usuarios reales del cliente creados.
- [ ] AA. Setup deshabilitado/reemplazado + sesiones invalidadas.
- [ ] AB. QA (selftests + build + funcional) OK.
- [ ] AC. `APP_MODE=client_crm` + deploy + acceso entregado.
- [ ] AD. Validación post-activación OK.

---

## AF. Checklist de seguridad

- [ ] 🔴 `setup` deshabilitado o reemplazado **antes** de exponer.
- [ ] 🔴 PIN de instalación rotado; `must_change_password=false` solo tras el cambio.
- [ ] 🔴 `CONSTRUCTOR_AUTH_BYPASS` apagado (nunca en producción).
- [ ] 🔴 `.env.local` **nunca** commiteado; sin secretos en el repo.
- [ ] 🔴 PIN/hashes nunca en texto plano en el repo ni en docs.
- [ ] 🔴 Cada instancia con su **propio** Supabase (no compartir con base/Casa Limpia/Ecuador).
- [ ] 🔴 `client_crm` activo → Constructor bloqueado (verificado 403).
- [ ] 🟡 Sesiones de setup invalidadas y re-auditadas (0 activas).
- [ ] 🟡 Usuario `setup` jamás entregado al cliente.

---

## AG. Comandos frecuentes

**TERMINAL — navegación y clon:**
```
cd /Users/danielodella/PROYECTOS
cp -R summer87-leads-v3 nombre-del-nuevo-crm
cd /Users/danielodella/PROYECTOS/nombre-del-nuevo-crm
```
**TERMINAL — instalar / correr / build:**
```
npm install
npm run dev
npm run build
```
**TERMINAL — git:**
```
git status --short
git branch -vv
git log --oneline -10
git diff --check
```
**TERMINAL — setup user (hash + cambio de PIN):**
```
node scripts/bootstrap-setup-user.mjs
curl -X POST http://localhost:3000/api/proto/change-pin \
  -H "Content-Type: application/json" \
  -d '{"username":"setup","currentPin":"1234","newPin":"NUEVO_PIN"}'
```
**TERMINAL — selftests:**
```
node --experimental-strip-types lib/auth/internalChangePin.selftest.ts
node --experimental-strip-types app/lib/rbac.setup.selftest.ts
```

---

## AH. Errores comunes y cómo resolverlos

| Síntoma | Causa probable | Solución |
|---|---|---|
| Login de `setup` devuelve 403 con código `SETUP_PASSWORD_CHANGE_REQUIRED` | `must_change_password=true` (PIN sin rotar) | Cambiar el PIN vía `/api/proto/change-pin` (sección S), luego loguear. |
| `/api/proto/change-pin` → `INVALID_CURRENT_PIN` (401) | PIN actual incorrecto | Usar el PIN real (default `1234` si recién se sembró). |
| `/api/proto/change-pin` → `WEAK_NEW_PIN` (400) | Nuevo PIN vacío/`<4`/con espacios | Elegir un PIN de ≥4 caracteres, sin espacios al borde. |
| `/api/proto/change-pin` → `SAME_PIN` (400) | Nuevo PIN igual al actual | Elegir un PIN distinto. |
| `/admin/constructor-crm` redirige a `/403` | `APP_MODE=client_crm` | Para configurar, usar `APP_MODE=constructor_base` (el bloqueo es por diseño). |
| `setup` no ve módulos operativos | RBAC del rol setup (allowlist) | Correcto: setup solo accede a Constructor/Discovery. |
| Datos del cliente aparecen "mezclados" con el base | `.env.local` apunta al Supabase del base | Reemplazar envs por los de la instancia (sección M). 🔴 |
| Build falla por tipos | cambios locales | Revisar el error de `npm run build`; no avanzar hasta EXIT 0. |
| `.env.local` aparece en `git status` | no está ignorado | Verificar `.gitignore`; **nunca** commitearlo. |

---

## AI. Qué NO hacer nunca

- 🔴 Ejecutar SQL automáticamente o dejar que Claude/el build lo corra. **Todo SQL es manual y confirmado.**
- 🔴 Entregar el usuario `setup` o el PIN `1234` al cliente.
- 🔴 Exponer una instancia con `setup` activo o `must_change_password` sin rotar.
- 🔴 Encender `CONSTRUCTOR_AUTH_BYPASS` en producción.
- 🔴 Commitear `.env.local`, PINs, hashes o secretos.
- 🔴 Reutilizar el Supabase del base/Casa Limpia/Ecuador para un cliente nuevo.
- 🔴 Tocar `/Users/danielodella/PROYECTOS/casalimpia-crm-inteligente` o `summer87-leads-ecuador`.
- 🔴 Activar motores IA o generar `package_payload`/CRM operativo durante el Discovery.
- 🔴 Hacer deploy a producción del cliente sin QA + GO interno.
- 🔴 Crear usuarios reales con datos sensibles dentro del repo.

---

## AJ. Pendientes técnicos actuales

- **No hay UI de cambio de PIN** para `setup`: hoy es por endpoint/curl (SETUP-USER-5
  entregó solo el endpoint). Una UI mínima disparada por `SETUP_PASSWORD_CHANGE_REQUIRED`
  sería una mejora.
- **Login prototipo:** `/api/proto/login` es un login interno de prototipo; para
  producción definitiva conviene endurecerlo/reemplazarlo. No tiene rate limiting.
- **Badges en sidebar real** diferidos a SHELL-2 (Opción C); hoy las sugerencias de
  navegación viven solo en el panel de diagnóstico.
- **`businessModules` por vertical** aún no se capturan en el setup; el snapshot los
  refleja vacíos hasta la fase de presets por vertical.
- **Comentario desactualizado** en la plantilla SQL SETUP-USER-3 (ver nota AA).
- **`updated_at` en `app_credentials`**: el endpoint de cambio de PIN no la setea
  (columna no confirmada); si existe y se quiere trazabilidad, agregarla por SQL MANUAL.
- **Historial de Discovery**: solo se guarda el último snapshot en `meta`; el historial
  migraría a una tabla dedicada (con SQL) en una fase futura.

---

## AK. Próximos pasos recomendados

1. (Opcional) UI mínima de cambio de PIN para `setup`.
2. **SHELL-2** — badges en el sidebar real (Opción C, con tests de no-regresión de `client_crm`).
3. Endurecer/reemplazar el login de prototipo para producción (rate limiting/lockout).
4. Capturar `businessModules` por vertical (presets).
5. Corregir el comentario heredado en la plantilla SQL SETUP-USER-3.
6. Versionar una **plantilla de runbook por instancia** (copia de este manual con el slug y decisiones del cliente).

---

## AL. Confirmaciones de alcance

- ✅ Existe un manual operativo completo, de la venta a la activación, útil para Daniel/EASY/Summer87 y un operador técnico futuro.
- ✅ Incluye comandos TERMINAL, pasos CURSOR/CLAUDE y bloques SQL MANUAL marcados como "NO EJECUTAR SIN CONFIRMACIÓN HUMANA".
- ✅ Incluye el usuario `setup` (PIN inicial `1234`, temporal), su cambio de PIN (`/api/proto/change-pin`, sin sesión), y su baja/reemplazo antes de exponer.
- ✅ Incluye QA, activación (`APP_MODE=client_crm`) y validación post-activación, con semáforo 🟢🟡🔴 y checklists.
- ✅ No se modificó código (único cambio en disco: este documento).
- ✅ No se ejecutó SQL · No se crearon usuarios reales · No se tocaron datos.
- ✅ No se tocó `.env.local` · No se tocó Casa Limpia CRM · No se tocó Ecuador.
- ✅ No se tocó `package_payload` como escritura · No se activaron motores · No se creó CRM operativo.
- ✅ No se hizo deploy · No se hizo commit · No se hizo push.
```

