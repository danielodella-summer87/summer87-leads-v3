"use client";

import { useEffect, useState } from "react";
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
} from "@/lib/constructor/readiness/helpers";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";

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

type SetupRecord = Record<string, unknown>;
type ConstructorSetup = Record<string, unknown> | null;
type ValidationRow = {
  question: string;
  value: string;
};
type AuditoriaReadiness = BaseReadiness;

const READINESS_FALLBACK_AUDITORIA: AuditoriaReadiness = {
  completionPercent: 0,
  overallStatus: "neutral",
  overallLabel: READINESS_SUMMARY_LABEL.neutral,
  nextAction: "",
  sections: [],
  fieldHints: {},
};

type ConstructorFinalContractMetadata = {
  version: string;
  source: string;
  generatedFrom: string;
  prototypeMode: boolean;
};

type ConstructorFinalContract = {
  metadata: ConstructorFinalContractMetadata;
  empresa: Record<string, unknown>;
  cuestionario: Record<string, unknown>;
  documentos: Record<string, unknown>;
  diagnostico: Record<string, unknown>;
  procesoPipeline: Record<string, unknown>;
  motoresIA: Record<string, unknown>;
  reportes: Record<string, unknown>;
  auditoria: {
    persistedFromSetup: Record<string, unknown>;
    readiness: {
      completionPercent: number;
      overallStatus: QualityStatus;
      overallLabel: string;
      nextAction: string;
      sections: Array<{
        key: string;
        label: string;
        status: QualityStatus;
        detail: string;
      }>;
    };
    activation: {
      prototypeMode: boolean;
      realActivationEnabled: boolean;
      message: string;
    };
  };
  pendientes: string[];
};

type ConstructorBlueprintModuleStatus = "propuesto" | "pendiente" | "critico";

type ConstructorBlueprint = {
  empresa: {
    nombre: string;
    rubro: string;
    vertical: string;
    paisCiudad: string;
    modeloComercial: string;
  };
  modulos: Array<{
    label: string;
    description: string;
    status: ConstructorBlueprintModuleStatus;
  }>;
  pipeline: {
    resumen: string;
    etapas: string[];
    criterios: string[];
  };
  motoresIA: Array<{
    nombre: string;
    etapa: string;
    prioridad: string;
    riesgo: string;
    validacionHumana: boolean;
  }>;
  reportes: Array<{
    nombre: string;
    metricas: string;
    frecuencia: string;
    audiencia: string;
  }>;
  riesgos: string[];
  oportunidades: string[];
  pendientes: string[];
};

const BLUEPRINT_MODULE_CHIP: Record<ConstructorBlueprintModuleStatus, string> = {
  propuesto: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pendiente: "border-amber-200 bg-amber-50 text-amber-900",
  critico: "border-rose-200 bg-rose-50 text-rose-900",
};

