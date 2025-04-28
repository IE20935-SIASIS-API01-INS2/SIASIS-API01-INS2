// Función para buscar o crear una carpeta en Google Drive
export async function findOrCreateFolder(drive: any, folderPath: string) {
  // Usar una carpeta compartida como punto de partida en lugar de "root"
  // ID de una carpeta que hayas creado y compartido con la cuenta de servicio
  let rootFolderID = process.env.RDP01_GOOGLE_DRIVE_ROOT_SHARED_FOLDER_ID!;

  const folderNames = folderPath
    .split("/")
    .filter((name) => name.trim() !== "");

  for (const folderName of folderNames) {
    // Buscar si la carpeta ya existe
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${rootFolderID}' in parents and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    // Verificar si la carpeta existe
    if (response.data.files.length > 0) {
      rootFolderID = response.data.files[0].id;
    } else {
      // Crear la carpeta si no existe
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderID],
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      rootFolderID = folder.data.id;
    }
  }

  return rootFolderID;
}
