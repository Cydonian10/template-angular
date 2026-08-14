import { OperationResult } from './unidad.interface';

export interface Usuario {
  usuarioId: number;
  usuarioAreaId: number;
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
  usuarioAreaId?: number;
  areaId?: number;
  esSupervisor?: boolean;
}

export interface SyncUsuarioInput {
  syncUsuarioId?: number | null;
  usuario?: string;
  nombres?: string;
  apellidos?: string;
  tipo?: string;
  dni?: string;
}

export interface AsignarUsuariosDto {
  syncUsuarios: SyncUsuarioInput[];
}

export interface CrearSyncUnidadDto {
  syncUnidadId?: number | null;
  codigo?: string;
  nombre: string;
}

export type { OperationResult };
