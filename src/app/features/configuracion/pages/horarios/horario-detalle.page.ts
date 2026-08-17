import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { HorariosService } from '../../../../api/horarios.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import AsignarUsuariosDialog, {
  AsignarUsuariosDialogData,
  AsignarUsuariosDialogResult,
} from './components/asignar-usuarios.dialog.ng';
import ConfirmarDialog, {
  abrirConfirmarDialog,
  ConfirmarDialogData,
  ConfirmarDialogResult,
} from '../../../../shared/dialogs/confirmar.dialog.ng';
import {
  HorarioDetalle,
  HorarioTurno,
  OperationResult,
  UsuarioHorario,
} from '../../../../core/interfaces/horario.interface';

interface TurnoMatriz {
  horaInicio: string;
  horaFin: string;
  extendido: boolean;
  diaSalida: { diaId: number; diaNombre: string } | null;
}

interface ColumnaDia {
  diaId: number;
  diaNombre: string;
  turnos: TurnoMatriz[];
  horas: number;
}

interface MatrizSemana {
  key: string;
  etiqueta: string;
  columnas: ColumnaDia[];
  totalSemana: number;
}

@Component({
  selector: 'horario-detalle-page',
  imports: [CommonModule, FontAwesomeModule, BreadcrumbsNg, RouterLink],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">{{ detalle()?.nombre }}</h1>

        <div class="flex items-center gap-2">
          <a class="btn btn-ghost" routerLink="/configuracion/horario-2">
            <fa-icon [icon]="iconService.faArrowLeft"></fa-icon>
            Volver
          </a>
          <button class="btn btn-primary" (click)="asignarUsuarios()">
            <fa-icon [icon]="iconService.faUserPlus"></fa-icon>
            Asignar usuarios
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-6">
          <fa-icon
            [icon]="iconService.faSpinner"
            [animation]="'spin'"
            class="text-2xl text-primary"
          ></fa-icon>
        </div>
      } @else if (detalle()) {
        @let h = detalle()!;
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-ghost">Área: {{ h.areaNombre }}</span>
          <span class="badge badge-ghost">Horas: {{ h.horasLaborales }}</span>
          @if (h.rotativo) {
            <span class="badge badge-info">Rotativo</span>
          } @else if (h.extendido) {
            <span class="badge badge-warning">Extendido</span>
          } @else {
            <span class="badge badge-ghost">Regular</span>
          }
        </div>

        <!-- ========== MATRIZ SEMANAL DE DÍAS Y TURNOS ========== -->
        @if (!matricesSemana().length) {
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <h2 class="card-title">Días y turnos</h2>
              <p class="text-sm text-base-content/60 py-4">
                El horario no tiene días configurados.
              </p>
            </div>
          </div>
        } @else {
          @for (m of matricesSemana(); track m.key) {
            <div class="card bg-base-100 border border-base-300">
              <div class="card-body">
                <h2 class="card-title">
                  @if (m.etiqueta) {
                    <span class="badge badge-info badge-lg">
                      {{ m.etiqueta }}
                    </span>
                  } @else {
                    Días y turnos
                  }
                </h2>

                <div
                  class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
                >
                  @for (c of m.columnas; track c.diaId) {
                    <div
                      class="flex flex-col gap-1 rounded-lg border border-base-300 bg-base-100 p-2"
                    >
                      <div class="text-center text-sm font-semibold">
                        {{ c.diaNombre }}
                      </div>

                      <div class="flex flex-1 flex-col justify-start gap-1">
                        @for (t of c.turnos; track $index) {
                          <div
                            class="rounded bg-base-200 px-1 py-0.5 text-center font-mono text-xs"
                            [class]="
                              t.extendido ? 'bg-warning/20 text-warning' : ''
                            "
                            title="Turno extendido"
                          >
                            {{ t.horaInicio }} - {{ t.horaFin }}
                            @if (t.diaSalida) {
                              <span class="block text-[10px] opacity-70">
                                sale {{ t.diaSalida.diaNombre }}
                              </span>
                            }
                          </div>
                        } @empty {
                          <p
                            class="py-2 text-center text-xs text-base-content/40"
                          >
                            Libre
                          </p>
                        }
                      </div>

                      <div
                        class="mt-1 border-t border-base-300 pt-1 text-center text-xs font-bold"
                      >
                        {{ c.horas | number: '1.1-1' }}h
                      </div>
                    </div>
                  }
                </div>

                <div
                  class="flex items-center justify-end gap-2 border-t border-base-300 pt-3"
                >
                  <span class="text-sm font-semibold">Total semanal:</span>
                  <span class="badge badge-primary">
                    {{ m.totalSemana | number: '1.1-1' }}h
                  </span>
                </div>
              </div>
            </div>
          }
        }

        <!-- ========== USUARIOS ASIGNADOS ========== -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <h2 class="card-title">
              Usuarios asignados ({{ h.usuarios.length }})
            </h2>

            @if (!h.usuarios.length) {
              <p class="text-sm text-base-content/60 py-4">
                No hay usuarios asignados a este horario.
              </p>
            } @else {
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombres</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of h.usuarios; track u.horarioAsignacionId) {
                      <tr>
                        <td>{{ u.usuario }}</td>
                        <td>{{ u.nombres }} {{ u.apellidos }}</td>
                        <td>{{ formatFecha(u.fechaInicio) }}</td>
                        <td>{{ formatFecha(u.fechaFin) || 'Indefinida' }}</td>
                        <td class="text-end">
                          <button
                            class="btn btn-xs btn-outline btn-error"
                            [disabled]="
                              desasignando() === u.horarioAsignacionId
                            "
                            (click)="desasignar(u)"
                            aria-label="Desasignar usuario"
                          >
                            <fa-icon [icon]="iconService.faUserMinus"></fa-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      } @else {
        <p class="text-sm text-base-content/60 py-4">
          No se encontró el horario.
        </p>
      }
    </div>
  `,
})
export default class HorarioDetallePage {
  public iconService = inject(FontIconService);
  #destroyRef = inject(DestroyRef);
  #horariosService = inject(HorariosService);
  #route = inject(ActivatedRoute);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);

  public loading = signal(true);
  public detalle = signal<HorarioDetalle | null>(null);
  public desasignando = signal<number | null>(null);

  public matricesSemana = computed<MatrizSemana[]>(() => {
    const h = this.detalle();
    if (!h) {
      return [];
    }
    const grupos = h.rotativo
      ? h.grupos.map((g) => ({
          key: `g${g.vigenciaGrupoId}`,
          etiqueta: `${this.formatFecha(g.fechaInicio)} - ${this.formatFecha(g.fechaFin) || 'indefinida'}`,
          dias: g.dias,
        }))
      : [{ key: 'todos', etiqueta: '', dias: h.dias }];

    return grupos.map((g) => {
      const columnas: ColumnaDia[] = [...g.dias]
        .sort((a, b) => a.orden - b.orden)
        .map((dia) => ({
          diaId: dia.diaId,
          diaNombre: dia.diaNombre,
          turnos: dia.turnos.map((t) => ({
            horaInicio: this.#formatHora(t.horaInicio),
            horaFin: this.#formatHora(t.horaFin),
            extendido: t.extendido,
            diaSalida: t.diaSalida,
          })),
          horas: dia.turnos.reduce(
            (sum, t) => sum + this.#calcularHorasTurno(t),
            0,
          ),
        }));
      const totalSemana = columnas.reduce((sum, c) => sum + c.horas, 0);
      return { key: g.key, etiqueta: g.etiqueta, columnas, totalSemana };
    });
  });

  #formatHora(value: string): string {
    if (!value) return '';
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (match) return `${match[1]}:${match[2]}`;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const h = date.getUTCHours().toString().padStart(2, '0');
    const m = date.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  formatFecha(iso: string | null | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }

  #calcularHorasTurno(turno: HorarioTurno): number {
    if (!turno.horaInicio || !turno.horaFin) {
      return 0;
    }
    const inicio = new Date(
      `1970-01-01T${this.#formatHora(turno.horaInicio)}:00Z`,
    );
    let fin = new Date(`1970-01-01T${this.#formatHora(turno.horaFin)}:00Z`);
    if (turno.extendido || fin <= inicio) {
      fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
    }
    return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  }

  private get horarioId(): number | null {
    const id = Number(this.#route.snapshot.params['id']);
    return Number.isFinite(id) ? id : null;
  }

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    if (!this.horarioId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.#horariosService
      .obtenerPorId(this.horarioId)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        catchError(() => {
          this.#toastr.error('No se pudo cargar el horario');
          return EMPTY;
        }),
      )
      .subscribe({
        next: (h) => this.detalle.set(h),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false),
      });
  }

  asignarUsuarios(): void {
    const horario = this.detalle();
    if (!horario) {
      return;
    }
    const ref = this.#dialog.open<AsignarUsuariosDialogResult>(
      AsignarUsuariosDialog,
      {
        data: { horario } as AsignarUsuariosDialogData,
        disableClose: true,
        width: '640px',
      },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.#horariosService
          .asignarUsuarios(horario.horarioId, {
            usuarioIds: result.usuarioIds,
            fechaInicio: result.fechaInicio,
            fechaFin: result.fechaFin,
          })
          .pipe(
            takeUntilDestroyed(this.#destroyRef),
            tap((res) => this.procesarResultado(res)),
            tap((res) => {
              if (res.State === 1) {
                this.cargar();
              }
            }),
            catchError(() => {
              this.#toastr.error('Error al asignar usuarios');
              return EMPTY;
            }),
          )
          .subscribe();
      });
  }

  desasignar(u: UsuarioHorario): void {
    const horarioId = this.horarioId;
    if (!horarioId) {
      return;
    }

    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Desasignar usuario',
      mensaje: `¿Seguro que deseas desasignar a ${u.nombres} ${u.apellidos} del horario?`,
      textoConfirmar: 'Desasignar',
    });

    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) {
          return;
        }
        this.desasignando.set(u.horarioAsignacionId);
        this.#horariosService
          .desasignarUsuario(horarioId, u.usuarioId)
          .pipe(
            takeUntilDestroyed(this.#destroyRef),
            tap((res) => this.procesarResultado(res)),
            tap((res) => {
              if (res.State === 1) {
                this.cargar();
              }
            }),
            catchError(() => {
              this.#toastr.error('Error al desasignar el usuario');
              return EMPTY;
            }),
            finalize(() => this.desasignando.set(null)),
          )
          .subscribe();
      });
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }
}
