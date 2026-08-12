import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';

export interface EditarHorasResult {
  horasLaborales: number;
  horasLaboralesTotales: number;
}

@Component({
  selector: 'editar-horas-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <div class="card bg-base-100 w-full max-w-md border border-base-300 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title">Editar horas</h2>
        <p class="text-sm text-base-content/70">
          {{ data.nombre ?? data.codigo }}
        </p>

        <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
          <label class="form-control w-full">
            <span class="label-text mb-1">Horas laborales diarias</span>
            <input
              type="number"
              min="0"
              class="input input-bordered w-full"
              formControlName="horasLaborales"
            />
            @if (horasLaborales.invalid && horasLaborales.touched) {
              <span class="text-error text-xs mt-1">
                Debe ser un número mayor o igual a 0.
              </span>
            }
          </label>

          <label class="form-control w-full">
            <span class="label-text mb-1">Horas laborales totales (semanales)</span>
            <input
              type="number"
              min="0"
              class="input input-bordered w-full"
              formControlName="horasLaboralesTotales"
            />
            @if (horasLaboralesTotales.invalid && horasLaboralesTotales.touched) {
              <span class="text-error text-xs mt-1">
                Debe ser un número mayor o igual a 0.
              </span>
            }
          </label>

          <div class="card-actions justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class EditarHorasDialog {
  public data = inject<Unidad>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<EditarHorasResult>);
  #fb = inject(FormBuilder);

  public form = this.#fb.group({
    horasLaborales: [
      this.data.horasLaborales,
      [Validators.required, Validators.min(0)],
    ],
    horasLaboralesTotales: [
      this.data.horasLaboralesTotales,
      [Validators.required, Validators.min(0)],
    ],
  });

  get horasLaborales() {
    return this.form.controls.horasLaborales;
  }

  get horasLaboralesTotales() {
    return this.form.controls.horasLaboralesTotales;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.#dialogRef.close(this.form.value as EditarHorasResult);
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}