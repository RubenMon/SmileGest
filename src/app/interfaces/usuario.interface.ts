/**
 * Interfaz que representa los datos de un usuario.
 */
export interface Usuario {
  /** Correo electrónico del usuario */
  email: string;

  /** Contraseña del usuario */
  password: string;

  /** DNI (Documento Nacional de Identidad) del usuario */
  dni: string;
}