const BLUEPRINT_MODULE_LABEL: Record<ConstructorBlueprintModuleStatus, string> = {
  propuesto: "Propuesto",
  pendiente: "Pendiente",
  critico: "Crítico",
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

function hasSetupData(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.keys(value).length > 0;
}

function hasObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectKeysCount(value: unknown): number {
  return hasObject(value) ? Object.keys(value as Record<string, unknown>).length : 0;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function evaluateAuditoriaReadiness(setup: ConstructorSetup): AuditoriaReadiness {
  const empresaOk = hasSetupData(setup?.empresa);
  const cuestionarioOk = hasSetupData(setup?.cuestionario);
  const documentosOk = hasSetupData(setup?.documentos);
  const datosBaseCubiertos = countSelectedValues([
    empresaOk,
    cuestionarioOk,
    documentosOk,
  ]);
  const datosBaseFaltantes = 3 - datosBaseCubiertos;

  let datosBaseStatus: QualityStatus;
  let datosBaseDetail: string;
  if (datosBaseFaltantes >= 2) {
    datosBaseStatus = "danger";
    datosBaseDetail = "Faltan dos o más bloques base (Empresa, Cuestionario o Documentos).";
  } else if (datosBaseFaltantes === 1) {
    datosBaseStatus = "warning";
    datosBaseDetail = "Falta un bloque base por completar o consolidar.";
  } else {
    datosBaseStatus = "good";
    datosBaseDetail = "Empresa, Cuestionario y Documentos tienen contenido cargado.";
  }

  const diagnosticoOk = hasSetupData(setup?.diagnostico);
  const procesoOk = hasSetupData(setup?.proceso_pipeline);

  let diagnosticoProcesoStatus: QualityStatus;
  let diagnosticoProcesoDetail: string;
  if (!diagnosticoOk && !procesoOk) {
    diagnosticoProcesoStatus = "danger";
    diagnosticoProcesoDetail = "Diagnóstico y proceso/pipeline están vacíos.";
  } else if (!diagnosticoOk || !procesoOk) {
    diagnosticoProcesoStatus = "warning";
    diagnosticoProcesoDetail =
      "Diagnóstico o proceso comercial necesita más definición cargada.";
  } else {
    diagnosticoProcesoStatus = "good";
    diagnosticoProcesoDetail = "Diagnóstico y proceso/pipeline cargados.";
  }

  const motoresOk = hasSetupData(setup?.motores_ia);
  const reportesOk = hasSetupData(setup?.reportes);

  let iaReportesStatus: QualityStatus;
  let iaReportesDetail: string;
  if (!motoresOk && !reportesOk) {
    iaReportesStatus = "danger";
    iaReportesDetail = "Motores IA y reportes sin configuración cargada.";
  } else if (!motoresOk || !reportesOk) {
    iaReportesStatus = "warning";
    iaReportesDetail = "Falta contenido en motores IA o en reportes.";
  } else {
    iaReportesStatus = "good";
    iaReportesDetail = "Motores IA y reportes cargados.";
  }

  const pasosPreviosCubiertos = countSelectedValues([
    empresaOk,
    cuestionarioOk,
    documentosOk,
    diagnosticoOk,
    procesoOk,
    motoresOk,
    reportesOk,
  ]);
  const pasosMarcadosApi = arrayLength(setup == null ? undefined : setup.completed_steps);
  const efectivoCompletados = Math.max(pasosMarcadosApi, pasosPreviosCubiertos);
  const readinessApi =
    setup != null && typeof setup.readiness_score === "number" && setup.readiness_score >= 0
      ? setup.readiness_score
      : null;
  const readinessDerivado = Math.round((pasosPreviosCubiertos / 7) * 100);
  const readinessUsar = readinessApi !== null ? readinessApi : readinessDerivado;

  let cierreActivacionStatus: QualityStatus;
  let cierreActivacionDetail: string;
  if (setup == null) {
    cierreActivacionStatus = "danger";
    cierreActivacionDetail = "No hay fila de configuración disponible.";
  } else if (efectivoCompletados >= 6 || readinessUsar >= 70) {
    cierreActivacionStatus = "good";
    cierreActivacionDetail =
      "Progreso alto: pasos completados o readiness score suficiente para revisión final.";
  } else if (efectivoCompletados >= 4 || readinessUsar >= 45) {
    cierreActivacionStatus = "warning";
    cierreActivacionDetail =
      "Avance medio: revisá pasos pendientes antes de considerar activación.";
  } else if (pasosMarcadosApi > 0 || pasosPreviosCubiertos > 0 || readinessDerivado > 0) {
    cierreActivacionStatus = "warning";
    cierreActivacionDetail = "Todavía hay huecos materiales antes de cerrar el Constructor.";
  } else {
    cierreActivacionStatus = "danger";
    cierreActivacionDetail = "El Constructor apenas tiene contenido cargado.";
  }

  const sections: SectionQuality[] = [
    {
      key: "datos-base",
      label: "Datos base",
      status: datosBaseStatus,
      detail: datosBaseDetail,
    },
    {
      key: "diagnostico-proceso",
      label: "Diagnóstico y proceso",
      status: diagnosticoProcesoStatus,
      detail: diagnosticoProcesoDetail,
    },
    {
      key: "ia-reportes",
      label: "IA y reportes",
      status: iaReportesStatus,
      detail: iaReportesDetail,
    },
    {
      key: "cierre-activacion",
      label: "Cierre y activación",
      status: cierreActivacionStatus,
      detail: cierreActivacionDetail,
    },
  ];

  const completionPercent = clampCompletionPercent(
    Math.round(
      25 * STATUS_VALUE[datosBaseStatus] +
        30 * STATUS_VALUE[diagnosticoProcesoStatus] +
        25 * STATUS_VALUE[iaReportesStatus] +
        20 * STATUS_VALUE[cierreActivacionStatus]
    )
  );

  const hayDangerSem = sections.some((s) => s.status === "danger");
  let overallStatus: QualityStatus;
  if (completionPercent >= 80 && !hayDangerSem) {
    overallStatus = "good";
  } else if (completionPercent >= 55) {
    overallStatus = "warning";
  } else {
    overallStatus = "danger";
  }

  let nextAction =
    "El Constructor está listo para revisión final. La activación real sigue bloqueada en prototipo.";
  if (setup == null) {
    nextAction = "No hay configuración cargada para auditar.";
  } else if (!empresaOk) {
    nextAction = "Volvé a Empresa y completá los datos base.";
  } else if (!cuestionarioOk) {
    nextAction = "Volvé a Cuestionario y completá el relevamiento comercial.";
  } else if (!documentosOk) {
    nextAction =
      "Volvé a Documentos Fuente y registrá materiales disponibles.";
  } else if (!diagnosticoOk) {
    nextAction = "Volvé a Diagnóstico y completá los hallazgos principales.";
  } else if (!procesoOk) {
    nextAction =
      "Volvé a Proceso/Pipeline y definí etapas y criterios.";
  } else if (!motoresOk) {
    nextAction =
      "Volvé a Motores IA y definí motores, riesgos y validación humana.";
  } else if (!reportesOk) {
    nextAction = "Volvé a Reportes y definí KPIs y tableros.";
  } else if (completionPercent < 80) {
    nextAction = "Revisá los bloques en amarillo antes de activar.";
  }

  const fieldHints: Record<string, FieldQualityHintValue> = {};

  if (datosBaseStatus === "danger") {
    fieldHints.datosBase = {
      status: "danger",
      text: "Faltan datos base para auditar el CRM.",
    };
  } else if (datosBaseStatus !== "good") {
    fieldHints.datosBase = {
      status: "warning",
      text: "Hay datos base parciales. Revisá Empresa, Cuestionario o Documentos.",
    };
  }

  if (diagnosticoProcesoStatus === "danger") {
    fieldHints.diagnosticoProceso = {
      status: "danger",
      text: "Falta diagnóstico o proceso comercial antes de cerrar el Constructor.",
    };
  } else if (diagnosticoProcesoStatus !== "good") {
    fieldHints.diagnosticoProceso = {
      status: "warning",
      text: "Revisá diagnóstico y proceso antes de activar.",
    };
  }

  if (iaReportesStatus === "danger") {
    fieldHints.iaReportes = {
      status: "danger",
      text: "Faltan motores IA o reportes para cerrar la configuración.",
    };
  } else if (iaReportesStatus !== "good") {
    fieldHints.iaReportes = {
      status: "warning",
      text: "Completá IA y reportes para tener un CRM operativo.",
    };
  }

  if (cierreActivacionStatus === "good") {
    fieldHints.cierreActivacion = {
      status: "good",
      text: "Listo para revisión final. Activación real bloqueada por seguridad de prototipo.",
    };
  } else {
    fieldHints.cierreActivacion = {
      status: "warning",
      text: "La activación real sigue bloqueada en modo prototipo.",
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

type GlobalResumeTier = "completo" | "parcial" | "pendiente";

function getAuditoriaStepPayloadFromSetup(
  setup: ConstructorSetup,
  stepId: string
): unknown {
  if (!setup) return undefined;
  if (stepId === "proceso-pipeline") return setup.proceso_pipeline;
  if (stepId === "motores-ia") return setup.motores_ia;
  return setup[stepId];
}

function globalResumeTierForPayload(
  setupLoading: boolean,
  payload: unknown
): GlobalResumeTier {
  if (setupLoading) return "parcial";
  if (!hasSetupData(payload)) return "pendiente";
  if (objectKeysCount(payload) >= 3) return "completo";
  return "parcial";
}

function globalResumeChipClasses(tier: GlobalResumeTier): {
  wrap: string;
  estadoClass: string;
  detalleClass: string;
  estadoLabel: string;
  detalleLabel: string;
} {
  if (tier === "completo") {
    return {
      wrap: "border-emerald-200 bg-emerald-50 hover:border-emerald-300",
      estadoClass: "text-emerald-800",
      detalleClass: "text-emerald-700",
      estadoLabel: "Completo",
      detalleLabel: "Datos cargados",
    };
  }
  if (tier === "parcial") {
    return {
      wrap: "border-amber-200 bg-amber-50 hover:border-amber-300",
      estadoClass: "text-amber-900",
      detalleClass: "text-amber-800",
      estadoLabel: "Parcial",
      detalleLabel: "Falta información",
    };
  }
  return {
    wrap: "border-rose-200 bg-rose-50 hover:border-rose-300",
    estadoClass: "text-rose-900",
    detalleClass: "text-rose-800",
    estadoLabel: "Pendiente",
    detalleLabel: "Sin datos",
  };
}

function tierForAuditoriaEtapa(args: {
  setupLoading: boolean;
  auditoriaReadiness: AuditoriaReadiness | null;
  allSetupStepsCompleted: boolean;
  completedSetupSteps: number;
}): GlobalResumeTier {
  if (args.setupLoading) return "parcial";
  if (!args.auditoriaReadiness) return "pendiente";
  if (
    args.allSetupStepsCompleted &&
    args.auditoriaReadiness.overallStatus === "good" &&
    args.auditoriaReadiness.completionPercent >= 80
  ) {
    return "completo";
  }
  if (
    args.completedSetupSteps >= 4 ||
    args.auditoriaReadiness.completionPercent >= 55 ||
    args.completedSetupSteps >= 1
  ) {
    return "parcial";
  }
  return "pendiente";
}

function formatReportValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Sin respuesta registrada";
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "Sin respuesta registrada";

    const items = value
      .map((item) => {
        const formatted = formatReportValue(item);
        return formatted !== "Sin respuesta registrada" ? formatted : null;
      })
      .filter(Boolean);

    return items.length > 0 ? items.join(", ") : "Sin respuesta registrada";
  }

  if (typeof value === "object") {
    const record = value as SetupRecord;
    const label =
      record.nombre ??
      record.name ??
      record.title ??
      record.titulo ??
      record.label ??
      record.descripcion ??
      record.descripcionCorta ??
      record.id;

    if (typeof label === "string" && label.trim()) return label;

    const details = Object.entries(record)
      .map(([key, entryValue]) => {
        const formatted = formatReportValue(entryValue);
        return formatted !== "Sin respuesta registrada"
          ? `${key}: ${formatted}`
          : null;
      })
      .filter(Boolean);

    return details.length > 0 ? details.join(" · ") : "Sin respuesta registrada";
  }

  return "Sin respuesta registrada";
}

function asRecord(value: unknown): SetupRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SetupRecord)
    : {};
}

function buildPendingFromReadiness(readiness: AuditoriaReadiness): string[] {
  const sections = Array.isArray(readiness.sections) ? readiness.sections : [];
  return Array.from(
    new Set(
      [
        readiness.overallStatus !== "good" ? readiness.nextAction : "",
        ...sections
          .filter((section) => section.status !== "good")
          .map((section) => `${section.label}: ${section.detail}`),
      ].filter((item): item is string => Boolean(item))
    )
  );
}

function buildConstructorFinalContract(
  setup: ConstructorSetup,
  readiness: AuditoriaReadiness | null | undefined
): ConstructorFinalContract {
  const r =
    readiness != null && typeof readiness === "object" ? readiness : READINESS_FALLBACK_AUDITORIA;
  const setupRecord = setup != null ? asRecord(setup) : {};
  const empresa = asRecord(setupRecord.empresa);
  const cuestionario = asRecord(setupRecord.cuestionario);
  const documentos = asRecord(setupRecord.documentos);
  const diagnostico = asRecord(setupRecord.diagnostico);
  const procesoPipeline = asRecord(
    setupRecord.proceso_pipeline ??
      setupRecord["proceso-pipeline"] ??
      setupRecord.procesoPipeline
  );
  const motoresIA = asRecord(
    setupRecord.motores_ia ??
      setupRecord["motores-ia"] ??
      setupRecord.motoresIA
  );
  const reportes = asRecord(setupRecord.reportes);
  const persistedAuditoria = asRecord(setupRecord.auditoria);

  const readinessSections = Array.isArray(r.sections) ? r.sections : [];

  return {
    metadata: {
      version: "prototype-v1",
      source: "constructor_auditoria_frontend",
      generatedFrom: "crm_setup_config",
      prototypeMode: true,
    },
    empresa,
    cuestionario,
    documentos,
    diagnostico,
    procesoPipeline,
    motoresIA,
    reportes,
    auditoria: {
      persistedFromSetup: persistedAuditoria,
      readiness: {
        completionPercent:
          typeof r.completionPercent === "number" ? r.completionPercent : 0,
        overallStatus:
          typeof r.overallStatus === "string"
            ? (r.overallStatus as QualityStatus)
            : "neutral",
        overallLabel:
          typeof r.overallLabel === "string" ? r.overallLabel : READINESS_SUMMARY_LABEL.neutral,
        nextAction: typeof r.nextAction === "string" ? r.nextAction : "",
        sections: readinessSections.map((section) => ({
          key: section.key,
          label: section.label,
          status: section.status,
          detail: section.detail,
        })),
      },
      activation: {
        prototypeMode: true,
        realActivationEnabled: false,
        message: "La activación real permanece bloqueada en esta fase.",
      },
    },
    pendientes: buildPendingFromReadiness(r),
  };
}

function getStringFromRecord(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getArrayFromRecord(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function pickAcrossEmpresaCuestionario(
  empresaRecord: Record<string, unknown>,
  cuestionarioRecord: Record<string, unknown>,
  keys: string[]
): string {
  const fromEmpresa = getStringFromRecord(empresaRecord, keys);
  if (fromEmpresa) return fromEmpresa;
  return getStringFromRecord(cuestionarioRecord, keys);
}

function blueprintBlockHasPayload(record: Record<string, unknown>): boolean {
  return Object.keys(record).length > 0;
}

function blueprintSectionStatus(
  contract: ConstructorFinalContract | null | undefined,
  sectionKey: string
): QualityStatus | undefined {
  const sections = contract?.auditoria?.readiness?.sections;
  if (!Array.isArray(sections)) return undefined;
  return sections.find((s) => s.key === sectionKey)?.status;
}

function blueprintModuloStatus(
  contract: ConstructorFinalContract | null | undefined,
  sectionKey: string,
  hasPayload: boolean
): ConstructorBlueprintModuleStatus {
  const st = blueprintSectionStatus(contract, sectionKey);
  if (st === "danger") return "critico";
  if (hasPayload) return "propuesto";
  return "pendiente";
}

function namedStringsFromUnknownArray(items: unknown[], nameKeys: string[]): string[] {
  const names: string[] = [];
  for (const item of items) {
    if (typeof item === "string" && item.trim()) {
      names.push(item.trim());
      continue;
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const nm = getStringFromRecord(item as SetupRecord, nameKeys);
    if (nm) names.push(nm);
  }
  return names;
}

function splitMultilineBullets(raw: string, max: number): string[] {
  const byNl = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
  if (byNl.length > 0) return byNl.slice(0, max);
  const bySep = raw
    .split(/[.;]|•/)
    .map((p) => p.trim())
    .filter(Boolean);
  return bySep.slice(0, max);
}

function collectPipelineCriteria(reglasRaw: unknown): string[] {
  const reglas = asRecord(reglasRaw);
  const keys = ["condicionesAvance", "decisionesHumanas", "alertasSistema", "documentosPorEtapa", "tareasAutomaticas"];
  const collected: string[] = [];
  for (const rk of keys) {
    const text = getStringFromRecord(reglas, [rk]);
    if (!text) continue;
    collected.push(...splitMultilineBullets(text, 3));
    if (collected.length >= 8) break;
  }
  return collected.slice(0, 8);
}

function extractMotoresFromContract(motRecord: Record<string, unknown>): ConstructorBlueprint["motoresIA"] {
  const list = getArrayFromRecord(motRecord, ["motores", "motoresIA", "engines", "items", "lista"]);
  const rows: ConstructorBlueprint["motoresIA"] = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as SetupRecord;
    const nombre =
      getStringFromRecord(row, ["nombre", "name", "titulo"]) || "Motor sin nombre";
    const etapa = getStringFromRecord(row, ["etapa", "stage", "fase"]);
    const prioridad = getStringFromRecord(row, ["prioridad", "priority"]);
    const riesgo = getStringFromRecord(row, ["riesgo", "risk", "riskLevel"]);
    const vhRaw = row.requiereValidacionHumana;
    const validacionHumana =
      vhRaw === true || vhRaw === "true" || vhRaw === "sí" || vhRaw === "si";
    rows.push({
      nombre,
      etapa: etapa || "—",
      prioridad: prioridad || "—",
      riesgo: riesgo || "—",
      validacionHumana,
    });
  }
  return rows;
}

function extractReportesFromContract(repRecord: Record<string, unknown>): ConstructorBlueprint["reportes"] {
  const list = getArrayFromRecord(repRecord, ["reportes", "dashboards", "items", "lista"]);
  const rows: ConstructorBlueprint["reportes"] = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as SetupRecord;
    const nombre = getStringFromRecord(row, ["nombre", "name", "titulo"]) || "Reporte sin nombre";
    const metricas = getStringFromRecord(row, ["metricas", "metrics", "kpi"]);
    const frecuencia = formatReportValue(row.frecuencia);
    const audiencia = getStringFromRecord(row, ["audiencia", "audience", "destinatarios"]);
    rows.push({
      nombre,
      metricas: metricas && metricas !== "Sin respuesta registrada" ? metricas : "—",
      frecuencia: frecuencia !== "Sin respuesta registrada" ? frecuencia : "—",
      audiencia: audiencia || "—",
    });
  }
  return rows;
}

function mergeFinalContract(
  contract: ConstructorFinalContract | null | undefined
): ConstructorFinalContract {
  const base: ConstructorFinalContract = {
    metadata: {
      version: "prototype-v1",
      source: "constructor_auditoria_frontend",
      generatedFrom: "crm_setup_config",
      prototypeMode: true,
    },
    empresa: {},
    cuestionario: {},
    documentos: {},
    diagnostico: {},
    procesoPipeline: {},
    motoresIA: {},
    reportes: {},
    auditoria: {
      persistedFromSetup: {},
      readiness: {
        completionPercent: 0,
        overallStatus: "neutral",
        overallLabel: READINESS_SUMMARY_LABEL.neutral,
        nextAction: "",
        sections: [],
      },
      activation: {
        prototypeMode: true,
        realActivationEnabled: false,
        message: "La activación real permanece bloqueada en esta fase.",
      },
    },
    pendientes: [],
  };

  if (!contract || typeof contract !== "object") {
    return base;
  }

  const readinessIn = contract.auditoria?.readiness;

  return {
    ...base,
    ...contract,
    empresa: asRecord(contract.empresa ?? base.empresa),
    cuestionario: asRecord(contract.cuestionario ?? base.cuestionario),
    documentos: asRecord(contract.documentos ?? base.documentos),
    diagnostico: asRecord(contract.diagnostico ?? base.diagnostico),
    procesoPipeline: asRecord(contract.procesoPipeline ?? base.procesoPipeline),
    motoresIA: asRecord(contract.motoresIA ?? base.motoresIA),
    reportes: asRecord(contract.reportes ?? base.reportes),
    metadata:
      contract.metadata != null && typeof contract.metadata === "object"
        ? { ...base.metadata, ...contract.metadata }
        : base.metadata,
    auditoria: {
      persistedFromSetup: asRecord(
        contract.auditoria?.persistedFromSetup ?? base.auditoria.persistedFromSetup
      ),
      readiness: {
        completionPercent:
          typeof readinessIn?.completionPercent === "number"
            ? readinessIn.completionPercent
            : base.auditoria.readiness.completionPercent,
        overallStatus:
          (readinessIn?.overallStatus as QualityStatus) ?? base.auditoria.readiness.overallStatus,
        overallLabel:
          typeof readinessIn?.overallLabel === "string"
            ? readinessIn.overallLabel
            : base.auditoria.readiness.overallLabel,
        nextAction:
          typeof readinessIn?.nextAction === "string"
            ? readinessIn.nextAction
            : base.auditoria.readiness.nextAction,
        sections: Array.isArray(readinessIn?.sections)
          ? readinessIn.sections
          : base.auditoria.readiness.sections,
      },
      activation: {
        prototypeMode: contract.auditoria?.activation?.prototypeMode !== false,
        realActivationEnabled: Boolean(contract.auditoria?.activation?.realActivationEnabled),
        message:
          typeof contract.auditoria?.activation?.message === "string"
            ? contract.auditoria.activation.message
            : base.auditoria.activation.message,
      },
    },
    pendientes: Array.isArray(contract.pendientes) ? contract.pendientes : base.pendientes,
  };
}

function buildConstructorBlueprint(
  contract: ConstructorFinalContract | null | undefined
): ConstructorBlueprint {
  const c = mergeFinalContract(contract);
  const auditoriaBlk = c.auditoria;
  const readinessBlk = auditoriaBlk.readiness;
  const readinessPct =
    readinessBlk != null && typeof readinessBlk.completionPercent === "number"
      ? readinessBlk.completionPercent
      : 0;
  const empresaRecord = c.empresa;
  const cuestionarioRecord = c.cuestionario;

  const nombre =
    pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, [
      "nombreComercial",
      "nombre",
      "empresa",
    ]) || "Empresa sin nombre";
  const rubro =
    pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, [
      "rubroPersonalizado",
      "rubro",
      "rubroPrincipal",
    ]) || "Rubro no definido";
  const vertical =
    pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, ["vertical", "giro", "actividad"]) ||
    "Vertical no definida";
  const pais = pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, ["país", "pais", "country"]);
  const ciudad = pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, ["ciudad", "localidad"]);
  let paisCiudad = "Ubicación no definida";
  if (pais && ciudad) paisCiudad = `${pais} · ${ciudad}`;
  else if (pais) paisCiudad = pais;
  else if (ciudad) paisCiudad = ciudad;

  const modeloComercial =
    pickAcrossEmpresaCuestionario(empresaRecord, cuestionarioRecord, [
      "queVendeDetalle",
      "queVende",
      "modeloComercial",
      "tipoVenta",
    ]) || "Modelo comercial pendiente de completar";

  const empresa: ConstructorBlueprint["empresa"] = {
    nombre,
    rubro,
    vertical,
    paisCiudad,
    modeloComercial,
  };

  const hasLeadsPayload =
    blueprintBlockHasPayload(empresaRecord) || blueprintBlockHasPayload(cuestionarioRecord);

  const documentosPayload = blueprintBlockHasPayload(c.documentos);
  const diagPayload = blueprintBlockHasPayload(c.diagnostico);
  const procesoPayload = blueprintBlockHasPayload(c.procesoPipeline);
  const motPayload = blueprintBlockHasPayload(c.motoresIA);
  const reportesPayload = blueprintBlockHasPayload(c.reportes);
  const persistedAud = asRecord(auditoriaBlk?.persistedFromSetup);

  const modulos: ConstructorBlueprint["modulos"] = [
    {
      label: "Gestión de leads",
      description: "Centraliza oportunidades, seguimiento y datos comerciales.",
      status: blueprintModuloStatus(c, "datos-base", hasLeadsPayload),
    },
    {
      label: "Pipeline / Kanban comercial",
      description: "Ordena etapas, criterios de avance y responsables.",
      status: blueprintModuloStatus(c, "diagnostico-proceso", procesoPayload),
    },
    {
      label: "Diagnóstico comercial",
      description: "Consolida riesgos, oportunidades y puntos ciegos.",
      status: blueprintModuloStatus(c, "diagnostico-proceso", diagPayload),
    },
    {
      label: "Documentos fuente",
      description: "Almacena referencias y material base para el contexto del CRM.",
      status: blueprintModuloStatus(c, "datos-base", documentosPayload),
    },
    {
      label: "Motores IA",
      description: "Propone asistencias por etapa con reglas y validación humana.",
      status: blueprintModuloStatus(c, "ia-reportes", motPayload),
    },
    {
      label: "Reportes y KPIs",
      description: "Define tableros, métricas y frecuencia de lectura.",
      status: blueprintModuloStatus(c, "ia-reportes", reportesPayload),
    },
    {
      label: "Auditoría y validación",
      description: "Cierra el Constructor con readiness, checklist y contrato de prototipo.",
      status: blueprintModuloStatus(
        c,
        "cierre-activacion",
        blueprintBlockHasPayload(persistedAud) || readinessPct >= 55
      ),
    },
  ];

  const pp = c.procesoPipeline;
  const etapasArr = getArrayFromRecord(pp, ["etapas", "stages"]);
  const columnasArr = getArrayFromRecord(pp, ["columnas", "kanban_columns", "columns"]);
  const etapasNombres = namedStringsFromUnknownArray(etapasArr, ["nombre", "name", "titulo"]);
  const columnaNombres = namedStringsFromUnknownArray(columnasArr, ["nombre", "name", "titulo"]);
  const etapasUnique: string[] = [];
  for (const n of [...etapasNombres, ...columnaNombres]) {
    if (!etapasUnique.includes(n)) etapasUnique.push(n);
  }
  const criterios = collectPipelineCriteria(pp.reglas);
  let resumenPipe = "";
  if (etapasUnique.length > 0) {
    resumenPipe = `Se definen ${etapasUnique.length} etapa(s) o columnas Kanban coherentes con el proceso comercial cargado.`;
  } else {
    const fallbackTxt = getStringFromRecord(pp, ["resumenPipeline", "resumen", "descripcion"]);
    resumenPipe = fallbackTxt || "Pipeline pendiente de definición.";
  }

  const motoresBlueprint = extractMotoresFromContract(c.motoresIA);
  const reportesBlueprint = extractReportesFromContract(c.reportes);

  const diag = c.diagnostico;
  let riesgosLista = splitMultilineBullets(getStringFromRecord(diag, ["riesgos"]), 5).filter(Boolean);
  if (riesgosLista.length === 0) {
    riesgosLista = splitMultilineBullets(getStringFromRecord(diag, ["puntosCiegos"]), 5);
  }

  let oportunidadesLista = splitMultilineBullets(getStringFromRecord(diag, ["oportunidades"]), 5);
  if (oportunidadesLista.length === 0) {
    oportunidadesLista = ["Oportunidades pendientes de completar"];
  }

  const pendientesLista = Array.isArray(c.pendientes) ? c.pendientes : [];

  if (riesgosLista.length === 0 && pendientesLista.length > 0) {
    riesgosLista = pendientesLista.slice(0, 5);
  }
  if (riesgosLista.length === 0) {
    riesgosLista = ["Riesgos pendientes de registrar en diagnóstico."];
  }

  const pendientesVista =
    pendientesLista.length > 0 ? pendientesLista.slice(0, 6) : [];

  let pendientesFraseados = pendientesVista;
  if (pendientesFraseados.length === 0) {
    pendientesFraseados = ["Sin pendientes críticos detectados en el contrato actual."];
  }

  return {
    empresa,
    modulos,
    pipeline: {
      resumen: resumenPipe,
      etapas: etapasUnique.slice(0, 16),
      criterios:
        criterios.length > 0
          ? criterios
          : resumenPipe === "Pipeline pendiente de definición."
            ? []
            : ["Criterios de avance disponibles parcialmente en reglas cargadas."],
    },
    motoresIA: motoresBlueprint,
    reportes: reportesBlueprint,
    riesgos: riesgosLista.slice(0, 5),
    oportunidades: oportunidadesLista.slice(0, 5),
    pendientes: pendientesFraseados.slice(0, 6),
  };
}

