import { Component, inject } from '@angular/core';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  imports: [FontAwesomeModule, ReactiveFormsModule],
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

        <form [formGroup]="filtros" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <fieldset class="fieldset sm:col-span-3">
            <legend class="fieldset-legend">Buscar asignación</legend>
            <label class="input w-full">
              <fa-icon [icon]="iconService.faSearch"></fa-icon>
              <input
                type="search"
                class="grow"
                formControlName="busqueda"
                placeholder="Buscar área, unidad o usuario..."
              />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Unidad</legend>
            <select class="select w-full" formControlName="unidadId" (change)="cambiarUnidad()">
              <option [ngValue]="0">Todas las unidades</option>
              @for (unidad of data.unidades; track unidad.unidadId) {
                <option [ngValue]="unidad.unidadId">
                  {{ unidad.nombre ?? 'Unidad #' + unidad.unidadId }}
                </option>
              }
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Área</legend>
            <select class="select w-full" formControlName="areaId">
              <option [ngValue]="0">Todas las áreas</option>
              @for (area of areasDisponibles(); track area.areaId) {
                <option [ngValue]="area.areaId">{{ area.nombre }}</option>
              }
            </select>
          </fieldset>
        </form>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Áreas <span class="badge badge-sm">{{ data.control.areas.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of areasFiltradas(); track asignacion.controlAreaId) {
              <li class="list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span class="min-w-0 break-words">{{ nombreArea(asignacion.areaId) }}</span>
                <button class="btn btn-ghost btn-sm self-start sm:self-auto" (click)="pedirDesasignar('area', asignacion.areaId, nombreArea(asignacion.areaId))">Quitar</button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-base-content/60">Sin áreas asignadas.</li>
            }
          </ul>
        </section>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Unidades <span class="badge badge-sm">{{ data.control.unidades.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of unidadesFiltradas(); track asignacion.controlUnidadId) {
              <li class="list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span class="min-w-0 break-words">{{ nombreUnidad(asignacion.unidadId) }}</span>
                <button class="btn btn-ghost btn-sm self-start sm:self-auto" (click)="pedirDesasignar('unidad', asignacion.unidadId, nombreUnidad(asignacion.unidadId))">Quitar</button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-base-content/60">Sin unidades asignadas.</li>
            }
          </ul>
        </section>

        <section>
          <h3 class="mb-2 flex items-center gap-2 font-semibold">Usuarios <span class="badge badge-sm">{{ data.control.usuarios.length }}</span></h3>
          <ul class="list rounded-box border border-base-300">
            @for (asignacion of usuariosFiltrados(); track asignacion.controlUsuarioId) {
              <li class="list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span class="min-w-0 break-words">{{ nombreUsuario(asignacion.usuarioId) }}</span>
                <button class="btn btn-ghost btn-sm self-start sm:self-auto" (click)="pedirDesasignar('usuario', asignacion.usuarioId, nombreUsuario(asignacion.usuarioId))">Quitar</button>
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
  #fb = inject(FormBuilder);
  public iconService = inject(FontIconService);

  public filtros = this.#fb.nonNullable.group({
    busqueda: [''],
    unidadId: [0],
    areaId: [0],
  });

  areasDisponibles(): Area[] {
    const unidadId = this.filtros.controls.unidadId.value;
    return unidadId
      ? this.data.areas.filter((area) => area.unidadId === unidadId)
      : this.data.areas;
  }

  areasFiltradas() {
    return this.data.control.areas.filter((asignacion) => {
      const area = this.data.areas.find((item) => item.areaId === asignacion.areaId);
      return (
        (!this.filtros.controls.unidadId.value || area?.unidadId === this.filtros.controls.unidadId.value) &&
        this.coincide(this.nombreArea(asignacion.areaId))
      );
    });
  }

  unidadesFiltradas() {
    return this.data.control.unidades.filter((asignacion) =>
      (!this.filtros.controls.unidadId.value || asignacion.unidadId === this.filtros.controls.unidadId.value) &&
      this.coincide(this.nombreUnidad(asignacion.unidadId)),
    );
  }

  usuariosFiltrados() {
    return this.data.control.usuarios.filter((asignacion) => {
      const usuario = this.data.usuarios.find((item) => item.usuarioId === asignacion.usuarioId);
      return (
        (!this.filtros.controls.unidadId.value || usuario?.unidadId === this.filtros.controls.unidadId.value) &&
        (!this.filtros.controls.areaId.value || usuario?.areaId === this.filtros.controls.areaId.value) &&
        this.coincide(this.nombreUsuario(asignacion.usuarioId))
      );
    });
  }

  cambiarUnidad(): void {
    this.filtros.controls.areaId.setValue(0);
  }

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

  private coincide(valor: string): boolean {
    return valor.toLocaleLowerCase().includes(
      this.filtros.controls.busqueda.value.toLocaleLowerCase().trim(),
    );
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
