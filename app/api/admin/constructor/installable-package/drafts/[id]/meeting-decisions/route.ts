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

const ALLOWED_DECISIONS = [
  "advance_manual_preparation",
  "wait_kore_technical_info",
  "adjust_scope",
  "pause_project",
] as const;

type AllowedDecision = (typeof ALLOWED_DECISIONS)[number];

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function decisionToLabel(decision: AllowedDecision): string {
  switch (decision) {
    case "advance_manual_preparation":
      return "Avanzar a preparación manual controlada";
    case "wait_kore_technical_info":
      return "Esperar información técnica de Kore";
    case "adjust_scope":
      return "Ajustar alcance antes de avanzar";
    case "pause_project":
      return "Pausar proyecto";
    default:
      return decision;
  }
}

function isMissingMeetingDecisionsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("installer_package_meeting_decisions") && m.includes("does not exist");
}

type DraftGateRow = {
  id: string;
  status: string;
  human_confirmation_status: string;
};

function validateDraftForMeetingDecision(row: DraftGateRow): ReturnType<typeof jsonError> | null {
  const st = row.status;
  const human = row.human_confirmation_status ?? "";

  if (st === "rejected" || human === "rejected") {
    return jsonError(409, "DRAFT_REJECTED", "Draft is rejected; meeting decisions cannot be recorded.");
  }

  if (human === "pending") {
    return jsonError(
      409,
      "HUMAN_CONFIRMATION_REQUIRED",
      "Human confirmation is still pending; meeting decisions are only allowed after approval."
    );
  }

  const allowed = st === "approved_for_pilot" || human === "approved";
  if (!allowed) {
    return jsonError(
      409,
      "MEETING_DECISION_NOT_ALLOWED",
      "Draft must be approved for pilot (status or human confirmation) before recording a meeting decision."
    );
  }

  return null;
}

function normalizePendingItems(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x)).trim())
      .filter((s) => s.length > 0);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() : undefined;
}

type MeetingDecisionRow = {
  id: string;
  draft_id: string;
  decision: string;
  decision_label: string;
  decision_reason: string | null;
  meeting_notes: string | null;
  pending_items: unknown;
  decided_by: string | null;
  created_at: string;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = guardConstructorApiByMode();
  if (blocked) return blocked;

  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to read meeting decisions.");
  }

  const { id: draftId } = await ctx.params;
  if (!draftId || !isUuid(draftId)) {
    return jsonError(400, "INVALID_DRAFT_ID", "Draft id must be a valid UUID.");
  }

  const sb = supabaseServiceRoleClient();
  if (!sb) {
    return jsonError(500, "DATABASE_ADMIN_CLIENT_UNAVAILABLE", "Database admin client is not configured.");
  }

  const { data: draft, error: draftErr } = await sb
    .from("installer_package_drafts")
    .select("id")
    .eq("id", draftId)
    .maybeSingle();

  if (draftErr) {
    return jsonError(500, "DATABASE_QUERY_FAILED", draftErr.message ?? "Failed to load draft.");
  }

  if (!draft?.id) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const { data: rows, error: listErr } = await sb
    .from("installer_package_meeting_decisions")
    .select(
      "id, draft_id, decision, decision_label, decision_reason, meeting_notes, pending_items, decided_by, created_at"
    )
    .eq("draft_id", draftId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (listErr) {
    if (isMissingMeetingDecisionsTable(listErr)) {
      return jsonError(
        503,
        "MEETING_DECISION_TABLE_NOT_FOUND",
        "La tabla de decisiones de reunión no existe. Aplicá la migración antes de registrar decisiones."
      );
    }
    return jsonError(500, "DATABASE_QUERY_FAILED", listErr.message ?? "Failed to list meeting decisions.");
  }

  const decisions = (rows ?? []).map((r: MeetingDecisionRow) => ({
    id: r.id,
    draftId: r.draft_id,
    decision: r.decision,
    decisionLabel: r.decision_label,
    decisionReason: r.decision_reason,
    meetingNotes: r.meeting_notes,
    pendingItems: Array.isArray(r.pending_items) ? r.pending_items : [],
    decidedBy: r.decided_by,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ ok: true, decisions }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = guardConstructorApiByMode();
  if (blocked) return blocked;

  const user = await requireConstructorInstallablePackageAccess(req);
  if (!user) {
    return jsonError(403, "FORBIDDEN", "Not authorized to record meeting decisions.");
  }

  const { id: draftId } = await ctx.params;
  if (!draftId || !isUuid(draftId)) {
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
  const decisionRaw = pickString(body.decision);
  if (!decisionRaw || !ALLOWED_DECISIONS.includes(decisionRaw as AllowedDecision)) {
    return jsonError(
      400,
      "INVALID_DECISION",
      `decision must be one of: ${ALLOWED_DECISIONS.join(", ")}.`
    );
  }
  const decision = decisionRaw as AllowedDecision;

  const decisionReason = pickString(body.decisionReason) ?? null;
  const meetingNotes = pickString(body.meetingNotes) ?? null;
  const pendingItems = normalizePendingItems(body.pendingItems);

  const sb = supabaseServiceRoleClient();
  if (!sb) {
    return jsonError(500, "DATABASE_ADMIN_CLIENT_UNAVAILABLE", "Database admin client is not configured.");
  }

  const { data: row, error: draftErr } = await sb
    .from("installer_package_drafts")
    .select("id, status, human_confirmation_status")
    .eq("id", draftId)
    .maybeSingle();

  if (draftErr) {
    if (isMissingMeetingDecisionsTable(draftErr)) {
      return jsonError(
        503,
        "MEETING_DECISION_TABLE_NOT_FOUND",
        "La tabla de decisiones de reunión no existe. Aplicá la migración antes de registrar decisiones."
      );
    }
    return jsonError(500, "DATABASE_QUERY_FAILED", draftErr.message ?? "Failed to load draft.");
  }

  const draft = row as DraftGateRow | null;
  if (!draft?.id) {
    return jsonError(404, "DRAFT_NOT_FOUND", "Draft not found.");
  }

  const gate = validateDraftForMeetingDecision(draft);
  if (gate) return gate;

  const decisionLabel = decisionToLabel(decision);
  const decidedBy =
    typeof user.id === "string" && user.id.trim().length > 0 ? user.id.trim() : null;

  const { data: inserted, error: insertErr } = await sb
    .from("installer_package_meeting_decisions")
    .insert({
      draft_id: draftId,
      decision,
      decision_label: decisionLabel,
      decision_reason: decisionReason,
      meeting_notes: meetingNotes,
      pending_items: pendingItems,
      decided_by: decidedBy,
    })
    .select("id, created_at")
    .single();

  if (insertErr || !inserted?.id) {
    if (isMissingMeetingDecisionsTable(insertErr)) {
      return jsonError(
        503,
        "MEETING_DECISION_TABLE_NOT_FOUND",
        "La tabla de decisiones de reunión no existe. Aplicá la migración antes de registrar decisiones."
      );
    }
    return jsonError(500, "DATABASE_INSERT_FAILED", insertErr?.message ?? "Failed to save meeting decision.");
  }

  return NextResponse.json(
    {
      ok: true,
      decisionId: inserted.id as string,
      draftId,
      decision,
      decisionLabel,
      createdAt: inserted.created_at as string,
      message: "Meeting decision saved as audit evidence.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
