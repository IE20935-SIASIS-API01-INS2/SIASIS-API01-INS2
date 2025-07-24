import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export async function actualizarVacacionesInterescolares(
    id: number,
    data: {
        Fecha_Inicio: Date;
        Fecha_Conclusion: Date;
    },
    instanciaEnUso?: RDP02
): Promise<number> {
    if (!(data.Fecha_Inicio instanceof Date) || isNaN(data.Fecha_Inicio.getTime())) {
        throw new Error("Fecha_Inicio no es válida");
    }

    if (!(data.Fecha_Conclusion instanceof Date) || isNaN(data.Fecha_Conclusion.getTime())) {
        throw new Error("Fecha_Conclusion no es válida");
    }

    if (data.Fecha_Conclusion < data.Fecha_Inicio) {
        throw new Error("La fecha de conclusión no puede ser anterior a la fecha de inicio");
    }

    const consulta = `
        UPDATE "T_Vacaciones_Interescolares"
        SET "Fecha_Inicio" = $1, "Fecha_Conclusion" = $2
        WHERE "Id_Vacacion_Interescolar" = $3
        RETURNING "Id_Vacacion_Interescolar"
    `;

    try {
        const resultado = await query<{ Id_Vacacion_Interescolar: number }>(
            instanciaEnUso,
            consulta, [
                data.Fecha_Inicio,
                data.Fecha_Conclusion,
                id
            ]);

        if (resultado.rows.length === 0) {
            throw new Error("No se encontró el registro a actualizar");
        }

        return resultado.rows[0].Id_Vacacion_Interescolar;
    } catch (error) {
        console.error("Error al actualizar vacaciones:", error);
        throw new Error("No se pudo actualizar el registro de vacaciones.");
    }
}