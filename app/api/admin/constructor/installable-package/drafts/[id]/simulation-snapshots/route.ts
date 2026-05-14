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

type DraftGateRow = {
  id: string;
  status: string;
  human_confirmation_status: string;
};

function isMissingSnapshotsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("installer_package_simulation_snapshots") && m.includes("does not exist");
}

function extractTechnicalContract(body: Record<string, unknown>): Record<string, unknown> | null {
  const c = body.technicalPreinstallContract ?? body.technical_preinstall_contract;
  if (c && typeof c === "object" && !Array.isArray(c)) return c as Record<string, unknown>;
  return null;
}

function simulationPayloadFromBody(body: Record<string, unknown>, draftId: string): Record<string, unknown> {
  /** Omite solo el contrato en JSONB; el resto (p. ej. executiveSummaryText, checks, …) se persiste en simulation_payload. */
  const omit = new Set(["technical_preinstall_contract", "technicalPreinstallContract"]);
  const out: Record<string, unknown> = { draftId };
  for (const [k, v] of Object.entries(body)) {
    if (!omit.has(k)) out[k] = v;
  }
  if (Object.keys(out).length <= 1) {
    out.source = "simulation_snapshot_request";
    out.capturedAt = new Date().toISOString();
  }
  return out;
}

function validateDraftForSnapshot(row: DraftGateRow): ReturnType<typeof jsonError> | null {
  const st = row.status;
  const human = row.human_confirmation_status ?? "";

  if (st === "rejected" || human === "rejected") {
    return jsonError(409, "DRAFT_REJECTED", "Draft is rejected; saving simulation snapshot is not allowed.");
  }

  if (human === "pending") {
    return jsonError(
      409,
      "HUMAN_CONFIRMATION_REQUIRED",
      "Human confirmation is still pending; snapshots are only allowed after approval."
    );
  }

  const allowed = st === "approved_for_pilot" || human === "approved";
  if (!allowed) {
    return jsonError(
      409,
      "SNAPSHOT_NOT_ALLOWED",
      "Draft must be approved for pilot (status or human confirmation) before saving a snapshot."
    );
  }

  return null;
}

function validateContractForSnapshot(
  contract: Record<string, unknown>
): ReturnType<typeof jsonError> | null {
  const cvRaw = contract.contractVersion ?? contract.contract_version;
  if (typeof cvRaw !== "string" || !cvRaw.trim()) {
    return jsonError(
      400,
      "INVALID_CONTRACT",
      "technicalPreinstallContract.contractVersion is required."
    );
  }

  const readiness = contract.readiness;
  if (!readiness || typeof readiness !== "object" || Array.isArray(readiness)) {
    return jsonError(
      400,
      "INVALID_CONTRACT",
      "technicalPreinstallContract.readiness is required."
    );
  }

  return null;
}

function actorLabel(userId: string): string | null {
  const t = userId.trim();
  return t.length > 0 ? t : null;
}

const EXEC_SUMMARY_PREVIEW_LEN = 240;

function executiveSummaryFromSimulationPayload(payload: unknown): {
  hasExecutiveSummary: boolean;
  executiveSummaryPreview: string | null;
  executiveSummaryText: string | null;
} {
  const empty = {
    hasExecutiveSummary: false,
    executiveSummaryPreview: null as string | null,
    executiveSummaryText: null as string | null,
  };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return empty;
  const p = payload as Record<string, unknown>;
  const raw = p.executiveSummaryText ?? p.executive_summary_text;
  if (typeof raw !== "string") return empty;
  const text = raw.trim();
  if (!text) return empty;
  const preview =
    text.length <= EXEC_SUMMARY_PREVIEW_LEN
      ? text
      : `${text.slice(0, EXEC_SUMMARY_PREVIEW_LEN)}…`;
  return {
    hasExecutiveSummary: true,
    executiveSummaryPreview: preview,
    executiveSummaryText: text,
  };
}

