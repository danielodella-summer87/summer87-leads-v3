# Auditoría de limpieza controlada — Summer87 Leads v3

## 2. Propósito

Summer87 Leads v3 se trata como producto compuesto por cuatro capas operativas:

1. **Constructor CRM** — diseño de modelo, pipeline, motores IA, reportes y reglas a partir del negocio del cliente.
2. **Auditoría CRM** — validación de preparación antes de materializar o activar instancias.
3. **Instalador CRM** — aplicación futura del diseño validado a una instancia operativa (fuera del alcance de este documento).
4. **CRM operativo configurable** — leads, Kanban, agenda, reportes y módulos que ve el cliente final según permisos.

Además, el repositorio y la configuración base deben poder usarse como **plantilla madre** para nuevas instancias cliente: identidad neutra, sin datos de terceros ni residuos de prototipos mezclados con el producto final.

La **limpieza** descrita en este informe es **controlada**: no implica borrar datos en producción sin revisión, backup y acuerdo explícito; prioriza clasificación, política y fases incrementales.

---

## 3. Resumen ejecutivo

Hallazgos principales de la auditoría de solo lectura (Fase 7B):

- **Rutas comerciales paralelas** coexisten sin jerarquía única declarada en producto:
  - `/admin/leads` (lista, Kanban, ficha, altas)
  - `/admin/leads87` (flujo macro/micro consolidado en código y documentación)
  - `/admin/leadsok` (variante con enfoque de prueba / “lead de prueba”)
  - `/admin/oportunidades` (cartera y workspace relacionado)

- **Textos heredados** aparecen en UI, comentarios, constantes y documentación, entre otros:
  - **LEADS87** (flujo comercial, comentarios en API, `AiLeadReport`, métricas, migraciones comentadas)
  - **Casalimpia** (bloques de campos en API, copy en ficha de lead, migraciones SQL sectoriales)
  - **demo**, **prueba**, **mock**, **prototipo** (reportes marcados como demo, Constructor con IA mock, seeds `minimal-seed`, copy de configuración)

- **Seeds y scripts** no son neutrales para una plantilla madre “vacía”: insertan rubros, prompts, perfiles y servicios con nombres demo; bootstraps SQL fijan nombre de suite/módulo.

- **Migraciones** mezclan esquema con **datos sectoriales o históricos** (p. ej. Casalimpia, modo easy, seeds RBAC) y existen **dos árboles** habituales en el repo (`migrations/` numeradas y `supabase/migrations/` con prefijos de fecha), lo que aumenta el riesgo de confusión sobre qué aplica cada despliegue.

- **Riesgo de producto**: mezclar **CRM operativo** con **prototipos** (LeadsOK, duplicación con LEADS87) y con **copy no neutral** debilita la narrativa “una instancia = un cliente” y complica el onboarding del instalador.

- **Referencias a marcas de ejemplo** (Pickup, Nike, NobleLux, etc.): **no se detectaron** en el código del repositorio en la pasada de búsqueda; podrían existir solo en datos de base o nombres de leads de prueba fuera del repo.

---

## 4. Principio de limpieza

Reglas que gobiernan cualquier acción posterior:

| Regla | Detalle |
|-------|---------|
| No borrar datos reales sin backup | Snapshot o export acordado antes de DELETE/TRUNCATE. |
| No ejecutar SQL destructivo sin revisión manual | Scripts revisados por persona responsable; idempotencia donde aplique. |
| No eliminar rutas sin reemplazo | Redirección, menú o comunicación al usuario; evitar 404 en flujos activos. |
| No romper trazabilidad de migraciones ya aplicadas | No borrar archivos de migración ya corridas en prod; nuevas migraciones corrigen o anulan comportamiento. |
| Separar esquema de datos demo | Migraciones “solo DDL” vs seeds opcionales por entorno o script explícito. |
| Separar Constructor del CRM cliente | Constructor y Auditoría: privados Summer87 / roles elevados; cliente solo CRM operativo acordado. |
| Eliminar u ocultar residuos por fases | L1 documentación → L2 copy → L3 menú → L4 rutas → L5 seeds → L6 datos → L7 validación plantilla. |

---

## 5. Matriz de rutas

