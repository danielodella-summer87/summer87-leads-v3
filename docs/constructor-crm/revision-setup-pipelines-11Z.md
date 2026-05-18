# Revisión Setup y Pipelines 11Z — Base Madre Constructor CRM Summer87

**Versión:** Fase 11Z (revisión funcional — documental)  
**Relacionado con:** `docs/constructor-crm/estado-base-madre-post-limpieza-11W.md`, `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md`, `docs/constructor-crm/politica-ocultamiento-constructor-clones-11Y.md`, `docs/constructor-crm/cierre-limpieza-minima-11V.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`

**Estado:** revisión conceptual. **No modifica** `crm_setup_config` ni `leads_pipelines` en base de datos ni en código.

---

## 2. Resumen ejecutivo

Antes de implementar **flags de modo** (12A), **ocultamiento de menú** (12B) o **guards** (12C), y antes de declarar una **base madre v1** o clonar un CRM cliente, conviene decidir qué representan en el producto:

1. **`crm_setup_config`** — una fila con setup en paso **auditoría** y readiness **15**.  
2. **`leads_pipelines`** — **18** etapas que mezclan lenguaje comercial genérico, posible agencia/consultoría y operación de cotización.

Esta fase **11Z** documenta estado, lectura funcional, riesgos y recomendaciones por modo (`constructor_base`, `installation_prep`, `client_crm`). **No toca datos.**

---

## 3. Contexto

| Hito previo | Implicancia para 11Z |
|-------------|----------------------|
| Limpieza mínima **cerrada** (11V) | Solo `leads` en 0; setup y pipelines **intactos** |
| Modos definidos (**11X**) | Setup/pipelines deben mapearse a cada modo |
| Ocultamiento Constructor (**11Y**) | Setup no visible al cliente en `client_crm` |
| Base madre **no** sigue borrando | Sin DELETE/reset en 11Z |
| Inventario **L1** (2026-05-17) | Fuente de conteos y listado pipelines |
| Ejecución **11T** | `public.leads = 0` (validado); pipelines sin re-conteo SQL post-11T |

**Proyecto:** summer87-leads-v3 — entorno L1: main / PRODUCTION.

---

## 4. Estado actual de `crm_setup_config`

| Campo | Valor (L1) |
|-------|------------|
| **Filas** | **1** |
| **id** | `bb0804fd-cc6a-44ab-8969-2b94cdaad984` |
| **status** | `setup` |
| **current_step** | `auditoria` |
| **readiness_score** | **15** |
| **created_at** | ~2026-05-06 |
| **updated_at** | ~2026-05-11 |

| Aspecto | Lectura |
|---------|---------|
| Modificada en limpieza 11T | **No** |
| Clasificación L2/L3 | Revisar / decidir reset funcional **futuro** |
| Rol en producto | Estado del **flujo de configuración del Constructor** en la base madre (API `/api/admin/constructor/setup`) |

> No se re-ejecutó SELECT en 11Z; datos según inventario L1 y ciclo post-11T.

---

## 5. Lectura funcional de `crm_setup_config`

| Opción | Interpretación | Probabilidad / nota |
|--------|----------------|---------------------|
| **A** | Onboarding de la **base madre** (wizard Constructor incompleto) | Alta — score bajo, step auditoría |
| **B** | Estado de un **flujo Constructor** dejado a medias tras pruebas Pickup / 8x | Alta |
| **C** | **Configuración inicial reusable** para futuros clones | Media — requiere diseño por `APP_MODE` |
| **D** | **Ruido/prototipo** a resetear antes de `mother-v1` | Media — solo si se define virgen estricta |

**Campos conceptuales típicos (sin afirmar esquema completo):** paso actual del wizard, score de readiness, bloqueos para avanzar a piloto — alineado con flujo auditoría pre-SQL documentado en Pickup.

---

## 6. Recomendación sobre `crm_setup_config`

| Decisión 11Z | Detalle |
|--------------|---------|
| **Borrar o resetear ahora** | **No** |
| **Corto plazo** | **Conservar** la fila; documentar como pendiente |

**Antes de reset o migración, decidir:**

| Pregunta | Opciones |
|----------|----------|
| ¿Vive solo en **madre**? | Sí en `constructor_base`; clon con fila propia o vacía |
| ¿Es **reusable** como plantilla? | Copiar estado inicial al clon en `installation_prep` |
| ¿Por **cliente/clon**? | Una fila `crm_setup_config` por despliegue cliente |
| ¿Ligado a **APP_MODE**? | Ignorar o ocultar en `client_crm`; activo en `constructor_base` |
| ¿Fase técnica? | **12A+** — flags; posible **12E** setup por modo |

**Recomendación:** tratar como **estado interno de fábrica** de la madre, **no** como configuración que el cliente final deba ver ni heredar tal cual en go-live.

---

## 7. Estado actual de `leads_pipelines`

| Métrica | Valor |
|---------|--------|
| **Total filas** | **18** (L1) |
| Modificadas en 11T | **No** |
| Uso en codebase | API `/api/admin/leads/pipelines`, kanban `/admin/leads/kanban`, política estados en `lib/leads/leadStatusPolicy.ts` |

