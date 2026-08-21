import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MotivosService } from '../../../../../api/motivos.service';
import {
  ActualizarMotivoDto,
  CrearMotivoDto,
  Motivo,
} from '../../../../../core/interfaces/motivo.interface';
import { FontIconService } from '../../../../../core/services/icon.service';

export interface MotivoFormDialogData {
  motivo?: Motivo;
}

export interface MotivoFormDialogResult {
  actualizado: boolean;
}

type CampoMotivo = 'nombre' | 'descripcion';

@Component({
  selector: 'motivo-form-dialog',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title">
          {{ data.motivo ? 'Editar motivo' : 'Nuevo motivo' }}
        </h2>

        <form [formGroup]="form" class="space-y-3" (ngSubmit)="guardar()">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Nombre *</legend>
            <input
              type="text"
              formControlName="nombre"
              maxlength="100"
              class="input w-full"
              placeholder="Nombre del motivo"
            />
            @if (campoInvalido('nombre')) {
              <p class="text-xs text-error">{{ mensajeError('nombre') }}</p>
            }
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Descripción</legend>
            <textarea
              formControlName="descripcion"
              maxlength="255"
              class="textarea w-full"
              rows="3"
              placeholder="Descripción opcional"
            ></textarea>
            @if (campoInvalido('descripcion')) {
              <p class="text-xs text-error">
                {{ mensajeError('descripcion') }}
              </p>
            }
          </fieldset>

          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-primary"
              formControlName="documentoRequerido"
            />
            <span>Requiere documento</span>
          </label>

          <div class="card-actions justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || guardando()"
            >
              @if (guardando()) {
                <fa-icon
                  [icon]="iconService.faSpinner"
                  animation="spin"
                ></fa-icon>
              } @else {
                <fa-icon [icon]="iconService.faSave"></fa-icon>
              }
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class MotivoFormDialog {
  public data = inject<MotivoFormDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<MotivoFormDialogResult>);
  #fb = inject(FormBuilder);
  #motivosService = inject(MotivosService);
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);
  public iconService = inject(FontIconService);

  public guardando = signal(false);
  public form = this.#fb.nonNullable.group({
    nombre: [
      this.data.motivo?.nombre ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
    descripcion: [
      this.data.motivo?.descripcion ?? '',
      [Validators.maxLength(255)],
    ],
    documentoRequerido: [this.data.motivo?.documentoRequerido ?? false],
  });

  campoInvalido(campo: CampoMotivo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  mensajeError(campo: CampoMotivo): string {
    const control = this.form.controls[campo];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) {
      return campo === 'nombre'
        ? 'El nombre no puede superar 100 caracteres.'
        : 'La descripción no puede superar 255 caracteres.';
    }
    return '';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const base = {
      nombre: value.nombre.trim(),
      descripcion: value.descripcion.trim() || null,
      documentoRequerido: value.documentoRequerido,
    };
    if (!base.nombre) {
      this.form.controls.nombre.setErrors({ required: true });
      this.form.controls.nombre.markAsTouched();
      return;
    }

    this.guardando.set(true);
    const request = this.data.motivo
      ? this.#motivosService.actualizar(
          this.data.motivo.motivoId,
          base satisfies ActualizarMotivoDto,
        )
      : this.#motivosService.crear(base satisfies CrearMotivoDto);

    request
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (result) => {
          if (result.State !== 1) {
            this.#toastr.error(result.Message);
            return;
          }
          this.#dialogRef.close({ actualizado: true });
        },
        error: () => this.#toastr.error('No se pudo guardar el motivo'),
      })
      .add(() => this.guardando.set(false));
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
