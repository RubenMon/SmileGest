import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    // Habilita renderizado en servidor.
    provideServerRendering(),
    // Configura las rutas que se usan para SSR.
    provideServerRouting(serverRoutes)
  ]
};

// Combina la configuración principal de la app con la configuración específica del servidor
// para generar la configuración completa que se usará en SSR.
export const config = mergeApplicationConfig(appConfig, serverConfig);

