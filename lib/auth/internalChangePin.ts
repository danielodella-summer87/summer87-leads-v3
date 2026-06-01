/**
 * Evaluación pura del cambio de PIN/password interno (CONSTRUCTOR-SETUP-USER-5).
 *
 * Flujo mínimo y acotado para que un usuario `setup` (o cualquier usuario con
 * must_change_password=true) pueda rotar su PIN inicial de instalación sin tocar
 * SQL manual, SIN abrir permisos operativos y SIN crear sesión.
 *
 * Sin I/O: el caller resuelve la DB (lookup + bcrypt) y pasa los booleanos ya
 * calculados. Reutilizable desde el route handler y los selftests.
 *
 * IMPORTANTE: este helper NO crea sesión y NO devuelve hashes ni PINs.
 */

export type ChangePinResultCode =
  | "PIN_CHANGE_ALLOWED"
  | "USER_NOT_FOUND"
  | "ORPHAN_CREDENTIAL"
  | "USER_INACTIVE"
  | "INVALID_CURRENT_PIN"
  | "WEAK_NEW_PIN"
  | "SAME_PIN";

/** Longitud mínima del nuevo PIN. El PIN de instalación por defecto ("1234") tiene 4. */
export const MIN_NEW_PIN_LENGTH = 4;
/** Tope defensivo para evitar inputs absurdos (bcrypt trunca a 72 bytes igual). */
export const MAX_NEW_PIN_LENGTH = 72;

export type ChangePinEvaluateInput = {
  /** Fila encontrada en app_credentials por username */
  credentialFound: boolean;
  /** Fila app_users asociada a la credencial */
  userFound: boolean;
  isActive: boolean | null | undefined;
  /** Resultado de verifyPassword(currentPin, password_hash) calculado por el caller */
  currentPinValid: boolean;
  /** Nuevo PIN en claro (solo para validar fuerza/longitud; nunca se loguea ni se persiste en claro) */
  newPin: string;
  /** currentPin === newPin, calculado por el caller (validación "mismo PIN" razonable) */
  newPinEqualsCurrent: boolean;
};

export type ChangePinEvaluateResult =
  | {
      ok: true;
      code: "PIN_CHANGE_ALLOWED";
    }
  | {
      ok: false;
      code: Exclude<ChangePinResultCode, "PIN_CHANGE_ALLOWED">;
      httpStatus: number;
      /** Mensaje seguro para mostrar en UI (sin datos sensibles) */
      publicMessage: string;
    };

/** True si el nuevo PIN es débil (vacío, muy corto o demasiado largo). */
export function isWeakNewPin(newPin: string | null | undefined): boolean {
  if (typeof newPin !== "string") return true;
  const trimmed = newPin.trim();
  if (trimmed.length !== newPin.length) return true; // espacios al borde = débil/ambiguo
  if (trimmed.length < MIN_NEW_PIN_LENGTH) return true;
  if (trimmed.length > MAX_NEW_PIN_LENGTH) return true;
  return false;
}

/**
 * Orden: existencia credencial → usuario → PIN actual válido → usuario activo →
 * nuevo PIN fuerte → nuevo PIN distinto al actual → permitido.
 *
 * No crea sesión. El caller debe respetar ok:false y, solo si ok:true, recién ahí
 * hashear el nuevo PIN y actualizar app_credentials (must_change_password=false).
 */
export function evaluateChangePin(
  input: ChangePinEvaluateInput
): ChangePinEvaluateResult {
  if (!input.credentialFound) {
    return {
      ok: false,
      code: "USER_NOT_FOUND",
      httpStatus: 404,
      publicMessage: "Usuario no encontrado.",
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

  // Se valida el PIN actual ANTES del estado activo para no filtrar el estado
  // de la cuenta a quien no conoce el PIN.
  if (!input.currentPinValid) {
    return {
      ok: false,
      code: "INVALID_CURRENT_PIN",
      httpStatus: 401,
      publicMessage: "El PIN actual es incorrecto.",
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

  if (isWeakNewPin(input.newPin)) {
    return {
      ok: false,
      code: "WEAK_NEW_PIN",
      httpStatus: 400,
      publicMessage: `El nuevo PIN debe tener al menos ${MIN_NEW_PIN_LENGTH} caracteres y no puede estar vacío.`,
    };
  }

  if (input.newPinEqualsCurrent) {
    return {
      ok: false,
      code: "SAME_PIN",
      httpStatus: 400,
      publicMessage: "El nuevo PIN debe ser distinto al actual.",
    };
  }

  return { ok: true, code: "PIN_CHANGE_ALLOWED" };
}
