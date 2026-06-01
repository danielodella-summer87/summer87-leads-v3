import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyPassword, hashPassword } from "@/lib/auth/internalAuth";
import { evaluateChangePin } from "@/lib/auth/internalChangePin";

/**
 * Endpoint mínimo de cambio de PIN/password interno (CONSTRUCTOR-SETUP-USER-5).
 *
 * Pensado para que un usuario `setup` (o cualquier usuario con
 * must_change_password=true) rote su PIN inicial de instalación SIN tocar SQL.
 *
 * GARANTÍAS DE SEGURIDAD:
 *   - NO crea sesión (login sigue bloqueando must_change_password=true).
 *   - Exige PIN actual válido (bcrypt) para autorizar el cambio.
 *   - Nuevo PIN se guarda SIEMPRE como hash bcrypt (hashPassword, rounds 10).
 *   - must_change_password pasa a false SOLO tras un cambio exitoso.
 *   - Invalida sesiones previas del usuario (app_sessions) si las hubiera.
 *   - NO loguea PINs ni devuelve hashes al cliente.
 *   - Solo lee app_users; solo escribe app_credentials y app_sessions.
 */

function failure(
  code: string,
  message: string,
  status: number
) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // Aceptamos `username` (preferido) o `cedula` (compat con el front del login).
    const username = String(body?.username ?? body?.cedula ?? "").trim();
    const currentPin = String(body?.currentPin ?? "");
    const newPin = String(body?.newPin ?? "");

    if (!username) {
      return failure("VALIDATION_ERROR", "Ingresá tu nombre de usuario.", 400);
    }
    if (!currentPin) {
      return failure("VALIDATION_ERROR", "Ingresá tu PIN actual.", 400);
    }
    if (!newPin) {
      return failure("VALIDATION_ERROR", "Ingresá el nuevo PIN.", 400);
    }

    const { data: cred, error: credErr } = await supabaseServer
      .from("app_credentials")
      .select("user_id, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (credErr) throw new Error(credErr.message);

    const currentPinValid =
      !!cred?.password_hash && (await verifyPassword(currentPin, cred.password_hash));

    let userFound = false;
    let isActive: boolean | undefined;

    if (cred?.user_id) {
      const { data: user, error: userErr } = await supabaseServer
        .from("app_users")
        .select("id, is_active")
        .eq("id", cred.user_id)
        .maybeSingle();

      if (userErr) throw new Error(userErr.message);
      if (user) {
        userFound = true;
        isActive = user.is_active as boolean | undefined;
      }
    }

    const evaluation = evaluateChangePin({
      credentialFound: !!cred,
      userFound,
      isActive,
      currentPinValid,
      newPin,
      newPinEqualsCurrent: currentPin === newPin,
    });

    if (!evaluation.ok) {
      if (process.env.NODE_ENV !== "production") {
        // Nunca logueamos PINs ni hashes; solo username + código de resultado.
        console.warn("[PROTO_CHANGE_PIN] rejected", {
          username,
          code: evaluation.code,
          httpStatus: evaluation.httpStatus,
        });
      }
      return failure(evaluation.code, evaluation.publicMessage, evaluation.httpStatus);
    }

    // A partir de acá el cambio está autorizado: recién ahora hasheamos el PIN nuevo.
    const newHash = await hashPassword(newPin);
    const userId = cred!.user_id as string;

    const { error: updErr } = await supabaseServer
      .from("app_credentials")
      .update({ password_hash: newHash, must_change_password: false })
      .eq("user_id", userId);

    if (updErr) throw new Error(updErr.message);

    // Invalidar cualquier sesión previa del usuario (si existiera). No crea sesión nueva.
    const { error: sessErr } = await supabaseServer
      .from("app_sessions")
      .delete()
      .eq("user_id", userId);

    if (sessErr && process.env.NODE_ENV !== "production") {
      console.warn("[PROTO_CHANGE_PIN] session cleanup warning", {
        username,
        message: sessErr.message,
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[PROTO_CHANGE_PIN] pin changed", { username, userId });
    }

    // Sin cookie / sin sesión: el usuario debe volver a iniciar sesión con el nuevo PIN.
    return NextResponse.json({
      ok: true,
      code: "PIN_CHANGED_LOGIN_REQUIRED",
      message: "PIN actualizado. Iniciá sesión nuevamente con tu nuevo PIN.",
    });
  } catch (err) {
    console.error("[PROTO_CHANGE_PIN] ERROR:", err);
    const isDev = process.env.NODE_ENV !== "production";
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", error: isDev ? message : "Error inesperado." },
      { status: 500 }
    );
  }
}
