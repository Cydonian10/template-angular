import { Component, input, output } from '@angular/core';
import {
  HorarioDetalle,
  UsuarioHorarioAsignacion,
} from '../../../../../core/interfaces/horario.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';

@Component({
  selector: 'horario-usuario-turno-modificado',
  host: { class: 'block' },
  template: `
    @if (usuario(); as user) {
      <section class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="card-title">Horario de {{ userName(user) }}</h2>
              <p class="text-sm text-base-content/60">
                Registra una modificación eligiendo primero la fecha.
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
              @if (detail()) {
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="text-sm text-base-content/60">
                    Los turnos disponibles se mostrarán según la fecha elegida.
                  </p>
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="nuevaModificacion.emit()"
                  >
                    Nueva modificación
                  </button>
                </div>
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
  nuevaModificacion = output<void>();
  userName(user: Usuario): string {
    return `${user.nombres} ${user.apellidos}`.trim() || user.usuario;
  }
  formatDate(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
}
