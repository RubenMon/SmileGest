import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

  authService = inject(AuthService);
  router = inject(Router);

  logout(){
    this.authService.logout()
    .then(resp =>{
      this.router.navigate(['/login']);
    })
    .catch(error => console.log(error))
  }
}
