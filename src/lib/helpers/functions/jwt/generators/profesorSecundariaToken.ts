import { PROFESORES_SECUNDARIA_SESSION_EXPIRATION } from "../../../../../constants/expirations";
import { JWTPayload } from "../../../../../interfaces/shared/JWTPayload";
import { RDP02 } from "../../../../../interfaces/shared/RDP02Instancias";
import { RDP03 } from "../../../../../interfaces/shared/RDP03Instancias";
import { RolesSistema } from "../../../../../interfaces/shared/RolesSistema";
import jwt from "jsonwebtoken";
import { getRandomElementFromEnum } from "../../../getRandomElementFromEnum";

// Función para generar un token JWT para Profesores de Secundaria
export function generateProfesorSecundariaToken(
  idProfesorSecundaria: string,
  nombre_usuario: string
): string {
  const jwtSecretKey = process.env.JWT_KEY_PROFESORES_SECUNDARIA!;

  const payload: JWTPayload = {
    ID_Usuario: idProfesorSecundaria,
    Nombre_Usuario: nombre_usuario,
    RDP02_INSTANCE: getRandomElementFromEnum<RDP02>(RDP02),
    RDP03_INSTANCE: getRandomElementFromEnum<RDP03>(RDP03),
    Rol: RolesSistema.ProfesorSecundaria,
    iat: Math.floor(Date.now() / 1000),
    exp:
      Math.floor(Date.now() / 1000) + PROFESORES_SECUNDARIA_SESSION_EXPIRATION, // Duración del token
  };

  return jwt.sign(payload, jwtSecretKey);
}
