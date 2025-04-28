import fs from 'fs';
import path from 'path';

/**
 * Encuentra recursivamente todos los archivos index.ts en cualquier nivel de carpetas
 * @param rootDir - Directorio raíz desde donde comenzar la búsqueda
 * @returns Array de objetos con información de los archivos index.ts encontrados
 */
const findAllIndexTsFiles = (rootDir: string): Array<{
  fullPath: string;       // Ruta completa al archivo
  relativePath: string;   // Ruta relativa desde rootDir
  dirPath: string;        // Ruta del directorio que contiene el archivo
}> => {
  const results: Array<{
    fullPath: string;
    relativePath: string;
    dirPath: string;
  }> = [];

  // Función recursiva interna
  const scan = (currentDir: string, relativePath: string = '') => {
    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        const itemRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;
        
        if (item.isDirectory()) {
          // Si es un directorio, seguimos explorando recursivamente
          scan(fullPath, itemRelativePath);
        } else if (item.name === 'index.ts') {
          // Encontramos un archivo index.ts
          const result = {
            fullPath,
            relativePath: itemRelativePath,
            dirPath: currentDir
          };
          
          console.log(`Encontrado index.ts en: ${currentDir}`);
          console.log(`  - Ruta completa: ${fullPath}`);
          console.log(`  - Ruta relativa: ${itemRelativePath}`);
          console.log(`  - Directorio contenedor: ${path.basename(currentDir)}`);
          console.log('-------------------------------------------');
          
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Error al escanear el directorio ${currentDir}:`, error);
    }
  };

  // Comenzar el escaneo desde el directorio raíz
  scan(rootDir);
  
  console.log(`Total de archivos index.ts encontrados: ${results.length}`);
  return results;
};

export default findAllIndexTsFiles;