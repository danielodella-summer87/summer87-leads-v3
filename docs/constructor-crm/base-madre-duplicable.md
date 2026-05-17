# Base Madre Duplicable — Constructor CRM Summer87

**Versión:** Fase BM-0 (documental)  
**Siglas:** BM — Base Madre  
**Relacionado con:** `docs/constructor-crm/base-conocimiento-por-rubro.md`, `docs/PAQUETE_INSTALABLE_CRM_7W.md`, `docs/MODELO_DATOS_PAQUETE_INSTALABLE_8B.md`, `docs/PRESETS_SECTORIALES_INSTALADOR_7Q.md`, `lib/admin/installablePackagePickup4x4Preset.ts`

**Estado:** decisión estratégica y diseño operativo documentados. **No implementa** duplicación automática, scripts, flags en runtime ni cambios en `.env`.

---

## 2. Resumen ejecutivo

**summer87-leads-v3** es la **base madre** del ecosistema Summer87: un repositorio y producto **Constructor virgen duplicable** desde el cual Summer87 diseña, audita y prepara CRMs específicos para cada cliente.

No es el CRM que usa el cliente final en el día a día. Es la **fábrica interna** que contiene el motor del Constructor, el Instalador, la simulación, la evidencia documental, los presets y — en evolución — la Base de Conocimiento por Rubro (BCR).

Cada CRM de cliente nace, en esta etapa, por **duplicación manual controlada** de la base madre hacia una carpeta o proyecto propio (ej. `pickup4x4-crm-v1`), seguida de configuración, limpieza de datos de prueba, definición de **modo CRM operativo** y **ocultamiento del Constructor** para usuarios finales.

El cliente final opera solo el **CRM operativo**: leads, clientes, oportunidades, agenda, reportes acordados. No ve `package_payload`, snapshots, blueprint interno ni auditoría pre-SQL.

---

## 3. Decisión estratégica

### 3.1 Opción elegida: base madre duplicable (ahora)

Se adopta el modelo en el que **summer87-leads-v3 permanece como base madre** y cada CRM cliente se materializa duplicando esa base, configurándola y entregándola en modo operativo.

### 3.2 Opción diferida: generador / script automático (después)

Más adelante podrá existir un comando o script que automatice copia, naming, `.env.example` y checklist inicial. **No se implementa en esta fase.**

### 3.3 Razones de la decisión

- **Mayor control** en los primeros despliegues reales (Pickup 4x4 y pilotos siguientes).
- **Menor riesgo** que automatizar clonación, secretos y visibilidad del Constructor antes de tener el proceso probado.
- **Aprendizaje con casos reales:** cada duplicación manual expone qué limpiar, qué configurar y qué documentar.
- **Evita automatizar demasiado pronto** sin BCR madura ni checklists validados.
- **Permite validar Pickup 4x4** (y otros rubros) como semilla antes de invertir en un generador.

> La base madre duplicable y la BCR son complementarias: la BM define *cómo se clona el producto*; la BCR define *qué aprendizaje sectorial reutilizar al diseñar* dentro de la madre o al preparar el clon.

---

## 4. Diferencia entre Constructor y CRM operativo

### 4.1 Constructor CRM (Summer87 — interno)

Herramienta usada **solo por Summer87** (instalador, superadmin, roles internos acordados):

- Diagnostica el negocio y diseña módulos, pipeline, campos, reportes e integraciones.
- Genera y revisa **`package_payload`**, borradores instalables, simulaciones y snapshots.
- Produce blueprint técnico, auditoría pre-SQL, resúmenes ejecutivos y cierre documental.
- Registra decisiones de reunión, planes bloqueados y evidencia de readiness.
- Alimenta y consume la **Base de Conocimiento por Rubro** (lado Summer87).
- **No** es la interfaz diaria del cliente final.

### 4.2 CRM operativo (cliente final)

Instancia orientada a **operación comercial y de servicio**:

