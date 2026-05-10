"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Layers,
  LayoutGrid,
  CheckSquare,
  Square,
  Code2,
  User,
  Target,
  ListTodo,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { MockAISuggestionCard } from "@/components/constructor/MockAISuggestionCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import type { ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";
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
  textLength,
} from "@/lib/constructor/readiness/helpers";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoColumna = "inicial" | "activa" | "bloqueada" | "ganada" | "perdida" | "";

type EtapaProceso = {
  id: string;
  nombre: string;
  objetivo: string;
  responsable: string;
  tareas: string;
  condicionAvance: string;
  requiereValidacionHumana: boolean;
};

type ColumnaKanban = {
  id: string;
  nombre: string;
  tipo: TipoColumna;
  criterioEntrada: string;
  criterioSalida: string;
  slaDias: string;
};

type ReglasValidacion = {
  condicionesAvance: string;
  decisionesHumanas: string;
  documentosPorEtapa: string;
  alertasSistema: string;
  tareasAutomaticas: string;
};

type SetupRecord = Record<string, unknown>;

type LocalSuggestion = {
  id: string;
  targetField:
    | "etapas"
    | "columnas"
    | "condicionesAvance"
    | "decisionesHumanas"
    | "validaciones"
    | "reglas"
    | "general";
  title: string;
  description: string;
  actionLabel?: string;
  apply?: () => void;
};

type ProcesoPipelinePayload = {
  etapas: EtapaProceso[];
  columnas: ColumnaKanban[];
  reglas: ReglasValidacion;
};

type ProcesoPipelineForm = ProcesoPipelinePayload;
type ProcesoPipelineReadiness = BaseReadiness;

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const ETAPAS_INICIALES: EtapaProceso[] = [
  {
    id: "e1",
    nombre: "Nuevo lead",
    objetivo: "Registrar y verificar los datos básicos del prospecto.",
    responsable: "SDR / Vendedor",
    tareas: "Crear ficha, verificar contacto, asignar origen",
    condicionAvance: "Datos completos y lead contactado al menos una vez",
    requiereValidacionHumana: false,
  },
  {
    id: "e2",
    nombre: "Calificación inicial",
    objetivo: "Determinar si el lead cumple el perfil de cliente ideal.",
    responsable: "SDR / Vendedor",
    tareas: "Llamada de calificación, completar campos BANT o similares",
    condicionAvance: "Lead calificado: presupuesto, autoridad, necesidad y timing confirmados",
    requiereValidacionHumana: false,
  },
  {
    id: "e3",
    nombre: "Reunión / visita",
    objetivo: "Establecer una reunión presencial o virtual con el decisor.",
    responsable: "Vendedor",
    tareas: "Agendar reunión, preparar presentación, ejecutar reunión, registrar notas",
    condicionAvance: "Reunión realizada y necesidad confirmada por el cliente",
    requiereValidacionHumana: false,
  },
  {
    id: "e4",
    nombre: "Diagnóstico / evaluación",
    objetivo: "Entender en profundidad el problema y los requerimientos del cliente.",
    responsable: "Vendedor / Técnico",
    tareas: "Relevamiento de necesidades, visita técnica si aplica, documentar requerimientos",
    condicionAvance: "Requerimientos validados y aprobados internamente",
    requiereValidacionHumana: true,
  },
  {
    id: "e5",
    nombre: "Propuesta / cotización",
    objetivo: "Preparar y enviar una propuesta comercial formal.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Redactar propuesta, revisar internamente, enviar al cliente, confirmar recepción",
    condicionAvance: "Propuesta enviada y acuse de recibo del cliente",
    requiereValidacionHumana: true,
  },
  {
    id: "e6",
    nombre: "Negociación",
    objetivo: "Resolver objeciones y ajustar condiciones hasta llegar a un acuerdo.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Registrar objeciones, proponer alternativas, negociar condiciones",
    condicionAvance: "Acuerdo verbal o escrito sobre precio y condiciones",
    requiereValidacionHumana: true,
  },
  {
    id: "e7",
    nombre: "Cierre",
    objetivo: "Formalizar la venta y preparar el onboarding del cliente.",
    responsable: "Vendedor / Administración",
    tareas: "Firma de contrato o pedido, cobro inicial, handoff a operaciones",
    condicionAvance: "Contrato firmado y pago confirmado",
    requiereValidacionHumana: true,
  },
];

const COLUMNAS_INICIALES: ColumnaKanban[] = [
  { id: "k1", nombre: "Nuevo", tipo: "inicial", criterioEntrada: "Lead creado en el sistema", criterioSalida: "Lead contactado y datos verificados", slaDias: "1" },
  { id: "k2", nombre: "Calificar", tipo: "activa", criterioEntrada: "Lead contactado", criterioSalida: "Calificación BANT completada", slaDias: "3" },
  { id: "k3", nombre: "Reunión agendada", tipo: "activa", criterioEntrada: "Lead calificado positivamente", criterioSalida: "Reunión realizada y necesidad confirmada", slaDias: "5" },
  { id: "k4", nombre: "Evaluación", tipo: "activa", criterioEntrada: "Reunión completada", criterioSalida: "Requerimientos documentados y aprobados", slaDias: "7" },
  { id: "k5", nombre: "Propuesta enviada", tipo: "activa", criterioEntrada: "Diagnóstico aprobado internamente", criterioSalida: "Propuesta recibida y en evaluación por el cliente", slaDias: "3" },
  { id: "k6", nombre: "Negociación", tipo: "activa", criterioEntrada: "Cliente respondió la propuesta", criterioSalida: "Acuerdo de condiciones alcanzado", slaDias: "10" },
  { id: "k7", nombre: "Ganado", tipo: "ganada", criterioEntrada: "Contrato firmado o pedido confirmado", criterioSalida: "—", slaDias: "" },
  { id: "k8", nombre: "Perdido", tipo: "perdida", criterioEntrada: "Cliente descartó la propuesta o no respondió", criterioSalida: "—", slaDias: "" },
];

const ETAPAS_ASISTENTE: EtapaProceso[] = [
  {
    id: "asistente-etapa-lead-recibido",
    nombre: "Lead recibido",
    objetivo: "Registrar la oportunidad y validar datos iniciales.",
    responsable: "SDR / Vendedor",
    tareas: "Crear ficha, registrar origen, asignar responsable",
    condicionAvance: "Datos mínimos cargados y responsable asignado",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-etapa-calificacion",
    nombre: "Calificación",
    objetivo: "Confirmar si la oportunidad cumple el perfil comercial.",
    responsable: "SDR / Vendedor",
    tareas: "Relevar necesidad, presupuesto, decisor y urgencia",
    condicionAvance: "Lead calificado con próximo paso definido",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-etapa-diagnostico-reunion",
    nombre: "Diagnóstico / reunión",
    objetivo: "Entender necesidad, alcance y criterios de decisión.",
    responsable: "Vendedor / Técnico",
    tareas: "Coordinar reunión, tomar notas, validar requerimientos",
    condicionAvance: "Diagnóstico registrado y necesidad validada",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-etapa-propuesta-enviada",
    nombre: "Propuesta enviada",
    objetivo: "Enviar propuesta comercial y confirmar recepción.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Preparar propuesta, revisar, enviar y registrar fecha",
    condicionAvance: "Propuesta enviada y próxima acción definida",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-etapa-seguimiento",
    nombre: "Seguimiento",
    objetivo: "Evitar oportunidades frías y sostener el avance comercial.",
    responsable: "Vendedor",
    tareas: "Registrar contacto, definir próximo paso, actualizar fecha",
    condicionAvance: "Cliente responde o se define siguiente acción",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-etapa-negociacion",
    nombre: "Negociación",
    objetivo: "Resolver objeciones y acordar condiciones.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Registrar objeciones, ajustar condiciones, validar descuentos",
    condicionAvance: "Condiciones acordadas o decisión del cliente registrada",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-etapa-ganado",
    nombre: "Ganado",
    objetivo: "Confirmar cierre y preparar entrega inicial.",
    responsable: "Vendedor / Administración",
    tareas: "Registrar contrato, pago u orden de compra",
    condicionAvance: "Venta confirmada y handoff preparado",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-etapa-perdido",
    nombre: "Perdido",
    objetivo: "Registrar motivo de pérdida para aprendizaje comercial.",
    responsable: "Vendedor",
    tareas: "Cargar motivo, etapa de pérdida y observaciones",
    condicionAvance: "Motivo de pérdida documentado",
    requiereValidacionHumana: true,
  },
];

