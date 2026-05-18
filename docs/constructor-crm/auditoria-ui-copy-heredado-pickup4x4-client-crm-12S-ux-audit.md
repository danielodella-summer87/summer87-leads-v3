# Auditoría UI/Copy Heredado Pickup 4x4 Client CRM 12S-ux-audit — Constructor CRM Summer87

**Versión:** 12S-ux-audit — auditoría documental (solo repo + contexto demo)  
**Fecha:** 2026-05-18  
**Ámbito:** superficie `client_crm` visible en demo Vercel Pickup 4x4 (`/admin/leads`, ficha, kanban, dashboard, agenda, reportes)

**Referencias de contexto (observado en demo, no re-auditado aquí):**

| Documento | Uso |
|-----------|-----|
| `ejecucion-carga-manual-ui-dataset-pickup4x4-12N-impl-run.md` | Hallazgo runtime **Datos Casalimpia**, progreso 13%, Nuevo lead |
| `validacion-post-dataset-vercel-client-crm-12O-post-dataset-run.md` | Demo operativa post-dataset |

**Leyenda de evidencia:**

| Etiqueta | Significado |
|----------|-------------|
| **Repo** | Texto/campo localizado en código fuente |
| **Demo** | Observado en ejecución manual Vercel (documentos 12N / 12O-post) |
| **Inferido** | Conclusión a partir de nombres de constantes o flujo, sin string UI directo |

**Clasificación A / B / C / D:**

| Código | Significado |
|--------|-------------|
| **A** | Heredado claramente incorrecto para Pickup 4x4 |
| **B** | Genérico aceptable (CRM reusable) |
| **C** | Técnico / interno tolerable en demo interna |
| **D** | Pendiente de decisión de producto |

**No se implementó ningún cambio.** No se eliminó código ni copy.

---

## 2. Resumen ejecutivo

Tras validar la demo interna Pickup 4x4 con dataset ficticio, se audita **UI, copy y campos** que pueden heredar supuestos de **Casalimpia** (limpieza / facility) u otros flujos Summer87 (LEADS87 consultivo, iniciativas, socios).

| Conclusión | Detalle |
|------------|---------|
| Objetivo | Separar **errores visibles de demo**, **deuda UX** y **elementos genéricos tolerables** |
| Método | Inspección de repo (sin modificar código) |
| Hallazgo principal | El bloque **«Datos Casalimpia»** y el **flujo de lead** (`lib/leads/leadFlow.ts`) están acoplados a visita técnica, superficie, personal y **servicios de limpieza** |
| Impacto Pickup 4x4 | La demo técnica funciona, pero la narrativa comercial puede parecer **reciclada** |
| Módulos fuera de menú `client_crm` | `leads87`, Constructor, iniciativas masivas — no auditados como pantallas visibles en demo, salvo si el dashboard los referencia |

---

## 3. Matriz de clasificación (severidad)

| Severidad | Criterio | Ejemplos en esta auditoría |
|-----------|----------|----------------------------|
| **Crítico demo** | Confunde al usuario o rompe narrativa Pickup 4x4 | «Datos Casalimpia», servicios de limpieza en flujo |
| **Alto UX** | No bloquea operación; resta credibilidad comercial | Relevamiento de visita facility, LEADS87 en dashboard |
| **Medio** | Copy mejorable; genérico con sesgo | «Datos del prospecto», «Evaluación» vs cotización accesorios |
| **Bajo** | Interno / debug / tolerable demo interna | Columna Pipeline (DEBUG), «próximamente» en reportes |
| **No tocar** | Reusable para otros CRM / clientes | Tipos agenda llamada/reunión, menú Leads/Agenda |

---

## 4. Alcance inspeccionado

