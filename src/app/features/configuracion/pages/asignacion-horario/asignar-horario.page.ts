import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { HorariosService } from '../../../../api/horarios.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import {
  Horario,
  HorarioDetalle,
  HorarioTurno,
  OperationResult,
  UsuarioHorarioAsignacion,
} from '../../../../core/interfaces/horario.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';

interface ColumnaDia {
  diaId: number;
  diaNombre: string;
  turnos: HorarioTurno[];
  horas: number;
}

interface MatrizSemana {
  key: string;
  etiqueta: string;
  columnas: ColumnaDia[];
  totalSemana: number;
}

@Component({
  selector: 'asignar-horario-page',
  imports: [CommonModule, FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold">Asignar horario</h1>
          @if (usuario()) {
            <p class="text-sm text-base-content/60">
              {{ usuario()!.nombres }} {{ usuario()!.apellidos }} ({{ usuario()!.usuario }})
              · {{ usuario()!.areaNombre }}
            </p>
          }
        </div>
        <button type="button" class="btn" (click)="volver()">
          <fa-icon [icon]="iconService.faArrowLeft"></fa-icon>
          Volver
        </button>
      </div>

      @if (!usuario()) {
        <div role="alert" class="alert alert-warning">
          <fa-icon [icon]="iconService.faWarning"></fa-icon>
          <span>No se encontró la información del usuario. Vuelve al listado e inténtalo nuevamente.</span>
        </div>
      } @else if (loading()) {
        <div class="flex justify-center py-10">
          <fa-icon [icon]="iconService.faSpinner" [animation]="'spin'" class="text-2xl text-primary"></fa-icon>
        </div>
      } @else {
        <section class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-semibold">Horario actual</h2>
              <p class="text-sm text-base-content/60">Consulta las asignaciones vigentes antes de realizar un cambio.</p>
            </div>
            <span class="badge">{{ asignacionesActivas().length }} activo(s)</span>
          </div>

          @if (!asignacionesActivas().length) {
            <div class="card border border-base-300 bg-base-100">
              <div class="card-body py-5">
                <p class="text-sm text-base-content/60">El usuario no tiene un horario activo.</p>
              </div>
            </div>
          } @else {
            @for (asignacion of asignacionesActivas(); track asignacion.horarioAsignacionId) {
              <div class="card border border-info/40 bg-base-100">
                <div class="card-body gap-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 class="card-title text-base">{{ asignacion.horarioNombre }}</h3>
                      <p class="text-sm text-base-content/60">
                        Desde {{ formatFecha(asignacion.fechaInicio) || 'sin fecha de inicio' }}
                        @if (asignacion.fechaFin) { · Hasta {{ formatFecha(asignacion.fechaFin) }} }
                      </p>
                    </div>
                    <span class="badge badge-info">Activo</span>
                  </div>

                  @if (detallesActuales()[asignacion.horarioId]; as detalle) {
                    <ng-container [ngTemplateOutlet]="vistaHorario" [ngTemplateOutletContext]="{ $implicit: detalle }" />
                  } @else {
                    <p class="text-sm text-base-content/60">No se pudo cargar la vista previa de este horario.</p>
                  }

                  <div class="flex flex-wrap items-end gap-2 border-t border-base-300 pt-3">
                    @if (editandoId() === asignacion.horarioAsignacionId) {
                      <fieldset class="fieldset w-full max-w-xs">
                        <legend class="fieldset-legend">Nueva fecha fin</legend>
                        <input type="date" class="input w-full" [value]="nuevaFechaFin()" [min]="asignacion.fechaInicio ?? ''" (change)="setNuevaFechaFin($event)" />
                      </fieldset>
                      <button type="button" class="btn btn-sm" [disabled]="guardandoId() === asignacion.horarioAsignacionId || fechaFinInvalida(asignacion)" (click)="guardarFecha(asignacion)">
                        <fa-icon [icon]="iconService.faSave"></fa-icon> Guardar fecha
                      </button>
                      <button type="button" class="btn btn-sm" [disabled]="guardandoId() === asignacion.horarioAsignacionId" (click)="cancelarEdicion()">Cancelar</button>
                      @if (fechaFinInvalida(asignacion)) { <p class="text-error text-xs">La fecha fin no puede ser anterior a la fecha inicio.</p> }
                    } @else {
                      <button type="button" class="btn btn-sm" (click)="editarFecha(asignacion)">
                        <fa-icon [icon]="iconService.faPencil"></fa-icon> Editar fecha
                      </button>
                      <button type="button" class="btn btn-sm btn-success" [disabled]="culminandoId() === asignacion.horarioAsignacionId" (click)="culminar(asignacion)">
                        <fa-icon [icon]="iconService.faCheck"></fa-icon> Culminar horario
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </section>

        <section class="card border border-base-300 bg-base-100">
          <div class="card-body gap-5">
            <div>
              <h2 class="card-title">Asignar nuevo horario</h2>
              <p class="text-sm text-base-content/60">Selecciona un horario para revisar sus turnos antes de asignarlo.</p>
            </div>

            @if (!puedeAsignar()) {
              <div role="alert" class="alert alert-warning">
                <fa-icon [icon]="iconService.faWarning"></fa-icon>
                <span>Primero debes culminar todos los horarios actuales del usuario.</span>
              </div>
            }

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3" [class.opacity-50]="!puedeAsignar()">
              <fieldset class="fieldset md:col-span-3">
                <legend class="fieldset-legend">Horario *</legend>
                <select class="select w-full" [value]="horarioId() ?? ''" [disabled]="!puedeAsignar()" (change)="seleccionarHorario($event)">
                  <option value="" disabled>Selecciona un horario</option>
                  @for (horario of horarios(); track horario.horarioId) {
                    <option [value]="horario.horarioId">{{ horario.nombre }}</option>
                  }
                </select>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Fecha inicio *</legend>
                <input type="date" class="input w-full" [value]="fechaInicio()" [disabled]="!puedeAsignar()" (change)="setFecha('inicio', $event)" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Fecha fin (opcional)</legend>
                <input type="date" class="input w-full" [value]="fechaFin()" [disabled]="!puedeAsignar()" (change)="setFecha('fin', $event)" />
              </fieldset>
            </div>
            @if (fechaInicio() && fechaFin() && fechaFin() < fechaInicio()) { <p class="text-error text-xs">La fecha fin no puede ser anterior a la fecha inicio.</p> }

            @if (!horarios().length) {
              <p class="text-sm text-base-content/60">No hay horarios disponibles en el área del usuario.</p>
            }

            @if (cargandoVistaPrevia()) {
              <div class="flex justify-center py-6"><fa-icon [icon]="iconService.faSpinner" [animation]="'spin'" class="text-xl text-primary"></fa-icon></div>
            } @else {
              @if (horarioSeleccionado(); as detalle) {
                <div class="rounded-box border border-primary/40 bg-base-200 p-4">
                  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 class="font-semibold">Vista previa: {{ detalle.nombre }}</h3>
                    <span class="badge badge-primary">Nuevo horario</span>
                  </div>
                  <ng-container [ngTemplateOutlet]="vistaHorario" [ngTemplateOutletContext]="{ $implicit: detalle }" />
                </div>
              }
            }

            <div class="card-actions justify-end">
              <button type="button" class="btn" (click)="volver()">Cancelar</button>
              <button type="button" class="btn btn-primary" [disabled]="!puedeAsignar() || !horarioId() || !fechaInicio() || (fechaFin() !== '' && fechaFin() < fechaInicio()) || asignando()" (click)="asignar()">
                <fa-icon [icon]="iconService.faUserPlus"></fa-icon> Asignar horario
              </button>
            </div>
          </div>
        </section>
      }
    </div>

    <ng-template #vistaHorario let-detalle>
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <span class="badge">{{ detalle.horasLaborales }} horas</span>
          @if (detalle.rotativo) { <span class="badge badge-info">Rotativo</span> }
          @else if (detalle.extendido) { <span class="badge badge-warning">Extendido</span> }
          @else { <span class="badge">Regular</span> }
        </div>
        @for (matriz of matricesSemana(detalle); track matriz.key) {
          <div class="space-y-2">
            @if (matriz.etiqueta) { <p class="text-sm font-medium">Vigencia: {{ matriz.etiqueta }}</p> }
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              @for (dia of matriz.columnas; track dia.diaId) {
                <div class="rounded-box border border-base-300 bg-base-100 p-2">
                  <p class="text-center text-sm font-semibold">{{ dia.diaNombre }}</p>
                  <div class="mt-2 space-y-1">
                    @for (turno of dia.turnos; track turno.turnoId) {
                      <p class="rounded bg-base-200 px-1 py-0.5 text-center font-mono text-xs" [class]="turno.extendido ? 'bg-warning/20 text-warning' : ''">
                        {{ formatHora(turno.horaInicio) }} - {{ formatHora(turno.horaFin) }}
                        @if (turno.diaSalida) { <span class="block text-[10px] opacity-70">sale {{ turno.diaSalida.diaNombre }}</span> }
                      </p>
                    } @empty { <p class="py-1 text-center text-xs text-base-content/50">Libre</p> }
                  </div>
                  <p class="mt-2 border-t border-base-300 pt-1 text-center text-xs font-semibold">{{ dia.horas | number: '1.1-1' }}h</p>
                </div>
              }
            </div>
            <p class="text-right text-sm font-semibold">Total semanal: {{ matriz.totalSemana | number: '1.1-1' }}h</p>
          </div>
        } @empty { <p class="text-sm text-base-content/60">El horario no tiene días configurados.</p> }
      </div>
    </ng-template>
  `,
})
export default class AsignarHorarioPage {
  public iconService = inject(FontIconService);
  #destroyRef = inject(DestroyRef);
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #dialog = inject(Dialog);
  #usuariosService = inject(UsuariosService);
  #horariosService = inject(HorariosService);
  #toastr = inject(ToastrService);

  public usuario = signal<Usuario | null>(history.state['usuario'] ?? null);
  public loading = signal(true);
  public asignaciones = signal<UsuarioHorarioAsignacion[]>([]);
  public horarios = signal<Horario[]>([]);
  public detallesActuales = signal<Record<number, HorarioDetalle>>({});
  public horarioId = signal<number | null>(null);
  public horarioSeleccionado = signal<HorarioDetalle | null>(null);
  public cargandoVistaPrevia = signal(false);
  public fechaInicio = signal('');
  public fechaFin = signal('');
  public culminandoId = signal<number | null>(null);
  public asignando = signal(false);
  public editandoId = signal<number | null>(null);
  public nuevaFechaFin = signal('');
  public guardandoId = signal<number | null>(null);

  public asignacionesActivas = computed(() =>
    this.asignaciones().filter((asignacion) => asignacion.estado === 'activo'),
  );
  public puedeAsignar = computed(() =>
    this.asignaciones().every((asignacion) => asignacion.culminacion),
  );

  constructor() {
    const usuarioId = Number(this.#route.snapshot.params['usuarioId']);
    if (!Number.isFinite(usuarioId)) {
      this.loading.set(false);
      return;
    }
    if (this.usuario()?.usuarioId === usuarioId) {
      this.cargar();
      return;
    }
    this.#usuariosService.obtenerPorId(usuarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (usuarios) => {
          const usuario = usuarios[0];
          if (!usuario) {
            this.loading.set(false);
            return;
          }
          this.usuario.set(usuario);
          this.cargar();
        },
        error: () => {
          this.loading.set(false);
          this.#toastr.error('No se pudo cargar la información del usuario');
        },
      });
  }

  cargar(): void {
    const usuario = this.usuario();
    if (!usuario) return;
    this.loading.set(true);
    forkJoin({
      asignaciones: this.#usuariosService.listarHorarios(usuario.usuarioId),
      horarios: this.#horariosService.listar(usuario.areaId),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ asignaciones, horarios }) => {
          this.asignaciones.set(asignaciones);
          this.horarios.set(horarios);
          this.cargarDetallesActuales(asignaciones);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.#toastr.error('No se pudieron cargar los horarios del usuario');
        },
      });
  }

  cargarDetallesActuales(asignaciones: UsuarioHorarioAsignacion[]): void {
    const ids = [...new Set(asignaciones.filter((a) => a.estado === 'activo').map((a) => a.horarioId))];
    if (!ids.length) return;
    forkJoin(ids.map((id) => this.#horariosService.obtenerPorId(id)))
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (detalles) => this.detallesActuales.set(Object.fromEntries(detalles.map((detalle) => [detalle.horarioId, detalle]))),
        error: () => this.#toastr.error('No se pudo cargar la vista previa del horario actual'),
      });
  }

  seleccionarHorario(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const horarioId = value ? Number(value) : null;
    this.horarioId.set(horarioId);
    this.horarioSeleccionado.set(null);
    if (!horarioId) return;
    this.cargandoVistaPrevia.set(true);
    this.#horariosService.obtenerPorId(horarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (detalle) => {
          if (this.horarioId() === horarioId) this.horarioSeleccionado.set(detalle);
          this.cargandoVistaPrevia.set(false);
        },
        error: () => {
          this.cargandoVistaPrevia.set(false);
          this.#toastr.error('No se pudo cargar la vista previa del horario');
        },
      });
  }

  setFecha(campo: 'inicio' | 'fin', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    campo === 'inicio' ? this.fechaInicio.set(value) : this.fechaFin.set(value);
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
    return !!this.nuevaFechaFin() && !!asignacion.fechaInicio && this.nuevaFechaFin() < asignacion.fechaInicio;
  }

  guardarFecha(asignacion: UsuarioHorarioAsignacion): void {
    if (this.fechaFinInvalida(asignacion)) return;
    this.guardandoId.set(asignacion.horarioAsignacionId);
    this.#horariosService.actualizarAsignacion(asignacion.horarioAsignacionId, this.nuevaFechaFin() || null)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (resultado) => {
          this.guardandoId.set(null);
          if (resultado.State === 1) {
            this.#toastr.success(resultado.Message);
            this.cancelarEdicion();
            this.cargar();
          } else this.#toastr.error(resultado.Message);
        },
        error: () => {
          this.guardandoId.set(null);
          this.#toastr.error('No se pudo actualizar la fecha fin del horario');
        },
      });
  }

  culminar(asignacion: UsuarioHorarioAsignacion): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Culminar horario',
      mensaje: `¿Marcar como culminado el horario "${asignacion.horarioNombre}"?`,
      textoConfirmar: 'Culminar',
    });
    ref.closed.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((resultado) => {
      if (!resultado?.confirmado) return;
      this.culminandoId.set(asignacion.horarioAsignacionId);
      this.#horariosService.culminarAsignacion(asignacion.horarioAsignacionId)
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: (respuesta: OperationResult) => {
            this.culminandoId.set(null);
            if (respuesta.State === 1) {
              this.#toastr.success(respuesta.Message);
              this.cargar();
            } else this.#toastr.error(respuesta.Message);
          },
          error: () => {
            this.culminandoId.set(null);
            this.#toastr.error('No se pudo culminar el horario');
          },
        });
    });
  }

  asignar(): void {
    const usuario = this.usuario();
    const horarioId = this.horarioId();
    if (!usuario || !horarioId) return;
    this.asignando.set(true);
    this.#horariosService.asignarUsuarios(horarioId, {
      usuarioIds: [usuario.usuarioId],
      fechaInicio: this.fechaInicio(),
      fechaFin: this.fechaFin() || null,
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (resultado: OperationResult) => {
          this.asignando.set(false);
          if (resultado.State === 1) {
            this.#toastr.success(resultado.Message);
            this.volver();
          } else this.#toastr.error(resultado.Message);
        },
        error: () => {
          this.asignando.set(false);
          this.#toastr.error('No se pudo asignar el horario');
        },
      });
  }

  matricesSemana(detalle: HorarioDetalle): MatrizSemana[] {
    const grupos = detalle.rotativo
      ? detalle.grupos.map((grupo) => ({
          key: `grupo-${grupo.vigenciaGrupoId}`,
          etiqueta: `${this.formatFecha(grupo.fechaInicio)} - ${this.formatFecha(grupo.fechaFin) || 'indefinida'}`,
          dias: grupo.dias,
        }))
      : [{ key: 'semanal', etiqueta: '', dias: detalle.dias }];
    return grupos.map((grupo) => {
      const columnas = [...grupo.dias].sort((a, b) => a.orden - b.orden).map((dia) => ({
        diaId: dia.diaId,
        diaNombre: dia.diaNombre,
        turnos: dia.turnos,
        horas: dia.turnos.reduce((total, turno) => total + this.calcularHorasTurno(turno), 0),
      }));
      return { key: grupo.key, etiqueta: grupo.etiqueta, columnas, totalSemana: columnas.reduce((total, dia) => total + dia.horas, 0) };
    });
  }

  formatFecha(iso: string | null | undefined): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return iso;
    return `${fecha.getUTCDate().toString().padStart(2, '0')}/${(fecha.getUTCMonth() + 1).toString().padStart(2, '0')}/${fecha.getUTCFullYear()}`;
  }

  formatHora(value: string): string {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (match) return `${match[1]}:${match[2]}`;
    const fecha = new Date(value);
    return Number.isNaN(fecha.getTime()) ? value : `${fecha.getUTCHours().toString().padStart(2, '0')}:${fecha.getUTCMinutes().toString().padStart(2, '0')}`;
  }

  calcularHorasTurno(turno: HorarioTurno): number {
    const inicio = new Date(`1970-01-01T${this.formatHora(turno.horaInicio)}:00Z`);
    let fin = new Date(`1970-01-01T${this.formatHora(turno.horaFin)}:00Z`);
    if (turno.extendido || fin <= inicio) fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
    return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  }

  volver(): void {
    this.#router.navigate(['/configuracion/asignacion-horario']);
  }
}
