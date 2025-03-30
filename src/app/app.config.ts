import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // Nueva importación

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp } from 'firebase/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUex1eb_csTP1Leo8GabCUvk_287d77AU",
  authDomain: "odontogest-2d788.firebaseapp.com",
  projectId: "odontogest-2d788",
  storageBucket: "odontogest-2d788.firebasestorage.app",
  messagingSenderId: "492208639758",
  appId: "1:492208639758:web:4c9a76d438e782621c515f"
};

initializeApp(firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(), // Sustituyendo HttpClientModule
    provideClientHydration(withEventReplay()),
    importProvidersFrom(
      AngularFireModule.initializeApp(firebaseConfig),
      AngularFirestoreModule
    )
  ]
};
