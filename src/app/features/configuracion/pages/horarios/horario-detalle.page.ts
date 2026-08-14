import { Component, computed, inject, signal } from '@angular/core';
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
import {
  HorarioDetalle,
  OperationResult,
} from '../../../../core/interfaces/horario.interface';

@Component({
  selector: 'horario-detalle-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, RouterLink],
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

        <!-- ========== DÍAS Y TURNOS AGRUPADOS POR VIGENCIA ========== -->
        @if (!gruposDias().length) {
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <h2 class="card-title">Días y turnos</h2>
              <p class="text-sm text-base-content/60 py-4">
                El horario no tiene días configurados.
              </p>
            </div>
          </div>
        } @else {
          @for (grupo of gruposDias(); track grupo.key) {
            <div class="card bg-base-100 border border-base-300">
              <div class="card-body">
                <h2 class="card-title">
                  @if (grupo.etiqueta) {
                    <span class="badge badge-info badge-lg">
                      {{ grupo.etiqueta }}
                    </span>
                  } @else {
                    Días y turnos
                  }
                </h2>

                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Turnos</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (d of grupo.dias; track d.horarioDiaId) {
                        <tr>
                          <td>{{ d.diaNombre }}</td>
                          <td>
                            @for (t of d.turnos; track t.turnoId) {
                              <span
                                class="badge badge-outline mr-1"
                                [class.badge-warning]="t.extendido"
                              >
                                {{ t.horaInicio }} - {{ t.horaFin }}
                                @if (t.diaSalida) {
                                  (sale {{ t.diaSalida.diaNombre }})
                                }
                              </span>
                            } @empty {
                              <span class="text-xs text-base-content/50">
                                Sin turnos
                              </span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
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
                        <td>{{ u.fechaInicio }}</td>
                        <td>{{ u.fechaFin ?? 'Indefinida' }}</td>
                        <td class="text-end">
                          <button
                            class="btn btn-xs btn-outline btn-error"
                            [disabled]="desasignando() === u.horarioAsignacionId"
                            (click)="desasignar(u)"
                            aria-label="Desasignar usuario"
                          >
                            <fa-icon
                              [icon]="iconService.faUserMinus"
                            ></fa-icon>
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
  #horariosService = inject(HorariosService);
  #route = inject(ActivatedRoute);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);

  public loading = signal(true);
  public detalle = signal<HorarioDetalle | null>(null);
  public desasignando = signal<number | null>(null);

  public gruposDias = computed(() => {
    const h = this.detalle();
    if (!h) {
      return [];
    }
    if (h.rotativo) {
      return h.grupos.map((g) => ({
        key: `g${g.vigenciaGrupoId}`,
        etiqueta: `${g.fechaInicio ?? '?'} - ${g.fechaFin ?? 'indefinida'}`,
        dias: g.dias,
      }));
    }
    return [{ key: 'todos', etiqueta: '', dias: h.dias }];
  });

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
        takeUntilDestroyed(),
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
      .pipe(takeUntilDestroyed())
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
            takeUntilDestroyed(),
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

  desasignar(u: {
    horarioAsignacionId: number;
    usuarioId: number;
    nombres: string;
    apellidos: string;
  }): void {
    if (!this.horarioId) {
      return;
    }
    this.desasignando.set(u.horarioAsignacionId);
    this.#horariosService
      .desasignarUsuario(this.horarioId, u.usuarioId)
      .pipe(
        takeUntilDestroyed(),
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
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }
}
