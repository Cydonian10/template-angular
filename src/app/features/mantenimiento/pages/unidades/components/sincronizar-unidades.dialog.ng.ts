import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { UnidadesService } from '../../../../../api/unidades.service';
import { SyncUnidad } from '../../../../../core/interfaces/unidad.interface';

export interface SincronizarResult {
  recargar: boolean;
}

@Component({
  selector: 'sincronizar-unidades-dialog',
  imports: [FontAwesomeModule],
  template: `
    <div
      class="card bg-base-100 w-full max-w-2xl border border-base-300 shadow-xl"
    >
      <div class="card-body gap-3">
        <h2 class="card-title">Sincronizar unidades</h2>
        <p class="text-sm text-base-content/70">
          Las <code>Unidades</code> ya migradas aparecen deshabilitadas.
        </p>

        @if (error(); as e) {
          <div class="alert alert-error">
            <span>{{ e }}</span>
          </div>
        }

        @if (loading() && !items().length) {
          <div class="flex justify-center py-6">
            <fa-icon
              [icon]="iconService.faSpinner"
              [animation]="'spin'"
              class="text-2xl text-primary"
            ></fa-icon>
          </div>
        } @else if (!items().length) {
          <p class="text-sm text-base-content/60 py-4">No hay unidades.</p>
        } @else {
          @if (todasMigradas()) {
            <div class="alert alert-success">
              <span>Todas las unidades ya fueron migradas.</span>
            </div>
          }

          <div class="flex justify-end">
            <button
              class="btn btn-sm btn-primary"
              (click)="migrarTodas()"
              [disabled]="loading() || !hayPendientes()"
            >
              <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
              Migrar todas
            </button>
          </div>

          <div class="max-h-96 overflow-y-auto">
            <table class="table table-sm">
              <thead class="sticky top-0 bg-base-100">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of items(); track s.syncUnidadId) {
                  <tr>
                    <td>{{ s.codigo }}</td>
                    <td>{{ s.nombre }}</td>
                    <td>
                      @if (s.migrado) {
                        <span class="badge badge-success badge-sm">
                          Migrado
                        </span>
                      } @else {
                        <span class="badge badge-ghost badge-sm">
                          Pendiente
                        </span>
                      }
                    </td>
                    <td class="text-end">
                      <button
                        class="btn btn-xs"
                        [class.btn-primary]="!s.migrado"
                        [class.btn-outline]="!s.migrado"
                        [class.btn-disabled]="s.migrado"
                        (click)="!s.migrado && migrarUna(s.syncUnidadId)"
                        [disabled]="loading() || s.migrado"
                      >
                        <fa-icon [icon]="iconService.faArrowRight"></fa-icon>
                        {{ s.migrado ? 'Migrado' : 'Migrar' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <div class="card-actions justify-end pt-2">
          <button class="btn btn-ghost" (click)="cerrar()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
})
export default class SincronizarUnidadesDialog {
  public iconService = inject(FontIconService);
  #service = inject(UnidadesService);
  #ref = inject(DialogRef<SincronizarResult>);

  public data = inject(DIALOG_DATA) as SyncUnidad[];
  public items = signal<SyncUnidad[]>([]);
  public loading = signal(false);
  public error = signal<string | null>(null);

  constructor() {
    this.items.set([...this.data]);
  }

  protected hayPendientes = (): boolean => this.items().some((s) => !s.migrado);

  protected todasMigradas = (): boolean =>
    this.items().length > 0 && this.items().every((s) => s.migrado);

  async migrarUna(id: number): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.#service.migrar({ syncUnidadId: id }),
      );
      if (res.State === 1) {
        this.items.update((items) =>
          items.map((i) =>
            i.syncUnidadId === id ? { ...i, migrado: true } : i,
          ),
        );
      } else {
        this.error.set(res.Message);
      }
    } catch {
      this.error.set('Error al migrar la unidad');
    } finally {
      this.loading.set(false);
    }
  }

  async migrarTodas(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.#service.migrar());
      if (res.State === 1) {
        this.items.update((items) =>
          items.map((i) => ({ ...i, migrado: true })),
        );
      } else {
        this.error.set(res.Message);
      }
    } catch {
      this.error.set('Error al migrar las unidades');
    } finally {
      this.loading.set(false);
    }
  }

  cerrar(): void {
    this.#ref.close({ recargar: true });
  }
}
