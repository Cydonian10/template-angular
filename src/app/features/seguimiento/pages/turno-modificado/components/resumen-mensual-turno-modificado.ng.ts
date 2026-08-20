import { Component, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { ResumenModificacion } from './turno-modificado.types';

@Component({
  selector: 'resumen-mensual-turno-modificado',
  imports: [FontAwesomeModule],
  template: `
    <section class="card border border-base-300 bg-base-100">
      <div class="card-body gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="card-title">Turnos modificados</h2>
            <p class="text-sm text-base-content/60">
              Modificaciones del usuario seleccionado.
            </p>
          </div>
          <div class="join">
            <button
              type="button"
              class="btn btn-sm join-item"
              (click)="monthChange.emit(-1)"
              aria-label="Mes anterior"
            >
              ‹</button
            ><span class="btn btn-sm join-item pointer-events-none">{{
              monthName()
            }}</span
            ><button
              type="button"
              class="btn btn-sm join-item"
              (click)="monthChange.emit(1)"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>
        @if (loading()) {
          <div class="flex justify-center py-8">
            <span
              class="loading loading-spinner loading-lg text-primary"
            ></span>
          </div>
        } @else if (!items().length) {
          <p class="py-4 text-sm text-base-content/60">
            No hay modificaciones registradas en
            {{ monthName().toLocaleLowerCase() }}.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Horas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (
                  item of items();
                  track item.modificacion.turnoModificadoId
                ) {
                  <tr>
                    <td>{{ formatDate(item.modificacion.fecha) }}</td>
                    <td>{{ item.horarioNombre }}</td>
                    <td class="font-mono">
                      {{ formatTime(item.modificacion.horaInicio) }} -
                      {{ formatTime(item.modificacion.horaFin) }}
                    </td>
                    <td class="space-x-1 text-end">
                      <button
                        type="button"
                        class="btn btn-xs"
                        [disabled]="
                          editingId() === item.modificacion.turnoModificadoId
                        "
                        (click)="edit.emit(item)"
                      >
                        <fa-icon [icon]="icons.faPencil" /></button
                      ><button
                        type="button"
                        class="btn btn-xs btn-error"
                        [disabled]="
                          deletingId() === item.modificacion.turnoModificadoId
                        "
                        (click)="remove.emit(item)"
                      >
                        <fa-icon [icon]="icons.faTrash" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `,
})
export default class ResumenMensualTurnoModificado {
  icons = inject(FontIconService);
  items = input<ResumenModificacion[]>([]);
  monthName = input('');
  loading = input(false);
  editingId = input<number | null>(null);
  deletingId = input<number | null>(null);
  monthChange = output<number>();
  edit = output<ResumenModificacion>();
  remove = output<ResumenModificacion>();
  formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  formatTime(value: string): string {
    return value.slice(0, 5);
  }
}
