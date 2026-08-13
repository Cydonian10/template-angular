import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  AsignarUsuariosDto,
  OperationResult,
  SyncUsuario,
  Usuario,
} from '../core/interfaces/usuario.interface';

export interface UsuariosFiltro {
  activo?: boolean;
  tipo?: string;
  busqueda?: string;
  areaId?: number;
  unidadId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(filtro: UsuariosFiltro = {}): Observable<Usuario[]> {
    let params = new HttpParams();
    if (filtro.activo !== undefined) {
      params = params.set('activo', filtro.activo);
    }
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.busqueda) params = params.set('busqueda', filtro.busqueda);
    if (filtro.areaId !== undefined) {
      params = params.set('areaId', filtro.areaId);
    }
    if (filtro.unidadId !== undefined) {
      params = params.set('unidadId', filtro.unidadId);
    }
    return this.#http.get<Usuario[]>(`${this.#base}/usuarios`, { params });
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.#http.get<Usuario>(`${this.#base}/usuarios/${id}`);
  }

  listarSync(): Observable<SyncUsuario[]> {
    return this.#http.get<SyncUsuario[]>(
      `${this.#base}/usuarios/sync-usuarios`,
    );
  }

  asignarUsuarios(
    areaId: number,
    dto: AsignarUsuariosDto,
  ): Observable<OperationResult> {
    return this.#http.post<OperationResult>(
      `${this.#base}/areas/${areaId}/usuarios-batch`,
      dto,
    );
  }
}
