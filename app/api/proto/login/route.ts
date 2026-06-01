import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyPassword, createSession, sessionCookieOptions } from "@/lib/auth/internalAuth";
import { evaluateInternalLogin } from "@/lib/auth/internalLogin";
import { getDashboardPath } from "@/lib/auth/session";

type DbRoleJoin = { name?: string | null } | { name?: string | null }[] | null;

function resolveRoleName(roles: DbRoleJoin): string | null {
  if (roles == null) return null;
  if (Array.isArray(roles)) return roles[0]?.name ?? null;
  return roles.name ?? null;
}

function loginFailure(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { ok: false, code, error: message, ...extra },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // En el front seguimos mandando { cedula, pin } aunque ahora "cedula" sea username.
    const username = String(body?.cedula ?? "").trim();
    const pin = String(body?.pin ?? "");

    if (!username) {
      return loginFailure("VALIDATION_ERROR", "Ingresá tu nombre de usuario.", 400);
    }
    if (!pin) {
      return loginFailure("VALIDATION_ERROR", "Ingresá tu PIN.", 400);
    }

    const { data: cred, error: credErr } = await supabaseServer
      .from("app_credentials")
      .select("user_id, password_hash, must_change_password")
      .eq("username", username)
      .maybeSingle();

    if (credErr) throw new Error(credErr.message);

    const passwordValid =
      !!cred?.password_hash && (await verifyPassword(pin, cred.password_hash));

    let user: { id: string; is_active?: boolean } | null = null;
    let roleName: string | null = null;

    if (cred?.user_id) {
      const { data, error: userErr } = await supabaseServer
        .from("app_users")
        .select("id, is_active, role_id, roles:roles ( name )")
        .eq("id", cred.user_id)
        .maybeSingle();

      if (userErr) throw new Error(userErr.message);
      if (data) {
        user = { id: data.id as string, is_active: data.is_active as boolean | undefined };
        roleName = resolveRoleName((data as { roles?: DbRoleJoin }).roles ?? null);
      }
    }

    const evaluation = evaluateInternalLogin({
      credentialFound: !!cred,
      passwordValid,
      userFound: !!user,
      isActive: user?.is_active,
      mustChangePassword: cred?.must_change_password,
      roleName,
    });

    if (!evaluation.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[PROTO_LOGIN] rejected", {
          username,
          code: evaluation.code,
          httpStatus: evaluation.httpStatus,
        });
      }
      return loginFailure(
        evaluation.code,
        evaluation.publicMessage,
        evaluation.httpStatus
      );
    }

    const userId = user!.id as string;

    if (process.env.NODE_ENV !== "production") {
      console.log("[PROTO_LOGIN] before createSession", { username, userId, roleName });
    }

    const { token, expiresAt } = await createSession(userId, supabaseServer);
    const { name, value, options } = sessionCookieOptions(token, expiresAt);

    if (process.env.NODE_ENV !== "production") {
      console.log("[PROTO_LOGIN] after createSession", {
        cookieName: name,
        tokenPreview: token.slice(0, 8),
        userId,
      });
    }

    const res = NextResponse.json({
      ok: true,
      code: "LOGIN_OK",
      redirectTo: getDashboardPath(roleName!),
    });
    res.cookies.set(name, value, options);
    return res;
  } catch (err) {
    console.error("[PROTO_LOGIN] ERROR:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", error: isDev ? message : "Error inesperado." },
      { status: 500 }
    );
  }
}
