import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/user/auth.service';
import { Router } from '@angular/router';
import { CalendarComponent } from "../calendar/calendar.component";

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, CalendarComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

  authService = inject(AuthService);
  router = inject(Router);

  logout(){
    this.authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => console.log(error));
  }
}
