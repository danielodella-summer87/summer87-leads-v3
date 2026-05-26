# Casa Limpia Ecuador checklist Go-No Go preclon CL-0f

## 1. Resumen ejecutivo

- `CL-0f` consolida el estado previo al clon.
- No crea carpetas, no toca código, no toca Supabase ni Vercel.
- Evalúa si Casa Limpia puede pasar a una futura fase `CL-1a`.
- **Dictamen final:** `GO condicional`.

## 2. Estado de fases previas

| fase | documento | estado | aporte | pendiente |
|------|-----------|--------|--------|-----------|
| `CL-0a` | `docs/constructor-crm/casalimpia-ecuador-estrategia-instancia-limpia-CL-0a.md` | Cerrada | fija estrategia de instancia limpia y separación de infraestructura | ninguna a este nivel |
| `CL-0b` | `docs/constructor-crm/casalimpia-ecuador-auditoria-readonly-CL-0b.md` | Cerrada | audita qué sirve para Casa Limpia y qué no debe pasar al clon | convertir hallazgos en decisiones operativas |
| `CL-0c` | `docs/constructor-crm/casalimpia-ecuador-contrato-crm-CL-0c.md` | Cerrada | define contrato funcional, alcance v1, módulos y mapeo preliminar | bajar a decisiones técnicas ejecutables |
| `CL-0d` | `docs/constructor-crm/casalimpia-ecuador-plan-tecnico-clon-limpio-CL-0d.md` | Cerrada | define plan técnico de clon limpio, exclusiones y entorno objetivo | checklist operativo exacto antes de clonar |
| `CL-0e` | `docs/constructor-crm/casalimpia-ecuador-seed-usuarios-permisos-CL-0e.md` | Cerrada | define seed mínimo, usuarios, roles, permisos y QA básico | convertir a plan pre-clon verificable |
| `CLEAN-1C` | `docs/constructor-crm/validacion-comportamiento-neutro-post-pickup-fallback-CONSTRUCTOR-CLEAN-1C.md` | Cerrada | confirma que Pickup ya no es fallback automático | mantener cerrado |
| `CLEAN-2C` | `docs/constructor-crm/validacion-post-neutralizacion-facility-legacy-CONSTRUCTOR-CLEAN-2C.md` | Cerrada | valida neutralización de naming Casa Limpia en APIs | ninguna en core API |
| `CLEAN-2D` | `docs/constructor-crm/diagnostico-ui-facility-relevamiento-CONSTRUCTOR-CLEAN-2D.md` | Cerrada | documenta deuda UI facility y UI Pickup/vehículo pendiente | resolver antes del clon o dejar ocultable |
| `EXTRACT-1B` | `docs/casalimpia/README.md` | Cerrada | confirma extracción de activos reales del repo madre | mantener separación fuera de Git |

## 3. Checklist estratégico

| criterio | estado | evidencia | dictamen |
|----------|--------|-----------|----------|
| instancia limpia definida | Completo | `CL-0a` | GO |
| repo madre separado de CRM cliente | Completo | `CL-0a`, `CONSTRUCTOR-CLOSE-1` | GO |
| contrato funcional definido | Completo | `CL-0c` | GO |
| clon todavía no creado | Completo | `git status` limpio y sin carpeta creada en esta fase | GO |
| cliente final no accede al Constructor | Definido documentalmente | `CL-0a`, `CL-0c`, `CL-0d`, `CL-0e` | GO condicional |
| Casa Limpia no se mezcla con Pickup | Definido documentalmente | `CL-0a`, `CLEAN-1C`, `CLEAN-2D` | GO condicional |
| activos reales fuera del repo | Completo | `docs/casalimpia/README.md` | GO |

## 4. Checklist técnico repo madre

| criterio | estado | evidencia | dictamen |
|----------|--------|-----------|----------|
| `git status` clean | Completo | `git status` actual | GO |
| Pickup sin fallback automático | Completo | `CLEAN-1C`, commit `04cf100` | GO |
| Casa Limpia naming neutralizado en APIs | Completo | `CLEAN-2C`, commit `8d2ea00` | GO |
| `FACILITY_LEGACY_LEAD_FIELDS` acotado | Completo | `CLEAN-2C` | GO |
| `docs/casalimpia` solo placeholder | Completo | `docs/casalimpia/README.md` | GO |
| UI facility diagnosticada | Completo | `CLEAN-2D` | GO |
| UI Pickup/vehículo pendiente | Pendiente | `CLEAN-2D` | GO condicional |
| Constructor ocultable pendiente de implementación | Pendiente | `CL-0d`, `CL-0e` | GO condicional |
| build último conocido OK | Completo | `CLEAN-2C` | GO |

## 5. Checklist contrato CRM

| criterio | estado | evidencia | dictamen |
|----------|--------|-----------|----------|
| campos core definidos | Completo | `CL-0c` | GO |
| campos específicos definidos | Completo | `CL-0c` | GO |
| decisión columnas vs `contract_fields_json` preliminar | Completo a nivel documental | `CL-0c` | GO condicional |
| `visita_relevamiento_json` considerado | Completo | `CL-0c`, `CLEAN-2D` | GO |
| pipeline definido | Completo | `CL-0c` | GO |
| módulos visibles/ocultos definidos | Completo | `CL-0c` | GO |
| IA asistida delimitada | Completo | `CL-0c` | GO |
| fuera de alcance v1 definido | Completo | `CL-0c` | GO |

## 6. Checklist infraestructura futura

