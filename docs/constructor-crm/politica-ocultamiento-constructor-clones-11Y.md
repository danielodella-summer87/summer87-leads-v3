# Política de Ocultamiento del Constructor en Clones Cliente 11Y — Summer87 CRM

**Versión:** Fase 11Y (política funcional — documental)  
**Relacionado con:** `docs/constructor-crm/modos-constructor-vs-crm-operativo-11X.md`, `docs/constructor-crm/base-madre-duplicable.md`, `docs/constructor-crm/estado-base-madre-post-limpieza-11W.md`, `docs/constructor-crm/ficha-bcr-pickup4x4.md`

**Estado:** política definida. **No implementa** menús, middleware, guards ni cambios en APIs en esta fase.

---

## 2. Resumen ejecutivo

Todo **CRM cliente** derivado de la base madre **summer87-leads-v3** debe operar como **CRM operativo** (`client_crm` en go-live), no como fábrica.

Para **usuarios finales del cliente** (propietario, operativos, staff), el **Constructor**, el **Instalador**, la **BCR** y la evidencia técnica (`package_payload`, snapshots, auditoría pre-SQL) deben quedar **ocultos en UI y bloqueados** por URL y API.

**Summer87** conserva acceso al Constructor en la **base madre** y, cuando corresponda, en clones en **preparación** (`installation_prep`).

---

## 3. Principio principal

> **El cliente usa el CRM operativo; Summer87 usa el Constructor.**

| Actor | Herramienta |
|-------|-------------|
| Cliente final | CRM operativo (leads, oportunidades, agenda, reportes acordados) |
| Summer87 | Constructor + Instalador + BCR + preparación de clon |

Un mismo repositorio puede contener ambos mundos; la **política de entrega** separa quién ve qué.

---

## 4. Modos alcanzados por la política

| Modo | `APP_MODE` conceptual | Constructor para cliente final | Constructor para Summer87 |
|------|----------------------|------------------------------|---------------------------|
| **Base madre** | `constructor_base` | ❌ N/A (no hay cliente final en madre) | ✅ Visible y usable |
| **Preparación clon** | `installation_prep` | ❌ Oculto y bloqueado | ✅ Visible para instalador / Summer87 |
| **CRM cliente productivo** | `client_crm` | ❌ Oculto y bloqueado | ⚙️ Opcional solo rol interno soporte (no mezclar login) |

**Regla:** ningún clon entregado al cliente en producción permanece en `constructor_base`.

---

## 5. Audiencias / roles

| Rol | Organización | Uso típico |
|-----|--------------|------------|
| **Daniel / Summer87** | Summer87 | Diseño, BCR, despliegue, soporte L3 |
| **Instalador interno** | Summer87 | Paquetes, simulación, reunión, checklist |
| **Superadmin técnico** | Summer87 | Setup, auditoría, flags, incidentes |
| **Propietario cliente** | Cliente | CRM operativo, reportes, config acotada |
| **Usuario operativo cliente** | Cliente | Ventas, seguimiento, agenda |
| **Staff / invitado cliente** | Cliente | Módulos asignados, lectura parcial |

---

## 6. Regla de visibilidad por rol

| Rol | Constructor | Paquetes | BCR | CRM operativo | Configuración | Usuarios | Acciones internas | Observación |
|-----|:-----------:|:--------:|:---:|:-------------:|:-------------:|:--------:|:-----------------:|-------------|
| Daniel / Summer87 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Acceso completo en madre/prep |
| Instalador interno | ✅ | ✅ | 🔒 | 🔒 | ⚙️ | ⚙️ | ✅ | Sin BCR write salvo curador |
| Superadmin técnico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Incluye setup/auditoría |
| Propietario cliente | ❌ | ❌ | ❌ | ✅ | 🔒 | 🔒 org | ❌ | Solo su negocio |
| Usuario operativo cliente | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Módulos del contrato |
| Staff / invitado cliente | ❌ | ❌ | ❌ | 🔒 | ❌ | ❌ | ❌ | Permisos mínimos |

Leyenda: ✅ sí | ❌ no | 🔒 limitado | ⚙️ solo Summer87 | Acciones internas = generate, simulate, approve, reject, meeting decisions, reset-db.

---

## 7. Rutas que deben ocultarse al cliente final

