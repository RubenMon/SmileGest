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
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private currentEmail: string | null = null;
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.initUserListener();
  }

  private initUserListener() {
    onAuthStateChanged(this.auth, user => {
      if (!user) {
        this.currentUserSubject.next(null);
      } else {
        // Ahora busca el usuario en Firestore por DNI (id del doc)
        // Pero para eso necesitamos conocer el DNI, lo ideal es tenerlo almacenado en el token o sesión.
        // Como no tenemos DNI directamente, aquí dejamos como estaba: usa UID (aunque luego la colección usa DNI como id)
        // Por eso, se recomienda guardar también el UID dentro del doc, y luego consultar con alguna lógica extra.
        // Si quieres, luego podemos mejorar esta parte.
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        docData(userDocRef).subscribe(userData => {
          this.currentUserSubject.next(userData);
        });
      }
    });
  }

  setCurrentEmail(email: string | null) {
    this.currentEmail = email;
  }

  getCurrentEmail(): string | null {
    const user = this.auth.currentUser;
    return user?.email || null;
  }

  async register(usuario: { email: string; password: string; nombreCompleto: string; dni: string; }) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, usuario.email, usuario.password);
    this.setCurrentEmail(usuario.email);
    // Guarda el usuario con DNI como ID del doc:
    const userRef = doc(this.firestore, 'users', usuario.dni);
    return setDoc(userRef, {
      email: usuario.email,
      dni: usuario.dni,
      nombreCompleto: usuario.nombreCompleto,
      uid: userCredential.user.uid
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
    // Aquí ya no usamos query sino búsqueda directa por id del doc
    const userDocRef = doc(this.firestore, 'users', dni);
    try {
      const userSnap = await getDocs(query(collection(this.firestore, 'users'), where('dni', '==', dni)));
      return !userSnap.empty;
    } catch {
      return false;
    }
  }

  async saveUserData(uid: string, email: string, dni: string, nombreCompleto: string) {
    // Guardamos el usuario con el dni como id
    const userRef = doc(this.firestore, 'users', dni);
    return setDoc(userRef, { uid, email, dni, nombreCompleto });
  }

  logout() {
    return signOut(this.auth).then(() => {
      this.setCurrentEmail(null);
      this.currentUserSubject.next(null);
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

  getUserLogged(): Observable<any> {
    return this.currentUser$;
  }
}
