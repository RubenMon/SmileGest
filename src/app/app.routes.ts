import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',                 // Ruta raíz vacía (cuando el path es '/')
    redirectTo: 'inicio',     // Redirige automáticamente a la ruta 'inicio'
    pathMatch: 'full'         // Coincidencia exacta para redirección (solo si path es exactamente '')
  },
  {
    path: 'inicio',           // Ruta para la página de inicio
    canActivate: [authGuard], // Protegida por el guard, solo accesible si el usuario está autenticado
    loadComponent: () => import('./paginas/inicio/inicio.component').then(m => m.InicioComponent)
    // Carga perezosa (lazy loading) del componente InicioComponent
  },
  {
    path: 'register',         // Ruta para la página de registro de usuario
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
    // Carga perezosa del componente RegisterComponent, sin protección (accesible para todos)
  },
  {
    path: 'login',            // Ruta para la página de login
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    // Carga perezosa del componente LoginComponent, sin protección
  },
  {
    path: 'calendario',       // Ruta para la página de calendario
    canActivate: [authGuard], // Protegida, solo para usuarios autenticados
    loadComponent: () => import('./paginas/calendar/calendar.component').then(m => m.CalendarComponent),
  },
  {
    path: 'usuarios',         // Ruta para la lista de usuarios
    canActivate: [authGuard], // Protegida por autenticación
    loadComponent: () => import('./paginas/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'usuarios/:dni',    // Ruta para datos de un usuario específico, identificada por DNI en URL
    canActivate: [authGuard], // Protegida
    loadComponent: () => import('./paginas/usuarioDatos/usuarioDatos.component').then(m => m.UsuarioDatosComponent),
  },
  {
    path: 'historial/:dni',   // Ruta para mostrar historial de un usuario específico por DNI
    canActivate: [authGuard], // Protegida
    loadComponent: () => import('./paginas/historial-usuario/historial-usuario.component').then(m => m.HistorialUsuarioComponent),
  },
  {
    path: 'graficos-tipos',   // Ruta para mostrar gráficos categorizados por tipos
    canActivate: [authGuard], // Protegida
    loadComponent: () => import('./paginas/graficos-tipos/graficos-tipos.component').then(m => m.GraficosTiposComponent),
  }
];
