import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { UnidadesService } from '../../../../api/unidades.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import UnidadesTable from './components/unidades-table.ng';
import EditarHorasDialog, {
  EditarHorasResult,
} from './components/editar-horas.dialog.ng';
import SincronizarUnidadesDialog, {
  SincronizarResult,
} from './components/sincronizar-unidades.dialog.ng';
import {
  SyncUnidad,
  Unidad,
} from '../../../../core/interfaces/unidad.interface';

interface Toast {
  type: 'success' | 'error';
  msg: string;
}

@Component({
  selector: 'unidades-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, UnidadesTable],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Unidades</h1>

        <div class="flex items-center gap-2">
          <button
            class="btn btn-primary"
            (click)="abrirSincronizar()"
            [disabled]="loadingSync()"
          >
            <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
            Sincronizar unidades

            @if (pendientesCount() > 0) {
              <span class="badge badge-sm">{{ pendientesCount() }}</span>
            }
          </button>
        </div>
      </div>

      <!-- ========== TOAST ========== -->
      @if (toast(); as t) {
        <div class="toast toast-top toast-end z-50">
          <div
            class="alert"
            [class.alert-success]="t.type === 'success'"
            [class.alert-error]="t.type === 'error'"
          >
            <span>{{ t.msg }}</span>
          </div>
        </div>
      }

      <!-- ========== CONFIRMACIÓN DE ELIMINACIÓN ========== -->
      @if (confirmarEliminar(); as u) {
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="text-lg font-bold">Eliminar unidad</h3>
            <p class="py-4">
              ¿Seguro que deseas eliminar
              <strong>{{ u.nombre ?? u.codigo }}</strong>
              ({{ u.codigo }})?
            </p>
            <div class="modal-action">
              <button class="btn btn-ghost" (click)="cancelarEliminar()">
                Cancelar
              </button>
              <button class="btn btn-error" (click)="confirmarEliminacion()">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========== BÚSQUEDA ========== -->
      <label
        class="input input-bordered flex w-full max-w-sm items-center gap-2"
      >
        <fa-icon [icon]="iconService.faSearch"></fa-icon>
        <input
          type="search"
          placeholder="Buscar por código o nombre..."
          class="grow"
          (input)="buscar($event)"
        />
      </label>

      <!-- ========== UNIDADES MIGRADAS ========== -->
      <unidades-table
        [unidades]="migradas()"
        [loading]="loadingMigradas()"
        (editar)="abrirEditarHoras($event)"
        (eliminar)="pedirEliminar($event)"
      />
    </div>
  `,
})
export default class UnidadesPage {
  public iconService = inject(FontIconService);
  #unidadesService = inject(UnidadesService);
  #dialog = inject(Dialog);

  public migradas = signal<Unidad[]>([]);
  public sync = signal<SyncUnidad[]>([]);
  public loadingMigradas = signal(false);
  public loadingSync = signal(false);
  public toast = signal<Toast | null>(null);
  public confirmarEliminar = signal<Unidad | null>(null);

  public pendientesCount = computed(
    () => this.sync().filter((s) => !s.migrado).length,
  );

  constructor() {
    this.cargar();
  }

  async cargar(): Promise<void> {
    await Promise.all([this.cargarSync(), this.cargarMigradas()]);
  }

  async cargarSync(): Promise<void> {
    this.loadingSync.set(true);
    try {
      this.sync.set(await firstValueFrom(this.#unidadesService.sync()));
    } catch {
      this.mostrarToast(
        'error',
        'No se pudieron cargar las unidades pendientes',
      );
    } finally {
      this.loadingSync.set(false);
    }
  }

  async cargarMigradas(busqueda?: string): Promise<void> {
    this.loadingMigradas.set(true);
    try {
      this.migradas.set(
        await firstValueFrom(this.#unidadesService.listar(busqueda)),
      );
    } catch {
      this.mostrarToast('error', 'No se pudieron cargar las unidades migradas');
    } finally {
      this.loadingMigradas.set(false);
    }
  }

  abrirSincronizar(): void {
    const ref = this.#dialog.open<SincronizarResult>(
      SincronizarUnidadesDialog,
      {
        data: this.sync(),
      },
    );
    ref.closed.subscribe((result) => {
      if (result?.recargar) {
        this.cargar();
      }
    });
  }

  abrirEditarHoras(unidad: Unidad): void {
    const ref = this.#dialog.open<EditarHorasResult>(EditarHorasDialog, {
      data: unidad,
    });
    ref.closed.subscribe((result) => {
      if (result) {
        this.guardarHoras(unidad.unidadId, result);
      }
    });
  }

  async guardarHoras(id: number, dto: EditarHorasResult): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.#unidadesService.actualizar(id, dto),
      );
      this.mostrarToast(res.State === 1 ? 'success' : 'error', res.Message);
      await this.cargarMigradas();
    } catch {
      this.mostrarToast('error', 'Error al actualizar las horas');
    }
  }

  pedirEliminar(unidad: Unidad): void {
    this.confirmarEliminar.set(unidad);
  }

  cancelarEliminar(): void {
    this.confirmarEliminar.set(null);
  }

  async confirmarEliminacion(): Promise<void> {
    const unidad = this.confirmarEliminar();
    if (!unidad) {
      return;
    }
    this.confirmarEliminar.set(null);
    try {
      const res = await firstValueFrom(
        this.#unidadesService.eliminar(unidad.unidadId),
      );
      this.mostrarToast(res.State === 1 ? 'success' : 'error', res.Message);
      await this.cargar();
    } catch {
      this.mostrarToast('error', 'Error al eliminar la unidad');
    }
  }

  buscar(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.cargarMigradas(value || undefined);
  }

  private mostrarToast(type: Toast['type'], msg: string): void {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
