import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dni-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './dni-dialog.component.html',
  styleUrl: './dni-dialog.component.css',
})
export class DniDialogComponent {
  // Variables para almacenar los valores introducidos en el formulario
  dni: string = '';
  nombreCompleto: string = '';

  // Inyectamos la referencia del diálogo para poder cerrarlo y enviar datos
  constructor(public dialogRef: MatDialogRef<DniDialogComponent>) {}

  /**
   * Método que se llama al pulsar el botón aceptar.
   * Cierra el diálogo y envía un objeto con el DNI y el nombre completo.
   */
  aceptar() {
    this.dialogRef.close({ dni: this.dni, nombreCompleto: this.nombreCompleto });
  }

  /**
   * Método que se llama al pulsar el botón cancelar.
   * Cierra el diálogo enviando null para indicar que no se enviaron datos.
   */
  cancelar() {
    this.dialogRef.close(null);
  }
}
