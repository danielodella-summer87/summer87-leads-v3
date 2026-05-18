import { NextResponse } from "next/server";
import { getInternalUserIdFromRequest } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";
import { guardClientCrmRoleAssignment } from "@/lib/admin/internalRoleAccess";
import { isClientCrmMode } from "@/lib/config/appMode";

export async function POST(req: Request) {
  const currentUserId = await getInternalUserIdFromRequest();
  if (!currentUserId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const form = await req.formData();
  const user_id = String(form.get("user_id") ?? "");
  const role_id = String(form.get("role_id") ?? "");

  if (!user_id || !role_id) {
    return NextResponse.redirect(new URL("/admin/configuracion/usuarios", req.url));
  }

  if (isClientCrmMode()) {
    const { data: targetRole } = await supabaseServer
      .from("roles")
      .select("id, name, is_system")
      .eq("id", role_id)
      .maybeSingle();

    const blocked = guardClientCrmRoleAssignment(
      targetRole
        ? {
            name: targetRole.name,
            is_system: (targetRole as { is_system?: boolean }).is_system,
          }
        : { name: null }
    );
    if (blocked) return blocked;
  }

  await supabaseServer.from("app_users").update({ role_id }).eq("id", user_id);

  return NextResponse.redirect(new URL("/admin/configuracion/usuarios", req.url));
}
