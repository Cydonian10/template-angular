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
import { Dialog } from '@angular/cdk/dialog';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  debounceTime,
  finalize,
  firstValueFrom,
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
import CambiarAreaDialog, {
  CambiarAreaDialogData,
  CambiarAreaDialogResult,
} from './components/cambiar-area.dialog.ng';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import {
  ActualizarUsuarioDto,
  OperationResult,
  Usuario,
} from '../../../../core/interfaces/usuario.interface';

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

      <!-- ========== CONFIRMACIÓN DE DESACTIVACIÓN ========== -->
      @if (confirmarDesactivar(); as u) {
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="text-lg font-bold">Desactivar usuario</h3>
            <p class="py-4">
              ¿Seguro que deseas desactivar a
              <strong>{{ u.nombres }} {{ u.apellidos }}</strong>?
            </p>
            <div class="modal-action">
              <button class="btn btn-ghost" (click)="cancelarDesactivacion()">
                Cancelar
              </button>
              <button class="btn btn-error" (click)="confirmarDesactivacion()">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      }

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
                    <th>Supervisor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of filas(); track u.usuarioAreaId) {
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
                      <td>
                        <span
                          class="badge badge-sm"
                          [class.badge-primary]="u.esSupervisor"
                          [class.badge-ghost]="!u.esSupervisor"
                        >
                          {{ u.esSupervisor ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="flex justify-end gap-1">
                          <button
                            class="btn btn-xs btn-outline"
                            [class.btn-primary]="u.esSupervisor"
                            [disabled]="actualizandoId() === u.usuarioAreaId"
                            (click)="cambiarSupervisor(u)"
                            aria-label="Cambiar supervisor"
                          >
                            <fa-icon [icon]="iconService.faShield"></fa-icon>
                          </button>
                          <button
                            class="btn btn-xs btn-outline"
                            [disabled]="actualizandoId() === u.usuarioAreaId"
                            (click)="cambiarArea(u)"
                            aria-label="Cambiar área"
                          >
                            <fa-icon [icon]="iconService.faPencil"></fa-icon>
                          </button>
                          @if (u.activo) {
                            <button
                              class="btn btn-xs btn-outline btn-error"
                              [disabled]="actualizandoId() === u.usuarioAreaId"
                              (click)="pedirDesactivar(u)"
                              aria-label="Desactivar usuario"
                            >
                              <fa-icon [icon]="iconService.faBan"></fa-icon>
                            </button>
                          } @else {
                            <button
                              class="btn btn-xs btn-outline"
                              [disabled]="actualizandoId() === u.usuarioAreaId"
                              (click)="activar(u)"
                              aria-label="Activar usuario"
                            >
                              <fa-icon [icon]="iconService.faUserCheck"></fa-icon>
                            </button>
                          }
                        </div>
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
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);

  public loading = signal(false);
  public unidadIdFiltro = signal<number | undefined>(undefined);
  public confirmarDesactivar = signal<Usuario | null>(null);
  public actualizandoId = signal<number | null>(null);

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
        !base.some((b) => b.usuarioAreaId === a.usuarioAreaId),
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

  cambiarSupervisor(u: Usuario): void {
    this.#patchear(u, {
      usuarioAreaId: u.usuarioAreaId,
      esSupervisor: !u.esSupervisor,
    });
  }

  pedirDesactivar(u: Usuario): void {
    this.confirmarDesactivar.set(u);
  }

  cancelarDesactivacion(): void {
    this.confirmarDesactivar.set(null);
  }

  confirmarDesactivacion(): void {
    const u = this.confirmarDesactivar();
    if (!u) {
      return;
    }
    this.confirmarDesactivar.set(null);
    this.#patchear(u, { activo: false });
  }

  activar(u: Usuario): void {
    this.#patchear(u, { activo: true });
  }

  async cambiarArea(u: Usuario): Promise<void> {
    let areas: Area[] = [];
    try {
      areas = await firstValueFrom(this.#areasService.listar(u.unidadId));
    } catch {
      this.#toastr.error('No se pudieron cargar las áreas');
      return;
    }

    const ref = this.#dialog.open<CambiarAreaDialogResult>(CambiarAreaDialog, {
      data: { usuario: u, areas } as CambiarAreaDialogData,
      disableClose: true,
      width: '480px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.#patchear(u, {
          usuarioAreaId: u.usuarioAreaId,
          areaId: result.areaId,
        });
      });
  }

  cambiarEstado(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.#actualizarFiltro({
      activo: value === '' ? undefined : value === 'true',
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

  #patchear(u: Usuario, dto: ActualizarUsuarioDto): void {
    this.actualizandoId.set(u.usuarioAreaId);
    this.#usuariosService
      .actualizar(u.usuarioId, dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap((res) => {
          if (res.State === 1) {
            this.aplicarActualizado(u.usuarioId);
          }
        }),
        catchError(() => {
          this.#toastr.error('Error al actualizar el usuario');
          return EMPTY;
        }),
        finalize(() => this.actualizandoId.set(null)),
      )
      .subscribe();
  }

  private aplicarActualizado(usuarioId: number): void {
    this.#usuariosService
      .obtenerPorId(usuarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (filas) => {
          if (!filas.length) {
            this.recargar();
            return;
          }
          const visibles = filas.filter((f) => this.coincideFiltro(f));
          if (!visibles.length) {
            this.recargar();
            return;
          }
          this.usuarios.update((lista) => [
            ...lista.filter((u) => u.usuarioId !== usuarioId),
            ...visibles,
          ]);
          this.adicionales.update((lista) =>
            lista.filter((u) => u.usuarioId !== usuarioId),
          );
        },
        error: () => this.recargar(),
      });
  }

  private recargar(): void {
    this.#filtros$.next({ ...this.#filtros$.getValue() });
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

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }
}
