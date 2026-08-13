import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Area } from '../../../../../core/interfaces/area.interface';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';

export interface AreaDialogData {
  area: Area | null;
  unidades: Unidad[];
}

export interface AreaDialogResult {
  nombre: string;
  descripcion?: string;
  unidadId?: number;
}

@Component({
  selector: 'area-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <div
      class="card bg-base-100 w-full max-w-md border border-base-300 shadow-xl"
    >
      <div class="card-body gap-4">
        <h2 class="card-title">
          {{ data.area ? 'Editar área' : 'Nueva área' }}
        </h2>

        @if (data.area) {
          <p class="text-sm text-base-content/70">
            Unidad: <strong>{{ data.area.unidadId }}</strong>
          </p>
        }

        <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Datos del área</legend>
          @if (!data.area) {
            <label class="form-control w-full">
              <span class="label-text mb-1">Unidad</span>
              <select
                class="select select-bordered w-full"
                formControlName="unidadId"
              >
                <option [ngValue]="null" disabled>Selecciona una unidad</option>
                @for (u of data.unidades; track u.unidadId) {
                  <option [ngValue]="u.unidadId">
                    {{ u.codigo }} - {{ u.nombre }}
                  </option>
                }
              </select>
              @if (unidadId.invalid && unidadId.touched) {
                <span class="text-error text-xs mt-1">
                  La unidad es requerida.
                </span>
              }
            </label>
          }

          <label class="form-control w-full">
            <span class="label-text mb-1">Nombre</span>
            <input
              type="text"
              class="input input-bordered w-full"
              formControlName="nombre"
              placeholder="Ej: Producción"
            />
            @if (nombre.invalid && nombre.touched) {
              <span class="text-error text-xs mt-1">
                El nombre es requerido.
              </span>
            }
          </label>

          <label class="form-control w-full">
            <span class="label-text mb-1">Descripción</span>
            <textarea
              class="textarea textarea-bordered w-full"
              rows="3"
              formControlName="descripcion"
              placeholder="Opcional"
            ></textarea>
          </label>

          </fieldset>

          <div class="card-actions justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class AreaDialog {
  public data = inject<AreaDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<AreaDialogResult>);
  #fb = inject(FormBuilder);

  public form = this.#fb.group({
    nombre: [
      this.data.area?.nombre ?? '',
      [Validators.required, Validators.minLength(1)],
    ],
    descripcion: [this.data.area?.descripcion ?? ''],
    unidadId: [
      this.data.area?.unidadId ?? (null as number | null),
      [Validators.required],
    ],
  });

  get nombre() {
    return this.form.controls.nombre;
  }

  get descripcion() {
    return this.form.controls.descripcion;
  }

  get unidadId() {
    return this.form.controls.unidadId;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const result: AreaDialogResult = {
      nombre: (value.nombre ?? '').trim(),
      descripcion: value.descripcion?.trim() || undefined,
    };

    if (this.data.area) {
      this.#dialogRef.close(result);
    } else {
      result.unidadId = value.unidadId ?? undefined;
      this.#dialogRef.close(result);
    }
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
