# Validación APIs Constructor Bloqueadas 12F — Constructor CRM Summer87

**Versión:** Fase 12F (validación manual — documental)  
**Relacionado con:** `docs/constructor-crm/validacion-modo-client-crm-12D.md`, `docs/constructor-crm/diseno-tecnico-flags-modo-12A.md`, `docs/constructor-crm/politica-ocultamiento-constructor-clones-11Y.md`, `lib/admin/constructorApiAccess.ts`, `lib/config/appMode.ts`

**Estado:** validación manual de bloqueo API en `client_crm` registrada. Complementa menú y UI (12D).

**Commits de referencia (implementación previa):**

- Add app mode configuration helper  
- Tag admin sidebar modules by menu category  
- Filter admin sidebar modules by app mode  
- Block constructor UI routes in client CRM mode  
- Document client CRM mode validation  
- Block constructor APIs in client CRM mode  

**Commit de cierre implementación API (referencia repo):** `c478645` — repo limpio tras validación manual descrita aquí.

---

## 2. Resumen ejecutivo

Se validó que las **APIs internas del Constructor** bajo `/api/admin/constructor/*` devuelven **403 JSON** con código `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` cuando **`APP_MODE=client_crm`**, sin modificar `.env.local`.

Esto **completa** la cadena de ocultamiento documentada en **12D**:

| Capa | Estado validado |
|------|-----------------|
| Menú lateral | Filtrado por modo + allowlist |
| UI `/admin/constructor-crm/*` | Redirect `/403` en `client_crm` |
| APIs `/api/admin/constructor/*` | **403 JSON** en `client_crm` (esta fase) |

En **`constructor_base`** (modo normal, sin `APP_MODE` en sesión), el **GET** de drafts sigue respondiendo datos como antes.

---

## 3. Alcance validado

| Escenario | Qué se probó | Resultado |
|-----------|--------------|-----------|
| **constructor_base — API GET drafts** | `GET .../drafts?limit=1` | ✅ JSON con drafts; sin error de modo |
| **client_crm — API GET drafts** | Misma ruta con env temporal | ✅ 403 + `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM` |
| **client_crm — UI Constructor** | Ya validado en 12D | ✅ `/admin/constructor-crm/*` → `/403` |
| **client_crm — menú con allowlist** | Ya validado en 12D | ✅ Solo leads87, agenda, reportes |
| **Retorno a modo normal** | `npm run dev` sin variables | ✅ APIs y menú restaurados |

---

## 4. Comandos usados

Referencias de sesión (variables **temporales**; **no** se editó `.env.local`):

```bash
npm run dev
```

```bash
APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev
```

**Práctica de prueba:**

- Solo **GET** en drafts (sin efectos secundarios).
- **No** se ejecutaron POSTs (`generate`, `approve`, `reject`, etc.).

Tras la prueba en `client_crm`, se volvió a `npm run dev` normal.

---

## 5. API validada en constructor_base

| Campo | Valor |
|-------|--------|
| **Ruta** | `GET /api/admin/constructor/installable-package/drafts?limit=1` |
| **Condición** | `npm run dev` normal (default `constructor_base`) |

**Resultado observado:**

- Respuesta **JSON** con listado de drafts.
- Incluyó **al menos un ítem** en la colección.
- **No** apareció `CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM`.
- Confirma que **constructor_base** conserva el comportamiento histórico de la API.

---

## 6. API validada en client_crm

| Campo | Valor |
|-------|--------|
| **Ruta** | `GET /api/admin/constructor/installable-package/drafts?limit=1` |
| **Condición** | `APP_MODE=client_crm CLIENT_VISIBLE_MODULES=leads87,agenda,reportes npm run dev` |

**Cuerpo JSON observado:**

```json
{
  "ok": false,
  "error": "CONSTRUCTOR_API_DISABLED_IN_CLIENT_CRM",
  "message": "Constructor APIs are not available in client CRM mode."
}
```

| Campo | Valor |
|-------|--------|
| **Status HTTP esperado** | **403** |

**Por qué este endpoint para la validación:** es **GET** de solo lectura; no persiste borradores, no aprueba/rechaza, no genera paquetes ni llama IA. Adecuado para confirmar el guard de modo sin riesgo operativo.

---

## 7. Guard implementado

| Elemento | Detalle |
|----------|---------|
| **Helper** | `lib/admin/constructorApiAccess.ts` |
| **Función de entrada** | `guardConstructorApiByMode()` |
| **Condición de bloqueo** | `isClientCrmMode() === true` |
| **Respuesta** | `constructorApiForbiddenResponse()` → 403 JSON |
| **Ubicación en handlers** | Primera línea útil de cada método exportado |
| **Orden respecto a efectos** | **Antes** de leer body, Supabase, IA o escritura |

