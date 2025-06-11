import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/user/auth.service';
import { Router } from '@angular/router';
import { Usuario } from '../../interfaces/usuario.interface';
import { ErrorDialogComponent } from '../../errores/error-dialog/error-dialog-component';
import { DniDialogComponent } from '../../dni-dialog/dni-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Inyección de servicios necesarios para autenticación, navegación y diálogos
  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  // Definición del formulario reactivo con validaciones requeridas
  form = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  /**
   * Ejecuta el login con email y contraseña si el formulario es válido.
   * Si la autenticación es exitosa, navega a la página de inicio.
   * En caso de error, muestra un popup con el mensaje adecuado.
   */
  onSubmit() {
    if (this.form.valid) {
      this.authService.login(this.form.value as Usuario)
        .then(() => {
          this.router.navigate(['/inicio']);
        })
        .catch(error => {
          this.showErrorPopup(this.getErrorMessage(error.code));
        });
    }
  }

  /**
   * Retorna un mensaje amigable basado en el código de error recibido.
   *
   * @param errorCode Código del error devuelto por Firebase Auth.
   * @returns Mensaje de error para mostrar al usuario.
   */
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No se encontró una cuenta con ese correo electrónico.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      default:
        return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    }
  }

  /**
   * Inicia sesión con Google.
   * Si el usuario es nuevo, abre un diálogo para recopilar DNI y nombre completo.
   * Valida el DNI y verifica que no esté registrado.
   * En caso de errores o datos inválidos, elimina el usuario y muestra un error.
   * Finalmente, navega a la página de inicio si el login fue exitoso.
   */
  async onClickGoogle() {
    try {
      const result = await this.authService.loginWithGoogleOnly();
      const user = result.user;
      const email = user.email!;
      const uid = user.uid;

      // Verificamos si el usuario ya está registrado en Firestore
      const exists = await this.authService.userExistsInFirestore(email);

      if (!exists) {
        // Abrimos diálogo para pedir DNI y nombre completo al usuario nuevo
        const dialogRef = this.dialog.open(DniDialogComponent);
        const result = await firstValueFrom(dialogRef.afterClosed());

        // Si el usuario cancela o no proporciona datos válidos
        if (!result || !result.dni || !result.nombreCompleto) {
          this.showErrorPopup('Datos inválidos o cancelados por el usuario.');
          // Eliminamos la cuenta creada en Firebase
          await user.delete();
          return;
        }

        const { dni, nombreCompleto } = result;

        // Validamos la letra del DNI
        if (!this.authService.validateDniLetter(dni)) {
          this.showErrorPopup('DNI inválido.');
          await user.delete();
          return;
        }

        // Verificamos que el DNI no esté registrado con otra cuenta
        const dniExists = await this.authService.dniExistsInFirestore(dni);
        if (dniExists) {
          this.showErrorPopup('Este DNI ya está registrado con otra cuenta.');
          await user.delete();
          return;
        }

        // Guardamos los datos del usuario en Firestore
        await this.authService.saveUserData(uid, email, dni, nombreCompleto);
      }

      // Redirigimos al usuario al inicio tras login exitoso
      this.router.navigate(['/inicio']);
    } catch (error) {
      this.showErrorPopup('Error al iniciar sesión con Google.');
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
