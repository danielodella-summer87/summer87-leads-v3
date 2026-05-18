# Dataset Ficticio Pickup 4x4 12N-real — Constructor CRM Summer87

**Versión:** 12N-real — diseño de dataset ficticio (documentación)  
**Relacionado con:**

| Documento | Rol |
|-----------|-----|
| `limpieza-semilla-datos-piloto-12N.md` | Marco general de datos piloto |
| `decision-entorno-vercel-client-crm-12O-prep-run.md` | Demo interna; Supabase actual |
| `checklist-go-no-go-primer-cliente-12M.md` | GO condicionado a datos |

**Contexto opcional:** demo interna Pickup 4x4 en hosting temporal (sin afirmar carga de datos).

**Estado:** diseño **documentado**. **No** constituye carga ejecutada, SQL, cambios en Supabase ni dataset ya aplicado.

---

## 2. Resumen ejecutivo

Este documento **diseña** un dataset **ficticio y controlado** para que la **demo interna** Pickup 4x4 en Vercel tenga **valor visual y narrativo** en Dashboard, Leads, Agenda y Reportes.

| Afirmación | Detalle |
|------------|---------|
| Qué es | Insumo conceptual para una futura **12N-impl** (si el equipo la aprueba) |
| Qué **no** es | Ejecución de carga, limpieza ni semilla en base de datos |
| Entorno actual | Supabase **actual** solo para demo técnica; pantallas pueden estar vacías o con datos heredados |
| Datos | **100 % ficticios**; sin personas reales ni secretos |

**No se afirma:** producción, Supabase separado, piloto con cliente real ni autorización de datos comerciales reales.

---

## 3. Objetivo del dataset

| # | Objetivo |
|---|----------|
| 1 | **Evitar** pantallas vacías que resten credibilidad en demo interna |
| 2 | Mostrar un **flujo comercial** entendible (captación → seguimiento → cierre) |
| 3 | **Alimentar** Leads, Agenda y Reportes con volumen pequeño y coherente |
| 4 | **Evitar** datos sensibles y datos de otros clientes |
| 5 | Permitir **narrar** la demo de punta a punta en 15–25 minutos |

---

## 4. Principios del dataset

| Principio | Aplicación |
|-----------|------------|
| **Ficticio** | Nombres, empresas y contactos inventados; marcado `[DEMO]` |
| **Pequeño** | 10–12 leads, 6–8 actividades; fácil de revisar y borrar |
| **Explicable** | Cada registro tiene nota comercial breve |
| **Comercialmente realista** | Rubro accesorios / equipamiento pickup 4x4 |
| **Seguro** | Sin PII real; emails solo `@example.com` |
| **Reversible** | Diseñado para poder eliminar o aislar por tags/origen demo |
| **Marcado como demo** | Convención §12 en nombres y notas |
| **Sin datos personales reales** | Prohibido §11 |
| **Sin integraciones externas** | No Zeta/Kore/emails masivos |
| **Sin IA** | No generar propuestas ni contenido automático en la carga |

---

## 5. Alcance funcional

| Módulo | Qué debe mostrar en demo | Datos requeridos (conceptual) |
|--------|--------------------------|------------------------------|
| **Dashboard** | Resumen no vacío; sensación de actividad | Conteos derivados de leads y agenda |
| **Leads** | Listado con estados variados; detalle usable | 10–12 oportunidades ficticias §8 |
| **Agenda** | Pendientes, vencidas y futuras | 6–8 actividades §9 |
| **Reportes** | Distribución por estado; actividad mínima | Agregados de §8 y §9 |
| **Owners / invitados** | Responsable en actividades | Usuario existente (Daniel) o owner ya en BD |
| **Estados / pipeline** | Embudo legible | Mapeo a estados **reales** de la app §7 |
| **Empresas / contactos** | Contexto en detalle de lead | 4–6 entidades ficticias reutilizadas en leads |

---

## 6. Volumen recomendado

| Entidad | Cantidad | Nota |
|---------|----------|------|
| Leads ficticios | **10 a 12** | Tabla §8 (12 filas propuestas) |
| Actividades agenda | **6 a 8** | Tabla §9 (8 filas propuestas) |
| Empresas / contactos ficticios | **4 a 6** | Reutilizados entre leads |
| Estados de pipeline distintos en uso | **3 a 5** | Subconjunto de §7 mapeado a BD |
| Usuarios / owners nuevos | **0** en esta fase | Usar responsables **ya existentes** |

| Regla | Detalle |
|-------|---------|
| Responsable demo | **Daniel** / usuario actual si ya existe en `app_users` |
| Sin owners adecuados | Mismo criterio: no crear usuarios en **12N-real** |
| Creación de usuarios | Solo en **12N-impl** futura, con procedimiento aparte |

---

