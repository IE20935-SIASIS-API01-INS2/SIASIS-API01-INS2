import { PERSONAL_ADMINISTRATIVO_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";

// Función para generar un token JWT para Personal Administrativo
export function generatePersonalAdministrativoToken(
  dniPersonalAdministrativo: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_PERSONAL_ADMINISTRATIVO!;

  const payload: JWTPayload = {
    ID_Usuario: dniPersonalAdministrativo,
    Nombre_Usuario: nombre_usuario,
    Rol: RolesSistema.PersonalAdministrativo,
    iat: Math.floor(Date.now() / 1000),
    exp:
      Math.floor(Date.now() / 1000) +
      PERSONAL_ADMINISTRATIVO_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
