import { Injectable } from "@angular/core";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  getAuth() {
    return getAuth();
  }

  register(usuario: any) {
    const auth = getAuth();
    const db = getFirestore();

    return createUserWithEmailAndPassword(auth, usuario.email, usuario.password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;
        const userRef = doc(db, 'users', uid);
        return setDoc(userRef, {
          email: usuario.email,
          dni: usuario.dni,
          nombreCompleto: usuario.nombreCompleto
        });
      });
  }

  login(usuario: any) {
    return signInWithEmailAndPassword(getAuth(), usuario.email, usuario.password);
  }

  loginWithGoogleOnly() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async userExistsInFirestore(email: string): Promise<boolean> {
    const db = getFirestore();
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async dniExistsInFirestore(dni: string): Promise<boolean> {
    const db = getFirestore();
    const q = query(collection(db, 'users'), where('dni', '==', dni));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async saveUserData(uid: string, email: string, dni: string, nombreCompleto: string) {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return setDoc(userRef, { email, dni, nombreCompleto });
  }

  logout() {
    return signOut(getAuth());
  }

  isAuthenticated(): boolean {
    return getAuth().currentUser !== null;
  }

  validateDniLetter(dni: string): boolean {
    if (!dni || !/^\d{8}[A-Za-z]$/.test(dni)) return false;
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.charAt(8).toUpperCase();
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return letter === validLetters.charAt(number % 23);
  }
}
