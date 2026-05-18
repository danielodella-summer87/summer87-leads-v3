# Validación Post Dataset Vercel Client CRM 12O-post-dataset — Constructor CRM Summer87

**Versión:** 12O-post-dataset — checklist y guía de revalidación  
**Estado del documento:** plan / checklist documentado — **no** sustituye `12O-post-dataset-run` hasta completar revalidación manual  
**Contexto:** posterior a **12N-impl-run** (12 leads + 8 actividades Demo por UI)

**Documentos relacionados:**

| Documento | Rol |
|-----------|-----|
| `validacion-vercel-client-crm-12O-run.md` | Baseline seguridad **pre-dataset** (commit `8bead8c`) |
| `ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md` | Carga y validación funcional post-carga |
| `plan-carga-manual-ui-dataset-pickup4x4-12N-impl-plan.md` | Plan operativo original |

---

## 2. Resumen ejecutivo

Este documento define la **validación post-dataset** del entorno Vercel demo `client_crm` después de **12N-impl-run**.

| Afirmación | Detalle |
|------------|---------|
| Propósito | Confirmar que `client_crm` sigue **operativo** y **protegido** con datos Demo en BD |
| Qué hace | Checklist, criterios GO/NO-GO y script DevTools para revalidar APIs |
| Qué **no** hace | No ejecuta cargas, no modifica datos, no toca Supabase |
| Relación con 12O-run | Mini repetición **focalizada** post-datos (seguridad + smoke módulos) |
| Ejecución | Manual en navegador; resultados en futuro **`12O-post-dataset-run`** |

**No se afirma** en este archivo que la revalidación de seguridad post-dataset ya se ejecutó, salvo donde se cite evidencia de **12N-impl-run** (módulos funcionales) o **12O-run** (baseline pre-dataset).

**No se afirma:** producción lista, piloto cliente real, Supabase separado, multi-tenant/RLS final.

---

## 3. Entorno

| Campo | Valor |
|-------|--------|
| **URL** | `https://pickup4x4-crm-demo.vercel.app` |
| **Hosting** | Vercel |
| **Proyecto Vercel** | `pickup4x4-crm-demo` |
| **Tipo** | Demo interna `client_crm` |
| **Dataset cargado** | 12 leads Demo + 8 actividades Agenda (12N-impl-run) |
| **Supabase** | Proyecto **actual** — demo técnica (**no** separado) |
| **Usuario operador** | Daniel |
| **Producción** | **No** |
| **Cliente real / piloto** | **No** |
| **Commit referencia (12O-run)** | `8bead8c` — verificar en panel si hubo redeploy tras la carga |

---

## 4. Validaciones funcionales ya observadas

Registradas en **12N-impl-run** (2026-05-18). No requieren repetir salvo regresión sospechada.

| Módulo | Resultado observado | Estado |
|--------|---------------------|--------|
| **Leads** — lista | 12 registros Demo visibles | ✅ Observado |
| **Leads** — búsqueda `demo` | 12 resultados | ✅ Observado |
| **Leads** — kanban | 12 en columna **Nuevo lead** | ✅ Observado |
| **Agenda** | 8 actividades; vencidas, hoy y futuras visibles | ✅ Observado |
| **Dashboard** | Total leads 12; pipeline Nuevo lead 12; salud Bien 12; acciones vencidas 3; sin próxima acción 1; alertas y top oportunidades visibles | ✅ Observado |
| **Reportes** — hub | Carga sin error; comercial leads accesible | ✅ Observado |
| **Reporte Comercial → Leads** | 12 / 12 filas; filtros visibles | ✅ Observado |
| **Exportar CSV** | Disponible | ✅ Observado |

> **Nota:** la revalidación post-dataset puede **repetir** un smoke rápido de estos módulos si hubo redeploy o cambio de ENV.

---

## 5. Checklist de seguridad post-dataset

Completar tras login en la URL demo. Marcar en futuro **`12O-post-dataset-run`**.

