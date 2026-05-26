# Casa Limpia Ecuador procedimiento clon local CL-1a-PRE

## 1. Resumen ejecutivo

- `CL-1a-PRE` define el procedimiento exacto previo a crear el clon local.
- Este documento no crea carpetas ni ejecuta comandos de copia.
- El destino futuro propuesto sería `~/proyectos/casalimpia-crm-inteligente`.
- El repo `summer87-leads-v3` sigue siendo el Constructor madre.
- **Dictamen:** `GO` documental para dejar listo el procedimiento; `NO-GO` para ejecutar el clon en esta fase.

## 2. Decisión operativa

La decisión para `CL-1a` real es estricta:

- `CL-1a` solo podrá crear la carpeta local del clon.
- `CL-1a` no debe crear Supabase.
- `CL-1a` no debe crear Vercel.
- `CL-1a` no debe ejecutar SQL.
- `CL-1a` no debe crear usuarios.
- `CL-1a` no debe crear datos reales.
- `CL-1a` debe poder revertirse eliminando la carpeta clon si algo sale mal.

Esto mantiene a Casa Limpia dentro del modelo `V1 manual assisted`: primero nace la carpeta local, luego se revisa, y recién después se evalúan infraestructura, env, seed y QA.

## 3. Precondiciones obligatorias antes de ejecutar CL-1a

| precondición | cómo verificar | dictamen requerido |
|--------------|----------------|--------------------|
| estar en `~/proyectos/summer87-leads-v3` | `pwd` | GO |
| `git status` clean | `git status` debe devolver working tree clean | GO |
| rama `main` | `git branch --show-current` | GO |
| `origin/main` al día | `git status` debe indicar up to date con `origin/main` | GO |
| `CL-0f` commiteado | `git ls-files --error-unmatch docs/constructor-crm/casalimpia-ecuador-checklist-go-nogo-preclon-CL-0f.md` y presencia en `HEAD` | GO |
| destino `~/proyectos/casalimpia-crm-inteligente` no existe | `test ! -e ~/proyectos/casalimpia-crm-inteligente` | GO |
| no copiar `.env` | revisar comando final de `rsync` y exclusiones | GO |
| no copiar `node_modules` | revisar comando final de `rsync` y exclusiones | GO |
| no copiar `.next` | revisar comando final de `rsync` y exclusiones | GO |
| no copiar backups | revisar comando final de `rsync` y exclusiones | GO |
| no copiar activos reales Casa Limpia | confirmar que siguen fuera de Git y fuera del árbol origen | GO |
| tener claro rollback | revisar y aprobar el paso de rollback antes de ejecutar | GO |

## 4. Comando recomendado de creación futura

La recomendación para `CL-1a` real es usar `rsync` desde:

- origen: `~/proyectos/summer87-leads-v3/`
- destino: `~/proyectos/casalimpia-crm-inteligente/`

Con exclusiones mínimas:

- `.git`
- `node_modules`
- `.next`
- `.env`
- `.env.*`
- `backups`
- `*.log`
- `.DS_Store`
- `docs/casalimpia`
- cualquier carpeta externa con activos reales
- caches y build artifacts

### Comando conceptual

**NO EJECUTAR EN `CL-1a-PRE`.**

```bash
cd ~/proyectos
mkdir "casalimpia-crm-inteligente"
rsync -av \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'backups' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'docs/casalimpia' \
  --exclude '.vercel' \
  --exclude 'coverage' \
  --exclude 'build' \
  --exclude 'out' \
  --exclude '*.tsbuildinfo' \
  --exclude 'supabase/.temp' \
  "summer87-leads-v3/" "casalimpia-crm-inteligente/"
```

### Decisión sobre creación de carpeta

Se recomienda usar `mkdir` simple y no `mkdir -p`.

Motivo:

- `mkdir` falla si la carpeta ya existe;
- eso ayuda a proteger la precondición "destino no existe";
- evita ocultar un error operativo que podría mezclar un clon nuevo con un directorio previo;
- deja más explícito el rollback.

No se recomienda depender de que `rsync` cree el destino implícitamente, porque vuelve menos visible el punto exacto en que nace la carpeta cliente.

## 5. Tratamiento de Git en el clon futuro

### Opción A. Copiar sin `.git` y luego iniciar repo nuevo

- Pros:
  - evita arrastrar remotos, hooks e historial del repo madre;
  - reduce riesgo de pushear por error al origen equivocado;
  - fuerza una identidad propia del proyecto cliente;
  - facilita sanitización posterior.
- Contras:
  - se pierde historial local en el clon recién creado;
  - obliga a iniciar Git explícitamente más adelante.