| Ruta / área | Estado actual | Rol futuro | Visibilidad cliente | Acción recomendada | Riesgo |
|-------------|---------------|------------|---------------------|-------------------|--------|
| `/admin/constructor/*` | Activo, multi-paso | Constructor CRM | No | Mantener; proteger por rol (solo Summer87 / instalador / superadmin) | Bajo si RBAC coherente |
| `/admin/leads` | Listado operativo | CRM operativo | Sí (según rol) | Mantener y estabilizar como candidato a ruta única comercial | Medio hasta decidir paridad con leads87 |
| `/admin/leads/kanban` | Kanban operativo | CRM operativo | Sí (según rol) | Mantener; alinear con pipeline definitivo por cliente | Medio |
| `/admin/leads/nuevo` | Alta de lead | CRM operativo | Sí (según rol) | Mantener; revisar duplicidad con `/admin/leads/nueva` | Bajo–medio |
| `/admin/leads/[id]` | Ficha lead | CRM operativo | Sí (según rol) | Mantener; neutralizar copy heredado en fases posteriores | Medio (copy + deep links a leads87) |
| `/admin/leads87` | Listado / flujo LEADS87 | Legado o módulo a fusionar | No hasta decisión | Revisar: deprecar, fusionar con leads o mantener solo interno | Alto (doble mantenimiento) |
| `/admin/leadsok` | Prototipo / “lead de prueba” | Prototipo | No | Ocultar en menú cliente; deprecar o eliminar cuando haya reemplazo | Medio |
| `/admin/oportunidades` | Cartera alternativa | Evaluar vs Leads | Según modelo | Decidir integración con ficha única o mantener nicho | Alto si queda indefinido |
| `/admin/reportes` | Incluye bloques demo | CRM operativo / reporting | Parcial | Sustituir demo por placeholders o “sin conexión” en plantilla | Bajo |
| `/admin/ia` | Configuración IA | Operativo / admin | Típicamente admin | Mantener; seeds demo solo dev u opcionales | Medio |
| `/admin/mesa-de-ayuda` | Soporte | Operativo | Sí según rol | Mantener | Bajo |
| `/admin/neuroventas` | Manual / capacitación | Contenido | Sí según producto | Mantener; opcional por cliente | Bajo |
| `/admin/configuracion` | Ajustes globales | Admin / instalador | No para rol comercial típico | Mantener; restringir; no mezclar seeds prod con demo | Alto si `minimal-seed` en prod |
| `/admin/empresas` | Iniciativas / entidades | CRM operativo | Sí según rol | Mantener | Bajo |
| `/admin/socios` | Clientes / socios | CRM operativo | Sí según rol | Mantener | Bajo |

---

## 6. Matriz de limpieza

| Elemento | Tipo | Ejemplos | Acción | Prioridad | Requiere SQL |
|----------|------|----------|--------|-----------|---------------|
| Textos Casalimpia | Copy + nombre constante API | `CASALIMPIA_LEAD_FIELDS`, UI “Flujo Casalimpia” | Renombrar constantes (solo código) y neutralizar copy visible | L2 | No |
| Textos LEADS87 | Copy + docs + comentarios | `app/admin/leads/[id]/page.tsx`, `lib/crm/*`, `docs/AUDITORIA_LEADS87_FINAL.md` | Neutralizar UI; archivar o actualizar docs; decisión de ruta única | L2–L4 | No |
| Reportes demo | UI | `ReportesClient` títulos “(demo)” | Etiquetas neutras o “plantilla sin datos” | L2 | No |
| minimal-seed | API + datos | `app/api/admin/setup/minimal-seed/route.ts` | Restringir a dev; documentar; o seed “vacío” | L5 | Sí (al ejecutarse) |
| bootstrap_new_instance_consolidated.sql | Script SQL | `supabase/scripts/` | Parametrizar nombres; documentar obligatoriedad | L5 | Sí (al aplicar) |
| bootstrapp nueva instancia.sql | Artefacto raíz | Archivo con typo en nombre | Unificar con script canónico o archivar | L1 | Depende |
| Migraciones Casalimpia | SQL sectorial | `supabase/migrations/*casalimpia*` | No aplicar en plantilla cliente; opcional por industria | L5–L6 | Sí |
| Leads de prueba | Datos | BD / nombres “prueba” | DELETE selectivo con backup | L6 | Sí |
| Pipelines de prueba | Datos + config | Tablas pipelines / seeds | Reset o seed mínimo neutro por instancia | L6 | Sí |
| Motores IA demo | Datos + migraciones | modo easy, prompts estructurados | Separar “pack demo” opcional | L5–L6 | Sí |
| Prompts modo easy/demo | Migraciones numeradas | `migrations/05*_modo_easy*` | Marcar como no aplicables a plantilla limpia o mover a pack opcional | L5 | Sí (si se reaplica) |
| Documentación legacy | Docs | `AUDITORIA_LEADS87_FINAL.md` | Mover a `docs/legacy` o añadir disclaimer vigencia | L1 | No |
| Rutas leadsok / leads87 | Código + menú | `lib/admin/adminSidebarModules.ts`, páginas | Ocultar por rol; luego deprecar o fusionar | L3–L4 | No |