Prefijo común: **`/admin/constructor-crm`**. El cliente **no debe** acceder (ni por menú ni por URL directa).

| Ruta | Motivo |
|------|--------|
| `/admin/constructor-crm` | Home fábrica |
| `/admin/constructor-crm/paquetes` | Listado borradores |
| `/admin/constructor-crm/paquetes/[id]` | Detalle, payload, snapshot, reunión |
| `/admin/constructor-crm/auditoria` | Auditoría pre-SQL |
| `/admin/constructor-crm/cuestionario` | Diseño |
| `/admin/constructor-crm/diagnostico` | Diseño |
| `/admin/constructor-crm/documentos` | Evidencia diseño |
| `/admin/constructor-crm/empresa` | Contexto diseño |
| `/admin/constructor-crm/motores-ia` | IA interna Constructor |
| `/admin/constructor-crm/proceso-pipeline` | Pipeline de diseño |
| `/admin/constructor-crm/reportes` | Reportes del flujo Constructor (≠ reportes operativos `/admin/reportes`) |

**Respuesta esperada (futura implementación):** redirect a dashboard operativo, **403**, o 404 — nunca pantalla con datos de paquete.

---

## 8. APIs internas que deben bloquearse al cliente final

Patrón base: **`/api/admin/constructor/*`**

| Área API | Rutas / acciones conceptuales |
|----------|------------------------------|
| Paquete instalable | `/api/admin/constructor/installable-package/generate` |
| Drafts | `.../installable-package/drafts`, `.../drafts/[id]` |
| Aprobación | `.../approve`, `.../reject` |
| Simulación | `.../simulate-preinstall` |
| Snapshots | `.../simulation-snapshots` |
| Reunión | `.../meeting-decisions` |
| Setup Constructor | `/api/admin/constructor/setup` |

**Principio:** **no alcanza con ocultar menú.** Un usuario con sesión válida podría invocar la API con `fetch` o herramientas externas. En `client_crm`, todo path bajo `constructor` debe devolver **403** (o 404) para roles cliente, independientemente del frontend.

**Excepción:** roles Summer87 en `installation_prep` con claim/rol interno explícito.

---

## 9. Elementos de menú a ocultar

En navegación `/admin` (sidebar, módulos-menu, breadcrumbs):

| Ítem de menú | Ocultar en `client_crm` |
|--------------|-------------------------|
| Constructor CRM | ✅ |
| Paquetes instalables | ✅ |
| Auditoría del Constructor | ✅ |
| Diagnóstico / cuestionario Constructor | ✅ |
| Motores IA del Constructor (si distintos de IA operativa) | ✅ |
| Documentos técnicos del Constructor | ✅ |
| BCR / conocimiento por rubro | ✅ |
| Instalación / clonar CRM / reset | ✅ |
| Enlaces cruzados desde leads hacia paquetes | ✅ |

**Mantener visibles** según contrato: Leads, Clientes, Oportunidades, Agenda, Reportes operativos, Mesa de ayuda, Configuración acotada.

---

## 10. Información interna que no debe exponerse

| Categoría | Ejemplos |
|-----------|----------|
| Payload instalable | `package_payload`, `installation_manifest` |
| IDs internos diseño | `target_client_id`, `constructor_id` de prueba |
| Simulación | `installer_package_simulation_snapshots`, readiness score técnico |
| Reuniones | `installer_package_meeting_decisions`, notas internas |
| Bloqueos diseño | `blockedActions`, `installer_decisions`, tenantCreation blocked |
| Blueprint | Fragmentos técnicos no curados para cliente |
| Auditoría | Estado pre-SQL, `crm_setup_config` de fábrica |
| BCR | Fichas, blueprints, confianza, casos semilla |
| IA interna | Prompts de diseño, motores solo Constructor |
| Secretos | API keys, `.env`, credenciales Kore |
| Logs | Stack traces, SQL, trazas de simulate en UI cliente |

**Regla:** si el JSON no es necesario para operar una venta o un lead, **no** va al cliente.

---

## 11. Qué sí puede ver el cliente en modo CRM operativo

Según módulos del paquete aceptado (ej. Pickup 4x4):

