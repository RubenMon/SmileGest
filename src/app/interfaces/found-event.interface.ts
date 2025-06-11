/**
 * Interfaz que representa un evento encontrado dentro de una estructura de calendario.
 */
export interface FoundEvent {
  /** Índice del evento dentro del arreglo de eventos */
  eventIndex: number;

  /** Índice del día dentro del calendario donde se encuentra el evento */
  calendarIndex: number;

  /** Indica si el evento encontrado coincide exactamente en fecha */
  sameDate: boolean;
}
