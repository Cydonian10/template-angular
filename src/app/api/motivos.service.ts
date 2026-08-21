import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ActualizarMotivoDto,
  CrearMotivoDto,
  Motivo,
} from '../core/interfaces/motivo.interface';
import {
  OperationResult,
  OperationResultCreate,
} from '../core/interfaces/unidad.interface';

@Injectable({ providedIn: 'root' })
export class MotivosService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(): Observable<Motivo[]> {
    return this.#http.get<Motivo[]>(`${this.#base}/motivos/`);
  }

  obtener(id: number): Observable<Motivo> {
    return this.#http.get<Motivo>(`${this.#base}/motivos/${id}`);
  }

  crear(dto: CrearMotivoDto): Observable<OperationResultCreate> {
    return this.#http.post<OperationResultCreate>(`${this.#base}/motivos/`, dto);
  }

  actualizar(
    id: number,
    dto: ActualizarMotivoDto,
  ): Observable<OperationResult> {
    return this.#http.put<OperationResult>(`${this.#base}/motivos/${id}`, dto);
  }

  eliminar(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/motivos/${id}`);
  }
}
