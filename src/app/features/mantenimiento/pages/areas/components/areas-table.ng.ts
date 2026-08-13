import { Component, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { Area } from '../../../../../core/interfaces/area.interface';

@Component({
  selector: 'areas-table',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Áreas</h2>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!areas().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay áreas registradas.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (a of areas(); track a.areaId) {
                  <tr>
                    <td>{{ a.unidadId }}</td>
                    <td>{{ a.nombre }}</td>
                    <td>{{ a.descripcion }}</td>
                    <td class="text-end">
                      <div class="flex justify-end gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          (click)="editar.emit(a)"
                          aria-label="Editar área"
                        >
                          <fa-icon [icon]="iconService.faEdit"></fa-icon>
                        </button>
                        <button
                          class="btn btn-xs btn-outline btn-error"
                          (click)="eliminar.emit(a)"
                          aria-label="Eliminar área"
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
export default class AreasTable {
  public iconService = inject(FontIconService);

  public areas = input<Area[]>([]);
  public loading = input(false);
  public editar = output<Area>();
  public eliminar = output<Area>();
}
