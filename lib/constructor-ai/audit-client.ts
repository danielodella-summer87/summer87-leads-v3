import type {
  ConstructorAISuggestionAuditEvent,
  ConstructorAISuggestionAuditEventPayload,
  ConstructorAISuggestionAuditEventResponse,
} from "./audit-types";

export async function sendConstructorAIAuditEvent(
  event: ConstructorAISuggestionAuditEvent
): Promise<ConstructorAISuggestionAuditEventResponse> {
  try {
    const response = await fetch("/api/admin/constructor/assist/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        event,
      } satisfies ConstructorAISuggestionAuditEventPayload),
    });

    const json = (await response.json().catch(() => null)) as
      | ConstructorAISuggestionAuditEventResponse
      | null;

    if (!response.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error ?? "No se pudo registrar el evento de auditoría IA mock.",
        warnings: json?.warnings ?? [],
        metadata: json?.metadata,
      };
    }

    return json;
  } catch {
    return {
      ok: false,
      error: "Error de red al registrar el evento de auditoría IA mock.",
      warnings: [],
    };
  }
}