| Área | Archivos inspeccionados | Qué se buscó | Resultado general |
|------|-------------------------|--------------|-------------------|
| **Leads UI** | `app/admin/leads/page.tsx`, `[id]/page.tsx`, `kanban/page.tsx`, `nuevo/page.tsx`, `lib/leads/leadFlow.ts` | Casalimpia, visita, limpieza, prospecto, progreso | **Alto** heredado facility + consultivo |
| **Dashboard** | `app/admin/dashboard/page.tsx`, `components/crm/dashboard/CommercialFlowKpis.tsx`, `PropuestasEsperandoRespuesta.tsx` | LEADS87, diagnóstico, propuestas | **Medio-alto** — bloque LEADS87 visible en `client_crm` |
| **Agenda** | `app/admin/agenda/page.tsx` | socios, dueño, tipos | **Medio** — copy «leads y socios»; tipos OK |
| **Reportes** | `app/admin/reportes/ReportesClient.tsx`, `comercial/leads/page.tsx` | referencia, próximamente | **Bajo** — aceptable demo interna |
| **Shell / marca** | `app/admin/AdminShell.tsx`, `lib/config/appSuiteConfig.ts`, `lib/admin/adminSidebarModules.ts` | Summer87 vs Pickup | **Medio** — marca plataforma, no cliente |
| **Docs demo** | 12N-impl-run, 12O-post-dataset-run | hallazgos runtime | Corroboran Casalimpia y 13% |

**No inspeccionado como UI visible en demo `client_crm`:** `app/admin/leads87/*` (ruta distinta), `app/admin/constructor-crm/*` (403), `app/admin/empresas` (iniciativas ocultas en menú piloto).

---

## 5. Hallazgos por pantalla

### A. Nuevo lead / edición lead

| Elemento observado | Archivo probable | Por qué no corresponde (Pickup 4x4) | Impacto | Clas. | Recomendación |
|--------------------|------------------|-------------------------------------|---------|-------|---------------|
| Título **«Datos Casalimpia»** | `app/admin/leads/nuevo/page.tsx` | Nombre de otro cliente / rubro limpieza | Crítico demo | **A** | Renombrar genérico o condicional por cliente |
| Helper *«preparar la visita… evaluación/costeo»* | `nuevo/page.tsx` | Lenguaje facility / consultoría limpieza | Alto UX | **A** | Copy operativo accesorios / showroom |
| **Cantidad de personal** | `nuevo/page.tsx` | Métrica de dotación limpieza, no flota vehículos | Crítico demo | **A** | Ocultar o reemplazar (ej. cantidad de vehículos) |
| **Superficie m²** | `nuevo/page.tsx`, `leadFlow.ts` | Edificio / planta, no vehículo | Crítico demo | **A** | Ocultar o campo vehículo/uso |
| **Fecha de visita** | `nuevo/page.tsx` | Puede mapear a showroom; label genérico «visita» confunde | Medio | **D** | Renombrar «Fecha de revisión / showroom» |
| **Rubro** + `RubroSelect` | `nuevo/page.tsx` | Genérico; OK si catálogo incluye automotriz | Medio | **B** | Validar rubros en BD demo |
| **Dirección** | `nuevo/page.tsx` | Aceptable (taller / cliente) | Bajo | **B** | Mantener |
| **Producto / servicio consultado** + placeholder accesorios | `nuevo/page.tsx` | **Alineado** a Pickup (tapa, lona, baca…) | — | **B** | Mantener; buen ejemplo en repo |
| Texto *«qué busca el **prospecto**»* | `nuevo/page.tsx` | «Prospecto» genérico CRM | Medio | **B** | Opcional «cliente» / «contacto» |
| **Comercial** obligatorio | `nuevo/page.tsx` | Genérico ventas | Bajo | **B** | Mantener |
| **Pipeline** / etapas | `nuevo/page.tsx` | Genérico; demo usa «Nuevo lead» (**Demo**) | Bajo | **B** | Distribuir etapas en demo comercial |
| Crear desde **iniciativa** | `app/admin/leads/page.tsx` | Módulo iniciativas no en menú piloto; puede confundir si se expone | Medio | **D** | Ocultar acción en `client_crm` |

