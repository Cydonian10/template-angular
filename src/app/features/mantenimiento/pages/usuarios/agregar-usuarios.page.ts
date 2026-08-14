import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { UsuariosUiService } from '../../../../core/services/usuarios-ui.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import {
  OperationResult,
  SyncUsuario,
} from '../../../../core/interfaces/usuario.interface';

interface SeleccionSync {
  syncUsuarioId: number;
}

@Component({
  selector: 'agregar-usuarios-page',
  imports: [FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Agregar usuarios</h1>

        <button class="btn btn-ghost" (click)="volver()">
          <fa-icon [icon]="iconService.faArrowLeft"></fa-icon>
          Volver
        </button>
      </div>

      <!-- ========== SELECCIÓN DE UNIDAD Y ÁREA ========== -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-end gap-3">
            <fieldset class="fieldset w-full max-w-xs">
              <legend class="fieldset-legend">Unidad</legend>
              <select class="select w-full" (change)="cambiarUnidad($event)">
                <option value="" disabled [selected]="!unidadId()">
                  Selecciona una unidad
                </option>
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
                [disabled]="!unidadId()"
              >
                <option value="" disabled [selected]="!areaId()">
                  Selecciona un área
                </option>
                @for (a of areas(); track a.areaId) {
                  <option [value]="a.areaId">{{ a.nombre }}</option>
                }
              </select>
            </fieldset>

            <fieldset class="fieldset w-full max-w-sm">
              <legend class="fieldset-legend">Buscar usuario</legend>
              <label class="input flex w-full items-center gap-2">
                <fa-icon [icon]="iconService.faSearch"></fa-icon>
                <input
                  type="search"
                  placeholder="Usuario, nombres, apellidos o dni..."
                  class="grow"
                  [value]="busquedaSync()"
                  (input)="buscarSync($event)"
                />
              </label>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- ========== USUARIOS DE SYNC ========== -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="card-title">Usuarios sincronizados</h2>

            <button
              class="btn btn-primary"
              [disabled]="!areaId() || !seleccionados().length || loading()"
              (click)="agregar()"
            >
              <fa-icon [icon]="iconService.faUserPlus"></fa-icon>
              Agregar ({{ seleccionados().length }})
            </button>
          </div>

          @if (loadingSync()) {
            <div class="flex justify-center py-6">
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!syncFiltrados().length) {
            <p class="text-sm text-base-content/60 py-4">
              No hay usuarios sincronizados.
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th></th>
                    <th>Usuario</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>DNI</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of syncFiltrados(); track s.syncUsuarioId) {
                    <tr [class.opacity-60]="tieneAreaEnUnidad(s.syncUsuarioId)">
                      <td>
                        <input
                          type="checkbox"
                          class="checkbox checkbox-sm"
                          [disabled]="tieneAreaEnUnidad(s.syncUsuarioId)"
                          [checked]="estaSeleccionado(s.syncUsuarioId)"
                          (change)="toggle(s)"
                        />
                      </td>
                      <td>{{ s.usuario }}</td>
                      <td>{{ s.nombres }}</td>
                      <td>{{ s.apellidos }}</td>
                      <td>{{ s.dni }}</td>
                      <td>
                        @if (tieneAreaEnUnidad(s.syncUsuarioId)) {
                          <span class="badge badge-warning badge-sm">
                            Ya tiene área en esta unidad
                          </span>
                        } @else if (s.migrado) {
                          <span class="badge badge-ghost badge-sm">
                            Migrado en otra unidad
                          </span>
                        } @else {
                          <span class="badge badge-success badge-sm">
                            Disponible
                          </span>
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
    </div>
  `,
})
export default class AgregarUsuariosPage {
  public iconService = inject(FontIconService);
  #unidadesService = inject(UnidadesService);
  #areasService = inject(AreasService);
  #usuariosService = inject(UsuariosService);
  #ui = inject(UsuariosUiService);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);

  public unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });
  public areas = signal<Area[]>([]);
  public unidadId = signal<number | undefined>(undefined);
  public areaId = signal<number | undefined>(undefined);

  public syncUsuarios = signal<SyncUsuario[]>([]);
  public busquedaSync = signal('');
  public seleccionados = signal<SeleccionSync[]>([]);
  public ocupadosEnUnidad = signal<Set<number>>(new Set());
  public loadingSync = signal(false);
  public loading = signal(false);

  public syncFiltrados = computed(() => {
    const q = this.busquedaSync().toLowerCase();
    if (!q) {
      return this.syncUsuarios();
    }
    return this.syncUsuarios().filter((s) =>
      [s.usuario, s.nombres, s.apellidos, s.dni ?? ''].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  });

  constructor() {
    this.loadingSync.set(true);
    this.#usuariosService
      .listarSync()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.loadingSync.set(false)),
      )
      .subscribe({
        next: (lista) => this.syncUsuarios.set(lista),
        error: () =>
          this.#toastr.error(
            'No se pudieron cargar los usuarios sincronizados',
          ),
      });
  }

  cambiarUnidad(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.unidadId.set(value);
    this.areaId.set(undefined);
    this.areas.set([]);
    this.ocupadosEnUnidad.set(new Set());

    this.#areasService
      .listar(value)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (areas) => this.areas.set(areas),
        error: () => this.#toastr.error('No se pudieron cargar las áreas'),
      });

    // Quienes ya tienen un area en esta unidad quedan deshabilitados (regla: un area por unidad)
    this.#usuariosService
      .listar({ unidadId: value })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (usuarios) =>
          this.ocupadosEnUnidad.set(
            new Set(usuarios.map((u) => u.syncUsuarioId)),
          ),
        error: () =>
          this.#toastr.error(
            'No se pudieron verificar los usuarios de la unidad',
          ),
      });
  }

  cambiarArea(event: Event): void {
    this.areaId.set(Number((event.target as HTMLSelectElement).value));
  }

  buscarSync(event: Event): void {
    this.busquedaSync.set((event.target as HTMLInputElement).value);
  }

  toggle(s: SyncUsuario): void {
    this.seleccionados.update((sel) => {
      const existe = sel.some((x) => x.syncUsuarioId === s.syncUsuarioId);
      if (existe) {
        return sel.filter((x) => x.syncUsuarioId !== s.syncUsuarioId);
      }
      return [...sel, { syncUsuarioId: s.syncUsuarioId }];
    });
  }

  tieneAreaEnUnidad(syncUsuarioId: number): boolean {
    return this.ocupadosEnUnidad().has(syncUsuarioId);
  }

  estaSeleccionado(syncUsuarioId: number): boolean {
    return this.seleccionados().some(
      (x) => x.syncUsuarioId === syncUsuarioId,
    );
  }

  agregar(): void {
    const areaId = this.areaId();
    const syncUsuarios = this.seleccionados();
    if (!areaId || !syncUsuarios.length) {
      return;
    }
    this.loading.set(true);
    this.#usuariosService
      .asignarUsuarios(areaId, { syncUsuarios })
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        switchMap((res) => {
          if (res.State !== 1) {
            return EMPTY;
          }
          return this.#usuariosService.listar({ areaId }).pipe(
            tap((usuarios) => {
              this.#ui.agregar(usuarios);
              this.#router.navigate(['/mantenimiento/usuarios']);
            }),
          );
        }),
        catchError(() => {
          this.#toastr.error('Error al agregar los usuarios');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  volver(): void {
    this.#router.navigate(['/mantenimiento/usuarios']);
  }

  private procesarResultado(res: OperationResult): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }
}