| Módulo | Rutas conceptuales |
|--------|-------------------|
| Leads | `/admin/leads`, detalle, kanban si aplica |
| Clientes / empresas | `/admin/clientes`, `/admin/empresas` |
| Oportunidades | `/admin/oportunidades` |
| Pipeline operativo | Etapas en oportunidades/leads (no diseño en Constructor) |
| Agenda / tareas | `/admin/agenda` |
| Reportes operativos | `/admin/reportes`, comercial acordado |
| Postventa | Módulo o etapa operativa si está en paquete |
| Mesa de ayuda | `/admin/mesa-de-ayuda` si contratado |
| Configuración limitada | Usuarios de su org, pipelines operativos, personalización acordada |
| Dashboard | `/admin/dashboard` |

**Integraciones:** Kore u otras solo en modo acordado (ej. read-only); sin pantalla de «diseño de integración» del Instalador.

---

## 12. Diferencia entre ocultar y bloquear

| Mecanismo | Qué hace | Suficiente solo |
|-----------|----------|-----------------|
| **Ocultar** | No mostrar en menú, cards, links | ❌ No |
| **Bloquear** | 403/404 en ruta App Router y API | Requerido |
| **Auditar** | Log de intentos a rutas internas | Recomendado en producción |

**Política Summer87:** siempre **ocultar + bloquear** para roles cliente en `client_crm`.

Orden de implementación futura sugerido: menú → middleware ruta → guard API → tests URL directa.

---

## 13. Política por entorno

| Entorno | Modo | Constructor (cliente) | Constructor (Summer87) |
|---------|------|------------------------|-------------------------|
| **summer87-leads-v3** (madre) | `constructor_base` | N/A | ✅ |
| **Clon preparación** (ej. pre-go-live Pickup) | `installation_prep` | ❌ | ✅ |
| **Clon productivo cliente** | `client_crm` | ❌ oculto + bloqueado | ❌ salvo cuenta soporte separada |
| **Staging demo comercial** | Definir explícito | ❌ si simula producción cliente | ✅ si demo interna Summer87 |
| **Preview branch Supabase** | Etiquetar en banner | Según objetivo del preview |

Banner sugerido en `installation_prep`: *«Entorno de preparación Summer87 — no es producción del cliente»*.

---

## 14. Flags conceptuales de visibilidad

**No se implementan en 11Y.** Referencia para 12A/12B:

| Flag | Valores | Efecto |
|------|---------|--------|
| `APP_MODE` | `constructor_base` \| `installation_prep` \| `client_crm` | Modo global |
| `ENABLE_CONSTRUCTOR` | `true` / `false` | Master switch UI+API Constructor |
| `ENABLE_INSTALLER` | `true` / `false` | Paquetes / simulate |
| `ENABLE_BCR` | `true` / `false` | Curación BCR (futuro UI) |
| `SHOW_INTERNAL_MENUS` | `true` / `false` | Ítems §9 |
| `INTERNAL_ADMIN_EMAILS` | lista allowlist | Bypass solo Summer87 |
| `CLIENT_VISIBLE_MODULES` | JSON lista | Módulos operativos habilitados |

**Clon productivo típico:** `APP_MODE=client_crm`, `ENABLE_CONSTRUCTOR=false`, `SHOW_INTERNAL_MENUS=false`.

---

## 15. Criterios para considerar seguro un clon cliente

Checklist de aceptación (go-live). Marcar todos antes de entregar credenciales al propietario:

- [ ] Menú **Constructor CRM** no visible con rol propietario.
- [ ] URL `/admin/constructor-crm` → bloqueada (403/404) para propietario.
- [ ] URL `/admin/constructor-crm/paquetes` → bloqueada para propietario.
- [ ] `GET/POST` a `/api/admin/constructor/*` → **403** para propietario.
- [ ] Ninguna respuesta de API expone `package_payload` completo al cliente.
- [ ] BCR / docs internos no enlazados desde UI cliente.
- [ ] `reset-db` y scripts destructivos no accesibles desde UI ni docs públicos del clon.
- [ ] Usuario cliente **no** puede generate / simulate / approve / reject paquetes.
- [ ] Módulos operativos acordados cargan sin error.
- [ ] Reportes operativos muestran datos del negocio, no métricas de simulate.
- [ ] Propietario solo ve **su** CRM (branding, `CLIENT_NAME` si aplica).
- [ ] `npm run build` exitoso en configuración del clon.
- [ ] Revisión manual: abrir 3 URLs Constructor con sesión cliente → todas bloqueadas.

