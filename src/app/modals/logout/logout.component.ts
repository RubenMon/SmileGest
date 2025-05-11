import { Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent {
  private dialogRef = inject(MatDialogRef);

  onNoClick(): void {
    this.dialogRef.close();
  }
}

