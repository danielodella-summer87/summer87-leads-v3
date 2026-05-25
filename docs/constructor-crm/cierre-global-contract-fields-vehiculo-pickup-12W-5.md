# Cierre Global contract_fields vehiculo Pickup 12W-5 - Constructor CRM Summer87

**Version:** cierre global 12W-5  
**Proyecto:** summer87-leads-v3  
**Estado:** cierre documental global de cadena implementada y validada  
**Alcance de este documento:** consolidacion final de decisiones, commits, QA, datos y proximo paso

---

## 1. Resumen ejecutivo

- La cadena **12W-5** queda **funcionalmente cerrada**.
- Pickup ya puede **crear, persistir, leer, mostrar, editar, agregar y eliminar** campos de vehiculo via `contract_fields_json`.
- No se usaron columnas Pickup dedicadas en `public.leads`.
- No se guardo vehiculo en `notas` ni en `oferta`.
- La estrategia **JSONB** queda validada **end-to-end**.
- **Dictamen:** **GO** cierre **12W-5**.

---

## 2. Decision arquitectonica final

| Decision | Cierre final |
|----------|--------------|
| Persistencia | `public.leads.contract_fields_json jsonb NOT NULL DEFAULT '{}'::jsonb` |
| Modelo | Claves planas alineadas al contrato Pickup |
| API | Entrada/salida via `contract_fields` y `contract_fields_json` |
| Validacion | Whitelist desde `packageToLeadFields()` con fallback `pickup4x4.config.ts` |
| UI Nuevo Lead | Envia `marca`, `modelo`, `año`, `matricula`, `tipo_uso` |
| Ficha Lead | Muestra, edita, agrega y elimina campos de vehiculo |
| EAV | Postergado a **12X+** |
| Columnas dedicadas Pickup | **NO-GO** |
| Notas/oferta como parche | **NO-GO** |

---

## 3. Campos vehiculo cerrados en 12W-5

| Campo | Clave persistida | Destino | Estado |
|-------|------------------|---------|--------|
| Marca | `marca` | `contract_fields_json` | GO |
| Modelo | `modelo` | `contract_fields_json` | GO |
| Año | `año` | `contract_fields_json` | GO |
| Matricula | `matricula` | `contract_fields_json` | GO |
| Tipo de uso | `tipo_uso` | `contract_fields_json` | GO |

---

## 4. Cadena de fases y commits

| Fase | Commit | Entregable | Estado |
|------|--------|------------|--------|
| 12W-5d | `e7a7cae` | Decision de persistencia JSONB y NO-GO de columnas/EAV/parches | GO |
| 12W-5d-SCHEMA-1 | `3343468` / `eb8823d` | Inspeccion read-only y confirmacion de ausencia de `contract_fields_json` | GO |
| 12W-5d-SQL-1 | `00a0028` | Diseño DDL + PRECHECK/POSTCHECK + rollback | GO |
| 12W-5d-SQL-2 | `2637bb0` | Ejecucion manual DDL y POSTCHECK OK | GO |
| 12W-5e | `87922eb` | API POST/GET con soporte `contract_fields_json` | GO |
| 12W-5f | `69fa3c2` | Nuevo Lead envia vehiculo en `contract_fields` | GO |
| 12W-5-QA | `6a1188e` | Alta controlada + GET y Supabase validan persistencia | GO |
| 12W-5g | `5dbcb82` | Ficha muestra vehiculo desde `contract_fields_json` | GO |
| 12W-5g-QA | `16f53b7` | Validacion visual en Vercel de lectura en ficha | GO |
| 12W-5h | `2344c81` | Edicion de vehiculo desde ficha via PATCH merge | GO |
| 12W-5h-QA | `b021e6c` | Edicion de matricula y GET validado | GO |
| 12W-5i | `30c69e5` | Agregar vehiculo desde ficha cuando no hay datos | GO |
| 12W-5i-QA | `8517870` | Agregado desde ficha y GET validado | GO |
| 12W-5j-QA | `ce2d222` | Eliminacion parcial y total con retorno a "Agregar vehiculo" | GO |

