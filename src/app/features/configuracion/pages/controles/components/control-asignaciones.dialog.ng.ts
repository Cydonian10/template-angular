import { Component, inject } from '@angular/core';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Area } from '../../../../../core/interfaces/area.interface';
import { Control } from '../../../../../core/interfaces/control.interface';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';
import { FontIconService } from '../../../../../core/services/icon.service';
import { abrirConfirmarDialog } from '../../../../../shared/dialogs/confirmar.dialog.ng';

export interface ControlAsignacionesDialogData {
  control: Control;
  areas: Area[];
  unidades: Unidad[];
  usuarios: Usuario[];
}

export interface ControlAsignacionesDialogResult {
  tipo: 'area' | 'unidad' | 'usuario';
  entidadId: number;
}

@Component({
  selector: 'control-asignaciones-dialog',
  imports: [FontAwesomeModule],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body max-h-[85vh] gap-5 overflow-y-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="card-title">Asignaciones de Control #{{ data.control.controlId }}</h2>
            <p class="text-sm text-base-content/60">Todas usan este control activo.</p>
          </div>
          <button class="btn btn-ghost btn-sm btn-circle" (click)="cerrar()" aria-label="Cerrar">
            <fa-icon [icon]="iconService.faX"></fa-icon>
          </button>
        </div>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Áreas <span class="badge badge-sm">{{ data.control.areas.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of data.control.areas; track asignacion.controlAreaId) {
              <li class="list-row flex items-center justify-between gap-3">
                <span>{{ nombreArea(asignacion.areaId) }}</span>
                <button class="btn btn-ghost btn-sm" (click)="pedirDesasignar('area', asignacion.areaId, nombreArea(asignacion.areaId))">Quitar</button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-base-content/60">Sin áreas asignadas.</li>
            }
          </ul>
        </section>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Unidades <span class="badge badge-sm">{{ data.control.unidades.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of data.control.unidades; track asignacion.controlUnidadId) {
              <li class="list-row flex items-center justify-between gap-3">
                <span>{{ nombreUnidad(asignacion.unidadId) }}</span>
                <button class="btn btn-ghost btn-sm" (click)="pedirDesasignar('unidad', asignacion.unidadId, nombreUnidad(asignacion.unidadId))">Quitar</button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-base-content/60">Sin unidades asignadas.</li>
            }
          </ul>
        </section>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Usuarios <span class="badge badge-sm">{{ data.control.usuarios.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of data.control.usuarios; track asignacion.controlUsuarioId) {
              <li class="list-row flex items-center justify-between gap-3">
                <span>{{ nombreUsuario(asignacion.usuarioId) }}</span>
                <button class="btn btn-ghost btn-sm" (click)="pedirDesasignar('usuario', asignacion.usuarioId, nombreUsuario(asignacion.usuarioId))">Quitar</button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-base-content/60">Sin usuarios asignados.</li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
})
export default class ControlAsignacionesDialog {
  public data = inject<ControlAsignacionesDialogData>(DIALOG_DATA);
  #dialog = inject(Dialog);
  #dialogRef = inject(DialogRef<ControlAsignacionesDialogResult>);
  public iconService = inject(FontIconService);

  nombreArea(areaId: number): string {
    return this.data.areas.find((area) => area.areaId === areaId)?.nombre ?? `#${areaId}`;
  }

  nombreUnidad(unidadId: number): string {
    return this.data.unidades.find((unidad) => unidad.unidadId === unidadId)?.nombre ?? `#${unidadId}`;
  }

  nombreUsuario(usuarioId: number): string {
    const usuario = this.data.usuarios.find((item) => item.usuarioId === usuarioId);
    return usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.usuario : `#${usuarioId}`;
  }

  pedirDesasignar(
    tipo: ControlAsignacionesDialogResult['tipo'],
    entidadId: number,
    nombre: string,
  ): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Quitar asignación',
      mensaje: `¿Seguro que deseas quitar la asignación de "${nombre}"?`,
      textoConfirmar: 'Quitar',
    });
    ref.closed.subscribe((result) => {
      if (result?.confirmado) this.#dialogRef.close({ tipo, entidadId });
    });
  }

  cerrar(): void {
    this.#dialogRef.close();
  }
}
