import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import {
  ActualizarHorarioDto,
  AsignarUsuariosDto,
  CrearHorarioDto,
  Dia,
  Horario,
  HorarioDetalle,
  HorarioMovimientos,
  OperationResult,
  OperationResultCreate,
  TurnoDiaConectado,
  UsuarioHorario,
} from '../core/interfaces/horario.interface';

@Injectable({
  providedIn: 'root',
})
export class HorariosService {
  #http = inject(HttpClient);
  #base = environment.urlScap;

  listar(areaId?: number, busqueda?: string): Observable<Horario[]> {
    let params = new HttpParams();
    if (areaId !== undefined) params = params.set('areaId', areaId);
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.#http.get<Horario[]>(`${this.#base}/horarios`, { params });
  }

  obtenerPorId(id: number): Observable<HorarioDetalle> {
    return this.#http.get<HorarioDetalle>(`${this.#base}/horarios/${id}`);
  }

  obtenerMovimientos(id: number): Observable<HorarioMovimientos> {
    return this.#http.get<HorarioMovimientos>(
      `${this.#base}/horarios/${id}/movimientos`,
    );
  }

  crear(dto: CrearHorarioDto): Observable<OperationResultCreate> {
    return this.#http.post<OperationResultCreate>(
      `${this.#base}/horarios`,
      dto,
    );
  }

  actualizar(
    id: number,
    dto: ActualizarHorarioDto,
  ): Observable<OperationResult> {
    return this.#http.patch<OperationResult>(
      `${this.#base}/horarios/${id}`,
      dto,
    );
  }

  eliminar(id: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(`${this.#base}/horarios/${id}`);
  }

  listarDias(): Observable<Dia[]> {
    return this.#http.get<Dia[]>(`${this.#base}/dias`);
  }

  listarUsuarios(id: number): Observable<UsuarioHorario[]> {
    return this.#http.get<UsuarioHorario[]>(
      `${this.#base}/horarios/${id}/usuarios`,
    );
  }

  getTurnoDiaConectado(turnoId: number): Observable<TurnoDiaConectado[]> {
    return this.#http.get<TurnoDiaConectado[]>(
      `${this.#base}/turnos/${turnoId}/dia-conectado`,
    );
  }

  crearDiaConectado(
    turnoId: number,
    diaId: number,
  ): Observable<OperationResultCreate> {
    return this.#http.post<OperationResultCreate>(
      `${this.#base}/turnos/${turnoId}/dia-conectado`,
      { diaId },
    );
  }

  eliminarDiaConectado(
    turnoId: number,
    salidaTurnoDiaId: number,
  ): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(
      `${this.#base}/turnos/${turnoId}/dia-conectado/${salidaTurnoDiaId}`,
    );
  }

  asignarUsuarios(
    id: number,
    dto: AsignarUsuariosDto,
  ): Observable<OperationResult> {
    return this.#http.post<OperationResult>(
      `${this.#base}/horarios/${id}/usuarios-batch`,
      dto,
    );
  }

  desasignarUsuario(id: number, usuarioId: number): Observable<OperationResult> {
    return this.#http.delete<OperationResult>(
      `${this.#base}/horarios/${id}/usuarios/${usuarioId}`,
    );
  }
}
