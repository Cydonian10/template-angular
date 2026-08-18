import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  ActualizarBiometricoDto,
  Biometrico,
  CrearBiometricoDto,
} from '../core/interfaces/biometrico.interface';
import { OperationResult } from '../core/interfaces/unidad.interface';

@Injectable({
  providedIn: 'root',
})
export class BiometricosService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listarBiometricos(): Observable<Biometrico[]> {
    return this.#http.get<Biometrico[]>(`${this.#base}/biometrico`);
  }

  crearBiometrico(dto: CrearBiometricoDto): Observable<OperationResult> {
    return this.#http.post<OperationResult>(`${this.#base}/biometrico`, dto);
  }

  actualizarBiometrico(
    id: number,
    dto: ActualizarBiometricoDto,
  ): Observable<OperationResult> {
    return this.#http.put<OperationResult>(
      `${this.#base}/biometrico/${id}`,
      dto,
    );
  }

  eliminarBiometrico(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(
      `${this.#base}/biometrico/${id}`,
    );
  }
}