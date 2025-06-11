// Importamos la interfaz Events, que define la estructura de los eventos en el calendario
import { Events } from "../interfaces/events.interface";

/**
 * Interfaz que representa un día en el calendario con sus propiedades.
 */
export interface Calendar {
  /** Número del día del mes (1-31), o null si no aplica */
  day: number | null;

  /** Indica si este día es el día actual (hoy) */
  currentDay: boolean;

  /** Indica si este día pertenece al mes actualmente mostrado */
  currentMonth: boolean;

  /** Lista de eventos asociados a este día */
  events: Events[];

  /** Objeto Date que representa la fecha completa de este día */
  date: Date;
}
