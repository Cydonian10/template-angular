import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, forkJoin } from 'rxjs';
import { Dialog } from '@angular/cdk/dialog';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { ControlesService } from '../../../../api/controles.service';
import { AreasService } from '../../../../api/areas.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import ControlFormDialog, {
  ControlFormDialogResult,
} from './components/control-form.dialog.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import { OperationResult } from '../../../../core/interfaces/unidad.interface';
import { Control } from '../../../../core/interfaces/control.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';

@Component({
  selector: 'controles-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">
            Módulo de control
          </p>
          <h1 class="text-2xl font-bold">Controles de asistencia</h1>
          <p class="text-sm text-base-content/60">
            Configura tolerancia, tardanza y falta.
          </p>
        </div>
        <button class="btn btn-primary" (click)="abrirNuevo()">
          <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
          Nuevo control
        </button>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <fieldset class="fieldset w-full max-w-sm">
          <legend class="fieldset-legend">Buscar</legend>
          <label class="input flex w-full items-center gap-2">
            <fa-icon [icon]="iconService.faSearch"></fa-icon>
            <input
              type="search"
              placeholder="Buscar control o asignación..."
              class="grow"
              (input)="buscar($event)"
            />
          </label>
        </fieldset>
      </div>

      <div class="card border border-base-300 bg-base-100">
        <div class="card-body">
          <h2 class="card-title">Listado ({{ dataSource.length }})</h2>

          @if (loading()) {
            <div class="flex justify-center py-6">
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!controlesFiltrados().length) {
            <p class="py-4 text-sm text-base-content/60">
              {{ controles().length ? 'No hay resultados para la búsqueda.' : 'No hay controles registrados.' }}
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Control</th>
                    <th>Tolerancia</th>
                    <th>Tardanza</th>
                    <th>Falta</th>
                    <th>Asignaciones</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (control of filas(); track control.controlId) {
                    <tr>
                      <td class="font-semibold">Control #{{ control.controlId }}</td>
                      <td>{{ control.tolerancia }} min</td>
                      <td>{{ control.limiteTardanza }} min</td>
                      <td>{{ control.limiteFalta }}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          <span class="badge badge-sm badge-info">
                            Áreas {{ control.areas.length }}
                          </span>
                          <span class="badge badge-sm badge-info">
                            Unidades {{ control.unidades.length }}
                          </span>
                          <span class="badge badge-sm badge-info">
                            Usuarios {{ control.usuarios.length }}
                          </span>
                        </div>
                      </td>
                      <td class="text-end">
                        <div class="flex justify-end gap-1">
                          <button
                            class="btn btn-xs btn-outline"
                            (click)="abrirEditar(control)"
                            aria-label="Editar control"
                          >
                            <fa-icon [icon]="iconService.faPencil"></fa-icon>
                          </button>
                          <button
                            class="btn btn-xs btn-outline btn-error"
                            (click)="pedirEliminar(control)"
                            aria-label="Eliminar control"
                          >
                            <fa-icon [icon]="iconService.faTrash"></fa-icon>
                          </button>
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
export default class ControlesPage {
  public iconService = inject(FontIconService);
  #controlesService = inject(ControlesService);
  #areasService = inject(AreasService);
  #unidadesService = inject(UnidadesService);
  #usuariosService = inject(UsuariosService);
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);
  #dialog = inject(Dialog);

  public loading = signal(true);
  public controles = signal<Control[]>([]);
  public areas = signal<Area[]>([]);
  public unidades = signal<Unidad[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public busqueda = signal('');
  #busqueda$ = new BehaviorSubject<string>('');

  public controlesFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.controles();
    return this.controles().filter((control) =>
      [
        `control #${control.controlId}`,
        ...control.areas.map((asignacion) => `area #${asignacion.areaId}`),
        ...control.unidades.map((asignacion) => `unidad #${asignacion.unidadId}`),
        ...control.usuarios.map((asignacion) => `usuario #${asignacion.usuarioId}`),
      ].some((value) => value.includes(q)),
    );
  });

  public dataSource = new PaginadorDataSource<Control>();
  protected filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Control[],
  });

  constructor() {
    effect(() => this.dataSource.setData(this.controlesFiltrados()));

    this.#busqueda$
      .pipe(debounceTime(300), takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => this.busqueda.set(value));

    forkJoin({
      controles: this.#controlesService.listarControles(),
      areas: this.#areasService.listar(),
      unidades: this.#unidadesService.listar(),
      usuarios: this.#usuariosService.listar({ activo: true }),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ controles, areas, unidades, usuarios }) => {
          this.controles.set(controles);
          this.areas.set(areas);
          this.unidades.set(unidades);
          this.usuarios.set(usuarios);
        },
        error: () => this.#toastr.error('No se pudieron cargar los controles'),
      })
      .add(() => this.loading.set(false));
  }

  buscar(event: Event): void {
    this.#busqueda$.next((event.target as HTMLInputElement).value);
  }

  abrirNuevo(): void {
    this.abrirFormulario();
  }

  abrirEditar(control: Control): void {
    this.abrirFormulario(control);
  }

  private abrirFormulario(control?: Control): void {
    const ref = this.#dialog.open<ControlFormDialogResult>(ControlFormDialog, {
      data: { control },
      disableClose: true,
      width: '520px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.formulario) return;
        const request = control
          ? this.#controlesService.actualizarControl(
              control.controlId,
              result.formulario,
            )
          : this.#controlesService.crearControl(result.formulario);
        request
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (res: OperationResult) => {
              if (res.State === 1) {
                this.#toastr.success(res.Message);
                this.cargarControles();
              } else {
                this.#toastr.error(res.Message);
              }
            },
            error: () => this.#toastr.error('No se pudo guardar el control'),
          });
      });
  }

  pedirEliminar(control: Control): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar control',
      mensaje: `¿Seguro que deseas eliminar el control #${control.controlId}?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) return;
        this.#controlesService
          .eliminarControl(control.controlId)
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (res: OperationResult) => {
              if (res.State === 1) {
                this.#toastr.success(res.Message);
                this.cargarControles();
              } else {
                this.#toastr.error(res.Message);
              }
            },
            error: () => this.#toastr.error('No se pudo eliminar el control'),
          });
      });
  }

  private cargarControles(): void {
    this.#controlesService
      .listarControles()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (controles) => this.controles.set(controles),
        error: () => this.#toastr.error('No se pudieron cargar los controles'),
      });
  }
}
