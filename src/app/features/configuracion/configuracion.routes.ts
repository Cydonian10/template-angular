import { Routes } from '@angular/router';

/**
 * ROUTES: /configuracion/*
 */

const configuracionRoutes: Routes = [
  {
    path: 'horario-2',
    data: { breadcrumb: 'Horarios' },
    children: [
      {
        path: '',
        data: { breadcrumb: '' },
        loadComponent: () => import('./pages/horarios/horarios.page'),
      },
      {
        path: ':id',
        data: { breadcrumb: 'Detalle de horario' },
        loadComponent: () =>
          import('./pages/horarios/horario-detalle.page'),
      },
    ],
  },
];

export default configuracionRoutes;
