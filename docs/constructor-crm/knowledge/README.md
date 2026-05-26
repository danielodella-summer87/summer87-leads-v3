# Knowledge Base del Constructor

La carpeta `knowledge/` es la base documental viva del Constructor CRM.

## Que va aqui

- decisiones arquitectonicas vigentes;
- patrones tecnicos reutilizables;
- aprendizaje por vertical;
- conocimiento operativo reusable.

## Que NO va aqui

- codigo runtime;
- secretos;
- datos reales de cliente;
- binarios o activos comerciales reales;
- documentacion cliente final ya personalizada.

## Regla de uso

- `knowledge/` no se ejecuta en runtime.
- Sirve para alimentar futuros paquetes instalables y futuros proyectos cliente.
- Si un documento es util como referencia pero no debe copiarse tal cual, su lugar natural es `knowledge/`.
