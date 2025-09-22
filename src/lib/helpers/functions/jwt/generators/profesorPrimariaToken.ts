import { PROFESORES_PRIMARIA_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RDP02 } from "../../../../../interfaces/shared/RDP02Instancias";
import { RDP03 } from "../../../../../interfaces/shared/RDP03Instancias";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";
import { getRandomElementFromEnum } from "../../../getRandomElementFromEnum";

// Función para generar un token JWT para Profesores de Primaria
export function generateProfesorPrimariaToken(
  idProfesorPrimaria: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_PROFESORES_PRIMARIA!;

  const payload: JWTPayload = {
    ID_Usuario: idProfesorPrimaria,
    Nombre_Usuario: nombre_usuario,
    RDP02_INSTANCE: getRandomElementFromEnum<RDP02>(RDP02),
    RDP03_INSTANCE: getRandomElementFromEnum<RDP03>(RDP03),
    Rol: RolesSistema.ProfesorPrimaria,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + PROFESORES_PRIMARIA_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
