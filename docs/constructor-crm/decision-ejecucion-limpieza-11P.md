# Decisión de Ejecución Limpieza 11P — Base Madre Constructor CRM Summer87

**Versión:** Fase 11P (decisión humana — documental)  
**Fecha de decisión:** 2026-05-17  
**Responsable:** Daniel / Summer87  
**Relacionado con:** `docs/constructor-crm/sql-propuesto-limpieza-base-madre-L3.md`, `docs/constructor-crm/propuesta-limpieza-segura-L3.md`, `docs/constructor-crm/inventario-datos-base-madre-L1.md`, `docs/constructor-crm/ficha-bcr-pickup4x4.md`

**Estado:** decisión registrada. **No se ejecutó** limpieza en Supabase en esta fase.

---

## 2. Resumen ejecutivo

Existe **SQL propuesto y revisable** para una limpieza mínima de datos demo/test de la base madre (`sql-propuesto-limpieza-base-madre-L3.md`), alineado con la propuesta L3 y el inventario L1.

**En esta fase 11P se decide no ejecutar ninguna limpieza todavía.** El SQL queda disponible para una ejecución futura controlada, una vez validados **backup o snapshot** de Supabase y el **alcance final** (Bloque 3 solo, o Bloques 3 + 4).

Pickup 4x4 permanece **excluido** de cualquier limpieza; su aprendizaje ya está documentado en BCR.

---

## 3. Estado documental previo

| Entregable | Estado | Referencia |
|------------|--------|------------|
| Inventario L1 | ✅ Completado | `inventario-datos-base-madre-L1.md` |
| Propuesta L2 | ✅ Completada | `propuesta-limpieza-base-madre-L2.md` |
| Pickup 4x4 — caso semilla BCR | ✅ Documentado | `caso-semilla-pickup4x4-bcr.md` |
| Ficha BCR Pickup (A–T) | ✅ Creada | `ficha-bcr-pickup4x4.md` |
| Formato entrada BCR casos semilla | ✅ Creado | `formato-entrada-bcr-caso-semilla.md` |
| Propuesta L3 limpieza segura | ✅ Creada | `propuesta-limpieza-segura-L3.md` |
| SQL L3 propuesto (11O) | ✅ Creado, no ejecutado | `sql-propuesto-limpieza-base-madre-L3.md` |
| Repositorio (working tree) | ✅ Limpio al registrar 11P | Sin cambios pendientes en `git status` al cierre de esta fase documental |

**Base de datos (L1, sin re-ejecutar en 11P):** proyecto Supabase **summer87-leads-v3**, entorno visible **main / PRODUCTION**; 4 drafts, 3 snapshots, 1 meeting decision, 2 leads de prueba, 18 pipelines, 1 `crm_setup_config`, 1 `app_users`.

---

## 4. Opciones evaluadas

### Opción A — No ejecutar nada por ahora

- **Descripción:** Conservar todos los datos actuales en la base madre, incluidos leads de prueba y draft rechazado.
- **Ventajas:** Cero riesgo operativo; evidencia Pickup intacta en BD; tiempo para backup y staging.
- **Desventajas:** La base sigue sin estar «virgen» en leads y un draft rechazado.

### Opción B — Ejecutar solo limpieza de los 2 leads de prueba

- **Descripción:** Aplicar únicamente **Bloque 3** del SQL propuesto («Prueba Seguimiento Pickup», «Prueba Pickup 4x4»).
- **Ventajas:** Limpieza acotada del módulo leads; no toca Instalador ni Pickup.
- **Desventajas:** Requiere backup y SELECTs del día; sigue quedando draft rechazado y genéricos.

### Opción C — Ejecutar limpieza de 2 leads + draft rechazado «prueba»

- **Descripción:** **Bloques 3 + 4** — leads de prueba + draft `6f956975-8aac-4016-a982-29db70eb1b5e`.
- **Ventajas:** Limpieza segura mínima según L3; drafts pasan de 4 a 3; snapshots y meeting decision Pickup sin cambio.
- **Desventajas:** Requiere misma disciplina de backup y verificación; entorno production.

### Opción D — Probar primero en staging / snapshot

- **Descripción:** Clonar proyecto o restaurar snapshot; ejecutar Bloques 3 y/o 4 allí antes que en production.
- **Ventajas:** Valida SELECTs, RETURNING y app sin tocar production.
- **Desventajas:** Requiere tiempo de preparación de entorno paralelo.

### Opción E — Esperar a tener backup validado

- **Descripción:** No ejecutar hasta confirmar backup descargable o PITR/snapshot Supabase probado.
- **Ventajas:** Alineado con principios L3; reduce riesgo irreversible.
- **Desventajas:** Posterga limpieza (aceptable dado bajo impacto actual).

---

## 5. Decisión recomendada

| Aspecto | Recomendación |
|---------|----------------|
| **Ejecutar limpieza ahora** | **No** |
| **Primer paso** | Confirmar **backup o snapshot** de Supabase (fase 11Q sugerida) |
| **Segundo paso** | Decidir alcance: **solo Bloque 3** o **Bloques 3 + 4** |
| **Genéricos (Bloque 5)** | No autorizar hasta revisión aparte |
| **Pickup** | Siempre excluido |

La opción **A + E** (no ejecutar ahora; esperar backup) es la postura recomendada para esta fase. Tras 11Q, **C** es la limpieza segura preferida si los SELECTs del día coinciden con L1; **B** si se prefiere el paso más conservador.

