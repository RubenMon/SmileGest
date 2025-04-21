import { Usuario } from '../../interfaces/usuario.interface';
import { Injectable } from "@angular/core";
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDocs, query, where, collection} from 'firebase/firestore';

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

  loginWithGoogleOnly() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async userExistsInFirestore(email: string): Promise<boolean> {
    const db = getFirestore();
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  async saveUserData(uid: string, email: string, dni: string) {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return setDoc(userRef, { email, dni });
  }

  async dniExistsInFirestore(dni: string): Promise<boolean> {
    const db = getFirestore();
    const q = query(collection(db, 'users'), where('dni', '==', dni));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  logout(){
    return signOut(getAuth());
  }

  isAuthenticated():boolean{
    const user = getAuth().currentUser;
    return user !== null;
  }
}
