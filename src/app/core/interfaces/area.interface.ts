import { OperationResult } from './unidad.interface';

export interface Area {
  areaId: number;
  unidadId: number;
  unidadNombre?: string | null;
  nombre: string;
  descripcion: string | null;
}

export interface CrearAreaDto {
  nombre: string;
  descripcion?: string;
  unidadId: number;
}

export interface ActualizarAreaDto {
  nombre?: string;
  descripcion?: string;
}

export interface OperationResultCreate extends OperationResult {
  Id: number | null;
}

export type { OperationResult };
