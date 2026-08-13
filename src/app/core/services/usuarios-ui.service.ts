import { Injectable, signal } from '@angular/core';
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root',
})
export class UsuariosUiService {
  private readonly _agregados = signal<Usuario[]>([]);

  agregar(usuarios: Usuario[]): void {
    this._agregados.set(usuarios);
  }

  tomarAgregados(): Usuario[] {
    const lista = this._agregados();
    this._agregados.set([]);
    return lista;
  }
}
