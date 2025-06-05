import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-datos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './usuarioDatos.component.html',
  styleUrls: ['./usuarioDatos.component.css']
})
export class UsuarioDatosComponent implements OnInit {

  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  router = inject(Router);

  form = new FormGroup({
    dni: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    nombreCompleto: new FormControl('', Validators.required),
  });

  editMode = false;

  ngOnInit(): void {
    const dni = this.route.snapshot.paramMap.get('dni');
    if (dni && dni !== 'nuevo') {
      this.loadUser(dni);
    }
  }

  async loadUser(dni: string) {
    const userRef = doc(this.firestore, 'users', dni);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      this.form.setValue(snap.data() as any);
      this.editMode = true;
    } else {
      alert('Usuario no encontrado.');
    }
  }

  async saveUser() {
    if (this.form.invalid) return;

    const data = this.form.value;
    const userRef = doc(this.firestore, 'users', data.dni!);
    await setDoc(userRef, data);

    this.editMode = true;
    alert(this.editMode ? 'Usuario actualizado.' : 'Usuario creado.');
  }

  async deleteUser() {
    const dni = this.form.get('dni')?.value;
    if (!dni) return;

    await deleteDoc(doc(this.firestore, 'users', dni));
    this.form.reset();
    this.editMode = false;
    alert('Usuario eliminado.');
  }

  newUser() {
    this.form.reset();
    this.editMode = false;
  }

  goToHistorial() {
    const dni = this.form.get('dni')?.value;
    const nombreCompleto = this.form.get('nombreCompleto')?.value;
    if (dni) {
      this.router.navigate(['/historial', dni], {
        state: { nombreCompleto }
      });
    }
  }
}
