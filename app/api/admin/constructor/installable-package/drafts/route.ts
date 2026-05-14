import { NextRequest, NextResponse } from "next/server";
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

/**
 * GET /api/admin/constructor/installable-package/drafts
 * Lista borradores persistidos (solo lectura; service role encapsulado en servidor).
 */
export async function GET(req: NextRequest) {
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

  return NextResponse.json(
    { ok: true, items },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
