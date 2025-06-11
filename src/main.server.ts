import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Define una función 'bootstrap' que inicia la aplicación Angular con el componente raíz
// y la configuración para servidor.
const bootstrap = () => bootstrapApplication(AppComponent, config);

// Exporta esta función como valor por defecto para que pueda ser usada desde otro lugar (por ejemplo, en un servidor Node).
export default bootstrap;
