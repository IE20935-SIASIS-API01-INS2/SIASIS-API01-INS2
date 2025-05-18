// lib/helpers/email/enviarCorreoOTP.ts
import nodemailer from "nodemailer";
import { OTP_CODE_FOR_UPDATING_EMAIL_MINUTES } from "../../../constants/expirations";

/**
 * Función para enviar correo electrónico con código OTP para verificación
 * usando nodemailer con diferentes opciones de autenticación
 *
 * @param destinatario Email del destinatario
 * @param codigo Código OTP de 6 dígitos
 * @param nombreCompleto Nombre completo del usuario
 */
export async function enviarCorreoOTP(
  destinatario: string,
  codigo: string,
  nombreCompleto: string
): Promise<void> {
  try {
    // Verificar variables de entorno
    if (
      !process.env.SE01_SIASIS_EMAIL_USER ||
      !process.env.SE01_SIASIS_EMAIL_APPLICATION_PASSWORD
    ) {
      console.error(
        "Error: Variables de entorno SIASIS_EMAIL_USER o SIASIS_EMAIL_APPLICATION_PASSWORD no configuradas."
      );
      throw new Error("Configuración de correo incompleta");
    }

    // Crear transporter con credenciales
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SE01_SIASIS_EMAIL_USER,
        pass: process.env.SE01_SIASIS_EMAIL_APPLICATION_PASSWORD,
      },
      // debug: true,
      // logger: true,
    });

    // Verificar conexión
    try {
      await transporter.verify();
      console.log("Conexión al servidor de correo verificada");
    } catch (error) {
      console.error("Error verificando la conexión:", error);
      throw error;
    }

    const asunto =
      "Verificación de correo electrónico - Sistema de Control de Asistencia I.E. 20935 Asunción 8";

    // HTML del correo con diseño completo y mejorado
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Correo</title>
        <style>
          /* Estilos base */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          
          /* Contenedor principal */
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 30px 20px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          
          /* Cabecera */
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 2px solid #f0f0f0;
          }
          
          .logo {
            width: 160px;
            height: auto;
            margin-bottom: 20px;
          }
          
          .title {
            color: #2e5ba7;
            margin: 0;
            font-weight: 600;
            font-size: 26px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #4a4a4a;
            margin-top: 8px;
            font-weight: 400;
          }
          
          /* Contenido del mensaje */
          .message {
            margin-bottom: 35px;
            font-size: 16px;
            color: #555;
            padding: 0 10px;
          }
          
          .message p {
            margin-bottom: 16px;
          }
          
          .name {
            font-weight: 600;
            color: #2e5ba7;
          }
          
          /* Caja de código */
          .code-container {
            margin: 30px 0;
            text-align: center;
          }
          
          .code-box {
            display: inline-block;
            background-color: #f7f9fa;
            padding: 20px 40px;
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            border-radius: 10px;
            border: 1px solid #e3e8ec;
            color: #2c3e50;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
          }
          
          /* Información de tiempo */
          .time-info {
            text-align: center;
            margin: 25px 0;
          }
          
          .highlight {
            color: #e74c3c;
            font-weight: bold;
          }
          
          /* Despedida */
          .closing {
            margin-top: 35px;
            padding: 15px 10px;
            border-top: 1px solid #f0f0f0;
            color: #555;
          }
          
          /* Pie de página */
          .footer {
            font-size: 12px;
            color: #888;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            text-align: center;
          }
          
          /* Botón opcional */
          .button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 15px;
          }
          
          /* Ajustes responsivos */
          @media only screen and (max-width: 480px) {
            .container {
              padding: 20px 15px;
            }
            
            .code-box {
              padding: 15px 20px;
              font-size: 28px;
              letter-spacing: 5px;
            }
            
            .title {
              font-size: 22px;
            }
            
            .message {
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://drive.google.com/thumbnail?id=${process.env
              .LOGO_GOOGLE_DRIVE_IMAGE_ID!}" alt="Logo I.E. 20935 Asunción 8" class="logo">
            <h1 class="title">Verificación de correo electrónico</h1>
            <p class="subtitle">I.E. 20935 Asunción 8</p>
          </div>
          
          <div class="message">
            <p>Estimado(a) <span class="name">${nombreCompleto}</span>,</p>
            
            <p>Recibimos una solicitud para cambiar la dirección de correo electrónico asociada a su cuenta en el Sistema de Control de Asistencia de la I.E. 20935 Asunción 8.</p>
            
            <p>Para confirmar este cambio, por favor utilice el siguiente código de verificación:</p>
          </div>
          
          <div class="code-container">
            <div class="code-box">${codigo}</div>
          </div>
          
          <div class="time-info">
            <p>Este código expirará en <span class="highlight">${OTP_CODE_FOR_UPDATING_EMAIL_MINUTES} minutos</span>.</p>
          </div>
          
          <div class="message">
            <p>Si usted no solicitó este cambio, por favor ignore este correo o póngase en contacto con la administración inmediatamente.</p>
            
            <div class="closing">
              <p>Saludos cordiales,<br>
              <strong>Sistema de Control de Asistencia</strong><br>
              I.E. 20935 Asunción 8</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p>© ${new Date().getFullYear()} I.E. 20935 Asunción 8. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Sistema I.E. 20935" <${process.env.SE01_SIASIS_EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: htmlContent,
    };

    console.log("Enviando correo a:", destinatario);
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);
  } catch (error) {
    console.error("Error al enviar correo:", error);
    throw error;
  }
}
