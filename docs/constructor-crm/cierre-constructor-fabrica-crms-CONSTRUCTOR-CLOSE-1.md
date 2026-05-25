# Cierre Constructor fábrica CRMs CONSTRUCTOR-CLOSE-1 - Constructor CRM Summer87

**Versión:** CONSTRUCTOR-CLOSE-1 - definición conceptual y operativa  
**Proyecto:** summer87-leads-v3  
**Estado:** cierre estratégico del Constructor CRM como fábrica de proyectos cliente  
**Alcance:** solo documentación; sin código, sin SQL, sin Supabase, sin Vercel, sin datos, sin carpetas cliente

---

## 1. Resumen ejecutivo

- `summer87-leads-v3` queda definido como **Constructor CRM / fábrica / base madre**.
- Los CRM de clientes deben vivir en **proyectos separados**.
- Pickup 4x4 fue el piloto que validó el patrón técnico y operativo.
- Casa Limpia Ecuador será el primer candidato a clon limpio real.
- El Constructor no es el CRM final del cliente.
- **Dictamen:** **GO conceptual** para avanzar hacia generador de proyectos cliente.

---

## 2. Decisión principal

- `summer87-leads-v3` = Constructor madre / fábrica de CRMs.
- `4x4-crm-inteligente` = CRM operativo Pickup si se decide crear instancia real.
- `casalimpia-crm-inteligente` = CRM operativo Casa Limpia Ecuador.
- `amorperfecto-crm-inteligente` = ejemplo futuro para Cafetería Amor Perfecto.

### Aclaración central

- El repo madre conserva el Constructor, el Instalador, los paquetes, la documentación y la lógica base.
- Los proyectos cliente deben ocultar o remover el Constructor de la superficie visible al usuario final.

---

## 3. Modelo recomendado de proyectos

```text
~/proyectos/summer87-leads-v3
Constructor CRM / fábrica / base madre

~/proyectos/4x4-crm-inteligente
CRM operativo Pickup 4x4

~/proyectos/casalimpia-crm-inteligente
CRM operativo Casa Limpia Ecuador

~/proyectos/amorperfecto-crm-inteligente
CRM operativo Amor Perfecto
```

### Motivo de esta separación

Esta estructura reduce mezcla de:

- datos;
- branding;
- permisos;
- QA;
- lógica y copy de verticales.

---

## 4. Qué queda en el Constructor madre

| Componente | Rol en `summer87-leads-v3` |
|------------|-----------------------------|
| Constructor CRM | Permanece |
| Instalador / paquetes | Permanece |
| Cuestionario de empresa | Permanece |
| Auditoría | Permanece |
| Motor de contrato CRM | Permanece |
| Generador de paquete instalable | Permanece |
| Documentación de arquitectura | Permanece |
| Plantillas base | Permanece |
| Patrones validados: `contract_fields_json`, Leads, Ficha, Lista, Kanban, RBAC | Permanece |
| Configuraciones de referencia | Permanece como referencia, no como config de cliente final |

---

## 5. Qué debe tener un proyecto CRM cliente

| Componente | Requerido |
|------------|-----------|
| CRM operativo | Sí |
| Branding del cliente | Sí |
| Pipeline propio | Sí |
| Campos propios | Sí |
| `contract_fields_json` según contrato | Sí |
| Usuarios propios | Sí |
| Supabase propio | Sí |
| Vercel / deployment propio | Sí |
| Variables propias | Sí |
| Seed mínimo | Sí |
| Constructor oculto o removido | Sí |
| Documentación de entrega | Sí |

---

## 6. Qué NO debe tener un proyecto cliente

- Constructor visible para cliente final.
- Paquetes internos Summer87.
- Auditoría técnica del Constructor.
- Datos QA de otros verticales.
- Textos Pickup si no corresponde.
- Configuración de otros clientes.
- Datos demo mezclados.
- Acceso superadmin innecesario para cliente.

---

## 7. Qué debe preguntar el Constructor

### A. Identidad de empresa

- Nombre comercial
- Nombre legal
- País
- Ciudad
- Rubro
- Sitio web
- Redes
- Contacto principal

### B. Modelo comercial

- Qué vende
- A quién le vende
- Ticket promedio
- Ciclo de venta
- Canales de captación
- Qué se considera oportunidad

### C. Proceso comercial

- Cómo entra un lead
- Quién lo atiende
- Etapas comerciales
- Acciones típicas
- Motivos de pérdida
- Qué significa lead ganado

### D. Datos necesarios

- Campos obligatorios
- Campos específicos del rubro
- Campos opcionales
- Datos sensibles o no permitidos
- Qué debe ir a columnas core
- Qué debe ir a `contract_fields_json`

### E. Operación

- Usuarios
- Roles
- Permisos
- Módulos visibles
- Agenda
- Kanban
- Reportes

### F. IA / automatización

- Qué puede recomendar la IA
- Qué no puede hacer
- Tono de comunicación
- Límites operativos
- Acciones que requieren confirmación humana

### G. Branding y UX

- Nombre del CRM
- Colores
- Logo
- Textos de ayuda
- Lenguaje comercial
- Qué módulos ocultar

---

## 8. Qué debe generar el Constructor

