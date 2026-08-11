import { computed, Injectable, signal } from '@angular/core';

export interface PerfilUsuario {
  usuario: string;
  id: number;
  email: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  usuarioColegioNodeId: number;
  fechaInicioSession: Date | null;
  fechaCierreSession: Date | null;
  sessionActiva: boolean;
  cambioPassword: boolean;
  vecesIncioSession: number;
  password: string;
  unidades: {
    id: number;
    abreviatura: string;
    unidad: string;
    principal: boolean;
  }[];
  roles: {
    fechaExpiracion: Date;
    fechaAsignacion: Date;
    activo: boolean;
    rolId: number;
    rol: string;
  }[];
  tipoUsuario: { id: number; nombre: string };
  idsPersona: (string | number)[];
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  #userAuth = signal<PerfilUsuario | null>(null);

  userAuth = computed(() => this.#userAuth());

  setUserAuth(user: PerfilUsuario) {
    this.#userAuth.set(user);
  }

  limpiarUserAuth() {
    this.#userAuth.set(null);
  }
}
