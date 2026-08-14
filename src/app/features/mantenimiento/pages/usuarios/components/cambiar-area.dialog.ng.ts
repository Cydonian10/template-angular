import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Area } from '../../../../../core/interfaces/area.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';

export interface CambiarAreaDialogData {
  usuario: Usuario;
  areas: Area[];
}

export interface CambiarAreaDialogResult {
  areaId: number;
}

@Component({
  selector: 'cambiar-area-dialog',
  imports: [],
  template: `
    <div
      class="card bg-base-100 w-full max-w-md border border-base-300 shadow-xl"
    >
      <div class="card-body gap-4">
        <h2 class="card-title">Cambiar área</h2>
        <p class="text-sm text-base-content/70">
          Usuario: <strong>{{ data.usuario.nombres }} {{ data.usuario.apellidos }}</strong>
          · {{ data.usuario.unidadNombre }}
        </p>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Área</legend>
          <select
            class="select w-full"
            [value]="areaSeleccionada()"
            (change)="cambiar($event)"
          >
            @for (a of data.areas; track a.areaId) {
              <option [value]="a.areaId">{{ a.nombre }}</option>
            }
          </select>
          <p class="label">Solo áreas de la misma unidad</p>
        </fieldset>

        <div class="card-actions justify-end pt-2">
          <button type="button" class="btn btn-ghost" (click)="cancelar()">
            Cancelar
          </button>
          <button class="btn btn-primary" [disabled]="!areaSeleccionada()" (click)="guardar()">
            Guardar
          </button>
        </div>
      </div>
    </div>
  `,
})
export default class CambiarAreaDialog {
  public data = inject<CambiarAreaDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<CambiarAreaDialogResult>);

  public areaSeleccionada = signal<number>(
    this.data.areas.some((a) => a.areaId === this.data.usuario.areaId)
      ? this.data.usuario.areaId
      : (this.data.areas[0]?.areaId ?? 0),
  );

  cambiar(event: Event): void {
    this.areaSeleccionada.set(Number((event.target as HTMLSelectElement).value));
  }

  guardar(): void {
    this.#dialogRef.close({ areaId: this.areaSeleccionada() });
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
