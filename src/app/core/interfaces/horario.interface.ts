import { OperationResult, OperationResultCreate } from './unidad.interface';

export interface Dia {
  diaId: number;
  nombre: string;
  abreviatura: string;
  orden: number;
}

export interface Horario {
  horarioId: number;
  nombre: string;
  areaId: number;
  areaNombre: string | null;
  unidadId: number;
  extendido: boolean;
  rotativo: boolean;
  regular: boolean;
  horasLaborales: number;
}

export interface HorarioTurno {
  turnoId: number;
  horaInicio: string;
  horaFin: string;
  extendido: boolean;
  diaSalida: { diaId: number; diaNombre: string } | null;
}

export interface HorarioDiaDetalle {
  horarioDiaId: number;
  diaId: number;
  diaNombre: string;
  orden: number;
  vigencia: {
    vigenciaId: number;
    fechaInicio: string | null;
    fechaFin: string | null;
  } | null;
  turnos: HorarioTurno[];
}

export interface UsuarioHorario {
  horarioAsignacionId: number;
  usuarioId: number;
  syncUsuarioId: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface HorarioDetalle {
  horarioId: number;
  nombre: string;
  areaId: number;
  areaNombre: string | null;
  unidadId: number;
  extendido: boolean;
  rotativo: boolean;
  regular: boolean;
  horasLaborales: number;
  dias: HorarioDiaDetalle[];
  usuarios: UsuarioHorario[];
}

export interface TurnoInput {
  horaInicio: string;
  horaFin: string;
  extendido?: boolean;
}

export interface DiaInput {
  diaId: number;
  orden?: number;
  vigencia?: {
    fechaInicio: string;
    fechaFin?: string | null;
  };
  turnos: TurnoInput[];
}

export interface CrearHorarioDto {
  nombre: string;
  areaId: number;
  extendido?: boolean;
  rotativo?: boolean;
  regular?: boolean;
  horasLaborales?: number;
  dias: DiaInput[];
  usuarioIds?: number[];
  fechaInicio?: string;
  fechaFin?: string | null;
}

export interface ActualizarHorarioDto {
  nombre?: string;
  areaId?: number;
  extendido?: boolean;
  rotativo?: boolean;
  regular?: boolean;
  horasLaborales?: number;
}

export interface AsignarUsuariosDto {
  usuarioIds: number[];
  fechaInicio: string;
  fechaFin?: string | null;
}

export type { OperationResult, OperationResultCreate };
