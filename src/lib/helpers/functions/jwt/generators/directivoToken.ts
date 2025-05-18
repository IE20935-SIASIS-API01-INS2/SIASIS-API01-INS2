import "dotenv/config";
import jwt from "jsonwebtoken";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import { DIRECTIVOS_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RDP02 } from "../../../../../interfaces/shared/RDP02Instancias";
import { RDP03 } from "../../../../../interfaces/shared/RDP03Instancias";
import { getRandomElementFromEnum } from "../../../getRandomElementFromEnum";

// Función para generar un token JWT para directivos
export function generateDirectivoToken(
  directivoId: number,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_DIRECTIVOS!;

  const payload: JWTPayload = {
    ID_Usuario: String(directivoId),
    Nombre_Usuario: nombre_usuario,
    RDP02_INSTANCE: getRandomElementFromEnum<RDP02>(RDP02),
    RDP03_INSTANCE: getRandomElementFromEnum<RDP03>(RDP03),
    Rol: RolesSistema.Directivo,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + DIRECTIVOS_SESSION_EXPIRATION, //Duracion de Token de 5 Horas para directivos
  };

  return jwt.sign(payload, jwtSecretKey);
}
