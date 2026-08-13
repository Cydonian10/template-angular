import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  debounceTime,
  firstValueFrom,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { AreasService } from '../../../../api/areas.service';
import { UnidadesService } from '../../../../api/unidades.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import AreasTable from './components/areas-table.ng';
import AreaDialog, {
  AreaDialogData,
  AreaDialogResult,
} from './components/area-dialog.ng';
import {
  Area,
  CrearAreaDto,
  ActualizarAreaDto,
  OperationResult,
} from '../../../../core/interfaces/area.interface';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'areas-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, AreasTable],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Áreas</h1>

        <div class="flex items-center gap-2">
          <button class="btn btn-primary" (click)="abrirNuevaArea()">
            <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
            Nueva área
          </button>
        </div>
      </div>

      <!-- ========== CONFIRMACIÓN DE ELIMINACIÓN ========== -->
      @if (confirmarEliminar(); as a) {
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="text-lg font-bold">Eliminar área</h3>
            <p class="py-4">
              ¿Seguro que deseas eliminar
              <strong>{{ a.nombre }}</strong
              >?
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

      <!-- ========== BÚSQUEDA Y FILTROS ========== -->
      <div class="flex flex-wrap items-end gap-3">
        <fieldset class="fieldset w-full max-w-sm">
          <legend class="fieldset-legend">Buscar área</legend>
          <label class="input flex w-full items-center gap-2">
            <fa-icon [icon]="iconService.faSearch"></fa-icon>
            <input
              type="search"
              placeholder="Buscar por nombre o descripción..."
              class="grow"
              (input)="buscar($event)"
            />
          </label>
        </fieldset>

        <fieldset class="fieldset w-full max-w-xs">
          <legend class="fieldset-legend">Tipo de unidad</legend>
          <select class="select w-full" (change)="cambiarTipo($event)">
            <option value="">Todos</option>
            @for (u of tiposUnidad(); track u.unidadId) {
              <option [value]="u.nombre ?? ''">{{ u.nombre }}</option>
            }
          </select>
        </fieldset>
      </div>

      <!-- ========== LISTADO DE ÁREAS ========== -->
      <areas-table
        [areas]="areas()"
        [loading]="loadingAreas()"
        (editar)="abrirEditarArea($event)"
        (eliminar)="pedirEliminar($event)"
      />
    </div>
  `,
})
export default class AreasPage {
  public iconService = inject(FontIconService);
  #areasService = inject(AreasService);
  #unidadesService = inject(UnidadesService);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);

  public loadingAreas = signal(false);
  public confirmarEliminar = signal<Area | null>(null);

  #busqueda$ = new BehaviorSubject<AreasFiltro>({});

  public tiposUnidad = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });

  public areas = toSignal(
    this.#busqueda$.pipe(
      debounceTime(300),
      tap(() => this.loadingAreas.set(true)),
      switchMap((filtro) =>
        this.#areasService
          .listar(undefined, filtro.busqueda, filtro.tipo)
          .pipe(
            catchError(() => {
              this.#toastr.error('No se pudieron cargar las áreas');
              return of([] as Area[]);
            }),
          ),
      ),
      tap(() => this.loadingAreas.set(false)),
    ),
    { initialValue: [] as Area[] },
  );

  abrirNuevaArea(): void {
    this.abrirDialog(null);
  }

  abrirEditarArea(area: Area): void {
    this.abrirDialog(area);
  }

  private async abrirDialog(area: Area | null): Promise<void> {
    let unidades: Unidad[] = [];
    try {
      unidades = await firstValueFrom(this.#unidadesService.listar());
    } catch {
      this.#toastr.error('No se pudieron cargar las unidades');
      return;
    }

    const ref = this.#dialog.open<AreaDialogResult>(AreaDialog, {
      data: { area, unidades } as AreaDialogData,
      disableClose: true,
      width: '500px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }
        if (area) {
          this.guardarArea(area.areaId, result);
        } else {
          this.crearArea(result);
        }
      });
  }

  private crearArea(dto: AreaDialogResult): void {
    const body: CrearAreaDto = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      unidadId: dto.unidadId ?? 0,
    };
    this.#areasService
      .crear(body)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap(() => this.recargar()),
        catchError(() => {
          this.#toastr.error('Error al crear el área');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private guardarArea(id: number, dto: AreaDialogResult): void {
    const body: ActualizarAreaDto = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    };
    this.#areasService
      .actualizar(id, body)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap(() => this.recargar()),
        catchError(() => {
          this.#toastr.error('Error al actualizar el área');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  pedirEliminar(area: Area): void {
    this.confirmarEliminar.set(area);
  }

  cancelarEliminar(): void {
    this.confirmarEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const area = this.confirmarEliminar();
    if (!area) {
      return;
    }
    this.confirmarEliminar.set(null);
    this.#areasService
      .eliminar(area.areaId)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap(() => this.recargar()),
        catchError(() => {
          this.#toastr.error('Error al eliminar el área');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  buscar(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    const current = this.#busqueda$.getValue();
    this.#busqueda$.next({ ...current, busqueda: value || undefined });
  }

  cambiarTipo(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const current = this.#busqueda$.getValue();
    this.#busqueda$.next({ ...current, tipo: value || undefined });
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }

  private recargar(): void {
    this.#busqueda$.next({ ...this.#busqueda$.getValue() });
  }
}

interface AreasFiltro {
  busqueda?: string;
  tipo?: string;
}
