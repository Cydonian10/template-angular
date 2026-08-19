import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { MarcaBiometrico } from '../../../../../core/interfaces/biometrico.interface';
import { Biometrico } from '../../../../../core/interfaces/biometrico.interface';

export interface BiometricoFormDialogData {
  marcas: MarcaBiometrico[];
  biometrico?: Biometrico;
}

export interface BiometricoFormDialogResult {
  formulario: {
    marcaBiometricoId: number;
    nombre: string;
    ip: string;
    serie: string;
    ubicacion: string;
    tarjeta: boolean;
    huella: boolean;
    rostro: boolean;
  };
}

type CampoBiometrico =
  | 'marcaBiometricoId'
  | 'nombre'
  | 'ip'
  | 'serie'
  | 'ubicacion';

@Component({
  selector: 'biometrico-form-dialog',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card bg-base-100 w-full border border-base-300 shadow-xl">
      <div class="card-body gap-4 max-h-[85vh] overflow-y-auto">
        <h2 class="card-title">
          {{ data.biometrico ? 'Editar biométrico' : 'Nuevo biométrico' }}
        </h2>

        @if (!data.marcas.length) {
          <div role="alert" class="alert alert-warning">
            No hay marcas registradas. Crea una marca antes de registrar un
            biométrico.
          </div>
        }

        <form
          [formGroup]="form"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          (ngSubmit)="guardar()"
        >
          <fieldset class="fieldset sm:col-span-2">
            <legend class="fieldset-legend">Marca *</legend>
            <select formControlName="marcaBiometricoId" class="select w-full">
              <option [ngValue]="0" disabled>Selecciona una marca</option>
              @for (marca of data.marcas; track marca.marcaBiometricoId) {
                <option [ngValue]="marca.marcaBiometricoId">
                  {{ marca.nombre }}
                </option>
              }
            </select>
            @if (campoInvalido('marcaBiometricoId')) {
              <p class="text-error text-xs">Selecciona una marca.</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Nombre *</legend>
            <input
              formControlName="nombre"
              class="input w-full"
              maxlength="40"
            />
            @if (campoInvalido('nombre')) {
              <p class="text-error text-xs">{{ mensajeError('nombre') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">IP *</legend>
            <input formControlName="ip" class="input w-full" maxlength="20" />
            @if (campoInvalido('ip')) {
              <p class="text-error text-xs">{{ mensajeError('ip') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Serie *</legend>
            <input
              formControlName="serie"
              class="input w-full"
              maxlength="20"
            />
            @if (campoInvalido('serie')) {
              <p class="text-error text-xs">{{ mensajeError('serie') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Ubicación *</legend>
            <input
              formControlName="ubicacion"
              class="input w-full"
              maxlength="50"
            />
            @if (campoInvalido('ubicacion')) {
              <p class="text-error text-xs">{{ mensajeError('ubicacion') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset sm:col-span-2">
            <legend class="fieldset-legend">Métodos de identificación</legend>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label
                class="label cursor-pointer justify-start gap-2 rounded px-3"
              >
                <input
                  type="checkbox"
                  formControlName="tarjeta"
                  class="checkbox checkbox-sm"
                />
                <span>Tarjeta</span>
              </label>
              <label
                class="label cursor-pointer justify-start gap-2 rounded px-3"
              >
                <input
                  type="checkbox"
                  formControlName="huella"
                  class="checkbox checkbox-sm"
                />
                <span>Huella</span>
              </label>
              <label
                class="label cursor-pointer justify-start gap-2 rounded px-3"
              >
                <input
                  type="checkbox"
                  formControlName="rostro"
                  class="checkbox checkbox-sm"
                />
                <span>Rostro</span>
              </label>
            </div>
          </fieldset>

          <div class="card-actions sm:col-span-2 justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid"
            >
              <fa-icon [icon]="iconService.faSave"></fa-icon>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class BiometricoFormDialog {
  public data = inject<BiometricoFormDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<BiometricoFormDialogResult>);
  #fb = inject(FormBuilder);
  public iconService = inject(FontIconService);

  public form = this.#fb.nonNullable.group({
    marcaBiometricoId: [
      this.data.biometrico?.marcaBiometricoId ?? 0,
      [Validators.required, Validators.min(1)],
    ],
    nombre: [
      this.data.biometrico?.nombre ?? '',
      [Validators.required, Validators.maxLength(40)],
    ],
    ip: [
      this.data.biometrico?.ip ?? '',
      [Validators.required, Validators.maxLength(20)],
    ],
    serie: [
      this.data.biometrico?.serie ?? '',
      [Validators.required, Validators.maxLength(20)],
    ],
    ubicacion: [
      this.data.biometrico?.ubicacion ?? '',
      [Validators.required, Validators.maxLength(50)],
    ],
    tarjeta: [this.data.biometrico?.tarjeta ?? false],
    huella: [this.data.biometrico?.huella ?? false],
    rostro: [this.data.biometrico?.rostro ?? false],
  });

  campoInvalido(campo: CampoBiometrico): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  mensajeError(campo: Exclude<CampoBiometrico, 'marcaBiometricoId'>): string {
    const control = this.form.controls[campo];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) {
      return `Máximo ${control.errors?.['maxlength']?.requiredLength} caracteres.`;
    }
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
