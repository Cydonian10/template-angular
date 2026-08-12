import { Component, computed, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { SyncUnidad } from '../../../../../core/interfaces/unidad.interface';

@Component({
  selector: 'sync-unidades-list',
  imports: [FontAwesomeModule],
  template: `
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <h2 class="card-title">Unidades por migrar</h2>
          <button
            class="btn btn-sm btn-primary"
            (click)="migrarTodas.emit()"
            [disabled]="loading() || !hayPendientes()"
          >
            <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
            Migrar todas
          </button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!sync().length) {
          <p class="text-sm text-base-content/60 py-4">
            No hay unidades pendientes de migración.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of sync(); track s.syncUnidadId) {
                  <tr>
                    <td>{{ s.codigo }}</td>
                    <td>{{ s.nombre }}</td>
                    <td>
                      @if (s.migrado) {
                        <span class="badge badge-success badge-sm">Migrado</span>
                      } @else {
                        <span class="badge badge-ghost badge-sm">Pendiente</span>
                      }
                    </td>
                    <td class="text-end">
                      @if (!s.migrado) {
                        <button
                          class="btn btn-xs btn-outline btn-primary"
                          (click)="migrarUna.emit(s.syncUnidadId)"
                        >
                          <fa-icon [icon]="iconService.faArrowRight"></fa-icon>
                          Migrar
                        </button>
                      }
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
export default class SyncUnidadesList {
  public iconService = inject(FontIconService);

  public sync = input<SyncUnidad[]>([]);
  public loading = input(false);
  public migrarUna = output<number>();
  public migrarTodas = output<void>();

  protected hayPendientes = computed(() => this.sync().some((s) => !s.migrado));
}
