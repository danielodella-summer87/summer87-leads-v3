# Go/No-Go Demo Interna Pickup 4x4 Client CRM 12M — Constructor CRM Summer87

**Versión:** 12M — decisión ejecutiva documental  
**Fecha:** 2026-05-18  
**Entorno:** `https://pickup4x4-crm-demo.vercel.app` · `APP_MODE=client_crm` · dataset ficticio Pickup 4x4

**Documentos base:**

| Fase | Documento |
|------|-----------|
| 12N | `ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md` |
| 12O | `validacion-post-dataset-vercel-client-crm-12O-post-dataset-run.md` |
| 12S | `validacion-correccion-ux-copy-pickup4x4-client-crm-12S-ux-fix-impl-1V.md` |
| 12T (audit) | `auditoria-dashboard-reportes-shell-pickup4x4-client-crm-12T-ux-audit.md` |
| 12T (fix) | `validacion-correccion-dashboard-pickup4x4-client-crm-12T-ux-fix-impl-1V.md` |

**Commits de referencia recientes:** Leads/copy `4221ade`; Dashboard copy `729410d`.

**Alcance de este documento:** decisión Go/No-Go para **demo interna controlada**. **No** constituye aprobación de producción, piloto con cliente real ni arquitectura multi-tenant final.

---

## 2. Resumen ejecutivo

El entorno demo **Pickup 4x4** en Vercel queda **apto para demo interna controlada** (equipo Summer87, stakeholders de confianza con guion y disclaimers).

| Afirmación | Detalle |
|------------|---------|
| **Qué sí** | Mostrar flujo operativo CRM: **Leads**, **Agenda**, **Dashboard**, **Reporte Comercial → Leads** (+ export CSV) |
| **Dataset** | **Ficticio** — 12 leads y 8 actividades cargados por UI (12N); origen `demo_12N_pickup4x4`, emails `@example.com` |
| **Seguridad** | Hardening `client_crm` **validado**: APIs críticas 8/8 → 403; `permissions/me` sin flags internas (12O, 12S, 12T) |
| **UX** | Superficies principales **Leads** (12S) y **Dashboard** (12T) alineadas a narrativa accesorios 4x4; sin Casalimpia ni LEADS87 visible en dashboard |
| **Qué no** | **No** apto para producción, preproducción, cliente real con datos reales, piloto operativo ni multi-tenant final |
| **Infra en estas fases** | **No** se ejecutó SQL directo ni manipulación manual en Supabase; persistencia vía UI/API del producto sobre proyecto Supabase **actual** (demo técnica compartida) |

---

## 3. Dictamen

| Contexto | Dictamen | Motivo |
|----------|----------|--------|
| **Demo interna** Daniel / Summer87 | **GO** | Dataset ficticio, UX core validada, seguridad 403 OK, documentación 12N–12T cerrada |
| **Demo comercial controlada** (con guion + limitaciones explícitas) | **GO condicionado** | Misma base técnica; requiere no improvisar rutas admin, explicar roadmap de reportes y marca Summer87 |
| **Demo libre** sin guion | **NO-GO** (relativo) | Riesgo de abrir tabs Consultor/Técnico, iniciativa, reportes «próximamente», marca plataforma |
| **Cliente real** usando datos reales | **NO-GO** | Dataset demo en BD compartida; sin RLS/multi-tenant final; sin Supabase separado |
| **Producción / preproducción** | **NO-GO** | Entorno Vercel demo; sin go-live checklist cliente |
| **Multi-tenant / Supabase compartido para clientes** | **NO-GO** | Arquitectura pendiente (12V y fases posteriores) |

---

## 4. Qué está OK