| Control | Esperado | Estado | Evidencia / nota |
|---------|----------|--------|------------------|
| **Constructor** no visible en menú | Ausente | ⬜ Pendiente de revalidación | 12O-run pre-dataset: ✅ |
| **Configuración** no visible en menú | Ausente | ⬜ Pendiente de revalidación | 12O-run pre-dataset: ✅ |
| Menú: Leads, Agenda, Reportes | Visibles | ⬜ Pendiente de revalidación | 12O-run pre-dataset: ✅ |
| `/admin/constructor-crm` | **403** / Sin permisos | ⬜ Pendiente de revalidación | 12O-run: ✅ |
| `/admin/constructor-crm/manual-cliente` | **403** | ⬜ Pendiente de revalidación | 12O-run: ✅ |
| `/admin/configuracion` | **403** | ⬜ Pendiente de revalidación | 12O-run: ✅ |
| **8 APIs críticas** | **403** cada una | ⬜ Pendiente de revalidación | 12O-run: 8/8 ✅ — usar §6 |
| `GET /api/admin/permissions/me` | **200** | ⬜ Pendiente de revalidación | 12O-run: ✅ |
| Flags internas sensibles | Todas **`false`** | ⬜ Pendiente de revalidación | Ver §7 |
| Agenda: sin `GET /api/admin/users` | Ausente en Network | ⬜ Opcional | 12O-run: ✅ |
| Agenda: `GET /api/admin/agenda/owners` | **200** | ⬜ Opcional | 12O-run: ✅ |

### Detalle APIs críticas (referencia)

| Método | Endpoint | `error` esperado (12O-run) |
|--------|----------|----------------------------|
| GET | `/api/admin/config/roles` | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` |
| GET | `/api/admin/config/usuarios` | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` |
| GET | `/api/admin/users` | `INTERNAL_SENSITIVE_READ_DISABLED_IN_CLIENT_CRM` |
| POST | `/api/admin/config/reset-db` | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| GET | `/api/admin/setup/minimal-seed` | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| POST | `/api/admin/modules/initialize` | `SYSTEM_DANGER_DISABLED_IN_CLIENT_CRM` |
| POST | `/api/admin/config/usuarios/act-as` | `INTERNAL_IMPERSONATION_DISABLED_IN_CLIENT_CRM` |
| POST | `/api/admin/users/delete` | `CLIENT_USER_MANAGEMENT_DISABLED_IN_CLIENT_CRM` |

**Regla:** si **cualquier** API crítica responde **200/201** o ejecuta mutación → **NO-GO** inmediato.

---

## 6. Comandos de consola sugeridos (DevTools)

**Dónde:** pestaña del sitio en `https://pickup4x4-crm-demo.vercel.app` → DevTools → **Console**.  
**Requisito:** sesión **logueada** (cookies de auth).  
**No ejecutar desde Cursor.** No incluye secretos. No envía payloads destructivos.

```javascript
/**
 * 12O-post-dataset — probe APIs críticas + permissions/me
 * Pegar en DevTools Console con sesión activa en pickup4x4-crm-demo.vercel.app
 */
(async () => {
  const critical = [
    { method: "GET", url: "/api/admin/config/roles" },
    { method: "GET", url: "/api/admin/config/usuarios" },
    { method: "GET", url: "/api/admin/users" },
    { method: "POST", url: "/api/admin/config/reset-db", body: {} },
    { method: "GET", url: "/api/admin/setup/minimal-seed" },
    { method: "POST", url: "/api/admin/modules/initialize", body: {} },
    { method: "POST", url: "/api/admin/config/usuarios/act-as", body: {} },
    { method: "POST", url: "/api/admin/users/delete", body: {} },
  ];

  async function probe({ method, url, body }) {
    const opts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    let error = null;
    try {
      const j = await r.json();
      error = j?.error ?? j?.message ?? null;
    } catch {
      error = "(no json)";
    }
    return { method, url, status: r.status, error };
  }

  const rows = [];
  for (const c of critical) rows.push(await probe(c));

  console.table(rows);
  const count403 = rows.filter((x) => x.status === 403).length;
  console.log(`APIs críticas 403: ${count403} / ${critical.length}`);

  const meRes = await fetch("/api/admin/permissions/me", { credentials: "include" });
  const me = await meRes.json().catch(() => ({}));
  const flags = {
    has_system_danger: me?.has_system_danger,
    has_config_admin: me?.has_config_admin,
    has_config_update: me?.has_config_update,
    has_config_read: me?.has_config_read,
    has_constructor: me?.has_constructor,
    has_roles: me?.has_roles,
    has_users: me?.has_users,
  };
  console.log("permissions/me status:", meRes.status);
  console.table(flags);
  const allFalse = Object.values(flags).every((v) => v === false);
  console.log("flags internas todas false:", allFalse);
})();
```

### Pasos manuales complementarios (no automatizados por el script)

1. Verificar menú lateral (Constructor / Configuración ausentes).
2. Navegar a las 3 rutas internas y confirmar pantalla **403 · Sin permisos**.
3. Opcional: Network en `/admin/agenda` — confirmar **owners** 200 y ausencia de **users**.

---

## 7. Resultado esperado del script

