import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { UsuariosService } from '../../../../../api/usuarios.service';
import { HorariosService } from '../../../../../api/horarios.service';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';
import {
  Horario,
  OperationResult,
  UsuarioHorarioAsignacion,
} from '../../../../../core/interfaces/horario.interface';
import { abrirConfirmarDialog } from '../../../../../shared/dialogs/confirmar.dialog.ng';

export interface AsignarHorarioDialogData {
  usuario: Usuario;
}

export interface AsignarHorarioDialogResult {
  cambio: boolean;
}

@Component({
  selector: 'asignar-horario-dialog',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 w-full border border-base-300 shadow-xl">
      <div class="card-body gap-4 max-h-[85vh] overflow-y-auto">
        <h2 class="card-title">Asignar horario</h2>
        <p class="text-sm text-base-content/70">
          Usuario:
          <strong>{{ data.usuario.nombres }} {{ data.usuario.apellidos }}</strong>
          ({{ data.usuario.usuario }}) — {{ data.usuario.areaNombre }}
        </p>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else {
          <!-- ========== HORARIOS ASIGNADOS ========== -->
          <section class="space-y-2">
            <h3 class="text-sm font-semibold">Horarios asignados</h3>

            @if (!asignaciones().length) {
              <p class="text-sm text-base-content/60">
                El usuario no tiene horarios asignados.
              </p>
            } @else {
              @for (a of asignaciones(); track a.horarioAsignacionId) {
                <div
                  class="rounded-lg border border-base-300 bg-base-100 px-3 py-2"
                >
                  @if (editandoId() === a.horarioAsignacionId) {
                    <div class="flex flex-wrap items-center gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-medium">
                          {{ a.horarioNombre }}
                        </p>
                      </div>
                      <label class="label px-0">
                        <span class="label-text">Fecha fin:</span>
                      </label>
                      <input
                        type="date"
                        class="input input-sm input-bordered"
                        [value]="nuevaFechaFin()"
                        [min]="a.fechaInicio ?? ''"
                        [disabled]="guardandoId() === a.horarioAsignacionId"
                        (change)="setNuevaFechaFin($event)"
                      />
                      <button
                        type="button"
                        class="btn btn-xs btn-success"
                        [disabled]="
                          guardandoId() === a.horarioAsignacionId ||
                          fechaFinInvalida(a)
                        "
                        (click)="guardarFecha(a)"
                      >
                        <fa-icon [icon]="iconService.faSave"></fa-icon>
                        Guardar
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost"
                        [disabled]="guardandoId() === a.horarioAsignacionId"
                        (click)="cancelarEdicion()"
                      >
                        Cancelar
                      </button>
                      @if (fechaFinInvalida(a)) {
                        <span class="text-error text-xs">
                          No puede ser anterior a la fecha inicio.
                        </span>
                      }
                    </div>
                  } @else {
                    <div
                      class="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div class="min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ a.horarioNombre }}
                        </p>
                        <p class="text-xs text-base-content/60">
                          {{
                            a.fechaInicio
                              ? 'Desde ' + a.fechaInicio
                              : 'Sin fecha inicio'
                          }}
                          @if (a.fechaFin) {
                            · Hasta {{ a.fechaFin }}
                          }
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="badge badge-sm"
                          [class]="claseEstado(a.estado)"
                        >
                          {{ etiquetaEstado(a.estado) }}
                        </span>
                        @if (!a.culminacion) {
                          <button
                            type="button"
                            class="btn btn-xs btn-outline btn-info"
                            (click)="editarFecha(a)"
                            aria-label="Editar fecha fin"
                          >
                            <fa-icon [icon]="iconService.faPencil"></fa-icon>
                            Editar fecha
                          </button>
                        }
                        <button
                          type="button"
                          class="btn btn-xs btn-outline btn-success"
                          [disabled]="
                            culminandoId() === a.horarioAsignacionId ||
                            a.culminacion
                          "
                          (click)="culminar(a)"
                          aria-label="Marcar como culminado"
                        >
                          <fa-icon [icon]="iconService.faCheck"></fa-icon>
                          Culminar
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </section>

          <!-- ========== ASIGNAR NUEVO HORARIO ========== -->
          <section class="space-y-2">
            <h3 class="text-sm font-semibold">Asignar nuevo horario</h3>

            @if (!puedeAsignar()) {
              <div role="alert" class="alert alert-warning">
                <fa-icon [icon]="iconService.faWarning"></fa-icon>
                <div>
                  <div class="font-semibold text-sm">
                    El usuario aún tiene horarios no culminados.
                  </div>
                  <div class="text-xs">
                    Solo puede asignarse un nuevo horario cuando todos sus
                    horarios están culminados. Marca como culminado cada
                    horario para desbloquear la asignación.
                  </div>
                </div>
              </div>
            }

            <div
              class="grid grid-cols-1 gap-2 sm:grid-cols-2"
              [class.opacity-50]="!puedeAsignar()"
            >
              <fieldset class="fieldset col-span-full">
                <legend class="fieldset-legend">Horario *</legend>
                <select
                  class="select w-full"
                  [value]="horarioId() ?? ''"
                  [disabled]="!puedeAsignar()"
                  (change)="seleccionarHorario($event)"
                >
                  <option [value]="''" disabled>Selecciona un horario</option>
                  @for (h of horarios(); track h.horarioId) {
                    <option [value]="h.horarioId">{{ h.nombre }}</option>
                  }
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Fecha inicio *</legend>
                <input
                  type="date"
                  class="input w-full"
                  [value]="fechaInicio()"
                  [disabled]="!puedeAsignar()"
                  (change)="setFecha('inicio', $event)"
                />
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Fecha fin (opcional)</legend>
                <input
                  type="date"
                  class="input w-full"
                  [value]="fechaFin()"
                  [disabled]="!puedeAsignar()"
                  (change)="setFecha('fin', $event)"
                />
              </fieldset>

              @if (
                fechaInicio() && fechaFin() && fechaFin() < fechaInicio()
              ) {
                <p class="text-error text-xs col-span-full">
                  La fecha fin no puede ser anterior a la fecha inicio.
                </p>
              }
            </div>

            @if (!horarios().length) {
              <p class="text-sm text-base-content/60">
                No hay horarios disponibles en el área del usuario.
              </p>
            }
          </section>

          <div class="card-actions justify-end pt-2">
            <button class="btn btn-ghost" (click)="cancelar()">Cerrar</button>
            <button
              class="btn btn-primary"
              [disabled]="
                !puedeAsignar() ||
                !horarioId() ||
                !fechaInicio() ||
                (fechaFin() !== '' && fechaFin() < fechaInicio()) ||
                asignando()
              "
              (click)="asignar()"
            >
              <fa-icon [icon]="iconService.faUserPlus"></fa-icon>
              Asignar
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export default class AsignarHorarioDialog {
  public data = inject<AsignarHorarioDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<AsignarHorarioDialogResult>);
  #dialog = inject(Dialog);
  #destroyRef = inject(DestroyRef);
  #usuariosService = inject(UsuariosService);
  #horariosService = inject(HorariosService);
  #toastr = inject(ToastrService);
  public iconService = inject(FontIconService);

  public loading = signal(true);
  public asignaciones = signal<UsuarioHorarioAsignacion[]>([]);
  public horarios = signal<Horario[]>([]);
  public horarioId = signal<number | null>(null);
  public fechaInicio = signal('');
  public fechaFin = signal('');
  public culminandoId = signal<number | null>(null);
  public asignando = signal(false);
  public editandoId = signal<number | null>(null);
  public nuevaFechaFin = signal('');
  public guardandoId = signal<number | null>(null);

  public puedeAsignar = computed(() =>
    this.asignaciones().every((a) => a.culminacion),
  );

  constructor() {
    this.#cargar();
  }

  #cargar(): void {
    this.loading.set(true);
    this.#usuariosService
      .listarHorarios(this.data.usuario.usuarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (asignaciones) => this.asignaciones.set(asignaciones),
        error: () =>
          this.#toastr.error('No se pudieron cargar los horarios del usuario'),
      });
    this.#horariosService
      .listar(this.data.usuario.areaId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (horarios) => this.horarios.set(horarios),
        error: () =>
          this.#toastr.error('No se pudieron cargar los horarios del área'),
      })
      .add(() => this.loading.set(false));
  }

  etiquetaEstado(estado: UsuarioHorarioAsignacion['estado']): string {
    if (estado === 'culminado') return 'Culminado';
    if (estado === 'vencido') return 'Vencido';
    return 'Activo';
  }

  claseEstado(estado: UsuarioHorarioAsignacion['estado']): string {
    if (estado === 'culminado') return 'badge-success';
    if (estado === 'vencido') return 'badge-warning';
    return 'badge-primary';
  }

  culminar(asignacion: UsuarioHorarioAsignacion): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Culminar horario',
      mensaje: `¿Marcar como culminado el horario "${asignacion.horarioNombre}"?`,
      textoConfirmar: 'Culminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) {
          return;
        }
        this.culminandoId.set(asignacion.horarioAsignacionId);
        this.#horariosService
          .culminarAsignacion(asignacion.horarioAsignacionId)
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (res: OperationResult) => {
              this.culminandoId.set(null);
              if (res.State === 1) {
                this.#toastr.success(res.Message);
                this.#cargar();
              } else {
                this.#toastr.error(res.Message);
              }
            },
            error: () => {
              this.culminandoId.set(null);
              this.#toastr.error('No se pudo culminar el horario');
            },
          });
      });
  }

  editarFecha(asignacion: UsuarioHorarioAsignacion): void {
    this.editandoId.set(asignacion.horarioAsignacionId);
    this.nuevaFechaFin.set(asignacion.fechaFin ?? '');
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.nuevaFechaFin.set('');
  }

  setNuevaFechaFin(event: Event): void {
    this.nuevaFechaFin.set((event.target as HTMLInputElement).value);
  }

  fechaFinInvalida(asignacion: UsuarioHorarioAsignacion): boolean {
    return (
      !!this.nuevaFechaFin() &&
      !!asignacion.fechaInicio &&
      this.nuevaFechaFin() < asignacion.fechaInicio
    );
  }

  guardarFecha(asignacion: UsuarioHorarioAsignacion): void {
    const fechaFin = this.nuevaFechaFin();
    if (this.fechaFinInvalida(asignacion)) {
      return;
    }
    this.guardandoId.set(asignacion.horarioAsignacionId);
    this.#horariosService
      .actualizarAsignacion(asignacion.horarioAsignacionId, fechaFin || null)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (res: OperationResult) => {
          this.guardandoId.set(null);
          if (res.State === 1) {
            this.#toastr.success(res.Message);
            this.cancelarEdicion();
            this.#cargar();
          } else {
            this.#toastr.error(res.Message);
          }
        },
        error: () => {
          this.guardandoId.set(null);
          this.#toastr.error('No se pudo actualizar la fecha fin del horario');
        },
      });
  }

  seleccionarHorario(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.horarioId.set(value ? Number(value) : null);
  }

  setFecha(campo: 'inicio' | 'fin', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (campo === 'inicio') {
      this.fechaInicio.set(value);
    } else {
      this.fechaFin.set(value);
    }
  }

  asignar(): void {
    const horarioId = this.horarioId();
    if (!horarioId) {
      return;
    }
    this.asignando.set(true);
    this.#horariosService
      .asignarUsuarios(horarioId, {
        usuarioIds: [this.data.usuario.usuarioId],
        fechaInicio: this.fechaInicio(),
        fechaFin: this.fechaFin() || null,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (res: OperationResult) => {
          this.asignando.set(false);
          if (res.State === 1) {
            this.#toastr.success(res.Message);
            this.#dialogRef.close({ cambio: true });
          } else {
            this.#toastr.error(res.Message);
          }
        },
        error: () => {
          this.asignando.set(false);
          this.#toastr.error('No se pudo asignar el horario');
        },
      });
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
