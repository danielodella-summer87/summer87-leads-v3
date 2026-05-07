"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  ShieldCheck,
  Building2,
  ClipboardList,
  FileText,
  Search,
  GitBranch,
  Bot,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  ClipboardCheck,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Severidad = "alta" | "media" | "baja";
type EstadoRiesgo = "pendiente" | "mitigado" | "aceptado";

type ItemChecklist = {
  id: string;
  label: string;
  descripcion: string;
  checked: boolean;
};

type Riesgo = {
  id: string;
  descripcion: string;
  severidad: Severidad;
  estado: EstadoRiesgo;
  observacion: string;
};

// ─── Datos estáticos ──────────────────────────────────────────────────────────

const PASOS_RESUMEN = [
  {
    id: "empresa",
    step: 1,
    title: "Empresa",
    icon: Building2,
    href: "/admin/constructor/empresa",
    resumen:
      "Datos base configurados: rubro, giro, vertical y datos de contacto.",
  },
  {
    id: "cuestionario",
    step: 2,
    title: "Cuestionario",
    icon: ClipboardList,
    href: "/admin/constructor/cuestionario",
    resumen: "Modelo comercial relevado mediante cuestionario guiado.",
  },
  {
    id: "documentos",
    step: 3,
    title: "Documentos fuente",
    icon: FileText,
    href: "/admin/constructor/documentos",
    resumen:
      "Materiales de referencia subidos o referenciados para contexto del CRM.",
  },
  {
    id: "diagnostico",
    step: 4,
    title: "Diagnóstico comercial",
    icon: Search,
    href: "/admin/constructor/diagnostico",
    resumen:
      "Proceso de venta analizado, gaps detectados y riesgos identificados.",
  },
  {
    id: "proceso-pipeline",
    step: 5,
    title: "Proceso y pipeline",
    icon: GitBranch,
    href: "/admin/constructor/proceso-pipeline",
    resumen:
      "Pipeline diseñado visualmente: etapas, tareas y condiciones de avance. Pendiente de sincronización operativa.",
  },
  {
    id: "motores-ia",
    step: 6,
    title: "Motores IA",
    icon: Bot,
    href: "/admin/constructor/motores-ia",
    resumen:
      "Motores IA diseñados visualmente con etapa, input, output y reglas. Pendiente de conexión real.",
  },
  {
    id: "reportes",
    step: 7,
    title: "Reportes",
    icon: BarChart3,
    href: "/admin/constructor/reportes",
    resumen:
      "Reportes definidos visualmente por tipo, audiencia y frecuencia. Pendiente de conexión con datos reales.",
  },
];

