/**
 * Modo del CRM y pasos del Constructor.
 * Config estática temporal — sin DB, sin API, sin localStorage.
 * Se conectará a Supabase/API en un bloque futuro.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CRMMode = "setup" | "active";

export type CRMSetupStepStatus = "pending" | "current" | "done" | "locked";

export type CRMSetupStep = {
  id: string;
  step: number;
  title: string;
  description: string;
  status: CRMSetupStepStatus;
  /** Ruta habilitada para este paso. Undefined si el paso todavía no tiene pantalla. */
  href?: string;
};

export type CRMSetupProgress = {
  totalSteps: number;
  completedSteps: number;
  currentStep: CRMSetupStep | null;
  /** Solo cuenta pasos "done". "current" es en curso, no completo. */
  progressPercent: number;
};

// ─── Modo activo ──────────────────────────────────────────────────────────────

/**
 * Modo actual del CRM. Hardcodeado en "setup" hasta que se conecte la API.
 * Tipado como CRMMode (unión) — no como literal — para que las ramas
 * condicionales sean válidas en TypeScript mientras el valor es estático.
 */
export const CRM_MODE: CRMMode = "setup";

export const CRM_MODE_LABELS: Record<CRMMode, string> = {
  setup: "Modo configuración",
  active: "CRM activo",
} as const;

// ─── Helpers de modo ──────────────────────────────────────────────────────────

export function isSetupMode(mode: CRMMode): boolean {
  return mode === "setup";
}

export function isActiveMode(mode: CRMMode): boolean {
  return mode === "active";
}

// ─── Pasos del Constructor ────────────────────────────────────────────────────

export const CRM_SETUP_STEPS: CRMSetupStep[] = [
  {
    id: "empresa",
    step: 1,
    title: "Empresa",
    status: "done",
    description:
      "Definir país, rubro, giro, vertical, web y datos base de la empresa.",
    href: "/admin/constructor/empresa",
  },
  {
    id: "cuestionario",
    step: 2,
    title: "Cuestionario",
    status: "done",
    description:
      "Responder preguntas guiadas para entender el modelo comercial.",
    href: "/admin/constructor/cuestionario",
  },
  {
    id: "documentos",
    step: 3,
    title: "Documentos fuente",
    status: "current",
    description:
      "Subir Excel, PDF, Word, capturas y materiales actuales del negocio.",
    href: "/admin/constructor/documentos",
  },
  {
    id: "diagnostico",
    step: 4,
    title: "Diagnóstico comercial",
    status: "locked",
    description:
      "Analizar cómo vende la empresa, qué datos faltan y qué riesgos existen.",
  },
  {
    id: "proceso-pipeline",
    step: 5,
    title: "Proceso y pipeline",
    status: "locked",
    description:
      "Definir etapas, tareas, responsables, condiciones de avance y columnas Kanban.",
  },
  {
    id: "motores-ia",
    step: 6,
    title: "Motores IA",
    status: "locked",
    description:
      "Diseñar qué motores IA necesita el CRM y en qué etapa actuarán.",
  },
  {
    id: "reportes",
    step: 7,
    title: "Reportes",
    status: "locked",
    description:
      "Definir reportes, métricas, filtros, frecuencia y audiencias.",
  },
  {
    id: "auditoria",
    step: 8,
    title: "Auditoría final",
    status: "locked",
    description:
      "Generar el Reporte Maestro y validar si el CRM está listo para activarse.",
  },
];

// ─── Helper de progreso ───────────────────────────────────────────────────────

/**
 * Calcula el progreso del Constructor a partir de CRM_SETUP_STEPS.
 *
 * progressPercent usa solo pasos "done" (no "current") para reflejar
 * trabajo real terminado — mostrar 12.5% cuando el paso 1 está "actual"
 * pero vacío sería engañoso. El step "current" se comunica por separado.
 */
export function getCRMSetupProgress(): CRMSetupProgress {
  const totalSteps = CRM_SETUP_STEPS.length;
  const completedSteps = CRM_SETUP_STEPS.filter(
    (s) => s.status === "done"
  ).length;
  const currentStep =
    CRM_SETUP_STEPS.find((s) => s.status === "current") ?? null;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  return { totalSteps, completedSteps, currentStep, progressPercent };
}
