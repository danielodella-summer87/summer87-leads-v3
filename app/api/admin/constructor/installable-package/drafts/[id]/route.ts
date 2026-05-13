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

type DraftDetailRow = {
  id: string;
  constructor_id: string | null;
  target_client_id: string | null;
  package_version: string;
  status: string;
  requires_human_confirmation: boolean;
  human_confirmation_status: string;
  requested_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  generated_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  package_payload: unknown;
  blocked_actions: unknown;
  warnings: unknown;
};

/**
 * GET /api/admin/constructor/installable-package/drafts/[id]
 * Detalle de un borrador (solo lectura).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(
      403,
      "FORBIDDEN",
      "Not authorized to read installable package drafts."
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
    .select("*")
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

  const row = data as DraftDetailRow;

  let packagePayload: unknown = row.package_payload;
  if (packagePayload !== null && typeof packagePayload !== "object") {
    return jsonError(500, "PAYLOAD_UNREADABLE", "Draft package_payload is not a JSON object.");
  }

  const draftMetadata = {
    id: row.id,
    constructorId: row.constructor_id,
    targetClientId: row.target_client_id,
    packageVersion: row.package_version,
    status: row.status,
    requiresHumanConfirmation: row.requires_human_confirmation,
    humanConfirmationStatus: row.human_confirmation_status,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    approvedBy: row.approved_by,
    rejectedBy: row.rejected_by,
    rejectionReason: row.rejection_reason,
    generatedAt: row.generated_at,
    reviewedAt: row.reviewed_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const warnings = Array.isArray(row.warnings) ? row.warnings : [];
  const blockedActions = Array.isArray(row.blocked_actions) ? row.blocked_actions : [];

  return NextResponse.json(
    {
      ok: true,
      draft: {
        metadata: draftMetadata,
        packagePayload: packagePayload ?? {},
        warnings,
        blockedActions,
        humanConfirmationStatus: row.human_confirmation_status,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