| Verificación | Esperado |
|--------------|----------|
| APIs críticas en **403** | **8 / 8** |
| `permissions/me` HTTP status | **200** |
| `has_system_danger` | `false` |
| `has_config_admin` | `false` |
| `has_config_update` | `false` |
| `has_config_read` | `false` |
| `has_constructor` | `false` |
| `has_roles` | `false` |
| `has_users` | `false` |

**Consola esperada (ejemplo):**

```text
APIs críticas 403: 8 / 8
permissions/me status: 200
flags internas todas false: true
```

Registrar captura de `console.table` sin secretos en **`12O-post-dataset-run`**.

---

## 8. Criterios GO / NO-GO

### GO (demo interna post-dataset)

- ✅ Módulos operativos cargan (Dashboard, Leads, Agenda, Reportes)
- ✅ Dataset Demo **visible** (12 leads, 8 actividades según 12N-impl-run)
- ✅ Constructor y Configuración **bloqueados** (menú + rutas 403)
- ✅ **8/8** APIs críticas → **403**
- ✅ `permissions/me` **200** con flags internas en **`false`**
- ✅ Sin mezcla con datos reales no identificables en la muestra revisada

### NO-GO

- ❌ Aparece **Constructor** o **Configuración** en menú o rutas cargan con contenido interno
- ❌ Alguna API crítica responde **200**, **201** u otro éxito
- ❌ `permissions/me` expone capacidades internas (`has_constructor`, `has_users`, `has_roles`, `has_system_danger`, etc. en **`true`**)
- ❌ Dashboard / Leads / Agenda / Reportes con error persistente o vacío inesperado
- ❌ Dataset Demo indistinguible de datos reales / sensibles
- ❌ Entorno equivocado (URL distinta a `pickup4x4-crm-demo`)

---

## 9. Hallazgos ya conocidos a mantener

| Hallazgo | Impacto en validación |
|----------|------------------------|
| Bloque **“Datos Casalimpia”** en formulario lead | UX — no invalida 403; documentar en producto |
| Todos los leads en **Nuevo lead** | Demo técnica OK; narrativa comercial limitada |
| Hub reportes con secciones **próximamente** | Reporte comercial leads sigue siendo evidencia principal |
| **Supabase actual**, no separado | Riesgo de datos heredados coexistiendo con Demo |
| Dataset ficticio **persiste** en BD de la demo | Limpieza futura con marcadores `Demo —`, `demo_12N_pickup4x4`, `@example.com` |

---

## 10. Próximo paso recomendado

| Orden | Acción |
|-------|--------|
| 1 | Ejecutar checklist §5 + script §6 en Vercel (sesión Daniel) |
| 2 | Si OK → crear **`validacion-post-dataset-vercel-client-crm-12O-post-dataset-run.md`** (o nombre acordado) con evidencias |
| 3 | Decidir ramas opcionales: |
| | **A)** Ajuste UX Datos Casalimpia (cliente/rubro) |
| | **B)** Distribuir algunos leads a etapas ≠ Nuevo lead |
| | **C)** Preparar **12M Go/No-Go** demo interna |
| | **D)** **Pausar** antes de preproducción / cliente real |
| 4 | Antes de preproducción: Supabase separado o limpieza formal — **no** avanzar solo con este checklist |

---

## 11. Plantilla rápida para 12O-post-dataset-run (futuro)

```text
Fecha:
Responsable:
URL:
Post 12N-impl-run: sí

Menú client_crm:        [ ] OK  [ ] Falla
Rutas 403 (3):          [ ] OK  [ ] Falla
APIs críticas 8/8 403:  ___ / 8
permissions/me 200:     [ ] sí  [ ] no
flags internas false:   [ ] sí  [ ] no

Módulos smoke:          Dashboard [ ] Leads [ ] Agenda [ ] Reportes [ ]
Dataset visible:        leads ___ / 12   actividades ___ / 8

Dictamen: GO demo interna / NO-GO / condicionado
Notas:
```

---

## 12. Confirmación de alcance (este documento)

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| TypeScript nuevo | **No** |
| SQL ejecutado / creado | **No** |
| Supabase directo desde Cursor | **No** |
| Datos insertados / modificados / borrados desde Cursor | **No** |
| Endpoints / APIs / middleware | **No** modificados |
| Migraciones | **No** |
| Usuarios creados | **No** |
| Kore / Zeta | **No** tocados |
| Commit | **No** |
| Entregable | Solo este checklist de validación post-dataset |

---

*12O-post-dataset — guía de revalidación post **12N-impl-run**. Ejecución registrada por separado en **12O-post-dataset-run**.*
