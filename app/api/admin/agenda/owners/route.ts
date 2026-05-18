import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

type OwnerOption = {
  id: string;
  nombre: string;
};

/** Usuarios CRM activos para invitados en Agenda (sin role_id ni permisos). */
type AgendaInviteUserOption = {
  id: string;
  nombre: string;
  email: string | null;
  role: string | null;
};

type OwnersResponse = {
  leads: OwnerOption[];
  socios: OwnerOption[];
  users: AgendaInviteUserOption[];
};

type ApiResp<T> = { data?: T | null; error?: string | null };

function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Error desconocido";
  }
}

/**
 * GET /api/admin/agenda/owners
 * Devuelve leads, socios y usuarios activos (invitados Agenda).
 */
export async function GET(req: Request) {
  try {
    const { requirePermission } = await import("@/lib/rbac/requirePermission");
    const allowed = await requirePermission(req, "leads.read");
    if (!allowed) {
      return NextResponse.json(
        { data: null, error: "No autorizado" } satisfies ApiResp<null>,
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = supabaseAdmin();

    // Leads
    const leadsRes = await supabase
      .from("leads")
      .select("id,nombre")
      .order("nombre", { ascending: true });

    if (leadsRes.error) {
      console.error("[Agenda Owners] Error query leads:", leadsRes.error);
    }

    // Socios
    const sociosRes = await supabase
      .from("socios")
      .select("id,nombre")
      .order("nombre", { ascending: true });

    if (sociosRes.error) {
      console.error("[Agenda Owners] Error query socios:", sociosRes.error);
    }

    const leads: OwnerOption[] = (leadsRes.data ?? []).map((row) => ({
      id: toStr((row as Record<string, unknown>).id),
      nombre: toStr((row as Record<string, unknown>).nombre, "(Sin nombre)") || "(Sin nombre)",
    }));

    const socios: OwnerOption[] = (sociosRes.data ?? []).map((row) => ({
      id: toStr((row as Record<string, unknown>).id),
      nombre: toStr((row as Record<string, unknown>).nombre, "(Sin nombre)") || "(Sin nombre)",
    }));

    const usersRes = await supabase
      .from("app_users")
      .select("id,nombre,email,roles:role_id(name)")
      .eq("is_active", true)
      .order("nombre", { ascending: true });

    if (usersRes.error) {
      console.error("[Agenda Owners] Error query app_users:", usersRes.error);
    }

    const users: AgendaInviteUserOption[] = (usersRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const rel = r.roles as { name?: string } | { name?: string }[] | null | undefined;
      const roleName =
        rel == null
          ? null
          : Array.isArray(rel)
            ? rel[0]?.name ?? null
            : rel.name ?? null;

      return {
        id: toStr(r.id),
        nombre: toStr(r.nombre, "(Sin nombre)") || "(Sin nombre)",
        email: typeof r.email === "string" ? r.email : null,
        role: roleName != null ? String(roleName) : null,
      };
    });

    const response: OwnersResponse = { leads, socios, users };

    return NextResponse.json({ data: response, error: null } satisfies ApiResp<OwnersResponse>, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: unknown) {
    console.error("[Agenda Owners] Error inesperado:", e);
    return NextResponse.json(
      { data: null, error: toErrorMessage(e) } satisfies ApiResp<null>,
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