- Ficha de empresa
- Contrato CRM
- Pipeline
- `lead_fields` config
- Módulos activos
- Permisos iniciales
- Branding config
- Seed mínimo
- Checklist de instalación
- Paquete instalable JSON
- Prompt para crear proyecto cliente
- Guía de QA
- Documento de entrega piloto

---

## 9. Paquete instalable

### Estructura conceptual

- `packageVersion`
- `client_identity`
- `project_slug`
- `target_project_folder`
- `crm_contract`
- `lead_fields`
- `pipeline_config`
- `modules_config`
- `permissions_config`
- `branding_config`
- `ai_rules`
- `seed_plan`
- `deployment_plan`
- `qa_plan`
- `blocked_actions`
- `requires_human_confirmation`

### Regla crítica

El paquete instalable no debe ejecutar acciones destructivas ni sensibles sin **confirmación humana explícita**.

---

## 10. Niveles de automatización

| Nivel | Alcance | Dictamen |
|-------|---------|----------|
| V1 - Manual asistido | Constructor genera documentos, JSON, prompts y checklist; Daniel / Summer87 ejecuta clonación, env, Supabase y Vercel manualmente | **GO ahora** |
| V2 - Semi-automático | Constructor genera carpeta / proyecto local, copia base, configs y guía; Supabase / Vercel siguen manuales o semi-manuales | **GO después de V1** |
| V3 - Automático | Constructor crea repo / proyecto, Supabase, Vercel, seed, usuarios y deploy | **NO-GO ahora** |

### Recomendación

Empezar por **V1** y evolucionar luego a **V2**.  
**NO-GO V3** en esta etapa.

---

## 11. Flujo ideal futuro

1. Daniel entra al Constructor.
2. Crea nuevo cliente.
3. Responde cuestionario.
4. El Constructor propone contrato CRM.
5. Daniel revisa y aprueba.
6. El Constructor genera paquete instalable.
7. Daniel confirma creación.
8. Se crea proyecto cliente separado.
9. Se configura Supabase / Vercel / env.
10. Se ejecuta seed mínimo.
11. Se corre QA.
12. Se entrega demo cliente.

---

## 12. Aplicación a Casa Limpia Ecuador

- Casa Limpia Ecuador no debe construirse dentro del repo madre como destino final.
- Debe usarse el repo madre como fuente técnica.
- Debe crearse un proyecto limpio:

```text
~/proyectos/casalimpia-crm-inteligente
```

- Debe tener su propio contrato CRM.
- Debe ocultar el Constructor al cliente final.
- Debe tener Supabase / Vercel propios o claramente separados.
- `CL-0b` debe auditar el repo antes de clonar o adaptar.

---

## 13. Aplicación a Pickup 4x4

- Pickup fue piloto dentro del repo madre.
- Si Pickup pasa a cliente real, debe generarse:

```text
~/proyectos/4x4-crm-inteligente
```

- El piloto 12W sirve como base funcional y de QA, no como instancia cliente definitiva.

---

## 14. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Definir `summer87-leads-v3` como Constructor madre | GO |
| Crear proyectos cliente separados | GO |
| Crear Casa Limpia como clon limpio | GO |
| Seguir mezclando clientes en repo madre | NO-GO |
| Usar repo madre como CRM final cliente | NO-GO |
| Automatización total V3 ahora | NO-GO |
| V1 manual asistido | GO |
| V2 semi-automático | GO después de V1 |
| Cliente final accede al Constructor | NO-GO |
| Summer87 / instalador accede al Constructor | GO |

---

## 15. Riesgos abiertos

- El repo madre aún contiene lógica y UX mezclada de verticales.
- Hay que separar qué es plantilla base y qué es configuración cliente.
- La generación automática de proyectos puede ser riesgosa si se automatiza demasiado pronto.
- Supabase y Vercel requieren control manual al inicio.
- Los datos QA no deben migrarse a clientes.
- Falta definir un contrato estándar de salida del paquete instalable.

---

## 16. Próximas fases sugeridas

| Fase | Alcance |
|------|---------|
| CONSTRUCTOR-CLOSE-2 | Diseño del paquete instalable como contrato de salida |
| CONSTRUCTOR-CLOSE-3 | Diseño del generador de proyecto local |
| CL-0b | Auditoría read-only del repo para Casa Limpia |
| CL-0c | Contrato CRM Casa Limpia Ecuador |
| CL-0d | Plan de clonación a `~/proyectos/casalimpia-crm-inteligente` |
| CL-1 | Implementación del primer clon limpio |

---

## 17. Confirmación de alcance

| Ítem | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| API modificada | No |
| Solo documentación | Sí |
| Commit | No |

---

## 18. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Constructor como fábrica de CRMs | GO |
| Repo madre separado de CRM cliente | GO |
| Proyectos cliente separados | GO |
| Casa Limpia como primer clon limpio | GO |
| Automatización total ahora | NO-GO |
| Pasar a CONSTRUCTOR-CLOSE-2 | GO |
| Pasar luego a CL-0b | GO |

---

## 19. Cierre

La definición conceptual queda cerrada: `summer87-leads-v3` no es el CRM final de ningún cliente, sino la **fábrica** desde la cual Summer87 diseña, configura y lanza CRMs cliente separados. Pickup validó el patrón; Casa Limpia Ecuador debe convertirse en el primer caso real de clon limpio siguiendo este modelo.
