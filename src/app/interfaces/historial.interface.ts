export interface HistorialItem {
  id: string;
  descripcion: string;
  imagenUrl?: string;
  fecha: Date | null;
}

export interface HistorialData {
  descripcion: string;
  imagenUrl?: string;
  fecha?: any;
}

