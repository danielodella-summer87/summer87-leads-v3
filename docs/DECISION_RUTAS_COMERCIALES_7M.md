# Decisión de producto — Rutas comerciales Summer87 Leads v3

**Versión:** Fase 7M (documental)  
**Estado:** vigente como referencia de arquitectura de producto; revisar al cerrar decisiones pendientes.

---

## 2. Propósito

Este documento fija la **decisión de producto** sobre las rutas comerciales del admin para que Summer87 Leads v3 pueda evolucionar como **Constructor CRM + Instalador + CRM operativo configurable por cliente**, sin duplicar superficies ni confundir al usuario final.

El objetivo es **definir una ruta comercial canónica** y clasificar el rol de rutas paralelas o legacy:

- `/admin/leads` y subrutas (operativo)
- `/admin/leads87` (legacy con redirect)
- `/admin/leadsok` (recorrido guiado / laboratorio útil)
- `/admin/oportunidades` (módulo paralelo en revisión)

Las fases **7H** (auditoría), **7I** (links internos hacia canónica), **7L** (copy en leadsok) y el trabajo previo sobre menú y redirects informan esta decisión; **7M** solo la documenta.

**Referencias:** `docs/AUDITORIA_LIMPIEZA_7B.md`, `docs/AUDITORIA_LEADS87_FINAL.md` (y demás informes en `docs/`), más los tags/commits de **7I** y **7L** en el repositorio.

---

## 3. Decisión principal

La **ruta canónica comercial del CRM operativo** será:

| Superficie | Ruta |
|------------|------|
| Listado comercial | `/admin/leads` |
| Vista Kanban operativa | `/admin/leads/kanban` |
| Alta manual | `/admin/leads/nuevo` |
| Ficha de lead | `/admin/leads/[id]` |

Toda comunicación de producto, onboarding de cliente y enlaces **nuevos** del CRM comercial deben alinearse con estas rutas.

---

## 4. Estado de cada ruta

| Ruta | Estado futuro | Uso permitido | Cliente final | Acción |
|------|----------------|---------------|-----------------|--------|
| `/admin/leads` | **Canónica** | CRM operativo: listado, filtros, operaciones acordadas al rol | Sí (según permisos) | Mantener y priorizar evolución |
| `/admin/leads/kanban` | **Canónica** | Kanban operativo sobre pipelines configurados | Sí (según permisos) | Mantener; alinear con modelo por cliente |
| `/admin/leads/nuevo` | **Canónica** | Alta manual de lead | Sí (según permisos) | Mantener |
| `/admin/leads/[id]` | **Canónica** | Ficha única del lead | Sí (según permisos) | Mantener; eventual fusión de UX desde leadsok |
| `/admin/leads87` | **Legacy — redirect temporal** | Compatibilidad URL / bookmarks | No como destino de enlaces nuevos | Mantener redirect; no promover |
| `/admin/leads87/[id]` | **Legacy — redirect temporal** | Idem hacia `/admin/leads/[id]` | No como destino de enlaces nuevos | Mantener redirect; no promover |
| `/admin/leadsok` | **Interna / recorrido guiado** | Laboratorio útil, checklist macro/micro, no CRM principal | No como CRM operativo por defecto; URL directa o rol interno | No menú cliente; copy ya neutralizado (7L) |
| `/admin/oportunidades` | **Paralelo en revisión** | Vista cartera/kanban alternativa; decisión de producto pendiente | No promover hasta decisión | No reemplazar Kanban canónico |
| `/admin/oportunidades/[id]` | **Paralelo en revisión** | Workspace asociado al listado de oportunidades | Idem | Integrar o aislar según decisión futura |

---

## 5. Política de navegación

1. **Todo nuevo enlace comercial** debe apuntar a `/admin/leads` o a sus subrutas (`/kanban`, `/nuevo`, `/[id]`, importar, etc.).
2. **No crear nuevos enlaces** hacia `/admin/leads87` ni `/admin/leads87/[id]` salvo necesidad excepcional documentada (p. ej. compatibilidad externa); preferir siempre la ruta canónica.
3. **No usar `/admin/leadsok`** como destino principal del flujo comercial del cliente ni como entrada desde el menú lateral estándar; mantenerlo como **herramienta de recorrido / interna**.
4. **No usar `/admin/oportunidades`** como reemplazo del Kanban oficial (`/admin/leads/kanban`) hasta una **decisión explícita** de producto (fusión, deprecación o módulo reservado a roles específicos).
5. **Mantener redirects legacy** (`leads87` → `leads`) mientras exista riesgo de bookmarks, enlaces externos o material de capacitación antiguo.

