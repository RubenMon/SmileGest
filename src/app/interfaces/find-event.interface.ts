// Importamos la interfaz FoundEvent que define la estructura de un evento encontrado
import { FoundEvent } from "../interfaces/found-event.interface";

/**
 * Tipo que representa el resultado de una búsqueda de evento.
 * Puede ser:
 * - Un evento encontrado (FoundEvent),
 * - null si no se encontró ningún evento,
 * - o undefined si el resultado aún no está definido o cargado.
 */
export type FindEvent = FoundEvent | null | undefined;