**Edición lead:** no se repite el bloque «Datos Casalimpia» en ficha; campos facility viven en **Relevamiento de visita** (ficha).

---

### B. Ficha de lead / flujo del proceso

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| **Flujo del proceso** (8 pasos) | `leadFlow.ts`, `[id]/page.tsx` | Parcial | **A/D** | Estructura consultiva Summer87 |
| Paso **«Datos del prospecto»** | `leadFlow.ts` | Genérico | **B** | Observado en lista como paso actual (**Demo**) |
| Paso **«Visita»** + descripción visita técnica | `leadFlow.ts` | No encaja accesorios | **A** | «relevamiento del lugar» |
| Paso **«Evaluación»** | `leadFlow.ts` | Mejorable | **D** | Puede ser «Cotización / necesidad» |
| Paso **«Servicios»** + *servicios de limpieza* | `leadFlow.ts` | Incorrecto | **A** | Texto explícito limpieza |
| Paso **«Costeo»** | `leadFlow.ts` | Aceptable si es margen accesorios | **D** | |
| *«El prospecto ya fue dado de alta…»* | `leadFlow.ts` | Genérico | **B** | |
| CTAs *superficie y visita*, *servicios de limpieza* | `leadFlow.ts` | Incorrecto | **A** | `getLeadNextAction` |
| Bloque **Relevamiento de visita** | `[id]/page.tsx` | Facility | **A** | Contrato permanente/especial, operarios, EPP |
| **Servicios especiales** (alfombras, fumigación, desratización…) | `[id]/page.tsx` ~4847 | Limpieza pura | **A** | |
| Tabs **Técnico / Consultor / Comercial** | `[id]/page.tsx` | Consultoría EASY | **A/D** | Referencia *servicios EASY* en microcopy |
| Sección **«Datos del prospecto»** | `[id]/page.tsx` ~3968 | Genérico | **B** | + subbloque **Datos de Iniciativa** |
| *«Lead no está vinculado a una iniciativa»* | `[id]/page.tsx` ~3844 | Iniciativas fuera de piloto | **D** | Ocultar en `client_crm` |
| Comentario código **Casalimpia flow helpers** | `leadFlow.ts` ~135 | **Repo** explícito | **A** | Deuda técnica nombrada |
| Campos `visita_*`, `superficie_m2`, `cantidad_personal` en modelo | `[id]/page.tsx`, API | Schema compartido | **C** | No mostrar = mitigación |

---

### C. Lista / Kanban

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| Columna **Progreso** `[N%]` + paso flujo | `page.tsx` + `leadFlow.ts` | Sesgo facility | **A** | **Demo:** ~13% = 1/8 pasos (**inferido** matemática repo) |
| Badge paso **«Datos del prospecto»** | `leadFlow.ts` | Genérico | **B** | Observado en demo |
| **Siguiente paso** (*Completar datos del prospecto e instalación*) | `leadFlow.ts` | «Instalación» ambiguo | **A** | |
| **Mostrar ganados** | `page.tsx` | Genérico pipeline | **B** | |
| **Nuevo lead** (botón) | `page.tsx` | Genérico | **B** | |
| Columna **Pipeline (DEBUG)** | `page.tsx` ~911 | Interno | **C** | Quitar antes demo externa |
| Kanban columnas desde API pipelines | `kanban/page.tsx` | Genérico | **B** | «Nuevo lead» en demo |

---

### D. Dashboard

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| **Summer87 Intelligence** / **Summer87 Leads** | `appSuiteConfig.ts`, `dashboard/page.tsx` | Marca plataforma | **D** | Demo interna OK; cliente puede pedir white-label |
| **Flujo comercial LEADS87** + hint *Diagnóstico, estrategia, servicios* | `CommercialFlowKpis.tsx` | Flujo consultivo otro producto | **Alto** | Visible en `/admin/dashboard` en `client_crm` |
| **Propuestas esperando respuesta** | `PropuestasEsperandoRespuesta.tsx` | Genérico B2B | **B** | Útil si hay propuesta PDF |
| **Salud del pipeline** | `LeadHealthSummary.tsx` | Genérico | **B** | Validado en demo |
| **Acciones vencidas** / prioridades / alertas | componentes dashboard | Genérico | **B** | |
| **Top oportunidades** | `TopOpportunities.tsx` | Genérico | **B** | |

