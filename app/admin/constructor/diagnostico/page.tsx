"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  AlertTriangle,
  TrendingUp,
  Eye,
  Users,
  Database,
  GitBranch,
  Bot,
  CheckSquare,
  Square,
  Code2,
} from "lucide-react";
import { MockAISuggestionCard } from "@/components/constructor/MockAISuggestionCard";
import { FieldQualityHint } from "@/components/constructor/FieldQualityHint";
import { StepReadinessPanel } from "@/components/constructor/StepReadinessPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import type { ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";
import { useConstructorMockAI } from "@/lib/constructor-ai/useConstructorMockAI";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";
import type {
  BaseReadiness,
  FieldQualityHintValue,
  QualityStatus,
} from "@/lib/constructor/readiness/types";
import {
  READINESS_SUMMARY_LABEL,
  STATUS_VALUE,
} from "@/lib/constructor/readiness/statusStyles";
import {
  countSelectedValues,
  hasText,
  textLength,
} from "@/lib/constructor/readiness/helpers";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ModeloComercial =
  | "simple"
  | "consultiva"
  | "tecnica"
  | "licitacion"
  | "recurrente"
  | "proyecto"
  | "mixta"
  | "";

type Complejidad = "baja" | "media" | "alta" | "";
type Madurez = "inicial" | "en-desarrollo" | "estructurada" | "avanzada" | "";
type DependenciaHumana = "bajo" | "medio" | "alto" | "";
type EstadoMatriz = "pendiente" | "parcial" | "solido" | "riesgo" | "";

type BloqueMatriz = {
  estado: EstadoMatriz;
  nota: string;
};

type DiagnosticoForm = {
  modeloComercial: ModeloComercial;
  complejidad: Complejidad;
  madurez: Madurez;
  dependenciaHumana: DependenciaHumana;
  comoVende: string;
  oportunidades: string;
  riesgos: string;
  puntosCiegos: string;
  matrizProceso: BloqueMatriz;
  matrizDatos: BloqueMatriz;
  matrizEquipo: BloqueMatriz;
  matrizAutomatizacion: BloqueMatriz;
  recomendaciones: string[];
  preguntas: string[];
};

