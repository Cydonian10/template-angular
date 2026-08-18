import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { BiometricosService } from '../../../../api/biometricos.service';
import { MarcaBiometricoService } from '../../../../api/marca-biometrico.service';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
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
          } @else if (!biometricos().length) {
            <p class="text-sm text-base-content/60 py-4">
              No hay biométricos registrados.
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
}