---

## 5. Flujo funcional validado

1. **Crear lead desde Nuevo Lead con vehiculo.**  
   El formulario Pickup envia `contract_fields` con `marca`, `modelo`, `año`, `matricula` y `tipo_uso`.
2. **GET API devuelve `contract_fields_json`.**  
   La API lista/detalle ya expone los datos persistidos del vehiculo.
3. **Ficha muestra vehiculo.**  
   La tab `Datos` renderiza el bloque `Vehiculo` cuando existen claves de vehiculo.
4. **Ficha edita vehiculo.**  
   La edicion actualiza solo las claves enviadas y preserva el resto.
5. **Ficha agrega vehiculo si no existe.**  
   Un lead sin datos muestra estado vacio accionable con boton `Agregar vehiculo`.
6. **Ficha elimina campos parciales.**  
   Si una clave se envia vacia, se elimina solo esa clave del JSONB.
7. **Ficha elimina todos los campos y vuelve a "Agregar vehiculo".**  
   La eliminacion total deja `contract_fields_json = {}` y la UI vuelve al estado vacio validado.

---

## 6. Evidencias QA

| Evidencia | Lead / identificador | Validacion cerrada |
|-----------|----------------------|--------------------|
| Lead QA Toyota Hilux | `c17d12fc-352b-4d6c-931c-b5ab2139f0e6` | Valido creacion, persistencia, lectura en ficha y edicion de matricula final `QA1234-H` |
| Lead QA Ford Ranger | `f069d260-c56a-4bc3-baf0-ae19f7163272` | Valido agregar vehiculo desde ficha, eliminacion parcial y eliminacion total |
| GET API final Toyota | `qa_12w5` / lead Toyota | `contract_fields_json` final: Toyota / Hilux / 2022 / `QA1234-H` / `trabajo` |
| GET API final Ford tras eliminacion total | `qa_12w5i` / lead Ford | `contract_fields_json = {}` |

### Snapshot final esperado

**Toyota Hilux**

```json
{
  "año": 2022,
  "marca": "Toyota",
  "modelo": "Hilux",
  "tipo_uso": "trabajo",
  "matricula": "QA1234-H"
}
```

**Ford Ranger tras eliminacion total**

```json
{}
```

---

## 7. Estado final del producto

| Capacidad | Estado |
|-----------|--------|
| Nuevo Lead con vehiculo | GO |
| Persistencia JSONB | GO |
| GET lista/detalle | GO |
| Ficha lectura | GO |
| Ficha edicion | GO |
| Ficha agregar cuando no hay datos | GO |
| Eliminacion parcial | GO |
| Eliminacion total | GO |
| Reportes por vehiculo | Pendiente 12W-6 |
| Kanban mostrando vehiculo | Pendiente |
| Indices por marca/modelo | Pendiente si reporting lo exige |

---

## 8. NO-GO mantenidos

- No columnas `marca` / `modelo` / `año` / `matricula` / `tipo_uso` en `leads`.
- No guardar vehiculo en `notas` ni `oferta`.
- No EAV para el piloto.
- No Zeta/Kore.
- No `stage_key` en POST.
- No indices nuevos por ahora.
- No reportes dentro de 12W-5.

---

## 9. Riesgos y observaciones

- `contract_fields_json` es flexible; la calidad final depende de la whitelist y de la UI.
- Si escalan reportes o filtros, hara falta formalizar query contract e indices especificos.
- Los datos QA quedan en produccion demo y deben distinguirse por nombre/origen `qa_12w5` y `qa_12w5i`.
- La eliminacion total deja JSONB en `{}`; ese comportamiento ya quedo validado.

---

## 10. Proximo paso recomendado

