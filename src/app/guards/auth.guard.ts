import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/user/auth.service';
import { inject } from '@angular/core';

/**
 * Guard para rutas que protege el acceso a ciertas páginas
 * verificando si el usuario está autenticado.
 *
 * @param route Información de la ruta a la que se intenta acceder
 * @param state Estado de la navegación
 * @returns true si el usuario está autenticado y puede acceder,
 *          false si no y redirecciona a login
 */
export const authGuard: CanActivateFn = async (route, state) => {
  // Inyectamos el servicio de autenticación para comprobar el estado
  const authService = inject(AuthService);
  // Inyectamos el router para redireccionar si es necesario
  const router = inject(Router);

  // Esperamos el resultado de la comprobación de autenticación
  const isAuthenticated = await authService.isAuthenticated();

  if (isAuthenticated) {
    // Si el usuario está autenticado, permitimos el acceso a la ruta
    return true;
  } else {
    // Si no está autenticado, redireccionamos a la página de login
    router.navigate(['/login']);
    // Y bloqueamos el acceso a la ruta protegida
    return false;
  }
};