function getText(record: SetupRecord, key: string): string {
  return formatReportValue(record[key]);
}

function getNestedText(record: SetupRecord, path: string[]): string {
  let current: unknown = record;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return "Sin respuesta registrada";
    }

    current = (current as SetupRecord)[key];
  }

  return formatReportValue(current);
}

function firstAvailable(record: SetupRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return formatReportValue(value);
    }
  }

  return "Sin respuesta registrada";
}

function formatArrayFields(
  record: SetupRecord,
  key: string,
  fieldKeys: string[]
): string {
  const value = record[key];
  if (!Array.isArray(value) || value.length === 0) return "Sin respuesta registrada";

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return formatReportValue(item);
      }

      const itemRecord = item as SetupRecord;
      const values = fieldKeys
        .map((fieldKey) => formatReportValue(itemRecord[fieldKey]))
        .filter((text) => text !== "Sin respuesta registrada");

      return values.length > 0 ? values.join(" / ") : "Sin respuesta registrada";
    })
    .filter((text) => text !== "Sin respuesta registrada");

  return items.length > 0 ? items.join(", ") : "Sin respuesta registrada";
}

function row(question: string, value: unknown): ValidationRow {
  return {
    question,
    value: formatReportValue(value),
  };
}

function rowFromKeys(
  question: string,
  record: SetupRecord,
  keys: string[]
): ValidationRow {
  return {
    question,
    value: firstAvailable(record, keys),
  };
}

