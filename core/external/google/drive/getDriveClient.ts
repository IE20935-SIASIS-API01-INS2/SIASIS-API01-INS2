import { JWT } from "google-auth-library";
import { google } from "googleapis";
// Función para obtener el cliente de Google Drive usando una cuenta de servicio
export async function getDriveClient() {
  try {
    // Crear cliente JWT usando la clave privada de la cuenta de servicio
    const auth = new JWT({
      email: process.env.RDP01_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.RDP01_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    // Crear cliente de Drive
    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Error al crear el cliente de Google Drive:", error);
    throw error;
  }
}
