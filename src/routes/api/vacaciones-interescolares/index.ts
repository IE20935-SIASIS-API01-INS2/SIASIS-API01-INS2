import { Request, Response, Router } from "express";
import { RequestErrorTypes, SystemErrorTypes, ValidationErrorTypes } from "../../../interfaces/shared/errors";
import { ErrorResponseAPIBase } from "../../../interfaces/shared/apis/types";
import { obtenerVacacionesInterescolares, obtenerVacacionesPorMes, verificarSolapamientoConVacaciones } from "../../../../core/databases/queries/RDP02/vacaciones-interescolares/obtenerVacacionesInterescolares";
import { handleSQLError } from "../../../lib/helpers/handlers/errors/postgreSQL";
import { RolesSistema } from "../../../interfaces/shared/RolesSistema";
import { validateFecha } from "../../../lib/helpers/validators/data/validateFecha";
import { agregarVacacionesInterescolares } from "../../../../core/databases/queries/RDP02/vacaciones-interescolares/registrarVacacionesInterescolares";
import { obtenerFechasImportantes } from "../../../../core/databases/queries/RDP02/fechas-importantes/obtenerFechasImportantes";
import { T_Vacaciones_Interescolares } from "@prisma/client";
import isDirectivoAuthenticated from "../../../middlewares/isDirectivoAuthenticated";
import checkAuthentication from "../../../middlewares/checkAuthentication";
import { eliminarVacacionesInterescolares } from "../../../../core/databases/queries/RDP02/vacaciones-interescolares/eliminarVacacionesInterescolares";
import { actualizarVacacionesInterescolares } from "../../../../core/databases/queries/RDP02/vacaciones-interescolares/actualizarVacacionesInterescolares";
import isProfesorPrimariaAuthenticated from "../../../middlewares/isProfesorPrimariaAuthenticated";
import isProfesorSecundariaAuthenticated from "../../../middlewares/isProfesorSecundariaAuthenticated";
import isTutorAuthenticated from "../../../middlewares/isTutorAuthenticated";
import isAuxiliarAuthenticated from "../../../middlewares/isAuxiliarAuthenticated";
import isPersonalAdministrativoAuthenticated from "../../../middlewares/isPersonalAdministrativoAuthenticated";
import { RDP02 } from "../../../interfaces/shared/RDP02Instancias";

const router = Router();

export async function validarVacacionesInterescolares(
    fechaInicio: Date,
    fechaConclusion: Date,
    rdp02EnUso: RDP02,
    idAExcluir?: number
): Promise<ErrorResponseAPIBase | null> {
    const validacionInicio = validateFecha(fechaInicio, true);
    const validacionConclusion = validateFecha(fechaConclusion, true);

    if (!validacionInicio.isValid) {
        return {
            success: false,
            message: validacionInicio.errorMessage!,
            errorType: validacionInicio.errorType!
        };
    }

    if (!validacionConclusion.isValid) {
        return {
            success: false,
            message: validacionConclusion.errorMessage!,
            errorType: validacionConclusion.errorType!
        };
    }

    // No permitir fechas pasadas (comparando solo con fecha actual, sin hora)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaInicio < hoy || fechaConclusion < hoy) {
        return {
            success: false,
            message: `No se pueden registrar fechas en el pasado.`,
            errorType: ValidationErrorTypes.DATE_OUT_OF_RANGE
        };
    }

    if (fechaConclusion < fechaInicio) {
        return {
            success: false,
            message: `La fecha de conclusión no puede ser anterior a la fecha de inicio.`,
            errorType: ValidationErrorTypes.INVALID_DATE_FORMAT
        };
    }

    const { inicio, fin } = await obtenerFechasImportantes(rdp02EnUso);
    if (fechaInicio < inicio || fechaConclusion > fin) {
        return {
            success: false,
            message: `Las fechas deben estar dentro del año escolar (${inicio.toISOString().split('T')[0]} - ${fin.toISOString().split('T')[0]})`,
            errorType: ValidationErrorTypes.DATE_OUT_OF_RANGE
        };
    }

    const mesesCubiertos: number[] = [];
    let mes = fechaInicio.getMonth() + 1;
    const mesFinal = fechaConclusion.getMonth() + 1;
    while (mes <= mesFinal) {
        mesesCubiertos.push(mes);
        mes++;
    }

    //   const eventos: T_Eventos[] = [];
    //   for (const m of mesesCubiertos) {
    //     const eventosDelMes = await buscarEventosPorMes(m, fechaInicio.getFullYear(), rdp02EnUso);
    //     eventos.push(...eventosDelMes);
    //   }

    //   const eventosSolapados = verificarConflictoConEventos(fechaInicio, fechaConclusion, eventos);
    //   if (eventosSolapados.length > 0) {
    //     return {
    //       success: false,
    //       message: `No se pueden registrar vacaciones que se crucen con eventos importantes: ${eventosSolapados.map(e => `"${e.Nombre}"`).join(", ")}`,
    //       errorType: ValidationErrorTypes.INVALID_DATE_FORMAT
    //     };
    //   }

    const vacacionesEnMeses: T_Vacaciones_Interescolares[] = [];
    for (const m of mesesCubiertos) {
        const vacMes = await obtenerVacacionesPorMes(fechaInicio.getFullYear(), m, rdp02EnUso);
        vacacionesEnMeses.push(...vacMes);
    }

    const conflicto = verificarSolapamientoConVacaciones(fechaInicio, fechaConclusion, vacacionesEnMeses, idAExcluir);
    if (conflicto) {
        return {
            success: false,
            message: `Las fechas ingresadas se cruzan con un período ya registrado del ${conflicto.Fecha_Inicio.toISOString().split("T")[0]} al ${conflicto.Fecha_Conclusion.toISOString().split("T")[0]}.`,
            errorType: ValidationErrorTypes.INVALID_DATE_FORMAT
        };
    }

    return null;
}

