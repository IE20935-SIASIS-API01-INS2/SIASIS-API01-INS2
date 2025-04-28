import { createAppAuth } from "@octokit/auth-app";

// Variables de entorno para la autenticación de GitHub
const GITHUB_APP_ID = process.env.EMCS01_GITHUB_APP_ID || '';
const GITHUB_INSTALLATION_ID = process.env.EMCS01_GITHUB_APP_INSTALLATION_ID || '';
const GITHUB_PRIVATE_KEY = process.env.EMCS01_GITHUB_PRIVATE_KEY || '';

// Cache para el token de instalación
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtiene un token de instalación para la autenticación con la API de GitHub
 * El token se almacena en caché y se renueva automáticamente cuando está a punto de expirar
 * 
 * @returns Token de instalación válido
 */
export async function getGithubActionsInstallationToken(): Promise<string> {
  // Verificar si hay un token en caché y si sigue siendo válido
  // Consideramos que el token expira 5 minutos antes para evitar problemas de timing
  const now = Date.now();
  const tokenBuffer = 5 * 60 * 1000; // 5 minutos en milisegundos
  
  if (cachedToken && cachedToken.expiresAt > now + tokenBuffer) {
    return cachedToken.token;
  }
  
  try {
    // Validar que las variables de entorno estén disponibles
    if (!GITHUB_APP_ID) {
      throw new Error('GITHUB_APP_ID no está definido en las variables de entorno');
    }
    
    if (!GITHUB_INSTALLATION_ID) {
      throw new Error('GITHUB_INSTALLATION_ID no está definido en las variables de entorno');
    }
    
    if (!GITHUB_PRIVATE_KEY) {
      throw new Error('GITHUB_PRIVATE_KEY no está definido en las variables de entorno');
    }
    
    // Crear autenticador
    const auth = createAppAuth({
      appId: GITHUB_APP_ID,
      privateKey: GITHUB_PRIVATE_KEY,
      installationId: GITHUB_INSTALLATION_ID,
    });
    
    // Obtener token de instalación
    const { token, expiresAt } = await auth({ type: "installation" });
    
    // Almacenar en caché
    cachedToken = { token, expiresAt: new Date(expiresAt).getTime() };
    
    return token;
  } catch (error) {
    console.error('Error al obtener token de instalación de GitHub:', error);
    throw error;
  }
}