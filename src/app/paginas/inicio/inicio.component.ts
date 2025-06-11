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
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {

  // Inyección del servicio de autenticación para manejar login/logout
  authService = inject(AuthService);

  // Inyección del Router para navegación entre rutas
  router = inject(Router);

  /**
   * Método para cerrar sesión.
   * Llama al método logout del servicio AuthService y navega a la pantalla de login
   * si la operación es exitosa. En caso de error, lo muestra por consola.
   */
  logout(){
    this.authService.logout()
      .then(() => {
        // Redirige a la página de login después de cerrar sesión
        this.router.navigate(['/login']);
      })
      .catch(error => console.log(error));
  }
}
