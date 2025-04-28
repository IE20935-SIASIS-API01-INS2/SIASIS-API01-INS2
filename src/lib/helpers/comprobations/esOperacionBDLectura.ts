/**
 * Detecta si una consulta SQL es de lectura o escritura
 * @param sql Consulta SQL a analizar
 * @returns true si es una operación de lectura, false si es de escritura
 */
export function esOperacionBDLectura(sql: string): boolean {
  const normalizedSQL = sql.trim().toUpperCase();

  return (
    normalizedSQL.startsWith("SELECT") ||
    normalizedSQL.startsWith("WITH") ||
    normalizedSQL.startsWith("EXPLAIN")
  );
}
