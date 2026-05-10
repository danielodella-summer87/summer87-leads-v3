import type {
  BaseReadiness,
  ConstructorOverallProgress,
} from "@/lib/constructor/readiness/types";
import {
  STATUS_CHIP_CLASS,
  STATUS_DOT_CLASS,
  STATUS_TEXT_CLASS,
} from "@/lib/constructor/readiness/statusStyles";
import { clampCompletionPercent } from "@/lib/constructor/readiness/helpers";

function ProgressGradientBar({
  value,
  heightClass = "h-2",
  ariaLabel,
  className,
}: {
  value: number;
  heightClass?: string;
  ariaLabel: string;
  className?: string;
}) {
  const pct = clampCompletionPercent(value);
  const remainder = 100 - pct;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-slate-200 ${heightClass} ${className ?? ""}`}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 bg-slate-200 transition-all duration-300"
        style={{ width: `${remainder}%` }}
      />
    </div>
  );
}

type StepReadinessPanelProps = {
  title: string;
  readiness: BaseReadiness;
  className?: string;
  overallProgress?: ConstructorOverallProgress;
};

export function StepReadinessPanel({
  title,
  readiness,
  className,
  overallProgress,
}: StepReadinessPanelProps) {
  const pct = clampCompletionPercent(readiness.completionPercent);
  const overallPct =
    overallProgress !== undefined
      ? clampCompletionPercent(overallProgress.percent)
      : null;
  const rootClass =
    className ??
    "mb-8 rounded-xl border border-slate-200 bg-slate-50/60 p-4";

  return (
    <div className={rootClass}>
      {overallProgress !== undefined && overallPct !== null ? (
        <div className="mb-3 rounded-lg border border-slate-200/90 bg-white/55 px-3 py-2">
          <p className="text-[11px] font-semibold leading-snug text-slate-700">
            {overallProgress.label}
          </p>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <p className="text-base font-semibold tabular-nums leading-none text-slate-900">
              {overallPct}% total
            </p>
            <p className="text-[11px] text-slate-600">
              {overallProgress.completedSteps} de {overallProgress.totalSteps}{" "}
              etapas completas
            </p>
          </div>
          <ProgressGradientBar
            className="mt-2"
            value={overallPct}
            heightClass="h-1.5"
            ariaLabel={overallProgress.label}
          />
        </div>
      ) : null}

      <div
        className={
          overallProgress !== undefined ? "border-t border-slate-200/70 pt-3" : ""
        }
      >
        {overallProgress !== undefined ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Estado de esta etapa
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p
              className={`mt-0.5 text-xs font-medium ${STATUS_TEXT_CLASS[readiness.overallStatus]}`}
            >
              {readiness.overallLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums leading-none text-slate-900">
              {pct}%
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
              completado
            </p>
          </div>
        </div>

        <ProgressGradientBar
          className="mt-3"
          value={pct}
          heightClass="h-2"
          ariaLabel={title}
        />

        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">
            Siguiente recomendado:
          </span>{" "}
          {readiness.nextAction}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {readiness.sections.map((section) => (
            <span
              key={section.key}
              title={section.detail}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_CHIP_CLASS[section.status]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[section.status]}`}
              />
              {section.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
