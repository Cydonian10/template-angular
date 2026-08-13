import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { UsuariosUiService } from '../../../../core/services/usuarios-ui.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';

interface FiltroUsuarios {
  activo?: boolean;
  busqueda?: string;
  areaId?: number;
  unidadId?: number;
}

@Component({
  selector: 'usuarios-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Usuarios</h1>

        <button class="btn btn-primary" (click)="agregarUsuarios()">
          <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
          Agregar usuarios
        </button>
      </div>

      <!-- ========== FILTROS ========== -->
      <div class="flex flex-wrap items-end gap-3">
        <fieldset class="fieldset w-full max-w-xs">
          <legend class="fieldset-legend">Estado</legend>
          <select class="select w-full" (change)="cambiarEstado($event)">
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </fieldset>

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
          } @else if (!filasCompletas().length) {
            <p class="text-sm text-base-content/60 py-4">
              No hay usuarios registrados.
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>DNI</th>
                    <th>Unidad</th>
                    <th>Área</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of filas(); track u.usuarioId) {
                    <tr>
                      <td>{{ u.usuario }}</td>
                      <td>{{ u.nombres }}</td>
                      <td>{{ u.apellidos }}</td>
                      <td>{{ u.dni }}</td>
                      <td>{{ u.unidadNombre }}</td>
                      <td>{{ u.areaNombre }}</td>
                      <td>
                        <span
                          class="badge badge-sm"
                          [class.badge-success]="u.activo"
                          [class.badge-ghost]="!u.activo"
                        >
                          {{ u.activo ? 'Activo' : 'Inactivo' }}
                        </span>
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
export default class UsuariosPage {
  public iconService = inject(FontIconService);
  #unidadesService = inject(UnidadesService);
  #areasService = inject(AreasService);
  #usuariosService = inject(UsuariosService);
  #ui = inject(UsuariosUiService);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);

  public loading = signal(false);
  public unidadIdFiltro = signal<number | undefined>(undefined);

  #filtros$ = new BehaviorSubject<FiltroUsuarios>({ activo: true });

  public unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });

  public areas = signal<Area[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public adicionales = signal<Usuario[]>([]);

  public dataSource = new PaginadorDataSource<Usuario>();
  protected filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Usuario[],
  });

  public filasCompletas = computed(() => {
    const base = this.usuarios();
    const extra = this.adicionales().filter(
      (a) =>
        this.coincideFiltro(a) &&
        !base.some((b) => b.usuarioId === a.usuarioId),
    );
    return [...extra, ...base];
  });

  constructor() {
    effect(() => this.dataSource.setData(this.filasCompletas()));

    this.#filtros$
      .pipe(
        debounceTime(300),
        tap(() => this.loading.set(true)),
        switchMap((f) =>
          this.#usuariosService
            .listar({
              activo: f.activo,
              busqueda: f.busqueda,
              areaId: f.areaId,
              unidadId: f.unidadId,
            })
            .pipe(
              catchError(() => {
                this.#toastr.error('No se pudieron cargar los usuarios');
                return of([] as Usuario[]);
              }),
            ),
        ),
        tap(() => this.loading.set(false)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((lista) => this.usuarios.set(lista));

    const agregados = this.#ui.tomarAgregados();
    if (agregados.length) {
      this.adicionales.set(agregados);
    }
  }

  agregarUsuarios(): void {
    this.#router.navigate(['/mantenimiento/usuarios/agregar']);
  }

  cambiarEstado(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.#actualizarFiltro({ activo: value === '' ? undefined : value === 'true' });
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

  #actualizarFiltro(patch: Partial<FiltroUsuarios>): void {
    this.#filtros$.next({ ...this.#filtros$.getValue(), ...patch });
  }

  private coincideFiltro(u: Usuario): boolean {
    const f = this.#filtros$.getValue();
    if (f.activo !== undefined && u.activo !== f.activo) {
      return false;
    }
    if (f.unidadId !== undefined && u.unidadId !== f.unidadId) {
      return false;
    }
    if (f.areaId !== undefined && u.areaId !== f.areaId) {
      return false;
    }
    if (f.busqueda) {
      const q = f.busqueda.toLowerCase();
      const hits = [u.usuario, u.nombres, u.apellidos, u.dni ?? ''].some((v) =>
        v.toLowerCase().includes(q),
      );
      if (!hits) {
        return false;
      }
    }
    return true;
  }
}
