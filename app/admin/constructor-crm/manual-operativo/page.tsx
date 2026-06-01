import {
  BookOpen,
  AlertTriangle,
  Terminal,
  ShieldAlert,
  ListChecks,
  FileText,
  CircleDot,
  Building2,
  KeyRound,
  Database,
  Layers,
  Gauge,
  CheckCircle2,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";

/**
 * CONSTRUCTOR-OPERATIONS-3 — Manual operativo completo visible dentro del Constructor.
 *
 * Versión estructurada y extendida (React) del manual completo en
 * docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md
 *
 * Server component, solo lectura: no ejecuta SQL, no activa motores, no escribe datos.
 * Accesible desde el menú lateral (constructor_manual_operativo, categoría
 * internal_constructor) y desde la card del dashboard. Protegido por
 * app/admin/constructor-crm/layout.tsx (redirige a /403 en client_crm).
 */

const FLUJO: { paso: string; detalle: string }[] = [
  { paso: "Venta del CRM", detalle: "Se cierra la venta: cliente, rubro/vertical estimado y dominio deseado." },
  { paso: "Relevamiento inicial", detalle: "Datos mínimos del negocio para arrancar el Discovery." },
  { paso: "Clonación del proyecto", detalle: "Copiar summer87-leads-v3 a la carpeta de la instancia nueva." },
  { paso: "Configuración del entorno", detalle: ".env.local propio de la instancia (sin secretos en repo) + npm install." },
  { paso: "Supabase / Vercel / dominio", detalle: "Proyecto Supabase propio, proyecto Vercel y dominio/subdominio + HTTPS." },
  { paso: "Usuario setup", detalle: "Seed manual del usuario setup (SQL manual revisado) para el primer acceso." },
  { paso: "Discovery", detalle: "Completar el cuestionario en /admin/constructor-crm/cuestionario." },
  { paso: "Confirmación de vertical", detalle: "Elegir y confirmar el vertical correcto (meta.vertical_key)." },
  { paso: "Cierre con “Terminé”", detalle: "Sella el snapshot del Discovery (meta.discovery_submission)." },
  { paso: "Runtime read-only", detalle: "Revisar estado de preparación (ready_readonly) y vertical efectivo." },
  { paso: "QA interno", detalle: "Selftests + npm run build + verificación funcional de pantallas." },
  { paso: "Activación en cliente", detalle: "APP_MODE=client_crm + deploy + entrega de accesos reales." },
  { paso: "Baja/reemplazo de setup", detalle: "Deshabilitar o reemplazar el usuario setup antes de exponer." },
];

const VERTICALES: { key: string; label: string; pricing: boolean }[] = [
  { key: "generic", label: "Genérico", pricing: false },
  { key: "cleaning_services", label: "Servicios de limpieza", pricing: true },
  { key: "pickup_4x4", label: "Pickup 4x4", pricing: false },
  { key: "marketing_agency", label: "Agencia de marketing", pricing: false },
  { key: "education", label: "Educación", pricing: false },
];

const COMANDOS_CLON = `cd /Users/danielodella/PROYECTOS
cp -R summer87-leads-v3 nombre-del-nuevo-crm
cd /Users/danielodella/PROYECTOS/nombre-del-nuevo-crm
git status --short
npm install
npm run build
npm run dev`;

const COMANDO_CHANGE_PIN = `curl -X POST http://localhost:3000/api/proto/change-pin \\
  -H "Content-Type: application/json" \\
  -d '{"username":"setup","currentPin":"1234","newPin":"NUEVO_PIN"}'`;

const APP_MODES: { mode: string; detalle: string }[] = [
  { mode: "constructor_base", detalle: "Modo Constructor / base madre (default). Se usa para configurar." },
  { mode: "installation_prep", detalle: "Preparación de una instalación. Constructor interno disponible." },
  { mode: "client_crm", detalle: "CRM operativo del cliente. El Constructor queda BLOQUEADO (403)." },
];

const SEMAFORO: { color: string; dot: string; titulo: string; items: string[] }[] = [
  {
    color: "border-green-200 bg-green-50",
    dot: "bg-green-600",
    titulo: "VERDE — listo para avanzar",
    items: [
      "Build OK.",
      "Discovery cerrado.",
      "Vertical confirmado.",
      "Setup rotado o deshabilitado.",
      "client_crm validado (Constructor no visible).",
    ],
  },
  {
    color: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
    titulo: "AMARILLO — revisar antes de seguir",
    items: [
      "Falta validar una pantalla.",
      "Setup sigue activo temporalmente.",
      "Falta aplicar SQL manual.",
      "Runtime con warnings.",
    ],
  },
  {
    color: "border-red-200 bg-red-50",
    dot: "bg-red-600",
    titulo: "ROJO — detenerse",
    items: [
      "SQL no revisado.",
      "setup/1234 activo en entorno expuesto.",
      ".env.local comprometido.",
      "client_crm muestra el Constructor.",
      "Build falla.",
      "Datos reales mezclados con pruebas.",
    ],
  },
];

const QA_CHECKLIST: string[] = [
  "npm run build OK",
  "Login OK",
  "Dashboard Constructor OK",
  "Manual visible OK",
  "Discovery OK",
  "Vertical confirmado OK",
  "“Terminé” OK",
  "Runtime OK",
  "Setup rotado/deshabilitado antes de entregar",
  "client_crm no muestra el Constructor",
];

const CHECKLIST_ENTREGA: string[] = [
  "Dominio conectado (HTTPS).",
  "Supabase correcto (instancia propia).",
  "Variables de entorno revisadas.",
  "Usuario cliente real creado.",
  "Setup deshabilitado/reemplazado.",
  "Login del cliente probado.",
  "Rutas internas bloqueadas (client_crm → 403).",
  "Datos de prueba limpiados.",
  "Backup/documentación archivada.",
];

const NO_HACER: string[] = [
  "No ejecutar SQL sin confirmación humana.",
  "No commitear .env.local.",
  "No dejar setup/1234 expuesto.",
  "No tocar Casa Limpia ni Ecuador desde este proyecto.",
  "No activar motores sin validación.",
  "No crear CRM operativo desde un snapshot incompleto.",
];

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Icon className="h-5 w-5 text-slate-500" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-900 px-5 py-4 text-xs leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export default function ManualOperativoPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
            <BookOpen className="h-3 w-3" />
            Constructor CRM
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Manual operativo del Constructor CRM
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
            Desde la venta de un nuevo CRM hasta la activación en cliente.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Este manual es interno. No ejecuta SQL, no activa motores y no crea
              CRM operativo.
            </p>
          </div>
        </div>

        {/* ── A. Qué es el Constructor CRM ─────────────────────────────────── */}
        <SectionCard icon={Building2} title="A. Qué es el Constructor CRM">
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-900">summer87-leads-v3</strong> es la
              base madre que se <strong>clona</strong> para crear cada CRM nuevo de un
              cliente. El <strong>Constructor</strong> es el modo interno de esa base
              para relevar, configurar y diagnosticar la instancia antes de entregarla.
            </p>
            <p>
              El Constructor es para{" "}
              <strong className="text-slate-900">Summer87 / EASY / el instalador</strong>,
              no para el cliente final.
            </p>
            <p>
              El <strong className="text-slate-900">cliente final</strong> usa el{" "}
              <strong>CRM operativo</strong> (modo <span className="font-mono">client_crm</span>),
              donde el Constructor queda bloqueado por diseño.
            </p>
          </div>
        </SectionCard>

        {/* ── B. Flujo completo ────────────────────────────────────────────── */}
        <SectionCard
          icon={CircleDot}
          title="B. Flujo completo desde venta hasta activación"
        >
          <ol className="space-y-2">
            {FLUJO.map((f, i) => (
              <li
                key={f.paso}
                className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{f.paso}.</span>{" "}
                  {f.detalle}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>

        {/* ── C. Cómo clonar ───────────────────────────────────────────────── */}
        <SectionCard icon={Terminal} title="C. Cómo clonar una nueva instancia">
          <CodeBlock>{COMANDOS_CLON}</CodeBlock>
          <p className="mt-3 text-sm text-slate-600">
            Reemplazar <span className="font-mono">nombre-del-nuevo-crm</span> por el{" "}
            <strong>slug real</strong> del cliente (kebab-case, sin acentos ni espacios:
            ej. <span className="font-mono">acme-crm</span>). Tras el{" "}
            <span className="font-mono">cp -R</span> conviene limpiar{" "}
            <span className="font-mono">node_modules</span> y{" "}
            <span className="font-mono">.next</span> antes de{" "}
            <span className="font-mono">npm install</span>.
          </p>
        </SectionCard>

        {/* ── D. Entorno y variables ───────────────────────────────────────── */}
        <SectionCard icon={Database} title="D. Entorno y variables">
          <ul className="mb-4 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>
              • <span className="font-mono">.env.local</span>{" "}
              <strong>nunca</strong> se commitea (está en <span className="font-mono">.gitignore</span>).
            </li>
            <li>
              • Cada clon debe tener su <strong>propio Supabase</strong> (no reutilizar
              el del base ni el de otra instancia).
            </li>
            <li>• APP_MODE define el comportamiento de la instancia:</li>
          </ul>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {APP_MODES.map((m) => (
                  <tr key={m.mode}>
                    <td className="w-48 bg-slate-50 px-4 py-2 font-mono text-slate-900">
                      {m.mode}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{m.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-medium text-amber-700">
            En <span className="font-mono">client_crm</span> el Constructor se bloquea
            (todas las rutas <span className="font-mono">/admin/constructor-crm/*</span> → 403).
          </p>
        </SectionCard>

        {/* ── E. Usuario setup ─────────────────────────────────────────────── */}
        <SectionCard icon={ShieldAlert} title="E. Usuario setup">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="w-40 bg-slate-50 px-4 py-2 font-medium text-slate-600">username</td>
                  <td className="px-4 py-2 font-mono text-slate-900">setup</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">PIN inicial</td>
                  <td className="px-4 py-2 font-mono text-slate-900">1234</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">Uso</td>
                  <td className="px-4 py-2 text-slate-700">Instalación / configuración inicial.</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">Naturaleza</td>
                  <td className="px-4 py-2 text-slate-700">
                    Temporal. <strong>No</strong> es usuario operativo final.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              El usuario setup <strong>debe cambiar su PIN</strong> y luego{" "}
              <strong>deshabilitarse o reemplazarse antes de la exposición real</strong>{" "}
              al cliente. Nunca entregar <span className="font-mono">setup/1234</span> al cliente.
            </p>
          </div>
        </SectionCard>

        {/* ── F. Cambio de PIN ─────────────────────────────────────────────── */}
        <SectionCard icon={KeyRound} title="F. Cambio de PIN">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            El login bloquea al usuario mientras tenga{" "}
            <span className="font-mono">must_change_password=true</span>. El cambio se
            hace por endpoint, <strong>sin sesión</strong>:
          </p>
          <CodeBlock>{COMANDO_CHANGE_PIN}</CodeBlock>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>
              • <span className="font-mono">POST /api/proto/change-pin</span> con{" "}
              <span className="font-mono">{"{ username, currentPin, newPin }"}</span>.
            </li>
            <li>• No crea sesión automáticamente.</li>
            <li>• Luego hay que iniciar sesión con el PIN nuevo.</li>
            <li>• No guardar el PIN en texto plano (se almacena como hash bcrypt).</li>
            <li>• No compartir <span className="font-mono">setup/1234</span> con el cliente.</li>
          </ul>
        </SectionCard>

        {/* ── G. SQL manual ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            G. SQL manual
          </h2>
          <p className="mt-3 text-sm font-semibold text-red-800">
            Todo SQL debe revisarse y ejecutarse manualmente. Nunca asumir que Claude
            lo ejecutó.
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-red-700">
            <li>• El bootstrap del setup genera SQL <strong>revisable</strong> (no lo ejecuta).</li>
            <li>• El SQL de baja/rotación del setup se aplica <strong>manualmente</strong>.</li>
            <li>• No hay SQL automático en el repo.</li>
            <li>• No ejecutar nada sin confirmación humana, siempre dentro de <span className="font-mono">BEGIN; … COMMIT;</span>.</li>
          </ul>
        </section>

        {/* ── H. Discovery ─────────────────────────────────────────────────── */}
        <SectionCard icon={ListChecks} title="H. Discovery">
          <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
            <li>• Completar el cuestionario en <span className="font-mono">/admin/constructor-crm/cuestionario</span>.</li>
            <li>• Confirmar el vertical correcto.</li>
            <li>• Usar <strong>“Terminé”</strong> para cerrar el snapshot.</li>
            <li>• El snapshot <strong>no</strong> crea CRM operativo.</li>
            <li>• <strong>No</strong> activa motores.</li>
            <li>• <strong>No</strong> genera package_payload.</li>
          </ul>
        </SectionCard>

        {/* ── I. Verticales ────────────────────────────────────────────────── */}
        <SectionCard icon={Layers} title="I. Verticales">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Key</th>
                  <th className="px-4 py-2 font-medium">Vertical</th>
                  <th className="px-4 py-2 font-medium">Costeo/Cotización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {VERTICALES.map((v) => (
                  <tr key={v.key}>
                    <td className="px-4 py-2 font-mono text-slate-900">{v.key}</td>
                    <td className="px-4 py-2 text-slate-700">{v.label}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {v.pricing ? "Requiere módulo de costeo" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            El costeo/cotización <strong>no es universal</strong>: solo algunos
            verticales lo requieren (los <span className="font-mono">quoting_blockers</span>{" "}
            solo aplican cuando el vertical declara un módulo de pricing).
          </p>
        </SectionCard>

        {/* ── J. Runtime read-only ─────────────────────────────────────────── */}
        <SectionCard icon={Gauge} title="J. Runtime read-only">
          <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
            <li>• Muestra el estado de preparación (<span className="font-mono">ready_readonly</span> / blocked / review).</li>
            <li>• <strong>No</strong> activa nada.</li>
            <li>• <strong>No</strong> modifica la navegación real.</li>
            <li>• Sirve como <strong>diagnóstico</strong> (incluye el diagnóstico de navegación por vertical).</li>
          </ul>
        </SectionCard>

        {/* ── K. QA interno ────────────────────────────────────────────────── */}
        <SectionCard icon={CheckCircle2} title="K. QA interno">
          <ul className="space-y-2">
            {QA_CHECKLIST.map((it) => (
              <li
                key={it}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-[10px] text-slate-400">
                  ☐
                </span>
                <span className="text-sm text-slate-700">{it}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* ── L. Semáforo ──────────────────────────────────────────────────── */}
        <SectionCard icon={CircleDot} title="L. Semáforo operativo">
          <div className="grid gap-4 md:grid-cols-3">
            {SEMAFORO.map((s) => (
              <div key={s.titulo} className={`rounded-xl border p-5 ${s.color}`}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${s.dot}`} />
                  <p className="text-sm font-semibold text-slate-800">{s.titulo}</p>
                </div>
                <ul className="space-y-1.5">
                  {s.items.map((it) => (
                    <li key={it} className="text-xs leading-relaxed text-slate-600">
                      • {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── M. Checklist final ───────────────────────────────────────────── */}
        <SectionCard icon={ListChecks} title="M. Checklist final antes de entregar al cliente">
          <ul className="space-y-2">
            {CHECKLIST_ENTREGA.map((it) => (
              <li
                key={it}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-[10px] text-slate-400">
                  ☐
                </span>
                <span className="text-sm text-slate-700">{it}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* ── N. Qué no hacer nunca ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Ban className="h-5 w-5 text-red-600" />
            N. Qué no hacer nunca
          </h2>
          <ul className="mt-4 space-y-2">
            {NO_HACER.map((it) => (
              <li key={it} className="flex items-start gap-2 text-sm text-red-800">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {it}
              </li>
            ))}
          </ul>
        </section>

        {/* ── O. Referencia al manual completo ─────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FileText className="h-5 w-5 text-slate-500" />
            O. Referencia al manual completo
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Esta pantalla resume el proceso operativo. El manual exhaustivo (todas las
            secciones A–AL: requisitos, GitHub, Supabase, Vercel, dominio, comandos
            frecuentes, errores comunes, pendientes técnicos, etc.) está en el repositorio:
          </p>
          <p className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-mono text-xs text-slate-800">
            docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md
          </p>
          <p className="mt-4">
            <Link
              href="/admin/constructor-crm"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              ← Volver al Constructor
            </Link>
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
