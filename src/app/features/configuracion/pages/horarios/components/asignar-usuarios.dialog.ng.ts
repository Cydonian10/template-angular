import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { UsuariosService } from '../../../../../api/usuarios.service';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';
import { Horario } from '../../../../../core/interfaces/horario.interface';

export interface AsignarUsuariosDialogData {
  horario: Horario;
}

export interface AsignarUsuariosDialogResult {
  usuarioIds: number[];
  fechaInicio: string;
  fechaFin?: string | null;
}

@Component({
  selector: 'asignar-usuarios-dialog',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 w-full border border-base-300 shadow-xl">
      <div class="card-body gap-4 max-h-[85vh] overflow-y-auto">
        <h2 class="card-title">Asignar usuarios</h2>
        <p class="text-sm text-base-content/70">
          Horario: <strong>{{ data.horario.nombre }}</strong>
        </p>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!usuarios().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay usuarios disponibles en el área del horario.
          </p>
        } @else {
          <div class="flex flex-wrap gap-2">
            @for (u of usuarios(); track u.usuarioId) {
              <label
                class="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  [checked]="seleccionados().has(u.usuarioId)"
                  (change)="toggle(u.usuarioId)"
                />
                {{ u.nombres }} {{ u.apellidos }} ({{ u.usuario }})
              </label>
            }
          </div>

          @if (seleccionados().size) {
            <div class="grid grid-cols-2 gap-2">
              <label class="label">Fecha inicio *</label>
              <label class="label">Fecha fin (opcional)</label>
              <input
                type="date"
                class="input input-sm w-full"
                [value]="fechaInicio()"
                (change)="setFecha('inicio', $event)"
              />
              <input
                type="date"
                class="input input-sm w-full"
                [value]="fechaFin()"
                (change)="setFecha('fin', $event)"
              />
            </div>
            @if (fechaInicio() && fechaFin() && fechaFin() < fechaInicio()) {
              <p class="text-error text-xs">
                La fecha fin no puede ser anterior a la fecha inicio.
              </p>
            }
          }

          <div class="card-actions justify-end pt-2">
            <button class="btn btn-ghost" (click)="cancelar()">Cancelar</button>
            <button
              class="btn btn-primary"
              [disabled]="!seleccionados().size || !fechaInicio() || (fechaFin() !== '' && fechaFin() < fechaInicio())"
              (click)="guardar()"
            >
              Asignar
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export default class AsignarUsuariosDialog {
  public data = inject<AsignarUsuariosDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<AsignarUsuariosDialogResult>);
  #usuariosService = inject(UsuariosService);
  #toastr = inject(ToastrService);
  public iconService = inject(FontIconService);

  public loading = signal(true);
  public usuarios = signal<Usuario[]>([]);
  public seleccionados = signal<Set<number>>(new Set());
  public fechaInicio = signal('');
  public fechaFin = signal('');

  constructor() {
    this.#usuariosService
      .listar({ areaId: this.data.horario.areaId })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        error: () =>
          this.#toastr.error(
            'No se pudieron cargar los usuarios del área',
          ),
      })
      .add(() => this.loading.set(false));
  }

  toggle(usuarioId: number): void {
    this.seleccionados.update((sel) => {
      const next = new Set(sel);
      if (next.has(usuarioId)) {
        next.delete(usuarioId);
      } else {
        next.add(usuarioId);
      }
      return next;
    });
  }

  setFecha(campo: 'inicio' | 'fin', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (campo === 'inicio') {
      this.fechaInicio.set(value);
    } else {
      this.fechaFin.set(value);
    }
  }

  guardar(): void {
    this.#dialogRef.close({
      usuarioIds: [...this.seleccionados()],
      fechaInicio: this.fechaInicio(),
      fechaFin: this.fechaFin() || null,
    } as AsignarUsuariosDialogResult);
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
