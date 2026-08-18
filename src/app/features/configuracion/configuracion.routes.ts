import { Routes } from '@angular/router';

/**
 * ROUTES: /configuracion/*
 */

const configuracionRoutes: Routes = [
  {
    path: 'biometricos',
    data: { breadcrumb: 'Biométricos' },
    loadComponent: () => import('./pages/biometricos/biometricos.page'),
  },
  {
    path: 'horarios',
    data: { breadcrumb: 'Horarios' },
    children: [
      {
        path: '',
        data: { breadcrumb: '' },
        loadComponent: () => import('./pages/horarios/horarios.page'),
      },
      {
        path: 'nuevo',
        data: { breadcrumb: 'Nuevo horario' },
        loadComponent: () => import('./pages/horarios/horario-form.page'),
      },
      {
        path: ':id/editar',
        data: { breadcrumb: 'Editar horario' },
        loadComponent: () => import('./pages/horarios/horario-form.page'),
      },
      {
        path: ':id',
        data: { breadcrumb: 'Detalle de horario' },
        loadComponent: () => import('./pages/horarios/horario-detalle.page'),
      },
    ],
  },
  {
    path: 'asignacion-horario/:usuarioId',
    data: { breadcrumb: 'Asignar horario' },
    loadComponent: () =>
      import('./pages/asignacion-horario/asignar-horario.page'),
  },
  {
    path: 'asignacion-horario',
    data: { breadcrumb: 'Asignación de horarios' },
    loadComponent: () =>
      import('./pages/asignacion-horario/asignacion-horario.page'),
  },
];

export default configuracionRoutes;
