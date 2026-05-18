# Registro Feedback Piloto 12R — Constructor CRM Summer87

**Versión:** Fase 12R (registro y gestión de feedback — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `manual-breve-usuario-cliente-12Q.md` | Guía usuario final; insumo para dudas de capacitación |
| `validacion-manual-cliente-menu-constructor-12Q-impl-1.md` | Vista interna Summer87 del manual |
| `preparacion-piloto-primer-cliente-12L.md` | Objetivos y alcance del piloto |
| `checklist-go-no-go-primer-cliente-12M.md` | Go / No-Go antes y durante piloto |
| `limpieza-semilla-datos-piloto-12N.md` | Datos, semilla y limpieza |
| `validacion-staging-clon-client-crm-12O.md` | Evidencia en staging/clon |
| `plan-deploy-rollback-client-crm-12P.md` | Deploy y rollback |

**Estado:** marco operativo **documentado**. **No** implica que el piloto ya haya ocurrido, que exista feedback recibido ni que exista un backlog aprobado.

---

## 2. Resumen ejecutivo

**12R** define **cómo capturar, clasificar y convertir en decisiones** el feedback del cliente durante un piloto **`APP_MODE=client_crm`**, sin ejecutar cambios técnicos ni comerciales por sí solo.

### Qué hace 12R

| Aspecto | Detalle |
|---------|---------|
| Evidencia | Convierte comentarios dispersos en registros con contexto, severidad y prioridad |
| Decisiones | Sugiere cuándo pausar, capacitar, limpiar datos o llevar algo al backlog |
| Puente | Conecta el piloto real (12L–12P) con mejoras posteriores (12S en adelante) |
| Valor | Ayuda a medir valor percibido y fricción por módulo (Dashboard, Leads, Agenda, Reportes) |

### Qué no hace 12R

| Limitación | Detalle |
|------------|---------|
| Ejecutar cambios | No modifica código, datos ni configuración |
| Backlog automático | No crea ítems en herramientas de gestión sin revisión humana |
| Sustituir soporte | No reemplaza el canal acordado con el cliente |
| Inventar feedback | No incluye comentarios reales del cliente; las plantillas quedan vacías hasta **12R-run** |

---

## 3. Objetivo de 12R

| # | Objetivo |
|---|----------|
| 1 | **Registrar** dudas, errores, fricciones y oportunidades con formato mínimo repetible |
| 2 | **Separar** bug, mejora UX, capacitación, dato faltante/incorrecto, alcance comercial e integración futura |
| 3 | **Evitar** decisiones impulsivas durante demo o primera semana (“lo arreglamos ya”) |
| 4 | **Priorizar** mejoras con criterio (severidad vs prioridad vs impacto en piloto) |
| 5 | **Documentar** qué entra al backlog derivado y qué queda explícitamente fuera |
| 6 | **Medir** valor percibido del CRM y señales para go/no-go comercial (complementa **12M**) |

---

## 4. Cuándo usar este registro

Usar **12R** (plantillas de este documento o copia en la herramienta que elija Summer87) en estos momentos:

| Momento | Uso |
|---------|-----|
| Durante **demo** con cliente | Anotar en vivo; no prometer sin clasificar |
| Durante **primera semana** de piloto | Registrar fricción diaria y bloqueos |
| Después de revisar **manual 12Q** con el usuario | Capturar qué no quedó claro o qué faltó |
| Tras sesiones de prueba en **Leads, Agenda y Reportes** | Un registro por módulo si aplica |
| Cuando aparezcan **problemas de datos** | Enlazar con **12N** (limpieza/semilla) |
| Cuando el cliente **pida funciones nuevas** | Clasificar alcance vs mejora vs integración |

**Regla:** si el comentario es solo verbal, pedir registro mínimo (pantalla + qué intentaba + qué pasó) antes de cerrar la reunión.

---

## 5. Tipos de feedback

| Tipo | Descripción | Ejemplo | Acción típica |
|------|-------------|---------|---------------|
| **Bug** | Comportamiento incorrecto del sistema | “Al guardar la actividad no aparece en la lista” | Reproducir, severidad, fix o workaround |
| **Fricción UX** | Funciona pero cuesta entender o usar | “No encuentro cómo volver al listado” | Mejora UX o capacitación |
| **Dato faltante** | Falta información necesaria para operar | “Los leads no tienen rubro” | 12N / carga / definición de dataset |
| **Dato incorrecto** | Información errónea o inconsistente | “El estado no coincide con lo acordado” | 12N / corrección / origen del dato |
| **Reporte faltante** | Métrica o vista no disponible | “Necesito ver conversiones por vendedor” | Backlog P1/P2 o alcance |
| **Mejora funcional** | Nueva capacidad dentro del CRM operativo | “Quiero marcar leads prioritarios” | Backlog con prioridad y DoD |
| **Pedido fuera de alcance** | No incluido en piloto ni contrato | “Quieren configurar usuarios solos” | Decisión comercial + mensaje claro |
| **Necesidad de capacitación** | Malentendido del flujo, no defecto | “No sabía que la agenda no crea el lead” | Manual 12Q / sesión corta |
| **Riesgo seguridad/datos** | Exposición, acceso indebido, fuga | “Veo datos que no son de mi empresa” | **Pausa** + escalamiento inmediato |
| **Oportunidad comercial** | Valor percibido alto o upsell | “Esto reemplazaría nuestra planilla” | Registrar para 12U; no prometer scope |
| **Integración futura** | Sistemas externos no acordados | “¿Se conecta con WhatsApp?” | Fase futura; registro sin compromiso |

---

## 6. Severidad

La **severidad** describe el **daño o riesgo** del hallazgo, independientemente de cuándo se pueda resolver.

| Severidad | Definición | Acción |
|-----------|------------|--------|
| **Crítica** | Bloquea uso, expone datos o viola confianza del piloto | Escalar de inmediato; evaluar pausa/rollback (**12P**, **12M**) |
| **Alta** | Afecta operación importante sin workaround claro | Priorizar análisis en 24–48 h; comunicar al cliente |
| **Media** | Molesta pero hay workaround o uso parcial | Registrar; planificar en ventana acordada |
| **Baja** | Mejora menor, estética o preferencia leve | Backlog o diferir |
| **Idea futura** | No afecta el piloto actual | Registrar sin urgencia; no mezclar con bugs |

---

## 7. Prioridad

La **prioridad** define **cuándo** Summer87 debe actuar respecto al piloto, no qué tan grave es el problema.

| Prioridad | Criterio | Cuándo aplicar |
|-----------|----------|----------------|
| **P0** | Bloqueo inmediato del piloto | Bug crítico, riesgo de datos, acceso indebido |
| **P1** | Antes de continuar el piloto con confianza | Alta severidad sin workaround; reporte clave acordado |
| **P2** | Próximo sprint o ciclo de mejora post-demo | Mejoras UX/funcionales con impacto claro |
| **P3** | Backlog futuro | Ideas, nice-to-have, integraciones no contratadas |
| **No hacer / fuera de alcance** | No corresponde al piloto o contrato | Comunicar con transparencia; no entrar al backlog operativo |

### Diferencia severidad vs prioridad

| Concepto | Pregunta que responde |
|----------|----------------------|
| **Severidad** | ¿Qué tan grave o riesgoso es? |
| **Prioridad** | ¿Cuándo debemos actuar respecto al piloto? |

**Ejemplo:** una fricción UX puede ser severidad **baja** y prioridad **P2** si el cliente sigue operando; un bug de datos visibles puede ser severidad **crítica** y prioridad **P0** aunque el fix técnico tarde días.

---

## 8. Canales de captura

| Canal | Uso recomendado |
|-------|-----------------|
| **Reunión con cliente** | Demo, kickoff, revisión semanal; registrar al cierre |
| **WhatsApp / email / ticket** | Soporte asíncrono; copiar al formato mínimo |
| **Observación en vivo** | Summer87 ve confusión sin que el cliente lo diga |
| **Captura de pantalla** | Errores, estados vacíos, mensajes del sistema |
| **Grabación interna** | Solo si está **autorizada** por política del cliente |
| **Comentarios equipo Summer87** | Consolidar antes de hablar con el cliente |
| **Reporte responsable cliente** | Punto focal del lado cliente |

### Buenas prácticas

- **Evitar** feedback solo verbal sin registro escrito.
- En **errores**, pedir siempre: pantalla, pasos, hora aproximada, usuario, captura si es posible.
- Un comentario = **un ID** de registro (no mezclar varios temas en una sola fila).

---

## 9. Formato mínimo de registro

Copiar por cada ítem de feedback (rellenar en **12R-run**; dejar vacío hasta entonces):

```text
ID:
Fecha:
Cliente:
Usuario que reporta:
Responsable Summer87:
Pantalla:
Tipo:
Severidad:
Prioridad:
Descripción:
Qué intentaba hacer:
Qué ocurrió:
Resultado esperado:
Evidencia:
Datos involucrados:
¿Reproducible?:
Impacto:
Decisión:
Próxima acción:
Responsable:
Estado:
Fecha objetivo:
Notas:
```

**Convención sugerida para ID:** `FB-12R-{CLIENTE}-{AÑO}-{NNN}` (ej. `FB-12R-PICKUP4X4-2026-001`).

---

## 10. Estados del feedback

| Estado | Significado |
|--------|-------------|
| **Nuevo** | Recién capturado; sin análisis |
| **En análisis** | Summer87 revisa reproducibilidad e impacto |
| **Requiere evidencia** | Falta captura, pasos o acceso para reproducir |
| **Requiere decisión comercial** | Alcance, precio o contrato |
| **Aceptado para backlog** | Aprobado para desarrollo o mejora planificada |
| **En progreso** | Alguien está trabajando la acción acordada |
| **Resuelto** | Verificado con cliente o criterio de terminado cumplido |
| **Rechazado / fuera de alcance** | No se hará en esta fase; documentado el motivo |
| **Diferido** | Válido pero post-piloto |
| **Requiere capacitación** | No es defecto; acción formativa |
| **Requiere limpieza de datos** | Problema de dataset; derivar a **12N** |

---

## 11. Matriz de decisión

| Caso | Decisión sugerida |
|------|-------------------|
| Bug **crítico** con datos expuestos | **Pausa** piloto; revisar rollback (**12P**) y **12M** |
| Menú o flujo **confuso** | Mejora UX y/o sesión de capacitación (12Q) |
| **Reporte faltante** clave para el negocio | Backlog **P1/P2**; validar si estaba en alcance 12L |
| Cliente pide **IA** no contratada | Decisión comercial (**12U**); no prometer en piloto |
| Cliente pide **integración** (WhatsApp, ERP, etc.) | Registrar como integración futura; fase posterior |
| **Dato incorrecto** o duplicado | Acción **12N**; no atribuir a producto sin verificar origen |
| **No entiende** una pantalla | Manual / walkthrough; estado “Requiere capacitación” |
| Función **no incluida** en piloto | “Fuera de alcance” + registro para evaluación futura |
| Preferencia **estética** sin impacto | P3 o diferir |
| Mismo comentario de **varios usuarios** | Subir prioridad; consolidar en un ID maestro |

---

## 12. Registro de feedback por módulo

Usar estas listas como **checklist de observación** durante demo o piloto. Marcar solo lo observado o reportado; no completar por anticipado.

### A. Dashboard

| Tema | Preguntas / notas |
|------|-------------------|
| Claridad | ¿Entiende qué muestra la pantalla inicial? |
| Indicadores | ¿Los números tienen sentido para su negocio? |
| Contadores en 0 | ¿Genera desconfianza o es esperable en piloto? |
| Accesos rápidos | ¿Encuentra camino a Leads / Agenda / Reportes? |
| Alertas | ¿Hay mensajes confusos o ausentes cuando deberían aparecer? |

### B. Leads / Summer87 Leads

| Tema | Preguntas / notas |
|------|-------------------|
| Estados | ¿Coinciden con su proceso comercial? |
| Campos faltantes | ¿Qué dato necesita y no ve? |
| Búsqueda / filtros | ¿Encuentra oportunidades rápido? |
| Detalle | ¿El detalle del lead es usable? |
| Seguimiento | ¿Puede registrar avance sin fricción? |
| Datos incorrectos | ¿Origen semilla, carga manual o bug? |

### C. Agenda

| Tema | Preguntas / notas |
|------|-------------------|
| Actividades | ¿Crear / editar / cerrar es claro? |
| Fechas | ¿Zona horaria y vencimientos correctos? |
| Responsables | ¿Asignación visible y coherente? |
| Invitados | ¿Expectativa vs lo que ofrece el piloto? |
| Pendientes / vencidas | ¿Las ve y actúa? |
| Relación con leads | ¿Entiende vínculo actividad ↔ oportunidad? |

### D. Reportes

| Tema | Preguntas / notas |
|------|-------------------|
| Métricas faltantes | ¿Qué KPI pide y no está? |
| Filtros | ¿Puede acotar lo que necesita? |
| Exportación | ¿Esperaba Excel/PDF? (alcance piloto) |
| Claridad de gráficos | ¿Interpreta sin ayuda? |
| Datos insuficientes | ¿Vacío por falta de carga o por diseño? |

### E. Manual cliente (12Q)

| Tema | Preguntas / notas |
|------|-------------------|
| Claridad | ¿El lenguaje fue entendible? |
| Qué faltó explicar | Secciones a ampliar (**12V**) |
| Qué sobró | Contenido redundante o técnico |
| Límites del piloto | ¿Entendió qué no está incluido? |

### F. Datos

| Tema | Preguntas / notas |
|------|-------------------|
| Duplicados | ¿Ve contactos u oportunidades repetidas? |
| Basura heredada | ¿Restos de demo/base madre? → **12N** |
| Sensibles | ¿Datos que no deberían estar en piloto? |
| Falta de dataset | ¿Poco volumen para probar reportes? |
| Reales vs ficticios | ¿Sabe qué tipo de datos opera? |

---

## 13. Preguntas guía para reuniones

Usar en kickoff, demo o cierre de semana (no leer como interrogatorio; elegir las pertinentes):

1. ¿Qué intentaste hacer **primero** al entrar?
2. ¿**Dónde** te trabaste?
3. ¿Qué pantalla te resultó **más útil**?
4. ¿Qué pantalla **no usarías** en el día a día?
5. ¿Qué **dato** necesitás para trabajar mejor?
6. ¿Qué **reporte** mirarías todas las semanas?
7. ¿Qué **acción** esperabas encontrar y no estaba?
8. ¿Qué te generó **desconfianza**?
9. ¿Qué te resultó **claro** sin explicación?
10. ¿Qué tendría que **cambiar** para usarlo una semana seguida?
11. ¿Lo usarías **sin** que Summer87 esté presente?

---

## 14. Criterios para pasar feedback a backlog

Un ítem puede pasar a la **plantilla de backlog derivado** (§16) solo si cumple **todos** los aplicables:

- [ ] Tiene **impacto claro** en operación o valor del piloto
- [ ] Se puede **reproducir** o explicar con pasos y pantalla
- [ ] **Alinea** con objetivos del piloto (**12L**)
- [ ] **No rompe** seguridad ni alcance `client_crm` (**12I**)
- [ ] Tiene **responsable** Summer87 asignado
- [ ] Tiene **prioridad** (P0–P3 o explícitamente fuera)
- [ ] Tiene **definición mínima de terminado** (qué verá el cliente cuando esté “listo”)
- [ ] **No depende** de datos no definidos (o hay plan 12N)
- [ ] **No es solo** preferencia aislada sin valor demostrado

---

## 15. Criterios para rechazar o diferir feedback

| Motivo | Acción |
|--------|--------|
| Fuera del **alcance** del piloto (**12L**) | Rechazado / fuera de alcance; mensaje al cliente |
| Requiere **integración** no acordada | Diferido; registro comercial |
| Requiere **datos sensibles** no autorizados | Rechazar carga; revisar política |
| Contradice **seguridad** `client_crm` | No implementar; escalar |
| Preferencia **menor** sin impacto | P3 o diferir |
| **Rediseño mayor** no prioritario | Diferido post-piloto |
| Ya está cubierto; falta **capacitación** | Estado “Requiere capacitación” |
| Problema de **datos**, no de producto | Derivar **12N**; no abrir ticket dev sin evidencia |

---

## 16. Plantilla de backlog derivado

Tabla para consolidar ítems **aceptados** (vacía hasta decisión explícita en **12R-run** / **12S**):

| ID feedback | Tipo | Módulo | Acción propuesta | Prioridad | Responsable | Estado | Criterio de terminado |
|-------------|------|--------|------------------|-----------|-------------|--------|------------------------|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

---

## 17. Plantilla de resumen semanal de feedback

Completar al cierre de cada semana de piloto (sin inventar cifras):

```text
Semana:
Cliente:
Responsable Summer87:

Cantidad total feedback:
Bugs críticos:
Bugs no críticos:
Mejoras UX:
Pedidos fuera de alcance:
Datos / limpieza (12N):
Capacitación:

Top 3 problemas:
1.
2.
3.

Top 3 oportunidades:
1.
2.
3.

Decisiones tomadas:
-

Pendientes:
-

Recomendación para próxima semana:
-
```

---

## 18. Métricas de piloto

Registrar **solo** si se pueden **observar** (logs, analytics acordados) o **preguntar** al cliente/responsable. **No inventar** valores.

| Métrica | Cómo obtenerla (sugerido) |
|---------|---------------------------|
| Usuarios que entraron | Listado de accesos / confirmación responsable cliente |
| Días de uso | Calendario del piloto; sesiones con actividad |
| Pantallas visitadas | Observación o telemetría si existe y está acordada |
| Leads revisados | Muestra operativa o pregunta al usuario clave |
| Actividades revisadas | Agenda: altas / consultas en período |
| Reportes consultados | Pregunta directa o evidencia de uso |
| Feedback recibido | Conteo de IDs en formato §9 |
| Bloqueos detectados | Ítems P0 / severidad crítica |
| Mejoras aceptadas | Filas en backlog §16 con estado aceptado |
| Dudas de capacitación | Ítems tipo capacitación o manual |

**Tabla de registro (ejemplo vacío):**

| Métrica | Valor | Fecha de medición | Fuente |
|---------|-------|-------------------|--------|
| Usuarios que entraron | | | |
| Días de uso | | | |
| Feedback recibido | | | |
| Bloqueos detectados | | | |

---

## 19. Riesgos que obligan a pausar piloto

Ante cualquiera de estos hallazgos, **detener** uso ampliado hasta decisión explícita (ver **12M**, **12P**):

| Riesgo | Por qué pausar |
|--------|----------------|
| Datos de **otro cliente** visibles | Confianza y cumplimiento |
| Datos **sensibles** expuestos indebidamente | Legal / reputación |
| Cliente accede a **configuración / Constructor** | Rompe modelo `client_crm` |
| APIs o acciones **destructivas** no bloqueadas | Integridad del entorno |
| **Usuario no autorizado** entra | Seguridad |
| **Error crítico persistente** sin workaround | No se puede operar |
| Cliente interpreta piloto como **producción** | Expectativas y responsabilidad |
| **Sin responsable** Summer87 para atender feedback | No hay gobernanza del piloto |
| Feedback **crítico** sin respuesta acordada | Riesgo relacional |

---

## 20. Cómo comunicar decisiones al cliente

### Principios

1. **Confirmar recepción** del comentario (ID si existe).
2. **Clasificar** sin prometer implementación inmediata.
3. Explicar si es **bug**, **mejora**, **dato** o **alcance**.
4. Dar **próxima acción** concreta (evidencia, capacitación, limpieza, backlog).
5. Informar qué **queda fuera** y **por qué** (piloto, contrato, fase).
6. **Evitar fechas** no aprobadas internamente.
7. Ser **transparente** con límites del piloto (**12L**, manual **12Q**).

### Ejemplos de mensajes (adaptar al canal)

| Situación | Mensaje sugerido |
|-----------|------------------|
| Mejora de reporte | “Lo registramos como mejora de reporte y lo vamos a priorizar junto con los demás pedidos del piloto.” |
| Problema de datos | “Esto corresponde a los datos del piloto; lo revisamos en la limpieza de datos acordada con el equipo.” |
| Fuera de alcance | “Esa función no está incluida en esta etapa, pero queda registrada para evaluar una fase posterior.” |
| Capacitación | “No es un error del sistema; te proponemos una mini sesión sobre Agenda y cómo se vincula con Leads.” |
| Bug en análisis | “Recibimos el reporte, estamos reproduciendo el caso; te avisamos cuando tengamos próximo paso.” |

---

## 21. Plantilla de cierre de piloto

Completar al finalizar o suspender el piloto (no implica que ya ocurrió):

```text
Cliente:
Fecha inicio:
Fecha cierre:
Usuarios participantes:

Módulos usados:
[ ] Dashboard  [ ] Leads  [ ] Agenda  [ ] Reportes  [ ] Otro: ___

Feedback total (cantidad de IDs):
Bugs críticos (cantidad / resumen):
Mejoras aceptadas (cantidad / resumen):
Pedidos fuera de alcance (cantidad / resumen):
Problemas de datos (resumen / enlace 12N):

Capacitación necesaria:
Valor percibido (cualitativo, citas del cliente si hay):

Recomendación Summer87:
¿Avanza a siguiente fase?  [ ] Sí  [ ] No  [ ] Condicionado

Condiciones:
Pendientes:

Firma / confirmación Summer87:
Firma / confirmación cliente:
```

---

## 22. Próximas fases

| Fase | Contenido |
|------|-----------|
| **12R-run** | Ejecutar registro real de feedback durante el piloto (rellenar plantillas) |
| **12S** | Priorización del backlog post-piloto |
| **12T** | Ajustes UX/funcionales aceptados |
| **12U** | Decisión comercial post-piloto |
| **12V** | Manual actualizado según feedback (**12Q**) |

---

## 23. Confirmación de alcance

Este documento **12R** confirma explícitamente que en esta fase:

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| Archivos TypeScript | **No** creados |
| `.env.local` | **No** tocado |
| SQL ejecutado | **No** |
| SQL ejecutable creado | **No** |
| Datos modificados / borrados / insertados | **No** |
| Supabase | **No** tocado |
| Endpoints creados | **No** |
| APIs modificadas | **No** |
| Middleware | **No** modificado |
| Migraciones | **No** |
| CRM real instalado | **No** |
| Tenant creado | **No** |
| Usuarios creados | **No** |
| Kore / Zeta | **No** tocados |
| Commits | **No** realizados en esta fase documental |
| Entregable | **Solo** `docs/constructor-crm/registro-feedback-piloto-12R.md` |

**No** se afirma que el piloto ya ocurrió, que el feedback ya fue recibido ni que exista backlog aprobado.

---

*Documento operativo Summer87 — Constructor CRM — serie 12R.*
