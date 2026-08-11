import { Routes } from '@angular/router';

/**
 * ROUTES: /scap/mantenimiento/estado-asistencia/*
 */

const mantenimientoRoutes: Routes = [
  {
    // path: '',
    // loadComponent: () =>
    //   import('./layout/estado-asistencia-layout/estado-asistencia-layout.component'),
    // children: [
    //   {
    path: 'unidades',
    loadComponent: () => import('./pages/unidades/unidades.page'),
    //   },
    // ],
  },
];

export default mantenimientoRoutes;
