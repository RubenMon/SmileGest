import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-error-dialog-component',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './error-dialog-component.html',
  styleUrl: './error-dialog-component.css'
})
export class ErrorDialogComponent {
  message: string = '';
}