function formatArrayObjectFields(
  value: unknown,
  labelKey: string,
  fields: string[]
): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "Sin respuesta registrada";
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return formatReportValue(item);
      }

      const record = item as SetupRecord;
      const label = formatReportValue(record[labelKey]);
      const details = fields
        .map((field) => {
          const fieldValue = formatReportValue(record[field]);
          return fieldValue !== "Sin respuesta registrada"
            ? `${field}: ${fieldValue}`
            : null;
        })
        .filter(Boolean)
        .join(" · ");

      if (label === "Sin respuesta registrada") return details;
      return details ? `${label} - ${details}` : label;
    })
    .filter((text) => text && text !== "Sin respuesta registrada");

  return items.length > 0 ? items.join("; ") : "Sin respuesta registrada";
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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const [score, setScore] = useState(76);
  const [checklist, setChecklist] = useState<ItemChecklist[]>(CHECKLIST_INICIAL);
  const [riesgos, setRiesgos] = useState<Riesgo[]>(RIESGOS_INICIALES);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [showClientReport, setShowClientReport] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      setSetupLoading(true);
      setSetupError(null);

      try {
        const res = await fetch("/api/admin/constructor/setup", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const json = (await res.json().catch(() => null)) as {
          data?: Record<string, unknown> | null;
          error?: string | null;
        } | null;

        if (cancelled) return;

        if (res.redirected || !json) {
          setSetupError("La sesión no está autorizada para cargar la auditoría.");
          return;
        }

        if (!res.ok || json?.error) {
          setSetupError(json?.error ?? "No se pudo cargar la configuración guardada.");
          return;
        }

        setSetupData(json?.data ?? null);
      } catch {
        if (!cancelled) {
          setSetupError("Error de red al cargar la auditoría.");
        }
      } finally {
        if (!cancelled) {
          setSetupLoading(false);
        }
      }
    }

    loadSetup();

    return () => {
      cancelled = true;
    };
  }, []);

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

  function handlePrintClientReport() {
    window.print();
  }

  const empresaSetup = asRecord(setupData?.empresa);
  const cuestionarioSetup = asRecord(setupData?.cuestionario);
  const documentosSetup = asRecord(setupData?.documentos);
  const diagnosticoSetup = asRecord(setupData?.diagnostico);
  const procesoPipelineSetup = asRecord(setupData?.proceso_pipeline);
  const motoresIASetup = asRecord(setupData?.motores_ia);
  const reportesSetup = asRecord(setupData?.reportes);

  const setupStepStatus = {
    empresa: hasSetupData(setupData?.empresa),
    cuestionario: hasSetupData(setupData?.cuestionario),
    documentos: hasSetupData(setupData?.documentos),
    diagnostico: hasSetupData(setupData?.diagnostico),
    procesoPipeline: hasSetupData(setupData?.proceso_pipeline),
    motoresIA: hasSetupData(setupData?.motores_ia),
    reportes: hasSetupData(setupData?.reportes),
  };
  const completedSetupSteps = Object.values(setupStepStatus).filter(Boolean).length;
  const totalSetupSteps = Object.keys(setupStepStatus).length;
  const allSetupStepsCompleted =
    totalSetupSteps > 0 && completedSetupSteps === totalSetupSteps;
  const realSetupProgressPct =
    totalSetupSteps > 0
      ? Math.round((completedSetupSteps / totalSetupSteps) * 100)
      : 0;
  const auditChecklist = checklist.map((item) => {
    if (item.id === "c8") {
      return {
        ...item,
        checked: allSetupStepsCompleted,
        descripcion: allSetupStepsCompleted
          ? "Constructor conectado a Supabase y con los 7 pasos previos guardados correctamente."
          : item.descripcion,
      };
    }

    return item;
  });
  const auditRiesgos = riesgos.map((riesgo) => {
    if (riesgo.id === "rg1" && allSetupStepsCompleted) {
      return {
        ...riesgo,
        estado: "mitigado" as EstadoRiesgo,
        severidad: "baja" as Severidad,
        observacion:
          "Mitigado para el Constructor: los 7 pasos previos ya guardan y cargan desde Supabase. Falta definir activación operativa final.",
      };
    }

    return riesgo;
  });
  const effectiveScore = allSetupStepsCompleted ? Math.max(score, 85) : score;
  const totalChecked = auditChecklist.filter((i) => i.checked).length;
  const checklistPct = Math.round((totalChecked / auditChecklist.length) * 100);
  const riesgosAltos = auditRiesgos.filter(
    (r) => r.severidad === "alta" && r.estado === "pendiente"
  ).length;
  const riesgosMitigados = auditRiesgos.filter((r) => r.estado === "mitigado").length;
  const activationReadiness = {
    setupCompleto: allSetupStepsCompleted,
    checklistCompleto: auditChecklist.every((item) => item.checked),
    sinRiesgosAltos: auditRiesgos.filter(
      (r) => r.severidad === "alta" && r.estado === "pendiente"
    ).length === 0,
    modoPrototipo: true,
    permisosRealesPendientes: true,
    activacionPersistentePendiente: true,
  };
  const canPrepareActivation =
    activationReadiness.setupCompleto &&
    activationReadiness.checklistCompleto &&
    activationReadiness.sinRiesgosAltos;
  const canActivateCRM = false;
  const activationConditions = [
    {
      label: "Setup del Constructor completo",
      status: activationReadiness.setupCompleto ? "Cumplido" : "Pendiente",
      complete: activationReadiness.setupCompleto,
    },
    {
      label: "Checklist de auditoría completo",
      status: activationReadiness.checklistCompleto ? "Cumplido" : "Pendiente",
      complete: activationReadiness.checklistCompleto,
    },
    {
      label: "Sin riesgos altos pendientes",
      status: activationReadiness.sinRiesgosAltos ? "Cumplido" : "Pendiente",
      complete: activationReadiness.sinRiesgosAltos,
    },
    {
      label: "Reporte Maestro listo para validación",
      status: canPrepareActivation ? "Cumplido" : "Pendiente",
      complete: canPrepareActivation,
    },
    {
      label: "Reemplazar modo prototipo por permisos reales",
      status:
        activationReadiness.modoPrototipo ||
        activationReadiness.permisosRealesPendientes
          ? "Prototipo"
          : "Cumplido",
      complete:
        !activationReadiness.modoPrototipo &&
        !activationReadiness.permisosRealesPendientes,
    },
    {
      label: "Definir flujo operativo de activación",
      status: "Pendiente",
      complete: false,
    },
    {
      label: "Persistir estado de activación del CRM",
      status: activationReadiness.activacionPersistentePendiente
        ? "Pendiente"
        : "Cumplido",
      complete: !activationReadiness.activacionPersistentePendiente,
    },
    {
      label: "Aprobar con cliente antes de activar",
      status: "Pendiente",
      complete: false,
    },
  ];
  const auditoriaReadiness: AuditoriaReadiness | null =
    setupLoading ? null : evaluateAuditoriaReadiness(setupData);
  const readinessForContract: AuditoriaReadiness =
    auditoriaReadiness ?? evaluateAuditoriaReadiness(setupData);
  const finalContract = buildConstructorFinalContract(setupData, readinessForContract);
  const finalContractJson = JSON.stringify(finalContract, null, 2);
  const blueprint = buildConstructorBlueprint(finalContract);

  const clientReportBlocks = [
    {
      id: "empresa",
      title: "Empresa",
      icon: Building2,
      summary:
        "Datos base de la organización, rubro, contexto y configuración inicial.",
    },
    {
      id: "cuestionario",
      title: "Cuestionario comercial",
      icon: ClipboardList,
      summary:
        "Criterios comerciales, modelo de venta, decisores, métricas y necesidades.",
    },
    {
      id: "documentos",
      title: "Documentos fuente",
      icon: FileText,
      summary:
        "Materiales fuente, referencias comerciales y documentación para alimentar el CRM.",
    },
    {
      id: "diagnostico",
      title: "Diagnóstico comercial",
      icon: Search,
      summary:
        "Fortalezas, riesgos, oportunidades y madurez comercial.",
    },
    {
      id: "proceso-pipeline",
      title: "Proceso y pipeline",
      icon: GitBranch,
      summary:
        "Etapas comerciales, condiciones de avance y estructura del pipeline.",
    },
    {
      id: "motores-ia",
      title: "Motores IA",
      icon: Bot,
      summary:
        "Casos de uso IA, inputs, outputs y validaciones humanas.",
    },
    {
      id: "reportes",
      title: "Reportes",
      icon: BarChart3,
      summary:
        "Métricas, audiencias, frecuencia y necesidades de seguimiento.",
    },
  ];
  const clientValidationSections = [
    {
      id: "empresa",
      title: "Empresa",
      icon: Building2,
      status: setupStepStatus.empresa,
      rows: [
        rowFromKeys("Nombre comercial", empresaSetup, [
          "nombreComercial",
          "nombre",
          "empresa",
        ]),
        rowFromKeys("Nombre legal / razón social", empresaSetup, [
          "nombreLegal",
          "razonSocial",
        ]),
        row("Rubro", empresaSetup.rubro),
        rowFromKeys("Giro o vertical", empresaSetup, ["giro", "vertical"]),
        row("País", empresaSetup.pais),
        row("Ciudad", empresaSetup.ciudad),
        row("Tipos de cliente", empresaSetup.tiposCliente),
        row("¿Qué vende la empresa?", empresaSetup.queVende),
        row("¿Cómo llegan normalmente los prospectos?", empresaSetup.fuentesProspectos),
        row("¿Requiere visita o reunión antes de cotizar?", empresaSetup.requiereVisita),
        row("¿La propuesta o cotización es estándar o personalizada?", empresaSetup.tipoCotizacion),
        row("¿Cómo trabaja hoy la empresa?", empresaSetup.comoTrabajaHoy),
        row("¿Qué espera lograr con el CRM?", empresaSetup.queEsperaLograr),
        row(
          "¿Qué información debería analizar la IA cuando se active?",
          empresaSetup.queDeberiaAnalizarIA
        ),
      ],
    },
    {
      id: "cuestionario",
      title: "Cuestionario comercial",
      icon: ClipboardList,
      status: setupStepStatus.cuestionario,
      rows: [
        row(
          "¿Qué vende principalmente la empresa?",
          cuestionarioSetup.queVendeDetalle
        ),
        row("Tipo de venta principal", cuestionarioSetup.tiposVenta),
        row("Ciclo de venta estimado", cuestionarioSetup.cicloVenta),
        row("Ticket promedio", cuestionarioSetup.ticketPromedio),
        row("Tipo de cliente objetivo", cuestionarioSetup.tiposClienteObj),
        rowFromKeys("Segmentos o verticales específicas", cuestionarioSetup, [
          "segmentosCustom",
          "segmentos",
          "verticalesEspecificas",
        ]),
        row("¿Quién suele tomar la decisión de compra?", cuestionarioSetup.decisores),
        row(
          "Principales criterios para calificar un buen prospecto",
          cuestionarioSetup.criteriosCalificacion
        ),
        row(
          "¿Cómo es hoy el proceso desde que llega un prospecto hasta que se cierra?",
          cuestionarioSetup.procesoActual
        ),
        rowFromKeys("¿Hay reunión, visita o diagnóstico antes de cotizar?", cuestionarioSetup, [
          "requiereDiagnostico",
          "requiereReunion",
          "reunionAntesCotizar",
          "visitaDiagnostico",
        ]),
        row(
          "¿Qué información se necesita antes de armar una propuesta?",
          cuestionarioSetup.infoPrePropuesta
        ),
        rowFromKeys(
          "¿Qué bloquea normalmente el avance de una oportunidad?",
          cuestionarioSetup,
          ["queBloquea", "bloqueosAvance", "bloqueaAvance"]
        ),
        row("Tipo de propuesta / cierre", cuestionarioSetup.tiposPropuesta),
        rowFromKeys(
          "¿Quién aprueba internamente una propuesta antes de enviarla?",
          cuestionarioSetup,
          ["aprobadorInterno", "aprobadorPropuesta", "quienApruebaPropuesta"]
        ),
        rowFromKeys(
          "¿Qué condiciones deben cumplirse para marcar una oportunidad como ganada?",
          cuestionarioSetup,
          ["condicionesGanado", "condicionesGanada", "condicionesCierre"]
        ),
        row("Motivos frecuentes de pérdida", cuestionarioSetup.motivosPerdida),
        rowFromKeys("¿Qué necesita ver dirección o gerencia?", cuestionarioSetup, [
          "queVerDireccion",
          "necesidadesDireccion",
          "reportesDireccion",
        ]),
        row("Frecuencia ideal de reportes", cuestionarioSetup.frecuenciaReportes),
        row("Métricas importantes para el negocio", cuestionarioSetup.metricasImportantes),
        rowFromKeys("¿Qué decisiones nunca debería tomar la IA sola?", cuestionarioSetup, [
          "decisionesNoIA",
          "decisionesHumanas",
        ]),
        row("¿Dónde te gustaría que la IA ayude primero?", cuestionarioSetup.dondeAyudarIA),
        row(
          "Comentarios adicionales para diseñar el CRM",
          cuestionarioSetup.comentariosAdicionales
        ),
      ],
    },
    {
      id: "documentos",
      title: "Documentos fuente",
      icon: FileText,
      status: setupStepStatus.documentos,
      rows: [
        row("Tipos de documentos seleccionados", documentosSetup.tiposSeleccionados),
        row(
          "Documentos registrados",
          formatArrayObjectFields(documentosSetup.lista, "nombre", [])
        ),
        row(
          "Importancia de documentos registrados",
          formatArrayObjectFields(documentosSetup.lista, "nombre", ["importancia"])
        ),
        row(
          "Uso actual de los documentos",
          formatArrayObjectFields(documentosSetup.lista, "nombre", ["usoActual"])
        ),
        row(
          "Tipo documental",
          formatArrayObjectFields(documentosSetup.lista, "nombre", ["tipo"])
        ),
        row(
          "Etapa comercial asociada",
          formatArrayObjectFields(documentosSetup.lista, "nombre", ["etapaComercial"])
        ),
      ],
    },
    {
      id: "diagnostico",
      title: "Diagnóstico comercial",
      icon: Search,
      status: setupStepStatus.diagnostico,
      rows: [
        row("Modelo comercial detectado", diagnosticoSetup.modeloComercial),
        row("Complejidad comercial", diagnosticoSetup.complejidad),
        row("Madurez comercial actual", diagnosticoSetup.madurez),
        row("Nivel de dependencia humana", diagnosticoSetup.dependenciaHumana),
        row("¿Cómo parece vender hoy la empresa?", diagnosticoSetup.comoVende),
        row("Principales riesgos comerciales", diagnosticoSetup.riesgos),
        row("Principales oportunidades detectadas", diagnosticoSetup.oportunidades),
        row("Puntos ciegos o información faltante", diagnosticoSetup.puntosCiegos),
        row("Recomendaciones preliminares", diagnosticoSetup.recomendaciones),
        row(
          "Preguntas abiertas para completar antes de diseñar el proceso",
          diagnosticoSetup.preguntas
        ),
      ],
    },
    {
      id: "proceso-pipeline",
      title: "Proceso y pipeline",
      icon: GitBranch,
      status: setupStepStatus.procesoPipeline,
      rows: [
        row(
          "Etapas comerciales definidas",
          formatArrayObjectFields(procesoPipelineSetup.etapas, "nombre", [
            "objetivo",
            "responsable",
          ])
        ),
        row(
          "Columnas del pipeline",
          formatArrayObjectFields(procesoPipelineSetup.columnas, "nombre", [
            "tipo",
            "criterioEntrada",
            "criterioSalida",
            "slaDias",
          ])
        ),
        row(
          "Condiciones de avance",
          getNestedText(procesoPipelineSetup, ["reglas", "condicionesAvance"])
        ),
        row(
          "Decisiones humanas requeridas",
          getNestedText(procesoPipelineSetup, ["reglas", "decisionesHumanas"])
        ),
        rowFromKeys("Validaciones antes de avanzar", asRecord(procesoPipelineSetup.reglas), [
          "validaciones",
          "documentosPorEtapa",
          "alertasSistema",
        ]),
        rowFromKeys("Pendientes operativos", asRecord(procesoPipelineSetup.reglas), [
          "pendientes",
          "tareasAutomaticas",
        ]),
      ],
    },
    {
      id: "motores-ia",
      title: "Motores IA",
      icon: Bot,
      status: setupStepStatus.motoresIA,
      rows: [
        row(
          "Motores IA definidos",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", [])
        ),
        row(
          "Etapa donde actúa cada motor",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", ["etapa"])
        ),
        row(
          "Input necesario",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", ["input"])
        ),
        row(
          "Output esperado",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", ["output"])
        ),
        row(
          "Requiere validación humana",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", [
            "requiereValidacionHumana",
          ])
        ),
        row(
          "Prioridad",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", ["prioridad"])
        ),
        row(
          "Riesgo",
          formatArrayObjectFields(motoresIASetup.motores, "nombre", ["riesgo"])
        ),
        row(
          "Reglas generales",
          [
            getNestedText(motoresIASetup, ["reglas", "motoresAutomaticos"]),
            getNestedText(motoresIASetup, ["reglas", "motivosAprobacion"]),
            getNestedText(motoresIASetup, ["reglas", "outputsBorrador"]),
            getNestedText(motoresIASetup, ["reglas", "outputsReportes"]),
            getNestedText(motoresIASetup, ["reglas", "riesgosRevisar"]),
          ].filter((value) => value !== "Sin respuesta registrada")
        ),
      ],
    },
    {
      id: "reportes",
      title: "Reportes",
      icon: BarChart3,
      status: setupStepStatus.reportes,
      rows: [
        row(
          "Reportes definidos",
          formatArrayObjectFields(reportesSetup.reportes, "nombre", [])
        ),
        row(
          "Audiencia",
          formatArrayObjectFields(reportesSetup.reportes, "nombre", ["audiencia"])
        ),
        row(
          "Frecuencia",
          formatArrayObjectFields(reportesSetup.reportes, "nombre", ["frecuencia"])
        ),
        row(
          "Métricas",
          formatArrayObjectFields(reportesSetup.reportes, "nombre", ["metricas"])
        ),
        row(
          "Alertas por umbral",
          getNestedText(reportesSetup, ["reglas", "alertasUmbral"])
        ),
        row(
          "Distribución",
          getNestedText(reportesSetup, ["reglas", "distribucion"])
        ),
      ],
    },
    {
      id: "auditoria-final",
      title: "Auditoría final",
      icon: ShieldCheck,
      status: allSetupStepsCompleted,
      rows: [
        row(
          "Configuración guardada",
          `${completedSetupSteps}/${totalSetupSteps} pasos · ${realSetupProgressPct}%`
        ),
        row(
          "Checklist de activación",
          `${totalChecked}/${auditChecklist.length} ítems · ${checklistPct}%`
        ),
        row("Score efectivo", `${effectiveScore}/100`),
        row(
          "Riesgos altos pendientes",
          riesgosAltos === 0
            ? "Sin riesgos altos pendientes"
            : `${riesgosAltos} riesgo${riesgosAltos !== 1 ? "s" : ""} alto${riesgosAltos !== 1 ? "s" : ""}`
        ),
        row(
          "Dictamen",
          allSetupStepsCompleted
            ? "Listo para validación final con cliente"
            : effectiveScore >= 55
            ? "Requiere revisión"
            : "No listo para activar"
        ),
        row(
          "Próxima acción recomendada",
          "Revisar y aprobar el Reporte Maestro con el cliente antes de activar el CRM operativo."
        ),
      ],
    },
  ];

  function isSetupStepComplete(id: string): boolean {
    if (id === "proceso-pipeline") return setupStepStatus.procesoPipeline;
    if (id === "motores-ia") return setupStepStatus.motoresIA;
    if (id === "auditoria-final") return false;
    return Boolean(setupStepStatus[id as keyof typeof setupStepStatus]);
  }

  // Dictamen calculado desde score + checklist + riesgos altos
  const dictamen: "listo" | "revision" | "no-listo" =
    effectiveScore >= 80 && checklistPct >= 85 && riesgosAltos === 0
      ? "listo"
      : effectiveScore >= 55 && checklistPct >= 50
      ? "revision"
      : "no-listo";

  const DICTAMEN_CONFIG = {
    listo: {
      label: allSetupStepsCompleted
        ? "Listo para validación final con cliente"
        : "Listo para activar",
      wrapperClass: "border-green-200 bg-green-50",
      textColor: "text-green-800",
      subColor: "text-green-700",
      statBg: "bg-green-100/60",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      descripcion: allSetupStepsCompleted
        ? "El Constructor ya tiene los 7 pasos previos guardados y cargando desde Supabase. Antes de activar el CRM operativo, se recomienda revisar el reporte maestro con el cliente y aprobar la configuración final."
        : "El CRM cumple con los criterios mínimos de configuración. Puede proceder a la activación cuando la persistencia esté conectada.",
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

  const hoy = "Fecha de revisión";

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

          {!setupLoading && auditoriaReadiness ? (
            <StepReadinessPanel
              title="Estado de auditoría final"
              readiness={auditoriaReadiness}
              overallProgress={getConstructorOverallProgress({
                currentStep: "auditoria",
                currentStepPercent: auditoriaReadiness.completionPercent,
              })}
            />
          ) : null}

          <div className="mb-8 rounded-xl border border-slate-200 bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Resumen global del Constructor
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Lectura rápida por etapa según contenido cargado del setup guardado.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PASOS_RESUMEN.map((paso) => {
                const Icon = paso.icon;
                const payload = getAuditoriaStepPayloadFromSetup(setupData, paso.id);
                const tier = globalResumeTierForPayload(setupLoading, payload);
                const chip = globalResumeChipClasses(tier);
                const labelEtapa =
                  paso.id === "documentos"
                    ? "Documentos Fuente"
                    : paso.id === "diagnostico"
                      ? "Diagnóstico"
                      : paso.id === "proceso-pipeline"
                        ? "Proceso/Pipeline"
                        : paso.id === "motores-ia"
                          ? "Motores IA"
                          : paso.title;
                return (
                  <Link
                    key={paso.id}
                    href={paso.href}
                    className={`flex min-w-[152px] max-w-[210px] flex-1 flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors ${chip.wrap}`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className={`text-[11px] font-semibold leading-tight ${chip.estadoClass}`}>
                        {labelEtapa}
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${chip.estadoClass}`}
                    >
                      {chip.estadoLabel}
                    </span>
                    <span className={`text-[10px] ${chip.detalleClass}`}>{chip.detalleLabel}</span>
                  </Link>
                );
              })}
              {(() => {
                const auditoriaTier = tierForAuditoriaEtapa({
                  setupLoading,
                  auditoriaReadiness,
                  allSetupStepsCompleted,
                  completedSetupSteps,
                });
                const auditoriaChip = globalResumeChipClasses(auditoriaTier);
                return (
                  <div
                    className={`flex min-w-[152px] max-w-[210px] flex-1 flex-col gap-1 rounded-xl border px-3 py-2.5 ${auditoriaChip.wrap}`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span
                        className={`text-[11px] font-semibold leading-tight ${auditoriaChip.estadoClass}`}
                      >
                        Auditoría
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${auditoriaChip.estadoClass}`}
                    >
                      {auditoriaChip.estadoLabel}
                    </span>
                    <span className={`text-[10px] ${auditoriaChip.detalleClass}`}>
                      {auditoriaChip.detalleLabel}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── H: Vista técnica consolidada del Constructor ───────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="H"
              title="Vista técnica consolidada del Constructor"
            />
            <p className="mb-4 max-w-2xl text-xs text-slate-500">
              Contrato técnico de prototipo generado sólo desde el estado actual
              de la página. Sin escritura en backend ni activación real.
            </p>
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-blue-800">
                Este JSON consolida la configuración cargada en el Constructor.
                No activa el CRM, no escribe datos operativos y sirve como
                contrato técnico de prototipo.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-blue-200/80 bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Versión
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-900">
                    prototype-v1
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200/80 bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Origen
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-900">
                    crm_setup_config
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200/80 bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Modo
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-900">
                    Prototipo
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200/80 bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Activación real
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-900">
                    Bloqueada
                  </p>
                </div>
              </div>
            </div>
            <pre className="max-h-[min(70vh,520px)] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">
              {finalContractJson}
            </pre>
          </div>

          {/* ── I: Blueprint visual del CRM ─────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="I" title="Blueprint visual del CRM" />
            <p className="mb-4 max-w-2xl text-xs text-slate-500">
              Vista ejecutiva y consultiva derivada del mismo contrato consolidado que el JSON
              anterior. Pensada para alinear expectativas con cliente o equipo sin activar el CRM.
            </p>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Organización
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                    {blueprint.empresa.nombre}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {blueprint.empresa.rubro}
                    {" · "}
                    {blueprint.empresa.vertical}
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-600">
                  Prototipo · sin activación
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Ubicación
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-800">
                    {blueprint.empresa.paisCiudad}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Modelo comercial
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-800">
                    {blueprint.empresa.modeloComercial}
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-3 text-xs font-semibold text-slate-800">Módulos propuestos</p>
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {blueprint.modulos.map((mod) => (
                <div
                  key={mod.label}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{mod.label}</p>
                    <span
                      className={[
                        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        BLUEPRINT_MODULE_CHIP[mod.status],
                      ].join(" ")}
                    >
                      {BLUEPRINT_MODULE_LABEL[mod.status]}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">{mod.description}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold text-slate-900">
                Pipeline recomendado
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{blueprint.pipeline.resumen}</p>
              {blueprint.pipeline.etapas.length > 0 ? (
                <>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Etapas / columnas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {blueprint.pipeline.etapas.map((et, ei) => (
                      <span
                        key={`etapa-${ei}`}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700"
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              {blueprint.pipeline.criterios.length > 0 ? (
                <>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Criterios principales
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-slate-700">
                    {blueprint.pipeline.criterios.map((c, ci) => (
                      <li key={`crit-${ci}`}>{c}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold text-slate-900">Motores IA sugeridos</p>
              {blueprint.motoresIA.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                  Todavía no hay motores IA definidos para el blueprint.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full border-collapse text-left text-[11px] text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Etapa</th>
                        <th className="px-3 py-2">Prioridad</th>
                        <th className="px-3 py-2">Riesgo</th>
                        <th className="px-3 py-2">Validación humana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blueprint.motoresIA.map((m, mi) => (
                        <tr key={`motor-${mi}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 font-medium text-slate-900">{m.nombre}</td>
                          <td className="px-3 py-2">{m.etapa}</td>
                          <td className="px-3 py-2">{m.prioridad}</td>
                          <td className="px-3 py-2">{m.riesgo}</td>
                          <td className="px-3 py-2">
                            {m.validacionHumana ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Sí
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold text-slate-900">Reportes necesarios</p>
              {blueprint.reportes.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
                  Todavía no hay reportes definidos para el blueprint.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full border-collapse text-left text-[11px] text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Métricas</th>
                        <th className="px-3 py-2">Frecuencia</th>
                        <th className="px-3 py-2">Audiencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blueprint.reportes.map((r, ri) => (
                        <tr key={`rep-${ri}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2 font-medium text-slate-900">{r.nombre}</td>
                          <td className="px-3 py-2">{r.metricas}</td>
                          <td className="px-3 py-2">{r.frecuencia}</td>
                          <td className="px-3 py-2">{r.audiencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                <p className="text-xs font-semibold text-rose-900">Riesgos principales</p>
                <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-rose-900/90">
                  {blueprint.riesgos.map((r, ri) => (
                    <li key={`riesgo-${ri}`} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs font-semibold text-emerald-900">Oportunidades principales</p>
                <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-emerald-900/90">
                  {blueprint.oportunidades.map((o, oi) => (
                    <li key={`op-${oi}`} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-semibold text-amber-950">Pendientes antes de activación</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-amber-950/90">
                {blueprint.pendientes.map((p, pi) => (
                  <li key={`pend-${pi}`} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                {setupLoading
                  ? "Cargando configuración guardada..."
                  : "Auditoría conectada al setup guardado en modo solo lectura."}
              </span>{" "}
              El score manual sigue siendo editable, pero la auditoría reconoce
              cuando los 7 pasos previos ya cargan desde Supabase.
            </p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Configuración guardada
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {setupLoading
                  ? "Cargando..."
                  : `${completedSetupSteps}/${totalSetupSteps} pasos`}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Lectura desde `/api/admin/constructor/setup`; Auditoría no guarda datos todavía.
              </p>
            </div>
            {setupError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                  Error al cargar setup
                </p>
                <p className="mt-1 text-xs font-semibold text-red-700">
                  {setupError}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                  Readiness de datos reales
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Esta métrica muestra presencia de datos guardados en los 7 pasos
                  previos. Si todos están completos, ajusta la lectura del
                  checklist, riesgos y dictamen sin activar el CRM.
                </p>
              </div>
            )}
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
                const isComplete = isSetupStepComplete(paso.id);
                return (
                  <div
                    key={paso.id}
                    className={[
                      "flex flex-col gap-2 rounded-xl border p-4",
                      isComplete
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          isComplete ? "bg-green-600" : "bg-slate-300",
                        ].join(" ")}
                      >
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={[
                            "text-[10px]",
                            isComplete ? "text-green-600" : "text-slate-400",
                          ].join(" ")}
                        >
                          Paso {paso.step}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {paso.title}
                        </p>
                      </div>
                      {isComplete ? (
                        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <AlertTriangle className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {paso.resumen}
                    </p>
                    <span
                      className={[
                        "w-fit rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                        isComplete
                          ? "border-green-200 bg-white/70 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {isComplete ? "Completo" : "Pendiente"}
                    </span>
                    <Link
                      href={paso.href}
                      className={[
                        "mt-auto inline-flex items-center gap-1 text-[11px] font-semibold transition-colors",
                        isComplete
                          ? "text-green-700 hover:text-green-900"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Editar →
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Estado derivado de datos guardados: {completedSetupSteps}/{totalSetupSteps} pasos con configuración.
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
              la configuración. Si el setup real está completo, la auditoría usa
              un score efectivo mínimo para reflejar ese avance.
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
                      effectiveScore >= 80
                        ? "text-green-600"
                        : effectiveScore >= 55
                        ? "text-amber-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    {effectiveScore}
                    <span className="ml-1 text-xl text-slate-400">/100</span>
                  </p>
                  {effectiveScore !== score && (
                    <p className="mt-1 text-[11px] font-medium text-green-700">
                      Score manual: {score}/100 · setup real completo
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      effectiveScore >= 80
                        ? "border-green-200 bg-green-50 text-green-700"
                        : effectiveScore >= 55
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {effectiveScore >= 80
                      ? "Preparación alta"
                      : effectiveScore >= 55
                      ? "Preparación media"
                      : "Preparación baja"}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Checklist: {totalChecked}/{auditChecklist.length} ítems (
                    {checklistPct}%)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Setup real: {realSetupProgressPct}%
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
              {auditChecklist.map((item) => (
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
              {totalChecked} de {auditChecklist.length} ítems completados (
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
              {auditRiesgos.map((riesgo, index) => (
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
              Calculado desde el score efectivo, el checklist auditado y los
              riesgos actuales. No activa el CRM ni ejecuta auditoría IA real.
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
                  { label: "Score", value: `${effectiveScore}/100` },
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
                IA en una fase posterior. Este preview combina el estado local
                con la lectura real del setup.
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
                    <span className="font-semibold">{effectiveScore}/100</span>.
                    Checklist:{" "}
                    <span className="font-semibold">
                      {totalChecked}/{auditChecklist.length} ítems ({checklistPct}%)
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
                    {PASOS_RESUMEN.map((p) => {
                      const isComplete = isSetupStepComplete(p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-start gap-2 text-xs"
                        >
                          {isComplete ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          <span className="font-medium text-slate-700">
                            Paso {p.step} — {p.title}:
                          </span>
                          <span className="text-slate-500">{p.resumen}</span>
                          <span
                            className={
                              isComplete
                                ? "ml-auto shrink-0 text-[10px] font-semibold text-green-600"
                                : "ml-auto shrink-0 text-[10px] font-semibold text-amber-600"
                            }
                          >
                            {isComplete ? "Completo" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-900">
                    Checklist de activación
                  </p>
                  <div className="space-y-1">
                    {auditChecklist.map((item) => (
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
                    {auditRiesgos.map((r) => (
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
                  Generado localmente — con lectura del setup guardado — Preview
                  del Reporte Maestro · Summer87 Leads v3
                </p>
              </div>
            </div>
          </div>

          {/* ── Informe para cliente ──────────────────────────────────────── */}
          {showClientReport && (
            <div className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 print:block">
              <div className="mb-5 flex flex-wrap items-start gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Informe para cliente
                    </h2>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                      Versión preliminar
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Resumen inicial de la información relevada para validar la
                    configuración del CRM antes de la activación operativa.
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    Documento para revisión con cliente
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-blue-500">
                  Resumen ejecutivo
                </p>
                <p className="text-xs leading-relaxed text-blue-700">
                  Este informe resume el estado general del Constructor CRM, los
                  bloques configurados y la próxima acción recomendada antes de
                  habilitar una activación operativa.
                </p>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">
                    Configuración
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-700">
                    {completedSetupSteps}/{totalSetupSteps}
                  </p>
                  <p className="mt-1 text-[11px] text-green-700">
                    pasos guardados
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                    Checklist
                  </p>
                  <p className="mt-1 text-2xl font-bold text-indigo-700">
                    {totalChecked}/{auditChecklist.length}
                  </p>
                  <p className="mt-1 text-[11px] text-indigo-700">
                    ítems completos
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Score
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">
                    {effectiveScore}/100
                  </p>
                  <p className="mt-1 text-[11px] text-blue-700">
                    preparación efectiva
                  </p>
                </div>
                <div className={`rounded-xl border p-4 ${cfg.wrapperClass}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Dictamen
                  </p>
                  <div className="mt-1 flex items-start gap-2">
                    <DictamenIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconColor}`} />
                    <p className={`text-sm font-bold leading-tight ${cfg.textColor}`}>
                      {cfg.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Bloques relevados
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {clientReportBlocks.map((block) => {
                    const BlockIcon = block.icon;
                    const isComplete = isSetupStepComplete(block.id);

                    return (
                      <div
                        key={block.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <div
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              isComplete ? "bg-green-100" : "bg-amber-100",
                            ].join(" ")}
                          >
                            <BlockIcon
                              className={[
                                "h-4 w-4",
                                isComplete ? "text-green-700" : "text-amber-700",
                              ].join(" ")}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">
                              {block.title}
                            </p>
                            <span
                              className={[
                                "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                                isComplete
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700",
                              ].join(" ")}
                            >
                              {isComplete ? "Completo" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          {block.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 print:block">
                <p className="mb-1 text-sm font-bold text-slate-900">
                  Validación de datos relevados
                </p>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
                  Use esta sección para revisar con el cliente cada consulta
                  realizada, confirmar los datos registrados y anotar correcciones
                  antes de activar el CRM operativo.
                </p>

                <div className="space-y-4">
                  {clientValidationSections.map((section) => {
                    const SectionIcon = section.icon;

                    return (
                      <div
                        key={section.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              section.status ? "bg-green-100" : "bg-amber-100",
                            ].join(" ")}
                          >
                            <SectionIcon
                              className={[
                                "h-4 w-4",
                                section.status ? "text-green-700" : "text-amber-700",
                              ].join(" ")}
                            />
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            {section.title}
                          </p>
                          <span
                            className={[
                              "ml-auto rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                              section.status
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {section.status ? "Completo" : "Pendiente"}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
                            <thead>
                              <tr className="border-b border-slate-100 bg-white text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="w-[24%] px-3 py-2 font-bold">
                                  Consulta / Pregunta realizada
                                </th>
                                <th className="w-[30%] px-3 py-2 font-bold">
                                  Respuesta registrada
                                </th>
                                <th className="w-[18%] px-3 py-2 font-bold">
                                  Validación cliente
                                </th>
                                <th className="w-[28%] px-3 py-2 font-bold">
                                  Corrección / Observaciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map((row) => (
                                <tr
                                  key={row.question}
                                  className="border-b border-slate-100 last:border-b-0"
                                >
                                  <td className="align-top px-3 py-3 font-semibold text-slate-700">
                                    {row.question}
                                  </td>
                                  <td className="align-top px-3 py-3 leading-relaxed text-slate-600">
                                    {row.value}
                                  </td>
                                  <td className="align-top px-3 py-3 text-slate-500">
                                    □ Correcto&nbsp;&nbsp;□ Corregir
                                  </td>
                                  <td className="align-top px-3 py-3">
                                    <div className="min-h-10 rounded border border-dashed border-slate-300 bg-slate-50/60" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                  Próxima acción sugerida
                </p>
                <p className="text-xs leading-relaxed text-green-800">
                  Revisar este informe con el cliente, validar la información
                  relevada y aprobar ajustes antes de habilitar la activación
                  operativa del CRM.
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                  Nota de alcance
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                  Este informe es una versión preliminar. La exportación PDF real
                  y la activación operativa se implementarán en una fase posterior.
                </p>
              </div>
            </div>
          )}

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
                      effectiveScore >= 80
                        ? "text-green-600"
                        : effectiveScore >= 55
                        ? "text-amber-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    {effectiveScore}
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
                      /{auditChecklist.length}
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

              <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Datos reales del setup
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {setupLoading
                    ? "Cargando configuración guardada..."
                    : `Configuración guardada: ${completedSetupSteps}/${totalSetupSteps} pasos previos con datos.`}
                </p>
                {setupError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {setupError}
                  </p>
                )}
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
                      {effectiveScore}/100
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
                  {allSetupStepsCompleted
                    ? "Recomendación: revisar y aprobar el Reporte Maestro con el cliente antes de activar el CRM operativo."
                    : effectiveScore >= 80
                    ? "Recomendación: avanzar a validación final con el cliente."
                    : effectiveScore >= 55
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
                  {VALIDATION_REPORT_STEPS.map((validationStep) => {
                    const StepIcon = validationStep.icon;
                    const displayStatus =
                      validationStep.id === "auditoria-final"
                        ? "En revisión"
                        : isSetupStepComplete(validationStep.id)
                        ? "Completo"
                        : "Pendiente";

                    return (
                      <div
                        key={validationStep.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-3 flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <StepIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Paso {validationStep.step}
                            </p>
                            <p className="truncate text-xs font-bold text-slate-800">
                              {validationStep.title}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-1.5">
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                              validationStep.importance === "Obligatorio"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {validationStep.importance}
                          </span>
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                              displayStatus === "Completo"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : displayStatus === "Pendiente"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-blue-200 bg-blue-50 text-blue-700",
                            ].join(" ")}
                          >
                            {displayStatus}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Qué se esperaba
                            </p>
                            <p className="text-[10px] leading-relaxed text-slate-600">
                              {validationStep.expected}
                            </p>
                          </div>
                          <div className="rounded-lg bg-blue-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-400">
                              Cómo se usará
                            </p>
                            <p className="text-[10px] leading-relaxed text-blue-700">
                              {validationStep.usage}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-3 py-2">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-500">
                              Tip para el cliente
                            </p>
                            <p className="text-[10px] leading-relaxed text-amber-700">
                              {validationStep.tip}
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

              {/* Próxima acción recomendada */}
              <div
                className={[
                  "mb-5 rounded-xl border p-5",
                  effectiveScore >= 80
                    ? "border-green-200 bg-green-50"
                    : effectiveScore >= 55
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50",
                ].join(" ")}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {effectiveScore >= 80 ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  ) : effectiveScore >= 55 ? (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                  )}
                  <p
                    className={[
                      "text-[10px] font-bold uppercase tracking-widest",
                      effectiveScore >= 80
                        ? "text-green-700"
                        : effectiveScore >= 55
                        ? "text-amber-700"
                        : "text-red-700",
                    ].join(" ")}
                  >
                    Próxima acción recomendada
                  </p>
                  <span
                    className={[
                      "ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      effectiveScore >= 80
                        ? "border-green-300 bg-white/70 text-green-700"
                        : effectiveScore >= 55
                        ? "border-amber-300 bg-white/70 text-amber-700"
                        : "border-red-300 bg-white/70 text-red-700",
                    ].join(" ")}
                  >
                    {effectiveScore >= 80
                      ? "Listo para validar"
                      : effectiveScore >= 55
                      ? "Revisión recomendada"
                      : "Bloqueado"}
                  </span>
                </div>
                <p
                  className={[
                    "mb-2 text-sm font-bold",
                    effectiveScore >= 80
                      ? "text-green-900"
                      : effectiveScore >= 55
                      ? "text-amber-900"
                      : "text-red-900",
                  ].join(" ")}
                >
                  {allSetupStepsCompleted
                    ? "Listo para validación final con cliente."
                    : effectiveScore >= 80
                    ? "CRM listo para validación final con cliente."
                    : effectiveScore >= 55
                    ? "Validar pendientes antes de activar el CRM."
                    : "No activar todavía."}
                </p>
                <p
                  className={[
                    "mb-4 text-xs leading-relaxed",
                    effectiveScore >= 80
                      ? "text-green-800"
                      : effectiveScore >= 55
                      ? "text-amber-800"
                      : "text-red-800",
                  ].join(" ")}
                >
                  {allSetupStepsCompleted
                    ? "Revisar y aprobar el Reporte Maestro con el cliente antes de activar el CRM operativo. La activación sigue deshabilitada hasta definir el flujo final de aprobación."
                    : effectiveScore >= 80
                    ? "El diseño visual del CRM tiene un nivel de preparación alto. El siguiente paso recomendado es revisar el reporte con el cliente, validar pendientes menores y confirmar si se puede avanzar hacia activación operativa."
                    : effectiveScore >= 55
                    ? "El diseño es aprobable, pero todavía requiere revisión técnica o comercial antes de activar el CRM. Conviene usar este reporte para alinear expectativas, confirmar pendientes y definir responsables."
                    : "La configuración todavía no tiene suficiente preparación para pasar a modo operativo. Es recomendable completar información crítica, revisar riesgos y volver a ejecutar la auditoría."}
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Score actual
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                      {effectiveScore}/100
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Riesgos altos
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                      {riesgosAltos}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Checklist
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">
                      {totalChecked}/{auditChecklist.length}
                    </p>
                  </div>
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

          {/* ── G: Condiciones para activar CRM ──────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="G" title="Condiciones para activar CRM" />
            <p className="mb-4 text-xs text-slate-500">
              La auditoría puede quedar lista para validación final, pero la
              activación operativa sigue bloqueada hasta cerrar permisos, flujo
              de producto y persistencia del estado activo.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {activationConditions.map((condition) => (
                <div
                  key={condition.label}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="mb-2 flex items-start gap-2">
                    {condition.complete ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : condition.status === "Prototipo" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    ) : (
                      <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <p className="text-xs font-semibold leading-snug text-slate-800">
                      {condition.label}
                    </p>
                  </div>
                  <span
                    className={[
                      "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                      condition.status === "Cumplido"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : condition.status === "Prototipo"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {condition.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── J: Preactivación ──────────────────────────────────────────── */}
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm font-bold text-green-900">
                CRM listo para preactivación controlada
              </p>
              <span className="ml-auto rounded-full border border-blue-200 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                Activación bloqueada
              </span>
            </div>
            <p className="text-xs leading-relaxed text-green-800">
              El Constructor ya tiene configuración suficiente para revisar con
              el cliente. La activación operativa queda bloqueada hasta definir
              permisos reales, flujo de activación y persistencia del estado
              activo.
            </p>
            <p className="mt-3 rounded-lg border border-green-200 bg-white/70 px-3 py-2 text-xs font-semibold text-green-800">
              Próximo paso: validar el Reporte Maestro con el cliente antes de
              habilitar Activar CRM.
            </p>
          </div>

          {!setupLoading && auditoriaReadiness ? (
            <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
              <p className="text-xs font-semibold text-slate-800">
                Avisos de cierre antes de activar (prototipo)
              </p>
              <p className="mt-1 mb-3 text-[11px] leading-relaxed text-slate-600">
                La activación real permanece bloqueada en esta fase.
              </p>
              <FieldQualityHint
                hint={auditoriaReadiness.fieldHints.datosBase}
                className="block text-[11px] leading-snug"
              />
              <FieldQualityHint
                hint={auditoriaReadiness.fieldHints.diagnosticoProceso}
                className="block text-[11px] leading-snug"
              />
              <FieldQualityHint
                hint={auditoriaReadiness.fieldHints.iaReportes}
                className="block text-[11px] leading-snug"
              />
              <FieldQualityHint
                hint={auditoriaReadiness.fieldHints.cierreActivacion}
                className="block text-[11px] leading-snug"
              />
            </div>
          ) : null}

          {/* ── K: Navegación ────────────────────────────────────────────── */}
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
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors print:hidden",
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
                  onClick={() => setShowClientReport((prev) => !prev)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors print:hidden",
                    showClientReport
                      ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {showClientReport
                    ? "Ocultar informe"
                    : "Ver informe para cliente"}
                </button>
                <button
                  type="button"
                  onClick={handlePrintClientReport}
                  disabled={!showClientReport}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors print:hidden",
                    showClientReport
                      ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300",
                  ].join(" ")}
                >
                  <FileText className="h-4 w-4" />
                  Imprimir / Guardar PDF
                </button>
                <button
                  type="button"
                  disabled={!canActivateCRM}
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-6 py-2.5 text-sm font-semibold text-white opacity-60 print:hidden"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Activar CRM
                </button>
              </div>
              <span className="max-w-xs text-right text-[11px] text-slate-400">
                {canPrepareActivation && !canActivateCRM
                  ? "Bloqueado por seguridad: falta implementar activación persistente y permisos reales."
                  : "Completar condiciones de auditoría antes de activar."}
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
