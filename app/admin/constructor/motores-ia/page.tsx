"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Bot,
  Wrench,
  ShieldCheck,
  CheckSquare,
  Square,
  Code2,
  Zap,
  ZapOff,
  ShieldAlert,
} from "lucide-react";
import { MockAISuggestionCard } from "@/components/constructor/MockAISuggestionCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import type { ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";
import { useConstructorAIAudit } from "@/lib/constructor-ai/useConstructorAIAudit";
import { useConstructorMockAI } from "@/lib/constructor-ai/useConstructorMockAI";
import { StepReadinessPanel } from "@/components/constructor/StepReadinessPanel";
import { FieldQualityHint } from "@/components/constructor/FieldQualityHint";
import type {
  BaseReadiness,
  FieldQualityHintValue,
  QualityStatus,
  SectionQuality,
} from "@/lib/constructor/readiness/types";
import {
  STATUS_VALUE,
  READINESS_SUMMARY_LABEL,
} from "@/lib/constructor/readiness/statusStyles";
import {
  clampCompletionPercent,
  countSelectedValues,
  hasRelevantText,
  hasText,
} from "@/lib/constructor/readiness/helpers";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Prioridad = "alta" | "media" | "baja";
type NivelRiesgo = "bajo" | "medio" | "alto";

type MotorIA = {
  id: string;
  nombre: string;
  etapa: string;
  tipo: string;
  objetivo: string;
  input: string;
  output: string;
  requiereValidacionHumana: boolean;
  prioridad: Prioridad;
  riesgo: NivelRiesgo;
  activo: boolean;
};

type ReglasUsoIA = {
  motoresAutomaticos: string;
  motivosAprobacion: string;
  outputsBorrador: string;
  outputsReportes: string;
  riesgosRevisar: string;
};

type SetupRecord = Record<string, unknown>;

type LocalSuggestion = {
  id: string;
  targetField:
    | "motores"
    | "reglas"
    | "validacionHumana"
    | "inputsOutputs"
    | "general";
  title: string;
  description: string;
  actionLabel?: string;
  apply?: () => void;
};

type MotoresIAPayload = {
  motores: MotorIA[];
  reglas: ReglasUsoIA;
};

type MotoresIAForm = MotoresIAPayload;
type MotoresIAReadiness = BaseReadiness;

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const ETAPAS_OPCIONES = [
  "Nuevo lead",
  "Calificación inicial",
  "Reunión / visita",
  "Diagnóstico / evaluación",
  "Propuesta / cotización",
  "Negociación",
  "Cierre",
  "Transversal",
  "Post-venta",
];

const MOTORES_INICIALES: MotorIA[] = [
  {
    id: "m1",
    nombre: "Investigación Digital del Prospecto",
    etapa: "Nuevo lead",
    tipo: "Investigación",
    objetivo: "Recopilar datos públicos del prospecto para enriquecer su ficha antes del primer contacto.",
    input: "Nombre, empresa, email o teléfono del lead",
    output: "Perfil enriquecido: LinkedIn, web, sector, tamaño, noticias recientes",
    requiereValidacionHumana: false,
    prioridad: "alta",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m2",
    nombre: "Diagnóstico Comercial Inicial",
    etapa: "Calificación inicial",
    tipo: "Diagnóstico",
    objetivo: "Analizar si el lead califica según el perfil de cliente ideal definido.",
    input: "Datos del lead + cuestionario de calificación + ICP configurado",
    output: "Score de calificación + señales positivas/negativas + recomendación de avance",
    requiereValidacionHumana: false,
    prioridad: "alta",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m3",
    nombre: "Relevamiento Técnico",
    etapa: "Reunión / visita",
    tipo: "Relevamiento",
    objetivo: "Guiar al vendedor durante la reunión y capturar información clave del cliente.",
    input: "Notas de la reunión + tipo de servicio + sector del cliente",
    output: "Resumen estructurado de la reunión + gaps detectados + próximos pasos sugeridos",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m4",
    nombre: "Recomendador de Servicios",
    etapa: "Diagnóstico / evaluación",
    tipo: "Recomendación",
    objetivo: "Sugerir qué servicios o productos son los más adecuados para el cliente según su perfil.",
    input: "Relevamiento técnico + catálogo de servicios + historial de casos similares",
    output: "Lista priorizada de servicios recomendados con justificación",
    requiereValidacionHumana: true,
    prioridad: "media",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m5",
    nombre: "Generador de Propuesta",
    etapa: "Propuesta / cotización",
    tipo: "Generación",
    objetivo: "Generar un borrador de propuesta comercial personalizada para el cliente.",
    input: "Recomendación de servicios + datos del cliente + plantilla de propuesta",
    output: "Borrador de propuesta en formato estructurado listo para revisión humana",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "alto",
    activo: true,
  },
  {
    id: "m6",
    nombre: "Validador de Propuesta",
    etapa: "Propuesta / cotización",
    tipo: "Validación",
    objetivo: "Revisar que la propuesta cumple con los criterios de calidad antes de enviarla.",
    input: "Borrador de propuesta + criterios de validación configurados",
    output: "Lista de observaciones + score de calidad + aprobación/rechazo con justificación",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m7",
    nombre: "Seguimiento Inteligente",
    etapa: "Negociación",
    tipo: "Seguimiento",
    objetivo: "Sugerir el próximo paso de seguimiento según el historial de interacciones del lead.",
    input: "Historial de actividades + días sin respuesta + etapa actual",
    output: "Mensaje de seguimiento sugerido + canal recomendado + urgencia",
    requiereValidacionHumana: false,
    prioridad: "media",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m8",
    nombre: "Análisis de Cierre Perdido",
    etapa: "Cierre",
    tipo: "Análisis",
    objetivo: "Analizar las razones de pérdida de oportunidades para identificar patrones y mejoras.",
    input: "Historial del lead perdido + motivo de pérdida + etapa donde se perdió",
    output: "Análisis de causas + patrones identificados + recomendaciones de mejora",
    requiereValidacionHumana: false,
    prioridad: "media",
    riesgo: "bajo",
    activo: false,
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

const PRIORIDAD_STYLES: Record<Prioridad, string> = {
  alta: "border-red-200 bg-red-50 text-red-700",
  media: "border-amber-200 bg-amber-50 text-amber-700",
  baja: "border-slate-200 bg-slate-50 text-slate-600",
};

const RIESGO_STYLES: Record<NivelRiesgo, string> = {
  alto: "border-red-200 bg-red-50 text-red-700",
  medio: "border-amber-200 bg-amber-50 text-amber-700",
  bajo: "border-green-200 bg-green-50 text-green-700",
};

const PRIORIDAD_VALUES = new Set<Prioridad>(["alta", "media", "baja"]);
const RIESGO_VALUES = new Set<NivelRiesgo>(["bajo", "medio", "alto"]);

function isRecord(value: unknown): value is SetupRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asRecord(value: unknown): SetupRecord {
  return isRecord(value) ? value : {};
}

function textIncludes(value: unknown, terms: string[]): boolean {
  const text = isRecord(value)
    ? Object.values(value).map((item) => String(item ?? "")).join(" ").toLowerCase()
    : String(value ?? "").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function arrayOrTextIncludes(value: unknown, terms: string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => textIncludes(item, terms));
  }
  return textIncludes(value, terms);
}

function hasMotorNamed(items: unknown[], terms: string[]) {
  return items.some((item) => {
    const text = isRecord(item)
      ? String(item.nombre ?? item.name ?? item.title ?? "")
      : String(item ?? "");

    return terms.some((term) =>
      text.toLowerCase().includes(term.toLowerCase())
    );
  });
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asPrioridad(value: unknown): Prioridad {
  return typeof value === "string" && PRIORIDAD_VALUES.has(value as Prioridad)
    ? (value as Prioridad)
    : "media";
}

function asNivelRiesgo(value: unknown): NivelRiesgo {
  return typeof value === "string" && RIESGO_VALUES.has(value as NivelRiesgo)
    ? (value as NivelRiesgo)
    : "medio";
}

function normalizeMotor(value: unknown, index: number): MotorIA | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) || `motor-${index}`,
    nombre: asString(value.nombre),
    etapa: asString(value.etapa),
    tipo: asString(value.tipo),
    objetivo: asString(value.objetivo),
    input: asString(value.input),
    output: asString(value.output),
    requiereValidacionHumana: asBoolean(value.requiereValidacionHumana),
    prioridad: asPrioridad(value.prioridad),
    riesgo: asNivelRiesgo(value.riesgo),
    activo: asBoolean(value.activo),
  };
}