- Módulos acordados: leads / clientes / oportunidades / agenda / reportes / integraciones aprobadas.
- Flujos de trabajo del negocio del cliente, branding y permisos por rol cliente.
- **Sin** acceso al Constructor, Instalador ni artefactos técnicos de instalación.
- **Sin** `package_payload`, snapshots técnicos, blueprint interno ni auditoría pre-SQL visibles.
- **Sin** herramientas de diseño de CRM ni pantallas de evidencia Summer87.

### 4.3 Regla de producto

> **El Constructor diseña el CRM; el CRM operativo lo usa el cliente.**  
> Un mismo codebase puede contener ambos modos; la entrega al cliente exige **modo CRM operativo** y Constructor **oculto, apagado o inaccesible** para roles finales.

---

## 5. Flujo propuesto para crear un CRM cliente

Pasos conceptuales (orden recomendado; duplicación solo tras cierre documental aceptable):

1. **Mantener** `summer87-leads-v3` como base madre actualizada y auditada.
2. **Diseñar** el CRM en modo Constructor (diagnóstico, package, simulación, reunión).
3. **Generar** paquete / blueprint / auditoría y validar readiness.
4. **Validar cierre documental** (aprobaciones humanas, sin SQL ni tenant en esta fase documental).
5. **Duplicar** la base madre a nueva carpeta o repositorio del cliente.
6. **Configurar** nombre del proyecto, slug y metadatos del cliente.
7. **Configurar** `.env.local` propio del clon (secretos nuevos; nunca copiar service role de la madre sin rotación).
8. **Definir modo CRM operativo** como objetivo de entrega.
9. **Ocultar o desactivar** Constructor e Instalador para roles del cliente.
10. **Cargar** configuración derivada del diseño (módulos, pipeline, campos, reportes acordados).
11. **Validar** con propietarios del cliente (UAT acotado, checklist de activación).
12. **Habilitar usuarios operativos** solo si corresponde y tras controles de seguridad.

La duplicación (paso 5) **no sustituye** el diseño previo en la madre: el diseño y la evidencia pueden permanecer en la madre; el clon recibe la **configuración acordada** y una copia de código base alineada a una **versión etiquetada** de la madre.

---

## 6. Ejemplos de carpetas futuras

Nombres ilustrativos para proyectos clonados (convención sugerida: `{cliente|rubro}-crm-v{n}`):

- `pickup4x4-crm-v1`
- `ecuador-crm-v3`
- `crm-estudio-contable-v1`
- `crm-estudio-legal-v1`
- `crm-nuevocliente-v1`

Cada carpeta representa un **producto desplegable independiente** con su propio Supabase (o instancia acordada), `.env`, branding y datos operativos. La madre **no** sustituye a estos repos en producción del cliente.

---

## 7. Variables y configuración conceptual

Nombres **conceptuales** para futura implementación. **No están necesariamente implementados** en el código actual ni deben modificarse en `.env.local` en esta fase.

| Variable conceptual | Propósito |
|---------------------|-----------|
| `NEXT_PUBLIC_APP_NAME` | Nombre visible del CRM para el usuario final. |
| `NEXT_PUBLIC_CLIENT_SLUG` | Identificador corto del cliente (routing, assets, logs). |
| `NEXT_PUBLIC_CRM_MODE` | Modo de producto expuesto en cliente: `constructor` \| `operativo` \| `instalacion`. |
| `CONSTRUCTOR_ENABLED` | Flag servidor/cliente para habilitar rutas y menús del Constructor. |
| `CLIENT_BRANDING_ENABLED` | Activa personalización de marca del cliente en CRM operativo. |
| `SUPABASE_URL` | URL del proyecto Supabase **del clon** (no compartir con otros clientes sin política explícita). |
| `SUPABASE_ANON_KEY` | Clave anónima del entorno del cliente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; **nunca** en cliente ni en repositorios públicos. |
| `INTEGRATION_KORE_MODE` | Ej.: `off` \| `read_only` \| `read_write` (según contrato y fase del piloto). |