---

## 7. Plan de limpieza por fases

| Fase | Nombre | Contenido |
|------|--------|-----------|
| **L1** | Documentación y política | Este documento, glosario de rutas, criterio “plantilla madre”, owners por decisión. |
| **L2** | Copy visible y etiquetas heredadas | Sustituir LEADS87/Casalimpia en UI cliente-visible; demo → neutro sin cambiar lógica. |
| **L3** | Menú y visibilidad por rol | Ocultar Constructor, leads87, leadsok a roles cliente; feature flags si aplica. |
| **L4** | Consolidación de rutas comerciales | Una ruta canónica o redirecciones claras; eliminar duplicación de flujos. |
| **L5** | Seeds y scripts de nueva instancia | Bootstrap mínimo neutro; `minimal-seed` solo dev; scripts documentados. |
| **L6** | Limpieza de datos con SQL manual | Backup, scripts revisados, entornos no prod primero. |
| **L7** | Validación de plantilla madre limpia | Checklist: sin leads demo, sin copy heredado, menú acorde, build y smoke test. |

---

## 8. Política de plantilla madre

Una **instancia limpia** orientada a plantilla madre **debería** incluir:

- Constructor completo y Auditoría accesibles solo para roles Summer87 / instalador.
- Placeholder o ruta futura para Instalador (sin activar CRM real hasta política definida).
- CRM operativo base: leads, Kanban, ficha, empresas, configuración mínima de pipelines según modelo neutro.
- Módulos base acordados (agenda, mesa de ayuda, etc.) según contrato de producto.
- Roles base mínimos (admin, comercial, operador, viewer o el set definido por negocio).
- Configuración neutra: nombres de suite/módulo parametrizables o genéricos hasta branding del cliente.

**No** debería incluir por defecto:

- Leads precargados ni empresas de clientes anteriores.
- Pipeline específico de un cliente histórico.
- Motores IA o reportes “finales” de un cliente concreto.
- Textos Casalimpia / LEADS87 visibles al usuario final.
- Datos demo **salvo** que estén claramente acotados a entorno **dev** u opción explícita “cargar demo” desactivada en plantilla prod.

---

## 9. Decisiones pendientes para Daniel

1. ¿`/admin/leads` será la **ruta comercial única** frente a leads87?
2. ¿**leads87** se archiva, se fusiona en leads o se mantiene solo para Summer87 interno?
3. ¿**leadsok** se elimina del menú y del código o solo se oculta hasta deprecación?
4. ¿**Oportunidades** queda como módulo separado o se integra en la ficha / lista de leads?
5. ¿**minimal-seed** queda restringido a desarrollo / staging o se elimina de ambientes productivos?
6. ¿**Supabase** por cliente (proyecto dedicado) vs multi-tenant en un solo proyecto a futuro?
7. ¿Qué **datos demo** (si alguno) son aceptables en una instancia nueva y bajo qué nombre/flag?

---

## 10. Próxima fase recomendada

Dos opciones coherentes con el plan L2–L3:

- **Fase 7D — Política de visibilidad por rol**  
  Ocultar Constructor y rutas legacy (leads87, leadsok, oportunidades si aplica) al rol **cliente** o comercial estándar, sin eliminar código todavía.

- **Fase 7D (alternativa previa) — Neutralizar copy heredado visible**  
  Cambiar solo strings en UI (Casalimpia, LEADS87, demo) **sin** tocar lógica ni contratos API; menor riesgo, prepara narrativa unificada.

La elección depende de si la prioridad es **percepción de producto** (copy primero) o **superficie expuesta** (menú y permisos primero).

**Referencias de contexto:** Fase **7A** (“Arquitectura de instalación” en `app/admin/constructor/auditoria/page.tsx`). Fase **7A-fix** (breadcrumb navegable: `components/constructor/ConstructorStepsBreadcrumb.tsx` y páginas bajo `app/admin/constructor/`). Este archivo formaliza la auditoría **7B** y la política de plantilla madre; las acciones L1–L7 se ejecutan en fases posteriores con PRs y revisiones explícitas.

---

*Documento generado como Fase 7C — versión controlada. No sustituye revisión legal/comercial ni runbooks de base de datos.*
