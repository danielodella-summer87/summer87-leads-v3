"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  BarChart3,
  LineChart,
  BrainCircuit,
  Code2,
  Users,
  Zap,
  ZapOff,
} from "lucide-react";
import { MockAISuggestionCard } from "@/components/constructor/MockAISuggestionCard";
import { StepReadinessPanel } from "@/components/constructor/StepReadinessPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import type {
  BaseReadiness,
  QualityStatus,
  SectionQuality,
} from "@/lib/constructor/readiness/types";
import {
  READINESS_SUMMARY_LABEL,
  STATUS_VALUE,
} from "@/lib/constructor/readiness/statusStyles";
import {
  clampCompletionPercent,
  countSelectedValues,
  hasRelevantText,
  hasText,
} from "@/lib/constructor/readiness/helpers";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";
import type { ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";
import { useConstructorAIAudit } from "@/lib/constructor-ai/useConstructorAIAudit";
import { useConstructorMockAI } from "@/lib/constructor-ai/useConstructorMockAI";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoReporte = "operativo" | "gerencial" | "ia";
type Frecuencia =
  | "tiempo-real"
  | "diaria"
  | "semanal"
  | "mensual"
  | "bajo-demanda";

type ReporteSugerido = {
  id: string;
  nombre: string;
  tipo: TipoReporte;
  audiencia: string;
  metricas: string;
  filtros: string;
  frecuencia: Frecuencia;
  activo: boolean;
};

type ReglasReportes = {
  generacionAutomatica: string;
  distribucion: string;
  formatoPreferido: string;
  alertasUmbral: string;
};

type SetupRecord = Record<string, unknown>;

type LocalSuggestion = {
  id: string;
  targetField:
    | "reportes"
    | "metricas"
    | "frecuencia"
    | "alertas"
    | "distribucion"
    | "reglas"
    | "general";
  title: string;
  description: string;
  actionLabel?: string;
  apply?: () => void;
};

type ReportesPayload = {
  reportes: ReporteSugerido[];
  reglas: ReglasReportes;
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const AUDIENCIAS_OPCIONES = [
  "Vendedor",
  "Supervisor comercial",
  "Gerente de ventas",
  "Dirección",
  "Operaciones",
  "Transversal",
];

const FRECUENCIAS: { value: Frecuencia; label: string }[] = [
  { value: "tiempo-real", label: "Tiempo real" },
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "bajo-demanda", label: "Bajo demanda" },
];

const REPORTES_INICIALES: ReporteSugerido[] = [
  {
    id: "r1",
    nombre: "Bandeja de leads activos",
    tipo: "operativo",
    audiencia: "Vendedor",
    metricas: "Leads por etapa, días sin actividad, próximas acciones",
    filtros: "Vendedor asignado, etapa, última actividad",
    frecuencia: "tiempo-real",
    activo: true,
  },
  {
    id: "r2",
    nombre: "Estado del pipeline comercial",
    tipo: "operativo",
    audiencia: "Supervisor comercial",
    metricas: "Leads por etapa, tasa de conversión por etapa, SLA en riesgo",
    filtros: "Equipo, período, etapa",
    frecuencia: "diaria",
    activo: true,
  },
  {
    id: "r3",
    nombre: "Performance del equipo",
    tipo: "gerencial",
    audiencia: "Gerente de ventas",
    metricas:
      "Conversiones por vendedor, tiempo promedio en etapa, propuestas enviadas",
    filtros: "Vendedor, período, producto/servicio",
    frecuencia: "semanal",
    activo: true,
  },
  {
    id: "r4",
    nombre: "Dashboard ejecutivo de ventas",
    tipo: "gerencial",
    audiencia: "Dirección",
    metricas: "Ingresos proyectados, tasa de cierre, leads perdidos vs ganados",
    filtros: "Período, vertical de negocio",
    frecuencia: "mensual",
    activo: true,
  },
  {
    id: "r5",
    nombre: "Análisis de calificación IA",
    tipo: "ia",
    audiencia: "Supervisor comercial",
    metricas:
      "Score promedio por etapa, leads calificados vs rechazados por IA, patrones detectados",
    filtros: "Motor IA, etapa, período",
    frecuencia: "semanal",
    activo: true,
  },
  {
    id: "r6",
    nombre: "Patrones de cierre perdido",
    tipo: "ia",
    audiencia: "Gerente de ventas",
    metricas:
      "Motivos de pérdida, etapa donde se pierde, correlación con perfil del lead",
    filtros: "Período, motivo de pérdida, etapa",
    frecuencia: "mensual",
    activo: false,
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS =
  "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

const TIPO_STYLES: Record<TipoReporte, string> = {
  operativo: "border-blue-200 bg-blue-50 text-blue-700",
  gerencial: "border-purple-200 bg-purple-50 text-purple-700",
  ia: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const TIPO_LABELS: Record<TipoReporte, string> = {
  operativo: "Operativo",
  gerencial: "Gerencial",
  ia: "IA",
};

const FRECUENCIA_STYLES: Record<Frecuencia, string> = {
  "tiempo-real": "border-green-200 bg-green-50 text-green-700",
  diaria: "border-blue-200 bg-blue-50 text-blue-700",
  semanal: "border-amber-200 bg-amber-50 text-amber-700",
  mensual: "border-slate-200 bg-slate-50 text-slate-600",
  "bajo-demanda": "border-slate-200 bg-slate-100 text-slate-500",
};

const TIPO_REPORTE_VALUES = new Set<TipoReporte>(["operativo", "gerencial", "ia"]);
const FRECUENCIA_VALUES = new Set<Frecuencia>(
  FRECUENCIAS.map((frecuencia) => frecuencia.value)
);

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

function hasReportNamed(items: unknown[], terms: string[]) {
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

function asTipoReporte(value: unknown): TipoReporte {
  return typeof value === "string" && TIPO_REPORTE_VALUES.has(value as TipoReporte)
    ? (value as TipoReporte)
    : "operativo";
}

function asFrecuencia(value: unknown): Frecuencia {
  return typeof value === "string" && FRECUENCIA_VALUES.has(value as Frecuencia)
    ? (value as Frecuencia)
    : "bajo-demanda";
}

function normalizeReporte(value: unknown, index: number): ReporteSugerido | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) || `reporte-${index}`,
    nombre: asString(value.nombre),
    tipo: asTipoReporte(value.tipo),
    audiencia: asString(value.audiencia),
    metricas: asString(value.metricas),
    filtros: asString(value.filtros),
    frecuencia: asFrecuencia(value.frecuencia),
    activo: asBoolean(value.activo),
  };
}

function normalizeReglas(value: unknown): ReglasReportes {
  if (!isRecord(value)) {
    return {
      generacionAutomatica: "",
      distribucion: "",
      formatoPreferido: "",
      alertasUmbral: "",
    };
  }

  return {
    generacionAutomatica: asString(value.generacionAutomatica),
    distribucion: asString(value.distribucion),
    formatoPreferido: asString(value.formatoPreferido),
    alertasUmbral: asString(value.alertasUmbral),
  };
}

function createSuggestedReport(params: {
  id: string;
  nombre: string;
  tipo?: TipoReporte;
  audiencia: string;
  metricas: string[];
  filtros?: string;
  frecuencia: Frecuencia;
  activo?: boolean;
}): ReporteSugerido {
  return {
    id: params.id,
    nombre: params.nombre,
    tipo: params.tipo ?? "operativo",
    audiencia: params.audiencia,
    metricas: params.metricas.join(", "),
    filtros: params.filtros ?? "Período, responsable, etapa",
    frecuencia: params.frecuencia,
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

function asMockFrecuencia(value: unknown): Frecuencia {
  const normalized = String(value ?? "").trim().toLowerCase();

  return FRECUENCIA_VALUES.has(normalized as Frecuencia)
    ? (normalized as Frecuencia)
    : "semanal";
}

function asMockTipoReporte(value: unknown): TipoReporte {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "comercial") return "gerencial";
  if (normalized === "pipeline") return "operativo";

  return TIPO_REPORTE_VALUES.has(normalized as TipoReporte)
    ? (normalized as TipoReporte)
    : "operativo";
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

function evaluateReportesReadiness(args: {
  reportes: ReporteSugerido[];
  reglas: ReglasReportes;
}): BaseReadiness {
  const reportesSafe = Array.isArray(args.reportes) ? args.reportes : [];
  const reglasIn = args.reglas;
  const reglas: ReglasReportes =
    reglasIn && typeof reglasIn === "object"
      ? {
          generacionAutomatica:
            typeof reglasIn.generacionAutomatica === "string"
              ? reglasIn.generacionAutomatica
              : "",
          distribucion:
            typeof reglasIn.distribucion === "string" ? reglasIn.distribucion : "",
          formatoPreferido:
            typeof reglasIn.formatoPreferido === "string"
              ? reglasIn.formatoPreferido
              : "",
          alertasUmbral:
            typeof reglasIn.alertasUmbral === "string" ? reglasIn.alertasUmbral : "",
        }
      : {
          generacionAutomatica: "",
          distribucion: "",
          formatoPreferido: "",
          alertasUmbral: "",
        };

  const activos = reportesSafe.filter((r) => Boolean(r?.activo));
  const nombresOk = activos.filter((r) => hasText(r?.nombre ?? ""));

  let definicionStatus: QualityStatus;
  let definicionDetail: string;
  if (reportesSafe.length === 0) {
    definicionStatus = "danger";
    definicionDetail = "Definí al menos un reporte sugerido con nombre.";
  } else if (activos.length === 0) {
    definicionStatus = "danger";
    definicionDetail = "Activá al menos un reporte para que esta etapa sea usable.";
  } else if (nombresOk.length === 0) {
    definicionStatus = "danger";
    definicionDetail = "Completá el nombre en los reportes activos.";
  } else if (nombresOk.length >= Math.max(3, Math.ceil(activos.length * 0.5))) {
    definicionStatus = "good";
    definicionDetail = "La mayoría de los reportes activos tienen nombre claro.";
  } else if (nombresOk.length < Math.ceil(activos.length * 0.25)) {
    definicionStatus = "warning";
    definicionDetail = "Revisá nombres faltantes o genéricos en varios reportes.";
  } else {
    definicionStatus = "warning";
    definicionDetail = "Podés ampliar o precisar nombres de reportes clave.";
  }

  let metricasStatus: QualityStatus;
  let metricasDetail: string;
  const conMetricas = activos.filter((r) =>
    hasRelevantText(r?.metricas ?? "", 14)
  );
  if (activos.length === 0) {
    metricasStatus = "warning";
    metricasDetail = "Sin reportes activos no se evalúan métricas o KPIs todavía.";
  } else if (conMetricas.length === 0) {
    metricasStatus = "danger";
    metricasDetail = "Describí qué datos o KPIs muestra al menos un reporte.";
  } else if (
    conMetricas.length >= Math.max(2, Math.ceil(activos.length * 0.5))
  ) {
    metricasStatus = "good";
    metricasDetail = "Varios reportes detallan métricas suficientemente.";
  } else {
    metricasStatus = "warning";
    metricasDetail = "Ampliá descripciones de métricas en más reportes activos.";
  }

  let filtrosStatus: QualityStatus;
  let filtrosDetail: string;
  const conFiltros = activos.filter((r) => hasRelevantText(r?.filtros ?? "", 12));
  if (activos.length === 0) {
    filtrosStatus = "warning";
    filtrosDetail =
      "Sin reportes activos no se pueden evaluar filtros ni frecuencias de uso.";
  } else if (conFiltros.length === 0) {
    filtrosStatus = "danger";
    filtrosDetail = "Indicá filtros típicos (período, etapa, responsable, etc.).";
  } else if (conFiltros.length >= Math.max(2, Math.ceil(activos.length * 0.5))) {
    filtrosStatus = "good";
    filtrosDetail = "Varios reportes explicitan filtros y dimensiones habituales.";
  } else {
    filtrosStatus = "warning";
    filtrosDetail = "Completá filtros en más tarjetas de reporte.";
  }

  let audienciaStatus: QualityStatus;
  let audienciaDetail: string;
  const conAud = activos.filter((r) => hasText(r?.audiencia ?? ""));
  const audienciasDistintas = new Set(
    conAud.map((r) => String(r?.audiencia ?? "").trim().toLowerCase()).filter(Boolean)
  );
  if (activos.length === 0) {
    audienciaStatus = "warning";
    audienciaDetail = "Sin reportes activos no hay audiencia que evaluar.";
  } else if (conAud.length === 0) {
    audienciaStatus = "danger";
    audienciaDetail = "Asigná audiencia (rol o perfil) a cada reporte activo.";
  } else if (
    audienciasDistintas.size >= 2 ||
    conAud.length >= Math.ceil(activos.length * 0.75)
  ) {
    audienciaStatus = "good";
    audienciaDetail = "Hay audiencias definidas para el uso esperado de los reportes.";
  } else {
    audienciaStatus = "warning";
    audienciaDetail = "Diversificá audiencias entre reportes cuando aplique.";
  }

  const reglasScore = countSelectedValues([
    hasRelevantText(reglas.generacionAutomatica ?? "", 14),
    hasRelevantText(reglas.distribucion ?? "", 14),
    hasRelevantText(reglas.alertasUmbral ?? "", 12),
  ]);
  const hayReporteIa = activos.some((r) => r?.tipo === "ia");

  let reglasIaStatus: QualityStatus;
  let reglasIaDetail: string;
  if (reglasScore === 0 && !hayReporteIa) {
    reglasIaStatus = "danger";
    reglasIaDetail =
      "Documentá cadencia/generación, distribución o alertas; si hay IA, aclarás umbrales.";
  } else if (reglasScore >= 3 || (hayReporteIa && reglasScore >= 2)) {
    reglasIaStatus = "good";
    reglasIaDetail =
      hayReporteIa
        ? "Reglas coherentes para operación de reportes; hay cobertura de reportes IA o alertas."
        : "Hay buena definición de gobierno (generación, distribución y alertas).";
  } else if (hayReporteIa || reglasScore >= 1) {
    reglasIaStatus = "warning";
    reglasIaDetail =
      "Completá generación/distribución o alertas con más detalle antes de Auditoría.";
  } else {
    reglasIaStatus = "warning";
    reglasIaDetail = "Los bloques de reglas pueden estar más desarrollados.";
  }

  const sections: SectionQuality[] = [
    {
      key: "def-reportes",
      label: "Definición sugerida",
      status: definicionStatus,
      detail: definicionDetail,
    },
    {
      key: "metricas-kpis",
      label: "Métricas y KPIs",
      status: metricasStatus,
      detail: metricasDetail,
    },
    {
      key: "filtros-frec",
      label: "Filtros / frecuencia",
      status: filtrosStatus,
      detail: filtrosDetail,
    },
    {
      key: "audiencia",
      label: "Audiencia y uso",
      status: audienciaStatus,
      detail: audienciaDetail,
    },
    {
      key: "reglas-ia-alertas",
      label: "Reglas, IA y alertas",
      status: reglasIaStatus,
      detail: reglasIaDetail,
    },
  ];

  const completionPercent = clampCompletionPercent(
    Math.round(
      20 * STATUS_VALUE[definicionStatus] +
        20 * STATUS_VALUE[metricasStatus] +
        20 * STATUS_VALUE[filtrosStatus] +
        20 * STATUS_VALUE[audienciaStatus] +
        20 * STATUS_VALUE[reglasIaStatus]
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

  let nextAction =
    "Podés guardar y continuar a Auditoría cuando la etapa lo permita.";
  if (definicionStatus === "danger") {
    nextAction = "Activá reportes sugeridos con nombres claros.";
  } else if (metricasStatus === "danger") {
    nextAction =
      "Completá métricas o KPIs en los reportes activos prioritarios.";
  } else if (filtrosStatus === "danger") {
    nextAction = "Agregá filtros habituales en los reportes clave.";
  } else if (audienciaStatus === "danger") {
    nextAction = "Asigná audiencia en cada tarjeta de reporte activa.";
  } else if (reglasIaStatus === "danger") {
    nextAction =
      "Completá reglas de generación, distribución o alertas antes de cerrar esta etapa.";
  }

  return {
    completionPercent,
    overallStatus,
    overallLabel: READINESS_SUMMARY_LABEL[overallStatus],
    nextAction,
    sections,
    fieldHints: {},
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [reportes, setReportes] =
    useState<ReporteSugerido[]>(REPORTES_INICIALES);
  const [reglas, setReglas] = useState<ReglasReportes>({
    generacionAutomatica: "",
    distribucion: "",
    formatoPreferido: "",
    alertasUmbral: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [constructorContext, setConstructorContext] = useState<SetupRecord | null>(null);
  const [mockAIReportesRequested, setMockAIReportesRequested] = useState(false);
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
    suggestions: mockAIReportesSuggestions,
    loading: mockAIReportesLoading,
    error: mockAIReportesError,
    request: requestMockAIReportes,
    clear: clearMockAIReportes,
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
          data?: (SetupRecord & { reportes?: unknown }) | null;
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

        const reportesSetup = json?.data?.reportes;

        if (
          reportesSetup &&
          typeof reportesSetup === "object" &&
          !Array.isArray(reportesSetup) &&
          Object.keys(reportesSetup).length > 0
        ) {
          if (!cancelled) {
            const loaded = reportesSetup as Partial<ReportesPayload>;

            setReportes(
              Array.isArray(loaded.reportes)
                ? loaded.reportes
                    .map((reporte, index) => normalizeReporte(reporte, index))
                    .filter((reporte): reporte is ReporteSugerido => reporte !== null)
                : REPORTES_INICIALES
            );
            setReglas(normalizeReglas(loaded.reglas));
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar los reportes y guardar nuevamente."
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

    const payloadReportes: ReportesPayload = {
      reportes,
      reglas,
    };

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          step: "reportes",
          mark_completed: true,
          data: payloadReportes,
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
        setSaveMessage("Reportes guardados correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setReporte<K extends keyof ReporteSugerido>(
    id: string,
    key: K,
    value: ReporteSugerido[K]
  ) {
    clearMockAIReportes();
    setMockAIReportesRequested(false);
    setMockAIApplyMessage(null);
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  }

  function setRegla<K extends keyof ReglasReportes>(
    key: K,
    value: ReglasReportes[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  function addSuggestedReports(suggested: ReporteSugerido[]) {
    clearMockAIReportes();
    setMockAIReportesRequested(false);
    setMockAIApplyMessage(null);
    setReportes((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const existingNames = new Set(
        current.map((report) => String(report.nombre ?? "").toLowerCase())
      );
      const next = suggested.filter(
        (report) => !existingNames.has(String(report.nombre ?? "").toLowerCase())
      );

      return [...current, ...next];
    });
  }

  async function requestMockAISuggestionForReportes() {
    setMockAIReportesRequested(true);
    setMockAIApplyMessage(null);
    clearMockAIAuditError();

    const suggestions = await requestMockAIReportes({
      mode: "field_suggestion",
      step: "reportes",
      field: "reportes",
      value: reportes,
      currentForm: {
        reportes,
        reglas,
      },
      constructorContext: constructorContext ?? {},
    });

    if (suggestions.length === 0) {
      await auditEmptyResult({
        step: "reportes",
        field: "reportes",
        screen: "constructor_reportes",
      });
      return;
    }

    for (const suggestion of suggestions) {
      await auditSuggestionShown({
        suggestion,
        step: "reportes",
        field: "reportes",
        screen: "constructor_reportes",
      });
    }
  }

  function applyMockAIReportesSuggestion(
    suggestion: ConstructorMockAISuggestion
  ) {
    const value = suggestion.suggestedValue;

    if (!Array.isArray(value)) return;

    const suggestedReports = value
      .filter((item): item is SetupRecord => isRecord(item))
      .map((item): ReporteSugerido | null => {
        const nombre = typeof item.nombre === "string" ? item.nombre.trim() : "";

        if (!nombre) return null;

        const metricas = Array.isArray(item.metricas)
          ? item.metricas.filter((metric): metric is string => typeof metric === "string")
          : [];

        return createSuggestedReport({
          id: `mock-reporte-${slugFromText(nombre)}`,
          nombre,
          tipo: asMockTipoReporte(item.tipo),
          audiencia:
            typeof item.audiencia === "string" && item.audiencia.trim()
              ? item.audiencia.trim()
              : "Dirección",
          frecuencia: asMockFrecuencia(item.frecuencia),
          metricas,
          filtros: "Período, responsable, etapa",
        });
      })
      .filter((report): report is ReporteSugerido => report !== null);

    if (suggestedReports.length === 0) return;

    const existingNames = new Set(
      reportes.map((report) => report.nombre.trim().toLowerCase())
    );
    const nextReports = suggestedReports.filter((report) => {
      const name = report.nombre.trim().toLowerCase();

      if (!name || existingNames.has(name)) return false;

      existingNames.add(name);
      return true;
    });

    if (nextReports.length === 0) {
      setMockAIApplyMessage("Esta sugerencia IA ya estaba aplicada.");
      auditDuplicate({
        suggestion,
        step: "reportes",
        field: "reportes",
        screen: "constructor_reportes",
        afterSummary:
          "Reportes IA ya existentes: Reporte ejecutivo comercial / Reporte de pipeline",
      });
      return;
    }

    setReportes((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const currentNames = new Set(
        current.map((report) => report.nombre.trim().toLowerCase())
      );
      const additions = nextReports.filter((report) => {
        const name = report.nombre.trim().toLowerCase();

        if (!name || currentNames.has(name)) return false;

        currentNames.add(name);
        return true;
      });

      return [...current, ...additions];
    });
    setMockAIApplyMessage("Sugerencia IA aplicada correctamente.");
    auditApplied({
      suggestion,
      step: "reportes",
      field: "reportes",
      screen: "constructor_reportes",
      afterSummary:
        "Reportes IA agregados: Reporte ejecutivo comercial / Reporte de pipeline",
    });
  }

  useEffect(() => {
    if (!mockAIReportesError || !mockAIReportesRequested) return;

    void auditFailed({
      step: "reportes",
      field: "reportes",
      screen: "constructor_reportes",
      notes: mockAIReportesError,
    });
  }, [auditFailed, mockAIReportesError, mockAIReportesRequested]);

  const empresaContext = asRecord(constructorContext?.empresa);
  const cuestionarioContext = asRecord(constructorContext?.cuestionario);
  const diagnosticoContext = asRecord(constructorContext?.diagnostico);
  const procesoPipelineContext = asRecord(constructorContext?.proceso_pipeline);
  const motoresIAContext = asRecord(constructorContext?.motores_ia);

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
    necesitaSeguimiento:
      arrayOrTextIncludes(diagnosticoContext.riesgos, ["seguimiento"]) ||
      arrayOrTextIncludes(procesoPipelineContext.etapas, ["seguimiento"]) ||
      arrayOrTextIncludes(procesoPipelineContext.columnas, ["seguimiento"]),
    necesitaMedirPerdidas:
      arrayOrTextIncludes(cuestionarioContext.motivosPerdida, [
        "precio",
        "competencia",
        "presupuesto",
        "respuesta",
      ]) ||
      arrayOrTextIncludes(procesoPipelineContext.etapas, ["perdido"]) ||
      arrayOrTextIncludes(procesoPipelineContext.columnas, ["perdido"]),
    necesitaTrazabilidad:
      arrayOrTextIncludes(diagnosticoContext.riesgos, [
        "trazabilidad",
        "información",
        "informacion",
        "pipeline",
      ]) ||
      arrayOrTextIncludes(diagnosticoContext.puntosCiegos, [
        "origen",
        "leads",
        "motivos de pérdida",
        "motivos de perdida",
      ]),
    necesitaReportesDireccion:
      textIncludes(cuestionarioContext.necesidadesDireccion, [
        "dirección",
        "direccion",
        "gerencia",
        "ventas",
        "semana",
      ]) ||
      textIncludes(cuestionarioContext.queVerDireccion, [
        "dirección",
        "direccion",
        "gerencia",
        "ventas",
        "semana",
      ]) ||
      arrayOrTextIncludes(cuestionarioContext.metricasImportantes, [
        "leads",
        "conversión",
        "conversion",
        "ventas",
        "monto",
        "cierre",
      ]),
    tieneMotoresIA: arrayOrTextIncludes(motoresIAContext.motores, [
      "prospectos",
      "seguimiento",
      "riesgos",
      "propuesta",
      "reportes",
      "auditor",
    ]),
    requiereValidacionHumana:
      arrayOrTextIncludes(motoresIAContext.motores, ["validación", "validacion"]) ||
      arrayOrTextIncludes(diagnosticoContext.riesgos, [
        "dependencia",
        "personas clave",
        "validación",
        "validacion",
      ]),
  };

  const baseSuggestedReports = [
    createSuggestedReport({
      id: "asistente-reporte-ejecutivo-comercial",
      nombre: "Reporte ejecutivo comercial",
      tipo: "gerencial",
      audiencia: "Dirección",
      frecuencia: "semanal",
      metricas: [
        "leads nuevos",
        "oportunidades activas",
        "monto cotizado",
        "monto cerrado",
        "tasa de conversión",
      ],
      filtros: "Período, vertical, responsable comercial",
    }),
    createSuggestedReport({
      id: "asistente-reporte-pipeline",
      nombre: "Reporte de pipeline",
      tipo: "operativo",
      audiencia: "Supervisor comercial",
      frecuencia: "semanal",
      metricas: [
        "oportunidades por etapa",
        "oportunidades sin próxima acción",
        "oportunidades frías",
        "avance por responsable",
      ],
      filtros: "Etapa, responsable, antigüedad, próxima acción",
    }),
    createSuggestedReport({
      id: "asistente-reporte-perdidas",
      nombre: "Reporte de pérdidas",
      tipo: "gerencial",
      audiencia: "Gerente de ventas",
      frecuencia: "mensual",
      metricas: [
        "motivos de pérdida",
        "monto perdido",
        "etapa de pérdida",
        "competencia",
        "falta de presupuesto",
      ],
      filtros: "Período, etapa, motivo de pérdida, responsable",
    }),
  ];

  const seguimientoReport = createSuggestedReport({
    id: "asistente-reporte-seguimiento-comercial",
    nombre: "Reporte de seguimiento comercial",
    tipo: "operativo",
    audiencia: "Supervisor comercial",
    frecuencia: "diaria",
    metricas: [
      "oportunidades sin próxima acción",
      "último contacto",
      "fecha de seguimiento vencida",
      "responsable",
    ],
    filtros: "Responsable, fecha de seguimiento, etapa, días sin actividad",
  });

  const propuestasReport = createSuggestedReport({
    id: "asistente-reporte-propuestas-diagnosticos",
    nombre: "Reporte de propuestas y diagnósticos",
    tipo: "gerencial",
    audiencia: "Gerente de ventas",
    frecuencia: "semanal",
    metricas: [
      "diagnósticos realizados",
      "propuestas enviadas",
      "propuestas pendientes",
      "tasa de aprobación",
    ],
    filtros: "Período, responsable, etapa, estado de propuesta",
  });

  const limpiezaReports = [
    createSuggestedReport({
      id: "asistente-reporte-cotizaciones-operativas",
      nombre: "Reporte de cotizaciones operativas",
      tipo: "gerencial",
      audiencia: "Operaciones",
      frecuencia: "semanal",
      metricas: [
        "visitas técnicas",
        "cotizaciones pendientes",
        "servicios cotizados",
        "frecuencia del servicio",
        "sedes relevadas",
      ],
      filtros: "Servicio, sede, estado de cotización, responsable",
    }),
    createSuggestedReport({
      id: "asistente-reporte-inicio-servicio",
      nombre: "Reporte de inicio de servicio",
      tipo: "operativo",
      audiencia: "Operaciones",
      frecuencia: "semanal",
      metricas: [
        "servicios ganados",
        "fecha de inicio",
        "personal requerido",
        "insumos",
        "pendientes operativos",
      ],
      filtros: "Cliente, fecha de inicio, sede, responsable operativo",
    }),
  ];

  const educacionReports = [
    createSuggestedReport({
      id: "asistente-reporte-interesados-inscripciones",
      nombre: "Reporte de interesados e inscripciones",
      tipo: "gerencial",
      audiencia: "Dirección",
      frecuencia: "semanal",
      metricas: [
        "interesados nuevos",
        "entrevistas realizadas",
        "propuestas educativas enviadas",
        "inscripciones confirmadas",
      ],
      filtros: "Programa, origen, etapa de admisión, asesor",
    }),
    createSuggestedReport({
      id: "asistente-reporte-seguimiento-admisiones",
      nombre: "Reporte de seguimiento de admisiones",
      tipo: "operativo",
      audiencia: "Supervisor comercial",
      frecuencia: "diaria",
      metricas: [
        "interesados sin seguimiento",
        "etapa de inscripción",
        "objeciones",
        "próxima acción",
      ],
      filtros: "Programa, asesor, etapa, fecha de próxima acción",
    }),
  ];

  const actividadIAReport = createSuggestedReport({
    id: "asistente-reporte-actividad-ia",
    nombre: "Reporte de actividad IA",
    tipo: "ia",
    audiencia: "Dirección",
    frecuencia: "semanal",
    metricas: [
      "sugerencias generadas",
      "sugerencias aceptadas",
      "sugerencias ignoradas",
      "alertas de riesgo detectadas",
    ],
    filtros: "Motor IA, etapa, responsable, período",
  });

  const alertasSugeridas =
    "Oportunidad sin próxima acción.\nOportunidad sin seguimiento por más de X días.\nPropuesta enviada sin respuesta.\nOportunidad marcada perdida sin motivo.\nOportunidad de alto valor sin revisión humana.";

  const distribucionSugerida =
    "Dirección recibe resumen ejecutivo semanal.\nComercial recibe pipeline semanal.\nOperaciones recibe ganados/implementación.\nAdministración recibe reportes de facturación/cobranza si aplica.";

  const generacionSugerida =
    "Reporte ejecutivo comercial semanal para dirección.\nReporte de pipeline semanal para equipo comercial.\nReporte de seguimiento diario para oportunidades sin próxima acción.\nReporte mensual de pérdidas para revisar motivos y monto perdido.";

  const reglasVacias =
    !reglas.generacionAutomatica.trim() &&
    !reglas.distribucion.trim() &&
    !reglas.formatoPreferido.trim() &&
    !reglas.alertasUmbral.trim();

  const localSuggestions: LocalSuggestion[] = [];

  if (reportes.length < 3) {
    localSuggestions.push({
      id: "reportes-base",
      targetField: "reportes",
      title: "Podés partir de reportes comerciales mínimos",
      description:
        "Reporte ejecutivo comercial, Reporte de pipeline y Reporte de pérdidas cubren dirección, equipo comercial y aprendizaje de cierres perdidos.",
      actionLabel: "Agregar reportes base",
      apply: () => addSuggestedReports(baseSuggestedReports),
    });
  }

  if (
    businessContext.necesitaReportesDireccion &&
    !hasReportNamed(reportes, ["ejecutivo comercial", "dashboard ejecutivo"])
  ) {
    localSuggestions.push({
      id: "reporte-direccion-contextual",
      targetField: "frecuencia",
      title: "Dirección parece necesitar un resumen semanal",
      description:
        "El Cuestionario menciona métricas comerciales o necesidades de dirección; conviene un reporte ejecutivo semanal.",
      actionLabel: "Agregar reporte ejecutivo",
      apply: () => addSuggestedReports([baseSuggestedReports[0]]),
    });
  }

  if (
    businessContext.necesitaSeguimiento &&
    !hasReportNamed(reportes, ["seguimiento comercial"])
  ) {
    localSuggestions.push({
      id: "reporte-seguimiento-contextual",
      targetField: "reportes",
      title: "El contexto sugiere un reporte de seguimiento",
      description:
        "Diagnóstico, Proceso/Pipeline o columnas mencionan seguimiento; este reporte ayuda a detectar oportunidades frías.",
      actionLabel: "Agregar reporte de seguimiento",
      apply: () => addSuggestedReports([seguimientoReport]),
    });
  }

  if (
    businessContext.ventaConsultiva &&
    !hasReportNamed(reportes, ["propuestas y diagnósticos", "propuestas y diagnosticos"])
  ) {
    localSuggestions.push({
      id: "reporte-propuestas-diagnosticos",
      targetField: "metricas",
      title: "La venta consultiva necesita medir diagnósticos y propuestas",
      description:
        "Diagnósticos realizados, propuestas enviadas, pendientes y tasa de aprobación ayudan a controlar el ciclo consultivo.",
      actionLabel: "Agregar reporte consultivo",
      apply: () => addSuggestedReports([propuestasReport]),
    });
  }

  if (
    businessContext.necesitaMedirPerdidas &&
    !hasReportNamed(reportes, ["pérdidas", "perdidas", "patrones de cierre perdido"])
  ) {
    localSuggestions.push({
      id: "reporte-perdidas-contextual",
      targetField: "metricas",
      title: "Conviene medir pérdidas con más estructura",
      description:
        "Motivos de pérdida, monto perdido, etapa y competencia permiten corregir el proceso comercial.",
      actionLabel: "Agregar reporte de pérdidas",
      apply: () => addSuggestedReports([baseSuggestedReports[2]]),
    });
  }

  if (
    businessContext.esLimpieza &&
    !hasReportNamed(reportes, ["cotizaciones operativas", "inicio de servicio"])
  ) {
    localSuggestions.push({
      id: "reportes-limpieza",
      targetField: "reportes",
      title: "El rubro limpieza puede necesitar reportes operativos",
      description:
        "Cotizaciones operativas e inicio de servicio ayudan a coordinar visitas técnicas, sedes, insumos y personal.",
      actionLabel: "Agregar reportes de limpieza",
      apply: () => addSuggestedReports(limpiezaReports),
    });
  }

  if (
    businessContext.esEducacion &&
    !hasReportNamed(reportes, ["interesados e inscripciones", "admisiones"])
  ) {
    localSuggestions.push({
      id: "reportes-educacion",
      targetField: "reportes",
      title: "El rubro educación puede necesitar reportes de admisiones",
      description:
        "Interesados, entrevistas, propuestas educativas, inscripciones y seguimientos ayudan a controlar el proceso educativo.",
      actionLabel: "Agregar reportes educativos",
      apply: () => addSuggestedReports(educacionReports),
    });
  }

  if (
    businessContext.tieneMotoresIA &&
    !hasReportNamed(reportes, ["actividad ia", "actividad de ia"])
  ) {
    localSuggestions.push({
      id: "reporte-actividad-ia",
      targetField: "reportes",
      title: "Podés medir la actividad de los motores IA",
      description:
        "Si ya hay motores IA configurados, conviene medir sugerencias generadas, aceptadas, ignoradas y alertas de riesgo.",
      actionLabel: "Agregar reporte de actividad IA",
      apply: () => addSuggestedReports([actividadIAReport]),
    });
  }

  if (reglasVacias || !reglas.generacionAutomatica.trim()) {
    localSuggestions.push({
      id: "reglas-generacion-reportes",
      targetField: "reglas",
      title: "Podés definir generación mínima de reportes",
      description:
        "Resumen ejecutivo semanal, pipeline semanal, seguimiento diario y pérdidas mensuales dan una cadencia inicial por rol.",
      actionLabel: "Aplicar reglas de generación",
      apply: () =>
        setRegla(
          "generacionAutomatica",
          appendTextIfMissing(reglas.generacionAutomatica, generacionSugerida)
        ),
    });
  }

  if (reglasVacias || !reglas.alertasUmbral.trim()) {
    localSuggestions.push({
      id: "alertas-reportes-vacias",
      targetField: "alertas",
      title: businessContext.necesitaTrazabilidad
        ? "El contexto sugiere alertas de trazabilidad"
        : "Podés definir alertas comerciales mínimas",
      description:
        "Próxima acción, seguimiento vencido, propuesta sin respuesta, pérdida sin motivo y alto valor sin revisión humana.",
      actionLabel: "Aplicar alertas sugeridas",
      apply: () =>
        setRegla(
          "alertasUmbral",
          appendTextIfMissing(reglas.alertasUmbral, alertasSugeridas)
        ),
    });
  }

  if (reglasVacias || !reglas.distribucion.trim()) {
    localSuggestions.push({
      id: "distribucion-reportes-vacia",
      targetField: "distribucion",
      title: "Podés definir distribución por audiencia",
      description:
        "Dirección, Comercial, Operaciones y Administración deberían recibir reportes distintos según su rol.",
      actionLabel: "Aplicar distribución sugerida",
      apply: () =>
        setRegla(
          "distribucion",
          appendTextIfMissing(reglas.distribucion, distribucionSugerida)
        ),
    });
  }

  if (
    businessContext.requiereValidacionHumana &&
    !reglas.alertasUmbral.toLowerCase().includes("revisión humana")
  ) {
    localSuggestions.push({
      id: "alerta-validacion-humana",
      targetField: "alertas",
      title: "El contexto sugiere alerta por revisión humana",
      description:
        "Si hay dependencia humana o motores de validación, las oportunidades de alto valor deberían requerir revisión antes de avanzar.",
      actionLabel: "Agregar alerta de revisión humana",
      apply: () =>
        setRegla(
          "alertasUmbral",
          appendTextIfMissing(
            reglas.alertasUmbral,
            "Oportunidad de alto valor sin revisión humana."
          )
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
          Sugerencias basadas en Empresa, Cuestionario, Diagnóstico, Proceso/Pipeline y Motores IA ya cargados.
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

  // Derivar matriz de audiencias
  const audienciasConReportes = AUDIENCIAS_OPCIONES.filter((a) =>
    reportes.some((r) => r.audiencia === a)
  );

  const totalActivos = reportes.filter((r) => r.activo).length;
  const totalPorTipo = {
    operativo: reportes.filter((r) => r.tipo === "operativo").length,
    gerencial: reportes.filter((r) => r.tipo === "gerencial").length,
    ia: reportes.filter((r) => r.tipo === "ia").length,
  };
  const step = CRM_SETUP_STEPS.find((s) => s.id === "reportes");
  const readiness = evaluateReportesReadiness({ reportes, reglas });

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
          <Link
            href="/admin/constructor/empresa"
            className="hover:text-slate-800 transition-colors"
          >
            Empresa
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/cuestionario"
            className="hover:text-slate-800 transition-colors"
          >
            Cuestionario
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/documentos"
            className="hover:text-slate-800 transition-colors"
          >
            Documentos
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/diagnostico"
            className="hover:text-slate-800 transition-colors"
          >
            Diagnóstico
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/proceso-pipeline"
            className="hover:text-slate-800 transition-colors"
          >
            Proceso y pipeline
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/motores-ia"
            className="hover:text-slate-800 transition-colors"
          >
            Motores IA
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Reportes</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso {step?.step ?? 7} de {CRM_SETUP_STEPS.length}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {step?.title ?? "Reportes"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {step?.description ??
                "Definí qué reportes necesita el CRM, quién los consume, con qué frecuencia se generan y qué reglas gobiernan su distribución."}
              {" "}Esta configuración no crea dashboards reales todavía.
            </p>
          </div>

          <StepReadinessPanel
            title="Estado de Reportes"
            readiness={readiness}
            overallProgress={getConstructorOverallProgress({
              currentStep: "reportes",
              currentStepPercent: readiness.completionPercent,
            })}
          />

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                {loading
                  ? "Cargando reportes guardados..."
                  : "Este paso guarda la configuración visual de reportes."}
              </span>{" "}
              No crea dashboards reales ni conecta datos reales de ventas/leads todavía.
            </p>
          </div>

          {/* ── A: Tipos de reportes ─────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Tipos de reportes en el CRM" />
            <p className="mb-4 text-xs text-slate-500">
              El sistema distingue tres categorías según el perfil de consumo y
              el origen de los datos.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes operativos
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Vendedores y supervisores. Se usan en el día a día para
                  gestionar leads, detectar SLA en riesgo y priorizar acciones.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: bandeja de leads, estado del pipeline, alertas de
                  inactividad.
                </p>
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
                    <LineChart className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes gerenciales
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-400">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Gerentes y dirección. Se usan para analizar performance del
                  equipo, tendencias de conversión y proyecciones de cierre.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: performance por vendedor, forecast mensual,
                  dashboard ejecutivo.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes IA
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Supervisores y gerentes de ventas. Sintetizan los outputs de
                  los motores IA: scores, patrones, alertas y recomendaciones.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: análisis de calificación IA, patrones de pérdida,
                  calidad de propuestas.
                </p>
              </div>

            </div>
          </div>

          {/* ── B: Diseñador de reportes ──────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de reportes sugeridos" />
            <p className="mb-4 text-xs text-slate-500">
              Editá cada reporte según las necesidades del equipo. Los cambios
              son locales — no se guardan todavía.
            </p>

            {/* Resumen rápido */}
            <div className="mb-5 flex flex-wrap gap-3">
              {[
                {
                  label: "Total reportes",
                  value: reportes.length,
                  color: "text-slate-700",
                },
                {
                  label: "Activos",
                  value: totalActivos,
                  color: "text-green-700",
                },
                {
                  label: "Operativos",
                  value: totalPorTipo.operativo,
                  color: "text-blue-700",
                },
                {
                  label: "Gerenciales",
                  value: totalPorTipo.gerencial,
                  color: "text-purple-700",
                },
                {
                  label: "IA",
                  value: totalPorTipo.ia,
                  color: "text-emerald-700",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-violet-700">
                  Prototipo: usa endpoint mock, no OpenAI.
                </p>
                <button
                  type="button"
                  onClick={requestMockAISuggestionForReportes}
                  disabled={mockAIReportesLoading}
                  className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mockAIReportesLoading
                    ? "Consultando IA mock..."
                    : "Consultar IA mock"}
                </button>
              </div>

              {mockAIReportesError && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                  {mockAIReportesError}
                </p>
              )}

              {mockAIReportesSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mockAIReportesSuggestions.map((suggestion) => (
                    <MockAISuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={applyMockAIReportesSuggestion}
                      showApply={Array.isArray(suggestion.suggestedValue)}
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

              {!mockAIReportesLoading &&
                !mockAIReportesError &&
                mockAIReportesRequested &&
                mockAIReportesSuggestions.length === 0 && (
                  <p className="mt-2 rounded-md border border-violet-100 bg-white px-2 py-1 text-[11px] font-medium text-violet-700">
                    No se recibieron sugerencias IA mock para este caso.
                  </p>
                )}
            </div>

            <div className="space-y-3">
              {reportes.map((reporte, index) => (
                <div
                  key={reporte.id}
                  className={[
                    "overflow-hidden rounded-xl border bg-white transition-all",
                    reporte.activo
                      ? "border-slate-200"
                      : "border-slate-200 opacity-60",
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
                      value={reporte.nombre}
                      onChange={(e) =>
                        setReporte(reporte.id, "nombre", e.target.value)
                      }
                      placeholder="Nombre del reporte…"
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                      <button
                        type="button"
                        onClick={() =>
                          setReporte(reporte.id, "activo", !reporte.activo)
                        }
                      >
                        {reporte.activo ? (
                          <Zap className="h-4 w-4 text-green-600" />
                        ) : (
                          <ZapOff className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      {reporte.activo ? "Activo" : "Inactivo"}
                    </label>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">

                    <div>
                      <label className={LABEL_CLASS}>Tipo</label>
                      <PillSelect
                        options={[
                          { value: "operativo" as TipoReporte, label: "Operativo" },
                          { value: "gerencial" as TipoReporte, label: "Gerencial" },
                          { value: "ia" as TipoReporte, label: "IA" },
                        ]}
                        value={reporte.tipo}
                        onChange={(v) => setReporte(reporte.id, "tipo", v)}
                        styleMap={TIPO_STYLES}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Audiencia</label>
                      <select
                        className={SELECT_CLASS}
                        value={reporte.audiencia}
                        onChange={(e) =>
                          setReporte(reporte.id, "audiencia", e.target.value)
                        }
                      >
                        <option value="">Sin audiencia…</option>
                        {AUDIENCIAS_OPCIONES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Frecuencia</label>
                      <PillSelect
                        options={FRECUENCIAS}
                        value={reporte.frecuencia}
                        onChange={(v) =>
                          setReporte(reporte.id, "frecuencia", v)
                        }
                        styleMap={FRECUENCIA_STYLES}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Métricas</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={reporte.metricas}
                        onChange={(e) =>
                          setReporte(reporte.id, "metricas", e.target.value)
                        }
                        placeholder="¿Qué datos muestra este reporte?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Filtros</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={reporte.filtros}
                        onChange={(e) =>
                          setReporte(reporte.id, "filtros", e.target.value)
                        }
                        placeholder="¿Por qué dimensiones se puede filtrar?"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {reportes.length} reportes definidos — se guardan como configuración del Constructor, sin generación real.
            </p>
            {renderFieldSuggestions("reportes")}
            {renderFieldSuggestions("metricas")}
            {renderFieldSuggestions("frecuencia")}
          </div>

          {/* ── C: Matriz por audiencia ───────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="C"
              title="Matriz de reportes por audiencia"
            />
            <p className="mb-4 text-xs text-slate-500">
              Vista derivada del estado local. Muestra qué reportes consume cada
              rol y con qué frecuencia.
            </p>
            <div className="space-y-3">
              {audienciasConReportes.map((audiencia) => {
                const reportesDe = reportes.filter(
                  (r) => r.audiencia === audiencia
                );
                return (
                  <div
                    key={audiencia}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">
                        {audiencia}
                      </p>
                      <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                        {reportesDe.length} reporte
                        {reportesDe.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {reportesDe.map((r) => (
                        <div
                          key={r.id}
                          className={[
                            "flex items-start gap-2 rounded-lg border px-3 py-2",
                            r.activo
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-100 bg-slate-50 opacity-50",
                          ].join(" ")}
                        >
                          <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-800">
                              {r.nombre}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${TIPO_STYLES[r.tipo]}`}
                              >
                                {TIPO_LABELS[r.tipo]}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${FRECUENCIA_STYLES[r.frecuencia]}`}
                              >
                                {
                                  FRECUENCIAS.find(
                                    (f) => f.value === r.frecuencia
                                  )?.label
                                }
                              </span>
                              {!r.activo && (
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

          {/* ── D: Reglas de generación y distribución ────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="D"
              title="Reglas de generación y distribución"
            />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que gobiernan cuándo se generan los
              reportes, cómo se distribuyen y qué umbrales disparan alertas.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué reportes se generan automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.generacionAutomatica}
                  onChange={(e) =>
                    setRegla("generacionAutomatica", e.target.value)
                  }
                  placeholder="Ej: La bandeja de leads se actualiza en tiempo real. El dashboard ejecutivo se genera cada lunes…"
                />
                {renderFieldSuggestions("reglas")}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Cómo se distribuyen los reportes?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.distribucion}
                  onChange={(e) => setRegla("distribucion", e.target.value)}
                  placeholder="Ej: Los reportes gerenciales se envían por email. Los operativos están disponibles en el panel del vendedor…"
                />
                {renderFieldSuggestions("distribucion")}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué formato prefiere cada audiencia?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.formatoPreferido}
                  onChange={(e) =>
                    setRegla("formatoPreferido", e.target.value)
                  }
                  placeholder="Ej: Dirección prefiere PDF ejecutivo. Vendedores prefieren vista en pantalla. Supervisores prefieren tabla exportable…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué umbrales disparan alertas automáticas?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.alertasUmbral}
                  onChange={(e) => setRegla("alertasUmbral", e.target.value)}
                  placeholder="Ej: Alerta si un lead lleva más de 5 días sin actividad. Alerta si la tasa de conversión baja del 20%…"
                />
                {renderFieldSuggestions("alertas")}
              </div>
            </div>
          </div>

          {/* ── E: Preview JSON ───────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="E"
              title="Preview del futuro JSON de configuración"
            />
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">
                  Solo estructura — refleja el estado local.
                </span>{" "}
                Este panel muestra el objeto de configuración que el sistema
                persistirá cuando se conecte Supabase. Se actualiza en tiempo
                real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  reportes.json — preview local
                </span>
              </div>
              <pre className="max-h-[420px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      reportes: reportes.map((r) => ({
                        id: r.id,
                        nombre: r.nombre || "⏳ pendiente",
                        tipo: r.tipo,
                        audiencia: r.audiencia || "⏳ sin audiencia",
                        metricas: r.metricas || "⏳ pendiente",
                        filtros: r.filtros || "⏳ pendiente",
                        frecuencia: r.frecuencia,
                        activo: r.activo,
                      })),
                      reglasReportes: {
                        generacionAutomatica:
                          reglas.generacionAutomatica || "⏳ pendiente",
                        distribucion: reglas.distribucion || "⏳ pendiente",
                        formatoPreferido:
                          reglas.formatoPreferido || "⏳ pendiente",
                        alertasUmbral: reglas.alertasUmbral || "⏳ pendiente",
                      },
                      meta: {
                        totalReportes: reportes.length,
                        reportesActivos: totalActivos,
                        porTipo: totalPorTipo,
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
                  Cargando reportes guardados...
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

          {/* ── F: Navegación ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/motores-ia"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Motores IA
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
                {saving ? "Guardando..." : "Guardar reportes"}
              </button>
              <Link
                href="/admin/constructor/auditoria"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Continuar a Auditoría final
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
