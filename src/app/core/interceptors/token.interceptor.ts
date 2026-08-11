import {
  HttpContext,
  HttpContextToken,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';
import { environment } from '../../../environments/environment.development';
import { REFRESH_TOKEN, TOKEN } from '../const/token.const';
import { AuthService } from '../../api/auth.service';

const CHECK_TOKEN = new HttpContextToken<boolean>(() => true);

export function skipToken() {
  return new HttpContext().set(CHECK_TOKEN, false);
}

export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const localStorageService = inject(LocalStorageService);
  const authSrv = inject(AuthService);
  // 🚀 Si requireAuth es false, permite todas las solicitudes sin autenticación.
  if (!environment.requireAuth) {
    console.warn(
      '⚠️ Modo desarrollo activado, el interceptor no aplicará tokens.',
    );
    return next(req);
  }

  const refreshToken = localStorageService.get<string>(REFRESH_TOKEN);
  const accessToken = localStorageService.get<string>(TOKEN);

  if (req.context.get(CHECK_TOKEN)) {
    if (!authSrv.isValidToken(accessToken!)) {
      return addToken(req, next, accessToken);
    } else {
      return updateAccessTokenAndRefreshToken(
        req,
        next,
        refreshToken,
        authSrv.isValidToken(refreshToken!),
      );
    }
  }
  return next(req);
};

const addToken = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  accessToken: string | null,
) => {
  if (accessToken) {
    const authRequest = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${accessToken}`),
      withCredentials: true,
    });
    return next(authRequest);
  }
  return next(request);
};

const updateAccessTokenAndRefreshToken = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  refreshToken: string | null,
  isValidRefreshToken?: boolean,
) => {
  const authService = inject(AuthService);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  if (refreshToken && isValidRefreshToken) {
    return authService.refreshToken(refreshToken).pipe(
      switchMap(() => {
        return addToken(request, next, refreshToken);
      }),
      catchError((error) => {
        localStorageService.clear();
        router.navigate(['/unauthorized']);
        return EMPTY;
      }),
    );
  } else {
    localStorageService.clear();
    router.navigate(['/unauthorized']);
    return EMPTY;
  }
};
