import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, forkJoin } from 'rxjs';
import { Dialog } from '@angular/cdk/dialog';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { BiometricosService } from '../../../../api/biometricos.service';
import { MarcaBiometricoService } from '../../../../api/marca-biometrico.service';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import MarcasDialog, {
  MarcasDialogResult,
} from './components/marcas.dialog.ng';
import BiometricoFormDialog, {
  BiometricoFormDialogResult,
} from './components/biometrico-form.dialog.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import { OperationResult } from '../../../../core/interfaces/unidad.interface';
import {
  Biometrico,
  MarcaBiometrico,
} from '../../../../core/interfaces/biometrico.interface';

@Component({
  selector: 'biometricos-page',
  imports: [FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Biométricos</h1>

        <div class="flex flex-wrap gap-2">
          <button class="btn" (click)="abrirMarcas()">
            <fa-icon [icon]="iconService.faTag"></fa-icon>
            Marcas
          </button>
          <button class="btn btn-primary" (click)="abrirNuevo()">
            <fa-icon [icon]="iconService.faCirclePlus"></fa-icon>
            Nuevo biométrico
          </button>
        </div>
      </div>

      <!-- ========== BÚSQUEDA LOCAL ========== -->
      <div class="flex flex-wrap items-end gap-3">
        <fieldset class="fieldset w-full max-w-sm">
          <legend class="fieldset-legend">Buscar</legend>
          <label class="input flex w-full items-center gap-2">
            <fa-icon [icon]="iconService.faSearch"></fa-icon>
            <input
              type="search"
              placeholder="Buscar por nombre, marca, IP, serie o ubicación..."
              class="grow"
              (input)="buscar($event)"
            />
          </label>
        </fieldset>
      </div>

      <!-- ========== LISTADO ========== -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h2 class="card-title">
            Dispositivos ({{ dataSource.length }})
          </h2>

          @if (loading()) {
            <div class="flex justify-center py-6">
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!biometricosFiltrados().length) {
            <p class="text-sm text-base-content/60 py-4">
              {{ biometricos().length ? 'No hay resultados para la búsqueda.' : 'No hay biométricos registrados.' }}
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Marca</th>
                    <th>IP</th>
                    <th>Serie</th>
                    <th>Ubicación</th>
                    <th>Modos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of filas(); track b.biometricoId) {
                    <tr>
                      <td>{{ b.nombre }}</td>
                      <td>{{ b.marcaNombre }}</td>
                      <td>{{ b.ip }}</td>
                      <td>{{ b.serie }}</td>
                      <td>{{ b.ubicacion }}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          @if (b.tarjeta) {
                            <span class="badge badge-sm badge-info">Tarjeta</span>
                          }
                          @if (b.huella) {
                            <span class="badge badge-sm badge-info">Huella</span>
                          }
                          @if (b.rostro) {
                            <span class="badge badge-sm badge-info">Rostro</span>
                          }
                        </div>
                      </td>
                      <td class="text-end">
                        <div class="flex justify-end gap-1">
                          <button
                            class="btn btn-xs btn-outline"
                            (click)="abrirEditar(b)"
                            aria-label="Editar biométrico"
                          >
                            <fa-icon [icon]="iconService.faPencil"></fa-icon>
                          </button>
                          <button
                            class="btn btn-xs btn-outline btn-error"
                            (click)="pedirEliminar(b)"
                            aria-label="Eliminar biométrico"
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
export default class BiometricosPage {
  public iconService = inject(FontIconService);
  #biometricosService = inject(BiometricosService);
  #marcasService = inject(MarcaBiometricoService);
  #toastr = inject(ToastrService);
  #destroyRef = inject(DestroyRef);
  #dialog = inject(Dialog);

  public loading = signal(true);
  public biometricos = signal<Biometrico[]>([]);
  public marcas = signal<MarcaBiometrico[]>([]);
  public busqueda = signal('');
  #busqueda$ = new BehaviorSubject<string>('');

  public biometricosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) {
      return this.biometricos();
    }
    return this.biometricos().filter((b) =>
      [b.nombre, b.marcaNombre, b.ip, b.serie, b.ubicacion].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  });

  public dataSource = new PaginadorDataSource<Biometrico>();
  protected filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Biometrico[],
  });

  constructor() {
    effect(() => this.dataSource.setData(this.biometricosFiltrados()));

    this.#busqueda$
      .pipe(debounceTime(300), takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => this.busqueda.set(value));

    forkJoin({
      biometricos: this.#biometricosService.listarBiometricos(),
      marcas: this.#marcasService.listarMarcas(),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ biometricos, marcas }) => {
          this.biometricos.set(biometricos);
          this.marcas.set(marcas);
        },
        error: () =>
          this.#toastr.error('No se pudieron cargar los biométricos'),
      })
      .add(() => this.loading.set(false));
  }

  buscar(event: Event): void {
    this.#busqueda$.next((event.target as HTMLInputElement).value);
  }

  abrirMarcas(): void {
    const ref = this.#dialog.open<MarcasDialogResult>(MarcasDialog, {
      data: { marcas: this.marcas() },
      disableClose: true,
      width: '640px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (result?.marcas) {
          this.marcas.set(result.marcas);
        }
      });
  }

  abrirNuevo(): void {
    this.abrirFormulario();
  }

  abrirEditar(biometrico: Biometrico): void {
    this.abrirFormulario(biometrico);
  }

  private abrirFormulario(biometrico?: Biometrico): void {
    const ref = this.#dialog.open<BiometricoFormDialogResult>(BiometricoFormDialog, {
      data: { marcas: this.marcas(), biometrico },
      disableClose: true,
      width: '640px',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.formulario) return;
        const request = biometrico
          ? this.#biometricosService.actualizarBiometrico(
              biometrico.biometricoId,
              result.formulario,
            )
          : this.#biometricosService.crearBiometrico(result.formulario);
        request
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (res: OperationResult) => {
              if (res.State === 1) {
                this.#toastr.success(res.Message);
                this.cargarBiometricos();
              } else {
                this.#toastr.error(res.Message);
              }
            },
            error: () => this.#toastr.error('No se pudo guardar el biométrico'),
          });
      });
  }

  pedirEliminar(biometrico: Biometrico): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar biométrico',
      mensaje: `¿Seguro que deseas eliminar el biométrico "${biometrico.nombre}"?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) return;
        this.#biometricosService
          .eliminarBiometrico(biometrico.biometricoId)
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (res: OperationResult) => {
              if (res.State === 1) {
                this.#toastr.success(res.Message);
                this.cargarBiometricos();
              } else {
                this.#toastr.error(res.Message);
              }
            },
            error: () => this.#toastr.error('No se pudo eliminar el biométrico'),
          });
      });
  }

  private cargarBiometricos(): void {
    this.#biometricosService
      .listarBiometricos()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (biometricos) => this.biometricos.set(biometricos),
        error: () => this.#toastr.error('No se pudieron cargar los biométricos'),
      });
  }
}
