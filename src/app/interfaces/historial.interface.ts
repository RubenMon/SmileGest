/**
 * Representa un ítem individual en un historial.
 */
export interface HistorialItem {
  /** Identificador único del ítem */
  id: string;

  /** Descripción textual del ítem */
  descripcion: string;

  /** URL opcional de una imagen asociada al ítem */
  imagenUrl?: string;

  /** Fecha asociada al ítem; puede ser null si no aplica */
  fecha: Date | null;
}

/**
 * Representa los datos que se utilizan para crear un ítem de historial.
 * No incluye el id porque se suele usar para entradas nuevas o datos parciales.
 */
export interface HistorialData {
  /** Descripción textual */
  descripcion: string;

  /** URL opcional de imagen */
  imagenUrl?: string;

  /** Fecha opcional, tipo any porque puede ser en varios formatos */
  fecha?: any;

  /** Imagen en base64 opcional, por si se envía la imagen directamente */
  imagenBase64?: string | null;
}
