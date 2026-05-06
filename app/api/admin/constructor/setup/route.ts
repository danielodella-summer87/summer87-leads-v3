import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePermission } from "@/lib/rbac/requirePermission";

export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    throw new Error("Faltan env NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ApiResp<T> = { data?: T | null; error?: string | null };

async function allowDevOrRequire(req: NextRequest, perm: string) {
  if (process.env.NODE_ENV !== "production") return { id: "dev" };
  return await requirePermission(req, perm);
}

// Closed mapping prevents SQL column name injection from request body
const STEP_TO_COLUMN = {
  "empresa": "empresa",
  "cuestionario": "cuestionario",
  "documentos": "documentos",
  "diagnostico": "diagnostico",
  "proceso-pipeline": "proceso_pipeline",
  "motores-ia": "motores_ia",
  "reportes": "reportes",
  "auditoria": "auditoria",
} as const;

type StepKey = keyof typeof STEP_TO_COLUMN;

const STEP_ORDER: StepKey[] = [
  "empresa",
  "cuestionario",
  "documentos",
  "diagnostico",
  "proceso-pipeline",
  "motores-ia",
  "reportes",
  "auditoria",
];

function nextStep(current: StepKey): StepKey {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1 || idx === STEP_ORDER.length - 1) return current;
  return STEP_ORDER[idx + 1];
}

/**
 * GET /api/admin/constructor/setup
 * Devuelve la fila completa de crm_setup_config (1 por instancia).
 * 404 si la tabla está vacía (instancia sin seed).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await allowDevOrRequire(req, "config.read");
    if (!user) {
      return NextResponse.json(
        { data: null, error: "No autorizado" } satisfies ApiResp<null>,
        { status: 403 }
      );
    }

    const sb = supabaseAdmin();
    const { data: row, error } = await sb
      .from("crm_setup_config")
      .select("*")
      .maybeSingle();

    if (error) throw error;

    if (!row) {
      return NextResponse.json(
        { data: null, error: "No existe configuración de setup. Ejecutar migración 070." } satisfies ApiResp<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: row, error: null } satisfies ApiResp<typeof row>,
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { data: null, error: message } satisfies ApiResp<null>,
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/constructor/setup
 * Actualiza un paso del Constructor CRM o campos escalares de meta.
 *
 * Body:
 *   { step: StepKey, data: object, mark_completed?: boolean }
 *   | { step: "meta", data: { status?, readiness_score?, current_step?, completed_steps?, meta? } }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await allowDevOrRequire(req, "config.update");
    if (!user) {
      return NextResponse.json(
        { data: null, error: "No autorizado" } satisfies ApiResp<null>,
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { data: null, error: "Body inválido" } satisfies ApiResp<null>,
        { status: 400 }
      );
    }

    const { step, data, mark_completed } = body as {
      step: unknown;
      data: unknown;
      mark_completed?: unknown;
    };

    if (typeof step !== "string") {
      return NextResponse.json(
        { data: null, error: "Campo 'step' requerido (string)" } satisfies ApiResp<null>,
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { data: null, error: "Campo 'data' requerido (object)" } satisfies ApiResp<null>,
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    // ── Rama meta: actualiza solo campos escalares ─────────────────────────────
    if (step === "meta") {
      const metaData = data as Record<string, unknown>;
      const patch: Record<string, unknown> = {};

      if ("status" in metaData) {
        const s = metaData.status;
        if (s !== "setup" && s !== "active" && s !== "paused") {
          return NextResponse.json(
            { data: null, error: "status debe ser 'setup', 'active' o 'paused'" } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        patch.status = s;
      }

      if ("readiness_score" in metaData) {
        const rs = metaData.readiness_score;
        if (typeof rs !== "number" || rs < 0 || rs > 100) {
          return NextResponse.json(
            { data: null, error: "readiness_score debe ser un número entre 0 y 100" } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        patch.readiness_score = rs;
      }

      if ("current_step" in metaData) {
        const cs = metaData.current_step;
        if (typeof cs !== "string" || !(cs in STEP_TO_COLUMN)) {
          return NextResponse.json(
            { data: null, error: "current_step no válido" } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        patch.current_step = cs;
      }

      if ("completed_steps" in metaData) {
        const arr = metaData.completed_steps;
        if (!Array.isArray(arr) || arr.some((x) => typeof x !== "string")) {
          return NextResponse.json(
            { data: null, error: "completed_steps debe ser string[]" } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        const invalid = (arr as string[]).filter((x) => !(x in STEP_TO_COLUMN));
        if (invalid.length > 0) {
          return NextResponse.json(
            { data: null, error: `completed_steps contiene pasos no válidos: ${invalid.join(", ")}` } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        patch.completed_steps = [...new Set(arr as string[])];
      }

      if ("meta" in metaData) {
        if (typeof metaData.meta !== "object" || metaData.meta === null || Array.isArray(metaData.meta)) {
          return NextResponse.json(
            { data: null, error: "'meta' debe ser un objeto" } satisfies ApiResp<null>,
            { status: 400 }
          );
        }
        patch.meta = metaData.meta;
      }

      if (Object.keys(patch).length === 0) {
        return NextResponse.json(
          { data: null, error: "No se recibió ningún campo válido para actualizar" } satisfies ApiResp<null>,
          { status: 400 }
        );
      }

      const { data: updated, error: updateError } = await sb
        .from("crm_setup_config")
        .update(patch)
        .not("id", "is", null)
        .select("*")
        .maybeSingle();

      if (updateError) throw updateError;

      return NextResponse.json(
        { data: updated, error: null } satisfies ApiResp<typeof updated>,
        { status: 200 }
      );
    }

    // ── Rama paso del Constructor ──────────────────────────────────────────────
    if (!(step in STEP_TO_COLUMN)) {
      return NextResponse.json(
        { data: null, error: `Paso '${step}' no reconocido` } satisfies ApiResp<null>,
        { status: 400 }
      );
    }

    const stepKey = step as StepKey;
    const column = STEP_TO_COLUMN[stepKey];

    // Leer fila actual para obtener completed_steps y current_step
    const { data: current, error: readError } = await sb
      .from("crm_setup_config")
      .select("id, completed_steps, current_step")
      .maybeSingle();

    if (readError) throw readError;
    if (!current) {
      return NextResponse.json(
        { data: null, error: "No existe fila de configuración" } satisfies ApiResp<null>,
        { status: 404 }
      );
    }

    const patch: Record<string, unknown> = {
      [column]: data,
    };

    if (mark_completed === true) {
      const existing: string[] = Array.isArray(current.completed_steps)
        ? current.completed_steps
        : [];
      patch.completed_steps = [...new Set([...existing, stepKey])];
      patch.current_step = nextStep(stepKey);
    }

    const { data: updated, error: updateError } = await sb
      .from("crm_setup_config")
      .update(patch)
      .eq("id", current.id)
      .select("*")
      .maybeSingle();

    if (updateError) throw updateError;

    return NextResponse.json(
      { data: updated, error: null } satisfies ApiResp<typeof updated>,
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { data: null, error: message } satisfies ApiResp<null>,
      { status: 500 }
    );
  }
}
