import "dotenv/config";
import jwt from "jsonwebtoken";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import { AUXILIARES_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";

// Función para generar un token JWT para Auxiliares
export function generateAuxiliarToken(
  dniAuxiliar: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_AUXILIARES!;

  const payload: JWTPayload = {
    ID_Usuario: dniAuxiliar,
    Nombre_Usuario: nombre_usuario,
    Rol: RolesSistema.Auxiliar,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AUXILIARES_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
