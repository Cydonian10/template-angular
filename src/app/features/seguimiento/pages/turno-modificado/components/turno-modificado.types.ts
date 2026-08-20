import { TurnoModificado } from '../../../../../core/interfaces/turno-modificado.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';

export interface ResumenModificacion {
  modificacion: TurnoModificado;
  horarioNombre: string;
}

export interface UsuarioTurnoModificado extends TurnoModificado {
  horarioNombre: string;
}

export type UsuarioSeleccionado = Usuario;
