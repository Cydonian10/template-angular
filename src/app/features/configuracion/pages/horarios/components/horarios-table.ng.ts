import { Component, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { Horario } from '../../../../../core/interfaces/horario.interface';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';

@Component({
  selector: 'horarios-table',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Horarios</h2>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!horarios().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay horarios registrados.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th>Área</th>
                  <th>Tipo</th>
                  <th>Horas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (h of horarios(); track h.horarioId) {
                  <tr>
                    <td>{{ h.nombre }}</td>
                    <td>{{ unidadNombre(h.unidadId) }}</td>
                    <td>{{ h.areaNombre }}</td>
                    <td>
                      @if (h.rotativo) {
                        <span class="badge badge-info badge-sm">Rotativo</span>
                      } @else if (h.extendido) {
                        <span class="badge badge-warning badge-sm">
                          Extendido
                        </span>
                      } @else {
                        <span class="badge badge-ghost badge-sm">Regular</span>
                      }
                    </td>
                    <td>{{ h.horasLaborales }}</td>
                    <td class="text-end">
                      <div class="flex justify-end gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          (click)="ver.emit(h)"
                          aria-label="Ver detalle"
                        >
                          <fa-icon [icon]="iconService.faEye"></fa-icon>
                        </button>
                        <button
                          class="btn btn-xs btn-outline"
                          (click)="editar.emit(h)"
                          aria-label="Editar horario"
                        >
                          <fa-icon [icon]="iconService.faEdit"></fa-icon>
                        </button>
                        <button
                          class="btn btn-xs btn-outline btn-error"
                          (click)="eliminar.emit(h)"
                          aria-label="Eliminar horario"
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
      </div>
    </div>
  `,
})
export default class HorariosTable {
  public iconService = inject(FontIconService);

  public horarios = input<Horario[]>([]);
  public unidades = input<Unidad[]>([]);
  public loading = input(false);
  public ver = output<Horario>();
  public editar = output<Horario>();
  public eliminar = output<Horario>();

  unidadNombre(unidadId: number): string | null {
    return (
      this.unidades().find((u) => u.unidadId === unidadId)?.nombre ?? null
    );
  }
}
