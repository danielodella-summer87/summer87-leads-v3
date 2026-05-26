# Validación extracción activos Casa Limpia CONSTRUCTOR-EXTRACT-1B

## 1. Resumen ejecutivo

- Se movieron activos reales o potencialmente sensibles de `docs/casalimpia/` fuera del repo madre.
- Se creó `README.md` placeholder en `docs/casalimpia/`.
- No se abrió ni inspeccionó contenido sensible.
- No se tocó código, SQL, Supabase ni Vercel.
- **Dictamen:** `GO` si los archivos quedaron fuera del repo y el placeholder quedó dentro.

## 2. Origen

- `docs/casalimpia/`

## 3. Destino externo

- `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/`

## 4. Archivos extraídos

| Archivo | Extensión | Destino | Estado |
|---------|-----------|---------|--------|
| `.DS_Store` | `.DS_Store` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `1.- CREACIÓN DE CLIENTE .xlsx` | `.xlsx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `2.- BROUCHURE CASALIMPIA ECUADOR 2026.pdf` | `.pdf` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `2.- BROUCHURE SERVICIO DOMESTICO 2026.pdf` | `.pdf` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `3.- LEVANTAMIENTO DE INFORMACIÓN  PARA COTIZAR.xlsx` | `.xlsx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `4.- FORMATO_COSTEO_2026_FINAL_OK.xlsx` | `.xlsx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `5.- BORRADOR COTIZACION SERVICIO DE LIMPIEZA PERMANENTE  2026.docx` | `.docx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `6.- BORRADOR DE CONTRATO 2026.docx` | `.docx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |
| `7.- R06-01-06 Planilla de ejecución - INICIACION SERVICIO.xlsx` | `.xlsx` | `/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/` | Movido |

## 5. Placeholder creado

- `docs/casalimpia/README.md`

## 6. Qué NO se hizo

- No se borraron sin respaldo.
- No se abrió contenido sensible.
- No se modificó código.
- No se ejecutó SQL.
- No se tocó Supabase.
- No se creó clon Casa Limpia.

## 7. Validación

### Resultado equivalente a `find docs/casalimpia -maxdepth 2 -type f -print | sort`

```text
docs/casalimpia/README.md
```

### Resultado equivalente a `find ~/proyectos/_activos-clientes/casalimpia -maxdepth 1 -type f -print | sort`

```text
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/.DS_Store
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/1.- CREACIÓN DE CLIENTE .xlsx
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/2.- BROUCHURE CASALIMPIA ECUADOR 2026.pdf
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/2.- BROUCHURE SERVICIO DOMESTICO 2026.pdf
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/3.- LEVANTAMIENTO DE INFORMACIÓN  PARA COTIZAR.xlsx
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/4.- FORMATO_COSTEO_2026_FINAL_OK.xlsx
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/5.- BORRADOR COTIZACION SERVICIO DE LIMPIEZA PERMANENTE  2026.docx
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/6.- BORRADOR DE CONTRATO 2026.docx
/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia/7.- R06-01-06 Planilla de ejecución - INICIACION SERVICIO.xlsx
```

### `du -sh docs/casalimpia`

```text
4.0K	docs/casalimpia
```

### `du -sh ~/proyectos/_activos-clientes/casalimpia`

```text
7.0M	/Users/danielodella/PROYECTOS/_activos-clientes/casalimpia
```

### `git status`

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  deleted:    "docs/casalimpia/1.- CREACI\303\223N DE CLIENTE .xlsx"
  deleted:    "docs/casalimpia/3.- LEVANTAMIENTO DE INFORMACI\303\223N  PARA COTIZAR.xlsx"
  deleted:    docs/casalimpia/4.- FORMATO_COSTEO_2026_FINAL_OK.xlsx
  deleted:    docs/casalimpia/5.- BORRADOR COTIZACION SERVICIO DE LIMPIEZA PERMANENTE  2026.docx
  deleted:    docs/casalimpia/6.- BORRADOR DE CONTRATO 2026.docx
  deleted:    "docs/casalimpia/7.- R06-01-06 Planilla de ejecuci\303\263n - INICIACION SERVICIO.xlsx"

Untracked files:
  docs/casalimpia/README.md
```

## 8. GO / NO-GO

| Criterio | Dictamen |
|----------|----------|
| Activos extraídos del repo madre | GO |
| Placeholder creado | GO |
| Repo sin binarios Casa Limpia | GO |
| Clonar Casa Limpia ahora | NO-GO |
| Avanzar a CLEAN-1 / CL-0b | GO posterior |

## 9. Confirmación de alcance

| Item | Valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Datos creados | No |
| Carpeta cliente creada | No |
| Archivos movidos fuera del repo | Sí |
| Placeholder creado | Sí |
| Commit | No |
