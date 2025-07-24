import { RDP02 } from "../../../../../src/interfaces/shared/RDP02Instancias";
import { query } from "../../../connectors/postgres";

export async function obtenerFechasImportantes(instanciaEnUso: RDP02): Promise<{ inicio: Date; fin: Date }> {
    const sql = `
        SELECT "Nombre", "Valor"
        FROM "T_Fechas_Importantes"
        WHERE "Id_Fecha_Importante" IN (1, 2)
    `;

    const resultado = await query<{ Nombre: string; Valor: string }>(instanciaEnUso, sql);

    const fechas = resultado.rows.reduce((acc, row) => {
        if (row.Nombre === "Fecha_Inicio_Año_Escolar") acc.inicio = new Date(row.Valor);
        if (row.Nombre === "Fecha_Fin_Año_Escolar") acc.fin = new Date(row.Valor);
        return acc;
    }, {} as { inicio: Date; fin: Date });

    if (!fechas.inicio || !fechas.fin || isNaN(fechas.inicio.getTime()) || isNaN(fechas.fin.getTime())) {
        throw new Error("No se pudieron obtener las fechas del año escolar");
    }

    return fechas;
}
