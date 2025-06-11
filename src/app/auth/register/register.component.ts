import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/user/auth.service';
import { Router } from '@angular/router';
import { ErrorDialogComponent } from '../../errores/error-dialog/error-dialog-component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, CommonModule, MatDialogModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  // Inyectamos los servicios necesarios para autenticación, navegación y diálogos
  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  // Definimos el formulario reactivo con sus controles y validaciones
  form = new FormGroup({
    nombreCompleto: new FormControl('', [
      Validators.required,
      // Validación con regex para que solo acepte letras, espacios, apostrofes y guiones, max 100 caracteres
      Validators.pattern(/^[\p{L}][\p{L}\p{M}\p{Zs}'-]{1,100}$/u)
    ]),
    email: new FormControl('', [Validators.required, Validators.email]), // Email válido y requerido
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      // Patrón para que contenga al menos una minúscula, una mayúscula y un número
      Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]+$')
    ]),
     // DNI requerido (validación especial luego)
    dni: new FormControl('', [Validators.required])
  });

  /**
   * Método para procesar el registro al enviar el formulario.
   * Valida el DNI, comprueba que no exista, valida formulario,
   * y llama al servicio de registro. En caso de errores muestra popup.
   */
  async onSubmit() {
    // Desestructuramos los valores del formulario
    const { dni, nombreCompleto, email, password } = this.form.value;

    // Validamos la letra del DNI usando el método del servicio
    if (!this.authService.validateDniLetter(dni!)) {
      this.showErrorPopup("El DNI introducido no es válido.");
      return;
    }

    // Comprobamos si el DNI ya está registrado en Firestore
    let exists: boolean;
    try {
      exists = await this.authService.dniExistsInFirestore(dni!);
    } catch (err) {
      console.error("fallo dniExistsInFirestore:", err);
      this.showErrorPopup("Ocurrió un error al verificar el DNI.");
      return;
    }

    if (exists) {
      this.showErrorPopup("Este DNI ya está registrado con otra cuenta.");
      return;
    }

    // Validamos que el formulario en general sea válido
    if (!this.form.valid) {
      return;
    }

    try {
      // Registramos el usuario pasando los campos explícitamente para evitar errores de tipo
      await this.authService.register({
        nombreCompleto: nombreCompleto!,
        email: email!,
        password: password!,
        dni: dni!
      });
      // Si el registro fue exitoso, navegamos al login para iniciar sesión
      this.router.navigate(['/login']);
    } catch (error: any) {
      // Si hubo error, mostramos mensaje basado en el código de error
      this.showErrorPopup(this.getErrorMessage(error.code));
    }
  }

  /**
   * Retorna un mensaje amigable basado en el código de error recibido.
   *
   * @param errorCode Código de error devuelto por Firebase.
   * @returns Mensaje para mostrar al usuario.
   */
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'El correo ya está registrado.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil.';
      default:
        return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    }
  }

  /**
   * Muestra un diálogo emergente con el mensaje de error indicado.
   *
   * @param message Mensaje que se mostrará en el diálogo.
   */
  showErrorPopup(message: string) {
    const dialogRef = this.dialog.open(ErrorDialogComponent);
    // Pasamos el mensaje al diálogo
    dialogRef.componentInstance.message = message;
  }
}
