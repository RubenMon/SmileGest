import { Usuario } from './../interfaces/usuario.interface';
import { Injectable } from "@angular/core";
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'

@Injectable({
  providedIn: 'root'
})

export class AuthService{

  constructor(){}

  getAuth(){
    return getAuth();
  }

  register( Usuario:Usuario){
    return createUserWithEmailAndPassword(getAuth(), Usuario.email, Usuario.password);
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
