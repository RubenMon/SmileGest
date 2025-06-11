import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**', // Ruta comodín que captura todas las rutas no definidas explícitamente.
    renderMode: RenderMode.Server  // Indica que estas rutas se deben renderizar siempre en el servidor.
  }
];