const VALIDATION_REPORT_STEPS = [
  {
    id: "empresa",
    step: 1,
    title: "Empresa",
    icon: Building2,
    importance: "Obligatorio",
    status: "Completo",
    expected:
      "Identidad, rubro, giro, vertical, país, ciudad, tipos de cliente y contexto general de negocio.",
    usage:
      "Se usará como contexto base para adaptar el CRM, los reportes y los motores de IA.",
    tip: "Cuanto más precisa sea esta sección, mejores serán las recomendaciones automáticas del sistema.",
  },
  {
    id: "cuestionario",
    step: 2,
    title: "Cuestionario comercial",
    icon: ClipboardList,
    importance: "Obligatorio",
    status: "Completo",
    expected:
      "Modelo de venta, criterios comerciales, decisores, motivos de pérdida, métricas y necesidades de reportes.",
    usage:
      "Define cómo se califican leads, qué datos pedir, qué alertas generar y qué decisiones puede asistir la IA.",
    tip: "Esta sección traduce la experiencia comercial del cliente en reglas operativas.",
  },
  {
    id: "documentos",
    step: 3,
    title: "Documentos fuente",
    icon: FileText,
    importance: "Importante",
    status: "Completo",
    expected:
      "Propuestas, catálogos, contratos, listas de precios, guiones, fichas técnicas y materiales comerciales.",
    usage:
      "Servirán como fuente para motores IA, propuestas, respuestas y validaciones comerciales.",
    tip: "Si los documentos están desactualizados, la automatización puede repetir información incorrecta.",
  },
  {
    id: "diagnostico",
    step: 4,
    title: "Diagnóstico comercial",
    icon: Search,
    importance: "Obligatorio",
    status: "Completo",
    expected: "Fortalezas, riesgos, oportunidades, puntos ciegos y madurez comercial.",
    usage:
      "Orienta recomendaciones, alertas, prioridades de automatización y diseño operativo.",
    tip: "Permite justificar por qué se recomienda cierto pipeline, reporte o motor IA.",
  },
  {
    id: "proceso-pipeline",
    step: 5,
    title: "Proceso y pipeline",
    icon: GitBranch,
    importance: "Obligatorio",
    status: "Completo",
    expected:
      "Etapas comerciales, responsables, condiciones de avance, validaciones humanas y criterios de salida.",
    usage: "Será la base del Kanban operativo y del seguimiento comercial.",
    tip: "Un pipeline mal diseñado genera reportes poco confiables.",
  },
  {
    id: "motores-ia",
    step: 6,
    title: "Motores IA",
    icon: Bot,
    importance: "Importante",
    status: "Completo",
    expected:
      "Qué puede hacer la IA, en qué etapa actúa, qué input necesita, qué output produce y cuándo requiere validación humana.",
    usage:
      "Permitirá automatizar análisis, recomendaciones y apoyo comercial con control humano.",
    tip: "No todo debe automatizarse; algunas decisiones deben seguir siendo humanas.",
  },
  {
    id: "reportes",
    step: 7,
    title: "Reportes",
    icon: BarChart3,
    importance: "Importante",
    status: "Completo",
    expected: "Qué necesita ver dirección, ventas, administración o gerencia.",
    usage:
      "Define dashboards, reportes, alertas, métricas y seguimiento comercial.",
    tip: "Sin métricas claras, el CRM se convierte en un registro y no en una herramienta de dirección.",
  },
  {
    id: "auditoria-final",
    step: 8,
    title: "Auditoría final",
    icon: ShieldCheck,
    importance: "Obligatorio",
    status: "En revisión",
    expected:
      "Validar si el CRM está listo para activarse o si tiene pendientes técnicos y comerciales.",
    usage:
      "Determina si el sistema puede pasar de modo configuración a modo operativo.",
    tip: "Evita activar un CRM incompleto que luego genere errores o baja adopción.",
  },
];

const CHECKLIST_INICIAL: ItemChecklist[] = [
  {
    id: "c1",
    label: "Empresa configurada",
    descripcion:
      "País, rubro, giro, vertical y datos de contacto cargados.",
    checked: true,
  },
  {
    id: "c2",
    label: "Cuestionario completado",
    descripcion:
      "Todas las preguntas del modelo comercial respondidas.",
    checked: true,
  },
  {
    id: "c3",
    label: "Documentos referenciados",
    descripcion:
      "Al menos un documento fuente subido o referenciado.",
    checked: true,
  },
  {
    id: "c4",
    label: "Diagnóstico revisado",
    descripcion:
      "El equipo revisó y aceptó el diagnóstico comercial generado.",
    checked: true,
  },
  {
    id: "c5",
    label: "Pipeline visual diseñado",
    descripcion:
      "Etapas, tareas y condiciones de avance diseñadas en el Constructor. Pendiente de sincronización con el Kanban operativo (Fase 2).",
    checked: true,
  },
  {
    id: "c6",
    label: "Motores IA diseñados",
    descripcion:
      "Motores IA configurados visualmente por etapa. Pendiente de conexión con el motor real en Fase 2.",
    checked: true,
  },
  {
    id: "c7",
    label: "Reportes diseñados por audiencia",
    descripcion:
      "Reportes definidos por tipo, audiencia y frecuencia. Pendiente de conexión con datos reales en Fase 2.",
    checked: true,
  },
  {
    id: "c8",
    label: "Persistencia y conexión operativa",
    descripcion:
      "Constructor conectado a Supabase y sincronizado con el CRM operativo — requerido para activación real (Fase 2).",
    checked: false,
  },
];

