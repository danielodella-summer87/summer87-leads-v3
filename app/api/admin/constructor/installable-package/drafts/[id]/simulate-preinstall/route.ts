import { NextRequest, NextResponse } from "next/server";
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
  "write_zeta",
  "install_crm_automatically",
  "publish_production",
] as const;

/**
 * POST /api/admin/constructor/installable-package/drafts/[id]/simulate-preinstall
 * Simulación técnica solo lectura: no muta tablas, no llama externos, no toca Zeta.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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
      "Draft must be approved for pilot (status and human confirmation) before simulation."
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
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
