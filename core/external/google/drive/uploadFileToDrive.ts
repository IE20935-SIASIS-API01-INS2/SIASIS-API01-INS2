
import { findOrCreateFolder } from "./findOrCreateFolder";
import { getDriveClient } from "./getDriveClient";

// Función para subir archivo a Google Drive
export async function uploadFileToDrive(
  file: Express.Multer.File,
  folderPath: string,
  fileName: string
) {
  try {
    const drive = await getDriveClient();

    // Buscar o crear la carpeta
    let folderId = await findOrCreateFolder(drive, folderPath);

    // Crear un Readable stream desde el buffer (importante para googleapis)
    const { Readable } = require("stream");
    const fileStream = new Readable();
    fileStream.push(file.buffer);
    fileStream.push(null); // Señal de fin de stream

    // Configurar la solicitud de carga
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fileStream, // Usar el stream en lugar del buffer directo
    };

    // Subir el archivo
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,webViewLink,webContentLink",
    });

    // Configurar permisos para que sea accesible
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      id: response.data.id!,
      webViewLink: response.data.webViewLink!,
      webContentLink: response.data.webContentLink!,
    };
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error);
    throw error;
  }
}