function normalizeReglas(value: unknown): ReglasUsoIA {
  if (!isRecord(value)) {
    return {
      motoresAutomaticos: "",
      motivosAprobacion: "",
      outputsBorrador: "",
      outputsReportes: "",
      riesgosRevisar: "",
    };
  }

  return {
    motoresAutomaticos: asString(value.motoresAutomaticos),
    motivosAprobacion: asString(value.motivosAprobacion),
    outputsBorrador: asString(value.outputsBorrador),
    outputsReportes: asString(value.outputsReportes),
    riesgosRevisar: asString(value.riesgosRevisar),
  };
}

function createSuggestedMotor(params: {
  id: string;
  nombre: string;
  etapa: string;
  tipo: string;
  objetivo: string;
  input: string;
  output: string;
  requiereValidacionHumana?: boolean;
  prioridad?: Prioridad;
  riesgo?: NivelRiesgo;
  activo?: boolean;
}): MotorIA {
  return {
    id: params.id,
    nombre: params.nombre,
    etapa: params.etapa,
    tipo: params.tipo,
    objetivo: params.objetivo,
    input: params.input,
    output: params.output,
    requiereValidacionHumana: params.requiereValidacionHumana ?? true,
    prioridad: params.prioridad ?? "media",
    riesgo: params.riesgo ?? "medio",
    activo: params.activo ?? true,
  };
}

function appendTextIfMissing(current: string, addition: string) {
  if (!current.trim()) return addition;
  if (current.includes(addition)) return current;
  return `${current}\n\n${addition}`;
}