### Listado completo (L1)

| # | nombre | tipo |
|---|--------|------|
| 1 | Contrato | normal |
| 2 | Costeo | normal |
| 3 | Cotización | normal |
| 4 | Evaluación | normal |
| 5 | Nuevo | normal |
| 6 | Presentación | normal |
| 7 | Propuesta | normal |
| 8 | Servicios | normal |
| 9 | Visita | normal |
| 10 | Contacto iniciado | normal |
| 11 | Diagnóstico comercial | normal |
| 12 | Ganado | **ganado** |
| 13 | Investigación inicial | normal |
| 14 | Negociación | normal |
| 15 | Nuevo lead | normal |
| 16 | Perdido | **perdido** |
| 17 | Propuesta enviada | normal |
| 18 | Reunión agendada | normal |

**Observación:** mezcla de nombres en español operativo; posible superposición **Nuevo** vs **Nuevo lead**; terminales **Ganado** / **Perdido** alineados con política de leads.

---

## 8. Lectura funcional de pipelines (clasificación preliminar)

| Grupo | Etapas | Hipótesis de origen |
|-------|--------|---------------------|
| **Pipeline comercial general / reusable** | Nuevo, Nuevo lead, Contacto iniciado, Diagnóstico comercial, Propuesta enviada, Negociación, Ganado, Perdido | Plantilla CRM genérica |
| **Posible agencia / consultoría** | Investigación inicial, Presentación, Propuesta, Servicios | Flujo proyectos / servicios profesionales |
| **Operativo / cotización / proyecto** | Cotización, Costeo, Evaluación, Contrato, Visita | Venta consultiva con entregables |
| **Categoría dudosa** | Evaluación, Servicios, Nuevo vs Nuevo lead | Revisar por rubro y por cliente antes de clon |

**No es basura automática:** pueden ser activos en kanban si un lead referenciara etapa (hoy **0 leads** tras 11T).

---

## 9. Pregunta central sobre pipelines

| Pregunta | Respuesta 11Z (pendiente de producto) |
|----------|--------------------------------------|
| ¿Los 18 viven en la **base madre** como catálogo global? | **Hoy sí** en BD; ¿debe seguir? — **decidir** |
| ¿Plantillas por **rubro** (BCR/preset)? | Alineado con `pipeline_config` en `package_payload` (ej. Pickup 9 etapas ≠ estos 18) |
| ¿Clon **vacío** hasta instalar desde paquete? | Opción **F** (§16) — evita heredar agencia en cliente 4x4 |
| ¿Parte del **CRM operativo base**? | Solo subconjunto activo en `client_crm`; resto oculto o no cargado |

**Tensión detectada:** pipeline del **preset Pickup** (Constructor) vs **18 filas** en `leads_pipelines` (módulo leads operativo) — **no están unificados** en esta revisión documental.

---

## 10. Recomendación sobre pipelines

| Decisión 11Z | Detalle |
|--------------|---------|
| **Borrar ahora** | **No** |
| **Asumir basura** | **No** |
| **Etiqueta** | «Catálogo operativo base **pendiente de curaduría**» |

**Antes de un clon cliente, decidir:**

1. **Pipeline por rubro** — desde BCR / preset (ej. 4x4).  
2. **Pipeline operativo inicial** — subconjunto mínimo en clon.  
3. **Pipeline específico del cliente** — post-instalación desde `package_payload`.  
4. **Pipelines no usados** — ocultar, archivar, no copiar al clon, o tabla `pipeline_templates` futura.

**Coherencia con leads = 0:** se puede curar catálogo en madre sin impacto usuario hasta que existan leads de nuevo.

---

## 11. Relación con modo `constructor_base`

| Recurso | Rol en madre (`constructor_base`) |
|---------|-----------------------------------|
| **crm_setup_config** | Refleja **avance interno** del wizard Constructor / auditoría en summer87-leads-v3 |
| **leads_pipelines** | **Catálogo editable** de referencia; material para diseño y `/admin/configuracion/pipelines` |
| **Constructor** | Puede contrastar `pipeline_config` del draft con catálogo operativo |
| **Cliente final** | **No aplica** en madre como usuario principal |

Visible para Summer87 en rutas de configuración y Constructor; no es entregable al cliente sin filtrar.

---

## 12. Relación con modo `installation_prep`

| Recurso | Rol en preparación de clon |
|---------|---------------------------|
| **crm_setup_config** | Puede indicar **avance de preparación** del clon (checklist Summer87) o copia desde madre — **definir** |
| **leads_pipelines** | **Revisar y adaptar** antes de go-live: ¿coinciden con paquete aceptado? |
| **Acciones Summer87** | Limpiar etapas que no aplican; alinear con `package_payload` |
| **Validación** | Comparar etapas Pickup (9) vs 18 heredadas |

Bloqueado para usuarios finales del cliente hasta corte a `client_crm`.

---

## 13. Relación con modo `client_crm`