**Propuesta principal:** **12W-6 - Reportes/filtros por vehiculo**.

| Subfase sugerida | Alcance |
|------------------|---------|
| 12W-6a | Diseño de reportes y filtros por `marca`, `modelo`, `tipo_uso` |
| 12W-6b | UI Lista/Kanban con badge de vehiculo |
| 12W-6c | Reporte de leads por `marca` / `modelo` |
| 12W-6d | Evaluar indice por `marca` si hay uso real |
| 12W-6-QA | Validacion Vercel end-to-end |

**Alternativa previa:** si se quiere limpiar primero la demo QA, abrir una fase **12W-5-cleanup** documentada y controlada.

---

## 11. Dictamen final

| Criterio | Dictamen |
|----------|----------|
| Cierre funcional 12W-5 | GO |
| Cierre QA 12W-5 | GO |
| Pasar a 12W-6 | GO |
| DDL adicional ahora | NO-GO |
| Refactor EAV ahora | NO-GO |

---

## 12. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado en este cierre | No |
| SQL ejecutado en este cierre | No |
| Supabase modificado en este cierre | No |
| Solo documentacion | Si |
| Commit | No |

---

## 13. Documentos previos relacionados

- [diseno-persistencia-campos-dinamicos-pickup-12W-5d.md](diseno-persistencia-campos-dinamicos-pickup-12W-5d.md)
- [resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md](resultados-inspeccion-readonly-leads-contract-fields-12W-5d-SCHEMA-1-RESULTS.md)
- [diseno-ddl-contract-fields-json-12W-5d-SQL-1.md](diseno-ddl-contract-fields-json-12W-5d-SQL-1.md)
- [ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md](ejecucion-ddl-contract-fields-json-12W-5d-SQL-2-EXEC.md)
- [validacion-api-contract-fields-json-12W-5e.md](validacion-api-contract-fields-json-12W-5e.md)
- [validacion-ui-nuevo-lead-vehiculo-contract-fields-12W-5f.md](validacion-ui-nuevo-lead-vehiculo-contract-fields-12W-5f.md)
- [validacion-vercel-contract-fields-json-12W-5-QA.md](validacion-vercel-contract-fields-json-12W-5-QA.md)
- [validacion-ficha-lead-vehiculo-contract-fields-12W-5g.md](validacion-ficha-lead-vehiculo-contract-fields-12W-5g.md)
- [validacion-vercel-ficha-lead-vehiculo-contract-fields-12W-5g-QA.md](validacion-vercel-ficha-lead-vehiculo-contract-fields-12W-5g-QA.md)
- [validacion-edicion-ficha-vehiculo-contract-fields-12W-5h.md](validacion-edicion-ficha-vehiculo-contract-fields-12W-5h.md)
- [validacion-vercel-edicion-ficha-vehiculo-contract-fields-12W-5h-QA.md](validacion-vercel-edicion-ficha-vehiculo-contract-fields-12W-5h-QA.md)
- [validacion-agregar-vehiculo-ficha-contract-fields-12W-5i.md](validacion-agregar-vehiculo-ficha-contract-fields-12W-5i.md)
- [validacion-vercel-agregar-vehiculo-ficha-contract-fields-12W-5i-QA.md](validacion-vercel-agregar-vehiculo-ficha-contract-fields-12W-5i-QA.md)
- [validacion-vercel-eliminacion-vehiculo-contract-fields-12W-5j-QA.md](validacion-vercel-eliminacion-vehiculo-contract-fields-12W-5j-QA.md)

---

## 14. Cierre

La cadena **12W-5** queda cerrada con estrategia **JSONB** validada extremo a extremo para Pickup en Summer87 Leads v3. El alcance terminado cubre alta, persistencia, lectura API, visualizacion, edicion, agregado y eliminacion de campos de vehiculo usando `contract_fields_json`, sin abrir deuda estructural por columnas dedicadas ni parches en texto libre.
