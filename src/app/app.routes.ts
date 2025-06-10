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
    path: 'calendario',
    canActivate: [authGuard],
    loadComponent: () => import('./paginas/calendar/calendar.component').then(m => m.CalendarComponent),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () => import('./paginas/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'usuarios/:dni',
    canActivate: [authGuard],
    loadComponent: () => import('./paginas/usuarioDatos/usuarioDatos.component').then(m => m.UsuarioDatosComponent),
  },
  {
    path: 'historial/:dni',
    canActivate: [authGuard],
    loadComponent: () => import('./paginas/historial-usuario/historial-usuario.component').then(m => m.HistorialUsuarioComponent),
  },
  {
    path: 'graficos-tipos',
    canActivate: [authGuard],
    loadComponent: () => import('./paginas/graficos-tipos/graficos-tipos.component').then(m => m.GraficosTiposComponent),
  }
];
