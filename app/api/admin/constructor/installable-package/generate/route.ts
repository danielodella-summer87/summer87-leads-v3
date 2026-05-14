import { NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  requireConstructorInstallablePackageAccess,
  supabaseServiceRoleClient,
} from "@/lib/admin/constructorInstallablePackageAccess";
import {
  isPickup4x4Preset,
  mergePickup4x4IntoPackagePayload,
  PICKUP_4X4_PRESET_KEY,
} from "@/lib/admin/installablePackagePickup4x4Preset";

export const dynamic = "force-dynamic";

const DEFAULT_BLOCKED_ACTIONS = [
  "create_supabase",
  "create_tenant",
  "create_users",
  "send_invites",
  "write_kore",
  "write_zeta",
  "delete_data",
  "activate_sensitive_ai",
  "expose_constructor_to_client",
  "publish_production",
  "install_crm_automatically",
] as const;

const BASE_WARNINGS_PREVIEW = [
  "Preview only: package is not persisted.",
  "Human confirmation is required before installation.",
  "Zeta remains read-only.",
] as const;

const BASE_WARNINGS_DRAFT = [
  "Draft record persisted; CRM installation not executed.",
  "Human confirmation is required before installation.",
  "Zeta remains read-only.",
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SECRET_KEY_SUBSTRINGS = [
  "service_role",
  "servicerole",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "password",
  "authorization",
  "bearer",
  "private_key",
] as const;

type GenerateBody = {
  constructorId?: unknown;
  targetClientId?: unknown;
  mode?: unknown;
  includeSampleData?: unknown;
  preset?: unknown;
};

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function containsSecretLikeKey(obj: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  if (obj === null || typeof obj !== "object") return false;
  if (Array.isArray(obj)) {
    if (seen.has(obj)) return false;
    seen.add(obj);
    for (const item of obj) {
      if (containsSecretLikeKey(item, seen)) return true;
    }
    return false;
  }
  const rec = obj as Record<string, unknown>;
  if (seen.has(rec)) return false;
  seen.add(rec);
  for (const key of Object.keys(rec)) {
    const lower = key.toLowerCase();
    for (const frag of SECRET_KEY_SUBSTRINGS) {
      if (lower.includes(frag)) return true;
    }
    if (containsSecretLikeKey(rec[key], seen)) return true;
  }
  return false;
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function buildPackageBlock(params: {
  constructorIdRaw: string | undefined;
  installationMode: "preview" | "draft";
  packageVersion: string;
}) {
  const { constructorIdRaw, installationMode, packageVersion } = params;
  return {
    installation_manifest: {
      packageVersion,
      generatedAt: new Date().toISOString(),
      generatedBy: "internal-preview-endpoint",
      sourceConstructorId: constructorIdRaw ?? "not-provided",
      targetClientName: "not-resolved-in-preview",
      targetEnvironment: "not-defined",
      installationMode,
      requiresHumanConfirmation: true,
      validationStatus: installationMode === "draft" ? "draft_persisted" : "preview_only",
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
  };
}

function buildWarningsAndIds(params: {
  modeEffective: "preview" | "draft";
  includeSampleDataRequested: boolean;
  modeNormalizedFromUnknown: boolean;
  constructorIdRaw: string | undefined;
  targetClientIdRaw: string | null;
}) {
  const {
    modeEffective,
    includeSampleDataRequested,
    modeNormalizedFromUnknown,
    constructorIdRaw,
    targetClientIdRaw,
  } = params;

  const extra: string[] = [];
  if (includeSampleDataRequested) {
    extra.push("Sample data is disabled in preview/draft.");
  }
  if (modeNormalizedFromUnknown) {
    extra.push('Mode normalized to "preview"; only "preview" and "draft" are recognized.');
  }

  let constructorDb: string | null = null;
  if (constructorIdRaw) {
    if (isUuid(constructorIdRaw)) {
      constructorDb = constructorIdRaw;
    } else {
      extra.push("constructorId was not persisted because it is not a valid UUID.");
    }
  }

  let targetClientDb: string | null = null;
  if (targetClientIdRaw !== null && targetClientIdRaw.length > 0) {
    if (modeEffective === "preview") {
      extra.push("targetClientId is ignored in preview; no tenant or client resolution.");
    } else if (isUuid(targetClientIdRaw)) {
      targetClientDb = targetClientIdRaw;
      extra.push(
        "targetClientId is accepted only as draft metadata; no tenant/client resolution was executed in 8C."
      );
    } else {
      extra.push("targetClientId was not persisted because it is not a valid UUID.");
    }
  }

  const base =
    modeEffective === "draft" ? [...BASE_WARNINGS_DRAFT] : [...BASE_WARNINGS_PREVIEW];
  return { warnings: [...base, ...extra], constructorDb, targetClientDb };
}

/**
 * POST /api/admin/constructor/installable-package/generate
 * Preview en memoria o persistencia de borrador (draft) en installer_package_drafts. Sin instalación CRM.
 */
export async function POST(req: NextRequest) {
  const user = await requireConstructorInstallablePackageAccess(req);
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
  const modeRaw = body.mode;
  let modeEffective: "preview" | "draft" = "preview";
  let modeNormalizedFromUnknown = false;

  if (modeRaw === undefined) {
    modeEffective = "preview";
  } else if (modeRaw === "preview") {
    modeEffective = "preview";
  } else if (modeRaw === "draft") {
    modeEffective = "draft";
  } else {
    modeEffective = "preview";
    modeNormalizedFromUnknown = true;
  }

  const constructorIdRaw = pickString(body.constructorId);
  const targetClientIdRaw: string | null =
    body.targetClientId === undefined || body.targetClientId === null
      ? null
      : typeof body.targetClientId === "string"
        ? body.targetClientId.trim() || null
        : null;

  const includeSampleDataRequested = body.includeSampleData === true;
  const presetRaw = pickString(body.preset);
  const usePickup4x4Preset = isPickup4x4Preset(presetRaw);

  const builtIds = buildWarningsAndIds({
    modeEffective,
    includeSampleDataRequested,
    modeNormalizedFromUnknown,
    constructorIdRaw,
    targetClientIdRaw,
  });
  const warningList = [...builtIds.warnings];
  if (presetRaw && !usePickup4x4Preset) {
    warningList.push(
      `Unknown preset "${presetRaw}" ignored; only "${PICKUP_4X4_PRESET_KEY}" is supported in this phase.`
    );
  }
  if (usePickup4x4Preset) {
    warningList.push(
      "Package populated from controlled preset pickup_4x4; no external systems were contacted."
    );
  }
  const { constructorDb, targetClientDb } = builtIds;

  const packageVersion = modeEffective === "draft" ? "8B-draft-v1" : "8A-preview";
  const pkg = buildPackageBlock({
    constructorIdRaw,
    installationMode: modeEffective === "draft" ? "draft" : "preview",
    packageVersion,
  });

  if (usePickup4x4Preset) {
    const layers = mergePickup4x4IntoPackagePayload({
      baseInstallationManifest: { ...pkg.installation_manifest },
      constructorIdRaw,
    });
    Object.assign(pkg, layers);
  }

  const blockedActions = [...DEFAULT_BLOCKED_ACTIONS];

  if (modeEffective === "draft") {
    if (containsSecretLikeKey(pkg)) {
      return jsonError(
        400,
        "PAYLOAD_CONTAINS_SECRET",
        "Package payload contains a blocked secret-like key."
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

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const requestedBy =
      typeof user.id === "string" && isUuid(user.id) ? user.id : null;

    const { data: inserted, error: insertErr } = await sb
      .from("installer_package_drafts")
      .insert({
        constructor_id: constructorDb,
        target_client_id: targetClientDb,
        package_version: "8B-draft-v1",
        status: "draft_generated",
        package_payload: pkg,
        blocked_actions: blockedActions,
        warnings: warningList,
        requires_human_confirmation: true,
        human_confirmation_status: "pending",
        requested_by: requestedBy,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertErr || !inserted?.id) {
      return jsonError(
        500,
        "DATABASE_INSERT_FAILED",
        "Failed to persist installable package draft."
      );
    }

    const draftId = inserted.id as string;

    return NextResponse.json(
      {
        ok: true,
        packageId: draftId,
        status: "draft_generated",
        persisted: true,
        requiresHumanConfirmation: true,
        draft: {
          id: draftId,
          status: "draft_generated",
          humanConfirmationStatus: "pending",
          expiresAt,
        },
        package: pkg,
        blockedActions,
        warnings: warningList,
        nextHumanAction: "review_persisted_draft",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      packageId: "preview-only",
      status: "preview_generated",
      persisted: false,
      requiresHumanConfirmation: true,
      package: pkg,
      blockedActions,
      warnings: warningList,
      nextHumanAction: "review_package",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
