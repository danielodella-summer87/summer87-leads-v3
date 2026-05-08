import type { ConstructorAssistMode, ConstructorStep } from "./types";

export const VALID_CONSTRUCTOR_ASSIST_MODES: ConstructorAssistMode[] = [
  "field_suggestion",
  "step_review",
  "coherence_check",
  "missing_data_check",
  "client_report_review",
];

export const VALID_CONSTRUCTOR_STEPS: ConstructorStep[] = [
  "empresa",
  "cuestionario",
  "documentos",
  "diagnostico",
  "proceso_pipeline",
  "motores_ia",
  "reportes",
  "auditoria",
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function valueToText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(valueToText).join(" ");
  }

  if (isRecord(value)) {
    return Object.values(value).map(valueToText).join(" ");
  }

  return normalizeText(value);
}

export function textIncludes(value: unknown, terms: string[]): boolean {
  const text = valueToText(value);
  return terms.some((term) => text.includes(normalizeText(term)));
}

export function arrayOrTextIncludes(value: unknown, terms: string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => textIncludes(item, terms));
  }

  return textIncludes(value, terms);
}

export function isValidConstructorAssistMode(
  value: unknown
): value is ConstructorAssistMode {
  return (
    typeof value === "string" &&
    VALID_CONSTRUCTOR_ASSIST_MODES.includes(value as ConstructorAssistMode)
  );
}

export function isValidConstructorStep(value: unknown): value is ConstructorStep {
  return (
    typeof value === "string" &&
    VALID_CONSTRUCTOR_STEPS.includes(value as ConstructorStep)
  );
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

export function hasNamedItem(items: unknown[], terms: string[]): boolean {
  return items.some((item) => {
    const name = isRecord(item)
      ? String(item.nombre ?? item.name ?? item.title ?? "")
      : String(item ?? "");

    return textIncludes(name, terms);
  });
}
