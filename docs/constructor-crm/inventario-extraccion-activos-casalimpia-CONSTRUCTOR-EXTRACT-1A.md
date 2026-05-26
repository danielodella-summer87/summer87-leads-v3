# Inventario extraccion activos Casa Limpia CONSTRUCTOR-EXTRACT-1A

**Fase:** CONSTRUCTOR-EXTRACT-1A  
**Proyecto:** summer87-leads-v3  
**Tipo:** inventario y plan preliminar de extraccion documental  
**Alcance:** solo documentacion; sin movimientos, sin borrado, sin cambios de codigo

---

## 1. Resumen ejecutivo

- Se confirma la existencia de `docs/casalimpia/`.
- Se identifican archivos Office y PDF que deben tratarse como **posibles activos reales del cliente**.
- Por nombre, extension y tamaño, varios parecen corresponder a brochures, costeo, cotizacion, contrato, relevamiento y operacion real.
- Este tipo de material no deberia permanecer dentro del repo madre si corresponde a documentos reales del cliente.
- En esta fase **no se mueve** ni **se borra** ningun archivo.
- **Dictamen preliminar:** `GO` para inventario y plan; `NO-GO` para extraer o borrar en esta fase.

---

## 2. Inventario de archivos

Inventario realizado por nombre, extension y metadata basica, sin abrir ni extraer contenido sensible mas alla de lo necesario para clasificar.

| ID | Archivo | Extension | Tamaño aproximado | Tipo estimado | Posible contenido por nombre | Riesgo | Accion sugerida | Requiere respaldo externo | Requiere confirmacion Daniel |
|----|---------|-----------|-------------------|---------------|------------------------------|--------|------------------|---------------------------|------------------------------|
| CL-01 | `.DS_Store` | `.DS_Store` | 6 KB | Otro / artefacto de sistema | Metadata local de Finder | Bajo | Revisar y sacar del tracking en fase posterior si corresponde | No | No |
| CL-02 | `1.- CREACIÓN DE CLIENTE .xlsx` | `.xlsx` | 188 KB | Excel | Alta de cliente o formulario comercial real | Alto | Extraer fuera del repo madre en `EXTRACT-1B` | Si | Si |
| CL-03 | `2.- BROUCHURE CASALIMPIA ECUADOR 2026.pdf` | `.pdf` | 3.5 MB | PDF | Brochure comercial institucional Casa Limpia | Critico | Extraer fuera del repo madre y dejar solo referencia si hace falta | Si | Si |
| CL-04 | `2.- BROUCHURE SERVICIO DOMESTICO 2026.pdf` | `.pdf` | 2.0 MB | PDF | Brochure comercial de servicio especifico | Critico | Extraer fuera del repo madre y dejar solo referencia si hace falta | Si | Si |
| CL-05 | `3.- LEVANTAMIENTO DE INFORMACIÓN  PARA COTIZAR.xlsx` | `.xlsx` | 184 KB | Excel | Relevamiento o formulario para cotizacion | Critico | Extraer fuera del repo madre; evaluar version `.example` futura sin datos reales | Si | Si |
| CL-06 | `4.- FORMATO_COSTEO_2026_FINAL_OK.xlsx` | `.xlsx` | 614 KB | Excel | Costeo comercial o financiero | Critico | Extraer fuera del repo madre; no dejar en tracking si es real | Si | Si |
| CL-07 | `5.- BORRADOR COTIZACION SERVICIO DE LIMPIEZA PERMANENTE  2026.docx` | `.docx` | 449 KB | Word | Borrador de cotizacion comercial real | Critico | Extraer fuera del repo madre; si sirve como template, recrear luego `.example` | Si | Si |
| CL-08 | `6.- BORRADOR DE CONTRATO 2026.docx` | `.docx` | 17 KB | Word | Borrador contractual | Critico | Extraer fuera del repo madre con respaldo previo | Si | Si |
| CL-09 | `7.- R06-01-06 Planilla de ejecución - INICIACION SERVICIO.xlsx` | `.xlsx` | 179 KB | Excel | Planilla operativa de inicio de servicio | Alto | Extraer fuera del repo madre; evaluar rescatar solo estructura reusable | Si | Si |

---

## 3. Clasificacion de riesgo

- **Critico:** contratos, costos, datos comerciales, brochures institucionales o documentos cliente reales.
- **Alto:** plantillas operativas reales, relevamientos, formatos internos y planillas de ejecucion.
- **Medio:** documentos genericos reutilizables sin datos reales ni contexto cliente identificable.
- **Bajo:** placeholders, ejemplos sin datos reales o artefactos tecnicos de sistema.

### Lectura preliminar del bloque `docs/casalimpia/`

- Riesgo **critico**: `CL-03`, `CL-04`, `CL-05`, `CL-06`, `CL-07`, `CL-08`
- Riesgo **alto**: `CL-02`, `CL-09`
- Riesgo **bajo**: `CL-01`

---

## 4. Criterio de extraccion

- No borrar sin respaldo.
- Crear respaldo fuera del repo madre antes de eliminar archivos del tracking.
- Reemplazar la carpeta por un `README` placeholder si corresponde.
- Ese `README` puede indicar que los activos reales fueron extraidos por confidencialidad.
- Mantener solo referencias no sensibles en `knowledge/verticales/facility-servicios/` si aportan aprendizaje.
- Si hay templates reutilizables, convertirlos luego en `.example` sin datos reales ni marcas de cliente.

---

## 5. Destino sugerido fuera del repo

Opciones recomendadas para extraer el material real sin dejarlo en Git:

- `~/proyectos/_activos-clientes/casalimpia/`
- `Google Drive / Summer87 / Clientes / Casa Limpia / Activos originales`
- carpeta privada fuera de Git y fuera del repo madre

En esta fase **no** se crean esas carpetas ni se mueven archivos.

---

## 6. Plan EXTRACT-1B sugerido

1. Confirmar respaldo externo completo.
2. Mover documentos reales fuera del repo madre.
3. Crear `README` placeholder en `docs/casalimpia/` o eliminar la carpeta si se decide.
4. Actualizar `.gitignore` si aplica.
5. Hacer un commit especifico de extraccion documental.
6. Verificar `git status`.
7. Confirmar que no quedan binarios sensibles ni activos reales del cliente dentro del repo.

---

## 7. Que NO se hizo

- No se movieron archivos.
- No se borraron archivos.
- No se modifico codigo.
- No se toco SQL.
- No se creo clon Casa Limpia.

---

## 8. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Inventario realizado | GO |
| Extraer activos ahora | NO-GO |
| Borrar activos ahora | NO-GO |
| Preparar `EXTRACT-1B` | GO |
| Clonar Casa Limpia | NO-GO |

---

## 9. Confirmacion de alcance

| Item | Valor |
|------|-------|
| Codigo modificado | No |
| Archivos movidos | No |
| Archivos borrados | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Carpetas cliente creadas | No |
| Solo documentacion | Si |
| Commit | No |

---

## 10. Cierre

`EXTRACT-1A` deja inventariado el contenido de `docs/casalimpia/` y confirma un riesgo documental real para la base madre: el repo contiene binarios y documentos que, por nombre y naturaleza, deben tratarse como activos potencialmente sensibles del cliente. El siguiente paso correcto es `EXTRACT-1B`, con respaldo previo y extraccion controlada fuera del repo.
