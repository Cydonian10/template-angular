import { Component, computed, inject, signal } from '@angular/core';
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
import {
  HorarioDetalle,
  HorarioTurno,
  UsuarioHorarioAsignacion,
} from '../../../../../core/interfaces/horario.interface';
import { FontIconService } from '../../../../../core/services/icon.service';

function fechaEnRango(minima: string, maxima?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const fecha = control.value as string;
    return !fecha || (fecha >= minima && (!maxima || fecha <= maxima))
      ? null
      : { fueraDeRango: true };
  };
}

interface CrearModificacionTurnoDialogData {
  modo: 'crear';
  usuarioId: number;
  asignacion: UsuarioHorarioAsignacion;
  horarioDetalle: HorarioDetalle;
}

interface EditarModificacionTurnoDialogData {
  modo: 'editar';
  turnoId: number;
  usuarioId: number;
  fechaMinima: string;
  fechaMaxima: string;
  modificacion: TurnoModificado;
}

export type ModificacionTurnoDialogData =
  | CrearModificacionTurnoDialogData
  | EditarModificacionTurnoDialogData;

export interface ModificacionTurnoDialogResult {
  guardado: boolean;
}

@Component({
  selector: 'modificacion-turno-dialog',
  host: { class: 'block' },
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title">
            {{ esCreacion() ? 'Nueva modificación' : 'Editar modificación' }}
          </h2>
          <p class="text-sm text-base-content/60">
            @if (esCreacion()) {
              Elige una fecha para ver los turnos disponibles.
            } @else {
              Actualiza los datos de la modificación registrada.
            }
          </p>
        </div>

        <form [formGroup]="form" class="space-y-3" (ngSubmit)="guardar()">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Fecha *</legend>
            <input
              type="date"
              class="input w-full"
              formControlName="fecha"
              [min]="fechaMinima"
              [max]="fechaMaxima"
              (change)="cambiarFecha($event)"
            />
            @if (form.controls.fecha.invalid && form.controls.fecha.touched) {
              <p class="text-xs text-error">
                Selecciona una fecha dentro de la vigencia del horario.
              </p>
            }
          </fieldset>

          @if (esCreacion()) {
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Turno *</legend>
              @if (turnosDisponibles().length) {
                <select
                  class="select w-full"
                  formControlName="turnoId"
                  (change)="seleccionarTurno($event)"
                >
                  <option value="">Selecciona un turno</option>
                  @for (turno of turnosDisponibles(); track turno.turnoId) {
                    <option [value]="turno.turnoId">
                      {{ formatearHora(turno.horaInicio) }} -
                      {{ formatearHora(turno.horaFin) }}
                    </option>
                  }
                </select>
              } @else {
                <div role="alert" class="alert alert-info">
                  <span>No hay turnos disponibles para esta fecha.</span>
                </div>
              }
              @if (
                form.controls.turnoId.invalid && form.controls.turnoId.touched
              ) {
                <p class="text-xs text-error">Selecciona un turno válido.</p>
              }
            </fieldset>
          }

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
                <fa-icon [icon]="iconService.faSpinner" [animation]="'spin'" />
                Guardando
              } @else {
                <fa-icon [icon]="iconService.faSave" /> Guardar
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class ModificacionTurnoDialog {
  data = inject<ModificacionTurnoDialogData>(DIALOG_DATA);
  iconService = inject(FontIconService);
  #dialogRef = inject(DialogRef<ModificacionTurnoDialogResult>);
  #fb = inject(FormBuilder);
  #service = inject(TurnoModificadoService);
  #toastr = inject(ToastrService);

  esCreacion = signal(this.data.modo === 'crear');
  guardando = signal(false);
  turnosDisponibles = signal<HorarioTurno[]>(
    this.turnosParaFecha(this.fechaInicial),
  );
  fechaMinima =
    this.data.modo === 'crear'
      ? this.fechaAsignacionInicio()
      : this.data.fechaMinima;
  fechaMaxima =
    this.data.modo === 'crear'
      ? (this.data.asignacion.fechaFin?.slice(0, 10) ?? '')
      : this.data.fechaMaxima;
  form = this.#fb.nonNullable.group({
    fecha: [
      this.fechaInicial,
      [
        Validators.required,
        fechaEnRango(this.fechaMinima, this.fechaMaxima || undefined),
      ],
    ],
    turnoId: ['', this.data.modo === 'crear' ? Validators.required : []],
    horaInicio: [
      this.data.modo === 'editar'
        ? this.formatearHora(this.data.modificacion.horaInicio)
        : '',
      Validators.required,
    ],
    horaFin: [
      this.data.modo === 'editar'
        ? this.formatearHora(this.data.modificacion.horaFin)
        : '',
      Validators.required,
    ],
    motivo: [
      this.data.modo === 'editar' ? (this.data.modificacion.motivo ?? '') : '',
      Validators.maxLength(255),
    ],
  });

  get puedeGuardar(): boolean {
    return (
      !this.esCreacion() ||
      (this.turnosDisponibles().length > 0 &&
        !!this.form.controls.turnoId.value)
    );
  }

  cambiarFecha(event: Event): void {
    if (!this.esCreacion()) return;
    const fecha = (event.target as HTMLInputElement).value;
    this.turnosDisponibles.set(this.turnosParaFecha(fecha));
    this.form.patchValue({ turnoId: '', horaInicio: '', horaFin: '' });
    this.form.controls.turnoId.markAsUntouched();
  }

  seleccionarTurno(event: Event): void {
    const turnoId = Number((event.target as HTMLSelectElement).value);
    const turno = this.turnosDisponibles().find(
      (item) => item.turnoId === turnoId,
    );
    if (!turno) {
      this.form.patchValue({ horaInicio: '', horaFin: '' });
      return;
    }
    this.form.patchValue({
      horaInicio: this.formatearHora(turno.horaInicio),
      horaFin: this.formatearHora(turno.horaFin),
    });
  }

  guardar(): void {
    if (this.form.invalid || !this.puedeGuardar) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const value = this.form.getRawValue();
    const dto = {
      fecha: value.fecha,
      horaInicio: value.horaInicio,
      horaFin: value.horaFin,
      motivo: value.motivo.trim() || null,
    };
    const request =
      this.data.modo === 'crear'
        ? this.#service.crear(Number(value.turnoId), {
            ...dto,
            usuarioId: this.data.usuarioId,
          })
        : this.#service.actualizar(
            this.data.turnoId,
            this.data.modificacion.turnoModificadoId,
            dto,
          );
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

  private get fechaInicial(): string {
    if (this.data.modo === 'editar')
      return this.data.modificacion.fecha.slice(0, 10);
    const hoy = new Date().toISOString().slice(0, 10);
    const maxima = this.data.asignacion.fechaFin?.slice(0, 10);
    return hoy >= this.fechaAsignacionInicio() && (!maxima || hoy <= maxima)
      ? hoy
      : this.fechaAsignacionInicio();
  }

  private fechaAsignacionInicio(): string {
    return this.data.modo === 'crear'
      ? (this.data.asignacion.fechaInicio?.slice(0, 10) ??
          new Date().toISOString().slice(0, 10))
      : this.data.fechaMinima;
  }

  private turnosParaFecha(fecha: string): HorarioTurno[] {
    if (
      this.data.modo !== 'crear' ||
      !fecha ||
      fecha < this.fechaAsignacionInicio() ||
      (this.data.asignacion.fechaFin &&
        fecha > this.data.asignacion.fechaFin.slice(0, 10))
    )
      return [];
    const diaId = ((new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
    const dias = this.data.horarioDetalle.rotativo
      ? (this.data.horarioDetalle.grupos.find(
          (grupo) =>
            (!grupo.fechaInicio || fecha >= grupo.fechaInicio.slice(0, 10)) &&
            (!grupo.fechaFin || fecha <= grupo.fechaFin.slice(0, 10)),
        )?.dias ?? [])
      : this.data.horarioDetalle.dias;
    return dias.find((dia) => dia.diaId === diaId)?.turnos ?? [];
  }

  formatearHora(value: string): string {
    return value.slice(0, 5);
  }
}
