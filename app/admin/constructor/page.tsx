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
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

const CONSTRUCTOR_STEPS = [
  {
    step: 1,
    icon: Building2,
    title: "Empresa",
    description: "Nombre, país, rubro y vertical. La base del CRM.",
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Cuestionario",
    description: "Preguntas guiadas para entender cómo vendés y a quién.",
  },
  {
    step: 3,
    icon: FileText,
    title: "Documentos fuente",
    description: "PDF, Excel, contratos y formularios que reflejan tu proceso real.",
  },
  {
    step: 4,
    icon: Search,
    title: "Diagnóstico comercial",
    description: "La IA analiza tu negocio y detecta tu modelo de venta.",
  },
  {
    step: 5,
    icon: GitBranch,
    title: "Proceso y pipeline",
    description: "Etapas internas del proceso y tablero visual de leads.",
  },
  {
    step: 6,
    icon: Bot,
    title: "Motores IA",
    description: "Qué inteligencias asistirán a tu equipo en cada etapa.",
  },
  {
    step: 7,
    icon: BarChart3,
    title: "Reportes",
    description: "Métricas, KPIs y reportes para gerenciar el CRM.",
  },
  {
    step: 8,
    icon: ShieldCheck,
    title: "Auditoría final",
    description: "Revisión experta antes de activar el primer lead real.",
  },
] as const;

export default function ConstructorCRMPage() {
  return (
    <PageContainer>
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

          {/* Info note */}
          <div className="mt-4 inline-flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="mt-0.5 shrink-0 text-slate-400">ℹ</span>
            <span>
              La configuración se completa una sola vez. Una vez aprobada por
              el auditor, el CRM se activa y podés cargar leads reales.
            </span>
          </div>
        </div>

        {/* Steps grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONSTRUCTOR_STEPS.map(({ step, icon: Icon, title, description }) => (
            <div
              key={step}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Paso {step}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Iniciar configuración
          </button>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Disponible en Bloque 1B
          </span>
        </div>

      </div>
    </PageContainer>
  );
}
