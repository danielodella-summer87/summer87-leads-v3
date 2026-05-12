# Matriz de activación del Instalador CRM — Summer87 Leads v3

**Versión:** Fase 7R (documental)  
**Relacionado con:** `docs/DECISION_RUTAS_COMERCIALES_7M.md`, `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md`, `docs/MATRIZ_RECURSOS_SECTORIALES_7P.md`, `docs/RECURSOS_SECTORIALES_REUTILIZABLES_7O.md`

---

## 2. Propósito

Definir **cómo debe comportarse** el futuro **Instalador CRM** cuando el **Constructor** y la **Auditoría** estén completos: qué **entradas** consume, en qué **estados** puede actuar, qué puede **automatizar** frente a lo que exige **validación humana**, y qué **resultado** debe dejar antes de considerar la instancia **operativa**.

El documento **no** implementa el botón “Crear CRM para [empresa]”; fija la **matriz de activación** y las **reglas de gobernanza** del proceso guiado.

---

## 3. Principio

> **El botón “Crear CRM” no ejecuta una magia ciega; inicia una instalación guiada y validada.**

La creación de una instancia cliente es un **proceso** con pasos, confirmaciones y trazabilidad — no un único disparo irreversible.

---

## 4. Entradas del Instalador

| Fuente | Qué aporta | Ejemplo |
|--------|------------|---------|
| **Empresa** | Identidad del cliente, rubro, contactos, contexto comercial | Nombre legal, país, sitio web |
| **Cuestionario** | Respuestas estructuradas del Constructor | Vertical, tamaño de equipo, módulos deseados |
| **Documentos fuente** | Material para diagnóstico y prompts | PDFs, briefs, plantillas sectoriales |
| **Diagnóstico** | Hallazgos, riesgos, gaps, prioridades | Salida del módulo de diagnóstico del Constructor |
| **Proceso y pipeline** | Etapas comerciales acordadas | Definición de pipeline y reglas de avance |
| **Motores IA** | Perfiles/prompts candidatos y límites | Pack agencia vs genérico (7P) |
| **Reportes** | KPIs y listados iniciales sugeridos | Embudo, performance, seguimiento |
| **Auditoría** | Semáforo de preparación, bloqueos, acciones correctivas | “Listo para piloto” / “Pendiente KYC documental” |
| **Preset sectorial** | Base acelerada según vertical (7Q) | Agencia vs automotriz vs educación |
| **Decisiones del instalador humano** | Overrides, exclusiones, confirmaciones finales | “No activar Gamma”; “Supabase dedicado sí” |

---

## 5. Estados posibles

| Estado | Significado | Acción permitida |
|--------|-------------|------------------|
| **Constructor incompleto** | Faltan artefactos mínimos (empresa, proceso o motores sin cerrar) | Completar Constructor; **no** iniciar instalación productiva |
| **Auditoría pendiente** | No hay veredicto formal de preparación | Ejecutar auditoría; corregir hallazgos |
| **Listo para piloto** | Instancia de prueba permitida con datos acotados | Crear entorno piloto con checklist y fecha de corte |
| **Listo para instalación guiada** | Constructor + auditoría OK para propuesta de CRM real | Habilitar asistente de instalación y preset sugerido |
| **Instalación en revisión** | Cambios aplicados pero no activados del todo | Revisión por instalador; rollback planificado |
| **CRM operativo creado** | Instancia en uso con menú y permisos acordados | Operación; cambios vía configuración controlada |
| **CRM operativo bloqueado** | Incumplimiento, pago o riesgo | Solo acciones de soporte / Summer87 según política |

---

## 6. Matriz de activación

| Elemento a crear/configurar | Fuente principal | Validación humana requerida | Se puede automatizar | Resultado esperado |
|-----------------------------|------------------|----------------------------|------------------------|----------------------|
| **Instancia / nombre del CRM** | Empresa + instalador | Sí (nombre visible al cliente) | Sugerir nombre; **no** fijar sin confirmar | Nombre y slug acordados |
| **Supabase propio o compartido** | Política Summer87 + instalador | **Sí** (implicaciones legales y coste) | Checklist y plantilla de decisión | Documentación de elección |
| **Variables `.env`** | Plantilla + secretos | Sí para secretos y URLs | Generar **plantilla** `.env.example` | Archivo guía sin secretos en repo cliente |
| **Branding** | Empresa + preset | Sí (logo, colores, copy) | Prellenar desde assets subidos | Tema visual acotado |
| **Roles y usuarios iniciales** | Cuestionario + RBAC plantilla | Sí (quién es admin cliente) | Proponer matriz rol→permiso | Usuarios creados o **invitaciones** pendientes |
| **Menú visible del cliente** | Auditoría + preset + portal | Sí | Preconfigurar `sidebar_modules` sugerido | Menú sin Constructor para rol cliente |
| **Pipeline** | Proceso Constructor + preset | Sí (etiquetas y orden) | Import JSON de etapas sugeridas | Pipeline activo alineado al negocio |
| **Campos de lead** | Preset + diagnóstico | Sí (campos obligatorios) | Mapeo sugerido a esquema | Lead mínimo capturable |
| **Catálogo comercial** | Preset agencia/servicios | Sí si aplica vertical | Importar pack **vacío** o sectorial | Catálogo coherente o desactivado |
| **Motores IA** | 7P + preset | Sí (cuáles ON y límites) | Lista de motores sugeridos en “modo sugerencia” | IA sin decisiones finales no aprobadas |
| **Reportes** | Preset + 7P | Sí (cuáles visibles) | Activar plantillas de reporte | Dashboard inicial acordado |
| **Agenda** | Cuestionario | Parcial | Habilitar módulo si contrato lo incluye | Agenda ON/OFF documentado |
| **Mesa de ayuda** | Cuestionario | Parcial | Idem | Idem |
| **Manual de neuroventas** | Preset | Parcial | Enlace visible solo si vertical lo usa | Contenido opcional |
| **Permisos** | RBAC + auditoría | Sí | Plantillas por rol | Matriz aplicada y revisada |
| **Datos de ejemplo** | Instalador | **Sí** (opt-in explícito) | Seed mínimo **solo** si se acepta | Datos demo claramente marcados o ausentes |
| **Limpieza de datos heredados** | Política + instalador | Sí | Checklist post-instalación | Sin mezcla de verticales ni demos en prod |

