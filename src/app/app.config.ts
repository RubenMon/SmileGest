import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore} from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';

// Configuración de Firebase para conectar la app con el proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUex1eb_csTP1Leo8GabCUvk_287d77AU",
  authDomain: "odontogest-2d788.firebaseapp.com",
  projectId: "odontogest-2d788",
  storageBucket: "odontogest-2d788.firebasestorage.app",
  messagingSenderId: "492208639758",
  appId: "1:492208639758:web:4c9a76d438e782621c515f"
};

// Configuración principal de la aplicación Angular
export const appConfig: ApplicationConfig = {
  providers: [
    // Optimiza la detección de cambios agrupando eventos para mejorar el rendimiento.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Configura el sistema de rutas con las rutas definidas.
    provideRouter(routes),

    // Proporciona el cliente HTTP para hacer peticiones REST.
    provideHttpClient(),

    // Habilita la hidratación del lado cliente para apps SSR y permite reemitir eventos al hidratar.
    provideClientHydration(withEventReplay()),

    // Inicializa Firebase con la configuración proporcionada.
    provideFirebaseApp(() => initializeApp(firebaseConfig)),

    // Proporciona el servicio Firestore para acceso a base de datos.
    provideFirestore(() => getFirestore()),

    // Proporciona el servicio de autenticación Firebase.
    provideAuth(() => getAuth()),

    // Proporciona el servicio de almacenamiento Firebase.
    provideStorage(() => getStorage()),

    // Habilita las animaciones en la app Angular.
    provideAnimations()
  ]
};
