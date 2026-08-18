import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  ActualizarMarcaBiometricoDto,
  CrearMarcaBiometricoDto,
  MarcaBiometrico,
} from '../core/interfaces/biometrico.interface';
import { OperationResult } from '../core/interfaces/unidad.interface';

@Injectable({
  providedIn: 'root',
})
export class MarcaBiometricoService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listarMarcas(): Observable<MarcaBiometrico[]> {
    return this.#http.get<MarcaBiometrico[]>(`${this.#base}/marca-biometrico`);
  }

  crearMarca(dto: CrearMarcaBiometricoDto): Observable<OperationResult> {
    return this.#http.post<OperationResult>(
      `${this.#base}/marca-biometrico`,
      dto,
    );
  }

  actualizarMarca(
    id: number,
    dto: ActualizarMarcaBiometricoDto,
  ): Observable<OperationResult> {
    return this.#http.put<OperationResult>(
      `${this.#base}/marca-biometrico/${id}`,
      dto,
    );
  }

  eliminarMarca(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(
      `${this.#base}/marca-biometrico/${id}`,
    );
  }
}