import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ActualizarTurnoModificadoDto,
  CrearTurnoModificadoDto,
  OperationResult,
  OperationResultCreate,
  TurnoModificado,
  TurnoModificadoFiltro,
} from '../core/interfaces/turno-modificado.interface';

@Injectable({ providedIn: 'root' })
export class TurnoModificadoService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(turnoId: number, filtro: TurnoModificadoFiltro = {}): Observable<TurnoModificado[]> {
    let params = new HttpParams();
    if (filtro.fechaDesde) params = params.set('fechaDesde', filtro.fechaDesde);
    if (filtro.fechaHasta) params = params.set('fechaHasta', filtro.fechaHasta);
    if (filtro.usuarioId !== undefined) params = params.set('usuarioId', filtro.usuarioId);
    return this.#http.get<TurnoModificado[]>(`${this.#base}/turno/${turnoId}/modificar`, { params });
  }

  obtener(turnoId: number, id: number): Observable<TurnoModificado> {
    return this.#http.get<TurnoModificado>(`${this.#base}/turno/${turnoId}/modificar/${id}`);
  }

  crear(turnoId: number, dto: CrearTurnoModificadoDto): Observable<OperationResultCreate> {
    return this.#http.post<OperationResultCreate>(`${this.#base}/turno/${turnoId}/modificar`, dto);
  }

  actualizar(turnoId: number, id: number, dto: ActualizarTurnoModificadoDto): Observable<OperationResult> {
    return this.#http.put<OperationResult>(`${this.#base}/turno/${turnoId}/modificar/${id}`, dto);
  }

  eliminar(turnoId: number, id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/turno/${turnoId}/modificar/${id}`);
  }
}
