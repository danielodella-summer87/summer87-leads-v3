/**
 * Evaluación pura del login interno username + PIN (CONSTRUCTOR-SETUP-USER-4).
 * Sin I/O; usable desde route handlers y selftests.
 */

export type InternalLoginResultCode =
  | "LOGIN_OK"
  | "USER_NOT_FOUND"
  | "USER_INACTIVE"
  | "INVALID_CREDENTIALS"
  | "PASSWORD_CHANGE_REQUIRED"
  | "SETUP_PASSWORD_CHANGE_REQUIRED"
  | "ROLE_MISSING"
  | "ORPHAN_CREDENTIAL";

export type InternalLoginEvaluateInput = {
  /** Fila encontrada en app_credentials por username */
  credentialFound: boolean;
  passwordValid: boolean;
  /** Fila app_users asociada a la credencial */
  userFound: boolean;
  isActive: boolean | null | undefined;
  mustChangePassword: boolean | null | undefined;
  roleName: string | null | undefined;
};

export type InternalLoginEvaluateResult =
  | {
      ok: true;
      code: "LOGIN_OK";
    }
  | {
      ok: false;
      code: Exclude<InternalLoginResultCode, "LOGIN_OK">;
      httpStatus: number;
      /** Mensaje seguro para mostrar en UI (sin datos sensibles) */
      publicMessage: string;
    };

/**
 * Orden: existencia credencial → PIN → usuario → activo → rol → cambio obligatorio.
 * No crea sesión; el caller debe respetar ok:false.
 */
export function evaluateInternalLogin(
  input: InternalLoginEvaluateInput
): InternalLoginEvaluateResult {
  if (!input.credentialFound) {
    return {
      ok: false,
      code: "USER_NOT_FOUND",
      httpStatus: 404,
      publicMessage: "Usuario no encontrado.",
    };
  }

  if (!input.passwordValid) {
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      httpStatus: 401,
      publicMessage: "PIN incorrecto.",
    };
  }

  if (!input.userFound) {
    return {
      ok: false,
      code: "ORPHAN_CREDENTIAL",
      httpStatus: 403,
      publicMessage: "No se pudo validar el acceso.",
    };
  }

  if (input.isActive === false) {
    return {
      ok: false,
      code: "USER_INACTIVE",
      httpStatus: 403,
      publicMessage: "Este usuario no está habilitado.",
    };
  }

  const role = typeof input.roleName === "string" ? input.roleName.trim() : "";
  if (!role) {
    return {
      ok: false,
      code: "ROLE_MISSING",
      httpStatus: 403,
      publicMessage: "No se pudo validar el acceso.",
    };
  }

  if (input.mustChangePassword === true) {
    const isSetup = role.toLowerCase() === "setup";
    return {
      ok: false,
      code: isSetup ? "SETUP_PASSWORD_CHANGE_REQUIRED" : "PASSWORD_CHANGE_REQUIRED",
      httpStatus: 403,
      publicMessage: isSetup
        ? "El usuario de instalación requiere rotar el PIN antes de continuar. Usá el script de bootstrap o el SQL documentado en SETUP-USER-3."
        : "Debés cambiar tu PIN antes de continuar. Contactá al administrador.",
    };
  }

  return { ok: true, code: "LOGIN_OK" };
}
