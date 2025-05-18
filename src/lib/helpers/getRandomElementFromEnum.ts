/**
 * Obtiene una elemento aleatorio de un enum
 * @param enumObject Enum del cual obtener una elemento aleatorio
 * @returns Una elemento aleatorio del enum proporcionado
 */
export function getRandomElementFromEnum<T>(enumObject: any): T {
  const enumValues = Object.values(enumObject);
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex] as T;
}
