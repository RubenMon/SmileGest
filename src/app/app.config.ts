import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Firebase Modular
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore} from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUex1eb_csTP1Leo8GabCUvk_287d77AU",
  authDomain: "odontogest-2d788.firebaseapp.com",
  projectId: "odontogest-2d788",
  storageBucket: "odontogest-2d788.firebasestorage.app",
  messagingSenderId: "492208639758",
  appId: "1:492208639758:web:4c9a76d438e782621c515f"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
    provideAnimations()
  ]
};
