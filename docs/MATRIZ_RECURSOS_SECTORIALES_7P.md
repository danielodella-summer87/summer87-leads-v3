# Matriz técnica de recursos sectoriales — Summer87 Leads v3

**Versión:** Fase 7P (auditoría técnica documental)  
**Relacionado con:** `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`, `docs/DECISION_RUTAS_COMERCIALES_7M.md`  
**Alcance:** inventario basado en rutas y búsquedas en el repo al momento de 7P; **no** sustituye un `git grep` de imports en CI.

---

## 2. Propósito

Inventariar **archivos y rutas** asociados a capacidades **sectoriales** (especialmente **agencia de marketing digital**) y a **legacy** (`leads87`, MODO EASY, Gamma) **antes** de limpiar código o datos, para **no perder activos** reutilizables como presets del Instalador o packs del Constructor.

---

## 3. Principio

> **Primero clasificar, después limpiar.**

### 3.1 Categorías de decisión

| # | Categoría | Uso en esta matriz |
|---|-----------|-------------------|
| **1** | **Core del producto** | Conservar como CRM configurable general. |
| **2** | **Recurso sectorial reutilizable** | Conservar; activar solo si la vertical aplica (p. ej. agencia). |
| **3** | **Legacy técnico** | Mantener por compatibilidad, redirects o transición. |
| **4** | **Candidato a archivar** | No borrar; revisar imports y uso real antes de mover/archivar. |
| **5** | **Requiere decisión de Daniel** | No tocar hasta criterio de producto/contrato. |

---

## 4. Matriz principal

