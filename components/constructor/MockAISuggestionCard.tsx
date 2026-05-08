"use client";

import type { ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";

type MockAISuggestionCardProps = {
  suggestion: ConstructorMockAISuggestion;
  onApply: (suggestion: ConstructorMockAISuggestion) => void;
  applyLabel?: string;
  showApply?: boolean;
};

export function MockAISuggestionCard({
  suggestion,
  onApply,
  applyLabel = "Aplicar sugerencia IA",
  showApply = true,
}: MockAISuggestionCardProps) {
  const confidencePercent =
    typeof suggestion.confidence === "number"
      ? Math.round(suggestion.confidence * 100)
      : null;

  return (
    <div className="rounded-lg border border-violet-100 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
          IA mock
        </span>
        <p className="text-[11px] font-semibold text-violet-900">
          {suggestion.title}
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-violet-800">
        {suggestion.message}
      </p>
      {suggestion.reason ? (
        <p className="mt-1 text-[11px] leading-relaxed text-violet-700">
          {suggestion.reason}
        </p>
      ) : null}
      {confidencePercent !== null ? (
        <p className="mt-1 text-[10px] font-medium text-violet-500">
          Confianza mock: {confidencePercent}%
        </p>
      ) : null}
      {showApply ? (
        <button
          type="button"
          onClick={() => onApply(suggestion)}
          className="mt-2 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50"
        >
          {applyLabel}
        </button>
      ) : null}
    </div>
  );
}
