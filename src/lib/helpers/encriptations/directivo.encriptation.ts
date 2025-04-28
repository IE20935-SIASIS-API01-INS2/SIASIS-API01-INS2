import * as crypto from 'crypto';

/**
 * Encripta una contraseña usando AES-256-CBC con una llave específica
 * @param {string} password - La contraseña en texto plano a encriptar
 * @returns {string} - La contraseña encriptada en formato hexadecimal
 */
export function encryptDirectivoPassword(password: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY_DIRECTIVO;
  
  if (!encryptionKey) {
    throw new Error('La llave de encriptación no está definida en las variables de entorno');
  }

  // Crear un IV aleatorio
  const iv = crypto.randomBytes(16);
  
  // Crear el cifrador
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    crypto.createHash('sha256').update(encryptionKey).digest(), 
    iv
  );
  
  // Encriptar la contraseña
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Devolver IV + contraseña encriptada (ambos en hex)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Verifica si una contraseña coincide con su versión encriptada
 * @param {string} password - La contraseña en texto plano a verificar
 * @param {string} encryptedData - La contraseña encriptada para comparar
 * @returns {boolean} - true si coinciden, false si no
 */
export function verifyDirectivoPassword(password: string, encryptedData: string): boolean {
  const encryptionKey = process.env.ENCRYPTION_KEY_DIRECTIVO;
  
  if (!encryptionKey) {
    throw new Error('La llave de encriptación no está definida en las variables de entorno');
  }

  try {
    // Separar el IV y los datos encriptados
    const [ivHex, encryptedPassword] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Crear el descifrador
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      crypto.createHash('sha256').update(encryptionKey).digest(), 
      iv
    );
    
    // Desencriptar la contraseña
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Comparar la contraseña original con la proporcionada
    return decrypted === password;
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
    return false;
  }
}