---

### E. Agenda

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| Subtítulo *«leads y **socios**»* | `agenda/page.tsx` ~834 | Socios no usados en demo Pickup | **Medio** | **A** si solo leads |
| **Dueño** Lead / Socio | `agenda/page.tsx` | Socio opcional vía `labelSingularAgenda` | **D** | Ocultar tipo socio en piloto solo-leads |
| Tipos **llamada, whatsapp, email, reunión** | `agenda/page.tsx` | Genérico ventas | **B** | Validado demo |
| **Comercial** / **Invitados** | `agenda/page.tsx` | Genérico | **B** | |
| Link **Dashboard comercial** | `agenda/page.tsx` | Genérico | **B** | |

---

### F. Reportes

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| Tag **Referencia** / **Próximamente** | `ReportesClient.tsx` | Placeholder | **B** | No bloquea; demo OK |
| **Comercial → Leads** operativo | `comercial/leads/page.tsx` | Alineado | **B** | 12/12 en demo |
| Títulos **Pipeline**, **Propuestas** (deshabilitados) | `ReportesClient.tsx` | Genérico CRM | **B** | |
| Tooltips *filtro próximamente* en reporte leads | `comercial/leads/page.tsx` | Inconsistencia menor | **C** | Filtros sí visibles en demo |

---

### G. Sidebar / marca

| Elemento | Archivo | Pickup 4x4 | Clas. | Notas |
|----------|---------|------------|-------|-------|
| **Summer87 Intelligence • panel admin** | `AdminShell.tsx` | Plataforma | **D** | |
| Ítem menú **Summer87 Leads** (`leads87` key → `/admin/leads`) | `adminSidebarModules.ts`, `appSuiteConfig.ts` | Nombre producto, no Pickup 4x4 | **D** | White-label futuro |
| Módulos ocultos en demo (Constructor, Config, Iniciativas…) | menú `client_crm` | OK seguridad | **B** | 12O-post |

---

## 6. Tabla consolidada de hallazgos

