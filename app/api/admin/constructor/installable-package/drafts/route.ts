import { NextRequest, NextResponse } from "next/server";
import { guardConstructorApiByMode } from "@/lib/admin/constructorApiAccess";
import {
  jsonError,
  requireConstructorInstallablePackageAccess,
  supabaseServiceRoleClient,
} from "@/lib/admin/constructorInstallablePackageAccess";

export const dynamic = "force-dynamic";

type DraftListRow = {
  id: string;
  status: string;
  package_version: string;
  constructor_id: string | null;
  target_client_id: string | null;
  requested_by: string | null;
  generated_at: string;
  expires_at: string | null;
  warnings: unknown;
  blocked_actions: unknown;
  human_confirmation_status: string;
  created_at: string;
  updated_at: string;
};

function jsonArrayLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

const EXEC_SUMMARY_PREVIEW_LEN = 240;

function emptyEvidenceSummary() {
  return {
    snapshotCount: 0,
    latestSnapshotId: null as string | null,
    latestSnapshotCreatedAt: null as string | null,
    latestContractVersion: null as string | null,
    latestReadinessScore: null as number | null,
    latestFinalGoNoGo: null as string | null,
    latestRiskLevel: null as string | null,
    hasEvidence: false,
    latestHasExecutiveSummary: false,
    latestExecutiveSummaryPreview: null as string | null,
    latestExecutiveSummaryText: null as string | null,
  };
}

type EvidenceSummary = ReturnType<typeof emptyEvidenceSummary>;

function executiveSummaryFromSimulationPayload(payload: unknown): {
  latestHasExecutiveSummary: boolean;
  latestExecutiveSummaryPreview: string | null;
  latestExecutiveSummaryText: string | null;
} {
  const empty = {
    latestHasExecutiveSummary: false,
    latestExecutiveSummaryPreview: null as string | null,
    latestExecutiveSummaryText: null as string | null,
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
    latestHasExecutiveSummary: true,
    latestExecutiveSummaryPreview: preview,
    latestExecutiveSummaryText: text,
  };
}

function isMissingSnapshotsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("installer_package_simulation_snapshots") && m.includes("does not exist");
}

/** Máximo de filas de snapshots a traer para agregar en memoria (listado acotado de drafts). */
const SNAPSHOTS_FETCH_CAP = 8000;

/**
 * GET /api/admin/constructor/installable-package/drafts
 * Lista borradores persistidos (solo lectura; service role encapsulado en servidor).
 */
export async function GET(req: NextRequest) {
  const blocked = guardConstructorApiByMode();
  if (blocked) return blocked;

  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(
      403,
      "FORBIDDEN",
      "Not authorized to list installable package drafts."
    );
  }

  const sb = supabaseServiceRoleClient();
  if (!sb) {
    return jsonError(
      500,
      "DATABASE_ADMIN_CLIENT_UNAVAILABLE",
      "Database admin client is not configured."
    );
  }

  const limitRaw = req.nextUrl.searchParams.get("limit");
  let limit = 50;
  if (limitRaw) {
    const n = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(n) || n < 1) limit = 50;
    else limit = Math.min(200, Math.floor(n));
  }

  const { data, error } = await sb
    .from("installer_package_drafts")
    .select(
      "id, status, package_version, constructor_id, target_client_id, requested_by, generated_at, expires_at, warnings, blocked_actions, human_confirmation_status, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

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
        : "Failed to read installable package drafts."
    );
  }

  const rows = (data ?? []) as DraftListRow[];
  const items = rows.map((r) => ({
    id: r.id,
    status: r.status,
    packageVersion: r.package_version,
    constructorId: r.constructor_id,
    targetClientId: r.target_client_id,
    requestedBy: r.requested_by,
    generatedAt: r.generated_at,
    expiresAt: r.expires_at,
    warningsCount: jsonArrayLen(r.warnings),
    blockedActionsCount: jsonArrayLen(r.blocked_actions),
    humanConfirmationStatus: r.human_confirmation_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const draftIds = rows.map((r) => r.id).filter(Boolean);
  const summaryByDraft = new Map<string, EvidenceSummary>();
  let evidenceSummaryUnavailable = false;
  let evidenceSummaryMessage: string | undefined;

  if (draftIds.length > 0) {
    const { data: snapData, error: snapErr } = await sb
      .from("installer_package_simulation_snapshots")
      .select(
        "id, draft_id, contract_version, readiness_score, final_go_no_go, risk_level, created_at, simulation_payload"
      )
      .in("draft_id", draftIds)
      .order("created_at", { ascending: false })
      .limit(SNAPSHOTS_FETCH_CAP);

    if (snapErr) {
      evidenceSummaryUnavailable = true;
      evidenceSummaryMessage = isMissingSnapshotsTable(snapErr)
        ? "La tabla de snapshots no existe o no está disponible."
        : "No se pudo cargar el resumen de evidencias.";
    } else {
      const snapList = (snapData ?? []) as Array<{
        id: string;
        draft_id: string;
        contract_version: string;
        readiness_score: number | null;
        final_go_no_go: string | null;
        risk_level: string | null;
        created_at: string;
        simulation_payload: unknown;
      }>;

      const counts = new Map<string, number>();
      const latest = new Map<string, (typeof snapList)[0]>();

      for (const s of snapList) {
        const did = s.draft_id;
        if (!did) continue;
        counts.set(did, (counts.get(did) ?? 0) + 1);
        if (!latest.has(did)) latest.set(did, s);
      }

      for (const did of draftIds) {
        const n = counts.get(did) ?? 0;
        const l = latest.get(did);
        if (n === 0 || !l) {
          summaryByDraft.set(did, emptyEvidenceSummary());
          continue;
        }
        const rs = l.readiness_score;
        const readinessNum =
          rs === null || rs === undefined || Number.isNaN(Number(rs)) ? null : Math.round(Number(rs));
        const exec = executiveSummaryFromSimulationPayload(l.simulation_payload);
        summaryByDraft.set(did, {
          snapshotCount: n,
          latestSnapshotId: l.id,
          latestSnapshotCreatedAt: l.created_at,
          latestContractVersion: l.contract_version ?? null,
          latestReadinessScore: readinessNum,
          latestFinalGoNoGo: l.final_go_no_go,
          latestRiskLevel: l.risk_level,
          hasEvidence: true,
          ...exec,
        });
      }
    }
  }

  const getSummary = (draftId: string): EvidenceSummary =>
    summaryByDraft.get(draftId) ?? emptyEvidenceSummary();

  const itemsOut = items.map((it) => ({
    ...it,
    evidenceSummary: getSummary(it.id),
  }));

  return NextResponse.json(
    {
      ok: true,
      items: itemsOut,
      ...(evidenceSummaryUnavailable
        ? {
            evidenceSummaryUnavailable: true,
            evidenceSummaryMessage: evidenceSummaryMessage ?? "",
          }
        : {}),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
