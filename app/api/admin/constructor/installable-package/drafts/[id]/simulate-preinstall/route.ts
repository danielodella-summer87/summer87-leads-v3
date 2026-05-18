import { NextRequest, NextResponse } from "next/server";
import { guardConstructorApiByMode } from "@/lib/admin/constructorApiAccess";
import {
  jsonError,
  requireConstructorInstallablePackageAccess,
  supabaseServiceRoleClient,
} from "@/lib/admin/constructorInstallablePackageAccess";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type DraftSimRow = {
  id: string;
  status: string;
  human_confirmation_status: string;
  target_client_id: string | null;
  package_payload: unknown;
};

type CheckStatus = "passed" | "warning" | "blocked" | "failed";

type SimCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  message: string;
};

function isSectionEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && !v.trim()) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function normalizePayload(raw: unknown): Record<string, unknown> | null {
  if (raw === null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return null;
}

const BLOCKED_ACTION_CODES = [
  "create_tenant",
  "create_users",
  "send_invites",
  "write_kore",
  "write_zeta",
  "install_crm_automatically",
  "publish_production",
  "enable_sensitive_automations",
  "expose_constructor_to_client",
] as const;

type CrmSectionStatus = "missing" | "partial" | "ready";

function crmSectionStatus(v: unknown): CrmSectionStatus {
  if (isSectionEmpty(v)) return "missing";
  return "ready";
}

type FinalGo = "no_go" | "pending_inputs" | "ready_for_manual_install";

function computeReadinessScore(params: {
  hasTarget: boolean;
  payloadEmpty: boolean;
  payload: Record<string, unknown>;
}): number {
  const { hasTarget, payloadEmpty, payload } = params;
  let score = 22;
  score += 28;
  if (hasTarget) score += 6;
  else score -= 16;
  if (!isSectionEmpty(payload.crm_modules_config)) score += 12;
  else score -= 12;
  if (!isSectionEmpty(payload.pipeline_config)) score += 10;
  else score -= 10;
  if (!isSectionEmpty(payload.permissions_config)) score += 10;
  else score -= 9;
  if (!isSectionEmpty(payload.lead_fields_config)) score += 6;
  if (!isSectionEmpty(payload.integrations_config)) score += 4;
  if (!isSectionEmpty(payload.reports_config)) score += 4;
  if (payloadEmpty) score -= 22;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeFinalGoNoGo(params: {
  hasTarget: boolean;
  payloadEmpty: boolean;
  payload: Record<string, unknown>;
  failedCount: number;
}): FinalGo {
  const { hasTarget, payloadEmpty, payload, failedCount } = params;
  const noCrm = isSectionEmpty(payload.crm_modules_config);
  const noPipe = isSectionEmpty(payload.pipeline_config);
  const noPerm = isSectionEmpty(payload.permissions_config);
  const noLead = isSectionEmpty(payload.lead_fields_config);
  if (!hasTarget && noCrm && noPipe && noPerm) return "no_go";
  if (failedCount > 0) return "pending_inputs";
  const minimalReady =
    hasTarget &&
    !noCrm &&
    !noPipe &&
    !noPerm &&
    !noLead &&
    !payloadEmpty;
  if (minimalReady) return "ready_for_manual_install";
  return "pending_inputs";
}

function buildTechnicalPreinstallContract(params: {
  packageId: string;
  generatedAt: string;
  hasTarget: boolean;
  targetClientId: string | null;
  payload: Record<string, unknown>;
  payloadEmpty: boolean;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  failedCount: number;
}): Record<string, unknown> {
  const {
    packageId,
    generatedAt,
    hasTarget,
    targetClientId,
    payload,
    payloadEmpty,
    riskLevel,
    summary,
    failedCount,
  } = params;

  const readinessScore = computeReadinessScore({ hasTarget, payloadEmpty, payload });
  const finalGoNoGo = computeFinalGoNoGo({
    hasTarget,
    payloadEmpty,
    payload,
    failedCount,
  });

  const tenantNotes: string[] = [
    hasTarget
      ? "UUID presente en borrador; no se resolvió tenant operativo en esta simulación."
      : "Sin target_client_id: no hay anclaje de cliente destino en el borrador.",
    "La creación de tenant queda explícitamente fuera de esta fase.",
  ];

  const installationPlanPreview = [
    {
      step: 1,
      key: "resolve_target_client",
      label: "Resolver cliente destino",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 2,
      key: "validate_package_payload",
      label: "Validar package_payload completo",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 3,
      key: "validate_crm_modules",
      label: "Validar módulos CRM",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 4,
      key: "validate_pipeline",
      label: "Validar pipeline",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 5,
      key: "validate_permissions",
      label: "Validar permisos iniciales",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 6,
      key: "validate_integrations",
      label: "Validar integraciones permitidas",
      type: "validation",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 7,
      key: "final_human_install_gate",
      label: "Aprobación final humana antes de ejecutar",
      type: "governance",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
    {
      step: 8,
      key: "prepare_pilot_install_plan",
      label: "Preparar plan de instalación piloto (documental)",
      type: "planning",
      execution: "manual_required",
      blockedInThisPhase: true,
    },
  ];

  return {
    contractVersion: "8I-preinstall-contract-v1",
    generatedAt,
    packageId,
    source: "simulation_only",
    executionPolicy: {
      mode: "simulation_only",
      canExecuteInstallation: false,
      requiresFinalHumanApproval: true,
      zetaPolicy: "read_only",
      externalWritesAllowed: false,
      productionWritesAllowed: false,
    },
    readiness: {
      readinessScore,
      finalGoNoGo,
      riskLevel,
      canProceedToPilotPreparation: false,
      summary,
    },
    tenantResolution: {
      status: hasTarget ? "metadata_only" : "not_resolved",
      targetClientId,
      targetClientName: null,
      requiresTenantCreation: true,
      notes: tenantNotes,
    },
    crmConfiguration: {
      modulesStatus: crmSectionStatus(payload.crm_modules_config),
      pipelineStatus: crmSectionStatus(payload.pipeline_config),
      leadFieldsStatus: crmSectionStatus(payload.lead_fields_config),
      permissionsStatus: crmSectionStatus(payload.permissions_config),
      reportsStatus: crmSectionStatus(payload.reports_config),
      integrationsStatus: crmSectionStatus(payload.integrations_config),
    },
    installationPlanPreview,
    requiredHumanApprovals: [
      {
        key: "final_installation_approval",
        label: "Aprobación final de instalación",
        required: true,
        reason: "La aprobación del draft no equivale a instalación real.",
      },
      {
        key: "pilot_install_readiness_review",
        label: "Revisión de readiness para piloto",
        required: true,
        reason: "Aun con package_payload poblado, la ejecución sigue siendo manual y gobernada.",
      },
    ],
    userProvisioningPlanPreview: {
      status: "not_configured",
      initialUsersDetected: 0,
      requiresManualDefinition: true,
      notes: ["No se crearán usuarios en esta fase.", "No se envían invitaciones desde esta simulación."],
    },
    zetaPolicy: {
      mode: "read_only",
      writeAllowed: false,
      reason: "Zeta permanece en modo solo lectura por regla del proyecto.",
    },
    blockedProductionActions: [...BLOCKED_ACTION_CODES],
    auditNotes: [
      "Contrato generado por simulación.",
      "No se modificó la base de datos.",
      "No se ejecutaron acciones externas.",
    ],
  };
}

/**
 * POST /api/admin/constructor/installable-package/drafts/[id]/simulate-preinstall
 * Simulación técnica solo lectura: no muta tablas, no llama externos, no toca Zeta.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = guardConstructorApiByMode();
  if (blocked) return blocked;

  const user = await requireConstructorInstallablePackageAccess(_req);
  if (!user) {
    return jsonError(
      403,
      "FORBIDDEN",
      "Not authorized to simulate installable package draft pre-install."
    );
  }

  const { id } = await ctx.params;
  if (!id || !isUuid(id)) {
    return jsonError(400, "INVALID_DRAFT_ID", "Draft id must be a valid UUID.");
  }

  const sb = supabaseServiceRoleClient();
  if (!sb) {
    return jsonError(
      500,
      "DATABASE_ADMIN_CLIENT_UNAVAILABLE",
      "Database admin client is not configured."
    );
  }

  const { data, error } = await sb
    .from("installer_package_drafts")
    .select("id, status, human_confirmation_status, target_client_id, package_payload")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    const code =
      error.code === "42P01" || error.message?.toLowerCase().includes("does not exist")
        ? "TABLE_NOT_AVAILABLE"
        : "DATABASE_READ_FAILED";
    return jsonError(
      500,
      code,
      code === "TABLE_NOT_AVAILABLE"
        ? "installer_package_drafts is not available."
        : "Failed to read installable package draft."
    );
  }

  if (!data) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const row = data as DraftSimRow;
  const st = row.status;
  const human = row.human_confirmation_status ?? "";

  if (st === "rejected" || human === "rejected") {
    return jsonError(409, "DRAFT_REJECTED", "Draft is rejected; simulation is not available.");
  }

  if (human === "pending") {
    return jsonError(
      409,
      "HUMAN_CONFIRMATION_REQUIRED",
      "Human confirmation is still pending; simulation is only available after approval."
    );
  }

  const approvedForSim = st === "approved_for_pilot" || human === "approved";
  if (!approvedForSim) {
    return jsonError(
      409,
      "SIMULATION_NOT_ALLOWED",
      "Draft must be approved for pilot (status or human confirmation) before simulation."
    );
  }

  const payload = normalizePayload(row.package_payload);
  if (payload === null) {
    return jsonError(500, "PAYLOAD_UNREADABLE", "Draft package_payload is not a JSON object.");
  }

  const checks: SimCheck[] = [];

  checks.push({
    key: "human_approval",
    label: "Aprobación humana",
    status: "passed",
    message: "El borrador cumple condición de aprobación para simulación de preinstalación.",
  });

  const targetRaw = row.target_client_id;
  const hasTarget =
    typeof targetRaw === "string" && targetRaw.trim().length > 0 ? targetRaw.trim() : null;
  if (!hasTarget) {
    checks.push({
      key: "target_client",
      label: "Cliente destino",
      status: "failed",
      message: "No hay target_client_id en el borrador; no se puede validar un cliente destino.",
    });
  } else {
    checks.push({
      key: "target_client",
      label: "Cliente destino",
      status: "warning",
      message:
        "El cliente destino figura solo como metadata del borrador; no implica tenant resuelto ni vínculo operativo.",
    });
  }

  const payloadKeys = Object.keys(payload);
  const payloadEmpty = payloadKeys.length === 0;
  if (payloadEmpty) {
    checks.push({
      key: "package_payload",
      label: "package_payload",
      status: "warning",
      message: "El package_payload está vacío; faltan secciones de configuración serializadas.",
    });
  } else {
    const criticalKeys = [
      "installation_manifest",
      "client_identity",
      "crm_modules_config",
      "pipeline_config",
      "lead_fields_config",
      "permissions_config",
      "integrations_config",
    ];
    const emptyCritical = criticalKeys.filter((k) => isSectionEmpty(payload[k]));
    if (emptyCritical.length > 0) {
      checks.push({
        key: "package_payload",
        label: "package_payload",
        status: "warning",
        message: `Hay secciones críticas vacías o ausentes: ${emptyCritical.join(", ")}.`,
      });
    } else {
      checks.push({
        key: "package_payload",
        label: "package_payload",
        status: "passed",
        message: "Las secciones críticas del package_payload tienen contenido no vacío (revisión superficial).",
      });
    }
  }

  const pushConfig = (key: string, label: string, payloadKey: string) => {
    const empty = isSectionEmpty(payload[payloadKey]);
    checks.push({
      key,
      label,
      status: empty ? "warning" : "passed",
      message: empty
        ? `No hay datos útiles en ${payloadKey} para una preinstalación piloto.`
        : `${label}: contenido presente (sin validación semántica en esta fase).`,
    });
  };

  pushConfig("crm_modules", "Módulos CRM", "crm_modules_config");
  pushConfig("pipeline", "Pipeline", "pipeline_config");
  pushConfig("lead_fields", "Campos de leads", "lead_fields_config");
  pushConfig("permissions", "Permisos iniciales", "permissions_config");
  pushConfig("integrations", "Integraciones", "integrations_config");

  checks.push({
    key: "zeta",
    label: "Zeta",
    status: "blocked",
    message: "Zeta permanece en modo solo lectura; no se permite escritura en esta fase.",
  });

  checks.push({
    key: "installation",
    label: "Instalación CRM",
    status: "blocked",
    message: "Esta fase no ejecuta instalación ni orquesta despliegues.",
  });

  const missingInputs: string[] = [];
  if (!hasTarget) missingInputs.push("Cliente destino resuelto");
  else missingInputs.push("Cliente destino operativo (más allá de metadata de draft)");
  if (isSectionEmpty(payload.crm_modules_config)) missingInputs.push("Módulos CRM definidos");
  if (isSectionEmpty(payload.pipeline_config)) missingInputs.push("Pipeline definido");
  if (isSectionEmpty(payload.lead_fields_config)) missingInputs.push("Campos de leads definidos");
  if (isSectionEmpty(payload.permissions_config)) missingInputs.push("Permisos iniciales");
  if (isSectionEmpty(payload.integrations_config)) missingInputs.push("Integraciones permitidas");
  missingInputs.push("Usuarios iniciales");
  missingInputs.push("Confirmación final de instalación");

  const failedCount = checks.filter((c) => c.status === "failed").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  let riskLevel: "low" | "medium" | "high" = "low";
  if (failedCount > 0) riskLevel = "high";
  else if (warningCount >= 3 || payloadEmpty) riskLevel = "medium";
  else if (warningCount > 0) riskLevel = "medium";

  const summary =
    failedCount > 0
      ? "El borrador está aprobado, pero hay datos críticos ausentes para avanzar con confianza hacia un piloto real."
      : warningCount > 0
        ? "El borrador está aprobado, pero requiere completar o revisar datos antes de una instalación piloto real."
        : "El borrador está aprobado y el package_payload luce poblado a nivel superficial; igualmente esta simulación no habilita ejecución.";

  const simulatedActions = [
    "Validaría cliente destino",
    "Validaría configuración mínima del CRM",
    "Validaría módulos",
    "Validaría permisos",
    "Prepararía checklist técnico",
    "Prepararía plan de instalación piloto",
  ];

  const nextRecommendedAction =
    failedCount > 0
      ? "Completar datos críticos (p. ej. cliente destino y secciones del package_payload) antes de planificar piloto."
      : warningCount > 0
        ? "Completar configuración mínima y revisar warnings antes de instalar."
        : "Mantener revisión humana y checklist operativo antes de cualquier ejecución real.";

  const canProceedToPilotPreparation = false;

  const generatedAt = new Date().toISOString();
  const technicalPreinstallContract = buildTechnicalPreinstallContract({
    packageId: row.id,
    generatedAt,
    hasTarget: Boolean(hasTarget),
    targetClientId: hasTarget,
    payload,
    payloadEmpty,
    riskLevel,
    summary,
    failedCount,
  });

  return NextResponse.json(
    {
      ok: true,
      packageId: row.id,
      mode: "simulation_only",
      simulationStatus: "completed",
      canProceedToPilotPreparation,
      riskLevel,
      summary,
      checks,
      missingInputs,
      simulatedActions,
      blockedActions: [...BLOCKED_ACTION_CODES],
      nextRecommendedAction,
      technicalPreinstallContract,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
