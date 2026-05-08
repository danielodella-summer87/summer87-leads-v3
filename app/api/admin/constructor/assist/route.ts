import { NextRequest, NextResponse } from "next/server";
import type {
  ConstructorAISuggestion,
  ConstructorAssistMode,
  ConstructorAssistResponse,
  ConstructorStep,
} from "@/lib/constructor-ai/types";
import {
  arrayOrTextIncludes,
  asRecord,
  isRecord,
  isValidConstructorAssistMode,
  isValidConstructorStep,
  normalizeText,
  textIncludes,
} from "@/lib/constructor-ai/helpers";

export const dynamic = "force-dynamic";

// MOCK CONTROLADO:
// Este endpoint implementa el contrato futuro del asistente IA sin llamar OpenAI.
// No guarda datos, no aplica cambios y no activa CRM.
// Debe reemplazarse por lógica real con permisos antes de producción.
// TODO: exigir permiso constructor.assist antes de conectar IA real.

type ConstructorAssistRequestPayload = {
  mode?: unknown;
  step?: unknown;
  field?: unknown;
  value?: unknown;
  currentForm?: unknown;
  constructorContext?: unknown;
  metadata?: unknown;
};

const MOCK_METADATA = {
  mock: true,
  model: "mock",
  prototypeMode: true,
  requestId: "mock-constructor-assist",
} as const;

function buildMockSuggestions(input: {
  mode: ConstructorAssistMode;
  step: ConstructorStep;
  field?: string;
  value: unknown;
  currentForm: Record<string, unknown>;
  constructorContext: Record<string, unknown>;
}): ConstructorAISuggestion[] {
  const suggestions: ConstructorAISuggestion[] = [];
  const { mode, step, field, value, currentForm, constructorContext } = input;
  const normalizedField = normalizeText(field);
  const cuestionarioContext = asRecord(constructorContext.cuestionario);
  const diagnosticoContext = asRecord(constructorContext.diagnostico);
  const procesoPipelineContext = asRecord(constructorContext.proceso_pipeline);

  if (
    step === "empresa" &&
    normalizedField === "pais" &&
    textIncludes(value, ["quito"])
  ) {
    suggestions.push({
      id: "mock-country-ecuador",
      type: "correction",
      severity: "medium",
      title: "Quito parece ser una ciudad",
      message:
        "Quito es una ciudad/capital. Se sugiere registrar Ecuador como país y Quito como ciudad.",
      reason:
        "El campo esperado es país, pero el valor ingresado corresponde a una ciudad.",
      targetStep: "empresa",
      targetField: field,
      suggestedPatch: { pais: "Ecuador", ciudad: "Quito" },
      requiresHumanApproval: true,
      confidence: 0.92,
      source: "mock",
    });
  }

  if (
    step === "empresa" &&
    (normalizedField.includes("rubro") || normalizedField.includes("vertical")) &&
    textIncludes(value, ["educación", "educacion", "colegio", "universidad"])
  ) {
    suggestions.push({
      id: "mock-education-segments",
      type: "enrichment",
      severity: "low",
      title: "Podés precisar la vertical educativa",
      message:
        "Segmentos sugeridos: colegios privados, universidades, institutos técnicos, academias online y centros de capacitación.",
      reason:
        "El valor ingresado apunta a educación y puede beneficiarse de una segmentación comercial más específica.",
      targetStep: "empresa",
      targetField: field,
      suggestedValue:
        "Colegios privados, universidades, institutos técnicos, academias online, centros de capacitación",
      requiresHumanApproval: true,
      confidence: 0.78,
      source: "mock",
    });
  }

  if (
    step === "cuestionario" &&
    normalizedField === "procesoactual" &&
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length < 70
  ) {
    suggestions.push({
      id: "mock-short-commercial-process",
      type: "process_advice",
      severity: "medium",
      title: "El proceso comercial puede quedar más estructurado",
      message:
        "El mock sugiere completar el flujo con calificación, diagnóstico/reunión, propuesta, seguimiento, negociación, cierre y onboarding.",
      reason:
        "El proceso actual es breve para una configuración que después alimentará pipeline, motores IA y reportes.",
      targetStep: "cuestionario",
      targetField: field,
      suggestedValue:
        "Lead recibido → calificación → diagnóstico/reunión → propuesta → seguimiento → negociación → cierre → onboarding.",
      requiresHumanApproval: true,
      confidence: 0.82,
      source: "mock",
    });
  }

  const hasConsultativeSale =
    arrayOrTextIncludes(cuestionarioContext.tiposVenta, ["consultiva"]) ||
    textIncludes(cuestionarioContext.procesoActual, [
      "diagnóstico",
      "diagnostico",
      "reunión",
      "reunion",
    ]);

  if (
    step === "proceso_pipeline" &&
    (mode === "step_review" || mode === "field_suggestion") &&
    hasConsultativeSale
  ) {
    suggestions.push({
      id: "mock-pipeline-diagnosis-stage",
      type: "process_advice",
      severity: "medium",
      title: "La venta consultiva debería incluir diagnóstico/reunión",
      message:
        "Se sugiere agregar o validar una etapa Diagnóstico / reunión antes de propuesta.",
      reason:
        "El cuestionario indica venta consultiva o reuniones de diagnóstico, por lo que el pipeline debería reflejar ese momento comercial.",
      targetStep: "proceso_pipeline",
      targetField: "etapas",
      suggestedPatch: {
        etapaSugerida: {
          nombre: "Diagnóstico / reunión",
          objetivo: "Entender necesidad, alcance y criterios de decisión.",
          requiereValidacionHumana: true,
        },
      },
      requiresHumanApproval: true,
      confidence: 0.84,
      source: "mock",
    });
  }

  const hasSeguimientoRisk =
    arrayOrTextIncludes(diagnosticoContext.riesgos, ["seguimiento"]) ||
    arrayOrTextIncludes(procesoPipelineContext.etapas, ["seguimiento"]);

  if (step === "motores_ia" && hasSeguimientoRisk) {
    suggestions.push({
      id: "mock-ai-engine-follow-up-auditor",
      type: "ai_engine_advice",
      severity: "medium",
      title: "Podés definir un auditor de seguimiento comercial",
      message:
        "Se sugiere un motor Auditor de seguimiento comercial para detectar oportunidades sin próxima acción o con seguimiento vencido.",
      reason:
        "El diagnóstico o el pipeline mencionan seguimiento como riesgo o etapa relevante.",
      targetStep: "motores_ia",
      targetField: "motores",
      suggestedPatch: {
        motorSugerido: {
          nombre: "Auditor de seguimiento comercial",
          etapa: "Seguimiento",
          tipo: "Auditoría",
          requiereValidacionHumana: true,
        },
      },
      requiresHumanApproval: true,
      confidence: 0.8,
      source: "mock",
    });
  }

  if (
    step === "reportes" &&
    (mode === "step_review" || mode === "field_suggestion")
  ) {
    suggestions.push({
      id: "mock-reports-pipeline-executive",
      type: "report_advice",
      severity: "low",
      title: "Podés revisar reportes ejecutivos y de pipeline",
      message:
        "Se sugieren Reporte ejecutivo comercial y Reporte de pipeline como base para dirección y supervisión comercial.",
      reason:
        "Reportes suele requerir una vista ejecutiva y otra operativa para seguimiento del pipeline.",
      targetStep: "reportes",
      targetField: field ?? "reportes",
      suggestedPatch: {
        reportesSugeridos: [
          {
            nombre: "Reporte ejecutivo comercial",
            audiencia: "Dirección",
            frecuencia: "semanal",
          },
          {
            nombre: "Reporte de pipeline",
            audiencia: "Supervisor comercial",
            frecuencia: "semanal",
          },
        ],
      },
      requiresHumanApproval: true,
      confidence: 0.76,
      source: "mock",
    });
  }

  if (mode === "missing_data_check") {
    suggestions.push({
      id: `mock-missing-data-${step}`,
      type: "missing_data",
      severity: "low",
      title: "Revisar campos incompletos",
      message:
        "El mock detecta que este paso podría requerir revisión de campos obligatorios antes de activar el CRM.",
      reason:
        "La revisión de datos faltantes es parte del contrato futuro y en esta fase se devuelve una sugerencia genérica controlada.",
      targetStep: step,
      targetField: field,
      suggestedPatch:
        Object.keys(currentForm).length === 0
          ? { revisarCamposObligatorios: true }
          : undefined,
      requiresHumanApproval: true,
      confidence: 0.6,
      source: "mock",
    });
  }

  return suggestions;
}

