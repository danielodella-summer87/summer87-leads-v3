# Casa Limpia Ecuador validación clon local CL-1a

## 1. Resumen ejecutivo

- `CL-1a` creó la carpeta local del clon Casa Limpia de forma controlada.
- No creó Supabase, Vercel, SQL, usuarios ni datos.
- El clon existe solo como copia local inicial.
- **Dictamen:** `GO` para dejar constancia documental de la creación controlada de la carpeta local; `NO-GO` para considerar el clon listo para uso cliente.

## 2. Carpeta creada

| item | valor | resultado |
|------|-------|-----------|
| origen | `~/proyectos/summer87-leads-v3` | `OK` |
| destino | `~/proyectos/casalimpia-crm-inteligente` | `OK` |
| método rsync | copia controlada con exclusiones: `.git`, `node_modules`, `.next`, `.env`, `.env.*`, `backups`, `*.log`, `.DS_Store`, `docs/casalimpia`, `.vercel`, `coverage`, `build`, `out`, `*.tsbuildinfo`, `supabase/.temp` | `OK` |
| fecha aproximada | `2026-05-26` | `OK` |
| `package.json` presente | sí | `OK` |

## 3. Exclusiones críticas validadas

| exclusión | resultado | dictamen |
|-----------|-----------|----------|
| `.git` | no existe en el clon | `OK` |
| `.env` | no existe en el clon | `OK` |
| `node_modules` | no existe en el clon | `OK` |
| `.next` | no existe en el clon | `OK` |
| `.vercel` | no existe en el clon | `OK` |
| `docs/casalimpia` | no existe en el clon | `OK` |

## 4. Repo madre

- Evidencia operativa de `CL-1a`: `git status` en `summer87-leads-v3`: `clean`.
- No se modificó el repo madre durante `CL-1a`.
- No se crearon datos en el repo madre.
- No se tocó Supabase ni Vercel.
- Nota de esta acta: al crear este documento, el working tree actual del repo madre queda con este archivo nuevo de documentación.

## 5. Observaciones de sanitización

| archivo o área | riesgo | acción sugerida | fase sugerida |
|----------------|--------|-----------------|---------------|
| `.cookies-comercial.txt` | posible material sensible o de sesión local | revisar y excluir o reemplazar por placeholder seguro | `CL-1b` |
| `.cookies.txt` | posible material sensible o de sesión local | revisar y excluir o reemplazar por placeholder seguro | `CL-1b` |
| `backup_base_vacia.sql` | puede inducir ejecución accidental o arrastrar SQL no validado | inventariar y clasificar como referencia interna o excluir del clon cliente | `CL-1b` |
| `estructura_base.sql` | riesgo de confusión con esquema operativo no aprobado para Casa Limpia | revisar alcance y dejar fuera de cualquier ejecución automática | `CL-1b` |
| `bootstrapp nueva instancia.sql` | archivo SQL sensible por nombre e intención operativa | revisar, renombrar o aislar como material interno no ejecutable | `CL-1b` |
| `informe-ia-87143d49.pdf` | documento interno potencialmente no apto para superficie cliente | revisar contenido y decidir exclusión o resguardo interno | `CL-1b` |
| `CHECKLIST_* / RESUMEN_* / INSTRUCCIONES_* legacy` | arrastre documental legacy que puede contaminar el clon cliente | inventariar y separar lo histórico de lo reutilizable | `CL-1b` |
| docs internas Constructor | exponen contexto interno no destinado al cliente | mantener fuera de la superficie cliente y revisar qué conservar solo como referencia interna | `CL-1b` |
| rutas Constructor | riesgo de que el clon siga mostrando Constructor en navegación o routing | auditar rutas, menús y flags para ocultamiento o remoción controlada | `CL-1b` |
| UI Pickup/vehículo | contaminación funcional de otra vertical | identificar pantallas, labels y flujos a neutralizar u ocultar | `CL-1b` |
| UI facility/relevamiento | definición funcional todavía pendiente | tomar decisión explícita de conservar, adaptar u ocultar antes de usar el clon | `CL-1b` |

## 6. Qué NO se hizo

- No se ejecutó `npm install`.
- No se ejecutó `npm run dev`.
- No se hizo `git init` en el clon.
- No se creó ni configuró Supabase.
- No se creó ni configuró Vercel.
- No se ejecutó SQL.
- No se cargaron datos reales.
- No se crearon usuarios reales.
- No se editó código.

## 7. Dictamen CL-1a

| criterio | dictamen |
|----------|----------|
| carpeta local creada | `GO` |
| exclusiones críticas | `GO` |
| clon listo para uso cliente | `NO-GO` |
| pasar a `CL-1b` sanitización inicial | `GO` |
| infraestructura | `NO-GO` |
| datos reales | `NO-GO` |

## 8. Próximo paso recomendado

- `CL-1b — sanitización inicial del clon local`.
- No borrar todavía sin checklist.
- No instalar dependencias todavía.
