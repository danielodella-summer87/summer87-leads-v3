# Diseno reportes y filtros vehiculo contract_fields 12W-6a - Constructor CRM Summer87

**Version:** 12W-6a - diseno documental  
**Proyecto:** summer87-leads-v3  
**Estado:** propuesta funcional y BI, sin implementacion  
**Base documental:** `cierre-global-contract-fields-vehiculo-pickup-12W-5.md`, `validacion-vercel-eliminacion-vehiculo-contract-fields-12W-5j-QA.md`, `validacion-vercel-agregar-vehiculo-ficha-contract-fields-12W-5i-QA.md`, `validacion-edicion-ficha-vehiculo-contract-fields-12W-5h.md`, `validacion-api-contract-fields-json-12W-5e.md`

---

## 1. Resumen ejecutivo

- **12W-6a** disena como explotar los datos de vehiculo ya persistidos en `contract_fields_json`.
- Esta fase **no implementa** codigo, UI, API, SQL, indices ni cambios en Supabase.
- La prioridad de negocio para Pickup 4x4 es entender demanda por `marca`, `modelo`, `tipo_uso` y senales de oportunidad comercial.
- El valor esperado es doble: mejorar lectura operativa en Lista/Kanban y habilitar reportes comerciales simples sin cambiar el modelo actual.
- **Dictamen:** **GO documental** para pasar luego a **12W-6b** o a una fase SQL especifica si se decide.

---

## 2. Base confirmada desde 12W-5

- `contract_fields_json` existe en `public.leads`.
- Los campos de vehiculo validados en 12W-5 son `marca`, `modelo`, `año`, `matricula` y `tipo_uso`.
- La API GET ya devuelve `contract_fields_json` en lista y detalle.
- La ficha ya permite crear, editar, agregar y eliminar esos campos.
- No existe hoy indice especifico por `marca`, `modelo` o `tipo_uso`.
- No existen aun reportes ni filtros comerciales dedicados a vehiculo.

---

## 3. Objetivos de negocio

| Objetivo | Valor esperado |
|----------|----------------|
| Ver demanda por marca | Entender que marcas concentran mas consultas |
| Ver demanda por modelo | Detectar patrones mas finos dentro de cada marca |
| Detectar flotas o uso trabajo | Separar demanda comercial/operativa de demanda particular |
| Identificar oportunidades de accesorios por perfil de vehiculo | Vincular interes comercial con tipo de pickup y uso |
| Ayudar a priorizar campañas y stock | Soportar decisiones de pauta, contenido y compra |
| Mejorar seguimiento comercial de leads con vehiculo completo vs incompleto | Elevar calidad del dato y foco del equipo comercial |

---

## 4. Filtros sugeridos para Lista/Kanban

| Filtro | Campo JSONB | Tipo UI | Prioridad | Observacion |
|--------|-------------|---------|-----------|-------------|
| Marca | `contract_fields_json->>'marca'` | `select` / `autocomplete` | Alta | Idealmente con valores existentes, sin catalogo duro por ahora |
| Modelo | `contract_fields_json->>'modelo'` | `select` / `autocomplete` dependiente o libre | Alta | Puede depender de marca o quedar libre en una primera version |
| Año desde / hasta | `contract_fields_json->>'año'` | Rango numerico | Media | Requiere normalizar lectura numerica; util para segmentacion |
| Tipo de uso | `contract_fields_json->>'tipo_uso'` | `select` | Alta | Valores base: `particular`, `trabajo`, `flota`, `campo`, `otro` |
| Con vehiculo / sin vehiculo | Existencia de alguna clave vehiculo | `toggle` | Alta | Debe distinguir leads sin dato de leads con dato parcial |
| Matricula | `contract_fields_json->>'matricula'` | Busqueda texto | Baja / operativa | Util para seguimiento puntual, no para BI principal |
| Origen QA excluir | `origen NOT LIKE 'qa_%'` | Filtro interno | Media | Recomendado para vistas comerciales y reportes |

---

## 5. Badges sugeridos en Lista/Kanban

Diseno propuesto, sin implementacion:

