import * as crypto from "crypto";

export function encryptProfesorTutorSecundariaPassword(
  password: string
): string {
  const encryptionKey = process.env.ENCRYPTION_KEY_PROFESOR_TUTOR_SECUNDARIA;

  if (!encryptionKey) {
    throw new Error(
      "La llave de encriptación para Profesores de Secundaria no está definida en las variables de entorno"
    );
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(encryptionKey).digest(),
    iv
  );

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function verifyProfesorTutorSecundariaPassword(
  password: string,
  encryptedData: string
): boolean {
  const encryptionKey = process.env.ENCRYPTION_KEY_PROFESOR_TUTOR_SECUNDARIA;

  if (!encryptionKey) {
    throw new Error(
      "La llave de encriptación para Profesores de Secundaria no está definida en las variables de entorno"
    );
  }

  try {
    const [ivHex, encryptedPassword] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      crypto.createHash("sha256").update(encryptionKey).digest(),
      iv
    );

    let decrypted = decipher.update(encryptedPassword, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted === password;
  } catch (error) {
    console.error(
      "Error al verificar la contraseña del Profesor de Secundaria:",
      error
    );
    return false;
  }
}
