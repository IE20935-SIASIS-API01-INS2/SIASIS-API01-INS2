import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export async function eliminarVacacionesInterescolares(
    id: number,
    instanciaEnUso?: RDP02
): Promise<number> {
    const consulta = `
        DELETE FROM "T_Vacaciones_Interescolares"
        WHERE "Id_Vacacion_Interescolar" = $1
        RETURNING "Id_Vacacion_Interescolar"
    `;

    try {
        const resultado = await query<{ Id_Vacacion_Interescolar: number }>(
            instanciaEnUso,
            consulta, [id]);

        if (resultado.rows.length === 0) {
            throw new Error("No se encontró el registro a eliminar");
        }

        return resultado.rows[0].Id_Vacacion_Interescolar;
    } catch (error) {
        console.error("Error al eliminar vacaciones:", error);
        throw new Error("No se pudo eliminar el registro de vacaciones.");
    }
}