**Aclaraciones:**

- En la **base madre**, valores típicos de trabajo interno: Constructor habilitado para Summer87.
- En el **clon operativo del cliente**: `CONSTRUCTOR_ENABLED=false` (o equivalente) y `NEXT_PUBLIC_CRM_MODE=operativo`.
- Los secretos se generan **por entorno**; duplicar `.env.local` de la madre al clon es un **anti-patrón** documentado en riesgos.

---

## 8. Modos de operación

### 8.1 Modo Constructor

- Constructor e Instalador **visibles** para roles Summer87.
- Herramientas internas activas: drafts, simulación, snapshots, blueprint, auditoría pre-SQL, BCR (cuando exista UI).
- `package_payload` y evidencia técnica **accesibles**.
- **Usado por:** equipo Summer87 en `summer87-leads-v3` (base madre).

### 8.2 Modo CRM operativo

- Constructor **oculto** (menú, rutas, APIs internas no expuestas al rol cliente).
- Solo módulos operativos acordados en contrato.
- Sin auditoría técnica ni artefactos de instalación en UI.
- **Usado por:** cliente final y roles comerciales/admin del cliente.

### 8.3 Modo mixto / instalación controlada

- **Usado por Summer87** durante activación o piloto restringido.
- Constructor accesible **solo** con credenciales internas; CRM operativo visible en paralelo para pruebas con datos reales o sandbox.
- Útil **antes** de entregar el CRM al cliente; debe transicionarse explícitamente a modo operativo puro.
- Riesgo si se deja mixto en producción: cliente podría descubrir herramientas internas — requiere checklist de salida.

---

## 9. Qué debe quedar en la base madre

La base madre **conserva y evoluciona** la capacidad de fábrica:

- Motor **Constructor CRM** e **Instalador** (package drafts, generación, revisión).
- **Simulador** pre-instalación y **snapshots** de evidencia.
- **Meeting decisions**, planes bloqueados, resúmenes ejecutivos.
- **Auditoría pre-SQL** y flujo de cierre documental.
- **Base de Conocimiento por Rubro** (documentación y, en fases futuras, persistencia lado Summer87).
- **Presets** reutilizables (ej. `pickup_4x4`) y helpers de generación de package.
- **Pantallas operativas base** (leads, oportunidades, agenda, reportes) como plantilla del CRM que recibirá el clon.
- **Componentes UI** y libs compartidas reutilizables entre futuros clones.
- **Documentación** del Constructor (`docs/constructor-crm/`, contratos 7W, 8A–8G, etc.).
- **Migraciones** del esquema compartido (referencia para nuevos entornos Supabase del cliente).

La madre **no** es obligatoriamente el entorno de producción del cliente; es el **origen del código y del proceso**.

---

## 10. Qué debe limpiarse antes de declarar base virgen

Antes de etiquetar la madre como **virgen duplicable** o antes de clonar para un cliente real:

- Drafts de **prueba** de package instalable.
- **Snapshots** y simulaciones de test sin valor de evidencia.
- **Decisiones de reunión** ficticias o de sandbox.
- **Clientes demo**, leads demo y empresas de ejemplo no necesarias.
- Datos **legacy** no usados (seeds obsoletos, imports de prueba).
- **Motivos** o notas falsas en flujos de auditoría.
- **Payloads experimentales** en borradores.
- Configuraciones **temporales** de feature flags locales.
- Carpetas de tooling local que **no deben versionarse** (ej. `.claude/`, cachés, artefactos personales) — revisar `.gitignore`.

La limpieza es **por entorno**: la madre en git puede quedar limpia de datos si los datos viven solo en Supabase; igualmente hay que **vaciar o aislar** tablas de prueba en el proyecto Supabase de la madre antes de usarla como referencia mental de “virgen”.

---

## 11. Qué NO debe eliminarse sin auditoría