| Módulo | Estado | Evidencia documental | Nota |
|--------|--------|----------------------|------|
| **Login / sesión** | ✅ OK | 12O-post-dataset-run; 12S/12T smoke con sesión Daniel | Operativo en Vercel demo |
| **Menú `client_crm`** | ✅ OK | 12O §3 — sin Constructor / Configuración en menú | Allowlist típica `leads87,agenda,reportes`; Dashboard alcanzable por enlace |
| **Leads — lista** | ✅ OK | 12N, 12O, 12S §10 | 12 leads Demo; búsqueda `demo` / `lona` |
| **Leads — nuevo lead** | ✅ OK | 12S §10 | Sin Casalimpia, personal, superficie; copy operativo |
| **Leads — ficha** | ✅ OK | 12S §10 | Flujo Revisión/Cotización; sin relevamiento facility en `client_crm` |
| **Leads — búsqueda** | ✅ OK | 12O §3.1 | `demo` → 12; `lona` → 2 |
| **Agenda** | ✅ OK | 12N, 12O §3.2 | 8 actividades; vencidas / hoy / futuras |
| **Dashboard** | ✅ OK | 12T-ux-fix-impl-1V §10 | «Flujo comercial»; sin LEADS87; 12 leads activos visibles |
| **Reportes — Comercial Leads** | ✅ OK | 12O; 12S checklist pendiente parcial | Listado + datos reales API; CSV operativo |
| **CSV export** | ✅ OK | 12O; plan 12T audit | Desde `/admin/reportes/comercial/leads` |
| **Seguridad 403** | ✅ OK | 12O, 12S §11, 12T §11 | 8/8 APIs críticas; flags internas `false` |
| **Dataset Demo** | ✅ OK | 12N-impl-run | Ficticio; marcadores `Demo —`, `demo_12N_pickup4x4` |

---

## 5. Rutas recomendadas para la demo

Base: `https://pickup4x4-crm-demo.vercel.app`

| Ruta | Uso recomendado en demo |
|------|-------------------------|
| `/admin/dashboard` | Apertura — visión ejecutiva: flujo comercial, salud pipeline, 12 leads activos |
| `/admin/leads` | Listado — búsqueda `demo` o `lona`; mostrar volumen y etapas |
| `/admin/leads/nuevo` | Opcional — mostrar alta limpia (copy operativo Pickup) |
| `/admin/leads/9e8c9b61-371d-43a6-a048-5d6cf848c8df` | Ficha ancla — **Demo — Lona marítima Hilux** (validado 12S §10) |
| `/admin/agenda` | Seguimiento — vencidas, hoy, próximos 7 días; actividades vinculadas a leads Demo |
| `/admin/reportes` | Entrada catálogo — explicar que solo Comercial → Leads está conectado hoy |
| `/admin/reportes/comercial/leads` | Cierre — 12/12 filas + **Exportar CSV** |

> Si el UUID del lead Demo cambia tras recarga de dataset, usar búsqueda `lona` en lista y abrir **Demo — Lona marítima Hilux** desde la UI.

---

## 6. Rutas o zonas a evitar

| Zona | Motivo |
|------|--------|
| **Constructor CRM** (`/admin/constructor-crm/*`) | 403 / fuera de menú; producto interno Summer87 |
| **Configuración** (`/admin/configuracion/*`) | 403 / administración instancia |
| **Usuarios / roles** (APIs y rutas admin) | Bloqueadas 403 en `client_crm` |
| **Supabase** (consola, SQL, edición manual) | Fuera de alcance demo; riesgo datos compartidos |
| **Páginas internas** no `client_crm` | IA admin, reset-db, módulos initialize, etc. |
| **Tabs Técnico / Consultor** (ficha lead, usuario **admin**) | Copy consultoría / EASY; no pulido para Pickup |
| **Bloque Datos de Iniciativa** (acordeón ficha) | Módulo iniciativas fuera de menú piloto |
| **Reportes** con tag «próximamente» | Sin datos — explicar roadmap o no abrir |
| **White-label / marca Pickup 4x4** | Sigue **Summer87 Intelligence / Summer87 Leads** en shell y dashboard banner |
| **Kanban** (opcional) | Útil técnicamente; todos en «Nuevo lead» — puede restar narrativa comercial si no se prepara |

---

## 7. Guion de demo recomendado

**Duración orientativa:** 15–20 minutos · **Usuario sugerido:** comercial o admin con guion (si admin, no abrir tabs Técnico/Consultor).

