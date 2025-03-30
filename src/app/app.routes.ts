import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [

  {
    path: 'inicio',
    canActivate:[authGuard],
    loadComponent: () => import('./paginas/inicio/inicio.component').then(m => m.InicioComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  }
];
