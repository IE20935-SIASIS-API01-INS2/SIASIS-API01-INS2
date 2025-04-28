import { PROFESORES_SECUNDARIA_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";

// Función para generar un token JWT para Profesores de Secundaria
export function generateProfesorSecundariaToken(
  dniProfesorSecundaria: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_PROFESORES_SECUNDARIA!;

  const payload: JWTPayload = {
    ID_Usuario: dniProfesorSecundaria,
    Nombre_Usuario: nombre_usuario,
    Rol: RolesSistema.ProfesorSecundaria,
    iat: Math.floor(Date.now() / 1000),
    exp:
      Math.floor(Date.now() / 1000) + PROFESORES_SECUNDARIA_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
