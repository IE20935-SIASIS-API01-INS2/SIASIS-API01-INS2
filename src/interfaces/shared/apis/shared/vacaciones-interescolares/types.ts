import { T_Vacaciones_Interescolares } from "@prisma/client";

export interface GetVacionesInterescolaresSuccessResponse {
    success: true;
    message: string;
    data: T_Vacaciones_Interescolares[]
}