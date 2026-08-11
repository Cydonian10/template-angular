import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { of } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';
import { AuthStore, PerfilUsuario } from '../store/auth.store';
import { environment } from '../../../environments/environment.development';
import { USUARIO_AUTH } from '../const/auth.const';
import { LocalStorageService } from '../services/local-storage.service';
import { REFRESH_TOKEN, TOKEN } from '../const/token.const';
import { AuthService } from '../../api/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  // const usuarioSrv = inject(UsuarioService);
  // const authService = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const localStoreService = inject(LocalStorageService);
  const authService = inject(AuthService);
  // const tokenSrv = inject(TokenService);
  let unidad: string | null = null;
  let sistema: string | null = null;

  const usuarioPrueba: PerfilUsuario = {
    usuario: 'Admer Gabriel',
    id: 1,
    email: 'avasquezu@gmail.com',
    apellidoPaterno: 'vasquez',
    apellidoMaterno: 'uscuvilca',
    usuarioColegioNodeId: 0,
    fechaInicioSession: new Date('12-09-1997'),
    fechaCierreSession: new Date('12-09-1997'),
    sessionActiva: false,
    cambioPassword: false,
    vecesIncioSession: 0,
    password: '',
    unidades: [],
    roles: [],
    tipoUsuario: {
      id: 0,
      nombre: '',
    },
    idsPersona: [],
  };

  // 🚀 Si `requireAuth: false`, permite el acceso y carga un usuario de prueba
  if (!environment.requireAuth) {
    console.warn('⚠️ Modo desarrollo activado: Se usará un usuario de prueba.');
    authStore.setUserAuth(usuarioPrueba);
    localStoreService.set(USUARIO_AUTH, JSON.stringify(usuarioPrueba));

    return of(true); // 🚀 Permite el acceso directamente
  }

  // Obtener el token desde los query params
  let token: string | null = null;
  let refreshToken: string | null = null;

  token = route.queryParams['token'];
  refreshToken = route.queryParams['refreshToken'];
  unidad = route.queryParams['unidad'];
  sistema = route.queryParams['sistema'];

  if (token && refreshToken) {
    // Si el token viene de los query params, lo guardamos en localStorage
    // tokenSrv.saveToken(token);
    // tokenSrv.saveRefreshToken(refreshToken);
    localStoreService.set(TOKEN, token);
    localStoreService.set(REFRESH_TOKEN, refreshToken);
    // Escuchar cuando la navegación ha finalizado
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Eliminar el token de los query params sin modificar las otras rutas o parámetros
        const url = new URL(window.location.href);
        url.searchParams.delete('token'); // Eliminar solo el token de los query params
        url.searchParams.delete('refreshToken');

        // Reemplazar la URL con la nueva, sin el token pero manteniendo la ruta y otros parámetros
        window.history.replaceState({}, document.title, url.toString());
      });
  } else {
    // Si no hay token en los query params, lo buscamos en localStorage

    token = localStoreService.get(TOKEN);
    refreshToken = localStoreService.get(REFRESH_TOKEN);
  }

  if (!token) {
    router.navigate(['/unauthorized']);
    return of(false);
  }

  return authService.profile().pipe(
    map(({ data }) => {
      if (data) {
        if (!data.sessionActiva) {
          localStoreService.remove(TOKEN);
          localStoreService.remove(REFRESH_TOKEN);
          router.navigate(['/unauthorized']);
          return false;
        }
        localStoreService.set(USUARIO_AUTH, JSON.stringify(data));
        authStore.setUserAuth(data);
        return true;
      }
      localStoreService.remove(USUARIO_AUTH);
      router.navigate(['/unauthorized']);
      return false;
    }),
    catchError((error) => {
      router.navigate(['/unauthorized']);
      return of(false);
    }),
  );
};