---

## 6. Qué se conserva

- **Redirects** bajo `/admin/leads87` y `/admin/leads87/[id]` por compatibilidad.
- **Funciones y tipos útiles** de macro/micro flujo asociados a leadsok (`lib/crm/leadsOkMacroFlow`, `leadsOkMicroFlow`) y su reutilización en dashboard u otros consumidores.
- **Aprendizajes y código de oportunidades** mientras se define integración con Leads o rol de módulo separado.
- **Documentación histórica** en `docs/` (auditorías 7B, LEADS87, etc.) como contexto; este documento no las invalida, las contextualiza.

---

## 7. Qué se evita

- **Duplicar nuevas features** en la superficie `leads87` (carpeta de componentes o rutas) como si fuera producto cliente.
- **Crear nuevos componentes “finales”** exclusivamente para `leadsok` sin plan de convergencia hacia la ficha canónica.
- **Abrir nuevos flujos paralelos** en oportunidades sin decisión de producto y sin alineación con permisos y menú.
- **Enlazar desde Empresas o desde la ficha de Leads** hacia rutas legacy (`leads87`); los enlaces internos deben seguir la política de la fase **7I** (canónica).

---

## 8. Próximas decisiones pendientes

1. **¿LeadsOk** se mantiene solo como herramienta interna Summer87, se restringe por rol, o eventualmente se **redirige** a `/admin/leads` con query de “modo recorrido”?
2. **¿El progreso comercial guiado** (macro/micro) se **fusiona** en `/admin/leads/[id]` como panel compacto o tour?
3. **¿Oportunidades** se fusiona con Leads (un solo modelo de cartera), se mantiene como **módulo estratégico** para ciertos roles, o se depreca tras paridad de KPIs?
4. **¿Cuándo se archiva o elimina** `app/admin/leads87/components` si queda **huérfano** de rutas que lo monten?
5. **¿Cuándo se bloquean** rutas legacy u opcionales **por rol** (cliente vs instalador vs Summer87)?

---

## 9. Plan por fases (propuesta)

| Fase | Objetivo |
|------|----------|
| **7N** | Alinear breadcrumb en `AdminShell` para `/admin/leadsok` con el nombre de producto acordado (p. ej. “Recorrido comercial guiado”) en lugar de residuos de laboratorio. |
| **7O** | Auditar **componentes huérfanos** en `app/admin/leads87/components`: imports, uso real, plan de archivo o reenganche a ficha canónica. |
| **7P** | **Documentar o integrar** el progreso comercial guiado en `/admin/leads/[id]` (spike UX + reutilización de `lib/crm/leadsOk*`). |
| **7Q** | **Decidir futuro** de `/admin/oportunidades`: fusión, rol-only, ocultación en menú, o paridad documentada con Kanban. |
| **7R** | **Ocultar o redirect** legacy cuando el riesgo de bookmarks sea bajo y exista comunicación / release notes. |

*(Los identificadores 7N–7R son propuesta de roadmap; ajustar numeración si el equipo ya reservó otros IDs.)*

---

## 10. Criterios de aceptación

- Ningún **enlace nuevo** en código de producto debe apuntar a `/admin/leads87` o `/admin/leads87/[id]`.
- La **navegación principal** del CRM comercial debe usar `/admin/leads` (y subrutas canónicas).
- La **ficha oficial** del lead es `/admin/leads/[id]`.
- El **Kanban oficial** es `/admin/leads/kanban`.
- **LeadsOk** puede existir como recorrido guiado, pero **no** como CRM operativo principal ni como primera impresión del producto para cliente final.
- **Oportunidades** no debe **competir** con Leads en menú o narrativa sin una **decisión explícita** documentada y comunicada.

---

*Fin del documento — Fase 7M.*
