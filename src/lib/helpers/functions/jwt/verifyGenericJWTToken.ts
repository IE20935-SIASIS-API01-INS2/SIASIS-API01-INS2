import jwt from "jsonwebtoken";
import { TokenErrorTypes } from "../../../../interfaces/shared/errors";
import { JWTPayload } from "../../../../interfaces/shared/JWTPayload";

interface TokenPreliminaryCheck {
  isValid: boolean;
  message: string;
  errorType?: TokenErrorTypes;
  payload?: JWTPayload;
}

/**
 * Verifica preliminarmente un token JWT sin validar su firma.
 * Esto permite verificar la estructura y extraer el rol sin realizar la verificación criptográfica completa.
 *
 * @param token El token JWT a verificar preliminarmente
 * @returns Un objeto con información sobre la validez del token y su payload
 */
export default function verifyGenericJWTToken(
  token: string
): TokenPreliminaryCheck {
  try {
    // Decodificar el token sin verificar la firma
    // El segundo parámetro debe ser la clave secreta, pero pasamos true para saltarnos esta verificación
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return {
        isValid: false,
        message: "Token malformado o inválido",
        errorType: TokenErrorTypes.TOKEN_MALFORMED,
      };
    }

    // Verificar la estructura básica del payload
    const payload = decoded.payload as JWTPayload;

    if (!payload) {
      return {
        isValid: false,
        message: "Payload del token es inválido",
        errorType: TokenErrorTypes.TOKEN_MALFORMED,
      };
    }

    // Verificar si el token ha expirado
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) {
      return {
        isValid: false,
        message: "Token expirado",
        errorType: TokenErrorTypes.TOKEN_EXPIRED,
        payload,
      };
    }

    // Verificar que exista un rol en el payload
    if (!payload.Rol) {
      return {
        isValid: false,
        message: "Token no contiene información de rol",
        errorType: TokenErrorTypes.TOKEN_MALFORMED,
        payload,
      };
    }

    return {
      isValid: true,
      message: "Token válido preliminarmente",
      payload,
    };
  } catch (error) {
    return {
      isValid: false,
      message: "Error al procesar el token",
      errorType: TokenErrorTypes.TOKEN_MALFORMED,
    };
  }
}
