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
      {
        path: ':unidadId',
        data: { breadcrumb: 'Áreas de la unidad' },
        loadComponent: () =>
          import('./pages/unidades-areas/unidades-areas.page'),
      },
    ],
  },
  {
    path: 'areas',
    data: { breadcrumb: 'Áreas' },
    loadComponent: () => import('./pages/areas/areas.page'),
  },
  {
    path: 'usuarios',
    data: { breadcrumb: 'Usuarios' },
    children: [
      {
        path: '',
        data: { breadcrumb: '' },
        loadComponent: () => import('./pages/usuarios/usuarios.page'),
      },
      {
        path: 'agregar',
        data: { breadcrumb: 'Agregar usuarios' },
        loadComponent: () => import('./pages/usuarios/agregar-usuarios.page'),
      },
    ],
  },
];

export default mantenimientoRoutes;
