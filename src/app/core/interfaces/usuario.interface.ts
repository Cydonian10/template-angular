import { OperationResult } from './unidad.interface';

export interface Usuario {
  usuarioId: number;
  syncUsuarioId: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  dni: string | null;
  tipo: string | null;
  activo: boolean;
  areaId: number;
  areaNombre: string | null;
  unidadId: number;
  unidadNombre: string | null;
  esSupervisor: boolean;
}

export interface SyncUsuario {
  syncUsuarioId: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  dni: string | null;
  tipo: string | null;
  migrado: boolean;
}

export interface ActualizarUsuarioDto {
  activo?: boolean;
  areaId?: number;
  esSupervisor?: boolean;
}

export interface AsignarUsuariosDto {
  syncUsuarioIds: number[];
}

export type { OperationResult };