const ETAPAS_EDUCACION_ASISTENTE: EtapaProceso[] = [
  {
    id: "asistente-educacion-lead-recibido",
    nombre: "Lead recibido",
    objetivo: "Registrar la consulta educativa y su origen.",
    responsable: "Admisiones / Comercial",
    tareas: "Cargar datos, origen, programa de interés y responsable",
    condicionAvance: "Consulta registrada con datos mínimos y responsable asignado",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-educacion-consulta-inicial",
    nombre: "Consulta inicial",
    objetivo: "Entender interés, perfil y necesidad del estudiante o institución.",
    responsable: "Admisiones / Asesor educativo",
    tareas: "Responder consulta, relevar programa, modalidad, presupuesto y timing",
    condicionAvance: "Interés validado y próximo paso definido",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-educacion-diagnostico-academico",
    nombre: "Diagnóstico académico / reunión",
    objetivo: "Validar encaje académico, requisitos y decisión de compra.",
    responsable: "Asesor educativo / Coordinación académica",
    tareas: "Coordinar reunión, validar requisitos, documentar necesidades",
    condicionAvance: "Diagnóstico o reunión validada con información suficiente",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-educacion-propuesta",
    nombre: "Propuesta educativa",
    objetivo: "Presentar programa, condiciones, inversión y próximos pasos.",
    responsable: "Admisiones / Comercial",
    tareas: "Enviar propuesta, registrar condiciones y confirmar recepción",
    condicionAvance: "Propuesta enviada y seguimiento agendado",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-educacion-seguimiento",
    nombre: "Seguimiento",
    objetivo: "Evitar consultas frías y resolver dudas antes del cierre.",
    responsable: "Admisiones / Comercial",
    tareas: "Registrar contacto, resolver objeciones y actualizar fecha de seguimiento",
    condicionAvance: "Respuesta del interesado o decisión registrada",
    requiereValidacionHumana: false,
  },
  {
    id: "asistente-educacion-inscripcion",
    nombre: "Inscripción / cierre",
    objetivo: "Confirmar inscripción, pago, contrato o documentación requerida.",
    responsable: "Admisiones / Administración",
    tareas: "Validar documentación, pago y confirmación final",
    condicionAvance: "Inscripción confirmada o cierre documentado",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-educacion-onboarding",
    nombre: "Onboarding / inicio",
    objetivo: "Acompañar el inicio del estudiante, grupo o institución.",
    responsable: "Académico / Operaciones",
    tareas: "Enviar bienvenida, acceso, calendario y contacto responsable",
    condicionAvance: "Inicio confirmado y handoff a operación académica",
    requiereValidacionHumana: true,
  },
  {
    id: "asistente-educacion-perdido",
    nombre: "Perdido",
    objetivo: "Registrar motivo de pérdida para mejorar admisiones.",
    responsable: "Admisiones / Comercial",
    tareas: "Cargar motivo, observación y etapa donde se perdió",
    condicionAvance: "Motivo de pérdida registrado",
    requiereValidacionHumana: true,
  },
];

const COLUMNAS_ASISTENTE: ColumnaKanban[] = [
  {
    id: "asistente-columna-nuevo",
    nombre: "Nuevo",
    tipo: "inicial",
    criterioEntrada: "Oportunidad creada o recibida por cualquier canal",
    criterioSalida: "Primer contacto realizado o responsable asignado",
    slaDias: "1",
  },
  {
    id: "asistente-columna-en-contacto",
    nombre: "En contacto",
    tipo: "activa",
    criterioEntrada: "Lead contactado o intento de contacto iniciado",
    criterioSalida: "Necesidad y próximos pasos identificados",
    slaDias: "3",
  },
  {
    id: "asistente-columna-calificado",
    nombre: "Calificado",
    tipo: "activa",
    criterioEntrada: "Lead cumple criterios mínimos de calificación",
    criterioSalida: "Diagnóstico, reunión o propuesta definidos",
    slaDias: "5",
  },
  {
    id: "asistente-columna-propuesta",
    nombre: "Propuesta",
    tipo: "activa",
    criterioEntrada: "Propuesta preparada o enviada al cliente",
    criterioSalida: "Cliente responde o se agenda seguimiento",
    slaDias: "7",
  },
  {
    id: "asistente-columna-negociacion",
    nombre: "Negociación",
    tipo: "activa",
    criterioEntrada: "Cliente evalúa o negocia condiciones",
    criterioSalida: "Acuerdo alcanzado o pérdida registrada",
    slaDias: "10",
  },
  {
    id: "asistente-columna-ganado",
    nombre: "Ganado",
    tipo: "ganada",
    criterioEntrada: "Venta confirmada por contrato, pedido o pago",
    criterioSalida: "Handoff a entrega, implementación u operaciones",
    slaDias: "",
  },
  {
    id: "asistente-columna-perdido",
    nombre: "Perdido",
    tipo: "perdida",
    criterioEntrada: "Cliente descarta, no responde o el equipo descalifica",
    criterioSalida: "Motivo de pérdida registrado",
    slaDias: "",
  },
];

const ETAPA_PERDIDO_ASISTENTE =
  ETAPAS_ASISTENTE.find((etapa) => etapa.nombre === "Perdido")!;
const COLUMNA_PERDIDO_ASISTENTE =
  COLUMNAS_ASISTENTE.find((columna) => columna.nombre === "Perdido")!;
const ETAPA_SEGUIMIENTO_ASISTENTE =
  ETAPAS_ASISTENTE.find((etapa) => etapa.nombre === "Seguimiento")!;
const ETAPA_DIAGNOSTICO_ASISTENTE =
  ETAPAS_ASISTENTE.find((etapa) => etapa.nombre === "Diagnóstico / reunión")!;