## 7. Estados sugeridos para leads

Estados **conceptuales** para diseño (español claro):

| Estado sugerido | Uso en narrativa demo |
|-----------------|----------------------|
| Nuevo | Lead recién ingresado |
| Contactado | Primer contacto hecho |
| Interesado | Calificado con intención |
| Reunión agendada | Actividad tipo reunión vinculada |
| Cotización enviada | Propuesta ficticia enviada |
| Ganado | Cierre positivo (1–2 casos) |
| Perdido | Cierre negativo (1–2 casos) |

### Regla crítica antes de cargar

> **Mapear** cada estado sugerido a un **estado real** existente en la app (tabla/config de pipeline).  
> **Si no existe** el estado en BD/config → **no inventar IDs** en carga; ajustar diseño o crear estado por proceso formal fuera de este documento.

---

## 8. Dataset conceptual de leads

**12 leads ficticios** — rubro accesorios y equipamiento para pickup 4x4. Emails solo formato `demo+pickupNNN@example.com`.

| ID demo | Nombre oportunidad | Empresa ficticia | Contacto ficticio | Rubro / segmento | Interés | Estado sugerido | Prioridad | Próxima acción | Nota comercial | Sensibilidad |
|---------|------------------|------------------|-------------------|--------------------|---------|-----------------|-----------|----------------|----------------|--------------|
| L01 | Demo — Lona marítima Hilux | Ficticio Transportes Sur S.A. | Ana Ficticia Demo | Flota utilitaria | Lona marítima | Nuevo | Alta | Llamar presentación | [DEMO] Consulta Toyota Hilux doble cabina | Baja |
| L02 | Demo — Barra antivuelco Ranger | Ficticio Agro Norte Demo | Bruno Ficticio Demo | Agro / campo | Barra antivuelco | Contactado | Media | Enviar catálogo PDF ficticio | [DEMO] Ford Ranger 2022 equipamiento | Baja |
| L03 | Demo — Estribos Frontier | Ficticio Construcción Este Demo | Carla Ficticio Demo | Construcción liviana | Estribos laterales | Interesado | Alta | Agendar visita showroom | [DEMO] Nissan Frontier flota 3 unidades | Baja |
| L04 | Demo — Defensa frontal S10 | Ficticio Logística Río Demo | Diego Ficticio Demo | Logística | Defensa frontal | Reunión agendada | Alta | Reunión demo interna | [DEMO] Chevrolet S10 protección frontal | Baja |
| L05 | Demo — Cobertor de caja Amarok | Ficticio Turismo Patagonia Demo | Elena Ficticio Demo | Turismo / rental | Cobertor rígido | Cotización enviada | Media | Seguimiento cotización | [DEMO] VW Amarok rental temporada | Baja |
| L06 | Demo — Kit accesorios flota | Ficticio Minería Andina Demo | Ficticio Contacto Flota | Minería (ficticia) | Pack flota 8 pickups | Interesado | Alta | Cotización volumen ficticia | [DEMO] Equipamiento flota mixta Hilux/Ranger | Baja |
| L07 | Demo — Portaequipaje techo | Ficticio Familia Viajera Demo | Franco Ficticio Demo | Consumo final | Portaequipaje | Contactado | Baja | WhatsApp ficticio (nota manual) | [DEMO] No integración real WhatsApp | Baja |
| L08 | Demo — Enganche y luces | Ficticio Servicios Urbanos Demo | Gloria Ficticio Demo | Servicios municipales | Enganche + luces LED | Nuevo | Media | Calificar necesidad | [DEMO] Hilux municipio ficticio | Baja |
| L09 | Demo — Interior cuero sintético | Ficticio Premium Motors Demo | Hugo Ficticio Demo | Concesionario ficticio | Tapizado interior | Perdido | Baja | Archivar motivo | [DEMO] Perdido por precio — aprendizaje | Baja |
| L10 | Demo — Snorkel + filtro | Ficticio Aventura 4x4 Demo | Iris Ficticio Demo | Off-road recreativo | Snorkel | Ganado | Media | Onboarding postventa ficticio | [DEMO] Cierre positivo Ranger | Baja |
| L11 | Demo — Lona + estribos combo | Ficticio Comercial Centro Demo | Juan Ficticio Demo | Comercio regional | Combo accesorios | Cotización enviada | Alta | Confirmar medidas caja | [DEMO] S10 cliente recurrente ficticio | Baja |
| L12 | Demo — Consulta genérica accesorios | Ficticio Pickup Accesorios Demo | Kim Ficticio Demo | Retail accesorios | Varios | Nuevo | Baja | Clasificar rubro | [DEMO] Lead web formulario ficticio | Baja |

**Email ficticio sugerido (patrón):** `demo+pickup001@example.com` … `demo+pickup012@example.com` (uno por lead si el modelo lo requiere).

