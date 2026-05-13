import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePermission } from "@/lib/rbac/requirePermission";

export type ConstructorInstallablePackageUser = { id: string };

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export function supabaseServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireConstructorInstallablePackageAccess(
  req: NextRequest
): Promise<ConstructorInstallablePackageUser | null> {
  if (process.env.NODE_ENV !== "production") {
    return { id: "dev-preview" };
  }
  const user = await requirePermission(req, "config.read");
  if (!user) return null;
  return user;
}
