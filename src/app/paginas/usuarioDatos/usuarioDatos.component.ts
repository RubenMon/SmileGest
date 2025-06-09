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
  isAdmin = false;

  ngOnInit(): void {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser?.email === 'administracionclinica@gmail.com') {
      this.isAdmin = true;
    }

    const id = this.route.snapshot.paramMap.get('dni')?.trim();
    console.log('ID recibido en UsuarioDatosComponent:', id);

    if (id && id !== 'nuevo') {
      this.loadUser(id);
    } else {
      alert('ID no válido o no proporcionado.');
    }
  }

  async loadUser(id: string) {
    try {
      const docRef = doc(this.firestore, 'users', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log('Datos cargados desde Firestore:', userData);
        this.setFormData(userData, id);
        this.editMode = true;
      } else {
        console.warn('Usuario no encontrado con ID:', id);
        alert('Usuario no encontrado en Firestore.');
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      alert('Error al acceder a Firestore.');
    }
  }

  setFormData(data: any, id: string) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    this.originalData = { ...data, id };
    this.editingOwnProfile = currentUser?.email === data.email;

    this.form.setValue({
      dni: data.dni || '',
      email: data.email || '',
      nombreCompleto: data.nombreCompleto || '',
    });

    this.form.get('dni')?.disable();
    this.form.get('email')?.setValue(data.email || '');

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

    try {
      const userRef = doc(this.firestore, 'users', this.originalData.id);
      await setDoc(userRef, {
        dni: data.dni,
        email: this.editingOwnProfile ? data.email : this.originalData.email,
        nombreCompleto: data.nombreCompleto,
      });

      this.originalData = { ...data, id: this.originalData.id };
      this.editMode = true;
      alert('Usuario actualizado.');
    } catch (error) {
      console.error('Error al guardar datos en Firestore:', error);
      alert('Ocurrió un error al guardar el usuario.');
    }
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

  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