| ID | Pantalla | Texto / campo | Tipo problema | Severidad | Corregir ahora | Recomendación | Notas |
|----|----------|---------------|---------------|-----------|----------------|---------------|-------|
| UX-01 | Nuevo lead | Datos Casalimpia | Cliente hardcodeado | Crítico | **Sí** | Renombrar / ocultar por config | **Repo** + **Demo** |
| UX-02 | Nuevo lead | visita / evaluación / costeo (helper) | Rubro limpieza | Crítico | **Sí** | Copy accesorios | **Repo** |
| UX-03 | Nuevo lead | Cantidad de personal, Superficie m² | Campos facility | Crítico | **Sí** | Ocultar o reemplazar | **Repo** |
| UX-04 | Ficha | Relevamiento de visita + servicios especiales | UI facility completa | Crítico | **Sí** | Ocultar bloque en `client_crm` o por rubro | **Repo** |
| UX-05 | Flujo | Servicios de limpieza (copy) | Texto explícito | Crítico | **Sí** | `leadFlow.ts` genérico | **Repo** |
| UX-06 | Flujo | Pasos Visita / Costeo / IA evaluación | Proceso consultivo | Alto | **Sí** | Simplificar pipeline Pickup | **Repo** |
| UX-07 | Lista | Progreso % + paso facility | Narrativa incompleta | Alto | Opcional | Recalcular o ocultar en piloto | **Demo** 13% |
| UX-08 | Dashboard | Flujo comercial LEADS87 | Producto distinto | Alto | Opcional | Ocultar sección si no LEADS87 | **Repo** |
| UX-09 | Ficha | Tabs Técnico / Consultor + EASY | Consultoría | Alto | Opcional | Ocultar tabs en demo | **Repo** |
| UX-10 | Ficha | Datos del prospecto | Genérico | Medio | Opcional | «Datos del lead» | **Repo** + **Demo** |
| UX-11 | Ficha | Iniciativa no vinculada | Módulo fuera piloto | Medio | Opcional | Ocultar en `client_crm` | **Repo** |
| UX-12 | Agenda | leads y socios | Socio irrelevante | Medio | Opcional | «solo leads» en copy | **Repo** |
| UX-13 | Nuevo lead | Producto/servicio consultado | **OK Pickup** | — | No | Mantener | **Repo** |
| UX-14 | Marca | Summer87 Intelligence / Leads | White-label | Medio | No | Decisión comercial | **Repo** |
| UX-15 | Reportes | Referencia / Próximamente | Placeholder | Bajo | No | Mantener demo interna | **Repo** |
| UX-16 | Lista | Pipeline (DEBUG) | Debug | Bajo | Antes cliente | Quitar columna | **Repo** |
| UX-17 | leadFlow.ts | Comentario Casalimpia helpers | Deuda técnica | Bajo | Con refactor | Renombrar al generalizar | **Repo** |
| UX-18 | Nuevo lead | Fecha de visita | Ambiguo | Medio | Opcional | Showroom / seguimiento | **Repo** |
| UX-19 | Dashboard | Propuestas esperando respuesta | Genérico | Bajo | No | OK si hay PDF | **Repo** |
| UX-20 | Kanban | Nuevo lead, pipeline | Genérico | Bajo | No | OK | **Demo** |

---

## 7. Recomendaciones de corrección

### A. Corrección mínima antes de demo comercial pulida

| Prioridad | Acción |
|-----------|--------|
| 1 | Renombrar **«Datos Casalimpia»** → **«Datos operativos del lead»** (global) o ocultar bloque en `APP_MODE=client_crm` |
| 2 | Ajustar helper de visita/evaluación/costeo en `nuevo/page.tsx` |
| 3 | Ocultar **Cantidad de personal** y **Superficie m²** en piloto Pickup (UI), sin borrar columnas BD |
| 4 | En `leadFlow.ts`: reemplazar *servicios de limpieza* y CTAs de visita/superficie por copy neutro o accesorios |
| 5 | Ocultar o colapsar **Relevamiento de visita** / **Servicios especiales** en ficha para `client_crm` |
| 6 | Considerar ocultar **CommercialFlowKpis** «LEADS87» en dashboard cuando no hay ruta `leads87` activa |
| 7 | Quitar columna **Pipeline (DEBUG)** de lista |

### B. Corrección estructural futura (Constructor / multi-cliente)

| Acción |
|--------|
| Bloques dinámicos por **rubro** o **CLIENT_SLUG** (`pickup4x4`) |
| Constructor define **campos operativos** por instancia (ya existe preset `pickup_4x4` en API Constructor — no visible en demo `client_crm`) |
| `leadFlow` parametrizable: pasos y labels por paquete instalado |
| No hardcodear **Casalimpia** en páginas base (`nuevo/page.tsx`) |
| Separar flujo **LEADS87 consultivo** vs **CRM operativo simple** a nivel de módulo/menú |

### C. No tocar por ahora

| Elemento | Motivo |
|----------|--------|
| Menú Leads, Agenda, Reportes | Core piloto |
| Tipos de actividad agenda | Estándar CRM |
| Reportes «próximamente» | No bloquean; leads CSV OK |
| Marca **Summer87** en demo **interna** | Decisión comercial aparte |
| Módulo `leads87` completo | No está en menú `client_crm`; evitar refactor grande ahora |

---

## 8. Propuesta de copy alternativo