function slugFromText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function evaluateMotoresIAReadiness(form: MotoresIAForm): MotoresIAReadiness {
  const { motores, reglas } = form;

  const motorConNombreObjetivo = (m: MotorIA) =>
    hasText(m.nombre) && hasRelevantText(m.objetivo, 22);
  const motoresCompletos = motores.filter(motorConNombreObjetivo).length;

  let definidosStatus: QualityStatus;
  let definidosDetail: string;
  if (motores.length === 0) {
    definidosStatus = "danger";
    definidosDetail = "No hay motores IA listados.";
  } else if (motores.length <= 2 || motoresCompletos < motores.length) {
    definidosStatus = "warning";
    definidosDetail =
      motores.length <= 2
        ? "Pocos motores: sumá lista y completá objetivos antes de cerrar esta etapa."
        : "Hay motores sin nombre claro u objetivo describible.";
  } else {
    definidosStatus = "good";
    definidosDetail = "Tres o más motores con nombre y objetivo definidos.";
  }

  const motoresSinEtapa = motores.filter((m) => !hasText(m.etapa));
  const distinctEtapas = new Set(motores.map((m) => m.etapa.trim()).filter(Boolean));

  function motorEnEtapaValorEstrategica(m: MotorIA): boolean {
    const raw = `${m.etapa} ${m.tipo}`;
    const n = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return (
      n.includes("diagnostico") ||
      n.includes("propuesta") ||
      n.includes("seguimiento") ||
      n.includes("negociacion") ||
      n.includes("reporte") ||
      n.includes("transversal")
    );
  }
  const motoresCubrenHitosClave = motores.filter(motorEnEtapaValorEstrategica).length;

  let coberturaStatus: QualityStatus;
  let coberturaDetail: string;
  if (motores.length === 0) {
    coberturaStatus = "danger";
    coberturaDetail = "Sin motores para asociar a etapas comerciales.";
  } else if (motoresSinEtapa.length > 0) {
    coberturaStatus = "danger";
    coberturaDetail = "Hay motores sin etapa del proceso asignada.";
  } else if (distinctEtapas.size >= 2 || motoresCubrenHitosClave >= 3) {
    coberturaStatus = "good";
    coberturaDetail = "Cubrís más de una etapa o hay foco en hitos clave.";
  } else {
    coberturaStatus = "warning";
    coberturaDetail = "Todos los motores caen principalmente en una sola etapa.";
  }

  const altoSinValidacion = motores.some(
    (m) => m.riesgo === "alto" && !m.requiereValidacionHumana
  );
  const riesgosDistintos = countSelectedValues([
    motores.some((m) => m.riesgo === "bajo"),
    motores.some((m) => m.riesgo === "medio"),
    motores.some((m) => m.riesgo === "alto"),
  ]);

  let riesgoValStatus: QualityStatus;
  let riesgoValDetail: string;
  if (altoSinValidacion) {
    riesgoValStatus = "danger";
    riesgoValDetail = "Hay motores de riesgo alto sin validación humana obligatoria.";
  } else if (motores.length > 0 && riesgosDistintos < 2 && !motores.some((m) => m.requiereValidacionHumana)) {
    riesgoValStatus = "warning";
    riesgoValDetail = "Diferenciá niveles de riesgo y activá validación donde haga falta.";
  } else if (
    motores.some((m) => m.requiereValidacionHumana) ||
    hasRelevantText(reglas.motivosAprobacion, 22)
  ) {
    riesgoValStatus = "good";
    riesgoValDetail = "Riesgo marcado con validaciones y reglas alineadas.";
  } else {
    riesgoValStatus = "warning";
    riesgoValDetail = "Marcá mejor la validación humana en las reglas o en motores delicados.";
  }

  const activos = motores.filter((m) => m.activo);
  const altaEntreActivos = activos.filter((m) => m.prioridad === "alta").length;
  let prioridadActStatus: QualityStatus;
  let prioridadActDetail: string;
  if (activos.length === 0) {
    prioridadActStatus = "warning";
    prioridadActDetail = "Ningún motor activo para la primera versión del CRM.";
  } else if (altaEntreActivos === 0) {
    prioridadActStatus = "warning";
    prioridadActDetail = "Definí al menos una prioridad alta focal entre los activos.";
  } else {
    prioridadActStatus = "good";
    prioridadActDetail = "Hay motores activos con prioridades claras para implementar.";
  }

  const sections: SectionQuality[] = [
    {
      key: "motores-definidos",
      label: "Motores definidos",
      status: definidosStatus,
      detail: definidosDetail,
    },
    {
      key: "cobertura-proceso",
      label: "Cobertura del proceso",
      status: coberturaStatus,
      detail: coberturaDetail,
    },
    {
      key: "riesgo-validacion",
      label: "Riesgo y validación humana",
      status: riesgoValStatus,
      detail: riesgoValDetail,
    },
    {
      key: "prioridad-activacion",
      label: "Prioridad y activación",
      status: prioridadActStatus,
      detail: prioridadActDetail,
    },
  ];

  const completionPercent = clampCompletionPercent(
    Math.round(
      30 * STATUS_VALUE[definidosStatus] +
        25 * STATUS_VALUE[coberturaStatus] +
        25 * STATUS_VALUE[riesgoValStatus] +
        20 * STATUS_VALUE[prioridadActStatus]
    )
  );

  const hasDanger = sections.some((s) => s.status === "danger");
  let overallStatus: QualityStatus;
  if (completionPercent >= 80 && !hasDanger) {
    overallStatus = "good";
  } else if (completionPercent >= 55) {
    overallStatus = "warning";
  } else {
    overallStatus = "danger";
  }

  let nextAction = "Podés guardar y continuar a Reportes.";
  if (motores.length === 0) {
    nextAction = "Definí al menos un motor IA para el CRM.";
  } else if (motores.some((m) => !hasRelevantText(m.objetivo, 12))) {
    nextAction = "Completá el objetivo de cada motor IA.";
  } else if (motoresSinEtapa.length > 0) {
    nextAction = "Asociá cada motor IA a una etapa del proceso comercial.";
  } else if (altoSinValidacion) {
    nextAction = "Marcá validación humana para motores IA de riesgo alto.";
  } else if (!motores.some((m) => m.activo)) {
    nextAction = "Activá al menos un motor IA para la primera versión del CRM.";
  } else if (!motores.some((m) => m.activo && m.prioridad === "alta")) {
    nextAction = "Definí prioridad para ordenar la implementación de motores IA.";
  }

  const fieldHints: Record<string, FieldQualityHintValue> = {};

  if (definidosStatus === "danger") {
    fieldHints.motoresDefinidos = {
      status: "danger",
      text: "Definí los motores IA que tendrá el CRM.",
    };
  } else if (definidosStatus !== "good") {
    fieldHints.motoresDefinidos = {
      status: "warning",
      text: "Completá nombre y objetivo para que cada motor tenga una función clara.",
    };
  }

  if (coberturaStatus !== "good") {
    fieldHints.coberturaProceso = {
      status: coberturaStatus === "danger" ? "danger" : "warning",
      text: "Asociar motores a etapas evita IA desconectada del flujo comercial.",
    };
  }

  if (riesgoValStatus !== "good") {
    fieldHints.riesgoValidacion = {
      status: riesgoValStatus === "danger" ? "danger" : "warning",
      text:
        riesgoValStatus === "danger"
          ? "Los motores de riesgo alto requieren validación humana."
          : "Clasificá riesgo y validación antes de activar IA.",
    };
  }

  if (prioridadActStatus !== "good") {
    fieldHints.prioridadActivacion = {
      status: "warning",
      text: "Definí prioridad y qué motores estarán activos en la primera versión.",
    };
  }

  return {
    completionPercent,
    overallStatus,
    overallLabel: READINESS_SUMMARY_LABEL[overallStatus],
    nextAction,
    sections,
    fieldHints,
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MotoresIAPage() {
  const [motores, setMotores] = useState<MotorIA[]>(MOTORES_INICIALES);
  const [reglas, setReglas] = useState<ReglasUsoIA>({
    motoresAutomaticos: "",
    motivosAprobacion: "",
    outputsBorrador: "",
    outputsReportes: "",
    riesgosRevisar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [constructorContext, setConstructorContext] = useState<SetupRecord | null>(null);
  const [mockAIMotoresRequested, setMockAIMotoresRequested] = useState(false);
  const [mockAIApplyMessage, setMockAIApplyMessage] = useState<string | null>(null);
  const {
    auditError: mockAIAuditError,
    clearAuditError: clearMockAIAuditError,
    auditSuggestionShown,
    auditEmptyResult,
    auditFailed,
    auditApplied,
    auditDuplicate,
  } = useConstructorAIAudit();
  const {
    suggestions: mockAIMotoresSuggestions,
    loading: mockAIMotoresLoading,
    error: mockAIMotoresError,
    request: requestMockAIMotores,
    clear: clearMockAIMotores,
  } = useConstructorMockAI();

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      setLoading(true);
      setSaveError(null);

      try {
        const res = await fetch("/api/admin/constructor/setup", {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });

        const json = (await res.json().catch(() => null)) as {
          data?: (SetupRecord & { motores_ia?: unknown }) | null;
          error?: string | null;
        } | null;

        if (res.redirected || !json) {
          if (!cancelled) {
            setSaveError("La sesión no está autorizada para cargar.");
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setSaveError(json?.error ?? "No se pudo cargar la configuración guardada.");
          }
          return;
        }

        if (!cancelled) {
          setConstructorContext(asRecord(json?.data));
        }

        const motoresIA = json?.data?.motores_ia;

        if (
          motoresIA &&
          typeof motoresIA === "object" &&
          !Array.isArray(motoresIA) &&
          Object.keys(motoresIA).length > 0
        ) {
          if (!cancelled) {
            const loaded = motoresIA as Partial<MotoresIAPayload>;

            setMotores(
              Array.isArray(loaded.motores)
                ? loaded.motores
                    .map((motor, index) => normalizeMotor(motor, index))
                    .filter((motor): motor is MotorIA => motor !== null)
                : MOTORES_INICIALES
            );
            setReglas(normalizeReglas(loaded.reglas));
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar los motores IA y guardar nuevamente."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const payloadMotoresIA: MotoresIAPayload = {
      motores,
      reglas,
    };

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          step: "motores-ia",
          mark_completed: true,
          data: payloadMotoresIA,
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        data?: unknown;
        error?: string | null;
      } | null;

      if (res.redirected || !json) {
        setSaveError("La sesión no está autorizada para guardar.");
        return;
      }

      if (!res.ok || json?.error) {
        setSaveError(json?.error ?? "Error al guardar");
      } else {
        setSaveMessage("Motores IA guardados correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setMotor<K extends keyof MotorIA>(
    id: string,
    key: K,
    value: MotorIA[K]
  ) {
    clearMockAIMotores();
    setMockAIMotoresRequested(false);
    setMotores((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [key]: value } : m))
    );
  }

  function setRegla<K extends keyof ReglasUsoIA>(
    key: K,
    value: ReglasUsoIA[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  function addSuggestedMotors(suggested: MotorIA[]) {
    clearMockAIMotores();
    setMockAIMotoresRequested(false);
    setMotores((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const existingNames = new Set(
        current.map((motor) => String(motor.nombre ?? "").toLowerCase())
      );
      const next = suggested.filter(
        (motor) => !existingNames.has(String(motor.nombre ?? "").toLowerCase())
      );

      return [...current, ...next];
    });
  }

  async function requestMockAISuggestionForMotores() {
    setMockAIMotoresRequested(true);
    setMockAIApplyMessage(null);
    clearMockAIAuditError();

    const suggestions = await requestMockAIMotores({
      mode: "field_suggestion",
      step: "motores_ia",
      field: "motores",
      value: motores,
      currentForm: {
        motores,
        reglas,
      },
      constructorContext: constructorContext ?? {},
    });

    if (suggestions.length === 0) {
      await auditEmptyResult({
        step: "motores_ia",
        field: "motores",
        screen: "constructor_motores_ia",
      });
      return;
    }

    for (const suggestion of suggestions) {
      await auditSuggestionShown({
        suggestion,
        step: "motores_ia",
        field: "motores",
        screen: "constructor_motores_ia",
      });
    }
  }

  function applyMockAIMotorSuggestion(
    suggestion: ConstructorMockAISuggestion
  ) {
    const value = suggestion.suggestedValue;

    if (!value || typeof value !== "object" || Array.isArray(value)) return;

    const record = value as SetupRecord;
    const nombre = typeof record.nombre === "string" ? record.nombre.trim() : "";

    if (!nombre) return;

    const suggestionAlreadyApplied = motores.some(
      (motor) => motor.nombre.trim().toLowerCase() === nombre.toLowerCase()
    );

    if (suggestionAlreadyApplied) {
      setMockAIApplyMessage("Esta sugerencia IA ya estaba aplicada.");
      auditDuplicate({
        suggestion,
        step: "motores_ia",
        field: "motores",
        screen: "constructor_motores_ia",
        afterSummary: "Motor IA ya existente: Auditor de seguimiento comercial",
      });
      return;
    }

    const etapa = typeof record.etapa === "string" ? record.etapa.trim() : "";
    const input = typeof record.input === "string" ? record.input.trim() : "";
    const output = typeof record.output === "string" ? record.output.trim() : "";

    setMotores((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const alreadyExists = current.some(
        (motor) => motor.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );

      if (alreadyExists) return current;

      return [
        ...current,
        createSuggestedMotor({
          id: `mock-motor-${slugFromText(nombre)}`,
          nombre,
          etapa: etapa || "Seguimiento",
          tipo: "Auditoría",
          objetivo:
            "Detectar oportunidades sin seguimiento y recomendar próximas acciones comerciales.",
          input,
          output,
          requiereValidacionHumana:
            typeof record.requiereValidacionHumana === "boolean"
              ? record.requiereValidacionHumana
              : true,
          prioridad: asPrioridad(record.prioridad),
          riesgo: asNivelRiesgo(record.riesgo),
          activo: true,
        }),
      ];
    });
    setMockAIApplyMessage("Sugerencia IA aplicada correctamente.");
    auditApplied({
      suggestion,
      step: "motores_ia",
      field: "motores",
      screen: "constructor_motores_ia",
      afterSummary: "Motor IA agregado: Auditor de seguimiento comercial",
    });
  }

  useEffect(() => {
    if (!mockAIMotoresRequested || !mockAIMotoresError) return;

    void auditFailed({
      step: "motores_ia",
      field: "motores",
      screen: "constructor_motores_ia",
      notes: mockAIMotoresError,
    });
  }, [auditFailed, mockAIMotoresRequested, mockAIMotoresError]);

  const empresaContext = asRecord(constructorContext?.empresa);
  const cuestionarioContext = asRecord(constructorContext?.cuestionario);
  const diagnosticoContext = asRecord(constructorContext?.diagnostico);
  const procesoPipelineContext = asRecord(constructorContext?.proceso_pipeline);

  const businessContext = {
    esEducacion:
      textIncludes(empresaContext.rubro, [
        "educación",
        "educacion",
        "colegio",
        "universidad",
        "academia",
      ]) ||
      textIncludes(empresaContext.giro, [
        "educación",
        "educacion",
        "colegio",
        "universidad",
        "academia",
      ]) ||
      textIncludes(empresaContext.vertical, [
        "educación",
        "educacion",
        "colegio",
        "universidad",
        "academia",
      ]),
    esLimpieza:
      textIncludes(empresaContext.rubro, ["limpieza", "servicios"]) ||
      textIncludes(empresaContext.giro, ["limpieza", "mantenimiento", "facility"]) ||
      textIncludes(empresaContext.vertical, ["limpieza", "corporativa", "facility"]),
    ventaConsultiva:
      arrayOrTextIncludes(cuestionarioContext.tiposVenta, ["consultiva"]) ||
      textIncludes(cuestionarioContext.procesoActual, [
        "diagnóstico",
        "diagnostico",
        "reunión",
        "reunion",
        "visita",
      ]),
    requiereReunionVisita:
      textIncludes(cuestionarioContext.procesoActual, [
        "visita",
        "reunión",
        "reunion",
        "diagnóstico",
        "diagnostico",
      ]) ||
      arrayOrTextIncludes(cuestionarioContext.infoPrePropuesta, [
        "visita",
        "documentos técnicos",
        "necesidad declarada",
      ]),
    necesitaSeguimiento:
      arrayOrTextIncludes(diagnosticoContext.riesgos, ["seguimiento"]) ||
      textIncludes(cuestionarioContext.procesoActual, ["seguimiento"]) ||
      arrayOrTextIncludes(procesoPipelineContext.etapas, ["seguimiento"]),
    riesgoTrazabilidad: arrayOrTextIncludes(diagnosticoContext.riesgos, [
      "trazabilidad",
      "información",
      "informacion",
      "pipeline",
    ]),
    necesitaReportes:
      arrayOrTextIncludes(cuestionarioContext.metricasImportantes, [
        "reporte",
        "leads",
        "conversión",
        "conversion",
        "ventas",
        "monto",
      ]) || arrayOrTextIncludes(diagnosticoContext.oportunidades, ["reportes"]),
    necesitaValidacionHumana:
      arrayOrTextIncludes(diagnosticoContext.riesgos, [
        "dependencia",
        "personas clave",
        "validación",
        "validacion",
      ]) ||
      arrayOrTextIncludes(cuestionarioContext.decisores, [
        "dueño",
        "fundador",
        "gerente",
      ]),
    quiereIAPropuestas:
      arrayOrTextIncludes(cuestionarioContext.dondeAyudarIA, [
        "propuestas",
        "armar propuestas",
      ]) || textIncludes(cuestionarioContext.comentariosAdicionales, ["propuesta"]),
    quiereIAProspectos:
      arrayOrTextIncludes(cuestionarioContext.dondeAyudarIA, [
        "investigar prospectos",
        "prospectos",
      ]) || textIncludes(cuestionarioContext.queVendeDetalle, ["B2B", "empresas"]),
  };

  const baseSuggestedMotors = [
    createSuggestedMotor({
      id: "asistente-motor-investigador-prospectos",
      nombre: "Investigador de prospectos",
      etapa: "Calificación inicial",
      tipo: "Investigación",
      objetivo: "Enriquecer el contexto del prospecto antes de priorizar la oportunidad.",
      input: "Datos del prospecto, sitio web, rubro y necesidad declarada",
      output: "Resumen del prospecto, señales de oportunidad y riesgos iniciales",
      requiereValidacionHumana: true,
      prioridad: "alta",
      riesgo: "medio",
    }),
    createSuggestedMotor({
      id: "asistente-motor-proximos-pasos",
      nombre: "Recomendador de próximos pasos",
      etapa: "Negociación",
      tipo: "Recomendación",
      objetivo: "Sugerir la siguiente acción comercial según el estado de la oportunidad.",
      input: "Estado de oportunidad, historial, próxima acción y fecha de seguimiento",
      output: "Sugerencia de próxima acción comercial",
      requiereValidacionHumana: true,
      prioridad: "media",
      riesgo: "medio",
    }),
    createSuggestedMotor({
      id: "asistente-motor-riesgos-comerciales",
      nombre: "Detector de riesgos comerciales",
      etapa: "Diagnóstico / evaluación",
      tipo: "Análisis",
      objetivo: "Detectar bloqueos antes de propuesta o cierre.",
      input: "Respuestas del cliente, avance del pipeline, objeciones y documentos faltantes",
      output: "Riesgos, bloqueos y alertas comerciales",
      requiereValidacionHumana: true,
      prioridad: "alta",
      riesgo: "medio",
    }),
  ];

  const propuestaMotor = createSuggestedMotor({
    id: "asistente-motor-borrador-propuesta",
    nombre: "Generador de borrador de propuesta",
    etapa: "Propuesta / cotización",
    tipo: "Generación",
    objetivo: "Preparar un borrador de propuesta para revisión comercial.",
    input: "Diagnóstico, necesidad, servicios, condiciones y documentos fuente",
    output: "Borrador de propuesta para revisión humana",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "alto",
  });

  const seguimientoMotor = createSuggestedMotor({
    id: "asistente-motor-auditor-seguimiento",
    nombre: "Auditor de seguimiento comercial",
    etapa: "Negociación",
    tipo: "Seguimiento",
    objetivo: "Detectar oportunidades frías y falta de próximos pasos.",
    input: "Fecha de último contacto, próxima acción y estado de oportunidad",
    output: "Alertas de oportunidades frías y recomendaciones de seguimiento",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "medio",
  });

  const reportesMotor = createSuggestedMotor({
    id: "asistente-motor-reportes-comerciales",
    nombre: "Generador de reportes comerciales",
    etapa: "Transversal",
    tipo: "Reporte",
    objetivo: "Transformar datos comerciales en resúmenes de gestión.",
    input: "Leads, etapas, conversiones, motivos de pérdida y montos",
    output: "Resumen ejecutivo comercial y alertas de gestión",
    requiereValidacionHumana: false,
    prioridad: "media",
    riesgo: "bajo",
  });

  const limpiezaMotors = [
    createSuggestedMotor({
      id: "asistente-motor-relevamiento-tecnico-limpieza",
      nombre: "Motor de relevamiento técnico",
      etapa: "Reunión / visita",
      tipo: "Relevamiento",
      objetivo: "Ordenar la información operativa necesaria antes de cotizar servicios de limpieza.",
      input: "Tipo de servicio, metraje, frecuencia, horarios, insumos y cantidad de sedes",
      output: "Checklist técnico para cotización",
      requiereValidacionHumana: true,
      prioridad: "alta",
      riesgo: "medio",
    }),
    createSuggestedMotor({
      id: "asistente-motor-checklist-cotizacion-limpieza",
      nombre: "Motor de checklist de cotización",
      etapa: "Propuesta / cotización",
      tipo: "Validación",
      objetivo: "Verificar datos mínimos antes de generar una cotización.",
      input: "Datos operativos, frecuencia, personal requerido, insumos y condiciones",
      output: "Puntos necesarios antes de cotizar",
      requiereValidacionHumana: true,
      prioridad: "alta",
      riesgo: "medio",
    }),
  ];

  const educacionMotors = [
    createSuggestedMotor({
      id: "asistente-motor-calificador-educativo",
      nombre: "Calificador de interesados educativos",
      etapa: "Calificación inicial",
      tipo: "Calificación",
      objetivo: "Evaluar fit del interesado antes de avanzar en admisiones.",
      input: "Programa de interés, perfil del interesado, urgencia, presupuesto y modalidad",
      output: "Nivel de fit y próximos pasos",
      requiereValidacionHumana: true,
      prioridad: "alta",
      riesgo: "medio",
    }),
    createSuggestedMotor({
      id: "asistente-motor-recomendador-programa",
      nombre: "Recomendador de programa o curso",
      etapa: "Diagnóstico / evaluación",
      tipo: "Recomendación",
      objetivo: "Sugerir programas educativos que podrían responder al objetivo del interesado.",
      input: "Objetivo del interesado, nivel actual, disponibilidad y perfil",
      output: "Sugerencia de programa/curso a validar",
      requiereValidacionHumana: true,
      prioridad: "media",
      riesgo: "medio",
    }),
  ];

  const validacionHumanaSugerida =
    "Toda recomendación IA debe quedar como borrador hasta aprobación humana en propuesta, descuento, cierre ganado/perdido o comunicación final.";

  const localSuggestions: LocalSuggestion[] = [];

  if (motores.length < 3) {
    localSuggestions.push({
      id: "motores-base",
      targetField: "motores",
      title: "Podés partir de tres motores IA base",
      description:
        "Investigador de prospectos, Recomendador de próximos pasos y Detector de riesgos comerciales cubren el flujo mínimo.",
      actionLabel: "Agregar motores base",
      apply: () => addSuggestedMotors(baseSuggestedMotors),
    });
  }

  if (
    (businessContext.quiereIAPropuestas || businessContext.ventaConsultiva) &&
    !hasMotorNamed(motores, ["generador de propuesta", "borrador de propuesta"])
  ) {
    localSuggestions.push({
      id: "motor-borrador-propuesta",
      targetField: "motores",
      title: "El contexto sugiere un generador de borrador de propuesta",
      description:
        "La venta consultiva o el interés en propuestas requiere un output siempre revisado por humanos.",
      actionLabel: "Agregar motor de propuesta",
      apply: () => addSuggestedMotors([propuestaMotor]),
    });
  }

  if (
    businessContext.necesitaSeguimiento &&
    !hasMotorNamed(motores, ["seguimiento"])
  ) {
    localSuggestions.push({
      id: "motor-auditor-seguimiento",
      targetField: "motores",
      title: "El contexto sugiere auditar seguimiento comercial",
      description:
        "Hay señales de seguimiento en Diagnóstico, Cuestionario o Proceso/Pipeline.",
      actionLabel: "Agregar auditor de seguimiento",
      apply: () => addSuggestedMotors([seguimientoMotor]),
    });
  }

  if (
    businessContext.necesitaReportes &&
    !hasMotorNamed(motores, ["reporte", "reportes"])
  ) {
    localSuggestions.push({
      id: "motor-reportes-comerciales",
      targetField: "motores",
      title: "Podés sumar un generador de reportes comerciales",
      description:
        "Las métricas y oportunidades detectadas sugieren convertir datos del pipeline en resúmenes de gestión.",
      actionLabel: "Agregar motor de reportes",
      apply: () => addSuggestedMotors([reportesMotor]),
    });
  }

  if (
    businessContext.esLimpieza &&
    !hasMotorNamed(motores, ["relevamiento técnico", "checklist de cotización"])
  ) {
    localSuggestions.push({
      id: "motores-limpieza",
      targetField: "motores",
      title: "El rubro limpieza puede necesitar motores técnicos",
      description:
        "Relevamiento técnico y checklist de cotización ayudan a validar metraje, frecuencia, sedes, horarios e insumos.",
      actionLabel: "Agregar motores de limpieza",
      apply: () => addSuggestedMotors(limpiezaMotors),
    });
  }

  if (
    businessContext.esEducacion &&
    !hasMotorNamed(motores, ["interesados educativos", "programa", "curso"])
  ) {
    localSuggestions.push({
      id: "motores-educacion",
      targetField: "motores",
      title: "El rubro educación puede necesitar motores de admisiones",
      description:
        "Calificar interesados y recomendar programas/cursos ayuda a ordenar el proceso educativo.",
      actionLabel: "Agregar motores educativos",
      apply: () => addSuggestedMotors(educacionMotors),
    });
  }

  if (
    motores.some((motor) => !motor.input.trim() || !motor.output.trim()) ||
    motores.length === 0
  ) {
    localSuggestions.push({
      id: "inputs-outputs-incompletos",
      targetField: "inputsOutputs",
      title: "Revisá inputs y outputs antes de guardar",
      description:
        "Cada motor debería indicar qué datos usa y qué entrega para evitar configuraciones ambiguas.",
    });
  }

  if (
    businessContext.necesitaValidacionHumana &&
    !reglas.motivosAprobacion.includes(validacionHumanaSugerida)
  ) {
    localSuggestions.push({
      id: "regla-validacion-humana-contextual",
      targetField: "validacionHumana",
      title: "El contexto sugiere reforzar aprobación humana",
      description: validacionHumanaSugerida,
      actionLabel: "Aplicar regla",
      apply: () =>
        setReglas((prev) => ({
          ...prev,
          motivosAprobacion: appendTextIfMissing(
            prev.motivosAprobacion,
            validacionHumanaSugerida
          ),
          outputsBorrador: appendTextIfMissing(
            prev.outputsBorrador,
            "Propuestas, descuentos, cierres y comunicaciones finales deben quedar como borrador hasta aprobación humana."
          ),
        })),
    });
  }

  if (
    !reglas.outputsReportes.trim() &&
    (businessContext.necesitaReportes || businessContext.riesgoTrazabilidad)
  ) {
    localSuggestions.push({
      id: "reglas-reportes-contextuales",
      targetField: "reglas",
      title: "Podés definir outputs que alimenten reportes",
      description:
        "Scores, riesgos, motivos de pérdida, oportunidades frías y alertas de pipeline pueden alimentar reportes de gestión.",
      actionLabel: "Aplicar regla de reportes",
      apply: () =>
        setRegla(
          "outputsReportes",
          "Scores de calificación, riesgos comerciales, motivos de pérdida, oportunidades frías y alertas de pipeline pueden alimentar reportes de gestión."
        ),
    });
  }

  function renderFieldSuggestions(targetField: LocalSuggestion["targetField"]) {
    const suggestions = localSuggestions.filter(
      (suggestion) => suggestion.targetField === targetField
    );
    if (suggestions.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        <p className="text-[11px] text-slate-400">
          Sugerencias basadas en Empresa, Cuestionario, Diagnóstico y Proceso/Pipeline ya cargados.
        </p>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2"
          >
            <p className="text-[11px] font-semibold text-indigo-800">
              {suggestion.title}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-indigo-700">
              {suggestion.description}
            </p>
            {suggestion.apply && (
              <button
                type="button"
                onClick={suggestion.apply}
                className="mt-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                {suggestion.actionLabel ?? "Aplicar sugerencia"}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Derivar mapa de motores agrupados por etapa
  const etapasConMotores = ETAPAS_OPCIONES.filter((etapa) =>
    motores.some((m) => m.etapa === etapa)
  );

  const totalActivos = motores.filter((m) => m.activo).length;
  const totalConValidacion = motores.filter((m) => m.requiereValidacionHumana).length;
  const totalAltoRiesgo = motores.filter((m) => m.riesgo === "alto").length;
  const step = CRM_SETUP_STEPS.find((s) => s.id === "motores-ia");

  const readiness = evaluateMotoresIAReadiness({ motores, reglas });

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin/constructor" className="hover:text-slate-800 transition-colors">
            ← Constructor CRM
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/empresa" className="hover:text-slate-800 transition-colors">Empresa</Link>
          <span>/</span>
          <Link href="/admin/constructor/cuestionario" className="hover:text-slate-800 transition-colors">Cuestionario</Link>
          <span>/</span>
          <Link href="/admin/constructor/documentos" className="hover:text-slate-800 transition-colors">Documentos</Link>
          <span>/</span>
          <Link href="/admin/constructor/diagnostico" className="hover:text-slate-800 transition-colors">Diagnóstico</Link>
          <span>/</span>
          <Link href="/admin/constructor/proceso-pipeline" className="hover:text-slate-800 transition-colors">Proceso y pipeline</Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Motores IA</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso {step?.step ?? 6} de {CRM_SETUP_STEPS.length}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {step?.title ?? "Motores IA"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {step?.description ??
                "Definí qué inteligencias acompañarán al equipo comercial, en qué etapa actuarán y cuándo necesitarán validación humana."}
              {" "}Esta configuración no ejecuta IA real todavía.
            </p>
          </div>

          <StepReadinessPanel
            title="Estado de motores IA"
            readiness={readiness}
            overallProgress={getConstructorOverallProgress({
              currentStep: "motores-ia",
              currentStepPercent: readiness.completionPercent,
            })}
          />

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                {loading
                  ? "Cargando motores IA guardados..."
                  : "Este paso guarda la configuración visual de motores IA."}
              </span>{" "}
              No ejecuta IA real, no conecta OpenAI y no crea prompts operativos todavía.
            </p>
          </div>

          {/* ── A: Explicación conceptual ────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Tipos de motores IA en el Constructor" />
            <p className="mb-4 text-xs text-slate-500">
              El sistema distingue tres categorías de motores según su momento de uso y propósito.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores de configuración</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Antes de activar el CRM. Asisten el diseño del proceso comercial, el diagnóstico y
                  la auditoría final del Constructor.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Motor de Diagnóstico Comercial, Motor de Lectura Documental, CLOF Auditor.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores operativos</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Durante la gestión real de leads. Asisten al vendedor etapa por etapa con
                  información, sugerencias y generación de contenido.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Investigador Digital, Generador de Propuesta, Seguimiento Inteligente.
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores de auditoría</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-green-500">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Antes y después de hitos críticos. Revisan coherencia, calidad, riesgos y readiness
                  del sistema o de un resultado generado.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Validador de Propuesta, Análisis de Cierre Perdido, CLOF Auditor.
                </p>
              </div>
            </div>
          </div>

          {/* ── B: Diseñador de motores ──────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de motores IA operativos" />
            <p className="mb-4 text-xs text-slate-500">
              Editá cada motor según las necesidades reales del proceso. Los cambios son locales —
              no se guardan todavía.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.motoresDefinidos} />

            {/* Resumen rápido */}
            <div className="mb-5 flex flex-wrap gap-3">
              {[
                { label: "Total motores", value: motores.length, color: "text-slate-700" },
                { label: "Activos", value: totalActivos, color: "text-green-700" },
                { label: "Con validación humana", value: totalConValidacion, color: "text-amber-700" },
                { label: "Riesgo alto", value: totalAltoRiesgo, color: "text-red-700" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <FieldQualityHint hint={readiness.fieldHints.prioridadActivacion} />

            <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-violet-700">
                  Prototipo: usa endpoint mock, no OpenAI.
                </p>
                <button
                  type="button"
                  onClick={requestMockAISuggestionForMotores}
                  disabled={mockAIMotoresLoading}
                  className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mockAIMotoresLoading
                    ? "Consultando IA mock..."
                    : "Consultar IA mock"}
                </button>
              </div>

              {mockAIMotoresError && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                  {mockAIMotoresError}
                </p>
              )}

              {mockAIMotoresSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mockAIMotoresSuggestions.map((suggestion) => (
                    <MockAISuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={applyMockAIMotorSuggestion}
                      showApply={
                        Boolean(suggestion.suggestedValue) &&
                        typeof suggestion.suggestedValue === "object" &&
                        !Array.isArray(suggestion.suggestedValue)
                      }
                    />
                  ))}
                </div>
              )}

              {mockAIApplyMessage ? (
                <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {mockAIApplyMessage}
                </p>
              ) : null}

              {mockAIAuditError ? (
                <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Auditoría IA mock: {mockAIAuditError}
                </p>
              ) : null}

              {!mockAIMotoresLoading &&
                !mockAIMotoresError &&
                mockAIMotoresRequested &&
                mockAIMotoresSuggestions.length === 0 && (
                  <p className="mt-2 rounded-md border border-violet-100 bg-white px-2 py-1 text-[11px] font-medium text-violet-700">
                    No se recibieron sugerencias IA mock para este caso.
                  </p>
                )}
            </div>

            <div className="space-y-3">
              {motores.map((motor, index) => (
                <div
                  key={motor.id}
                  className={[
                    "overflow-hidden rounded-xl border bg-white transition-all",
                    motor.activo ? "border-slate-200" : "border-slate-200 opacity-60",
                  ].join(" ")}
                >
                  {/* Card header */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      value={motor.nombre}
                      onChange={(e) => setMotor(motor.id, "nombre", e.target.value)}
                      placeholder="Nombre del motor…"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <button
                          type="button"
                          onClick={() =>
                            setMotor(motor.id, "requiereValidacionHumana", !motor.requiereValidacionHumana)
                          }
                        >
                          {motor.requiereValidacionHumana ? (
                            <CheckSquare className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <ShieldAlert className="h-3 w-3 text-slate-400" />
                        Validación humana
                      </label>

                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <button
                          type="button"
                          onClick={() => setMotor(motor.id, "activo", !motor.activo)}
                        >
                          {motor.activo ? (
                            <Zap className="h-4 w-4 text-green-600" />
                          ) : (
                            <ZapOff className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        {motor.activo ? "Activo" : "Inactivo"}
                      </label>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">

                    <div>
                      <label className={LABEL_CLASS}>Etapa</label>
                      <select
                        className={SELECT_CLASS}
                        value={motor.etapa}
                        onChange={(e) => setMotor(motor.id, "etapa", e.target.value)}
                      >
                        <option value="">Sin etapa…</option>
                        {ETAPAS_OPCIONES.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Tipo</label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={motor.tipo}
                        onChange={(e) => setMotor(motor.id, "tipo", e.target.value)}
                        placeholder="Ej: Diagnóstico, Generación…"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className={LABEL_CLASS}>Prioridad</label>
                        <PillSelect
                          options={[
                            { value: "alta" as Prioridad, label: "Alta" },
                            { value: "media" as Prioridad, label: "Media" },
                            { value: "baja" as Prioridad, label: "Baja" },
                          ]}
                          value={motor.prioridad}
                          onChange={(v) => setMotor(motor.id, "prioridad", v)}
                          styleMap={PRIORIDAD_STYLES}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Riesgo</label>
                        <PillSelect
                          options={[
                            { value: "bajo" as NivelRiesgo, label: "Bajo" },
                            { value: "medio" as NivelRiesgo, label: "Medio" },
                            { value: "alto" as NivelRiesgo, label: "Alto" },
                          ]}
                          value={motor.riesgo}
                          onChange={(v) => setMotor(motor.id, "riesgo", v)}
                          styleMap={RIESGO_STYLES}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Objetivo</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.objetivo}
                        onChange={(e) => setMotor(motor.id, "objetivo", e.target.value)}
                        placeholder="¿Qué hace este motor?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Input (datos que usa)</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.input}
                        onChange={(e) => setMotor(motor.id, "input", e.target.value)}
                        placeholder="¿Qué información necesita para funcionar?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Output (qué produce)</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.output}
                        onChange={(e) => setMotor(motor.id, "output", e.target.value)}
                        placeholder="¿Qué entrega al usuario?"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {motores.length} motores definidos — se guardan como configuración del Constructor, sin ejecución.
            </p>
            {renderFieldSuggestions("motores")}
            {renderFieldSuggestions("inputsOutputs")}
          </div>

          {/* ── C: Mapa de motores por etapa ─────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Mapa de motores por etapa comercial" />
            <p className="mb-4 text-xs text-slate-500">
              Vista derivada del estado local. Muestra en qué momento del proceso comercial actúa
              cada motor, si requiere validación y su nivel de riesgo.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.coberturaProceso} />

            <div className="space-y-3">
              {etapasConMotores.map((etapa) => {
                const motorsDe = motores.filter((m) => m.etapa === etapa);
                return (
                  <div key={etapa} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-700">{etapa}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {motorsDe.map((m) => (
                        <div
                          key={m.id}
                          className={[
                            "flex items-start gap-2 rounded-lg border px-3 py-2",
                            m.activo ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-slate-50 opacity-50",
                          ].join(" ")}
                        >
                          <Bot
                            className={[
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              m.activo ? "text-slate-600" : "text-slate-400",
                            ].join(" ")}
                          />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-800">{m.nombre}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${PRIORIDAD_STYLES[m.prioridad]}`}
                              >
                                {m.prioridad}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${RIESGO_STYLES[m.riesgo]}`}
                              >
                                riesgo {m.riesgo}
                              </span>
                              {m.requiereValidacionHumana && (
                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                                  humano
                                </span>
                              )}
                              {!m.activo && (
                                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                  inactivo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── D: Reglas de uso y validación humana ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Reglas de uso y validación humana" />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que gobiernan cuándo la IA puede actuar sola y cuándo
              necesita intervención humana antes de ejecutar o entregar output.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.riesgoValidacion} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué motores pueden ejecutarse automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.motoresAutomaticos}
                  onChange={(e) => setRegla("motoresAutomaticos", e.target.value)}
                  placeholder="Ej: Investigación Digital puede ejecutarse al crear un lead sin aprobación…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué motores requieren aprobación antes de generar output?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.motivosAprobacion}
                  onChange={(e) => setRegla("motivosAprobacion", e.target.value)}
                  placeholder="Ej: Generador de Propuesta siempre requiere revisión del vendedor…"
                />
                {renderFieldSuggestions("validacionHumana")}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué outputs deben quedar como borrador?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.outputsBorrador}
                  onChange={(e) => setRegla("outputsBorrador", e.target.value)}
                  placeholder="Ej: Propuestas, mensajes de negociación, respuestas a objeciones…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué outputs podrían alimentar reportes automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.outputsReportes}
                  onChange={(e) => setRegla("outputsReportes", e.target.value)}
                  placeholder="Ej: Scores de calificación, análisis de cierre perdido, alertas de SLA…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué riesgos debe revisar el usuario antes de aprobar un output?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.riesgosRevisar}
                  onChange={(e) => setRegla("riesgosRevisar", e.target.value)}
                  placeholder="Ej: Datos incorrectos del cliente, precios fuera de rango, compromisos que no puede cumplir…"
                />
              </div>
            </div>
            {renderFieldSuggestions("reglas")}
          </div>

          {/* ── E: Preview JSON ──────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Preview del futuro JSON de configuración" />
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-4">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">Solo estructura — refleja el estado local.</span>{" "}
                Este panel muestra el objeto de configuración que el sistema persistirá cuando se
                conecte Supabase. Se actualiza en tiempo real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  motores_ia.json — preview local
                </span>
              </div>
              <pre className="max-h-[420px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      motoresIA: motores.map((m) => ({
                        id: m.id,
                        nombre: m.nombre,
                        etapa: m.etapa || "⏳ sin etapa",
                        tipo: m.tipo || "⏳ sin tipo",
                        objetivo: m.objetivo || "⏳ pendiente",
                        input: m.input || "⏳ pendiente",
                        output: m.output || "⏳ pendiente",
                        requiereValidacionHumana: m.requiereValidacionHumana,
                        prioridad: m.prioridad,
                        riesgo: m.riesgo,
                        activo: m.activo,
                      })),
                      reglasUsoIA: {
                        motoresAutomaticos: reglas.motoresAutomaticos || "⏳ pendiente",
                        motivosAprobacion: reglas.motivosAprobacion || "⏳ pendiente",
                        outputsBorrador: reglas.outputsBorrador || "⏳ pendiente",
                        outputsReportes: reglas.outputsReportes || "⏳ pendiente",
                        riesgosRevisar: reglas.riesgosRevisar || "⏳ pendiente",
                      },
                      meta: {
                        totalMotores: motores.length,
                        motoresActivos: totalActivos,
                        motoresConValidacionHumana: totalConValidacion,
                        motoresAltoRiesgo: totalAltoRiesgo,
                        persistido: true,
                        version: "Constructor CRM — configuración visual",
                      },
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
            </div>
          </div>

          {(loading || saveMessage || saveError) && (
            <div className="mb-4 space-y-2">
              {loading && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                  Cargando motores IA guardados...
                </div>
              )}
              {saveMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-medium text-green-700">
                  {saveMessage}
                </div>
              )}
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
                  {saveError}
                </div>
              )}
            </div>
          )}

          {/* ── F: Navegación ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/proceso-pipeline"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Proceso y pipeline
              </Link>
              <Link
                href="/admin/constructor"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Constructor
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar motores IA"}
              </button>
              <Link
                href="/admin/constructor/reportes"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Continuar a Reportes
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