---

## 7. Qué sí puede hacer automáticamente

- Generar **JSON de configuración** propuesto (portal, menú, flags).  
- **Proponer** pipeline, módulos visibles, motores IA y reportes según preset (7Q).  
- Generar **checklist de instalación** y archivo de **resumen** para el instalador (diff vs defaults).  
- Preparar **invitaciones** en borrador (sin enviar) o lista de usuarios a crear.  
- Validaciones **sintácticas** (schemas) antes de aplicar cambios.

---

## 8. Qué NO debe hacer automáticamente

- Crear **proyecto Supabase real** o credenciales sin **confirmación** explícita.  
- **Borrar** o truncar datos.  
- Activar **IA sensible** (legal, financiera, salud, inversión, compatibilidad crítica) sin modo sugerencia + aprobación.  
- **Invitar** usuarios finales o enviar mails masivos sin confirmación.  
- **Exponer** el Constructor al rol cliente.  
- **Mezclar** recursos sectoriales de dos verticales sin validación (7O/7P).  
- **Publicar** producción o DNS sin revisión humana y registro de versión.

---

## 9. Preguntas que debe hacer al instalador

1. ¿**Nombre final** del CRM (visible al cliente)?  
2. ¿**Cliente / empresa** titular y contacto legal de la instancia?  
3. ¿**Vertical** confirmada (o override respecto al Constructor)?  
4. ¿**Supabase propio** vs compartido / proyecto existente?  
5. ¿**Usuarios iniciales** (emails, roles) y quién es el primer admin cliente?  
6. ¿**Módulos visibles** en el menú para cada rol?  
7. ¿Qué **preset sectorial** se acepta, ajusta o se rechaza (7Q)?  
8. ¿Qué **reportes** se activan en el primer día?  
9. ¿Qué **motores IA** quedan solo en **sugerencia** vs habilitados con revisión?  
10. ¿**Datos de ejemplo** sí / no (opt-in explícito)?  
11. ¿**Constructor** oculto al cliente **sí** (recomendado por defecto)?

---

## 10. Resultado final esperado

Al cerrar el proceso guiado debería quedar:

- **CRM operativo** con URL y accesos acordados.  
- **Constructor** (y auditoría sensible) **no visible** al cliente final.  
- **Menú** ajustado por rol y `portal_config`.  
- **Pipeline** y **campos mínimos** de lead definidos.  
- **Motores IA** permitidos según política (sugerencia vs asistido con humano en el loop).  
- **Reportes** iniciales activos y documentados.  
- **Usuarios** creados o **listos para invitar** (sin envíos no confirmados).  
- **Checklist de validación** firmado o archivado (quién aprobó, fecha, versión preset).

La **ruta comercial canónica** debe ser **`/admin/leads`** y subrutas (7M) en la instancia operativa.

---

## 11. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Activar **configuración equivocada** | Diff previo + rollback + estado “en revisión” |
| Instancia con **datos heredados** no deseados | Opt-in datos ejemplo + script de limpieza acordado |
| **Mezclar presets** sectoriales | Confirmación por vertical única; matriz 7P |
| **Exponer Constructor** | RBAC + menú; prueba con rol cliente |
| **IA sin revisión** | Modo sugerencia por defecto; logs de aprobación |
| **Duplicar rutas comerciales** | Política 7M; no crear enlaces legacy |
| **Falta de documentación** de decisiones | Resumen exportado + versión preset en ticket |

---

## 12. Fases futuras

| Fase | Objetivo |
|------|----------|
| **7S** | Modelo **visual** del Instalador dentro del flujo de **Auditoría** (wireframes / estados). |
| **7T** | **Prototipo estático** del botón “Crear CRM para [empresa]” (solo UI, sin side-effects). |
| **7U** | **Export** de paquete instalable (ZIP/JSON firmado) reproducible en otro entorno. |
| **7V** | **Checklist interactivo** de instalación (pasos, firmas, bloqueos). |
| **7W** | **Implementación real** de creación de instancia (API, Supabase, idempotencia). |

---

## 13. Criterios de aceptación

- Ningún proceso **destruye** datos sin confirmación explícita y trazabilidad.  
- Ningún **cliente final** ve el Constructor en su menú estándar.  
- Todo **preset** requiere **confirmación** del instalador.  
- Toda **IA sensible** queda en **modo sugerencia** hasta política explícita.  
- El CRM creado usa la **ruta canónica** comercial `/admin/leads` (7M).  
- El instalador puede **revisar y abortar** antes de activar.

---

*Fin del documento — Fase 7R.*
