import {
  OperationResult,
  OperationResultCreate,
} from './unidad.interface';

export interface Motivo {
  motivoId: number;
  nombre: string;
  descripcion: string | null;
  documentoRequerido: boolean;
}

export interface CrearMotivoDto {
  nombre: string;
  descripcion?: string | null;
  documentoRequerido?: boolean;
}

export interface ActualizarMotivoDto {
  nombre?: string;
  descripcion?: string | null;
  documentoRequerido?: boolean;
}

export type { OperationResult, OperationResultCreate };
