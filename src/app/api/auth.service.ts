import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs';
import { skipToken } from '../core/interceptors/token.interceptor';
import { LocalStorageService } from '../core/services/local-storage.service';
import { REFRESH_TOKEN, TOKEN } from '../core/const/token.const';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  #urlSeguridad = environment.urlSeguridad;

  #http = inject(HttpClient);
  #locaStorageService = inject(LocalStorageService);

  profile() {
    const url = `${this.#urlSeguridad}/usuarios/profile`;
    return this.#http.get<{ data: any; msg: string }>(url);
  }

  refreshToken(refreshToken: string) {
    return this.#http
      .post<{
        data: { token: string; refreshToken: string };
        msg: string;
      }>(
        `${this.#urlSeguridad}/auth/refresh-token`,
        { refreshToken },
        { context: skipToken() },
      )
      .pipe(
        tap(({ data }) => {
          this.#locaStorageService.set(TOKEN, data.token);
          this.#locaStorageService.set(REFRESH_TOKEN, data.refreshToken);
        }),
      );
  }

  isValidToken(token: string) {
    const decodeToken = jwtDecode<JwtPayload>(token);
    if (decodeToken && decodeToken?.exp) {
      const tokenDate = new Date(0);
      tokenDate.setUTCSeconds(decodeToken.exp);
      const today = new Date();
      return tokenDate.getTime() > today.getTime();
    }
    return false;
  }
}
