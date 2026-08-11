import { Routes } from '@angular/router';

/**
 * ROUTES: /mantenimiento/*
 */

const mantenimientoRoutes: Routes = [
  {
    path: 'unidades',
    data: { breadcrumb: 'Unidades' },
    children: [
      {
        path: '',
        data: { breadcrumb: '' },
        loadComponent: () => import('./pages/unidades/unidades.page'),
      },
      {
        path: 'lista-unidades',
        data: { breadcrumb: 'Lista de unidades' },
        loadComponent: () =>
          import('./pages/lista-unidades/lista-unidades.page'),
      },
    ],
  },
];

export default mantenimientoRoutes;
