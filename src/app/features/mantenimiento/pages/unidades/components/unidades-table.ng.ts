import { Component, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';

@Component({
  selector: 'unidades-table',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Unidades migradas</h2>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!unidades().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay unidades migradas.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Horas diarias</th>
                  <th>Horas semanales</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (u of unidades(); track u.unidadId) {
                  <tr>
                    <td>{{ u.codigo }}</td>
                    <td>{{ u.nombre }}</td>
                    <td>{{ u.horasLaborales }}</td>
                    <td>{{ u.horasLaboralesTotales }}</td>
                    <td class="text-end">
                      <div class="flex justify-end gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          (click)="editar.emit(u)"
                          aria-label="Editar horas"
                        >
                          <fa-icon [icon]="iconService.faEdit"></fa-icon>
                        </button>
                        <button
                          class="btn btn-xs btn-outline btn-error"
                          (click)="eliminar.emit(u)"
                          aria-label="Eliminar"
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
export default class UnidadesTable {
  public iconService = inject(FontIconService);

  public unidades = input<Unidad[]>([]);
  public loading = input(false);
  public editar = output<Unidad>();
  public eliminar = output<Unidad>();
}