router.get("/", isDirectivoAuthenticated,
    isDirectivoAuthenticated,
    isProfesorPrimariaAuthenticated,
    isProfesorSecundariaAuthenticated,
    isTutorAuthenticated,
    isAuxiliarAuthenticated,
    isPersonalAdministrativoAuthenticated as any,
    checkAuthentication as any,
    (async (req: Request, res: Response) => {
        try {

            // 
            // Verificar que el usuario autenticado es un directivo
            const rdp02EnUso = req.RDP02_INSTANCE!;
            const vacaciones = await obtenerVacacionesInterescolares(rdp02EnUso);

            // Formatear fechas para mejor visualización
            const vacacionesFormateadas = vacaciones.map(v => ({
                ...v,
                Fecha_Inicio: v.Fecha_Inicio.toISOString().split('T')[0],
                Fecha_Conclusion: v.Fecha_Conclusion.toISOString().split('T')[0]
            }));

            return res.status(200).json({
                success: true,
                message: "Vacaciones interescolares obtenidas exitosamente",
                data: vacacionesFormateadas,
            });
        } catch (error) {
            console.error("Error al obtener vacaciones interescolares:", error);

            const handledError = handleSQLError(error);
            if (handledError) {
                return res.status(handledError.status).json(handledError.response);
            }

            return res.status(500).json({
                success: false,
                message: "Error al obtener vacaciones interescolares",
                errorType: SystemErrorTypes.UNKNOWN_ERROR,
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }) as any);

router.post('/',
    isDirectivoAuthenticated,
    checkAuthentication as any,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userRole = req.userRole!;
            const rdp02EnUso = req.RDP02_INSTANCE!;
            const { Fecha_Inicio, Fecha_Conclusion } = req.body;

            if (userRole !== RolesSistema.Directivo) {
                res.status(403).json({
                    success: false,
                    message: `Permiso solo para usuarios ${RolesSistema.Directivo}`,
                    errorType: RequestErrorTypes.INVALID_PARAMETERS
                });
                return;
            }

            const fechaInicio = new Date(Fecha_Inicio);
            const fechaConclusion = new Date(Fecha_Conclusion);

            const errorValidacion = await validarVacacionesInterescolares(fechaInicio, fechaConclusion, rdp02EnUso);
            if (errorValidacion) {
                res.status(400).json(errorValidacion);
                return;
            }

            const idInsertado = await agregarVacacionesInterescolares({
                Fecha_Inicio: fechaInicio,
                Fecha_Conclusion: fechaConclusion,
            }, rdp02EnUso);

            res.status(201).json({
                success: true,
                message: "Vacaciones interescolares registradas correctamente",
                data: {
                    Id_Vacacion_Interescolar: idInsertado
                }
            });
        } catch (e) {
            console.error('Error al registrar la fecha', e);
            const handleError = handleSQLError(e);
            if (handleError) {
                res.status(handleError.status).json(handleError.response);
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Error del servidor al registrar la fecha',
                errorType: SystemErrorTypes.UNKNOWN_ERROR,
                details: (e as any).message
            });
        }
    }
);


