export type ConstructorAssistMode =
  | "field_suggestion"
  | "step_review"
  | "coherence_check"
  | "missing_data_check"
  | "client_report_review";

export type ConstructorStep =
  | "empresa"
  | "cuestionario"
  | "documentos"
  | "diagnostico"
  | "proceso_pipeline"
  | "motores_ia"
  | "reportes"
  | "auditoria";

export type ConstructorMockAISuggestion = {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  reason: string;
  targetStep: string;
  targetField?: string;
  suggestedValue?: unknown;
  suggestedPatch?: Record<string, unknown>;
  requiresHumanApproval: boolean;
  confidence: number;
  source: "mock";
};

export type ConstructorMockAIResponse = {
  ok: boolean;
  suggestions?: ConstructorMockAISuggestion[];
  warnings?: string[];
  error?: string;
};

export type RequestConstructorMockAIInput = {
  mode: ConstructorAssistMode;
  step: ConstructorStep;
  field?: string;
  value?: unknown;
  currentForm?: Record<string, unknown>;
  constructorContext?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function requestConstructorMockAI(
  input: RequestConstructorMockAIInput
): Promise<ConstructorMockAIResponse> {
  try {
    const res = await fetch("/api/admin/constructor/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        ...input,
        currentForm: input.currentForm ?? {},
        constructorContext: input.constructorContext ?? {},
        metadata: {
          source: "constructor",
          locale: "es-UY",
          prototypeMode: true,
        },
      }),
    });

    const json = (await res.json().catch(() => null)) as
      | ConstructorMockAIResponse
      | null;

    if (res.redirected || !res.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error ?? "No se pudo obtener sugerencia IA mock.",
        suggestions: json?.suggestions ?? [],
        warnings: json?.warnings ?? [],
      };
    }

    return {
      ok: true,
      suggestions: json.suggestions ?? [],
      warnings: json.warnings ?? [],
    };
  } catch {
    return {
      ok: false,
      error: "Error de red al consultar sugerencia IA mock.",
      suggestions: [],
      warnings: [],
    };
  }
}

export function pickAllowedPatch(
  patch: Record<string, unknown> | undefined,
  allowedKeys: string[]
): Record<string, unknown> {
  if (!isRecord(patch)) return {};

  const allowed = new Set(allowedKeys);

  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => allowed.has(key))
  );
}
