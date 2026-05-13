import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac/requirePermission";

export const dynamic = "force-dynamic";

const DEFAULT_BLOCKED_ACTIONS = [
  "create_supabase",
  "create_tenant",
  "create_users",
  "send_invites",
  "write_zeta",
  "delete_data",
  "activate_sensitive_ai",
  "expose_constructor_to_client",
  "publish_production",
  "install_crm_automatically",
] as const;

const BASE_WARNINGS = [
  "Preview only: package is not persisted.",
  "Human confirmation is required before installation.",
  "Zeta remains read-only.",
] as const;

type GenerateBody = {
  constructorId?: unknown;
  targetClientId?: unknown;
  mode?: unknown;
  includeSampleData?: unknown;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

async function requireConstructorPackageAccess(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return { id: "dev-preview" as const };
  }
  const user = await requirePermission(req, "config.read");
  if (!user) return null;
  return user;
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function buildPreviewPackage(params: {
  constructorId: string | undefined;
  includeSampleDataRequested: boolean;
  extraWarnings: string[];
}) {
  const { constructorId, includeSampleDataRequested, extraWarnings } = params;
  const warnings = [...BASE_WARNINGS, ...extraWarnings];
  if (includeSampleDataRequested) {
    warnings.push("Sample data is disabled in preview.");
  }

  return {
    ok: true as const,
    packageId: "preview-only",
    status: "preview_generated",
    requiresHumanConfirmation: true,
    package: {
      installation_manifest: {
        packageVersion: "8A-preview",
        generatedAt: new Date().toISOString(),
        generatedBy: "internal-preview-endpoint",
        sourceConstructorId: constructorId ?? "not-provided",
        targetClientName: "not-resolved-in-preview",
        targetEnvironment: "not-defined",
        installationMode: "preview",
        requiresHumanConfirmation: true,
        validationStatus: "preview_only",
      },
      client_identity: {},
      crm_modules_config: {},
      pipeline_config: {},
      lead_fields_config: {},
      permissions_config: {},
      ai_rules_config: {},
      reports_config: {},
      integrations_config: {},
      installer_decisions: {},
      activation_checklist: {},
    },
    blockedActions: [...DEFAULT_BLOCKED_ACTIONS],
    warnings,
    nextHumanAction: "review_package",
  };
}

/**
 * POST /api/admin/constructor/installable-package/generate
 * Genera un paquete instalable solo en memoria (preview). Sin persistencia ni acciones reales.
 */
export async function POST(req: NextRequest) {
  const user = await requireConstructorPackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to generate installable package preview.");
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

  const body = raw as GenerateBody;
  const extraWarnings: string[] = [];

  const modeRaw = body.mode;
  if (modeRaw !== undefined && modeRaw !== "preview") {
    extraWarnings.push('Mode normalized to "preview"; draft is not available in 8A.');
  }

  const constructorId = pickString(body.constructorId);
  if (body.targetClientId !== undefined && body.targetClientId !== null) {
    extraWarnings.push("targetClientId is ignored in preview; no tenant or client resolution.");
  }

  const includeSampleDataRequested = body.includeSampleData === true;

  const payload = buildPreviewPackage({
    constructorId,
    includeSampleDataRequested,
    extraWarnings,
  });

  return NextResponse.json(payload, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