---

## 9. Dataset conceptual de agenda

**8 actividades ficticias** — fechas **relativas** (resolver a fecha absoluta solo al cargar en **12N-impl**).

| ID demo | Tipo | Título | Lead relacionado | Fecha relativa | Responsable sugerido | Estado | Objetivo | Nota |
|---------|------|--------|------------------|----------------|----------------------|--------|----------|------|
| A01 | Llamada | Demo — Seguimiento lona Hilux | L01 | Hoy | Daniel | Pendiente | Confirmar medidas caja | [DEMO] Llamada seguimiento |
| A02 | Reunión | Demo — Reunión comercial defensa S10 | L04 | Mañana | Daniel | Pendiente | Mostrar opciones defensa | [DEMO] Reunión showroom ficticia |
| A03 | Tarea | Demo — Revisar cotización Amarok | L05 | En 3 días | Daniel | Pendiente | Validar descuento ficticio | [DEMO] Revisión cotización |
| A04 | Llamada | Demo — Recordatorio vencido Frontier | L03 | Hace 2 días | Daniel | Vencida | Recuperar contacto | [DEMO] Recordatorio vencido |
| A05 | Reunión | Demo — Visita showroom estribos | L03 | Próxima semana | Daniel | Pendiente | Cierre técnico estribos | [DEMO] Visita showroom ficticia |
| A06 | Tarea | Demo — Seguimiento post-cotización combo | L11 | En 3 días | Daniel | Pendiente | Confirmar aprobación interna ficticia | [DEMO] Post-cotización |
| A07 | Llamada | Demo — Cierre perdido snorkel competencia | L09 | Hace 2 días | Daniel | Completada | Registrar motivo pérdida | [DEMO] Cierre perdido / aprendizaje |
| A08 | Tarea | Demo — Onboarding ganado snorkel | L10 | Mañana | Daniel | Pendiente | Coordinar instalación ficticia | [DEMO] Post-venta ganado |

---

## 10. Dataset conceptual para reportes

| Métrica | Cómo se alimenta | Resultado esperado en demo |
|---------|------------------|----------------------------|
| **Total leads** | Conteo de §8 (12) | Número visible > 0 |
| **Leads por estado** | Distribución según §7 mapeado | Gráfico/tabla con 3–5 estados |
| **Actividades pendientes** | A01, A02, A03, A05, A06, A08 | Lista agenda con futuro |
| **Actividades vencidas** | A04 (y opcional A07 si se marca vencida) | Señal de seguimiento atrasado |
| **Leads con reunión** | L04 + A02; L03 + A05 | Al menos 2 casos vinculados |
| **Leads ganados / perdidos** | L10 ganado; L09 perdido | Cierres para narrar embudo |
| **Pipeline simple** | Estados Nuevo → … → Ganado/Perdido | Embudo legible en UI |
| **Reporte semanal básico** | Actividades de la semana relativa | Actividad no cero si el reporte lo expone |

---

## 11. Datos prohibidos

No incluir en diseño ni en futura carga:

| Categoría | Ejemplos prohibidos |
|-----------|---------------------|
| Clientes reales | Nombres, empresas o contactos reales sin autorización |
| Teléfonos reales | Cualquier número móvil/fijo real |
| Emails personales reales | Dominios corporativos o personales reales |
| RUT / documentos | Identificación fiscal o personal |
| Datos financieros reales | Montos de operaciones reales, CBU, tarjetas |
| Historial real de ventas | Exportaciones de ERP/Excel reales |
| **Zeta / Kore** | Cualquier dato de integraciones |
| Otro cliente | Registros de otro tenant o piloto |
| Propuestas comerciales reales | PDFs, Gamma, contratos reales |
| Prompts / secretos internos | IA, API keys, tokens |
| Cualquier secreto | Credenciales, URLs con keys |

---

## 12. Convención de marcado demo

| Regla | Ejemplo |
|-------|---------|
| Nombres de oportunidad | Prefijo **«Demo —»** o sufijo **«(Ficticio)»** |
| Notas | Incluir **`[DEMO]`** al inicio |
| Emails | Solo `demo+pickupNNN@example.com` |
| Dominios | **No** usar dominios reales de empresas uruguayas o del cliente |
| Campo **origen** (si existe) | `demo_12N_pickup4x4` |
| Campo **tags** (si existe) | `demo`, `pickup4x4`, `12N` |
| Empresas | Incluir **«Ficticio»** o **«Demo»** en razón social |

---

## 13. Estrategia de aplicación futura (12N-impl)

