import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { MarcaBiometricoService } from '../../../../../api/marca-biometrico.service';
import { abrirConfirmarDialog } from '../../../../../shared/dialogs/confirmar.dialog.ng';
import { OperationResult } from '../../../../../core/interfaces/unidad.interface';
import { MarcaBiometrico } from '../../../../../core/interfaces/biometrico.interface';

export interface MarcasDialogData {
  marcas: MarcaBiometrico[];
}

export interface MarcasDialogResult {
  marcas: MarcaBiometrico[];
}

type EstadoFormulario = 'nueva' | MarcaBiometrico | null;
type CampoMarca = 'nombre' | 'tipoDB' | 'detalle';

@Component({
  selector: 'marcas-dialog',
  imports: [FontAwesomeModule, ReactiveFormsModule],
  template: `
    <div class="card bg-base-100 w-full border border-base-300 shadow-xl">
      <div class="card-body gap-4 max-h-[85vh] overflow-y-auto">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="card-title">Marcas de biométricos</h2>
          <button class="btn btn-sm" (click)="abrirNueva()">
            <fa-icon [icon]="iconService.faPlus"></fa-icon>
            Nueva marca
          </button>
        </div>

        @if (editando() !== null) {
          <form
            [formGroup]="form"
            class="grid grid-cols-1 gap-2 sm:grid-cols-2"
            (ngSubmit)="guardar()"
          >
            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">Nombre *</legend>
              <input
                formControlName="nombre"
                class="input w-full"
                maxlength="30"
              />
              @if (campoInvalido('nombre')) {
                <p class="text-error text-xs">{{ mensajeError('nombre') }}</p>
              }
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Tipo DB *</legend>
              <input
                formControlName="tipoDB"
                class="input w-full"
                maxlength="20"
              />
              @if (campoInvalido('tipoDB')) {
                <p class="text-error text-xs">{{ mensajeError('tipoDB') }}</p>
              }
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Detalle *</legend>
              <input
                formControlName="detalle"
                class="input w-full"
                maxlength="50"
              />
              @if (campoInvalido('detalle')) {
                <p class="text-error text-xs">{{ mensajeError('detalle') }}</p>
              }
            </fieldset>

            <div class="card-actions sm:col-span-2 justify-end pt-2">
              <button
                type="button"
                class="btn btn-ghost"
                [disabled]="guardando()"
                (click)="cancelarFormulario()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || guardando()"
              >
                <fa-icon [icon]="iconService.faSave"></fa-icon>
                Guardar
              </button>
            </div>
          </form>
        }

        @if (!marcas().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay marcas registradas.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo DB</th>
                  <th>Detalle</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of marcas(); track m.marcaBiometricoId) {
                  <tr>
                    <td>{{ m.nombre }}</td>
                    <td>{{ m.tipoDB }}</td>
                    <td>{{ m.detalle }}</td>
                    <td class="text-end">
                      <div class="flex justify-end gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          (click)="editar(m)"
                          aria-label="Editar marca"
                        >
                          <fa-icon [icon]="iconService.faPencil"></fa-icon>
                        </button>
                        <button
                          class="btn btn-xs btn-outline btn-error"
                          (click)="pedirEliminar(m)"
                          aria-label="Eliminar marca"
                        >
                          <fa-icon [icon]="iconService.faTrash"></fa-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <div class="card-actions justify-end pt-2">
          <button class="btn btn-ghost" (click)="cerrar()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
})
export default class MarcasDialog {
  public data = inject<MarcasDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<MarcasDialogResult>);
  #dialog = inject(Dialog);
  #destroyRef = inject(DestroyRef);
  #marcasService = inject(MarcaBiometricoService);
  #toastr = inject(ToastrService);
  #fb = inject(FormBuilder);
  public iconService = inject(FontIconService);

  public marcas = signal<MarcaBiometrico[]>(this.data.marcas);
  public editando = signal<EstadoFormulario>(null);
  public guardando = signal(false);

  public form = this.#fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    tipoDB: ['', [Validators.required, Validators.maxLength(20)]],
    detalle: ['', [Validators.required, Validators.maxLength(50)]],
  });

  abrirNueva(): void {
    this.editando.set('nueva');
    this.form.reset();
  }

  editar(marca: MarcaBiometrico): void {
    this.editando.set(marca);
    this.form.setValue({
      nombre: marca.nombre,
      tipoDB: marca.tipoDB,
      detalle: marca.detalle,
    });
  }

  cancelarFormulario(): void {
    this.editando.set(null);
    this.form.reset();
  }

  campoInvalido(campo: CampoMarca): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  mensajeError(campo: CampoMarca): string {
    const control = this.form.controls[campo];
    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('maxlength')) {
      const max = control.errors?.['maxlength']?.requiredLength as number;
      return `Máximo ${max} caracteres`;
    }
    return '';
  }

  guardar(): void {
    const editando = this.editando();
    if (!editando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const dto = this.form.getRawValue();
    const request =
      editando === 'nueva'
        ? this.#marcasService.crearMarca(dto)
        : this.#marcasService.actualizarMarca(editando.marcaBiometricoId, dto);
    request.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe({
      next: (res: OperationResult) => {
        this.guardando.set(false);
        if (res.State === 1) {
          this.#toastr.success(res.Message);
          this.cancelarFormulario();
          this.#recargar();
        } else {
          this.#toastr.error(res.Message);
        }
      },
      error: () => {
        this.guardando.set(false);
        this.#toastr.error('No se pudo guardar la marca');
      },
    });
  }

  pedirEliminar(marca: MarcaBiometrico): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar marca',
      mensaje: `¿Seguro que deseas eliminar la marca "${marca.nombre}"?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((result) => {
      if (!result?.confirmado) {
        return;
      }
      this.#marcasService
        .eliminarMarca(marca.marcaBiometricoId)
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: (res: OperationResult) => {
            if (res.State === 1) {
              this.#toastr.success(res.Message);
              this.#recargar();
            } else {
              this.#toastr.error(res.Message);
            }
          },
          error: () => this.#toastr.error('No se pudo eliminar la marca'),
        });
    });
  }

  #recargar(): void {
    this.#marcasService
      .listarMarcas()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (marcas) => this.marcas.set(marcas),
        error: () =>
          this.#toastr.error('No se pudieron cargar las marcas'),
      });
  }

  cerrar(): void {
    this.#dialogRef.close({ marcas: this.marcas() } as MarcasDialogResult);
  }
}