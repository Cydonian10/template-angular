import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inicio',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/drawer/sidebar.ng'),
    children: [
      {
        path: '',
        children: [
          {
            path: 'inicio',
            data: {
              breadcrumb: 'Inicio',
            },
            loadComponent: () => import('./features/inicio/inicio.page'),
          },
          {
            path: 'mantenimiento',
            data: {
              breadcrumb: 'Matenimiento',
            },
            loadChildren: () =>
              import('./features/mantenimiento/mantenimiento.routes'),
          },
        ],
      },
    ],
  },
];
