import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
// TODO: reemplazar este guard por permiso explícito constructor.assist antes de OpenAI real.

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

const OPENAI_SANDBOX_REQUEST_ID = "openai-sandbox-diagnostico" as const;
const OPENAI_SANDBOX_MODEL =
  process.env.OPENAI_SANDBOX_MODEL?.trim() || "gpt-4o-mini";

// BYPASS TEMPORAL DE PROTOTIPO:
// Permitimos usar assist sin sesión mientras el Constructor se valida internamente.
// Revertir antes de exponer a terceros.
const CONSTRUCTOR_ASSIST_AUTH_BYPASS = true;

const CRM_VALID_ROLES = ["superadmin", "admin", "staff", "member"] as const;

function isLikelyInternalSessionToken(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value.trim());
}

function isValidPrototypeCrmSession(value: string): boolean {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json);

    return (
      Boolean(parsed?.id) &&
      typeof parsed.role === "string" &&
      CRM_VALID_ROLES.includes(
        parsed.role as (typeof CRM_VALID_ROLES)[number]
      )
    );
  } catch {
    return false;
  }
}

// Seguridad mínima:
// El middleware protege rutas admin, pero este endpoint también valida sesión
// antes de cualquier integración futura con IA real.
async function hasConstructorAssistAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const crmSession = cookieStore.get("crm_session")?.value;
  const copilotSession = cookieStore.get("copilot_session")?.value;

  return Boolean(
    (crmSession &&
      (isLikelyInternalSessionToken(crmSession) ||
        isValidPrototypeCrmSession(crmSession))) ||
      copilotSession?.trim()
  );
}

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
    ((normalizedField === "pais" && textIncludes(value, ["quito"])) ||
      textIncludes(currentForm.pais, ["quito"]))
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

  if (step === "empresa") {
    const paisHasBuenosAires = textIncludes(currentForm.pais, ["buenos aires"]);
    const ciudadHasChile = textIncludes(currentForm.ciudad, ["chile"]);
    const valueHasBoth =
      textIncludes(value, ["buenos aires"]) && textIncludes(value, ["chile"]);

    if ((paisHasBuenosAires && ciudadHasChile) || valueHasBoth) {
      suggestions.push({
        id: "mock-empresa-pais-ciudad-buenos-aires-chile",
        type: "correction",
        severity: "medium",
        title: "Revisar país y ciudad",
        message:
          "Parece que país y ciudad podrían estar invertidos o cargados incorrectamente.",
        reason:
          "Buenos Aires suele corresponder a ciudad/región de Argentina, mientras que Chile corresponde a país.",
        targetStep: "empresa",
        targetField: "pais",
        suggestedPatch: {
          pais: "Argentina",
          ciudad: "Buenos Aires",
        },
        requiresHumanApproval: true,
        confidence: 0.9,
        source: "mock",
      });
    }
  }

  if (step === "empresa") {
    const automotrizKeywords = [
      "pickup",
      "4x4",
      "accesorio",
      "camioneta",
      "tapa rígida",
      "tapa rigida",
      "lona",
      "baca",
      "rejilla de techo",
    ];
    const automotrizContextValues = [
      value,
      currentForm.giro,
      currentForm.vertical,
      currentForm.queVende,
      currentForm.sitioWeb,
      currentForm.redes,
      currentForm.nombreComercial,
    ];
    const matchesAutomotriz = automotrizContextValues.some((item) =>
      textIncludes(item, automotrizKeywords)
    );

    if (matchesAutomotriz) {
      suggestions.push({
        id: "mock-empresa-rubro-automotriz-4x4",
        type: "enrichment",
        severity: "medium",
        title: "Clasificar empresa como accesorios automotrices 4x4",
        message:
          "Por los productos y canales cargados, la empresa parece enfocada en accesorios para pickups, autos y camionetas.",
        reason:
          "El sitio, Instagram, giro y productos mencionan accesorios, pickups, camionetas, tapas rígidas, lonas y equipamiento automotriz.",
        targetStep: "empresa",
        targetField: "rubro",
        suggestedPatch: {
          rubro: "Otro",
          rubroPersonalizado: "Automotriz / accesorios 4x4",
          giro: "Venta e instalación de accesorios para pickups, autos y camionetas",
          vertical: "Accesorios automotrices 4x4",
          tiposCliente: ["B2B", "B2C"],
        },
        requiresHumanApproval: true,
        confidence: 0.86,
        source: "mock",
      });
    }
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

  const shouldSuggestPipelineDiagnosisStage =
    step === "proceso_pipeline" &&
    (mode === "step_review" || mode === "field_suggestion") &&
    (hasConsultativeSale ||
      field === "etapas" ||
      normalizedField === "etapas" ||
      textIncludes(value, [
        "consultiva",
        "diagnóstico",
        "diagnostico",
        "reunión",
        "reunion",
      ]));

  if (shouldSuggestPipelineDiagnosisStage) {
    suggestions.push({
      id: "mock-proceso-pipeline-diagnostico-reunion",
      type: "process_advice",
      severity: "medium",
      title: "Agregar etapa de diagnóstico o reunión",
      message:
        "El mock sugiere incluir una etapa de diagnóstico/reunión antes de propuesta para validar necesidad, decisores y condiciones.",
      reason:
        "En procesos consultivos, avanzar a propuesta sin diagnóstico previo suele reducir calidad de calificación y seguimiento.",
      targetStep: "proceso_pipeline",
      targetField: "etapas",
      suggestedValue: {
        nombre: "Diagnóstico / reunión",
        descripcion:
          "Validar necesidad, decisores, información mínima y próximos pasos antes de preparar propuesta.",
      },
      requiresHumanApproval: true,
      confidence: 0.86,
      source: "mock",
    });
  }

  const hasSeguimientoRisk =
    arrayOrTextIncludes(diagnosticoContext.riesgos, ["seguimiento"]) ||
    arrayOrTextIncludes(procesoPipelineContext.etapas, ["seguimiento"]);

  const shouldSuggestFollowUpAuditor =
    step === "motores_ia" &&
    (mode === "step_review" || mode === "field_suggestion") &&
    (field === "motores" || normalizedField === "motores" || hasSeguimientoRisk);

  if (shouldSuggestFollowUpAuditor) {
    suggestions.push({
      id: "mock-motores-ia-auditor-seguimiento",
      type: "ai_engine_advice",
      severity: "medium",
      title: "Agregar auditor de seguimiento comercial",
      message:
        "El mock sugiere agregar un motor IA para detectar oportunidades sin seguimiento y recomendar próximas acciones.",
      reason:
        "El seguimiento comercial suele ser uno de los principales puntos de fuga en procesos con múltiples etapas.",
      targetStep: "motores_ia",
      targetField: "motores",
      suggestedValue: {
        nombre: "Auditor de seguimiento comercial",
        etapa: "Seguimiento",
        input:
          "Fecha de último contacto, próxima acción, estado de oportunidad, responsable y notas comerciales.",
        output:
          "Alertas de oportunidades frías, riesgos de abandono y recomendaciones de próxima acción.",
        requiereValidacionHumana: true,
        prioridad: "alta",
        riesgo: "medio",
      },
      requiresHumanApproval: true,
      confidence: 0.87,
      source: "mock",
    });
  }

  if (
    step === "diagnostico" &&
    (normalizedField === "riesgos" ||
      mode === "step_review" ||
      mode === "field_suggestion")
  ) {
    suggestions.push({
      id: "mock-diagnostico-riesgos-comerciales",
      type: "warning",
      severity: "medium",
      title: "Riesgos comerciales sugeridos",
      message:
        "El mock sugiere revisar riesgos frecuentes del proceso comercial antes de activar el CRM.",
      reason:
        "En diagnósticos comerciales suelen aparecer riesgos vinculados a seguimiento, trazabilidad, dependencia humana y criterios de calificación.",
      targetStep: "diagnostico",
      targetField: "riesgos",
      suggestedValue: [
        "Falta de seguimiento sistemático",
        "Baja trazabilidad del pipeline",
        "Dependencia de personas clave",
        "Pérdida de información comercial",
        "Criterios de calificación poco claros",
      ],
      requiresHumanApproval: true,
      confidence: 0.84,
      source: "mock",
    });
  }

  if (
    step === "reportes" &&
    (mode === "step_review" || mode === "field_suggestion") &&
    (field === "reportes" || normalizedField === "reportes")
  ) {
    suggestions.push({
      id: "mock-reportes-base-comerciales",
      type: "report_advice",
      severity: "low",
      title: "Agregar reportes comerciales base",
      message:
        "El mock sugiere crear reportes mínimos para dirección y seguimiento del pipeline comercial.",
      reason:
        "Todo CRM comercial debería permitir revisar salud del pipeline, actividad comercial, oportunidades estancadas y evolución de resultados.",
      targetStep: "reportes",
      targetField: "reportes",
      suggestedValue: [
        {
          nombre: "Reporte ejecutivo comercial",
          audiencia: "Dirección / gerencia",
          frecuencia: "Semanal",
          metricas: [
            "Leads nuevos",
            "Oportunidades activas",
            "Monto cotizado",
            "Monto cerrado",
            "Tasa de conversión",
          ],
          tipo: "comercial",
        },
        {
          nombre: "Reporte de pipeline",
          audiencia: "Equipo comercial",
          frecuencia: "Semanal",
          metricas: [
            "Oportunidades por etapa",
            "Oportunidades sin próxima acción",
            "Oportunidades frías",
            "Avance por responsable",
          ],
          tipo: "pipeline",
        },
      ],
      requiresHumanApproval: true,
      confidence: 0.86,
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

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  return [];
}

function buildLimitedDiagnosticoContext(input: {
  value: unknown;
  currentForm: Record<string, unknown>;
  constructorContext: Record<string, unknown>;
}) {
  const empresaContext = asRecord(input.constructorContext.empresa);
  const cuestionarioContext = asRecord(input.constructorContext.cuestionario);
  const diagnosticoContext = asRecord(input.constructorContext.diagnostico);
  const currentDiagnostico = asRecord(input.currentForm);
  const currentRiesgos = toStringList(input.value);

  return {
    empresa: {
      rubro: safeString(empresaContext.rubro),
      giro: safeString(empresaContext.giro),
      vertical: safeString(empresaContext.vertical),
      pais: safeString(empresaContext.pais),
      ciudad: safeString(empresaContext.ciudad),
    },
    cuestionario: {
      procesoActual: safeString(cuestionarioContext.procesoActual),
      tiposVenta: toStringList(cuestionarioContext.tiposVenta),
      metricasImportantes: toStringList(cuestionarioContext.metricasImportantes),
      decisores: toStringList(cuestionarioContext.decisores),
    },
    diagnostico: {
      riesgosActuales:
        currentRiesgos.length > 0
          ? currentRiesgos
          : toStringList(currentDiagnostico.riesgos).length > 0
            ? toStringList(currentDiagnostico.riesgos)
            : toStringList(diagnosticoContext.riesgos),
      oportunidadesActuales: toStringList(
        currentDiagnostico.oportunidades ?? diagnosticoContext.oportunidades
      ),
      puntosCiegosActuales: toStringList(
        currentDiagnostico.puntosCiegos ?? diagnosticoContext.puntosCiegos
      ),
    },
  };
}

function parseOpenAISandboxDiagnostico(content: string): {
  riesgos: string[];
  reason: string;
} | null {
  try {
    const parsed = JSON.parse(content) as {
      riesgos?: unknown;
      reason?: unknown;
    };
    const riesgos = toStringList(parsed.riesgos).slice(0, 5);
    const reason = safeString(parsed.reason);
    if (riesgos.length === 0) return null;
    return { riesgos, reason };
  } catch {
    return null;
  }
}

async function buildOpenAISandboxDiagnosticoSuggestions(input: {
  value: unknown;
  currentForm: Record<string, unknown>;
  constructorContext: Record<string, unknown>;
}): Promise<{
  suggestions: ConstructorAISuggestion[];
  warnings: string[];
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      suggestions: [],
      warnings: [
        "IA sandbox no disponible. Se mantiene el asistente mock/local.",
      ],
      model: OPENAI_SANDBOX_MODEL,
    };
  }

  const limitedContext = buildLimitedDiagnosticoContext(input);
  const systemPrompt =
    "Sos un consultor senior en procesos comerciales, CRM, growth y automatización. Tu tarea es sugerir riesgos comerciales para configurar un CRM. No inventes datos. Si falta contexto, marcá hipótesis. Devolvé únicamente JSON válido.";
  const userPrompt = [
    "Analizá el contexto y devolvé SOLO JSON válido con este formato exacto:",
    '{ "riesgos": ["riesgo 1", "riesgo 2", "riesgo 3", "riesgo 4", "riesgo 5"], "reason": "explicación breve" }',
    "Reglas: máximo 5 riesgos, concretos, en español, orientados al rubro y proceso comercial. No uses frases genéricas. No recomendar cambios automáticos.",
    "",
    `Contexto limitado: ${JSON.stringify(limitedContext)}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_SANDBOX_MODEL,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return {
        suggestions: [],
        warnings: [
          "IA sandbox no disponible. Se mantiene el asistente mock/local.",
        ],
        model: OPENAI_SANDBOX_MODEL,
      };
    }

    const json = (await response.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string } }> }
      | null;
    const raw = safeString(json?.choices?.[0]?.message?.content);
    const parsed = parseOpenAISandboxDiagnostico(raw);

    if (!parsed) {
      return {
        suggestions: [],
        warnings: [
          "IA sandbox devolvió un formato no válido. Se mantiene el asistente mock/local.",
        ],
        model: OPENAI_SANDBOX_MODEL,
      };
    }

    return {
      suggestions: [
        {
          id: "ai-diagnostico-riesgos-comerciales",
          type: "warning",
          severity: "medium",
          title: "Riesgos comerciales sugeridos por IA",
          message:
            "La IA sugiere revisar riesgos específicos del proceso comercial antes de activar el CRM.",
          reason:
            parsed.reason ||
            "Análisis basado en el contexto cargado en Empresa y Cuestionario.",
          targetStep: "diagnostico",
          targetField: "riesgos",
          suggestedValue: parsed.riesgos,
          requiresHumanApproval: true,
          confidence: 0.78,
          source: "ai",
        },
      ],
      warnings: [],
      model: OPENAI_SANDBOX_MODEL,
    };
  } catch {
    return {
      suggestions: [],
      warnings: ["IA sandbox no disponible. Se mantiene el asistente mock/local."],
      model: OPENAI_SANDBOX_MODEL,
    };
  }
}

function unauthorizedError() {
  const body: ConstructorAssistResponse = {
    ok: false,
    error: "No autorizado",
    suggestions: [],
    warnings: [
      "Se requiere sesión válida para usar el asistente del Constructor.",
    ],
    metadata: MOCK_METADATA,
  };

  return NextResponse.json(body, { status: 401 });
}

export async function POST(req: NextRequest) {
  // BYPASS TEMPORAL DE PROTOTIPO:
  // Mantenemos el guard pero deshabilitado por bypass mientras dura la fase de prototipo interno.
  if (!CONSTRUCTOR_ASSIST_AUTH_BYPASS) {
    const hasAccess = await hasConstructorAssistAccess();
    if (!hasAccess) return unauthorizedError();
  }

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

  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const provider =
    typeof metadata.provider === "string" ? metadata.provider : "mock";
  const currentForm = asRecord(body.currentForm);
  const constructorContext = asRecord(body.constructorContext);

  if (
    provider === "openai_sandbox" &&
    body.step === "diagnostico" &&
    body.field === "riesgos"
  ) {
    const sandboxResult = await buildOpenAISandboxDiagnosticoSuggestions({
      value: body.value,
      currentForm,
      constructorContext,
    });

    const sandboxResponse: ConstructorAssistResponse = {
      ok: true,
      suggestions: sandboxResult.suggestions,
      warnings: sandboxResult.warnings,
      metadata: {
        mock: false,
        model: sandboxResult.model,
        prototypeMode: true,
        requestId: OPENAI_SANDBOX_REQUEST_ID,
      },
    };

    return NextResponse.json(sandboxResponse, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const suggestions = buildMockSuggestions({
    mode: body.mode,
    step: body.step,
    field: body.field,
    value: body.value,
    currentForm,
    constructorContext,
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
