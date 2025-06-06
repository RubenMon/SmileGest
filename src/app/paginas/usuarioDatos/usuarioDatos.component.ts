import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-datos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './usuarioDatos.component.html',
  styleUrls: ['./usuarioDatos.component.css'],
})
export class UsuarioDatosComponent implements OnInit {
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  router = inject(Router);

  form = new FormGroup({
    dni: new FormControl({ value: '', disabled: false }, Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    nombreCompleto: new FormControl('', Validators.required),
  });

  editMode = false;
  originalData: any = null;

  ngOnInit(): void {
    const dni = this.route.snapshot.paramMap.get('dni');
    const usuarioState = history.state?.usuario;

    if (usuarioState) {
      // Cargamos datos desde el estado si están disponibles
      this.form.setValue({
        dni: usuarioState.dni || '',
        email: usuarioState.email || '',
        nombreCompleto: usuarioState.nombreCompleto || '',
      });
      this.originalData = usuarioState;
      this.editMode = true;
    } else if (dni && dni !== 'nuevo') {
      this.loadUser(dni);
    }
  }

  async loadUser(dni: string) {
    const userRef = doc(this.firestore, 'users', dni);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const userData = snap.data();
      this.form.setValue(userData as any);
      this.originalData = userData;
      this.editMode = true;
    } else {
      alert('Usuario no encontrado.');
    }
  }

  async saveUser() {
    if (this.form.invalid) return;

    const data = this.form.getRawValue();
    data.dni = this.originalData?.dni ?? data.dni;

    if (this.editMode && this.isDataUnchanged(data)) {
      alert('No hay cambios para guardar.');
      return;
    }

    const userRef = doc(this.firestore, 'users', data.dni!);
    await setDoc(userRef, data);

    this.originalData = { ...data };
    this.editMode = true;
    alert(this.editMode ? 'Usuario actualizado.' : 'Usuario creado.');
  }

  isDataUnchanged(data: any): boolean {
    return this.originalData &&
      data.email === this.originalData.email &&
      data.nombreCompleto === this.originalData.nombreCompleto;
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
    this.originalData = null;
  }

  goToHistorial() {
    const data = this.form.getRawValue();
    if (data.dni) {
      this.router.navigate(['/historial', data.dni], {
        state: { usuario: data }
      });
    }
  }

  verUsuarios() {
    this.router.navigate(['/usuarios']);
  }
}
