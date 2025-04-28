import { RESPONSABLES_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";

// Función para generar un token JWT para Responsables
export function generateResponsableToken(
  dniResponsable: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_RESPONSABLES!;

  const payload = {
    Id_Responsable: dniResponsable,
    Nombre_Usuario: nombre_usuario,
    Rol: RolesSistema.Responsable,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + RESPONSABLES_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
