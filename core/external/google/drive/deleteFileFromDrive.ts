import { getDriveClient } from "./getDriveClient";


// Función para eliminar un archivo de Google Drive
export async function deleteFileFromDrive(fileId: string | null | undefined) {
  // Si no hay ID, no hay nada que eliminar
  if (!fileId) {
    return false;
  }

  try {
    const drive = await getDriveClient();

    // Verificar si el archivo existe antes de intentar eliminarlo
    try {
      await drive.files.get({
        fileId: fileId,
        fields: "id",
      });
    } catch (error) {
      console.log(`El archivo con ID ${fileId} no existe en Google Drive`);
      return false;
    }

    await drive.files.delete({ fileId });
    console.log(`Archivo con ID ${fileId} eliminado con éxito`);
    return true;
  } catch (error) {
    console.error("Error al eliminar archivo de Google Drive:", error);
    // No lanzamos el error para permitir que el flujo continúe
    return false;
  }
}
