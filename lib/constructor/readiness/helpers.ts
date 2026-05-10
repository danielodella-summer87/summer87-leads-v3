export function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function textLength(value: unknown): number {
  return typeof value === "string" ? value.trim().length : 0;
}

export function countSelectedValues(value: unknown): number {
  return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

export function hasRelevantText(value: unknown, minLength = 20): boolean {
  return textLength(value) >= minLength;
}

export function clampCompletionPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
