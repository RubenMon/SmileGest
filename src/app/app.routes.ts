import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
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
  },
  {
  path: 'usuarios',
  loadComponent: () => import('./paginas/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'usuarios/:dni',
    loadComponent: () => import('./paginas/usuarioDatos/usuarioDatos.component').then(m => m.UsuarioDatosComponent)
  }


];
