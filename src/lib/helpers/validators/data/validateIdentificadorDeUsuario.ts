import { ValidationErrorTypes } from "../../../../interfaces/shared/errors";
import { TiposIdentificadores } from "../../../../interfaces/shared/TiposIdentificadores";
import { ValidationResult } from "./types";


/**
 * Valida un identificador de usuario (DNI, Carnet de Extranjería, Código de Escuela)
 * Soporta formatos:
 * - DNI de 8 dígitos: "12345678" (compatibilidad hacia atrás)
 * - Formato nuevo: "{identificador}-{tipo}" ej: "12345678-1", "A123456-2"
 * 
 * @param value - Valor a validar
 * @param required - Indica si el campo es obligatorio
 * @returns Resultado de la validación
 */
export function validateIdentificadorDeUsuario(value: any, required: boolean): ValidationResult {
  // Verificar si es requerido y está vacío
  if ((value === undefined || value === null || value === '') && required) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.FIELD_REQUIRED,
      errorMessage: "El identificador de usuario es requerido"
    };
  }
  
  // Si no es requerido y está vacío, es válido
  if (value === undefined || value === null || value === '') {
    return { isValid: true };
  }
  
  // Debe ser string
  if (typeof value !== 'string') {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El identificador debe ser una cadena de texto"
    };
  }

  const identificadorLimpio = value.trim();
  
  // Verificar longitud mínima
  if (identificadorLimpio.length < 8) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El identificador debe tener al menos 8 caracteres"
    };
  }

  // Verificar longitud máxima (considerando formato {identificador}-{tipo})
  if (identificadorLimpio.length > 22) { // 20 caracteres + "-" + 1 dígito
    return {
      isValid: false,
      errorType: ValidationErrorTypes.STRING_TOO_LONG,
      errorMessage: "El identificador es demasiado largo (máximo 22 caracteres)"
    };
  }

  // Caso 1: DNI de 8 dígitos (compatibilidad hacia atrás)
  const dniRegex = /^\d{8}$/;
  if (dniRegex.test(identificadorLimpio)) {
    return { isValid: true };
  }

  // Caso 2: Formato nuevo {identificador}-{tipo}
  const formatoNuevoRegex = /^([A-Za-z0-9]+)-(\d+)$/;
  const match = identificadorLimpio.match(formatoNuevoRegex);
  
  if (!match) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_FORMAT,
      errorMessage: "El identificador debe ser un DNI de 8 dígitos o seguir el formato {identificador}-{tipo}"
    };
  }

  const [, identificador, tipoStr] = match;
  const tipo = parseInt(tipoStr, 10);

  // Validar que el tipo existe en el enum
  if (!Object.values(TiposIdentificadores).includes(tipo as TiposIdentificadores)) {
    return {
      isValid: false,
      errorType: ValidationErrorTypes.INVALID_ENUM_VALUE,
      errorMessage: `Tipo de identificador inválido. Tipos válidos: ${Object.values(TiposIdentificadores).join(', ')}`
    };
  }

  // Validaciones específicas por tipo de identificador
  switch (tipo as TiposIdentificadores) {
    case TiposIdentificadores.DNI:
      // DNI debe ser exactamente 8 dígitos
      if (!/^\d{8}$/.test(identificador)) {
        return {
          isValid: false,
          errorType: ValidationErrorTypes.INVALID_FORMAT,
          errorMessage: "El DNI debe contener exactamente 8 dígitos numéricos"
        };
      }
      break;

    case TiposIdentificadores.CARNET_EXTRANJERIA:
      // Carnet de extranjería: puede contener letras y números, 8-12 caracteres
      if (!/^[A-Za-z0-9]{8,12}$/.test(identificador)) {
        return {
          isValid: false,
          errorType: ValidationErrorTypes.INVALID_FORMAT,
          errorMessage: "El Carnet de Extranjería debe contener entre 8 y 12 caracteres alfanuméricos"
        };
      }
      break;

    case TiposIdentificadores.CODIGO_ESCUELA:
      // Código de escuela: formato más flexible, 6-20 caracteres alfanuméricos
      if (!/^[A-Za-z0-9]{6,20}$/.test(identificador)) {
        return {
          isValid: false,
          errorType: ValidationErrorTypes.INVALID_FORMAT,
          errorMessage: "El Código de Escuela debe contener entre 6 y 20 caracteres alfanuméricos"
        };
      }
      break;

    default:
      return {
        isValid: false,
        errorType: ValidationErrorTypes.INVALID_ENUM_VALUE,
        errorMessage: "Tipo de identificador no soportado"
      };
  }

  return { isValid: true };
}

/**
 * Función auxiliar para extraer el tipo de identificador de un identificador válido
 * @param identificador - Identificador validado
 * @returns Tipo de identificador o DNI por defecto
 */
export function extraerTipoIdentificador(identificador: string): TiposIdentificadores {
  const identificadorLimpio = identificador.trim();
  
  // Si es DNI de 8 dígitos sin guión, es DNI por defecto
  if (/^\d{8}$/.test(identificadorLimpio)) {
    return TiposIdentificadores.DNI;
  }
  
  // Si tiene formato nuevo, extraer el tipo
  const match = identificadorLimpio.match(/^([A-Za-z0-9]+)-(\d+)$/);
  if (match) {
    const tipo = parseInt(match[2], 10);
    return tipo as TiposIdentificadores;
  }
  
  // Por defecto, asumir DNI
  return TiposIdentificadores.DNI;
}

/**
 * Función auxiliar para extraer solo el identificador sin el tipo
 * @param identificador - Identificador completo
 * @returns Solo la parte del identificador
 */
export function extraerIdentificadorSinTipo(identificador: string): string {
  const identificadorLimpio = identificador.trim();
  
  // Si es DNI de 8 dígitos sin guión, devolverlo tal como está
  if (/^\d{8}$/.test(identificadorLimpio)) {
    return identificadorLimpio;
  }
  
  // Si tiene formato nuevo, extraer solo el identificador
  const match = identificadorLimpio.match(/^([A-Za-z0-9]+)-(\d+)$/);
  if (match) {
    return match[1];
  }
  
  // Si no coincide con ningún formato, devolver tal como está
  return identificadorLimpio;
}

/**
 * Función auxiliar para normalizar un identificador al formato completo
 * @param identificador - Identificador en cualquier formato
 * @returns Identificador en formato completo {identificador}-{tipo}
 */
export function normalizarIdentificador(identificador: string): string {
  const identificadorLimpio = identificador.trim();
  
  // Si es DNI de 8 dígitos sin guión, agregarlo con tipo 1 (DNI)
  if (/^\d{8}$/.test(identificadorLimpio)) {
    return `${identificadorLimpio}-${TiposIdentificadores.DNI}`;
  }
  
  // Si ya tiene formato nuevo, devolverlo tal como está
  if (/^([A-Za-z0-9]+)-(\d+)$/.test(identificadorLimpio)) {
    return identificadorLimpio;
  }
  
  // Si no coincide con ningún formato, asumir que es un identificador sin tipo y agregar DNI por defecto
  return `${identificadorLimpio}-${TiposIdentificadores.DNI}`;
}