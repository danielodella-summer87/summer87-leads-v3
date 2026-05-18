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

const REASON_MAX = 1000;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type DraftReadRow = {
  id: string;
  status: string;
  human_confirmation_status: string;
  expires_at: string | null;
  package_payload: unknown;
  blocked_actions: unknown;
  warnings: unknown;
};

function actorUuid(userId: string): string | null {
  return isUuid(userId) ? userId : null;
}

function isPayloadReadable(p: unknown): boolean {
  return p !== null && typeof p === "object" && !Array.isArray(p);
}

function isExpiresAtPassed(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

const ALLOWED_STATUS = new Set(["draft_generated", "under_review"]);

function validateConfirmable(row: DraftReadRow): ReturnType<typeof jsonError> | null {
  if (row.status === "approved_for_pilot") {
    return jsonError(409, "DRAFT_ALREADY_APPROVED", "Draft is already approved for pilot.");
  }
  if (row.status === "rejected") {
    return jsonError(409, "DRAFT_ALREADY_REJECTED", "Draft is already rejected.");
  }
  if (row.status === "archived") {
    return jsonError(409, "DRAFT_ARCHIVED", "Draft is archived.");
  }
  if (row.status === "expired") {
    return jsonError(409, "DRAFT_EXPIRED", "Draft has expired.");
  }
  if (isExpiresAtPassed(row.expires_at)) {
    return jsonError(409, "DRAFT_EXPIRED", "Draft expiration time has passed.");
  }
  if (row.human_confirmation_status !== "pending") {
    return jsonError(409, "DRAFT_NOT_CONFIRMABLE", "Draft human confirmation is not pending.");
  }
  if (!ALLOWED_STATUS.has(row.status)) {
    return jsonError(409, "DRAFT_NOT_CONFIRMABLE", "Draft status does not allow this action.");
  }
  return null;
}

/**
 * POST /api/admin/constructor/installable-package/drafts/[id]/reject
 * Trazabilidad mínima: rejected_by, rejected_at, rejection_reason, reviewed_* y trigger updated_at.
 * No elimina fila ni instala CRM.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = guardConstructorApiByMode();
  if (blocked) return blocked;

  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to reject installable package drafts.");
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
  const body = raw as { reason?: unknown };
  if (typeof body.reason !== "string") {
    return jsonError(400, "REJECTION_REASON_REQUIRED", "reason must be a non-empty string.");
  }
  const reason = body.reason.trim().slice(0, REASON_MAX);
  if (reason.length === 0) {
    return jsonError(400, "REJECTION_REASON_REQUIRED", "reason must be a non-empty string.");
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
    .select("id, status, human_confirmation_status, expires_at, package_payload, blocked_actions, warnings")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonError(500, "DATABASE_READ_FAILED", "Failed to read installable package draft.");
  }
  if (!data) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const row = data as DraftReadRow;
  if (!isPayloadReadable(row.package_payload)) {
    return jsonError(500, "PAYLOAD_UNREADABLE", "Draft package_payload is not a JSON object.");
  }

  const stateErr = validateConfirmable(row);
  if (stateErr) return stateErr;

  const nowIso = new Date().toISOString();
  const by = actorUuid(user.id);

  const { data: updated, error: upErr } = await sb
    .from("installer_package_drafts")
    .update({
      status: "rejected",
      human_confirmation_status: "rejected",
      rejected_by: by,
      rejected_at: nowIso,
      rejection_reason: reason,
      reviewed_by: by,
      reviewed_at: nowIso,
    })
    .eq("id", id)
    .select("id, status, human_confirmation_status, rejected_at, rejected_by, rejection_reason")
    .maybeSingle();

  if (upErr || !updated) {
    return jsonError(500, "DATABASE_UPDATE_FAILED", "Failed to reject installable package draft.");
  }

  const u = updated as {
    id: string;
    status: string;
    human_confirmation_status: string;
    rejected_at: string | null;
    rejected_by: string | null;
    rejection_reason: string | null;
  };

  return NextResponse.json(
    {
      ok: true,
      packageId: u.id,
      status: u.status,
      human_confirmation_status: u.human_confirmation_status,
      draft: {
        id: u.id,
        status: u.status,
        humanConfirmationStatus: u.human_confirmation_status,
        rejectedAt: u.rejected_at ?? nowIso,
        rejectedBy: u.rejected_by,
        rejectionReason: u.rejection_reason ?? reason,
      },
      nextHumanAction: "regenerate_or_archive",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
