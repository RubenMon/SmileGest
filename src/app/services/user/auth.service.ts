import { Usuario } from '../../interfaces/usuario.interface';
import { Injectable } from "@angular/core";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firestore = inject(Firestore);

  constructor(){}

  getAuth() {
    return getAuth();
  }

  async register(usuario: Usuario) {
    // Registro del usuario en Firebase Authentication
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, usuario.email, usuario.password);

    // Obtener el UID del usuario recién creado
    const uid = userCredential.user.uid;

    // Guardar información adicional en Firestore
    // Puedes crear una colección "users" y guardar el DNI junto con otros datos
    await setDoc(doc(this.firestore, 'users', uid), {
      dni: usuario.dni,
    });

    return userCredential;
  }

  login(usuario: Usuario) {
    return signInWithEmailAndPassword(getAuth(), usuario.email, usuario.password);
  }

  loginGoogle() {
    return signInWithPopup(getAuth(), new GoogleAuthProvider());
  }

  logout() {
    return signOut(getAuth());
  }

  isAuthenticated(): boolean {
    const user = getAuth().currentUser;
    return user !== null;
  }
}