| criterio | estado | evidencia | dictamen |
|----------|--------|-----------|----------|
| carpeta objetivo definida | Completo | `CL-0d` | GO |
| repo/proyecto cliente definido | Completo | `CL-0d` | GO |
| Supabase separado recomendado | Completo | `CL-0a`, `CL-0d` | GO |
| Vercel separado recomendado | Completo | `CL-0a`, `CL-0d` | GO |
| dominio pendiente | Pendiente | `CL-0a`, `CL-0d` | GO condicional |
| env vars categorizadas | Completo | `CL-0d` | GO |
| no secretos documentados | Completo | `CL-0d` | GO |
| no SQL ejecutado | Completo | alcance de todas las fases | GO |
| no deploy realizado | Completo | `CL-0a`, `CL-0d` | GO |

## 7. Checklist seed / usuarios / permisos

| criterio | estado | evidencia | dictamen |
|----------|--------|-----------|----------|
| roles definidos | Completo | `CL-0e` | GO |
| permisos por módulo definidos | Completo | `CL-0e` | GO |
| usuarios conceptuales definidos | Completo | `CL-0e` | GO |
| usuarios reales no creados | Completo | alcance `CL-0e` + `git status` clean | GO |
| pipeline seed definido | Completo | `CL-0e` | GO |
| leads QA `qa_cl_` definidos | Completo | `CL-0e` | GO |
| datos prohibidos definidos | Completo | `CL-0e` | GO |
| Constructor oculto para cliente | Definido documentalmente | `CL-0c`, `CL-0d`, `CL-0e` | GO condicional |
| RBAC mínimo considerado | Completo | `CL-0e` + `docs/seed-minimo-nuevo-entorno-easy.md` | GO |

## 8. Checklist riesgos bloqueantes

| riesgo | estado | bloquea CL-1a | mitigación requerida |
|--------|--------|---------------|----------------------|
| Constructor visible | Pendiente | Sí | definir mecanismo exacto de ocultamiento antes del clon |
| UI Pickup visible | Pendiente | Sí | decidir exclusión/ocultamiento antes del clon |
| UI facility hardcodeada | Pendiente pero documentada | Sí | definir si se hereda, se oculta o se parametriza |
| Supabase no creado | Esperado | No para `CL-1a`, Sí para fases infra | mantenerlo fuera de `CL-1a` |
| Vercel no creado | Esperado | No para `CL-1a`, Sí para fases infra | mantenerlo fuera de `CL-1a` |
| SQL no revisado | Esperado | No para `CL-1a`, Sí para `CL-SQL-0` | fase SQL manual posterior |
| datos QA/demo ajenos | Controlado documentalmente | Sí si aparecen | checklist estricto de exclusiones |
| activos reales | Controlado | Sí si reaparecen | mantener fuera de Git y del clon |
| env/secrets | Pendiente de definición | Sí | definir tratamiento exacto antes del clon |
| clon manual sin checklist | Pendiente | Sí | `CL-1a` solo con procedimiento exacto aprobado |

## 9. Matriz GO / GO condicional / NO-GO

| área | dictamen | condición para GO completo |
|------|----------|----------------------------|
| estrategia | GO | ninguna adicional |
| contrato funcional | GO | ninguna adicional |
| repo madre | GO | mantener tree limpio |
| UI | GO condicional | resolver ocultamiento Pickup y tratamiento UI facility |
| infraestructura | GO condicional | convertir plan en checklist operativo, sin ejecutar aún |
| seed | GO | pasar a checklist pre-clon |
| datos | GO condicional | confirmar exclusión total de QA ajeno y reales |
| seguridad operativa básica | GO condicional | definir manejo de env, flags y accesos |
| clon local | GO condicional | aprobar procedimiento exacto de copia/creación |
| Supabase | NO-GO | solo después de fase SQL/infra específica |
| Vercel | NO-GO | solo después de fase infra específica |

## 10. Dictamen pre-clon

Definición explícita:

- `CL-0f` documental: `GO`.
- Pasar a `CL-1a` creación controlada de carpeta local: `GO condicional`.
- Crear Supabase ahora: `NO-GO`.
- Crear Vercel ahora: `NO-GO`.
- Ejecutar SQL ahora: `NO-GO`.
- Usar datos reales: `NO-GO`.
- Crear clon sin resolver ocultamiento Constructor/UI Pickup: `NO-GO`.

### Recomendación

- `GO condicional` para planificar `CL-1a`, pero no ejecutarla hasta definir checklist operativo exacto del comando/copia.
- `NO-GO` para infraestructura y datos.

## 11. Condiciones mínimas antes de CL-1a

- revisar `git status` clean;
- definir comando/copia exacta;
- definir exclusiones;
- confirmar no copiar `.env`;
- confirmar no copiar `node_modules` / `.next`;
- confirmar no copiar backups;
- definir tratamiento de docs internas;
- definir ocultamiento Constructor;
- definir tratamiento UI Pickup/vehículo;
- definir que `CL-1a` solo crea carpeta local, sin Supabase/Vercel.

## 12. Próximas fases recomendadas

- `CL-1a — creación controlada de carpeta local clon, si se aprueba`
- `CL-1b — sanitización inicial del clon local`
- `CL-1c — configuración env local placeholder`
- `CL-1d — ocultamiento Constructor / módulos internos`
- `CL-1e — revisión UI Pickup/vehicle en clon`
- `CL-SQL-0 — plan SQL manual, no ejecución`
- `CL-QA-0 — QA local inicial`

No ejecutar ninguna de estas fases todavía.

## 13. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Usuarios creados | No |
| Carpetas cliente creadas | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |

## 14. Cierre

- Casa Limpia está preparada documentalmente para una fase futura de clon local controlado.
- Todavía no está preparada para infraestructura real.
- Próximo paso recomendado: decidir si se aprueba `CL-1a`, pero sin ejecutarla en este documento.
