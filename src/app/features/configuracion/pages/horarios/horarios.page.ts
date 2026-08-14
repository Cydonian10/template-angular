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
import { HorariosService } from '../../../../api/horarios.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import HorariosTable from './components/horarios-table.ng';
import HorarioFormDialog, {
  HorarioFormDialogData,
  HorarioFormDialogResult,
} from './components/horario-form.dialog.ng';
import {
  Horario,
  OperationResult,
} from '../../../../core/interfaces/horario.interface';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';

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

      <!-- ========== CONFIRMACIÓN DE ELIMINACIÓN ========== -->
      @if (confirmarEliminar(); as h) {
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="text-lg font-bold">Eliminar horario</h3>
            <p class="py-4">
              ¿Seguro que deseas eliminar <strong>{{ h.nombre }}</strong
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
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);

  public loading = signal(false);
  public unidadIdFiltro = signal<number | undefined>(undefined);
  public confirmarEliminar = signal<Horario | null>(null);

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
    this.abrirDialog(null);
  }

  abrirEditar(horario: Horario): void {
    this.abrirDialog(horario);
  }

  private async abrirDialog(horario: Horario | null): Promise<void> {
    let unidades: Unidad[] = [];
    let areas: Area[] = [];
    try {
      unidades = await firstValueFrom(this.#unidadesService.listar());
      if (horario) {
        areas = await firstValueFrom(
          this.#areasService.listar(horario.unidadId),
        );
      }
    } catch {
      this.#toastr.error('No se pudieron cargar las unidades o áreas');
      return;
    }

    const ref = this.#dialog.open<HorarioFormDialogResult>(
      HorarioFormDialog,
      {
        data: { horario, unidades, areas } as HorarioFormDialogData,
        disableClose: true,
        width: '720px',
      },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }
        if (horario) {
          this.actualizarHorario(horario.horarioId, result);
        } else {
          this.crearHorario(result);
        }
      });
  }

  private crearHorario(result: HorarioFormDialogResult): void {
    this.#horariosService
      .crear({
        nombre: result.nombre,
        areaId: result.areaId,
        extendido: result.extendido,
        rotativo: result.rotativo,
        regular: result.regular,
        horasLaborales: result.horasLaborales,
        dias: result.dias,
        usuarioIds: result.usuarioIds,
        fechaInicio: result.fechaInicio,
        fechaFin: result.fechaFin,
      })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap((res) => {
          if (res.State === 1) {
            this.recargar();
          }
        }),
        catchError(() => {
          this.#toastr.error('Error al crear el horario');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private actualizarHorario(
    id: number,
    result: HorarioFormDialogResult,
  ): void {
    this.#horariosService
      .actualizar(id, {
        nombre: result.nombre,
        areaId: result.areaId,
        extendido: result.extendido,
        rotativo: result.rotativo,
        regular: result.regular,
        horasLaborales: result.horasLaborales,
      })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap((res) => {
          if (res.State === 1) {
            this.recargar();
          }
        }),
        catchError(() => {
          this.#toastr.error('Error al actualizar el horario');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  verDetalle(horario: Horario): void {
    this.#router.navigate(['/configuracion/horario-2', horario.horarioId]);
  }

  pedirEliminar(horario: Horario): void {
    this.confirmarEliminar.set(horario);
  }

  cancelarEliminar(): void {
    this.confirmarEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const horario = this.confirmarEliminar();
    if (!horario) {
      return;
    }
    this.confirmarEliminar.set(null);
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