| Paso | Acción | Qué decir | Qué no decir |
|------|--------|-----------|--------------|
| 1 | Abrir **Dashboard** | «Vista ejecutiva del pipeline: salud, prioridades y flujo comercial de los leads activos.» | «Producto LEADS87»; «ya está en producción» |
| 2 | Señalar **12 leads activos** y bloques de salud / flujo comercial | «Tenemos doce oportunidades de demo cargadas para el rubro accesorios 4x4.» | «Son clientes reales de Pickup» |
| 3 | Ir a **Leads** | «Acá opera el equipo día a día.» | «Multi-empresa ya resuelto» |
| 4 | Buscar **`demo`** o **`lona`** | «Filtro rápido sobre el dataset de prueba.» | Omitir que es ficticio si hay audiencia externa sin contexto |
| 5 | Abrir **Demo — Lona marítima Hilux** | «Ficha del lead: datos operativos, proceso comercial y siguiente paso recomendado.» | Abrir tabs Consultor/Técnico; «integración con stock/facturación lista» |
| 6 | Mostrar **flujo**, **siguiente paso**, acordeón **Datos del lead** | «El sistema guía qué completar para avanzar a cotización.» | «Datos del prospecto»; Casalimpia; limpieza |
| 7 | Ir a **Agenda** | «Seguimiento: vencidas, hoy y próximos días, ligado al comercial.» | Prometer WhatsApp/automatización real |
| 8 | Filtrar **vencidas / hoy / próx. 7 días** | «Priorización operativa del día.» | — |
| 9 | **Reportes → Comercial → Leads** | «Reporte operativo con filtros y export CSV para análisis externo.» | «Todos los reportes del hub ya funcionan» |
| 10 | **Exportar CSV** (si hay audiencia analítica) | «Exportación de las 12 filas visibles.» | «Datos de producción del cliente» |

**Disclaimer sugerido (inicio o cierre):** *«Entorno de demo interna Summer87 con datos ficticios. No es producción ni el CRM definitivo del cliente. Algunas pantallas del roadmap están marcadas como próximamente.»*

---

## 8. Qué NO prometer

- Que el sistema **ya está listo** para un **cliente real** o go-live productivo.
- **Multiempresa / multi-tenant** final ni aislamiento entre clientes en Supabase.
- **Supabase separado** por cliente o clon dedicado (pendiente arquitectura).
- **RLS** o políticas de seguridad a nivel fila **finales**.
- **White-label** Pickup 4x4 (logo, nombre suite, dominio).
- Integraciones **stock, facturación, WhatsApp real, KORE/Zeta** u otras no validadas en esta demo.
- **Automatizaciones** comerciales o IA en producción end-to-end.
- Que los **datos mostrados son reales** (son Demo con prefijo y emails `@example.com`).
- Que **todos los reportes** del hub están operativos (solo **Comercial → Leads** + CSV).
- **Rollback automático** del dataset demo (no documentado como herramienta producto).

---

## 9. Riesgos residuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Supabase **proyecto actual** compartido (demo técnica) | Alta (go-live) / Baja (demo interna) | Declarar ficticio; no cargar PII real; plan 12V entorno limpio |
| Datos **heredados** potenciales en BD (fuera del dataset 12N) | Media | Buscar solo `demo` / `Demo —`; no usar búsquedas amplias sin guion |
| **White-label** pendiente (Summer87 visible) | Media (demo externa) | Disclaimer; fase 12U si hay terceros |
| **Reportes** mayormente roadmap | Baja | Mostrar solo Comercial → Leads; explicar catálogo |
| **Tabs admin** Técnico/Consultor no pulidos | Media | Usuario rol comercial o no abrir tabs |
| **Datos de Iniciativa** en ficha | Media | No expandir acordeón o ocultar en fase posterior |
| **Socio/Socios** en Agenda (personalización default) | Baja | Configurar «Cliente» en personalización o mencionar como configurable |
| **Dashboard** aún con marca Summer87 en banner | Baja | Disclaimer de plataforma |
| Sin **rollback automatizado** documentado para dataset demo | Media | No borrar manualmente en Supabase sin runbook; fase 12W |
| Dependencia **Vercel + Supabase** en línea | Media | Tener plan B (grabación) si la red falla |

---

## 10. Pendientes no bloqueantes

### P1 — antes de demo comercial **externa** (terceros / cliente)

