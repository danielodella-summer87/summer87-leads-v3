# Recursos sectoriales reutilizables — Summer87 Leads v3

**Versión:** Fase 7O (documental)  
**Estado:** guía de preservación y clasificación; actualizar cuando exista inventario técnico cerrado.

---

## 2. Propósito

Durante la limpieza de Summer87 Leads v3 hacia **plantilla madre** (Constructor CRM + Instalador + CRM operativo configurable), **no se debe asumir que todo lo heredado es prescindible**. Parte del material acumulado — prompts, motores IA, reportes, flujos comerciales y catálogos orientados a una **agencia de marketing digital** — puede conservarse como **activo reutilizable** para **instancias sectoriales** futuras.

Este documento **clasifica** ese enfoque y fija criterios para **no eliminar por impulso** lo que puede servir como **pack sectorial** cuando el instalador o el Constructor elijan una vertical concreta. Se alinea con `docs/DECISION_RUTAS_COMERCIALES_7M.md` (rutas canónicas): neutralizar copy **no** implica eliminar motores ni plantillas sectoriales detrás del texto.

---

## 3. Principio rector

> **No todo lo heredado es basura. Algunos recursos son activos reutilizables por vertical.**

La decisión de borrar, archivar o neutralizar copy **no implica** borrar lógica o datos sectoriales valiosos sin **evaluación** y **clasificación** previas.

---

## 4. Categorías

| Categoría | Significado |
|-----------|----------------|
| **Basura / demo eliminable** | Copy “demo”, seeds de prueba, textos de prototipo, duplicados sin valor, datos de ejemplo que no representan un pack sectorial. |
| **Legacy técnico a archivar** | Rutas, carpetas o nombres viejos (`leads87`, redirects) cuya **superficie** se depreca pero cuyo **código** puede extraerse o documentarse antes de borrar. |
| **Recurso sectorial reutilizable** | Motores, prompts, reportes, flujos o catálogos **atados a una vertical** (p. ej. agencia de marketing digital) listos para ofrecerse **solo** cuando esa vertical aplique. |
| **Recurso core del producto** | CRM operativo canónico (`/admin/leads`, Kanban, ficha), RBAC, APIs de leads, configuración neutra — **no son sectoriales** pero son la base de cualquier instancia. |
| **Requiere decisión de Daniel** | Casos límite: mezcla vertical/genérico, coste de mantenimiento alto, o impacto contractual con clientes actuales. |

---

## 5. Plantilla sectorial: Agencia de marketing digital

Pueden tratarse como **recursos reutilizables** para una vertical “**Agencia de marketing digital**” (lista no exhaustiva):

- **Módulos de análisis comercial** orientados a diagnóstico, gaps y oportunidades para cuentas de servicios.
- **Prompts “modo easy”** y variantes estructuradas ligadas a comercialización de servicios intangibles.
- **Motores IA de diagnóstico comercial** y de **propuesta** (incl. flujos que alimentan documentos o export).
- **Reportes de performance** comercial / marketing (pipeline, campañas, seguimiento) cuando el modelo de negocio sea compatible.
- **Catálogo comercial** de ítems/servicios típicos de agencia (precio, esfuerzo, propuesta) — hoy neutralizado en UI genérica pero **reutilizable** como pack.
- **Flujos `leadsok` / `leads87`** en la medida en que aporten **estructura de etapas** (macro/micro), checklists o guías de diagnóstico, aunque la **ruta** no sea canónica.
- **Manual de neuroventas** aplicado a **venta de servicios** y consultoría.
- **Componentes de propuestas / Gamma** si el flujo de presentación y export sigue alineado con venta de proyectos por fases.

**Regla:** estos recursos se empaquetan y **no se mezclan** por defecto con una instancia genérica o con otra vertical (p. ej. automotriz).

---

## 6. Qué NO hacer

- **No** borrar motores IA “de agencia” sin revisión de producto y sin copia/archivo de respaldo conceptual.
- **No** borrar reportes o dashboards comerciales/marketing sin clasificar su encaje vertical.
- **No** eliminar prompts **modo easy** (u homólogos) sin **catalogarlos** y etiquetar vertical.
- **No** borrar componentes o libs bajo `leadsok` / `leads87` si contienen **lógica reusable** (p. ej. `leadsOkMacroFlow` / `leadsOkMicroFlow`) sin migración o archivo documentado.
- **No** mezclar recursos de agencia en una instancia cuya vertical **no** sea agencia (riesgo de confusión y de datos inadecuados).
- **No** exponer recursos sectoriales en UI como si fueran **genéricos** para cualquier cliente; deben activarse por vertical o por decisión del instalador.

