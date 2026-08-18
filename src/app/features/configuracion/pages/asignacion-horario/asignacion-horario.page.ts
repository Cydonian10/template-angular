import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, switchMap, tap } from 'rxjs';
import { Dialog } from '@angular/cdk/dialog';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';
import AsignarHorarioDialog, {
  AsignarHorarioDialogResult,
} from './components/asignar-horario.dialog.ng';

interface FiltroAsignacion {
  busqueda?: string;
  areaId?: number;
  unidadId?: number;
}

@Component({
  selector: 'asignacion-horario-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Asignación de horarios</h1>
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
            (change)="cambiarAreaFiltro($event)"
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
              placeholder="Usuario, nombres, apellidos o dni..."
              class="grow"
              (input)="buscar($event)"
            />
          </label>
        </fieldset>
      </div>

      <!-- ========== LISTADO DE USUARIOS ========== -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h2 class="card-title">Usuarios</h2>

          @if (loading()) {
            <div class="flex justify-center py-6">
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!usuarios().length) {
            <p class="text-sm text-base-content/60 py-4">
              No hay usuarios registrados con los filtros seleccionados.
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>Unidad</th>
                    <th>Área</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of filas(); track u.usuarioAreaId) {
                    <tr>
                      <td>{{ u.usuario }}</td>
                      <td>{{ u.nombres }}</td>
                      <td>{{ u.apellidos }}</td>
                      <td>{{ u.unidadNombre }}</td>
                      <td>{{ u.areaNombre }}</td>
                      <td class="text-end">
                        <button
                          type="button"
                          class="btn btn-xs btn-primary"
                          (click)="asignarHorario(u)"
                          aria-label="Asignar horario"
                        >
                          <fa-icon [icon]="iconService.faCalendarCheck"></fa-icon>
                          Asignar horario
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <ng-paginator
              [length]="dataSource.length"
              [pageIndex]="dataSource.pageIndex"
              [pageSize]="dataSource.pageSize"
              (pageChange)="dataSource.paginar($event)"
            />
          }
        </div>
      </div>
    </div>
  `,
})
export default class AsignacionHorarioPage {
  public iconService = inject(FontIconService);
  #unidadesService = inject(UnidadesService);
  #areasService = inject(AreasService);
  #usuariosService = inject(UsuariosService);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);

  public loading = signal(false);
  public unidadIdFiltro = signal<number | undefined>(undefined);
  public areas = signal<Area[]>([]);
  public usuarios = signal<Usuario[]>([]);

  #filtros$ = new BehaviorSubject<FiltroAsignacion>({});

  public unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });

  public dataSource = new PaginadorDataSource<Usuario>();
  protected filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Usuario[],
  });

  constructor() {
    effect(() => this.dataSource.setData(this.usuarios()));

    this.#filtros$
      .pipe(
        debounceTime(300),
        tap(() => this.loading.set(true)),
        switchMap((f) =>
          this.#usuariosService.listar({
            activo: true,
            unidadId: f.unidadId,
            areaId: f.areaId,
            busqueda: f.busqueda,
          }),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (lista) => {
          this.usuarios.set(lista);
          this.loading.set(false);
          this.dataSource.paginar({
            pageIndex: 0,
            pageSize: this.dataSource.pageSize,
          });
        },
        error: () => {
          this.loading.set(false);
          this.#toastr.error('No se pudieron cargar los usuarios');
        },
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
    this.#actualizarFiltro({ unidadId, areaId: undefined });
  }

  cambiarAreaFiltro(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.#actualizarFiltro({
      areaId: value === '' ? undefined : Number(value),
    });
  }

  buscar(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.#actualizarFiltro({ busqueda: value || undefined });
  }

  asignarHorario(usuario: Usuario): void {
    const ref = this.#dialog.open<AsignarHorarioDialogResult>(
      AsignarHorarioDialog,
      {
        data: { usuario },
        disableClose: true,
        width: '720px',
      },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result?.cambio) {
          this.recargar();
        }
      });
  }

  #actualizarFiltro(patch: Partial<FiltroAsignacion>): void {
    this.#filtros$.next({ ...this.#filtros$.getValue(), ...patch });
  }

  private recargar(): void {
    this.#filtros$.next({ ...this.#filtros$.getValue() });
  }
}