---

## 16. Relación con Pickup 4x4

| Tema | Política |
|------|----------|
| **Madre hoy** | Pickup como semilla en `constructor_base`; ficha BCR en repo |
| **Clon `pickup4x4-crm-v1`** | Iniciar `installation_prep` → go-live `client_crm` |
| **Propietarios Pickup** | ❌ Constructor, ❌ Paquetes, ❌ BCR en UI |
| **Daniel / Summer87** | Puede usar Constructor en **madre** o en prep del clon con cuenta interna |
| **Kore** | Read-only hasta validación; sin UI de diseño Kore en cliente |
| **BCR** | Vive en madre/documentación; aprendizaje no editable por cliente |
| **Evidencia draft `0fa4f061…`** | Permanece en madre o se archiva al clonar; **no** obligatoria en clon productivo |

---

## 17. Riesgos si solo se oculta menú

| Riesgo | Escenario |
|--------|-----------|
| Acceso directo por URL | Cliente bookmark `/admin/constructor-crm/paquetes/[id]` |
| Consumo API | Script o DevTools contra `/api/admin/constructor/.../approve` |
| JSON técnico en UI | Error boundary muestra payload |
| Aprobar/rechazar paquetes | Acción destructiva de diseño |
| Confusión operativa | Mezcla etapas de venta con etapas de simulate |
| Pérdida de confianza | «¿Por qué veo borradores y snapshots?» |

---

## 18. Riesgos si no se oculta

| Riesgo | Impacto |
|--------|---------|
| Cliente ve fábrica interna | Producto percibido como inacabado |
| Prototipos = producto final | Expectativas incorrectas |
| Reputación / comercial | Dificultad vender CRM profesional |
| Estrategia Summer87 / BCR expuesta | Ventaja competitiva diluida |
| Soporte | Tickets en flujos que el cliente no debe tocar |
| Compliance | Datos de diseño o integración visibles sin contrato |

---

## 19. Recomendación técnica futura

Implementación por capas (**no confiar solo en frontend**):

| Orden | Capa | Entregable |
|-------|------|------------|
| 1 | Menú / `modulos-menu` por `APP_MODE` | 12B |
| 2 | Middleware o layout guard en `/admin/constructor-crm/*` | 12C |
| 3 | Guard en todas las route handlers `/api/admin/constructor/*` | 12C |
| 4 | Tests e2e o integración: URL directa con sesión cliente → 403 | 12D |
| 5 | Build + validación visual checklist §15 | 12D |

**No eliminar código** del clon en la primera iteración; **bloquear** y luego evaluar tree-shaking o rutas condicionales.

---

## 20. Próximas fases sugeridas

| Fase | Objetivo |
|------|----------|
| **11Z** | Revisión `crm_setup_config` y `leads_pipelines` — ¿solo visibles en `constructor_base`? |
| **12A** | Diseño técnico flags + matriz rol×modo×ruta |
| **12B** | Implementación visibilidad menú por modo |
| **12C** | Bloqueo rutas App Router + APIs constructor |
| **12D** | Validación clon Pickup (u otro) en `client_crm` — checklist §15 |

Secuencia: **11Z → 12A → 12B → 12C → 12D**.

---

## 21. Decisión actual

> **En 11Y solo se documenta la política de ocultamiento.**  
> No se implementan flags, permisos, middleware, menús ni endpoints.

| Campo | Valor |
|-------|--------|
| Política | Ocultar + bloquear Constructor para cliente en clones |
| Implementación | Pendiente 12B–12D |
| Base madre | Sin cambio — Constructor sigue visible para Summer87 |

---

## 22. Confirmación de alcance (fase 11Y)

- ✅ Política funcional de ocultamiento documentada
- ❌ No se ejecutó SQL
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se modificó código funcional
- ❌ No se crearon endpoints
- ❌ No se crearon scripts
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM ni tenant ni usuarios
- ❌ No se tocó Kore ni Zeta
- ❌ No se afirma que guards o flags ya existan en producción

---

*Política 11Y — Ocultamiento del Constructor en clones cliente. Complementa modos 11X; prerequisito de implementación 12B–12D.*