type LocalSuggestion = {
  id: string;
  targetField:
    | "modeloComercial"
    | "complejidad"
    | "madurez"
    | "dependenciaHumana"
    | "comoVende"
    | "riesgos"
    | "oportunidades"
    | "puntosCiegos"
    | "recomendaciones"
    | "preguntas"
    | "general";
  title: string;
  description: string;
  actionLabel?: string;
  apply?: () => void;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

// Flag local para mostrar/ocultar el botón mock dentro de la UI principal.
// Se mantiene en false para que la pantalla quede con dos caminos claros
// (sugerencia rápida + IA sandbox). Cambiar a true sólo para debug interno.
const SHOW_MOCK_DIAGNOSTICO_BUTTON = false;

const MODELOS_COMERCIALES: { value: ModeloComercial; label: string }[] = [
  { value: "simple", label: "Venta simple" },
  { value: "consultiva", label: "Venta consultiva" },
  { value: "tecnica", label: "Venta técnica" },
  { value: "licitacion", label: "Venta por licitación" },
  { value: "recurrente", label: "Venta recurrente" },
  { value: "proyecto", label: "Venta por proyecto" },
  { value: "mixta", label: "Venta mixta" },
];

const ESTADOS_MATRIZ: { value: EstadoMatriz; label: string; className: string }[] = [
  { value: "pendiente", label: "Pendiente", className: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "parcial", label: "Parcial", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "solido", label: "Sólido", className: "border-green-200 bg-green-50 text-green-700" },
  { value: "riesgo", label: "Riesgo", className: "border-red-200 bg-red-50 text-red-700" },
];

const RECOMENDACIONES_SUGERIDAS = [
  "Definir etapas comerciales antes de cargar leads",
  "Definir criterios de avance",
  "Asignar responsables por etapa",
  "Medir motivos de pérdida",
  "Crear reportes por rol",
  "Definir validaciones humanas para IA",
  "Separar proceso profundo de Kanban visual",
  "Definir condiciones de avance por etapa",
  "Identificar tareas que requieren validación humana",
  "Definir documentos obligatorios por etapa",
  "Definir reportes mínimos para dirección",
  "Definir motores IA por etapa",
  "Crear auditoría final antes de activar CRM",
];

const PREGUNTAS_SUGERIDAS = [
  "¿Quién aprueba una propuesta antes de enviarla?",
  "¿Qué información mínima debe tener un lead para avanzar?",
  "¿Qué documentos son obligatorios antes de cotizar?",
  "¿Cuándo una oportunidad se considera perdida?",
  "¿Qué reportes necesita dirección cada semana?",
  "¿Qué tareas nunca debería decidir la IA sola?",
];

const MODELOS_COMERCIALES_SUGERIDOS =
  "Modelos típicos: venta consultiva, venta transaccional, venta recurrente, venta por proyecto, venta institucional o venta B2B.";

const COMPLEJIDAD_SUGERIDA =
  "La complejidad debería evaluarse según decisores, duración del ciclo, personalización requerida, ticket promedio y documentación necesaria.";

const MADUREZ_SUGERIDA =
  "En ordenamiento: existen oportunidades y proceso comercial, pero falta estandarizar seguimiento, métricas y criterios de avance.";

const DEPENDENCIA_HUMANA_SUGERIDA =
  "Alta: el proceso depende de seguimiento manual, criterio comercial y validación humana en etapas clave.";

const COMO_VENDE_SUGERIDO =
  "La empresa recibe oportunidades, califica necesidad, realiza diagnóstico o reunión, prepara propuesta, hace seguimiento y cierra con validación humana.";

const RIESGOS_SUGERIDOS =
  "Falta de seguimiento sistemático.\nBaja trazabilidad del pipeline.\nDependencia de personas clave.\nPérdida de información comercial.\nCriterios de calificación poco claros.";

const OPORTUNIDADES_SUGERIDAS =
  "Automatizar seguimiento.\nMejorar calificación de oportunidades.\nOrdenar pipeline.\nGenerar reportes comerciales.\nUsar IA para próximos pasos.";

const PUNTOS_CIEGOS_SUGERIDOS =
  "Motivos de pérdida no medidos.\nOrigen real de leads poco claro.\nCliente ideal no suficientemente segmentado.\nOportunidades frías sin alerta.\nFalta de criterios para priorizar.";

const RECOMENDACIONES_LOCAL_SUGERIDAS = [
  "Definir etapas comerciales antes de cargar leads",
  "Definir criterios de avance",
  "Asignar responsables por etapa",
  "Medir motivos de pérdida",
  "Crear reportes por rol",
  "Definir validaciones humanas para IA",
];

const PREGUNTAS_ABIERTAS_LOCAL_SUGERIDAS = [
  "¿Quién toma la decisión final?",
  "¿Qué datos se necesitan antes de cotizar?",
  "¿Qué oportunidades se pierden por falta de seguimiento?",
  "¿Qué reportes necesita dirección?",
  "¿Qué decisiones no debería tomar la IA sola?",
];

const INITIAL_FORM: DiagnosticoForm = {
  modeloComercial: "",
  complejidad: "",
  madurez: "",
  dependenciaHumana: "",
  comoVende: "",
  oportunidades: "",
  riesgos: "",
  puntosCiegos: "",
  matrizProceso: { estado: "", nota: "" },
  matrizDatos: { estado: "", nota: "" },
  matrizEquipo: { estado: "", nota: "" },
  matrizAutomatizacion: { estado: "", nota: "" },
  recomendaciones: [],
  preguntas: [...PREGUNTAS_SUGERIDAS],
};

const MODELO_VALUES = new Set<ModeloComercial>(
  MODELOS_COMERCIALES.map((modelo) => modelo.value)
);
const COMPLEJIDAD_VALUES = new Set<Complejidad>(["baja", "media", "alta"]);
const MADUREZ_VALUES = new Set<Madurez>([
  "inicial",
  "en-desarrollo",
  "estructurada",
  "avanzada",
]);
const DEPENDENCIA_VALUES = new Set<DependenciaHumana>(["bajo", "medio", "alto"]);
const ESTADO_MATRIZ_VALUES = new Set<EstadoMatriz>(
  ESTADOS_MATRIZ.map((estado) => estado.value)
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asModeloComercial(value: unknown): ModeloComercial {
  return typeof value === "string" && MODELO_VALUES.has(value as ModeloComercial)
    ? (value as ModeloComercial)
    : "";
}

function asComplejidad(value: unknown): Complejidad {
  return typeof value === "string" && COMPLEJIDAD_VALUES.has(value as Complejidad)
    ? (value as Complejidad)
    : "";
}

function asMadurez(value: unknown): Madurez {
  return typeof value === "string" && MADUREZ_VALUES.has(value as Madurez)
    ? (value as Madurez)
    : "";
}

function asDependenciaHumana(value: unknown): DependenciaHumana {
  return typeof value === "string" &&
    DEPENDENCIA_VALUES.has(value as DependenciaHumana)
    ? (value as DependenciaHumana)
    : "";
}

function normalizeBloqueMatriz(value: unknown): BloqueMatriz {
  if (!isRecord(value)) return { estado: "", nota: "" };
  return {
    estado:
      typeof value.estado === "string" &&
      ESTADO_MATRIZ_VALUES.has(value.estado as EstadoMatriz)
        ? (value.estado as EstadoMatriz)
        : "",
    nota: asString(value.nota),
  };
}

function normalizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : fallback;
}

function mergeUnique(current: string[], additions: string[]) {
  return Array.from(new Set([...(Array.isArray(current) ? current : []), ...additions]));
}

function appendTextIfMissing(current: string, addition: string) {
  if (!current.trim()) return addition;
  if (current.includes(addition)) return current;
  return `${current}\n\n${addition}`;
}

function mergeTextLines(current: string, additions: string[]) {
  const currentLines = current
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set(currentLines.map((line) => line.toLowerCase()));
  const nextLines = additions.filter((addition) => {
    const normalized = addition.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  return [...currentLines, ...nextLines].join("\n");
}

function countNewRiesgosLines(current: string, additions: string[]): number {
  const currentLines = current
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set(currentLines.map((line) => line.toLowerCase()));
  let count = 0;
  for (const addition of additions) {
    const normalized = addition.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    count += 1;
  }
  return count;
}

type DiagnosticoReadiness = BaseReadiness;

function evaluateDiagnosticoReadiness(
  form: DiagnosticoForm
): DiagnosticoReadiness {
  // A. Resumen esperado
  const resumenSelected = [
    form.modeloComercial,
    form.complejidad,
    form.madurez,
    form.dependenciaHumana,
  ].filter((value) => hasText(value)).length;
  let resumenStatus: QualityStatus;
  let resumenDetail: string;
  if (hasText(form.modeloComercial) && resumenSelected >= 3) {
    resumenStatus = "good";
    resumenDetail = "Modelo, complejidad y madurez ya definidos.";
  } else if (resumenSelected >= 1) {
    resumenStatus = "warning";
    resumenDetail = hasText(form.modeloComercial)
      ? "Sumá complejidad, madurez o dependencia humana."
      : "Falta el modelo comercial principal.";
  } else {
    resumenStatus = "danger";
    resumenDetail = "Resumen del diagnóstico sin definir.";
  }

  // B. Hallazgos principales
  const comoVendeLen = textLength(form.comoVende);
  const oportunidadesLen = textLength(form.oportunidades);
  const riesgosLen = textLength(form.riesgos);
  const puntosCiegosLen = textLength(form.puntosCiegos);
  const hallazgosRelevantes = [
    comoVendeLen >= 30,
    oportunidadesLen >= 30,
    riesgosLen >= 30,
    puntosCiegosLen >= 30,
  ].filter(Boolean).length;
  let hallazgosStatus: QualityStatus;
  let hallazgosDetail: string;
  if (!hasText(form.riesgos)) {
    hallazgosStatus = "danger";
    hallazgosDetail = "Riesgos comerciales sin completar.";
  } else if (hallazgosRelevantes >= 3) {
    hallazgosStatus = "good";
    hallazgosDetail = "Hallazgos sólidos para diseñar el CRM.";
  } else if (hallazgosRelevantes >= 1) {
    hallazgosStatus = "warning";
    hallazgosDetail = "Sumá detalle en proceso, oportunidades o puntos ciegos.";
  } else {
    hallazgosStatus = "danger";
    hallazgosDetail = "Hallazgos vacíos: sin contexto para diagnóstico.";
  }

  // C. Matriz de diagnóstico
  const matrizBloquesEval = [
    form.matrizProceso,
    form.matrizDatos,
    form.matrizEquipo,
    form.matrizAutomatizacion,
  ];
  const matrizEvaluados = matrizBloquesEval.filter((bloque) => {
    const estadoUtil = bloque.estado !== "" && bloque.estado !== "pendiente";
    const notaUtil = textLength(bloque.nota) >= 10;
    return estadoUtil || notaUtil;
  }).length;
  let matrizStatus: QualityStatus;
  let matrizDetail: string;
  if (matrizEvaluados >= 3) {
    matrizStatus = "good";
    matrizDetail = "Matriz evaluada en la mayoría de las dimensiones.";
  } else if (matrizEvaluados >= 1) {
    matrizStatus = "warning";
    matrizDetail = "Faltan dimensiones por evaluar.";
  } else {
    matrizStatus = "danger";
    matrizDetail = "Matriz sin evaluar todavía.";
  }

  // D. Recomendaciones
  const recCount = countSelectedValues(form.recomendaciones);
  const preguntasFilled = form.preguntas.filter(
    (pregunta) => textLength(pregunta) >= 5
  ).length;
  let recomendacionesStatus: QualityStatus;
  let recomendacionesDetail: string;
  if (recCount >= 4) {
    recomendacionesStatus = "good";
    recomendacionesDetail = "Recomendaciones base seleccionadas.";
  } else if (recCount >= 1) {
    recomendacionesStatus = "warning";
    recomendacionesDetail =
      preguntasFilled >= 3
        ? "Pocas recomendaciones marcadas (preguntas abiertas ya cubiertas)."
        : "Pocas recomendaciones marcadas todavía.";
  } else {
    recomendacionesStatus = "warning";
    recomendacionesDetail = "Sin recomendaciones marcadas todavía.";
  }

  // Porcentaje ponderado
  const completionPercent = Math.round(
    20 * STATUS_VALUE[resumenStatus] +
      40 * STATUS_VALUE[hallazgosStatus] +
      25 * STATUS_VALUE[matrizStatus] +
      15 * STATUS_VALUE[recomendacionesStatus]
  );

  // Estado general
  const hasDanger = [
    resumenStatus,
    hallazgosStatus,
    matrizStatus,
    recomendacionesStatus,
  ].some((status) => status === "danger");
  let overallStatus: QualityStatus;
  if (completionPercent >= 80 && !hasDanger) {
    overallStatus = "good";
  } else if (completionPercent >= 55) {
    overallStatus = "warning";
  } else {
    overallStatus = "danger";
  }

  // Próxima acción priorizada
  let nextAction = "Podés guardar y continuar a Proceso/Pipeline.";
  if (!hasText(form.riesgos)) {
    nextAction = "Completá Riesgos comerciales o consultá IA sandbox.";
  } else if (!hasText(form.oportunidades)) {
    nextAction =
      "Completá Oportunidades detectadas para orientar el diseño del CRM.";
  } else if (!hasText(form.comoVende)) {
    nextAction = "Describí cómo vende hoy la empresa.";
  } else if (matrizStatus !== "good") {
    nextAction = "Evaluá la matriz de diagnóstico antes de avanzar.";
  } else if (recCount === 0) {
    nextAction =
      "Seleccioná recomendaciones preliminares para guiar el siguiente paso.";
  }

  // Hints por campo
  const fieldHints: Record<string, FieldQualityHintValue> = {};

  if (!hasText(form.modeloComercial)) {
    fieldHints.modeloComercial = {
      status: "danger",
      text: "Definí el modelo comercial principal.",
    };
  }
  if (!hasText(form.complejidad)) {
    fieldHints.complejidad = {
      status: "warning",
      text: "Marcá el nivel de complejidad para calibrar el CRM.",
    };
  }
  if (!hasText(form.madurez)) {
    fieldHints.madurez = {
      status: "warning",
      text: "Marcá la madurez comercial actual para priorizar acciones.",
    };
  }
  if (!hasText(form.dependenciaHumana)) {
    fieldHints.dependenciaHumana = {
      status: "warning",
      text: "Marcá cuánto depende el proceso del criterio humano.",
    };
  }

  if (!hasText(form.comoVende)) {
    fieldHints.comoVende = {
      status: "warning",
      text: "Describir el proceso actual mejora la calidad del diagnóstico.",
    };
  } else if (comoVendeLen < 30) {
    fieldHints.comoVende = {
      status: "warning",
      text: "Sumá detalle: cómo se origina, califica, propone y cierra.",
    };
  }
  if (!hasText(form.oportunidades)) {
    fieldHints.oportunidades = {
      status: "warning",
      text: "Ayuda a definir qué módulos y automatizaciones conviene priorizar.",
    };
  } else if (oportunidadesLen < 30) {
    fieldHints.oportunidades = {
      status: "warning",
      text: "Sumá oportunidades específicas para que el CRM las cubra.",
    };
  }
  if (!hasText(form.riesgos)) {
    fieldHints.riesgos = {
      status: "danger",
      text: "Campo clave: agregá riesgos o usá IA sandbox.",
    };
  } else if (riesgosLen < 30) {
    fieldHints.riesgos = {
      status: "warning",
      text: "Sumá más detalle de riesgos para alimentar la IA.",
    };
  }
  if (!hasText(form.puntosCiegos)) {
    fieldHints.puntosCiegos = {
      status: "warning",
      text: "Registrá información faltante para evitar supuestos.",
    };
  }

  // Matriz: hint por dimensión sin evaluar
  const matrizFieldKeys: Array<keyof DiagnosticoForm> = [
    "matrizProceso",
    "matrizDatos",
    "matrizEquipo",
    "matrizAutomatizacion",
  ];
  for (const key of matrizFieldKeys) {
    const bloque = form[key] as BloqueMatriz;
    const estadoVacio = bloque.estado === "" || bloque.estado === "pendiente";
    if (estadoVacio) {
      fieldHints[key as string] = {
        status: "warning",
        text: "Marcá el estado de esta dimensión para medir readiness.",
      };
    }
  }

  // Recomendaciones
  if (recCount === 0) {
    fieldHints.recomendaciones = {
      status: "warning",
      text: "Seleccioná al menos algunas acciones preliminares.",
    };
  } else if (recCount < 4) {
    fieldHints.recomendaciones = {
      status: "warning",
      text: "Marcá más recomendaciones para tener un plan más completo.",
    };
  }

  return {
    completionPercent,
    overallStatus,
    overallLabel: READINESS_SUMMARY_LABEL[overallStatus],
    nextAction,
    sections: [
      {
        key: "resumen",
        label: "Resumen esperado",
        status: resumenStatus,
        detail: resumenDetail,
      },
      {
        key: "hallazgos",
        label: "Hallazgos principales",
        status: hallazgosStatus,
        detail: hallazgosDetail,
      },
      {
        key: "matriz",
        label: "Matriz de diagnóstico",
        status: matrizStatus,
        detail: matrizDetail,
      },
      {
        key: "recomendaciones",
        label: "Recomendaciones",
        status: recomendacionesStatus,
        detail: recomendacionesDetail,
      },
    ],
    fieldHints,
  };
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const LABEL_CLASS = "block text-xs font-semibold text-slate-600 mb-1";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

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

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? ("" as T) : opt.value)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            value === opt.value
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
  const [form, setForm] = useState<DiagnosticoForm>(INITIAL_FORM);
  const [constructorContext, setConstructorContext] = useState<
    Record<string, unknown>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [aiApplyMessage, setAIApplyMessage] = useState<string | null>(null);
  const [sandboxAIWarning, setSandboxAIWarning] = useState<string | null>(null);
  const {
    suggestions: mockAIRiesgosSuggestions,
    loading: mockAIRiesgosLoading,
    error: mockAIRiesgosError,
    request: requestMockAIRiesgos,
    clear: clearMockAIRiesgos,
  } = useConstructorMockAI();
  const {
    suggestions: sandboxAIRiesgosSuggestions,
    loading: sandboxAIRiesgosLoading,
    error: sandboxAIRiesgosError,
    request: requestSandboxAIRiesgos,
    clear: clearSandboxAIRiesgos,
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
          data?: Record<string, unknown> | null;
          error?: string | null;
        } | null;

        if (res.redirected || !json) {
          if (!cancelled) {
            setSaveError("No se pudo cargar la configuración guardada.");
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setSaveError(json?.error ?? "No se pudo cargar la configuración guardada.");
          }
          return;
        }

        const diagnostico = json?.data?.diagnostico;
        if (!cancelled) {
          setConstructorContext({
            empresa: isRecord(json?.data?.empresa) ? json?.data?.empresa : {},
            cuestionario: isRecord(json?.data?.cuestionario)
              ? json?.data?.cuestionario
              : {},
            diagnostico: isRecord(diagnostico) ? diagnostico : {},
          });
        }

        if (
          diagnostico &&
          typeof diagnostico === "object" &&
          !Array.isArray(diagnostico) &&
          Object.keys(diagnostico).length > 0
        ) {
          if (!cancelled) {
            const loaded = diagnostico as Partial<DiagnosticoForm>;
            const loadedRecord = diagnostico as Record<string, unknown>;

            setForm({
              ...INITIAL_FORM,
              modeloComercial: asModeloComercial(loaded.modeloComercial),
              complejidad: asComplejidad(loaded.complejidad),
              madurez: asMadurez(loaded.madurez),
              dependenciaHumana: asDependenciaHumana(loaded.dependenciaHumana),
              comoVende: asString(loaded.comoVende),
              oportunidades: asString(loaded.oportunidades),
              riesgos: asString(loaded.riesgos),
              puntosCiegos: asString(loaded.puntosCiegos),
              matrizProceso: normalizeBloqueMatriz(loadedRecord.matrizProceso),
              matrizDatos: normalizeBloqueMatriz(loadedRecord.matrizDatos),
              matrizEquipo: normalizeBloqueMatriz(loadedRecord.matrizEquipo),
              matrizAutomatizacion: normalizeBloqueMatriz(
                loadedRecord.matrizAutomatizacion
              ),
              recomendaciones: normalizeStringArray(
                loaded.recomendaciones,
                INITIAL_FORM.recomendaciones
              ),
              preguntas: normalizeStringArray(
                loaded.preguntas,
                INITIAL_FORM.preguntas
              ),
            });
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar el diagnóstico y guardar nuevamente."
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

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          step: "diagnostico",
          mark_completed: true,
          data: form,
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
        setSaveMessage("Diagnóstico guardado correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof DiagnosticoForm>(
    key: K,
    value: DiagnosticoForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMatriz(
    key: "matrizProceso" | "matrizDatos" | "matrizEquipo" | "matrizAutomatizacion",
    patch: Partial<BloqueMatriz>
  ) {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function requestMockAISuggestionForRiesgos() {
    setAIApplyMessage(null);
    setSandboxAIWarning(null);
    clearSandboxAIRiesgos();
    await requestMockAIRiesgos({
      mode: "field_suggestion",
      step: "diagnostico",
      field: "riesgos",
      value: form.riesgos,
      currentForm: form,
      constructorContext,
    });
  }

  async function requestSandboxAISuggestionForRiesgos() {
    setAIApplyMessage(null);
    setSandboxAIWarning(null);
    clearMockAIRiesgos();
    const sandboxMetadata = {
      source: "constructor",
      locale: "es-UY",
      prototypeMode: true,
      provider: "openai_sandbox",
    };

    const result = await requestSandboxAIRiesgos({
      mode: "field_suggestion",
      step: "diagnostico",
      field: "riesgos",
      value: form.riesgos,
      currentForm: form,
      constructorContext,
      metadata: sandboxMetadata,
    });

    if (result.length === 0) {
      setSandboxAIWarning(
        "IA sandbox no devolvió sugerencias. Verificá OPENAI_API_KEY o usá el asistente mock/local."
      );
    }
  }

  function applyMockAIRiesgosSuggestion(
    suggestion: ConstructorMockAISuggestion
  ) {
    if (!Array.isArray(suggestion.suggestedValue)) return;

    const suggestedRiesgos = suggestion.suggestedValue.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );

    if (suggestedRiesgos.length === 0) return;

    const newCount = countNewRiesgosLines(form.riesgos, suggestedRiesgos);

    if (newCount > 0) {
      setForm((prev) => ({
        ...prev,
        riesgos: mergeTextLines(prev.riesgos, suggestedRiesgos),
      }));
      setAIApplyMessage("Sugerencia IA aplicada correctamente.");
    } else {
      setAIApplyMessage("Esta sugerencia IA ya estaba aplicada.");
    }
  }

  function toggleRecomendacion(rec: string) {
    setForm((prev) => ({
      ...prev,
      recomendaciones: prev.recomendaciones.includes(rec)
        ? prev.recomendaciones.filter((r) => r !== rec)
        : [...prev.recomendaciones, rec],
    }));
  }

  function setPregunta(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.preguntas];
      next[index] = value;
      return { ...prev, preguntas: next };
    });
  }

  const localSuggestions: LocalSuggestion[] = [];

  if (!form.modeloComercial) {
    localSuggestions.push({
      id: "modelo-comercial-vacio",
      targetField: "modeloComercial",
      title: "Podés partir de un modelo comercial típico",
      description: MODELOS_COMERCIALES_SUGERIDOS,
      actionLabel: "Aplicar venta consultiva",
      apply: () => setField("modeloComercial", "consultiva"),
    });
  }

  if (!form.complejidad) {
    localSuggestions.push({
      id: "complejidad-vacia",
      targetField: "complejidad",
      title: "Criterios para evaluar complejidad comercial",
      description: COMPLEJIDAD_SUGERIDA,
    });
  }

  if (!form.madurez) {
    localSuggestions.push({
      id: "madurez-vacia",
      targetField: "madurez",
      title: "Podés iniciar con una madurez en desarrollo",
      description: MADUREZ_SUGERIDA,
      actionLabel: "Aplicar en desarrollo",
      apply: () => setField("madurez", "en-desarrollo"),
    });
  }

  if (!form.dependenciaHumana) {
    localSuggestions.push({
      id: "dependencia-humana-vacia",
      targetField: "dependenciaHumana",
      title: "Podés marcar una dependencia humana alta",
      description: DEPENDENCIA_HUMANA_SUGERIDA,
      actionLabel: "Aplicar alta dependencia",
      apply: () => setField("dependenciaHumana", "alto"),
    });
  }

  if (form.comoVende.trim().length > 0 && form.comoVende.trim().length < 80) {
    localSuggestions.push({
      id: "como-vende-corto",
      targetField: "comoVende",
      title: "La descripción de venta puede quedar más clara",
      description: COMO_VENDE_SUGERIDO,
      actionLabel: "Aplicar sugerencia",
      apply: () => setField("comoVende", COMO_VENDE_SUGERIDO),
    });
  }

  if (!form.riesgos.trim()) {
    localSuggestions.push({
      id: "riesgos-vacios",
      targetField: "riesgos",
      title: "Sugerencia rápida",
      description:
        "Aplicá una base general de riesgos comerciales si todavía no querés usar IA.",
      actionLabel: "Aplicar riesgos típicos",
      apply: () => setField("riesgos", appendTextIfMissing(form.riesgos, RIESGOS_SUGERIDOS)),
    });
  }

  if (!form.oportunidades.trim()) {
    localSuggestions.push({
      id: "oportunidades-vacias",
      targetField: "oportunidades",
      title: "Podés registrar oportunidades de mejora",
      description:
        "Automatizar seguimiento, mejorar calificación, ordenar pipeline, generar reportes y usar IA para próximos pasos.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "oportunidades",
          appendTextIfMissing(form.oportunidades, OPORTUNIDADES_SUGERIDAS)
        ),
    });
  }

  if (!form.puntosCiegos.trim()) {
    localSuggestions.push({
      id: "puntos-ciegos-vacios",
      targetField: "puntosCiegos",
      title: "Podés identificar puntos ciegos frecuentes",
      description:
        "Motivos de pérdida no medidos, origen real poco claro, cliente ideal poco segmentado y oportunidades frías sin alerta.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "puntosCiegos",
          appendTextIfMissing(form.puntosCiegos, PUNTOS_CIEGOS_SUGERIDOS)
        ),
    });
  }

  if (form.recomendaciones.length === 0) {
    localSuggestions.push({
      id: "recomendaciones-vacias",
      targetField: "recomendaciones",
      title: "Podés iniciar con recomendaciones base",
      description:
        "Definir etapas, criterios de avance, responsables, métricas, reportes y reglas de intervención humana.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "recomendaciones",
          mergeUnique(form.recomendaciones, RECOMENDACIONES_LOCAL_SUGERIDAS)
        ),
    });
  }

  if (form.preguntas.filter((pregunta) => pregunta.trim()).length === 0) {
    localSuggestions.push({
      id: "preguntas-vacias",
      targetField: "preguntas",
      title: "Podés partir de preguntas para validar con cliente",
      description:
        "Decisor final, datos antes de cotizar, pérdidas por seguimiento, reportes de dirección y límites de IA.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField("preguntas", mergeUnique(form.preguntas, PREGUNTAS_ABIERTAS_LOCAL_SUGERIDAS)),
    });
  }

  function renderFieldSuggestions(targetField: LocalSuggestion["targetField"]) {
    const suggestions = localSuggestions.filter(
      (suggestion) => suggestion.targetField === targetField
    );
    if (suggestions.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
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

  const MODELO_LABEL =
    MODELOS_COMERCIALES.find((m) => m.value === form.modeloComercial)?.label ??
    "Sin definir";

  const step = CRM_SETUP_STEPS.find((s) => s.id === "diagnostico");

  const matrizBlocks: {
    key: "matrizProceso" | "matrizDatos" | "matrizEquipo" | "matrizAutomatizacion";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "matrizProceso", title: "Proceso comercial", icon: GitBranch },
    { key: "matrizDatos", title: "Datos y documentación", icon: Database },
    { key: "matrizEquipo", title: "Equipo y responsabilidades", icon: Users },
    { key: "matrizAutomatizacion", title: "Automatización e IA", icon: Bot },
  ];

  const readiness = evaluateDiagnosticoReadiness(form);

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin/constructor" className="hover:text-slate-800 transition-colors">
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
          <span className="font-medium text-slate-800">Diagnóstico comercial</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Paso {step?.step ?? 4} de {CRM_SETUP_STEPS.length}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {step?.title ?? "Diagnóstico comercial"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {step?.description ??
                  "Prepará el diagnóstico que usará el sistema para entender cómo vende la empresa."}
                {" "}También se registran oportunidades, riesgos y partes del
                proceso que pueden asistirse con IA.
              </p>
            </div>
          </div>

          {/* Aviso de bloque */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                {loading
                  ? "Cargando diagnóstico guardado..."
                  : "Este paso guarda el diagnóstico comercial en la base de datos."}
              </span>{" "}
              El diagnóstico todavía no se genera con IA; esta pantalla prepara
              la estructura del futuro motor de diagnóstico comercial.
            </p>
          </div>

          <StepReadinessPanel
            title="Estado del diagnóstico"
            readiness={readiness}
            overallProgress={getConstructorOverallProgress({
              currentStep: "diagnostico",
              currentStepPercent: readiness.completionPercent,
            })}
          />

          {/* ── A: Resumen del diagnóstico esperado ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Resumen del diagnóstico esperado" />
            <div className="grid gap-6 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Modelo comercial detectado</label>
                <select
                  className={INPUT_CLASS}
                  value={form.modeloComercial}
                  onChange={(e) =>
                    setField("modeloComercial", e.target.value as ModeloComercial)
                  }
                >
                  <option value="">Seleccionar modelo…</option>
                  {MODELOS_COMERCIALES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <FieldQualityHint hint={readiness.fieldHints.modeloComercial} />
                {renderFieldSuggestions("modeloComercial")}
              </div>

              <div>
                <label className={LABEL_CLASS}>Complejidad comercial</label>
                <PillGroup
                  options={[
                    { value: "baja" as Complejidad, label: "Baja" },
                    { value: "media" as Complejidad, label: "Media" },
                    { value: "alta" as Complejidad, label: "Alta" },
                  ]}
                  value={form.complejidad}
                  onChange={(v) => setField("complejidad", v)}
                />
                <FieldQualityHint hint={readiness.fieldHints.complejidad} />
                {renderFieldSuggestions("complejidad")}
              </div>

              <div>
                <label className={LABEL_CLASS}>Madurez comercial actual</label>
                <PillGroup
                  options={[
                    { value: "inicial" as Madurez, label: "Inicial" },
                    { value: "en-desarrollo" as Madurez, label: "En desarrollo" },
                    { value: "estructurada" as Madurez, label: "Estructurada" },
                    { value: "avanzada" as Madurez, label: "Avanzada" },
                  ]}
                  value={form.madurez}
                  onChange={(v) => setField("madurez", v)}
                />
                <FieldQualityHint hint={readiness.fieldHints.madurez} />
                {renderFieldSuggestions("madurez")}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Nivel de dependencia humana</label>
                <PillGroup
                  options={[
                    { value: "bajo" as DependenciaHumana, label: "Bajo — proceso muy automatizable" },
                    { value: "medio" as DependenciaHumana, label: "Medio — mezcla de criterio y sistema" },
                    { value: "alto" as DependenciaHumana, label: "Alto — requiere criterio humano en cada paso" },
                  ]}
                  value={form.dependenciaHumana}
                  onChange={(v) => setField("dependenciaHumana", v)}
                />
                <FieldQualityHint hint={readiness.fieldHints.dependenciaHumana} />
                {renderFieldSuggestions("dependenciaHumana")}
              </div>

            </div>
          </div>

          {/* ── B: Hallazgos principales ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Hallazgos principales" />
            <p className="mb-4 text-xs text-slate-500">
              Cargá cada hallazgo en orden. Las sugerencias y la asistencia IA aparecen
              debajo del campo correspondiente.
            </p>
            <div className="space-y-5">

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Cómo parece vender hoy la empresa
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="Describí brevemente el proceso de venta actual según lo que sabés…"
                  value={form.comoVende}
                  onChange={(e) => setField("comoVende", e.target.value)}
                />
                <FieldQualityHint hint={readiness.fieldHints.comoVende} />
                {renderFieldSuggestions("comoVende")}
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Principales oportunidades detectadas
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué podría mejorar notablemente con un CRM bien configurado?"
                  value={form.oportunidades}
                  onChange={(e) => setField("oportunidades", e.target.value)}
                />
                <FieldQualityHint hint={readiness.fieldHints.oportunidades} />
                {renderFieldSuggestions("oportunidades")}
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Principales riesgos comerciales
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué podría fallar o perderse si no se controla bien?"
                  value={form.riesgos}
                  onChange={(e) => {
                    setField("riesgos", e.target.value);
                    clearMockAIRiesgos();
                    clearSandboxAIRiesgos();
                    setSandboxAIWarning(null);
                  }}
                />
                <FieldQualityHint hint={readiness.fieldHints.riesgos} />
                {renderFieldSuggestions("riesgos")}
                <div className="mt-3 rounded-xl border border-violet-100 bg-white/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        IA recomendada
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        Analiza Empresa + Cuestionario para sugerir riesgos
                        específicos del caso. Revisión humana obligatoria.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {SHOW_MOCK_DIAGNOSTICO_BUTTON && (
                        <button
                          type="button"
                          onClick={requestMockAISuggestionForRiesgos}
                          disabled={mockAIRiesgosLoading || sandboxAIRiesgosLoading}
                          className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {mockAIRiesgosLoading
                            ? "Consultando IA mock..."
                            : "Consultar IA mock"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={requestSandboxAISuggestionForRiesgos}
                        disabled={mockAIRiesgosLoading || sandboxAIRiesgosLoading}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sandboxAIRiesgosLoading
                          ? "Consultando IA sandbox..."
                          : "Consultar IA sandbox"}
                      </button>
                    </div>
                  </div>

                  {mockAIRiesgosError && (
                    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                      {mockAIRiesgosError}
                    </p>
                  )}
                  {sandboxAIRiesgosError && (
                    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                      {sandboxAIRiesgosError}
                    </p>
                  )}
                  {sandboxAIWarning && !sandboxAIRiesgosError ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                      {sandboxAIWarning}
                    </div>
                  ) : null}

                  {sandboxAIRiesgosSuggestions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {sandboxAIRiesgosSuggestions.map((suggestion) => (
                        <MockAISuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onApply={applyMockAIRiesgosSuggestion}
                          showApply={Array.isArray(suggestion.suggestedValue)}
                        />
                      ))}
                    </div>
                  )}
                  {SHOW_MOCK_DIAGNOSTICO_BUTTON &&
                    mockAIRiesgosSuggestions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {mockAIRiesgosSuggestions.map((suggestion) => (
                          <MockAISuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onApply={applyMockAIRiesgosSuggestion}
                            showApply={Array.isArray(suggestion.suggestedValue)}
                          />
                        ))}
                      </div>
                    )}
                  {aiApplyMessage ? (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      {aiApplyMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3 opacity-50" />
                    Puntos ciegos o información faltante
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué no sabés todavía? ¿Qué datos faltan para un diagnóstico completo?"
                  value={form.puntosCiegos}
                  onChange={(e) => setField("puntosCiegos", e.target.value)}
                />
                <FieldQualityHint hint={readiness.fieldHints.puntosCiegos} />
                {renderFieldSuggestions("puntosCiegos")}
              </div>

            </div>
          </div>

          {/* ── C: Matriz de diagnóstico ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Matriz de diagnóstico" />
            <p className="mb-4 text-xs text-slate-500">
              Evaluá el estado actual de cada dimensión. Esto define dónde el sistema
              necesita más trabajo antes de activarse.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {matrizBlocks.map(({ key, title, icon: Icon }) => {
                const bloque = form[key];
                const estadoActivo = ESTADOS_MATRIZ.find(
                  (e) => e.value === bloque.estado
                );
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                        <Icon className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{title}</p>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {ESTADOS_MATRIZ.map((est) => (
                        <button
                          key={est.value}
                          type="button"
                          onClick={() =>
                            setMatriz(key, {
                              estado:
                                bloque.estado === est.value
                                  ? ""
                                  : est.value,
                            })
                          }
                          className={[
                            "rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                            bloque.estado === est.value
                              ? est.className + " ring-1 ring-offset-1 ring-slate-400"
                              : est.className + " opacity-60 hover:opacity-100",
                          ].join(" ")}
                        >
                          {est.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      className={INPUT_CLASS}
                      placeholder="Nota breve (opcional)…"
                      value={bloque.nota}
                      onChange={(e) => setMatriz(key, { nota: e.target.value })}
                    />

                    {estadoActivo && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        Estado seleccionado:{" "}
                        <span className="font-semibold text-slate-700">
                          {estadoActivo.label}
                        </span>
                      </p>
                    )}
                    <FieldQualityHint
                      className="mt-2 text-[11px]"
                      hint={readiness.fieldHints[key]}
                    />
                  </div>
                );
              })}
            </div>
            {renderFieldSuggestions("recomendaciones")}
          </div>

          {/* ── D: Recomendaciones preliminares ──────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Recomendaciones preliminares" />
            <p className="mb-4 text-xs text-slate-500">
              Seleccioná las acciones que deben completarse antes de diseñar el proceso
              y activar el CRM.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RECOMENDACIONES_SUGERIDAS.map((rec) => {
                const activa = form.recomendaciones.includes(rec);
                return (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => toggleRecomendacion(rec)}
                    className={[
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs transition-all",
                      activa
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {activa ? (
                      <CheckSquare className="h-4 w-4 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className="font-medium">{rec}</span>
                  </button>
                );
              })}
            </div>
            <FieldQualityHint
              className="mt-3 text-[11px]"
              hint={readiness.fieldHints.recomendaciones}
            />
          </div>

          {/* ── E: Preguntas abiertas ────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Preguntas abiertas para completar antes de diseñar el proceso" />
            <p className="mb-4 text-xs text-slate-500">
              Editá estas preguntas o usalas tal cual. Serán insumo para el diseño del proceso
              y pipeline en el próximo paso.
            </p>
            <div className="space-y-2">
              {form.preguntas.map((pregunta, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={pregunta}
                    onChange={(e) => setPregunta(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Estas preguntas se guardan como insumo para el diseño del proceso
              y pipeline.
            </p>
            {renderFieldSuggestions("preguntas")}
          </div>

          {/* ── F: Vista previa del futuro output IA ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="F" title="Vista previa del futuro output IA" />
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-4">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">Solo estructura — no es un resultado real.</span>{" "}
                Este panel muestra el formato de salida que generará el Motor de Diagnóstico Comercial
                cuando se conecte la IA. Por ahora refleja los valores ingresados arriba más
                marcadores de posición.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  diagnostico_comercial.json — preview
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>{JSON.stringify(
                  {
                    diagnostico_narrativo:
                      form.comoVende.trim()
                        ? form.comoVende.trim().slice(0, 120) + (form.comoVende.length > 120 ? "…" : "")
                        : "⏳ Pendiente — se generará con IA en un bloque futuro",
                    modelo_venta: form.modeloComercial || "⏳ sin definir",
                    complejidad: form.complejidad || "⏳ sin definir",
                    madurez_comercial: form.madurez || "⏳ sin definir",
                    dependencia_humana: form.dependenciaHumana || "⏳ sin definir",
                    riesgos: form.riesgos.trim()
                      ? form.riesgos.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — análisis de documentos fuente",
                    oportunidades: form.oportunidades.trim()
                      ? form.oportunidades.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — análisis de cuestionario + documentos",
                    puntos_ciegos: form.puntosCiegos.trim()
                      ? form.puntosCiegos.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — lectura documental IA",
                    recomendaciones:
                      form.recomendaciones.length > 0
                        ? form.recomendaciones
                        : ["⏳ Sin selección todavía"],
                    preguntas_pendientes: form.preguntas.filter((p) => p.trim()),
                    matriz: {
                      proceso_comercial: form.matrizProceso.estado || "⏳ sin evaluar",
                      datos_documentacion: form.matrizDatos.estado || "⏳ sin evaluar",
                      equipo_responsabilidades: form.matrizEquipo.estado || "⏳ sin evaluar",
                      automatizacion_ia: form.matrizAutomatizacion.estado || "⏳ sin evaluar",
                    },
                    readiness_parcial: "⏳ Se calculará al completar todos los pasos del Constructor",
                    generado_por: "Motor Diagnóstico Comercial v1 — no disponible aún",
                    timestamp: "⏳ pendiente",
                  },
                  null,
                  2
                )}</code>
              </pre>
            </div>
          </div>

          {(loading || saveMessage || saveError) && (
            <div className="mb-4 space-y-2">
              {loading && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                  Cargando diagnóstico guardado...
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

          {/* ── Navegación ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/documentos"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Documentos fuente
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
                {saving ? "Guardando..." : "Guardar diagnóstico"}
              </button>
              <Link
                href="/admin/constructor/proceso-pipeline"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Continuar a Proceso y pipeline
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
