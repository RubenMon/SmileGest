import { Injectable, inject } from "@angular/core";
import { Auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, query, where, collection, getDocs, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentEmail: string | null = null;

  constructor() {}

  setCurrentEmail(email: string | null) {
    this.currentEmail = email;
  }

  getCurrentEmail(): string | null {
    const user = this.auth.currentUser;
    return user?.email || null;
  }

  // Registro de usuario
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

  // Login con email y password
  login(usuario: any) {
    return signInWithEmailAndPassword(this.auth, usuario.email, usuario.password)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  // Login con Google
  loginWithGoogleOnly() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  // Comprobar si existe usuario por email
  async userExistsInFirestore(email: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Comprobar si existe DNI
  async dniExistsInFirestore(dni: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'users'), where('dni', '==', dni));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Guardar datos usuario
  async saveUserData(uid: string, email: string, dni: string, nombreCompleto: string) {
    const userRef = doc(this.firestore, 'users', uid);
    return setDoc(userRef, { email, dni, nombreCompleto });
  }

  // Logout
  logout() {
    return signOut(this.auth).then(() => {
      this.setCurrentEmail(null);
    });
  }

  // Comprobar si está autenticado (Promise<boolean>)
  isAuthenticated(): Promise<boolean> {
    return new Promise(resolve => {
      onAuthStateChanged(this.auth, (user: User | null) => {
        resolve(!!user);
      });
    });
  }

  // Validar letra del DNI
  validateDniLetter(dni: string): boolean {
    if (!dni || !/^\d{8}[A-Za-z]$/.test(dni)) return false;
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.charAt(8).toUpperCase();
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return letter === validLetters.charAt(number % 23);
  }

  // Obtener datos del usuario logueado como Observable, incluyendo campo DNI
  getUserLogged(): Observable<any> {
    return new Observable(observer => {
      onAuthStateChanged(this.auth, user => {
        if (!user) {
          observer.next(null);
          observer.complete();
        } else {
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          docData(userDocRef).subscribe(userData => {
            observer.next(userData);
            observer.complete();
          }, error => observer.error(error));
        }
      });
    });
  }
}
