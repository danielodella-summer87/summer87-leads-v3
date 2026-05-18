# Decisión Entorno Vercel Client CRM 12O-prep-run — Constructor CRM Summer87

**Versión:** 12O-prep-run — decisión operativa mínima  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `preparacion-entorno-staging-clon-client-crm-12O-prep.md` | Marco y checklists previos a 12O-run |
| `validacion-staging-clon-client-crm-12O.md` | Ejecución **12O-run** (siguiente) |
| `checklist-env-clon-client-crm-12G.md` | Variables ENV |
| `runbook-instalacion-client-crm-12K.md` | Instalación y smoke tests |
| `limpieza-semilla-datos-piloto-12N.md` | Dataset ficticio / limpieza futura |

**Estado:** decisión **registrada**. **No** implica proyecto Vercel creado, URL activa, deploy ejecutado ni **12O-run** completado.

**Fecha de decisión:** registrada al cerrar 12O-prep-run (sesión operativa del equipo).

---

## 2. Resumen ejecutivo

Se decide **preparar** un entorno **temporal en Vercel** para una **demo interna** en modo **`APP_MODE=client_crm`**, orientada al caso **Pickup 4x4**, como paso previo a ejecutar **12O-run** fuera de `localhost`.

| Aspecto | Decisión |
|---------|----------|
| Hosting | **Vercel** |
| Naturaleza | Preview / staging **temporal** — validación interna |
| Cliente referencia | **Pickup 4x4** |
| Alcance explícito | **No** es clon cliente definitivo ni producción |
| Siguiente hito técnico | Configurar Vercel + ENV → URL → **12O-run** |

**No se afirma:** que Vercel ya esté configurado, que exista URL, que el dataset ficticio **12N** ya esté cargado ni que **12O-run** haya ocurrido.

---

## 3. Ficha de decisión

| Campo | Valor acordado |
|-------|----------------|
| **Hosting** | Vercel |
| **Tipo de entorno** | Preview / staging **temporal** (demo interna) |
| **Cliente** | Pickup 4x4 |
| **Slug** | `pickup4x4` (alineado a documentación piloto) |
| **URL** | **Pendiente** — aún **no existe** |
| **Supabase** | Proyecto **actual** — solo para **demo técnica**; evaluar limpieza/separación **después** |
| **Dataset** | **12N ficticio** (planificado; **no** afirmado como ya aplicado) |
| **Usuario de prueba** | Usuario actual de **Daniel** |
| **Objetivo** | Demo interna; si la validación es satisfactoria, planificar **preproducción** con mejor criterio |
| **Clon definitivo / producción** | **No** definido en esta decisión |

### Aclaración de alcance

Este entorno es un **puente de validación** entre **12J-run** (local) y un posible clon estable o preprod. **No** debe presentarse al cliente final como entorno definitivo ni como piloto de valor comercial sin completar **12O-run**, dataset y gobernanza de datos.

---

## 4. Justificación

| Motivo | Detalle |
|--------|---------|
| Validar fuera de localhost | Repite controles de menú, 403 y APIs en hosting real (Vercel) |
| Reducir salto a producción | Evita exponer prod antes de evidencia **12O-run** |
| Supabase separado diferido | Acelera demo técnica interna usando proyecto actual; deuda explícita |
| Alineación con bloque pre-piloto | Cierra pendiente **A3** (falta entorno real) con decisión mínima |
| Criterio para preprod | Si demo interna OK → planificar preproducción con dataset y aislamiento revisados |

La opción es **válida como demo técnica interna**, no como **piloto de valor** con cliente ni como **producción**.

---

## 5. Riesgos aceptados

