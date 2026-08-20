import { Routes } from '@angular/router';

const seguimientoRoutes: Routes = [
  {
    path: 'turno-modificado',
    data: { breadcrumb: 'Turno modificado' },
    loadComponent: () => import('./pages/turno-modificado/turno-modificado.page'),
  },
];

export default seguimientoRoutes;
