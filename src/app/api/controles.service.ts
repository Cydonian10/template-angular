import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  ActualizarControlDto,
  AsignarControlAreaDto,
  AsignarControlUnidadDto,
  AsignarControlUsuarioDto,
  Control,
  CrearControlDto,
  DesasignarControlAreaDto,
  DesasignarControlUnidadDto,
  DesasignarControlUsuarioDto,
} from '../core/interfaces/control.interface';
import { OperationResult } from '../core/interfaces/unidad.interface';

@Injectable({
  providedIn: 'root',
})
export class ControlesService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listarControles(): Observable<Control[]> {
    return this.#http.get<Control[]>(`${this.#base}/controles/`);
  }

  crearControl(dto: CrearControlDto): Observable<OperationResult> {
    return this.#http.post<OperationResult>(`${this.#base}/controles/`, dto);
  }

  actualizarControl(
    id: number,
    dto: ActualizarControlDto,
  ): Observable<OperationResult> {
    return this.#http.put<OperationResult>(
      `${this.#base}/controles/${id}`,
      dto,
    );
  }

  eliminarControl(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/controles/${id}`);
  }

  asignarArea(
    id: number,
    dto: AsignarControlAreaDto,
  ): Observable<Control> {
    return this.#http.post<Control>(`${this.#base}/controles/${id}/area`, dto);
  }

  asignarUnidad(
    id: number,
    dto: AsignarControlUnidadDto,
  ): Observable<Control> {
    return this.#http.post<Control>(
      `${this.#base}/controles/${id}/unidad`,
      dto,
    );
  }

  asignarUsuario(
    id: number,
    dto: AsignarControlUsuarioDto,
  ): Observable<Control> {
    return this.#http.post<Control>(
      `${this.#base}/controles/${id}/usuario`,
      dto,
    );
  }

  desasignarArea(
    id: number,
    dto: DesasignarControlAreaDto,
  ): Observable<Control> {
    return this.#http.delete<Control>(`${this.#base}/controles/${id}/area`, {
      body: dto,
    });
  }

  desasignarUnidad(
    id: number,
    dto: DesasignarControlUnidadDto,
  ): Observable<Control> {
    return this.#http.delete<Control>(`${this.#base}/controles/${id}/unidad`, {
      body: dto,
    });
  }

  desasignarUsuario(
    id: number,
    dto: DesasignarControlUsuarioDto,
  ): Observable<Control> {
    return this.#http.delete<Control>(`${this.#base}/controles/${id}/usuario`, {
      body: dto,
    });
  }
}