| Riesgo | Mitigación acordada |
|--------|---------------------|
| Proyecto Supabase **actual** puede arrastrar **datos heredados** | Tratar como demo técnica; no prometer datos limpios; planificar limpieza/separación post-demo |
| **No** mostrar al cliente como entorno final | Solo equipo Summer87 hasta **12O-run** GO y decisión explícita |
| Dataset **12N ficticio** aún por **aplicar/definir** | Registrar en ficha; no afirmar carga hecha |
| **Sin** aislamiento completo de datos | Aceptado temporalmente; **NO-GO** cliente real hasta resolver |
| **Sin** multi-tenant / RLS final | Fuera de alcance; no confundir con seguridad completa |
| **URL Vercel** aún no existe | Completar tras crear/configurar proyecto |
| `APP_MODE` mal configurado → **constructor_base** | Checklist ENV §6; verificar menú sin Constructor tras deploy |

---

## 6. Variables Vercel a configurar

Configurar en el **panel de Vercel** del proyecto temporal. **No** registrar valores secretos en este documento ni en Git.

| Variable | Valor esperado | Nota |
|----------|----------------|------|
| `APP_MODE` | `client_crm` | Obligatoria; ausencia → **constructor_base** |
| `CLIENT_SLUG` | `pickup4x4` | Identidad técnica Pickup |
| `CLIENT_NAME` | `Pickup 4x4` | Títulos / UX |
| `CLIENT_VISIBLE_MODULES` | `leads87,agenda,reportes` | Allowlist piloto documentado |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto **actual** (demo técnica) | Confirmar en panel; no pegar en doc |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Del proyecto actual | Solo hosting; no evidencias públicas |
| `SUPABASE_SERVICE_ROLE_KEY` | Del proyecto actual | **Server only**; nunca en cliente |
| `OPENAI_API_KEY` | — | Opcional; no requerido demo básica |
| `RESEND_API_KEY` | — | Opcional; no requerido sin emails |
| `RESET_DB_TOKEN` | — | **No usar** / no exponer en este entorno |

**Alias** `SUMMER87_*` admitidos según `lib/config/appMode.ts` y **12G**.

Tras deploy: verificar en runtime que el menú **no** muestra Constructor ni Configuración (equivalente **12J-run**).

---

## 7. Qué queda pendiente antes de 12O-run

| # | Pendiente | Estado |
|---|-----------|--------|
| 1 | Crear o vincular **proyecto en Vercel** | ⬜ |
| 2 | Configurar variables §6 en Vercel | ⬜ |
| 3 | Confirmar **URL** pública | ⬜ |
| 4 | Anotar **commit SHA** desplegado | ⬜ |
| 5 | Confirmar que **Daniel** (usuario actual) puede **entrar** | ⬜ |
| 6 | Decidir aplicación concreta del **dataset 12N ficticio** vs demo con **datos actuales** del Supabase | ⬜ |
| 7 | Ejecutar **build/deploy** en Vercel | ⬜ |
| 8 | Ejecutar checklist **`validacion-staging-clon-client-crm-12O.md`** (**12O-run**) | ⬜ |

Completar también checklists §11–§12 de `preparacion-entorno-staging-clon-client-crm-12O-prep.md` cuando exista URL.

---

## 8. Dictamen

> **GO** para **preparar** entorno Vercel temporal `client_crm` de **demo interna** (Pickup 4x4).  
> **NO-GO** para **producción** o **cliente real** hasta: ejecutar **12O-run**, resolver criterios de **dataset** (12N ficticio o explícita demo con datos actuales) y definir **preproducción** con Supabase/aislamiento revisados.

---

## 9. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Entregable | Solo este documento (**12O-prep-run**) |
| Código funcional | **No** modificado |
| Archivos TypeScript | **No** creados |
| `.env.local` | **No** tocado |
| SQL | **No** ejecutado |
| Supabase | **No** tocado en esta fase documental |
| Datos | **No** modificados, insertados ni borrados |
| Vercel | **No** configurado aún (solo decisión) |
| Deploy | **No** ejecutado aún |
| **12O-run** | **No** ejecutado aún |
| Kore / Zeta | **No** tocados |
| Commits | **No** realizados en esta acción |

---

*Documento 12O-prep-run — decisión operativa Vercel demo interna `client_crm`. Siguiente: configuración Vercel + **12O-run**.*
