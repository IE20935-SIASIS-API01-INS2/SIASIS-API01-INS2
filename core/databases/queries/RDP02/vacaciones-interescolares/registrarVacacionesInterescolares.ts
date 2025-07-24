import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export async function agregarVacacionesInterescolares(data: {
    Fecha_Inicio: Date;
    Fecha_Conclusion: Date;
}, instanciaEnUso?: RDP02): Promise<number> {
    if (!(data.Fecha_Inicio instanceof Date) || isNaN(data.Fecha_Inicio.getTime())) {
        throw new Error("Fecha_Inicio no es válida");
    }

    if (!(data.Fecha_Conclusion instanceof Date) || isNaN(data.Fecha_Conclusion.getTime())) {
        throw new Error("Fecha_Conclusion no es válida");
    }

    const consulta = `
        INSERT INTO "T_Vacaciones_Interescolares" ("Fecha_Inicio", "Fecha_Conclusion")
        VALUES ($1, $2) 
        RETURNING "Id_Vacacion_Interescolar"
    `;

    try {
        const resultado = await query<{ Id_Vacacion_Interescolar: number }>(
        instanciaEnUso,
        consulta, [
            data.Fecha_Inicio,
            data.Fecha_Conclusion,
        ]);

        return resultado.rows[0].Id_Vacacion_Interescolar;
    } catch (error) {
        console.error("Error al insertar vacaciones:", error);
        throw new Error("No se pudo insertar el registro de vacaciones.");
    }
}
