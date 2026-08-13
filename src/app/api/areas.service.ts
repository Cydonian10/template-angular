import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  ActualizarAreaDto,
  Area,
  CrearAreaDto,
  OperationResult,
} from '../core/interfaces/area.interface';

@Injectable({
  providedIn: 'root',
})
export class AreasService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(
    unidadId?: number,
    busqueda?: string,
    tipo?: string,
  ): Observable<Area[]> {
    let params = new HttpParams();
    if (unidadId !== undefined) params = params.set('unidadId', unidadId);
    if (busqueda) params = params.set('busqueda', busqueda);
    if (tipo) params = params.set('tipo', tipo);
    return this.#http.get<Area[]>(`${this.#base}/areas`, { params });
  }

  crear(dto: CrearAreaDto): Observable<OperationResult> {
    return this.#http.post<OperationResult>(`${this.#base}/areas`, dto);
  }

  actualizar(id: number, dto: ActualizarAreaDto): Observable<OperationResult> {
    return this.#http.patch<OperationResult>(`${this.#base}/areas/${id}`, dto);
  }

  eliminar(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/areas/${id}`);
  }
}
