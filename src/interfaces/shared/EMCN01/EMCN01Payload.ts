
import { RDP03_Nombres_Tablas } from "../RDP03/RDP03_Tablas";
import { RDP03 } from "../RDP03Instancias";

/**
 * Interfaz para la carga útil del webhook EMCN01 (MongoDB replication)
 */
export interface EMCN01Payload {
  event_type: string;
  client_payload: {
    operation: MongoOperation;
    instanciasAActualizar: RDP03[];
    timestamp: number;
  };
}


// Interfaz para operaciones MongoDB
export interface MongoOperation {
  operation:
    | "find"
    | "findOne"
    | "insertOne"
    | "insertMany"
    | "updateOne"
    | "updateMany"
    | "deleteOne"
    | "deleteMany"
    | "replaceOne"
    | "aggregate"
    | "countDocuments";
  collection: RDP03_Nombres_Tablas;
  filter?: any;
  data?: any;
  options?: any;
  pipeline?: any[];
}