| Opción | Descripción | Riesgo |
|--------|-------------|--------|
| **A — Carga manual UI** | Crear leads/actividades en Vercel demo | Bajo volumen; lento; trazable |
| **B — SQL controlado** | Scripts en Supabase SQL Editor | Medio/alto sin backup y sin revisión |
| **C — Script seed temporal** | Script one-off en repo (futuro) | Medio; requiere revisión de código |
| **D — CSV / importación** | Si existe módulo seguro y acotado | Medio; validar mapeo de columnas |

**Recomendación:** antes de **12N-impl**, **auditar schema y campos reales** (leads, agenda, estados, FKs). **No** ejecutar carga automática sin esa auditoría.

**Este documento no incluye SQL.**

---

## 14. Precondiciones antes de aplicar dataset

- [ ] Confirmar **tablas y campos** reales (leads, contactos, agenda, estados).
- [ ] Confirmar **estados/pipeline** existentes y tabla de mapeo §7.
- [ ] Confirmar **usuario responsable** existente (Daniel u otro owner válido).
- [ ] Confirmar **entorno** = Vercel demo (`pickup4x4-crm-demo`) y Supabase objetivo.
- [ ] Confirmar **backup** o plan de rollback (12P / snapshot Supabase).
- [ ] Confirmar alcance = **demo interna** (no cliente final).
- [ ] Confirmar **no** hay mezcla con datos reales no autorizados (auditoría 12N).
- [ ] Confirmar **método de carga** (A/B/C/D).
- [ ] Confirmar **no** se usarán secretos en scripts ni tickets.
- [ ] Confirmar **no** se tocará Zeta/Kore.

---

## 15. Validaciones después de aplicar dataset (futuro 12N-impl)

| Validación | Criterio |
|------------|----------|
| Dashboard | No vacío; contadores coherentes con §6 |
| Leads | **10–12** registros visibles; reconocibles como demo |
| Agenda | **6–8** actividades; pendientes y al menos 1 vencida |
| Reportes | Información mínima según §10 |
| Menú | **Sin** Constructor ni Configuración |
| APIs críticas | Siguen **403** en modo `client_crm` |
| Datos | Etiquetas `[DEMO]` / tags visibles o en notas |
| Sensibles | **Sin** PII real ni datos de otro cliente |
| Vercel | Revalidar URL demo tras carga |

---

## 16. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Cargar en **entorno equivocado** | Checklist §14; confirmar URL y proyecto Supabase |
| **Mezclar** con datos reales | Auditoría previa; tags demo; Supabase separado a futuro |
| Datos **difíciles de borrar** | Volumen pequeño; convención tags; plan rollback |
| **Reportes rotos** por campos incorrectos | Auditoría schema antes de carga |
| Registros **sin relación válida** | Validar FK lead ↔ agenda en impl |
| **Estados inexistentes** | Mapeo §7; no inventar IDs |
| **Responsable inexistente** | Usar solo users existentes |
| **SQL sin rollback** | Backup; no ejecutar desde este doc |
| Confundir demo con **piloto real** | Comunicación interna; 12M sin GO cliente hasta datos OK |

---

## 17. Dictamen

> **GO** para **diseñar** dataset ficticio **12N-real** (este documento).  
> **NO-GO** para **aplicar** datos hasta **auditar schema/campos reales** y **definir método de carga** (**12N-impl**).

---

## 18. Próximo paso recomendado

| Orden | Acción |
|-------|--------|
| 1 | **Auditar** schema real de leads, agenda y reportes (**solo lectura**; sin modificar datos) |
| 2 | Definir **método de carga** para **12N-impl** (recomendación inicial: UI manual o SQL revisado) |
| 3 | Si SQL: redactar script **revisable** en fase aparte — **no** ejecutar automáticamente |
| 4 | Si UI: preparar checklist manual por registro (§8–§9) |
| 5 | Tras carga: **revalidar** demo interna en hosting (menú, 403, APIs, §15) con dataset visible |
| 6 | Actualizar **12M** solo si demo interna alcanza “piloto de valor” acordado |

---

## 19. Confirmación de alcance

| Ítem | Estado |
|------|--------|
| Código funcional | **No** modificado |
| Archivos TypeScript | **No** creados |
| `.env.local` | **No** tocado |
| SQL ejecutable | **No** creado en este documento |
| SQL ejecutado | **No** |
| Supabase | **No** tocado |
| Datos insertados / modificados / borrados | **No** |
| Endpoints / APIs / middleware | **No** modificados |
| Migraciones | **No** |
| Usuarios creados | **No** |
| Kore / Zeta | **No** tocados |
| Commits | **No** realizados en esta acción |
| Entregable | Solo `dataset-ficticio-pickup4x4-12N-real.md` |

**No se afirma** que el dataset ya fue aplicado en `pickup4x4-crm-demo`.

---

*Documento 12N-real — diseño dataset ficticio Pickup 4x4. Siguiente: auditoría schema + **12N-impl** (si se aprueba).*
