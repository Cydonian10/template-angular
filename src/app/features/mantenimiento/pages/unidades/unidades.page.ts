import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  debounceTime,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
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
  OperationResult,
  SyncUnidad,
  Unidad,
} from '../../../../core/interfaces/unidad.interface';
import { DestroyRef } from '@angular/core';

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
        (verAreas)="verAreas($event)"
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
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);
  #router = inject(Router);

  public loadingMigradas = signal(false);
  public loadingSync = signal(false);
  public confirmarEliminar = signal<Unidad | null>(null);

  #reload$ = new BehaviorSubject<void>(undefined);
  #busqueda$ = new BehaviorSubject<string | undefined>(undefined);

  public sync = toSignal(
    this.#reload$.pipe(
      tap(() => this.loadingSync.set(true)),
      switchMap(() =>
        this.#unidadesService.sync().pipe(
          catchError(() => {
            this.#toastr.error('No se pudieron cargar las unidades pendientes');
            return of([] as SyncUnidad[]);
          }),
        ),
      ),
      tap(() => this.loadingSync.set(false)),
    ),
    { initialValue: [] as SyncUnidad[] },
  );

  public migradas = toSignal(
    this.#busqueda$.pipe(
      debounceTime(300),
      tap(() => this.loadingMigradas.set(true)),
      switchMap((busqueda) =>
        this.#unidadesService.listar(busqueda).pipe(
          catchError(() => {
            this.#toastr.error('No se pudieron cargar las unidades migradas');
            return of([] as Unidad[]);
          }),
        ),
      ),
      tap(() => this.loadingMigradas.set(false)),
    ),
    { initialValue: [] as Unidad[] },
  );

  public pendientesCount = computed(
    () => this.sync().filter((s) => !s.migrado).length,
  );

  abrirSincronizar(): void {
    const ref = this.#dialog.open<SincronizarResult>(
      SincronizarUnidadesDialog,
      {
        data: this.sync(),
        disableClose: true,
      },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result?.recargar) {
          this.recargar();
        }
      });
  }

  abrirEditarHoras(unidad: Unidad): void {
    const ref = this.#dialog.open<EditarHorasResult>(EditarHorasDialog, {
      data: unidad,
      disableClose: true,
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result) {
          this.guardarHoras(unidad.unidadId, result);
        }
      });
  }

  verAreas(unidad: Unidad): void {
    this.#router.navigate(['/mantenimiento/unidades', unidad.unidadId]);
  }

  private guardarHoras(id: number, dto: EditarHorasResult): void {
    this.#unidadesService
      .actualizar(id, dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap(() => this.recargarMigradas()),
        catchError(() => {
          this.#toastr.error('Error al actualizar las horas');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  pedirEliminar(unidad: Unidad): void {
    this.confirmarEliminar.set(unidad);
  }

  cancelarEliminar(): void {
    this.confirmarEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const unidad = this.confirmarEliminar();
    if (!unidad) {
      return;
    }
    this.confirmarEliminar.set(null);
    this.#unidadesService
      .eliminar(unidad.unidadId)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap(() => this.recargar()),
        catchError(() => {
          this.#toastr.error('Error al eliminar la unidad');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  buscar(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.#busqueda$.next(value || undefined);
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }

  private recargarMigradas(): void {
    this.#busqueda$.next(this.#busqueda$.getValue());
  }

  private recargar(): void {
    this.#reload$.next();
    this.recargarMigradas();
  }
}
