import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Area } from '../../../../../core/interfaces/area.interface';
import {
  Control,
  ControlAsignacionArea,
  ControlAsignacionUnidad,
  ControlAsignacionUsuario,
} from '../../../../../core/interfaces/control.interface';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';
import { FontIconService } from '../../../../../core/services/icon.service';
import BuscarEntidadSelector, {
  BuscarEntidadOpcion,
} from './buscar-entidad-selector.ng';

type TipoAsignacion = 'area' | 'unidad' | 'usuario';

export interface AsignarControlDialogData {
  controles: Control[];
  areas: Area[];
  unidades: Unidad[];
  usuarios: Usuario[];
}

export interface AsignarControlDialogResult {
  controlId: number;
  tipo: TipoAsignacion;
  entidadId: number;
}

@Component({
  selector: 'asignar-control-dialog',
  imports: [
    BuscarEntidadSelector,
    FontAwesomeModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title">Asignar control</h2>
          <p class="text-sm text-base-content/60">
            Cada área, unidad o usuario puede tener un solo control activo.
          </p>
        </div>

        <form [formGroup]="form" class="space-y-3" (ngSubmit)="guardar()">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Control *</legend>
            <select formControlName="controlId" class="select w-full">
              <option [ngValue]="0" disabled>Selecciona un control</option>
              @for (control of data.controles; track control.controlId) {
                <option [ngValue]="control.controlId">Control #{{ control.controlId }}</option>
              }
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Tipo de asignación *</legend>
            <select class="select w-full" [value]="form.controls.tipo.value" (change)="cambiarTipo($event)">
              <option value="area">Área</option>
              <option value="unidad">Unidad</option>
              <option value="usuario">Usuario</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ etiquetaEntidad() }} *</legend>
            <buscar-entidad-selector
              [opciones]="opcionesEntidad()"
              [placeholder]="'Buscar ' + etiquetaEntidad().toLocaleLowerCase() + '...'"
              (seleccion)="seleccionarEntidad($event)"
            />
            @if (form.controls.entidadId.value) {
              <p class="text-xs text-base-content/60">Seleccionado: {{ entidadSeleccionada() }}</p>
            }
            @if (form.controls.entidadId.invalid && form.controls.entidadId.touched) {
              <p class="text-xs text-error">Selecciona una {{ etiquetaEntidad().toLocaleLowerCase() }}.</p>
            }
          </fieldset>

          <div class="card-actions justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
              <fa-icon [icon]="iconService.faSave"></fa-icon>
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class AsignarControlDialog {
  public data = inject<AsignarControlDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<AsignarControlDialogResult>);
  #fb = inject(FormBuilder);
  public iconService = inject(FontIconService);

  public form = this.#fb.nonNullable.group({
    controlId: [0, [Validators.required, Validators.min(1)]],
    tipo: ['area' as TipoAsignacion],
    entidadId: [0, [Validators.required, Validators.min(1)]],
  });

  opcionesEntidad(): BuscarEntidadOpcion[] {
    const tipo = this.form.controls.tipo.value;
    if (tipo === 'area') {
      return this.data.areas.map((area) =>
        this.crearOpcion(area.areaId, area.nombre, this.buscarAsignacionArea(area.areaId)),
      );
    }
    if (tipo === 'unidad') {
      return this.data.unidades.map((unidad) =>
        this.crearOpcion(
          unidad.unidadId,
          unidad.nombre ?? `Unidad #${unidad.unidadId}`,
          this.buscarAsignacionUnidad(unidad.unidadId),
        ),
      );
    }
    return this.data.usuarios.map((usuario) =>
      this.crearOpcion(
        usuario.usuarioId,
        `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.usuario,
        this.buscarAsignacionUsuario(usuario.usuarioId),
      ),
    );
  }

  etiquetaEntidad(): string {
    const etiquetas: Record<TipoAsignacion, string> = {
      area: 'Área',
      unidad: 'Unidad',
      usuario: 'Usuario',
    };
    return etiquetas[this.form.controls.tipo.value];
  }

  entidadSeleccionada(): string {
    const id = this.form.controls.entidadId.value;
    return this.opcionesEntidad().find((opcion) => opcion.id === id)?.nombre ?? '';
  }

  cambiarTipo(event: Event): void {
    this.form.controls.tipo.setValue(
      (event.target as HTMLSelectElement).value as TipoAsignacion,
    );
    this.form.controls.entidadId.setValue(0);
    this.form.controls.entidadId.markAsUntouched();
  }

  seleccionarEntidad(opcion: BuscarEntidadOpcion): void {
    this.form.controls.entidadId.setValue(opcion.id);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.#dialogRef.close(this.form.getRawValue());
  }

  cancelar(): void {
    this.#dialogRef.close();
  }

  private crearOpcion(
    id: number,
    nombre: string,
    asignacion?: ControlAsignacionArea | ControlAsignacionUnidad | ControlAsignacionUsuario,
  ): BuscarEntidadOpcion {
    return {
      id,
      nombre,
      bloqueada: Boolean(asignacion),
      detalleBloqueo: asignacion ? `Ya usa Control #${asignacion.controlId}` : undefined,
    };
  }

  private buscarAsignacionArea(areaId: number): ControlAsignacionArea | undefined {
    return this.data.controles.flatMap((control) => control.areas).find((item) => item.areaId === areaId);
  }

  private buscarAsignacionUnidad(unidadId: number): ControlAsignacionUnidad | undefined {
    return this.data.controles.flatMap((control) => control.unidades).find((item) => item.unidadId === unidadId);
  }

  private buscarAsignacionUsuario(usuarioId: number): ControlAsignacionUsuario | undefined {
    return this.data.controles.flatMap((control) => control.usuarios).find((item) => item.usuarioId === usuarioId);
  }
}
