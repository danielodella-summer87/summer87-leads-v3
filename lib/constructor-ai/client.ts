import type {
  ConstructorMockAIResponse,
  RequestConstructorMockAIInput,
} from "./types";

export { pickAllowedPatch } from "./helpers";
export type {
  ConstructorAssistMode,
  ConstructorAssistRequest,
  ConstructorAssistResponse,
  ConstructorAssistResponseMetadata,
  ConstructorAISuggestion,
  ConstructorAISuggestionSeverity,
  ConstructorAISuggestionSource,
  ConstructorAISuggestionType,
  ConstructorMockAIResponse,
  ConstructorMockAISuggestion,
  ConstructorStep,
  RequestConstructorMockAIInput,
} from "./types";

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
          ...input.metadata,
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
        metadata: json?.metadata,
      };
    }

    return {
      ok: true,
      suggestions: json.suggestions ?? [],
      warnings: json.warnings ?? [],
      metadata: json.metadata,
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
