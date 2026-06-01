import {
  BookOpen,
  AlertTriangle,
  Terminal,
  ShieldAlert,
  ListChecks,
  FileText,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";

/**
 * CONSTRUCTOR-OPERATIONS-2 — Manual operativo visible dentro del Constructor interno.
 *
 * Versión estructurada (React) del manual completo en
 * docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md
 *
 * Server component, solo lectura: no ejecuta SQL, no activa motores, no escribe datos.
 * Protegido por app/admin/constructor-crm/layout.tsx (redirige a /403 en client_crm).
 */

const FLUJO: { paso: string; detalle: string }[] = [
  { paso: "Venta", detalle: "Se vende un CRM nuevo: cliente, rubro/vertical estimado, dominio." },
  { paso: "Clonar base", detalle: "Copiar summer87-leads-v3 a la carpeta de la instancia nueva." },
  { paso: "Entorno", detalle: "Supabase propio, Vercel, dominio y .env.local de la instancia (sin secretos en repo)." },
  { paso: "Usuario setup", detalle: "Seed manual del usuario setup (SQL manual) y rotación de PIN." },
  { paso: "Discovery", detalle: "Completar el relevamiento en /admin/constructor-crm/cuestionario." },
  { paso: "Vertical", detalle: "Confirmar el vertical correcto (persiste meta.vertical_key)." },
  { paso: "Terminé", detalle: "Cerrar el Discovery: snapshot en meta.discovery_submission." },
  { paso: "Runtime", detalle: "Revisar runtime read-only (ready_readonly) y vertical efectivo." },
  { paso: "QA", detalle: "Selftests + npm run build + verificación funcional." },
  { paso: "Activación", detalle: "Deshabilitar setup, crear usuarios reales, APP_MODE=client_crm, deploy." },
];

const COMANDOS_BASE = `cd /Users/danielodella/PROYECTOS
cp -R summer87-leads-v3 nombre-del-nuevo-crm
cd /Users/danielodella/PROYECTOS/nombre-del-nuevo-crm
git status --short
npm install
npm run build
npm run dev`;

const SEMAFORO: { color: string; dot: string; titulo: string; items: string[] }[] = [
  {
    color: "border-green-200 bg-green-50",
    dot: "bg-green-600",
    titulo: "VERDE — listo para avanzar",
    items: [
      "Discovery cerrado con vertical confirmado.",
      "Runtime ready_readonly, vertical correcto.",
      "human_review_required=false (o resuelto).",
      "Build OK, sin errores.",
    ],
  },
  {
    color: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
    titulo: "AMARILLO — revisar antes de seguir",
    items: [
      "Blockers no críticos o campos faltantes menores.",
      "Supabase/Vercel/dominio sin validar end-to-end.",
      "Dudas sobre el vertical o módulos.",
    ],
  },
  {
    color: "border-red-200 bg-red-50",
    dot: "bg-red-600",
    titulo: "ROJO — detenerse",
    items: [
      "PIN del setup sin rotar (must_change_password=true).",
      "CONSTRUCTOR_AUTH_BYPASS encendido.",
      ".env.local apuntando al Supabase del base u otra instancia.",
      "Blockers críticos sin resolver.",
    ],
  },
];

const CHECKLIST_ENTREGA: string[] = [
  "Discovery cerrado y vertical confirmado.",
  "Runtime ready_readonly revisado; diagnóstico de navegación coherente.",
  "Usuario setup con PIN rotado y luego deshabilitado/reemplazado.",
  "Sesiones de setup invalidadas (0 activas).",
  "Usuarios reales del cliente creados (invitación o SQL manual confirmado).",
  ".env.local con valores de la instancia; CONSTRUCTOR_AUTH_BYPASS off.",
  "Selftests OK + npm run build EXIT 0.",
  "APP_MODE=client_crm (Constructor responde 403) + deploy + acceso entregado.",
];

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
      <Icon className="h-5 w-5 text-slate-500" />
      {children}
    </h2>
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

          {/* Advertencia interna */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Este manual es interno. No ejecuta SQL, no activa motores y no crea
              CRM operativo.
            </p>
          </div>
        </div>

        {/* ── Flujo general ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <SectionTitle icon={CircleDot}>
            Flujo general: venta → Discovery → vertical → runtime → QA → activación
          </SectionTitle>
          <ol className="mt-4 space-y-2">
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
        </div>

        {/* ── Usuario setup ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <SectionTitle icon={ShieldAlert}>Usuario de instalación: setup</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">username</td>
                  <td className="px-4 py-2 font-mono text-slate-900">setup</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">PIN inicial</td>
                  <td className="px-4 py-2 font-mono text-slate-900">1234</td>
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">Rol</td>
                  <td className="px-4 py-2 text-slate-900">
                    setup (acceso acotado a Constructor/Discovery; sin permisos operativos)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              El PIN <span className="font-mono">1234</span> es solo de instalación
              local y <strong>debe cambiarse antes de exposición</strong>. El login
              bloquea el usuario hasta rotar el PIN vía{" "}
              <span className="font-mono">POST /api/proto/change-pin</span> (no crea
              sesión: luego hay que volver a iniciar sesión). El usuario setup es
              temporal: deshabilitar o reemplazar antes de entregar el CRM. Nunca
              entregarlo al cliente.
            </p>
          </div>
        </div>

        {/* ── Comandos base ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <SectionTitle icon={Terminal}>Comandos base (Terminal)</SectionTitle>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 px-5 py-4 text-xs leading-relaxed text-slate-100">
            <code>{COMANDOS_BASE}</code>
          </pre>
        </div>

        {/* ── Advertencia SQL manual ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <SectionTitle icon={ShieldAlert}>SQL manual</SectionTitle>
          <p className="mt-3 text-sm font-medium text-red-800">
            Todo SQL debe revisarse y ejecutarse manualmente. Nunca asumir que
            Claude lo ejecutó.
          </p>
          <p className="mt-2 text-sm text-red-700">
            Los archivos <span className="font-mono">.sql</span> del repo son
            plantillas revisables (seed del usuario setup, baja/rotación). Se aplican
            a mano en el SQL Editor de Supabase, dentro de{" "}
            <span className="font-mono">BEGIN; … COMMIT;</span>, con confirmación
            humana. No commitear hashes ni secretos.
          </p>
        </div>

        {/* ── Semáforo GO / NO-GO ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <SectionTitle icon={CircleDot}>Semáforo GO / NO-GO interno</SectionTitle>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
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
        </div>

        {/* ── Checklist final ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <SectionTitle icon={ListChecks}>
            Checklist final antes de entregar al cliente
          </SectionTitle>
          <ul className="mt-4 space-y-2">
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
        </div>

        {/* ── Referencia al archivo completo ───────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <SectionTitle icon={FileText}>Manual completo</SectionTitle>
          <p className="mt-3 text-sm text-slate-600">
            Esta pantalla es una versión estructurada. El manual completo (todas las
            secciones A–AL: requisitos, GitHub, Supabase, Vercel, dominio, errores
            comunes, qué NO hacer nunca, etc.) está en el repositorio:
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
        </div>
      </div>
    </PageContainer>
  );
}
