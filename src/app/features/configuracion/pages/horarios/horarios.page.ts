import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
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
import { HorariosService } from '../../../../api/horarios.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import HorariosTable from './components/horarios-table.ng';
import {
  Horario,
  OperationResult,
} from '../../../../core/interfaces/horario.interface';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import { Router } from '@angular/router';

interface FiltroHorarios {
  areaId?: number;
  busqueda?: string;
}

@Component({
  selector: 'horarios-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, HorariosTable],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Horarios</h1>

        <button class="btn btn-primary" (click)="abrirNuevo()">
          <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
          Nuevo horario
        </button>
      </div>

      <!-- ========== FILTROS ========== -->
      <div class="flex flex-wrap items-end gap-3">
        <fieldset class="fieldset w-full max-w-xs">
          <legend class="fieldset-legend">Unidad</legend>
          <select class="select w-full" (change)="cambiarUnidad($event)">
            <option value="">Todas</option>
            @for (u of unidades(); track u.unidadId) {
              <option [value]="u.unidadId">{{ u.nombre }}</option>
            }
          </select>
        </fieldset>

        <fieldset class="fieldset w-full max-w-xs">
          <legend class="fieldset-legend">Área</legend>
          <select
            class="select w-full"
            (change)="cambiarArea($event)"
            [disabled]="unidadIdFiltro() === undefined"
          >
            <option value="">Todas</option>
            @for (a of areas(); track a.areaId) {
              <option [value]="a.areaId">{{ a.nombre }}</option>
            }
          </select>
        </fieldset>

        <fieldset class="fieldset w-full max-w-sm">
          <legend class="fieldset-legend">Buscar</legend>
          <label class="input flex w-full items-center gap-2">
            <fa-icon [icon]="iconService.faSearch"></fa-icon>
            <input
              type="search"
              placeholder="Buscar por nombre..."
              class="grow"
              (input)="buscar($event)"
            />
          </label>
        </fieldset>
      </div>

      <!-- ========== LISTADO ========== -->
      <horarios-table
        [horarios]="horarios()"
        [unidades]="unidades()"
        [loading]="loading()"
        (ver)="verDetalle($event)"
        (editar)="abrirEditar($event)"
        (eliminar)="pedirEliminar($event)"
      />
    </div>
  `,
})
export default class HorariosPage {
  public iconService = inject(FontIconService);
  #horariosService = inject(HorariosService);
  #unidadesService = inject(UnidadesService);
  #areasService = inject(AreasService);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);
  #dialog = inject(Dialog);

  public loading = signal(false);
  public unidadIdFiltro = signal<number | undefined>(undefined);

  #filtros$ = new BehaviorSubject<FiltroHorarios>({});

  public unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });

  public areas = signal<Area[]>([]);
  public horarios = signal<Horario[]>([]);

  constructor() {
    this.#filtros$
      .pipe(
        debounceTime(300),
        tap(() => this.loading.set(true)),
        switchMap((f) =>
          this.#horariosService.listar(f.areaId, f.busqueda).pipe(
            catchError(() => {
              this.#toastr.error('No se pudieron cargar los horarios');
              return of([] as Horario[]);
            }),
          ),
        ),
        tap(() => this.loading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((lista) => this.horarios.set(lista));
  }

  abrirNuevo(): void {
    this.#router.navigate(['/configuracion/horario-2/nuevo']);
  }

  abrirEditar(horario: Horario): void {
    this.#router.navigate([
      '/configuracion/horario-2',
      horario.horarioId,
      'editar',
    ]);
  }

  verDetalle(horario: Horario): void {
    this.#router.navigate(['/configuracion/horario-2', horario.horarioId]);
  }

  pedirEliminar(horario: Horario): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar horario',
      mensaje: `¿Seguro que deseas eliminar ${horario.nombre}?`,
      textoConfirmar: 'Eliminar',
    });

    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) {
          return;
        }
        this.#horariosService
          .eliminar(horario.horarioId)
          .pipe(
            takeUntilDestroyed(this.#destroyRef),
            tap((res) => this.procesarResultado(res)),
            tap((res) => {
              if (res.State === 1) {
                this.horarios.update((lista) =>
                  lista.filter((h) => h.horarioId !== horario.horarioId),
                );
              }
            }),
            catchError(() => {
              this.#toastr.error('Error al eliminar el horario');
              return EMPTY;
            }),
          )
          .subscribe();
      });
  }

  cambiarUnidad(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const unidadId = value === '' ? undefined : Number(value);
    this.unidadIdFiltro.set(unidadId);
    this.areas.set([]);
    if (unidadId !== undefined) {
      this.#areasService
        .listar(unidadId)
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: (areas) => this.areas.set(areas),
          error: () => this.#toastr.error('No se pudieron cargar las áreas'),
        });
    }
    this.#actualizarFiltro({ areaId: undefined });
  }

  cambiarArea(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.#actualizarFiltro({
      areaId: value === '' ? undefined : Number(value),
    });
  }

  buscar(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.#actualizarFiltro({ busqueda: value || undefined });
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }

  private recargar(): void {
    this.#filtros$.next({ ...this.#filtros$.getValue() });
  }

  #actualizarFiltro(patch: Partial<FiltroHorarios>): void {
    this.#filtros$.next({ ...this.#filtros$.getValue(), ...patch });
  }
}