/**
 * GET /api/admin/constructor/installable-package/drafts/[id]/simulation-snapshots
 * Lista snapshots del borrador (más recientes primero). Solo lectura.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to read simulation snapshots.");
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

  const { data: draft, error: draftErr } = await sb
    .from("installer_package_drafts")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (draftErr) {
    return jsonError(500, "DATABASE_READ_FAILED", "Failed to read installable package draft.");
  }
  if (!draft) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const { data: rows, error } = await sb
    .from("installer_package_simulation_snapshots")
    .select(
      "id, draft_id, snapshot_type, contract_version, simulation_status, readiness_score, final_go_no_go, risk_level, can_proceed_to_pilot_preparation, created_by, created_at, simulation_payload"
    )
    .eq("draft_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSnapshotsTable(error)) {
      return jsonError(
        503,
        "SNAPSHOT_TABLE_NOT_FOUND",
        "La tabla de snapshots no existe. Aplicá la migración antes de guardar evidencia."
      );
    }
    return jsonError(500, "DATABASE_READ_FAILED", "Failed to list simulation snapshots.");
  }

  const snapshots = (rows ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const exec = executiveSummaryFromSimulationPayload(row.simulation_payload);
    return {
      id: String(row.id ?? ""),
      draftId: String(row.draft_id ?? ""),
      snapshotType: String(row.snapshot_type ?? ""),
      contractVersion: String(row.contract_version ?? ""),
      simulationStatus: String(row.simulation_status ?? ""),
      readinessScore: row.readiness_score === null || row.readiness_score === undefined ? null : Number(row.readiness_score),
      finalGoNoGo: row.final_go_no_go === null || row.final_go_no_go === undefined ? null : String(row.final_go_no_go),
      riskLevel: row.risk_level === null || row.risk_level === undefined ? null : String(row.risk_level),
      canProceedToPilotPreparation: Boolean(row.can_proceed_to_pilot_preparation),
      createdBy: row.created_by === null || row.created_by === undefined ? null : String(row.created_by),
      createdAt: String(row.created_at ?? ""),
      hasExecutiveSummary: exec.hasExecutiveSummary,
      executiveSummaryPreview: exec.executiveSummaryPreview,
      executiveSummaryText: exec.executiveSummaryText,
    };
  });

  return NextResponse.json(
    { ok: true, draftId: id, snapshots },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/admin/constructor/installable-package/drafts/[id]/simulation-snapshots
 * Inserta evidencia auditable; no actualiza el borrador ni ejecuta instalación.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to save simulation snapshots.");
  }

  const { id } = await ctx.params;
  if (!id || !isUuid(id)) {
    return jsonError(400, "INVALID_DRAFT_ID", "Draft id must be a valid UUID.");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body.");
  }
  if (raw === null || Array.isArray(raw) || typeof raw !== "object") {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body.");
  }
  const body = raw as Record<string, unknown>;

  const contract = extractTechnicalContract(body);
  if (!contract) {
    return jsonError(
      400,
      "INVALID_SNAPSHOT_PAYLOAD",
      "technicalPreinstallContract is required in the request body."
    );
  }

  const contractErr = validateContractForSnapshot(contract);
  if (contractErr) return contractErr;

  const readiness = contract.readiness as Record<string, unknown>;

  const sb = supabaseServiceRoleClient();
  if (!sb) {
    return jsonError(
      500,
      "DATABASE_ADMIN_CLIENT_UNAVAILABLE",
      "Database admin client is not configured."
    );
  }

  const { data: row, error: readErr } = await sb
    .from("installer_package_drafts")
    .select("id, status, human_confirmation_status")
    .eq("id", id)
    .maybeSingle();

  if (readErr) {
    return jsonError(500, "DATABASE_READ_FAILED", "Failed to read installable package draft.");
  }
  if (!row) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const gateErr = validateDraftForSnapshot(row as DraftGateRow);
  if (gateErr) return gateErr;

  const contractVersion = String(contract.contractVersion ?? contract.contract_version ?? "").trim();
  const simulationStatus =
    typeof body.simulationStatus === "string" && body.simulationStatus.trim()
      ? body.simulationStatus.trim()
      : "completed";

  const readinessScoreRaw = readiness.readinessScore ?? readiness.readiness_score;
  const readinessScore =
    typeof readinessScoreRaw === "number" && Number.isFinite(readinessScoreRaw)
      ? Math.round(readinessScoreRaw)
      : typeof readinessScoreRaw === "string" && readinessScoreRaw.trim() && !Number.isNaN(Number(readinessScoreRaw))
        ? Math.round(Number(readinessScoreRaw))
        : null;

  const finalGoRaw = readiness.finalGoNoGo ?? readiness.final_go_no_go;
  const finalGoNoGo =
    finalGoRaw === null || finalGoRaw === undefined ? null : String(finalGoRaw);

  const riskRaw = readiness.riskLevel ?? readiness.risk_level;
  const riskLevel = riskRaw === null || riskRaw === undefined ? null : String(riskRaw);

  const canRaw = readiness.canProceedToPilotPreparation ?? readiness.can_proceed_to_pilot_preparation;
  const canProceedToPilotPreparation =
    typeof canRaw === "boolean"
      ? canRaw
      : typeof body.canProceedToPilotPreparation === "boolean"
        ? body.canProceedToPilotPreparation
        : false;

  const simulationPayload = simulationPayloadFromBody(body, id);

  const insertRow = {
    draft_id: id,
    snapshot_type: "preinstall_contract",
    contract_version: contractVersion,
    simulation_status: simulationStatus,
    readiness_score: readinessScore,
    final_go_no_go: finalGoNoGo,
    risk_level: riskLevel,
    can_proceed_to_pilot_preparation: canProceedToPilotPreparation,
    technical_preinstall_contract: contract,
    simulation_payload: simulationPayload,
    created_by: actorLabel(user.id),
  };

  const { data: inserted, error: insErr } = await sb
    .from("installer_package_simulation_snapshots")
    .insert(insertRow)
    .select("id, draft_id, snapshot_type, contract_version, created_at")
    .maybeSingle();

  if (insErr || !inserted) {
    if (isMissingSnapshotsTable(insErr)) {
      return jsonError(
        503,
        "SNAPSHOT_TABLE_NOT_FOUND",
        "La tabla de snapshots no existe. Aplicá la migración antes de guardar evidencia."
      );
    }
    return jsonError(500, "DATABASE_INSERT_FAILED", "Failed to save simulation snapshot.");
  }

  const ins = inserted as {
    id: string;
    draft_id: string;
    snapshot_type: string;
    contract_version: string;
    created_at: string;
  };

  return NextResponse.json(
    {
      ok: true,
      snapshotId: ins.id,
      draftId: ins.draft_id,
      snapshotType: ins.snapshot_type,
      contractVersion: ins.contract_version,
      createdAt: ins.created_at,
      message: "Simulation snapshot saved as audit evidence.",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
