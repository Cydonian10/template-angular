import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TurnoModificadoService } from '../../../../../api/turno-modificado.service';
import { TurnoModificado } from '../../../../../core/interfaces/turno-modificado.interface';
import { FontIconService } from '../../../../../core/services/icon.service';

function fechaEnRango(minima: string, maxima: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const fecha = control.value as string;
    return !fecha || (fecha >= minima && fecha <= maxima)
      ? null
      : { fueraDeRango: true };
  };
}

export interface ModificacionTurnoDialogData {
  turnoId: number;
  usuarioId: number;
  fechaMinima: string;
  fechaMaxima: string;
  modificacion?: TurnoModificado;
}

export interface ModificacionTurnoDialogResult {
  guardado: boolean;
}

@Component({
  selector: 'modificacion-turno-dialog',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title">
            {{ data.modificacion ? 'Editar modificación' : 'Modificar turno' }}
          </h2>
          <p class="text-sm text-base-content/60">
            La fecha debe corresponder al mes que estás consultando.
          </p>
        </div>

        <form [formGroup]="form" class="space-y-3" (ngSubmit)="guardar()">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Fecha *</legend>
            <input
              type="date"
              class="input w-full"
              formControlName="fecha"
              [min]="data.fechaMinima"
              [max]="data.fechaMaxima"
            />
            @if (form.controls.fecha.invalid && form.controls.fecha.touched) {
              <p class="text-xs text-error">
                Selecciona una fecha dentro del mes consultado.
              </p>
            }
          </fieldset>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Hora inicio *</legend>
              <input
                type="time"
                class="input w-full"
                formControlName="horaInicio"
              />
              @if (
                form.controls.horaInicio.invalid &&
                form.controls.horaInicio.touched
              ) {
                <p class="text-xs text-error">Ingresa la hora de inicio.</p>
              }
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Hora fin *</legend>
              <input
                type="time"
                class="input w-full"
                formControlName="horaFin"
              />
              @if (
                form.controls.horaFin.invalid && form.controls.horaFin.touched
              ) {
                <p class="text-xs text-error">Ingresa la hora de fin.</p>
              }
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Motivo</legend>
            <textarea
              class="textarea w-full"
              rows="3"
              maxlength="255"
              formControlName="motivo"
              placeholder="Motivo de la modificación (opcional)"
            ></textarea>
            @if (form.controls.motivo.invalid && form.controls.motivo.touched) {
              <p class="text-xs text-error">
                El motivo no puede superar 255 caracteres.
              </p>
            }
          </fieldset>

          <div class="card-actions justify-end pt-2">
            <button
              type="button"
              class="btn btn-ghost"
              [disabled]="guardando()"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="guardando()"
            >
              @if (guardando()) {
                <fa-icon
                  [icon]="iconService.faSpinner"
                  [animation]="'spin'"
                ></fa-icon>
                Guardando
              } @else {
                <fa-icon [icon]="iconService.faSave"></fa-icon> Guardar
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class ModificacionTurnoDialog {
  public data = inject<ModificacionTurnoDialogData>(DIALOG_DATA);
  public iconService = inject(FontIconService);
  #dialogRef = inject(DialogRef<ModificacionTurnoDialogResult>);
  #fb = inject(FormBuilder);
  #service = inject(TurnoModificadoService);
  #toastr = inject(ToastrService);

  public guardando = signal(false);
  public form = this.#fb.nonNullable.group({
    fecha: [
      this.data.modificacion?.fecha.slice(0, 10) ?? this.data.fechaMinima,
      [
        Validators.required,
        fechaEnRango(this.data.fechaMinima, this.data.fechaMaxima),
      ],
    ],
    horaInicio: [
      this.formatearHora(this.data.modificacion?.horaInicio),
      Validators.required,
    ],
    horaFin: [
      this.formatearHora(this.data.modificacion?.horaFin),
      Validators.required,
    ],
    motivo: [this.data.modificacion?.motivo ?? '', Validators.maxLength(255)],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const value = this.form.getRawValue();
    const dto = { ...value, motivo: value.motivo.trim() || null };
    const request = this.data.modificacion
      ? this.#service.actualizar(
          this.data.turnoId,
          this.data.modificacion.turnoModificadoId,
          dto,
        )
      : this.#service.crear(this.data.turnoId, {
          ...dto,
          usuarioId: this.data.usuarioId,
        });
    request.subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        if (resultado.State === 1) {
          this.#toastr.success(resultado.Message);
          this.#dialogRef.close({ guardado: true });
        } else this.#toastr.error(resultado.Message);
      },
      error: () => {
        this.guardando.set(false);
        this.#toastr.error('No se pudo guardar la modificación del turno');
      },
    });
  }

  cancelar(): void {
    this.#dialogRef.close({ guardado: false });
  }

  private formatearHora(value: string | undefined): string {
    return value?.slice(0, 5) ?? '';
  }
}
