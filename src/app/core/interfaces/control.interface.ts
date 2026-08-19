export interface ControlAsignacionArea {
  controlAreaId: number;
  controlId: number;
  areaId: number;
}

export interface ControlAsignacionUnidad {
  controlUnidadId: number;
  controlId: number;
  unidadId: number;
}

export interface ControlAsignacionUsuario {
  controlUsuarioId: number;
  controlId: number;
  usuarioId: number;
}

export interface Control {
  controlId: number;
  tolerancia: number;
  limiteTardanza: number;
  limiteFalta: number;
  areas: ControlAsignacionArea[];
  unidades: ControlAsignacionUnidad[];
  usuarios: ControlAsignacionUsuario[];
}

export interface CrearControlDto {
  tolerancia: number;
  limiteTardanza: number;
  limiteFalta: number;
}

export interface ActualizarControlDto {
  tolerancia?: number;
  limiteTardanza?: number;
  limiteFalta?: number;
}

export interface AsignarControlAreaDto {
  areaId: number;
}

export interface AsignarControlUnidadDto {
  unidadId: number;
}

export interface AsignarControlUsuarioDto {
  usuarioId: number;
}

export interface DesasignarControlAreaDto {
  areaId: number;
}

export interface DesasignarControlUnidadDto {
  unidadId: number;
}

export interface DesasignarControlUsuarioDto {
  usuarioId: number;
}