// PARA ACTUALIZAR POR EL ID - FUNCIONA AÑA AÑA
router.put('/:id',
    isDirectivoAuthenticated,
    checkAuthentication as any,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userRole = req.userRole!;
            const rdp02EnUso = req.RDP02_INSTANCE!;
            const { id } = req.params;
            const { Fecha_Inicio, Fecha_Conclusion } = req.body;

            if (userRole !== RolesSistema.Directivo) {
                res.status(403).json({
                    success: false,
                    message: `Permiso solo para usuarios ${RolesSistema.Directivo}`,
                    errorType: RequestErrorTypes.INVALID_PARAMETERS
                });
                return
            }

            const fechaInicio = new Date(Fecha_Inicio);
            const fechaConclusion = new Date(Fecha_Conclusion);

            const idNumerico = parseInt(id);

            // Verificar existencia
            const vacaciones = await obtenerVacacionesInterescolares(rdp02EnUso);
            const vacacion = vacaciones.find(v => v.Id_Vacacion_Interescolar === idNumerico);
            if (!vacacion) {
                res.status(404).json({
                    success: false,
                    message: "Vacación interescolar no encontrada",
                    errorType: RequestErrorTypes.MISSING_PARAMETERS
                });
                return;
            }

            const errorValidacion = await validarVacacionesInterescolares(fechaInicio, fechaConclusion, rdp02EnUso, idNumerico);
            if (errorValidacion) {
                res.status(400).json(errorValidacion);
                return;
            }

            const idActualizado = await actualizarVacacionesInterescolares(
                idNumerico,
                {
                    Fecha_Inicio: fechaInicio,
                    Fecha_Conclusion: fechaConclusion
                },
                rdp02EnUso
            );

            res.status(200).json({
                success: true,
                message: "Vacaciones interescolares actualizadas correctamente",
                data: {
                    Id_Vacacion_Interescolar: idActualizado
                }
            });
            return
        } catch (e) {
            console.error('Error al actualizar vacaciones:', e);

            const handleError = handleSQLError(e);
            if (handleError) {
                res.status(handleError.status).json(handleError.response);
                return
            }

            res.status(500).json({
                success: false,
                message: 'Error del servidor al actualizar las vacaciones',
                errorType: SystemErrorTypes.UNKNOWN_ERROR,
                details: (e as any).message
            });
            return
        }
    }
);


// Probar que afecte a las 3 instancias - FUNCIONA AÑA AÑA
router.delete('/:id',
    isDirectivoAuthenticated,
    checkAuthentication as any,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userRole = req.userRole!;
            const rdp02EnUso = req.RDP02_INSTANCE!;
            const { id } = req.params;

            if (userRole !== RolesSistema.Directivo) {
                res.status(403).json({
                    success: false,
                    message: `Permiso solo para usuarios ${RolesSistema.Directivo}`,
                    errorType: RequestErrorTypes.INVALID_PARAMETERS
                } as ErrorResponseAPIBase);
                return;
            }

            // 🔍 Obtener la fecha antes de eliminar
            const vacaciones = await obtenerVacacionesInterescolares(rdp02EnUso);
            const vacacion = vacaciones.find(v => v.Id_Vacacion_Interescolar === parseInt(id));

            if (!vacacion) {
                res.status(404).json({
                    success: false,
                    message: "Vacación interescolar no encontrada",
                    errorType: RequestErrorTypes.MISSING_PARAMETERS
                });
                return
            }

            // ❌ Validar que no se pueda eliminar si ya pasó
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const fechaConclusion = new Date(vacacion.Fecha_Conclusion);
            fechaConclusion.setHours(0, 0, 0, 0);

            if (fechaConclusion < hoy) {
                res.status(400).json({
                    success: false,
                    message: "No se puede eliminar una vacación que ya concluyó.",
                    errorType: ValidationErrorTypes.DATE_OUT_OF_RANGE
                });
                return
            }

            const idEliminado = await eliminarVacacionesInterescolares(parseInt(id), rdp02EnUso);

            res.status(200).json({
                success: true,
                message: "Vacaciones interescolares eliminadas correctamente",
                data: {
                    Id_Vacacion_Interescolar: idEliminado
                }
            });
            return
        } catch (e) {
            console.error('Error al eliminar vacaciones:', e);

            const handleError = handleSQLError(e);
            if (handleError) {
                res.status(handleError.status).json(handleError.response); return
            }

            res.status(500).json({
                success: false,
                message: 'Error del servidor al eliminar las vacaciones',
                errorType: SystemErrorTypes.UNKNOWN_ERROR,
                details: (e as any).message
            } as ErrorResponseAPIBase);
            return
        }
    }
);

export default router;