- Dictamen: `GO inicial`.

### Opción B. Copiar con `.git` conservando historial

- Pros:
  - conserva historial completo;
  - facilita trazabilidad técnica del origen.
- Contras:
  - alto riesgo de confundir repo madre y clon;
  - puede conservar remoto `origin` apuntando al repo equivocado;
  - arrastra contexto histórico y ramas no deseadas;
  - no es el comportamiento más limpio para el primer clon controlado.
- Dictamen: `NO-GO` para el primer clon limpio controlado.

### Opción C. Crear fork o repo nuevo desde GitHub

- Pros:
  - separación remota clara;
  - historial y colaboración más ordenados si se decide sostener el proyecto como repo independiente.
- Contras:
  - no resuelve por sí mismo qué excluir del copiado local;
  - agrega una capa remota antes de terminar la sanitización local;
  - introduce complejidad innecesaria para el primer paso.
- Dictamen: `GO` posterior, no como primer movimiento operativo.

### Recomendación

Para el primer clon limpio controlado, la opción recomendada es **A. copiar sin `.git` y luego iniciar repo nuevo**, salvo decisión explícita en contrario.

## 6. Tratamiento de documentación interna

En `CL-1a` local se puede copiar documentación interna para trazabilidad del equipo Summer87, pero esa documentación no debe quedar visible en una demo o entrega al cliente.

### Documentación que puede quedarse inicialmente en el clon local

- contrato funcional Casa Limpia;
- plan técnico del clon;
- seed mínimo / permisos;
- checklist Go/No-Go;
- este procedimiento `CL-1a-PRE`;
- documentación técnica que Summer87 necesite para terminar de sanitizar el clon.

### Documentación que debería excluirse antes de cualquier entrega o demo cliente

- documentación del Constructor como fábrica;
- documentos de estrategia interna;
- auditorías internas del repo madre;
- diseños del generador local;
- templates y knowledge internos no pensados para cliente;
- cualquier evidencia histórica de otros verticales.

### Documentación que puede quedar solo mientras Summer87 trabaja internamente

- `docs/constructor-crm/*` como soporte de trazabilidad;
- notas internas de sanitización;
- planes operativos de fases `CL-1x`.

### Regla de visibilidad

El cliente final no debe ver documentación del Constructor. Antes de cualquier demo o entrega externa debe existir una fase de sanitización u ocultamiento de docs internas.

## 7. Tratamiento de Constructor en el clon futuro

- En `CL-1a` todavía puede existir código del Constructor porque solo se trata de un clon local inicial.
- Antes de cualquier demo cliente, ese Constructor debe quedar oculto de la superficie visible.
- Rutas críticas a tratar:
  - `/admin/constructor-crm`
  - `/api/admin/constructor/*`
  - páginas internas de paquetes y drafts

### Fase sugerida

- `CL-1d — ocultamiento Constructor / módulos internos`

## 8. Tratamiento UI Pickup / vehículo

- La UI Pickup / vehículo no debe quedar visible en el clon cliente Casa Limpia.
- En `CL-1a` puede seguir existiendo código heredado porque la copia local inicial todavía no es una superficie cliente.
- Antes de demo cliente debe ocultarse o eliminarse de la superficie.

### Fase sugerida

- `CL-1e — revisión UI Pickup/vehicle en clon`

## 9. Tratamiento UI facility

- La UI facility puede servir como base para Casa Limpia.
- No debe heredarse completa sin revisión.
- Debe decidirse si se mantiene, se oculta, se parametriza o se simplifica.

### Fase sugerida

- `CL-1f` o `CL-UI-0 — revisión UI facility Casa Limpia`

## 10. Validaciones posteriores a CL-1a

Después de crear la carpeta local, debería validarse:

- confirmar que `~/proyectos/casalimpia-crm-inteligente` fue creada;
- listar archivos principales del clon;
- confirmar que no existe `.env`;
- confirmar que no existe `.git` si se eligió la opción sin historial;
- confirmar que no existe `node_modules`;
- confirmar que no existe `.next`;
- confirmar que `package.json` está presente;
- confirmar que la documentación interna mínima esperada está presente si se decidió conservarla;
- confirmar que el repo madre `summer87-leads-v3` sigue con `git status` clean;
- dejar `npm install` para fase posterior, no para `CL-1a` sin aprobación explícita.

### Validaciones conceptuales sugeridas