const RIESGOS_INICIALES: Riesgo[] = [
  {
    id: "rg1",
    descripcion:
      "No existe persistencia real — todos los datos del Constructor se pierden al recargar.",
    severidad: "alta",
    estado: "pendiente",
    observacion: "Bloqueante para activación. Se resuelve en Fase 2 con Supabase.",
  },
  {
    id: "rg2",
    descripcion:
      "Pipeline diseñado visualmente, pendiente de sincronización con el Kanban operativo.",
    severidad: "media",
    estado: "pendiente",
    observacion: "",
  },
  {
    id: "rg3",
    descripcion:
      "Motores IA diseñados pero sin ejecución real — reglas de validación humana pendientes de Fase 2.",
    severidad: "media",
    estado: "pendiente",
    observacion: "",
  },
  {
    id: "rg4",
    descripcion:
      "Reportes diseñados visualmente, pendiente de conexión con datos reales y distribución automática.",
    severidad: "media",
    estado: "pendiente",
    observacion: "",
  },
  {
    id: "rg5",
    descripcion:
      "Documentos fuente no actualizados en los últimos 6 meses.",
    severidad: "baja",
    estado: "aceptado",
    observacion: "Se actualizarán en la próxima revisión trimestral.",
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const SEVERIDAD_STYLES: Record<Severidad, string> = {
  alta: "border-red-200 bg-red-50 text-red-700",
  media: "border-amber-200 bg-amber-50 text-amber-700",
  baja: "border-slate-200 bg-slate-50 text-slate-600",
};

const ESTADO_STYLES: Record<EstadoRiesgo, string> = {
  pendiente: "border-red-200 bg-red-50 text-red-700",
  mitigado: "border-green-200 bg-green-50 text-green-700",
  aceptado: "border-blue-200 bg-blue-50 text-blue-700",
};

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {letter}
      </div>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
    </div>
  );
}