**Nota:** el guard es de **aplicación por APP_MODE**. No sustituye RBAC fino ni RLS en Supabase (ver §10).

---

## 8. Métodos protegidos

Todos los route handlers bajo `app/api/admin/constructor/` reciben el guard al inicio del método.

| Ruta | Métodos |
|------|---------|
| `/api/admin/constructor/assist` | POST |
| `/api/admin/constructor/assist/events` | POST |
| `/api/admin/constructor/setup` | GET, PATCH |
| `/api/admin/constructor/installable-package/drafts` | GET |
| `/api/admin/constructor/installable-package/drafts/[id]` | GET |
| `/api/admin/constructor/installable-package/drafts/[id]/approve` | POST |
| `/api/admin/constructor/installable-package/drafts/[id]/reject` | POST |
| `/api/admin/constructor/installable-package/drafts/[id]/simulate-preinstall` | POST |
| `/api/admin/constructor/installable-package/drafts/[id]/simulation-snapshots` | GET, POST |
| `/api/admin/constructor/installable-package/drafts/[id]/meeting-decisions` | GET, POST |
| `/api/admin/constructor/installable-package/generate` | POST |

**Total:** 11 archivos `route.ts`, **14** métodos HTTP exportados.

**Validación manual explícita en 12F:** solo **GET drafts** (§5–§6). El resto se considera protegido por el mismo guard (misma implementación), sin prueba individual documentada aquí.

---

## 9. Qué NO se validó

- POSTs con efectos secundarios (`generate`, `approve`, `reject`, `simulation-snapshots` POST, etc.).
- Cada endpoint listado en §8 con **curl** individual.
- Usuario **cliente final** real (solo sesión Summer87 en dev).
- **Tenant / clon** desplegado con `.env` de staging o producción.
- Cambios en **middleware** / **proxy** (no modificados).
- **RLS** y políticas Supabase.
- APIs **fuera** de `/api/admin/constructor/*` (p. ej. `/api/admin/config/reset-db`).
- Modo **`installation_prep`** con matriz de flags.
- Comportamiento con **service role** expuesto por otros canales.

---

## 10. Riesgos residuales

| Riesgo | Notas |
|--------|--------|
| APIs fuera del prefijo Constructor | Revisar en 12H / checklist clon |
| **reset-db** y `system_danger` | Pendiente 12H |
| RBAC owner cliente vs superadmin Summer87 | Pendiente 12I |
| Middleware/proxy global | Deuda futura; no usado en 12E |
| Service role + RLS | Análisis antes de usuarios masivos en clon |
| Confianza solo en APP_MODE | Combinar con roles, allowlist emails y auditoría |
| POST no probados en 12F | Recomendable spot-check 403 en `generate` sin body destructivo en staging |

---

## 11. Estado técnico al cierre

| Componente | Estado |
|------------|--------|
| Sidebar filtra por `APP_MODE` | ✅ Implementado y validado (12D) |
| UI Constructor bloqueada en `client_crm` | ✅ `app/admin/constructor-crm/layout.tsx` (12D) |
| APIs Constructor bloqueadas en `client_crm` | ✅ `constructorApiAccess.ts` + guards (12E / esta validación) |
| `constructor_base` sin regresión API GET drafts | ✅ Validado en esta fase |
| **Build** | ✅ Exitoso en fase de implementación 12E |
| **Repo** | Limpio tras commit `c478645` (Block constructor APIs in client CRM mode) |

---

## 12. Próximas fases sugeridas

| Fase | Entregable |
|------|------------|
| **12G** | Checklist variables de entorno / clon `client_crm` (`.env.example`) |
| **12H** | Revisión `reset-db` y categoría `system_danger` |
| **12I** | Roles cliente vs roles Summer87 |
| **12J** | Validación en clone/staging real |
| **12K** | Documentación operativa de instalación modo cliente |

---

## 13. Decisión actual

> **En 12F solo se documenta la validación manual.**  
> **No se modifica código ni configuración persistente.**

---

## 14. Confirmación de alcance (fase 12F documental)

- ✅ Validación API GET drafts registrada (base + client_crm)  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se modificaron datos  
- ❌ No se tocó Supabase  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM ni tenant ni usuarios  
- ❌ No se tocó Kore ni Zeta  

---

*Documento 12F — Validación bloqueo APIs Constructor en client_crm. Prerrequisito: 12D (UI/menú). Siguiente foco recomendado: 12G (checklist clon / env).*
