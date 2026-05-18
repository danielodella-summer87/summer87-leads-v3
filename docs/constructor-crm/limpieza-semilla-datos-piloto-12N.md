# Limpieza / Semilla Datos Piloto 12N — Constructor CRM Summer87

**Versión:** Fase 12N (plan de datos piloto — documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `preparacion-piloto-primer-cliente-12L.md` | Alcance piloto, usuarios, datos permitidos |
| `checklist-go-no-go-primer-cliente-12M.md` | GO condicionado a cerrar 12N |
| `runbook-instalacion-client-crm-12K.md` | Instalación y evidencias |
| `validacion-integral-client-crm-12J-run-local.md` | Carga técnica con contadores en 0 |
| `politica-roles-cliente-vs-summer87-12I.md` | Usuarios y permisos |

**Estado:** plan **documentado**. **No** constituye limpieza ejecutada, semilla aplicada ni dataset final listo.

---

## 2. Resumen ejecutivo

**12N** define **cómo preparar** los datos mínimos para un piloto **`client_crm`** que sea **útil** (demuestra valor en Leads, Agenda y Reportes) y **seguro** (sin basura heredada, mezcla de clientes ni exposición indebida).

### Qué hace 12N

| Función | Detalle |
|---------|---------|
| Criterios | Qué datos incluir, excluir y auditar |
| Dataset mínimo | Cantidades y ejemplos conceptuales |
| Checklists | Auditoría, limpieza y semilla (proceso, no ejecución) |
| Aceptación | GO/NO-GO de datos antes de sesión con cliente |

### Qué no hace 12N

| Limitación | Detalle |
|------------|---------|
| Limpieza real | No borra ni actualiza registros |
| SQL | No ejecuta ni incluye SQL ejecutable |
| Supabase | No toca panel ni API de datos |
| Instalación | No inserta filas en BD |
| Dataset final | No afirma que el piloto ya tenga datos listos |

### Condición previa

Sin **12N** cerrado (o dataset documentado y aprobado), el piloto puede **cargar técnicamente** pero **perder valor** (pantallas en 0) o **contaminarse** (datos heredados), bloqueando un **GO** pleno en **12M**.

---

## 3. Problema que resuelve 12N

| Situación | Riesgo |
|-----------|--------|
| La app **ya carga** en `client_crm` (12J-run) | Falsa sensación de “listo” |
| **Contadores en 0** o listas vacías | Cliente percibe CRM “roto” o inútil |
| **Datos heredados** de fábrica / pruebas | Confusión, nombres internos, `test/test2` |
| **Mezcla** de registros de otro cliente | Riesgo legal, operativo y reputacional |
| **Datos sensibles** sin autorización | Bloqueo de piloto / compliance |
| **Reportes** técnicamente OK pero **sin filas** | Parecen falla de producto |

**12N** alinea expectativas: separar **demo técnica** (vacío permitido) de **piloto de valor** (dataset mínimo documentado).

---

## 4. Principio de datos para piloto

> **El piloto debe tener pocos datos, limpios, explicables y seguros.**

| Principio | Significado en piloto |
|-----------|----------------------|
| **Pocos** | Dataset **mínimo** suficiente; no clonar base completa |
| **Limpios** | Sin basura heredada, duplicados obvios ni registros `test` |
| **Explicables** | Cada fila se puede narrar al cliente en la demo |
| **Seguros** | Sin sensibles no autorizados ni datos de otro cliente |
| **Útiles** | Alimentan **Leads**, **Agenda** y **Reportes** básicos |

---

## 5. Cliente piloto sugerido

| Campo | Valor sugerido |
|-------|----------------|
| **Cliente** | Pickup 4x4 |
| **Slug** | `pickup4x4` |
| **Módulos** | `leads87`, `agenda`, `reportes` |

### Aclaraciones

- Si se elige **otro cliente**, reutilizar los mismos criterios y completar plantilla §19.
- **No** asumir que Pickup 4x4 tiene datos definitivos ya cargados.
- **No** asumir que el dataset real de producción futura está limpio hoy.

---

## 6. Tipos de datos del piloto

| Entidad | Incluir piloto | Cantidad sugerida | Observaciones |
|---------|:--------------:|-------------------|---------------|
| **Leads** | ✅ Sí | **8–15** | Variedad de estados; nombres claros |
| **Empresas / contactos** | ✅ Sí | **5–10** | Vinculados a leads cuando aplique |
| **Actividades agenda** | ✅ Sí | **5–8** | Mezcla pendientes / vencidas / futuras |
| **Estados / pipeline** | ✅ Sí | Mínimo funcional | Alineados al proceso comercial del piloto |
| **Reportes** | ✅ Sí | — | Solo si hay datos que alimenten métricas |
| **Usuarios** | ✅ Pocos | 2–4 | Definidos en **12L**; no autogestión |
| **Servicios / rubros** | ⚠️ Condicional | Mínimo | Solo si catálogo ya está limpio |
| **Documentos / propuestas** | ❌ No por defecto | 0 | Riesgo comercial y técnico |
| **IA / generaciones** | ❌ No por defecto | 0 | Créditos, contrato, validación |
| **Importaciones masivas** | ❌ No | 0 | Primera carga controlada o semilla manual |
| **Datos financieros** | ❌ No | 0 | Fuera de alcance piloto 1 |
| **Integraciones externas** | ❌ No | 0 | Zeta/Kore/etc. |

---

## 7. Dataset mínimo recomendado

Ejemplo **conceptual** (sin SQL ni IDs reales). Ajustar etiquetas de estado al pipeline del tenant.

### Leads (8–15 registros sugeridos)

| # | Perfil conceptual | Estado / nota |
|---|-------------------|---------------|
| 1 | Lead **nuevo** | Recién ingresado |
| 2 | Lead **contactado** | Primer touch |
| 3 | Lead **interesado** | Avanza en embudo |
| 4 | Lead con **reunión agendada** | Vinculado a actividad agenda |
| 5 | Lead con **seguimiento pendiente** | Tarea próxima |
| 6 | Lead **perdido** | Con motivo documentado |
| 7 | Lead **ganado / cerrado** | Si el módulo lo soporta |
| 8+ | Variantes adicionales | Duplicar estados clave si faltan en reportes |

### Agenda (5–8 actividades)

| Tipo | Propósito en demo |
|------|-------------------|
| **Llamada** | Seguimiento comercial |
| **Reunión comercial** | Con lead asociado |
| **Tarea de seguimiento** | Post-contacto |
| **Recordatorio** | Fecha futura |
| **Vencida / pendiente** | Muestra agenda “activa” y reportes de pendientes |

Incluir **invitados** solo con usuarios piloto definidos (12L).

### Reportes — métricas simples esperadas

| Métrica | Origen conceptual |
|---------|-------------------|
| Total leads | Conteo listado |
| Leads por estado | Agrupación pipeline |
| Actividades pendientes | Agenda filtrada |
| Agenda semanal | Rango de fechas |
| Conversión simple | Solo si hay estados ganado/perdido con volumen |

---

## 8. Datos permitidos

| Categoría | Ejemplos |
|-----------|----------|
| Ficticios realistas | Empresas “Ejemplo S.A.”, nombres claramente de prueba |
| Reales autorizados y depurados | Con acta o email de aprobación interna |
| Contactos de prueba | Emails tipo `demo+cliente@dominio-acordado` |
| Empresas de ejemplo | Marcadas en nombre o nota interna |
| Leads reales | Solo con **autorización** explícita |
| Actividades no sensibles | Lugar genérico, notas operativas |
| Estados y etiquetas operativas | Alineados al negocio del piloto |
| Flujo demostrable | Lead → actividad → cambio de estado |

---

## 9. Datos prohibidos o no recomendados

| Categoría | Motivo |
|-----------|--------|
| Sensibles sin autorización | Legal / reputación |
| Datos de **otro** cliente | Mezcla multi-tenant |
| Emails personales reales sin permiso | Privacidad |
| Teléfonos reales no autorizados | Privacidad |
| Datos financieros reales | Alcance piloto |
| Zeta / Kore sin plan | Integración no validada |
| Excel completo sin depurar | Basura y duplicados |
| Históricos heredados mezclados | No explicables |
| Prompts IA / documentos privados | Fuga de IP o PII |
| Propuestas comerciales reales | Confidencialidad |
| Información médica / legal / PII sensible | Compliance |
| Usuarios internos Summer87 visibles al cliente | Confusión y seguridad |

---

## 10. Estrategias posibles

| Estrategia | Cuándo usarla | Ventajas | Riesgos |
|------------|---------------|----------|---------|
| **Dataset ficticio limpio** | Primer piloto, sin datos reales aprobados | Control total, reversible, explicable | Poco creíble si nombres absurdos |
| **Dataset real depurado** | Cliente aporta muestra acotada autorizada | Alta credibilidad | Privacidad, esfuerzo de depuración |
| **Dataset mixto** | Pocos reales + resto ficticio | Balance | Mezclar criterios de etiquetado |
| **Cero datos / demo técnica** | Solo validar 12J/12K/12M técnico | Rápido, sin riesgo PII | **No** piloto de valor comercial |
| **Importación controlada Excel** | Catálogo ya mapeado en staging | Escala moderada | Duplicados, columnas sucias |
| **Clon parcial datos reales** | Staging desde backup filtrado | Representativo | Mezcla, basura, sin backup |

### Recomendación 12N

Para el **primer piloto**: **dataset ficticio realista** o **real muy depurado** (muestra pequeña). **Nunca** base completa sin limpieza ni import masivo sin auditoría §11.

---

## 11. Checklist de auditoría de datos antes de cargar

Marcar **antes** de cualquier carga futura (cuando exista fase **12N-impl** aprobada):

- [ ] ¿Cada lead tiene **nombre** entendible?
- [ ] ¿Cada lead tiene **estado**?
- [ ] ¿Cada lead tiene **responsable** o asignación clara si aplica?
- [ ] ¿Emails/teléfonos son **reales autorizados** o claramente ficticios?
- [ ] ¿Hay datos de **otro** cliente?
- [ ] ¿Hay nombres internos Summer87 en campos visibles?
- [ ] ¿Hay basura (`test`, `test2`, `asdf`, `foo`)?
- [ ] ¿Hay **duplicados** obvios?
- [ ] ¿Hay **campos críticos** vacíos sin explicación?
- [ ] ¿Hay **agenda** asociada a algunos leads?
- [ ] ¿Los **reportes** tendrán algo que mostrar?
- [ ] ¿Se puede **explicar** cada registro al cliente?
- [ ] ¿Quedó marcado si los datos son **ficticios**?

---

## 12. Checklist de limpieza (conceptual)

**Sin SQL.** Proceso de decisión antes de borrar o reemplazar en fase futura:

| Paso | Acción conceptual |
|------|-------------------|
| 1 | Identificar registros de **prueba** |
| 2 | Identificar **duplicados** |
| 3 | Identificar datos **sensibles** |
| 4 | Identificar datos de **otros clientes** |
| 5 | Identificar **campos vacíos** críticos |
| 6 | Identificar **estados obsoletos** |
| 7 | Identificar **usuarios internos** visibles en listas |
| 8 | Identificar **reportes** que quedarían vacíos |
| 9 | Clasificar cada hallazgo: **borrar** / **ocultar** / **ignorar** / **reemplazar** |
| 10 | **No ejecutar** limpieza sin **backup** y confirmación explícita |

---

## 13. Checklist de semilla

Marcar al planificar o ejecutar semilla (fase futura con aprobación):

- [ ] Crear o definir **leads** mínimos (§7).
- [ ] Crear o definir **empresas/contactos** mínimos.
- [ ] Crear o definir **actividades** de agenda.
- [ ] Confirmar **estados/pipeline** operativos.
- [ ] Confirmar **reportes** básicos con datos.
- [ ] Confirmar **usuarios piloto** (12L).
- [ ] Confirmar que **no** se requiere IA.
- [ ] Confirmar que **no** se requiere email transaccional.
- [ ] Confirmar que **no** se requiere integración externa.
- [ ] Planificar **evidencias visuales** post-carga (§18).

---

## 14. Criterios de aceptación de datos

### GO datos (habilita avance en 12M / sesión cliente)

| Criterio | ☐ |
|----------|---|
| Suficientes datos para **demostrar valor** | |
| Sin datos sensibles **no autorizados** | |
| Sin **mezcla** de clientes | |
| Sin **basura** visible | |
| Reportes **no** parecen rotos por vacío total | |
| Cliente entiende si datos son **ficticios** | |
| Dataset **reversible** o descartable (staging/clon) | |
| Dataset **documentado** (§19) | |

### NO-GO datos

| Bloqueante | ☐ |
|------------|---|
| Datos de otro cliente | |
| Sensibles no autorizados | |
| Basura visible | |
| No se puede explicar el dataset | |
| Reportes parecen fallar por vacío | |
| Usuarios internos visibles al cliente | |
| Origen de datos **dudoso** | |
| Sin **responsable de datos** asignado | |

---

## 15. Relación con Supabase / BD

| Regla | Detalle |
|-------|---------|
| **12N no toca Supabase** | Este documento no abre panel ni API admin de datos |
| **12N no ejecuta SQL** | Sin scripts en repo como parte de 12N |
| **12N no crea migraciones** | Esquema fuera de alcance |
| Carga real futura | Solo con **respaldo**, **entorno definido** (staging/clon) y **aprobación** firmada |
| Scripts / seed | Si el equipo decide **12N-impl**, debe **avisar explícitamente** al responsable antes de aplicar cualquier cambio en BD |

---

## 16. Relación con Excel / importaciones

| Regla | Detalle |
|-------|---------|
| Excel completo | **No** en primer piloto sin depuración previa |
| Si se usa Excel | Mapear **columnas** → campos CRM |
| Validar | Duplicados, teléfonos, emails, estados |
| Consentimiento | Origen y autorización documentados |
| Entorno | **Staging/clon** antes que base madre |
| Trazabilidad | Nombre de archivo, fecha, responsable en §19 |

---

## 17. Relación con reportes

| Tema | Indicación |
|------|------------|
| Vacío vs error | Reportes sin filas pueden parecer **bug**; comunicar en demo |
| Demo de valor | Requiere datos §7 mínimos |
| Solo demo técnica | Aclarar al cliente: “validamos que carga, no el negocio aún” |
| Tres reportes mínimos sugeridos | (1) Leads por estado, (2) Actividades pendientes, (3) Resumen semanal agenda |
| BI avanzado | **No** prometer en piloto inicial |

---

## 18. Evidencias a capturar

Tras carga futura aprobada (12N-impl) o al validar dataset en staging:

- [ ] Listado de **leads**
- [ ] **Detalle** de un lead representativo
- [ ] **Agenda** con actividades
- [ ] **Reportes** con datos visibles
- [ ] Menú **reducido** `client_crm`
- [ ] Ausencia de datos **sensibles** en pantallas compartidas
- [ ] **`/403`** en rutas internas (referencia 12J)
- [ ] **Registro** del dataset usado (§19)
- [ ] **Fuente** de datos (ficticio / Excel / manual)
- [ ] **Responsable** que aprobó datos

---

## 19. Plantilla de dataset piloto

```text
Cliente:                      _______________________________
Slug:                         _______________________________
Responsable datos:            _______________________________
Fecha:                        _______________________________
Entorno:                      [ ] local  [ ] staging  [ ] clon
Fuente de datos:              [ ] ficticio  [ ] real  [ ] mixto  [ ] Excel
Tipo de dataset:              _______________________________
Cantidad leads:               _______________________________
Cantidad empresas/contactos:  _______________________________
Cantidad actividades:         _______________________________
Usuarios incluidos:           _______________________________
Datos ficticios/reales:       _______________________________
Autorización:                 _______________________________
Campos excluidos:             _______________________________
Datos sensibles eliminados:   [ ] N/A  [ ] Sí — cómo: ___________
Observaciones:                _______________________________
Aprobado por:                 _______________________________
Fecha aprobación:             _______________________________
```

**Estado actual (12N documental):** plantilla **sin completar** — no implica carga ejecutada.

---

## 20. Riesgos residuales

| Riesgo | Mitigación |
|--------|------------|
| Datos **insuficientes** para valor | Cumplir §7 y §14 |
| Datos ficticios **poco creíbles** | Nombres realistas + guion 12L §17 |
| Datos reales con **privacidad** | Autorización + staging |
| **Mezcla** accidental de clientes | Entorno aislado + auditoría §11 |
| Reportes **vacíos** | Semilla alineada a §17 |
| Campos **heredados** inconsistentes | Limpieza conceptual §12 |
| Estados/pipeline **desalineados** | Validar con responsable comercial |
| Sin **backup** antes de limpieza futura | Protocolo backup (referencia 11Q del proyecto) |
| Sin **responsable de datos** | Asignar en §19 |
| Sin **staging/clon** | **12O** antes de cliente |

---

## 21. Próximas fases

| Fase | Entregable |
|------|------------|
| **12O** | Validación staging/clon con evidencia (12J + datos) |
| **12P** | Plan deploy/rollback productivo |
| **12Q** | Manual breve usuario cliente |
| **12R** | Registro feedback piloto |
| **12N-impl** (futura) | Seed real o script de limpieza — **solo con aprobación explícita** y aviso previo |

**Orden sugerido:** completar §19 → aprobar GO datos §14 → (12N-impl si aplica) → 12O → piloto cliente (12R).

---

## 22. Confirmación de alcance (fase 12N documental)

- ✅ Plan de limpieza/semilla documentado  
- ❌ No se modificó código funcional  
- ❌ No se crearon archivos TypeScript  
- ❌ No se tocó `.env.local`  
- ❌ No se ejecutó SQL  
- ❌ No se creó SQL ejecutable  
- ❌ No se modificaron datos  
- ❌ No se borraron ni insertaron datos  
- ❌ No se tocó Supabase directamente  
- ❌ No se crearon endpoints  
- ❌ No se modificaron APIs  
- ❌ No se modificó middleware  
- ❌ No se hicieron migraciones  
- ❌ No se instaló CRM real  
- ❌ No se creó tenant  
- ❌ No se creó usuario  
- ❌ No se tocó Kore ni Zeta  
- ❌ No se afirma limpieza ejecutada, semilla aplicada ni dataset final listo  

---

*Documento 12N — limpieza y semilla de datos piloto `client_crm`. Condiciona GO datos en 12M. Ejecución en BD: fase **12N-impl** futura con aprobación explícita.*