| Actual (**Repo**) | Alternativa genérica | Alternativa Pickup 4x4 |
|-------------------|----------------------|----------------------|
| Datos Casalimpia | Datos operativos del lead | Datos del vehículo / necesidad |
| Cantidad de personal | Tamaño / alcance operativo | Cantidad de vehículos / unidades |
| Superficie m² | Alcance estimado | Modelo / versión / uso del vehículo |
| Fecha de visita | Fecha de revisión | Fecha de visita al showroom |
| preparar visita… evaluación/costeo | Datos para cotizar y dar seguimiento | Datos para armar presupuesto de accesorios |
| Datos del prospecto | Datos del lead | Datos del contacto / cliente |
| Visita (paso flujo) | Relevamiento / reunión | Visita showroom o llamada técnica |
| Evaluación | Evaluación comercial | Diagnóstico de necesidad |
| Servicios (paso) | Productos / servicios | Accesorios a cotizar |
| Costeo | Estimación económica | Presupuesto / margen |
| Servicios de limpieza… | Servicios a cotizar | Accesorios recomendados |
| Relevamiento de visita | Relevamiento en sitio | Checklist de instalación / medición |
| Servicios especiales (fumigación…) | (oculto) | Checklist accesorios por categoría |
| Flujo comercial LEADS87 | Flujo comercial avanzado | (oculto en demo simple) |
| Acciones de leads y socios | Acciones de leads | Acciones de leads (piloto) |

---

## 9. Riesgos si no se corrige

| Riesgo | Efecto |
|--------|--------|
| Demo parece **reciclada** de Casalimpia | Pérdida de confianza del stakeholder |
| Percepción de producto **no configurable** | Contradice narrativa «Constructor CRM» |
| Campos facility visibles con datos Demo vacíos | Progreso 13% + «datos incompletos» sin valor |
| Mezcla **LEADS87** + CRM simple | Confusión de alcance del piloto |
| Cliente real ve **Casalimpia** en pantalla | Error grave de white-label |
| Datos ficticios correctos + UX incorrecta | Operación OK, storytelling fallido |

---

## 10. Dictamen

> **GO técnico** de la demo interna (`client_crm` + dataset + seguridad) **se mantiene**.  
> **NO-GO para demo comercial pulida** ante cliente o stakeholder externo hasta corregir textos/campos heredados **críticos**, en especial **UX-01 a UX-05** (Casalimpia, limpieza, relevamiento facility, copy de flujo).

No implica bloquear el uso interno actual; implica **deuda UX visible** documentada.

---

## 11. Próximo paso recomendado

| Paso | Acción |
|------|--------|
| 1 | Crear **`12S-ux-fix-plan.md`** con alcance mínimo (IDs UX-01…UX-07) |
| 2 | Decidir estrategia de implementación: |
| | **A)** Renombre genérico global (recomendado si la base es multi-cliente) |
| | **B)** Condicional `CLIENT_SLUG=pickup4x4` / `APP_MODE` |
| | **C)** Configuración futura desde Constructor (campos por instancia) |
| 3 | Implementar en Cursor **sin romper** Casalimpia u otros clientes (ocultar > borrar schema) |
| 4 | Re-validar demo Vercel tras copy fix (smoke UX + 12O-post checklist corto) |
| 5 | Enlazar con **12M Go/No-Go** para decisión demo comercial vs interna |

---

## 12. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional modificado | ❌ No |
| SQL / Supabase | ❌ No |
| Datos insertados / borrados | ❌ No |
| Endpoints / APIs / middleware | ❌ No |
| Migraciones | ❌ No |
| Usuarios / Kore / Zeta | ❌ No |
| Commit | ❌ No |
| Entregable | Solo `auditoria-ui-copy-heredado-pickup4x4-client-crm-12S-ux-audit.md` |

---

*12S-ux-audit — auditoría UI/copy heredado. Siguiente fase sugerida: **12S-ux-fix-plan** + implementación acotada.*