| Ítem | Referencia |
|------|------------|
| White-label básico (logo / nombre visible) | 12T audit; fase **12U** sugerida |
| Ajustar **Socio/Socios** → Cliente en Agenda si aparece | 12T audit §C |
| Ocultar tabs **Técnico/Consultor** para admin o usar usuario **comercial** | 12S UXFIX-12 |
| Ocultar **Datos de Iniciativa** si se recorre ficha completa | 12S / 12T audit |
| Revalidar lista + CSV post-deploy antes de cada sesión externa | Checklist §11 |

### P2 — producto / arquitectura

| Ítem | Referencia |
|------|------------|
| Dashboard específico `client_crm` | 12T audit — no requerido si copy neutro alcanza |
| Reportes completos (pipeline, propuestas, marketing) | Hub «próximamente» |
| Personalización por **Constructor** | Roadmap |
| **Supabase separado** / clon demo limpio | **12V** |
| Limpieza formal y **rollback** dataset | **12W** |
| **RLS / multi-tenant** final | Fuera de alcance actual |

---

## 11. Checklist pre-demo

Ejecutar el día de la sesión (Vercel production, usuario Daniel o el que presente):

| # | Check | Estado |
|---|-------|--------|
| 1 | Deployment Vercel **Ready / Current** (commit reciente ≥ `729410d` dashboard + `4221ade` leads) | ☐ |
| 2 | **Login** OK en `pickup4x4-crm-demo` | ☐ |
| 3 | **12 leads** visibles en `/admin/leads` (búsqueda `demo`) | ☐ |
| 4 | **8 actividades** visibles en `/admin/agenda` | ☐ |
| 5 | **Dashboard** carga; sin texto «LEADS87» | ☐ |
| 6 | **Reporte Comercial Leads** muestra **12/12** | ☐ |
| 7 | **Constructor / Configuración** no visibles en menú; rutas → 403 si se prueban | ☐ |
| 8 | **APIs críticas 8/8 → 403** (DevTools, opcional rápido) | ☐ |
| 9 | **Guion** (§7) abierto o impreso | ☐ |
| 10 | **No** usar datos reales ni consola Supabase durante la demo | ☐ |

---

## 12. Decisión final

| Decisión | Texto |
|----------|-------|
| **Demo interna controlada** | **GO** — entorno, dataset ficticio, UX core y seguridad documentados (12N → 12T). |
| **Demo comercial controlada** | **GO condicionado** — mismo entorno, con guion §7, disclaimers §8 y evitando zonas §6. |
| **Producción, cliente real, piloto operativo** | **NO-GO** — requiere Supabase separado, RLS/multi-tenant, white-label, limpieza de datos y criterios de go-live no cumplidos. |

---

## 13. Próximo paso recomendado

| Opción | Descripción | Cuándo |
|--------|-------------|--------|
| **A** | Hacer **demo interna** con Daniel (cerrar 12M con esta sesión) | **Inmediato** |
| **B** | Preparar **demo comercial controlada** (guion + disclaimers + checklist §11) | Tras A o en paralelo |
| **C** | Fase **12U** — white-label mínimo (logo / nombre cliente en shell) | Antes de terceros exigentes de marca |
| **D** | Fase **12V** — Supabase separado / entorno demo limpio | Antes de más datasets o clientes |
| **E** | Fase **12W** — limpieza y rollback formal del dataset Demo | Antes de recargar demo o go-live |

**Recomendación:**

1. **Cerrar 12M** con este documento y ejecutar **demo interna (A)**.
2. Si la audiencia incluye **terceros o cliente**, priorizar **12U** (white-label mínimo) **o** presentar con **usuario comercial** y guion estricto **antes** de prometer roadmap de infra (12V/12W).

---

## 14. Confirmación de alcance (este documento)

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| TypeScript / APIs / middleware | ❌ No |
| SQL ejecutado o creado | ❌ No |
| Supabase directo / datos modificados | ❌ No |
| Commit desde esta pasada | ❌ No |
| Solo documentación ejecutiva | ✅ Sí |

---

*Go/No-Go 12M — Demo interna Pickup 4x4 client_crm. Decisiones basadas en evidencia 12N, 12O, 12S y 12T; no sustituye checklist de primer cliente real ni go-live producción.*
