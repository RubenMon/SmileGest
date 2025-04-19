import { Usuario } from '../../interfaces/usuario.interface';
import { Injectable } from "@angular/core";
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})

export class AuthService{

  constructor(){}

  getAuth(){
    return getAuth();
  }

  register(usuario: Usuario) {
    const auth = getAuth();
    const db = getFirestore();

    return createUserWithEmailAndPassword(auth, usuario.email, usuario.password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;

        // Guardar email y dni en la colección "users"
        const userRef = doc(db, 'users', uid);
        return setDoc(userRef, {
          email: usuario.email,
          dni: usuario.dni
        });
      });
  }

  login(Usuario:Usuario){
    return signInWithEmailAndPassword(getAuth(), Usuario.email, Usuario.password);
  }

  loginGoogle(){
    return signInWithPopup(getAuth(), new GoogleAuthProvider())
  }

  logout(){
    return signOut(getAuth());
  }

  isAuthenticated():boolean{
    const user = getAuth().currentUser;
    return user !== null;
  }
}