function mockError(error: string, warning: string) {
  const body: ConstructorAssistResponse = {
    ok: false,
    error,
    suggestions: [],
    warnings: [warning],
    metadata: MOCK_METADATA,
  };

  return NextResponse.json(body, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | ConstructorAssistRequestPayload
    | null;

  if (!isRecord(body)) {
    return mockError("Payload inválido", "El body debe ser un objeto JSON.");
  }

  if (!isValidConstructorAssistMode(body.mode)) {
    return mockError(
      "mode inválido",
      "El campo mode debe ser uno de los modos definidos en el contrato."
    );
  }

  if (!isValidConstructorStep(body.step)) {
    return mockError(
      "step inválido",
      "El campo step debe ser uno de los pasos definidos en el contrato."
    );
  }

  if (body.field !== undefined && typeof body.field !== "string") {
    return mockError(
      "field inválido",
      "El campo field es opcional, pero si se envía debe ser string."
    );
  }

  if (body.currentForm !== undefined && !isRecord(body.currentForm)) {
    return mockError(
      "currentForm inválido",
      "El campo currentForm debe ser un objeto si se envía."
    );
  }

  if (
    body.constructorContext !== undefined &&
    !isRecord(body.constructorContext)
  ) {
    return mockError(
      "constructorContext inválido",
      "El campo constructorContext debe ser un objeto si se envía."
    );
  }

  const suggestions = buildMockSuggestions({
    mode: body.mode,
    step: body.step,
    field: body.field,
    value: body.value,
    currentForm: asRecord(body.currentForm),
    constructorContext: asRecord(body.constructorContext),
  });

  const response: ConstructorAssistResponse = {
    ok: true,
    suggestions,
    warnings:
      suggestions.length === 0
        ? ["Mock activo: no se detectaron sugerencias para este caso."]
        : [],
    metadata: MOCK_METADATA,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
