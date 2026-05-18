# Preparación Entorno Staging / Clon Client CRM 12O-prep — Constructor CRM Summer87

**Versión:** Fase 12O-prep (preparación de entorno — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `checklist-env-clon-client-crm-12G.md` | Variables ENV y reglas de clon |
| `runbook-instalacion-client-crm-12K.md` | Instalación y §9 staging/clon |
| `validacion-staging-clon-client-crm-12O.md` | Checklist **12O-run** (siguiente fase) |
| `plan-deploy-rollback-client-crm-12P.md` | Deploy/rollback tras GO 12O |
| `limpieza-semilla-datos-piloto-12N.md` | Dataset antes de piloto de valor |
| `preparacion-piloto-primer-cliente-12L.md` | Alcance piloto |
| `checklist-go-no-go-primer-cliente-12M.md` | Go/No-Go condicionado |
| `cierre-bloque-pre-piloto-client-crm-12R-cierre.md` | Estado del bloque pre-piloto |
| `validacion-integral-client-crm-12J-run-local.md` | Referencia local (no sustituye 12O) |

**Estado:** ficha operativa **documentada**. **No** crea staging/clon, **no** ejecuta deploy, **no** ejecuta **12O-run**.

---

## 2. Resumen ejecutivo

**12O-prep** prepara las **condiciones y decisiones** necesarias para poder ejecutar **12O-run** (validación `client_crm` fuera de `localhost`).

| Afirmación | Detalle |
|------------|---------|
| Hoy en el repo | **No** hay evidencia de un staging/clon **real** listo (URL, Supabase clon, dataset aplicado) |
| Lo que sí existe | Código (`appMode`, guards 12I), documentación **12G / 12K / 12O / 12P** y validación local **12J-run** |
| Qué hace 12O-prep | Deja **ficha**, checklists y criterios GO/NO-GO **antes** de validar |
| Qué **no** hace | No crea el entorno, no toca Supabase, no ejecuta deploy, no modifica datos |
| Paso siguiente | Completar ficha → crear/configurar entorno **fuera del repo** → **12O-run** |

**No se afirma:** staging/clon ya existe, deploy realizado, **12O-run** ejecutado, producción lista, multi-tenant ni seguridad completas.

---

## 3. Dictamen de auditoría previa

Auditoría de repo (solo lectura, sin modificar archivos):

| Hallazgo | Estado |
|----------|--------|
| Working tree del repo | Limpio al momento de la auditoría |
| `vercel.json` | **No** presente |
| `.env.example` con `client_crm` | **No** presente (12G documenta que no se creó en repo) |
| Scripts deploy en `package.json` | Solo `dev`, `build`, `start`, `lint` |
| URL staging/clon documentada | **No** (plantillas 12O con campos vacíos) |
| Proyecto Supabase clon identificado en docs | **No** (solo reglas genéricas) |
| Dataset **12N** aplicado en entorno destino | **No** afirmado |
| `lib/config/appMode.ts` + guards **12I** | **Sí** — listos para despliegue con ENV correctas |
| Documentación **12G / 12O / 12P / 12K** | **Sí** — procedimientos repetibles |

**Dictamen:** **A3** — señales parciales **fuertes** (documentación + hardening); **falta entorno real** (URL, hosting, Supabase dedicado, dataset, **12O-run**).

---

## 4. Objetivo de 12O-prep

Al cerrar esta ficha, el equipo debe tener definido:

| # | Objetivo |
|---|----------|
| 1 | Tipo de entorno: **staging** vs **clon cliente** vs **preview** |
| 2 | **URL** esperada de validación |
| 3 | **Hosting** y target de deploy |
| 4 | **Proyecto Supabase** (o fuente de datos) y reglas de aislamiento |
| 5 | Bloque **ENV** `client_crm` (sin pegar secretos aquí) |
| 6 | **Dataset** (12N real, demo técnica o pendiente) |
| 7 | **Usuarios de prueba** (quién valida; no crearlos en esta fase) |
| 8 | **Responsable deploy** y **responsable QA** |
| 9 | **Alcance** de la prueba (demo técnica vs piloto de valor) |
| 10 | Checklist listo para abrir **12O-run** |

---

## 5. Decisión de tipo de entorno

| Opción | Uso | Ventajas | Riesgos | Recomendación |
|--------|-----|----------|---------|---------------|
| **Staging genérico Summer87** | Validar release antes de clon cliente | Un solo lugar para QA interno | Mezcla de propósitos si no se etiqueta | Útil si ya existe pipeline Summer87 |
| **Clon cliente Pickup 4x4** | Piloto acotado con identidad del cliente | Alineado a **12L**; menor confusión comercial | Costo de mantener proyecto + Supabase | **Preferido** para primer piloto |
| **Preview deploy temporal** | PR / branch efímero | Rápido para smoke | ENV efímeras; URL inestable | Solo smoke corto; no sustituye clon estable |
| **Local (`npm run dev`)** | **12J-run** ya hecho | Rápido | No representa hosting ni ENV de panel | **No aplica** para **12O-run** |
| **Producción cliente** | Operación live | — | Alto; sin **12O-run** previo | **No aplica** en esta fase |

**Recomendación:** para el **primer piloto**, preferir **clon o staging dedicado** con `APP_MODE=client_crm`, `CLIENT_VISIBLE_MODULES` acordado y **dataset controlado** (**12N**). Evitar base madre salvo demo técnica explícita y riesgo aceptado.

---

## 6. Ficha del entorno a completar

> Completar **antes** de crear/configurar infra. **No** inventar URL ni IDs de Supabase hasta que existan.

```text
Nombre del entorno:     _______________________________________________
Tipo:                   [ ] staging  [ ] clon cliente  [ ] preview
Cliente:                _______________________________________________
Slug:                   _______________________________________________
URL esperada:           _______________________________________________
Hosting:                _______________________________________________
Proyecto / target hosting: ____________________________________________
Branch:                 _______________________________________________
Commit SHA:             _______________________________________________
Proyecto Supabase:      _______________________________________________  (nombre/id, sin keys)
Base de datos:          _______________________________________________  (ref. lógica)
Dataset:                [ ] 12N aprobado  [ ] demo técnica  [ ] pendiente
Origen de datos:        _______________________________________________
Nivel de sensibilidad:  [ ] bajo  [ ] medio  [ ] alto — justificar
Usuario de prueba:      _______________________________________________
Responsable deploy:     _______________________________________________
Responsable QA:         _______________________________________________
Responsable datos:      _______________________________________________
Responsable rollback:   _______________________________________________
Fecha estimada:         _______________________________________________
Estado:                 [ ] borrador  [ ] en configuración  [ ] listo para 12O-run
```

---

## 7. Variables ENV requeridas

Configurar en **panel del hosting** (Vercel u otro). **No** pegar secretos en este documento ni en tickets públicos.

| Variable | Valor esperado | Estado | Comentario |
|----------|----------------|--------|------------|
| `APP_MODE` | `client_crm` | ⬜ | Sin valor → default **`constructor_base`** — **riesgo crítico** |
| `CLIENT_SLUG` | `pickup4x4` (ejemplo) | ⬜ | Trazabilidad |
| `CLIENT_NAME` | `Pickup 4x4` (ejemplo) | ⬜ | UX / títulos |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` | ⬜ | Allowlist menú piloto típico |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto **clon/staging** | ⬜ | Debe coincidir con ficha §6 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Del mismo proyecto | ⬜ | No capturar en evidencias |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ⬜ | Nunca en browser / repo |
| `OPENAI_API_KEY` | — | ⬜ opcional | No requerido piloto básico |
| `RESEND_API_KEY` | — | ⬜ opcional | Solo si se prueban invitaciones |
| `RESET_DB_TOKEN` | — | ⬜ **no usar** | No exponer en clon cliente |

**Alias:** `SUMMER87_APP_MODE`, `SUMMER87_CLIENT_SLUG`, etc. — ver `checklist-env-clon-client-crm-12G.md` y `lib/config/appMode.ts`.

### Riesgos críticos de configuración

| Error | Consecuencia |
|-------|----------------|
| `APP_MODE` ausente o incorrecto | Menú fábrica; Constructor visible |
| Supabase de **base madre** en clon cliente | Mezcla de datos; fallo de confianza |
| Secretos en Git o en capturas | Exposición; rotación obligatoria |

---

## 8. Supabase / datos

**Sin ejecutar nada en esta fase.** Completar decisiones:

| Pregunta | Respuesta (completar) |
|----------|------------------------|
| ¿Proyecto Supabase **separado** del clon? | ⬜ Sí ⬜ No ⬜ Pendiente |
| ¿Se usará **base madre** solo para demo técnica? | ⬜ Sí ⬜ No — si sí, documentar riesgo |
| ¿Existe **snapshot / branch** Supabase? | ⬜ Sí ⬜ No ⬜ N/A |
| ¿Se aplicará dataset según **12N**? | ⬜ Sí ⬜ No ⬜ Pendiente |
| ¿Datos **ficticios** o **reales autorizados**? | ⬜ Ficticios ⬜ Reales ⬜ Mixto |
| ¿Riesgo de datos de **otro cliente**? | ⬜ Evaluado ⬜ Pendiente |
| ¿Quién **aprueba** los datos? | _________________________ |

| Regla | Detalle |
|-------|---------|
| SQL | **No** ejecutar desde este documento |
| Datos | **No** tocar hasta decisión explícita y responsable asignado |
| Sin dataset | Marcar **demo técnica** — **no** vender como piloto de valor |

---

## 9. Dataset 12N requerido antes de 12O-run

| Área | Demo técnica | Piloto de valor | Estado |
|------|:------------:|:---------------:|--------|
| Leads (volumen mínimo) | Opcional (puede estar vacío) | **Requerido** representativo | ⬜ |
| Agenda (actividades) | Opcional | **Requerido** si se prueba flujo | ⬜ |
| Reportes (datos para KPI) | Opcional | **Requerido** si reportes son criterio GO | ⬜ |
| Usuarios piloto | Al menos 1 QA Summer87 | Cliente + Summer87 acordados | ⬜ |
| Estados / pipeline | Coherentes o vacío explícito | Alineados al proceso cliente | ⬜ |
| Empresas / contactos | Mínimo o semilla ficticia | Según **12N** | ⬜ |
| Datos sensibles | **Prohibidos** sin autorización | Política firmada | ⬜ |
| Datos heredados (base madre) | Identificar y aislar | Limpieza **12N** | ⬜ |

**Referencia:** `limpieza-semilla-datos-piloto-12N.md`.

---

## 10. Usuarios de prueba

**No crear usuarios en 12O-prep.** Solo planificar.

### Plantilla (repetir por usuario)

```text
Usuario:              _______________________________________________
Rol:                  _______________________________________________
Email:                _______________________________________________
Tipo:                 [ ] Summer87 QA  [ ] responsable cliente  [ ] usuario operativo
Permisos esperados:   _______________________________________________
Debe ver:             Leads, Agenda, Reportes (según contrato)
No debe ver:          Constructor, Configuración, Usuarios/Roles internos
Observaciones:        _______________________________________________
```

| Regla | Detalle |
|-------|---------|
| Superadmin al cliente | **No** asignar para piloto |
| Constructor / Configuración | Usuario cliente **no** debe ver ni por URL directa (esperado **403**) |
| Creación | Ejecutar en fase posterior (hosting/Supabase), no en este doc |

---

## 11. Checklist antes de crear/configurar entorno

- [ ] Repo limpio; **commit SHA** elegido anotado en §6
- [ ] Tipo de entorno decidido (§5)
- [ ] **Hosting** decidido (proyecto Vercel u otro)
- [ ] **Supabase** decidido (separado vs madre — riesgo documentado)
- [ ] **Dataset** decidido (12N / demo técnica / pendiente)
- [ ] **Usuarios** de prueba definidos (plantilla §10)
- [ ] Variables **ENV** listadas (§7) — valores solo en panel hosting
- [ ] **URL** objetivo definida (aún puede no existir)
- [ ] **Responsables** deploy, QA, datos, rollback asignados
- [ ] Confirmado: **no** datos sensibles no autorizados
- [ ] **Rollback** conceptual leído (`plan-deploy-rollback-client-crm-12P.md` + 12K §18)
- [ ] Confirmado: **no** ejecutar SQL sin aprobación explícita

---

## 12. Checklist después de configurar entorno, antes de 12O-run

Completar **tras** deploy/configuración externa; **antes** de abrir `validacion-staging-clon-client-crm-12O.md`:

- [ ] **URL** accesible (HTTPS si aplica)
- [ ] **Login** posible con usuario de prueba
- [ ] Variables `client_crm` confirmadas en panel (**sin** pegar secretos en evidencia)
- [ ] Menú: **Leads**, **Agenda**, **Reportes** visibles
- [ ] **Constructor** no aparece en menú
- [ ] **Configuración** no aparece en menú (si no está en allowlist)
- [ ] Dataset: contenido esperado **o** demo técnica **explícita** en ficha
- [ ] Supabase: proyecto coincide con §6 (verificación operativa interna)
- [ ] Logs/hosting: sin error crítico de arranque
- [ ] **Commit SHA** desplegado = registrado en §6
- [ ] **Responsable QA** confirma inicio de **12O-run**

---

## 13. Qué NO debe hacerse en 12O-prep

| Prohibido en esta fase | Motivo |
|------------------------|--------|
| Crear / limpiar / borrar **datos** | **12N** / operación controlada |
| Ejecutar **seed** o SQL | Fuera de alcance; requiere aprobación |
| Tocar **service role** fuera del hosting | Seguridad |
| **Compartir URL** al cliente | Antes de **12O-run** GO |
| **Demo al cliente** | Riesgo de expectativas |
| Ejecutar **12O-run** | Siguiente fase |
| Ejecutar **12P-run** (prod) | Solo tras **12O-run** GO |
| Tocar **Zeta / Kore** | Fuera del piloto inicial |
| Activar **integraciones** no acordadas | Alcance **12L** |

---

## 14. Evidencias a recolectar para 12O-run

Preparar carpeta/registro (sin secretos):

| Evidencia | Uso en 12O |
|-----------|------------|
| URL final | §7 12O |
| Commit SHA | Trazabilidad |
| Tabla ENV **no secretas** confirmadas | §6 12O |
| Captura **menú** sidebar | Menú reducido |
| Capturas rutas **operativas** | Dashboard, Leads, Agenda, Reportes |
| Capturas **`/403`** | Configuración, Constructor, `manual-cliente` |
| Network **Agenda** → `owners`, sin `users` | 12J-run equivalente |
| Consola: **fetch** APIs críticas → 403 | §9 12O |
| `permissions/me` → 200 filtrado | §10 12O |
| Nota **dataset** (tipo y aprobación) | §8 / 12N |
| `git status` del commit desplegado | Auditoría |
| Responsable + fecha | §20 12O |

**Plantilla de resultados:** `validacion-staging-clon-client-crm-12O.md` §20.

---

## 15. Criterios para poder ejecutar 12O-run

### GO a 12O-run

Todos los aplicables:

- [ ] El **entorno existe** (URL responde)
- [ ] **URL** y **commit SHA** definidos y registrados
- [ ] Variables **`client_crm`** definidas en hosting (confirmación interna)
- [ ] **Supabase / fuente de datos** identificada en ficha §6
- [ ] **Dataset** definido **o** demo técnica **explícita**
- [ ] **Usuario de prueba** disponible para login
- [ ] **Responsable QA** asignado
- [ ] **Rollback** conceptual definido (12P / 12K)
- [ ] **No** hay datos sensibles no autorizados

### NO-GO a 12O-run

| Condición | Acción |
|-----------|--------|
| No hay **URL** | Completar deploy / §6 |
| No se sabe qué **Supabase** usa | Detener; aclarar §8 |
| **`APP_MODE`** no confirmado | No validar; riesgo fábrica expuesta |
| Variables **incompletas** | Completar §7 |
| **Dataset dudoso** | Resolver con **12N** o marcar demo técnica |
| **Usuario** no definido | §10 |
| Sin **responsable** QA | Asignar |
| Riesgo de datos de **otro cliente** | Pausar; aislar Supabase |
| Se pretende usar **producción** sin **12O-run** | **No** recomendado |

---

## 16. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Variables mal configuradas | Checklist §11–§12; doble lectura 12G |
| Supabase **equivocado** | Ficha §6; regla “un clon, un proyecto” |
| Datos **heredados** de base madre | **12N** + revisión antes de GO |
| Usar **base madre** por error | Prohibido salvo demo técnica documentada |
| Mostrar al **cliente** antes de validar | Política §13 |
| Sin **rollback** | Leer **12P** antes de deploy |
| Sin **usuario de prueba** | §10 |
| Confundir **staging** con **producción** | Etiquetar entorno en §6 |
| Falta **`.env.example`** sin secretos en repo | Pendiente técnico; no bloquea 12O-prep si panel hosting está OK |
| Falta **pipeline deploy** formal en repo | Proceso manual documentado en **12K** §9 |

---

## 17. Próxima secuencia recomendada

| Paso | Fase | Acción |
|------|------|--------|
| **1** | **12O-prep** | Completar ficha §6 y checklists §11 |
| **2** | Infra (fuera repo) | Crear/configurar hosting + Supabase según §5–§8 |
| **3** | Confirmación | URL + ENV + Supabase alineados (§12) |
| **4** | Datos | **12N** real **o** demo técnica explícita |
| **5** | **12O-run** | Ejecutar `validacion-staging-clon-client-crm-12O.md` |
| **6** | Si GO | Evaluar **12P-run** (pre-prod/prod según comité) |
| **7** | Si se abre al cliente | Activar **12R-run** (feedback) |

---

## 18. Pendiente técnico detectado: `app/admin/socios/.env.local`

Durante la **auditoría previa** (dictamen **A3**) se mencionó la posible existencia o referencia a un archivo **`app/admin/socios/.env.local`** con variables como `NEXT_PUBLIC_SUPABASE_URL`.

| Acción en 12O-prep | Detalle |
|--------------------|---------|
| **No tocar** | Este documento **no** abre, modifica ni borra ese archivo |
| **No mezclar** | No usar rutas locales bajo `app/` como fuente de ENV del staging/clon |
| **Recomendación** | Auditoría **separada**: ¿debe existir?, ¿está versionado?, ¿debe ir a `.gitignore`? — **sin** exponer secretos en docs |

El entorno **12O-run** debe tomar variables **solo** del panel de hosting acordado (§7), no de archivos locales legacy en el árbol de la app.

---

## 19. Confirmación de alcance

La creación de **`preparacion-entorno-staging-clon-client-crm-12O-prep.md`** confirma:

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| Archivos TypeScript | **No** creados |
| `.env.local` (raíz u otros) | **No** tocado |
| SQL ejecutado / SQL ejecutable | **No** |
| Datos modificados / borrados / insertados | **No** |
| Supabase | **No** tocado |
| Endpoints / APIs | **No** creados ni modificados |
| Middleware | **No** modificado |
| Migraciones | **No** |
| CRM real / tenant / usuarios | **No** creados |
| Kore / Zeta | **No** tocados |
| Commits | **No** realizados en esta acción |
| Entregable | **Solo** documentación **12O-prep** |

**No se afirma:** staging/clon creado, deploy realizado, **12O-run** ejecutado, producción lista.

---

*Documento 12O-prep — preparación de entorno staging/clon `client_crm`. Siguiente: configuración externa + **12O-run**.*
