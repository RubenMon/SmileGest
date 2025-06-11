/**
 * Interfaz que representa un evento en el calendario.
 */
export interface Events {
  /** Identificador único del evento */
  id: string;

  /** Nombre o título del evento */
  name: string;

  /** Nombre del paciente asociado al evento */
  patientName: string;

  /** DNI del paciente para identificación */
  patientDni: string;

  /** Correo electrónico del paciente */
  patientEmail: string;

  /** Tipo o categoría del evento */
  type: string;

  /** Fecha y hora en que ocurre el evento */
  date: Date;

  /** Color de fondo para mostrar el evento en el calendario */
  background: string;

  /** Color del texto para mostrar sobre el fondo */
  color: string;
}
