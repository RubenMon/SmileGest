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
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

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
  // Inyección de servicios Firestore, ruta activa y router para navegación
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // Formulario reactivo con controles para dni, email y nombre completo
  // dni y email empiezan deshabilitados, con validaciones respectivas
  form = new FormGroup({
    dni: new FormControl({ value: '', disabled: true }, Validators.required),
    email: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.email]),
    nombreCompleto: new FormControl('', Validators.required),
  });

  // Controla si el formulario está en modo edición
  editMode = false;
  // Guarda datos originales para comparación
  originalData: any = null;
  // Indica si el usuario edita su propio perfil
  editingOwnProfile = false;
  // Indica si el usuario actual es administrador
  isAdmin = false;

  /**
   * Al iniciar el componente:
   * - Obtiene el usuario autenticado.
   * - Determina si es administrador (email específico).
   * - Obtiene el parámetro 'dni' de la ruta y carga los datos si existe.
   */
  ngOnInit(): void {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Verificar si es administrador por correo
    if (currentUser?.email === 'administracionclinica@gmail.com') {
      this.isAdmin = true;
    }

    const id = this.route.snapshot.paramMap.get('dni')?.trim();
    console.log('ID recibido en UsuarioDatosComponent:', id);

    // Cargar usuario si el ID es válido
    if (id && id !== 'nuevo') {
      this.loadUser(id);
    } else {
      alert('ID no válido o no proporcionado.');
    }
  }

  /**
   * Carga el usuario desde Firestore usando su ID (dni).
   * Si se encuentra, establece los datos en el formulario.
   * Si no, muestra mensaje de error.
   */
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

  /**
   * Establece los datos del usuario en el formulario.
   * También detecta si el usuario actual está editando su propio perfil,
   * habilitando o deshabilitando el campo email según corresponda.
   */
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

    // dni siempre deshabilitado
    this.form.get('dni')?.disable();

    // Si no, deshabilita el email para evitar cambios
    this.form.get('email')?.disable();

  }

  /**
   * Guarda los cambios del usuario.
   * - Si no hay cambios, avisa y no hace nada.
   * - Si el usuario está editando su propio perfil y cambió el email,
   *   intenta actualizarlo en Firebase Auth.
   *   Si requiere reautenticación, pide contraseña y lo intenta.
   * - Guarda los datos en Firestore.
   */
  async saveUser() {
    if (this.form.invalid) return;

    const data = this.form.getRawValue();
    data.dni = this.originalData?.dni ?? data.dni;

    if (this.editMode && this.isDataUnchanged(data)) {
      alert('No hay cambios para guardar.');
      return;
    }

    try {
      // Guardar solo nombre completo y conservar email original
      const userRef = doc(this.firestore, 'users', this.originalData.id);
      await setDoc(userRef, {
        dni: data.dni,
        email: this.originalData.email,
        nombreCompleto: data.nombreCompleto,
      });

      this.originalData = { ...data, id: this.originalData.id, email: this.originalData.email };
      this.editMode = true;
      alert('Usuario actualizado.');
    } catch (error) {
      console.error('Error al guardar datos en Firestore:', error);
      alert('Ocurrió un error al guardar el usuario.');
    }
  }

  /**
   * Compara los datos actuales con los originales para detectar cambios.
   * @param data Datos actuales del formulario.
   * @returns true si no hay cambios, false si hay diferencias.
   */
  isDataUnchanged(data: any): boolean {
    return (
      this.originalData &&
      data.email === this.originalData.email &&
      data.nombreCompleto === this.originalData.nombreCompleto
    );
  }

  /**
   * Navega al historial clínico del usuario usando su dni.
   * Envía los datos del usuario por estado de navegación.
   */
  goToHistorial() {
    const data = this.form.getRawValue();
    if (data.dni) {
      console.log('Navegando al historial con DNI:', data.dni);
      this.router.navigate(['/historial', data.dni], {
        state: { usuario: data },
      });
    }
  }

  /**
   * Navega a la lista de usuarios.
   */
  verUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  /**
   * Navega al calendario principal.
   */
  volverAlCalendario() {
    this.router.navigate(['/calendario']);
  }
}