| Archivo / recurso | Área | Uso actual | Valor reutilizable | Clasificación | Acción recomendada | Riesgo |
|--------------------|------|------------|--------------------|---------------|----------------------|--------|
| `app/admin/leadsok/page.tsx` | Admin UI | Recorrido guiado; `fetch` leads + docs; `AiLeadReport` + iframes a ficha canónica | Plantilla de **onboarding** por etapas; UX de “siguiente paso” | **2** sectorial + **3** ruta no canónica | No promover como CRM principal (7M); opcional pack “recorrido” | Bajo |
| `lib/crm/leadsOkMacroFlow.ts` | Dominio | Estados macro desde lead + documentos; usado también en dashboard / derivados | Reglas de etapa comercial reutilizables | **2** | Extraer a preset “agencia” o módulo compartido; no borrar | Medio (consumidores múltiples) |
| `lib/crm/leadsOkMicroFlow.ts` | Dominio | 6 pasos micro (IA → diagnóstico → …) | Secuencia comercial tipo agencia | **2** | Igual que macroflow | Medio |
| `app/admin/leads87/page.tsx`, `[id]/page.tsx` | Admin | **Redirect** a `/admin/leads` y `/admin/leads/[id]` | Compatibilidad URL | **3** | Mantener redirects; no nuevos enlaces (7M) | Bajo |
| `app/admin/leads87/components/*` (7 archivos `.tsx`) | Admin UI | Guía, diagnóstico, estrategia, servicios, propuesta, documentos, workspace avanzado | Contenido UX densamente **sectorial** agencia | **4** + **2** contenido | Auditar **imports reales** (7Q); fusionar a ficha o archivar carpeta | Alto si se borra con lógica aún referenciada |
| `components/leads/AiLeadReport.tsx` | UI + IA | Informe IA por perfiles; constante perfil **“Agencia de Marketing / MODO EASY”** | Motor de análisis reusable; perfil agencia como **capa** | **1** core + **2** prompts asociados | Parametrizar perfil por vertical en Instalador; no hardcode genérico | Alto (acoplamiento tamaño) |
| `lib/crm/metrics.ts` | Dominio | Métricas; campos `leads87Flow` / etapas | KPIs pipeline / LEADS87 | **1** + **2** naming | Conservar lógica; renombrar en UX cuando haya modelo neutro | Medio |
| `lib/crm/dashboardCommercialFlow.ts` | Dominio | Flujo comercial dashboard; tipos `LeadForLeadsOkMacro` | Coherencia con leadsok | **1** / **2** | Documentar dependencia con dashboard | Medio |
| `lib/crm/leads87CommercialSummary.ts` | Dominio | Resumen comercial LEADS87 | Texto/estructura agencia | **2** | Pack sectorial opcional | Medio |
| `lib/crm/getLeadDerivedFlow.ts` | Dominio | Derivación de pasos desde lead | Orquestación comercial | **1** | Mantener; alinear nombres con vertical | Medio |
| `lib/crm/commercialStrategyFlow.ts` + `commercialStrategyTypes.ts` | Dominio | Aprobación estrategia comercial | Flujo consultivo agencia | **2** | Preset vertical | Medio |
| `app/api/admin/leads/[id]/commercial-strategy/*` (3 rutas) | API | GET/generate/confirm estrategia | Backend estrategia | **2** | Mantener; no exponer como genérico sin flags | Medio |
| `app/api/admin/leads/[id]/service-recommendations/route.ts` | API | Recomendaciones de servicios | Empaquetado oferta agencia | **2** | Vertical “servicios intangibles” | Medio |
| `app/api/admin/leads/[id]/gamma-*` (5 rutas + `status`) | API | Gamma diagnóstico / estrategia / propuesta / prompt | Pipeline documentos premium agencia | **2** | Pack sectorial + límites de coste | Alto (externo / tokens) |
| `app/api/admin/leads/[id]/documents/*` (incl. `finalize-gamma`, `mirror-pdf`, `recover-legacy*`) | API | Documentos lead | Export y recuperación | **1** + **2** tramos Gamma | Core; tramos legacy etiquetar | Medio |
| `app/api/admin/ia/*` (perfiles, prompts, categorías, sugerencias, dashboard) | API | CRUD IA administrable | Infra **core**; contenido puede ser sectorial | **1** | Separar datos seed/migración “easy” como pack | Alto (datos en BD) |
| `app/admin/ia/*` | Admin UI | Configuración perfiles/prompts | Operación **core** | **1** | No mezclar UI con copy solo agencia sin contexto | Medio |
| `app/admin/neuroventas/page.tsx` | Admin UI | Manual / contenido | Venta consultiva agencia | **2** | Módulo opcional por vertical | Bajo |
| `app/admin/configuracion/servicios/page.tsx` | Admin UI | Catálogo comercial, roles internos, categorías, servicios | **Pack agencia** catálogo + esfuerzo | **1** modelo + **2** datos ejemplo | Preset Instalador “agencia” | Medio |
| `app/api/admin/services/*`, `service-categories/*` | API | CRUD servicios y categorías | Mismo modelo catálogo | **1** | Core; seeds sectoriales aparte | Medio |
| `components/leads/Proposal*.tsx`, `SuggestedServiceCard.tsx`, etc. | UI | Armado propuesta en ficha | UX propuesta servicios | **1** + **2** | Core; estilos copy revisar por vertical | Medio |
| `migrations/052_*`, `053_*`, `055_*`, `056_*`, `067_*` (`*modo_easy*`, `*easy*`) | SQL | Datos/prompts **MODO EASY** / Agencia | **Plantilla prompts** agencia | **2** + **5** | Inventario en BD; no reaplicar en plantilla limpia sin decisión (7B) | **Alto** |
| `supabase/migrations/2026-ia-easy-initial-data.sql` | SQL | Seed IA “easy” | Pack inicial | **2** + **5** | Documentar árbol de migraciones (7B) | Alto |
| `app/admin/constructor/*`, `app/api/admin/constructor/*` | Constructor | Diseño CRM | Core producto | **1** | Independiente de vertical agencia | Bajo–medio |

*Nota:* `components/crm/*` (dashboard), `lib/crm/priorityEngine.ts`, `lib/ai/*` y otras rutas bajo `app/api/admin/leads` no están todas fila a fila; ampliar 7Q con `rg`/grafo de imports.

---

## 5. Plantilla sectorial: agencia de marketing digital

Recursos que **encajan** como pack (combinación **2** + activación por vertical):

