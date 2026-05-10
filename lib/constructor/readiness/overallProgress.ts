import type { ConstructorOverallProgress } from "./types";

export type ConstructorStepKey =
  | "empresa"
  | "cuestionario"
  | "documentos"
  | "diagnostico"
  | "proceso-pipeline"
  | "motores-ia"
  | "reportes"
  | "auditoria";

export type ConstructorStepProgressInput = {
  currentStep: ConstructorStepKey;
  currentStepPercent: number;
};

export const CONSTRUCTOR_STEPS: Array<{
  key: ConstructorStepKey;
  label: string;
}> = [
  { key: "empresa", label: "Empresa" },
  { key: "cuestionario", label: "Cuestionario" },
  { key: "documentos", label: "Documentos Fuente" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "proceso-pipeline", label: "Proceso y pipeline" },
  { key: "motores-ia", label: "Motores IA" },
  { key: "reportes", label: "Reportes" },
  { key: "auditoria", label: "Auditoría" },
];

export function getConstructorOverallProgress(
  input: ConstructorStepProgressInput
): ConstructorOverallProgress {
  const totalSteps = CONSTRUCTOR_STEPS.length;
  const rawIndex = CONSTRUCTOR_STEPS.findIndex((s) => s.key === input.currentStep);
  const currentIndex = rawIndex >= 0 ? rawIndex : 0;
  const completedBeforeCurrent = currentIndex;
  const weightedCurrent =
    input.currentStepPercent >= 80 ? 1 : input.currentStepPercent >= 55 ? 0.5 : 0;
  const completedEquivalent = completedBeforeCurrent + weightedCurrent;
  return {
    percent: Math.round((completedEquivalent / totalSteps) * 100),
    completedSteps: Math.floor(completedEquivalent),
    totalSteps,
    label: "Avance total del Constructor CRM",
  };
}
