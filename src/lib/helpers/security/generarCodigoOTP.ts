export default function generarCodigoOTP(): string {
  // Generar un código de 6 dígitos (con posibles ceros adelante)
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}
