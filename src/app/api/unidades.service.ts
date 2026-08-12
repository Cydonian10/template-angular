import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  ActualizarUnidadDto,
  MigrarDto,
  OperationResult,
  SyncUnidad,
  Unidad,
} from '../core/interfaces/unidad.interface';

@Injectable({
  providedIn: 'root',
})
export class UnidadesService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(busqueda?: string): Observable<Unidad[]> {
    const params = busqueda ? { busqueda } : undefined;
    return this.#http.get<Unidad[]>(`${this.#base}/unidades`, { params });
  }

  sync(): Observable<SyncUnidad[]> {
    return this.#http.get<SyncUnidad[]>(`${this.#base}/unidades/sync-unidades`);
  }

  actualizar(id: number, dto: ActualizarUnidadDto): Observable<OperationResult> {
    return this.#http.patch<OperationResult>(
      `${this.#base}/unidades/${id}`,
      dto,
    );
  }

  eliminar(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/unidades/${id}`);
  }

  migrar(dto: MigrarDto = {}): Observable<OperationResult> {
    return this.#http.post<OperationResult>(`${this.#base}/unidades/migrar`, dto);
  }
}