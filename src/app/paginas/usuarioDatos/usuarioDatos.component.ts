import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getAuth, updateEmail } from 'firebase/auth';
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
    dni: new FormControl({ value: '', disabled: true }, Validators.required),
    email: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.email]),
    nombreCompleto: new FormControl('', Validators.required),
  });

  editMode = false;
  originalData: any = null;
  editingOwnProfile = false;

  ngOnInit(): void {
    const dni = this.route.snapshot.paramMap.get('dni');
    const usuarioState = history.state?.usuario;

    if (usuarioState) {
      this.setFormData(usuarioState);
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
      this.setFormData(userData);
      this.editMode = true;
    } else {
      alert('Usuario no encontrado.');
    }
  }

  setFormData(data: any) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    this.originalData = data;
    this.editingOwnProfile = currentUser?.email === data.email;

    this.form.setValue({
      dni: data.dni || '',
      email: data.email || '',
      nombreCompleto: data.nombreCompleto || '',
    });

    // Reaplicar restricciones de edición
    this.form.get('dni')?.disable(); // Nunca editable
    if (this.editingOwnProfile) {
      this.form.get('email')?.enable();
    } else {
      this.form.get('email')?.disable();
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

    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Actualizar email en Firebase Auth solo si lo está cambiando él mismo
    if (this.editingOwnProfile && data.email && currentUser && currentUser.email !== data.email) {
      try {
        await updateEmail(currentUser, data.email);
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          alert('Por seguridad, vuelve a iniciar sesión para actualizar el correo.');
        } else {
          console.error('Error al actualizar email en Auth:', error.code);
          alert('No se pudo actualizar el correo en autenticación.');
        }
        return;
      }
    }

    // Guardar en Firestore
    const userRef = doc(this.firestore, 'users', data.dni!);
    await setDoc(userRef, {
      dni: data.dni,
      email: this.editingOwnProfile ? data.email : this.originalData.email,
      nombreCompleto: data.nombreCompleto,
    });

    this.originalData = { ...data };
    this.editMode = true;
    alert('Usuario actualizado.');
  }

  isDataUnchanged(data: any): boolean {
    return (
      this.originalData &&
      data.email === this.originalData.email &&
      data.nombreCompleto === this.originalData.nombreCompleto
    );
  }

  goToHistorial() {
    const data = this.form.getRawValue();
    if (data.dni) {
      this.router.navigate(['/historial', data.dni], {
        state: { usuario: data },
      });
    }
  }

  verUsuarios() {
    this.router.navigate(['/usuarios']);
  }
}