- **Preset `pickup_4x4`** y helper asociado, si se considera primer caso real o ejemplo controlado (ver sección 12).
- **Migraciones** existentes y contratos de `package_payload`.
- **Documentación** del Constructor y BCR (`docs/constructor-crm/`).
- **Helpers del instalador** y endpoints de simulación / evidencia (son capacidad de fábrica).
- **Pantallas de auditoría** y flujo Pickup 4x4 maduro (referencia de proceso).
- **Libs core** del CRM operativo (leads, pipelines, RBAC base).
- Cualquier recurso sectorial clasificado como reutilizable en **7O / 7P / 7Q**.

Eliminar sin auditoría rompe la capacidad de la madre de seguir diseñando CRMs y alimentando la BCR.

---

## 12. Estrategia para Pickup 4x4

**Pickup 4x4** es hoy el **caso semilla** más avanzado: preset `pickup_4x4`, flujo de draft, simulación, reunión, blueprint y documentación asociada.

**No debe borrarse** (código, preset ni evidencia en madre) sin antes:

1. **Exportar aprendizajes** hacia BCR (blueprint, preguntas, riesgos, lecciones) — promoción manual documentada.
2. **Documentar** qué artefactos fueron **test** vs. **caso real** (drafts, snapshots, datos Supabase).
3. **Decidir** si Pickup 4x4 se convierte en el **primer CRM operativo** duplicado (`pickup4x4-crm-v1`) o permanece solo como diseño en la madre.
4. **Decidir** si el preset permanece como **blueprint v0** del rubro automotriz/4x4 en BCR.
5. **Limpiar** datos falsos o de prueba en base de datos de la madre, manteniendo evidencia documental útil.

Hasta esas decisiones, Pickup 4x4 es **activo de referencia**, no basura descartable.

---

## 13. Evolución futura hacia generador / script

En una fase posterior podría existir un comando **conceptual** (no implementado):

```bash
npm run create-crm -- --client=pickup4x4 --preset=pickup_4x4
```

Ese generador futuro **podría**:

- Crear carpeta o repositorio desde plantilla etiquetada de la madre.
- Copiar estructura de archivos y excluir datos locales de prueba.
- Ajustar nombre de app y slug en plantillas.
- Generar `.env.example` sin secretos reales.
- Preparar branding placeholder y README del cliente.
- Insertar checklist de activación derivado del `activation_checklist` del diseño.
- Registrar versión de la madre origen (`base-mother-tag`) en el clon.

**Decisión actual:** no se crea ese script ni comando npm en la fase BM-0.

---

## 14. Riesgos del modelo base duplicable

- **Divergencia** entre CRMs clonados (cada uno evoluciona en su repo sin merge automático).
- **Mantenimiento difícil** si proliferan muchos clientes con parches locales.
- **Mejoras de la madre** que no se propagan a clones ya entregados.
- **Copiar datos de prueba** al clon (leads demo, drafts, credenciales).
- **Dejar Constructor visible** al cliente (confusión, riesgo de seguridad, soporte caótico).
- **Mezclar configuración madre** con configuración cliente (mismo Supabase, mismo `.env`).
- **Duplicar secretos** en `.env` o commitear claves por error.
- **Pérdida de trazabilidad** de qué versión de la madre originó cada clon.
- **Drift de esquema** si un clon aplica migraciones distintas sin política.

---

## 15. Controles recomendados

### 15.1 Antes de duplicar (checklist)

- [ ] Cierre documental del diseño aprobado en madre.
- [ ] Commit limpio y **tag de versión base** (ej. `mother-v1.0.0-pickup-ready`).
- [ ] Limpieza de datos demo en Supabase de referencia (o uso de proyecto Supabase nuevo para el clon).
- [ ] `.env.example` actualizado **sin secretos** en la madre.
- [ ] Inventario de qué va al clon vs. qué queda solo en madre (BCR, drafts históricos).
- [ ] Revisión de rutas internas del Constructor y política de ocultamiento acordada.

### 15.2 Después de duplicar (checklist)

