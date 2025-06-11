import { Injectable, inject } from "@angular/core";
import {
  Auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  query,
  where,
  collection,
  getDocs,
  docData
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  // Servicio disponible en toda la app
  providedIn: 'root'
})
export class AuthService {
  // Inyecciones de dependencias para Auth y Firestore
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Email del usuario actual (o null si no hay)
  private currentEmail: string | null = null;

  // Subject para emitir datos del usuario actual y que otros componentes puedan suscribirse
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Inicializa la escucha del estado de autenticación
    this.initUserListener();
  }

  /**
   * Escucha los cambios en el estado de autenticación.
   * Cuando cambia (login/logout), actualiza currentUserSubject con los datos del usuario de Firestore.
   */
  private initUserListener() {
    onAuthStateChanged(this.auth, user => {
      if (!user) {
        // Si no hay usuario logueado, emite null
        this.currentUserSubject.next(null);
      } else {
        // Si hay usuario logueado:
        // Intenta obtener los datos del usuario en Firestore.
        // Nota: Se asume que el id del documento en 'users' es el UID de Firebase Auth.
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        docData(userDocRef).subscribe(userData => {
          // Emite los datos del usuario
          this.currentUserSubject.next(userData);
        });
      }
    });
  }

  // Guarda el email actual en la variable privada
  setCurrentEmail(email: string | null) {
    this.currentEmail = email;
  }

  // Retorna el email del usuario autenticado en Firebase Auth, o null si no hay
  getCurrentEmail(): string | null {
    const user = this.auth.currentUser;
    return user?.email || null;
  }

  /**
   * Registro de usuario nuevo con email y contraseña.
   * Luego guarda datos adicionales (dni, nombreCompleto) en Firestore con dni como ID del doc.
   */
  async register(usuario: { email: string; password: string; nombreCompleto: string; dni: string; }) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, usuario.email, usuario.password);
    this.setCurrentEmail(usuario.email);
    // Crear doc en Firestore con ID igual al DNI
    const userRef = doc(this.firestore, 'users', usuario.dni);
    return setDoc(userRef, {
      email: usuario.email,
      dni: usuario.dni,
      nombreCompleto: usuario.nombreCompleto,
      uid: userCredential.user.uid
    });
  }

  /**
   * Login con email y contraseña.
   * Al iniciar sesión con éxito, guarda el email actual.
   */
  login(usuario: any) {
    return signInWithEmailAndPassword(this.auth, usuario.email, usuario.password)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  /**
   * Login con Google mediante popup.
   * Guarda el email actual tras iniciar sesión.
   */
  loginWithGoogleOnly() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then(result => {
        this.setCurrentEmail(result.user.email!);
        return result;
      });
  }

  /**
   * Verifica si un email ya existe en la colección 'users' de Firestore.
   */
  async userExistsInFirestore(email: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;  // true si existe al menos un doc con ese email
  }

  /**
   * Verifica si un DNI ya existe en Firestore.
   * Aquí se usa consulta con 'where' para buscar documentos cuyo campo dni sea igual.
   */
  async dniExistsInFirestore(dni: string): Promise<boolean> {
    try {
      const userSnap = await getDocs(query(collection(this.firestore, 'users'), where('dni', '==', dni)));
      return !userSnap.empty;
    } catch {
      return false;
    }
  }

  /**
   * Guarda o actualiza los datos de usuario en Firestore usando el dni como ID de doc.
   */
  async saveUserData(uid: string, email: string, dni: string, nombreCompleto: string) {
    const userRef = doc(this.firestore, 'users', dni);
    return setDoc(userRef, { uid, email, dni, nombreCompleto });
  }

  /**
   * Cierra sesión del usuario actual.
   * Limpia el email y emite null en el currentUserSubject.
   */
  logout() {
    return signOut(this.auth).then(() => {
      this.setCurrentEmail(null);
      this.currentUserSubject.next(null);
    });
  }

  /**
   * Método para verificar si hay un usuario autenticado.
   * Resuelve con true si hay usuario, false si no.
   */
  isAuthenticated(): Promise<boolean> {
    return new Promise(resolve => {
      onAuthStateChanged(this.auth, (user: User | null) => {
        resolve(!!user);
      });
    });
  }

  /**
   * Valida que el DNI sea correcto según su formato y letra.
   */
  validateDniLetter(dni: string): boolean {
    if (!dni || !/^\d{8}[A-Za-z]$/.test(dni)) return false;
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.charAt(8).toUpperCase();
    const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    return letter === validLetters.charAt(number % 23);
  }

  /**
   * Retorna un observable con los datos del usuario logueado (o null si no hay).
   */
  getUserLogged(): Observable<any> {
    return this.currentUser$;
  }
}
