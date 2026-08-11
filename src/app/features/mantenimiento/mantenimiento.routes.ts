import { Routes } from '@angular/router';

/**
 * ROUTES: /mantenimiento/*
 */

const mantenimientoRoutes: Routes = [
  {
    path: 'unidades',
    data: { breadcrumb: 'Unidades' },
    loadComponent: () => import('./pages/unidades/unidades.page'),
  },
];

export default mantenimientoRoutes;