- [ ] Nuevo `.env.local` con credenciales **propias** del cliente.
- [ ] `CONSTRUCTOR_ENABLED` / modo operativo configurado según entrega.
- [ ] Menú y RBAC: roles cliente sin acceso a Constructor.
- [ ] Sin datos de prueba de la madre en el entorno del cliente.
- [ ] **Documentación por cliente** (README, alcance piloto, contactos, integraciones).
- [ ] **Backup** o snapshot de infra antes de activar usuarios reales.
- [ ] Registro de versión madre origen en README del clon.

### 15.3 Controles continuos

- Política de **backport** selectivo (qué bugs se arreglan en madre y se cherry-pick a clientes).
- Revisión periódica de **flags** y rutas internas en builds de producción cliente.

---

## 16. Relación con Base de Conocimiento por Rubro

- La **base madre** es donde Summer87 **acumula** conocimiento estratégico (BCR) y diseña nuevos CRMs.
- Cada **CRM cliente**, una vez operativo, puede **alimentar la BCR** con lecciones y deltas (promovidas desde casos reales, anonimizadas).
- El **clon del cliente** no necesita exponer la BCR ni drafts históricos de otros clientes.
- La BCR **vive del lado Summer87 / Constructor** (madre o servicio interno futuro), no como módulo visible para el usuario final del CRM operativo.
- La duplicación copia **código y configuración acordada**; el **aprendizaje reusable** se centraliza en la madre (o repositorio de conocimiento compartido), evitando contaminar el entorno del cliente con datos de otros rubros o clientes.

Ver: `docs/constructor-crm/base-conocimiento-por-rubro.md`.

---

## 17. Implementación por fases

| Fase | Nombre | Alcance |
|------|--------|---------|
| **F0** | Decisión documental | Este documento + BCR documentada; Opción 2 adoptada explícitamente. |
| **F1** | Checklist limpieza base madre | Inventario demo/test; política `.gitignore`; criterios “virgen duplicable”. |
| **F2** | Modos Constructor / operativo / instalación | Especificación de flags y RBAC (documental → implementación futura). |
| **F3** | Primera duplicación manual controlada | Ej. `pickup4x4-crm-v1` sin generador automático. |
| **F4** | Activación piloto restringida | Usuarios limitados, integraciones acotadas (ej. Kore read-only). |
| **F5** | Extracción de aprendizajes a BCR | Promoción desde caso Pickup (y siguientes) a blueprints/lecciones. |
| **F6** | Generador automático futuro | `create-crm` o equivalente, solo tras F3–F5 validados. |

Ninguna fase posterior se considera implementada por el solo hecho de publicar este documento.

---

## 18. Decisión actual

**Por ahora se adopta el modelo de base madre duplicable.** No se implementa todavía un generador automático ni scripts de clonación.

**Antes de duplicar para clientes reales**, se debe **auditar y limpiar** la base madre (datos, drafts, secretos, visibilidad del Constructor) según las secciones 10, 11 y 15.

**summer87-leads-v3** permanece como repositorio de trabajo de Summer87 para diseño y fábrica; los CRMs entregados al cliente serán **instancias separadas** (carpeta/proyecto + entorno + datos propios) derivadas de una versión etiquetada de esta madre.

---

## 19. Confirmación de alcance

Este documento:

- **No crea scripts** ni comandos `npm run create-crm`.
- **No crea carpetas** de cliente en el filesystem del repo.
- **No modifica** `.env`, `.env.local` ni `.env.example` existentes.
- **No crea SQL** ni migraciones.
- **No crea endpoints** nuevos.
- **No modifica datos** en Supabase, Kore ni Zeta.
- **No instala CRM** ni crea tenants.
- **No crea usuarios** ni credenciales.
- **No escribe en Kore ni en Zeta.**

Es un artefacto de **decisión estratégica y diseño operativo** para Summer87 Leads v3 / Constructor CRM.

---

*Última actualización: fase BM-0 — documentación inicial.*