const COLUMNA_SEGUIMIENTO_ASISTENTE: ColumnaKanban = {
  id: "asistente-columna-seguimiento",
  nombre: "Seguimiento",
  tipo: "activa",
  criterioEntrada: "Propuesta enviada o contacto pendiente de respuesta",
  criterioSalida: "Cliente responde, avanza a negociación o se marca perdido",
  slaDias: "5",
};
const ETAPA_ONBOARDING_ASISTENTE: EtapaProceso = {
  id: "asistente-etapa-onboarding",
  nombre: "Onboarding / entrega inicial",
  objetivo: "Asegurar transición ordenada después del cierre ganado.",
  responsable: "Operaciones / Implementación",
  tareas: "Coordinar entrega, recopilar datos finales y confirmar inicio",
  condicionAvance: "Cliente recibido por el equipo de entrega u operaciones",
  requiereValidacionHumana: true,
};
const COLUMNA_ONBOARDING_ASISTENTE: ColumnaKanban = {
  id: "asistente-columna-onboarding",
  nombre: "Onboarding / entrega inicial",
  tipo: "activa",
  criterioEntrada: "Oportunidad marcada como ganada",
  criterioSalida: "Entrega inicial, implementación u onboarding iniciado",
  slaDias: "7",
};

const CONDICIONES_AVANCE_SUGERIDAS =
  "Para avanzar una oportunidad debe tener responsable, próxima acción, fecha de seguimiento y criterio de salida cumplido.";

const DECISIONES_HUMANAS_SUGERIDAS =
  "Revisión humana obligatoria para descuentos, propuestas finales, oportunidades de alto valor y cierre como perdido.";

const REGLAS_MINIMAS_CALIDAD_SUGERIDAS = {
  condicionesAvance:
    "Responsable obligatorio, próxima acción obligatoria, fecha de seguimiento obligatoria y criterio de salida cumplido.",
  decisionesHumanas:
    "Validación humana antes de propuesta final, descuentos especiales, oportunidades de alto valor y cierres perdidos.",
  alertasSistema:
    "Alertar oportunidades sin próxima acción, sin fecha de seguimiento o frías por falta de actividad.",
  tareasAutomaticas:
    "Crear tarea de seguimiento al avanzar de etapa y solicitar motivo obligatorio si se marca perdido.",
};

const TIPOS_COLUMNA: { value: TipoColumna; label: string; className: string }[] = [
  { value: "inicial", label: "Inicial", className: "border-slate-200 bg-slate-100 text-slate-600" },
  { value: "activa", label: "Activa", className: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "bloqueada", label: "Bloqueada", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "ganada", label: "Ganada", className: "border-green-200 bg-green-50 text-green-700" },
  { value: "perdida", label: "Perdida", className: "border-red-200 bg-red-50 text-red-700" },
];

const TIPO_COLUMNA_VALUES = new Set<TipoColumna>(
  TIPOS_COLUMNA.map((tipo) => tipo.value)
);

function isRecord(value: unknown): value is SetupRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asRecord(value: unknown): SetupRecord {
  return isRecord(value) ? value : {};
}

function textIncludes(value: unknown, terms: string[]): boolean {
  const text = String(value ?? "").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function arrayOrTextIncludes(value: unknown, terms: string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => textIncludes(item, terms));
  }
  return textIncludes(value, terms);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asTipoColumna(value: unknown): TipoColumna {
  return typeof value === "string" && TIPO_COLUMNA_VALUES.has(value as TipoColumna)
    ? (value as TipoColumna)
    : "";
}

function normalizeEtapa(value: unknown, index: number): EtapaProceso | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) || `etapa-${index}`,
    nombre: asString(value.nombre),
    objetivo: asString(value.objetivo),
    responsable: asString(value.responsable),
    tareas: asString(value.tareas),
    condicionAvance: asString(value.condicionAvance),
    requiereValidacionHumana: asBoolean(value.requiereValidacionHumana),
  };
}

function normalizeColumna(value: unknown, index: number): ColumnaKanban | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) || `columna-${index}`,
    nombre: asString(value.nombre),
    tipo: asTipoColumna(value.tipo),
    criterioEntrada: asString(value.criterioEntrada),
    criterioSalida: asString(value.criterioSalida),
    slaDias: asString(value.slaDias),
  };
}

function normalizeReglas(value: unknown): ReglasValidacion {
  if (!isRecord(value)) {
    return {
      condicionesAvance: "",
      decisionesHumanas: "",
      documentosPorEtapa: "",
      alertasSistema: "",
      tareasAutomaticas: "",
    };
  }

  return {
    condicionesAvance: asString(value.condicionesAvance),
    decisionesHumanas: asString(value.decisionesHumanas),
    documentosPorEtapa: asString(value.documentosPorEtapa),
    alertasSistema: asString(value.alertasSistema),
    tareasAutomaticas: asString(value.tareasAutomaticas),
  };
}

function hasTextMatch(items: unknown[], terms: string[]) {
  return items.some((item) => {
    const text =
      typeof item === "string"
        ? item
        : item && typeof item === "object"
        ? String(
            (item as SetupRecord).nombre ??
              (item as SetupRecord).title ??
              (item as SetupRecord).label ??
              ""
          )
        : "";

    return terms.some((term) =>
      text.toLowerCase().includes(term.toLowerCase())
    );
  });
}

function mergeEtapasByName(
  current: EtapaProceso[],
  additions: EtapaProceso[]
): EtapaProceso[] {
  return [
    ...current,
    ...additions.filter(
      (addition) => !hasTextMatch(current, [addition.nombre])
    ),
  ];
}