- **Diagnóstico comercial** — APIs Gamma / diagnóstico, bloques en `leads87` components, prompts MODO EASY orientados a decisión y cierre.
- **Análisis de lead** — `AiLeadReport`, perfiles comerciales, `ai-report` API.
- **Motores IA de propuesta** — `gamma-proposal`, `commercial-strategy`, documentos.
- **Recomendaciones de servicios** — `service-recommendations`, líneas en `ProposalService*`.
- **Catálogo comercial** — `configuracion/servicios`, APIs `services` / `service-categories`, esfuerzo por rol (`agency-*` en build si aplica).
- **Reportes de performance** — `app/admin/reportes` (comercial), métricas en `lib/crm/metrics.ts` (cuando el modelo sea campañas/leads).
- **Estrategia comercial** — `commercialStrategyFlow`, UI/API `commercial-strategy`.
- **Gamma / propuestas** — rutas `gamma-*`, `finalize-gamma`, componentes propuesta en `components/leads`.
- **Manual de neuroventas** — `/admin/neuroventas`.
- **Flujo guiado** — `leadsok` + libs `leadsOk*`.

---

## 6. Recursos que NO deben exponerse como genéricos

- **Prompts y perfiles “MODO EASY” / “Agencia de Marketing”** (BD + migraciones + constantes en `AiLeadReport`).
- **Catálogo y copy** fuertemente ligados a “agencia” si la instancia no es agencia (neutralización ya hecha en UI genérica; datos seed revisar).
- **Reportes** con KPIs solo relevantes para campañas digitales sin adaptación.
- **`/admin/leadsok`** si se presenta como **producto final** al cliente (debe ser opción interna/recorrido).
- **Componentes `leads87`** con copy o flujo **sectorial** sin flag de vertical.

---

## 7. Recursos que deben mantenerse core

- **Leads canónico** — `app/admin/leads/*`, APIs `/api/admin/leads/*` (CRUD, pipelines, bulk).
- **Kanban / listado / ficha** — rutas acordadas en 7M.
- **Agenda, mesa de ayuda, socios, empresas** — según módulos habilitados.
- **Reportes base** — estructura modular; contenido sectorial por capa.
- **Constructor y auditoría** — `app/admin/constructor/*`.
- **Configuración base** — rubros, pipelines, estados, roles, usuarios, portal, **IA admin** como infraestructura.

---

## 8. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Borrar **lógica útil** por nombre legacy (`leads87`, `easy`) | Matriz + grep de imports antes de delete |
| Exponer **sectorial** a clientes de otra vertical | Flags por vertical / menú / seeds |
| **Duplicar** features entre leads, leadsok y oportunidades | 7M + esta matriz; una sola canónica |
| Mover componentes sin mapa de **imports** | Fase 7Q grafo de dependencias |
| Romper **dashboards** que importan `leadsOk*` o `LeadsOkDocuments` | Pruebas de regresión al tocar libs |

---

## 9. Recomendación de limpieza

1. **Etiquetar** en backlog / código (comentario de archivo o `CODEOWNERS`) recursos **2** vs **1**.  
2. **No borrar** filas de migración ya aplicadas; valorar **nuevas** migraciones que marquen prompts como `vertical=agency`.  
3. **No mover** carpetas hasta **7Q** (imports).  
4. **Convertir** packs en **presets del Instalador** cuando exista modelo `vertical` en Constructor.  
5. **Activación por vertical** en instalación: agencia → sugerir filas **2** de la matriz; automotriz → excluir.

---

## 10. Próxima fase sugerida (7Q)

Elegir una línea (o combinar en sub-tareas):

- **Fase 7Q — Auditar imports reales de `app/admin/leads87/components`** (`rg` / TS project references / bundle graph).  
- **Fase 7Q — Definir presets sectoriales del Instalador** (contrato JSON: vertical → lista de módulos + seeds).  
- **Fase 7Q — Política de activación por vertical** (documento corto + checklist en Constructor).

---

*Fin del documento — Fase 7P.*
