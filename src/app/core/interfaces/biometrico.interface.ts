export interface MarcaBiometrico {
  marcaBiometricoId: number;
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface Biometrico {
  biometricoId: number;
  marcaBiometricoId: number;
  marcaNombre: string;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}

export interface CrearMarcaBiometricoDto {
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface ActualizarMarcaBiometricoDto {
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface CrearBiometricoDto {
  marcaBiometricoId: number;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}

export interface ActualizarBiometricoDto {
  marcaBiometricoId: number;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}