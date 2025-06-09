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
  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  form = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

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

  async onClickGoogle() {
    try {
      const result = await this.authService.loginWithGoogleOnly();
      const user = result.user;
      const email = user.email!;
      const uid = user.uid;

      const exists = await this.authService.userExistsInFirestore(email);

      if (!exists) {
        const dialogRef = this.dialog.open(DniDialogComponent);
        const result = await firstValueFrom(dialogRef.afterClosed());

        if (!result || !result.dni || !result.nombreCompleto) {
          this.showErrorPopup('Datos inválidos o cancelados por el usuario.');
          await user.delete();
          return;
        }

        const { dni, nombreCompleto } = result;

        if (!this.authService.validateDniLetter(dni)) {
          this.showErrorPopup('DNI inválido.');
          await user.delete();
          return;
        }

        const dniExists = await this.authService.dniExistsInFirestore(dni);
        if (dniExists) {
          this.showErrorPopup('Este DNI ya está registrado con otra cuenta.');
          await user.delete();
          return;
        }

        // Aquí también guardamos el usuario usando DNI como id de doc
        await this.authService.saveUserData(uid, email, dni, nombreCompleto);
      }

      // Navegar tras login exitoso
      this.router.navigate(['/inicio']);
    } catch (error) {
      this.showErrorPopup('Error al iniciar sesión con Google.');
    }
  }

  showErrorPopup(message: string) {
    const dialogRef = this.dialog.open(ErrorDialogComponent);
    dialogRef.componentInstance.message = message;
  }
}