| Recurso | Política objetivo |
|---------|-------------------|
| **crm_setup_config** | **No visible** al cliente; no mostrar readiness ni step auditoría en UI |
| **leads_pipelines** | Cliente ve solo **pipeline activo** del negocio (kanban, estados en leads) |
| **Catálogo completo 18** | **No** exponer como «catálogo interno»; solo etapas habilitadas |
| **Etapas no usadas** | No cargar, ocultar en config admin cliente, o no copiar al clon |

En go-live, un clon Pickup no debería mostrar etapas tipo «Investigación inicial» / «Servicios» si el paquete no las incluye.

---

## 14. Reglas antes de declarar base madre v1

Checklist documental (sin ejecutar en 11Z):

- [ ] **Destino de `crm_setup_config`** decidido (madre only vs. por clon vs. reset virgen).
- [ ] **Pipelines:** ¿catálogo global, plantilla BCR, dato solo cliente, o híbrido?
- [ ] **Pipeline base para clon vacío** definido (vacío vs. preset vs. subset).
- [ ] **Política pipelines no usados** en clon (no copiar / archivar / ocultar).
- [ ] **Política por modo** alineada con 11X y 11Y.
- [ ] **No limpiar** pipelines ni setup sin backup + decisión explícita (hereda 11V).
- [ ] Validar que decisiones **no rompen** `/admin/leads` (kanban) ni Constructor (diseño separado).
- [ ] Tag `mother-v1` solo tras cerrar ítems anteriores.

---

## 15. Riesgos si se ignora

| Riesgo | Consecuencia |
|--------|--------------|
| Clonar con **pipeline incorrecto** | Cliente 4x4 con etapas de consultoría/agencia |
| Cliente ve etapas **irrelevantes** | Confusión kanban y reportes |
| **setup en auditoría** en clon operativo | Pantalla interna o score bajo expuesto por error |
| Mezcla **config madre vs. cliente** | Soporte y datos inconsistentes |
| **BCR / preset** desalineados de `leads_pipelines` | Dos verdades de pipeline |
| Venta de CRM con **herencia no curada** | Percepción de producto genérico o roto |

---

## 16. Opciones de tratamiento futuro

| Opción | Descripción | Cuándo |
|--------|-------------|--------|
| **A** | Conservar ambos **como están** hasta **12A** (flags) | ✅ Recomendado corto plazo |
| **B** | Pipelines como **catálogo global interno** en madre | Curación manual Summer87 |
| **C** | Mover a **plantillas BCR por rubro** | Alineado con BCR F2+ |
| **D** | **Reset setup** en clones, no en madre | `installation_prep` → fila limpia por clon |
| **E** | Migración futura: `pipeline_templates` vs `pipelines` operativos | Separación esquema |
| **F** | Clon con **pipeline vacío** hasta aplicar `package_payload` | Máxima seguridad pre-go-live |

**No son excluyentes a largo plazo:** E + C + D es una arquitectura objetivo razonable; F es táctica para primer clon.

---

## 17. Recomendación final

| Horizonte | Acción |
|-----------|--------|
| **Inmediato (11Z)** | **Conservar** `crm_setup_config` (1 fila) y `leads_pipelines` (18 filas) **sin cambios** |
| **Producto** | Tratar ambos como **pendientes de decisión de modo**, no como bloqueantes de documentación 11X/11Y |
| **Orden sugerido** | **12A** (flags) → **12B/C** (ocultamiento) → **12E** (pipelines/templates) → revisitar setup reset |
| **Limpieza** | **No** reset ni DELETE de setup/pipelines en esta fase |

**Declaración base madre v1:** **posponer** hasta cerrar checklist §14 y al menos decisión pipeline para clon Pickup.

---

## 18. Próximas fases sugeridas

| Fase | Objetivo |
|------|----------|
| **12A** | Diseño técnico flags (`APP_MODE`, `ENABLE_*`) |
| **12B** | Menú por modo |
| **12C** | Bloqueo rutas/API Constructor |
| **12D** | Validación `client_crm` (checklist 11Y §15) |
| **12E** | Revisión técnica pipelines vs. `package_payload` / templates |

Secuencia: **12A → 12B → 12C → 12D**; **12E** en paralelo o justo antes del primer clon.

---

## 19. Decisión actual

> **En 11Z no se modifica `crm_setup_config` ni `leads_pipelines`.**  
> Ambos quedan **conservados** y **pendientes de decisión técnica de modo** y de curaduría de catálogo.

| Recurso | Acción 11Z |
|---------|------------|
| `crm_setup_config` | Conservar; clasificar como interno Constructor madre |
| `leads_pipelines` | Conservar; curaduría pendiente; no borrar |
| SQL / reset | Ninguno |

---

## 20. Confirmación de alcance (fase 11Z)

- ✅ Revisión funcional setup y pipelines documentada
- ❌ No se ejecutó SQL
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se modificó código funcional
- ❌ No se crearon endpoints ni scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se inventaron revalidaciones SQL post-11T

---

*Revisión 11Z — Setup y pipelines pendientes de arquitectura por modo. Sin cambios en BD; input para 12A y 12E.*
