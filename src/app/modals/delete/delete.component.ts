import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.scss'
})
export class DeleteComponent {
  // Inyectamos la referencia del diálogo para poder cerrarlo
  private dialogRef = inject(MatDialogRef);

  /**
   * Método que se llama al pulsar "No" o cancelar.
   * Cierra el diálogo sin devolver datos.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
