import { PROFESORES_PRIMARIA_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";

// Función para generar un token JWT para Profesores de Primaria
export function generateProfesorPrimariaToken(
  dniProfesorPrimaria: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_PROFESORES_PRIMARIA!;

  const payload: JWTPayload = {
    ID_Usuario: dniProfesorPrimaria,
    Nombre_Usuario: nombre_usuario,
    Rol: RolesSistema.ProfesorPrimaria,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + PROFESORES_PRIMARIA_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
