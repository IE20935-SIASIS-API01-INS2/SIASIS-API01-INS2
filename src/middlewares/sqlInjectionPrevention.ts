import { Request, Response, NextFunction } from "express";

// Interfaz para configuración del middleware
interface SQLInjectionConfig {
  enabled: boolean;
  logAttempts: boolean;
  blockSuspiciousRequests: boolean;
  checkHeaders: boolean;
  checkQueryParams: boolean;
  checkBody: boolean;
  whitelist?: string[];
  customPatterns?: RegExp[];
}

// Configuración por defecto
const defaultConfig: SQLInjectionConfig = {
  enabled: true,
  logAttempts: true,
  blockSuspiciousRequests: true,
  checkHeaders: true,
  checkQueryParams: true,
  checkBody: true,
  whitelist: [],
  customPatterns: [],
};

// Patrones de inyección SQL comunes
const SQL_INJECTION_PATTERNS: RegExp[] = [
  // Comentarios SQL
  /--\s*$/gim,
  /\/\*[\s\S]*?\*\//gim,
  /#.*$/gim,

  // UNION-based injections
  /\bunion\b[\s]*\bselect\b/gim,
  /\bunion\b[\s]*\ball\b[\s]*\bselect\b/gim,

  // Boolean-based blind injections
  /\band\b[\s]*\d+[\s]*=[\s]*\d+/gim,
  /\bor\b[\s]*\d+[\s]*=[\s]*\d+/gim,
  /\band\b[\s]*['"`][\w]*['"`][\s]*=[\s]*['"`][\w]*['"`]/gim,
  /\bor\b[\s]*['"`][\w]*['"`][\s]*=[\s]*['"`][\w]*['"`]/gim,

  // Time-based blind injections
  /\bwaitfor\b[\s]*\bdelay\b/gim,
  /\bsleep\b[\s]*\(/gim,
  /\bbenchmark\b[\s]*\(/gim,

  // Error-based injections
  /\bextractvalue\b[\s]*\(/gim,
  /\bupdatexml\b[\s]*\(/gim,
  /\bcast\b[\s]*\(.*\bas\b[\s]*\bint\b[\s]*\)/gim,
  /\bconvert\b[\s]*\(.*,[\s]*\bint\b[\s]*\)/gim,

  // Stacked queries
  /;[\s]*\b(select|insert|update|delete|drop|create|alter|exec|execute)\b/gim,

  // Comando SQL básicos en contextos sospechosos
  /(\b(select|insert|update|delete|drop|create|alter|truncate|exec|execute|declare|cast|convert|union|script|javascript|vbscript)\b)(?=.*(\bfrom\b|\binto\b|\bwhere\b|\bvalues\b|\btable\b|\bdatabase\b|\bschema\b))/gim,

  // Funciones de sistema
  /\b(sys|information_schema|pg_|mysql\.)\w*/gim,
  /\b(user|current_user|system_user|session_user|database|version|@@version|@@global|@@session)\b/gim,

  // Caracteres especiales sospechosos en combinación
  /['"`][\s]*(\bor\b|\band\b)[\s]*['"`]/gim,
  /['"`][\s]*[=<>!]+[\s]*['"`]/gim,

  // Bypass attempts
  /\b(ascii|char|chr|substring|mid|left|right|len|length)\b[\s]*\(/gim,
  /\bhex\b[\s]*\(|0x[0-9a-f]+/gim,

  // XPath injection (también puede afectar bases de datos)
  /\bor\b[\s]*\bcontains\b[\s]*\(/gim,
  /\band\b[\s]*\bcontains\b[\s]*\(/gim,

  // Intentos de evasión
  /%27|%22|%23|%2d%2d|%2f%2a|%2a%2f/gim, // URL encoded characters
  /\\\x27|\\\x22|\\\x23/gim, // Hex encoded characters
];

// Palabras clave SQL sospechosas
const SUSPICIOUS_SQL_KEYWORDS: string[] = [
  "select",
  "insert",
  "update",
  "delete",
  "drop",
  "create",
  "alter",
  "truncate",
  "exec",
  "execute",
  "union",
  "declare",
  "cast",
  "convert",
  "script",
  "javascript",
  "vbscript",
  "onload",
  "onerror",
  "eval",
  "expression",
  "from",
  "where",
  "into",
  "values",
  "table",
  "database",
  "schema",
  "information_schema",
  "sys",
  "mysql",
  "pg_",
  "sqlite_master",
  "msysobjects",
  "sysobjects",
  "syscolumns",
  "systables",
];

// Función para normalizar texto (para detectar evasiones)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['"`;]/g, "")
    .replace(/%20/g, " ")
    .replace(/%27/g, "'")
    .replace(/%22/g, '"')
    .replace(/%23/g, "#")
    .replace(/%2d%2d/g, "--")
    .replace(/%2f%2a/g, "/*")
    .replace(/%2a%2f/g, "*/")
    .trim();
}

// Función para verificar si un valor contiene patrones de inyección SQL
function containsSQLInjection(value: any, config: SQLInjectionConfig): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = normalizeText(value);

  // Verificar patrones de expresiones regulares
  for (const pattern of [
    ...SQL_INJECTION_PATTERNS,
    ...(config.customPatterns || []),
  ]) {
    if (pattern.test(normalizedValue) || pattern.test(value)) {
      return true;
    }
  }

  // Verificar palabras clave sospechosas en combinación
  const words = normalizedValue.split(" ");
  let suspiciousKeywordCount = 0;

  for (const word of words) {
    if (SUSPICIOUS_SQL_KEYWORDS.includes(word)) {
      suspiciousKeywordCount++;
    }
  }

  // Si hay 2 o más palabras clave SQL sospechosas, considerar como posible inyección
  if (suspiciousKeywordCount >= 2) {
    return true;
  }

  // Verificar patrones específicos de bypass
  if (
    normalizedValue.includes("'or'") ||
    normalizedValue.includes('"or"') ||
    normalizedValue.includes("'and'") ||
    normalizedValue.includes('"and"') ||
    normalizedValue.includes("1=1") ||
    normalizedValue.includes("1=2") ||
    normalizedValue.includes("'='") ||
    normalizedValue.includes('"="')
  ) {
    return true;
  }

  return false;
}

// Función para verificar un objeto recursivamente
function checkObjectForSQLInjection(
  obj: any,
  config: SQLInjectionConfig,
  path: string = ""
): { found: boolean; path: string; value: any } {
  if (obj === null || obj === undefined) {
    return { found: false, path: "", value: null };
  }

  if (typeof obj === "string") {
    if (containsSQLInjection(obj, config)) {
      return { found: true, path, value: obj };
    }
  } else if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const result = checkObjectForSQLInjection(value, config, currentPath);
      if (result.found) {
        return result;
      }
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const currentPath = `${path}[${i}]`;
      const result = checkObjectForSQLInjection(obj[i], config, currentPath);
      if (result.found) {
        return result;
      }
    }
  }

  return { found: false, path: "", value: null };
}

// Función para registrar intentos de inyección
function logSQLInjectionAttempt(
  req: Request,
  location: string,
  path: string,
  value: any
) {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    method: req.method,
    url: req.originalUrl,
    location,
    path,
    suspiciousValue:
      typeof value === "string"
        ? value.substring(0, 200)
        : JSON.stringify(value).substring(0, 200),
    headers: {
      "x-forwarded-for": req.get("X-Forwarded-For"),
      "x-real-ip": req.get("X-Real-IP"),
      referer: req.get("Referer"),
      origin: req.get("Origin"),
    },
  };

  console.error(
    "🚨 INTENTO DE INYECCIÓN SQL DETECTADO:",
    JSON.stringify(logData, null, 2)
  );

  // Aquí podrías agregar lógica adicional como:
  // - Enviar alertas por email
  // - Guardar en base de datos
  // - Enviar a un servicio de monitoreo
  // - Incrementar contador de intentos por IP
}

// Middleware principal
export function sqlInjectionPrevention(
  userConfig: Partial<SQLInjectionConfig> = {}
) {
  const config: SQLInjectionConfig = { ...defaultConfig, ...userConfig };

  return (req: Request, res: Response, next: NextFunction) => {
    // Si el middleware está deshabilitado, continuar
    if (!config.enabled) {
      return next();
    }

    try {
      let suspiciousActivity = false;
      let detectionDetails: {
        location: string;
        path: string;
        value: any;
      } | null = null;

      // Verificar query parameters
      if (
        config.checkQueryParams &&
        req.query &&
        Object.keys(req.query).length > 0
      ) {
        const queryCheck = checkObjectForSQLInjection(
          req.query,
          config,
          "query"
        );
        if (queryCheck.found) {
          suspiciousActivity = true;
          detectionDetails = {
            location: "query",
            path: queryCheck.path,
            value: queryCheck.value,
          };
        }
      }

      // Verificar body
      if (!suspiciousActivity && config.checkBody && req.body) {
        const bodyCheck = checkObjectForSQLInjection(req.body, config, "body");
        if (bodyCheck.found) {
          suspiciousActivity = true;
          detectionDetails = {
            location: "body",
            path: bodyCheck.path,
            value: bodyCheck.value,
          };
        }
      }

      // Verificar headers específicos
      if (!suspiciousActivity && config.checkHeaders) {
        const headersToCheck = [
          "user-agent",
          "referer",
          "x-forwarded-for",
          "x-real-ip",
          "origin",
          "authorization",
          "x-requested-with",
        ];

        for (const headerName of headersToCheck) {
          const headerValue = req.get(headerName);
          if (headerValue && containsSQLInjection(headerValue, config)) {
            suspiciousActivity = true;
            detectionDetails = {
              location: "headers",
              path: headerName,
              value: headerValue,
            };
            break;
          }
        }
      }

      // Si se detectó actividad sospechosa
      if (suspiciousActivity && detectionDetails) {
        // Registrar el intento
        if (config.logAttempts) {
          logSQLInjectionAttempt(
            req,
            detectionDetails.location,
            detectionDetails.path,
            detectionDetails.value
          );
        }

        // Bloquear la petición si está configurado
        if (config.blockSuspiciousRequests) {
          return res.status(400).json({
            error: "Petición bloqueada por seguridad",
            message:
              "Se ha detectado contenido potencialmente malicioso en la petición",
            code: "SQL_INJECTION_DETECTED",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Si llegamos aquí, la petición es segura
      next();
    } catch (error) {
      console.error("Error en middleware de prevención SQL Injection:", error);
      // En caso de error, permitir que la petición continúe para no interrumpir el servicio
      next();
    }
  };
}

// Función utilitaria para validar strings individuales (para uso manual)
export function validateString(
  value: string,
  config: Partial<SQLInjectionConfig> = {}
): boolean {
  const fullConfig: SQLInjectionConfig = { ...defaultConfig, ...config };
  return !containsSQLInjection(value, fullConfig);
}

// Función utilitaria para sanitizar strings (básica)
export function sanitizeString(value: string): string {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/['"`;]/g, "") // Remover comillas y punto y coma
    .replace(/--/g, "") // Remover comentarios SQL
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remover comentarios de bloque
    .replace(/#.*$/gm, "") // Remover comentarios con #
    .trim();
}

// Exportar configuración por defecto para referencia
export { defaultConfig as defaultSQLInjectionConfig };
