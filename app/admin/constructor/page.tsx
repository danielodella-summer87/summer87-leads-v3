import {
  Building2,
  ClipboardList,
  FileText,
  Search,
  GitBranch,
  Bot,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  CircleDot,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  CRM_MODE,
  CRM_MODE_LABELS,
  CRM_SETUP_STEPS,
  getCRMSetupProgress,
  isSetupMode,
  isActiveMode,
  type CRMSetupStepStatus,
} from "@/lib/config/crmMode";

// ─── Mapeo de iconos por step id ──────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    empresa: Building2,
    cuestionario: ClipboardList,
    documentos: FileText,
    diagnostico: Search,
    "proceso-pipeline": GitBranch,
    "motores-ia": Bot,
    reportes: BarChart3,
    auditoria: ShieldCheck,
  };

// ─── Estilos por estado ───────────────────────────────────────────────────────

const CARD_STYLES: Record<CRMSetupStepStatus, string> = {
  current: "border-slate-900 bg-white shadow-sm",
  done: "border-green-200 bg-green-50",
  pending: "border-slate-200 bg-slate-50",
  locked: "border-slate-200 bg-slate-50 opacity-50",
};

const ICON_BG: Record<CRMSetupStepStatus, string> = {
  current: "bg-slate-900 text-white",
  done: "bg-green-600 text-white",
  pending: "bg-slate-300 text-white",
  locked: "bg-slate-300 text-white",
};

const STATUS_BADGE: Record<
  CRMSetupStepStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  current: { label: "Actual", className: "bg-amber-50 text-amber-700 border-amber-200", icon: CircleDot },
  done:    { label: "Completado", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Pendiente", className: "bg-slate-100 text-slate-500 border-slate-200", icon: Circle },
  locked:  { label: "Bloqueado", className: "bg-slate-100 text-slate-400 border-slate-200", icon: Lock },
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ConstructorCRMPage() {
  const progress = getCRMSetupProgress();
  const inSetupMode = isSetupMode(CRM_MODE);
  const inActiveMode = isActiveMode(CRM_MODE);

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Aviso de estado ─────────────────────────────────────────────── */}
        {inSetupMode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">
              Estado actual: Configuración inicial
            </p>
            <p className="mt-1 text-sm text-amber-700">
              El CRM todavía está en etapa de diseño. Los leads siguen
              disponibles por ahora, pero en una fase posterior se bloquearán
              hasta completar la configuración.
            </p>
          </div>
        )}
        {inActiveMode && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm font-semibold text-green-800">
              Estado actual: CRM activo
            </p>
            <p className="mt-1 text-sm text-green-700">
              El CRM ya está habilitado para operar leads reales.
            </p>
          </div>
        )}

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              <Sparkles className="h-3 w-3" />
              Summer87 Leads v3
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Constructor de CRM Comercial
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
              Antes de cargar el primer lead, el sistema te guía para configurar
              tu empresa, proceso comercial, pipeline, motores IA, reportes y
              auditoría final. Solo después de aprobar la configuración, el CRM
              queda habilitado para operar.
            </p>
          </div>

          {/* ── Estado del Constructor ─────────────────────────────────────── */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                Estado del Constructor
              </p>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-500">
                {CRM_MODE_LABELS[CRM_MODE]}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                <span className="font-medium text-slate-700">
                  {progress.completedSteps}
                </span>{" "}
                de{" "}
                <span className="font-medium text-slate-700">
                  {progress.totalSteps}
                </span>{" "}
                pasos completados
              </span>
              {progress.currentStep && (
                <span>
                  Próximo paso:{" "}
                  <span className="font-medium text-slate-700">
                    {progress.currentStep.title}
                  </span>
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-amber-600">
              En este bloque todavía no se guarda información. La persistencia
              se conectará en una fase posterior.
            </p>
          </div>

          {/* ── Cards de pasos ─────────────────────────────────────────────── */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CRM_SETUP_STEPS.map((s) => {
              const Icon = STEP_ICONS[s.id] ?? Building2;
              const badge = STATUS_BADGE[s.status];
              const BadgeIcon = badge.icon;
              const cardClass = `flex flex-col gap-3 rounded-xl border p-4 ${CARD_STYLES[s.status]}`;
              const inner = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_BG[s.status]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                    >
                      <BadgeIcon className="h-2.5 w-2.5" />
                      {badge.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Paso {s.step}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {s.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {s.description}
                    </p>
                  </div>
                </>
              );
              return s.href ? (
                <Link
                  key={s.id}
                  href={s.href}
                  className={`${cardClass} hover:shadow-md transition-shadow`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={s.id} className={cardClass}>
                  {inner}
                </div>
              );
            })}
          </div>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin/constructor/empresa"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Comenzar con Empresa
            </Link>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
