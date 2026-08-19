import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import {
  Control,
  CrearControlDto,
} from '../../../../../core/interfaces/control.interface';

export interface ControlFormDialogData {
  control?: Control;
}

export interface ControlFormDialogResult {
  formulario: CrearControlDto;
}

type CampoControl = 'tolerancia' | 'limiteTardanza' | 'limiteFalta';

@Component({
  selector: 'control-form-dialog',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title">
          {{ data.control ? 'Editar control' : 'Nuevo control' }}
        </h2>
        <p class="text-sm text-base-content/60">
          Ingresa valores enteros mayores o iguales a cero.
        </p>

        <form
          [formGroup]="form"
          class="grid grid-cols-1 gap-3 sm:grid-cols-3"
          (ngSubmit)="guardar()"
        >
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Tolerancia (min) *</legend>
            <input
              type="number"
              min="0"
              step="1"
              formControlName="tolerancia"
              class="input w-full"
            />
            @if (campoInvalido('tolerancia')) {
              <p class="text-xs text-error">{{ mensajeError('tolerancia') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Límite tardanza *</legend>
            <input
              type="number"
              min="0"
              step="1"
              formControlName="limiteTardanza"
              class="input w-full"
            />
            @if (campoInvalido('limiteTardanza')) {
              <p class="text-xs text-error">{{ mensajeError('limiteTardanza') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Límite falta *</legend>
            <input
              type="number"
              min="0"
              step="1"
              formControlName="limiteFalta"
              class="input w-full"
            />
            @if (campoInvalido('limiteFalta')) {
              <p class="text-xs text-error">{{ mensajeError('limiteFalta') }}</p>
            }
          </fieldset>

          <div class="card-actions justify-end pt-2 sm:col-span-3">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
              <fa-icon [icon]="iconService.faSave"></fa-icon>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class ControlFormDialog {
  public data = inject<ControlFormDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<ControlFormDialogResult>);
  #fb = inject(FormBuilder);
  public iconService = inject(FontIconService);

  public form = this.#fb.nonNullable.group({
    tolerancia: [this.data.control?.tolerancia ?? 0, [Validators.required, Validators.min(0)]],
    limiteTardanza: [
      this.data.control?.limiteTardanza ?? 0,
      [Validators.required, Validators.min(0)],
    ],
    limiteFalta: [
      this.data.control?.limiteFalta ?? 0,
      [Validators.required, Validators.min(0)],
    ],
  });

  campoInvalido(campo: CampoControl): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  mensajeError(campo: CampoControl): string {
    const control = this.form.controls[campo];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('min')) return 'El valor debe ser mayor o igual a cero.';
    return '';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.#dialogRef.close({ formulario: this.form.getRawValue() });
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
