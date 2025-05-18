import { EMCS01Payload } from "../../../../src/interfaces/shared/EMCS01/EMCS01Payload";
import { RDP02 } from "../../../../src/interfaces/shared/RDP02Instancias";

// Constantes para el webhook de GitHub
const GITHUB_WEBHOOK_REPO_OWNER =
  process.env.EMCS01_GITHUB_WEBHOOK_REPOSITORY_OWNER_USERNAME || "";
const GITHUB_WEBHOOK_REPO_NAME =
  process.env.EMCS01_GITHUB_WEBHOOK_REPOSITORY_NAME || "";
const GITHUB_WEBHOOK_EVENT_TYPE = "database-replication";
const GITHUB_WEBHOOK_URL = `https://api.github.com/repos/${GITHUB_WEBHOOK_REPO_OWNER}/${GITHUB_WEBHOOK_REPO_NAME}/dispatches`;

/**
 * Envía una solicitud al webhook de GitHub Actions para replicar la consulta en otras instancias
 * @param sql Consulta SQL a replicar
 * @param params Parámetros de la consulta
 * @param instanciasAActualizar Array de instancias donde se debe replicar la consulta
 * @returns Resultado de la solicitud al webhook (true si fue exitosa)
 */
export async function consultarConEMCS01(
  sql: string,
  params: any[],
  instanciasAActualizar: RDP02[]
): Promise<boolean> {
  // Si no hay instancias para actualizar, no es necesario enviar el webhook
  if (instanciasAActualizar.length === 0) {
    console.log("No hay instancias adicionales para actualizar");
    return true;
  }

  try {
    // Obtener token de instalación para la autenticación
    // const token = await getGithubActionsInstallationToken();

    // Crear la carga útil del webhook
    const payload: EMCS01Payload = {
      event_type: GITHUB_WEBHOOK_EVENT_TYPE,
      client_payload: {
        sql,
        params,
        instanciasAActualizar,
        timestamp: Date.now(),
      },
    };

    // Enviar la solicitud al webhook
    const response = await fetch(GITHUB_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${process.env.EMCS01_GITHUB_STATIC_PERSONAL_ACCESS_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Verificar si la solicitud fue exitosa (código 204)
    const success = response.status === 204;

    if (success) {
      console.log(
        `Webhook disparado correctamente para replicación en instancias: ${instanciasAActualizar.join(
          ", "
        )}`
      );
    } else {
      console.error(
        "Error disparando webhook:",
        response.status,
        await response.text()
      );
    }

    return success;
  } catch (error) {
    console.error("Error al enviar webhook:", error);
    return false;
  }
}