---

## 7. Cómo se usarán en el futuro

Cuando el **Constructor** detecte o el **Instalador** elija una **vertical** al crear o configurar una instancia, el sistema podrá **sugerir** packs sectoriales acordes. Ejemplos de verticales:

| Vertical | Enfoque de pack |
|----------|------------------|
| **Agencia de marketing digital** | Motores IA de diagnóstico comercial, reportes de performance de campañas/leads, catálogo de servicios de agencia, flujos de propuesta y análisis comercial, material de neuroventas para servicios. |
| **Educación** | Pipelines de inscripción, comunicación a familias/alumnos; **no** cargar por defecto recursos de agencia. |
| **Automotriz / accesorios** | Pipelines, reportes y campos de **producto / stock / instalación**; **no** cargar recursos de agencia. |
| **Servicios profesionales** | Puede solaparse parcialmente con agencia; requiere **matriz** específica (facturación por hora, mandatos, etc.). |
| **Finanzas / inversión** | Compliance y riesgo; **no** cargar plantillas de agencia sin adaptación explícita. |

**Ejemplo operativo:** si `vertical = Agencia de marketing digital`, el instalador sugiere activar motores IA de diagnóstico, reportes de performance, catálogo sectorial y flujos de propuesta; si `vertical = Automotriz / accesorios`, **no** se ofrecen esos packs y se priorizan otros.

---

## 8. Matriz inicial de recursos

| Recurso | Ubicación probable | Vertical | Acción | Riesgo |
|---------|---------------------|----------|--------|--------|
| **LeadsOk macro/micro flow** | `lib/crm/leadsOkMacroFlow.ts`, `leadsOkMicroFlow.ts`; consumo en dashboard / leadsok | Agencia / servicios profesionales | **Conservar** lógica; ofrecer como pack “recorrido comercial” opcional | Bajo si no se expone como CRM principal |
| **Leads87 components** | `app/admin/leads87/components/*` | Agencia (diagnóstico, propuesta, estrategia) | **Auditar** uso real; archivar o fusionar a ficha canónica según 7M | Medio (código huérfano vs duplicación) |
| **Prompts modo easy** | migraciones / seeds / tablas de prompts (según repo) | Agencia | **Clasificar** y etiquetar; no borrar sin inventario | Alto si se borran en prod sin backup |
| **Reportes comerciales de agencia** | `app/admin/reportes`, APIs asociadas | Agencia / comercial genérico | **Neutralizar copy** en plantilla; conservar queries como plantilla sectorial | Medio si se confunden con “core” |
| **Catálogo comercial (ex servicios agencia)** | `app/admin/configuracion/servicios`, APIs `services` / esfuerzo | Agencia | **Mantener** modelo; activar por vertical | Bajo |
| **AiLeadReport** | `components/leads/AiLeadReport.tsx` | Core + agencia | **Core** reutilizable; perfiles/prompts sectoriales como capa | Medio (tamaño y acoplamientos) |
| **Módulos Gamma / propuesta** | rutas bajo `app/api/admin/leads/.../documents`, UI en ficha | Agencia / proyectos | **Conservar**; empaquetar con vertical “proyectos por fases” | Medio (dependencias externas) |
| **Manual de neuroventas** | `app/admin/neuroventas` | Agencia / venta consultiva | **Conservar** como contenido; opción por cliente | Bajo |
| **Métricas comerciales** | `lib/crm/metrics.ts`, `components/crm/*` | Agencia / comercial | **Conservar**; renombrar campos `leads87*` en UX cuando toque, sin tirar lógica | Medio (naming legacy) |

---

## 9. Política de limpieza

1. **Primero clasificar** (usar las categorías de la sección **4**).  
2. **Después decidir** (producto + riesgo + vertical objetivo).  
3. **Luego mover / archivar / ocultar** (menú, copy, rutas no canónicas).  
4. **Recién al final borrar**, si corresponde y con trazabilidad.  
5. **Nunca** borrar solo por **nombre heredado** (`leads87`, `easy`, `agencia`) si el recurso contiene **lógica o datos de plantilla** valiosos.

---

## 10. Próxima fase sugerida

- **Fase 7P — Auditoría de recursos de agencia reutilizables**  
  Inventario por archivo: qué es core, qué es sectorial agencia, qué es demo, qué está huérfano.

**Alternativa de nombre:** **Fase 7P — Matriz técnica de recursos sectoriales por archivo** (mismo alcance, énfasis en tabla `Recurso → Ruta → Vertical → Acción`).

---

*Fin del documento — Fase 7O.*
