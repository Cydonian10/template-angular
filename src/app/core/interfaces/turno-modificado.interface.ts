import { OperationResult, OperationResultCreate } from './unidad.interface';

export interface TurnoModificado {
  turnoModificadoId: number;
  turnoId: number;
  usuarioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string | null;
}

export interface CrearTurnoModificadoDto {
  usuarioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string | null;
}

export interface ActualizarTurnoModificadoDto {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  motivo?: string | null;
}

export interface TurnoModificadoFiltro {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number;
}

export type { OperationResult, OperationResultCreate };
