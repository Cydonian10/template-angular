import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { FontIconService } from '../../../../core/services/icon.service';
import { MotivosService } from '../../../../api/motivos.service';
import { Motivo } from '../../../../core/interfaces/motivo.interface';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import MotivoFormDialog, {
  MotivoFormDialogResult,
} from './components/motivo-form.dialog.ng';

@Component({
  selector: 'motivo-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">
            Mantenimiento
          </p>
          <h1 class="text-2xl font-bold">Motivos</h1>
          <p class="text-sm text-base-content/60">
            Administra los motivos disponibles para los módulos del sistema.
          </p>
        </div>
        <button
          class="btn btn-primary"
          (click)="abrirNuevo()"
          [disabled]="operando()"
        >
          <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
          Nuevo motivo
        </button>
      </div>

      <fieldset class="fieldset w-full max-w-sm">
        <legend class="fieldset-legend">Buscar motivo</legend>
        <label class="input flex w-full items-center gap-2">
          <fa-icon [icon]="iconService.faSearch"></fa-icon>
          <input
            type="search"
            class="grow"
            placeholder="Buscar por nombre o descripción..."
            (input)="buscar($event)"
          />
        </label>
      </fieldset>

      <div class="card border border-base-300 bg-base-100">
        <div class="card-body">
          <h2 class="card-title">Listado ({{ dataSource.length }})</h2>

          @if (loading()) {
            <div class="flex justify-center py-6">
              <fa-icon
                [icon]="iconService.faSpinner"
                animation="spin"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!motivosFiltrados().length) {
            <p class="py-4 text-sm text-base-content/60">
              {{
                motivos().length
                  ? 'No hay resultados para la búsqueda.'
                  : 'No hay motivos registrados.'
              }}
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Documento requerido</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (motivo of filas(); track motivo.motivoId) {
                    <tr>
                      <td class="font-semibold">{{ motivo.nombre }}</td>
                      <td>{{ motivo.descripcion || 'Sin descripción' }}</td>
                      <td>
                        @if (motivo.documentoRequerido) {
                          <span class="badge badge-info">Sí</span>
                        } @else {
                          <span class="badge badge-ghost">No</span>
                        }
                      </td>
                      <td class="text-end">
                        <div class="flex justify-end gap-1">
                          <button
                            class="btn btn-xs btn-outline"
                            (click)="abrirEditar(motivo)"
                            [disabled]="operando()"
                          >
                            <fa-icon [icon]="iconService.faPencil"></fa-icon>
                            Editar
                          </button>
                          <button
                            class="btn btn-xs btn-outline btn-error"
                            (click)="pedirEliminar(motivo)"
                            [disabled]="operando()"
                          >
                            <fa-icon [icon]="iconService.faTrash"></fa-icon>
                            Eliminar
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
export default class MotivoPage {
  public iconService = inject(FontIconService);
  #motivosService = inject(MotivosService);
  #toastr = inject(ToastrService);
  #dialog = inject(Dialog);
  #destroyRef = inject(DestroyRef);

  public loading = signal(true);
  public operando = signal(false);
  public motivos = signal<Motivo[]>([]);
  public busqueda = signal('');
  #busqueda$ = new BehaviorSubject<string>('');
  public dataSource = new PaginadorDataSource<Motivo>();
  protected filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Motivo[],
  });

  public motivosFiltrados = signal<Motivo[]>([]);

  constructor() {
    effect(() => this.dataSource.setData(this.motivosFiltrados()));
    this.#busqueda$
      .pipe(debounceTime(250), takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => {
        this.busqueda.set(value.trim().toLowerCase());
        this.actualizarFiltro();
      });
    this.cargar();
  }

  buscar(event: Event): void {
    this.#busqueda$.next((event.target as HTMLInputElement).value);
  }

  abrirNuevo(): void {
    this.abrirFormulario();
  }

  abrirEditar(motivo: Motivo): void {
    this.operando.set(true);
    this.#motivosService
      .obtener(motivo.motivoId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (detalle) => this.abrirFormulario(detalle),
        error: () => this.#toastr.error('No se pudo cargar el motivo'),
      })
      .add(() => this.operando.set(false));
  }

  pedirEliminar(motivo: Motivo): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar motivo',
      mensaje: `¿Seguro que deseas eliminar el motivo "${motivo.nombre}"?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result?.confirmado) this.eliminar(motivo);
      });
  }

  private abrirFormulario(motivo?: Motivo): void {
    const ref = this.#dialog.open<MotivoFormDialogResult>(MotivoFormDialog, {
      data: { motivo },
      disableClose: true,
      width: '520px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result?.actualizado) this.cargar();
      });
  }

  private eliminar(motivo: Motivo): void {
    this.operando.set(true);
    this.#motivosService
      .eliminar(motivo.motivoId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (result) => {
          if (result.State === 1) {
            this.#toastr.success(result.Message);
            this.cargar();
          } else {
            this.#toastr.error(result.Message);
          }
        },
        error: () => this.#toastr.error('No se pudo eliminar el motivo'),
      })
      .add(() => this.operando.set(false));
  }

  private cargar(): void {
    this.loading.set(true);
    this.#motivosService
      .listar()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (motivos) => {
          this.motivos.set(motivos);
          this.actualizarFiltro();
        },
        error: () => this.#toastr.error('No se pudieron cargar los motivos'),
      })
      .add(() => this.loading.set(false));
  }

  private actualizarFiltro(): void {
    const q = this.busqueda();
    this.motivosFiltrados.set(
      q
        ? this.motivos().filter((motivo) =>
            `${motivo.nombre} ${motivo.descripcion ?? ''}`
              .toLowerCase()
              .includes(q),
          )
        : this.motivos(),
    );
    this.dataSource.paginar({
      pageIndex: 0,
      pageSize: this.dataSource.pageSize,
    });
  }
}
