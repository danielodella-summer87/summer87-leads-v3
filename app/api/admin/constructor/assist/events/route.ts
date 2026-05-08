import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isConstructorAISuggestionAuditAction,
  isConstructorAISuggestionAuditEventType,
  isConstructorAISuggestionAuditResult,
  type ConstructorAISuggestionAuditEvent,
  type ConstructorAISuggestionAuditEventPayload,
  type ConstructorAISuggestionAuditEventResponse,
} from "@/lib/constructor-ai/audit-types";
import {
  isRecord,
  isValidConstructorStep,
} from "@/lib/constructor-ai/helpers";
import type {
  ConstructorAISuggestionSource,
} from "@/lib/constructor-ai/types";

export const dynamic = "force-dynamic";

const MOCK_METADATA = {
  mock: true,
  model: "mock",
  prototypeMode: true,
  requestId: "mock-constructor-assist-events",
} as const;

// BYPASS TEMPORAL DE PROTOTIPO:
// Permitimos registrar eventos mock sin sesión mientras el Constructor se valida internamente.
// Revertir antes de exponer a terceros.
const CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS = true;

const CRM_VALID_ROLES = ["superadmin", "admin", "staff", "member"] as const;

function isLikelyInternalSessionToken(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value.trim());
}

function isValidPrototypeCrmSession(value: string): boolean {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const json = new TextDecoder().decode(bytes);
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
// Este endpoint no persiste eventos todavía, pero valida sesión como segunda capa
// antes de una futura auditoría real.
// TODO: reemplazar este guard por permiso explícito constructor.assist.audit.
async function hasConstructorAssistEventsAccess(): Promise<boolean> {
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

function isValidSuggestionSource(
  value: unknown
): value is ConstructorAISuggestionSource {
  return value === "local" || value === "mock" || value === "ai";
}

function eventResponse(
  body: ConstructorAISuggestionAuditEventResponse,
  status: number
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validationError(error: string, warning: string) {
  return eventResponse(
    {
      ok: false,
      error,
      warnings: [warning],
      metadata: MOCK_METADATA,
    },
    400
  );
}

function unauthorizedError() {
  return eventResponse(
    {
      ok: false,
      error: "No autorizado",
      warnings: [
        "Se requiere sesión válida para registrar eventos del asistente del Constructor.",
      ],
      metadata: MOCK_METADATA,
    },
    401
  );
}

function validateOptionalString(value: unknown, fieldName: string) {
  if (value !== undefined && typeof value !== "string") {
    return validationError(
      `${fieldName} inválido`,
      `El campo ${fieldName} es opcional, pero si se envía debe ser string.`
    );
  }

  return null;
}

function validateAuditEvent(
  event: Record<string, unknown>
): ConstructorAISuggestionAuditEvent | NextResponse {
  if (!isConstructorAISuggestionAuditEventType(event.eventType)) {
    return validationError(
      "eventType inválido",
      "El campo eventType debe ser uno de los eventos de auditoría permitidos."
    );
  }

  if (!isValidSuggestionSource(event.source)) {
    return validationError(
      "source inválido",
      "El campo source debe ser local, mock o ai."
    );
  }

  if (!isValidConstructorStep(event.step)) {
    return validationError(
      "step inválido",
      "El campo step debe ser uno de los pasos definidos para el Constructor."
    );
  }

  if (!isConstructorAISuggestionAuditAction(event.action)) {
    return validationError(
      "action inválido",
      "El campo action debe ser una acción de auditoría permitida."
    );
  }

  if (!isConstructorAISuggestionAuditResult(event.result)) {
    return validationError(
      "result inválido",
      "El campo result debe ser success, noop, error o blocked."
    );
  }

  const stringFieldError =
    validateOptionalString(event.field, "field") ||
    validateOptionalString(event.suggestionId, "suggestionId") ||
    validateOptionalString(event.requestId, "requestId");

  if (stringFieldError) return stringFieldError;

  if (event.confidence !== undefined && typeof event.confidence !== "number") {
    return validationError(
      "confidence inválido",
      "El campo confidence es opcional, pero si se envía debe ser number."
    );
  }

  if (event.metadata !== undefined && !isRecord(event.metadata)) {
    return validationError(
      "metadata inválido",
      "El campo metadata es opcional, pero si se envía debe ser un objeto."
    );
  }

  return event as ConstructorAISuggestionAuditEvent;
}

export async function POST(req: NextRequest) {
  // BYPASS TEMPORAL DE PROTOTIPO:
  // Mantenemos el guard pero deshabilitado por bypass mientras dura la fase de prototipo interno.
  if (!CONSTRUCTOR_ASSIST_EVENTS_AUTH_BYPASS) {
    const hasAccess = await hasConstructorAssistEventsAccess();
    if (!hasAccess) return unauthorizedError();
  }

  const body = (await req.json().catch(() => null)) as
    | ConstructorAISuggestionAuditEventPayload
    | null;

  if (!isRecord(body)) {
    return validationError(
      "Payload inválido",
      "El evento de auditoría debe enviarse como objeto JSON."
    );
  }

  if (!isRecord(body.event)) {
    return validationError(
      "event inválido",
      "El campo event debe ser un objeto de auditoría."
    );
  }

  const validatedEvent = validateAuditEvent(body.event);
  if (validatedEvent instanceof NextResponse) return validatedEvent;

  return eventResponse(
    {
      ok: true,
      eventId: "mock-constructor-ai-event",
      warnings: ["Evento recibido en modo mock. No fue persistido."],
      metadata: MOCK_METADATA,
    },
    200
  );
}
