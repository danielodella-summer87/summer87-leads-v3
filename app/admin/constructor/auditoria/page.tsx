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
  Copy,
  Download,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StepReadinessPanel } from "@/components/constructor/StepReadinessPanel";
import type {
  BaseReadiness,
  SectionQuality,
  QualityStatus,
} from "@/lib/constructor/readiness/types";
import { STATUS_VALUE, READINESS_SUMMARY_LABEL } from "@/lib/constructor/readiness/statusStyles";
import { clampCompletionPercent, countSelectedValues } from "@/lib/constructor/readiness/helpers";
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

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function evaluateAuditoriaReadiness(setup: ConstructorSetup): BaseReadiness {
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
  const pasosMarcadosApi = arrayLength(setup?.completed_steps);
  const efectivoCompletados = Math.max(pasosMarcadosApi, pasosPreviosCubiertos);
  const readinessApi =
    typeof setup?.readiness_score === "number" && setup.readiness_score >= 0
      ? setup.readiness_score
      : null;
  const readinessDerivado = Math.round((pasosPreviosCubiertos / 7) * 100);
  const readinessUsar = readinessApi !== null ? readinessApi : readinessDerivado;

  let cierreActivacionStatus: QualityStatus;
  let cierreActivacionDetail: string;
  if (setup === null) {
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
  if (setup === null) {
    nextAction = "Cargá o reconectá la configuración del Constructor para evaluar el avance real.";
  } else if (datosBaseFaltantes >= 1) {
    nextAction = "Completá Empresa, Cuestionario y Documentos fuente como base mínima.";
  } else if (!diagnosticoOk || !procesoOk) {
    nextAction = "Reforzá diagnóstico comercial y proceso/pipeline antes de cerrar.";
  } else if (!motoresOk || !reportesOk) {
    nextAction = "Definí motores IA y reportes esperados por la organización.";
  } else if (cierreActivacionStatus === "danger") {
    nextAction = "Aumentá el contenido guardado en los pasos previos para estabilizar el cierre.";
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

function trimStrTechnical(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function pipelineSourceSummaryForSuggestions(pp: SetupRecord): string {
  const etapas = Array.isArray(pp.etapas) ? pp.etapas : [];
  const columnas = Array.isArray(pp.columnas) ? pp.columnas : [];
  const etapaNombres = etapas
    .map((e) => trimStrTechnical(asRecord(e).nombre))
    .filter((s) => s.length > 0);
  const columnaNombres = columnas
    .map((c) => trimStrTechnical(asRecord(c).nombre))
    .filter((s) => s.length > 0);
  const parts: string[] = [];
  if (etapaNombres.length > 0) {
    parts.push(
      `procesoPipeline.etapas (${etapaNombres.length}): ${etapaNombres.slice(0, 8).join(", ")}`
    );
  }
  if (columnaNombres.length > 0) {
    parts.push(
      `procesoPipeline.columnas (${columnaNombres.length}): ${columnaNombres.slice(0, 8).join(", ")}`
    );
  }
  if (parts.length === 0) {
    return "procesoPipeline (sin etapas/columnas con nombre en esta vista)";
  }
  return parts.join(" · ");
}

function pipelineGanadoPerdidoSnippet(pp: SetupRecord): string {
  const columnas = Array.isArray(pp.columnas) ? pp.columnas : [];
  const ganPerd = columnas
    .filter((c) => {
      const r = asRecord(c);
      const t = typeof r.tipo === "string" ? r.tipo : "";
      return t === "ganada" || t === "perdida";
    })
    .map((c) => trimStrTechnical(asRecord(c).nombre))
    .filter((s) => s.length > 0);
  if (ganPerd.length > 0) {
    return `procesoPipeline.columnas (${ganPerd.join(" · ")})`;
  }
  return "procesoPipeline.columnas (ganado/perdido cuando existan en el pipeline)";
}

function motoresSourceSummaryForSuggestions(mi: SetupRecord): string {
  const motores = Array.isArray(mi.motores) ? mi.motores : [];
  const nombres = motores
    .map((m) => trimStrTechnical(asRecord(m).nombre))
    .filter((s) => s.length > 0);
  if (nombres.length === 0) {
    return "motoresIA.motores (sin nombres en esta vista)";
  }
  return `motoresIA.motores (${motores.length}): ${nombres.slice(0, 10).join(", ")}`;
}

/** Fase 5E: propuesta local determinística cuando no hay reportes guardados en setup. */
function buildSuggestedReportsFromTechnicalJson(input: {
  empresa: SetupRecord;
  cuestionario: SetupRecord;
  procesoPipeline: SetupRecord;
  motoresIA: SetupRecord;
}): Record<string, unknown> {
  const { empresa, cuestionario, procesoPipeline, motoresIA } = input;

  const queVendeEmpresa = trimStrTechnical(empresa.queVende);
  const queVendeDetalle = trimStrTechnical(cuestionario.queVendeDetalle);
  const queVendeLine =
    queVendeDetalle.length > 0
      ? queVendeDetalle
      : queVendeEmpresa.length > 0
        ? queVendeEmpresa
        : "oferta descrita en empresa/cuestionario";

  const procesoActual = trimStrTechnical(cuestionario.procesoActual);
  const queBloquea = trimStrTechnical(cuestionario.queBloquea);
  const redes = trimStrTechnical(empresa.redes);
  const sitioWeb = trimStrTechnical(empresa.sitioWeb);

  const canalTokens = [procesoActual, redes, sitioWeb].filter((s) => s.length > 0);
  const canalFuente =
    canalTokens.length > 0
      ? `cuestionario.procesoActual / empresa.redes / empresa.sitioWeb (${canalTokens.join(" · ")})`
      : "cuestionario.procesoActual · empresa.redes · empresa.sitioWeb (sin texto en esta vista)";

  const pipelineRes = pipelineSourceSummaryForSuggestions(procesoPipeline);
  const motoresRes = motoresSourceSummaryForSuggestions(motoresIA);
  const ganadoPerdidoFuente = pipelineGanadoPerdidoSnippet(procesoPipeline);

  const nombreEmpresa =
    trimStrTechnical(empresa.nombreComercial) ||
    trimStrTechnical(empresa.nombreLegal) ||
    "empresa del Constructor";

  const resumenModulos = [nombreEmpresa, procesoActual, pipelineRes.split(" · ")[0] ?? ""]
    .filter((s) => s.length > 0)
    .join(" · ");

  const reportesSugeridos: Record<string, unknown>[] = [
    {
      id: "r1",
      nombre: "Reporte de oportunidades por etapa",
      objetivo: "Ver cuántos leads hay en cada etapa del pipeline.",
      fuente: pipelineRes,
      metricas: [
        "Cantidad de oportunidades",
        "Etapa actual",
        "Días en etapa",
      ],
      frecuenciaSugerida: "Semanal",
      audiencia: "Comercial",
      estado: "sugerido",
    },
    {
      id: "r2",
      nombre: "Reporte de oportunidades sin seguimiento",
      objetivo: "Detectar consultas o leads que quedaron sin acción reciente.",
      fuente: `${pipelineRes} · tareas y reglas de seguimiento del proceso`,
      metricas: [
        "Días sin contacto",
        "Responsable",
        "Canal de origen",
      ],
      frecuenciaSugerida: "Diaria",
      audiencia: "Comercial",
      estado: "sugerido",
    },
    {
      id: "r3",
      nombre: "Reporte de productos o servicios más consultados",
      objetivo:
        "Entender qué líneas o accesorios concentran la demanda comercial.",
      fuente: `empresa.queVende / cuestionario.queVendeDetalle (${queVendeLine})`,
      metricas: [
        "Producto o servicio consultado",
        "Cantidad de consultas",
        "Tasa de cierre futura",
      ],
      frecuenciaSugerida: "Semanal",
      audiencia: "Comercial",
      estado: "sugerido",
    },
    {
      id: "r4",
      nombre: "Reporte de canales de origen",
      objetivo: "Medir de dónde llegan las oportunidades y su calidad relativa.",
      fuente: canalFuente,
      metricas: ["Canal", "Cantidad de leads", "Conversión futura"],
      frecuenciaSugerida: "Semanal",
      audiencia: "Operaciones",
      estado: "sugerido",
    },
    {
      id: "r5",
      nombre: "Reporte de ventas ganadas y perdidas",
      objetivo:
        "Entender cierres, motivos de pérdida y aprendizajes comerciales.",
      fuente:
        queBloquea.length > 0
          ? `${ganadoPerdidoFuente} · cuestionario.queBloquea (${queBloquea.slice(0, 160)})`
          : `${ganadoPerdidoFuente} · cuestionario.queBloquea`,
      metricas: [
        "Oportunidades ganadas",
        "Oportunidades perdidas",
        "Motivo de pérdida",
        "Etapa de pérdida",
      ],
      frecuenciaSugerida: "Mensual",
      audiencia: "Dirección",
      estado: "sugerido",
    },
    {
      id: "r6",
      nombre: "Reporte de performance de IA",
      objetivo:
        "Revisar qué motores IA están activos, en qué etapa intervienen y su riesgo.",
      fuente: motoresRes,
      metricas: [
        "Motor",
        "Etapa",
        "Activo",
        "Requiere validación humana",
        "Riesgo",
      ],
      frecuenciaSugerida: "Semanal",
      audiencia: "Operaciones",
      estado: "sugerido",
    },
    {
      id: "r7",
      nombre: "Reporte ejecutivo semanal",
      objetivo:
        "Resumir la salud comercial para dirección a partir de los módulos ya cargados.",
      fuente:
        resumenModulos.length > 0
          ? `Consolidado desde módulos del Constructor (${resumenModulos})`
          : "Consolidado desde empresa, cuestionario, procesoPipeline y motoresIA",
      metricas: [
        "Leads nuevos",
        "Oportunidades abiertas",
        "Seguimiento pendiente",
        "Ventas cerradas",
        "Riesgos",
      ],
      frecuenciaSugerida: "Semanal",
      audiencia: "Dirección",
      estado: "sugerido",
    },
  ];

  return {
    origen: "sugerido_local",
    notaValidacion:
      "Reportes sugeridos localmente · Pendientes de validación humana",
    reportesSugeridos,
  };
}

function textMentionsCanalesDispersos(value: string): boolean {
  const low = value.toLowerCase();
  return (
    low.includes("instagram") ||
    low.includes("whatsapp") ||
    low.includes("facebook") ||
    low.includes("tiktok") ||
    low.includes("web") ||
    low.includes("referid") ||
    low.includes("local")
  );
}

/** Fase 5F: diagnóstico comercial sugerido localmente cuando setup.diagnostico está vacío. */
function buildSuggestedDiagnosisFromTechnicalJson(input: {
  empresa: SetupRecord;
  cuestionario: SetupRecord;
  procesoPipeline: SetupRecord;
  motoresIA: SetupRecord;
  reportes: SetupRecord;
}): Record<string, unknown> {
  const { empresa, cuestionario, procesoPipeline, motoresIA, reportes } = input;

  const nombreComercial = trimStrTechnical(empresa.nombreComercial);
  const nombreLegal = trimStrTechnical(empresa.nombreLegal);
  const nombreEmpresa =
    nombreComercial.length > 0
      ? nombreComercial
      : nombreLegal.length > 0
        ? nombreLegal
        : "La empresa";

  const rubroNombre = trimStrTechnical(empresa.rubro);
  const rubroPers = trimStrTechnical(empresa.rubroPersonalizado);
  const rubroLine =
    rubroNombre.length > 0
      ? rubroNombre
      : rubroPers.length > 0
        ? rubroPers
        : "rubro no detallado en Empresa";
  const vertical = trimStrTechnical(empresa.vertical);
  const rubroVerticalLine = [rubroLine, vertical].filter((s) => s.length > 0).join(" · ");

  const procesoActual = trimStrTechnical(cuestionario.procesoActual);
  const queVendeEmpresa = trimStrTechnical(empresa.queVende);
  const queVendeDetalle = trimStrTechnical(cuestionario.queVendeDetalle);
  const queVendeLine =
    queVendeDetalle.length > 0
      ? queVendeDetalle
      : queVendeEmpresa.length > 0
        ? queVendeEmpresa
        : "su oferta comercial (completar qué vende en Empresa/Cuestionario)";

  const queBloquea = trimStrTechnical(cuestionario.queBloquea);
  const comentariosAdicionales = trimStrTechnical(cuestionario.comentariosAdicionales);
  const decisionesNoIA = trimStrTechnical(cuestionario.decisionesNoIA);
  const dondeAyudarIA = trimStrTechnical(cuestionario.dondeAyudarIA);
  const queVerDireccion = trimStrTechnical(cuestionario.queVerDireccion);
  const redes = trimStrTechnical(empresa.redes);

  const reportesSugArr = Array.isArray(reportes.reportesSugeridos)
    ? reportes.reportesSugeridos
    : [];
  const nombresReportesSugeridos = reportesSugArr
    .map((r) => trimStrTechnical(asRecord(r).nombre))
    .filter((s) => s.length > 0);

  const motoresArr = Array.isArray(motoresIA.motores) ? motoresIA.motores : [];
  const nombresMotores = motoresArr
    .map((m) => trimStrTechnical(asRecord(m).nombre))
    .filter((s) => s.length > 0);

  const resumenComercial = [
    `${nombreEmpresa} se describe en el Constructor con rubro/vertical (${rubroVerticalLine}).`,
    procesoActual.length > 0
      ? `El proceso comercial actual indicado en cuestionario: ${procesoActual.slice(0, 220)}.`
      : "Aún no hay un procesoActual explícito en cuestionario; conviene detallarlo en el paso Cuestionario.",
    `La oferta relevante para CRM: ${queVendeLine.slice(0, 240)}.`,
    "La vista sugiere ordenar seguimiento de oportunidades, registro de consultas y medición comercial al integrar un CRM.",
  ].join(" ");

  const problemasPrimary: string[] = [];
  if (queBloquea.length > 0) {
    problemasPrimary.push(
      `Fricción o bloqueo declarado en cuestionario (queBloquea): ${queBloquea.slice(0, 200)}.`
    );
  }
  if (procesoActual.length > 0 && textMentionsCanalesDispersos(procesoActual)) {
    problemasPrimary.push(
      "Conversaciones o consultas potencialmente dispersas entre canales mencionados en procesoActual."
    );
  }
  if (comentariosAdicionales.length > 0 && textMentionsCanalesDispersos(comentariosAdicionales)) {
    problemasPrimary.push(
      "Comentarios adicionales sugieren múltiples canales o puntos de contacto sin consolidar."
    );
  }
  if (decisionesNoIA.length > 0) {
    problemasPrimary.push(
      `Decisiones sensibles declaradas como no automatizables por IA: ${decisionesNoIA.slice(0, 180)}.`
    );
  }
  if (redes.length > 0 && procesoActual.length > 0) {
    problemasPrimary.push(
      "Coexistencia de redes y proceso comercial manual: riesgo de duplicar esfuerzos si no hay CRM único."
    );
  }

  const problemasFallback = [
    "Falta de seguimiento posterior a la consulta inicial.",
    "Riesgo de perder oportunidades por falta de registro centralizado.",
    "Dudas de compatibilidad del producto con el vehículo o contexto del cliente.",
    "Falta de visibilidad sobre productos más consultados.",
    "Dificultad para priorizar consultas con mayor intención de compra.",
    "Acuerdos comerciales sin trazabilidad en una única vista operativa.",
  ];
  const problemasDetectados: string[] = [];
  const seenProb = new Set<string>();
  function pushProb(s: string) {
    const t = s.trim();
    if (!t || seenProb.has(t) || problemasDetectados.length >= 7) return;
    seenProb.add(t);
    problemasDetectados.push(t);
  }
  for (const p of problemasPrimary) pushProb(p);
  for (const f of problemasFallback) {
    if (problemasDetectados.length >= 7) break;
    pushProb(f);
  }
  let probFillIdx = 0;
  while (problemasDetectados.length < 4 && problemasFallback.length > 0) {
    const f = problemasFallback[probFillIdx % problemasFallback.length];
    probFillIdx += 1;
    pushProb(`${f} (detalle ${probFillIdx})`);
  }

  const oportunidadesPrimary: string[] = [];
  if (dondeAyudarIA.length > 0) {
    oportunidadesPrimary.push(
      `Aprovechar IA donde el cuestionario ya lo anticipa: ${dondeAyudarIA.slice(0, 200)}.`
    );
  }
  if (queVerDireccion.length > 0) {
    oportunidadesPrimary.push(
      `Visibilidad para dirección alineada a: ${queVerDireccion.slice(0, 180)}.`
    );
  }
  if (nombresMotores.length > 0) {
    oportunidadesPrimary.push(
      `Usar motores IA ya definidos (${nombresMotores.slice(0, 5).join(", ")}) para investigación, diagnóstico y seguimiento.`
    );
  }
  for (const nr of nombresReportesSugeridos.slice(0, 4)) {
    oportunidadesPrimary.push(`Formalizar en CRM el reporte sugerido: «${nr}».`);
  }
  if (procesoActual.length > 0) {
    oportunidadesPrimary.push(
      "Priorizar oportunidades sin seguimiento según el proceso declarado."
    );
  }

  const oportunidadesFallback = [
    "Medir canales de origen y calidad de leads.",
    "Identificar productos o líneas con mayor demanda.",
    "Generar reportes ejecutivos semanales a partir del pipeline.",
    "Centralizar notas y próximos pasos por oportunidad.",
  ];
  const oportunidadesDetectadas: string[] = [];
  const seenOpp = new Set<string>();
  function pushOpp(s: string) {
    const t = s.trim();
    if (!t || seenOpp.has(t) || oportunidadesDetectadas.length >= 7) return;
    seenOpp.add(t);
    oportunidadesDetectadas.push(t);
  }
  for (const o of oportunidadesPrimary) pushOpp(o);
  for (const f of oportunidadesFallback) {
    if (oportunidadesDetectadas.length >= 7) break;
    pushOpp(f);
  }
  let oppFillIdx = 0;
  while (oportunidadesDetectadas.length < 4) {
    const f = oportunidadesFallback[oppFillIdx % oportunidadesFallback.length];
    oppFillIdx += 1;
    pushOpp(`${f} (perspectiva ${oppFillIdx})`);
  }

  const riesgosPrimary: string[] = [];
  if (decisionesNoIA.length > 0) {
    riesgosPrimary.push(
      "Comprometer stock, plazos o condiciones sin validación humana explícita en flujo."
    );
  }
  for (const m of motoresArr) {
    const r = asRecord(m);
    const nom = trimStrTechnical(r.nombre);
    const riesgo = typeof r.riesgo === "string" ? r.riesgo.toLowerCase() : "";
    if (nom && (riesgo === "alto" || riesgo === "medio")) {
      riesgosPrimary.push(
        `Motor «${nom}» con riesgo ${riesgo}: revisar outputs antes de enviar al cliente.`
      );
    }
    if (nom && r.requiereValidacionHumana === true) {
      riesgosPrimary.push(
        `Motor «${nom}» requiere validación humana: evitar envío automático sin revisión.`
      );
    }
  }
  const etapas = Array.isArray(procesoPipeline.etapas) ? procesoPipeline.etapas : [];
  for (const e of etapas) {
    const er = asRecord(e);
    if (er.requiereValidacionHumana === true) {
      const en = trimStrTechnical(er.nombre);
      if (en.length > 0) {
        riesgosPrimary.push(
          `Etapa «${en}» del pipeline requiere control humano antes de prometer condiciones.`
        );
      }
    }
  }

  const riesgosFallback = [
    "Enviar propuestas generadas por IA sin revisión comercial.",
    "Prometer condiciones comerciales sin aprobación registrada.",
    "Falta de control humano en etapas críticas de negociación o cierre.",
  ];
  const riesgosOperativos: string[] = [];
  const seenR = new Set<string>();
  function pushR(s: string) {
    const t = s.trim();
    if (!t || seenR.has(t) || riesgosOperativos.length >= 6) return;
    seenR.add(t);
    riesgosOperativos.push(t);
  }
  for (const x of riesgosPrimary) pushR(x);
  for (const f of riesgosFallback) {
    if (riesgosOperativos.length >= 6) break;
    pushR(f);
  }
  let riesgoFillIdx = 0;
  while (riesgosOperativos.length < 3) {
    const f = riesgosFallback[riesgoFillIdx % riesgosFallback.length];
    riesgoFillIdx += 1;
    pushR(`${f} (refuerzo ${riesgoFillIdx})`);
  }

  const recomPrimary: string[] = [];
  if (queBloquea.length > 0) {
    recomPrimary.push(
      "Registrar en CRM el bloqueo declarado y asociarlo a etapas o motivos de pérdida."
    );
  }
  recomPrimary.push("Centralizar consultas en un CRM único con historial por lead.");
  recomPrimary.push("Definir campos mínimos de calificación antes de avanzar etapas.");
  recomPrimary.push("Crear alertas de seguimiento por días sin contacto.");
  if (queVendeLine.length > 0) {
    recomPrimary.push(
      "Registrar producto consultado y contexto del vehículo o instalación cuando aplique."
    );
  }
  recomPrimary.push("Revisar manualmente propuestas y borradores generados por motores IA.");
  recomPrimary.push(
    "Usar reportes semanales de oportunidades, productos y canales ya sugeridos en el JSON técnico."
  );

  const recomFallback = [
    "Documentar próxima acción y responsable en cada oportunidad abierta.",
    "Sincronizar canales digitales con reglas de ingreso al pipeline.",
  ];
  const recomendacionesIniciales: string[] = [];
  const seenRec = new Set<string>();
  function pushRec(s: string) {
    const t = s.trim();
    if (!t || seenRec.has(t) || recomendacionesIniciales.length >= 7) return;
    seenRec.add(t);
    recomendacionesIniciales.push(t);
  }
  for (const x of recomPrimary) pushRec(x);
  for (const f of recomFallback) {
    if (recomendacionesIniciales.length >= 7) break;
    pushRec(f);
  }
  let recFillIdx = 0;
  while (recomendacionesIniciales.length < 4) {
    const f = recomFallback[recFillIdx % recomFallback.length];
    recFillIdx += 1;
    pushRec(`${f} (refuerzo ${recFillIdx})`);
  }

  const camposCriticosParaCRM = [
    "canal_origen",
    "producto_consultado",
    "marca_vehiculo",
    "modelo_vehiculo",
    "anio_vehiculo",
    "disponibilidad_stock",
    "requiere_instalacion",
    "responsable",
    "proxima_accion",
    "fecha_ultimo_contacto",
    "motivo_perdida",
  ];

  return {
    origen: "sugerido_local",
    notaValidacion:
      "Diagnóstico sugerido localmente. Requiere revisión humana antes de activar CRM real.",
    diagnosticoSugerido: {
      resumenComercial,
      problemasDetectados,
      oportunidadesDetectadas,
      riesgosOperativos,
      recomendacionesIniciales,
      camposCriticosParaCRM,
    },
  };
}

/** Fase 5G: documentos fuente sugeridos localmente cuando setup.documentos está vacío. */
function buildSuggestedDocumentsFromTechnicalJson(input: {
  empresa: SetupRecord;
  cuestionario: SetupRecord;
  procesoPipeline: SetupRecord;
  motoresIA: SetupRecord;
  reportes: SetupRecord;
  diagnostico: SetupRecord;
}): Record<string, unknown> {
  const { empresa, cuestionario, procesoPipeline, motoresIA, reportes, diagnostico } =
    input;

  const queVendeEmpresa = trimStrTechnical(empresa.queVende);
  const queVendeDetalle = trimStrTechnical(cuestionario.queVendeDetalle);
  const queVendeFuente =
    queVendeDetalle.length > 0
      ? `empresa.queVende / cuestionario.queVendeDetalle (${queVendeDetalle.slice(0, 120)})`
      : queVendeEmpresa.length > 0
        ? `empresa.queVende (${queVendeEmpresa.slice(0, 120)})`
        : "empresa.queVende / cuestionario.queVendeDetalle";

  const decisionesNoIA = trimStrTechnical(cuestionario.decisionesNoIA);
  const tipoCotizacion = trimStrTechnical(cuestionario.tipoCotizacion);
  const queBloquea = trimStrTechnical(cuestionario.queBloquea);
  const procesoActual = trimStrTechnical(cuestionario.procesoActual);
  const comentariosAdicionales = trimStrTechnical(cuestionario.comentariosAdicionales);
  const motivosPerdida = trimStrTechnical(cuestionario.motivosPerdida);
  const queVerDireccion = trimStrTechnical(cuestionario.queVerDireccion);

  const pipelineRes = pipelineSourceSummaryForSuggestions(procesoPipeline);
  const motoresRes = motoresSourceSummaryForSuggestions(motoresIA);

  const reportesSugArr = Array.isArray(reportes.reportesSugeridos)
    ? reportes.reportesSugeridos
    : [];
  const nombresReportesSugeridos = reportesSugArr
    .map((r) => trimStrTechnical(asRecord(r).nombre))
    .filter((s) => s.length > 0);

  const diagSug = asRecord(asRecord(diagnostico).diagnosticoSugerido);
  const camposCriticosRaw = Array.isArray(diagSug.camposCriticosParaCRM)
    ? diagSug.camposCriticosParaCRM
    : [];
  const camposCriticosStr = camposCriticosRaw
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .slice(0, 11)
    .join(", ");
  const camposFuente =
    camposCriticosStr.length > 0
      ? `diagnostico.diagnosticoSugerido.camposCriticosParaCRM (${camposCriticosStr})`
      : "diagnostico.diagnosticoSugerido.camposCriticosParaCRM";

  const cotizFuente =
    decisionesNoIA.length > 0 || tipoCotizacion.length > 0
      ? `cuestionario.decisionesNoIA / tipoCotizacion (${[decisionesNoIA.slice(0, 100), tipoCotizacion].filter((s) => s.length > 0).join(" · ")})`
      : "cuestionario.decisionesNoIA · tipoCotizacion";

  const stockFuente =
    queBloquea.length > 0 || decisionesNoIA.length > 0
      ? `cuestionario.queBloquea / decisionesNoIA (${[queBloquea.slice(0, 100), decisionesNoIA.slice(0, 80)].filter((s) => s.length > 0).join(" · ")})`
      : "cuestionario.queBloquea · decisionesNoIA";

  const faqFuente =
    queVendeFuente.includes("(") || queBloquea.length > 0
      ? `${queVendeFuente.split("(")[0]?.trim() ?? queVendeFuente} · cuestionario.queBloquea`
      : "empresa.queVende · cuestionario.queBloquea";

  const plantillasFuente =
    procesoActual.length > 0 || comentariosAdicionales.length > 0
      ? `cuestionario.procesoActual / comentariosAdicionales (${[procesoActual.slice(0, 100), comentariosAdicionales.slice(0, 80)].filter((s) => s.length > 0).join(" · ")})`
      : "cuestionario.procesoActual · comentariosAdicionales";

  const perdidaFuente =
    queBloquea.length > 0 || motivosPerdida.length > 0
      ? `cuestionario.queBloquea / motivosPerdida (${[queBloquea.slice(0, 90), motivosPerdida.slice(0, 90)].filter((s) => s.length > 0).join(" · ")})`
      : "cuestionario.queBloquea · motivosPerdida";

  const reportesNombresSlice = nombresReportesSugeridos.slice(0, 5).join(", ");
  const guiaReportesFuente =
    reportesNombresSlice.length > 0
      ? `reportes.reportesSugeridos (${reportesNombresSlice}) · cuestionario.queVerDireccion`
      : "reportes.reportesSugeridos · cuestionario.queVerDireccion";
  const queVerFuente =
    queVerDireccion.length > 0
      ? `${guiaReportesFuente} (${queVerDireccion.slice(0, 120)})`
      : guiaReportesFuente;

  const documentosSugeridos: Record<string, unknown>[] = [
    {
      id: "d1",
      nombre: "Catálogo de productos / servicios",
      objetivo:
        "Documentar accesorios, líneas, variantes y descripciones comerciales.",
      prioridad: "alta",
      fuente: queVendeFuente,
      usoCRM:
        "Alimentar campos de producto consultado, propuestas y recomendaciones IA.",
      estado: "sugerido",
    },
    {
      id: "d2",
      nombre: "Lista de precios y condiciones comerciales",
      objetivo: "Evitar cotizaciones inconsistentes y desalineadas con política comercial.",
      prioridad: "alta",
      fuente: cotizFuente,
      usoCRM:
        "Apoyar cotizaciones, aprobaciones humanas y límites de IA en propuestas.",
      estado: "sugerido",
    },
    {
      id: "d3",
      nombre: "Política de stock, disponibilidad e instalación",
      objetivo:
        "Evitar promesas incorrectas de stock, fechas de entrega o instalación.",
      prioridad: "alta",
      fuente: stockFuente,
      usoCRM: "Reglas de avance en pipeline, alertas y validaciones humanas.",
      estado: "sugerido",
    },
    {
      id: "d4",
      nombre: "Preguntas frecuentes de compatibilidad",
      objetivo:
        "Responder dudas por marca, modelo, año y tipo de vehículo o contexto de uso.",
      prioridad: "media",
      fuente: faqFuente,
      usoCRM: "Guiar calificación inicial y respuestas asistidas en primer contacto.",
      estado: "sugerido",
    },
    {
      id: "d5",
      nombre: "Plantillas de respuesta para WhatsApp, Instagram y web",
      objetivo: "Estandarizar el primer contacto y seguimientos por canal.",
      prioridad: "media",
      fuente: plantillasFuente,
      usoCRM: "Alimentar seguimiento inteligente y mensajes sugeridos en el CRM.",
      estado: "sugerido",
    },
    {
      id: "d6",
      nombre: "Guía de motivos de pérdida y objeciones frecuentes",
      objetivo:
        "Registrar por qué se pierden oportunidades y capturar objeciones típicas.",
      prioridad: "media",
      fuente: perdidaFuente,
      usoCRM: "Alimentar reportes de pérdida y diagnóstico comercial.",
      estado: "sugerido",
    },
    {
      id: "d7",
      nombre: "Criterios de calificación de oportunidades",
      objetivo: "Definir cuándo un lead avanza o no avanza en el embudo.",
      prioridad: "alta",
      fuente: `procesoPipeline.etapas / columnas (${pipelineRes})`,
      usoCRM: "Reglas de pipeline y scoring comercial futuro.",
      estado: "sugerido",
    },
    {
      id: "d8",
      nombre: "Manual interno de validación humana",
      objetivo: "Definir qué decisiones no puede tomar la IA sin supervisión.",
      prioridad: "alta",
      fuente: `cuestionario.decisionesNoIA · ${motoresRes}`,
      usoCRM: "Límites de IA, validadores y trazas de auditoría.",
      estado: "sugerido",
    },
    {
      id: "d9",
      nombre: "Guía de reportes comerciales",
      objetivo: "Definir métricas, audiencia y frecuencia de lectura dirección/comercial.",
      prioridad: "media",
      fuente: queVerFuente,
      usoCRM: "Validar dashboards y reportes semanales antes de go-live.",
      estado: "sugerido",
    },
    {
      id: "d10",
      nombre: "Glosario de campos críticos del CRM",
      objetivo: "Estandarizar nombres y significado de campos mínimos del negocio.",
      prioridad: "media",
      fuente: camposFuente,
      usoCRM: "Configuración futura de entidades y campos en el CRM.",
      estado: "sugerido",
    },
  ];

  return {
    origen: "sugerido_local",
    notaValidacion:
      "Documentos fuente sugeridos localmente. Requieren carga o validación humana antes de activar CRM real.",
    documentosSugeridos,
  };
}

/** JSON técnico de solo lectura (Fase 5A): armado sólo desde setup + readiness local; sin merges de contratos riesgosos. */
function buildConstructorTechnicalJson(
  setupData: ConstructorSetup | undefined | null,
  auditoriaReadiness: BaseReadiness | null | undefined
): Record<string, unknown> {
  const setupRecord = asRecord(setupData ?? null);

  const readiness = auditoriaReadiness;
  const rawSections =
    readiness && Array.isArray(readiness.sections) ? readiness.sections : [];

  const safeSections = rawSections.filter(
    (s): s is SectionQuality =>
      Boolean(s) && typeof s === "object" && "key" in s && "status" in s
  );

  const pendientes: string[] = [];
  for (const s of safeSections) {
    if (s.status !== "good") {
      const label = typeof s.label === "string" ? s.label : "Bloque";
      const detail = typeof s.detail === "string" ? s.detail : "";
      pendientes.push(
        detail ? `${label}: ${detail}` : `${label}: pendiente de revisión`
      );
    }
  }

  const serializableSections = safeSections.map((s) => ({
    key: typeof s.key === "string" ? s.key : "",
    label: typeof s.label === "string" ? s.label : "",
    status: s.status,
    detail: typeof s.detail === "string" ? s.detail : "",
  }));

  const empresaOut = asRecord(setupRecord?.empresa);
  const cuestionarioOut = asRecord(setupRecord?.cuestionario);
  const documentosBase = asRecord(setupRecord?.documentos);
  const diagnosticoBase = asRecord(setupRecord?.diagnostico);
  const procesoPipelineOut = asRecord(
    setupRecord?.procesoPipeline ?? setupRecord?.proceso_pipeline
  );
  const motoresIAOut = asRecord(setupRecord?.motoresIA ?? setupRecord?.motores_ia);
  const reportesBase = asRecord(setupRecord?.reportes);

  const reportesOut =
    Object.keys(reportesBase).length > 0
      ? reportesBase
      : buildSuggestedReportsFromTechnicalJson({
          empresa: empresaOut,
          cuestionario: cuestionarioOut,
          procesoPipeline: procesoPipelineOut,
          motoresIA: motoresIAOut,
        });

  const diagnosticoOut =
    Object.keys(diagnosticoBase).length > 0
      ? diagnosticoBase
      : buildSuggestedDiagnosisFromTechnicalJson({
          empresa: empresaOut,
          cuestionario: cuestionarioOut,
          procesoPipeline: procesoPipelineOut,
          motoresIA: motoresIAOut,
          reportes: reportesOut,
        });

  const documentosOut =
    Object.keys(documentosBase).length > 0
      ? documentosBase
      : buildSuggestedDocumentsFromTechnicalJson({
          empresa: empresaOut,
          cuestionario: cuestionarioOut,
          procesoPipeline: procesoPipelineOut,
          motoresIA: motoresIAOut,
          reportes: reportesOut,
          diagnostico: diagnosticoOut,
        });

  const motoresSetupOk = Object.keys(motoresIAOut).length > 0;
  const reportesRecOut = asRecord(reportesOut);
  const reportesEsSugerido =
    reportesRecOut.origen === "sugerido_local" &&
    Array.isArray(reportesRecOut.reportesSugeridos) &&
    reportesRecOut.reportesSugeridos.length > 0;

  const diagnosticoRecOut = asRecord(diagnosticoOut);
  const diagnosticoEsSugerido =
    diagnosticoRecOut.origen === "sugerido_local" &&
    typeof diagnosticoRecOut.diagnosticoSugerido === "object" &&
    diagnosticoRecOut.diagnosticoSugerido !== null &&
    !Array.isArray(diagnosticoRecOut.diagnosticoSugerido);

  const documentosRecOut = asRecord(documentosOut);
  const documentosEsSugerido =
    documentosRecOut.origen === "sugerido_local" &&
    Array.isArray(documentosRecOut.documentosSugeridos) &&
    documentosRecOut.documentosSugeridos.length > 0;

  const pipelineSetupOk = Object.keys(procesoPipelineOut).length > 0;
  const empresaDatosBaseOk = hasSetupData(setupRecord?.empresa);
  const cuestionarioDatosBaseOk = hasSetupData(setupRecord?.cuestionario);
  const documentosSetupVacio = Object.keys(documentosBase).length === 0;

  let pendientesOut = pendientes;
  if (reportesEsSugerido && motoresSetupOk) {
    pendientesOut = pendientesOut.filter((line) => !line.startsWith("IA y reportes:"));
  }
  if (diagnosticoEsSugerido && pipelineSetupOk) {
    pendientesOut = pendientesOut.map((line) =>
      line.startsWith("Diagnóstico y proceso:")
        ? "Diagnóstico y proceso: Diagnóstico sugerido localmente pendiente de validación humana; proceso/pipeline tiene datos cargados."
        : line
    );
  }
  if (
    documentosEsSugerido &&
    empresaDatosBaseOk &&
    cuestionarioDatosBaseOk &&
    documentosSetupVacio
  ) {
    pendientesOut = pendientesOut.map((line) =>
      line.startsWith("Datos base:")
        ? "Datos base: Documentos fuente: propuesta sugerida localmente pendiente de carga o validación humana."
        : line
    );
  }

  return {
    metadata: {
      version: "prototype-v1",
      source: "constructor_auditoria_frontend",
      generatedFrom: "crm_setup_config",
      prototypeMode: true,
    },
    empresa: empresaOut,
    cuestionario: cuestionarioOut,
    documentos: documentosOut,
    diagnostico: diagnosticoOut,
    procesoPipeline: procesoPipelineOut,
    motoresIA: motoresIAOut,
    reportes: reportesOut,
    auditoria: {
      readiness: {
        completionPercent: readiness?.completionPercent ?? 0,
        overallStatus: readiness?.overallStatus ?? "neutral",
        overallLabel:
          readiness?.overallLabel ?? "Pendiente",
        nextAction:
          readiness?.nextAction ?? "Completar configuración previa.",
        sections: serializableSections,
      },
      activation: {
        prototypeMode: true,
        realActivationEnabled: false,
        message: "Activación real bloqueada en esta fase.",
      },
    },
    pendientes: pendientesOut,
  };
}

/** Vista de solo lectura derivada sólo del JSON técnico (Fase 5B). Sin contratos externos. */
function strFieldTechnical(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "No definido";
}

function structuralBlockStatus(recordUnknown: unknown): "Configurado" | "Pendiente" {
  return Object.keys(asRecord(recordUnknown)).length > 0
    ? "Configurado"
    : "Pendiente";
}

type TechnicalBlockKind = "reportes" | "diagnostico" | "documentos";

type TechnicalBlockVM = {
  status: "configured" | "suggested" | "empty";
  label: "Configurado" | "Sugerido local" | "Pendiente";
  checklistStatus: "listo" | "revisar" | "pendiente";
  explanation: string;
};

/** Fase 5H: distingue configurado real vs sugerido_local vs vacío para documentos/diagnóstico/reportes. */
function getTechnicalBlockState(
  blockUnknown: unknown,
  kind: TechnicalBlockKind
): TechnicalBlockVM {
  const emptyVm: TechnicalBlockVM = {
    status: "empty",
    label: "Pendiente",
    checklistStatus: "pendiente",
    explanation: "Sin información suficiente.",
  };

  const r = asRecord(blockUnknown);
  const keys = Object.keys(r);
  if (keys.length === 0) return emptyVm;

  let suggested = false;
  if (kind === "reportes") {
    suggested =
      r.origen === "sugerido_local" &&
      Array.isArray(r.reportesSugeridos) &&
      r.reportesSugeridos.length > 0;
  } else if (kind === "diagnostico") {
    const sug = asRecord(r.diagnosticoSugerido);
    suggested =
      r.origen === "sugerido_local" &&
      trimStrTechnical(sug.resumenComercial).length > 0;
  } else {
    suggested =
      r.origen === "sugerido_local" &&
      Array.isArray(r.documentosSugeridos) &&
      r.documentosSugeridos.length > 0;
  }

  if (r.origen === "sugerido_local" && !suggested) {
    return emptyVm;
  }

  if (suggested) {
    return {
      status: "suggested",
      label: "Sugerido local",
      checklistStatus: "revisar",
      explanation:
        "Propuesta generada localmente. Requiere validación humana antes de activación real.",
    };
  }

  return {
    status: "configured",
    label: "Configurado",
    checklistStatus: "listo",
    explanation: "Configurado desde el Constructor.",
  };
}

function mergePendientesPrincipalesDisplay(
  rawPendientes: string[],
  documentosVm: TechnicalBlockVM,
  diagnosticoVm: TechnicalBlockVM,
  reportesVm: TechnicalBlockVM
): string[] {
  const curated: string[] = [];
  if (documentosVm.status === "suggested") {
    curated.push(
      "Documentos fuente: propuesta sugerida localmente pendiente de carga o validación humana."
    );
  }
  if (diagnosticoVm.status === "suggested") {
    curated.push(
      "Diagnóstico: propuesta sugerida localmente pendiente de validación humana."
    );
  }
  if (reportesVm.status === "suggested") {
    curated.push(
      "Reportes: propuesta sugerida localmente pendiente de validación humana."
    );
  }

  const filtered = rawPendientes.filter((line) => {
    if (documentosVm.status === "suggested" && line.startsWith("Datos base:")) {
      return false;
    }
    if (diagnosticoVm.status === "suggested" && line.startsWith("Diagnóstico y proceso:")) {
      return false;
    }
    if (reportesVm.status === "suggested" && line.startsWith("IA y reportes:")) {
      return false;
    }
    return true;
  });

  const merged = [...curated, ...filtered];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of merged) {
    const t = m.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 8);
}

function technicalBlockBadgeClass(status: TechnicalBlockVM["status"]): string {
  if (status === "configured") {
    return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700";
  }
  if (status === "suggested") {
    return "inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800";
  }
  return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800";
}

function buildTechnicalSummaryViewModel(
  technicalJson: Record<string, unknown> | null | undefined
) {
  const root = technicalJson ?? {};
  const empresa = asRecord(root.empresa);
  const procesoPipelineUnknown = root.procesoPipeline;
  const motoresUnknown = root.motoresIA;
  const reportesUnknown = root.reportes;
  const diagnosticoUnknown = root.diagnostico;
  const documentosUnknown = root.documentos;

  const rubroNombre = strFieldTechnical(empresa.rubro);
  const rubroPersonalizado = strFieldTechnical(empresa.rubroPersonalizado);
  const rubroDisplay =
    rubroNombre !== "No definido"
      ? rubroNombre
      : rubroPersonalizado !== "No definido"
        ? rubroPersonalizado
        : "No definido";

  const giroTxt = strFieldTechnical(empresa.giro);
  const queVendeTxt = strFieldTechnical(empresa.queVende);
  const giroOQueVendeParts: string[] = [];
  if (giroTxt !== "No definido") giroOQueVendeParts.push(giroTxt);
  if (queVendeTxt !== "No definido") giroOQueVendeParts.push(queVendeTxt);
  const giroOQueVende =
    giroOQueVendeParts.length > 0
      ? giroOQueVendeParts.join(" · ")
      : "No definido";

  const auditoriaBlock = asRecord(root?.auditoria);
  const readinessRecord = asRecord(auditoriaBlock?.readiness);
  const completionPercent =
    typeof readinessRecord.completionPercent === "number" &&
    Number.isFinite(readinessRecord.completionPercent)
      ? readinessRecord.completionPercent
      : 0;
  const overallStatusOs = readinessRecord.overallStatus;
  const overallStatusStr =
    overallStatusOs !== undefined && overallStatusOs !== null
      ? String(overallStatusOs)
      : "No definido";
  const overallLabelStr = strFieldTechnical(readinessRecord.overallLabel);
  const nextActionStr = strFieldTechnical(readinessRecord.nextAction);

  const pendientesRaw = Array.isArray(root.pendientes) ? root.pendientes : [];
  const pendientesTopRaw = pendientesRaw
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .slice(0, 5);

  const documentosVm = getTechnicalBlockState(documentosUnknown, "documentos");
  const diagnosticoVm = getTechnicalBlockState(diagnosticoUnknown, "diagnostico");
  const reportesVm = getTechnicalBlockState(reportesUnknown, "reportes");

  const pendientesTop = mergePendientesPrincipalesDisplay(
    pendientesTopRaw,
    documentosVm,
    diagnosticoVm,
    reportesVm
  );

  const resumenHayBloquesSugeridos =
    documentosVm.status === "suggested" ||
    diagnosticoVm.status === "suggested" ||
    reportesVm.status === "suggested";

  return {
    empresa: {
      nombreComercial: strFieldTechnical(empresa.nombreComercial),
      nombreLegal: strFieldTechnical(empresa.nombreLegal),
      sitioWeb: strFieldTechnical(empresa.sitioWeb),
    },
    ubicacion: {
      pais: strFieldTechnical(empresa.pais),
      ciudad: strFieldTechnical(empresa.ciudad),
    },
    rubroVertical: {
      rubro: rubroDisplay,
      vertical: strFieldTechnical(empresa.vertical),
      giroOQueVende,
    },
    pipeline: structuralBlockStatus(procesoPipelineUnknown),
    motoresIA: structuralBlockStatus(motoresUnknown),
    reportes: reportesVm.label,
    diagnostico: diagnosticoVm.label,
    documentos: documentosVm.label,
    bloqueDocumentos: documentosVm,
    bloqueDiagnostico: diagnosticoVm,
    bloqueReportes: reportesVm,
    resumenHayBloquesSugeridos,
    auditoria: {
      completionPercent,
      overallStatus: overallStatusStr,
      overallLabel: overallLabelStr,
      nextAction: nextActionStr,
    },
    pendientesTop,
  };
}

type ActivationGateStatus = "listo" | "revisar" | "pendiente";

type ActivationChecklistRow = {
  key: string;
  title: string;
  status: ActivationGateStatus;
  badgeLabel: string;
  explanation: string;
};

function normalizeUbicacionToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Coincidencias mínimas con Empresa para advertir país/ciudad cruzados (sin API). */
const UBIC_CIUDAD_EN_PAIS: readonly string[] = [
  "cordoba",
  "córdoba",
  "buenos aires",
  "montevideo",
  "rosario",
];

const UBIC_PAIS_EN_CIUDAD: readonly string[] = [
  "argentina",
  "uruguay",
  "chile",
  "brasil",
  "brazil",
  "paraguay",
];

function ubicacionInconsistenciaSospechosa(empresaUnknown: unknown): boolean {
  const e = asRecord(empresaUnknown);
  const pRaw = typeof e.pais === "string" ? e.pais : "";
  const cRaw = typeof e.ciudad === "string" ? e.ciudad : "";
  const p = normalizeUbicacionToken(pRaw);
  const c = normalizeUbicacionToken(cRaw);
  if (!p || !c) return false;
  const paisPareceCiudad = UBIC_CIUDAD_EN_PAIS.some((term) =>
    p.includes(normalizeUbicacionToken(term))
  );
  const ciudadParecePais = UBIC_PAIS_EN_CIUDAD.some((term) => {
    const n = normalizeUbicacionToken(term);
    return c === n || c.includes(n);
  });
  return paisPareceCiudad && ciudadParecePais;
}

function pendientesMencionanUbicacion(pendientesRaw: unknown): boolean {
  if (!Array.isArray(pendientesRaw)) return false;
  for (const p of pendientesRaw) {
    if (typeof p !== "string") continue;
    const low = p.toLowerCase();
    const tienePais = low.includes("país") || low.includes("pais");
    const tieneCiudad = low.includes("ciudad");
    if (tienePais && tieneCiudad) return true;
  }
  return false;
}

function readinessSeccionesMencionanUbicacion(
  sectionsUnknown: unknown
): boolean {
  if (!Array.isArray(sectionsUnknown)) return false;
  for (const s of sectionsUnknown) {
    if (!s || typeof s !== "object") continue;
    const rec = s as SetupRecord;
    const detail = typeof rec.detail === "string" ? rec.detail.toLowerCase() : "";
    if (!detail) continue;
    const tienePais = detail.includes("país") || detail.includes("pais");
    const tieneCiudad = detail.includes("ciudad");
    const tieneInvert =
      detail.includes("invert") || detail.includes("equivoc");
    if (tienePais && (tieneCiudad || tieneInvert)) return true;
  }
  return false;
}

function gateLabel(s: ActivationGateStatus): string {
  if (s === "listo") return "Listo";
  if (s === "revisar") return "Revisar";
  return "Pendiente";
}

function buildActivationChecklistViewModel(
  technicalJson: Record<string, unknown> | null | undefined
): { items: ActivationChecklistRow[]; allListo: boolean } {
  const root = technicalJson ?? {};
  const empresa = asRecord(root.empresa);
  const procesoPipeline = asRecord(root.procesoPipeline);
  const motoresIA = asRecord(root.motoresIA);

  const auditoriaBlock = asRecord(root?.auditoria);
  const readinessRecord = asRecord(auditoriaBlock?.readiness);

  const pendientesArr = Array.isArray(root.pendientes) ? root.pendientes : [];
  const pendientesStrings = pendientesArr.filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0
  );
  const pendientesCount = pendientesStrings.length;

  const nombreComercialOk =
    strFieldTechnical(empresa.nombreComercial) !== "No definido";
  const nombreLegalOk =
    strFieldTechnical(empresa.nombreLegal) !== "No definido";
  const empresaIdentificada = nombreComercialOk || nombreLegalOk;

  const paisOk = strFieldTechnical(empresa.pais) !== "No definido";
  const ciudadOk = strFieldTechnical(empresa.ciudad) !== "No definido";
  const ubicacionAdvertencia =
    ubicacionInconsistenciaSospechosa(empresa) ||
    pendientesMencionanUbicacion(pendientesArr) ||
    readinessSeccionesMencionanUbicacion(readinessRecord?.sections);

  let ubicacionStatus: ActivationGateStatus;
  let ubicacionExplanation: string;
  if (!paisOk && !ciudadOk) {
    ubicacionStatus = "pendiente";
    ubicacionExplanation =
      "Faltan país y ciudad/región en los datos de empresa del Constructor.";
  } else if (!paisOk || !ciudadOk) {
    ubicacionStatus = "revisar";
    ubicacionExplanation = !paisOk
      ? "Falta país; completalo en Empresa."
      : "Falta ciudad/región; completala en Empresa.";
  } else if (ubicacionAdvertencia) {
    ubicacionStatus = "revisar";
    ubicacionExplanation =
      "Hay señales de posible inconsistencia entre país y ciudad/región (datos, pendientes o notas de readiness). Revisá Empresa.";
  } else {
    ubicacionStatus = "listo";
    ubicacionExplanation =
      "País y ciudad/región están informados de forma coherente en esta vista.";
  }

  const documentosVm = getTechnicalBlockState(root.documentos, "documentos");
  const diagnosticoVm = getTechnicalBlockState(root.diagnostico, "diagnostico");
  const reportesVm = getTechnicalBlockState(root.reportes, "reportes");

  const pipelineOk = Object.keys(procesoPipeline).length > 0;
  const motoresOk = Object.keys(motoresIA).length > 0;

  const pctRaw = readinessRecord.completionPercent;
  const auditoriaPct =
    typeof pctRaw === "number" && Number.isFinite(pctRaw) ? pctRaw : 0;
  let auditoriaStatus: ActivationGateStatus;
  let auditoriaExplanation: string;
  if (auditoriaPct >= 80) {
    auditoriaStatus = "listo";
    auditoriaExplanation = `Readiness de auditoría en ${Math.round(auditoriaPct)}%. Adecuado para revisión de cierre en prototipo.`;
  } else if (auditoriaPct >= 50) {
    auditoriaStatus = "revisar";
    auditoriaExplanation = `Readiness ${Math.round(auditoriaPct)}%: conviene revisar bloques antes de una activación real.`;
  } else {
    auditoriaStatus = "pendiente";
    auditoriaExplanation = `Readiness ${Math.round(auditoriaPct)}%: aún hay brechas antes de cerrar el Constructor en prototipo.`;
  }

  let pendientesCriticosStatus: ActivationGateStatus;
  let pendientesCriticosExplanation: string;
  if (pendientesCount === 0) {
    pendientesCriticosStatus = "listo";
    pendientesCriticosExplanation =
      "No hay pendientes listados en el JSON técnico para esta vista.";
  } else {
    pendientesCriticosStatus = "revisar";
    pendientesCriticosExplanation = `Hay ${pendientesCount} pendiente${pendientesCount !== 1 ? "s" : ""} registrado${pendientesCount !== 1 ? "s" : ""} en consolidación técnica.`;
  }

  const items: ActivationChecklistRow[] = [
    {
      key: "empresa",
      title: "Empresa identificada",
      status: empresaIdentificada ? "listo" : "pendiente",
      badgeLabel: gateLabel(empresaIdentificada ? "listo" : "pendiente"),
      explanation: empresaIdentificada
        ? "Nombre comercial o nombre legal cargado."
        : "Falta nombre comercial y nombre legal reconocibles en Empresa.",
    },
    {
      key: "ubicacion",
      title: "Ubicación validada",
      status: ubicacionStatus,
      badgeLabel: gateLabel(ubicacionStatus),
      explanation: ubicacionExplanation,
    },
    {
      key: "documentos",
      title: "Documentos fuente",
      status: documentosVm.checklistStatus,
      badgeLabel: gateLabel(documentosVm.checklistStatus),
      explanation: documentosVm.explanation,
    },
    {
      key: "diagnostico",
      title: "Diagnóstico disponible",
      status: diagnosticoVm.checklistStatus,
      badgeLabel: gateLabel(diagnosticoVm.checklistStatus),
      explanation: diagnosticoVm.explanation,
    },
    {
      key: "pipeline",
      title: "Pipeline configurado",
      status: pipelineOk ? "listo" : "pendiente",
      badgeLabel: gateLabel(pipelineOk ? "listo" : "pendiente"),
      explanation: pipelineOk
        ? "Hay configuración cargada para proceso/Pipeline."
        : "Sin datos cargados para procesoPipeline en el JSON técnico.",
    },
    {
      key: "motores",
      title: "Motores IA definidos",
      status: motoresOk ? "listo" : "pendiente",
      badgeLabel: gateLabel(motoresOk ? "listo" : "pendiente"),
      explanation: motoresOk
        ? "Hay datos en motores IA en el Constructor."
        : "Motores IA vacíos según consolidación técnica.",
    },
    {
      key: "reportes",
      title: "Reportes configurados",
      status: reportesVm.checklistStatus,
      badgeLabel: gateLabel(reportesVm.checklistStatus),
      explanation: reportesVm.explanation,
    },
    {
      key: "auditoria",
      title: "Auditoría revisada",
      status: auditoriaStatus,
      badgeLabel: gateLabel(auditoriaStatus),
      explanation: auditoriaExplanation,
    },
    {
      key: "pendientes",
      title: "Pendientes críticos",
      status: pendientesCriticosStatus,
      badgeLabel: gateLabel(pendientesCriticosStatus),
      explanation: pendientesCriticosExplanation,
    },
  ];

  const allListo = items.every((row) => row.status === "listo");

  return { items, allListo };
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
  const [technicalJsonCopyStatus, setTechnicalJsonCopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

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

  const auditoriaReadinessPanel = evaluateAuditoriaReadiness(
    setupLoading ? null : setupData
  );

  const technicalJson = buildConstructorTechnicalJson(
    setupLoading ? null : setupData,
    auditoriaReadinessPanel
  );
  const technicalReportesForBanner = asRecord(technicalJson.reportes);
  const technicalJsonReportesSugeridosBanner =
    technicalReportesForBanner.origen === "sugerido_local" &&
    Array.isArray(technicalReportesForBanner.reportesSugeridos) &&
    technicalReportesForBanner.reportesSugeridos.length > 0;
  const technicalJsonReportesSugeridosNotaRaw = trimStrTechnical(
    technicalReportesForBanner.notaValidacion
  );
  const technicalJsonReportesSugeridosNota =
    technicalJsonReportesSugeridosNotaRaw.length > 0
      ? technicalJsonReportesSugeridosNotaRaw
      : "Reportes sugeridos localmente · Pendientes de validación humana";

  const technicalDiagnosticoForBanner = asRecord(technicalJson.diagnostico);
  const technicalJsonDiagnosticoSugeridoBanner =
    technicalDiagnosticoForBanner.origen === "sugerido_local" &&
    typeof technicalDiagnosticoForBanner.diagnosticoSugerido === "object" &&
    technicalDiagnosticoForBanner.diagnosticoSugerido !== null &&
    !Array.isArray(technicalDiagnosticoForBanner.diagnosticoSugerido);
  const technicalJsonDiagnosticoSugeridoNotaRaw = trimStrTechnical(
    technicalDiagnosticoForBanner.notaValidacion
  );
  const technicalJsonDiagnosticoSugeridoNota =
    technicalJsonDiagnosticoSugeridoNotaRaw.length > 0
      ? technicalJsonDiagnosticoSugeridoNotaRaw
      : "Diagnóstico sugerido localmente · Pendiente de validación humana";

  const technicalDocumentosForBanner = asRecord(technicalJson.documentos);
  const technicalJsonDocumentosSugeridosBanner =
    technicalDocumentosForBanner.origen === "sugerido_local" &&
    Array.isArray(technicalDocumentosForBanner.documentosSugeridos) &&
    technicalDocumentosForBanner.documentosSugeridos.length > 0;
  const technicalJsonDocumentosSugeridosNotaRaw = trimStrTechnical(
    technicalDocumentosForBanner.notaValidacion
  );
  const technicalJsonDocumentosSugeridosNota =
    technicalJsonDocumentosSugeridosNotaRaw.length > 0
      ? technicalJsonDocumentosSugeridosNotaRaw
      : "Documentos sugeridos localmente · Pendientes de carga o validación humana";

  const technicalJsonString = JSON.stringify(technicalJson, null, 2);
  const technicalJsonStringOk =
    typeof technicalJsonString === "string" && technicalJsonString.trim().length > 0;

  async function handleCopyTechnicalJson() {
    setTechnicalJsonCopyStatus("idle");
    if (!technicalJsonStringOk) {
      setTechnicalJsonCopyStatus("error");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setTechnicalJsonCopyStatus("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(technicalJsonString);
      setTechnicalJsonCopyStatus("success");
    } catch {
      setTechnicalJsonCopyStatus("error");
    }
  }

  function handleDownloadTechnicalJson() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!technicalJsonStringOk) return;

    const blob = new Blob([technicalJsonString], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "constructor-technical-json.json";
    anchor.style.display = "none";
    try {
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }

  const technicalSummaryVm = buildTechnicalSummaryViewModel(technicalJson);
  const activationChecklistVm = buildActivationChecklistViewModel(technicalJson);

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

          <StepReadinessPanel
            title="Auditoría final"
            readiness={auditoriaReadinessPanel}
            overallProgress={getConstructorOverallProgress({
              currentStep: "auditoria",
              currentStepPercent: auditoriaReadinessPanel.completionPercent,
            })}
          />

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

          {/* ── JSON técnico consolidado del Constructor (Fase 5A, solo lectura) ── */}
          <div className="mb-8">
            <SectionHeader
              letter="5"
              title="JSON técnico consolidado del Constructor"
            />
            <p className="mb-2 max-w-3xl text-xs leading-relaxed text-slate-500">
              Resumen técnico de configuración generado desde los datos actuales del
              Constructor. Este bloque es de solo lectura y sirve como base para
              futuras fases de activación y entregables técnicos.
            </p>
            <p className="mb-3 text-[11px] font-semibold tracking-wide text-slate-600">
              Solo lectura · Prototipo · No activa CRM real
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
              Exportación local · No guarda datos · No activa CRM real
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleCopyTechnicalJson();
                }}
                disabled={!technicalJsonStringOk}
                className={[
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  technicalJsonStringOk
                    ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300",
                ].join(" ")}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadTechnicalJson}
                disabled={!technicalJsonStringOk}
                className={[
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  technicalJsonStringOk
                    ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300",
                ].join(" ")}
              >
                <Download className="h-3.5 w-3.5" />
                Descargar JSON
              </button>
              {technicalJsonCopyStatus === "success" ? (
                <span className="text-[11px] font-medium text-green-700">
                  JSON copiado correctamente.
                </span>
              ) : null}
              {technicalJsonCopyStatus === "error" ? (
                <span className="text-[11px] font-medium text-rose-700">
                  No se pudo copiar el JSON.
                </span>
              ) : null}
            </div>
            {technicalJsonReportesSugeridosBanner ? (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-[11px] font-semibold leading-relaxed text-amber-900">
                  {technicalJsonReportesSugeridosNota}
                </p>
              </div>
            ) : null}
            {technicalJsonDiagnosticoSugeridoBanner ? (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                <p className="text-[11px] font-semibold leading-relaxed text-violet-900">
                  {technicalJsonDiagnosticoSugeridoNota}
                </p>
              </div>
            ) : null}
            {technicalJsonDocumentosSugeridosBanner ? (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <p className="text-[11px] font-semibold leading-relaxed text-teal-900">
                  {technicalJsonDocumentosSugeridosNota}
                </p>
              </div>
            ) : null}
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <pre className="max-h-[min(28rem,70vh)] overflow-x-auto overflow-y-auto p-4 text-left">
                <code className="font-mono text-[11px] leading-relaxed whitespace-pre text-slate-200">
                  {technicalJsonString}
                </code>
              </pre>
            </div>
          </div>

          {/* ── Resumen visual CRM (Fase 5B, solo lectura desde JSON técnico) ── */}
          <div className="mb-8">
            <SectionHeader
              letter="6"
              title="Resumen visual del CRM configurado"
            />
            <p className="mb-4 max-w-3xl text-xs leading-relaxed text-slate-500">
              Vista simplificada generada desde el JSON técnico actual. Sirve para
              revisar rápidamente qué información ya tiene el Constructor antes de
              futuras fases de entrega o activación.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* 1 Empresa */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Empresa
                </p>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-[11px] text-slate-500">Nombre comercial</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {technicalSummaryVm.empresa.nombreComercial}
                    </dd>
                  </div>
                  {technicalSummaryVm.empresa.nombreLegal !== "No definido" ? (
                    <div>
                      <dt className="text-[11px] text-slate-500">Nombre legal</dt>
                      <dd className="text-sm font-medium text-slate-800">
                        {technicalSummaryVm.empresa.nombreLegal}
                      </dd>
                    </div>
                  ) : null}
                  {technicalSummaryVm.empresa.sitioWeb !== "No definido" ? (
                    <div>
                      <dt className="text-[11px] text-slate-500">Sitio web</dt>
                      <dd className="text-sm font-medium text-slate-800 break-all">
                        {technicalSummaryVm.empresa.sitioWeb}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              {/* 2 Ubicación */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Ubicación
                </p>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-[11px] text-slate-500">País</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {technicalSummaryVm.ubicacion.pais}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">Ciudad / región</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {technicalSummaryVm.ubicacion.ciudad}
                    </dd>
                  </div>
                </dl>
              </div>
              {/* 3 Rubro y vertical */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Rubro y vertical
                </p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] text-slate-500">Rubro</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {technicalSummaryVm.rubroVertical.rubro}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">Vertical</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {technicalSummaryVm.rubroVertical.vertical}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">
                      Giro / qué vende
                    </dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {technicalSummaryVm.rubroVertical.giroOQueVende}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Documentos, Diagnóstico, Pipeline, Motores, Reportes */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Documentos
                  </p>
                  <span
                    className={technicalBlockBadgeClass(
                      technicalSummaryVm.bloqueDocumentos.status
                    )}
                  >
                    {technicalSummaryVm.bloqueDocumentos.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {technicalSummaryVm.bloqueDocumentos.explanation}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Diagnóstico
                  </p>
                  <span
                    className={technicalBlockBadgeClass(
                      technicalSummaryVm.bloqueDiagnostico.status
                    )}
                  >
                    {technicalSummaryVm.bloqueDiagnostico.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {technicalSummaryVm.bloqueDiagnostico.explanation}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Pipeline
                  </p>
                  <span
                    className={
                      technicalSummaryVm.pipeline === "Configurado"
                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                        : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                    }
                  >
                    {technicalSummaryVm.pipeline}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Origen técnico: bloque procesoPipeline del JSON consolidado.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Motores IA
                  </p>
                  <span
                    className={
                      technicalSummaryVm.motoresIA === "Configurado"
                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                        : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                    }
                  >
                    {technicalSummaryVm.motoresIA}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Origen técnico: bloque motoresIA del JSON consolidado.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Reportes
                  </p>
                  <span
                    className={technicalBlockBadgeClass(
                      technicalSummaryVm.bloqueReportes.status
                    )}
                  >
                    {technicalSummaryVm.bloqueReportes.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {technicalSummaryVm.bloqueReportes.explanation}
                </p>
              </div>
              </div>
              {technicalSummaryVm.resumenHayBloquesSugeridos ? (
                <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    El diseño técnico cuenta con propuestas locales para documentos,
                    diagnóstico y reportes. Antes de activar CRM real, estas propuestas
                    deben ser validadas o reemplazadas por datos reales guardados.
                  </p>
                </div>
              ) : null}
              {/* Auditoría */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Auditoría
                </p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-[11px] text-slate-500">
                      Readiness (completitud)
                    </dt>
                    <dd className="text-lg font-bold tabular-nums text-slate-900">
                      {technicalSummaryVm.auditoria.completionPercent}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-500">Estado global</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {technicalSummaryVm.auditoria.overallLabel}
                      <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {technicalSummaryVm.auditoria.overallStatus}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className="text-[11px] text-slate-500">
                      Siguiente acción
                    </dt>
                    <dd className="text-sm leading-relaxed text-slate-700">
                      {technicalSummaryVm.auditoria.nextAction}
                    </dd>
                  </div>
                </dl>
              </div>
              {/* Pendientes */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Pendientes principales
                </p>
                {technicalSummaryVm.pendientesTop.length === 0 ? (
                  <p className="text-xs leading-relaxed text-slate-600">
                    Sin pendientes críticos detectados en esta vista.
                  </p>
                ) : (
                  <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-700">
                    {technicalSummaryVm.pendientesTop.map((item, idx) => (
                      <li key={`pend-${idx}-${item.slice(0, 32)}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ── Checklist final de activación (Fase 5C, prototipo) ── */}
          <div className="mb-8">
            <SectionHeader
              letter="7"
              title="Checklist final de activación"
            />
            <p className="mb-4 max-w-3xl text-xs leading-relaxed text-slate-500">
              Validación visual de los bloques mínimos necesarios antes de permitir una
              activación real en futuras fases. En esta etapa el CRM permanece en modo
              prototipo.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {activationChecklistVm.items.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{row.title}</p>
                    <span
                      className={[
                        "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        row.status === "listo"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : row.status === "revisar"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-rose-200 bg-rose-50 text-rose-800",
                      ].join(" ")}
                    >
                      {row.badgeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {row.explanation}
                  </p>
                </div>
              ))}
            </div>
            <div
              className={[
                "mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed",
                activationChecklistVm.allListo
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900",
              ].join(" ")}
            >
              {activationChecklistVm.allListo ? (
                <p className="font-medium">
                  Checklist completo para revisión. La activación real sigue bloqueada
                  en este prototipo.
                </p>
              ) : (
                <p className="font-medium">
                  Checklist incompleto. Revisá los bloques marcados antes de avanzar a
                  una activación real.
                </p>
              )}
            </div>
          </div>

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

          {/* ── H: Preactivación ──────────────────────────────────────────── */}
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

          {/* ── I: Navegación ────────────────────────────────────────────── */}
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