| Badge | Regla sugerida | Uso |
|-------|----------------|-----|
| Vehiculo completo | Tiene `marca` + `modelo` | Senal minima comercialmente util |
| Vehiculo parcial | Tiene al menos una clave de vehiculo, pero no `marca` + `modelo` | Senal de dato incompleto |
| Sin vehiculo | No tiene ninguna de las claves `marca`, `modelo`, `año`, `matricula`, `tipo_uso` | Detectar leads a completar |
| Trabajo | `tipo_uso = 'trabajo'` | Senal de uso comercial |
| Flota | `tipo_uso = 'flota'` | Senal de cuenta potencialmente mas valiosa |
| Campo | `tipo_uso = 'campo'` | Segmentacion de uso especifico |
| Marca + modelo corto | Tiene `marca` y/o `modelo`; mostrar version resumida | Contexto rapido dentro de la card |

### Reglas de lectura sugeridas

- Si existe `marca` + `modelo`, priorizar badge corto tipo `Toyota Hilux`.
- Si solo existe una de ambas, mostrar `Vehiculo parcial` y no inventar combinaciones.
- Los badges de `tipo_uso` deben ser secundarios respecto al badge de completitud.
- Evitar mas de 2 badges visibles por card en Kanban para no sobrecargar.

---

## 6. Reportes sugeridos

| Reporte | Pregunta que responde | Metrica | Agrupacion | Prioridad |
|---------|-----------------------|---------|------------|-----------|
| Leads por marca | Que marcas generan mas interes | Cantidad de leads | `marca` | Alta |
| Leads por modelo | Que modelos concentran demanda | Cantidad de leads | `modelo` | Alta |
| Leads por tipo de uso | Que perfil de uso predomina | Cantidad de leads | `tipo_uso` | Alta |
| Leads con vehiculo completo vs incompleto | Que tan util es el dato capturado | Cantidad y porcentaje | Completo / parcial / sin vehiculo | Alta |
| Leads por marca + producto consultado | Que combinaciones vehiculo-producto se consultan mas | Cantidad de leads | `marca` + `oferta` | Media |
| Leads por año / rango | Que antiguedad de vehiculos entra mas | Cantidad de leads | Rango de `año` | Media |
| Leads QA a excluir | Cuanto ruido de prueba existe en el dataset | Cantidad de leads QA | `origen` prefijo `qa_` | Media |
| Oportunidades por flota / trabajo | Donde hay mayor potencial comercial | Cantidad de leads y ratio | `tipo_uso` filtrado | Alta |
| Matriz marca/modelo vs oferta | Que cruces producto-vehiculo aparecen mas | Conteo cruzado | `marca`, `modelo`, `oferta` | Media |

---

## 7. Definicion de "vehiculo completo"

### Regla propuesta

- **Completo:** tiene `marca` + `modelo`.
- **Completo ampliado:** tiene `marca` + `modelo` + `año` + `tipo_uso`.
- **Matricula no obligatoria** para completitud comercial.

### Justificacion

- `marca` y `modelo` ya permiten segmentar demanda, orientar compatibilidad y priorizar oferta comercial.
- `año` y `tipo_uso` enriquecen fuertemente analisis y filtros, pero no deberian bloquear la lectura minima del lead.
- `matricula` es un dato mas operativo o administrativo; puede ser sensible, faltar temprano o no ser necesaria para decisiones de marketing/stock.
- Esta regla evita castigar como "incompleto" a un lead comercialmente valioso que aun no compartio matricula.

---

## 8. Query contract recomendado

Las consultas siguientes son **ejemplos de diseno** y **NO deben ejecutarse** en esta fase.

### Extraer marca

```sql
SELECT
  id,
  contract_fields_json->>'marca' AS marca
FROM public.leads;
```

### Extraer modelo

```sql
SELECT
  id,
  contract_fields_json->>'modelo' AS modelo
FROM public.leads;
```

### Extraer tipo_uso

```sql
SELECT
  id,
  contract_fields_json->>'tipo_uso' AS tipo_uso
FROM public.leads;
```

### Contar leads con vehiculo

```sql
SELECT COUNT(*) AS leads_con_vehiculo
FROM public.leads
WHERE
  contract_fields_json ? 'marca'
  OR contract_fields_json ? 'modelo'
  OR contract_fields_json ? 'año'
  OR contract_fields_json ? 'matricula'
  OR contract_fields_json ? 'tipo_uso';
```

### Contar leads sin vehiculo

```sql
SELECT COUNT(*) AS leads_sin_vehiculo
FROM public.leads
WHERE NOT (
  contract_fields_json ? 'marca'
  OR contract_fields_json ? 'modelo'
  OR contract_fields_json ? 'año'
  OR contract_fields_json ? 'matricula'
  OR contract_fields_json ? 'tipo_uso'
);
```

