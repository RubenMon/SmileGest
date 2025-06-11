import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Arranca la aplicación Angular en el navegador (cliente) usando la configuración proporcionada.
// Captura y muestra en consola cualquier error ocurrido durante el arranque.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
