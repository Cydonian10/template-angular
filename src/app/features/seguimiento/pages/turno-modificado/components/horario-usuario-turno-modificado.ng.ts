import { Component, input, output } from '@angular/core';
import {
  HorarioDetalle,
  HorarioTurno,
  UsuarioHorarioAsignacion,
} from '../../../../../core/interfaces/horario.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';

interface Matriz {
  key: string;
  etiqueta: string;
  columnas: Array<{ diaId: number; diaNombre: string; turnos: HorarioTurno[] }>;
}

@Component({
  selector: 'horario-usuario-turno-modificado',
  template: `
    @if (usuario(); as user) {
      <section class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="card-title">Horario de {{ userName(user) }}</h2>
              <p class="text-sm text-base-content/60">
                Selecciona un turno para registrar una modificación.
              </p>
            </div>
            @if (loading()) {
              <span class="loading loading-spinner text-primary"></span>
            }
          </div>
          @if (!loading() && !assignment()) {
            <div role="alert" class="alert alert-warning">
              <span>Este usuario no tiene un horario activo.</span>
            </div>
          }
          @if (assignment(); as active) {
            <div class="rounded-box border border-info/40 bg-base-200 p-4">
              <div
                class="mb-4 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h3 class="font-semibold">{{ active.horarioNombre }}</h3>
                  <p class="text-sm text-base-content/60">
                    Vigente desde {{ formatDate(active.fechaInicio) }}
                  </p>
                </div>
                <span class="badge badge-info">Activo</span>
              </div>
              @if (detail(); as schedule) {
                @for (matrix of matrices(schedule); track matrix.key) {
                  <div class="mb-4">
                    @if (matrix.etiqueta) {
                      <p class="mb-2 text-sm font-medium">
                        Vigencia: {{ matrix.etiqueta }}
                      </p>
                    }
                    <div
                      class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
                    >
                      @for (day of matrix.columnas; track day.diaId) {
                        <div
                          class="rounded-box border border-base-300 bg-base-100 p-2"
                        >
                          <p class="text-center text-sm font-semibold">
                            {{ day.diaNombre }}
                          </p>
                          <div class="mt-2 space-y-1">
                            @for (turn of day.turnos; track turn.turnoId) {
                              <button
                                type="button"
                                class="btn btn-sm btn-block font-mono"
                                (click)="turnSelected.emit(turn)"
                              >
                                {{ formatTime(turn.horaInicio) }} -
                                {{ formatTime(turn.horaFin) }}
                              </button>
                            } @empty {
                              <p
                                class="py-1 text-center text-xs text-base-content/50"
                              >
                                Libre
                              </p>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              } @else if (!loading()) {
                <p class="text-sm text-base-content/60">
                  No se pudo cargar el detalle del horario.
                </p>
              }
            </div>
          }
        </div>
      </section>
    }
  `,
})
export default class HorarioUsuarioTurnoModificado {
  usuario = input<Usuario | null>(null);
  assignment = input<UsuarioHorarioAsignacion | null>(null);
  detail = input<HorarioDetalle | null>(null);
  loading = input(false);
  turnSelected = output<HorarioTurno>();
  userName(user: Usuario): string {
    return `${user.nombres} ${user.apellidos}`.trim() || user.usuario;
  }
  formatDate(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  formatTime(value: string): string {
    return value.slice(0, 5);
  }
  matrices(detail: HorarioDetalle): Matriz[] {
    const groups = detail.rotativo
      ? detail.grupos.map((group) => ({
          key: `grupo-${group.vigenciaGrupoId}`,
          etiqueta: `${this.formatDate(group.fechaInicio)} - ${this.formatDate(group.fechaFin)}`,
          dias: group.dias,
        }))
      : [{ key: 'semanal', etiqueta: '', dias: detail.dias }];
    return groups.map((group) => ({
      key: group.key,
      etiqueta: group.etiqueta,
      columnas: [...group.dias]
        .sort((a, b) => a.orden - b.orden)
        .map((day) => ({
          diaId: day.diaId,
          diaNombre: day.diaNombre,
          turnos: day.turnos,
        })),
    }));
  }
}
