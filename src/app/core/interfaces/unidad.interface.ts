export interface Unidad {
  unidadId: number;
  syncUnidadId: number;
  codigo: string | null;
  nombre: string | null;
  horasLaborales: number;
  horasLaboralesTotales: number;
}

export interface SyncUnidad {
  syncUnidadId: number;
  codigo: string | null;
  nombre: string | null;
  migrado: boolean;
}

export interface OperationResult {
  State: number;
  Message: string;
  CodeError: number | null;
}

export interface ActualizarUnidadDto {
  horasLaborales?: number;
  horasLaboralesTotales?: number;
}

export interface MigrarDto {
  syncUnidadId?: number;
}