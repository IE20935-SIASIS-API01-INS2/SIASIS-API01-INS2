import {
  EMCN01Payload,
  MongoOperation,
} from "../../../../src/interfaces/shared/EMCN01/EMCN01Payload";
import { RDP03 } from "../../../../src/interfaces/shared/RDP03Instancias";

// Constantes para el webhook de GitHub para MongoDB
const GITHUB_WEBHOOK_REPO_OWNER =
  process.env.EMCN01_GITHUB_WEBHOOK_REPOSITORY_OWNER_USERNAME || "";
const GITHUB_WEBHOOK_REPO_NAME =
  process.env.EMCN01_GITHUB_WEBHOOK_REPOSITORY_NAME || "";
const GITHUB_WEBHOOK_EVENT_TYPE = "mongodb-replication";
const GITHUB_WEBHOOK_URL = `https://api.github.com/repos/${GITHUB_WEBHOOK_REPO_OWNER}/${GITHUB_WEBHOOK_REPO_NAME}/dispatches`;

/**
 * Envía una solicitud al webhook de GitHub Actions para replicar la operación MongoDB en otras instancias
 * @param operation Operación MongoDB a replicar
 * @param instanciasAActualizar Array de instancias donde se debe replicar la operación
 * @returns Resultado de la solicitud al webhook (true si fue exitosa)
 */
export async function consultarConEMCN01(
  operation: MongoOperation,
  instanciasAActualizar: RDP03[]
): Promise<boolean> {
  // Si no hay instancias para actualizar, no es necesario enviar el webhook
  if (instanciasAActualizar.length === 0) {
    console.log("No hay instancias adicionales para actualizar");
    return true;
  }

  try {
    // Crear la carga útil del webhook
    const payload: EMCN01Payload = {
      event_type: GITHUB_WEBHOOK_EVENT_TYPE,
      client_payload: {
        operation,
        instanciasAActualizar,
        timestamp: Date.now(),
      },
    };

    // Enviar la solicitud al webhook
    const response = await fetch(GITHUB_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${process.env
          .EMCN01_GITHUB_STATIC_PERSONAL_ACCESS_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Verificar si la solicitud fue exitosa (código 204)
    const success = response.status === 204;

    if (success) {
      console.log(
        `Webhook EMCN01 disparado correctamente para replicación en instancias: ${instanciasAActualizar.join(
          ", "
        )}`
      );
    } else {
      console.error(
        "Error disparando webhook EMCN01:",
        response.status,
        await response.text()
      );
    }

    return success;
  } catch (error) {
    console.error("Error al enviar webhook EMCN01:", error);
    return false;
  }
}
