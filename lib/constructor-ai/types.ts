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

export type ConstructorAISuggestionType =
  | "correction"
  | "enrichment"
  | "warning"
  | "missing_data"
  | "contradiction"
  | "process_advice"
  | "report_advice"
  | "ai_engine_advice"
  | "client_validation_note";

export type ConstructorAISuggestionSeverity =
  | "low"
  | "medium"
  | "high"
  | "blocker";

export type ConstructorAISuggestionSource = "local" | "mock" | "ai";

export type ConstructorAISuggestion = {
  id: string;
  type: ConstructorAISuggestionType;
  severity: ConstructorAISuggestionSeverity;
  title: string;
  message: string;
  reason: string;
  targetStep: ConstructorStep;
  targetField?: string;
  suggestedValue?: unknown;
  suggestedPatch?: Record<string, unknown>;
  requiresHumanApproval: boolean;
  confidence: number;
  source: ConstructorAISuggestionSource;
};

export type ConstructorAssistRequest = {
  mode: ConstructorAssistMode;
  step: ConstructorStep;
  field?: string;
  value?: unknown;
  currentForm?: Record<string, unknown>;
  constructorContext?: Record<string, unknown>;
  metadata?: {
    source?: string;
    locale?: string;
    prototypeMode?: boolean;
  };
};

export type ConstructorAssistResponseMetadata = {
  mock?: boolean;
  model?: string;
  prototypeMode?: boolean;
  requestId?: string;
};

export type ConstructorAssistResponse = {
  ok: boolean;
  suggestions?: ConstructorAISuggestion[];
  warnings?: string[];
  error?: string;
  metadata?: ConstructorAssistResponseMetadata;
};

export type RequestConstructorMockAIInput = {
  mode: ConstructorAssistMode;
  step: ConstructorStep;
  field?: string;
  value?: unknown;
  currentForm?: Record<string, unknown>;
  constructorContext?: Record<string, unknown>;
  metadata?: ConstructorAssistRequest["metadata"];
};

export type ConstructorMockAISuggestion = ConstructorAISuggestion;
export type ConstructorMockAIResponse = ConstructorAssistResponse;