### Excluir QA por origen `qa_%`

```sql
SELECT *
FROM public.leads
WHERE origen IS NULL OR origen NOT LIKE 'qa_%';
```

### Agrupar por marca / modelo

```sql
SELECT
  contract_fields_json->>'marca' AS marca,
  contract_fields_json->>'modelo' AS modelo,
  COUNT(*) AS leads
FROM public.leads
WHERE origen IS NULL OR origen NOT LIKE 'qa_%'
GROUP BY 1, 2
ORDER BY leads DESC;
```

### Nota de diseno

- Estas consultas son una referencia para BI/reporting y para una eventual fase SQL o implementacion de filtros.
- No forman parte de 12W-6a ejecutarlas, validarlas ni optimizarlas.

---

## 9. Performance e indices

- Hoy **no se recomienda** crear indices si el volumen sigue bajo y el uso todavia es exploratorio.
- Si aparecen reportes frecuentes o filtros muy usados, evaluar un indice funcional por `marca`:

```sql
CREATE INDEX ...
ON public.leads ((contract_fields_json->>'marca'))
WHERE contract_fields_json ? 'marca';
```

- Tambien podria evaluarse luego un indice por `modelo` o `tipo_uso`.
- **NO-GO** crear indices en **12W-6a**.
- Los indices deben quedar para una fase SQL especifica y solo si el uso real los justifica.

---

## 10. Impacto UX

- En **Lista**, los filtros deberian vivir arriba o en un panel lateral liviano.
- En **Kanban**, el vehiculo deberia entrar como badge pequeno dentro de la card.
- No conviene sobrecargar tarjetas con demasiados datos de vehiculo.
- Debe mantenerse un solo CTA principal por pantalla.
- Los estados de lectura deben ser claros: `Con vehiculo`, `Sin vehiculo`, `Datos parciales`.
- Agregar microcopy breve para explicar que estos datos provienen del contrato CRM y pueden estar incompletos.

### Microcopy sugerido

- `Datos de vehiculo capturados desde el contrato CRM.`
- `Sin vehiculo` cuando no hay claves presentes.
- `Datos parciales` cuando existe algun dato, pero no `marca` + `modelo`.

---

## 11. Alcance por fases sugerido

| Fase | Alcance sugerido |
|------|------------------|
| 12W-6a | Diseno documental |
| 12W-6b | Lista - filtros basicos por `marca`, `modelo`, `tipo_uso` y `con vehiculo` |
| 12W-6c | Kanban - badges de vehiculo |
| 12W-6d | Reporte comercial por `marca` / `modelo` |
| 12W-6e | Evaluacion de indices |
| 12W-6-QA | Validacion Vercel |

---

## 12. NO-GO explicitos

- No SQL.
- No indices.
- No cambios API.
- No cambios UI.
- No Zeta/Kore.
- No carga masiva.
- No normalizar a tablas `marca` / `modelo` todavia.
- No EAV.
- No mezclar vehiculo en `notas` ni `oferta`.

---

## 13. Riesgos

- `marca` y `modelo` pueden venir escritos con variantes y duplicar categorias logicas.
- Todavia no existe un catalogo normalizado.
- Los datos QA contaminan reportes si no se excluyen por `origen`.
- JSONB flexible requiere disciplina de UI y validacion constante.
- Reportes con poco volumen pueden inducir conclusiones prematuras.

---

## 14. Recomendacion final

| Criterio | Dictamen |
|----------|----------|
| Avanzar a 12W-6b con filtros basicos en Lista | GO |
| Crear indices ahora | NO-GO |
| Normalizacion avanzada ahora | NO-GO |
| Mantener `contract_fields_json` como fuente primaria en esta etapa | GO |

### Sintesis

La recomendacion es empezar por **Lista** con filtros basicos y lectura comercial clara, medir uso real y postergar cualquier optimizacion estructural o normalizacion avanzada hasta tener mas volumen y patrones de consulta confirmados.

---

## 15. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Solo documentacion | Si |
| Commit | No |

---

## 16. Cierre

**12W-6a** deja definida la forma recomendada de explotar vehiculo en Summer87 Leads v3 usando `contract_fields_json` como fuente primaria. El siguiente paso natural, si se aprueba, es una implementacion liviana en Lista/Kanban y luego reportes comerciales, sin adelantar indices ni refactors estructurales antes de medir necesidad real.