```bash
ls -la ~/proyectos/casalimpia-crm-inteligente
test ! -e ~/proyectos/casalimpia-crm-inteligente/.env
test ! -e ~/proyectos/casalimpia-crm-inteligente/.git
test ! -e ~/proyectos/casalimpia-crm-inteligente/node_modules
test ! -e ~/proyectos/casalimpia-crm-inteligente/.next
test -f ~/proyectos/casalimpia-crm-inteligente/package.json
cd ~/proyectos/summer87-leads-v3 && git status
```

Estas validaciones tampoco se ejecutan en `CL-1a-PRE`; quedan definidas para la fase posterior.

## 11. Rollback

Si `CL-1a` solo crea la carpeta local y algo sale mal, el rollback esperado es eliminar la carpeta clon completa.

Comando conceptual:

`rm -rf ~/proyectos/casalimpia-crm-inteligente`

### Regla crítica

- es un comando peligroso;
- requiere confirmación humana explícita antes de ejecutar;
- no debe ejecutarse desde `CL-1a-PRE`.

## 12. Riesgos

| riesgo | impacto | mitigación |
|--------|---------|------------|
| copiar `.env` | crítico | excluir `.env` y `.env.*` en `rsync`, revisar luego con validación explícita |
| copiar `.git` sin querer | alto | excluir `.git` y adoptar opción A como default |
| copiar `node_modules` | medio/alto | excluir `node_modules` y validar ausencia post-copia |
| copiar `.next` | medio | excluir `.next` y otros build artifacts |
| copiar backups | alto | excluir `backups` y revisar árbol destino |
| copiar activos reales | crítico | mantener activos reales fuera del repo y fuera del comando base |
| crear carpeta sobre una existente | crítico | precondición `destino no existe` + usar `mkdir` simple |
| confundir repo madre con clon | alto | trabajar siempre con paths absolutos y validar `pwd` antes de cada comando |
| ejecutar comandos dentro del repo equivocado | alto | verificar carpeta activa antes de instalar, correr Git o levantar server |
| abrir dev server en carpeta incorrecta | medio/alto | no correr dev server en `CL-1a`; dejarlo para fase aprobada posterior |
| tocar Supabase/Vercel antes de tiempo | crítico | mantener `NO-GO` explícito para infraestructura en esta fase |

## 13. Checklist Go/No-Go para ejecutar CL-1a

| criterio | estado esperado | GO/NO-GO |
|----------|-----------------|----------|
| repo madre clean | `git status` clean | GO |
| destino no existe | verificación positiva | GO |
| comando `rsync` revisado | sí | GO |
| exclusiones revisadas | sí | GO |
| rollback entendido | sí | GO |
| no Supabase | confirmado | GO |
| no Vercel | confirmado | GO |
| no SQL | confirmado | GO |
| no datos reales | confirmado | GO |
| no `npm install` todavía salvo aprobación | confirmado | GO |
| no dev server todavía salvo aprobación | confirmado | GO |

## 14. Comando final propuesto para CL-1a

**NO EJECUTAR EN ESTE DOCUMENTO.**

```bash
cd ~/proyectos
mkdir "casalimpia-crm-inteligente"
rsync -av \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'backups' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'docs/casalimpia' \
  --exclude '.vercel' \
  --exclude 'coverage' \
  --exclude 'build' \
  --exclude 'out' \
  --exclude '*.tsbuildinfo' \
  --exclude 'supabase/.temp' \
  summer87-leads-v3/ casalimpia-crm-inteligente/
```

### Decisión documentada

- Conviene crear la carpeta explícitamente con `mkdir`.
- No conviene usar `mkdir -p` porque no falla si el destino ya existe.
- No conviene dejar que `rsync` cree la carpeta de forma implícita porque se pierde visibilidad operativa sobre el nacimiento del clon.

## 15. GO / NO-GO

| criterio | dictamen |
|----------|----------|
| `CL-1a-PRE` documental | GO |
| ejecutar `CL-1a` ahora | NO-GO |
| crear carpeta ahora | NO-GO |
| crear Supabase ahora | NO-GO |
| crear Vercel ahora | NO-GO |
| ejecutar SQL ahora | NO-GO |
| pasar a `CL-1a` después de validar este documento | GO condicional |

## 16. Confirmación de alcance

| item | valor |
|------|-------|
| Código modificado | No |
| SQL ejecutado | No |
| Supabase modificado | No |
| Vercel modificado | No |
| Datos creados | No |
| Usuarios creados | No |
| Carpetas cliente creadas | No |
| Archivos movidos | No |
| Solo documentación | Sí |
| Commit | No |

## 17. Próximo paso recomendado

- Revisar y commitear `CL-1a-PRE`.
- Luego decidir si se aprueba `CL-1a` real.
- No ejecutar el clon todavía.
