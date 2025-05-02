// src/app/dni-dialog/dni-dialog.component.ts
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
  dni: string = '';
  nombreCompleto: string = '';

  constructor(public dialogRef: MatDialogRef<DniDialogComponent>) {}

  aceptar() {
    this.dialogRef.close({ dni: this.dni, nombreCompleto: this.nombreCompleto });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
