import type {
  ConstructorAISuggestionSeverity,
  ConstructorAISuggestionSource,
  ConstructorAISuggestionType,
  ConstructorAssistResponseMetadata,
  ConstructorStep,
} from "./types";

// Privacidad:
// Este contrato no debe usarse para guardar cookies, tokens, documentos completos,
// prompts completos con datos sensibles ni formularios completos.
// Persistencia futura debe guardar resúmenes o metadata mínima.

export type ConstructorAISuggestionAuditEventType =
  | "suggestion_shown"
  | "suggestion_applied"
  | "suggestion_ignored"
  | "suggestion_duplicate"
  | "suggestion_edited_before_apply"
  | "suggestion_failed"
  | "suggestion_empty_result";

export type ConstructorAISuggestionAuditAction =
  | "shown"
  | "applied"
  | "ignored"
  | "duplicate"
  | "edited_before_apply"
  | "failed"
  | "empty_result";

export type ConstructorAISuggestionAuditResult =
  | "success"
  | "noop"
  | "error"
  | "blocked";

export type ConstructorAISuggestionAuditMetadata = {
  prototypeMode?: boolean;
  screen?: string;
  locale?: string;
  model?: string;
  mock?: boolean;
  notes?: string;
};

export type ConstructorAISuggestionAuditEvent = {
  eventType: ConstructorAISuggestionAuditEventType;
  suggestionId?: string;
  source: ConstructorAISuggestionSource;
  step: ConstructorStep;
  field?: string;
  targetStep?: ConstructorStep;
  targetField?: string;
  suggestionType?: ConstructorAISuggestionType;
  severity?: ConstructorAISuggestionSeverity;
  confidence?: number;
  action: ConstructorAISuggestionAuditAction;
  result: ConstructorAISuggestionAuditResult;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  beforeSummary?: string;
  afterSummary?: string;
  editedValueSummary?: string;
  metadata?: ConstructorAISuggestionAuditMetadata;
};

// createdAt no forma parte de este tipo: debe generarlo el servidor cuando
// exista persistencia real. No incluir cookies, tokens ni secretos en eventos.

export type ConstructorAISuggestionAuditEventPayload = {
  event: ConstructorAISuggestionAuditEvent;
};

export type ConstructorAISuggestionAuditEventResponse = {
  ok: boolean;
  eventId?: string;
  error?: string;
  warnings?: string[];
  metadata?: ConstructorAssistResponseMetadata;
};

export const CONSTRUCTOR_AI_AUDIT_EVENT_TYPES: ConstructorAISuggestionAuditEventType[] = [
  "suggestion_shown",
  "suggestion_applied",
  "suggestion_ignored",
  "suggestion_duplicate",
  "suggestion_edited_before_apply",
  "suggestion_failed",
  "suggestion_empty_result",
];

export const CONSTRUCTOR_AI_AUDIT_ACTIONS: ConstructorAISuggestionAuditAction[] = [
  "shown",
  "applied",
  "ignored",
  "duplicate",
  "edited_before_apply",
  "failed",
  "empty_result",
];

export const CONSTRUCTOR_AI_AUDIT_RESULTS: ConstructorAISuggestionAuditResult[] = [
  "success",
  "noop",
  "error",
  "blocked",
];

export function isConstructorAISuggestionAuditEventType(
  value: unknown
): value is ConstructorAISuggestionAuditEventType {
  return (
    typeof value === "string" &&
    CONSTRUCTOR_AI_AUDIT_EVENT_TYPES.includes(
      value as ConstructorAISuggestionAuditEventType
    )
  );
}

export function isConstructorAISuggestionAuditAction(
  value: unknown
): value is ConstructorAISuggestionAuditAction {
  return (
    typeof value === "string" &&
    CONSTRUCTOR_AI_AUDIT_ACTIONS.includes(
      value as ConstructorAISuggestionAuditAction
    )
  );
}

export function isConstructorAISuggestionAuditResult(
  value: unknown
): value is ConstructorAISuggestionAuditResult {
  return (
    typeof value === "string" &&
    CONSTRUCTOR_AI_AUDIT_RESULTS.includes(
      value as ConstructorAISuggestionAuditResult
    )
  );
}