function PillSelect<T extends string>({
  options,
  value,
  onChange,
  styleMap,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  styleMap: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "rounded border px-2 py-0.5 text-[10px] font-medium transition-all",
            value === opt.value
              ? styleMap[opt.value] + " ring-1 ring-offset-1 ring-slate-400"
              : styleMap[opt.value] + " opacity-50 hover:opacity-90",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const [score, setScore] = useState(76);
  const [checklist, setChecklist] = useState<ItemChecklist[]>(CHECKLIST_INICIAL);
  const [riesgos, setRiesgos] = useState<Riesgo[]>(RIESGOS_INICIALES);
  const [showValidationReport, setShowValidationReport] = useState(false);

  function toggleCheck(id: string) {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function setRiesgo<K extends keyof Riesgo>(
    id: string,
    key: K,
    value: Riesgo[K]
  ) {
    setRiesgos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  }

  const totalChecked = checklist.filter((i) => i.checked).length;
  const checklistPct = Math.round((totalChecked / checklist.length) * 100);
  const riesgosAltos = riesgos.filter(
    (r) => r.severidad === "alta" && r.estado === "pendiente"
  ).length;
  const riesgosMitigados = riesgos.filter((r) => r.estado === "mitigado").length;

  // Dictamen calculado desde score + checklist + riesgos altos
  const dictamen: "listo" | "revision" | "no-listo" =
    score >= 80 && checklistPct >= 85 && riesgosAltos === 0
      ? "listo"
      : score >= 55 && checklistPct >= 50
      ? "revision"
      : "no-listo";

  const DICTAMEN_CONFIG = {
    listo: {
      label: "Listo para activar",
      wrapperClass: "border-green-200 bg-green-50",
      textColor: "text-green-800",
      subColor: "text-green-700",
      statBg: "bg-green-100/60",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      descripcion:
        "El CRM cumple con los criterios mínimos de configuración. Puede proceder a la activación cuando la persistencia esté conectada.",
    },
    revision: {
      label: "Diseño aprobable — pendiente técnico de Fase 2",
      wrapperClass: "border-amber-200 bg-amber-50",
      textColor: "text-amber-800",
      subColor: "text-amber-700",
      statBg: "bg-amber-100/60",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      descripcion:
        "El diseño visual del CRM está avanzado y es coherente. Lo que falta no es completar pantallas, sino conectar la persistencia real (Supabase), sincronizar el pipeline con el Kanban operativo y activar la auditoría IA. Estos ítems se resuelven en Fase 2.",
    },
    "no-listo": {
      label: "No listo para activar",
      wrapperClass: "border-red-200 bg-red-50",
      textColor: "text-red-800",
      subColor: "text-red-700",
      statBg: "bg-red-100/60",
      icon: XCircle,
      iconColor: "text-red-600",
      descripcion:
        "El nivel de preparación es insuficiente. Completá los pasos pendientes y resolvé los riesgos de alta severidad.",
    },
  } as const;

  const cfg = DICTAMEN_CONFIG[dictamen];
  const DictamenIcon = cfg.icon;

  const [hoy] = useState(() =>
    new Date().toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link
            href="/admin/constructor"
            className="hover:text-slate-800 transition-colors"
          >
            ← Constructor CRM
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/empresa" className="hover:text-slate-800 transition-colors">
            Empresa
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/cuestionario" className="hover:text-slate-800 transition-colors">
            Cuestionario
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/documentos" className="hover:text-slate-800 transition-colors">
            Documentos
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/diagnostico" className="hover:text-slate-800 transition-colors">
            Diagnóstico
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/proceso-pipeline" className="hover:text-slate-800 transition-colors">
            Proceso y pipeline
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/motores-ia" className="hover:text-slate-800 transition-colors">
            Motores IA
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/reportes" className="hover:text-slate-800 transition-colors">
            Reportes
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Auditoría final</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso 8 de 8
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Auditoría final
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Revisá el estado de preparación del CRM antes de activarlo. Esta pantalla evalúa
              localmente el resultado de los 7 pasos anteriores y genera un dictamen preliminar.
            </p>
          </div>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                Bloque visual — sin auditoría IA real ni activación del CRM.
              </span>{" "}
              El dictamen y el score son locales y no reflejan datos reales de Supabase. La
              auditoría real con IA y la activación del CRM estarán disponibles en Fase 2,
              cuando se conecte la persistencia y el motor de auditoría.
            </p>
          </div>

          {/* ── A: Resumen de los 7 pasos ────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="A"
              title="Resumen de preparación — 7 pasos anteriores"
            />
            <p className="mb-4 text-xs text-slate-500">
              Estado actual de cada bloque del Constructor. Todos los pasos
              deben estar completos antes de activar el CRM.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PASOS_RESUMEN.map((paso) => {
                const Icon = paso.icon;
                return (
                  <div
                    key={paso.id}
                    className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600">
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-green-600">
                          Paso {paso.step}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {paso.title}
                        </p>
                      </div>
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-500" />
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {paso.resumen}
                    </p>
                    <Link
                      href={paso.href}
                      className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:text-green-900 transition-colors"
                    >
                      Editar →
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Los ítems marcados como completos reflejan el avance del
              Constructor hasta este bloque.
            </p>
          </div>

          {/* ── B: Readiness score ───────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="B"
              title="Readiness score — preparación del CRM"
            />
            <p className="mb-4 text-xs text-slate-500">
              Ajustá el score manualmente según tu evaluación del estado real de
              la configuración. El dictamen se calcula combinando este score con
              el checklist y los riesgos pendientes.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Score de preparación
                  </p>
                  <p
                    className={[
                      "text-5xl font-bold tabular-nums",
                      score >= 80
                        ? "text-green-600"
                        : score >= 55
                        ? "text-amber-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    {score}
                    <span className="ml-1 text-xl text-slate-400">/100</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      score >= 80
                        ? "border-green-200 bg-green-50 text-green-700"
                        : score >= 55
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {score >= 80
                      ? "Preparación alta"
                      : score >= 55
                      ? "Preparación media"
                      : "Preparación baja"}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Checklist: {totalChecked}/{checklist.length} ítems (
                    {checklistPct}%)
                  </p>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-slate-800"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>0 — No listo</span>
                <span>55 — Revisión</span>
                <span>80 — Listo</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* ── C: Checklist de activación ───────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Checklist de activación" />
            <p className="mb-4 text-xs text-slate-500">
              Ítems mínimos que deben cumplirse antes de activar el CRM. Marcá
              los que ya están completos según tu criterio.
            </p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={[
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm",
                    item.checked
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  {item.checked ? (
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <div>
                    <p
                      className={[
                        "text-xs font-semibold",
                        item.checked ? "text-green-800" : "text-slate-800",
                      ].join(" ")}
                    >
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.descripcion}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {totalChecked} de {checklist.length} ítems completados (
              {checklistPct}%)
            </p>
          </div>

          {/* ── D: Riesgos y observaciones ───────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Riesgos y observaciones" />
            <p className="mb-4 text-xs text-slate-500">
              Registrá y gestioná los riesgos detectados durante la
              configuración. Editá la severidad, el estado y agregá
              observaciones.
            </p>
            <div className="space-y-3">
              {riesgos.map((riesgo, index) => (
                <div
                  key={riesgo.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-xs font-semibold text-slate-800">
                      {riesgo.descripcion}
                    </p>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-3">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Severidad
                      </p>
                      <PillSelect
                        options={[
                          { value: "alta" as Severidad, label: "Alta" },
                          { value: "media" as Severidad, label: "Media" },
                          { value: "baja" as Severidad, label: "Baja" },
                        ]}
                        value={riesgo.severidad}
                        onChange={(v) =>
                          setRiesgo(riesgo.id, "severidad", v)
                        }
                        styleMap={SEVERIDAD_STYLES}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Estado
                      </p>
                      <PillSelect
                        options={[
                          {
                            value: "pendiente" as EstadoRiesgo,
                            label: "Pendiente",
                          },
                          {
                            value: "mitigado" as EstadoRiesgo,
                            label: "Mitigado",
                          },
                          {
                            value: "aceptado" as EstadoRiesgo,
                            label: "Aceptado",
                          },
                        ]}
                        value={riesgo.estado}
                        onChange={(v) => setRiesgo(riesgo.id, "estado", v)}
                        styleMap={ESTADO_STYLES}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Observación
                      </p>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={2}
                        value={riesgo.observacion}
                        onChange={(e) =>
                          setRiesgo(riesgo.id, "observacion", e.target.value)
                        }
                        placeholder="Nota o plan de acción…"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {riesgosAltos} riesgo{riesgosAltos !== 1 ? "s" : ""} de
              severidad alta pendiente{riesgosAltos !== 1 ? "s" : ""} ·{" "}
              {riesgosMitigados} mitigado{riesgosMitigados !== 1 ? "s" : ""}
            </p>
          </div>

          {/* ── E: Dictamen preliminar ───────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Dictamen preliminar" />
            <p className="mb-4 text-xs text-slate-500">
              Calculado en tiempo real desde el score, el checklist y los
              riesgos pendientes. No refleja auditoría IA real — es una
              evaluación local estimada.
            </p>
            <div className={`rounded-2xl border p-6 ${cfg.wrapperClass}`}>
              <div className="mb-3 flex items-center gap-3">
                <DictamenIcon
                  className={`h-6 w-6 shrink-0 ${cfg.iconColor}`}
                />
                <p className={`text-xl font-bold ${cfg.textColor}`}>
                  {cfg.label}
                </p>
              </div>
              <p className={`text-sm leading-relaxed ${cfg.subColor}`}>
                {cfg.descripcion}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Score", value: `${score}/100` },
                  { label: "Checklist", value: `${checklistPct}%` },
                  {
                    label: "Riesgos altos",
                    value:
                      riesgosAltos === 0
                        ? "Ninguno"
                        : `${riesgosAltos} pendiente${riesgosAltos !== 1 ? "s" : ""}`,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`rounded-lg px-3 py-2 text-center ${cfg.statBg}`}
                  >
                    <p className={`text-base font-bold ${cfg.textColor}`}>
                      {m.value}
                    </p>
                    <p className={`text-[10px] ${cfg.subColor}`}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── F: Preview del Reporte Maestro ───────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="F" title="Preview del Reporte Maestro" />
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">Vista previa local.</span>{" "}
                El Reporte Maestro real será generado por el motor de auditoría
                IA en Fase 2. Este preview usa el estado local de esta pantalla.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Barra titular */}
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-3">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  Reporte Maestro — CRM Constructor
                </span>
                <span className="ml-auto text-[10px] text-slate-400">
                  {hoy}
                </span>
              </div>

              {/* Cuerpo del reporte */}
              <div className="space-y-5 px-6 py-5">

                {/* Resumen ejecutivo */}
                <div>
                  <p className="mb-1 text-sm font-bold text-slate-900">
                    Resumen ejecutivo
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    El Constructor de CRM completó los 8 pasos de
                    configuración. Dictamen preliminar:{" "}
                    <span className={`font-semibold ${cfg.textColor.replace("800", "700")}`}>
                      {cfg.label}
                    </span>
                    . Score de preparación:{" "}
                    <span className="font-semibold">{score}/100</span>.
                    Checklist:{" "}
                    <span className="font-semibold">
                      {totalChecked}/{checklist.length} ítems ({checklistPct}%)
                    </span>
                    .
                  </p>
                </div>

                {/* Estado por bloque */}
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-900">
                    Estado por bloque
                  </p>
                  <div className="space-y-1">
                    {PASOS_RESUMEN.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                        <span className="font-medium text-slate-700">
                          Paso {p.step} — {p.title}:
                        </span>
                        <span className="text-slate-500">{p.resumen}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-900">
                    Checklist de activación
                  </p>
                  <div className="space-y-1">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        {item.checked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        )}
                        <span
                          className={
                            item.checked
                              ? "text-slate-600"
                              : "font-medium text-red-600"
                          }
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Riesgos */}
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-900">
                    Riesgos identificados
                  </p>
                  <div className="space-y-1.5">
                    {riesgos.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-start gap-2 text-xs"
                      >
                        <span
                          className={[
                            "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium",
                            SEVERIDAD_STYLES[r.severidad],
                          ].join(" ")}
                        >
                          {r.severidad}
                        </span>
                        <span className="flex-1 text-slate-600">
                          {r.descripcion}
                        </span>
                        <span
                          className={[
                            "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium",
                            ESTADO_STYLES[r.estado],
                          ].join(" ")}
                        >
                          {r.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dictamen */}
                <div
                  className={`rounded-lg border p-3 ${cfg.wrapperClass}`}
                >
                  <p className={`text-xs font-bold ${cfg.textColor}`}>
                    Dictamen: {cfg.label}
                  </p>
                  <p className={`mt-1 text-[11px] ${cfg.subColor}`}>
                    {cfg.descripcion}
                  </p>
                </div>

                <p className="border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  Generado localmente — sin persistencia — Preview del Reporte
                  Maestro · Summer87 Leads v3
                </p>
              </div>
            </div>
          </div>

          {/* ── Reporte Maestro de Validación CRM ───────────────────────── */}
          {showValidationReport && (
            <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6">

              {/* Encabezado */}
              <div className="mb-5">
                <div className="mb-1 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Reporte Maestro de Validación CRM
                  </h2>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  Documento consultivo para revisar con el cliente antes de activar
                  el CRM operativo.
                </p>
              </div>

              {/* Métricas clave */}
              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p
                    className={[
                      "text-3xl font-bold tabular-nums",
                      score >= 80
                        ? "text-green-600"
                        : score >= 55
                        ? "text-amber-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    {score}
                    <span className="ml-0.5 text-base text-slate-300">/100</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Score de preparación
                  </p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${cfg.wrapperClass}`}>
                  <p className={`text-sm font-bold leading-tight ${cfg.textColor}`}>
                    {cfg.label}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">Dictamen</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-3xl font-bold tabular-nums text-slate-800">
                    {totalChecked}
                    <span className="ml-0.5 text-base text-slate-300">
                      /{checklist.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Ítems completados
                  </p>
                </div>
                <div
                  className={[
                    "rounded-xl border p-4 text-center",
                    riesgosAltos > 0
                      ? "border-red-200 bg-red-50"
                      : "border-green-200 bg-green-50",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-3xl font-bold tabular-nums",
                      riesgosAltos > 0 ? "text-red-600" : "text-green-600",
                    ].join(" ")}
                  >
                    {riesgosAltos}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Riesgos altos pendientes
                  </p>
                </div>
              </div>

              {/* Resumen ejecutivo */}
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                  Resumen ejecutivo
                </p>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  Este reporte resume el estado inicial de configuración del CRM
                  y permite validar con el cliente si la información cargada es
                  suficiente para avanzar hacia una etapa operativa.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Estado general
                    </p>
                    <p className={`mt-1 text-xs font-bold ${cfg.textColor}`}>
                      {cfg.label}
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                      Preparación actual
                    </p>
                    <p className="mt-1 text-xs font-bold text-blue-700">
                      {score}/100
                    </p>
                  </div>
                  <div
                    className={[
                      "rounded-lg border px-3 py-2.5",
                      riesgosAltos > 0
                        ? "border-amber-100 bg-amber-50"
                        : "border-green-100 bg-green-50",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "text-[10px] font-semibold uppercase tracking-wide",
                        riesgosAltos > 0 ? "text-amber-500" : "text-green-500",
                      ].join(" ")}
                    >
                      Riesgo principal
                    </p>
                    <p
                      className={[
                        "mt-1 text-xs font-bold",
                        riesgosAltos > 0 ? "text-amber-700" : "text-green-700",
                      ].join(" ")}
                    >
                      {riesgosAltos > 0
                        ? "Existen riesgos altos pendientes"
                        : "No hay riesgos altos pendientes"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-indigo-700">
                  {score >= 80
                    ? "Recomendación: avanzar a validación final con el cliente."
                    : score >= 55
                    ? "Recomendación: revisar pendientes antes de activar el CRM."
                    : "Recomendación: no activar todavía; completar información crítica primero."}
                </p>
              </div>

              {/* Estado por bloque */}
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                  Estado por bloque — 8 pasos del Constructor
                </p>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
                  Cada tarjeta resume qué se validó, para qué se usará y qué
                  debe revisar el cliente antes de activar el CRM.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {VALIDATION_REPORT_STEPS.map((step) => {
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-3 flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <StepIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Paso {step.step}
                            </p>
                            <p className="truncate text-xs font-bold text-slate-800">
                              {step.title}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                              step.importance === "Obligatorio"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {step.importance}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                              step.status === "Completo"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-blue-200 bg-blue-50 text-blue-700",
                            ].join(" ")}
                          >
                            {step.status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Qué se esperaba
                            </p>
                            <p className="text-[10px] leading-relaxed text-slate-600">
                              {step.expected}
                            </p>
                          </div>
                          <div className="rounded-lg bg-blue-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-400">
                              Cómo se usará
                            </p>
                            <p className="text-[10px] leading-relaxed text-blue-700">
                              {step.usage}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-500">
                              Tip para el cliente
                            </p>
                            <p className="text-[10px] leading-relaxed text-amber-700">
                              {step.tip}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checklist de validación con cliente */}
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                  Checklist de validación con cliente
                </p>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
                  Usá esta lista como guía de revisión antes de dar por aprobado
                  el diseño del CRM.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Revisar datos de empresa",
                    "Validar cuestionario comercial",
                    "Confirmar documentos fuente",
                    "Revisar diagnóstico comercial",
                    "Aprobar proceso y pipeline",
                    "Validar motores IA",
                    "Confirmar reportes necesarios",
                    "Aprobar auditoría final",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span className="text-xs text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-500">
                    Uso recomendado
                  </p>
                  <p className="text-xs leading-relaxed text-blue-700">
                    Este checklist no activa el CRM por sí solo. Sirve para
                    alinear expectativas, detectar pendientes y confirmar que el
                    cliente entiende cómo se usará cada bloque dentro del sistema.
                  </p>
                </div>
              </div>

              {/* Aviso fase PDF */}
              <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-700">
                  <span className="font-semibold">Fase futura:</span>{" "}
                  esta sección podrá exportarse a PDF como entregable consultivo
                  para el cliente.
                </p>
              </div>

            </div>
          )}

          {/* ── G: Navegación ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/reportes"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Reportes
              </Link>
              <Link
                href="/admin/constructor"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Constructor
              </Link>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowValidationReport((prev) => !prev)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                    showValidationReport
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <FileText className="h-4 w-4" />
                  {showValidationReport
                    ? "Ocultar reporte"
                    : "Ver reporte de validación"}
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-6 py-2.5 text-sm font-semibold text-white opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Activar CRM
                </button>
              </div>
              <span className="max-w-xs text-right text-[11px] text-slate-400">
                Activar CRM disponible en Fase 2 — requiere persistencia, auditoría
                real y aprobación.
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