---

## 6. Motivo de la recomendación

- El entorno observado en inventario L1 es **main / PRODUCTION** — conviene máxima cautela.
- La base está **bastante limpia** en volumen (0 empresas, 0 imports, 1 admin); solo hay ruido acotado (2 leads, 1 draft rechazado, 2 drafts genéricos).
- **No hay urgencia operativa** para virgenizar la madre hoy: no hay clon `pickup4x4-crm-v1` bloqueado por esos leads.
- **Pickup 4x4** ya está **protegido documentalmente** (caso semilla + ficha BCR); el riesgo de perder aprendizaje es bajo, pero no hay beneficio inmediato en borrar demo.
- **Esperar** tiene **riesgo bajo** (datos de prueba no afectan producción de clientes).
- **Ejecutar sin backup verificado** introduce riesgo **innecesario** para un beneficio marginal.
- La limpieza puede hacerse **más adelante** con backup, SELECTs actualizados y documento L4 de resultados.

---

## 7. Bloques autorizables en el futuro

Solo tras cumplir condiciones §8 y confirmación explícita de Daniel.

| Bloque | Contenido | Autorización actual |
|--------|-----------|---------------------|
| **Bloque 3** | Eliminar 2 leads: «Prueba Seguimiento Pickup», «Prueba Pickup 4x4» | ⏳ Autorizable **en futuro** (no ahora) |
| **Bloque 4** | Eliminar draft rechazado `6f956975-8aac-4016-a982-29db70eb1b5e` (`rejection_reason: prueba`) | ⏳ Autorizable **en futuro** junto o después de Bloque 3 |
| **Bloque 5** | Drafts genéricos `defe6513…`, `d77f2e3e…` (+ 2 snapshots en defe6513) | ❌ **No autorizado** — pendiente decisión si son ruido o aprendizaje |
| **Pickup** | Draft `0fa4f061…`, meeting `9c04f4a5…`, snapshot asociado | ❌ **Excluido permanentemente** de limpieza L3 |
| **app_users** | Daniel Admin | ❌ **Excluido** |
| **leads_pipelines** | 18 etapas | ❌ **Excluido** |
| **crm_setup_config** | 1 fila setup/auditoría | ❌ **Excluido** (decisión funcional aparte) |

Referencia técnica: `sql-propuesto-limpieza-base-madre-L3.md` (Bloques 0–7).

---

## 8. Condiciones obligatorias antes de ejecutar

Cuando se autorice ejecución (fase posterior a 11P):

1. **Backup o snapshot** de Supabase verificado (descarga o restauración de prueba).
2. **Entorno confirmado** — proyecto `summer87-leads-v3`, no otro.
3. **SELECTs previos** del SQL propuesto ejecutados el **mismo día**; resultados anotados.
4. Resultados **coinciden con inventario L1** (conteos y IDs; si no, actualizar docs antes de DELETE).
5. **Daniel confirma por escrito** qué bloques: 3, 4, o ambos — no genéricos sin anexo nuevo.
6. **No usar «Run All»** en SQL Editor.
7. **Ejecutar por bloques**, con `COMMIT` solo tras validar `RETURNING`.
8. **Documentar resultado posterior** (L4: conteos después, checklist app Bloque 7).

---

## 9. Decisión actual

> **En esta fase 11P se decide no ejecutar limpieza todavía.**  
> El SQL queda documentado en `sql-propuesto-limpieza-base-madre-L3.md` para revisión y ejecución futura controlada.

| Campo | Valor |
|-------|--------|
| **Opción adoptada** | A (no ejecutar) + E (esperar backup) |
| **Bloques ejecutados** | Ninguno |
| **Fecha efectiva** | 2026-05-17 |
| **Aprobado por** | Daniel / Summer87 (registro documental 11P) |

---

## 10. Próxima fase sugerida

### Recomendación: Fase 11Q — Validación de backup / snapshot Supabase antes de limpieza

| Objetivo | Entregable sugerido |
|----------|---------------------|
| Crear o verificar backup del proyecto summer87-leads-v3 | Checklist: snapshot PITR, export lógico, o proyecto clon |
| Documentar fecha, método y ubicación del backup | `docs/constructor-crm/backup-validado-11Q.md` (nombre sugerido) |
| Opcional: entorno staging para Opción D | Misma secuencia Bloque 0–2 sin DELETE en production |

### Alternativa (solo tras 11Q cerrado)

**Fase 11Q-bis — Ejecución controlada de limpieza mínima**

- Ejecutar Bloque 3 y/o 4 según decisión explícita post-backup.
- Registrar resultados en **L4**.

**No se recomienda** saltar directamente a ejecución en production sin 11Q.

---

## 11. Confirmación de alcance (fase 11P)

En la fase que produce este documento:

- ✅ Decisión humana y recomendación documentadas
- ❌ No se ejecutó SQL
- ❌ No se borraron datos
- ❌ No se modificaron datos
- ❌ No se tocó Supabase
- ❌ No se crearon endpoints
- ❌ No se crearon scripts ejecutables
- ❌ No se hicieron migraciones
- ❌ No se instaló CRM
- ❌ No se creó tenant
- ❌ No se creó usuario
- ❌ No se tocó Kore ni Zeta
- ❌ No se modificó código funcional

---

*Decisión 11P — Limpieza base madre pospuesta. SQL L3 listo para uso futuro con backup y alcance confirmado.*