function mergeColumnasByName(
  current: ColumnaKanban[],
  additions: ColumnaKanban[]
): ColumnaKanban[] {
  return [
    ...current,
    ...additions.filter(
      (addition) => !hasTextMatch(current, [addition.nombre])
    ),
  ];
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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";

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

function evaluateProcesoPipelineReadiness(
  form: ProcesoPipelineForm
): ProcesoPipelineReadiness {
  const { etapas, columnas, reglas } = form;

  const etapasConNombre = etapas.filter((e) => hasText(e.nombre)).length;
  let profundidadProcesoTexto = 0;
  for (const e of etapas) {
    profundidadProcesoTexto +=
      textLength(e.objetivo) + textLength(e.tareas) + textLength(e.condicionAvance);
  }
  const etapasConCuerpo = etapas.filter(
    (e) =>
      hasText(e.nombre) &&
      textLength(e.objetivo) >= 15 &&
      textLength(e.condicionAvance) >= 12
  ).length;

  const textoProcesoAmplio =
    profundidadProcesoTexto >= 360 ||
    (etapas.length >= 1 && profundidadProcesoTexto >= 260);

  let procesoStatus: QualityStatus;
  let procesoDetail: string;
  if (etapas.length === 0 || etapasConNombre === 0 || profundidadProcesoTexto < 40) {
    procesoStatus = "danger";
    procesoDetail = "Sin etapas o sin descripción suficiente del proceso profundo.";
  } else if (
    etapas.length >= 3 &&
    etapasConCuerpo >= Math.max(2, Math.ceil((etapas.length * 2) / 3))
  ) {
    procesoStatus = "good";
    procesoDetail = "Proceso interno con varias etapas y detalle comercial claro.";
  } else if (textoProcesoAmplio) {
    procesoStatus = "good";
    procesoDetail = "Hay suficiente texto que describe cómo trabaja la etapa.";
  } else if (etapas.length <= 2) {
    procesoStatus = "warning";
    procesoDetail = "Pocas etapas o contenido breve: sumá proceso profundo antes del Kanban.";
  } else {
    procesoStatus = "warning";
    procesoDetail =
      "Completá mejor objetivos, tareas y condiciones de avance en las etapas.";
  }

  const columnasConNombre = columnas.filter((c) => hasText(c.nombre)).length;
  let pipelineStatus: QualityStatus;
  let pipelineDetail: string;
  if (columnas.length === 0) {
    pipelineStatus = "danger";
    pipelineDetail = "Sin columnas del pipeline/Kanban visual.";
  } else if (columnas.length <= 2) {
    pipelineStatus = "warning";
    pipelineDetail = "Pocas columnas visibles para el equipo operativo.";
  } else if (columnasConNombre === columnas.length) {
    pipelineStatus = "good";
    pipelineDetail = "Varias columnas nombradas en el pipeline visual.";
  } else {
    pipelineStatus = "warning";
    pipelineDetail = "Completá nombres y criterios de las columnas visibles.";
  }

  const salidaSirveParaCriterio = (salidaRaw: string) => {
    const salida = salidaRaw.trim();
    return salida === "—" || salida === "-" || salida === "..." || salida.length === 1;
  };
  const columnasConCriteriosCompletos = columnas.filter((c) => {
    const entrada = textLength(c.criterioEntrada) >= 10;
    if (!entrada) return false;
    if (salidaSirveParaCriterio(c.criterioSalida)) return true;
    return textLength(c.criterioSalida) >= 10;
  }).length;
  const columnasConCriterioBreve = columnas.filter(
    (c) =>
      (textLength(c.criterioEntrada) >= 5 && textLength(c.criterioEntrada) < 10) ||
      (hasText(c.criterioSalida) &&
        !salidaSirveParaCriterio(c.criterioSalida) &&
        textLength(c.criterioSalida) >= 5 &&
        textLength(c.criterioSalida) < 10)
  ).length;
  const slaPresente = columnas.filter((c) => /\d/.test(String(c.slaDias))).length;
  const reglasGlobalesFuertes = hasRelevantText(reglas.condicionesAvance, 28);

  let criteriosStatus: QualityStatus;
  let criteriosDetail: string;
  if (
    columnas.length > 0 &&
    columnasConCriteriosCompletos === 0 &&
    !reglasGlobalesFuertes &&
    slaPresente === 0
  ) {
    criteriosStatus = "danger";
    criteriosDetail = "No hay criterios de avance documentados en columnas ni en reglas.";
  } else if (
    columnasConCriteriosCompletos >= 3 ||
    (columnasConCriteriosCompletos >= 2 && reglasGlobalesFuertes) ||
    (columnasConCriteriosCompletos >= 1 && reglasGlobalesFuertes && columnas.length <= 2)
  ) {
    criteriosStatus = "good";
    criteriosDetail = "Criterios de entrada/salida, SLA o reglas globales bien cubiertos.";
  } else if (
    columnasConCriteriosCompletos >= 1 ||
    reglasGlobalesFuertes ||
    slaPresente >= 2 ||
    columnasConCriterioBreve >= 1
  ) {
    criteriosStatus = "warning";
    criteriosDetail = "Los criterios existen pero conviene detallarlos en más etapas.";
  } else {
    criteriosStatus = "warning";
    criteriosDetail = "Agregá criterios para que el avance sea verificable.";
  }

  const etapasConResponsableYTareas = etapas.filter(
    (e) => hasText(e.responsable) && textLength(e.tareas) >= 12
  ).length;
  const etapasConValidacionHumana = etapas.filter((e) => e.requiereValidacionHumana).length;
  const reglasDetalleCount = countSelectedValues([
    hasRelevantText(reglas.decisionesHumanas, 15),
    hasRelevantText(reglas.alertasSistema, 15),
    hasRelevantText(reglas.documentosPorEtapa, 15),
    hasRelevantText(reglas.tareasAutomaticas, 15),
  ]);

  const mitadEtapasConRt =
    etapas.length > 0 &&
    etapasConResponsableYTareas >= Math.ceil(etapas.length / 2);
  const validacionHumanaDocumentada =
    hasRelevantText(reglas.decisionesHumanas, 18) || etapasConValidacionHumana >= 2;

  let responsablesValidacionesStatus: QualityStatus;
  let responsablesValidacionesDetail: string;
  if (etapas.length === 0) {
    responsablesValidacionesStatus = "warning";
    responsablesValidacionesDetail =
      "Sin etapas internas todavía: no hay responsables ni validaciones que evaluar.";
  } else if (
    mitadEtapasConRt &&
    (validacionHumanaDocumentada || reglasDetalleCount >= 2)
  ) {
    responsablesValidacionesStatus = "good";
    responsablesValidacionesDetail =
      "Responsables/tareas cubiertos y hay señales de validación o automatización.";
  } else if (
    etapasConResponsableYTareas >= 1 ||
    etapasConValidacionHumana >= 1 ||
    reglasDetalleCount >= 1
  ) {
    responsablesValidacionesStatus = "warning";
    responsablesValidacionesDetail =
      "Hay algo definido; ampliá responsables, tareas o validaciones humanas.";
  } else {
    responsablesValidacionesStatus = "warning";
    responsablesValidacionesDetail =
      "Faltan responsables, tareas y registro de validaciones o automatizaciones.";
  }

  const sections: SectionQuality[] = [
    {
      key: "proceso-comercial",
      label: "Proceso comercial",
      status: procesoStatus,
      detail: procesoDetail,
    },
    {
      key: "pipeline-kanban-visual",
      label: "Pipeline/Kanban visual",
      status: pipelineStatus,
      detail: pipelineDetail,
    },
    {
      key: "criterios-avance",
      label: "Criterios de avance",
      status: criteriosStatus,
      detail: criteriosDetail,
    },
    {
      key: "responsables-validaciones",
      label: "Responsables y validaciones",
      status: responsablesValidacionesStatus,
      detail: responsablesValidacionesDetail,
    },
  ];

  const completionPercent = clampCompletionPercent(
    Math.round(
      30 * STATUS_VALUE[procesoStatus] +
        30 * STATUS_VALUE[pipelineStatus] +
        20 * STATUS_VALUE[criteriosStatus] +
        20 * STATUS_VALUE[responsablesValidacionesStatus]
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

  let nextAction = "Podés guardar y continuar a Motores IA.";
  if (procesoStatus === "danger" || etapas.length === 0) {
    nextAction =
      "Definí el proceso comercial profundo antes de configurar el pipeline.";
  } else if (pipelineStatus === "danger" || columnas.length === 0) {
    nextAction = "Definí las columnas visibles del pipeline/Kanban.";
  } else if (criteriosStatus === "danger") {
    nextAction = "Agregá criterios de entrada y salida por etapa.";
  } else if (etapasConResponsableYTareas === 0 && etapas.length > 0) {
    nextAction = "Asigná responsables o tareas clave por etapa.";
  } else if (
    !hasRelevantText(reglas.decisionesHumanas, 12) &&
    etapasConValidacionHumana === 0
  ) {
    nextAction = "Definí qué decisiones requieren validación humana.";
  }

  const fieldHints: Record<string, FieldQualityHintValue> = {};

  if (procesoStatus === "danger") {
    fieldHints.procesoComercial = {
      status: "danger",
      text: "Definí cómo ocurre realmente el proceso comercial antes del Kanban.",
    };
  } else if (procesoStatus !== "good") {
    fieldHints.procesoComercial = {
      status: "warning",
      text: "Agregá más detalle de etapas internas, responsables y lógica comercial.",
    };
  }

  if (pipelineStatus === "danger") {
    fieldHints.pipelineVisual = {
      status: "danger",
      text: "Definí las columnas visibles que usará el equipo en el CRM.",
    };
  } else if (pipelineStatus !== "good") {
    fieldHints.pipelineVisual = {
      status: "warning",
      text: "Un pipeline útil necesita al menos 3 etapas visibles.",
    };
  }

  if (criteriosStatus !== "good") {
    fieldHints.criteriosAvance = {
      status: criteriosStatus === "danger" ? "danger" : "warning",
      text: "Los criterios evitan que las oportunidades avancen sin información suficiente.",
    };
  }

  if (
    etapas.length > 0 &&
    (!mitadEtapasConRt || etapasConResponsableYTareas === 0)
  ) {
    fieldHints.responsablesTareas = {
      status: "warning",
      text: "Asignar tareas o responsables reduce dependencia de memoria humana.",
    };
  }

  if (
    !hasRelevantText(reglas.decisionesHumanas, 15) &&
    etapasConValidacionHumana === 0
  ) {
    fieldHints.validacionesHumanas = {
      status: "warning",
      text: "Indicá qué pasos necesitan aprobación humana antes de avanzar.",
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

export default function ProcesoPipelinePage() {
  const [etapas, setEtapas] = useState<EtapaProceso[]>(ETAPAS_INICIALES);
  const [columnas, setColumnas] = useState<ColumnaKanban[]>(COLUMNAS_INICIALES);
  const [reglas, setReglas] = useState<ReglasValidacion>({
    condicionesAvance: "",
    decisionesHumanas: "",
    documentosPorEtapa: "",
    alertasSistema: "",
    tareasAutomaticas: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [constructorContext, setConstructorContext] = useState<SetupRecord | null>(null);
  const [mockAIEtapasRequested, setMockAIEtapasRequested] = useState(false);
  const {
    suggestions: mockAIEtapasSuggestions,
    loading: mockAIEtapasLoading,
    error: mockAIEtapasError,
    request: requestMockAIEtapas,
    clear: clearMockAIEtapas,
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
          data?: (SetupRecord & { proceso_pipeline?: unknown }) | null;
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

        const procesoPipeline = json?.data?.proceso_pipeline;

        if (
          procesoPipeline &&
          typeof procesoPipeline === "object" &&
          !Array.isArray(procesoPipeline) &&
          Object.keys(procesoPipeline).length > 0
        ) {
          if (!cancelled) {
            const loaded = procesoPipeline as Partial<ProcesoPipelinePayload>;

            setEtapas(
              Array.isArray(loaded.etapas)
                ? loaded.etapas
                    .map((etapa, index) => normalizeEtapa(etapa, index))
                    .filter((etapa): etapa is EtapaProceso => etapa !== null)
                : ETAPAS_INICIALES
            );
            setColumnas(
              Array.isArray(loaded.columnas)
                ? loaded.columnas
                    .map((columna, index) => normalizeColumna(columna, index))
                    .filter((columna): columna is ColumnaKanban => columna !== null)
                : COLUMNAS_INICIALES
            );
            setReglas(normalizeReglas(loaded.reglas));
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar el proceso y guardar nuevamente."
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

    const payloadProcesoPipeline: ProcesoPipelinePayload = {
      etapas,
      columnas,
      reglas,
    };

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          step: "proceso-pipeline",
          mark_completed: true,
          data: payloadProcesoPipeline,
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
        setSaveMessage("Proceso y pipeline guardado correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setEtapa<K extends keyof EtapaProceso>(
    id: string,
    key: K,
    value: EtapaProceso[K]
  ) {
    clearMockAIEtapas();
    setMockAIEtapasRequested(false);
    setEtapas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e))
    );
  }

  async function requestMockAISuggestionForEtapas() {
    setMockAIEtapasRequested(true);

    await requestMockAIEtapas({
      mode: "field_suggestion",
      step: "proceso_pipeline",
      field: "etapas",
      value: etapas,
      currentForm: {
        etapas,
        columnas,
        reglas,
      },
      constructorContext: constructorContext ?? {},
    });
  }

  function applyMockAIEtapaSuggestion(
    suggestion: ConstructorMockAISuggestion
  ) {
    const value = suggestion.suggestedValue;

    if (!value || typeof value !== "object" || Array.isArray(value)) return;

    const record = value as SetupRecord;
    const nombre = typeof record.nombre === "string" ? record.nombre.trim() : "";
    const descripcion =
      typeof record.descripcion === "string" ? record.descripcion.trim() : "";

    if (!nombre) return;

    setEtapas((prev) => {
      const alreadyExists = prev.some(
        (etapa) => etapa.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );

      if (alreadyExists) return prev;

      return [
        ...prev,
        {
          id: `mock-etapa-${slugFromText(nombre)}`,
          nombre,
          objetivo: descripcion,
          responsable: "Vendedor / Técnico",
          tareas: "Coordinar reunión, relevar información mínima y registrar próximos pasos",
          condicionAvance:
            "Necesidad, decisores e información mínima validados antes de preparar propuesta",
          requiereValidacionHumana: true,
        },
      ];
    });
  }

  function setColumna<K extends keyof ColumnaKanban>(
    id: string,
    key: K,
    value: ColumnaKanban[K]
  ) {
    setColumnas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  }

  function setRegla<K extends keyof ReglasValidacion>(
    key: K,
    value: ReglasValidacion[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  const empresaContext = asRecord(constructorContext?.empresa);
  const cuestionarioContext = asRecord(constructorContext?.cuestionario);
  const diagnosticoContext = asRecord(constructorContext?.diagnostico);

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
    ventaConsultiva:
      arrayOrTextIncludes(cuestionarioContext.tiposVenta, ["consultiva"]) ||
      textIncludes(cuestionarioContext.procesoActual, [
        "diagnóstico",
        "diagnostico",
        "reunión",
        "reunion",
      ]),
    requiereDiagnostico: textIncludes(cuestionarioContext.procesoActual, [
      "diagnóstico",
      "diagnostico",
      "reunión",
      "reunion",
      "visita",
    ]),
    necesitaSeguimiento:
      arrayOrTextIncludes(diagnosticoContext.riesgos, ["seguimiento"]) ||
      textIncludes(cuestionarioContext.procesoActual, ["seguimiento"]),
    riesgoTrazabilidad: arrayOrTextIncludes(diagnosticoContext.riesgos, [
      "trazabilidad",
      "información",
      "informacion",
      "pipeline",
    ]),
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
  };

  const hasPerdido = hasTextMatch([...etapas, ...columnas], ["perdido"]);
  const hasSeguimiento = hasTextMatch([...etapas, ...columnas], ["seguimiento"]);
  const hasDiagnosticoReunion = hasTextMatch(
    etapas,
    ["diagnóstico", "diagnostico", "reunión", "reunion", "visita"]
  );
  const hasGanado = hasTextMatch([...etapas, ...columnas], ["ganado"]);
  const hasOnboarding = hasTextMatch(
    [...etapas, ...columnas],
    ["onboarding", "implementación", "implementacion", "entrega"]
  );
  const hasColumnasClave = [
    ["nuevo"],
    ["contacto"],
    ["calificado"],
    ["propuesta"],
    ["negociación", "negociacion"],
    ["ganado"],
    ["perdido"],
  ].every((terms) =>
    hasTextMatch(columnas, terms)
  );
  const reglasVacias =
    !reglas.condicionesAvance.trim() &&
    !reglas.decisionesHumanas.trim() &&
    !reglas.documentosPorEtapa.trim() &&
    !reglas.alertasSistema.trim() &&
    !reglas.tareasAutomaticas.trim();
  const reglasIncompletas =
    reglasVacias ||
    !reglas.condicionesAvance.toLowerCase().includes("responsable") ||
    !reglas.condicionesAvance.toLowerCase().includes("seguimiento") ||
    !reglas.decisionesHumanas.toLowerCase().includes("propuesta");
  const condicionesAvanceSugeridas = businessContext.ventaConsultiva
    ? `${CONDICIONES_AVANCE_SUGERIDAS}\n\nEn ventas consultivas, no avanzar a propuesta sin diagnóstico o reunión validada.`
    : CONDICIONES_AVANCE_SUGERIDAS;
  const decisionesHumanasSugeridas = businessContext.necesitaValidacionHumana
    ? `${DECISIONES_HUMANAS_SUGERIDAS}\n\nEste negocio parece requerir validación humana en decisiones clave.`
    : DECISIONES_HUMANAS_SUGERIDAS;

  const localSuggestions: LocalSuggestion[] = [];

  if (etapas.length < 5) {
    localSuggestions.push({
      id: "etapas-pocas",
      targetField: "etapas",
      title: businessContext.esEducacion
        ? "Podés partir de un proceso educativo típico"
        : "Podés partir de una estructura comercial típica",
      description: businessContext.esEducacion
        ? "Lead recibido, Consulta inicial, Diagnóstico académico / reunión, Propuesta educativa, Seguimiento, Inscripción / cierre, Onboarding / inicio y Perdido."
        : "Lead recibido, Calificación, Diagnóstico / reunión, Propuesta enviada, Seguimiento, Negociación, Ganado y Perdido.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setEtapas((prev) =>
          mergeEtapasByName(
            prev,
            businessContext.esEducacion
              ? ETAPAS_EDUCACION_ASISTENTE
              : ETAPAS_ASISTENTE
          )
        ),
    });
  }

  if (columnas.length < 5 || !hasColumnasClave) {
    localSuggestions.push({
      id: "columnas-pocas",
      targetField: "columnas",
      title: "Podés partir de columnas visuales mínimas",
      description:
        "Nuevo, En contacto, Calificado, Propuesta, Negociación, Ganado y Perdido.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setColumnas((prev) => mergeColumnasByName(prev, COLUMNAS_ASISTENTE)),
    });
  }

  if (
    (businessContext.ventaConsultiva || businessContext.requiereDiagnostico) &&
    !hasDiagnosticoReunion
  ) {
    localSuggestions.push({
      id: "falta-diagnostico-reunion",
      targetField: "etapas",
      title: "El contexto sugiere agregar Diagnóstico / reunión",
      description:
        "El Cuestionario indica venta consultiva, reunión, visita o diagnóstico antes de propuesta.",
      actionLabel: "Agregar Diagnóstico / reunión",
      apply: () =>
        setEtapas((prev) =>
          mergeEtapasByName(prev, [ETAPA_DIAGNOSTICO_ASISTENTE])
        ),
    });
  }

  if (!hasPerdido) {
    localSuggestions.push({
      id: "falta-perdido",
      targetField: "columnas",
      title: "Falta una etapa o columna Perdido",
      description:
        "Sin etapa de pérdida no se pueden medir motivos de pérdida ni mejorar el proceso.",
      actionLabel: "Agregar Perdido",
      apply: () => {
        setEtapas((prev) => mergeEtapasByName(prev, [ETAPA_PERDIDO_ASISTENTE]));
        setColumnas((prev) =>
          mergeColumnasByName(prev, [COLUMNA_PERDIDO_ASISTENTE])
        );
      },
    });
  }

  if (!hasSeguimiento) {
    localSuggestions.push({
      id: "falta-seguimiento",
      targetField: "etapas",
      title: businessContext.necesitaSeguimiento
        ? "El contexto sugiere reforzar Seguimiento"
        : "Falta una etapa de Seguimiento",
      description: businessContext.necesitaSeguimiento
        ? "Diagnóstico o Cuestionario mencionan seguimiento; esta etapa ayuda a evitar oportunidades frías."
        : "Una etapa de seguimiento ayuda a evitar oportunidades frías.",
      actionLabel: "Agregar Seguimiento",
      apply: () => {
        setEtapas((prev) =>
          mergeEtapasByName(prev, [ETAPA_SEGUIMIENTO_ASISTENTE])
        );
        setColumnas((prev) =>
          mergeColumnasByName(prev, [COLUMNA_SEGUIMIENTO_ASISTENTE])
        );
      },
    });
  }

  if (hasGanado && !hasOnboarding) {
    localSuggestions.push({
      id: "falta-onboarding",
      targetField: "etapas",
      title: "Podés agregar una etapa posterior a Ganado",
      description:
        "Onboarding / implementación / entrega inicial ayuda a ordenar el traspaso después del cierre.",
      actionLabel: "Agregar Onboarding",
      apply: () => {
        setEtapas((prev) =>
          mergeEtapasByName(prev, [ETAPA_ONBOARDING_ASISTENTE])
        );
        setColumnas((prev) =>
          mergeColumnasByName(prev, [COLUMNA_ONBOARDING_ASISTENTE])
        );
      },
    });
  }

  if (!reglas.condicionesAvance.trim()) {
    localSuggestions.push({
      id: "condiciones-avance-vacias",
      targetField: "condicionesAvance",
      title: "Definí condiciones mínimas para avanzar",
      description: businessContext.ventaConsultiva
        ? "Además de responsable, próxima acción y fecha de seguimiento, en venta consultiva conviene exigir diagnóstico o reunión validada antes de propuesta."
        : "Una oportunidad solo debe avanzar si tiene próximo paso definido, responsable asignado y fecha de seguimiento.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setRegla("condicionesAvance", condicionesAvanceSugeridas),
    });
  }

  if (!reglas.decisionesHumanas.trim()) {
    localSuggestions.push({
      id: "decisiones-humanas-vacias",
      targetField: "decisionesHumanas",
      title: "Definí validaciones humanas obligatorias",
      description: businessContext.necesitaValidacionHumana
        ? "El contexto acumulado sugiere validación humana en decisiones clave: descuentos, propuestas finales, alto valor y cierre como perdido."
        : "Validar manualmente descuentos, propuestas finales, oportunidades de alto valor y cierres perdidos.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setRegla("decisionesHumanas", decisionesHumanasSugeridas),
    });
  }

  if (reglasIncompletas) {
    localSuggestions.push({
      id: "reglas-minimas-calidad",
      targetField: "reglas",
      title: "Podés completar reglas mínimas de calidad",
      description: businessContext.riesgoTrazabilidad
        ? "Como hay señales de riesgo de trazabilidad, conviene exigir responsable, próxima acción, fecha de seguimiento, motivo de pérdida y validación humana antes de propuesta final."
        : "Responsable obligatorio, próxima acción, fecha de seguimiento, motivo obligatorio al perder y validación humana antes de propuesta final.",
      actionLabel: "Aplicar reglas mínimas",
      apply: () =>
        setReglas((prev) => ({
          ...prev,
          condicionesAvance: appendTextIfMissing(
            prev.condicionesAvance,
            REGLAS_MINIMAS_CALIDAD_SUGERIDAS.condicionesAvance
          ),
          decisionesHumanas: appendTextIfMissing(
            prev.decisionesHumanas,
            REGLAS_MINIMAS_CALIDAD_SUGERIDAS.decisionesHumanas
          ),
          alertasSistema: appendTextIfMissing(
            prev.alertasSistema,
            REGLAS_MINIMAS_CALIDAD_SUGERIDAS.alertasSistema
          ),
          tareasAutomaticas: appendTextIfMissing(
            prev.tareasAutomaticas,
            REGLAS_MINIMAS_CALIDAD_SUGERIDAS.tareasAutomaticas
          ),
        })),
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
          Sugerencias basadas en Empresa, Cuestionario y Diagnóstico ya cargados.
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

  const TIPO_COLUMNA_LABEL = Object.fromEntries(
    TIPOS_COLUMNA.map((t) => [t.value, t.label])
  ) as Record<TipoColumna, string>;

  const TIPO_COLUMNA_CLASS = Object.fromEntries(
    TIPOS_COLUMNA.map((t) => [t.value, t.className])
  ) as Record<TipoColumna, string>;

  const step = CRM_SETUP_STEPS.find((s) => s.id === "proceso-pipeline");

  const readiness = evaluateProcesoPipelineReadiness({ etapas, columnas, reglas });

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
          <span className="font-medium text-slate-800">Proceso y pipeline</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso {step?.step ?? 5} de {CRM_SETUP_STEPS.length}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {step?.title ?? "Proceso y pipeline"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {step?.description ??
                "Diseñá cómo trabaja comercialmente la empresa por dentro y cómo se verá ese proceso en el tablero operativo del CRM."}
              {" "}Esta configuración todavía no sincroniza con el Kanban operativo.
            </p>
          </div>

          <StepReadinessPanel
            title="Estado de proceso y pipeline"
            readiness={readiness}
            overallProgress={getConstructorOverallProgress({
              currentStep: "proceso-pipeline",
              currentStepPercent: readiness.completionPercent,
            })}
          />

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                {loading
                  ? "Cargando proceso y pipeline guardado..."
                  : "Este paso guarda la configuración visual del Constructor."}
              </span>{" "}
              No crea ni sincroniza etapas reales del Kanban operativo todavía.
            </p>
          </div>

          {/* ── A: Diferencia conceptual ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Proceso comercial vs. Pipeline / Kanban" />
            <p className="mb-4 text-xs text-slate-500">
              Son dos representaciones del mismo trabajo comercial. El proceso define el{" "}
              <span className="font-semibold text-slate-700">cómo interno</span> de la empresa;
              el pipeline define el <span className="font-semibold text-slate-700">qué visible</span>{" "}
              en el tablero del CRM. No todo lo que existe en el proceso interno debe convertirse
              en una columna del Kanban.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Proceso comercial profundo</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {[
                    "Etapas internas con lógica específica",
                    "Tareas concretas por etapa",
                    "Responsable definido en cada paso",
                    "Documentos requeridos antes de avanzar",
                    "Condiciones de avance verificables",
                    "Decisiones que requieren aprobación humana",
                    "Validaciones automáticas posibles",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <LayoutGrid className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Pipeline / Kanban visual</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {[
                    "Columnas simples del tablero operativo",
                    "El equipo mueve oportunidades día a día",
                    "Vista rápida del estado de cada lead",
                    "Criterio de entrada y salida por columna",
                    "SLA de tiempo máximo por columna",
                    "No necesita reflejar toda la complejidad interna",
                    "Puede tener menos columnas que etapas del proceso",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ejemplo práctico */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Ejemplo práctico
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Proceso interno (5 pasos)
                  </p>
                  <ol className="space-y-1 text-xs text-slate-600">
                    {[
                      "Recibir y registrar el lead",
                      "Validar datos de contacto",
                      "Asignar responsable y origen",
                      "Solicitar documentación técnica",
                      "Coordinar visita o reunión",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-blue-700">
                    Pipeline visual (3 columnas)
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["Nuevo", "Calificación", "Visita agendada"].map((col, i, arr) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {col}
                        </span>
                        {i < arr.length - 1 && (
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                    Los 5 pasos internos se consolidan en 3 columnas operativas. El vendedor mueve
                    el lead entre columnas; el sistema verifica las condiciones internas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── B: Diseñador de etapas del proceso ──────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de etapas del proceso comercial" />
            <p className="mb-4 text-xs text-slate-500">
              Estas son las etapas internas del proceso. Editá cada una según la realidad de la empresa.
              Los cambios son locales — no se guardan todavía.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.procesoComercial} />
            <FieldQualityHint
              className="mb-2 text-[11px]"
              hint={readiness.fieldHints.responsablesTareas}
            />
            <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-violet-700">
                  Prototipo: usa endpoint mock, no OpenAI.
                </p>
                <button
                  type="button"
                  onClick={requestMockAISuggestionForEtapas}
                  disabled={mockAIEtapasLoading}
                  className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mockAIEtapasLoading
                    ? "Consultando IA mock..."
                    : "Consultar IA mock"}
                </button>
              </div>

              {mockAIEtapasError && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                  {mockAIEtapasError}
                </p>
              )}

              {mockAIEtapasSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mockAIEtapasSuggestions.map((suggestion) => (
                    <MockAISuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={applyMockAIEtapaSuggestion}
                      showApply={
                        Boolean(suggestion.suggestedValue) &&
                        typeof suggestion.suggestedValue === "object" &&
                        !Array.isArray(suggestion.suggestedValue)
                      }
                    />
                  ))}
                </div>
              )}

              {!mockAIEtapasLoading &&
                !mockAIEtapasError &&
                mockAIEtapasRequested &&
                mockAIEtapasSuggestions.length === 0 && (
                  <p className="mt-2 rounded-md border border-violet-100 bg-white px-2 py-1 text-[11px] font-medium text-violet-700">
                    No se recibieron sugerencias IA mock para este caso.
                  </p>
                )}
            </div>
            <div className="space-y-3">
              {etapas.map((etapa, index) => (
                <div
                  key={etapa.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      value={etapa.nombre}
                      onChange={(e) => setEtapa(etapa.id, "nombre", e.target.value)}
                      placeholder="Nombre de la etapa…"
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                      <button
                        type="button"
                        onClick={() =>
                          setEtapa(
                            etapa.id,
                            "requiereValidacionHumana",
                            !etapa.requiereValidacionHumana
                          )
                        }
                        className="shrink-0"
                        title="Requiere validación humana"
                      >
                        {etapa.requiereValidacionHumana ? (
                          <CheckSquare className="h-4 w-4 text-slate-900" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <ShieldAlert className="h-3 w-3 text-slate-400" />
                      Validación humana
                    </label>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <Target className="h-2.5 w-2.5" />
                          Objetivo
                        </span>
                      </label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={2}
                        value={etapa.objetivo}
                        onChange={(e) => setEtapa(etapa.id, "objetivo", e.target.value)}
                        placeholder="¿Qué se busca lograr en esta etapa?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          Responsable
                        </span>
                      </label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={etapa.responsable}
                        onChange={(e) => setEtapa(etapa.id, "responsable", e.target.value)}
                        placeholder="Ej: Vendedor / SDR"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <ListTodo className="h-2.5 w-2.5" />
                          Tareas
                        </span>
                      </label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={2}
                        value={etapa.tareas}
                        onChange={(e) => setEtapa(etapa.id, "tareas", e.target.value)}
                        placeholder="¿Qué acciones concretas hay en esta etapa?"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <ArrowRight className="h-2.5 w-2.5" />
                          Condición de avance
                        </span>
                      </label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={etapa.condicionAvance}
                        onChange={(e) => setEtapa(etapa.id, "condicionAvance", e.target.value)}
                        placeholder="¿Qué debe estar cumplido para pasar a la siguiente etapa?"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {etapas.length} etapas definidas — se guardan como configuración del Constructor.
            </p>
            {renderFieldSuggestions("etapas")}
          </div>

          {/* ── C: Diseñador de pipeline/Kanban ──────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Diseñador de pipeline / Kanban visual" />
            <p className="mb-4 text-xs text-slate-500">
              Estas son las columnas que el equipo verá en el tablero operativo. Editá nombres,
              criterios y SLAs según el ritmo real del negocio.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.pipelineVisual} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {columnas.map((col, index) => {
                const tipoInfo = TIPOS_COLUMNA.find((t) => t.value === col.tipo);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-700">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                        value={col.nombre}
                        onChange={(e) => setColumna(col.id, "nombre", e.target.value)}
                        placeholder="Nombre columna…"
                      />
                    </div>

                    {/* Tipo pills */}
                    <div className="flex flex-wrap gap-1">
                      {TIPOS_COLUMNA.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() =>
                            setColumna(col.id, "tipo", col.tipo === tipo.value ? "" : tipo.value)
                          }
                          className={[
                            "rounded px-1.5 py-0.5 text-[10px] font-medium border transition-all",
                            col.tipo === tipo.value
                              ? tipo.className + " ring-1 ring-offset-1 ring-slate-400"
                              : tipo.className + " opacity-50 hover:opacity-80",
                          ].join(" ")}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>

                    {/* Fields */}
                    <div className="space-y-2">
                      <div>
                        <label className={LABEL_CLASS}>Criterio entrada</label>
                        <textarea
                          className={TEXTAREA_CLASS}
                          rows={2}
                          value={col.criterioEntrada}
                          onChange={(e) => setColumna(col.id, "criterioEntrada", e.target.value)}
                          placeholder="¿Cuándo entra un lead a esta columna?"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Criterio salida</label>
                        <textarea
                          className={TEXTAREA_CLASS}
                          rows={2}
                          value={col.criterioSalida}
                          onChange={(e) => setColumna(col.id, "criterioSalida", e.target.value)}
                          placeholder="¿Cuándo sale?"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>SLA (días máx.)</label>
                        <input
                          type="number"
                          min={0}
                          className={INPUT_CLASS}
                          value={col.slaDias}
                          onChange={(e) => setColumna(col.id, "slaDias", e.target.value)}
                          placeholder="Días"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {columnas.length} columnas definidas — se guardan como diseño visual. Sin drag and drop todavía.
            </p>
            {renderFieldSuggestions("columnas")}
          </div>

          {/* ── D: Condiciones y validaciones ────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Condiciones y validaciones del proceso" />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que el sistema deberá implementar para controlar
              el avance, la calidad del dato y las responsabilidades.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué debe estar completo para avanzar de etapa?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.condicionesAvance}
                  onChange={(e) => setRegla("condicionesAvance", e.target.value)}
                  placeholder="Ej: Nombre, empresa, email y teléfono completos. Reunión registrada con notas…"
                />
                <FieldQualityHint hint={readiness.fieldHints.criteriosAvance} />
                {renderFieldSuggestions("condicionesAvance")}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué decisiones requieren aprobación humana?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.decisionesHumanas}
                  onChange={(e) => setRegla("decisionesHumanas", e.target.value)}
                  placeholder="Ej: Envío de propuesta, descuento mayor al 10%, cierre de contrato…"
                />
                <FieldQualityHint hint={readiness.fieldHints.validacionesHumanas} />
                {renderFieldSuggestions("decisionesHumanas")}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué documentos se generan o registran en cada etapa?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.documentosPorEtapa}
                  onChange={(e) => setRegla("documentosPorEtapa", e.target.value)}
                  placeholder="Ej: Etapa 3: acta de reunión. Etapa 5: propuesta en PDF firmada…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué alertas debería mostrar el sistema?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.alertasSistema}
                  onChange={(e) => setRegla("alertasSistema", e.target.value)}
                  placeholder="Ej: Lead sin actividad por 5 días, SLA vencido, propuesta sin respuesta en 7 días…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué tareas podrían ser automáticas?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.tareasAutomaticas}
                  onChange={(e) => setRegla("tareasAutomaticas", e.target.value)}
                  placeholder="Ej: Envío de email de seguimiento, creación de tarea de llamada, notificación al gerente…"
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
                Este panel muestra el objeto de configuración que el sistema persistirá cuando se conecte
                Supabase. Se actualiza en tiempo real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  proceso_pipeline.json — preview local
                </span>
              </div>
              <pre className="max-h-[400px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      procesoComercial: etapas.map((e) => ({
                        id: e.id,
                        nombre: e.nombre,
                        objetivo: e.objetivo || "⏳ pendiente",
                        responsable: e.responsable || "⏳ pendiente",
                        tareas: e.tareas || "⏳ pendiente",
                        condicionAvance: e.condicionAvance || "⏳ pendiente",
                        requiereValidacionHumana: e.requiereValidacionHumana,
                      })),
                      pipelineKanban: columnas.map((c) => ({
                        id: c.id,
                        nombre: c.nombre,
                        tipo: c.tipo || "⏳ sin tipo",
                        criterioEntrada: c.criterioEntrada || "⏳ pendiente",
                        criterioSalida: c.criterioSalida || "⏳ pendiente",
                        slaDias: c.slaDias ? Number(c.slaDias) : null,
                      })),
                      reglasValidacion: {
                        condicionesAvance: reglas.condicionesAvance || "⏳ pendiente",
                        decisionesHumanas: reglas.decisionesHumanas || "⏳ pendiente",
                        documentosPorEtapa: reglas.documentosPorEtapa || "⏳ pendiente",
                        alertasSistema: reglas.alertasSistema || "⏳ pendiente",
                        tareasAutomaticas: reglas.tareasAutomaticas || "⏳ pendiente",
                      },
                      meta: {
                        totalEtapas: etapas.length,
                        totalColumnas: columnas.length,
                        etapasConValidacionHumana: etapas.filter((e) => e.requiereValidacionHumana).length,
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
                  Cargando proceso y pipeline guardado...
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
                href="/admin/constructor/diagnostico"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Diagnóstico
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
                {saving ? "Guardando..." : "Guardar proceso y pipeline"}
              </button>
              <Link
                href="/admin/constructor/motores-ia"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Continuar a Motores IA
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
