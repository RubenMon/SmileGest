import { Injectable, inject } from "@angular/core";
import { Auth } from '@angular/fire/auth'; // Cambiado a la importación moderna
import { Firestore } from '@angular/fire/firestore'; // Cambiado a la importación moderna
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import {
  doc,
  setDoc,
  query,
  where,
  collection,
  getDocs
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth); // Inyección de Auth
  private firestore = inject(Firestore); // Inyección de Firestore

private currentEmail: string | null = null;

  constructor() {}

  setCurrentEmail(email: string | null) {
    this.currentEmail = email;
  }

  getCurrentEmail(): string | null {
    const user = this.auth.currentUser;
    return user?.email || null;
  }

  // Métodos de autenticación
  register(usuario: any) {
    return createUserWithEmailAndPassword(this.auth, usuario.email, usuario.password)
      .then((userCredential) => {
        this.setCurrentEmail(usuario.email);

        const uid = userCredential.user.uid;
        const userRef = doc(this.firestore, 'users', uid);
        return setDoc(userRef, {
          email: usuario.email,
          dni: usuario.dni,
          nombreCompleto: usuario.nombreCompleto
        });
      });
  }

  login(usuario: any) {
    return signInWithEmailAndPassword(this.auth, usuario.email, usuario.password)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  loginWithGoogleOnly() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  async userExistsInFirestore(email: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async dniExistsInFirestore(dni: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'users'), where('dni', '==', dni));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async saveUserData(uid: string, email: string, dni: string, nombreCompleto: string) {
    const userRef = doc(this.firestore, 'users', uid);
    return setDoc(userRef, { email, dni, nombreCompleto });
  }

  logout() {
    return signOut(this.auth).then(() => {
      this.setCurrentEmail(null);
    });
  }


  isAuthenticated(): Promise<boolean> {
    return new Promise(resolve => {
      onAuthStateChanged(this.auth, (user: User | null) => {
        resolve(!!user);
      });
    });
  }


  validateDniLetter(dni: string): boolean {
    if (!dni || !/^\d{8}[A-Za-z]$/.test(dni)) return false;
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.charAt(8).toUpperCase();
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return letter === validLetters.charAt(number % 23);
  }
}
