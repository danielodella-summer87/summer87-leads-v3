import type { QualityStatus } from "./types";

export const STATUS_VALUE: Record<QualityStatus, number> = {
  good: 1,
  warning: 0.5,
  danger: 0,
  neutral: 0.25,
};

/** Text classes for summaries, hints, chips copy color on light backgrounds */
export const STATUS_LABEL_CLASS: Record<QualityStatus, string> = {
  good: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
  neutral: "text-slate-600",
};

/** Alias aligned with hints / inline emphasis (same Tailwind tokens as LABEL) */
export const STATUS_TEXT_CLASS: Record<QualityStatus, string> = {
  ...STATUS_LABEL_CLASS,
};

export const STATUS_BAR_CLASS: Record<QualityStatus, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-300",
};

export const STATUS_CHIP_CLASS: Record<QualityStatus, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export const STATUS_DOT_CLASS: Record<QualityStatus, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
};

/** Frase derivada del `overallStatus` al finalizar cada evaluate* local */
export const READINESS_SUMMARY_LABEL: Record<QualityStatus, string> = {
  good: "Listo para avanzar",
  warning: "Suficiente, pero conviene revisar",
  danger: "Faltan datos importantes",
  neutral: "Sin datos suficientes",
};
