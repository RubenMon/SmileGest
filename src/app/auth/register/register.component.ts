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

  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  form = new FormGroup({
    nombreCompleto: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[\p{L}][\p{L}\p{M}\p{Zs}'-]{1,100}$/u)
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]+$')
    ]),
    dni: new FormControl('', [Validators.required])
  });

  async onSubmit() {
    const { dni, nombreCompleto } = this.form.value;

    if (!this.authService.validateDniLetter(dni!)) {
      this.showErrorPopup("El DNI introducido no es válido.");
      return;
    }

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

    if (!this.form.valid) {
      return;
    }

    try {
      await this.authService.register(this.form.value);
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.showErrorPopup(this.getErrorMessage(error.code));
    }
  }

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

  showErrorPopup(message: string) {
    const dialogRef = this.dialog.open(ErrorDialogComponent);
    dialogRef.componentInstance.message = message;
  }
}
