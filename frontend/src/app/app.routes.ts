import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Redirección automática de la raíz '/' hacia la página de login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // 2. Definición de páginas
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'maestro',
    loadComponent: () => import('./pages/maestro/maestro.page').then(m => m.MaestroPage)
  },
  {
    path: 'alumno',
    loadComponent: () => import('./pages/alumno/alumno.page').then(m => m.AlumnoPage)
  },
  {
    path: 'juego',
    loadComponent: () => import('./pages/juego/juego.page').then(m => m.JuegoPage)
  },

  // 3. Captura de rutas no encontradas
  {
    path: '**',
    redirectTo: 'login'
  }
];